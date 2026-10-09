/**
 * A sacrifice cost of several permanents (`AbilityCost.sacrifice` with a
 * `count`, or an `each`): "Sacrifice two artifacts" (Sai, Master
 * Thopterist), "Sacrifice X Treasures" (Grim Hireling). Which ones is the
 * player's choice, made as the cost is paid (rules 601.2h, 602.2b) with the
 * ordinary `sacrifice` decision once the ability is on the stack and its mana
 * paid; a token stack counts as every token in it; a Treasure the mana had to
 * come from can't pay as well; and all of them go at once.
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

const setUp = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: true, maxLandsPerTurn: 99, maxHandSize: 99, openingHandSize: 0 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
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
const named = (game: Game, name: string): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === name);

/** `count` tokens named `name`, each its own object (below the stacking
 * threshold) — their ids, oldest first. */
function tokens(game: Game, name: string, count: number, player: PlayerId = A): ObjectId[] {
  const before = new Set(game.state.zones.shared.battlefield);
  game.debugApplyEffect(player, { kind: "create-token", token: name, count });
  return game.state.zones.shared.battlefield.filter((id) => !before.has(id));
}

type AbilityOffer = Extract<LegalAction, { kind: "activate-ability" }>;
type SacrificeOffer = Extract<LegalAction, { kind: "sacrifice" }>;
const offer = (game: Game, source: ObjectId): AbilityOffer | undefined =>
  game
    .legalActions(A)
    .find((a): a is AbilityOffer => a.kind === "activate-ability" && a.source === source);
const sacrificeOffer = (game: Game): SacrificeOffer | undefined =>
  game.legalActions(A).find((a): a is SacrificeOffer => a.kind === "sacrifice");

