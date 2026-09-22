/**
 * Ardbert, Warrior of Darkness:
 *
 *   Whenever you cast a white spell, put a +1/+1 counter on each legendary
 *   creature you control. They gain vigilance until end of turn.
 *   Whenever you cast a black spell, put a +1/+1 counter on each legendary
 *   creature you control. They gain menace until end of turn.
 *
 * Driven through the real `Game` — a cast dispatched from hand, the trigger
 * going on the stack, and the whole stack resolving. What each test pins down:
 *
 * - "each legendary creature you control": every legend on your side gets the
 *   counter and the keyword, Ardbert himself included, and a *nonlegendary*
 *   creature of yours and a legend an **opponent** controls get neither;
 * - the two halves are one resolution over one set, so the creature that gets
 *   the counter is the creature that gains the keyword;
 * - white grants vigilance and **not** menace; black grants menace and not
 *   vigilance; a spell that is neither colour fires nothing at all;
 * - a white-black spell is both a white spell and a black spell, so it fires
 *   both triggers — two counters, and both keywords;
 * - "you cast": an opponent's white spell does nothing;
 * - rule 113.6 — Ardbert's own cast triggers neither ability, even though the
 *   card on the stack is itself a white spell *and* a black spell. This is
 *   what `otherOnly` is for, and the negative case the card most needs;
 * - the 2025-06-06 ruling: the ability resolves *before* the spell that
 *   caused it to trigger;
 * - the keyword is "until end of turn" and the counter is not.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const ARDBERT = "Ardbert, Warrior of Darkness";
/** A second legendary creature for Alice whose only trigger is on *attacks*,
 * so it is inert in a main phase. */
const OTHER_LEGEND = "Atarka, World Render";
/** A legendary creature for Bob with no abilities at all. */
const THEIR_LEGEND = "Rograkh, Son of Rohgahh";
const registry = createDefaultRegistry();

const makeGame = () => {
  const controllers: Record<PlayerId, ScriptedController> = {
    [A]: new ScriptedController(A),
    [B]: new ScriptedController(B),
  };
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Plains") })),
  });
  game.advanceUntil(
    (s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  return game;
};

const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });

/** Enough untapped mana for anything cast below. */
const mana = (game: Game, player: PlayerId = A): void => {
  for (let i = 0; i < 3; i += 1) {
    spawn(game, "Plains", player);
    spawn(game, "Swamp", player);
  }
  spawn(game, "Mountain", player);
};

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

const counters = (game: Game, id: ObjectId): number =>
  game.state.objects[id].counters["+1/+1"] ?? 0;

const has = (game: Game, id: ObjectId, keyword: "vigilance" | "menace"): boolean =>
  game.characteristics(id).keywords.has(keyword);

/** Everything cast has resolved and Alice is back on priority. */
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.priority.holder === A;

/**
 * Alice's board: Ardbert, a second legend, a nonlegendary creature and the
 * mana to cast with; Bob's: a legend of his own. Returns every id the
 * assertions care about.
 */
const board = (game: Game) => {
  const ardbert = spawn(game, ARDBERT);
  const legend = spawn(game, OTHER_LEGEND);
  const bears = spawn(game, "Grizzly Bears");
  const theirs = spawn(game, THEIR_LEGEND, B);
  mana(game);
  return { ardbert, legend, bears, theirs };
};

