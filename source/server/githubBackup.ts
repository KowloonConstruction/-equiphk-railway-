/**
 * GitHub Backup Job
 * Exports the EquipHK codebase and database dump, then pushes them
 * to the private GitHub backup repository automatically.
 *
 * Schedule: Daily at 03:00 HKT
 * Retention: Rolling 7-day window — backups older than 7 days are removed automatically
 */
import { execSync } from "child_process";
import { createWriteStream, mkdirSync, writeFileSync, rmSync, existsSync, readdirSync } from "fs";
import path from "path";
import archiver from "archiver";
import { getDb } from "./db";

const BACKUP_REPO_DIR = "/home/ubuntu/equiphk-backup-repo";
const PROJECT_DIR = "/home/ubuntu/equiphk";
const GITHUB_REMOTE = "github-equiphk-backup:EquipHK/Equip-HK---backup-.git";
const KEEP_DAYS = 7; // Rolling window — keep last 7 days only

// Directories/files to exclude from the code ZIP
const EXCLUDE_PATTERNS = [
  "node_modules",
  ".git",
  "dist",
  ".manus-logs",
  "drizzle/migrations",
];

async function createCodeZip(outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 6 } });

    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);

    archive.glob("**/*", {
      cwd: PROJECT_DIR,
      ignore: EXCLUDE_PATTERNS.map((p) => `${p}/**`).concat(EXCLUDE_PATTERNS),
      dot: true,
    });

    archive.finalize();
  });
}

async function createDbDump(outputPath: string): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");

  const url = new URL(dbUrl);
  const host = url.hostname;
  const port = url.port || "4000";
  const user = url.username;
  const password = url.password;
  const database = url.pathname.replace("/", "");

  const fallbackDump = "mysqldump";
  let dumpCmd: string;
  try {
    execSync(`which ${fallbackDump}`, { stdio: "ignore" });
    dumpCmd = fallbackDump;
  } catch {
    dumpCmd = "";
  }

  if (dumpCmd) {
    const cmd = `${dumpCmd} --host="${host}" --port="${port}" --user="${user}" --password="${password}" --ssl-mode=REQUIRED --no-tablespaces "${database}" > "${outputPath}"`;
    execSync(cmd, { stdio: "pipe", timeout: 120000 });
  } else {
    const db = await getDb();
    if (!db) throw new Error("Could not connect to database");
    const tables = await db.execute("SHOW TABLES");
    const summary = {
      exported_at: new Date().toISOString(),
      note: "Full mysqldump not available on server. Use Management UI → Database to export full data.",
      tables: (tables as unknown as Array<Record<string, string>>).map((r) => Object.values(r)[0]),
    };
    writeFileSync(outputPath, JSON.stringify(summary, null, 2));
  }
}

/**
 * Remove backup folders older than KEEP_DAYS from the local repo directory.
 * Folder names are expected to be YYYY-MM-DD date strings.
 */
function pruneOldBackups(backupsDir: string): void {
  if (!existsSync(backupsDir)) return;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - KEEP_DAYS);

  try {
    const entries = readdirSync(backupsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      // Folder name must match YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.name)) continue;
      const folderDate = new Date(entry.name);
      if (folderDate < cutoff) {
        rmSync(path.join(backupsDir, entry.name), { recursive: true, force: true });
        console.log(`[GitHubBackup] Pruned old backup: ${entry.name}`);
      }
    }
  } catch (err) {
    console.warn("[GitHubBackup] Could not prune old backups:", err);
  }
}

