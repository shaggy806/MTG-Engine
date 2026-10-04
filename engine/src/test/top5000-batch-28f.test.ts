/**
 * Top-5000 batch 28f. No engine change: each test pins the clause of a card
 * most likely to be wired wrong — Deadly Brew's "another" card, Glimmervoid's
 * intervening-if, Far Traveler's granted blink, Smoke Bomb's reflexive
 * trigger after the shroud is gone, and the rest.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { activePlayerOf } from "../state.js";
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
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((unit) => unit.type).sort();
const keywordsOf = (game: Game, id: ObjectId): readonly string[] =>
  [...computeCharacteristics(game.state, registry, id).keywords];
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

describe("top-5000 batch 28f — Triskelion", () => {
  it("enters with three counters and pings by removing one", () => {
    const { game } = setUp();
    const trisk = spawn(game, "Triskelion");
    expect(counters(game, trisk)).toBe(3);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: trisk,
      abilityIndex: 0,
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    expect(counters(game, trisk)).toBe(2);
    expect(life(game, B)).toBe(19);
  });
});

describe("top-5000 batch 28f — Deadly Brew", () => {
  it("returns another permanent card, never the one you sacrificed", () => {
    const { game } = setUp(["Deadly Brew"]);
    spawn(game, "Swamp");
    spawn(game, "Forest");
    const bears = spawn(game, "Grizzly Bears");
    const elves = spawn(game, "Llanowar Elves", B);
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Deadly Brew"), targets: [] });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, elves)).toBe("graveyard");
    expect(zone(game, giant)).toBe("hand");
    expect(zone(game, bolt)).toBe("graveyard");
  });

  it("leaves the sacrificed card where it is when it's the only permanent card", () => {
    const { game } = setUp(["Deadly Brew"]);
    spawn(game, "Swamp");
    spawn(game, "Forest");
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Deadly Brew"), targets: [] });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
  });
});

describe("top-5000 batch 28f — Mandate of Abaddon", () => {
  it("destroys every creature with less power than the chosen one, and not the chosen one", () => {
    const { game } = setUp();
    const giant = spawn(game, "Hill Giant");
    const bears = spawn(game, "Grizzly Bears");
    const elves = spawn(game, "Llanowar Elves", B);
    const theirGiant = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(A, effectOf("Mandate of Abaddon"), [{ kind: "object", object: giant }]);
    settle(game);
    expect(zone(game, giant)).toBe("battlefield");
    expect(zone(game, theirGiant)).toBe("battlefield");
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, elves)).toBe("graveyard");
  });
});

describe("top-5000 batch 28f — Glimmervoid", () => {
  it("is sacrificed at the end step only while you control no artifacts", () => {
    const { game } = setUp();
    const bare = spawn(game, "Glimmervoid");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(zone(game, bare)).toBe("graveyard");

    const second = setUp();
    const kept = spawn(second.game, "Glimmervoid");
    spawn(second.game, "Sol Ring");
    second.game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(zone(second.game, kept)).toBe("battlefield");
  });
});

describe("top-5000 batch 28f — Heronblade Elite", () => {
  it("grows when another Human enters and taps for its power in one colour", () => {
    const { game } = setUp();
    const elite = spawn(game, "Heronblade Elite");
    game.debugSpawn("Elite Vanguard", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, elite)).toBe(1);
    game.dispatch({ type: "activate-ability", player: A, source: elite, abilityIndex: 0, manaColors: ["G"] });
    expect(pool(game)).toEqual(["G", "G"]);
  });
});

describe("top-5000 batch 28f — The Wandering Rescuer", () => {
  it("gives hexproof to other tapped creatures you control only", () => {
    const { game } = setUp();
    const rescuer = game.debugSpawn("The Wandering Rescuer", A, "battlefield", { tapped: true });
    const tapped = game.debugSpawn("Grizzly Bears", A, "battlefield", { tapped: true });
    const untapped = spawn(game, "Grizzly Bears");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield", { tapped: true });
    expect(keywordsOf(game, tapped)).toContain("hexproof");
    expect(keywordsOf(game, untapped)).not.toContain("hexproof");
    expect(keywordsOf(game, theirs)).not.toContain("hexproof");
    expect(keywordsOf(game, rescuer)).not.toContain("hexproof");
  });
});

describe("top-5000 batch 28f — Far Traveler", () => {
  it("gives your commander an end-step blink of a tapped creature you control", () => {
    const { game } = setUp();
    spawn(game, "Far Traveler");
    const commander = spawn(game, "Grizzly Bears");
    game.state.objects[commander].isCommander = true;
    const giant = game.debugSpawn("Hill Giant", A, "battlefield", { tapped: true });
    game.state.objects[giant].counters = { "+1/+1": 2 };
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    settle(game);
    const back = named(game, "Hill Giant");
    expect(back).toHaveLength(1);
    expect(counters(game, back[0])).toBe(0);
    expect(game.state.objects[back[0]].tapped).toBe(false);
    expect(zone(game, commander)).toBe("battlefield");
  });
});

describe("top-5000 batch 28f — Swarm Intelligence", () => {
  it("may copy an instant you cast", () => {
    const { game } = setUp(["Lightning Bolt"]);
    spawn(game, "Mountain");
    spawn(game, "Swarm Intelligence");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Lightning Bolt"),
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    expect(life(game, B)).toBe(14);
  });
});

describe("top-5000 batch 28f — Saruman's Trickery", () => {
  it("counters the spell, then amasses Orcs 1", () => {
    const { game } = setUp(["Lightning Bolt", "Saruman's Trickery"]);
    spawn(game, "Mountain");
    lands(game, "Island", 3);
    const bolt = inHand(game, "Lightning Bolt");
    game.dispatch({ type: "cast-spell", player: A, card: bolt, targets: [{ kind: "player", player: B }] });
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Saruman's Trickery"),
      targets: [{ kind: "object", object: bolt }],
    });
    settle(game);
    expect(life(game, B)).toBe(20);
    expect(zone(game, bolt)).toBe("graveyard");
    const army = named(game, "Army Token");
    expect(army).toHaveLength(1);
    expect(counters(game, army[0])).toBe(1);
    expect(computeCharacteristics(game.state, registry, army[0]).subtypes).toContain("Orc");
  });
});

describe("top-5000 batch 28f — Alrund's Epiphany", () => {
  it("makes two Birds, exiles itself and takes an extra turn", () => {
    const { game } = setUp(["Alrund's Epiphany"]);
    lands(game, "Island", 7);
    const epiphany = inHand(game, "Alrund's Epiphany");
    game.dispatch({ type: "cast-spell", player: A, card: epiphany, targets: [] });
    settle(game);
    expect(named(game, "1/1 Blue Bird Token").length).toBeGreaterThanOrEqual(1);
    const birds = named(game, "1/1 Blue Bird Token").reduce(
      (n, id) => n + (game.state.objects[id].stackCount ?? 1),
      0,
    );
    expect(birds).toBe(2);
    expect(zone(game, epiphany)).toBe("exile");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(activePlayerOf(game.state)).toBe(A);
  });
});

describe("top-5000 batch 28f — Smoke Bomb", () => {
  it("shrouds every creature, then at upkeep is sacrificed to make one unblockable", () => {
    const { game } = setUp();
    spawn(game, "Smoke Bomb");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    expect(keywordsOf(game, bears)).toContain("shroud");
    expect(keywordsOf(game, theirs)).toContain("shroud");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    settle(game);
    expect(named(game, "Smoke Bomb")).toHaveLength(0);
    expect(keywordsOf(game, bears)).not.toContain("shroud");
    expect(keywordsOf(game, bears)).toContain("unblockable");
    expect(keywordsOf(game, theirs)).not.toContain("unblockable");
  });
});
