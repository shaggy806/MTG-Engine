/**
 * TDC stand-ins around damage and untapping: Chandra's Ignition (a target
 * deals the damage), Arachnogenesis (combat damage prevented by source),
 * Junk Winder ("doesn't untap during its controller's next untap step"),
 * and stun counters (rule 122.1d) — Baloth Prime and Pugnacious
 * Hammerskull.
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [A, B].map((p) => ({ player: p, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  return game;
};
const ready = (game: Game, name: string, who: PlayerId = A): ObjectId => {
  const id = game.debugSpawn(name, who, "battlefield");
  game.state.objects[id].summoningSick = false;
  return id;
};
const lands = (game: Game, name: string, n: number, who: PlayerId = A) => {
  for (let i = 0; i < n; i += 1) game.state.objects[game.debugSpawn(name, who, "battlefield")].tapped = false;
};
const inHand = (game: Game, name: string, who: PlayerId = A): ObjectId => game.debugSpawn(name, who, "hand");
const offersOf = (game: Game, source: ObjectId) =>
  game.legalActions(A).filter(
    (o): o is Extract<LegalAction, { kind: "activate-ability" }> => o.kind === "activate-ability" && o.source === source,
  );
/** Advance to `player`'s turn number `turn`, main phase, with priority. */
const toMain = (game: Game, turn: number, player: PlayerId = A) =>
  game.advanceUntil((s) => s.turn.number === turn && s.priority.holder === player && s.turn.step === "precombat-main");

describe("Chandra's Ignition", () => {
  it("has the targeted creature deal its power to each other creature and each opponent — its damage, deathtouch and lifelink", () => {
    const game = setUp();
    const nighthawk = ready(game, "Vampire Nighthawk");
    const bears = ready(game, "Grizzly Bears");
    const angel = ready(game, "Serra Angel", B);
    const wurm = ready(game, "Craw Wurm", B);
    lands(game, "Mountain", 5);
    const ignition = inHand(game, "Chandra's Ignition");
    const life = game.state.players[A].life;
    game.dispatch({ type: "cast-spell", player: A, card: ignition, targets: [obj(nighthawk)] });
    game.advanceUntil(quiet);
    // 2 each, and deathtouch: every other creature dies, yours too.
    for (const id of [bears, angel, wurm]) expect(game.state.objects[id].zone).toBe("graveyard");
    expect(game.state.objects[nighthawk].zone).toBe("battlefield");
    expect(game.state.objects[nighthawk].damageMarked).toBe(0);
    expect(game.state.players[B].life).toBe(18);
    // Lifelink: it dealt 2 to three creatures and a player.
    expect(game.state.players[A].life).toBe(life + 8);
  });

  it("deals it all as one event: a lifelink creature's controller gains life once (rule 702.15e)", () => {
    const game = setUp();
    const nighthawk = ready(game, "Vampire Nighthawk");
    ready(game, "Serra Angel", B);
    lands(game, "Mountain", 5);
    const ignition = inHand(game, "Chandra's Ignition");
    const since = game.state.eventSeq;
    game.dispatch({ type: "cast-spell", player: A, card: ignition, targets: [obj(nighthawk)] });
    game.advanceUntil(quiet);
    const gains = game.state.eventLog.filter(
      (e) => e.seq > since && e.type === "life-changed" && e.player === A && e.delta > 0,
    );
    expect(gains.map((e) => (e.type === "life-changed" ? e.delta : 0))).toEqual([4]);
  });

  it("does nothing once its target is gone", () => {
    const game = setUp();
    const bears = ready(game, "Grizzly Bears");
    ready(game, "Serra Angel", B);
    lands(game, "Mountain", 5);
    const ignition = inHand(game, "Chandra's Ignition");
    game.dispatch({ type: "cast-spell", player: A, card: ignition, targets: [obj(bears)] });
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(bears)]);
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(20);
  });
});

describe("Arachnogenesis", () => {
  it("makes a Spider per creature attacking you and prevents the combat damage of non-Spiders only", () => {
    const game = setUp();
    const bears = ready(game, "Grizzly Bears", B);
    const giant = ready(game, "Hill Giant", B);
    lands(game, "Forest", 3);
    const spell = inHand(game, "Arachnogenesis");
    game.advanceUntil((s) => s.turn.number === 2 && s.awaiting?.kind === "attackers");
    game.dispatch({
      type: "declare-attackers",
      player: B,
      attackers: [
        { attacker: bears, defender: A },
        { attacker: giant, defender: A },
      ],
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "declare-attackers");
    game.dispatch({ type: "cast-spell", player: A, card: spell, targets: [] });
    game.advanceUntil((s) => s.awaiting?.kind === "blockers");
    const spiders = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "1/2 Green Spider Token (Reach)",
    );
    const count = spiders.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(count).toBe(2);
    const offer = game.legalActions(A).find((o) => o.kind === "declare-blockers");
    const blocker = offer?.kind === "declare-blockers" ? offer.blockers?.[0] : undefined;
    const spider = typeof blocker === "string" ? blocker : spiders[0];
    game.dispatch({ type: "declare-blockers", player: A, blocks: [{ blocker: spider, attacker: bears }] });
    game.advanceUntil((s) => s.turn.step === "postcombat-main" || s.turn.step === "end");
    expect(game.state.players[A].life).toBe(20);
    // The Spider's own damage wasn't prevented; the Bears' to it was.
    expect(game.state.objects[bears].damageMarked).toBe(1);
    expect(game.state.objects[spider]?.zone === "battlefield" ? game.state.objects[spider].damageMarked : 0).toBe(0);
  });
});

