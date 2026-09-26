/**
 * Station (rule 702.184) and station symbols (rule 721), through Hearthhull,
 * the Worldseed:
 *
 *   Station (Tap another creature you control: Put charge counters equal to
 *   its power on this Spacecraft. Station only as a sorcery. It's an artifact
 *   creature at 8+.)
 *   2+ | {1}, {T}, Sacrifice a land: Draw two cards. You may play an
 *   additional land this turn.
 *   8+ | Flying, vigilance, haste                                    [6/7]
 *   Whenever you sacrifice a land, each opponent loses 2 life.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { canCommandAlone } from "../deck-validation.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const HEARTHHULL = "Hearthhull, the Worldseed";
const registry = createDefaultRegistry();

const setUp = (a = new ScriptedController(A)) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Forest") },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId = A, summoningSick = false): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick });
const charge = (game: Game, id: ObjectId): number => game.state.objects[id].counters.charge ?? 0;
/** Alice's offered activations of `source`, by their text. */
const offers = (game: Game, source: ObjectId) =>
  game.legalActions(A).flatMap((a) => (a.kind === "activate-ability" && a.source === source ? [a] : []));
const stationOf = (game: Game, hull: ObjectId) => offers(game, hull).find((a) => a.text.startsWith("Station"));
/** Station with `creature`, leaving the ability on the stack. */
const beginStation = (game: Game, hull: ObjectId, creature: ObjectId): void => {
  const offer = stationOf(game, hull);
  if (offer === undefined) throw new Error("station isn't offered");
  game.dispatch({ type: "activate-ability", player: A, source: hull, abilityIndex: offer.abilityIndex, tap: [creature] });
};

