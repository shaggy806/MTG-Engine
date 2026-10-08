// One game per message for `deck-winrates.mjs`: four (or `players`) of the
// starter decks, every seat the same bot, played the way a live room plays —
// Commander rules, mulligans on. Reports the winner's deck and the order the
// others were knocked out, so a deck's average finish can be read as well as
// its wins.

import { parentPort, workerData } from "node:worker_threads";
import { performance } from "node:perf_hooks";

import {
  COMMANDER_RULES,
  EvalBotController,
  Game,
  HeuristicBotController,
  SAMPLE_DECKS,
  asPlayerId,
  createDefaultRegistry,
} from "../dist/index.js";
import { DECK_POOL } from "./deck-pool.mjs";

const registry = createDefaultRegistry();
const SEATS = ["alice", "bob", "carol", "dave"].map(asPlayerId);
const { bot } = workerData;

parentPort.on("message", ({ seed, decks: deckIndices }) => {
  const seats = SEATS.slice(0, deckIndices.length);
  const decks = deckIndices.map((i) => DECK_POOL[i]);
  const controllers = Object.fromEntries(
    seats.map((seat) => [
      seat,
      bot === "v1" ? new HeuristicBotController(seat, registry) : new EvalBotController(seat, registry),
    ]),
  );
  const startedAt = performance.now();
  try {
    const game = Game.create({
      seed,
      registry,
      controllers,
      mulligans: true,
      rules: COMMANDER_RULES,
      decks: seats.map((player, i) => ({ player, cards: decks[i].cards, commanders: decks[i].commanders })),
    });
    game.advance();
    const winner = game.winner;
    const deckOf = (p) => decks[seats.indexOf(p)].name;
    parentPort.postMessage({
      seed,
      decks: decks.map((d) => d.name),
      winner: winner === null ? null : deckOf(winner),
      // First knocked out first.
      eliminated: game.eventsOfType("player-lost").map((e) => deckOf(e.player)),
      turns: game.state.turn.number,
      ms: Math.round(performance.now() - startedAt),
    });
  } catch (error) {
    parentPort.postMessage({ seed, decks: decks.map((d) => d.name), error: String(error?.message ?? error) });
  }
});
