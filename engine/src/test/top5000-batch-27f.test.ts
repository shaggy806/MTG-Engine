/**
 * Top-5000 batch 27f. No engine change: each test pins the clause most likely
 * to be wired wrong — Noxious Ghoul's "this or another Zombie" (anyone's) and
 * its non-Zombie filter, Seismic Sense's creature-or-land pick from the top X
 * (X = lands), Gimli's Reckless Might's formidable intervening-if and its
 * fight, and Beacon of Unrest stealing from another graveyard and shuffling
 * itself away.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
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
const cast = (game: Game, card: ObjectId, targets: readonly ObjectId[] = [], player: PlayerId = A): void => {
  game.dispatch({
    type: "cast-spell",
    player,
    card,
    ...(targets.length > 0 ? { targets: targets.map((object) => ({ kind: "object" as const, object })) } : {}),
  });
};
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = game.characteristics(id);
  return [c.power ?? 0, c.toughness ?? 0];
};
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;

describe("Noxious Ghoul", () => {
  it("its own entry shrinks every non-Zombie creature, not Zombies", () => {
    const { game } = setUp();
    lands(game, "Swamp", 5);
    const mine = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    const digger = spawn(game, "Gravedigger", B);
    const ghoul = game.debugSpawn("Noxious Ghoul", A, "hand");
    cast(game, ghoul);
    game.advanceUntil(quiet);
    expect(zone(game, ghoul)).toBe("battlefield");
    expect(pt(game, mine)).toEqual([1, 1]);
    expect(pt(game, theirs)).toEqual([1, 1]);
    expect(pt(game, digger)).toEqual([2, 2]);
    expect(pt(game, ghoul)).toEqual([3, 3]);
  });

  it("another Zombie entering — an opponent's — triggers it too, a non-Zombie doesn't", () => {
    const { game } = setUp();
    const ghoul = spawn(game, "Noxious Ghoul");
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(pt(game, bears)).toEqual([2, 2]);
    game.debugSpawn("Gravedigger", B, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(pt(game, bears)).toEqual([1, 1]);
    expect(pt(game, ghoul)).toEqual([3, 3]);
  });
});

describe("Seismic Sense", () => {
  it("looks at the top X (lands you control) and offers only a creature or land card", () => {
    const { game, a } = setUp();
    lands(game, "Forest", 3);
    const ring = game.debugSpawn("Sol Ring", A, "library");
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    // Top of library: Bears, Sol Ring, then the Wastes; X = 3.
    let eligible: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, options) => {
      eligible = options;
      return [bears];
    };
    cast(game, game.debugSpawn("Seismic Sense", A, "hand"));
    game.advanceUntil(quiet);
    expect(eligible).toContain(bears);
    expect(eligible).not.toContain(ring);
    expect(eligible.length).toBe(2); // Bears and the one Wastes among the top three
    expect(zone(game, bears)).toBe("hand");
    const library = game.state.zones.perPlayer[A].library;
    expect(library.slice(-2)).toContain(ring);
  });
});

describe("Gimli's Reckless Might", () => {
  it("with total power 8 or more, the attacker fights a creature you don't control", () => {
    const { game, a } = setUp();
    spawn(game, "Gimli's Reckless Might");
    const maw = spawn(game, "Colossal Dreadmaw");
    spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: maw, defender: B }];
    a.chooseTargetsFn = () => [
      { kind: "object", object: maw },
      { kind: "object", object: theirs },
    ];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(zone(game, theirs)).toBe("graveyard");
    expect(game.state.objects[maw].damageMarked).toBe(2);
    expect(game.state.players[B].life).toBe(14);
  });

  it("with total power under 8 it does nothing", () => {
    const { game, a } = setUp();
    spawn(game, "Gimli's Reckless Might");
    const maw = spawn(game, "Colossal Dreadmaw");
    const theirs = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: maw, defender: B }];
    a.chooseTargetsFn = () => [
      { kind: "object", object: maw },
      { kind: "object", object: theirs },
    ];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(zone(game, theirs)).toBe("battlefield");
    expect(game.state.players[B].life).toBe(14);
  });

  it("gives a creature that just arrived haste", () => {
    const { game } = setUp();
    spawn(game, "Gimli's Reckless Might");
    const fresh = game.debugSpawn("Grizzly Bears", A, "battlefield");
    expect(game.characteristics(fresh).keywords.has("haste")).toBe(true);
  });
});

describe("Beacon of Unrest", () => {
  it("puts an artifact from an opponent's graveyard onto the battlefield under your control, then shuffles itself in", () => {
    const { game } = setUp();
    lands(game, "Swamp", 5);
    const ring = game.debugSpawn("Sol Ring", B, "graveyard");
    const beacon = game.debugSpawn("Beacon of Unrest", A, "hand");
    cast(game, beacon, [ring]);
    game.advanceUntil(quiet);
    expect(zone(game, ring)).toBe("battlefield");
    expect(game.state.objects[ring].controller).toBe(A);
    expect(game.state.zones.perPlayer[A].library).toContain(beacon);
    expect(game.state.zones.perPlayer[A].graveyard).not.toContain(beacon);
  });
});
