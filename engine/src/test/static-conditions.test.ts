/**
 * The newer `StaticCondition` kinds, and the `{X}` that is paid in life.
 *
 * Delirium (rule 702.120) is the new condition. Threshold and "a creature
 * died this turn" already existed, and are covered here only where a
 * newly-authored card leans on them.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aCards: readonly string[]) => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...aCards, ...Array(40).fill("Swamp")] },
      { player: B, cards: Array(40).fill("Forest")},
    ],
  });
  return { game, a };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const handCard = (game: Game, name: string): ObjectId => {
  const id = game.handOf(A).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, game.registry, id);
  return [c.power, c.toughness];
};

describe("delirium — four or more card types in your graveyard", () => {
  /** Dragon's Rage Channeler is a 1/1 that becomes a 3/3 flier with delirium. */
  const channelerWith = (graveyard: readonly string[]) => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    const drc = game.debugSpawn("Dragon's Rage Channeler", A, "battlefield");
    for (const name of graveyard) game.debugSpawn(name, A, "graveyard");
    return { game, drc };
  };

  it("is off below four types", () => {
    // Land, creature, instant — three.
    const { game, drc } = channelerWith(["Swamp", "Grizzly Bears", "Lightning Bolt"]);
    expect(pt(game, drc)).toEqual([1, 1]);
    expect(computeCharacteristics(game.state, game.registry, drc).keywords).not.toContain(
      "flying",
    );
  });

  it("switches on at four", () => {
    const { game, drc } = channelerWith([
      "Swamp",
      "Grizzly Bears",
      "Lightning Bolt",
      "Arcane Signet", // artifact — the fourth type
    ]);
    expect(pt(game, drc)).toEqual([3, 3]);
    const c = computeCharacteristics(game.state, game.registry, drc);
    expect(c.keywords).toContain("flying");
    expect(c.restrictions).toContain("must-attack");
  });

  it("counts types, not cards — five creatures is still one type", () => {
    const { game, drc } = channelerWith(Array(5).fill("Grizzly Bears"));
    expect(pt(game, drc)).toEqual([1, 1]);
  });

  it("counts both halves of an artifact creature", () => {
    // Artifact + creature + land + instant = four off three cards.
    const { game, drc } = channelerWith([
      "Solemn Simulacrum",
      "Swamp",
      "Lightning Bolt",
    ]);
    expect(pt(game, drc)).toEqual([3, 3]);
  });
});

describe("morbid and threshold on newly-authored cards", () => {
  it("Tragic Slip is -1/-1, or -13/-13 once something has died", () => {
    const { game } = mkGame(["Tragic Slip", "Tragic Slip"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Swamp", A, "battlefield");
    game.debugSpawn("Swamp", A, "battlefield");
    const wurm = game.debugSpawn("Craw Wurm", B, "battlefield"); // 6/4

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, "Tragic Slip"),
      targets: [{ kind: "object", object: wurm }],
    });
    game.advanceUntil(quiet);
    expect(pt(game, wurm)).toEqual([5, 3]);

    // Now kill something, and the second copy is a wrath in miniature.
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [
      { kind: "object", object: bear },
    ]);
    game.advanceUntil(quiet);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, "Tragic Slip"),
      targets: [{ kind: "object", object: wurm }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[wurm].zone).toBe("graveyard");
  });

  it("Cabal Ritual makes three, or five past threshold", () => {
    const { game } = mkGame(["Cabal Ritual", "Cabal Ritual"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Swamp", A, "battlefield");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, "Cabal Ritual"),
      targets: [],
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0);
    expect(game.state.players[A].manaPool.B).toBe(3);

    // Seven cards in the graveyard turns threshold on.
    for (let i = 0; i < 7; i += 1) game.debugSpawn("Swamp", A, "graveyard");
    game.state.players[A].manaPool.B = 0;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, "Cabal Ritual"),
      targets: [],
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0);
    expect(game.state.players[A].manaPool.B).toBe(5);
  });
});

describe("Toxic Deluge — an {X} paid in life, not mana", () => {
  it("offers an X bounded by life, then charges it", () => {
    const { game } = mkGame(["Toxic Deluge"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Swamp", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield"); // 2/2
    const wurm = game.debugSpawn("Craw Wurm", B, "battlefield"); // 6/4
    const card = handCard(game, "Toxic Deluge");

    const action = game
      .legalActions(A)
      .find((x) => x.kind === "cast-spell" && x.card === card);
    // The ceiling is the life total, not what three Swamps could pay for.
    expect(action?.kind === "cast-spell" && action.xCost?.maxX).toBe(
      game.state.players[A].life,
    );

    const life0 = game.state.players[A].life;
    game.dispatch({ type: "cast-spell", player: A, card, targets: [], xValue: 3 });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0);

    expect(game.state.players[A].life).toBe(life0 - 3);
    // Symmetrical, and it doesn't care about toughness beyond X.
    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(pt(game, wurm)).toEqual([3, 1]);
  });
});
