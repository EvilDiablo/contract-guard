import { diffSchemas } from "./diff.js";
import { normalizeValue } from "./normalize.js";
import type { DiffOptions, DiffReport, JsonValue } from "./types.js";
import { DEFAULT_IGNORE_PATHS } from "./types.js";

export interface CompareJsonOptions extends DiffOptions {
  /** Merge with default volatile-path ignores (default true). */
  useDefaultIgnores?: boolean;
}

/** High-level: normalize two JSON values and run semantic diff. */
export function compareJson(
  baseline: JsonValue,
  candidate: JsonValue,
  options: CompareJsonOptions = {},
): DiffReport {
  const ignorePaths = [
    ...(options.useDefaultIgnores === false ? [] : DEFAULT_IGNORE_PATHS),
    ...(options.ignorePaths ?? []),
  ];

  const baselineSchema = normalizeValue(baseline);
  const candidateSchema = normalizeValue(candidate);

  return diffSchemas(baselineSchema, candidateSchema, {
    ...options,
    ignorePaths,
  });
}
