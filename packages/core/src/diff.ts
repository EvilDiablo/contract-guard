import { shouldIgnorePath, joinPath } from "./ignore.js";
import { primaryType, schemaToString } from "./normalize.js";
import { suggestRenames } from "./rename.js";
import type {
  DiffFinding,
  DiffOptions,
  DiffReport,
  ObjectSchema,
  SchemaNode,
} from "./types.js";

function samePrimaryType(a: SchemaNode, b: SchemaNode): boolean {
  if (a.kind === "union" || b.kind === "union") {
    return primaryType(a) === primaryType(b);
  }
  if (a.kind === "array" && b.kind === "array") {
    return samePrimaryType(a.items, b.items);
  }
  if (a.kind === "object" && b.kind === "object") {
    return true;
  }
  return a.kind === b.kind;
}

function unwrapNull(node: SchemaNode): { node: SchemaNode; nullable: boolean } {
  if (node.kind === "null") {
    return { node, nullable: true };
  }
  if (node.kind === "union") {
    const nonNull = node.variants.filter((v) => v.kind !== "null");
    const hasNull = node.variants.some((v) => v.kind === "null") || Boolean(node.nullable);
    if (nonNull.length === 1) {
      return { node: { ...nonNull[0]!, nullable: hasNull || nonNull[0]!.nullable }, nullable: hasNull };
    }
    return {
      node: { kind: "union", variants: nonNull, nullable: hasNull },
      nullable: hasNull,
    };
  }
  return { node, nullable: Boolean(node.nullable) };
}

function compareNodes(
  baseline: SchemaNode,
  candidate: SchemaNode,
  pathSegments: string[],
  options: DiffOptions,
  findings: DiffFinding[],
): void {
  const path = joinPath(pathSegments);
  if (shouldIgnorePath(path, options.ignorePaths)) {
    return;
  }

  const left = unwrapNull(baseline);
  const right = unwrapNull(candidate);

  if (left.node.kind === "unknown" || right.node.kind === "unknown") {
    return;
  }

  // Pure null vs non-null type change (covers object → null)
  if (left.node.kind === "null" && right.node.kind !== "null") {
    findings.push({
      path: path || "$",
      severity: "warning",
      changeType: "type_change",
      message: `Type changed from null to ${primaryType(right.node)}`,
      baseline: "null",
      candidate: primaryType(right.node),
    });
    return;
  }
  if (right.node.kind === "null" && left.node.kind !== "null") {
    findings.push({
      path: path || "$",
      severity: "breaking",
      changeType: "type_change",
      message: `Type changed from ${primaryType(left.node)} to null`,
      baseline: primaryType(left.node),
      candidate: "null",
    });
    return;
  }

  // nullability: T → T | null (same primary type)
  if (left.nullable !== right.nullable) {
    if (!left.nullable && right.nullable) {
      findings.push({
        path: path || "$",
        severity: options.side === "request" ? "warning" : "breaking",
        changeType: "nullability_changed",
        message: `Nullability changed: field can now be null`,
        baseline: primaryType(baseline),
        candidate: primaryType(candidate),
      });
    } else {
      findings.push({
        path: path || "$",
        severity: "info",
        changeType: "nullability_changed",
        message: `Nullability tightened: field is no longer nullable`,
        baseline: primaryType(baseline),
        candidate: primaryType(candidate),
      });
    }
  }

  if (!samePrimaryType(left.node, right.node)) {
    findings.push({
      path: path || "$",
      severity: "breaking",
      changeType: "type_change",
      message: `Data type changed from \`${primaryType(left.node)}\` to \`${primaryType(right.node)}\``,
      baseline: primaryType(left.node),
      candidate: primaryType(right.node),
    });
    return;
  }

  if (left.node.kind === "array" && right.node.kind === "array") {
    compareNodes(left.node.items, right.node.items, [...pathSegments, "*"], options, findings);
    return;
  }

  if (left.node.kind === "object" && right.node.kind === "object") {
    compareObjects(left.node, right.node, pathSegments, options, findings);
    return;
  }

  if (left.node.kind === "union" && right.node.kind === "union") {
    // Compare union by string forms — if different, flag type change
    if (primaryType(left.node) !== primaryType(right.node)) {
      findings.push({
        path: path || "$",
        severity: "breaking",
        changeType: "type_change",
        message: `Union type changed from \`${primaryType(left.node)}\` to \`${primaryType(right.node)}\``,
        baseline: primaryType(left.node),
        candidate: primaryType(right.node),
      });
    }
  }
}

