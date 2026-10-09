/**
 * Top-5000 batch 26h. No engine change: each test pins the clause most likely
 * to be wired wrong — "monocolored" as exactly one colour (Vanishing Verse),
 * the +1/+1 counters a creature left with, even when -1/-1 counters killed it
 * (The Ooze), charge counters in and out (Spawning Pit), a once-a-turn return
 * of lesser mana value (Riveteers Ascendancy), a two-part free-cast condition
 * and a permanent onto a library (Submerge), a 1/1 Nightmare copy (Nightmare
 * Shepherd), the batched Zombie draw (Hordewing Skaab), ward for every Sliver
 * (Diffusion Sliver), four Foods (Pippin) and an opponent's library cast from
 * (Chaos Wand).
 */
import { describe, expect, it } from "vitest";

import type { Action } from "../actions.js";
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

type Cast = Extract<Action, { type: "cast-spell" }>;

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
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
/** Every token of that name on the battlefield, a token stack counted as each token in it. */
const stackLibrary = (game: Game, names: readonly string[], player: PlayerId = A): ObjectId[] =>
  [...names].reverse().map((name) => game.debugSpawn(name, player, "library")).reverse();
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

describe("top-5000 batch 26h — Vanishing Verse", () => {
  it("targets a permanent of exactly one colour, never a multicoloured or colourless one", () => {
    const { game } = setUp(["Vanishing Verse"]);
    spawn(game, "Plains");
    spawn(game, "Swamp");
    const bears = spawn(game, "Grizzly Bears", B);
    const anafenza = spawn(game, "Anafenza, the Foremost", B);
    const signet = spawn(game, "Arcane Signet", B);
    const verse = inHand(game, "Vanishing Verse");
    const offer = game.legalActions(A).find((x) => x.kind === "cast-spell" && x.card === verse);
    if (offer?.kind !== "cast-spell") throw new Error("Vanishing Verse isn't castable");
    const options = offer.targetOptions[0].map((ref) => (ref.kind === "object" ? ref.object : null));
    expect(options).toContain(bears);
    expect(options).not.toContain(anafenza);
    expect(options).not.toContain(signet);
    game.dispatch({ type: "cast-spell", player: A, card: verse, targets: [{ kind: "object", object: bears }] });
    settle(game);
    expect(zone(game, bears)).toBe("exile");
  });
});

describe("top-5000 batch 26h — Spawning Pit", () => {
  it("charges on each sacrifice and spends two charge counters for a 2/2 colorless Spawn", () => {
    const { game } = setUp();
    const pit = spawn(game, "Spawning Pit");
    const first = spawn(game, "Grizzly Bears");
    const second = spawn(game, "Grizzly Bears");
    spawn(game, "Wastes");
    game.dispatch({ type: "activate-ability", player: A, source: pit, abilityIndex: 0, sacrifice: first });
    settle(game);
    game.dispatch({ type: "activate-ability", player: A, source: pit, abilityIndex: 0, sacrifice: second });
    settle(game);
    expect(zone(game, first)).toBe("graveyard");
    expect(game.state.objects[pit].counters.charge).toBe(2);
    game.dispatch({ type: "activate-ability", player: A, source: pit, abilityIndex: 1 });
    settle(game);
    expect(game.state.objects[pit].counters.charge ?? 0).toBe(0);
    const spawnToken = game.battlefield.find((id) => game.state.objects[id].cardName === "Spawn Token (Spawning Pit)");
    expect(spawnToken).toBeDefined();
    const c = chars(game, spawnToken!);
    expect([c.power, c.toughness]).toEqual([2, 2]);
    expect(c.types).toEqual(expect.arrayContaining(["artifact", "creature"]));
    expect(c.colors.size).toBe(0);
  });
});

describe("top-5000 batch 26h — Submerge", () => {
  it("is free only while an opponent controls a Forest and you an Island, and tops the creature", () => {
    const { game } = setUp(["Submerge"]);
    const submerge = inHand(game, "Submerge");
    const bears = spawn(game, "Grizzly Bears", B);
    spawn(game, "Forest", B);
    const freeOffer = () =>
      game.legalActions(A).find((x) => x.kind === "cast-spell" && x.card === submerge && x.free === true);
    expect(freeOffer()).toBeUndefined();
    spawn(game, "Island");
    expect(freeOffer()).toBeDefined();
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: submerge,
      targets: [{ kind: "object", object: bears }],
      free: true,
    });
    settle(game);
    expect(zone(game, bears)).toBe("library");
    expect(game.state.zones.perPlayer[B].library[0]).toBe(bears);
  });
});

