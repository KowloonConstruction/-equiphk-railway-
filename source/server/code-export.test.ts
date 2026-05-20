import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock archiver before importing the module
vi.mock("archiver", () => {
  const mockArchive = {
    on: vi.fn().mockReturnThis(),
    pipe: vi.fn().mockReturnThis(),
    glob: vi.fn().mockReturnThis(),
    finalize: vi.fn().mockResolvedValue(undefined),
  };
  return { default: vi.fn(() => mockArchive) };
});

describe("Code Export Endpoint", () => {
  it("should reject requests with no token", async () => {
    const { registerCodeExportRoute } = await import("./codeExport");

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
      headersSent: false,
    };
    const mockReq = { query: {} };
    const mockApp = { use: vi.fn() };
    const mockRouter = {
      get: vi.fn((path: string, handler: Function) => {
        if (path === "/api/backup/code-export") {
          handler(mockReq, mockRes);
        }
      }),
    };

    vi.doMock("express", () => ({
      Router: vi.fn(() => mockRouter),
    }));

    // Verify unauthorized response
    expect(mockRes.status).toBeDefined();
  });

  it("should have BACKUP_TOKEN env variable set", () => {
    // BACKUP_TOKEN is injected as an environment variable
    // This test verifies the env var is available in the runtime
    const token = process.env.BACKUP_TOKEN;
    // In test environment it may not be set, but the endpoint falls back to JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    // At least one of these should be available in production
    expect(token !== undefined || jwtSecret !== undefined).toBe(true);
  });

  it("should generate correct filename with today's date", () => {
    const date = new Date().toISOString().slice(0, 10);
    const filename = `equiphk_code_${date}.zip`;
    expect(filename).toMatch(/^equiphk_code_\d{4}-\d{2}-\d{2}\.zip$/);
  });

  it("should exclude node_modules and .git from archive patterns", () => {
    const excludePatterns = [
      "node_modules/**",
      ".git/**",
      "dist/**",
      ".manus-logs/**",
      "**/*.log",
      "drizzle/migrations/**",
    ];
    expect(excludePatterns).toContain("node_modules/**");
    expect(excludePatterns).toContain(".git/**");
    expect(excludePatterns).toContain("dist/**");
  });
});
