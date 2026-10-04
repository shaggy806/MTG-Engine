/**
 * Top-5000 batch 20c. No engine change: each card is existing vocabulary.
 * These pin the clause most likely to be wired wrong on each — X from a
 * sacrificed creature's power (Ghoulcaller Gisa, Life's Legacy), "that
 * player" draws (Forced Fruition), a land's entry threshold and "X can't be
 * 0" (Lair of the Hydra), a pump that counts the hand and spares the source
 * from its Drake half (Alandra), every player's Goblins (Brightstone Ritual),
 * kicked copies that don't copy themselves again (Skyclave Relic), populate
 * after a destroy (Sundering Growth), Karn's restricted upkeep mana, and the
 * haste lord sparing itself (Regisaur Alpha).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
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
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
/** Every token of a token stack counted. */
const count = (game: Game, name: string, player?: PlayerId): number =>
  named(game, name)
    .filter((id) => player === undefined || game.state.objects[id].controller === player)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((unit) => unit.type).sort();
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power, c.toughness];
};
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

describe("top-5000 batch 20c — Ghoulcaller Gisa", () => {
  it("makes as many Zombies as the sacrificed creature's power, and can't eat herself", () => {
    const { game } = setUp();
    spawn(game, "Swamp");
    const gisa = spawn(game, "Ghoulcaller Gisa");
    const giant = spawn(game, "Hill Giant");
    const offer = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === gisa && x.abilityIndex === 0);
    if (offer?.kind !== "activate-ability") throw new Error("Gisa's ability isn't offered");
    expect(offer.sacrifice?.choices).not.toContain(gisa);
    game.dispatch({ type: "activate-ability", player: A, source: gisa, abilityIndex: 0, targets: [], sacrifice: giant });
    settle(game);
    expect(zone(game, giant)).toBe("graveyard");
    expect(count(game, "Zombie Token", A)).toBe(3);
  });
});

describe("top-5000 batch 20c — Life's Legacy", () => {
  it("draws cards equal to the sacrificed creature's power", () => {
    const { game } = setUp(["Life's Legacy"], "Forest");
    lands(game, "Forest", 2);
    const giant = spawn(game, "Hill Giant");
    const before = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Life's Legacy"), targets: [], sacrifice: giant });
    settle(game);
    expect(zone(game, giant)).toBe("graveyard");
    expect(game.handOf(A)).toHaveLength(before - 1 + 3);
  });
});

describe("top-5000 batch 20c — Forced Fruition", () => {
  it("has the opponent who cast the spell draw seven, not its controller", () => {
    const { game } = setUp(["Grizzly Bears"], "Forest");
    lands(game, "Forest", 2);
    spawn(game, "Forced Fruition", B);
    const aBefore = game.handOf(A).length;
    const bBefore = game.handOf(B).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears"), targets: [] });
    settle(game);
    expect(game.handOf(A)).toHaveLength(aBefore - 1 + 7);
    expect(game.handOf(B)).toHaveLength(bBefore);
  });
});

describe("top-5000 batch 20c — Lair of the Hydra", () => {
  it("enters untapped beside one other land and tapped beside two", () => {
    const { game } = setUp(["Lair of the Hydra", "Lair of the Hydra"], "Forest");
    spawn(game, "Forest");
    const [first, second] = game.handOf(A).filter((id) => game.state.objects[id].cardName === "Lair of the Hydra");
    game.dispatch({ type: "play-land", player: A, card: first });
    settle(game);
    expect(game.state.objects[first].tapped).toBe(false);
    game.dispatch({ type: "play-land", player: A, card: second });
    settle(game);
    expect(game.state.objects[second].tapped).toBe(true);
  });

  it("becomes an X/X green Hydra land creature, and X can't be 0", () => {
    const { game } = setUp();
    lands(game, "Forest", 4);
    const lair = spawn(game, "Lair of the Hydra");
    expect(
      game.canDispatch({ type: "activate-ability", player: A, source: lair, abilityIndex: 1, targets: [], xValue: 0 }),
    ).not.toBeNull();
    game.dispatch({ type: "activate-ability", player: A, source: lair, abilityIndex: 1, targets: [], xValue: 3 });
    settle(game);
    const c = computeCharacteristics(game.state, registry, lair);
    expect([c.power, c.toughness]).toEqual([3, 3]);
    expect(c.types).toContain("creature");
    expect(c.types).toContain("land");
    expect(c.subtypes).toContain("Hydra");
    expect([...c.colors]).toEqual(["G"]);
  });
});

