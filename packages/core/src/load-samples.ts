import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { JsonValue } from "./types.js";

export interface LoadedSamples {
  samples: JsonValue[];
  /** Paths of files that were loaded (absolute). */
  files: string[];
  /** Human label, e.g. `fixtures/baseline (3 samples)`. */
  label: string;
}

async function readJsonFile(path: string): Promise<JsonValue> {
  const text = await readFile(path, "utf8");
  return JSON.parse(text) as JsonValue;
}

/**
 * Load JSON samples from a file or a directory of `*.json` files (sorted).
 */
export async function loadJsonSamples(inputPath: string): Promise<LoadedSamples> {
  const resolved = resolve(inputPath);
  const info = await stat(resolved);

  if (info.isFile()) {
    const sample = await readJsonFile(resolved);
    return {
      samples: [sample],
      files: [resolved],
      label: inputPath,
    };
  }

  if (!info.isDirectory()) {
    throw new Error(`Not a file or directory: ${inputPath}`);
  }

  const entries = await readdir(resolved);
  const jsonFiles = entries
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => join(resolved, name));

  if (jsonFiles.length === 0) {
    throw new Error(`No .json files found in directory: ${inputPath}`);
  }

  const samples: JsonValue[] = [];
  for (const file of jsonFiles) {
    samples.push(await readJsonFile(file));
  }

  const label =
    jsonFiles.length === 1
      ? inputPath
      : `${inputPath} (${jsonFiles.length} samples)`;

  return { samples, files: jsonFiles, label };
}
