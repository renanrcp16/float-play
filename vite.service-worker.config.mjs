import { URL, fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const serviceWorkerEntry = fileURLToPath(new URL("./src/service-worker.ts", import.meta.url));

export default defineConfig({
  publicDir: false,
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: serviceWorkerEntry,
      name: "FloatPlayServiceWorker",
      formats: ["iife"],
      fileName: () => "service-worker.js"
    }
  }
});
