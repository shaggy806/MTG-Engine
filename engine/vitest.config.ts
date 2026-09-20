import { defineConfig } from "vitest/config";

/**
 * The only thing configured here is the test timeout, and discovery is left
 * at vitest's defaults on purpose — the suite relies on those finding tests
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
  },
});