describe("a sacrifice cost of several permanents", () => {
  it("isn't offered without enough to sacrifice", () => {
    const game = setUp();
    const sai = spawn(game, "Sai, Master Thopterist");
    spawn(game, "Island");
    spawn(game, "Island");
    tokens(game, "Treasure Token", 1);
    expect(offer(game, sai)).toBeUndefined();
    expect(() => game.dispatch({ type: "activate-ability", player: A, source: sai, abilityIndex: 0 })).toThrow(
      /too few permanents to sacrifice/,
    );
  });

  it("asks which once the ability is on the stack, and sacrifices the chosen ones together", () => {
    const game = setUp();
    const sai = spawn(game, "Sai, Master Thopterist");
    spawn(game, "Island");
    spawn(game, "Island");
    const [t1, t2, t3] = tokens(game, "Treasure Token", 3);
    const ring = spawn(game, "Sol Ring");
    // Nothing to name on the action: the choice comes as the cost is paid.
    expect(offer(game, sai)?.sacrifice).toBeUndefined();
    game.dispatch({ type: "activate-ability", player: A, source: sai, abilityIndex: 0 });
    // On the stack, its mana paid from the Islands, waiting on the sacrifice.
    expect(game.state.zones.shared.stack).toHaveLength(1);
    expect(game.state.awaiting?.kind).toBe("sacrifice");
    expect(game.state.decisionSource?.cardName).toBe("Sai, Master Thopterist");
    const asked = sacrificeOffer(game);
    expect(asked?.count).toBe(2);
    expect([...(asked?.eligible ?? [])].sort()).toEqual([t1, t2, t3, ring].sort());
    // Exactly two, each one of the eligible.
    expect(() => game.dispatch({ type: "sacrifice", player: A, permanents: [t1] })).toThrow(/exactly 2/);
    expect(() => game.dispatch({ type: "sacrifice", player: A, permanents: [t1, sai] })).toThrow(/not an eligible/);
    const before = game.eventsOfType("permanent-sacrificed").length;
    game.dispatch({ type: "sacrifice", player: A, permanents: [t1, ring] });
    expect(zone(game, t1)).toBeUndefined(); // a token ceases to exist
    expect(zone(game, ring)).toBe("graveyard");
    expect(zone(game, t2)).toBe("battlefield");
    expect(zone(game, t3)).toBe("battlefield");
    const sacrificed = game
      .eventsOfType("permanent-sacrificed")
      .slice(before)
      .map((e) => e.object);
    expect(sacrificed.sort()).toEqual([t1, ring].sort());
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand + 1);
  });

  it("takes exactly what there is without asking", () => {
    const game = setUp();
    const sai = spawn(game, "Sai, Master Thopterist");
    spawn(game, "Island");
    spawn(game, "Island");
    const [t1, t2] = tokens(game, "Treasure Token", 2);
    game.dispatch({ type: "activate-ability", player: A, source: sai, abilityIndex: 0 });
    expect(game.state.awaiting?.kind).not.toBe("sacrifice");
    expect(zone(game, t1)).toBeUndefined();
    expect(zone(game, t2)).toBeUndefined();
  });

  it("won't count a Treasure the mana has to come from", () => {
    const game = setUp();
    const sai = spawn(game, "Sai, Master Thopterist");
    // {1}{U} off one Island: the {1} has to be a Treasure's, so two Treasures
    // can't pay "Sacrifice two artifacts" as well.
    spawn(game, "Island");
    tokens(game, "Treasure Token", 2);
    expect(offer(game, sai)).toBeUndefined();
    // A third makes it payable: one for the mana, the other two sacrificed.
    tokens(game, "Treasure Token", 1);
    expect(offer(game, sai)).toBeDefined();
    game.dispatch({ type: "activate-ability", player: A, source: sai, abilityIndex: 0 });
    expect(game.state.awaiting?.kind).not.toBe("sacrifice");
    expect(named(game, "Treasure Token")).toEqual([]);
  });

  it("counts a token stack as every token in it, and splits off only the ones sacrificed", () => {
    const game = setUp();
    const sai = spawn(game, "Sai, Master Thopterist");
    spawn(game, "Island");
    spawn(game, "Island");
    game.debugApplyEffect(A, { kind: "create-token", token: "Thopter Token", count: 10 });
    const [stack] = named(game, "Thopter Token");
    expect(game.state.objects[stack].stackCount).toBe(10);
    const ring = spawn(game, "Sol Ring");
    game.dispatch({ type: "activate-ability", player: A, source: sai, abilityIndex: 0 });
    expect(sacrificeOffer(game)?.copies).toEqual({ [stack]: 10 });
    game.dispatch({ type: "sacrifice", player: A, permanents: [stack, stack] });
    expect(game.state.objects[stack].stackCount).toBe(8);
    expect(named(game, "Thopter Token")).toEqual([stack]);
    expect(zone(game, ring)).toBe("battlefield");
  });

  it("takes a whole stack without asking when it's exactly what's owed, every token dying", () => {
    const game = setUp();
    const abbey = spawn(game, "Westvale Abbey");
    for (let i = 0; i < 5; i += 1) spawn(game, "Wastes");
    spawn(game, "Bastion of Remembrance");
    game.debugApplyEffect(A, { kind: "create-token", token: "Human Cleric Token", count: 8 });
    const [stack] = named(game, "Human Cleric Token");
    // Five tokens in one object: exactly "Sacrifice five creatures".
    game.state.objects[stack].stackCount = 5;
    const life = game.state.players[B].life;
    game.dispatch({ type: "activate-ability", player: A, source: abbey, abilityIndex: 2 });
    expect(game.state.awaiting?.kind).not.toBe("sacrifice");
    expect(named(game, "Human Cleric Token")).toEqual([]);
    game.advanceUntil(quiet);
    // Bastion of Remembrance saw five creatures die, not one.
    expect(game.state.players[B].life).toBe(life - 5);
    expect(game.state.objects[abbey].face).toBe(1);
  });

  it("checks no state-based action until the cost is paid", () => {
    const game = setUp();
    const sai = spawn(game, "Sai, Master Thopterist");
    spawn(game, "Island");
    spawn(game, "Island");
    tokens(game, "Treasure Token", 3);
    // A creature with lethal damage waiting on the next check — which can't
    // come while the ability is still being activated.
    const bears = spawn(game, "Grizzly Bears", B);
    game.state.objects[bears].damageMarked = 2;
    game.dispatch({ type: "activate-ability", player: A, source: sai, abilityIndex: 0 });
    expect(game.state.awaiting?.kind).toBe("sacrifice");
    expect(zone(game, bears)).toBe("battlefield");
    const [first, second] = sacrificeOffer(game)?.eligible ?? [];
    game.dispatch({ type: "sacrifice", player: A, permanents: [first, second] });
    expect(zone(game, bears)).toBe("graveyard");
  });

  it("sacrifices them as one event: each one's dies trigger sees the others (rule 603.10a)", () => {
    const game = setUp();
    const zopandrel = spawn(game, "Zopandrel, Hunger Dominus");
    spawn(game, "Forest");
    spawn(game, "Forest");
    // Named first, so one at a time it would be gone before the Bears died.
    const cutthroat = spawn(game, "Zulaport Cutthroat");
    const bears = spawn(game, "Grizzly Bears");
    const life = game.state.players[B].life;
    game.dispatch({ type: "activate-ability", player: A, source: zopandrel, abilityIndex: 0 });
    expect([cutthroat, bears].map((id) => zone(game, id))).toEqual(["graveyard", "graveyard"]);
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(life - 2);
  });

  it("hands priority back to the activating player once it's paid", () => {
    const game = setUp();
    const sai = spawn(game, "Sai, Master Thopterist");
    spawn(game, "Island");
    spawn(game, "Island");
    const [ring, stone] = [spawn(game, "Sol Ring"), spawn(game, "Mind Stone"), spawn(game, "Ornithopter")];
    game.dispatch({ type: "activate-ability", player: A, source: sai, abilityIndex: 0 });
    expect(game.state.pendingCostSacrifice).toBeDefined();
    game.dispatch({ type: "sacrifice", player: A, permanents: [ring, stone] });
    expect(game.state.awaiting).toBeNull();
    expect(game.state.pendingCostSacrifice).toBeUndefined();
    expect(game.state.priority.holder).toBe(A);
    expect(game.state.zones.shared.stack).toHaveLength(1);
  });
});

