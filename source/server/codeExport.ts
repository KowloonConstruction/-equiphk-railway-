/**
 * Code Export Endpoint
 * Serves a ZIP of the project source code for backup purposes.
 * Protected by a secret token stored in BACKUP_TOKEN env var.
 */
import { Router, Express } from "express";
import archiver from "archiver";
import path from "path";
import { ENV } from "./_core/env";

const PROJECT_ROOT = path.resolve(process.cwd());

export function registerCodeExportRoute(app: Express) {
  const router = Router();

  router.get("/api/backup/code-export", (req, res) => {
    // Validate the backup token
    const token = req.query.token as string;
    const backupToken = process.env.BACKUP_TOKEN ?? ENV.cookieSecret.slice(0, 32);

    if (!token || token !== backupToken) {
      res.status(401).json({ error: "Unauthorized. Invalid or missing backup token." });
      return;
    }

    const date = new Date().toISOString().slice(0, 10); // e.g. 2026-04-08
    const filename = `equiphk_code_${date}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const archive = archiver("zip", { zlib: { level: 6 } });

    archive.on("error", (err: Error) => {
      console.error("[CodeExport] Archive error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to create archive" });
      }
    });

    archive.pipe(res);

    // Add the project directory, excluding large/unnecessary folders
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
      dot: true,
    });

    archive.finalize();
    console.log(`[CodeExport] ZIP download started: ${filename}`);
  });

  app.use(router);
}
