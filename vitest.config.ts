import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  esbuild: {
    // The app is compiled by Next with the automatic JSX runtime. Vitest has
    // to match that or rendering a page component throws "React is not defined".
    jsx: "automatic",
  },
  test: {
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
