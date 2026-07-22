import { spawnSync } from "node:child_process";
import { mkdtempSync, existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "packages", "cli", "dist", "index.js");
const baseline = join(root, "examples", "fixtures", "baseline-users.json");
const candidate = join(root, "examples", "fixtures", "candidate-users.json");
const actionMain = join(root, "packages", "github-action", "dist", "main.js");

function fail(message) {
  console.error(`MVP smoke FAILED: ${message}`);
  process.exit(1);
}

function runCli(args, options = {}) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
  if (options.expectExit !== undefined && result.status !== options.expectExit) {
    fail(
      `expected exit ${options.expectExit}, got ${result.status}\n` +
        `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  }
  return result;
}

console.log("MVP smoke: checking prerequisites…");
if (!existsSync(cli)) fail(`CLI missing at ${cli}. Run pnpm build first.`);
if (!existsSync(actionMain)) {
  fail(`GitHub Action bundle missing at ${actionMain}. Run pnpm build first.`);
}

console.log("MVP smoke: compare fixtures (expect exit 2)…");
const breaking = runCli(
  ["compare", "-b", baseline, "-c", candidate, "-f", "markdown"],
  { expectExit: 2 },
);
const md = breaking.stdout + breaking.stderr;
if (!md.includes("<!-- api-diff-report -->")) {
  fail("markdown report missing sticky marker <!-- api-diff-report -->");
}
if (!md.includes("BREAKING")) {
  fail("markdown report missing BREAKING findings");
}

console.log("MVP smoke: compare with --failOn never (expect exit 0)…");
runCli(
  ["compare", "-b", baseline, "-c", candidate, "-f", "text", "--failOn", "never"],
  { expectExit: 0 },
);

console.log("MVP smoke: generate TypeScript + Zod…");
const outDir = mkdtempSync(join(tmpdir(), "api-diff-mvp-"));
try {
  runCli(
    [
      "generate",
      "-i",
      candidate,
      "-o",
      outDir,
      "--name",
      "UserResponse",
    ],
    { expectExit: 0 },
  );
  const apiTs = join(outDir, "api.ts");
  const apiZod = join(outDir, "api.zod.ts");
  if (!existsSync(apiTs)) fail(`expected ${apiTs}`);
  if (!existsSync(apiZod)) fail(`expected ${apiZod}`);
  const ts = readFileSync(apiTs, "utf8");
  if (!ts.includes("UserResponse")) fail("generated api.ts missing UserResponse");
} finally {
  rmSync(outDir, { recursive: true, force: true });
}

console.log("MVP smoke: all checks passed.");
