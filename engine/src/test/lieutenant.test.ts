/**
 * Lieutenant (the "as long as you control your commander" clause), plus the
 * two primitives the cards needed: an untargeted `add-counter-all`, and
 * restricting a static grant to permanents that have a counter.
 *
 * Lieutenant itself needed no new feature — `CardFilter.isCommander` already
 * expressed it, which is what the phase plan predicted.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const makeGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Forest"), commander: "Atarka, World Render" },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });

/** Put A's commander onto the battlefield, switching the Lieutenant on. */
const withCommander = (game: Game) => {
  const id = game.debugSpawn("Atarka, World Render", A, "battlefield");
  game.state.objects[id].isCommander = true;
  return id;
};

const toCombat = (game: Game) =>
  game.advanceUntil(
    (s) =>
      (s.turn.step === "declare-attackers" && s.priority.holder !== null) ||
      s.awaiting !== null ||
      s.result.over,
  );

describe("Thunderfoot Baloth", () => {
  it("does nothing without your commander", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    const baloth = game.debugSpawn("Thunderfoot Baloth", A, "battlefield");
    const other = game.debugSpawn("Grizzly Bears", A, "battlefield");

    expect(game.characteristics(baloth).power).toBe(5);
    expect(game.characteristics(other).power).toBe(2);
    expect(game.characteristics(other).keywords.has("trample")).toBe(false);
  });

  it("pumps itself once and others once, not twice", () => {
    // The card reads "this creature gets +2/+2 **and other creatures** you
    // control get +2/+2" — the second clause must exclude the Baloth, or it
    // would end up a 9/9.
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    withCommander(game);
    const baloth = game.debugSpawn("Thunderfoot Baloth", A, "battlefield");
    const other = game.debugSpawn("Grizzly Bears", A, "battlefield");

    expect(game.characteristics(baloth).power).toBe(7);
    expect(game.characteristics(other).power).toBe(4);
    expect(game.characteristics(other).keywords.has("trample")).toBe(true);
  });

  it("leaves an opponent's creatures alone", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    withCommander(game);
    game.debugSpawn("Thunderfoot Baloth", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    expect(game.characteristics(theirs).power).toBe(2);
  });
});

describe("Loyal Subordinate", () => {
  it("drains each opponent only while you control your commander", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    game.debugSpawn("Loyal Subordinate", A, "battlefield");

    const before = game.state.players[B].life;
    toCombat(game);
    expect(game.state.players[B].life).toBe(before);
  });

  it("drains 3 at the beginning of combat with the commander out", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    withCommander(game);
    game.debugSpawn("Loyal Subordinate", A, "battlefield");

    const before = game.state.players[B].life;
    toCombat(game);
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 || s.awaiting !== null);
    expect(game.state.players[B].life).toBe(before - 3);
  });
});

describe("Loyal Guardian — add-counter-all", () => {
  it("counters every creature you control, and none of theirs", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    withCommander(game);
    game.debugSpawn("Loyal Guardian", A, "battlefield");
    const mine = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");

    toCombat(game);
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 || s.awaiting !== null);

    expect(game.state.objects[mine].counters["+1/+1"]).toBe(1);
    expect(game.state.objects[theirs].counters["+1/+1"]).toBeUndefined();
  });
});

describe("Rishkar — a static grant restricted to counters", () => {
  it("only gives the mana ability to creatures that have a counter", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    game.debugSpawn("Rishkar, Peema Renegade", A, "battlefield");
    const counted = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const bare = game.debugSpawn("Grizzly Bears", A, "battlefield");
    for (const id of [counted, bare]) game.state.objects[id].summoningSick = false;
    game.state.objects[counted].counters["+1/+1"] = 1;

    const manaAbilitiesOf = (id: string) =>
      game
        .legalActions(A)
        .filter((a) => a.kind === "activate-ability" && a.source === id).length;

    expect(manaAbilitiesOf(counted)).toBe(1);
    expect(manaAbilitiesOf(bare)).toBe(0);
  });
});