describe("top-5000 batch 20c — Alandra, Sky Dreamer", () => {
  it("makes a Drake on the second draw, and pumps herself and your Drakes by the hand on the fifth", () => {
    const { game } = setUp();
    const alandra = spawn(game, "Alandra, Sky Dreamer");
    const drake = spawn(game, "Drake Token");
    const theirs = spawn(game, "Drake Token", B);
    // Alice drew her first card of the turn in her draw step.
    game.debugApplyEffect(A, { kind: "draw", amount: 4 });
    settle(game);
    expect(count(game, "Drake Token", A)).toBe(2);
    const hand = game.handOf(A).length;
    expect(pt(game, alandra)).toEqual([2 + hand, 4 + hand]);
    expect(pt(game, drake)).toEqual([2 + hand, 2 + hand]);
    expect(pt(game, theirs)).toEqual([2, 2]);
  });
});

describe("top-5000 batch 20c — Brightstone Ritual", () => {
  it("adds {R} for every Goblin on the battlefield, whoever controls it", () => {
    const { game } = setUp();
    spawn(game, "Goblin Token");
    spawn(game, "Goblin Token", B);
    spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, effectOf("Brightstone Ritual"), []);
    expect(pool(game)).toEqual(["R", "R"]);
  });
});

describe("top-5000 batch 20c — Skyclave Relic", () => {
  it("kicked, makes two tapped copies, which don't copy themselves again", () => {
    const { game } = setUp(["Skyclave Relic"]);
    lands(game, "Wastes", 6);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Skyclave Relic"), targets: [], kicked: true });
    settle(game);
    const relics = named(game, "Skyclave Relic");
    expect(relics.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(3);
    const tokens = relics.filter((id) => game.state.objects[id].isToken === true);
    expect(tokens.length).toBeGreaterThan(0);
    for (const id of tokens) expect(game.state.objects[id].tapped).toBe(true);
  });

  it("unkicked, makes none", () => {
    const { game } = setUp(["Skyclave Relic"]);
    lands(game, "Wastes", 3);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Skyclave Relic"), targets: [] });
    settle(game);
    expect(named(game, "Skyclave Relic")).toHaveLength(1);
  });
});

describe("top-5000 batch 20c — Sundering Growth", () => {
  it("destroys the artifact, then populates", () => {
    const { game } = setUp();
    const ring = spawn(game, "Sol Ring", B);
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 1 });
    game.debugApplyEffect(A, effectOf("Sundering Growth"), [{ kind: "object", object: ring }]);
    settle(game);
    expect(zone(game, ring)).toBe("graveyard");
    expect(count(game, "Goblin Token", A)).toBe(2);
  });
});

describe("top-5000 batch 20c — Karn, Legacy Reforged", () => {
  it("is as big as your greatest artifact, and its upkeep mana pays only artifact spells", () => {
    const { game } = setUp(["Grizzly Bears", "Sol Ring"]);
    const karn = spawn(game, "Karn, Legacy Reforged");
    // An artifact with no mana ability of its own, so only Karn's mana and
    // the Forest can pay.
    spawn(game, "Ornithopter");
    expect(pt(game, karn)).toEqual([5, 5]);
    const upkeep = registry.get("Karn, Legacy Reforged")!.triggered[0].effect!;
    game.debugApplyEffect(A, upkeep, [], { source: karn });
    expect(pool(game)).toEqual(["C", "C"]);
    spawn(game, "Forest");
    const castable = (name: string): boolean =>
      game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === inHand(game, name));
    expect(castable("Grizzly Bears")).toBe(false);
    expect(castable("Sol Ring")).toBe(true);
  });
});

describe("top-5000 batch 20c — Regisaur Alpha", () => {
  it("makes a 3/3 trampling Dinosaur and gives other Dinosaurs you control haste, not itself", () => {
    const { game } = setUp();
    const alpha = game.debugSpawn("Regisaur Alpha", A, "battlefield", { announceEntry: true });
    settle(game);
    const [token] = named(game, "Dinosaur Token");
    expect(token).toBeDefined();
    const t = computeCharacteristics(game.state, registry, token);
    expect([t.power, t.toughness]).toEqual([3, 3]);
    expect(t.keywords.has("trample")).toBe(true);
    expect(t.keywords.has("haste")).toBe(true);
    expect(computeCharacteristics(game.state, registry, alpha).keywords.has("haste")).toBe(false);
    const theirs = spawn(game, "Regisaur Alpha", B);
    expect(computeCharacteristics(game.state, registry, theirs).keywords.has("haste")).toBe(false);
  });
});