function compareObjects(
  baseline: ObjectSchema,
  candidate: ObjectSchema,
  pathSegments: string[],
  options: DiffOptions,
  findings: DiffFinding[],
): void {
  const baseKeys = Object.keys(baseline.properties);
  const candKeys = Object.keys(candidate.properties);
  const baseSet = new Set(baseKeys);
  const candSet = new Set(candKeys);

  const removed = baseKeys.filter((k) => !candSet.has(k));
  const added = candKeys.filter((k) => !baseSet.has(k));

  const renames =
    options.suggestRenames === false
      ? []
      : suggestRenames(removed, added);

  const renamedFrom = new Set(renames.map((r) => r.from));
  const renamedTo = new Set(renames.map((r) => r.to));

  for (const pair of renames) {
    const childPath = joinPath([...pathSegments, pair.from]);
    if (shouldIgnorePath(childPath, options.ignorePaths)) continue;
    findings.push({
      path: childPath,
      severity: "breaking",
      changeType: "possible_rename",
      message: `Possible rename: \`${pair.from}\` → \`${pair.to}\` (similarity ${(pair.score * 100).toFixed(0)}%)`,
      baseline: schemaToString(baseline.properties[pair.from]!),
      candidate: schemaToString(candidate.properties[pair.to]!),
      suggestion: `If intentional, update clients from ${pair.from} to ${pair.to}`,
    });
    // Also deep-compare the renamed field schemas
    compareNodes(
      baseline.properties[pair.from]!,
      candidate.properties[pair.to]!,
      [...pathSegments, pair.to],
      options,
      findings,
    );
  }

  const baselineRequired = new Set(baseline.required ?? []);
  for (const key of removed) {
    if (renamedFrom.has(key)) continue;
    const childPath = joinPath([...pathSegments, key]);
    if (shouldIgnorePath(childPath, options.ignorePaths)) continue;
    const wasRequired = baselineRequired.has(key);
    // Optional fields (e.g. present in only some multi-sample baselines) are not breaking when dropped.
    const severity =
      options.side === "request"
        ? "info"
        : wasRequired
          ? "breaking"
          : "info";
    findings.push({
      path: childPath,
      severity,
      changeType: "field_removed",
      message: wasRequired
        ? `Field \`${key}\` was removed`
        : `Optional field \`${key}\` was removed`,
      baseline: schemaToString(baseline.properties[key]!),
    });
  }

  const additiveSeverity = options.additiveSeverity ?? "info";
  for (const key of added) {
    if (renamedTo.has(key)) continue;
    const childPath = joinPath([...pathSegments, key]);
    if (shouldIgnorePath(childPath, options.ignorePaths)) continue;
    const severity =
      options.side === "request" ? "warning" : additiveSeverity;
    findings.push({
      path: childPath,
      severity,
      changeType: "field_added",
      message: `Field \`${key}\` was added`,
      candidate: schemaToString(candidate.properties[key]!),
    });
  }

  for (const key of baseKeys) {
    if (!candSet.has(key)) continue;
    if (renamedFrom.has(key)) continue;
    compareNodes(
      baseline.properties[key]!,
      candidate.properties[key]!,
      [...pathSegments, key],
      options,
      findings,
    );

    const wasRequired = baseline.required.includes(key);
    const isRequired = candidate.required.includes(key);
    if (wasRequired !== isRequired) {
      const childPath = joinPath([...pathSegments, key]);
      if (shouldIgnorePath(childPath, options.ignorePaths)) continue;
      if (!wasRequired && isRequired) {
        findings.push({
          path: childPath,
          severity: options.side === "request" ? "breaking" : "info",
          changeType: "required_changed",
          message: `Field \`${key}\` became required`,
        });
      } else {
        findings.push({
          path: childPath,
          severity: options.side === "response" ? "warning" : "info",
          changeType: "required_changed",
          message: `Field \`${key}\` is no longer required (may be omitted)`,
        });
      }
    }
  }
}

/** Compare two SchemaIR trees and return a structured diff report. */
export function diffSchemas(
  baseline: SchemaNode,
  candidate: SchemaNode,
  options: DiffOptions = {},
): DiffReport {
  const findings: DiffFinding[] = [];
  compareNodes(baseline, candidate, [], options, findings);

  // Stable sort: breaking first, then path
  const severityOrder = { breaking: 0, warning: 1, info: 2 } as const;
  findings.sort((a, b) => {
    const s = severityOrder[a.severity] - severityOrder[b.severity];
    if (s !== 0) return s;
    return a.path.localeCompare(b.path);
  });

  const summary = {
    breaking: findings.filter((f) => f.severity === "breaking").length,
    warning: findings.filter((f) => f.severity === "warning").length,
    info: findings.filter((f) => f.severity === "info").length,
    total: findings.length,
  };

  return {
    summary,
    findings,
    baselineLabel: options.baselineLabel,
    candidateLabel: options.candidateLabel,
  };
}
