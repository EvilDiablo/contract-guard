import { describe, expect, it } from "vitest";
import { compareJson } from "./compare.js";
import { generateTypeScript, generateZod } from "./codegen.js";
import { normalizeValue } from "./normalize.js";
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

  it("suggests rename for user_id → userId", () => {
    const report = compareJson({ user_id: 1 }, { userId: 1 });
    expect(report.findings.some((f) => f.changeType === "possible_rename")).toBe(true);
    expect(keySimilarity("user_id", "userId")).toBeGreaterThan(0.9);
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
    expect(md).toContain("<!-- api-diff-report -->");
    expect(md).toContain("BREAKING");
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
});
