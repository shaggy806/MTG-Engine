/**
 * Exile-instead replacements that the moving permanent carries itself, and
 * the dies-only form of the graveyard-hate static (rule 614):
 *   - a finality counter (rule 122): "if a permanent with a finality counter
 *     on it would be put into a graveyard from the battlefield, exile it
 *     instead";
 *   - "if it would leave the battlefield, exile it instead of putting it
 *     anywhere else" (Whip of Erebos) — `GameObject.exileIfItWouldLeave`;
 *   - `would-be-put-into-graveyard { from: "battlefield" }` — "would die",
 *     which lets a discard or a mill through;
 *   - Admiral Brass, Unsinkable, the commander that puts finality counters on.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry, defineCard } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Test-only: the dies-only form on its own. The real cards that print it
 * (Vren, the Relentless) need more than this, so none is in the pool yet. */
const DIES_EXILER = "Test Dies Exiler";
const registry = createDefaultRegistry().register(
  defineCard({
    name: DIES_EXILER,
    manaCost: "{2}{B}",
    colors: ["B"],
    types: ["enchantment"],
    text: "If a creature an opponent controls would die, exile it instead.",
    static: [
      {
        affects: { scope: "self" },
        replacement: {
          event: "would-be-put-into-graveyard",
          instead: "exile",
          from: "battlefield",
          filter: { type: "creature", controlledBy: "opponent" },
        },
        text: "If a creature an opponent controls would die, exile it instead.",
      },
    ],
  }),
);

const mkGame = (aCards: readonly string[] = [], bCards: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aCards, ...Array(40).fill("Swamp")] },
      { player: B, cards: [...bCards, ...Array(40).fill("Island")] },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const handCard = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in ${player}'s hand`);
  return id;
};

const bolt = (game: Game, player: PlayerId, target: ObjectId): void => {
  game.debugSpawn("Mountain", player, "battlefield");
  game.dispatch({
    type: "cast-spell",
    player,
    card: handCard(game, player, "Lightning Bolt"),
    targets: [{ kind: "object", object: target }],
  });
  game.advanceUntil(quiet);
};

describe("finality counters (rule 122)", () => {
  it("a creature with one that would die is exiled instead, and never dies", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    // "Whenever another creature you control dies" — a death would show.
    game.debugSpawn("Pitiless Plunderer", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "finality", amount: 1 }, [
      { kind: "object", object: bears },
    ]);

    bolt(game, A, bears);

    expect(game.state.objects[bears].zone).toBe("exile");
    expect(game.state.creaturesDiedThisTurn).toBe(0);
    expect(game.battlefield.some((id) => game.state.objects[id].cardName === "Treasure Token")).toBe(
      false,
    );
    expect(game.eventsOfType("graveyard-replaced-with-exile")).toHaveLength(1);
  });

  it("only catches the graveyard: a bounced creature goes to its owner's hand", () => {
    const { game } = mkGame(["Unsummon"]);
    game.advanceUntil(toPrecombat);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "finality", amount: 1 }, [
      { kind: "object", object: bears },
    ]);
    game.debugSpawn("Island", A, "battlefield");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, A, "Unsummon"),
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[bears].zone).toBe("hand");
  });
});

describe('"if it would leave the battlefield, exile it instead" — Whip of Erebos', () => {
  const reanimate = (game: Game): ObjectId => {
    const whip = game.debugSpawn("Whip of Erebos", A, "battlefield");
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Swamp", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: whip,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[bear].zone).toBe("battlefield");
    return bear;
  };

  it("exiles the reanimated creature when it's bounced before the end step", () => {
    const { game } = mkGame(["Unsummon"]);
    game.advanceUntil(toPrecombat);
    const bear = reanimate(game);
    game.debugSpawn("Island", A, "battlefield");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, A, "Unsummon"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[bear].zone).toBe("exile");
    expect(game.eventsOfType("leave-replaced-with-exile")).toEqual([
      expect.objectContaining({ object: bear, intendedZone: "hand" }),
    ]);
    // The replacement followed that permanent only, and ended with it.
    expect(game.state.objects[bear].exileIfItWouldLeave).toBeUndefined();
  });

  it("exiles it when it dies", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    const bear = reanimate(game);
    expect(game.characteristics(bear).keywords.has("haste")).toBe(true);
    bolt(game, A, bear);

    expect(game.state.objects[bear].zone).toBe("exile");
    expect(game.state.creaturesDiedThisTurn).toBe(0);
  });

  it("is gone once the card is a new object: a second trip is an ordinary one", () => {
    const { game } = mkGame(["Unsummon"]);
    game.advanceUntil(toPrecombat);
    const bear = reanimate(game);
    // Flicker it (exile, then back as a new object — rule 400.7): the
    // replacement doesn't come back with it.
    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [{ kind: "object", object: bear }]);
    expect(game.state.objects[bear].zone).toBe("battlefield");
    game.debugSpawn("Island", A, "battlefield");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, A, "Unsummon"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[bear].zone).toBe("hand");
  });
});

