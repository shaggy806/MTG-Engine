/**
 * The cards a sacrifice cost of several permanents unblocked (see
 * `sacrifice-multiple-cost.test.ts` for the cost itself): one focused test
 * per card whose behaviour is more than a stat line.
 */
import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (library = "Wastes"): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: true, maxLandsPerTurn: 99, maxHandSize: 99, openingHandSize: 0 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill(library) },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const zone = (game: Game, id: ObjectId): string | undefined => game.state.objects[id]?.zone;
/** A shock land, its "pay 2 life or enter tapped" declined. */
const shockLand = (game: Game, name: string): ObjectId => {
  const id = spawn(game, name);
  if (game.state.awaiting?.kind === "pay-life-for-untapped") {
    game.dispatch({ type: "pay-life-for-untapped", player: A, pay: false });
  }
  return id;
};
const named = (game: Game, name: string, player: PlayerId = A): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === name && game.state.objects[id].controller === player,
  );
const tokenCount = (game: Game, name: string, player: PlayerId = A): number =>
  named(game, name, player).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
function tokens(game: Game, name: string, count: number, player: PlayerId = A): ObjectId[] {
  const before = new Set(game.state.zones.shared.battlefield);
  game.debugApplyEffect(player, { kind: "create-token", token: name, count });
  return game.state.zones.shared.battlefield.filter((id) => !before.has(id));
}
type AbilityOffer = Extract<LegalAction, { kind: "activate-ability" }>;
const offers = (game: Game, source: ObjectId, index = 0): AbilityOffer[] =>
  game
    .legalActions(A)
    .filter(
      (a): a is AbilityOffer => a.kind === "activate-ability" && a.source === source && a.abilityIndex === index,
    );
const sacrificeOffer = (game: Game): Extract<LegalAction, { kind: "sacrifice" }> | undefined =>
  game.legalActions(A).find((a): a is Extract<LegalAction, { kind: "sacrifice" }> => a.kind === "sacrifice");
const activate = (game: Game, source: ObjectId, index: number, extra: Record<string, unknown> = {}): void =>
  void game.dispatch({ type: "activate-ability", player: A, source, abilityIndex: index, ...extra });

describe("Sai, Master Thopterist", () => {
  it("makes a Thopter for an artifact spell, and draws for two artifacts", () => {
    const game = setUp();
    const sai = spawn(game, "Sai, Master Thopterist");
    spawn(game, "Island");
    spawn(game, "Island");
    const ring = game.debugSpawn("Sol Ring", A, "hand");
    spawn(game, "Wastes");
    game.dispatch({ type: "cast-spell", player: A, card: ring });
    game.advanceUntil(quiet);
    expect(tokenCount(game, "Thopter Token")).toBe(1);
    const hand = game.state.zones.perPlayer[A].hand.length;
    activate(game, sai, 0);
    // The Thopter and Sol Ring are exactly two artifacts: nothing to choose.
    expect(game.state.awaiting?.kind).not.toBe("sacrifice");
    expect(zone(game, ring)).toBe("graveyard");
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand + 1);
  });
});

describe("Grim Hireling", () => {
  it("makes two Treasures when its creatures deal combat damage to a player", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      decks: [
        { player: A, cards: Array(40).fill("Swamp") },
        { player: B, cards: Array(40).fill("Swamp") },
      ],
    });
    const hireling = game.debugSpawn("Grim Hireling", A);
    const bears = game.debugSpawn("Grizzly Bears", A);
    game.state.objects[hireling].summoningSick = false;
    game.state.objects[bears].summoningSick = false;
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: hireling, defender: B },
        { attacker: bears, defender: B },
      ],
    });
    game.advanceUntil((s) => s.turn.step === "end-combat");
    // Two creatures, one player, one batch of damage: one trigger.
    expect(tokenCount(game, "Treasure Token")).toBe(2);
  });
});

