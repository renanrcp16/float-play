import { URL, fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const contentEntry = fileURLToPath(new URL("./src/content.ts", import.meta.url));

export default defineConfig({
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: contentEntry,
      name: "FloatPlayContent",
      formats: ["iife"],
      fileName: () => "content.js"
    }
  }
});
