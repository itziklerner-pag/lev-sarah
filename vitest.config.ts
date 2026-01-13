import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: {
      deps: {
        inline: ["convex-test"],
      },
    },
    include: ["convex/**/*.test.ts", "tests/**/*.test.ts"],
    testTimeout: 30000,
    // Suppress noisy stderr output from convex-test
    silent: false,
    onConsoleLog(log, type) {
      // Filter out the "Convex functions should not directly call" warnings
      // These are expected when testing with auth helpers
      if (log.includes("Convex functions should not directly call")) {
        return false;
      }
      return true;
    },
  },
});