describe("Magda, Brazen Outlaw", () => {
  it("pumps other Dwarves, makes a Treasure when a Dwarf becomes tapped, and fetches for five", () => {
    const game = setUp("Shivan Dragon");
    const magda = spawn(game, "Magda, Brazen Outlaw");
    const cavalry = spawn(game, "Axgard Cavalry");
    expect(game.characteristics(cavalry).power).toBe(3);
    expect(game.characteristics(magda).power).toBe(2);
    // Axgard Cavalry's {T} ability taps a Dwarf.
    activate(game, cavalry, 0, { targets: [{ kind: "object", object: magda }] });
    game.advanceUntil(quiet);
    expect(tokenCount(game, "Treasure Token")).toBe(1);
    expect(offers(game, magda)).toHaveLength(0);
    tokens(game, "Treasure Token", 4);
    expect(offers(game, magda)).toHaveLength(1);
    activate(game, magda, 0);
    expect(tokenCount(game, "Treasure Token")).toBe(0);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || quiet(s));
    const awaiting = game.state.awaiting;
    if (awaiting?.kind === "choose-from-zone") {
      const pick = game.legalActions(A).find((a) => a.kind === "choose-from-zone");
      const dragon = pick?.kind === "choose-from-zone" ? pick.eligible[0] : undefined;
      game.dispatch({ type: "choose-from-zone", player: A, chosen: dragon === undefined ? [] : [dragon] });
    }
    game.advanceUntil(quiet);
    expect(named(game, "Shivan Dragon")).toHaveLength(1);
  });
});

describe("Metalwork Colossus", () => {
  it("costs less by its noncreature artifacts' mana value, and comes back for two artifacts", () => {
    const game = setUp();
    spawn(game, "Sol Ring"); // mana value 1
    spawn(game, "Mind Stone"); // mana value 2
    spawn(game, "Ornithopter"); // a creature: doesn't count
    for (let i = 0; i < 6; i += 1) spawn(game, "Wastes");
    const colossus = game.debugSpawn("Metalwork Colossus", A, "hand");
    // {11} less 3 is {8}: six Wastes, Sol Ring's {2} — and Mind Stone's {1}
    // makes nine, enough.
    expect(game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === colossus)).toBe(true);
    game.state.zones.perPlayer[A].hand.splice(game.state.zones.perPlayer[A].hand.indexOf(colossus), 1);
    const inGraveyard = game.debugSpawn("Metalwork Colossus", A, "graveyard");
    expect(offers(game, inGraveyard)).toHaveLength(1);
    activate(game, inGraveyard, 0);
    expect(game.state.awaiting?.kind).toBe("sacrifice");
    const [first, second] = sacrificeOffer(game)?.eligible ?? [];
    game.dispatch({ type: "sacrifice", player: A, permanents: [first, second] });
    game.advanceUntil(quiet);
    expect(zone(game, inGraveyard)).toBe("hand");
  });
});

describe("Jarad, Golgari Lich Lord", () => {
  it("grows with creature cards in the graveyard and drains for the sacrificed creature's power", () => {
    const game = setUp();
    const jarad = spawn(game, "Jarad, Golgari Lich Lord");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Hill Giant", A, "graveyard");
    game.debugSpawn("Swamp", A, "graveyard");
    expect([game.characteristics(jarad).power, game.characteristics(jarad).toughness]).toEqual([4, 4]);
    const giant = spawn(game, "Hill Giant");
    spawn(game, "Swamp");
    spawn(game, "Forest");
    spawn(game, "Wastes");
    const life = game.state.players[B].life;
    activate(game, jarad, 0, { sacrifice: giant });
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(life - 3);
  });

  it("returns for a Swamp and a Forest — two lands, even when one is both", () => {
    const game = setUp();
    const jarad = game.debugSpawn("Jarad, Golgari Lich Lord", A, "graveyard");
    const tomb = shockLand(game, "Overgrown Tomb");
    // One land that is both can't pay both halves.
    expect(offers(game, jarad, 1)).toHaveLength(0);
    const swamp = spawn(game, "Swamp");
    // The Swamp must be the Swamp, so the Tomb is the Forest: no choice.
    activate(game, jarad, 1);
    expect(game.state.awaiting?.kind).not.toBe("sacrifice");
    expect(zone(game, tomb)).toBe("graveyard");
    expect(zone(game, swamp)).toBe("graveyard");
    game.advanceUntil(quiet);
    expect(zone(game, jarad)).toBe("hand");
  });

  it("asks which Swamp when there's a choice, and leaves the rest payable", () => {
    const game = setUp();
    const jarad = game.debugSpawn("Jarad, Golgari Lich Lord", A, "graveyard");
    const tomb1 = shockLand(game, "Overgrown Tomb");
    const tomb2 = shockLand(game, "Overgrown Tomb");
    const forest = spawn(game, "Forest");
    activate(game, jarad, 1);
    // Either Tomb can be the Swamp; the Forest can't.
    expect([...(sacrificeOffer(game)?.eligible ?? [])].sort()).toEqual([tomb1, tomb2].sort());
    game.dispatch({ type: "sacrifice", player: A, permanents: [tomb2] });
    // Now the Forest half: the other Tomb or the Forest.
    expect([...(sacrificeOffer(game)?.eligible ?? [])].sort()).toEqual([tomb1, forest].sort());
    game.dispatch({ type: "sacrifice", player: A, permanents: [forest] });
    expect(zone(game, tomb2)).toBe("graveyard");
    expect(zone(game, forest)).toBe("graveyard");
    expect(zone(game, tomb1)).toBe("battlefield");
    game.advanceUntil(quiet);
    expect(zone(game, jarad)).toBe("hand");
  });
});

