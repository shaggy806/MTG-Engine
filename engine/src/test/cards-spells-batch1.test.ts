/**
 * Removal and protection instants/sorceries, each driven through a real cast:
 *
 * - Boros Charm: 4 to a player or planeswalker (never a creature), mass
 *   indestructible for what you control *as it resolves*, or double strike.
 * - Despark: exiles a permanent with mana value 4 or greater, never a cheaper one.
 * - Bedevil: destroys an artifact, creature or planeswalker — not a land or an
 *   enchantment.
 * - Dispatch: taps, and exiles as well only with metalcraft.
 * - Tamiyo's Safekeeping: a permanent *you* control, any type, gains hexproof
 *   and indestructible, and you gain 2.
 * - Supreme Verdict: every creature, and a counterspell doesn't stop it.
 * - Unexpected Windfall: discard as a cost, draw two, two Treasures.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";
import { legalTargets } from "../targeting.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (aHand: readonly string[] = [], bHand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Forest")] },
      { player: B, cards: [...bHand, ...Array<string>(40).fill("Forest")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const lands = (game: Game, player: PlayerId, names: readonly string[]): void => {
  for (const name of names) game.debugSpawn(name, player, "battlefield");
};
const cardIn = (game: Game, zone: readonly ObjectId[], name: string): ObjectId => {
  const id = zone.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });
const zoneOf = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const keywords = (game: Game, id: ObjectId): ReadonlySet<string> => game.characteristics(id).keywords;

/** The legal targets per slot of one mode of a `castModal` spell in hand. */
const modeOptions = (game: Game, card: ObjectId, mode: number): readonly (readonly TargetRef[])[] => {
  const offer = game.legalActions(A).find((o) => o.kind === "cast-spell" && o.card === card);
  if (offer?.kind !== "cast-spell" || offer.castModal === undefined) throw new Error("no modal offer");
  return offer.castModal.modes[mode].targetOptions;
};
/** The legal targets of a plain (non-modal) spell's first slot. */
const slotOptions = (game: Game, card: ObjectId): readonly TargetRef[] => {
  const offer = game.legalActions(A).find((o) => o.kind === "cast-spell" && o.card === card);
  if (offer?.kind !== "cast-spell") throw new Error("not castable");
  return offer.targetOptions[0];
};

describe("Boros Charm", () => {
  const charmed = () => {
    const { game } = setUp(["Boros Charm"]);
    lands(game, A, ["Mountain", "Plains"]);
    return { game, charm: cardIn(game, game.handOf(A), "Boros Charm") };
  };

  it("deals 4 to a player or a planeswalker, and can't be aimed at a creature", () => {
    const { game, charm } = charmed();
    const garruk = game.debugSpawn("Garruk Wildspeaker", B, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");

    const [slot] = modeOptions(game, charm, 0);
    expect(slot).toContainEqual(player(B));
    // "Target player" is any player, not just an opponent.
    expect(slot).toContainEqual(player(A));
    expect(slot).toContainEqual(obj(garruk));
    expect(slot).not.toContainEqual(obj(bears));

    game.dispatch({ type: "cast-spell", player: A, card: charm, modes: [0], targets: [player(B)] });
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(16);
    expect(game.state.players[A].life).toBe(20);
  });

  it("4 damage to a 3-loyalty planeswalker kills it", () => {
    const { game, charm } = charmed();
    const garruk = game.debugSpawn("Garruk Wildspeaker", B, "battlefield");
    game.dispatch({ type: "cast-spell", player: A, card: charm, modes: [0], targets: [obj(garruk)] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, garruk)).toBe("graveyard");
    expect(game.state.players[B].life).toBe(20);
  });

  it("makes every permanent you control indestructible, and only those, as it resolves", () => {
    const { game, charm } = charmed();
    const mine = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const ring = game.debugSpawn("Sol Ring", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");

    game.dispatch({ type: "cast-spell", player: A, card: charm, modes: [1], targets: [] });
    game.advanceUntil(quiet);
    expect(keywords(game, mine).has("indestructible")).toBe(true);
    expect(keywords(game, ring).has("indestructible")).toBe(true);
    expect(keywords(game, theirs).has("indestructible")).toBe(false);

    // Something arriving afterwards doesn't get it (the 2024-11-08 ruling).
    const late = game.debugSpawn("Grizzly Bears", A, "battlefield");
    expect(keywords(game, late).has("indestructible")).toBe(false);

    game.debugApplyEffect(B, { kind: "destroy-all", filter: { typesAnyOf: ["creature", "artifact"] } });
    game.advanceUntil(quiet);
    expect(zoneOf(game, mine)).toBe("battlefield");
    expect(zoneOf(game, ring)).toBe("battlefield");
    expect(zoneOf(game, theirs)).toBe("graveyard");
    expect(zoneOf(game, late)).toBe("graveyard");
  });

  it("gives one target creature double strike, and nothing else", () => {
    const { game, charm } = charmed();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const other = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const [slot] = modeOptions(game, charm, 2);
    expect(slot).not.toContainEqual(player(B));

    game.dispatch({ type: "cast-spell", player: A, card: charm, modes: [2], targets: [obj(bears)] });
    game.advanceUntil(quiet);
    expect(keywords(game, bears).has("double-strike")).toBe(true);
    expect(keywords(game, bears).has("indestructible")).toBe(false);
    expect(keywords(game, other).has("double-strike")).toBe(false);
    expect(game.state.players[B].life).toBe(20);
  });
});

describe("Despark", () => {
  it("exiles a permanent with mana value 4 or more, and can't target a cheaper one", () => {
    const { game } = setUp(["Despark"]);
    lands(game, A, ["Plains", "Swamp"]);
    const despark = cardIn(game, game.handOf(A), "Despark");
    const wurm = game.debugSpawn("Craw Wurm", B, "battlefield"); // MV 6
    const garruk = game.debugSpawn("Garruk Wildspeaker", B, "battlefield"); // MV 4, exactly
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield"); // MV 2
    const ring = game.debugSpawn("Sol Ring", B, "battlefield"); // MV 1
    const token = game.debugSpawn("Treasure Token", B, "battlefield"); // no mana cost

    const slot = slotOptions(game, despark);
    expect(slot).toContainEqual(obj(wurm));
    expect(slot).toContainEqual(obj(garruk));
    expect(slot).not.toContainEqual(obj(bears));
    expect(slot).not.toContainEqual(obj(ring));
    expect(slot).not.toContainEqual(obj(token));
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: despark, targets: [obj(bears)] }),
    ).toThrow();

    game.dispatch({ type: "cast-spell", player: A, card: despark, targets: [obj(wurm)] });
    game.advanceUntil(quiet);
    // Exiled, not destroyed.
    expect(zoneOf(game, wurm)).toBe("exile");
  });
});

