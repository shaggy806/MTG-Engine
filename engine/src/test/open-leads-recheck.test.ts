/**
 * The "may have unblocked" leads (docs/card-blockers.md, "Open leads"),
 * rechecked against features since built:
 *
 * - dredge (`CardDefinition.dredge`, Life from the Loam's): Dakmor Salvage,
 *   Darkblast, Shambling Shell, Golgari Thug, Golgari Grave-Troll and
 *   Stinkweed Imp — the Imp with a `destroy` of the damage's recipient
 *   (`"trigger-recipient"`);
 * - "Nth from the top" (God-Eternal Oketra's leaves trigger): God-Eternal
 *   Rhonas — with `double-pt-all`'s `powerOnly` and `exceptSource` — and
 *   Ilharg, the Raze-Boar;
 * - `cast-now`: Buster Sword (Glamdring's free cast, after a draw);
 * - a `spell-or-permanent` target and a copy's new targets: Venser, Shaper
 *   Savant and Flusterstorm.
 */

import { describe, expect, it } from "vitest";

import type { Action, LegalAction } from "../actions.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

type CastNowOffer = Extract<LegalAction, { kind: "cast-now" }>;
type Cast = Extract<Action, { type: "cast-spell" }>;

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
/** Stop at a decision, or once everything has resolved. */
const settle = (s: GameState): boolean => s.awaiting !== null || quiet(s);

/** A's first precombat main, nobody answering for anyone: every decision is
 * the test's. No lands. */
const setUp = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  return game;
};

/** The same with scripted controllers, for combat — they declare it. */
const setUpScripted = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const spawn = (game: Game, name: string, p: PlayerId = A): ObjectId =>
  game.debugSpawn(name, p, "battlefield", { summoningSick: false });
const lands = (game: Game, land: string, n: number, p: PlayerId = A): void => {
  for (let i = 0; i < n; i += 1) spawn(game, land, p);
};
const cast = (game: Game, p: PlayerId, name: string, targets: TargetRef[] = []): ObjectId => {
  const card = game.debugSpawn(name, p, "hand");
  game.dispatch({ type: "cast-spell", player: p, card, targets });
  return card;
};
const zoneOf = (game: Game, id: ObjectId): string | undefined => game.state.objects[id]?.zone;
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = game.characteristics(id);
  return [c.power, c.toughness];
};
const toPostcombat = (s: GameState): boolean => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s);
const toNextUpkeep = (s: GameState): boolean => s.turn.number === 2 && s.turn.step === "upkeep";

const dredgeOffer = (game: Game) => {
  const awaiting = game.state.awaiting;
  return awaiting?.kind === "choose-modes" && awaiting.dredgeFor !== undefined ? awaiting : null;
};

describe("the dredge cards", () => {
  const DREDGE: readonly (readonly [string, number])[] = [
    ["Dakmor Salvage", 2],
    ["Darkblast", 3],
    ["Shambling Shell", 3],
    ["Golgari Thug", 4],
    ["Stinkweed Imp", 5],
    ["Golgari Grave-Troll", 6],
  ];

  it.each(DREDGE)("%s: dredge %i replaces a draw, and needs that many cards in the library", (name, n) => {
    const game = setUp();
    const card = game.debugSpawn(name, A, "graveyard");
    const zones = game.state.zones.perPlayer[A];
    // One card short: not offered, and the draw just happens (702.52b).
    zones.library = zones.library.slice(0, n - 1);
    game.debugApplyEffect(A, { kind: "draw", amount: 1 });
    expect(dredgeOffer(game)).toBeNull();
    expect(zoneOf(game, card)).toBe("graveyard");
    // Exactly n: offered; dredged, it mills n and comes back to hand.
    zones.library = zones.library.slice(0, 0);
    for (let i = 0; i < n; i += 1) game.debugSpawn("Wastes", A, "library");
    expect(zones.library).toHaveLength(n);
    game.debugApplyEffect(A, { kind: "draw", amount: 1 });
    expect(dredgeOffer(game)?.dredgeFor?.cards).toContain(card);
    game.dispatch({ type: "choose-modes", player: A, modes: [1] });
    expect(zoneOf(game, card)).toBe("hand");
    expect(game.state.zones.perPlayer[A].library).toHaveLength(0);
  });
});

