import { defineConfig } from "vitest/config";

import { ProgressReporter } from "../engine/scripts/vitest-progress.mjs";

// vitest's defaults, plus a progress file the job-progress Claude Code mod
// draws as a bar (engine/scripts/progress.mjs).
export default defineConfig({
  test: {
    reporters: ["default", new ProgressReporter("server tests")],
  },
});