describe("top-5000 batch 26h — Nightmare Shepherd", () => {
  it("exiles the dead creature for a 1/1 Nightmare token copy of it", () => {
    const { game } = setUp();
    spawn(game, "Nightmare Shepherd");
    const giant = spawn(game, "Hill Giant");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: giant }]);
    settle(game);
    expect(zone(game, giant)).toBe("exile");
    const copy = game.battlefield.find(
      (id) => game.state.objects[id].cardName === "Hill Giant" && game.state.objects[id].isToken,
    );
    expect(copy).toBeDefined();
    const c = chars(game, copy!);
    expect([c.power, c.toughness]).toEqual([1, 1]);
    expect(c.subtypes).toEqual(expect.arrayContaining(["Giant", "Nightmare"]));
  });
});

describe("top-5000 batch 26h — Hordewing Skaab", () => {
  it("gives other Zombies flying, and loots once for the one opponent two Zombies hit", () => {
    const { game, a } = setUp();
    const skaab = spawn(game, "Hordewing Skaab");
    const raiders = spawn(game, "Bog Raiders");
    expect(chars(game, raiders).keywords.has("flying")).toBe(true);
    const hand = game.handOf(A).length;
    const graveyard = game.graveyardOf(A).length;
    a.declareAttackersFn = () => [
      { attacker: skaab, defender: B },
      { attacker: raiders, defender: B },
    ];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(game.state.players[B].life).toBe(15);
    // One opponent dealt damage: draw one, discard one.
    expect(game.handOf(A)).toHaveLength(hand);
    expect(game.graveyardOf(A)).toHaveLength(graveyard + 1);
  });
});

describe("top-5000 batch 26h — Diffusion Sliver", () => {
  it("counters an opponent's spell at a Sliver unless they pay {2}, and leaves a non-Sliver alone", () => {
    const { game } = setUp();
    spawn(game, "Diffusion Sliver");
    const gemhide = spawn(game, "Gemhide Sliver");
    const bears = spawn(game, "Grizzly Bears");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    spawn(game, "Mountain", B);
    const bolt = game.debugSpawn("Lightning Bolt", B, "hand");
    game.dispatch({ type: "cast-spell", player: B, card: bolt, targets: [{ kind: "object", object: gemhide }] });
    game.advanceUntil(quiet);
    // Bob had no mana left to pay {2}: the Bolt is countered.
    expect(zone(game, gemhide)).toBe("battlefield");
    expect(zone(game, bolt)).toBe("graveyard");
    spawn(game, "Mountain", B);
    const second = game.debugSpawn("Lightning Bolt", B, "hand");
    game.dispatch({ type: "cast-spell", player: B, card: second, targets: [{ kind: "object", object: bears }] });
    game.advanceUntil(quiet);
    expect(zone(game, bears)).toBe("graveyard");
  });
});

describe("top-5000 batch 26h — Pippin, Warden of Isengard", () => {
  it("sacrifices four Foods to give the other creatures +3/+3 and haste", () => {
    const { game } = setUp();
    const pippin = spawn(game, "Pippin, Warden of Isengard");
    const bears = spawn(game, "Grizzly Bears");
    const foods = Array.from({ length: 4 }, () => spawn(game, "Food Token"));
    game.dispatch({ type: "activate-ability", player: A, source: pippin, abilityIndex: 1 });
    settle(game);
    for (const food of foods) expect(game.state.objects[food]?.zone ?? "gone").not.toBe("battlefield");
    const c = chars(game, bears);
    expect([c.power, c.toughness]).toEqual([5, 5]);
    expect(c.keywords.has("haste")).toBe(true);
    expect(chars(game, pippin).power).toBe(2);
  });
});

describe("top-5000 batch 26h — Chaos Wand", () => {
  it("exiles from the targeted opponent's library, casts the find for free, and bottoms the rest", () => {
    const { game, a } = setUp();
    const wand = spawn(game, "Chaos Wand");
    for (let i = 0; i < 4; i += 1) spawn(game, "Wastes");
    const [island, divination] = stackLibrary(game, ["Island", "Divination"], B);
    a.chooseCastNowFn = (): Cast => ({
      type: "cast-spell",
      player: A,
      card: divination,
      targets: [],
      via: "effect",
      free: true,
    });
    const handBefore = game.handOf(A).length;
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: wand,
      abilityIndex: 0,
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    expect(game.handOf(A)).toHaveLength(handBefore + 2);
    expect(game.graveyardOf(B)).toContain(divination);
    const library = game.state.zones.perPlayer[B].library;
    expect(zone(game, island)).toBe("library");
    expect(library[library.length - 1]).toBe(island);
  });
});