describe("Bedevil", () => {
  it("destroys an artifact, a creature or a planeswalker, but can't touch a land or an enchantment", () => {
    const { game } = setUp(["Bedevil"]);
    lands(game, A, ["Swamp", "Swamp", "Mountain"]);
    const bedevil = cardIn(game, game.handOf(A), "Bedevil");
    const ring = game.debugSpawn("Sol Ring", B, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const garruk = game.debugSpawn("Garruk Wildspeaker", B, "battlefield");
    const forest = game.debugSpawn("Forest", B, "battlefield");
    const light = game.debugSpawn("Banishing Light", B, "battlefield");

    const slot = slotOptions(game, bedevil);
    expect(slot).toContainEqual(obj(ring));
    expect(slot).toContainEqual(obj(bears));
    expect(slot).toContainEqual(obj(garruk));
    expect(slot).not.toContainEqual(obj(forest));
    expect(slot).not.toContainEqual(obj(light));
    expect(slot).not.toContainEqual(player(B));

    game.dispatch({ type: "cast-spell", player: A, card: bedevil, targets: [obj(garruk)] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, garruk)).toBe("graveyard");
    expect(zoneOf(game, bears)).toBe("battlefield");
  });
});

describe("Dispatch", () => {
  const cast = (artifacts: number) => {
    const { game } = setUp(["Dispatch"]);
    lands(game, A, ["Plains"]);
    for (let i = 0; i < artifacts; i += 1) game.debugSpawn("Sol Ring", A, "battlefield");
    const wurm = game.debugSpawn("Craw Wurm", B, "battlefield");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardIn(game, game.handOf(A), "Dispatch"),
      targets: [obj(wurm)],
    });
    game.advanceUntil(quiet);
    return { game, wurm };
  };

  it("only taps the creature without metalcraft", () => {
    const { game, wurm } = cast(2);
    expect(zoneOf(game, wurm)).toBe("battlefield");
    expect(game.state.objects[wurm].tapped).toBe(true);
  });

  it("exiles it too with three artifacts", () => {
    const { game, wurm } = cast(3);
    expect(zoneOf(game, wurm)).toBe("exile");
  });

  it("an opponent's artifacts don't count toward your metalcraft", () => {
    const { game } = setUp(["Dispatch"]);
    lands(game, A, ["Plains"]);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Sol Ring", B, "battlefield");
    const wurm = game.debugSpawn("Craw Wurm", B, "battlefield");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardIn(game, game.handOf(A), "Dispatch"),
      targets: [obj(wurm)],
    });
    game.advanceUntil(quiet);
    expect(zoneOf(game, wurm)).toBe("battlefield");
  });
});

