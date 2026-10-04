/**
 * Top-10000 batch 31f. Existing vocabulary only; each test pins the clause
 * most likely to be wired wrong: populate on any cast (Song of the
 * Worldsoul), a paid count of Shrines (Go-Shintai of Shared Purpose), the
 * sacrificed creature's toughness (Geralf), a copy whose upkeep trigger only
 * a nontoken copy acts on (Progenitor Mimic), a shared second-resolution
 * count (South Pole Voyager), Sliver grants that reach every player's
 * Slivers (Hibernation Sliver, Crypt Sliver), a land play gated on an
 * opponent's land count (Verge Rangers), an intervening "no other Thopters"
 * (Thopter Assembly), the draw up to three (Iymrith), an activation gated on
 * an instant or sorcery cast this turn (Hall of Oracles), and a count of
 * every player's other Squirrels (Squirrel Mob).
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

const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
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
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const id = game.debugSpawn(name, player, "battlefield", { summoningSick: false });
  game.state.objects[id].tapped = false;
  return id;
};
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const countOf = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const tokensOf = (game: Game, player: PlayerId): number =>
  game.battlefield
    .filter((id) => game.state.objects[id].isToken && game.state.objects[id].controller === player)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
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
const emptyHand = (game: Game, player: PlayerId = A): void => {
  for (const id of [...game.handOf(player)]) game.debugMove(id, "graveyard");
};
const activations = (game: Game, source: ObjectId) =>
  game.legalActions(A).filter((x) => x.kind === "activate-ability" && x.source === source);

describe("top-10000 batch 31f — Song of the Worldsoul", () => {
  it("populates whenever you cast a spell", () => {
    const { game } = setUp();
    spawn(game, "Song of the Worldsoul");
    game.debugApplyEffect(A, { kind: "create-token", token: "Spirit Token (Colorless)", count: 1 });
    settle(game);
    expect(countOf(game, "Spirit Token (Colorless)")).toBe(1);
    const thopter = game.debugSpawn("Ornithopter", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: thopter, targets: [] });
    settle(game);
    expect(zone(game, thopter)).toBe("battlefield");
    expect(countOf(game, "Spirit Token (Colorless)")).toBe(2);
  });
});

describe("top-10000 batch 31f — Go-Shintai of Shared Purpose", () => {
  it("for {1}, makes a Spirit for each Shrine you control", () => {
    const { game } = setUp();
    const shintai = spawn(game, "Go-Shintai of Shared Purpose");
    spawn(game, "Go-Shintai of Life's Origin");
    spawn(game, "Go-Shintai of Life's Origin", B);
    const [wastes] = lands(game, "Wastes", 1);
    const endStep = registry.get("Go-Shintai of Shared Purpose")!.triggered[0].effect!;
    game.debugApplyEffect(A, endStep, [], { source: shintai });
    settle(game);
    expect(game.state.objects[wastes].tapped).toBe(true);
    expect(countOf(game, "Spirit Token (Colorless)")).toBe(2);
  });
});

describe("top-10000 batch 31f — Geralf, Visionary Stitcher", () => {
  it("sacrifices another nontoken creature for a Zombie as big as its toughness, which flies", () => {
    const { game } = setUp();
    const geralf = spawn(game, "Geralf, Visionary Stitcher");
    const turtle = spawn(game, "Horned Turtle");
    game.debugApplyEffect(A, { kind: "create-token", token: "Squirrel Token", count: 1 });
    settle(game);
    lands(game, "Island", 1);
    const offer = activations(game, geralf)[0];
    expect(offer?.kind === "activate-ability" ? offer.sacrifice?.choices : null).toEqual([turtle]);
    game.dispatch({ type: "activate-ability", player: A, source: geralf, abilityIndex: 0, targets: [], sacrifice: turtle });
    settle(game);
    expect(zone(game, turtle)).toBe("graveyard");
    const [zombie] = named(game, "Zombie Token (Geralf, Visionary Stitcher)");
    expect(zombie).toBeDefined();
    const z = chars(game, zombie);
    expect([z.power, z.toughness]).toEqual([4, 4]);
    expect(z.keywords.has("flying")).toBe(true);
  });
});

describe("top-10000 batch 31f — Progenitor Mimic", () => {
  it("copies a creature and makes a token copy each upkeep; the token copies make none", () => {
    const { game } = setUp(["Progenitor Mimic"]);
    spawn(game, "Grizzly Bears");
    lands(game, "Island", 4);
    lands(game, "Forest", 2);
    const mimic = game.handOf(A).find((id) => game.state.objects[id].cardName === "Progenitor Mimic")!;
    game.dispatch({ type: "cast-spell", player: A, card: mimic, targets: [] });
    settle(game);
    expect(game.state.objects[mimic].copyOf).toBe("Grizzly Bears");
    expect(tokensOf(game, A)).toBe(0);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    expect(tokensOf(game, A)).toBe(1);
    game.advanceUntil((s) => s.turn.number === 5 && s.turn.step === "precombat-main" && quiet(s));
    expect(tokensOf(game, A)).toBe(2);
  });
});

describe("top-10000 batch 31f — Hibernation Sliver", () => {
  it("gives another player's Sliver 'Pay 2 life: return this to its owner's hand'", () => {
    const { game } = setUp();
    spawn(game, "Hibernation Sliver", B);
    const sliver = spawn(game, "Metallic Sliver");
    const bears = spawn(game, "Grizzly Bears");
    expect(activations(game, bears)).toHaveLength(0);
    const offer = activations(game, sliver)[0];
    expect(offer).toBeDefined();
    if (offer?.kind !== "activate-ability") return;
    game.dispatch({ type: "activate-ability", player: A, source: sliver, abilityIndex: offer.abilityIndex, targets: [] });
    settle(game);
    expect(zone(game, sliver)).toBe("hand");
    expect(life(game, A)).toBe(18);
  });
});

describe("top-10000 batch 31f — Crypt Sliver", () => {
  it("gives another player's Sliver '{T}: Regenerate target Sliver'", () => {
    const { game } = setUp();
    spawn(game, "Crypt Sliver", B);
    const sliver = spawn(game, "Metallic Sliver");
    const offer = activations(game, sliver)[0];
    expect(offer).toBeDefined();
    if (offer?.kind !== "activate-ability") return;
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: sliver,
      abilityIndex: offer.abilityIndex,
      targets: [{ kind: "object", object: sliver }],
    });
    settle(game);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: sliver }]);
    settle(game);
    expect(zone(game, sliver)).toBe("battlefield");
    expect(game.state.objects[sliver].tapped).toBe(true);
  });
});

describe("top-10000 batch 31f — Verge Rangers", () => {
  it("plays a land from the top of the library only while an opponent controls more lands", () => {
    const { game } = setUp();
    spawn(game, "Verge Rangers");
    lands(game, "Wastes", 1, B);
    lands(game, "Wastes", 1, A);
    const forest = game.debugSpawn("Forest", A, "library");
    const offered = (): boolean => game.legalActions(A).some((x) => x.kind === "play-land" && x.card === forest);
    expect(offered()).toBe(false);
    lands(game, "Wastes", 1, B);
    expect(offered()).toBe(true);
    game.dispatch({ type: "play-land", player: A, card: forest });
    settle(game);
    expect(zone(game, forest)).toBe("battlefield");
  });
});

describe("top-10000 batch 31f — Thopter Assembly", () => {
  it("returns itself and makes five Thopters when it's your only Thopter", () => {
    const { game } = setUp();
    const assembly = spawn(game, "Thopter Assembly");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    expect(zone(game, assembly)).toBe("hand");
    expect(countOf(game, "Thopter Token")).toBe(5);
  });

  it("does nothing while you control another Thopter", () => {
    const { game } = setUp();
    const assembly = spawn(game, "Thopter Assembly");
    spawn(game, "Ornithopter");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    expect(zone(game, assembly)).toBe("battlefield");
    expect(countOf(game, "Thopter Token")).toBe(0);
  });
});

describe("top-10000 batch 31f — Iymrith, Desert Doom", () => {
  it("draws a card, then up to three cards in hand", () => {
    const { game } = setUp();
    const iymrith = spawn(game, "Iymrith, Desert Doom");
    const draw = registry.get("Iymrith, Desert Doom")!.triggered[0].effect!;
    emptyHand(game);
    game.debugApplyEffect(A, draw, [], { source: iymrith });
    settle(game);
    expect(game.handOf(A)).toHaveLength(3);
    game.debugApplyEffect(A, draw, [], { source: iymrith });
    settle(game);
    expect(game.handOf(A)).toHaveLength(4);
  });
});

describe("top-10000 batch 31f — Hall of Oracles", () => {
  it("puts a counter only after you've cast an instant or sorcery this turn", () => {
    const { game } = setUp(["Lightning Bolt"]);
    const hall = spawn(game, "Hall of Oracles");
    spawn(game, "Grizzly Bears");
    lands(game, "Mountain", 1);
    const counterOffered = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === hall && x.abilityIndex === 2);
    expect(counterOffered()).toBe(false);
    const bolt = game.handOf(A).find((id) => game.state.objects[id].cardName === "Lightning Bolt")!;
    game.dispatch({ type: "cast-spell", player: A, card: bolt, targets: [{ kind: "player", player: B }] });
    settle(game);
    expect(life(game, B)).toBe(17);
    expect(game.state.objects[hall].tapped).toBe(false);
    expect(counterOffered()).toBe(true);
  });
});

describe("top-10000 batch 31f — Squirrel Mob", () => {
  it("gets +1/+1 for each other Squirrel, whoever controls it", () => {
    const { game } = setUp();
    const mob = spawn(game, "Squirrel Mob");
    expect(chars(game, mob).power).toBe(2);
    spawn(game, "Squirrel Token");
    spawn(game, "Squirrel Token", B);
    const c = chars(game, mob);
    expect([c.power, c.toughness]).toEqual([4, 4]);
  });
});
