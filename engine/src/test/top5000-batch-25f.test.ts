/**
 * Top-5000 batch 25f. No engine change: each test pins the clause most likely
 * to be wired wrong — Muxus putting *all* the qualifying Goblins and none of
 * the rest, Hero's Heirloom's legendary-only keywords, Well Rested's granted
 * untap trigger held to once a turn, Search for Azcanta's graveyard count
 * after its surveil, and Selfless Safewright's chosen type on *other*
 * permanents only.
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
const setUp = (): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
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
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const keywords = (game: Game, id: ObjectId): readonly string[] =>
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

describe("top-5000 batch 25f — Muxus, Goblin Grandee", () => {
  it("puts every Goblin creature card of mana value 5 or less onto the battlefield, the rest on the bottom", () => {
    const { game } = setUp();
    // Each spawn goes on top, so these six are the top six.
    for (const name of [
      "Wastes",
      "Muxus, Goblin Grandee",
      "Goblin King",
      "Hill Giant",
      "Krenko, Mob Boss",
      "Wastes",
    ]) {
      game.debugSpawn(name, A, "library");
    }
    const librarySize = game.libraryOf(A).length;
    game.debugSpawn("Muxus, Goblin Grandee", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(named(game, "Goblin King")).toHaveLength(1);
    expect(named(game, "Krenko, Mob Boss")).toHaveLength(1);
    // The six-drop Goblin and the non-Goblin aren't put.
    expect(named(game, "Muxus, Goblin Grandee")).toHaveLength(1);
    expect(named(game, "Hill Giant")).toHaveLength(0);
    const library = game.libraryOf(A);
    expect(library.length).toBe(librarySize - 2);
    const bottom = library.slice(-4).map((id) => game.state.objects[id].cardName).sort();
    expect(bottom).toEqual(["Hill Giant", "Muxus, Goblin Grandee", "Wastes", "Wastes"]);
  });
});

describe("top-5000 batch 25f — Hero's Heirloom", () => {
  it("gives trample and haste only while the equipped creature is legendary", () => {
    const { game } = setUp();
    const heirloom = spawn(game, "Hero's Heirloom");
    const bears = spawn(game, "Grizzly Bears");
    const isamaru = spawn(game, "Isamaru, Hound of Konda");
    game.state.objects[heirloom].attachedTo = bears;
    let c = computeCharacteristics(game.state, registry, bears);
    expect([c.power, c.toughness]).toEqual([4, 3]);
    expect([...c.keywords]).not.toContain("trample");
    expect([...c.keywords]).not.toContain("haste");
    game.state.objects[heirloom].attachedTo = isamaru;
    c = computeCharacteristics(game.state, registry, isamaru);
    expect([c.power, c.toughness]).toEqual([4, 3]);
    expect([...c.keywords]).toContain("trample");
    expect([...c.keywords]).toContain("haste");
    expect(keywords(game, bears)).not.toContain("trample");
  });
});

describe("top-5000 batch 25f — Well Rested", () => {
  it("grows the creature, gains 2 and draws when it untaps — once a turn", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const aura = spawn(game, "Well Rested");
    game.state.objects[aura].attachedTo = bears;
    game.state.objects[bears].tapped = true;
    const lifeBefore = life(game, A);
    const handBefore = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "untap", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(counters(game, bears)).toBe(2);
    expect(life(game, A)).toBe(lifeBefore + 2);
    expect(game.handOf(A).length).toBe(handBefore + 1);
    // A second untap the same turn doesn't trigger it.
    game.state.objects[bears].tapped = true;
    game.debugApplyEffect(A, { kind: "untap", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(counters(game, bears)).toBe(2);
    expect(life(game, A)).toBe(lifeBefore + 2);
    expect(game.handOf(A).length).toBe(handBefore + 1);
  });
});

describe("top-5000 batch 25f — Search for Azcanta", () => {
  const upkeep = registry.get("Search for Azcanta")!.triggered[0].effect!;

  it("may transform with seven cards in the graveyard", () => {
    const { game } = setUp();
    const search = spawn(game, "Search for Azcanta");
    for (let i = 0; i < 7; i += 1) game.debugSpawn("Wastes", A, "graveyard");
    game.debugApplyEffect(A, upkeep, [], { source: search });
    settle(game);
    expect(game.state.objects[search].face).toBe(1);
  });

  it("stays as it is with fewer", () => {
    const { game } = setUp();
    const search = spawn(game, "Search for Azcanta");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Wastes", A, "graveyard");
    game.debugApplyEffect(A, upkeep, [], { source: search });
    settle(game);
    expect(game.state.objects[search].face ?? 0).toBe(0);
  });
});

describe("top-5000 batch 25f — Selfless Safewright", () => {
  it("protects your other permanents of the chosen type, not itself or anyone else's", () => {
    const { game } = setUp();
    const elves = spawn(game, "Llanowar Elves");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Elvish Mystic", B);
    const safewright = game.debugSpawn("Selfless Safewright", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-creature-type" || quiet(s));
    expect(game.state.awaiting?.kind).toBe("choose-creature-type");
    game.dispatch({ type: "choose-creature-type", player: A, creatureType: "Elf" });
    settle(game);
    expect(keywords(game, elves)).toContain("hexproof");
    expect(keywords(game, elves)).toContain("indestructible");
    expect(keywords(game, bears)).not.toContain("indestructible");
    expect(keywords(game, theirs)).not.toContain("indestructible");
    expect(keywords(game, safewright)).not.toContain("indestructible");
  });
});