describe("Sacrifice X", () => {
  it("offers X up to what there is after the mana, and sacrifices X of them", () => {
    const game = setUp();
    const hireling = spawn(game, "Grim Hireling");
    spawn(game, "Swamp");
    const treasures = tokens(game, "Treasure Token", 3);
    const giant = spawn(game, "Hill Giant", B);
    expect(offer(game, hireling)?.xCost).toEqual({ maxX: 3 });
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: hireling,
      abilityIndex: 0,
      xValue: 2,
      targets: [{ kind: "object", object: giant }],
    });
    expect(sacrificeOffer(game)?.count).toBe(2);
    game.dispatch({ type: "sacrifice", player: A, permanents: [treasures[0], treasures[2]] });
    expect(zone(game, treasures[1])).toBe("battlefield");
    game.advanceUntil(quiet);
    // Hill Giant (3/3) at -2/-2.
    const giantNow = game.characteristics(giant);
    expect([giantNow.power, giantNow.toughness]).toEqual([1, 1]);
  });

  it("an X too large for what's left is refused", () => {
    const game = setUp();
    const hireling = spawn(game, "Grim Hireling");
    // No Swamp: the {B} is a Treasure's, so two of the three are left.
    tokens(game, "Treasure Token", 3);
    const bears = spawn(game, "Grizzly Bears", B);
    expect(offer(game, hireling)?.xCost).toEqual({ maxX: 2 });
    const activate = (xValue: number) => (): void =>
      void game.dispatch({
        type: "activate-ability",
        player: A,
        source: hireling,
        abilityIndex: 0,
        xValue,
        targets: [{ kind: "object", object: bears }],
      });
    expect(activate(3)).toThrow(/too few permanents to sacrifice/);
    activate(2)();
    game.advanceUntil(quiet);
    expect(zone(game, bears)).toBe("graveyard");
    expect(named(game, "Treasure Token")).toEqual([]);
  });

  it("X = 0 sacrifices nothing", () => {
    const game = setUp();
    const hireling = spawn(game, "Grim Hireling");
    spawn(game, "Swamp");
    const bears = spawn(game, "Grizzly Bears", B);
    expect(offer(game, hireling)?.xCost).toEqual({ maxX: 0 });
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: hireling,
      abilityIndex: 0,
      xValue: 0,
      targets: [{ kind: "object", object: bears }],
    });
    expect(game.state.awaiting?.kind).not.toBe("sacrifice");
    game.advanceUntil(quiet);
    expect(zone(game, bears)).toBe("battlefield");
  });
});

