import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  format: ["esm"],
  clean: true,
  outDir: "dist",
  // Bundle workspace + npm deps so the Action runs without node_modules
  noExternal: [/.*/],
  platform: "node",
  target: "node22",
});
