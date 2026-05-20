/**
 * notification.ts
 * Owner notification helper — works on both Manus and Railway.
 *
 * Detection logic:
 *  - If BUILT_IN_FORGE_API_URL is set  → Manus push notification (original behaviour)
 *  - Otherwise                          → Resend email to OWNER_EMAIL (Railway fallback)
 *
 * Required env vars for Railway:
 *   RESEND_API_KEY, OWNER_EMAIL (email address to receive owner alerts)
 */

import { TRPCError } from "@trpc/server";
import { ENV } from "./env";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification title is required." });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification content is required." });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.` });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.` });
  }
  return { title, content };
};

// ─── Manus push notification ──────────────────────────────────────────────────

async function notifyViaManus(title: string, content: string): Promise<boolean> {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) return false;

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const endpoint = new URL("webdevtoken.v1.WebDevService/SendNotification", normalizedBase).toString();

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify({ title, content }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(`[Notification] Manus push failed (${response.status})${detail ? `: ${detail}` : ""}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Manus push error:", error);
    return false;
  }
}

// ─── Resend email fallback (Railway) ─────────────────────────────────────────

async function notifyViaEmail(title: string, content: string): Promise<boolean> {
  const apiKey = ENV.resendApiKey;
  const ownerEmail = process.env.OWNER_EMAIL ?? "casey@kowloonconstruction.com";
  const fromEmail = ENV.resendFromEmail;

  if (!apiKey) {
    console.warn("[Notification] RESEND_API_KEY not set — owner notification skipped");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [ownerEmail],
        subject: `[EquipHK Alert] ${title}`,
        html: `<h2>${title}</h2><p style="white-space:pre-wrap">${content}</p>`,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(`[Notification] Resend email failed (${response.status})${detail ? `: ${detail}` : ""}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Resend email error:", error);
    return false;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Dispatches an owner notification.
 * On Manus: uses the Manus push notification service.
 * On Railway: sends an email via Resend to OWNER_EMAIL.
 * Returns true on success, false on failure (non-fatal).
 */
export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  if (process.env.BUILT_IN_FORGE_API_URL) {
    return notifyViaManus(title, content);
  }
  return notifyViaEmail(title, content);
}
