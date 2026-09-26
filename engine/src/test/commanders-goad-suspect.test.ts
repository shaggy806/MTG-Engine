/**
 * The commanders goad-extensions and suspect unblocked: Killian, Decisive
 * Mentor; Baeloth Barrityl, Entertainer — the static goad, and the `goaded`
 * filter clause read as a creature last existed when it dies; and Nelly
 * Borca, Impulsive Accuser.
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { matchesFilter } from "../filter.js";
import { Game } from "../game.js";
import { goadersOf } from "../goad.js";
import { validateCommanderDeck } from "../deck-validation.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { activePlayerOf } from "../state.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
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
const hand = (game: Game, player: PlayerId): number => game.handOf(player).length;
/** An Aura of `owner`'s on `host`. */
const enchant = (game: Game, owner: PlayerId, host: ObjectId): ObjectId => {
  const aura = spawn(game, "Arcane Flight", owner);
  game.state.objects[aura].attachedTo = host;
  return aura;
};
/** Advance to `turn`'s postcombat main phase, everything settled. */
const afterCombat = (game: Game, turn: number): void => {
  game.advanceUntil((s) => (s.turn.number === turn && s.turn.step === "postcombat-main" && quiet(s)) || s.result.over);
};
type AttackOffer = Extract<LegalAction, { kind: "declare-attackers" }>;
/** Advance to `player`'s declaration of attackers and read what's offered. */
const attackOffer = (game: Game, player: PlayerId): AttackOffer => {
  game.advanceUntil((s) => (s.awaiting?.kind === "attackers" && s.awaiting.player === player) || s.result.over);
  const offer = game.legalActions(player).find((o) => o.kind === "declare-attackers");
  if (offer?.kind !== "declare-attackers") throw new Error(`no attack offer for ${player}`);
  return offer;
};
const treasures = (game: Game, player: PlayerId): number =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === "Treasure Token" && game.state.objects[id].controller === player,
  ).length;
const FROG: EffectSpec = registry.get("Turn to Frog").effect!;

describe("Killian, Decisive Mentor", () => {
  it("an enchantment of yours entering taps and goads up to one target creature", () => {
    const { game, ctl } = setUp();
    spawn(game, "Killian, Decisive Mentor", A);
    const bears = spawn(game, "Grizzly Bears", B);
    ctl[A].chooseTargetsFn = () => [obj(bears)];
    game.debugSpawn("Glorious Anthem", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].tapped).toBe(true);
    expect(goaders(game, bears)).toEqual([A]);
  });

  it("may target nothing", () => {
    const { game, ctl } = setUp();
    spawn(game, "Killian, Decisive Mentor", A);
    const bears = spawn(game, "Grizzly Bears", B);
    ctl[A].chooseTargetsFn = () => [null];
    game.debugSpawn("Glorious Anthem", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].tapped).toBe(false);
    expect(goaders(game, bears)).toEqual([]);
  });

  it("doesn't see an opponent's enchantment enter", () => {
    const { game, ctl } = setUp();
    spawn(game, "Killian, Decisive Mentor", A);
    const bears = spawn(game, "Grizzly Bears", B);
    ctl[A].chooseTargetsFn = () => [obj(bears)];
    game.debugSpawn("Glorious Anthem", B, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].tapped).toBe(false);
    expect(goaders(game, bears)).toEqual([]);
  });

  it("one card however many creatures enchanted by your Auras attack", () => {
    const { game, ctl } = setUp();
    spawn(game, "Killian, Decisive Mentor", A);
    const first = spawn(game, "Grizzly Bears", A);
    const second = spawn(game, "Grizzly Bears", A);
    enchant(game, A, first);
    enchant(game, A, second);
    ctl[A].declareAttackersFn = () => [
      { attacker: first, defender: B },
      { attacker: second, defender: B },
    ];
    const before = hand(game, A);
    afterCombat(game, 1);
    expect(hand(game, A)).toBe(before + 1);
  });

  it("whoever controls them — but not for creatures enchanted by someone else's Aura", () => {
    const { game, ctl } = setUp();
    spawn(game, "Killian, Decisive Mentor", A);
    const theirs = spawn(game, "Grizzly Bears", B);
    enchant(game, A, theirs);
    ctl[B].declareAttackersFn = () => [{ attacker: theirs, defender: A }];
    game.advanceUntil((s) => (s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s)) || s.result.over);
    const before = hand(game, A);
    afterCombat(game, 2);
    expect(hand(game, A)).toBe(before + 1);

    // The same attack with Bob's own Aura on it draws nothing.
    const other = setUp();
    spawn(other.game, "Killian, Decisive Mentor", A);
    const bobs = spawn(other.game, "Grizzly Bears", B);
    enchant(other.game, B, bobs);
    other.ctl[B].declareAttackersFn = () => [{ attacker: bobs, defender: A }];
    other.game.advanceUntil(
      (s) => (s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s)) || s.result.over,
    );
    const unchanged = hand(other.game, A);
    afterCombat(other.game, 2);
    expect(hand(other.game, A)).toBe(unchanged);
  });
});

