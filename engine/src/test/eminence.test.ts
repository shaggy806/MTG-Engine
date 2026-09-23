/**
 * Eminence (rule 702.106) — an ability that functions while its card is in
 * the **command zone**, not only on the battlefield.
 *
 * Both of the engine's ability scans walk the battlefield, so the feature is
 * a per-ability `fromCommandZone` flag that adds its card to those scans from
 * the command zone too. Per *ability* rather than per card is the whole
 * point: Edgar Markov's first strike, haste and attack trigger do nothing
 * from there, and only the one clause that says so is marked.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aHand: readonly string[] = []) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...aHand, ...Array(40).fill("Swamp")], commander: "Edgar Markov" },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const inHand = (game: Game, name: string): ObjectId => {
  const id = game.handOf(A).find((i) => game.state.objects[i].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const vampires = (game: Game): number =>
  game.battlefield.filter(
    (id) =>
      game.state.objects[id].controller === A &&
      game.characteristics(id).subtypes.includes("Vampire"),
  ).length;
const edgarInCommand = (game: Game): boolean =>
  game.state.zones.shared.command.some(
    (id) => game.state.objects[id].cardName === "Edgar Markov",
  );

describe("Edgar Markov — Eminence", () => {
  it("makes a Vampire while Edgar is still in the command zone", () => {
    const game = mkGame(["Vampire Nighthawk"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Swamp", A, "battlefield");
    expect(edgarInCommand(game)).toBe(true);
    expect(vampires(game)).toBe(0);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Vampire Nighthawk"),
      targets: [],
    });
    game.advanceUntil(quiet);

    // The Nighthawk plus the token its cast made — from a card that never
    // touched the battlefield.
    expect(vampires(game)).toBe(2);
    expect(edgarInCommand(game)).toBe(true);
  });

  it("doesn't trigger off a non-Vampire spell", () => {
    const game = mkGame(["Grizzly Bears"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Forest", A, "battlefield");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Grizzly Bears"),
      targets: [],
    });
    game.advanceUntil(quiet);
    expect(vampires(game)).toBe(0);
  });

  it("doesn't trigger off casting Edgar himself — 'another' Vampire spell", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    for (const land of ["Mountain", "Mountain", "Plains", "Plains", "Swamp", "Swamp"]) {
      game.debugSpawn(land, A, "battlefield");
    }
    const edgar = game.state.zones.shared.command.find(
      (id) => game.state.objects[id].cardName === "Edgar Markov",
    );
    expect(edgar).toBeDefined();
    if (edgar === undefined) return;

    game.dispatch({ type: "cast-spell", player: A, card: edgar, targets: [] });
    game.advanceUntil(quiet);

    // Edgar is a Vampire spell, and the card on the stack is itself in the
    // trigger scan, so without `otherOnly` he would make a token off his own
    // cast. Only Edgar should be there.
    expect(vampires(game)).toBe(1);
  });

  describe("'if Edgar Markov is in the command zone or on the battlefield' (rule 603.4)", () => {
    /** The trigger from casting a Nighthawk, left on the stack unresolved. */
    const triggered = (): { game: Game; edgar: ObjectId } => {
      const game = mkGame(["Vampire Nighthawk"]);
      game.advanceUntil(toPrecombat);
      for (let i = 0; i < 3; i += 1) game.debugSpawn("Swamp", A, "battlefield");
      const edgar = game.state.zones.shared.command.find(
        (id) => game.state.objects[id].cardName === "Edgar Markov",
      );
      if (edgar === undefined) throw new Error("no Edgar in the command zone");
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: inHand(game, "Vampire Nighthawk"),
        targets: [],
      });
      expect(game.state.zones.shared.stack).toHaveLength(2);
      return { game, edgar };
    };
    // White-box, like `debugSpawn`: the real zone change with nothing behind
    // it, standing in for casting Edgar in response.
    const move = (game: Game, id: ObjectId, to: "hand" | "battlefield"): void => {
      (game as unknown as { moveObject(id: ObjectId, to: string): boolean }).moveObject(id, to);
    };
    const tokens = (game: Game): number =>
      game.battlefield.filter((id) => game.state.objects[id].isToken).length;

    it("makes nothing once Edgar has left for anywhere else", () => {
      const { game, edgar } = triggered();
      move(game, edgar, "hand");
      game.advanceUntil(quiet);
      expect(tokens(game)).toBe(0);
      expect(
        game.events.some(
          (e) => e.type === "spell-fizzled" && /intervening-if/.test(e.reason ?? ""),
        ),
      ).toBe(true);
    });

    it("makes nothing once Edgar is a new object, even on the battlefield (rule 400.7)", () => {
      const { game, edgar } = triggered();
      move(game, edgar, "battlefield");
      game.advanceUntil(quiet);
      expect(game.state.objects[edgar].zone).toBe("battlefield");
      expect(tokens(game)).toBe(0);
    });
  });

  it("leaves its other abilities inert in the command zone", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    // A Vampire that can attack, with Edgar still in the command zone. His
    // attack trigger must not fire for someone else's attack, and his own
    // can't fire at all from there.
    const nighthawk = game.debugSpawn("Vampire Nighthawk", A, "battlefield");
    game.state.objects[nighthawk].summoningSick = false;
    expect(edgarInCommand(game)).toBe(true);

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: nighthawk, defender: B }],
    });
    game.advanceUntil(quiet);

    // No +1/+1 counter: the attack trigger is `who: "self"` and Edgar isn't
    // on the battlefield to be the attacker.
    expect(game.state.objects[nighthawk].counters["+1/+1"] ?? 0).toBe(0);
  });
});

