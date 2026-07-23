import { readdir, readFile, stat } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import type { JsonValue } from "./types.js";

/** Written by `contractguard capture` next to snapshots — not an API sample. */
export const CAPTURE_MANIFEST_FILENAME = "manifest.json";

const RESERVED_SAMPLE_FILENAMES = new Set([CAPTURE_MANIFEST_FILENAME]);

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

function isReservedSampleFilename(name: string): boolean {
  return RESERVED_SAMPLE_FILENAMES.has(name.toLowerCase());
}

/**
 * Load JSON samples from a file or a directory of `*.json` files (sorted).
 * Skips capture metadata such as `manifest.json`.
 * When a capture manifest is present, loads only the snapshot files it lists.
 */
export async function loadJsonSamples(inputPath: string): Promise<LoadedSamples> {
  const resolved = resolve(inputPath);
  const info = await stat(resolved);

  if (info.isFile()) {
    if (isReservedSampleFilename(basename(resolved))) {
      throw new Error(
        `Refusing to load capture metadata as a sample: ${basename(resolved)}`,
      );
    }
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
  const manifestPath = join(resolved, CAPTURE_MANIFEST_FILENAME);
  let jsonFiles: string[] = [];

  if (entries.some((name) => name.toLowerCase() === CAPTURE_MANIFEST_FILENAME)) {
    const listed = await snapshotFilesFromManifest(manifestPath, resolved);
    if (listed.length > 0) {
      jsonFiles = listed;
    }
  }

  if (jsonFiles.length === 0) {
    jsonFiles = entries
      .filter(
        (name) =>
          name.toLowerCase().endsWith(".json") && !isReservedSampleFilename(name),
      )
      .sort((a, b) => a.localeCompare(b))
      .map((name) => join(resolved, name));
  }

  if (jsonFiles.length === 0) {
    throw new Error(`No .json sample files found in directory: ${inputPath}`);
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

async function snapshotFilesFromManifest(
  manifestPath: string,
  dir: string,
): Promise<string[]> {
  try {
    const raw = await readJsonFile(manifestPath);
    if (!Array.isArray(raw)) return [];
    const files: string[] = [];
    for (const entry of raw) {
      if (
        entry &&
        typeof entry === "object" &&
        !Array.isArray(entry) &&
        typeof (entry as { file?: unknown }).file === "string"
      ) {
        const name = (entry as { file: string }).file;
        if (!name.toLowerCase().endsWith(".json")) continue;
        if (isReservedSampleFilename(basename(name))) continue;
        files.push(join(dir, basename(name)));
      }
    }
    return files.sort((a, b) => basename(a).localeCompare(basename(b)));
  } catch {
    return [];
  }
}