describe("Junk Winder", () => {
  it("taps an opponent's nonland permanent as a token enters, and it skips its controller's next untap step", () => {
    const game = setUp();
    ready(game, "Junk Winder");
    const bears = ready(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 1 });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || quiet(s));
    if (game.state.awaiting?.kind === "choose-targets") {
      game.dispatch({ type: "choose-targets", player: A, targets: [obj(bears)] });
    }
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].tapped).toBe(true);
    toMain(game, 2, B);
    expect(game.state.objects[bears].tapped).toBe(true);
    toMain(game, 4, B);
    expect(game.state.objects[bears].tapped).toBe(false);
  });

  it("triggers once per token in a stack that enters together", () => {
    const game = setUp();
    ready(game, "Junk Winder");
    const theirs = [ready(game, "Grizzly Bears", B), ready(game, "Hill Giant", B), ready(game, "Serra Angel", B)];
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 3 });
    let asked = 0;
    for (let i = 0; i < 5; i += 1) {
      game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || quiet(s));
      if (game.state.awaiting?.kind !== "choose-targets") break;
      game.dispatch({ type: "choose-targets", player: A, targets: [obj(theirs[asked])] });
      asked += 1;
    }
    game.advanceUntil(quiet);
    expect(asked).toBe(3);
    for (const id of theirs) expect(game.state.objects[id].tapped).toBe(true);
  });

  it("costs {1} less for each token you control", () => {
    const game = setUp();
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 3 });
    game.advanceUntil(quiet);
    lands(game, "Island", 4);
    const winder = inHand(game, "Junk Winder");
    game.dispatch({ type: "cast-spell", player: A, card: winder, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[winder].zone).toBe("battlefield");
  });
});

describe("Stun counters", () => {
  it("Baloth Prime enters tapped with six; each would-be untap removes one instead", () => {
    const game = setUp();
    const baloth = game.debugSpawn("Baloth Prime", A, "battlefield");
    expect(game.state.objects[baloth].tapped).toBe(true);
    expect(game.state.objects[baloth].counters.stun).toBe(6);
    toMain(game, 3);
    expect(game.state.objects[baloth].tapped).toBe(true);
    expect(game.state.objects[baloth].counters.stun).toBe(5);
    // Sacrificing a land: a tapped Beast, and "untap this creature" takes
    // another counter off instead.
    lands(game, "Forest", 5);
    const life = game.state.players[A].life;
    const offer = offersOf(game, baloth).find((o) => o.text.includes("2 life"))!;
    const land = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Forest" && game.state.objects[id].controller === A,
    )!;
    game.dispatch({ type: "activate-ability", player: A, source: baloth, abilityIndex: offer.abilityIndex, targets: [], sacrifice: land });
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(life + 2);
    expect(game.state.objects[baloth].counters.stun).toBe(4);
    expect(game.state.objects[baloth].tapped).toBe(true);
    const beasts = game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === "Beast Token");
    expect(beasts).toHaveLength(1);
    expect(game.state.objects[beasts[0]].tapped).toBe(true);
  });

  it("Baloth Prime sacrificed together with lands still sees each of them go (its ruling)", () => {
    const game = setUp();
    game.debugSpawn("Baloth Prime", A, "battlefield");
    lands(game, "Forest", 2);
    game.debugApplyEffect(A, { kind: "sacrifice-all", who: "you", filter: { typesAnyOf: ["land", "creature"] } });
    game.advanceUntil(quiet);
    const beasts = game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === "Beast Token");
    expect(beasts.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(2);
  });

  it("an untapped permanent keeps its stun counter when told to untap", () => {
    const game = setUp();
    const bears = ready(game, "Grizzly Bears");
    game.state.objects[bears].counters.stun = 1;
    game.debugApplyEffect(A, { kind: "untap", target: 0 }, [obj(bears)]);
    expect(game.state.objects[bears].counters.stun).toBe(1);
    game.state.objects[bears].tapped = true;
    game.debugApplyEffect(A, { kind: "untap", target: 0 }, [obj(bears)]);
    expect(game.state.objects[bears].counters.stun).toBeUndefined();
    expect(game.state.objects[bears].tapped).toBe(true);
    game.debugApplyEffect(A, { kind: "untap", target: 0 }, [obj(bears)]);
    expect(game.state.objects[bears].tapped).toBe(false);
  });

  it("Pugnacious Hammerskull gets one as it attacks without another Dinosaur", () => {
    const game = setUp();
    const skull = ready(game, "Pugnacious Hammerskull");
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: skull, defender: B }] });
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(game.state.objects[skull].counters.stun).toBe(1);
    // It stays tapped through the next untap step, the counter spent.
    toMain(game, 3);
    expect(game.state.objects[skull].tapped).toBe(true);
    expect(game.state.objects[skull].counters.stun).toBeUndefined();
  });

  it("…and a Dinosaur arriving before the ability resolves doesn't stop it (its ruling)", () => {
    const game = setUp();
    const skull = ready(game, "Pugnacious Hammerskull");
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: skull, defender: B }] });
    game.advanceUntil((s) => s.zones.shared.stack.length > 0 || s.pendingTriggers.length > 0);
    ready(game, "Ancient Brontodon");
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(game.state.objects[skull].counters.stun).toBe(1);
  });

  it("…and none with another Dinosaur", () => {
    const game = setUp();
    const skull = ready(game, "Pugnacious Hammerskull");
    ready(game, "Ancient Brontodon");
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: skull, defender: B }] });
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(game.state.objects[skull].counters.stun).toBeUndefined();
  });
});
