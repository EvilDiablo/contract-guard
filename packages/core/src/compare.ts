import { diffSchemas } from "./diff.js";
import { normalizeValues } from "./normalize.js";
import type { DiffOptions, DiffReport, JsonValue } from "./types.js";
import { DEFAULT_IGNORE_PATHS } from "./types.js";

export interface CompareJsonOptions extends DiffOptions {
  /** Merge with default volatile-path ignores (default true). */
  useDefaultIgnores?: boolean;
}

function resolveIgnorePaths(options: CompareJsonOptions): string[] {
  return [
    ...(options.useDefaultIgnores === false ? [] : DEFAULT_IGNORE_PATHS),
    ...(options.ignorePaths ?? []),
  ];
}

/** Compare schemas inferred from one or more JSON samples on each side. */
export function compareJsonSamples(
  baseline: JsonValue[],
  candidate: JsonValue[],
  options: CompareJsonOptions = {},
): DiffReport {
  if (baseline.length === 0) {
    throw new Error("baseline samples must not be empty");
  }
  if (candidate.length === 0) {
    throw new Error("candidate samples must not be empty");
  }

  const ignorePaths = resolveIgnorePaths(options);
  const baselineSchema = normalizeValues(baseline);
  const candidateSchema = normalizeValues(candidate);

  const report = diffSchemas(baselineSchema, candidateSchema, {
    ...options,
    ignorePaths,
  });

  report.summary.baselineSamples = baseline.length;
  report.summary.candidateSamples = candidate.length;

  return report;
}

/** High-level: normalize two JSON values and run semantic diff. */
export function compareJson(
  baseline: JsonValue,
  candidate: JsonValue,
  options: CompareJsonOptions = {},
): DiffReport {
  return compareJsonSamples([baseline], [candidate], options);
}
