import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const cli = join(root, "packages/cli/dist/index.js");
const baseline = join(root, "examples/fixtures/baseline-users.json");
const candidate = join(root, "examples/fixtures/candidate-users.json");

function run(args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

describe("cli smoke", () => {
  it("has a built CLI binary", () => {
    expect(existsSync(cli)).toBe(true);
  });

  it("reports breaking changes with exit code 2", () => {
    const result = run([
      "compare",
      "-b",
      baseline,
      "-c",
      candidate,
      "-f",
      "markdown",
    ]);
    expect(result.status).toBe(2);
    expect(result.stdout).toContain("<!-- contractguard-report -->");
    expect(result.stdout + result.stderr).toContain("BREAKING");
  });

  it("exits 0 when failOn is never", () => {
    const result = run([
      "compare",
      "-b",
      baseline,
      "-c",
      candidate,
      "--failOn",
      "never",
    ]);
    expect(result.status).toBe(0);
  });

  it("generates TypeScript and Zod schemas", () => {
    const outDir = mkdtempSync(join(tmpdir(), "contractguard-cli-"));
    try {
      const result = run([
        "generate",
        "-i",
        candidate,
        "-o",
        outDir,
        "--name",
        "UserResponse",
      ]);
      expect(result.status).toBe(0);
      expect(readFileSync(join(outDir, "api.ts"), "utf8")).toContain(
        "UserResponse",
      );
      expect(existsSync(join(outDir, "api.zod.ts"))).toBe(true);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it("generates one type per snapshot from a directory", () => {
    const multiBaseline = join(root, "examples/fixtures/multi/baseline");
    const outDir = mkdtempSync(join(tmpdir(), "contractguard-cli-"));
    try {
      const result = run(["generate", "-i", multiBaseline, "-o", outDir]);
      expect(result.status).toBe(0);
      const ts = readFileSync(join(outDir, "api.ts"), "utf8");
      const interfaces = ts.match(/export interface /g) ?? [];
      expect(interfaces.length).toBe(3);
      expect(existsSync(join(outDir, "api.zod.ts"))).toBe(true);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it("merges multi-sample directories without false-breaking optional fields", () => {
    const multiBaseline = join(root, "examples/fixtures/multi/baseline");
    const multiCandidate = join(root, "examples/fixtures/multi/candidate");
    const result = run([
      "compare",
      "-b",
      multiBaseline,
      "-c",
      multiCandidate,
      "-f",
      "markdown",
      "--failOn",
      "breaking",
    ]);
    expect(result.stdout).toContain("3 samples");
    expect(result.stdout).toMatch(/2 samples|Inferred from 3/);
    // email was optional in baseline (missing from some samples) — not breaking
    expect(result.status).toBe(0);
  });
});
