export type {
  ApiDiffConfig,
  ArraySchema,
  CaptureEndpoint,
  ContractGuardConfig,
  DiffChangeType,
  DiffFinding,
  DiffOptions,
  DiffReport,
  DiffSeverity,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  ObjectSchema,
  SchemaKind,
  SchemaNode,
  Side,
  UnionSchema,
} from "./types.js";
export { DEFAULT_IGNORE_PATHS } from "./types.js";

export { normalizeValue, schemaToString, primaryType } from "./normalize.js";
export { diffSchemas } from "./diff.js";
export { compareJson } from "./compare.js";
export type { CompareJsonOptions } from "./compare.js";
export {
  formatMarkdownReport,
  formatTextReport,
  exitCodeForReport,
} from "./report.js";
export type { FailOn } from "./report.js";
export { shouldIgnorePath, normalizePath, joinPath } from "./ignore.js";
export { suggestRenames, keySimilarity, tokenizeKey } from "./rename.js";
export {
  parseConfig,
  loadConfigFromJson,
  contractGuardConfigSchema,
  apiDiffConfigSchema,
  CONFIG_FILENAMES,
} from "./config.js";
export { captureEndpoints } from "./capture.js";
export type { CaptureOptions, CaptureResult } from "./capture.js";
export {
  generateTypeScript,
  generateZod,
  generateSchemas,
} from "./codegen.js";