describe("Golgari Grave-Troll", () => {
  it("enters with a +1/+1 counter for each creature card in its owner's graveyard", () => {
    const game = setUp();
    lands(game, "Forest", 5);
    for (const name of ["Grizzly Bears", "Hill Giant", "Forest"]) game.debugSpawn(name, A, "graveyard");
    game.debugSpawn("Grizzly Bears", B, "graveyard");
    const troll = cast(game, A, "Golgari Grave-Troll");
    game.advanceUntil(quiet);
    expect(zoneOf(game, troll)).toBe("battlefield");
    expect(game.state.objects[troll].counters["+1/+1"]).toBe(2);
    expect(pt(game, troll)).toEqual([2, 2]);
  });

  it("returned from the graveyard straight to the battlefield, counts itself (its ruling)", () => {
    const game = setUp();
    lands(game, "Swamp", 4);
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    const troll = game.debugSpawn("Golgari Grave-Troll", A, "graveyard");
    cast(game, A, "Zombify", [obj(troll)]);
    game.advanceUntil(quiet);
    expect(zoneOf(game, troll)).toBe("battlefield");
    expect(game.state.objects[troll].counters["+1/+1"]).toBe(2);
  });

  it("regenerates by removing a counter", () => {
    const game = setUp();
    lands(game, "Wastes", 1);
    const troll = spawn(game, "Golgari Grave-Troll");
    game.state.objects[troll].counters["+1/+1"] = 3;
    game.dispatch({ type: "activate-ability", player: A, source: troll, abilityIndex: 0, targets: [] });
    expect(game.state.objects[troll].counters["+1/+1"]).toBe(2);
    game.advanceUntil(quiet);
    game.debugApplyEffect(A, { kind: "destroy-all", filter: { type: "creature" } });
    game.advanceUntil(quiet);
    expect(zoneOf(game, troll)).toBe("battlefield");
    expect(game.state.objects[troll].tapped).toBe(true);
  });
});

describe("Golgari Thug", () => {
  it("dying, puts target creature card from your graveyard on top of your library", () => {
    const game = setUp();
    const thug = spawn(game, "Golgari Thug");
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    game.debugApplyEffect(A, { kind: "destroy-all", filter: { type: "creature" } });
    game.advanceUntil(settle);
    expect(zoneOf(game, thug)).toBe("graveyard");
    expect(game.state.awaiting?.kind).toBe("choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(giant)] });
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[A].library.indexOf(giant)).toBe(0);
    // The top is what's drawn next — once the Thug's own dredge is declined.
    game.debugApplyEffect(A, { kind: "draw", amount: 1 });
    expect(dredgeOffer(game)?.dredgeFor?.cards).toEqual([thug]);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    expect(zoneOf(game, giant)).toBe("hand");
  });
});

describe("Stinkweed Imp", () => {
  it("destroys a creature it deals combat damage to, however big", () => {
    const { game, a, b } = setUpScripted();
    const imp = spawn(game, "Stinkweed Imp");
    const angel = spawn(game, "Serra Angel", B);
    a.declareAttackersFn = () => [{ attacker: imp, defender: B }];
    b.declareBlockersFn = () => [{ blocker: angel, attacker: imp }];
    game.advanceUntil(toPostcombat);
    expect(zoneOf(game, imp)).toBe("graveyard");
    expect(zoneOf(game, angel)).toBe("graveyard");
  });

  it("does nothing to an indestructible creature, nor to a player", () => {
    const { game, a, b } = setUpScripted();
    const imp = spawn(game, "Stinkweed Imp");
    const angel = spawn(game, "Serra Angel", B);
    game.debugApplyEffect(B, { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" }, [
      obj(angel),
    ]);
    a.declareAttackersFn = () => [{ attacker: imp, defender: B }];
    b.declareBlockersFn = () => [{ blocker: angel, attacker: imp }];
    game.advanceUntil(toPostcombat);
    expect(zoneOf(game, angel)).toBe("battlefield");
    expect(game.state.objects[angel].damageMarked).toBe(1);
  });
});

describe("God-Eternal Rhonas", () => {
  it("doubles only the power of each other creature you control, which gain vigilance", () => {
    const game = setUp();
    lands(game, "Forest", 5);
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant");
    const theirs = spawn(game, "Grizzly Bears", B);
    const rhonas = cast(game, A, "God-Eternal Rhonas");
    game.advanceUntil(quiet);
    expect(zoneOf(game, rhonas)).toBe("battlefield");
    expect(pt(game, bears)).toEqual([4, 2]);
    expect(pt(game, giant)).toEqual([6, 3]);
    expect(game.characteristics(bears).keywords).toContain("vigilance");
    // Not Rhonas itself, nor an opponent's creature.
    expect(pt(game, rhonas)).toEqual([5, 5]);
    expect(game.characteristics(rhonas).keywords).not.toContain("vigilance");
    expect(pt(game, theirs)).toEqual([2, 2]);
    expect(game.characteristics(theirs).keywords).not.toContain("vigilance");
  });

  it("dying, may go third from the top of its owner's library", () => {
    const game = setUp();
    const rhonas = spawn(game, "God-Eternal Rhonas");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(rhonas)]);
    game.advanceUntil(settle);
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, rhonas)).toBe("library");
    expect(game.state.zones.perPlayer[A].library.indexOf(rhonas)).toBe(2);
  });
});

