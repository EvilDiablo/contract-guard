export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type SchemaKind =
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "object"
  | "array"
  | "union"
  | "unknown";

export interface SchemaNodeBase {
  kind: SchemaKind;
  nullable?: boolean;
}

export interface StringSchema extends SchemaNodeBase {
  kind: "string";
}

export interface NumberSchema extends SchemaNodeBase {
  kind: "number";
}

export interface BooleanSchema extends SchemaNodeBase {
  kind: "boolean";
}

export interface NullSchema extends SchemaNodeBase {
  kind: "null";
}

export interface ObjectSchema extends SchemaNodeBase {
  kind: "object";
  properties: Record<string, SchemaNode>;
  required: string[];
}

export interface ArraySchema extends SchemaNodeBase {
  kind: "array";
  items: SchemaNode;
}

export interface UnionSchema extends SchemaNodeBase {
  kind: "union";
  variants: SchemaNode[];
}

export interface UnknownSchema extends SchemaNodeBase {
  kind: "unknown";
}

export type SchemaNode =
  | StringSchema
  | NumberSchema
  | BooleanSchema
  | NullSchema
  | ObjectSchema
  | ArraySchema
  | UnionSchema
  | UnknownSchema;

export type DiffSeverity = "breaking" | "warning" | "info";

export type DiffChangeType =
  | "type_change"
  | "field_removed"
  | "field_added"
  | "nullability_changed"
  | "required_changed"
  | "array_items_changed"
  | "possible_rename";

export interface DiffFinding {
  path: string;
  severity: DiffSeverity;
  changeType: DiffChangeType;
  message: string;
  baseline?: string;
  candidate?: string;
  suggestion?: string;
}

export interface DiffReport {
  summary: {
    breaking: number;
    warning: number;
    info: number;
    total: number;
  };
  findings: DiffFinding[];
  baselineLabel?: string;
  candidateLabel?: string;
}

export type Side = "response" | "request";

export interface DiffOptions {
  /** Glob patterns for paths to ignore (e.g. `*.created_at`, `requestId`). */
  ignorePaths?: string[];
  /** Compare as response (default) or request — affects severity of additions/removals. */
  side?: Side;
  /** Treat additive response fields as info (default) or warning. */
  additiveSeverity?: "info" | "warning";
  /** Suggest renames when keys look similar (default true). */
  suggestRenames?: boolean;
  baselineLabel?: string;
  candidateLabel?: string;
}

export interface CaptureEndpoint {
  name: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  headers?: Record<string, string>;
  body?: JsonValue;
}

export interface ApiDiffConfig {
  ignorePaths?: string[];
  side?: Side;
  additiveSeverity?: "info" | "warning";
  failOn?: "breaking" | "warning" | "never";
  endpoints?: CaptureEndpoint[];
  baseUrl?: string;
}

export const DEFAULT_IGNORE_PATHS = [
  "*.created_at",
  "*.updated_at",
  "*.createdAt",
  "*.updatedAt",
  "requestId",
  "*.requestId",
];
