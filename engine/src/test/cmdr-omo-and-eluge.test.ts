/**
 * Two commanders built on intrinsic mana abilities (rule 305.6).
 *
 * Omo, Queen of Vesuva — {2}{G/U} legendary 1/5 Shapeshifter Noble.
 *   Whenever Omo enters or attacks, put an everything counter on each of up
 *   to one target land and up to one target creature.
 *   Each land with an everything counter on it is every land type in
 *   addition to its other types.
 *   Each nonland creature with an everything counter on it is every creature
 *   type.
 *
 * Eluge, the Shoreless Sea — {1}{U}{U}{U} legendary Elemental Fish, P/T counted.
 *   Eluge's power and toughness are each equal to the number of Islands you
 *   control.
 *   Whenever Eluge enters or attacks, put a flood counter on target land.
 *   It's an Island in addition to its other types for as long as it has a
 *   flood counter on it.
 *   The first instant or sorcery spell you cast each turn costs {U} (or {1})
 *   less to cast for each land you control with a flood counter on it.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";
import { hasSubtype } from "../subtypes.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
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
const castable = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((action) => action.kind === "cast-spell" && action.card === card);
const tappedLands = (game: Game): number =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].controller === A && game.state.objects[id].tapped && game.characteristics(id).types.includes("land"),
  ).length;

describe("Omo, Queen of Vesuva", () => {
  it("as it enters: an everything counter on a land and a creature", () => {
    const { game, a } = setUp();
    const wastes = game.debugSpawn("Wastes", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugSpawn("Goblin Chieftain", A, "battlefield");
    a.chooseTargetsFn = () => [
      { kind: "object", object: wastes },
      { kind: "object", object: bears },
    ];
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Island", A, "battlefield");
    const omo = game.debugSpawn("Omo, Queen of Vesuva", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: omo });
    game.advanceUntil(quiet);
    expect(game.state.objects[wastes].counters).toEqual({ everything: 1 });
    expect(game.state.objects[bears].counters).toEqual({ everything: 1 });
    // The Wastes is every land type — a Gate and an Urza's too — and taps for
    // green now.
    const land = game.characteristics(wastes).subtypes;
    for (const type of ["Forest", "Island", "Gate", "Urza's"]) expect(hasSubtype(land, type)).toBe(true);
    // Only the Wastes untapped (paying for Omo may have tapped it).
    for (const id of game.state.zones.shared.battlefield) game.state.objects[id].tapped = id !== wastes;
    expect(castable(game, game.debugSpawn("Llanowar Elves", A, "hand"))).toBe(true);
    // The Bears is every creature type: the Goblin Chieftain pumps it.
    const c = game.characteristics(bears);
    expect(hasSubtype(c.subtypes, "Goblin")).toBe(true);
    expect([c.power, c.toughness]).toEqual([3, 3]);
  });

  it("a land creature is every land type but not every creature type", () => {
    const { game } = setUp();
    game.debugSpawn("Omo, Queen of Vesuva", A, "battlefield");
    const arbor = game.debugSpawn("Dryad Arbor", A, "battlefield");
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "everything", amount: 1 }, [
      { kind: "object", object: arbor },
    ]);
    const subtypes = game.characteristics(arbor).subtypes;
    expect(hasSubtype(subtypes, "Island")).toBe(true);
    expect(hasSubtype(subtypes, "Goblin")).toBe(false);
    expect(hasSubtype(subtypes, "Dryad")).toBe(true);
  });

  it("only while Omo is on the battlefield", () => {
    const { game } = setUp();
    const omo = game.debugSpawn("Omo, Queen of Vesuva", A, "battlefield");
    const wastes = game.debugSpawn("Wastes", A, "battlefield");
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "everything", amount: 1 }, [
      { kind: "object", object: wastes },
    ]);
    expect(hasSubtype(game.characteristics(wastes).subtypes, "Forest")).toBe(true);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: omo }]);
    game.advanceUntil(quiet);
    expect(hasSubtype(game.characteristics(wastes).subtypes, "Forest")).toBe(false);
    expect(castable(game, game.debugSpawn("Llanowar Elves", A, "hand"))).toBe(false);
  });

  it("can't target one land creature twice", () => {
    const { game, a } = setUp();
    const arbor = game.debugSpawn("Dryad Arbor", A, "battlefield");
    let offered: readonly string[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, options) => {
      offered = (options[1] ?? []).map((t) => (t.kind === "object" ? t.object : t.player));
      return [{ kind: "object", object: arbor }, null];
    };
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Island", A, "battlefield");
    const omo = game.debugSpawn("Omo, Queen of Vesuva", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: omo });
    game.advanceUntil(quiet);
    expect(offered).toContain(arbor);
    expect(game.state.objects[arbor].counters).toEqual({ everything: 1 });
  });
});

describe("Eluge, the Shoreless Sea", () => {
  const flood = (game: Game, land: ObjectId): void =>
    game.debugApplyEffect(A, registry.get("Eluge, the Shoreless Sea").triggered[0].effect!, [
      { kind: "object", object: land },
    ]);

  it("floods a land: an Island besides, tapping for {U}, and Eluge counts it", () => {
    const { game } = setUp();
    game.debugSpawn("Island", A, "battlefield");
    const eluge = game.debugSpawn("Eluge, the Shoreless Sea", A, "battlefield");
    const wastes = game.debugSpawn("Wastes", A, "battlefield");
    expect(game.characteristics(eluge).power).toBe(1);
    flood(game, wastes);
    expect(game.state.objects[wastes].counters).toEqual({ flood: 1 });
    expect(hasSubtype(game.characteristics(wastes).subtypes, "Island")).toBe(true);
    expect([game.characteristics(eluge).power, game.characteristics(eluge).toughness]).toEqual([2, 2]);
    const offered = game
      .legalActions(A)
      .filter((action) => action.kind === "activate-ability" && action.source === wastes)
      .map((action) => (action.kind === "activate-ability" ? action.text : ""));
    expect(offered.sort()).toEqual(["{T}: Add {C}.", "{T}: Add {U}."]);
  });

  it("the first instant or sorcery costs {U} (or {1}) less for each flooded land; the second, full price", () => {
    const { game } = setUp();
    game.debugSpawn("Island", A, "battlefield");
    game.debugSpawn("Eluge, the Shoreless Sea", A, "battlefield");
    const lands = [game.debugSpawn("Wastes", A, "battlefield"), game.debugSpawn("Wastes", A, "battlefield")];
    for (const land of lands) flood(game, land);
    // Divination is {2}{U}: two flooded lands take the {U} and one {1}.
    const first = game.debugSpawn("Divination", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: first });
    game.advanceUntil(quiet);
    expect(game.state.objects[first].zone).toBe("graveyard");
    expect(tappedLands(game)).toBe(1);
    // Two untapped lands left: not enough for a full-price second one.
    expect(castable(game, game.debugSpawn("Divination", A, "hand"))).toBe(false);
  });
});
