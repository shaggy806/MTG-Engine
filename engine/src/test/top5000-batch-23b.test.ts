/**
 * Top-5000 batch 23b. No engine change: every card is existing vocabulary.
 * These pin the clauses most likely to be wired wrong — a token that deals
 * damage as it leaves (Weapons Manufacturing's Munitions), "another nontoken
 * artifact creature or Vehicle" (Canoptek Spyder), the monarch's 7 in place
 * of 2 (Court of Ire), "mill three, then return a land" (Blossoming
 * Tortoise), X read off the power it died with (Rampant Rejuvenator), the
 * intervening-if and the activation gate (Luminarch Ascension), "that
 * player controls" (Scion of Calamity), face-down exile of an opponent's
 * cards (Expensive Taste) and the prevention shield (Eiganjo Castle).
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: true });
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const settle = (game: Game): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [0] });
    } else {
      game.advanceUntil(quiet);
    }
  }
  throw new Error("settle: still unresolved");
};
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;

describe("top-5000 batch 23b — Weapons Manufacturing", () => {
  it("makes Munitions for a nontoken artifact only, and Munitions deals 2 as it leaves", () => {
    const { game } = setUp();
    spawn(game, "Weapons Manufacturing");
    enter(game, "Sol Ring");
    settle(game);
    expect(named(game, "Munitions Token")).toHaveLength(1);
    // A token artifact (and the Munitions itself) makes none.
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 });
    settle(game);
    expect(named(game, "Munitions Token")).toHaveLength(1);
    const munitions = named(game, "Munitions Token")[0];
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: munitions }]);
    settle(game);
    expect(named(game, "Munitions Token")).toHaveLength(0);
    // 2 damage to whichever target was picked: a player, here.
    expect(life(game, A) + life(game, B)).toBe(38);
  });
});

describe("top-5000 batch 23b — Canoptek Spyder", () => {
  it("draws for another nontoken artifact creature or a Vehicle, not for itself or a plain creature or artifact", () => {
    const { game } = setUp();
    const hand = (): number => game.handOf(A).length;
    const start = hand();
    enter(game, "Canoptek Spyder");
    settle(game);
    expect(hand()).toBe(start);
    enter(game, "Grizzly Bears");
    enter(game, "Sol Ring");
    settle(game);
    expect(hand()).toBe(start);
    enter(game, "Ornithopter");
    settle(game);
    expect(hand()).toBe(start + 1);
  });
});

describe("top-5000 batch 23b — Court of Ire", () => {
  it("deals 7 while you're the monarch, 2 once you aren't", () => {
    const { game } = setUp();
    const court = enter(game, "Court of Ire");
    settle(game);
    expect(game.state.monarch).toBe(A);
    const upkeep = registry.get("Court of Ire")!.triggered[1].effect!;
    game.debugApplyEffect(A, upkeep, [{ kind: "player", player: B }], { source: court });
    settle(game);
    expect(life(game, B)).toBe(13);
    game.state.monarch = B;
    game.debugApplyEffect(A, upkeep, [{ kind: "player", player: B }], { source: court });
    settle(game);
    expect(life(game, B)).toBe(11);
  });
});

describe("top-5000 batch 23b — Blossoming Tortoise", () => {
  it("mills three, then returns one land card to the battlefield tapped", () => {
    const { game } = setUp([], "Forest");
    enter(game, "Blossoming Tortoise");
    settle(game);
    const forests = named(game, "Forest");
    expect(forests).toHaveLength(1);
    expect(game.state.objects[forests[0]].tapped).toBe(true);
    expect(game.graveyardOf(A)).toHaveLength(2);
  });
});

describe("top-5000 batch 23b — Rampant Rejuvenator", () => {
  it("enters with two counters, and fetches as many basics as the power it died with", () => {
    const { game, a } = setUp([], "Forest");
    a.chooseFromZoneFn = (_view, eligible, _min, max) => eligible.slice(0, max);
    const hydra = spawn(game, "Rampant Rejuvenator");
    expect(counters(game, hydra)).toBe(2);
    game.state.objects[hydra].counters = { "+1/+1": 3 };
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: hydra }]);
    settle(game);
    expect(zone(game, hydra)).toBe("graveyard");
    expect(named(game, "Forest")).toHaveLength(3);
  });
});

describe("top-5000 batch 23b — Luminarch Ascension", () => {
  it("gets a quest counter at an opponent's end step if you lost no life that turn", () => {
    const { game } = setUp();
    const ascension = spawn(game, "Luminarch Ascension");
    // Your own end step (turn 1) doesn't count; Bob's (turn 2) does.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    settle(game);
    expect(counters(game, ascension, "quest")).toBe(1);
  });

  it("gets none if you lost life that turn", () => {
    const { game } = setUp();
    const ascension = spawn(game, "Luminarch Ascension");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    game.debugApplyEffect(A, { kind: "lose-life", amount: 1, who: "you" });
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    settle(game);
    expect(counters(game, ascension, "quest")).toBe(0);
  });

  it("makes an Angel only with four or more quest counters", () => {
    const { game } = setUp();
    const ascension = spawn(game, "Luminarch Ascension");
    spawn(game, "Plains");
    spawn(game, "Plains");
    const canMake = (): boolean =>
      game
        .legalActions(A)
        .some((x) => x.kind === "activate-ability" && x.source === ascension && x.abilityIndex === 0);
    game.state.objects[ascension].counters = { quest: 3 };
    expect(canMake()).toBe(false);
    game.state.objects[ascension].counters = { quest: 4 };
    expect(canMake()).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: ascension, abilityIndex: 0, targets: [] });
    settle(game);
    expect(named(game, "4/4 Angel Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 23b — Scion of Calamity", () => {
  it("destroys an artifact the damaged player controls, never one of yours", () => {
    const { game, a } = setUp();
    // Alice's ring comes first, so a target spec that let it in would pick it.
    const mine = spawn(game, "Sol Ring");
    const theirs = spawn(game, "Sol Ring", B);
    const scion = spawn(game, "Scion of Calamity");
    a.declareAttackersFn = () => [{ attacker: scion, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(15);
    expect(zone(game, theirs)).toBe("graveyard");
    expect(zone(game, mine)).toBe("battlefield");
  });
});

describe("top-5000 batch 23b — Expensive Taste", () => {
  it("exiles the top two of the opponent's library face down, for you to look at and play", () => {
    const { game } = setUp();
    const swamp = game.debugSpawn("Swamp", B, "library");
    const bears = game.debugSpawn("Grizzly Bears", B, "library");
    game.debugApplyEffect(A, effectOf("Expensive Taste"), [{ kind: "player", player: B }]);
    settle(game);
    for (const id of [bears, swamp]) {
      expect(zone(game, id)).toBe("exile");
      expect(game.state.objects[id].exiledFaceDown?.lookers).toEqual([A]);
    }
    spawn(game, "Forest");
    spawn(game, "Forest");
    const playable = (card: ObjectId): boolean =>
      game.legalActions(A).some((x) => (x.kind === "cast-spell" || x.kind === "play-land") && x.card === card);
    expect(playable(bears)).toBe(true);
    expect(playable(swamp)).toBe(true);
  });
});

describe("top-5000 batch 23b — Eiganjo Castle", () => {
  it("prevents the next 2 damage to a legendary creature", () => {
    const { game } = setUp();
    spawn(game, "Plains");
    const castle = spawn(game, "Eiganjo Castle");
    const kokusho = spawn(game, "Kokusho, the Evening Star");
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: castle,
      abilityIndex: 1,
      targets: [{ kind: "object", object: kokusho }],
    });
    settle(game);
    game.debugApplyEffect(B, { kind: "damage", amount: 3, target: 0 }, [{ kind: "object", object: kokusho }], {
      source: bears,
    });
    settle(game);
    expect(game.state.objects[kokusho].damageMarked).toBe(1);
  });
});
