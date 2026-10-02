// Heap caps for the bot scripts' worker threads.
//
// A searching bot (v2) copies the whole game state for every simulation, so
// a game makes a great deal of short-lived garbage, and V8 grows a worker's
// heap into whatever it's allowed rather than collecting sooner. Measured on
// 2026-10-02 (one bench game, seed 5, 45 turns): ~180 MB live, but 1,096 MB
// resident uncapped — `bot:ab` with 18 workers reached 18.7 GB and the
// machine ran out of memory. Capped at 512 MB the same game peaked at 438 MB,
// with the same result in the same time. 768 MB leaves headroom for big late
// boards; a game that really needs more fails with ERR_WORKER_OUT_OF_MEMORY,
// recorded against its seed like any other error.

export const WORKER_LIMITS = Object.freeze({
  maxOldGenerationSizeMb: 768,
  maxYoungGenerationSizeMb: 32,
});