describe('the dies-only form — would-be-put-into-graveyard { from: "battlefield" }', () => {
  it("exiles an opponent's creature that would die", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn(DIES_EXILER, A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    bolt(game, A, bears);

    expect(game.state.objects[bears].zone).toBe("exile");
    expect(game.state.creaturesDiedThisTurn).toBe(0);
  });

  it("lets its controller's own creatures die (the filter reads who controls it)", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn(DIES_EXILER, A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    bolt(game, A, bears);

    expect(game.state.objects[bears].zone).toBe("graveyard");
  });

  it("doesn't catch a creature card an opponent discards or mills", () => {
    const { game } = mkGame([], ["Grizzly Bears", "Grizzly Bears"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn(DIES_EXILER, A, "battlefield");
    const [discarded] = game.handOf(B).filter(
      (id) => game.state.objects[id].cardName === "Grizzly Bears",
    );
    game.debugApplyEffect(A, { kind: "discard", target: 0, amount: game.handOf(B).length }, [
      { kind: "player", player: B },
    ]);
    game.advanceUntil(quiet);
    expect(game.state.objects[discarded].zone).toBe("graveyard");

    const milled = game.debugSpawn("Grizzly Bears", B, "library");
    game.debugApplyEffect(A, { kind: "mill", target: 0, amount: 1 }, [
      { kind: "player", player: B },
    ]);
    expect(game.state.objects[milled].zone).toBe("graveyard");
  });
});

describe("Admiral Brass, Unsinkable", () => {
  it("mills four when it enters", () => {
    const { game } = mkGame(["Admiral Brass, Unsinkable"]);
    game.advanceUntil(toPrecombat);
    for (const land of ["Island", "Swamp", "Mountain", "Swamp", "Swamp"]) {
      game.debugSpawn(land, A, "battlefield");
    }
    const graveyard = game.state.zones.perPlayer[A].graveyard.length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, A, "Admiral Brass, Unsinkable"),
      targets: [],
    });
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(graveyard + 4);
  });

  const toCombatTrigger = (game: Game): void => {
    game.advanceUntil(
      (s) => s.turn.number === 1 && s.turn.step === "begin-combat" && quiet(s),
    );
  };

  it("returns a Pirate at the beginning of combat with a finality counter, as a hasty 4/4", () => {
    const { game, a } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Admiral Brass, Unsinkable", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const plunderer = game.debugSpawn("Pitiless Plunderer", A, "graveyard");
    let offered: readonly ObjectId[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, options) => {
      offered = options[0].flatMap((t) => (t.kind === "object" ? [t.object] : []));
      return [{ kind: "object", object: plunderer }];
    };
    toCombatTrigger(game);

    // Only a Pirate creature card is a legal target.
    expect(offered).toContain(plunderer);
    expect(offered).not.toContain(bears);

    const back = game.state.objects[plunderer];
    expect(back.zone).toBe("battlefield");
    expect(back.counters["finality"]).toBe(1);
    const chars = game.characteristics(plunderer);
    expect([chars.power, chars.toughness]).toEqual([4, 4]);
    expect(chars.keywords.has("haste")).toBe(true);

    // "It has base power and toughness 4/4" lasts; the haste doesn't.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    const later = game.characteristics(plunderer);
    expect([later.power, later.toughness]).toEqual([4, 4]);
    expect(later.keywords.has("haste")).toBe(false);
  });

  it("the returned Pirate is exiled when it would die", () => {
    const { game, a } = mkGame(["Lightning Bolt", "Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Admiral Brass, Unsinkable", A, "battlefield");
    const plunderer = game.debugSpawn("Pitiless Plunderer", A, "graveyard");
    a.chooseTargetsFn = () => [{ kind: "object", object: plunderer }];
    toCombatTrigger(game);
    expect(game.state.objects[plunderer].zone).toBe("battlefield");

    // 4 toughness: two Bolts.
    game.debugSpawn("Mountain", A, "battlefield");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, A, "Lightning Bolt"),
      targets: [{ kind: "object", object: plunderer }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[plunderer].zone).toBe("battlefield");
    bolt(game, A, plunderer);

    expect(game.state.objects[plunderer].zone).toBe("exile");
    expect(game.state.creaturesDiedThisTurn).toBe(0);
  });

  it("returning nothing is a choice", () => {
    const { game, a } = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Admiral Brass, Unsinkable", A, "battlefield");
    const plunderer = game.debugSpawn("Pitiless Plunderer", A, "graveyard");
    a.chooseTargetsFn = () => [null];
    toCombatTrigger(game);
    expect(game.state.objects[plunderer].zone).toBe("graveyard");
  });
});
