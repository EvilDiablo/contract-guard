import type { ObjectSchema, SchemaNode } from "./types.js";

function indent(level: number): string {
  return "  ".repeat(level);
}

function tsType(node: SchemaNode, level = 0): string {
  const nullable = node.nullable || node.kind === "null";
  const wrap = (t: string) => (nullable && node.kind !== "null" ? `${t} | null` : t);

  switch (node.kind) {
    case "string":
      return wrap("string");
    case "number":
      return wrap("number");
    case "boolean":
      return wrap("boolean");
    case "null":
      return "null";
    case "unknown":
      return wrap("unknown");
    case "array":
      return wrap(`${tsType(node.items, level)}[]`);
    case "union":
      return node.variants.map((v) => tsType(v, level)).join(" | ");
    case "object": {
      const keys = Object.keys(node.properties).sort();
      if (keys.length === 0) return wrap("Record<string, unknown>");
      const lines = keys.map((key) => {
        const optional = node.required.includes(key) ? "" : "?";
        return `${indent(level + 1)}${JSON.stringify(key)}${optional}: ${tsType(node.properties[key]!, level + 1)};`;
      });
      return wrap(`{\n${lines.join("\n")}\n${indent(level)}}`);
    }
    default:
      return "unknown";
  }
}

function zodExpr(node: SchemaNode): string {
  const withNull = (expr: string) =>
    node.nullable || node.kind === "null" ? `${expr}.nullable()` : expr;

  switch (node.kind) {
    case "string":
      return withNull("z.string()");
    case "number":
      return withNull("z.number()");
    case "boolean":
      return withNull("z.boolean()");
    case "null":
      return "z.null()";
    case "unknown":
      return withNull("z.unknown()");
    case "array":
      return withNull(`z.array(${zodExpr(node.items)})`);
    case "union": {
      if (node.variants.length === 1) return withNull(zodExpr(node.variants[0]!));
      const union = `z.union([${node.variants.map(zodExpr).join(", ")}])`;
      return node.nullable ? `${union}.nullable()` : union;
    }
    case "object": {
      const keys = Object.keys(node.properties).sort();
      const fields = keys.map((key) => {
        let expr = zodExpr(node.properties[key]!);
        if (!node.required.includes(key)) {
          expr = `${expr}.optional()`;
        }
        return `  ${JSON.stringify(key)}: ${expr},`;
      });
      return withNull(`z.object({\n${fields.join("\n")}\n})`);
    }
    default:
      return "z.unknown()";
  }
}

function toTypeName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const pascal = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  return pascal || "ApiSchema";
}

/** Generate TypeScript interface/type aliases from SchemaIR. */
export function generateTypeScript(
  schema: SchemaNode,
  typeName = "ApiResponse",
): string {
  const name = toTypeName(typeName);
  if (schema.kind === "object") {
    return `export interface ${name} ${tsType(schema)}\n`;
  }
  return `export type ${name} = ${tsType(schema)};\n`;
}

/** Generate a Zod schema module from SchemaIR. */
export function generateZod(schema: SchemaNode, schemaName = "apiResponseSchema"): string {
  const name = schemaName.replace(/[^a-zA-Z0-9_]/g, "_") || "apiResponseSchema";
  const typeName = toTypeName(name.replace(/Schema$/, ""));
  return [
    `import { z } from "zod";`,
    ``,
    `export const ${name} = ${zodExpr(schema)};`,
    ``,
    `export type ${typeName} = z.infer<typeof ${name}>;`,
    ``,
  ].join("\n");
}

/** Convenience: generate both TS types and Zod from an object schema. */
export function generateSchemas(
  schema: SchemaNode,
  options: { typeName?: string; zodName?: string } = {},
): { typescript: string; zod: string } {
  const typeName = options.typeName ?? "ApiResponse";
  const zodName = options.zodName ?? `${typeName.charAt(0).toLowerCase()}${typeName.slice(1)}Schema`;
  return {
    typescript: generateTypeScript(schema, typeName),
    zod: generateZod(schema, zodName),
  };
}

export type { ObjectSchema };
