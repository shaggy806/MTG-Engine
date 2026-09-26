/**
 * "Can't be sacrificed" (rule 701.21a — to sacrifice a permanent, its
 * controller moves it to its owner's graveyard; one that can't be sacrificed
 * isn't moved). Alexios, Deimos of Kosmos's rulings say what that means: "If
 * an effect instructs you to sacrifice it, you can't and it remains on the
 * battlefield. You also can't sacrifice it to pay a cost that requires you to
 * sacrifice a creature", and "if an effect instructs you to sacrifice a
 * creature and you control any creatures other than Alexios, you must
 * sacrifice one of those other creatures".
 *
 * As a static on the permanent itself, as a static reaching others ("creatures
 * you control can't be sacrificed"), or granted by an effect (Jon Irenicus's
 * "it gains 'This creature can't be sacrificed'"), against every way the
 * engine sacrifices: edicts, sacrifice costs (a chosen creature, the source
 * itself, a spell's additional cost, a Treasure's mana), "sacrifice ~" and
 * "sacrifice that creature" effects, a completed Saga and an end-step
 * sacrifice.
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { createDefaultRegistry } from "../cards.js";
import { defineCard } from "../cards/define.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const STUBBORN = "Test Stubborn Brute";
const SANCTUARY = "Test Sacrificial Ward";

const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: STUBBORN,
      manaCost: "{2}{R}",
      colors: ["R"],
      types: ["creature"],
      subtypes: ["Human"],
      power: 3,
      toughness: 3,
      text: "This creature can't be sacrificed.",
      static: [{ affects: { scope: "self" }, cantBeSacrificed: true, text: "This creature can't be sacrificed." }],
    }),
  )
  .register(
    defineCard({
      name: SANCTUARY,
      manaCost: "{1}{W}",
      colors: ["W"],
      types: ["enchantment"],
      text: "Creatures you control can't be sacrificed.",
      static: [
        {
          affects: { scope: "creatures-you-control" },
          cantBeSacrificed: true,
          text: "Creatures you control can't be sacrificed.",
        },
      ],
    }),
  );

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

function makeGame(aHand: readonly string[] = []): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Swamp")] },
      { player: B, cards: Array<string>(40).fill("Swamp") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const spawn = (game: Game, name: string, owner: PlayerId = A): ObjectId =>
  game.debugSpawn(name, owner, "battlefield", { summoningSick: false });
const zoneOf = (game: Game, id: ObjectId) => game.state.objects[id]?.zone;

function check(game: Game): void {
  (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(A);
}

function apply(game: Game, who: PlayerId, spec: EffectSpec, targets: readonly TargetRef[] = [], source?: ObjectId): void {
  game.debugApplyEffect(who, spec, targets, source === undefined ? {} : { source });
  check(game);
}

/** Bob's edict: "each opponent sacrifices a creature". */
const edict: EffectSpec = { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 1 };

const abilityOffers = (game: Game, source: ObjectId) =>
  game
    .legalActions(A)
    .filter(
      (o): o is Extract<LegalAction, { kind: "activate-ability" }> =>
        o.kind === "activate-ability" && o.source === source,
    );