describe("Mondrak, Glory Dominus", () => {
  it("doubles tokens and takes two *other* artifacts or creatures for an indestructible counter", () => {
    const game = setUp();
    const mondrak = spawn(game, "Mondrak, Glory Dominus");
    tokens(game, "Treasure Token", 1);
    expect(tokenCount(game, "Treasure Token")).toBe(2);
    for (let i = 0; i < 3; i += 1) spawn(game, "Plains");
    const bears = spawn(game, "Grizzly Bears");
    activate(game, mondrak, 0);
    const eligible = sacrificeOffer(game)?.eligible ?? [];
    expect(eligible).not.toContain(mondrak);
    expect(eligible).toContain(bears);
    game.dispatch({ type: "sacrifice", player: A, permanents: eligible.slice(0, 2) });
    game.advanceUntil(quiet);
    expect(game.state.objects[mondrak].counters.indestructible).toBe(1);
  });
});

describe("Zopandrel, Hunger Dominus", () => {
  it("doubles its controller's creatures at each combat", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      decks: [
        { player: A, cards: Array(40).fill("Forest") },
        { player: B, cards: Array(40).fill("Forest") },
      ],
    });
    game.debugSpawn("Zopandrel, Hunger Dominus", A);
    const bears = game.debugSpawn("Grizzly Bears", A);
    const theirs = game.debugSpawn("Grizzly Bears", B);
    game.advanceUntil((s) => s.turn.step === "declare-attackers");
    expect([game.characteristics(bears).power, game.characteristics(bears).toughness]).toEqual([4, 4]);
    expect(game.characteristics(theirs).power).toBe(2);
  });

  it("takes two other creatures for an indestructible counter", () => {
    const game = setUp();
    const zopandrel = spawn(game, "Zopandrel, Hunger Dominus");
    spawn(game, "Forest");
    spawn(game, "Forest");
    const bears = spawn(game, "Grizzly Bears");
    // One other creature isn't enough.
    expect(offers(game, zopandrel)).toHaveLength(0);
    const giant = spawn(game, "Hill Giant");
    activate(game, zopandrel, 0);
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, giant)).toBe("graveyard");
    game.advanceUntil(quiet);
    expect(game.state.objects[zopandrel].counters.indestructible).toBe(1);
  });
});

describe("Westvale Abbey", () => {
  it("makes a Cleric for 1 life, and becomes Ormendahl, untapped, for five creatures", () => {
    const game = setUp();
    const abbey = spawn(game, "Westvale Abbey");
    for (let i = 0; i < 5; i += 1) spawn(game, "Wastes");
    tokens(game, "Human Cleric Token", 5);
    expect(offers(game, abbey, 2)).toHaveLength(1);
    activate(game, abbey, 2);
    expect(tokenCount(game, "Human Cleric Token")).toBe(0);
    game.advanceUntil(quiet);
    const object = game.state.objects[abbey];
    expect(object.face).toBe(1);
    expect(object.tapped).toBe(false);
    expect(game.characteristics(abbey).power).toBe(9);
  });
});

