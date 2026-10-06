/**
 * Top-10000 batch 36a. Pins the clauses most likely to be wired wrong:
 * Root Sliver protecting another player's Sliver spell, Dream Trawler's
 * per-card draw pump and its hexproof-then-tap, Kavaron's 12+ ability
 * pumping the Robot it just made, Biowaste Blob's commander-gated self-copy,
 * Jecht flipping into a Saga that fires chapter I, Sword Coast Serpent's
 * noncreature-spell evasion, Chameleon Colossus's +X/+X read once,
 * Mastermind Plum's artifact-only Treasure and its Treasure-mana draw,
 * Huatli's −3, and Dream-Thief's Bandana's exile from the damaged player.
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

const setUp = (hand: readonly string[] = []): { game: Game; a: ScriptedController; b: ScriptedController } => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill("Wastes")] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
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
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const obj = (object: ObjectId) => ({ kind: "object" as const, object });
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
const lands = (game: Game, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name);
};
const attackWith = (game: Game, attacker: ObjectId): void => {
  game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
  game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker, defender: B }] });
  settle(game);
  game.advanceUntil((s) => s.turn.step === "postcombat-main");
  settle(game);
};

describe("top-10000 batch 36a — Root Sliver", () => {
  it("another player's Root Sliver keeps your Sliver spell from being countered", () => {
    const { game } = setUp(["Heart Sliver", "Counterspell"]);
    spawn(game, "Root Sliver", B);
    lands(game, "Mountain", 2);
    lands(game, "Island", 2);
    const sliver = inHand(game, "Heart Sliver");
    game.dispatch({ type: "cast-spell", player: A, card: sliver });
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Counterspell"), targets: [obj(sliver)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[sliver].zone).toBe("battlefield");
  });
});

describe("top-10000 batch 36a — Dream Trawler", () => {
  it("gets +1/+0 for each card drawn, and discarding gives it hexproof and taps it", () => {
    const { game } = setUp();
    const trawler = spawn(game, "Dream Trawler");
    game.debugApplyEffect(A, { kind: "draw", amount: 2 }, []);
    game.advanceUntil(quiet);
    expect(chars(game, trawler).power).toBe(5);
    expect(chars(game, trawler).toughness).toBe(5);
    const hand = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: trawler, abilityIndex: 0 });
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand - 1);
    expect(chars(game, trawler).keywords.has("hexproof")).toBe(true);
    expect(game.state.objects[trawler].tapped).toBe(true);
  });
});

describe("top-10000 batch 36a — Kavaron, Memorial World", () => {
  it("12+: sacrifices a land, makes a Robot, then every creature you control (the Robot too) gets +1/+0 and haste", () => {
    const { game } = setUp();
    const kavaron = spawn(game, "Kavaron, Memorial World");
    game.state.objects[kavaron].tapped = false; // it entered tapped
    lands(game, "Mountain", 2);
    const fodder = spawn(game, "Swamp");
    const bears = spawn(game, "Grizzly Bears");
    const offer = () =>
      game
        .legalActions(A)
        .flatMap((a) => (a.kind === "activate-ability" && a.source === kavaron && a.text.startsWith("{1}{R}") ? [a] : []));
    game.state.objects[kavaron].counters.charge = 11;
    expect(offer()).toHaveLength(0);
    game.state.objects[kavaron].counters.charge = 12;
    const [ability] = offer();
    if (ability === undefined) throw new Error("the 12+ ability isn't offered");
    game.dispatch({ type: "activate-ability", player: A, source: kavaron, abilityIndex: ability.abilityIndex, sacrifice: fodder });
    settle(game);
    expect(game.state.objects[fodder].zone).toBe("graveyard");
    const [robot] = named(game, "Robot Token");
    expect(robot).toBeDefined();
    for (const id of [robot!, bears]) {
      expect(chars(game, id).keywords.has("haste")).toBe(true);
    }
    expect(chars(game, robot!).power).toBe(3);
    expect(chars(game, bears).power).toBe(3);
    expect(chars(game, bears).toughness).toBe(2);
  });
});

describe("top-10000 batch 36a — Biowaste Blob", () => {
  it("copies itself at your upkeep only while you control a commander", () => {
    const { game } = setUp();
    spawn(game, "Biowaste Blob");
    expect(chars(game, named(game, "Biowaste Blob")[0]!).power).toBe(1);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    settle(game);
    expect(named(game, "Biowaste Blob")).toHaveLength(1);
    const commander = spawn(game, "Grizzly Bears");
    game.state.objects[commander].isCommander = true;
    game.advanceUntil((s) => s.turn.number === 5 && s.turn.step === "precombat-main");
    settle(game);
    const blobs = named(game, "Biowaste Blob");
    expect(blobs).toHaveLength(2);
    // Each is an Ooze getting +1/+1 from both.
    for (const id of blobs) expect(chars(game, id).power).toBe(2);
  });
});

describe("top-10000 batch 36a — Jecht, Reluctant Guardian", () => {
  it("connecting flips it into Braska's Final Aeon, whose chapter I makes each opponent discard and you draw", () => {
    const { game, a } = setUp();
    a.chooseModesFn = () => [0]; // "you may exile it" — yes
    const jecht = spawn(game, "Jecht, Reluctant Guardian");
    const [handA, handB] = [game.handOf(A).length, game.handOf(B).length];
    attackWith(game, jecht);
    expect(life(game, B)).toBe(16);
    expect(game.state.objects[jecht].face).toBe(1);
    expect(game.state.objects[jecht].counters.lore).toBe(1);
    expect(game.handOf(B)).toHaveLength(handB - 1);
    expect(game.handOf(A)).toHaveLength(handA + 1);
  });
});

describe("top-10000 batch 36a — Sword Coast Serpent", () => {
  it("can't be blocked once you've cast a noncreature spell this turn", () => {
    const { game } = setUp(["Shock"]);
    const serpent = spawn(game, "Sword Coast Serpent");
    spawn(game, "Mountain");
    expect(chars(game, serpent).keywords.has("unblockable")).toBe(false);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Shock"), targets: [{ kind: "player", player: B }] });
    game.advanceUntil(quiet);
    expect(chars(game, serpent).keywords.has("unblockable")).toBe(true);
  });
});

describe("top-10000 batch 36a — Chameleon Colossus", () => {
  it("+X/+X where X is its power as it resolves", () => {
    const { game } = setUp();
    const colossus = spawn(game, "Chameleon Colossus");
    lands(game, "Forest", 4);
    game.dispatch({ type: "activate-ability", player: A, source: colossus, abilityIndex: 0 });
    game.advanceUntil(quiet);
    expect(chars(game, colossus).power).toBe(8);
    expect(chars(game, colossus).toughness).toBe(8);
  });
});

describe("top-10000 batch 36a — Mastermind Plum", () => {
  it("a Treasure only for an artifact card exiled; Treasure mana on a spell draws and costs 1 life", () => {
    const { game } = setUp(["Shock"]);
    const plum = spawn(game, "Mastermind Plum");
    const ring = game.debugSpawn("Sol Ring", B, "graveyard");
    attackWith(game, plum);
    expect(game.state.objects[ring].zone).toBe("exile");
    const [treasure] = named(game, "Treasure Token");
    expect(treasure).toBeDefined();
    const [hand, lifeA] = [game.handOf(A).length, life(game, A)];
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Shock"), targets: [{ kind: "player", player: B }] });
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand); // Shock left, a card came in
    expect(life(game, A)).toBe(lifeA - 1);
  });

  it("exiling a nonartifact card makes no Treasure", () => {
    const { game } = setUp();
    const plum = spawn(game, "Mastermind Plum");
    const bears = game.debugSpawn("Grizzly Bears", B, "graveyard");
    attackWith(game, plum);
    expect(game.state.objects[bears].zone).toBe("exile");
    expect(named(game, "Treasure Token")).toHaveLength(0);
  });
});

describe("top-10000 batch 36a — Huatli, the Sun's Heart", () => {
  it("−3 gains life equal to the greatest toughness among your creatures", () => {
    const { game } = setUp();
    const huatli = spawn(game, "Huatli, the Sun's Heart");
    spawn(game, "Grizzly Bears");
    spawn(game, "Wall of Omens");
    spawn(game, "Colossal Dreadmaw", B);
    const before = life(game, A);
    game.dispatch({ type: "activate-ability", player: A, source: huatli, abilityIndex: 0 });
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(before + 4);
  });
});

describe("top-10000 batch 36a — Dream-Thief's Bandana", () => {
  it("exiles the damaged player's top card face down, castable by you with mana of any type", () => {
    const { game } = setUp();
    const bandana = spawn(game, "Dream-Thief's Bandana");
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Wastes");
    game.dispatch({ type: "activate-ability", player: A, source: bandana, abilityIndex: 0, targets: [obj(bears)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bandana].attachedTo).toBe(bears);
    const top = game.debugSpawn("Craw Wurm", B, "library");
    attackWith(game, bears);
    expect(game.state.objects[top].zone).toBe("exile");
    expect(game.state.objects[top].exiledFaceDown?.lookers).toEqual([A]);
    // Craw Wurm is {4}{G}{G}: six Islands pay it, any type.
    lands(game, "Island", 6);
    game.dispatch({ type: "cast-spell", player: A, card: top, targets: [], via: "impulse" });
    game.advanceUntil(quiet);
    expect(game.state.objects[top].zone).toBe("battlefield");
    expect(game.state.objects[top].controller).toBe(A);
  });
});