/**
 * The Ur-Dragon — the other half of Eminence (a *static* that functions from
 * the command zone) plus a **batched** attack trigger.
 *
 * Batched is its own trigger kind rather than a flag on `attacks`, because
 * the two differ in how often they fire: "whenever one or more Dragons
 * attack" fires once with a count, where `attacks` fires per attacker. 28 of
 * the 484 unimplemented top-500 commanders have a "whenever one or more …"
 * clause, so this is the first of a family.
 */
describe("The Ur-Dragon", () => {
  const mkUrGame = () => {
    const a = new ScriptedController(A);
    const b = new ScriptedController(B);
    // Decline the optional "you may put a permanent card" half, so the draw
    // count is the only thing moving the hand size.
    a.chooseFromZoneFn = () => [];
    return Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: a, [B]: b },
      decks: [
        { player: A, cards: Array(40).fill("Mountain"), commander: "The Ur-Dragon" },
        { player: B, cards: Array(40).fill("Forest") },
      ],
    });
  };

  it("fires once for the whole attack, drawing one card per Dragon", () => {
    const game = mkUrGame();
    game.advanceUntil(toPrecombat);
    const ur = game.debugSpawn("The Ur-Dragon", A, "battlefield");
    const dragon = game.debugSpawn("Demanding Dragon", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    for (const id of [ur, dragon, bear]) game.state.objects[id].summoningSick = false;
    const hand = game.handOf(A).length;

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: ur, defender: B },
        { attacker: dragon, defender: B },
        { attacker: bear, defender: B },
      ],
    });
    game.advanceUntil(quiet);

    // Two Dragons attacked, so two cards — once, not once per Dragon (which
    // would be four) and not counting the Bear (which would be three).
    expect(game.handOf(A).length).toBe(hand + 2);
  });

  it("doesn't fire when no Dragon attacked", () => {
    const game = mkUrGame();
    game.advanceUntil(toPrecombat);
    const ur = game.debugSpawn("The Ur-Dragon", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    for (const id of [ur, bear]) game.state.objects[id].summoningSick = false;
    const hand = game.handOf(A).length;

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: bear, defender: B }],
    });
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand);
  });

  it("discounts other Dragon spells from the command zone, but not itself", () => {
    const game = mkUrGame();
    game.advanceUntil(toPrecombat);
    expect(
      game.state.zones.shared.command.some(
        (id) => game.state.objects[id].cardName === "The Ur-Dragon",
      ),
    ).toBe(true);

    // Demanding Dragon is {5}{R} — six mana printed, five with the Eminence
    // discount. Asserted behaviourally, by what six-minus-one lands can pay
    // for, because the offer carries no cost field to read.
    const dragon = game.debugSpawn("Demanding Dragon", A, "hand");
    for (let i = 0; i < 5; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    const castable = () =>
      game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === dragon);
    expect(castable()).toBe(true);

    // The Ur-Dragon itself is {4}{W}{U}{B}{R}{G} and gets no discount — it
    // says "other Dragon spells" — so five Mountains can't begin to pay it.
    const ur = game.state.zones.shared.command.find(
      (id) => game.state.objects[id].cardName === "The Ur-Dragon",
    );
    expect(ur).toBeDefined();
    if (ur !== undefined) {
      expect(
        game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === ur),
      ).toBe(false);
    }
  });
});