describe("Baeloth Barrityl, Entertainer", () => {
  it("commands alone, or beside a Background (Choose a Background)", () => {
    const alone = { commanders: ["Baeloth Barrityl, Entertainer"], cards: Array<string>(99).fill("Mountain") };
    expect(validateCommanderDeck(alone, registry).violations).toEqual([]);
    const paired = {
      commanders: ["Baeloth Barrityl, Entertainer", "Raised by Giants"],
      cards: Array<string>(98).fill("Mountain"),
    };
    expect(validateCommanderDeck(paired, registry).violations).toEqual([]);
  });
});

describe("Baeloth Barrityl, Entertainer: a static goad", () => {
  it("goads opponents' creatures with less power, read live", () => {
    const { game } = setUp();
    const baeloth = spawn(game, "Baeloth Barrityl, Entertainer", A); // 2/5
    const elves = spawn(game, "Llanowar Elves", B); // 1/1
    const bears = spawn(game, "Grizzly Bears", B); // 2/2
    const mine = spawn(game, "Llanowar Elves", A);
    expect(goaders(game, elves)).toEqual([A]);
    expect(goaders(game, bears)).toEqual([]);
    expect(goaders(game, mine)).toEqual([]);

    game.debugApplyEffect(
      A,
      { kind: "modify-pt", target: 0, power: 1, toughness: 0, duration: "end-of-turn" },
      [obj(baeloth)],
    );
    expect(goaders(game, bears)).toEqual([A]);
    // "Has the ability" (the ruling): a Baeloth that lost it goads nothing,
    // though at 2/1 it still has the greater power.
    game.debugApplyEffect(A, FROG, [obj(baeloth)]);
    expect(game.characteristics(baeloth).power).toBe(2);
    expect(goaders(game, elves)).toEqual([]);
  });

  it("stops when Baeloth leaves", () => {
    const { game } = setUp();
    const baeloth = spawn(game, "Baeloth Barrityl, Entertainer", A);
    const elves = spawn(game, "Llanowar Elves", B);
    expect(goaders(game, elves)).toEqual([A]);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(baeloth)]);
    game.advanceUntil(quiet);
    expect(goaders(game, elves)).toEqual([]);
  });

  it("isn't until anyone's next turn, and sends the creature at a player other than Baeloth's", () => {
    const { game } = setUp([A, B, C]);
    spawn(game, "Baeloth Barrityl, Entertainer", A);
    const elves = spawn(game, "Llanowar Elves", B);
    game.advanceUntil((s) => s.turn.number === 4 || s.result.over);
    expect(goaders(game, elves)).toEqual([A]);
    // Round to Bob's next turn: still goaded, still aimed away from Alice.
    expect(attackOffer(game, B).defendersFor[elves]).toEqual([C]);
  });
});

