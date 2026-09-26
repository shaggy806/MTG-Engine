/**
 * Goad beyond "every creature a player controls" (rule 701.15): a target
 * creature, every creature matching a filter, a goad for the rest of the
 * game, and the `goaded` filter clause, read as a creature last existed when
 * it dies. Plus the attack-requirement maximization every goad feeds (rule
 * 508.1d), and Kardur, Doomscourge's goad-like rule of the game, which isn't a
 * goad (rule 611.2c). The static goad is Baeloth Barrityl, Entertainer's, and
 * is tested with it (commanders-goad-suspect.test.ts).
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { matchesFilter } from "../filter.js";
import { Game } from "../game.js";
import { goadersOf } from "../goad.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { activePlayerOf } from "../state.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const D = asPlayerId("dave");
const registry = createDefaultRegistry();

const setUp = (players: readonly PlayerId[] = [A, B]) => {
  const ctl = {} as Record<PlayerId, ScriptedController>;
  for (const player of players) ctl[player] = new ScriptedController(player);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: ctl,
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  expect(activePlayerOf(game.state)).toBe(A);
  return { game, ctl };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const goaders = (game: Game, id: ObjectId): readonly PlayerId[] => goadersOf(game.state, registry, id);

type AttackOffer = Extract<LegalAction, { kind: "declare-attackers" }>;
/** Advance to `player`'s declaration of attackers and read what's offered. */
const attackOffer = (game: Game, player: PlayerId): AttackOffer => {
  game.advanceUntil((s) => (s.awaiting?.kind === "attackers" && s.awaiting.player === player) || s.result.over);
  const offer = game.legalActions(player).find((o) => o.kind === "declare-attackers");
  if (offer?.kind !== "declare-attackers") throw new Error(`no attack offer for ${player}`);
  return offer;
};
const sorted = <T>(xs: readonly T[] | undefined): T[] => [...(xs ?? [])].sort();

describe("goading a target creature", () => {
  it("goads that creature, which must attack a player other than the goader", () => {
    const { game } = setUp([A, B, C]);
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [obj(bears)]);
    expect(goaders(game, bears)).toEqual([A]);

    const offer = attackOffer(game, B);
    expect(offer.mustAttack).toContain(bears);
    expect(offer.defendersFor[bears]).toEqual([C]);
  });

  it("goading it again adds nothing (rule 701.15d)", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [obj(bears)]);
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [obj(bears)]);
    expect(game.state.objects[bears].goadedBy).toEqual([A]);
  });

  it("reaches only a creature", () => {
    const { game } = setUp();
    const island = spawn(game, "Island", B);
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [obj(island)]);
    expect(goaders(game, island)).toEqual([]);
  });

  it("ends when the creature changes zones — it's a new object (rule 400.7)", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [obj(bears)]);
    game.debugApplyEffect(A, { kind: "goad", target: 0, forGame: true }, [obj(bears)]);
    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [obj(bears)]);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(goaders(game, bears)).toEqual([]);
  });
});

describe("goading every creature that matches a filter", () => {
  it("goads each one, whoever controls it", () => {
    const { game } = setUp([A, B, C]);
    const bobs = spawn(game, "Grizzly Bears", B);
    const carols = spawn(game, "Grizzly Bears", C);
    const alices = spawn(game, "Grizzly Bears", A);
    const elves = spawn(game, "Llanowar Elves", B);
    game.debugApplyEffect(A, { kind: "goad", filter: { type: "creature", power: { op: "gte", n: 2 } } });
    for (const id of [bobs, carols, alices]) expect(goaders(game, id)).toEqual([A]);
    expect(goaders(game, elves)).toEqual([]);
  });
});

describe("goading for the rest of the game", () => {
  it("outlasts the goader's next turn, where an ordinary goad lapses", () => {
    const { game } = setUp();
    const kept = spawn(game, "Grizzly Bears", B);
    const lapsing = spawn(game, "Llanowar Elves", B);
    game.debugApplyEffect(A, { kind: "goad", target: 0, forGame: true }, [obj(kept)]);
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [obj(lapsing)]);

    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(activePlayerOf(game.state)).toBe(A);
    expect(goaders(game, kept)).toEqual([A]);
    expect(goaders(game, lapsing)).toEqual([]);
    // Still binding on Bob's next turn.
    expect(attackOffer(game, B).mustAttack).toEqual([kept]);
  });

  it("created goaded: the tokens are the effect's controller's to goad, its own included", () => {
    const { game } = setUp();
    game.debugApplyEffect(A, {
      kind: "create-token",
      token: "Bird Token",
      count: 1,
      who: "each-player",
      tapped: true,
      goadedForGame: true,
    });
    const birds = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Bird Token",
    );
    expect(birds.length).toBe(2);
    for (const id of birds) expect(goaders(game, id)).toEqual([A]);
    const alices = birds.find((id) => game.state.objects[id].controller === A)!;
    // Alice's own Bird attacks each combat if able too (rule 701.15b).
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(attackOffer(game, A).mustAttack).toContain(alices);
  });
});

