// Worker half of `random-demo.mjs`: plays one random game per request and
// posts back a summary.
//
// It lives in a worker thread for one reason — so the parent can *kill* a game
// that never finishes. A runaway loop inside a single `tick()` is synchronous
// and never yields, so no timer in the same thread can interrupt it, and
// `Game.advance`'s tick budget can't either (it only counts ticks that
// return). `Worker.terminate()` stops the thread wherever it is.

import { parentPort } from "node:worker_threads";

import { Game, RandomController, createRng, setComputedCacheCheck } from "../dist/index.js";

// MTG_CACHE_CHECK=1 turns every computed-cache hit into a recompute +
// deep-compare that throws on divergence — the empirical verification that
// every mutation inside a cache region invalidates (see characteristics.ts).
if (process.env.MTG_CACHE_CHECK) setComputedCacheCheck(true);

// Each game's decks come with its seed: they're built per seed (fuzz-decks.mjs).
parentPort.on("message", ({ seed, seats }) => {
  const startedAt = Date.now();
  try {
    const rng = createRng(seed * 7919);
    const pick = () => rng.next();
    const game = Game.create({
      seed,
      mulligans: true,
      controllers: Object.fromEntries(
        seats.map(({ player }) => [player, new RandomController(player, pick)]),
      ),
      decks: seats,
    });
    game.advance();
    parentPort.postMessage({
      seed,
      ok: true,
      winner: game.winner ?? "draw",
      reason: game.state.result.reason,
      turns: game.state.turn.number,
      events: game.events.length,
      ms: Date.now() - startedAt,
    });
  } catch (error) {
    parentPort.postMessage({
      seed,
      ok: false,
      error: error instanceof Error ? (error.stack ?? error.message) : String(error),
      ms: Date.now() - startedAt,
    });
  }
});
