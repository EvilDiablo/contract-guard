import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { defineCommand, runMain } from "citty";
import { consola } from "consola";
import {
  CONFIG_FILENAMES,
  captureEndpoints,
  compareJson,
  exitCodeForReport,
  formatMarkdownReport,
  formatTextReport,
  generateSchemas,
  loadConfigFromJson,
  normalizeValue,
  type ApiDiffConfig,
  type FailOn,
  type JsonValue,
} from "@contractguard/core";

async function readJsonFile(path: string): Promise<JsonValue> {
  const text = await readFile(path, "utf8");
  return JSON.parse(text) as JsonValue;
}

async function tryLoadConfig(explicit?: string): Promise<ApiDiffConfig> {
  if (explicit) {
    const text = await readFile(resolve(explicit), "utf8");
    return loadConfigFromJson(text);
  }
  for (const name of CONFIG_FILENAMES) {
    try {
      const text = await readFile(resolve(name), "utf8");
      return loadConfigFromJson(text);
    } catch {
      // continue
    }
  }
  return {};
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const compare = defineCommand({
  meta: {
    name: "compare",
    description: "Semantically compare two JSON payloads or snapshot files",
  },
  args: {
    baseline: {
      type: "string",
      description: "Path to baseline JSON file",
      required: true,
      alias: "b",
    },
    candidate: {
      type: "string",
      description: "Path to candidate JSON file",
      required: true,
      alias: "c",
    },
    config: {
      type: "string",
      description: "Path to contractguard config JSON",
      alias: "C",
    },
    format: {
      type: "string",
      description: "Output format: text | markdown | json",
      default: "text",
      alias: "f",
    },
    out: {
      type: "string",
      description: "Write report to file",
      alias: "o",
    },
    failOn: {
      type: "string",
      description: "Fail on: breaking | warning | never",
    },
    ignore: {
      type: "string",
      description: "Comma-separated ignore path globs",
    },
    side: {
      type: "string",
      description: "response | request",
    },
    title: {
      type: "string",
      description: "Markdown report title",
      default: "ContractGuard Report",
    },
    codegen: {
      type: "string",
      description: "Directory to write generated TypeScript + Zod from candidate",
    },
  },
  async run({ args }) {
    const config = await tryLoadConfig(args.config);
    const baseline = await readJsonFile(resolve(args.baseline));
    const candidate = await readJsonFile(resolve(args.candidate));

    const report = compareJson(baseline, candidate, {
      ignorePaths: [...(config.ignorePaths ?? []), ...parseList(args.ignore)],
      side: (args.side as "response" | "request" | undefined) ?? config.side ?? "response",
      additiveSeverity: config.additiveSeverity ?? "info",
      baselineLabel: args.baseline,
      candidateLabel: args.candidate,
    });

    const format = (args.format ?? "text").toLowerCase();
    let output: string;
    if (format === "json") {
      output = JSON.stringify(report, null, 2);
    } else if (format === "markdown" || format === "md") {
      output = formatMarkdownReport(report, args.title);
    } else {
      output = formatTextReport(report);
    }

    if (args.out) {
      const outPath = resolve(args.out);
      await mkdir(dirname(outPath), { recursive: true });
      await writeFile(outPath, output, "utf8");
      consola.success(`Wrote report to ${outPath}`);
    } else {
      console.log(output);
    }

    if (args.codegen) {
      const schema = normalizeValue(candidate);
      const { typescript, zod } = generateSchemas(schema, { typeName: "ApiResponse" });
      const dir = resolve(args.codegen);
      await mkdir(dir, { recursive: true });
      await writeFile(resolve(dir, "api.ts"), typescript, "utf8");
      await writeFile(resolve(dir, "api.zod.ts"), zod, "utf8");
      consola.success(`Generated types in ${dir}`);
    }

    const failOn = (args.failOn ?? config.failOn ?? "breaking") as FailOn;
    const code = exitCodeForReport(report, failOn);
    if (code !== 0) {
      consola.error(
        `Diff failed (exit ${code}): ${report.summary.breaking} breaking, ${report.summary.warning} warning`,
      );
    }
    process.exitCode = code;
  },
});

const capture = defineCommand({
  meta: {
    name: "capture",
    description: "Hit configured staging endpoints and save JSON snapshots",
  },
  args: {
    config: {
      type: "string",
      description: "Path to contractguard config with endpoints",
      alias: "C",
    },
    out: {
      type: "string",
      description: "Output directory for snapshots",
      default: "captures",
      alias: "o",
    },
    baseUrl: {
      type: "string",
      description: "Override base URL",
    },
    header: {
      type: "string",
      description: "Extra header Name:Value (repeat via comma-separated)",
    },
  },
  async run({ args }) {
    const config = await tryLoadConfig(args.config);
    const endpoints = config.endpoints ?? [];
    if (endpoints.length === 0) {
      consola.error("No endpoints configured. Add `endpoints` to contractguard.config.json");
      process.exitCode = 1;
      return;
    }

    const defaultHeaders: Record<string, string> = {};
    for (const part of parseList(args.header)) {
      const idx = part.indexOf(":");
      if (idx === -1) continue;
      defaultHeaders[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
    }
    if (process.env.API_DIFF_TOKEN) {
      defaultHeaders.Authorization =
        defaultHeaders.Authorization ?? `Bearer ${process.env.API_DIFF_TOKEN}`;
    }

    const results = await captureEndpoints(endpoints, {
      baseUrl: args.baseUrl ?? config.baseUrl,
      defaultHeaders,
    });

    const outDir = resolve(args.out);
    await mkdir(outDir, { recursive: true });
    const manifest = [];

    for (const result of results) {
      const file = `${result.name.replace(/[^a-zA-Z0-9_-]+/g, "_")}.json`;
      const path = resolve(outDir, file);
      await writeFile(path, JSON.stringify(result.body, null, 2), "utf8");
      manifest.push({
        name: result.name,
        file,
        status: result.status,
        ok: result.ok,
        error: result.error,
        url: result.url,
      });
      if (result.ok) {
        consola.success(`${result.name} → ${file} (${result.status})`);
      } else {
        consola.warn(`${result.name} failed: ${result.error ?? result.status}`);
      }
    }

    await writeFile(
      resolve(outDir, "manifest.json"),
      JSON.stringify(manifest, null, 2),
      "utf8",
    );
    consola.success(`Captured ${results.length} endpoint(s) to ${outDir}`);
    if (results.some((r) => !r.ok)) {
      process.exitCode = 1;
    }
  },
});

const generate = defineCommand({
  meta: {
    name: "generate",
    description: "Generate TypeScript types and Zod schemas from a JSON snapshot",
  },
  args: {
    input: {
      type: "string",
      description: "Path to JSON file",
      required: true,
      alias: "i",
    },
    out: {
      type: "string",
      description: "Output directory",
      default: "types",
      alias: "o",
    },
    name: {
      type: "string",
      description: "Type name",
      default: "ApiResponse",
    },
  },
  async run({ args }) {
    const json = await readJsonFile(resolve(args.input));
    const schema = normalizeValue(json);
    const { typescript, zod } = generateSchemas(schema, { typeName: args.name });
    const dir = resolve(args.out);
    await mkdir(dir, { recursive: true });
    await writeFile(resolve(dir, "api.ts"), typescript, "utf8");
    await writeFile(resolve(dir, "api.zod.ts"), zod, "utf8");
    consola.success(`Wrote ${dir}/api.ts and ${dir}/api.zod.ts`);
  },
});

const main = defineCommand({
  meta: {
    name: "contractguard",
    version: "0.1.0",
    description: "Semantic API response & payload diff engine",
  },
  subCommands: {
    compare,
    capture,
    generate,
  },
});

runMain(main);
