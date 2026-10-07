// A vitest reporter that writes the run's progress, one unit per test file,
// through `progress.mjs`, for the job-progress mod to draw. It sits beside the
// default reporter in `vitest.config.ts` and prints nothing itself.

import { progress } from "./progress.mjs";

export class ProgressReporter {
  constructor(label = "engine tests") {
    this.label = label;
    this.bar = null;
  }

  onTestRunStart(specifications) {
    this.bar = progress(this.label, specifications.length);
  }

  onTestModuleEnd(testModule) {
    this.bar?.tick({ failed: testModule.state() === "failed" });
  }

  onTestRunEnd() {
    this.bar?.finish();
    this.bar = null;
  }
}
