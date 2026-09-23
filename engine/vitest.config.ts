import { defineConfig } from "vitest/config";

/**
 * Two things are configured here, the test timeout and module isolation
 * (below), and discovery is left at vitest's defaults on purpose — the suite relies on those finding tests
 * wherever they sit (`src/test/*.test.ts`, plus `cards/pool.test.ts` beside
 * the layout it guards).
 *
 * Why raise it: vitest's 5s default is sized for async work that might hang
 * on I/O. Nothing here does I/O — these are CPU-bound simulations, and a
 * handful legitimately run for seconds (a random-vs-random fuzz over eight
 * seeds, a full bot-vs-bot game). The default left those sitting at 60-90%
 * of the limit on a quiet machine, so they passed alone and failed whenever
 * the machine was busy with something else: `seam.test.ts`'s
 * random-vs-random, a deterministic test over fixed seeds, came in at 3.9s
 * idle and blew the limit at 5.1s during a concurrent typecheck.
 *
 * The answer had been a per-file constant on whichever test was noticed to
 * be slow (`bot-plan`'s `TIMEOUT`, `eval-bot`'s `GAME_TIMEOUT_MS`), which
 * covers a test only once it has already flaked for someone. A floor here
 * covers the ones nobody has thought about yet, including future ones.
 *
 * 30s rather than something larger because a hung test is a real failure
 * mode in this suite (an unbounded loop in `tick()` is exactly what the
 * fuzzer hunts for), and waiting minutes to be told about one is its own
 * cost. The two genuine long-runners keep their own larger overrides.
 */
export default defineConfig({
  test: {
    testTimeout: 30_000,
    // One module graph per worker, not one per test file. Every test imports
    // the card barrel (~850 modules), and re-importing it for each of ~190
    // files was most of the suite's wall time: 4m30s isolated, under a minute
    // shared, same results. Safe because nothing here mocks, spies, stubs
    // globals or fakes timers, and the engine's only module-level state (the
    // computed-value cache in `characteristics.ts`) is reset by every region
    // that opens it. A test that needs `vi.mock` or other module-level
    // patching would need isolation back, in its own project.
    isolate: false,
  },
});
