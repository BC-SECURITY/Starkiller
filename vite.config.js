import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // vite-plugin-vuetify's autoImport injects per-component deep imports
    // (vuetify/components/VDataTable, ...) during the SFC transform, which runs
    // *after* Vite's initial dep pre-bundle scan — so the scan never sees them.
    // The first time a heavy route component (Dashboard, AgentEdit, and the
    // list views lazily imported from src/components) is served, those
    // brand-new bare imports trigger an on-demand dep re-optimization; the
    // now-stale optimized-dep chunk requests then 504 ("Outdated Optimize
    // Dep"), so the component's in-flight dynamic import rejects with "Failed
    // to fetch dynamically imported module" — a flaky e2e failure masked only
    // by retries. Warming the SFCs at server start forces that transform (and
    // the resulting re-optimization) up front, before any navigation.
    warmup: {
      clientFiles: [
        "./src/App.vue",
        "./src/views/**/*.vue",
        "./src/components/**/*.vue",
      ],
    },
  },
  test: {
    globals: true,
    environment: "node",
    // Unit/component tests live in src/. The e2e/ directory is owned by
    // Playwright (test:e2e); keep Vitest out of it.
    include: ["src/**/*.{test,spec}.{js,jsx}"],
  },
});
