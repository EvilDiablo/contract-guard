import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  // CLI is a bin entry; skip dts to avoid coupling to workspace .d.ts timing
  dts: false,
  clean: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