describe("Baeloth Barrityl, Entertainer: a Treasure for a goaded attacker or blocker that dies", () => {
  it("a goaded attacking creature that dies makes a Treasure", () => {
    const { game, ctl } = setUp();
    const baeloth = spawn(game, "Baeloth Barrityl, Entertainer", A);
    const elves = spawn(game, "Llanowar Elves", B);
    ctl[A].declareBlockersFn = () => [{ blocker: baeloth, attacker: elves }];
    game.advanceUntil((s) => (s.turn.number === 2 && s.turn.step === "postcombat-main" && quiet(s)) || s.result.over);
    expect(game.state.objects[elves].zone).toBe("graveyard");
    expect(treasures(game, A)).toBe(1);
  });

  it("a creature that wasn't goaded makes none", () => {
    const { game, ctl } = setUp();
    const baeloth = spawn(game, "Baeloth Barrityl, Entertainer", A);
    const bears = spawn(game, "Grizzly Bears", B);
    ctl[B].declareAttackersFn = () => [{ attacker: bears, defender: A }];
    ctl[A].declareBlockersFn = () => [{ blocker: baeloth, attacker: bears }];
    game.advanceUntil((s) => (s.turn.number === 2 && s.turn.step === "postcombat-main" && quiet(s)) || s.result.over);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(treasures(game, A)).toBe(0);
  });

  it("a goaded blocking creature that dies makes one too", () => {
    const { game, ctl } = setUp();
    spawn(game, "Baeloth Barrityl, Entertainer", A);
    const giant = spawn(game, "Hill Giant", A);
    const elves = spawn(game, "Llanowar Elves", B);
    ctl[A].declareAttackersFn = () => [{ attacker: giant, defender: B }];
    ctl[B].declareBlockersFn = () => [{ blocker: elves, attacker: giant }];
    game.advanceUntil((s) => (s.turn.step === "postcombat-main" && quiet(s)) || s.result.over);
    expect(game.state.objects[elves].zone).toBe("graveyard");
    expect(treasures(game, A)).toBe(1);
  });

  it("a goaded creature dying outside combat makes none", () => {
    const { game } = setUp();
    spawn(game, "Baeloth Barrityl, Entertainer", A);
    const elves = spawn(game, "Llanowar Elves", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(elves)]);
    game.advanceUntil(quiet);
    expect(treasures(game, A)).toBe(0);
  });

  it("one dying alongside Baeloth still counts, goaded by Baeloth as they left (rule 603.10a)", () => {
    const { game } = setUp();
    spawn(game, "Baeloth Barrityl, Entertainer", A);
    const elves = spawn(game, "Llanowar Elves", B);
    game.advanceUntil(
      (s) => (s.turn.number === 2 && s.turn.step === "declare-attackers" && quiet(s)) || s.result.over,
    );
    expect(game.state.objects[elves].attacking).toBe(A);
    game.debugApplyEffect(A, { kind: "destroy-all", filter: { type: "creature" } });
    game.advanceUntil(quiet);
    expect(matchesFilter(game.state, registry, elves, { goaded: true, attacking: true }, { you: A, lastKnown: true })).toBe(
      true,
    );
    expect(treasures(game, A)).toBe(1);
  });

  it("a creature bound by Kardur, Doomscourge's rule isn't goaded, and makes none", () => {
    const { game, ctl } = setUp();
    spawn(game, "Baeloth Barrityl, Entertainer", A);
    const wurm = spawn(game, "Craw Wurm", A);
    game.debugSpawn("Kardur, Doomscourge", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    const giant = spawn(game, "Hill Giant", B); // 3/3: more power than Baeloth
    expect(goaders(game, giant)).toEqual([]);
    ctl[A].declareBlockersFn = () => [{ blocker: wurm, attacker: giant }];
    expect(attackOffer(game, B).mustAttack).toContain(giant);
    game.advanceUntil((s) => (s.turn.number === 2 && s.turn.step === "postcombat-main" && quiet(s)) || s.result.over);
    expect(game.state.objects[giant].zone).toBe("graveyard");
    expect(treasures(game, A)).toBe(0);
  });
});

