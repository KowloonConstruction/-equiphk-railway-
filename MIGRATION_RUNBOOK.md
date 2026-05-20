# EquipHK — Migration Runbook

**Document version:** 1.0  
**Last updated:** 2026-05-20  
**Prepared by:** EquipHK Technical Team  
**Owner:** Casey, CEO — Kowloon Construction Company / EquipHK

---

## Purpose

This document is a complete, step-by-step guide for any developer to rebuild and redeploy the EquipHK website on a new hosting platform, independent of Manus. It should be read alongside the backup files stored in this repository.

If you are reading this because Manus is unavailable, do not panic. Everything needed to restore the site is in this repository and on Google Drive. A competent Node.js developer can have the site running again within 1–3 days by following this guide.

---

## Table of Contents

1. [What's in the Backup](#1-whats-in-the-backup)
2. [Technology Stack](#2-technology-stack)
3. [Credentials You Will Need](#3-credentials-you-will-need)
4. [Manus-Specific Dependencies to Replace](#4-manus-specific-dependencies-to-replace)
5. [Step-by-Step Rebuild Guide](#5-step-by-step-rebuild-guide)
6. [Recommended Hosting Platform](#6-recommended-hosting-platform)
7. [Post-Launch Checklist](#7-post-launch-checklist)
8. [Contact Information](#8-contact-information)

---

## 1. What's in the Backup

Each dated folder in the `backups/` directory of this repository contains two files:

| File | Contents |
|---|---|
| `equiphk_code_YYYY-MM-DD.zip` | Full source code — React frontend, Node.js backend, database schema, all configuration files |
| `equiphk_database_YYYY-MM-DD.sql` | Complete MySQL database export — all equipment items, orders, members, Chinese translations, categories |

The backup is taken daily at 03:00 HKT and retains the last 7 days. Google Drive holds weekly backups for 3 months.

**Use the most recent dated folder** when rebuilding.

---

## 2. Technology Stack

Understanding the stack helps the developer know what they are working with.

| Layer | Technology | Version |
|---|---|---|
| Frontend | React 19 + TypeScript | Node 22 |
| Styling | Tailwind CSS 4 + shadcn/ui | — |
| API layer | tRPC 11 (type-safe RPC) | — |
| Backend | Node.js + Express 4 | — |
| Database | MySQL / TiDB (MySQL-compatible) | — |
| ORM | Drizzle ORM | — |
| Payments | Stripe | — |
| Email | Resend | — |
| File storage | S3-compatible object storage | — |
| AI features | OpenAI-compatible LLM API | — |
| Package manager | pnpm | — |

---

## 3. Credentials You Will Need

Contact the site owner (Casey) for all of the following. These should be stored in a password manager and never shared by email.

### 3a. Credentials You Own (Essential)

| Credential | Environment Variable | Purpose | Where to Find |
|---|---|---|---|
| Google OAuth Client ID | `GOOGLE_OAUTH_CLIENT_ID` | Google Drive backup uploads | Google Cloud Console → APIs & Services → Credentials |
| Google OAuth Client Secret | `GOOGLE_OAUTH_CLIENT_SECRET` | Google Drive backup uploads | Same as above |
| Google OAuth Refresh Token | `GOOGLE_OAUTH_REFRESH_TOKEN` | Long-lived Drive access token | Generated during original OAuth setup — ask Casey |
| Resend API Key | `RESEND_API_KEY` | Sends booking confirmation and customer emails | resend.com → API Keys |
| Stripe Secret Key | `STRIPE_SECRET_KEY` | Server-side payment processing | Stripe Dashboard → Developers → API Keys |
| Stripe Webhook Secret | `STRIPE_WEBHOOK_SECRET` | Verifies incoming Stripe webhook events | Stripe Dashboard → Webhooks |
| Stripe Publishable Key | `VITE_STRIPE_PUBLISHABLE_KEY` | Frontend payment form | Stripe Dashboard → Developers → API Keys |

### 3b. New Credentials to Create on the New Platform

These replace the Manus-managed credentials and must be generated fresh on the new hosting platform:

| Credential | Environment Variable | How to Generate |
|---|---|---|
| Database connection string | `DATABASE_URL` | Provided by your MySQL host (Railway, PlanetScale, etc.) |
| JWT signing secret | `JWT_SECRET` | Generate a random 64-character string: `openssl rand -hex 32` |

---

## 4. Manus-Specific Dependencies to Replace

This is the most important section. The following four components are tied to the Manus platform and must be replaced before the site will work on a new host. Each replacement is a well-understood, standard task for any Node.js developer.

---

### 4a. Authentication (Login System)

**What it does:** Handles admin and staff login. Currently uses Manus OAuth — users are redirected to the Manus login portal and returned with a session token.

**Files to modify:**
- `server/_core/oauth.ts` — OAuth callback handler
- `server/_core/sdk.ts` — Manus SDK (token exchange, session creation, user lookup)
- `server/_core/context.ts` — Reads session cookie and returns current user
- `client/src/const.ts` — `getLoginUrl()` function that redirects to Manus login
- `client/src/_core/hooks/useAuth.ts` — Frontend auth state hook

**How to replace:**
Replace with standard email/password authentication using `bcrypt` for password hashing and `jose` (already installed) for JWT session tokens. The `users` table already has `email` and `role` fields. The developer should:

1. Add a `passwordHash` column to the `users` table in `drizzle/schema.ts`
2. Create a `POST /api/auth/login` Express route that accepts email + password, verifies against `bcrypt.compare()`, and issues a JWT cookie
3. Create a `POST /api/auth/logout` route that clears the cookie
4. Replace `sdk.authenticateRequest()` in `context.ts` with a local JWT verification using `jose`
5. Replace `getLoginUrl()` in `client/src/const.ts` with a redirect to `/login`
6. Build a simple `/login` page with email + password fields

**Estimated effort:** 4–6 hours for an experienced developer.

**Admin account setup:** After deploying, insert the first admin user directly into the database:
```sql
INSERT INTO users (openId, name, email, role, passwordHash, lastSignedIn)
VALUES ('admin-001', 'Casey', 'casey@kowloonconstruction.com', 'admin', '<bcrypt_hash>', NOW());
```

---

### 4b. LLM / AI Features

**What it does:** Powers AI-generated equipment descriptions, Traditional Chinese translations, and the AI chat support widget.

**Files to modify:**
- `server/_core/llm.ts` — The `invokeLLM()` helper function
- Used in: `server/translation.ts`, `server/regenerate-descriptions.ts`, `server/bulk-import.ts`, `server/routers.ts`

**How to replace:**
The `invokeLLM()` function already uses the standard OpenAI API format. Only two lines need changing:

1. Change the API URL from `https://forge.manus.im/v1/chat/completions` to `https://api.openai.com/v1/chat/completions`
2. Change the model from `gemini-2.5-flash` to `gpt-4o` or `gpt-4o-mini`
3. Set `OPENAI_API_KEY` environment variable (replaces `BUILT_IN_FORGE_API_KEY`)

**Estimated effort:** 30 minutes.

**Cost:** OpenAI API charges per token. For EquipHK's usage (occasional description generation, not real-time), expect less than $5 USD/month.

---

### 4c. File Storage (Product Images)

**What it does:** Stores uploaded product images and PDF quote documents. Currently uses Manus's internal S3 proxy.

**Files to modify:**
- `server/storage.ts` — `storagePut()` and `storageGet()` helper functions
- Used in: `server/productImageScraper.ts`, `server/routers.ts`

**How to replace:**
Replace with AWS S3 or Cloudflare R2 (recommended — R2 has no egress fees and a generous free tier).

1. Create a Cloudflare R2 bucket named `equiphk-assets`
2. Generate R2 API credentials (Access Key ID + Secret Access Key)
3. Rewrite `storagePut()` and `storageGet()` using the `@aws-sdk/client-s3` package (already installed) pointing to the R2 endpoint
4. Set environment variables: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`

**Estimated effort:** 2–3 hours.

**Cost:** Cloudflare R2 free tier covers 10GB storage and 1 million requests/month — effectively free for EquipHK's image volume.

**Important:** Existing product images are already hosted on CDN URLs stored in the database. Only new uploads after migration need to go to R2. Existing image URLs in the database will continue to work.

---

### 4d. Owner Notifications

**What it does:** Sends push notifications to Casey's Manus inbox when new contact forms, quote requests, or bookings are submitted.

**Files to modify:**
- `server/_core/notification.ts` — `notifyOwner()` function
- Used in: `server/routers.ts` (contact form submissions, new bookings, new leads)

**How to replace:**
Replace `notifyOwner()` with an email sent via Resend (already integrated and working). The function signature stays the same — just swap the implementation:

```typescript
export async function notifyOwner(payload: { title: string; content: string }): Promise<boolean> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'EquipHK System <noreply@equip.hk>',
    to: 'casey@kowloonconstruction.com',
    subject: payload.title,
    text: payload.content,
  });
  return true;
}
```

**Estimated effort:** 30 minutes.

---

## 5. Step-by-Step Rebuild Guide

Follow these steps in order. Do not skip steps.

### Step 1 — Set Up the New Hosting Environment

The recommended platform is **Railway** (railway.app). Create a new project and add:
- A **Node.js service** (connect to the GitHub backup repo)
- A **MySQL database** plugin

Alternatively, use **Render** (render.com) with a Web Service + managed MySQL.

### Step 2 — Extract the Backup

Download the most recent backup ZIP from this repository's `backups/` folder. Extract it to your local machine.

```bash
unzip equiphk_code_YYYY-MM-DD.zip -d equiphk
cd equiphk
```

### Step 3 — Install Dependencies

```bash
pnpm install
```

This installs all Node.js packages. It takes approximately 2 minutes.

### Step 4 — Set Environment Variables

In your hosting platform's dashboard, add all environment variables from Section 3. Do not commit `.env` files to any repository.

The minimum required set to get the site running:

```
DATABASE_URL=mysql://user:password@host:port/dbname
JWT_SECRET=<64-character-random-string>
RESEND_API_KEY=<from resend.com>
STRIPE_SECRET_KEY=<from stripe.com>
STRIPE_WEBHOOK_SECRET=<from stripe.com>
VITE_STRIPE_PUBLISHABLE_KEY=<from stripe.com>
GOOGLE_OAUTH_CLIENT_ID=<from google cloud console>
GOOGLE_OAUTH_CLIENT_SECRET=<from google cloud console>
GOOGLE_OAUTH_REFRESH_TOKEN=<from casey>
```

### Step 5 — Apply the Four Manus Replacements

Work through each item in Section 4 in order:
1. Replace authentication (most critical — do this first)
2. Replace LLM API (quick — 30 minutes)
3. Replace file storage (2–3 hours)
4. Replace notifications (30 minutes)

### Step 6 — Push Database Schema

```bash
pnpm db:push
```

This creates all database tables on the new MySQL server.

### Step 7 — Import the Database Backup

Import the SQL dump file into the new database:

```bash
mysql -h <host> -u <user> -p <database> < equiphk_database_YYYY-MM-DD.sql
```

This restores all equipment items, categories, orders, members, and translations.

### Step 8 — Create the First Admin User

Insert Casey's admin account directly into the database (see Section 4a for the SQL command). Use a bcrypt hash generator to create the password hash.

### Step 9 — Build and Deploy

```bash
pnpm build
```

On Railway/Render, this runs automatically on each deployment. The start command is:

```bash
node dist/index.js
```

### Step 10 — Update DNS

Point `www.equip.hk` to the new hosting platform's IP address or CNAME. DNS propagation takes 10 minutes to 48 hours depending on the registrar.

---

## 6. Recommended Hosting Platform

**Railway** is the recommended platform for rebuilding EquipHK. It supports full-stack Node.js applications, has built-in MySQL, and auto-deploys from GitHub on every push.

| Platform | Full Stack | MySQL | Auto-deploy from GitHub | Monthly Cost |
|---|---|---|---|---|
| **Railway** (recommended) | Yes | Yes (built-in) | Yes | ~$5–15 USD |
| Render | Yes | Yes (add-on) | Yes | ~$7–20 USD |
| Fly.io | Yes | External only | Yes | ~$5–15 USD |
| DigitalOcean App Platform | Yes | Yes (add-on) | Yes | ~$12–25 USD |
| Netlify | Frontend only | No | Yes | Not suitable |
| Vercel | Frontend only | No | Yes | Not suitable |

---

## 7. Post-Launch Checklist

After the site is live on the new platform, verify each item:

- [ ] Homepage loads correctly at `www.equip.hk`
- [ ] Equipment catalogue displays all items with images
- [ ] Admin login works with email/password
- [ ] Admin dashboard shows orders and inventory
- [ ] Stripe payment flow completes (use test card `4242 4242 4242 4242`)
- [ ] Contact form sends email to `casey@kowloonconstruction.com`
- [ ] Booking confirmation emails are received by customers
- [ ] Google Drive backup runs on the first Sunday after launch
- [ ] GitHub backup runs on the first day after launch
- [ ] SSL certificate is active (HTTPS green padlock)
- [ ] Traditional Chinese toggle works on the frontend

---

## 8. Contact Information

**Site Owner:** Casey  
**Company:** Kowloon Construction Company / EquipHK  
**Email:** casey@kowloonconstruction.com  
**WhatsApp:** Available via the site's contact page  

**GitHub Backup Repository:** `EquipHK/Equip-HK---backup-` (private)  
**Google Drive Backup Folder ID:** `1gLU9vc7HObTSGYF2t174_P8YHOQ3MWCE`  

**Domain Registrar:** Check with Casey — domain is `equip.hk`  
**Stripe Account:** Registered under Casey's email — access via dashboard.stripe.com  
**Resend Account:** Registered under Casey's email — access via resend.com  
**Google Cloud Console:** Registered under Casey's Google account  

---

*This document should be updated whenever significant changes are made to the site architecture. The latest version is always in the root of this backup repository.*