describe("Ilharg, the Raze-Boar", () => {
  it("attacking, puts a creature from hand onto the battlefield tapped and attacking, back to hand at end step", () => {
    const { game, a } = setUpScripted();
    const ilharg = spawn(game, "Ilharg, the Raze-Boar");
    const giant = game.debugSpawn("Hill Giant", A, "hand");
    a.chooseFromZoneFn = (_view, eligible) => eligible.filter((id) => id === giant);
    a.declareAttackersFn = () => [{ attacker: ilharg, defender: B }];
    game.advanceUntil(toPostcombat);
    expect(zoneOf(game, giant)).toBe("battlefield");
    expect(game.state.objects[giant].tapped).toBe(true);
    // Ilharg's 6 and the Giant's 3.
    expect(life(game, B)).toBe(11);
    game.advanceUntil(toNextUpkeep);
    expect(zoneOf(game, giant)).toBe("hand");
  });

  it("a creature that died before the end step stays in the graveyard (its ruling)", () => {
    const { game, a, b } = setUpScripted();
    const ilharg = spawn(game, "Ilharg, the Raze-Boar");
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    const giant = spawn(game, "Hill Giant", B);
    a.chooseFromZoneFn = (_view, eligible) => eligible.filter((id) => id === bears);
    a.declareAttackersFn = () => [{ attacker: ilharg, defender: B }];
    b.declareBlockersFn = () => [{ blocker: giant, attacker: bears }];
    game.advanceUntil(toPostcombat);
    expect(zoneOf(game, bears)).toBe("graveyard");
    game.advanceUntil(toNextUpkeep);
    expect(zoneOf(game, bears)).toBe("graveyard");
  });
});

describe("Buster Sword", () => {
  it("draws, then offers a free spell from hand with mana value up to the damage dealt", () => {
    const { game, a } = setUpScripted();
    const bears = spawn(game, "Grizzly Bears");
    const sword = spawn(game, "Buster Sword");
    game.state.objects[sword].attachedTo = bears;
    expect(pt(game, bears)).toEqual([5, 4]);
    const divination = game.debugSpawn("Divination", A, "hand");
    const wurm = game.debugSpawn("Craw Wurm", A, "hand");
    const handBefore = game.state.zones.perPlayer[A].hand.length;
    let offered: CastNowOffer | undefined;
    a.chooseCastNowFn = (_v, offer): Cast => {
      offered = offer;
      return { type: "cast-spell", player: A, card: divination, targets: [], via: "effect", free: true };
    };
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil(toPostcombat);
    expect(life(game, B)).toBe(15);
    expect(offered?.cards).toContain(divination);
    // Craw Wurm's mana value is 6, more than the 5 damage.
    expect(offered?.cards).not.toContain(wurm);
    expect(zoneOf(game, divination)).toBe("graveyard");
    // Drew one, cast Divination for free (drawing two): one more, plus two.
    expect(game.state.zones.perPlayer[A].hand.length).toBe(handBefore + 1 - 1 + 2);
  });
});

describe("Venser, Shaper Savant", () => {
  it("flashed in, returns a spell to its owner's hand, so it never resolves", () => {
    const game = setUp();
    lands(game, "Island", 4);
    lands(game, "Mountain", 1, B);
    game.dispatch({ type: "pass-priority", player: A });
    const bolt = cast(game, B, "Lightning Bolt", [player(A)]);
    game.dispatch({ type: "pass-priority", player: B });
    cast(game, A, "Venser, Shaper Savant");
    game.advanceUntil(settle);
    expect(game.state.awaiting?.kind).toBe("choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(bolt)] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, bolt)).toBe("hand");
    expect(game.state.objects[bolt].owner).toBe(B);
    expect(life(game, A)).toBe(20);
  });

  it("or a permanent", () => {
    const game = setUp();
    lands(game, "Island", 4);
    const land = spawn(game, "Mountain", B);
    cast(game, A, "Venser, Shaper Savant");
    game.advanceUntil(settle);
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(land)] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, land)).toBe("hand");
  });
});

describe("Flusterstorm", () => {
  it("storm copies it for each spell cast before it; with no {1} to pay, the spell is countered", () => {
    const game = setUp();
    lands(game, "Island", 1);
    lands(game, "Mountain", 1);
    lands(game, "Mountain", 1, B);
    cast(game, A, "Shock", [player(B)]);
    game.advanceUntil(quiet);
    game.dispatch({ type: "pass-priority", player: A });
    const bolt = cast(game, B, "Lightning Bolt", [player(A)]);
    game.dispatch({ type: "pass-priority", player: B });
    cast(game, A, "Flusterstorm", [obj(bolt)]);
    game.advanceUntil(settle);
    // Two copies (Shock, then the Bolt), each asked for a new target.
    for (let i = 0; i < 2; i += 1) {
      expect(game.state.awaiting?.kind).toBe("choose-targets");
      game.dispatch({ type: "choose-targets", player: A, targets: [obj(bolt)] });
      game.advanceUntil(settle);
    }
    game.advanceUntil(quiet);
    expect(game.eventsOfType("spell-copied")).toHaveLength(2);
    expect(zoneOf(game, bolt)).toBe("graveyard");
    expect(life(game, A)).toBe(20);
  });
});