describe("Priest of Forgotten Gods", () => {
  it("makes each target lose 2 and sacrifice a creature, then adds {B}{B} and draws", () => {
    const game = setUp();
    const priest = spawn(game, "Priest of Forgotten Gods");
    const fodder = tokens(game, "Human Cleric Token", 2);
    const theirs = spawn(game, "Grizzly Bears", B);
    const hand = game.state.zones.perPlayer[A].hand.length;
    const life = game.state.players[B].life;
    activate(game, priest, 0, { targets: [{ kind: "player", player: B }] });
    expect(fodder.map((id) => zone(game, id))).toEqual([undefined, undefined]);
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(life - 2);
    expect(zone(game, theirs)).toBe("graveyard");
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand + 1);
    expect(game.state.players[A].manaPool.filter((u) => u.type === "B")).toHaveLength(2);
  });

  it("with two targets, each loses 2 and chooses a creature of their own to sacrifice", () => {
    const C = asPlayerId("carol");
    const game = Game.create({
      seed: 1,
      shuffle: false,
      startingPlayer: A,
      rules: { skipFirstDraw: true, maxLandsPerTurn: 99, maxHandSize: 99, openingHandSize: 0 },
      controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B), [C]: new ScriptedController(C) },
      decks: [A, B, C].map((player) => ({ player, cards: Array<string>(40).fill("Wastes") })),
    });
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
    const priest = spawn(game, "Priest of Forgotten Gods");
    const fodder = [spawn(game, "Grizzly Bears"), spawn(game, "Hill Giant"), spawn(game, "Serra Angel")];
    const theirs = [B, B, C, C].map((p, i) => spawn(game, i % 2 === 0 ? "Grizzly Bears" : "Hill Giant", p));
    // Named out of turn order: the choosing still goes in it.
    activate(game, priest, 0, {
      targets: [
        { kind: "player", player: C },
        { kind: "player", player: B },
      ],
    });
    // Three others: the Priest's controller chooses two.
    game.dispatch({ type: "sacrifice", player: A, permanents: [fodder[0], fodder[1]] });
    expect(zone(game, fodder[2])).toBe("battlefield");
    const asked: PlayerId[] = [];
    const chosen: ObjectId[] = [];
    // Where each earlier choice is as the next player chooses.
    const earlierAsAsked: (string | undefined)[] = [];
    for (let i = 0; i < 20 && !quiet(game.state); i += 1) {
      const awaiting = game.state.awaiting;
      if (awaiting?.kind === "sacrifice") {
        asked.push(awaiting.player);
        earlierAsAsked.push(...chosen.map((id) => zone(game, id)));
        chosen.push(awaiting.eligible[0]);
        game.dispatch({ type: "sacrifice", player: awaiting.player, permanents: [awaiting.eligible[0]] });
      } else if (game.state.priority.holder !== null) {
        game.dispatch({ type: "pass-priority", player: game.state.priority.holder });
      }
    }
    // Each target chooses from their own creatures, in turn order, and then
    // they're all sacrificed at once (rule 101.4): Bob's is still there as
    // Carol chooses.
    expect(asked).toEqual([B, C]);
    expect(earlierAsAsked).toEqual(["battlefield"]);
    expect([game.state.players[B].life, game.state.players[C].life]).toEqual([18, 18]);
    expect(theirs.map((id) => zone(game, id))).toEqual(["graveyard", "battlefield", "graveyard", "battlefield"]);
  });

  it("may target no one and still adds {B}{B} and draws (the ruling)", () => {
    const game = setUp();
    const priest = spawn(game, "Priest of Forgotten Gods");
    tokens(game, "Human Cleric Token", 2);
    const hand = game.state.zones.perPlayer[A].hand.length;
    activate(game, priest, 0, { targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand + 1);
  });
});

describe("Ruthless Technomancer", () => {
  it("may sacrifice another creature as it enters, for Treasures equal to its power", () => {
    const game = setUp();
    const giant = spawn(game, "Hill Giant");
    const card = game.debugSpawn("Ruthless Technomancer", A, "hand");
    for (let i = 0; i < 4; i += 1) spawn(game, "Swamp");
    game.dispatch({ type: "cast-spell", player: A, card });
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    // The Hill Giant is the only other creature: no choice.
    game.advanceUntil(quiet);
    expect(zone(game, giant)).toBe("graveyard");
    expect(tokenCount(game, "Treasure Token")).toBe(3);
  });

  it("returns a creature card with power at most X, X at least 1, for X artifacts", () => {
    const game = setUp();
    const technomancer = spawn(game, "Ruthless Technomancer");
    for (let i = 0; i < 3; i += 1) spawn(game, "Swamp");
    tokens(game, "Treasure Token", 2);
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard"); // power 2
    const giant = game.debugSpawn("Hill Giant", A, "graveyard"); // power 3
    game.debugSpawn("Ornithopter", A, "graveyard"); // power 0
    const xs = offers(game, technomancer, 0).map((o) => o.xCost);
    // X is 1 or 2 (two artifacts), never 0, each its own offer.
    expect(xs).toEqual([
      { minX: 1, maxX: 1 },
      { minX: 2, maxX: 2 },
    ]);
    const atTwo = offers(game, technomancer, 0)[1];
    const options = atTwo.targetOptions[0].map((t) => (t.kind === "object" ? t.object : null));
    expect(options).toContain(bears);
    expect(options).not.toContain(giant);
    expect(() => activate(game, technomancer, 0, { xValue: 0, targets: [{ kind: "object", object: bears }] })).toThrow(
      /X less than 1/,
    );
    activate(game, technomancer, 0, { xValue: 2, targets: [{ kind: "object", object: bears }] });
    game.advanceUntil(quiet);
    expect(zone(game, bears)).toBe("battlefield");
    expect(tokenCount(game, "Treasure Token")).toBe(0);
  });
});
