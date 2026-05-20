/**
 * auth-local.ts
 * Email + password authentication — replaces Manus OAuth for Railway deployment.
 * Uses bcrypt for password hashing and JWT (jose) for session tokens.
 */
import { compare, hash } from "bcryptjs";
import type { Express, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import * as db from "../db";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

const BCRYPT_ROUNDS = 12;

// ── JWT helpers ───────────────────────────────────────────────────────────────

function getSessionSecret(): Uint8Array {
  const secret = ENV.cookieSecret;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string, name: string): Promise<string> {
  const secretKey = getSessionSecret();
  const expirationSeconds = Math.floor((Date.now() + ONE_YEAR_MS) / 1000);
  return new SignJWT({ openId: userId, appId: "equiphk-local", name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

export async function verifySessionToken(
  cookieValue: string | undefined | null
): Promise<{ openId: string; name: string } | null> {
  if (!cookieValue) return null;
  try {
    const secretKey = getSessionSecret();
    const { payload } = await jwtVerify(cookieValue, secretKey, {
      algorithms: ["HS256"],
    });
    const { openId, name } = payload as Record<string, unknown>;
    if (typeof openId !== "string" || typeof name !== "string") return null;
    return { openId, name };
  } catch {
    return null;
  }
}

// ── Password helpers ──────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return compare(password, hashed);
}

// ── Request authenticator (replaces sdk.authenticateRequest) ─────────────────

function parseCookies(cookieHeader: string | undefined): Map<string, string> {
  if (!cookieHeader) return new Map();
  const result = new Map<string, string>();
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k) result.set(k.trim(), decodeURIComponent(v.join("=").trim()));
  }
  return result;
}

export async function authenticateRequest(req: Request) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionCookie = cookies.get(COOKIE_NAME);
  const session = await verifySessionToken(sessionCookie);
  if (!session) return null;

  const user = await db.getUserByOpenId(session.openId);
  if (!user) return null;

  return user;
}

// ── Express routes ────────────────────────────────────────────────────────────

export function registerLocalAuthRoutes(app: Express) {
  /**
   * POST /api/auth/login
   * Body: { email: string; password: string }
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await db.getUserByEmail(email.toLowerCase().trim());
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

    const token = await createSessionToken(user.openId, user.name ?? "");
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  /**
   * POST /api/auth/logout
   */
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ success: true });
  });

  /**
   * POST /api/auth/change-password  (admin only — protected via middleware)
   * Body: { currentPassword: string; newPassword: string }
   */
  app.post("/api/auth/change-password", async (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await verifySessionToken(sessionCookie);
    if (!session) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const user = await db.getUserByOpenId(session.openId);
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const { currentPassword, newPassword } = req.body ?? {};
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Both currentPassword and newPassword are required" });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: "New password must be at least 8 characters" });
      return;
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    const newHash = await hashPassword(newPassword);
    await db.updateUserPassword(user.openId, newHash);
    res.json({ success: true });
  });
}
