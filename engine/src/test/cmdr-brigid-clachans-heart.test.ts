/**
 * Brigid, Clachan's Heart // Brigid, Doun's Mind — {2}{W} legendary 3/2.
 *
 *   Whenever this creature enters or transforms into Brigid, Clachan's
 *   Heart, create a 1/1 green and white Kithkin creature token.
 *   At the beginning of your first main phase, you may pay {G}. If you do,
 *   transform Brigid.
 *   —
 *   {T}: Add X {G} or X {W}, where X is the number of other creatures you
 *   control.
 *   At the beginning of your first main phase, you may pay {W}. If you do,
 *   transform Brigid.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { standaloneManaChoices } from "../mana-payment.js";
import { faceName } from "../state.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();
const BRIGID = "Brigid, Clachan's Heart";

const setUp = () => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const kithkin = (game: Game): number =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === "Kithkin Token").length;
/** Brigid, already turned to Brigid, Doun's Mind, with `others` other creatures. */
const backFace = (game: Game, others: number): ObjectId => {
  const brigid = game.debugSpawn(BRIGID, A, "battlefield", { summoningSick: false });
  game.debugApplyEffect(A, { kind: "transform", target: 0 }, [{ kind: "object", object: brigid }]);
  for (let i = 0; i < others; i += 1) game.debugSpawn("Grizzly Bears", A, "battlefield");
  return brigid;
};

describe("Brigid, Clachan's Heart", () => {
  it("entering, makes a 1/1 green and white Kithkin", () => {
    const { game } = setUp();
    game.debugSpawn(BRIGID, A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(kithkin(game)).toBe(1);
    const token = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Kithkin Token",
    )!;
    const c = game.characteristics(token);
    expect([c.power, c.toughness]).toEqual([1, 1]);
    expect([...c.colors].sort()).toEqual(["G", "W"]);
  });

  it("pays {G} to transform in your first main phase, and {W} to transform back — a Kithkin as it does", () => {
    const { game, a } = setUp();
    const brigid = game.debugSpawn(BRIGID, A, "battlefield", { summoningSick: false });
    game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Plains", A, "battlefield");
    a.chooseModesFn = () => [0];
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    expect(faceName(game.state.objects[brigid])).toBe("Brigid, Doun's Mind");
    expect(kithkin(game)).toBe(0);
    game.advanceUntil((s) => s.turn.number === 5 && s.turn.step === "precombat-main" && quiet(s));
    expect(faceName(game.state.objects[brigid])).toBe(BRIGID);
    expect(kithkin(game)).toBe(1);
  });

  it("declining to pay leaves her as she is", () => {
    const { game } = setUp();
    const brigid = game.debugSpawn(BRIGID, A, "battlefield", { summoningSick: false });
    game.debugSpawn("Forest", A, "battlefield");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    expect(faceName(game.state.objects[brigid])).toBe(BRIGID);
  });
});

describe("Brigid, Doun's Mind", () => {
  it("by hand, adds X {G} or X {W} for the other creatures you control, never a mix", () => {
    const { game } = setUp();
    const brigid = backFace(game, 2);
    const offers = game
      .legalActions(A)
      .flatMap((o) => (o.kind === "activate-ability" && o.source === brigid ? [o.manaColors ?? []] : []));
    expect(offers.map((m) => m.join(""))).toEqual(["GG", "WW"]);
  });

  it("makes all of one type even when asked for a mix", () => {
    const { game } = setUp();
    const brigid = backFace(game, 2);
    game.dispatch({ type: "activate-ability", player: A, source: brigid, abilityIndex: 0, manaColors: ["G", "W"] });
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["G", "G"]);
  });

  it("pays a cost of one colour, but not {G}{W} alone", () => {
    const { game } = setUp();
    backFace(game, 2);
    const finneas = game.debugSpawn("Finneas, Ace Archer", A, "hand");
    const castable = (): boolean =>
      game.legalActions(A).some((o) => o.kind === "cast-spell" && o.card === finneas);
    expect(castable()).toBe(false);
    game.debugSpawn("Forest", A, "battlefield");
    expect(castable()).toBe(true);
  });
});

describe("a oneOf mana ability with same", () => {
  it("offers all of one listed type for a fixed amount too", () => {
    const choices = standaloneManaChoices(
      {
        cost: { mana: null, tap: true },
        targets: [],
        effect: { kind: "add-mana", mana: { oneOf: ["G", "W"], same: true }, amount: 3 },
        resolve: null,
        text: "{T}: Add {G}{G}{G} or {W}{W}{W}.",
      },
      (mana) => mana.oneOf ?? [],
    );
    expect(choices?.map((m) => m.join(""))).toEqual(["GGG", "WWW"]);
  });
});
