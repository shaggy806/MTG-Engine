// A Playwright reporter that writes the run's progress, one unit per test,
// through the engine's `progress.mjs`, for the job-progress mod to draw (as
// `engine/scripts/vitest-progress.mjs` does for the engine suite). It sits
// beside the list reporter in `playwright.config.ts` and prints nothing itself.

import { progress } from '../../engine/scripts/progress.mjs'

export default class ProgressReporter {
  bar = null

  printsToStdio() {
    return false
  }

  onBegin(_config, suite) {
    this.bar = progress('e2e', suite.allTests().length)
  }

  onTestEnd(test, result) {
    // A test is done on its last attempt: one that passed, or one with no
    // retry left (CI retries a failure once).
    if (result.status !== 'passed' && result.status !== 'skipped' && result.retry < test.retries) return
    this.bar?.tick({ failed: test.outcome() === 'unexpected' })
  }

  onEnd() {
    this.bar?.finish()
    this.bar = null
  }
}
