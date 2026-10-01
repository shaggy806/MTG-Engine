// One game of `bot-diff.mjs`: every seat on the working build, each decision
// also asked of the baseline's bot, disagreements posted back in words.

import { parentPort, workerData } from "node:worker_threads";

import { importBuild } from "./baseline-build.mjs";
import { tableFor } from "./bot-seating.mjs";

const { working, baseline, bot, players, seed } = workerData;
const W = await importBuild(working);
const B = await importBuild(baseline);
const regW = W.createDefaultRegistry();
const regB = B.createDefaultRegistry();
const make = (lib, registry, seat) =>
  bot === "v1" ? new lib.HeuristicBotController(seat, registry) : new lib.EvalBotController(seat, registry, {});

let decisions = 0;
let diffs = 0;
const { seats, decks } = tableFor(seed, players);
const controllers = {};
for (const seat of seats) {
  const current = make(W, regW, seat);
  const old = make(B, regB, seat);
  const act = current.act.bind(current);
  current.act = (view) => {
    const action = act(view);
    let theirs;
    try {
      theirs = old.act(view);
    } catch (error) {
      theirs = { type: `baseline threw: ${String(error?.message ?? error)}` };
    }
    decisions += 1;
    if (!W.sameMove(action, theirs)) {
      diffs += 1;
      const s = view.state;
      const awaiting = s.awaiting;
      parentPort.postMessage({
        type: "diff",
        row: {
          seed,
          turn: s.turn.number,
          step: s.turn.step,
          seat,
          life: s.players[seat].life,
          kind: awaiting?.kind ?? "priority",
          source: awaiting?.source !== undefined ? s.objects[awaiting.source]?.cardName : undefined,
          new: W.describeMove(s, action, regW),
          old: typeof theirs.type === "string" && theirs.type.startsWith("baseline threw")
            ? theirs.type
            : W.describeMove(s, theirs, regW),
        },
      });
    }
    return action;
  };
  controllers[seat] = current;
}

try {
  const game = W.Game.create({
    seed,
    registry: regW,
    controllers,
    mulligans: true,
    rules: W.COMMANDER_RULES,
    decks: seats.map((player, i) => ({ player, cards: decks[i].cards, commanders: decks[i].commanders })),
  });
  game.advance();
  parentPort.postMessage({ type: "done", decisions, diffs, turn: game.state.turn.number });
} catch (error) {
  parentPort.postMessage({ type: "error", error: String(error?.message ?? error) });
}
