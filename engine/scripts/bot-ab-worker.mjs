// One game of `bot-ab.mjs`: the measured seat on the working build, every
// other seat on the baseline, the game itself run by the working build.

import { parentPort, workerData } from "node:worker_threads";

import { importBuild } from "./baseline-build.mjs";
import { tableFor } from "./bot-seating.mjs";

const { working, baseline, bot, players } = workerData;
const W = await importBuild(working);
const B = await importBuild(baseline);
const regW = W.createDefaultRegistry();
const regB = B.createDefaultRegistry();

const make = (lib, registry, seat) =>
  bot === "v1" ? new lib.HeuristicBotController(seat, registry) : new lib.EvalBotController(seat, registry, {});

parentPort.once("message", (seed) => {
  const { seats, measuredSeat, decks } = tableFor(seed, players);
  const controllers = {};
  for (const seat of seats) {
    controllers[seat] = seat === measuredSeat ? make(W, regW, seat) : make(B, regB, seat);
  }
  try {
    const game = W.Game.create({
      seed,
      registry: regW,
      controllers,
      mulligans: true,
      rules: W.COMMANDER_RULES,
      decks: seats.map((player, i) => ({ player, cards: decks[i].cards, commander: decks[i].commander })),
    });
    game.advance();
    const winner = game.winner;
    parentPort.postMessage({
      seed,
      outcome: winner === null ? "draw" : winner === measuredSeat ? "win" : "loss",
      seat: measuredSeat,
      turns: game.state.turn.number,
    });
  } catch (error) {
    parentPort.postMessage({ seed, outcome: "error", error: String(error?.message ?? error) });
  }
});
