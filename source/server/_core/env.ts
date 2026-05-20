export const ENV = {
  // Auth
  appId: process.env.VITE_APP_ID ?? "equiphk-local",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",

  // LLM — Railway uses OPENAI_API_KEY + OPENAI_API_URL (or defaults to OpenAI)
  // Manus injects BUILT_IN_FORGE_API_KEY/URL; Railway uses OPENAI_API_KEY
  forgeApiUrl: process.env.OPENAI_API_URL ?? process.env.BUILT_IN_FORGE_API_URL ?? "https://api.openai.com",
  forgeApiKey: process.env.OPENAI_API_KEY ?? process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // Payments
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",

  // Email
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "EquipHK <noreply@equip.hk>",

  // Storage — Railway uses AWS S3 directly
  s3Bucket: process.env.S3_BUCKET ?? process.env.STORAGE_BUCKET ?? "",
  s3Region: process.env.S3_REGION ?? "ap-east-1",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID ?? "",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY ?? "",
  s3Endpoint: process.env.S3_ENDPOINT ?? "", // For Cloudflare R2 or custom S3-compatible

  // Manus OAuth (kept for backward compat but unused on Railway)
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
};

// Alias for convenience
export const env = ENV;