describe("a spell's sacrifice of several", () => {
  type CastOffer = Extract<LegalAction, { kind: "cast-spell" }>;
  const castOffers = (game: Game, card: ObjectId): CastOffer[] =>
    game.legalActions(A).filter((a): a is CastOffer => a.kind === "cast-spell" && a.card === card);

  it("sacrifice X: X up to the creatures there are, X targets, chosen once it's on the stack", () => {
    const game = setUp();
    for (let i = 0; i < 5; i += 1) spawn(game, "Swamp");
    const mine = [spawn(game, "Grizzly Bears"), spawn(game, "Hill Giant"), spawn(game, "Llanowar Elves")];
    const theirs = [spawn(game, "Grizzly Bears", B), spawn(game, "Serra Angel", B)];
    const card = game.debugSpawn("Eliminate the Competition", A, "hand");
    const [offer] = castOffers(game, card);
    // Three creatures to sacrifice; five creatures to target.
    expect(offer?.xCost?.maxX).toBe(3);
    expect(offer?.sacrifice).toBeUndefined();
    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      xValue: 2,
      targets: theirs.map((object) => ({ kind: "object" as const, object })),
    });
    expect(game.state.zones.shared.stack).toEqual([card]);
    expect(sacrificeOffer(game)?.count).toBe(2);
    expect([...(sacrificeOffer(game)?.eligible ?? [])].sort()).toEqual([...mine].sort());
    game.dispatch({ type: "sacrifice", player: A, permanents: [mine[0], mine[2]] });
    expect(zone(game, mine[0])).toBe("graveyard");
    expect(zone(game, mine[1])).toBe("battlefield");
    game.advanceUntil(quiet);
    expect(theirs.map((id) => zone(game, id))).toEqual(["graveyard", "graveyard"]);
  });

  it("an X larger than what there is to sacrifice is refused", () => {
    const game = setUp();
    for (let i = 0; i < 5; i += 1) spawn(game, "Swamp");
    spawn(game, "Grizzly Bears");
    const theirs = [spawn(game, "Grizzly Bears", B), spawn(game, "Serra Angel", B)];
    const card = game.debugSpawn("Eliminate the Competition", A, "hand");
    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card,
        xValue: 2,
        targets: theirs.map((object) => ({ kind: "object" as const, object })),
      }),
    ).toThrow(/too few permanents to sacrifice/);
  });

  it("flashback for a sacrifice alone, after its target is chosen", () => {
    const game = setUp();
    const dread = game.debugSpawn("Dread Return", A, "graveyard");
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    const fodder = [spawn(game, "Grizzly Bears"), spawn(game, "Llanowar Elves")];
    // Two creatures can't pay "Sacrifice three creatures".
    expect(castOffers(game, dread).filter((o) => o.via === "flashback")).toHaveLength(0);
    fodder.push(spawn(game, "Serra Angel"));
    expect(castOffers(game, dread).filter((o) => o.via === "flashback")).toHaveLength(1);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: dread,
      via: "flashback",
      targets: [{ kind: "object", object: giant }],
    });
    // Exactly three: no choice.
    expect(fodder.map((id) => zone(game, id))).toEqual(["graveyard", "graveyard", "graveyard"]);
    game.advanceUntil(quiet);
    expect(zone(game, giant)).toBe("battlefield");
    expect(zone(game, dread)).toBe("exile");
  });

  it("a flashback granted for mana is its own cost: it sacrifices nothing", () => {
    const game = setUp();
    const dread = game.debugSpawn("Dread Return", A, "graveyard");
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    for (let i = 0; i < 4; i += 1) spawn(game, "Swamp");
    // Snapcaster Mage's kind of flashback, for its mana cost: no creature to
    // sacrifice is needed for it, and none is taken.
    const granter = spawn(game, "Grizzly Bears");
    game.state.objects[dread].grantedFlashback = { cost: "{2}{B}{B}", untilEndOfTurn: true, by: granter };
    const flashbacks = castOffers(game, dread).filter((o) => o.via === "flashback");
    expect(flashbacks.map((o) => o.graveyardGrant)).toEqual([{ source: granter }]);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: dread,
      via: "flashback",
      graveyardGrant: { source: granter },
      targets: [{ kind: "object", object: giant }],
    });
    expect(game.state.awaiting?.kind).not.toBe("sacrifice");
    expect(zone(game, granter)).toBe("battlefield");
    game.advanceUntil(quiet);
    expect(zone(game, giant)).toBe("battlefield");
  });
});