export async function runGitHubBackup(): Promise<{
  success: boolean;
  commitSha?: string;
  error?: string;
}> {
  const dateStr = new Date().toISOString().split("T")[0];
  const tmpDir = `/tmp/equiphk-backup-${Date.now()}`;

  try {
    console.log(`[GitHubBackup] Starting daily backup for ${dateStr}...`);
    mkdirSync(tmpDir, { recursive: true });

    // 1. Create code ZIP
    console.log("[GitHubBackup] Creating code ZIP...");
    const zipPath = path.join(tmpDir, `equiphk_code_${dateStr}.zip`);
    await createCodeZip(zipPath);
    console.log(`[GitHubBackup] Code ZIP created`);

    // 2. Create DB dump
    console.log("[GitHubBackup] Creating database dump...");
    const dbPath = path.join(tmpDir, `equiphk_database_${dateStr}.sql`);
    try {
      await createDbDump(dbPath);
      console.log(`[GitHubBackup] Database dump created`);
    } catch (dbErr) {
      console.warn("[GitHubBackup] DB dump failed, continuing without it:", dbErr);
      writeFileSync(
        dbPath,
        `-- DB export failed at ${new Date().toISOString()}\n-- Use Management UI → Database to export manually.\n`
      );
    }

    // 3. Set up backup repo directory
    if (!existsSync(BACKUP_REPO_DIR)) {
      mkdirSync(BACKUP_REPO_DIR, { recursive: true });
      execSync(
        `git init && git config user.email "backup@equiphk.server" && git config user.name "EquipHK Backup" && git remote add origin ${GITHUB_REMOTE}`,
        { cwd: BACKUP_REPO_DIR, stdio: "pipe" }
      );
    }

    // 4. Prune backups older than 7 days
    const backupsDir = path.join(BACKUP_REPO_DIR, "backups");
    pruneOldBackups(backupsDir);

    // 5. Copy today's files into the backup repo
    const backupDir = path.join(backupsDir, dateStr);
    mkdirSync(backupDir, { recursive: true });
    execSync(`cp "${zipPath}" "${backupDir}/"`, { stdio: "pipe" });
    execSync(`cp "${dbPath}" "${backupDir}/"`, { stdio: "pipe" });

    // Update README
    writeFileSync(
      path.join(BACKUP_REPO_DIR, "README.md"),
      `# EquipHK Backup Repository\n\nAutomated daily backups of the EquipHK website.\n\nA rolling **7-day window** is maintained — backups older than 7 days are removed automatically.\n\nEach folder under \`backups/\` contains:\n- \`equiphk_code_YYYY-MM-DD.zip\` — full source code\n- \`equiphk_database_YYYY-MM-DD.sql\` — database export\n\nLast backup: ${dateStr}\n`
    );

    // 6. Pull, commit and push
    console.log("[GitHubBackup] Committing and pushing to GitHub...");
    try {
      execSync(
        `GIT_SSH_COMMAND="ssh -i /home/ubuntu/.ssh/equiphk-deploy-key -o StrictHostKeyChecking=no" git pull origin main --rebase 2>/dev/null || true`,
        { cwd: BACKUP_REPO_DIR, stdio: "pipe" }
      );
    } catch {
      // ignore pull errors on first push
    }

    execSync(`git add -A`, { cwd: BACKUP_REPO_DIR, stdio: "pipe" });

    const status = execSync(`git status --porcelain`, { cwd: BACKUP_REPO_DIR }).toString().trim();
    if (!status) {
      console.log("[GitHubBackup] Nothing to commit — backup already up to date");
      return { success: true, commitSha: "no-changes" };
    }

    execSync(`git commit -m "Daily backup ${dateStr}"`, {
      cwd: BACKUP_REPO_DIR,
      stdio: "pipe",
    });

    execSync(
      `GIT_SSH_COMMAND="ssh -i /home/ubuntu/.ssh/equiphk-deploy-key -o StrictHostKeyChecking=no" git push origin HEAD:main`,
      { cwd: BACKUP_REPO_DIR, stdio: "pipe" }
    );

    const commitSha = execSync(`git rev-parse --short HEAD`, { cwd: BACKUP_REPO_DIR })
      .toString()
      .trim();

    console.log(`[GitHubBackup] Pushed successfully — commit ${commitSha}`);

    // Cleanup tmp
    rmSync(tmpDir, { recursive: true, force: true });

    return { success: true, commitSha };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[GitHubBackup] Failed:", error);
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    return { success: false, error };
  }
}
