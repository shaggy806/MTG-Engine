import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

// Connive (rule 701.50): the permanent's controller draws N, discards N,
// then puts a +1/+1 counter on it for each nonland card discarded — Raffine,
// Scheming Seer, Ledger Shredder, Spymaster's Vault.

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
const plusOnes = (game: Game, id: ObjectId) => game.state.objects[id].counters["+1/+1"] ?? 0;
const hand = (game: Game, p: PlayerId) => game.state.zones.perPlayer[p].hand;

describe("connive", () => {
  it("draw, discard, and a counter for a nonland card discarded", () => {
    const { game, c } = mkGame();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", A, "hand");
    const before = hand(game, A).length;
    c[A].chooseDiscardsFn = () => [giant];
    game.debugApplyEffect(A, { kind: "connive", target: 0 }, [{ kind: "object", object: bears }]);
    quiet(game);
    expect(game.state.objects[giant].zone).toBe("graveyard");
    expect(hand(game, A)).toHaveLength(before);
    expect(plusOnes(game, bears)).toBe(1);
  });

  it("no counter for a land discarded", () => {
    const { game, c } = mkGame();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugSpawn("Hill Giant", A, "hand");
    c[A].chooseDiscardsFn = (h) => [h.find((o) => o.cardName === "Plains")!.id];
    game.debugApplyEffect(A, { kind: "connive", target: 0 }, [{ kind: "object", object: bears }]);
    quiet(game);
    expect(plusOnes(game, bears)).toBe(0);
  });

  it("connive N counts each nonland card of its own discards", () => {
    const { game, c } = mkGame();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const giants = [game.debugSpawn("Hill Giant", A, "hand"), game.debugSpawn("Hill Giant", A, "hand")];
    const plains = hand(game, A).find((id) => game.state.objects[id].cardName === "Plains")!;
    c[A].chooseDiscardsFn = () => [...giants, plains];
    game.debugApplyEffect(A, { kind: "connive", target: 0, amount: 3 }, [{ kind: "object", object: bears }]);
    quiet(game);
    expect(plusOnes(game, bears)).toBe(2);
  });

  it("the conniving permanent's controller draws and discards, not the effect's", () => {
    const { game, c } = mkGame();
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const giant = game.debugSpawn("Hill Giant", B, "hand");
    const [handA, handB] = [hand(game, A).length, hand(game, B).length];
    c[B].chooseDiscardsFn = () => [giant];
    game.debugApplyEffect(A, { kind: "connive", target: 0 }, [{ kind: "object", object: bears }]);
    quiet(game);
    expect(hand(game, A)).toHaveLength(handA);
    expect(hand(game, B)).toHaveLength(handB);
    expect(game.state.objects[giant].zone).toBe("graveyard");
    expect(plusOnes(game, bears)).toBe(1);
  });
});

describe("connive cards", () => {
  it("Raffine: target attacking creature connives X, X the number of attackers", () => {
    const { game, c } = mkGame();
    const raffine = game.debugSpawn("Raffine, Scheming Seer", A, "battlefield", { summoningSick: false });
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    const elves = game.debugSpawn("Llanowar Elves", A, "battlefield", { summoningSick: false });
    const giants = [0, 1, 2].map(() => game.debugSpawn("Hill Giant", A, "hand"));
    c[A].declareAttackersFn = () => [raffine, bears, elves].map((attacker) => ({ attacker, defender: B }));
    c[A].chooseTargetsFn = () => [{ kind: "object", object: bears }];
    c[A].chooseDiscardsFn = (_h, count) => giants.slice(0, count);
    const before = hand(game, A).length;
    game.advanceUntil(
      (s: GameState) => s.turn.step === "declare-attackers" && s.zones.shared.stack.length === 0 && s.awaiting === null,
    );
    expect(hand(game, A)).toHaveLength(before);
    expect(plusOnes(game, bears)).toBe(3);
  });

  it("Ledger Shredder connives on a player's second spell each turn", () => {
    const { game, c } = mkGame();
    const shredder = game.debugSpawn("Ledger Shredder", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", A, "hand");
    c[A].chooseDiscardsFn = () => [giant];
    const thopters = [game.debugSpawn("Ornithopter", A, "hand"), game.debugSpawn("Ornithopter", A, "hand")];
    game.dispatch({ type: "cast-spell", player: A, card: thopters[0] });
    quiet(game);
    expect(plusOnes(game, shredder)).toBe(0);
    game.dispatch({ type: "cast-spell", player: A, card: thopters[1] });
    quiet(game);
    expect(plusOnes(game, shredder)).toBe(1);
  });

  it("Spymaster's Vault: connives X, X the creatures that died this turn — anyone's", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Swamp", A, "battlefield");
    const vault = game.debugSpawn("Spymaster's Vault", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const victims = [game.debugSpawn("Hill Giant", A, "battlefield"), game.debugSpawn("Hill Giant", B, "battlefield")];
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: victims[0] }]);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: victims[1] }]);
    quiet(game);
    const giants = [game.debugSpawn("Hill Giant", A, "hand"), game.debugSpawn("Hill Giant", A, "hand")];
    c[A].chooseDiscardsFn = () => giants;
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: vault,
      abilityIndex: 1,
      targets: [{ kind: "object", object: bears }],
    });
    quiet(game);
    expect(plusOnes(game, bears)).toBe(2);
  });
});
