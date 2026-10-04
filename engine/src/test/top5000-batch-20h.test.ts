/**
 * Top-5000 batch 20h. No engine change: each test pins the clause of one
 * card most likely to be wired wrong.
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
const setUp = (
  hand: readonly string[] = [],
  bHand: readonly string[] = [],
): { game: Game; a: ScriptedController; b: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill("Wastes")] },
      { player: B, cards: [...bHand, ...Array<string>(40).fill("Wastes")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
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

describe("top-5000 batch 20h — Genesis Hydra", () => {
  it("reveals the top X, puts a nonland permanent of mana value X or less in, and enters with X counters", () => {
    const { game } = setUp(["Genesis Hydra"]);
    lands(game, "Forest", 5);
    const giant = game.debugSpawn("Hill Giant", A, "library"); // mana value 4: too big at X = 3
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    const forest = game.debugSpawn("Forest", A, "library"); // on top: a land, never eligible
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Genesis Hydra"), targets: [], xValue: 3 });
    settle(game);
    expect(zone(game, bears)).toBe("battlefield");
    expect(zone(game, giant)).toBe("library");
    expect(zone(game, forest)).toBe("library");
    const hydra = named(game, "Genesis Hydra");
    expect(hydra).toHaveLength(1);
    expect(counters(game, hydra[0])).toBe(3);
  });
});

describe("top-5000 batch 20h — Teferi's Time Twist", () => {
  it("returns the card at the next end step, a creature with an additional +1/+1 counter", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const ring = spawn(game, "Sol Ring");
    game.debugApplyEffect(A, effectOf("Teferi's Time Twist"), [{ kind: "object", object: bears }]);
    settle(game);
    game.debugApplyEffect(A, effectOf("Teferi's Time Twist"), [{ kind: "object", object: ring }]);
    settle(game);
    expect(named(game, "Grizzly Bears")).toHaveLength(0);
    expect(named(game, "Sol Ring")).toHaveLength(0);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    const backBears = named(game, "Grizzly Bears");
    const backRing = named(game, "Sol Ring");
    expect(backBears).toHaveLength(1);
    expect(backRing).toHaveLength(1);
    expect(counters(game, backBears[0])).toBe(1);
    expect(counters(game, backRing[0])).toBe(0);
  });
});

describe("top-5000 batch 20h — Archfiend of Despair", () => {
  it("stops opponents gaining life, and at the end step doubles the life each one lost", () => {
    const { game } = setUp();
    spawn(game, "Archfiend of Despair");
    game.debugApplyEffect(A, { kind: "lose-life", amount: 3, who: "each-opponent" });
    game.debugApplyEffect(B, { kind: "gain-life", amount: 5 });
    settle(game);
    expect(life(game, B)).toBe(17);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(life(game, B)).toBe(14);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-5000 batch 20h — Mind's Dilation", () => {
  it("exiles the top of the caster's library on their first spell, and you cast it for free", () => {
    const { game, a, b } = setUp([], ["Lightning Bolt"]);
    spawn(game, "Mind's Dilation");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    spawn(game, "Mountain", B);
    game.debugSpawn("Grizzly Bears", B, "library");
    a.chooseCastNowFn = (_v, offer) =>
      offer.casts.length === 0
        ? null
        : { type: "cast-spell", player: A, card: offer.cards[0], targets: [], via: "effect", free: true };
    b.enqueue({
      type: "cast-spell",
      player: B,
      card: inHand(game, "Lightning Bolt", B),
      targets: [{ kind: "player", player: A }],
    });
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "postcombat-main");
    const bears = named(game, "Grizzly Bears");
    expect(bears).toHaveLength(1);
    expect(game.state.objects[bears[0]].controller).toBe(A);
    expect(life(game, A)).toBe(17);
  });
});

describe("top-5000 batch 20h — Murkfiend Liege", () => {
  it("pumps green and blue creatures cumulatively and untaps them on another player's untap step", () => {
    const { game } = setUp();
    const liege = spawn(game, "Murkfiend Liege");
    const elves = spawn(game, "Llanowar Elves");
    const aesi = spawn(game, "Aesi, Tyrant of Gyre Strait");
    const goblin = spawn(game, "Raging Goblin");
    expect(game.characteristics(liege).power).toBe(4);
    expect(game.characteristics(elves).power).toBe(2);
    expect(game.characteristics(aesi).power).toBe(7);
    expect(game.characteristics(goblin).power).toBe(1);
    for (const id of [liege, elves, goblin]) game.state.objects[id].tapped = true;
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(game.state.objects[liege].tapped).toBe(false);
    expect(game.state.objects[elves].tapped).toBe(false);
    expect(game.state.objects[goblin].tapped).toBe(true);
  });
});

describe("top-5000 batch 20h — Kuldotha Forgemaster", () => {
  it("can sacrifice itself as one of the three artifacts, and puts an artifact from the library in", () => {
    const { game } = setUp();
    const forge = spawn(game, "Kuldotha Forgemaster");
    const rings = [spawn(game, "Sol Ring"), spawn(game, "Sol Ring")];
    game.debugSpawn("Mind Stone", A, "library");
    game.dispatch({ type: "activate-ability", player: A, source: forge, abilityIndex: 0 });
    settle(game);
    expect(zone(game, forge)).toBe("graveyard");
    for (const ring of rings) expect(zone(game, ring)).toBe("graveyard");
    expect(named(game, "Mind Stone")).toHaveLength(1);
  });
});

describe("top-5000 batch 20h — Primevals' Glorious Rebirth", () => {
  it("needs a legendary creature to cast, and returns every legendary permanent card", () => {
    const { game } = setUp(["Primevals' Glorious Rebirth"]);
    lands(game, "Plains", 4);
    lands(game, "Swamp", 3);
    const card = inHand(game, "Primevals' Glorious Rebirth");
    const castable = (): boolean => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);
    expect(castable()).toBe(false);
    spawn(game, "Aesi, Tyrant of Gyre Strait");
    expect(castable()).toBe(true);
    const grimoire = game.debugSpawn("Grimoire of the Dead", A, "graveyard");
    const lord = game.debugSpawn("The Lord of Pain", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    settle(game);
    expect(zone(game, grimoire)).toBe("battlefield");
    expect(zone(game, lord)).toBe("battlefield");
    expect(zone(game, bears)).toBe("graveyard");
  });
});

describe("top-5000 batch 20h — Volatile Fault", () => {
  it("destroys an opponent's nonbasic land, lets them fetch a basic, and makes you a Treasure", () => {
    const { game, b } = setUp();
    const fault = spawn(game, "Volatile Fault");
    spawn(game, "Wastes");
    const tower = spawn(game, "Command Tower", B);
    b.chooseFromZoneFn = (_view, eligible, _min, max) => eligible.slice(0, max);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: fault,
      abilityIndex: 1,
      targets: [{ kind: "object", object: tower }],
    });
    settle(game);
    expect(zone(game, fault)).toBe("graveyard");
    expect(zone(game, tower)).toBe("graveyard");
    expect(named(game, "Wastes").filter((id) => game.state.objects[id].controller === B)).toHaveLength(1);
    expect(named(game, "Treasure Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 20h — Nadir Kraken", () => {
  it("pays {1} on a draw for a +1/+1 counter and a Tentacle", () => {
    const { game } = setUp();
    const kraken = spawn(game, "Nadir Kraken");
    spawn(game, "Island");
    game.debugApplyEffect(A, { kind: "draw", amount: 1 });
    settle(game);
    expect(counters(game, kraken)).toBe(1);
    expect(named(game, "Tentacle Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 20h — Bred for the Hunt", () => {
  it("draws only for a creature with a +1/+1 counter that deals combat damage to a player", () => {
    const { game, a } = setUp();
    spawn(game, "Bred for the Hunt");
    const big = spawn(game, "Grizzly Bears");
    game.state.objects[big].counters = { "+1/+1": 1 };
    const plain = spawn(game, "Grizzly Bears");
    a.declareAttackersFn = (view) =>
      view.state.turn.combatPhases === 1
        ? [
            { attacker: big, defender: B },
            { attacker: plain, defender: B },
          ]
        : [];
    const hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(15);
    expect(game.handOf(A).length).toBe(hand + 1);
  });
});

describe("top-5000 batch 20h — Freyalise, Llanowar's Fury", () => {
  it("−6 draws a card for each green creature you control", () => {
    const { game } = setUp();
    spawn(game, "Llanowar Elves");
    spawn(game, "Aesi, Tyrant of Gyre Strait");
    spawn(game, "Raging Goblin");
    spawn(game, "Llanowar Elves", B);
    const ult = registry.get("Freyalise, Llanowar's Fury")!.activated[2].effect!;
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, ult);
    settle(game);
    expect(game.handOf(A).length).toBe(hand + 2);
  });
});

describe("top-5000 batch 20h — Pashalik Mons", () => {
  it("deals 1 damage for itself and for each other Goblin of yours that dies, not for other creatures", () => {
    const { game, a } = setUp();
    spawn(game, "Pashalik Mons");
    spawn(game, "Goblin Token");
    spawn(game, "Grizzly Bears");
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    game.debugApplyEffect(A, { kind: "destroy-all", filter: { type: "creature" } });
    settle(game);
    expect(life(game, B)).toBe(18);
  });
});
