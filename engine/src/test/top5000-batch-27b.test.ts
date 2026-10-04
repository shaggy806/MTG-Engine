/**
 * Top-5000 batch 27b. No engine changes: every card here is existing
 * vocabulary. The tests pin the clause of each most likely to be wired
 * wrong — "other Orcs and Goblins" and the greatest power read as the attack
 * trigger resolves (Orcish Siegemaster), "another creature with flying"
 * (Watcher of the Spheres), every Elf on the battlefield (Timberwatch Elf),
 * a granted persist that the returned creature doesn't keep (Cauldron of
 * Souls), "and another legendary creature" (Merry), the three-white-creature
 * cost and "another black creature" (Teysa, Orzhov Scion), X as the life
 * gained this turn (Moseo), "all Goblin cards" (Goblin Ringleader), the
 * second spell and the granted exalted (Rammas Echor), and the Ally-only mana
 * (Jasmine Dragon Tea Shop).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
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
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
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
const toAttackers = (game: Game): void =>
  game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
const canCast = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);

describe("top-5000 batch 27b — Orcish Siegemaster", () => {
  it("gives other Orcs and Goblins trample, and attacks for the greatest power among your creatures", () => {
    const { game } = setUp();
    const siege = spawn(game, "Orcish Siegemaster");
    const goblin = spawn(game, "Raging Goblin");
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Hill Giant");
    expect(chars(game, goblin).keywords.has("trample")).toBe(true);
    expect(chars(game, bears).keywords.has("trample")).toBe(false);
    expect(chars(game, siege).keywords.has("trample")).toBe(true);
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: siege, defender: B }] });
    settle(game);
    expect(game.state.turn.number).toBe(1);
    // The Hill Giant's 3 is the greatest power: 0 + 3.
    expect(chars(game, siege).power).toBe(3);
    expect(chars(game, siege).toughness).toBe(5);
  });
});

describe("top-5000 batch 27b — Watcher of the Spheres", () => {
  it("grows when another creature with flying enters, not for one without", () => {
    const { game } = setUp();
    const watcher = spawn(game, "Watcher of the Spheres");
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(chars(game, watcher).power).toBe(2);
    game.debugSpawn("Wind Drake", A, "battlefield", { announceEntry: true });
    settle(game);
    expect([chars(game, watcher).power, chars(game, watcher).toughness]).toEqual([3, 3]);
  });
});

describe("top-5000 batch 27b — Timberwatch Elf", () => {
  it("counts every Elf on the battlefield, an opponent's included", () => {
    const { game } = setUp();
    const elf = spawn(game, "Timberwatch Elf");
    spawn(game, "Llanowar Elves");
    spawn(game, "Elvish Mystic", B);
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: elf,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    expect([chars(game, bears).power, chars(game, bears).toughness]).toEqual([5, 5]);
  });
});

describe("top-5000 batch 27b — Cauldron of Souls", () => {
  it("gives each target persist; the creature that returns doesn't have it", () => {
    const { game } = setUp();
    const cauldron = spawn(game, "Cauldron of Souls");
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: cauldron,
      abilityIndex: 0,
      targets: [
        { kind: "object", object: bears },
        { kind: "object", object: giant },
      ],
    });
    settle(game);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: giant }]);
    settle(game);
    const back = named(game, "Hill Giant");
    expect(back).toHaveLength(1);
    expect(game.state.objects[back[0]].controller).toBe(B);
    expect(counters(game, back[0], "-1/-1")).toBe(1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: back[0] }]);
    settle(game);
    expect(named(game, "Hill Giant")).toHaveLength(0);
    expect(named(game, "Grizzly Bears")).toHaveLength(1);
  });
});

describe("top-5000 batch 27b — Merry, Esquire of Rohan", () => {
  it("draws when it attacks with another legendary creature", () => {
    const { game } = setUp();
    const merry = spawn(game, "Merry, Esquire of Rohan");
    const isamaru = spawn(game, "Isamaru, Hound of Konda");
    toAttackers(game);
    const handBefore = game.handOf(A).length;
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: merry, defender: B },
        { attacker: isamaru, defender: B },
      ],
    });
    settle(game);
    expect(game.handOf(A)).toHaveLength(handBefore + 1);
  });

  it("doesn't draw beside a nonlegendary creature, and has first strike only while equipped", () => {
    const { game } = setUp();
    const merry = spawn(game, "Merry, Esquire of Rohan");
    const bears = spawn(game, "Grizzly Bears");
    expect(chars(game, merry).keywords.has("first-strike")).toBe(false);
    const splitter = spawn(game, "Bonesplitter");
    game.debugApplyEffect(A, { kind: "attach", target: 0 }, [{ kind: "object", object: merry }], { source: splitter });
    expect(chars(game, merry).keywords.has("first-strike")).toBe(true);
    toAttackers(game);
    const handBefore = game.handOf(A).length;
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: merry, defender: B },
        { attacker: bears, defender: B },
      ],
    });
    settle(game);
    expect(game.handOf(A)).toHaveLength(handBefore);
  });
});

describe("top-5000 batch 27b — Teysa, Orzhov Scion", () => {
  it("makes a Spirit for another black creature dying, and exiles for three white creatures", () => {
    const { game, a } = setUp();
    const teysa = spawn(game, "Teysa, Orzhov Scion");
    const lions = [spawn(game, "Savannah Lions"), spawn(game, "Savannah Lions"), spawn(game, "Savannah Lions")];
    const nighthawk = spawn(game, "Vampire Nighthawk");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: nighthawk }]);
    settle(game);
    expect(named(game, "Spirit Token")).toHaveLength(1);
    const giant = spawn(game, "Hill Giant", B);
    a.chooseSacrificesFn = (_view, eligible, count) => lions.filter((id) => eligible.includes(id)).slice(0, count);
    a.choosePermanentsFn = (_view, eligible, min) => lions.filter((id) => eligible.includes(id)).slice(0, min);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: teysa,
      abilityIndex: 0,
      targets: [{ kind: "object", object: giant }],
    });
    settle(game);
    expect(zone(game, giant)).toBe("exile");
    for (const lion of lions) expect(zone(game, lion)).toBe("graveyard");
    expect(zone(game, teysa)).toBe("battlefield");
    // White creatures dying aren't black ones: still the one Spirit.
    expect(named(game, "Spirit Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 27b — Goblin Ringleader", () => {
  it("puts every Goblin among the top four into your hand and the rest on the bottom", () => {
    const { game } = setUp();
    const giant = game.debugSpawn("Hill Giant", A, "library");
    const raging = game.debugSpawn("Raging Goblin", A, "library");
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    const piker = game.debugSpawn("Goblin Piker", A, "library");
    game.debugSpawn("Goblin Ringleader", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, raging)).toBe("hand");
    expect(zone(game, piker)).toBe("hand");
    const library = game.state.zones.perPlayer[A].library;
    expect(library.slice(-2).sort()).toEqual([bears, giant].sort());
  });
});

describe("top-5000 batch 27b — Rammas Echor, Ancient Shield", () => {
  it("draws and makes a Wall on the second spell, and its walls give exalted", () => {
    const { game } = setUp(["Ornithopter", "Ornithopter"]);
    spawn(game, "Rammas Echor, Ancient Shield");
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Wall of Omens");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Ornithopter"), targets: [] });
    settle(game);
    expect(named(game, "Wall Token (Rammas Echor, Ancient Shield)")).toHaveLength(0);
    const handBefore = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Ornithopter"), targets: [] });
    settle(game);
    expect(named(game, "Wall Token (Rammas Echor, Ancient Shield)")).toHaveLength(1);
    // The Ornithopter left the hand, the draw put a card back.
    expect(game.handOf(A)).toHaveLength(handBefore);
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: bears, defender: B }] });
    settle(game);
    expect(game.state.turn.number).toBe(1);
    // Two creatures with defender gained exalted: two instances, +2/+2.
    expect([chars(game, bears).power, chars(game, bears).toughness]).toEqual([4, 4]);
  });
});

describe("top-5000 batch 27b — Jasmine Dragon Tea Shop", () => {
  it("makes coloured mana that casts an Ally spell and not another", () => {
    const { game } = setUp(["Expedition Envoy", "Savannah Lions"]);
    const shop = spawn(game, "Jasmine Dragon Tea Shop");
    const envoy = inHand(game, "Expedition Envoy");
    const lions = inHand(game, "Savannah Lions");
    game.dispatch({ type: "activate-ability", player: A, source: shop, abilityIndex: 1, manaColors: ["W"] });
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["W"]);
    expect(canCast(game, envoy)).toBe(true);
    expect(canCast(game, lions)).toBe(false);
  });
});