describe("station (rule 702.184a)", () => {
  it("taps another creature and puts charge counters equal to its power on the Spacecraft", () => {
    const game = setUp();
    const hull = spawn(game, HEARTHHULL);
    const giant = spawn(game, "Hill Giant");
    beginStation(game, hull, giant);
    expect(game.state.objects[giant].tapped).toBe(true);
    game.advanceUntil(quiet);
    expect(charge(game, hull)).toBe(3);
  });

  it("reads the tapped creature's power as it resolves", () => {
    const game = setUp();
    const hull = spawn(game, HEARTHHULL);
    const giant = spawn(game, "Hill Giant");
    beginStation(game, hull, giant);
    game.debugApplyEffect(A, { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" }, [
      { kind: "object", object: giant },
    ]);
    game.advanceUntil(quiet);
    expect(charge(game, hull)).toBe(5);
  });

  it("…as it last existed, if it has left the battlefield", () => {
    const game = setUp();
    const hull = spawn(game, HEARTHHULL);
    const giant = spawn(game, "Hill Giant");
    beginStation(game, hull, giant);
    const it = [{ kind: "object", object: giant }] as const;
    game.debugApplyEffect(A, { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" }, it);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, it);
    game.advanceUntil(quiet);
    expect(game.state.objects[giant].zone).toBe("graveyard");
    // The 5 power it died with, not the card's printed 3.
    expect(charge(game, hull)).toBe(5);
  });

  it("taps another creature you control, summoning-sick or not — never itself, never an opponent's", () => {
    const game = setUp();
    const hull = spawn(game, HEARTHHULL);
    game.state.objects[hull].counters.charge = 8; // a creature itself now
    const sick = spawn(game, "Grizzly Bears", A, true);
    spawn(game, "Hill Giant", B);
    expect(stationOf(game, hull)?.tapCost?.choices).toEqual([sick]);
  });

  it("only as a sorcery", () => {
    const game = setUp();
    const hull = spawn(game, HEARTHHULL);
    spawn(game, "Hill Giant");
    expect(stationOf(game, hull)).toBeDefined();
    game.advanceUntil((s) => s.turn.step === "begin-combat" && s.priority.holder === A);
    expect(stationOf(game, hull)).toBeUndefined();
  });
});

describe("station symbols (rule 721.2)", () => {
  it("below 8, an artifact with no power or toughness; at 8 or more, a 6/7 flying, vigilant, hasty creature", () => {
    const game = setUp();
    const hull = spawn(game, HEARTHHULL);
    let c = game.characteristics(hull);
    expect(c.types).toEqual(["artifact"]);
    expect([c.power, c.toughness]).toEqual([0, 0]);
    game.state.objects[hull].counters.charge = 8;
    c = game.characteristics(hull);
    expect(c.types).toContain("creature");
    expect([c.power, c.toughness]).toEqual([6, 7]);
    for (const k of ["flying", "vigilance", "haste"] as const) expect(c.keywords.has(k)).toBe(true);
    // Losing counters takes it away again.
    game.state.objects[hull].counters.charge = 7;
    expect(game.characteristics(hull).types).toEqual(["artifact"]);
  });

  it("has its 2+ ability only with two or more charge counters", () => {
    const game = setUp();
    const hull = spawn(game, HEARTHHULL);
    spawn(game, "Forest");
    spawn(game, "Forest");
    const draw = () => offers(game, hull).find((a) => a.text.startsWith("{1}, {T}, Sacrifice a land"));
    game.state.objects[hull].counters.charge = 1;
    expect(draw()).toBeUndefined();
    game.state.objects[hull].counters.charge = 2;
    expect(draw()).toBeDefined();
  });

  it("made a creature some other way, it takes that effect's power and toughness, not its printed ones", () => {
    const game = setUp();
    const hull = spawn(game, HEARTHHULL);
    game.debugApplyEffect(
      A,
      { kind: "animate", target: 0, power: 3, toughness: 3, addTypes: ["creature"], addSubtypes: [], duration: "end-of-turn" },
      [{ kind: "object", object: hull }],
    );
    const c = game.characteristics(hull);
    expect(c.types).toContain("creature");
    expect([c.power, c.toughness]).toEqual([3, 3]);
  });

  it("has no power or toughness off the battlefield (721.2c)", () => {
    const game = setUp();
    const hull = game.debugSpawn(HEARTHHULL, A, "hand");
    const c = game.characteristics(hull);
    expect([c.power, c.toughness]).toEqual([0, 0]);
  });
});

describe("Hearthhull, the Worldseed", () => {
  it("2+: draws two and gives a land drop, and each opponent loses 2 as the land is sacrificed", () => {
    const game = setUp();
    const hull = spawn(game, HEARTHHULL);
    game.state.objects[hull].counters.charge = 2;
    spawn(game, "Forest");
    const fodder = spawn(game, "Swamp");
    const hand = game.handOf(A).length;
    const life = game.state.players[B].life;
    const offer = offers(game, hull).find((a) => a.text.startsWith("{1}, {T}, Sacrifice a land"));
    if (offer === undefined) throw new Error("the 2+ ability isn't offered");
    game.dispatch({ type: "activate-ability", player: A, source: hull, abilityIndex: offer.abilityIndex, sacrifice: fodder });
    game.advanceUntil(quiet);
    expect(game.state.objects[fodder].zone).toBe("graveyard");
    expect(game.handOf(A)).toHaveLength(hand + 2);
    expect(game.state.players[A].extraLandsThisTurn).toBe(1);
    expect(game.state.players[B].life).toBe(life - 2);
  });

  it("can be a commander: a Spacecraft with a power/toughness box (rule 903.3)", () => {
    expect(canCommandAlone(registry.get(HEARTHHULL))).toBe(true);
  });
});

describe("Inspirit, Flagship Vessel", () => {
  it("1+: as combat begins on your turn, your choice of counters on another artifact", () => {
    const a = new ScriptedController(A);
    const game = setUp(a);
    const inspirit = spawn(game, "Inspirit, Flagship Vessel");
    const hull = spawn(game, HEARTHHULL);
    game.state.objects[inspirit].counters.charge = 1;
    a.chooseTargetsFn = () => [{ kind: "object", object: hull }];
    a.chooseModesFn = () => [1]; // two charge counters
    game.advanceUntil((s) => s.turn.step === "begin-combat" && quiet(s));
    expect(charge(game, hull)).toBe(2);
    expect(charge(game, inspirit)).toBe(1);
  });

  it("without a charge counter, has no combat trigger", () => {
    const a = new ScriptedController(A);
    const game = setUp(a);
    spawn(game, "Inspirit, Flagship Vessel");
    const hull = spawn(game, HEARTHHULL);
    a.chooseTargetsFn = () => [{ kind: "object", object: hull }];
    a.chooseModesFn = () => [1];
    game.advanceUntil((s) => s.turn.step === "begin-combat" && quiet(s));
    expect(charge(game, hull)).toBe(0);
  });

  it("gives your other artifacts hexproof and indestructible", () => {
    const game = setUp();
    const inspirit = spawn(game, "Inspirit, Flagship Vessel");
    const hull = spawn(game, HEARTHHULL);
    const theirs = spawn(game, HEARTHHULL, B);
    for (const k of ["hexproof", "indestructible"] as const) {
      expect(game.characteristics(hull).keywords.has(k)).toBe(true);
      expect(game.characteristics(inspirit).keywords.has(k)).toBe(false);
      expect(game.characteristics(theirs).keywords.has(k)).toBe(false);
    }
  });
});

describe("Infinite Guideline Station", () => {
  it("enters making a tapped 2/2 Robot for each multicolored permanent you control, itself included", () => {
    const game = setUp();
    spawn(game, HEARTHHULL);
    spawn(game, "Grizzly Bears");
    spawn(game, HEARTHHULL, B);
    game.debugSpawn("Infinite Guideline Station", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    const robots = game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === "Robot Token");
    expect(robots.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(2);
    for (const id of robots) expect(game.state.objects[id].tapped).toBe(true);
  });

  it("at 12+, a 7/15 flier that draws a card per multicolored permanent you control as it attacks", () => {
    const a = new ScriptedController(A);
    const game = setUp(a);
    const station = spawn(game, "Infinite Guideline Station");
    spawn(game, HEARTHHULL);
    game.state.objects[station].counters.charge = 12;
    const c = game.characteristics(station);
    expect([c.power, c.toughness]).toEqual([7, 15]);
    expect(c.keywords.has("flying")).toBe(true);
    a.declareAttackersFn = () => [{ attacker: station, defender: B }];
    const hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.step === "declare-blockers" && quiet(s));
    expect(game.handOf(A)).toHaveLength(hand + 2);
  });
});
