import { URL, fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const youtubePlayerEntry = fileURLToPath(
  new URL("./src/infrastructure/youtube/YouTubePlayerBridgeMain.ts", import.meta.url)
);

export default defineConfig({
  publicDir: false,
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: youtubePlayerEntry,
      name: "FloatPlayYouTubePlayerBridge",
      formats: ["iife"],
      fileName: () => "youtube-player-main.js"
    }
  }
});
