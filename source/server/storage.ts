/**
 * storage.ts
 * Unified storage helper — works on both Manus (proxy) and Railway (AWS S3 / Cloudflare R2).
 *
 * Detection logic:
 *  - If BUILT_IN_FORGE_API_URL is set  → Manus proxy (original behaviour)
 *  - Otherwise                          → AWS S3 / Cloudflare R2 via @aws-sdk/client-s3
 *
 * Required env vars for Railway / S3:
 *   S3_BUCKET, S3_REGION (default: ap-east-1), S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
 *   S3_ENDPOINT  (optional — set for Cloudflare R2 or custom S3-compatible endpoints)
 */

import { ENV } from "./_core/env";

// ─── Manus proxy helpers (unchanged) ─────────────────────────────────────────

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

async function manusStoragePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const baseUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
  const apiKey = ENV.forgeApiKey;
  const key = normalizeKey(relKey);
  const uploadUrl = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  uploadUrl.searchParams.set("path", key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData,
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Storage upload failed (${response.status}): ${message}`);
  }
  const url = (await response.json()).url;
  return { key, url };
}

async function manusStorageGet(relKey: string): Promise<{ key: string; url: string }> {
  const baseUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
  const apiKey = ENV.forgeApiKey;
  const key = normalizeKey(relKey);
  const downloadApiUrl = new URL("v1/storage/downloadUrl", ensureTrailingSlash(baseUrl));
  downloadApiUrl.searchParams.set("path", key);
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return { key, url: (await response.json()).url };
}

// ─── AWS S3 / Cloudflare R2 helpers ──────────────────────────────────────────

async function s3StoragePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const key = normalizeKey(relKey);
  const bucket = ENV.s3Bucket;
  const region = ENV.s3Region || "ap-east-1";

  if (!bucket || !ENV.s3AccessKeyId || !ENV.s3SecretAccessKey) {
    throw new Error(
      "S3 storage not configured. Set S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY."
    );
  }

  const clientConfig: Record<string, unknown> = {
    region,
    credentials: {
      accessKeyId: ENV.s3AccessKeyId,
      secretAccessKey: ENV.s3SecretAccessKey,
    },
  };

  if (ENV.s3Endpoint) {
    clientConfig.endpoint = ENV.s3Endpoint;
    clientConfig.forcePathStyle = true; // required for R2 / MinIO
  }

  const client = new S3Client(clientConfig as any);
  const body = typeof data === "string" ? Buffer.from(data) : data;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  // Build public URL
  const url = ENV.s3Endpoint
    ? `${ENV.s3Endpoint.replace(/\/+$/, "")}/${bucket}/${key}` // R2 / custom
    : `https://${bucket}.s3.${region}.amazonaws.com/${key}`; // AWS S3

  return { key, url };
}

async function s3StorageGet(
  relKey: string,
  expiresIn = 3600
): Promise<{ key: string; url: string }> {
  const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const key = normalizeKey(relKey);
  const bucket = ENV.s3Bucket;
  const region = ENV.s3Region || "ap-east-1";

  const clientConfig: Record<string, unknown> = {
    region,
    credentials: {
      accessKeyId: ENV.s3AccessKeyId,
      secretAccessKey: ENV.s3SecretAccessKey,
    },
  };

  if (ENV.s3Endpoint) {
    clientConfig.endpoint = ENV.s3Endpoint;
    clientConfig.forcePathStyle = true;
  }

  const client = new S3Client(clientConfig as any);
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const url = await getSignedUrl(client, command, { expiresIn });
  return { key, url };
}

// ─── Public API ───────────────────────────────────────────────────────────────

const useManusProxy = () => !!process.env.BUILT_IN_FORGE_API_URL;

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (useManusProxy()) {
    return manusStoragePut(relKey, data, contentType);
  }
  return s3StoragePut(relKey, data, contentType);
}

export async function storageGet(
  relKey: string,
  expiresIn = 3600
): Promise<{ key: string; url: string }> {
  if (useManusProxy()) {
    return manusStorageGet(relKey);
  }
  return s3StorageGet(relKey, expiresIn);
}
