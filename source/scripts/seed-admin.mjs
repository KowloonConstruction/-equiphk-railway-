#!/usr/bin/env node
/**
 * seed-admin.mjs
 * Creates the initial admin account for Railway deployment.
 *
 * Usage:
 *   ADMIN_EMAIL=casey@kowloonconstruction.com ADMIN_PASSWORD=YourPassword123 node scripts/seed-admin.mjs
 *
 * Or with dotenv:
 *   node -r dotenv/config scripts/seed-admin.mjs
 *
 * Environment variables:
 *   DATABASE_URL   — MySQL connection string (required)
 *   ADMIN_EMAIL    — Admin email address (default: casey@kowloonconstruction.com)
 *   ADMIN_PASSWORD — Admin password (required, min 8 chars)
 */

import { createConnection } from "mysql2/promise";
import { createHash } from "crypto";
import { randomBytes } from "crypto";

// Minimal bcrypt implementation using Node.js built-ins is not available,
// so we use the bcryptjs npm package via dynamic import
async function hashPassword(password) {
  const { hash } = await import("bcryptjs");
  return hash(password, 12);
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_EMAIL || "casey@kowloonconstruction.com";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("❌ ADMIN_PASSWORD is not set");
    console.error("   Usage: ADMIN_PASSWORD=YourPassword123 node scripts/seed-admin.mjs");
    process.exit(1);
  }

  if (adminPassword.length < 8) {
    console.error("❌ ADMIN_PASSWORD must be at least 8 characters");
    process.exit(1);
  }

  console.log(`\n🔧 Seeding admin account: ${adminEmail}`);

  const conn = await createConnection(dbUrl);

  // Check if user already exists
  const [existing] = await conn.execute(
    "SELECT id, email, role FROM users WHERE email = ? LIMIT 1",
    [adminEmail]
  );

  const passwordHash = await hashPassword(adminPassword);
  const openId = `admin-${randomBytes(8).toString("hex")}`;

  if (existing.length > 0) {
    // Update existing user to admin + set password
    await conn.execute(
      "UPDATE users SET passwordHash = ?, role = 'admin', loginMethod = 'local' WHERE email = ?",
      [passwordHash, adminEmail]
    );
    console.log(`✅ Updated existing user ${adminEmail} → role=admin, password set`);
  } else {
    // Create new admin user
    await conn.execute(
      `INSERT INTO users (openId, email, name, role, passwordHash, loginMethod, lastSignedIn)
       VALUES (?, ?, ?, 'admin', ?, 'local', NOW())`,
      [openId, adminEmail, "Casey (Admin)", passwordHash]
    );
    console.log(`✅ Created admin user: ${adminEmail}`);
  }

  await conn.end();
  console.log("\n🎉 Done! You can now log in at /login with:");
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log("\n⚠️  Store this password securely and delete it from your terminal history.\n");
}

main().catch(err => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
