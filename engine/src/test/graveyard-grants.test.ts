/**
 * Statics that reach cards outside the battlefield (rule 604.1):
 * `grantsToGraveyard` gives cards in its controller's graveyard flashback or
 * escape — Iroh, Grand Lotus's "during your turn, each instant and sorcery
 * card in your graveyard has flashback. The flashback cost is equal to its
 * mana cost", The Master of Keys's "each enchantment card in your graveyard
 * has escape. The escape cost is equal to the card's mana cost plus exile
 * three other cards from your graveyard" — and `alternativeCostForSpells`
 * offers an alternative cost for the spells you cast (Jodah, Archmage
 * Eternal: "you may pay {W}{U}{B}{R}{G} rather than pay the mana cost for
 * spells you cast").
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { defineCard } from "../cards/define.js";
import type { StaticAbility } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const granter = (name: string, ability: Omit<StaticAbility, "affects" | "text">) =>
  defineCard({
    name,
    manaCost: "{0}",
    types: ["enchantment"],
    text: name,
    static: [{ affects: { scope: "self" }, text: name, ...ability }],
  });

const IROH = "Test Grand Lotus";
const KEYS = "Test Master of Keys";
const JODAH = "Test Archmage Eternal";
const ANTHEM = "Test Glorious Anthem";
const COLOSSUS = "Test Colossus";

const registry = createDefaultRegistry()
  .register(
    granter(IROH, {
      grantsToGraveyard: { filter: { typesAnyOf: ["instant", "sorcery"] }, flashback: { cost: "mana-cost" } },
      condition: { kind: "your-turn" },
    }),
  )
  .register(
    granter(KEYS, {
      grantsToGraveyard: { filter: { type: "enchantment" }, escape: { cost: "mana-cost", exileCount: 3 } },
    }),
  )
  .register(granter(JODAH, { alternativeCostForSpells: { mana: "{W}{U}{B}{R}{G}" } }))
  .register(
    defineCard({
      name: ANTHEM,
      manaCost: "{1}{W}",
      types: ["enchantment"],
      text: "",
    }),
  )
  .register(
    defineCard({
      name: COLOSSUS,
      manaCost: "{7}",
      types: ["artifact", "creature"],
      subtypes: ["Golem"],
      power: 7,
      toughness: 7,
      text: "",
    }),
  );

const setUp = (hand: readonly string[] = []) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill("Island")] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

type CastOffer = Extract<LegalAction, { kind: "cast-spell" }>;
const castOffers = (game: Game, card: ObjectId, player = A): CastOffer[] =>
  game
    .legalActions(player)
    .filter((o): o is CastOffer => o.kind === "cast-spell" && o.card === card);
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

describe("flashback granted to cards in your graveyard", () => {
  it("Iroh: an instant in your graveyard has flashback for its mana cost, and is exiled", () => {
    const game = setUp();
    game.debugSpawn(IROH, A, "battlefield");
    game.debugSpawn("Mountain", A, "battlefield");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const offers = castOffers(game, bolt);
    expect(offers.map((o) => o.via)).toEqual(["flashback"]);
    // Only instants and sorceries.
    expect(castOffers(game, bears)).toHaveLength(0);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      via: "flashback",
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(17);
    expect(game.state.objects[bolt].zone).toBe("exile");
  });

  it("only while its condition holds, and only while the granter is there", () => {
    const game = setUp();
    const iroh = game.debugSpawn(IROH, A, "battlefield");
    game.debugSpawn("Mountain", A, "battlefield");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    expect(castOffers(game, bolt)).toHaveLength(1);
    // On Bob's turn: "during your turn" isn't met.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep" && s.priority.holder === A);
    expect(castOffers(game, bolt)).toHaveLength(0);
    // Back on Alice's turn it is, until the granter leaves.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(castOffers(game, bolt)).toHaveLength(1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: iroh }]);
    expect(castOffers(game, bolt)).toHaveLength(0);
  });

  it("an opponent's graveyard isn't yours", () => {
    const game = setUp();
    game.debugSpawn(IROH, A, "battlefield");
    game.debugSpawn("Mountain", A, "battlefield");
    const bolt = game.debugSpawn("Lightning Bolt", B, "graveyard");
    expect(castOffers(game, bolt)).toHaveLength(0);
  });
});

describe("escape granted to cards in your graveyard", () => {
  it("The Master of Keys: an enchantment escapes for its mana cost plus three other cards", () => {
    const game = setUp();
    game.debugSpawn(KEYS, A, "battlefield");
    game.debugSpawn("Plains", A, "battlefield");
    game.debugSpawn("Plains", A, "battlefield");
    const anthem = game.debugSpawn(ANTHEM, A, "graveyard");
    const others = [
      game.debugSpawn("Island", A, "graveyard"),
      game.debugSpawn("Island", A, "graveyard"),
    ];
    // Two other cards aren't enough.
    expect(castOffers(game, anthem)).toHaveLength(0);
    others.push(game.debugSpawn("Grizzly Bears", A, "graveyard"));
    const offers = castOffers(game, anthem);
    expect(offers.map((o) => o.via)).toEqual(["escape"]);
    expect(offers[0].escapeExile?.count).toBe(3);
    game.dispatch({ type: "cast-spell", player: A, card: anthem, via: "escape", targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[anthem].zone).toBe("battlefield");
    for (const id of others) expect(game.state.objects[id].zone).toBe("exile");
  });
});

describe("an alternative cost for the spells you cast", () => {
  it("Jodah: {W}{U}{B}{R}{G} rather than the mana cost", () => {
    const game = setUp([COLOSSUS]);
    for (const land of ["Plains", "Island", "Swamp", "Mountain", "Forest"]) {
      game.debugSpawn(land, A, "battlefield");
    }
    const colossus = game.handOf(A).find((id) => game.state.objects[id].cardName === COLOSSUS)!;
    // {7} is out of reach of five lands.
    expect(castOffers(game, colossus)).toHaveLength(0);
    game.debugSpawn(JODAH, A, "battlefield");
    const offers = castOffers(game, colossus);
    expect(offers).toHaveLength(1);
    expect(offers[0].altCost).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: colossus, altCost: true, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[colossus].zone).toBe("battlefield");
  });

  it("not for a spell already cast for another alternative cost", () => {
    const game = setUp();
    game.debugSpawn(IROH, A, "battlefield");
    game.debugSpawn(JODAH, A, "battlefield");
    for (const land of ["Plains", "Island", "Swamp", "Mountain", "Forest"]) {
      game.debugSpawn(land, A, "battlefield");
    }
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    // Flashback only — no WUBRG flashback.
    expect(castOffers(game, bolt).map((o) => [o.via, o.altCost])).toEqual([["flashback", undefined]]);
  });

  it("an opponent's Jodah offers you nothing", () => {
    const game = setUp([COLOSSUS]);
    for (const land of ["Plains", "Island", "Swamp", "Mountain", "Forest"]) {
      game.debugSpawn(land, A, "battlefield");
    }
    game.debugSpawn(JODAH, B, "battlefield");
    const colossus = game.handOf(A).find((id) => game.state.objects[id].cardName === COLOSSUS)!;
    expect(castOffers(game, colossus)).toHaveLength(0);
  });
});