describe("Nelly Borca, Impulsive Accuser", () => {
  it("attacking suspects the target, then goads every suspected creature", () => {
    const { game, ctl } = setUp([A, B, C]);
    const nelly = spawn(game, "Nelly Borca, Impulsive Accuser", A);
    const bobs = spawn(game, "Grizzly Bears", B);
    const carols = spawn(game, "Llanowar Elves", C);
    const plain = spawn(game, "Hill Giant", C);
    game.debugApplyEffect(C, { kind: "suspect", target: 0 }, [obj(carols)]);
    ctl[A].chooseTargetsFn = () => [obj(bobs)];
    ctl[A].declareAttackersFn = () => [{ attacker: nelly, defender: B }];
    game.advanceUntil((s) => (s.turn.step === "declare-attackers" && quiet(s)) || s.result.over);

    expect(game.state.objects[bobs].suspectedAt).toBeDefined();
    expect(game.characteristics(bobs).keywords.has("menace")).toBe(true);
    expect(goaders(game, bobs)).toEqual([A]);
    expect(goaders(game, carols)).toEqual([A]);
    expect(goaders(game, plain)).toEqual([]);
    // Vigilance: Nelly didn't tap to attack.
    expect(game.state.objects[nelly].tapped).toBe(false);
  });

  it("you and the attacking player each draw when their creatures hit another opponent", () => {
    const { game, ctl } = setUp([A, B, C]);
    spawn(game, "Nelly Borca, Impulsive Accuser", A);
    const bears = spawn(game, "Grizzly Bears", B);
    const elves = spawn(game, "Llanowar Elves", B);
    ctl[B].declareAttackersFn = () => [
      { attacker: bears, defender: C },
      { attacker: elves, defender: C },
    ];
    game.advanceUntil((s) => (s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s)) || s.result.over);
    const [aBefore, bBefore, cBefore] = [hand(game, A), hand(game, B), hand(game, C)];
    afterCombat(game, 2);
    expect(game.state.players[C].life).toBe(17);
    // Once for the damage step, however many creatures connected.
    expect(hand(game, A)).toBe(aBefore + 1);
    expect(hand(game, B)).toBe(bBefore + 1);
    expect(hand(game, C)).toBe(cBefore);
  });

  it("not when they hit you", () => {
    const { game, ctl } = setUp([A, B, C]);
    spawn(game, "Nelly Borca, Impulsive Accuser", A);
    const bears = spawn(game, "Grizzly Bears", B);
    ctl[B].declareAttackersFn = () => [{ attacker: bears, defender: A }];
    game.advanceUntil((s) => (s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s)) || s.result.over);
    const [aBefore, bBefore] = [hand(game, A), hand(game, B)];
    afterCombat(game, 2);
    expect(game.state.players[A].life).toBe(18);
    expect(hand(game, A)).toBe(aBefore);
    expect(hand(game, B)).toBe(bBefore);
  });

  it("the controller of those creatures is who controlled them, though they're gone", () => {
    // Bob's trampling token connects with Carol past her deathtouch blocker
    // and dies doing it: a token that has ceased to exist by the time the
    // trigger resolves (rule 608.2h).
    const { game, ctl } = setUp([A, B, C]);
    spawn(game, "Nelly Borca, Impulsive Accuser", A);
    game.debugApplyEffect(B, { kind: "create-token", token: "Human Knight Token", count: 1 });
    const knight = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Human Knight Token",
    )!;
    const biter = spawn(game, "Ankle Biter", C);
    ctl[B].declareAttackersFn = () => [{ attacker: knight, defender: C }];
    ctl[C].declareBlockersFn = () => [{ blocker: biter, attacker: knight }];
    game.advanceUntil((s) => (s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s)) || s.result.over);
    const [aBefore, bBefore] = [hand(game, A), hand(game, B)];
    afterCombat(game, 2);
    expect(game.state.players[C].life).toBe(19);
    expect(game.state.objects[knight]).toBeUndefined();
    expect(hand(game, A)).toBe(aBefore + 1);
    expect(hand(game, B)).toBe(bBefore + 1);
  });
});