describe("attack requirements are obeyed as far as they can be (rule 508.1d)", () => {
  it("a goaded creature attacks a player other than its goader — not a planeswalker", () => {
    const { game } = setUp([A, B, C]);
    const bears = spawn(game, "Grizzly Bears", B);
    const garruk = spawn(game, "Garruk Wildspeaker", C);
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [obj(bears)]);
    const offer = attackOffer(game, B);
    expect(offer.defenders).toContain(garruk);
    expect(offer.defendersFor[bears]).toEqual([C]);
  });

  it("goaded by every opponent, it attacks one of them — either — but no planeswalker", () => {
    const { game } = setUp([A, B, C]);
    const bears = spawn(game, "Grizzly Bears", B);
    spawn(game, "Garruk Wildspeaker", C);
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [obj(bears)]);
    game.debugApplyEffect(C, { kind: "goad", target: 0 }, [obj(bears)]);
    expect(sorted(goaders(game, bears))).toEqual(sorted([A, C]));
    expect(sorted(attackOffer(game, B).defendersFor[bears])).toEqual(sorted([A, C]));
  });

  it("goaded by two of three opponents, it attacks the third", () => {
    const { game } = setUp([A, B, C, D]);
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [obj(bears)]);
    game.debugApplyEffect(C, { kind: "goad", target: 0 }, [obj(bears)]);
    expect(attackOffer(game, B).defendersFor[bears]).toEqual([D]);
  });

  it("an encore requirement and a goad by the same player are one requirement each, either obeyed", () => {
    const { game } = setUp([A, B, C]);
    const bears = spawn(game, "Grizzly Bears", B);
    game.state.objects[bears].mustAttackPlayer = A;
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [obj(bears)]);
    const offer = attackOffer(game, B);
    expect(offer.mustAttack).toContain(bears);
    expect(sorted(offer.defendersFor[bears])).toEqual(sorted([A, C]));
  });

  it("an encore opponent it can't attack binds it to nothing", () => {
    const { game } = setUp([A, B, C]);
    const bears = spawn(game, "Grizzly Bears", B);
    game.state.objects[bears].mustAttackPlayer = A;
    // Alice's Vow of Duty: "can't attack you or planeswalkers you control".
    const vow = spawn(game, "Vow of Duty", A);
    game.state.objects[vow].attachedTo = bears;
    const offer = attackOffer(game, B);
    expect(offer.mustAttack).not.toContain(bears);
    expect(offer.defendersFor[bears]).toEqual([C]);
  });
});

describe("the goaded filter clause", () => {
  it("matches a goaded creature, and one that died goaded as it last was", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const elves = spawn(game, "Llanowar Elves", B);
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [obj(bears)]);
    const goaded = (id: ObjectId, lastKnown = false): boolean =>
      matchesFilter(game.state, registry, id, { goaded: true }, { you: A, lastKnown });
    expect(goaded(bears)).toBe(true);
    expect(goaded(elves)).toBe(false);

    game.debugApplyEffect(A, { kind: "destroy-all", filter: { type: "creature" } });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    // The card in the graveyard is a new object, not goaded (rule 400.7) —
    // but it was as it died (rule 603.10a).
    expect(goaded(bears)).toBe(false);
    expect(goaded(bears, true)).toBe(true);
    expect(goaded(elves, true)).toBe(false);
  });
});

describe("an attack-requirement rule (Kardur, Doomscourge)", () => {
  it("lapses as its controller's next turn begins", () => {
    const { game } = setUp();
    game.debugSpawn("Kardur, Doomscourge", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.attackRequirements).toHaveLength(1);
    game.advanceUntil((s) => s.turn.number === 3 || s.result.over);
    expect(game.state.attackRequirements).toBeUndefined();
  });

  it('without "other than you", only makes the creatures attack each combat if able', () => {
    const { game } = setUp([A, B, C]);
    const bears = spawn(game, "Grizzly Bears", B);
    const garruk = spawn(game, "Garruk Wildspeaker", C);
    game.debugApplyEffect(A, {
      kind: "attack-requirement",
      filter: { type: "creature", controlledBy: "opponent" },
      otherThanYou: false,
    });
    expect(goaders(game, bears)).toEqual([]);
    const offer = attackOffer(game, B);
    expect(offer.mustAttack).toContain(bears);
    expect(sorted(offer.defendersFor[bears])).toEqual(sorted([A, C, garruk]));
  });
});
