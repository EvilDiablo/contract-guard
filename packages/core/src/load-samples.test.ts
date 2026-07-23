import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadJsonSamples } from "./load-samples.js";

describe("loadJsonSamples", () => {
  it("skips manifest.json when loading a capture directory", async () => {
    const dir = await mkdtemp(join(tmpdir(), "cg-samples-"));
    await writeFile(
      join(dir, "cycle-start.json"),
      JSON.stringify({ phase: "start" }),
      "utf8",
    );
    await writeFile(
      join(dir, "cycle-stop.json"),
      JSON.stringify({ phase: "stop" }),
      "utf8",
    );
    await writeFile(
      join(dir, "manifest.json"),
      JSON.stringify([
        { name: "cycle-start", file: "cycle-start.json", status: 200, ok: true },
        { name: "cycle-stop", file: "cycle-stop.json", status: 200, ok: true },
      ]),
      "utf8",
    );

    const loaded = await loadJsonSamples(dir);
    expect(loaded.samples).toHaveLength(2);
    expect(loaded.files.every((f) => !f.endsWith("manifest.json"))).toBe(true);
    expect(loaded.samples).toEqual([{ phase: "start" }, { phase: "stop" }]);
  });

  it("loads only files listed in manifest when present", async () => {
    const dir = await mkdtemp(join(tmpdir(), "cg-samples-"));
    await writeFile(join(dir, "keep.json"), JSON.stringify({ id: 1 }), "utf8");
    await writeFile(join(dir, "noise.json"), JSON.stringify({ noise: true }), "utf8");
    await writeFile(
      join(dir, "manifest.json"),
      JSON.stringify([{ name: "keep", file: "keep.json", status: 200, ok: true }]),
      "utf8",
    );

    const loaded = await loadJsonSamples(dir);
    expect(loaded.samples).toEqual([{ id: 1 }]);
    expect(loaded.files).toHaveLength(1);
  });
});
