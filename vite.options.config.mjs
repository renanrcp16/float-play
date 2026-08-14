import { URL, fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const optionsEntry = fileURLToPath(new URL("./src/options.ts", import.meta.url));

export default defineConfig({
  publicDir: false,
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: optionsEntry,
      name: "FloatPlayOptions",
      formats: ["iife"],
      fileName: () => "options.js"
    }
  }
});
