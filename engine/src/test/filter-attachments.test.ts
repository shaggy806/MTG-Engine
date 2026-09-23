/**
 * `CardFilter`'s attachment and combinator clauses, and the three commanders
 * built on them.
 *
 * - `equipped` / `enchanted`: something of that kind is attached, whoever
 *   controls it;
 * - `modified` (rule 700.9): a counter, an Equipment, or an Aura its *own
 *   controller* controls, so an opponent's Aura doesn't count (Chishiro's
 *   2022-02-18 ruling) while an opponent's Equipment does;
 * - `anyOf`, `notSupertype`, `notName`: the "or" and the negations a flat
 *   clause list couldn't say.
 *
 * Dogmeat, Ever Loyal: mill five then return an Aura or Equipment card, and a
 * Junk token when an enchanted or equipped creature of yours attacks.
 * Chishiro, the Shattered Blade: a Spirit when an Aura or Equipment of yours
 * enters, and an end-step counter on each modified creature.
 * Jhoira, Weatherlight Captain: a card for each historic spell.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { matchesFilter } from "../filter.js";
import type { CardFilter } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (aCards: readonly string[] = [], aFill = "Forest") => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aCards, ...Array<string>(40).fill(aFill)] },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const matches = (game: Game, id: ObjectId, filter: CardFilter, you: PlayerId = A): boolean =>
  matchesFilter(game.state, registry, id, filter, { you });
/** Attach `attachment` to `host` the way an equip or an Aura resolving does. */
const attach = (game: Game, attachment: ObjectId, host: ObjectId): void =>
  game.debugApplyEffect(
    game.state.objects[attachment].controller,
    { kind: "attach", target: 0 },
    [{ kind: "object", object: host }],
    { source: attachment },
  );
const named = (game: Game, name: string, player: PlayerId = A): ObjectId[] =>
  game.battlefield.filter(
    (id) => game.state.objects[id].cardName === name && game.state.objects[id].controller === player,
  );

describe("attachment clauses", () => {
  it("equipped and enchanted read what is attached, whoever controls it", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const plain = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const blade = game.debugSpawn("Bonesplitter", B, "battlefield");
    const aura = game.debugSpawn("Holy Strength", B, "battlefield");
    attach(game, blade, bears);
    attach(game, aura, bears);

    expect(matches(game, bears, { equipped: true })).toBe(true);
    expect(matches(game, bears, { enchanted: true })).toBe(true);
    expect(matches(game, plain, { equipped: true })).toBe(false);
    expect(matches(game, plain, { enchanted: false })).toBe(true);
    // The attachments themselves aren't equipped or enchanted.
    expect(matches(game, blade, { equipped: true })).toBe(false);
  });

  it("modified counts a counter, any Equipment, and only its own controller's Auras", () => {
    const { game } = setUp();
    const withTheirAura = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const withMyAura = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const withTheirBlade = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const withCounter = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const bare = game.debugSpawn("Grizzly Bears", A, "battlefield");
    attach(game, game.debugSpawn("Holy Strength", B, "battlefield"), withTheirAura);
    attach(game, game.debugSpawn("Holy Strength", A, "battlefield"), withMyAura);
    attach(game, game.debugSpawn("Bonesplitter", B, "battlefield"), withTheirBlade);
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "-1/-1", amount: 1 }, [
      { kind: "object", object: withCounter },
    ]);

    expect(matches(game, withTheirAura, { modified: true })).toBe(false);
    expect(matches(game, withMyAura, { modified: true })).toBe(true);
    expect(matches(game, withTheirBlade, { modified: true })).toBe(true);
    // Any kind of counter, however it got there.
    expect(matches(game, withCounter, { modified: true })).toBe(true);
    expect(matches(game, bare, { modified: false })).toBe(true);
  });

  it("anyOf is an or, alongside the other clauses; notSupertype and notName negate", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const ring = game.debugSpawn("Sol Ring", A, "battlefield");
    const legend = game.debugSpawn("Chishiro, the Shattered Blade", A, "battlefield");
    const historic: CardFilter = {
      anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }],
    };
    expect(matches(game, ring, historic)).toBe(true);
    expect(matches(game, legend, historic)).toBe(true);
    expect(matches(game, bears, historic)).toBe(false);
    // Every other clause still has to hold too.
    expect(matches(game, ring, { ...historic, type: "creature" })).toBe(false);

    expect(matches(game, legend, { notSupertype: "legendary" })).toBe(false);
    expect(matches(game, bears, { notSupertype: "legendary" })).toBe(true);
    expect(matches(game, bears, { notName: "Grizzly Bears" })).toBe(false);
    expect(matches(game, ring, { notName: "Grizzly Bears" })).toBe(true);
  });
});