describe("can't be sacrificed", () => {
  it("is a characteristic of the permanent the static reaches", () => {
    const game = makeGame();
    const brute = spawn(game, STUBBORN);
    const bears = spawn(game, "Grizzly Bears");
    expect(game.characteristics(brute).cantBeSacrificed).toBe(true);
    expect(game.characteristics(bears).cantBeSacrificed).toBe(false);
  });

  it("an edict passes over it: another creature must go", () => {
    const game = makeGame();
    const brute = spawn(game, STUBBORN);
    const bears = spawn(game, "Grizzly Bears");
    apply(game, B, edict);
    // No choice to make — the Bears were the only creature that could go.
    expect(game.state.awaiting).toBeNull();
    expect(zoneOf(game, bears)).toBe("graveyard");
    expect(zoneOf(game, brute)).toBe("battlefield");
  });

  it("an edict with nothing else to take takes nothing", () => {
    const game = makeGame();
    const brute = spawn(game, STUBBORN);
    apply(game, B, edict);
    expect(game.state.awaiting).toBeNull();
    expect(zoneOf(game, brute)).toBe("battlefield");
    expect(game.eventsOfType("permanent-sacrificed")).toHaveLength(0);
  });

  it("isn't among a 'sacrifice a creature' cost's choices, and alone can't pay it", () => {
    const game = makeGame();
    const altar = spawn(game, "Ashnod's Altar");
    const brute = spawn(game, STUBBORN);
    const bears = spawn(game, "Grizzly Bears");
    const offer = abilityOffers(game, altar)[0];
    expect(offer?.sacrifice?.choices).toEqual([bears]);
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: altar, abilityIndex: 0, targets: [], sacrifice: brute }),
    ).toThrow();
    apply(game, B, { kind: "destroy", target: 0 }, [obj(bears)]);
    expect(abilityOffers(game, altar)).toHaveLength(0);
  });

  it("can't pay a spell's additional sacrifice", () => {
    const game = makeGame(["Village Rites"]);
    spawn(game, STUBBORN);
    spawn(game, "Swamp");
    const rites = game.handOf(A).find((id) => game.state.objects[id].cardName === "Village Rites")!;
    expect(game.legalActions(A).some((o) => o.kind === "cast-spell" && o.card === rites)).toBe(false);
    const bears = spawn(game, "Grizzly Bears");
    const cast = game.legalActions(A).find((o) => o.kind === "cast-spell" && o.card === rites);
    expect(cast).toBeDefined();
    expect((cast as { sacrifice?: { choices: readonly ObjectId[] } }).sacrifice?.choices).toEqual([bears]);
  });

  it("a cost that sacrifices it can't be paid: a Treasure that can't be sacrificed makes no mana", () => {
    const game = makeGame(["Lightning Bolt"]);
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 });
    check(game);
    const treasure = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Treasure Token",
    )!;
    const bolt = game.handOf(A).find((id) => game.state.objects[id].cardName === "Lightning Bolt")!;
    const castable = () => game.legalActions(A).some((o) => o.kind === "cast-spell" && o.card === bolt);
    expect(castable()).toBe(true);
    // One offer per colour it could make.
    expect(abilityOffers(game, treasure).length).toBeGreaterThan(0);

    apply(game, A, { kind: "cant-be-sacrificed", target: 0, duration: "permanent" }, [obj(treasure)]);
    expect(castable()).toBe(false);
    expect(abilityOffers(game, treasure)).toHaveLength(0);
  });

  it("'sacrifice ~' does nothing to it, so its 'if you do' doesn't happen", () => {
    const game = makeGame();
    const brute = spawn(game, STUBBORN);
    const hand = game.handOf(A).length;
    apply(game, A, { kind: "sacrifice-source", then: { kind: "draw", amount: 1 } }, [], brute);
    expect(zoneOf(game, brute)).toBe("battlefield");
    expect(game.handOf(A)).toHaveLength(hand);
  });

  it("'sacrifice that creature' leaves it where it is", () => {
    const game = makeGame();
    const brute = spawn(game, STUBBORN);
    apply(game, A, { kind: "sacrifice-target", target: 0 }, [obj(brute)]);
    expect(zoneOf(game, brute)).toBe("battlefield");
  });

  it("a static can reach others: 'creatures you control can't be sacrificed'", () => {
    const game = makeGame();
    spawn(game, SANCTUARY);
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    apply(game, B, edict);
    expect(zoneOf(game, bears)).toBe("battlefield");
    apply(game, A, edict);
    expect(zoneOf(game, theirs)).toBe("graveyard");
  });

  it("goes with the rest of its abilities", () => {
    const game = makeGame();
    const brute = spawn(game, STUBBORN);
    apply(
      game,
      B,
      {
        kind: "animate",
        target: 0,
        power: 1,
        toughness: 1,
        addTypes: [],
        addSubtypes: [],
        setSubtypes: ["Frog"],
        setColors: ["U"],
        loseAbilities: true,
        duration: "end-of-turn",
      },
      [obj(brute)],
    );
    expect(game.characteristics(brute).cantBeSacrificed).toBe(false);
    apply(game, B, edict);
    expect(zoneOf(game, brute)).toBe("graveyard");
  });

  it("granted until end of turn, it stops protecting at cleanup", () => {
    const game = makeGame();
    const bears = spawn(game, "Grizzly Bears");
    apply(game, A, { kind: "cant-be-sacrificed", target: 0, duration: "end-of-turn" }, [obj(bears)]);
    apply(game, B, edict);
    expect(zoneOf(game, bears)).toBe("battlefield");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(game.characteristics(bears).cantBeSacrificed).toBe(false);
    apply(game, B, { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 1 });
    expect(zoneOf(game, bears)).toBe("graveyard");
  });

  it("a completed Saga that can't be sacrificed stays (rule 714.4)", () => {
    const game = makeGame();
    const saga = spawn(game, "History of Benalia");
    game.advanceUntil(quiet);
    apply(game, A, { kind: "cant-be-sacrificed", target: 0, duration: "permanent" }, [obj(saga)]);
    game.state.objects[saga].counters.lore = 3;
    check(game);
    expect(zoneOf(game, saga)).toBe("battlefield");
    expect(game.eventsOfType("saga-completed")).toHaveLength(0);
  });

  it("a token due to be sacrificed at the next end step that can't be stays for good", () => {
    const game = makeGame();
    const ward = spawn(game, SANCTUARY);
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 1, sacrificeAtEndStep: true });
    check(game);
    const goblin = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Goblin Token",
    )!;
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(zoneOf(game, goblin)).toBe("battlefield");
    // That end step's sacrifice was the only one: with the ward gone, the
    // next end step leaves it alone too.
    apply(game, B, { kind: "destroy", target: 0 }, [obj(ward)]);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(zoneOf(game, goblin)).toBe("battlefield");
  });
});
