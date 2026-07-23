import type {
  ArraySchema,
  FieldPresence,
  JsonValue,
  ObjectSchema,
  SchemaNode,
  UnionSchema,
} from "./types.js";

function isPlainObject(value: unknown): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function schemaKindKey(node: SchemaNode): string {
  if (node.kind === "object") {
    return `object:${Object.keys(node.properties).sort().join(",")}`;
  }
  if (node.kind === "array") {
    return `array:${schemaKindKey(node.items)}`;
  }
  if (node.kind === "union") {
    return `union:${node.variants.map(schemaKindKey).sort().join("|")}`;
  }
  return node.kind;
}

export function mergeSchemas(a: SchemaNode, b: SchemaNode): SchemaNode {
  if (a.kind === "null") {
    return { ...b, nullable: true };
  }
  if (b.kind === "null") {
    return { ...a, nullable: true };
  }

  if (a.kind === b.kind) {
    if (a.kind === "object" && b.kind === "object") {
      return mergeObjects(a, b);
    }
    if (a.kind === "array" && b.kind === "array") {
      return {
        kind: "array",
        items: mergeSchemas(a.items, b.items),
        nullable: Boolean(a.nullable || b.nullable),
      };
    }
    return {
      ...a,
      nullable: Boolean(a.nullable || b.nullable),
    };
  }

  const variants = flattenUnion([a, b]);
  const union: UnionSchema = {
    kind: "union",
    variants,
    nullable: variants.some((v) => v.kind === "null" || v.nullable),
  };
  return union;
}

function flattenUnion(nodes: SchemaNode[]): SchemaNode[] {
  const map = new Map<string, SchemaNode>();
  for (const node of nodes) {
    if (node.kind === "union") {
      for (const variant of flattenUnion(node.variants)) {
        const key = schemaKindKey(variant);
        const existing = map.get(key);
        map.set(key, existing ? mergeSchemas(existing, variant) : variant);
      }
    } else {
      const key = schemaKindKey(node);
      const existing = map.get(key);
      map.set(key, existing ? mergeSchemas(existing, node) : node);
    }
  }
  return [...map.values()];
}

function mergeObjects(a: ObjectSchema, b: ObjectSchema): ObjectSchema {
  const keys = new Set([...Object.keys(a.properties), ...Object.keys(b.properties)]);
  const properties: Record<string, SchemaNode> = {};
  const required: string[] = [];

  for (const key of keys) {
    const left = a.properties[key];
    const right = b.properties[key];
    if (left && right) {
      properties[key] = mergeSchemas(left, right);
      if (a.required.includes(key) && b.required.includes(key)) {
        required.push(key);
      }
    } else if (left) {
      properties[key] = left;
    } else if (right) {
      properties[key] = right;
    }
  }

  return {
    kind: "object",
    properties,
    required: required.sort(),
    nullable: Boolean(a.nullable || b.nullable),
  };
}

/** Infer a structural SchemaIR node from a concrete JSON value. */
export function normalizeValue(value: JsonValue): SchemaNode {
  if (value === null) {
    return { kind: "null" };
  }
  if (typeof value === "string") {
    return { kind: "string" };
  }
  if (typeof value === "number") {
    return { kind: "number" };
  }
  if (typeof value === "boolean") {
    return { kind: "boolean" };
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      const empty: ArraySchema = { kind: "array", items: { kind: "unknown" } };
      return empty;
    }
    let items = normalizeValue(value[0]!);
    for (let i = 1; i < value.length; i++) {
      items = mergeSchemas(items, normalizeValue(value[i]!));
    }
    return { kind: "array", items };
  }
  if (isPlainObject(value)) {
    const properties: Record<string, SchemaNode> = {};
    const required: string[] = [];
    for (const [key, child] of Object.entries(value)) {
      properties[key] = normalizeValue(child);
      required.push(key);
    }
    const obj: ObjectSchema = {
      kind: "object",
      properties,
      required: required.sort(),
    };
    return obj;
  }
  return { kind: "unknown" };
}

/**
 * Infer SchemaIR from multiple JSON samples.
 * Fields not present in every sample become optional; types are unioned.
 */
export function normalizeValues(samples: JsonValue[]): SchemaNode {
  if (samples.length === 0) {
    return { kind: "unknown" };
  }
  let schema = normalizeValue(samples[0]!);
  for (let i = 1; i < samples.length; i++) {
    schema = mergeSchemas(schema, normalizeValue(samples[i]!));
  }
  return schema;
}

/**
 * Compute top-level and nested object key presence across samples.
 * Paths use dotted notation (e.g. `user.email`).
 */
export function computeFieldPresence(samples: JsonValue[]): FieldPresence[] {
  if (samples.length === 0) return [];
  const counts = new Map<string, number>();

  function walk(value: JsonValue, prefix: string): void {
    if (!isPlainObject(value)) return;
    for (const [key, child] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${key}` : key;
      counts.set(path, (counts.get(path) ?? 0) + 1);
      walk(child, path);
    }
  }

  for (const sample of samples) {
    walk(sample, "");
  }

  const sampleCount = samples.length;
  return [...counts.entries()]
    .map(([path, seenCount]) => ({
      path,
      seenCount,
      sampleCount,
      confidence: seenCount / sampleCount,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** Describe a schema node as a short human-readable type string. */
export function schemaToString(node: SchemaNode): string {
  switch (node.kind) {
    case "string":
    case "number":
    case "boolean":
    case "null":
    case "unknown":
      return node.kind === "null" ? "null" : `${node.kind}${node.nullable ? " | null" : ""}`;
    case "array":
      return `array<${schemaToString(node.items)}>${node.nullable ? " | null" : ""}`;
    case "object": {
      const keys = Object.keys(node.properties).sort();
      if (keys.length === 0) return `object${node.nullable ? " | null" : ""}`;
      const fields = keys
        .map((k) => {
          const req = node.required.includes(k) ? "" : "?";
          return `${k}${req}: ${schemaToString(node.properties[k]!)}`;
        })
        .join("; ");
      return `{ ${fields} }${node.nullable ? " | null" : ""}`;
    }
    case "union":
      return node.variants.map(schemaToString).join(" | ");
    default:
      return "unknown";
  }
}

/** Primary kind label for type-change messages. */
export function primaryType(node: SchemaNode): string {
  if (node.kind === "union") {
    return node.variants.map(primaryType).join(" | ");
  }
  if (node.kind === "array") {
    return `array<${primaryType(node.items)}>`;
  }
  if (node.nullable && node.kind !== "null") {
    return `${node.kind} | null`;
  }
  return node.kind;
}