describe("Dogmeat, Ever Loyal", () => {
  it("mills five, then returns an Aura or Equipment card to hand", () => {
    const { game } = setUp();
    // The five cards the mill will take, top first: one Aura among them.
    const five = ["Forest", "Grizzly Bears", "Holy Strength", "Forest", "Sol Ring"];
    const ids = [...five].reverse().map((name) => game.debugSpawn(name, A, "library")).reverse();
    const aura = ids[2];
    game.debugSpawn("Dogmeat, Ever Loyal", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);

    expect(game.state.objects[aura].zone).toBe("hand");
    for (const id of ids.filter((each) => each !== aura)) {
      expect(game.state.objects[id].zone).toBe("graveyard");
    }
  });

  it("the returned card can be one it didn't mill, and one is chosen when there are several", () => {
    const { game } = setUp();
    const old = game.debugSpawn("Bonesplitter", A, "graveyard");
    const milled = game.debugSpawn("Holy Strength", A, "library");
    game.debugSpawn("Dogmeat, Ever Loyal", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    const back = [old, milled].filter((id) => game.state.objects[id].zone === "hand");
    expect(back).toHaveLength(1);
  });

  it("returns nothing when there is no Aura or Equipment card in the graveyard", () => {
    const { game } = setUp([], "Forest");
    game.debugSpawn("Dogmeat, Ever Loyal", A, "battlefield", { announceEntry: true });
    const handBefore = game.handOf(A).length;
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[A].graveyard).toHaveLength(5);
    expect(game.handOf(A).length).toBe(handBefore);
  });

  it("makes Junk when an enchanted or equipped creature attacks, not a bare one", () => {
    const { game, a } = setUp();
    game.debugSpawn("Dogmeat, Ever Loyal", A, "battlefield");
    const equipped = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    const enchanted = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    const bare = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    attach(game, game.debugSpawn("Bonesplitter", A, "battlefield"), equipped);
    // An opponent's Aura still makes the creature enchanted.
    attach(game, game.debugSpawn("Holy Strength", B, "battlefield"), enchanted);
    a.declareAttackersFn = () =>
      [equipped, enchanted, bare].map((attacker) => ({ attacker, defender: B }));

    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(named(game, "Junk Token")).toHaveLength(2);
  });

  it("a Junk token exiles the top card, which can then be played this turn", () => {
    const { game } = setUp(["Sol Ring"]);
    const junk = game.debugSpawn("Junk Token", A, "battlefield");
    const top = game.state.zones.perPlayer[A].library[0];
    game.dispatch({ type: "activate-ability", player: A, source: junk, abilityIndex: 0 });
    game.advanceUntil(quiet);
    expect(game.state.objects[junk]?.zone ?? "gone").not.toBe("battlefield");
    expect(game.state.objects[top].zone).toBe("exile");
    const offers = game.legalActions(A);
    expect(
      offers.some(
        (o) => (o.kind === "play-land" || o.kind === "cast-spell") && "card" in o && o.card === top,
      ),
    ).toBe(true);
  });
});

describe("Chishiro, the Shattered Blade", () => {
  it("makes a Spirit when an Aura or Equipment of yours enters, not an opponent's", () => {
    const { game } = setUp();
    game.debugSpawn("Chishiro, the Shattered Blade", A, "battlefield");
    game.debugSpawn("Bonesplitter", A, "battlefield", { announceEntry: true });
    game.debugSpawn("Holy Strength", B, "battlefield", { announceEntry: true });
    game.debugSpawn("Sol Ring", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    const spirits = named(game, "2/2 Red Spirit Token");
    expect(spirits).toHaveLength(1);
    const c = game.characteristics(spirits[0]);
    expect([c.power, c.toughness]).toEqual([2, 2]);
    expect(c.keywords.has("menace")).toBe(true);
  });

  it("grows each modified creature you control at your end step", () => {
    const { game } = setUp();
    const chishiro = game.debugSpawn("Chishiro, the Shattered Blade", A, "battlefield");
    const equipped = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirAura = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const bare = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const opposing = game.debugSpawn("Grizzly Bears", B, "battlefield");
    attach(game, game.debugSpawn("Bonesplitter", A, "battlefield"), equipped);
    attach(game, game.debugSpawn("Holy Strength", B, "battlefield"), theirAura);
    game.debugApplyEffect(B, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [
      { kind: "object", object: opposing },
    ]);

    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "cleanup");
    const counters = (id: ObjectId): number => game.state.objects[id].counters["+1/+1"] ?? 0;
    expect(counters(equipped)).toBe(1);
    expect(counters(theirAura)).toBe(0);
    expect(counters(bare)).toBe(0);
    // Chishiro itself isn't modified; the opponent's modified creature isn't yours.
    expect(counters(chishiro)).toBe(0);
    expect(counters(opposing)).toBe(1);

    // Now it has a counter, so the next end step grows it again.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "cleanup");
    expect(counters(equipped)).toBe(2);
  });
});

describe("Jhoira, Weatherlight Captain", () => {
  it("draws for an artifact or a legendary spell, not for a plain one", () => {
    const { game } = setUp(["Sol Ring", "Grizzly Bears", "Chishiro, the Shattered Blade"]);
    game.debugSpawn("Jhoira, Weatherlight Captain", A, "battlefield");
    for (const land of ["Mountain", "Mountain", "Mountain", "Forest", "Forest", "Forest", "Forest", "Forest"]) {
      game.debugSpawn(land, A, "battlefield");
    }
    const cast = (name: string): number => {
      const card = game.handOf(A).find((id) => game.state.objects[id].cardName === name);
      if (card === undefined) throw new Error(`no ${name}`);
      const before = game.handOf(A).length;
      game.dispatch({ type: "cast-spell", player: A, card });
      game.advanceUntil(quiet);
      return game.handOf(A).length - before;
    };
    expect(cast("Sol Ring")).toBe(0); // -1 cast, +1 drawn
    expect(cast("Grizzly Bears")).toBe(-1);
    expect(cast("Chishiro, the Shattered Blade")).toBe(0);
  });
});
