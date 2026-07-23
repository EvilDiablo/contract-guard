import { describe, expect, it } from "vitest";
import { compareJson, compareJsonSamples } from "./compare.js";
import {
  generateSchemasBarrel,
  generateTypeScript,
  generateZod,
} from "./codegen.js";
import { normalizeValue, normalizeValues } from "./normalize.js";
import { exitCodeForReport, formatMarkdownReport } from "./report.js";
import { keySimilarity } from "./rename.js";

describe("compareJson", () => {
  it("flags number → string as breaking", () => {
    const report = compareJson(
      { id: 101, is_active: true },
      { id: "101", is_active: true },
      { useDefaultIgnores: true },
    );
    expect(report.summary.breaking).toBeGreaterThanOrEqual(1);
    expect(report.findings.some((f) => f.path === "id" && f.changeType === "type_change")).toBe(
      true,
    );
    expect(exitCodeForReport(report)).toBe(2);
  });

  it("flags field removal as breaking on responses", () => {
    const report = compareJson({ email: "a@b.com", name: "Ada" }, { name: "Ada" });
    expect(report.findings.some((f) => f.path === "email" && f.severity === "breaking")).toBe(
      true,
    );
  });

  it("treats additive response fields as info by default", () => {
    const report = compareJson({ id: 1 }, { id: 1, new_field: "test" });
    const added = report.findings.find((f) => f.changeType === "field_added");
    expect(added?.severity).toBe("info");
    expect(exitCodeForReport(report)).toBe(0);
  });

  it("treats additive request fields as warning", () => {
    const report = compareJson(
      { id: 1 },
      { id: 1, new_field: "test" },
      { side: "request" },
    );
    const added = report.findings.find((f) => f.changeType === "field_added");
    expect(added?.severity).toBe("warning");
  });

  it("suggests rename for user_id → userId", () => {
    const report = compareJson({ user_id: 1 }, { userId: 1 });
    expect(report.findings.some((f) => f.changeType === "possible_rename")).toBe(true);
    expect(keySimilarity("user_id", "userId")).toBeGreaterThan(0.9);
  });

  it("does not suggest rename for dissimilar keys", () => {
    const report = compareJson({ alpha: 1 }, { omega: 1 });
    expect(report.findings.some((f) => f.changeType === "possible_rename")).toBe(false);
    expect(report.findings.some((f) => f.changeType === "field_removed")).toBe(true);
    expect(report.findings.some((f) => f.changeType === "field_added")).toBe(true);
  });

  it("flags object → null as breaking", () => {
    const report = compareJson({ address: { city: "NYC" } }, { address: null });
    expect(report.findings.some((f) => f.path === "address" && f.severity === "breaking")).toBe(
      true,
    );
  });

  it("ignores key order", () => {
    const report = compareJson({ b: 1, a: 2 }, { a: 2, b: 1 });
    expect(report.summary.total).toBe(0);
  });

  it("ignores default timestamp paths even on type drift", () => {
    const report = compareJson(
      { id: 1, created_at: 1712000000 },
      { id: 1, created_at: "1712009999" },
    );
    expect(report.summary.total).toBe(0);
  });

  it("ignores custom ignore paths", () => {
    const report = compareJson(
      { id: 1, nonce: 1 },
      { id: 1, nonce: "xyz" },
      { ignorePaths: ["nonce"], useDefaultIgnores: false },
    );
    expect(report.summary.total).toBe(0);
  });

  it("detects nested type changes", () => {
    const report = compareJson(
      { user: { price: 19.99 } },
      { user: { price: "19.99" } },
    );
    expect(report.findings.some((f) => f.path === "user.price")).toBe(true);
  });

  it("renders markdown with sticky marker", () => {
    const report = compareJson({ id: 1 }, { id: "1" });
    const md = formatMarkdownReport(report, "Breaking API Changes");
    expect(md).toContain("<!-- contractguard-report -->");
    expect(md).toContain("BREAKING");
  });
});

describe("compareJsonSamples", () => {
  it("does not treat removal of optional multi-sample fields as breaking", () => {
    const report = compareJsonSamples(
      [
        { id: 1, name: "Ada", email: "a@b.com" },
        { id: 2, name: "Grace", email: "g@b.com" },
        { id: 3, name: "Alan" },
      ],
      [
        { id: 1, name: "Ada" },
        { id: 2, name: "Grace" },
      ],
    );
    expect(report.summary.baselineSamples).toBe(3);
    expect(report.summary.candidateSamples).toBe(2);
    const email = report.findings.find((f) => f.path === "email");
    expect(email?.changeType).toBe("field_removed");
    expect(email?.severity).toBe("info");
    expect(report.summary.breaking).toBe(0);
    expect(exitCodeForReport(report)).toBe(0);
  });

  it("still flags removal of fields present in every baseline sample", () => {
    const report = compareJsonSamples(
      [
        { id: 1, name: "Ada" },
        { id: 2, name: "Grace" },
      ],
      [{ id: 1 }, { id: 2 }],
    );
    expect(
      report.findings.some((f) => f.path === "name" && f.severity === "breaking"),
    ).toBe(true);
  });

  it("unions array item shapes across samples", () => {
    const schema = normalizeValues([
      { items: [{ id: 1 }] },
      { items: [{ id: 2, label: "x" }] },
    ]);
    expect(schema.kind).toBe("object");
    if (schema.kind !== "object") return;
    const items = schema.properties.items;
    expect(items?.kind).toBe("array");
    if (items?.kind !== "array" || !items.items || items.items.kind !== "object") {
      throw new Error("expected array of objects");
    }
    expect(items.items.properties).toHaveProperty("id");
    expect(items.items.properties).toHaveProperty("label");
    expect(items.items.required ?? []).not.toContain("label");
    expect(items.items.required ?? []).toContain("id");
  });

  it("makes fields nullable when null appears in one sample", () => {
    const schema = normalizeValues([{ value: 1 }, { value: null }]);
    expect(schema.kind).toBe("object");
    if (schema.kind !== "object") return;
    const value = schema.properties.value;
    expect(value?.nullable).toBe(true);
  });
});

describe("codegen", () => {
  it("emits TypeScript and Zod from schema", () => {
    const schema = normalizeValue({ id: 1, name: "Ada", tags: ["a"] });
    const ts = generateTypeScript(schema, "User");
    const zod = generateZod(schema, "userSchema");
    expect(ts).toContain("export interface User");
    expect(ts).toContain('"id"');
    expect(zod).toContain('import { z } from "zod"');
    expect(zod).toContain("z.object");
  });

  it("emits a barrel with one type per named schema", () => {
    const barrel = generateSchemasBarrel([
      { name: "cycle-start", schema: normalizeValue({ phase: "start" }) },
      { name: "cycle-stop", schema: normalizeValue({ phase: "stop" }) },
    ]);
    expect(barrel.typeNames).toEqual(["CycleStart", "CycleStop"]);
    expect(barrel.typescript).toContain("export interface CycleStart");
    expect(barrel.typescript).toContain("export interface CycleStop");
    expect(barrel.zod).toContain("cycleStartSchema");
    expect(barrel.zod).toContain("cycleStopSchema");
    expect(barrel.zod.match(/import \{ z \} from "zod"/g)?.length).toBe(1);
  });
});
