import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type PluginOption } from "vite";

const plugins = [react(), tailwindcss()].flat() as PluginOption[];

const tauriPlatform =
  process.env.TAURI_ENV_PLATFORM ?? process.env.TAURI_PLATFORM;

const isTauriDebug = Boolean(
  process.env.TAURI_ENV_DEBUG ?? process.env.TAURI_DEBUG,
);

export default defineConfig({
  plugins,

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },

  envPrefix: ["VITE_", "TAURI_"],

  build: {
    target: tauriPlatform === "windows" ? "chrome105" : "safari13",
    minify: !isTauriDebug ? "esbuild" : false,
    sourcemap: isTauriDebug,

    rolldownOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        splashscreen: path.resolve(__dirname, "splashscreen.html"),
      },
    },
  },
});