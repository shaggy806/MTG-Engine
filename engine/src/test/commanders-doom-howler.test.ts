import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

// Doctor Doom, King of Latveria (a filtered "one or more" discard trigger,
// connive) and Captain Howler, Sea Scourge (`delayed-trigger` at
// `{ dealsCombatDamage }`: "whenever that creature deals combat damage to a
// player this turn").

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = () => {
  const controllers = { [A]: new ScriptedController(A), [B]: new ScriptedController(B) };
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40 },
    controllers,
    decks: [A, B].map((player) => ({ player, cards: Array(40).fill("Plains") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, c: controllers as Record<PlayerId, ScriptedController> };
};

const quiet = (game: Game) =>
  game.advanceUntil(
    (s) => s.zones.shared.stack.length === 0 && s.pendingTriggers.length === 0 && s.awaiting === null,
  );
const hand = (game: Game, p: PlayerId) => game.state.zones.perPlayer[p].hand;
const toPostcombat = (s: GameState) => s.turn.number === 1 && s.turn.step === "postcombat-main";

describe("Doctor Doom, King of Latveria", () => {
  it("discarding lands together drains each opponent 2, once", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Doctor Doom, King of Latveria", A, "battlefield");
    c[A].chooseDiscardsFn = (h, count) => h.filter((o) => o.cardName === "Plains").slice(0, count).map((o) => o.id);
    game.debugApplyEffect(A, { kind: "discard", target: "you", amount: 2 });
    quiet(game);
    expect(game.state.players[B].life).toBe(38);
  });

  it("nonland discards don't drain", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Doctor Doom, King of Latveria", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", A, "hand");
    c[A].chooseDiscardsFn = () => [giant];
    game.debugApplyEffect(A, { kind: "discard", target: "you", amount: 1 });
    quiet(game);
    expect(game.state.players[B].life).toBe(40);
  });

  it("at the beginning of combat a Villain gains menace and connives", () => {
    const { game, c } = mkGame();
    const doom = game.debugSpawn("Doctor Doom, King of Latveria", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", A, "hand");
    c[A].chooseDiscardsFn = () => [giant];
    game.advanceUntil(
      (s) => s.turn.step === "begin-combat" && s.zones.shared.stack.length === 0 && s.pendingTriggers.length === 0,
    );
    game.advanceUntil((s) => s.objects[giant].zone === "graveyard");
    quiet(game);
    expect([...game.characteristics(doom).keywords]).toContain("menace");
    expect(game.state.objects[doom].counters["+1/+1"]).toBe(1);
  });
});

describe("Captain Howler, Sea Scourge", () => {
  const setup = () => {
    const { game, c } = mkGame();
    game.debugSpawn("Captain Howler, Sea Scourge", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    c[A].chooseTargetsFn = () => [{ kind: "object", object: bears }];
    c[A].chooseDiscardsFn = (h, count) => h.slice(0, count).map((o) => o.id);
    c[A].declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.debugApplyEffect(A, { kind: "discard", target: "you", amount: 2 });
    quiet(game);
    return { game, bears };
  };

  it("+2/+0 for each card discarded, and a card when that creature connects", () => {
    const { game, bears } = setup();
    expect(game.characteristics(bears).power).toBe(6);
    const before = hand(game, A).length;
    game.advanceUntil(toPostcombat);
    expect(game.state.players[B].life).toBe(34);
    expect(hand(game, A)).toHaveLength(before + 1);
  });

  it("fires each time — double strike draws two", () => {
    const { game, bears } = setup();
    game.debugApplyEffect(A, { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" }, [
      { kind: "object", object: bears },
    ]);
    const before = hand(game, A).length;
    game.advanceUntil(toPostcombat);
    expect(hand(game, A)).toHaveLength(before + 2);
  });

  it("only this turn", () => {
    const { game } = setup();
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.delayedTriggers.filter((t) => typeof t.at === "object")).toHaveLength(0);
  });
});