describe("Ardbert, Warrior of Darkness", () => {
  it("is a 2/2 white-black legendary Spirit Warrior with two cast triggers", () => {
    const def = registry.get(ARDBERT);
    expect(def.manaCost).toBe("{1}{W}{B}");
    expect(def.colors).toEqual(["W", "B"]);
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.types).toEqual(["creature"]);
    expect(def.subtypes).toEqual(["Spirit", "Warrior"]);
    expect([def.power, def.toughness]).toEqual([2, 2]);
    expect(identityString(colorIdentityOf(def))).toBe("WB");
    expect(def.triggered).toHaveLength(2);
    expect(def.triggered.map((t) => t.trigger)).toEqual([
      { on: "cast-spell", who: "you", otherOnly: true, filter: { colors: ["W"] } },
      { on: "cast-spell", who: "you", otherOnly: true, filter: { colors: ["B"] } },
    ]);
  });

  it("a white spell counters up every legend you control and gives them vigilance", () => {
    const game = makeGame();
    const { ardbert, legend, bears, theirs } = board(game);
    const spell = game.debugSpawn("Raise the Alarm", A, "hand"); // {1}{W} instant

    game.dispatch({ type: "cast-spell", player: A, card: spell, targets: [] });
    game.advanceUntil(settled);

    // Ardbert counts himself: 2/2 → 3/3. Atarka 6/4 → 7/5.
    expect(counters(game, ardbert)).toBe(1);
    expect(counters(game, legend)).toBe(1);
    expect([game.characteristics(ardbert).power, game.characteristics(ardbert).toughness])
      .toEqual([3, 3]);
    expect([game.characteristics(legend).power, game.characteristics(legend).toughness])
      .toEqual([7, 5]);

    // The same set gains vigilance — and only vigilance, not menace.
    expect(has(game, ardbert, "vigilance")).toBe(true);
    expect(has(game, legend, "vigilance")).toBe(true);
    expect(has(game, ardbert, "menace")).toBe(false);
    expect(has(game, legend, "menace")).toBe(false);

    // A nonlegendary creature of yours, and a legend that isn't yours, are
    // outside "each legendary creature you control" in both halves.
    expect(counters(game, bears)).toBe(0);
    expect(has(game, bears, "vigilance")).toBe(false);
    expect(counters(game, theirs)).toBe(0);
    expect(has(game, theirs, "vigilance")).toBe(false);
  });

  it("a black spell gives menace instead, and the vigilance trigger stays quiet", () => {
    const game = makeGame();
    const { ardbert, legend, bears, theirs } = board(game);
    const spell = game.debugSpawn("Dark Ritual", A, "hand"); // {B} instant

    game.dispatch({ type: "cast-spell", player: A, card: spell, targets: [] });
    game.advanceUntil(settled);

    expect(counters(game, ardbert)).toBe(1);
    expect(counters(game, legend)).toBe(1);
    expect(has(game, ardbert, "menace")).toBe(true);
    expect(has(game, legend, "menace")).toBe(true);
    expect(has(game, ardbert, "vigilance")).toBe(false);
    expect(has(game, legend, "vigilance")).toBe(false);

    expect(counters(game, bears)).toBe(0);
    expect(counters(game, theirs)).toBe(0);
  });

  it("does nothing at all for a spell that is neither white nor black", () => {
    const game = makeGame();
    const { ardbert, legend } = board(game);
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand"); // {R} instant

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);

    expect(game.state.players[B].life).toBe(17); // the Bolt itself resolved
    expect(counters(game, ardbert)).toBe(0);
    expect(counters(game, legend)).toBe(0);
    expect(has(game, ardbert, "vigilance")).toBe(false);
    expect(has(game, ardbert, "menace")).toBe(false);
  });

  it("fires both triggers for a white-black spell", () => {
    const game = makeGame();
    const { ardbert, legend } = board(game);
    const fodder = spawn(game, "Sol Ring", B);
    const spell = game.debugSpawn("Anguished Unmaking", A, "hand"); // {1}{W}{B} instant

    game.dispatch({ type: "cast-spell", player: A, card: spell, targets: [obj(fodder)] });
    game.advanceUntil(settled);

    // One trigger per ability, both resolving over the same board.
    expect(counters(game, ardbert)).toBe(2);
    expect(counters(game, legend)).toBe(2);
    expect(has(game, ardbert, "vigilance")).toBe(true);
    expect(has(game, ardbert, "menace")).toBe(true);
    expect(has(game, legend, "vigilance")).toBe(true);
    expect(has(game, legend, "menace")).toBe(true);
    expect(game.state.objects[fodder].zone).toBe("exile"); // the spell resolved too
  });

  it("is not triggered by an opponent's white spell", () => {
    const game = makeGame();
    const { ardbert, legend } = board(game);
    const spell = game.debugSpawn("Raise the Alarm", B, "hand");
    mana(game, B);

    game.advanceUntil(
      (s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B,
    );
    game.dispatch({ type: "cast-spell", player: B, card: spell, targets: [] });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);

    expect(counters(game, ardbert)).toBe(0);
    expect(counters(game, legend)).toBe(0);
    expect(has(game, ardbert, "vigilance")).toBe(false);
  });

  it("does not trigger off its own cast, though it is both a white and a black spell", () => {
    const game = makeGame();
    // Deliberately no Ardbert on the battlefield: the one being cast is the
    // only copy, and rule 113.6 says its abilities don't function on the stack.
    const legend = spawn(game, OTHER_LEGEND);
    const bears = spawn(game, "Grizzly Bears");
    mana(game);
    const ardbert = game.debugSpawn(ARDBERT, A, "hand");

    game.dispatch({ type: "cast-spell", player: A, card: ardbert, targets: [] });
    game.advanceUntil(settled);

    // He did arrive — this is a cast that resolved, not one that was refused.
    expect(game.state.objects[ardbert].zone).toBe("battlefield");
    // …and neither of his abilities fired, so nothing anywhere grew.
    expect(counters(game, ardbert)).toBe(0);
    expect(counters(game, legend)).toBe(0);
    expect(counters(game, bears)).toBe(0);
    expect(has(game, legend, "vigilance")).toBe(false);
    expect(has(game, legend, "menace")).toBe(false);
    expect(
      game.state.eventLog.some((e) => e.type === "ability-resolved" && e.source === ardbert),
    ).toBe(false);
  });

  it("resolves before the spell that caused it to trigger (2025-06-06 ruling)", () => {
    const game = makeGame();
    const { ardbert } = board(game);
    const spell = game.debugSpawn("Raise the Alarm", A, "hand");

    game.dispatch({ type: "cast-spell", player: A, card: spell, targets: [] });
    // Both the spell and the trigger it caused are on the stack, trigger on top.
    game.advanceUntil((s) => s.zones.shared.stack.length === 2 && s.priority.holder === A);
    game.advanceUntil(settled);

    const log = game.state.eventLog;
    const trigger = log.findIndex((e) => e.type === "ability-resolved" && e.source === ardbert);
    const resolved = log.findIndex((e) => e.type === "spell-resolved" && e.object === spell);
    expect(trigger).toBeGreaterThanOrEqual(0);
    expect(resolved).toBeGreaterThanOrEqual(0);
    expect(trigger).toBeLessThan(resolved);
  });

  it("keeps the counter past end of turn and loses the keyword with it", () => {
    const game = makeGame();
    const { ardbert, legend } = board(game);
    const spell = game.debugSpawn("Raise the Alarm", A, "hand");

    game.dispatch({ type: "cast-spell", player: A, card: spell, targets: [] });
    game.advanceUntil(settled);
    expect(has(game, ardbert, "vigilance")).toBe(true);

    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");

    expect(counters(game, ardbert)).toBe(1);
    expect(counters(game, legend)).toBe(1);
    expect(has(game, ardbert, "vigilance")).toBe(false);
    expect(has(game, legend, "vigilance")).toBe(false);
  });
});
