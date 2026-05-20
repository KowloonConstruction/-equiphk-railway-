/**
 * Google Drive Backup Job
 * Runs monthly — exports DB dump + code ZIP and uploads to Google Drive.
 * Triggered by the monthly cron scheduler in server/_core/index.ts
 */
import { google } from "googleapis";
import archiver from "archiver";
import { createConnection } from "mysql2/promise";
import { Readable, PassThrough } from "stream";
import path from "path";

const GDRIVE_FOLDER_ID = "1gLU9vc7HObTSGYF2t174_P8YHOQ3MWCE";
const PROJECT_ROOT = path.resolve(process.cwd());

// ── Auth ──────────────────────────────────────────────────────────────────────
function getGoogleAuth() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REFRESH_TOKEN env vars must be set");
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, "urn:ietf:wg:oauth:2.0:oob");
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

// ── Upload a file to Google Drive ─────────────────────────────────────────────
async function uploadToDrive(
  auth: ReturnType<typeof getGoogleAuth>,
  filename: string,
  mimeType: string,
  dataStream: Readable
): Promise<string> {
  const drive = google.drive({ version: "v3", auth: auth as any });

  const response = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: filename,
      parents: [GDRIVE_FOLDER_ID],
    },
    media: {
      mimeType,
      body: dataStream,
    },
    fields: "id, name, size",
  });

  return response.data.id ?? "";
}

// ── Delete old backups from Drive (keep last 3 months) ────────────────────────
async function cleanOldDriveBackups(auth: ReturnType<typeof getGoogleAuth>) {
  try {
    const drive = google.drive({ version: "v3", auth: auth as any });
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const res = await drive.files.list({
      q: `'${GDRIVE_FOLDER_ID}' in parents and trashed = false and name contains 'equiphk_'`,
      fields: "files(id, name, createdTime)",
      orderBy: "createdTime asc",
    });

    const files = res.data.files ?? [];
    let deleted = 0;
    for (const file of files) {
      if (file.createdTime && new Date(file.createdTime) < threeMonthsAgo) {
        await drive.files.delete({ fileId: file.id! });
        deleted++;
      }
    }
    if (deleted > 0) {
      console.log(`[DriveBackup] Cleaned up ${deleted} old backup file(s) (3-month rolling window)`);
    }
  } catch (err) {
    console.warn("[DriveBackup] Could not clean old backups:", err);
  }
}

// ── Export code as ZIP stream ─────────────────────────────────────────────────
function createCodeZipStream(): PassThrough {
  const passThrough = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 6 } });

  archive.on("error", (err: Error) => {
    console.error("[DriveBackup] Archive error:", err);
    passThrough.destroy(err);
  });

  archive.pipe(passThrough);

  archive.glob("**/*", {
    cwd: PROJECT_ROOT,
    ignore: [
      "node_modules/**",
      ".git/**",
      "dist/**",
      ".manus-logs/**",
      "**/*.log",
      "drizzle/migrations/**",
    ],
  });

  archive.finalize();
  return passThrough;
}

// ── Export database as SQL dump ───────────────────────────────────────────────
async function exportDatabase(): Promise<Buffer> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");

  const url = new URL(dbUrl);
  const conn = await createConnection({
    host: url.hostname,
    port: parseInt(url.port || "4000"),
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.replace("/", ""),
    ssl: { rejectUnauthorized: false },
  });

  try {
    const [tables] = await conn.execute<any[]>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'"
    );

    const lines: string[] = [
      `-- EquipHK Database Backup`,
      `-- Generated: ${new Date().toISOString()}`,
      `-- Database: ${url.pathname.replace("/", "")}`,
      ``,
      `SET FOREIGN_KEY_CHECKS=0;`,
      ``,
    ];

    for (const row of tables) {
      const tableName = row.TABLE_NAME || row.table_name;

      const [createResult] = await conn.execute<any[]>(`SHOW CREATE TABLE \`${tableName}\``);
      const createStmt = createResult[0]["Create Table"];
      lines.push(`-- Table: ${tableName}`);
      lines.push(`DROP TABLE IF EXISTS \`${tableName}\`;`);
      lines.push(createStmt + ";");
      lines.push(``);

      const [rows] = await conn.execute<any[]>(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]).map((c) => `\`${c}\``).join(", ");
        const valueChunks: string[] = [];

        for (const row of rows) {
          const values = Object.values(row).map((v) => {
            if (v === null) return "NULL";
            if (typeof v === "number") return String(v);
            if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace("T", " ")}'`;
            return `'${String(v).replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
          });
          valueChunks.push(`(${values.join(", ")})`);
        }

        lines.push(`INSERT INTO \`${tableName}\` (${columns}) VALUES`);
        lines.push(valueChunks.join(",\n") + ";");
        lines.push(``);
      }
    }

    lines.push(`SET FOREIGN_KEY_CHECKS=1;`);
    return Buffer.from(lines.join("\n"), "utf8");
  } finally {
    await conn.end();
  }
}

// ── Main backup job ───────────────────────────────────────────────────────────
export async function runGoogleDriveBackup(): Promise<{
  success: boolean;
  codeFileId?: string;
  dbFileId?: string;
  error?: string;
}> {
  const date = new Date().toISOString().slice(0, 10);
  console.log(`[DriveBackup] Starting backup for ${date}...`);

  try {
    const auth = getGoogleAuth();

    // 1. Upload code ZIP
    console.log("[DriveBackup] Uploading code ZIP...");
    const codeStream = createCodeZipStream();
    const codeFileId = await uploadToDrive(
      auth,
      `equiphk_code_${date}.zip`,
      "application/zip",
      codeStream
    );
    console.log(`[DriveBackup] ✓ Code ZIP uploaded (ID: ${codeFileId})`);

    // 2. Export and upload database
    console.log("[DriveBackup] Exporting database...");
    const dbBuffer = await exportDatabase();
    const dbStream = Readable.from(dbBuffer);
    const dbFileId = await uploadToDrive(
      auth,
      `equiphk_database_${date}.sql`,
      "text/plain",
      dbStream
    );
    console.log(`[DriveBackup] ✓ Database uploaded (ID: ${dbFileId}), size: ${(dbBuffer.length / 1024).toFixed(0)}KB`);

    // 3. Clean up old backups
    await cleanOldDriveBackups(auth);

    console.log(`[DriveBackup] Backup complete for ${date}`);
    return { success: true, codeFileId, dbFileId };
  } catch (err: any) {
    console.error("[DriveBackup] Backup failed:", err.message);
    return { success: false, error: err.message };
  }
}
