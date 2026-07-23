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
  /**
   * Human labels for codegen / display (parallel to `files`).
   * From capture manifest `name` when present, else file basename without `.json`.
   */
  names: string[];
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

function nameFromFilename(filePath: string): string {
  return basename(filePath).replace(/\.json$/i, "");
}

interface ManifestEntry {
  file: string;
  name: string;
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
      names: [nameFromFilename(resolved)],
      label: inputPath,
    };
  }

  if (!info.isDirectory()) {
    throw new Error(`Not a file or directory: ${inputPath}`);
  }

  const entries = await readdir(resolved);
  const manifestPath = join(resolved, CAPTURE_MANIFEST_FILENAME);
  let listed: ManifestEntry[] = [];

  if (entries.some((name) => name.toLowerCase() === CAPTURE_MANIFEST_FILENAME)) {
    listed = await snapshotEntriesFromManifest(manifestPath, resolved);
  }

  if (listed.length === 0) {
    listed = entries
      .filter(
        (name) =>
          name.toLowerCase().endsWith(".json") && !isReservedSampleFilename(name),
      )
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        file: join(resolved, name),
        name: nameFromFilename(name),
      }));
  }

  if (listed.length === 0) {
    throw new Error(`No .json sample files found in directory: ${inputPath}`);
  }

  const samples: JsonValue[] = [];
  const files: string[] = [];
  const names: string[] = [];
  for (const entry of listed) {
    samples.push(await readJsonFile(entry.file));
    files.push(entry.file);
    names.push(entry.name);
  }

  const label =
    files.length === 1
      ? inputPath
      : `${inputPath} (${files.length} samples)`;

  return { samples, files, names, label };
}

async function snapshotEntriesFromManifest(
  manifestPath: string,
  dir: string,
): Promise<ManifestEntry[]> {
  try {
    const raw = await readJsonFile(manifestPath);
    if (!Array.isArray(raw)) return [];
    const out: ManifestEntry[] = [];
    for (const entry of raw) {
      if (
        entry &&
        typeof entry === "object" &&
        !Array.isArray(entry) &&
        typeof (entry as { file?: unknown }).file === "string"
      ) {
        const fileName = (entry as { file: string }).file;
        if (!fileName.toLowerCase().endsWith(".json")) continue;
        if (isReservedSampleFilename(basename(fileName))) continue;
        const manifestName =
          typeof (entry as { name?: unknown }).name === "string"
            ? (entry as { name: string }).name.trim()
            : "";
        out.push({
          file: join(dir, basename(fileName)),
          name: manifestName || nameFromFilename(fileName),
        });
      }
    }
    return out.sort((a, b) => basename(a.file).localeCompare(basename(b.file)));
  } catch {
    return [];
  }
}