describe("Tamiyo's Safekeeping", () => {
  it("targets only a permanent you control, of any type", () => {
    const { game } = setUp(["Tamiyo's Safekeeping"]);
    lands(game, A, ["Forest"]);
    const card = cardIn(game, game.handOf(A), "Tamiyo's Safekeeping");
    const ring = game.debugSpawn("Sol Ring", A, "battlefield");
    const mine = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const slot = slotOptions(game, card);
    expect(slot).toContainEqual(obj(ring));
    expect(slot).toContainEqual(obj(mine));
    expect(slot).not.toContainEqual(obj(theirs));
    expect(slot).not.toContainEqual(player(A));
  });

  it("gives hexproof and indestructible until end of turn, and you gain 2", () => {
    const { game } = setUp(["Tamiyo's Safekeeping"]);
    lands(game, A, ["Forest"]);
    const ring = game.debugSpawn("Sol Ring", A, "battlefield");
    const other = game.debugSpawn("Sol Ring", A, "battlefield");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardIn(game, game.handOf(A), "Tamiyo's Safekeeping"),
      targets: [obj(ring)],
    });
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(22);
    expect(keywords(game, ring).has("hexproof")).toBe(true);
    expect(keywords(game, ring).has("indestructible")).toBe(true);
    expect(keywords(game, other).has("hexproof")).toBe(false);

    // The opponent can't aim anything at it any more; its controller still can.
    const bOptions = legalTargets(game.state, registry, "artifact", B);
    expect(bOptions).not.toContainEqual(obj(ring));
    expect(bOptions).toContainEqual(obj(other));
    expect(legalTargets(game.state, registry, "artifact", A)).toContainEqual(obj(ring));

    game.debugApplyEffect(B, { kind: "destroy-all", filter: { type: "artifact" } });
    game.advanceUntil(quiet);
    expect(zoneOf(game, ring)).toBe("battlefield");
    expect(zoneOf(game, other)).toBe("graveyard");

    // Until end of turn: gone by Bob's turn.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(keywords(game, ring).has("hexproof")).toBe(false);
    expect(keywords(game, ring).has("indestructible")).toBe(false);
  });
});

describe("Supreme Verdict", () => {
  it("destroys every creature, and nothing else", () => {
    const { game } = setUp(["Supreme Verdict"]);
    lands(game, A, ["Plains", "Plains", "Island", "Island"]);
    const mine = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirs = game.debugSpawn("Craw Wurm", B, "battlefield");
    const ring = game.debugSpawn("Sol Ring", B, "battlefield");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardIn(game, game.handOf(A), "Supreme Verdict"),
    });
    game.advanceUntil(quiet);
    expect(zoneOf(game, mine)).toBe("graveyard");
    expect(zoneOf(game, theirs)).toBe("graveyard");
    expect(zoneOf(game, ring)).toBe("battlefield");
  });

  it("resolves through a Counterspell", () => {
    const { game } = setUp(["Supreme Verdict"], ["Counterspell"]);
    lands(game, A, ["Plains", "Plains", "Island", "Island"]);
    lands(game, B, ["Island", "Island"]);
    const theirs = game.debugSpawn("Craw Wurm", B, "battlefield");
    const verdict = cardIn(game, game.handOf(A), "Supreme Verdict");
    game.dispatch({ type: "cast-spell", player: A, card: verdict });
    game.dispatch({ type: "pass-priority", player: A });
    const counterspell = cardIn(game, game.handOf(B), "Counterspell");
    game.dispatch({ type: "cast-spell", player: B, card: counterspell, targets: [obj(verdict)] });
    game.advanceUntil(quiet);

    expect(game.events.some((e) => e.type === "counter-failed" && e.object === verdict)).toBe(true);
    expect(zoneOf(game, counterspell)).toBe("graveyard");
    expect(zoneOf(game, theirs)).toBe("graveyard");
    expect(zoneOf(game, verdict)).toBe("graveyard");
  });
});

describe("Unexpected Windfall", () => {
  it("discards a card as it's cast, then draws two and makes two Treasures", () => {
    const { game } = setUp(["Unexpected Windfall", "Grizzly Bears"]);
    lands(game, A, ["Mountain", "Mountain", "Mountain", "Mountain"]);
    const windfall = cardIn(game, game.handOf(A), "Unexpected Windfall");
    const before = game.handOf(A).length;
    const graveyardBefore = game.graveyardOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: windfall });
    game.advanceUntil(quiet);

    // Minus the Windfall and the discard, plus two.
    expect(game.handOf(A).length).toBe(before - 2 + 2);
    // The discarded card and the Windfall itself.
    expect(game.graveyardOf(A).length).toBe(graveyardBefore + 2);
    expect(game.events.some((e) => e.type === "cards-discarded" && e.player === A)).toBe(true);
    const treasures = game.battlefield
      .filter((id) => game.state.objects[id].cardName === "Treasure Token")
      .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(treasures).toBe(2);
  });

  it("can't be cast without another card to discard", () => {
    const { game } = setUp([]);
    lands(game, A, ["Mountain", "Mountain", "Mountain", "Mountain"]);
    game.debugApplyEffect(A, { kind: "discard-hand", who: "you" });
    const windfall = game.debugSpawn("Unexpected Windfall", A, "hand");
    expect(game.handOf(A)).toEqual([windfall]);
    expect(game.legalActions(A).some((o) => o.kind === "cast-spell" && o.card === windfall)).toBe(false);

    // One other card is enough.
    game.debugSpawn("Grizzly Bears", A, "hand");
    expect(game.legalActions(A).some((o) => o.kind === "cast-spell" && o.card === windfall)).toBe(true);
  });
});
