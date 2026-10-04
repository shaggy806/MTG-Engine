/**
 * Top-5000 batch 25d. No engine change. Each test pins the clause most likely
 * to be wired wrong: the channel ability from the hand (Colossal Skyturtle),
 * two independent conditional draws (Roadside Reliquary), "they" as the
 * caster with their own spell count (Rug of Smothering), the mana-value cast
 * filter (Spider Manifestation), a granted enters trigger on every Sliver,
 * itself included (Harmonic Sliver), the tapped-only wrath (Sunblast Angel),
 * the token going to the target's controller (Bovine Intervention), the
 * graveyard-only upkeep trigger (Squee), the pump plus impulse until your
 * next end step (Haste Magic) and a targeted land animation (Llanowar
 * Loamspeaker).
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
    controllers: { [A]: a, [B]: yes(new ScriptedController(B)) },
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
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
const obj = (object: ObjectId) => ({ kind: "object" as const, object });
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

describe("top-5000 batch 25d — Colossal Skyturtle", () => {
  it("channels from the hand, discarding itself, to return a card from your graveyard", () => {
    const { game } = setUp(["Colossal Skyturtle"]);
    lands(game, "Forest", 3);
    const turtle = inHand(game, "Colossal Skyturtle");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    game.dispatch({ type: "activate-ability", player: A, source: turtle, abilityIndex: 0, targets: [obj(bolt)] });
    settle(game);
    expect(zone(game, turtle)).toBe("graveyard");
    expect(game.handOf(A).some((id) => game.state.objects[id].cardName === "Lightning Bolt")).toBe(true);
  });
});

describe("top-5000 batch 25d — Roadside Reliquary", () => {
  it("draws one card for an artifact alone, none for the missing enchantment", () => {
    const { game } = setUp();
    lands(game, "Wastes", 2);
    spawn(game, "Sol Ring");
    const reliquary = spawn(game, "Roadside Reliquary");
    const before = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: reliquary, abilityIndex: 1 });
    settle(game);
    expect(zone(game, reliquary)).toBe("graveyard");
    expect(game.handOf(A).length).toBe(before + 1);
  });
});

describe("top-5000 batch 25d — Rug of Smothering", () => {
  it("makes the caster lose 1 for each spell they've cast this turn, whoever controls the Rug", () => {
    const { game } = setUp(["Ornithopter", "Ornithopter"]);
    spawn(game, "Rug of Smothering", B);
    const [lifeA, lifeB] = [life(game, A), life(game, B)];
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Ornithopter"), targets: [] });
    settle(game);
    expect(life(game, A)).toBe(lifeA - 1);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Ornithopter"), targets: [] });
    settle(game);
    expect(life(game, A)).toBe(lifeA - 3);
    expect(life(game, B)).toBe(lifeB);
  });
});

describe("top-5000 batch 25d — Spider Manifestation", () => {
  it("untaps for a spell of mana value 4 or more, not for a cheaper one", () => {
    const { game } = setUp(["Ornithopter", "Hill Giant"]);
    lands(game, "Mountain", 4);
    const spider = game.debugSpawn("Spider Manifestation", A, "battlefield", { tapped: true, summoningSick: false });
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Ornithopter"), targets: [] });
    settle(game);
    expect(game.state.objects[spider].tapped).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Hill Giant"), targets: [] });
    settle(game);
    expect(game.state.objects[spider].tapped).toBe(false);
  });
});

describe("top-5000 batch 25d — Harmonic Sliver", () => {
  it("grants itself the trigger, so its own entry destroys an artifact", () => {
    const { game } = setUp();
    const ring = spawn(game, "Sol Ring", B);
    game.debugSpawn("Harmonic Sliver", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, ring)).toBe("graveyard");
  });

  it("gives an opponent's Sliver the trigger too", () => {
    const { game } = setUp();
    spawn(game, "Harmonic Sliver");
    const ring = spawn(game, "Sol Ring");
    game.debugSpawn("Manaweft Sliver", B, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, ring)).toBe("graveyard");
  });

  it("gives nothing to a non-Sliver", () => {
    const { game } = setUp();
    spawn(game, "Harmonic Sliver");
    const ring = spawn(game, "Sol Ring", B);
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, ring)).toBe("battlefield");
  });
});

describe("top-5000 batch 25d — Sunblast Angel", () => {
  it("destroys every tapped creature, yours included, and spares the untapped", () => {
    const { game } = setUp();
    const theirTapped = game.debugSpawn("Grizzly Bears", B, "battlefield", { tapped: true });
    const mineTapped = game.debugSpawn("Grizzly Bears", A, "battlefield", { tapped: true });
    const untapped = spawn(game, "Hill Giant", B);
    const angel = game.debugSpawn("Sunblast Angel", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, theirTapped)).toBe("graveyard");
    expect(zone(game, mineTapped)).toBe("graveyard");
    expect(zone(game, untapped)).toBe("battlefield");
    expect(zone(game, angel)).toBe("battlefield");
  });
});

describe("top-5000 batch 25d — Bovine Intervention", () => {
  it("destroys the creature and its controller gets the Ox", () => {
    const { game } = setUp(["Bovine Intervention"]);
    lands(game, "Plains", 2);
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Bovine Intervention"), targets: [obj(bears)] });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    const ox = named(game, "Ox Token");
    expect(ox).toHaveLength(1);
    expect(game.state.objects[ox[0]].controller).toBe(B);
  });
});

describe("top-5000 batch 25d — Squee, Goblin Nabob", () => {
  it("returns from the graveyard on your upkeep, not an opponent's", () => {
    const { game } = setUp();
    game.debugSpawn("Squee, Goblin Nabob", A, "graveyard");
    const squeeInHand = (): boolean =>
      game.handOf(A).some((id) => game.state.objects[id].cardName === "Squee, Goblin Nabob");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    settle(game);
    expect(squeeInHand()).toBe(false);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "upkeep");
    settle(game);
    expect(squeeInHand()).toBe(true);
  });
});

describe("top-5000 batch 25d — Haste Magic", () => {
  it("pumps +3/+1 with haste and exiles the top card, playable until your next end step", () => {
    const { game } = setUp(["Haste Magic"]);
    lands(game, "Mountain", 2);
    const bears = spawn(game, "Grizzly Bears");
    const top = game.debugSpawn("Ornithopter", A, "library");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Haste Magic"), targets: [obj(bears)] });
    settle(game);
    const c = chars(game, bears);
    expect([c.power, c.toughness]).toEqual([5, 3]);
    expect(c.keywords.has("haste")).toBe(true);
    expect(zone(game, top)).toBe("exile");
    expect(game.state.objects[top].impulse?.expiry).toEqual({ kind: "end-step-of", player: A });
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === top)).toBe(true);
  });
});

describe("top-5000 batch 25d — Llanowar Loamspeaker", () => {
  it("makes a land you control a 3/3 Elemental with haste that's still a land", () => {
    const { game } = setUp();
    const speaker = spawn(game, "Llanowar Loamspeaker");
    const forest = spawn(game, "Forest");
    game.dispatch({ type: "activate-ability", player: A, source: speaker, abilityIndex: 1, targets: [obj(forest)] });
    settle(game);
    const c = chars(game, forest);
    expect([c.power, c.toughness]).toEqual([3, 3]);
    expect(c.types).toEqual(expect.arrayContaining(["land", "creature"]));
    expect(c.subtypes).toEqual(expect.arrayContaining(["Forest", "Elemental"]));
    expect(c.keywords.has("haste")).toBe(true);
    expect(game.state.objects[forest].tapped).toBe(false);
  });
});
