/**
 * Top-10000 batch 31c. No engine change: each test pins the clause of one
 * newly authored card most likely to be wired wrong.
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
const castable = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);

describe("top-10000 batch 31c — Delete", () => {
  it("deals X to each nonartifact creature and each player", () => {
    const { game } = setUp(["Delete"], "Mountain");
    lands(game, "Mountain", 4);
    const bears = spawn(game, "Grizzly Bears");
    const thopter = spawn(game, "Ornithopter", B);
    const giant = spawn(game, "Hill Giant", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Delete"), targets: [], xValue: 2 });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, thopter)).toBe("battlefield");
    expect(zone(game, giant)).toBe("battlefield");
    expect(game.state.objects[giant].damageMarked).toBe(2);
    expect(life(game, A)).toBe(18);
    expect(life(game, B)).toBe(18);
  });
});

describe("top-10000 batch 31c — Orcrist, Goblin-cleaver", () => {
  it("makes a Treasure for each creature you control of the type chosen as it resolves", () => {
    const { game, a } = setUp();
    a.chooseCreatureTypeFn = () => "Goblin";
    const orcrist = spawn(game, "Orcrist, Goblin-cleaver");
    spawn(game, "Destructive Digger");
    spawn(game, "Destructive Digger");
    spawn(game, "Grizzly Bears");
    spawn(game, "Destructive Digger", B);
    const trigger = registry.get("Orcrist, Goblin-cleaver")!.triggered[0].effect!;
    game.debugApplyEffect(A, trigger, [], { source: orcrist });
    settle(game);
    expect(named(game, "Treasure Token")).toHaveLength(2);
  });
});

describe("top-10000 batch 31c — The Pride of Hull Clade", () => {
  it("costs {X} less, X the total toughness of creatures you control, never below {G}", () => {
    const { game } = setUp(["The Pride of Hull Clade"]);
    const pride = inHand(game, "The Pride of Hull Clade");
    spawn(game, "Forest");
    expect(castable(game, pride)).toBe(false);
    lands(game, "Grizzly Bears", 4);
    // Total toughness 8: {2}{G} left, one Forest isn't enough.
    expect(castable(game, pride)).toBe(false);
    spawn(game, "Grizzly Bears");
    // Total toughness 10: only {G}.
    expect(castable(game, pride)).toBe(true);
    // An opponent's creatures don't count.
    const { game: other } = setUp(["The Pride of Hull Clade"]);
    spawn(other, "Forest");
    lands(other, "Grizzly Bears", 5, B);
    expect(castable(other, inHand(other, "The Pride of Hull Clade"))).toBe(false);
  });
});

describe("top-10000 batch 31c — Ruinous Intrusion", () => {
  it("puts counters equal to the exiled permanent's mana value on your creature", () => {
    const { game } = setUp();
    const stone = spawn(game, "Mind Stone", B);
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, registry.get("Ruinous Intrusion")!.effect!, [
      { kind: "object", object: stone },
      { kind: "object", object: bears },
    ]);
    settle(game);
    expect(zone(game, stone)).toBe("exile");
    expect(counters(game, bears)).toBe(2);
  });
});

describe("top-10000 batch 31c — Loyal Inventor", () => {
  it("puts the artifact on top of the library without an Assassin", () => {
    const { game } = setUp();
    const ring = game.debugSpawn("Sol Ring", A, "library");
    // Bury it under a land so "on top" is something the search did.
    game.debugSpawn("Wastes", A, "library");
    game.debugSpawn("Loyal Inventor", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, ring)).toBe("library");
    expect(game.state.zones.perPlayer[A].library[0]).toBe(ring);
  });

  it("puts it into your hand with an Assassin", () => {
    const { game } = setUp();
    const ring = game.debugSpawn("Sol Ring", A, "library");
    game.debugSpawn("Wastes", A, "library");
    spawn(game, "Arbaaz Mir");
    game.debugSpawn("Loyal Inventor", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, ring)).toBe("hand");
  });
});

describe("top-10000 batch 31c — Rockalanche", () => {
  it("earthbends with X the number of Forests you control", () => {
    const { game } = setUp(["Rockalanche"]);
    const forests = lands(game, "Forest", 3);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Rockalanche"),
      targets: [{ kind: "object", object: forests[0] }],
    });
    settle(game);
    expect(counters(game, forests[0])).toBe(3);
    const c = computeCharacteristics(game.state, registry, forests[0]);
    expect(c.types).toContain("creature");
    expect([c.power, c.toughness]).toEqual([3, 3]);
  });
});

describe("top-10000 batch 31c — Enterprising Scallywag", () => {
  const toNextTurn = (game: Game): void =>
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");

  it("makes a Treasure at your end step once a permanent card went to your graveyard", () => {
    const { game } = setUp();
    spawn(game, "Enterprising Scallywag");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    toNextTurn(game);
    expect(named(game, "Treasure Token")).toHaveLength(1);
  });

  it("makes nothing if you didn't descend", () => {
    const { game } = setUp();
    spawn(game, "Enterprising Scallywag");
    toNextTurn(game);
    expect(named(game, "Treasure Token")).toHaveLength(0);
  });
});

describe("top-10000 batch 31c — Vampire Socialite", () => {
  it("does nothing while no opponent has lost life this turn", () => {
    const { game } = setUp();
    const baron = spawn(game, "Barony Vampire");
    game.debugSpawn("Vampire Socialite", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, baron)).toBe(0);
    const late = spawn(game, "Barony Vampire");
    expect(counters(game, late)).toBe(0);
  });

  it("once an opponent has, grows the other Vampires and those that enter later", () => {
    const { game } = setUp();
    const baron = spawn(game, "Barony Vampire");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "lose-life", amount: 1, who: "each-opponent" }, []);
    const socialite = game.debugSpawn("Vampire Socialite", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, baron)).toBe(1);
    expect(counters(game, socialite)).toBe(0);
    expect(counters(game, bears)).toBe(0);
    const late = spawn(game, "Barony Vampire");
    expect(counters(game, late)).toBe(1);
    // Only a Vampire you control.
    const theirs = spawn(game, "Barony Vampire", B);
    expect(counters(game, theirs)).toBe(0);
  });
});

describe("top-10000 batch 31c — Magebane Lizard", () => {
  it("deals the caster damage equal to the noncreature spells they've cast this turn", () => {
    const { game } = setUp(["Sol Ring", "Sol Ring", "Llanowar Elves"], "Forest");
    spawn(game, "Magebane Lizard", B);
    lands(game, "Forest", 3);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Sol Ring"), targets: [] });
    settle(game);
    expect(life(game, A)).toBe(19);
    // A creature spell neither triggers it nor counts.
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Llanowar Elves"), targets: [] });
    settle(game);
    expect(life(game, A)).toBe(19);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Sol Ring"), targets: [] });
    settle(game);
    expect(life(game, A)).toBe(17);
    expect(life(game, B)).toBe(20);
  });
});
