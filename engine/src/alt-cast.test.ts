import { describe, expect, it } from "vitest";

import { Game } from "./game.js";
import type { GameConfig } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { ObjectId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Mountain"),
];

const mkGame = (aCards: readonly string[], overrides: Partial<GameConfig> = {}): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    ...overrides,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false, ...overrides.rules },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad([]) },
    ],
  });

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const cardNamed = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} found`);
  return id;
};

const playN = (game: Game, name: string, n: number): void => {
  let played = 0;
  for (const id of [...game.handOf(A)]) {
    if (played >= n) break;
    if (game.state.objects[id].cardName === name) {
      game.dispatch({ type: "play-land", player: A, card: id });
      played += 1;
    }
  }
  if (played < n) throw new Error(`only ${played} ${name} available, needed ${n}`);
};

describe("Flashback — Faithless Looting", () => {
  it("casts from hand, then from the graveyard for its flashback cost, then exiles", () => {
    const game = mkGame(["Faithless Looting"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Mountain", 3);

    const fl = cardNamed(game, game.handOf(A), "Faithless Looting");
    game.dispatch({ type: "cast-spell", player: A, card: fl, targets: [] });
    game.advanceUntil(settled);
    expect(game.graveyardOf(A)).toContain(fl);

    // Now offered as a flashback cast from the graveyard.
    const flash = game
      .legalActions(A)
      .find((x) => x.kind === "cast-spell" && x.card === fl && x.via === "flashback");
    expect(flash).toBeDefined();

    game.dispatch({ type: "cast-spell", player: A, card: fl, targets: [], via: "flashback" });
    const castEvent = [...game.events].reverse().find((e) => e.type === "spell-cast");
    expect(castEvent).toMatchObject({ object: fl, via: "flashback" });

    game.advanceUntil(settled);
    expect(game.state.zones.shared.exile).toContain(fl);
    expect(game.graveyardOf(A)).not.toContain(fl);
  });

  it("is not castable via flashback at instant speed / on another player's turn", () => {
    const game = mkGame(["Faithless Looting"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Mountain", 4);

    const fl = cardNamed(game, game.handOf(A), "Faithless Looting");
    game.dispatch({ type: "cast-spell", player: A, card: fl, targets: [] });
    game.advanceUntil(settled);
    expect(game.graveyardOf(A)).toContain(fl);

    // Pass to Bob's turn.
    game.advanceUntil((s) => s.turn.activePlayer === B && s.turn.step === "precombat-main");
    expect(
      game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === fl),
    ).toBe(false);
    expect(
      game.canDispatch({ type: "cast-spell", player: A, card: fl, targets: [], via: "flashback" }),
    ).not.toBeNull();
  });

  it("does not offer flashback for a graveyard card without flashback", () => {
    const game = mkGame(["Lightning Bolt"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Mountain", 3);

    const bolt = cardNamed(game, game.handOf(A), "Lightning Bolt");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);
    expect(game.graveyardOf(A)).toContain(bolt);
    expect(
      game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === bolt),
    ).toBe(false);
  });
});

describe("Snapcaster Mage — a granted flashback", () => {
  const setup = (): { game: Game; bolt: import("./primitives.js").ObjectId } => {
    const game = mkGame(["Lightning Bolt", "Snapcaster Mage", "Island"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Island", 1);
    playN(game, "Mountain", 3);
    const bolt = cardNamed(game, game.handOf(A), "Lightning Bolt");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);
    const snap = cardNamed(game, game.handOf(A), "Snapcaster Mage");
    game.dispatch({ type: "cast-spell", player: A, card: snap, targets: [] });
    game.advanceUntil(settled);
    return { game, bolt };
  };

  it("lets the graveyard spell be cast from there until end of turn, then exiles it", () => {
    const { game, bolt } = setup();
    expect(game.state.objects[bolt].grantedFlashback).toEqual({
      cost: "{R}",
      untilEndOfTurn: true,
    });
    expect(game.eventsOfType("flashback-granted").some((e) => e.object === bolt)).toBe(true);

    const flash = game
      .legalActions(A)
      .find((x) => x.kind === "cast-spell" && x.card === bolt && x.via === "flashback");
    expect(flash).toBeDefined();

    const before = game.state.players[B].life;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
      via: "flashback",
    });
    game.advanceUntil(settled);
    expect(game.state.players[B].life).toBe(before - 3);
    expect(game.state.zones.shared.exile).toContain(bolt);
  });

  it("the grant expires at end of turn if unused", () => {
    const { game, bolt } = setup();
    game.advanceUntil((s) => s.turn.activePlayer === B && s.turn.step === "precombat-main");
    expect(game.state.objects[bolt].grantedFlashback ?? null).toBeNull();
    expect(game.eventsOfType("flashback-grant-expired").some((e) => e.object === bolt)).toBe(true);
    expect(game.graveyardOf(A)).toContain(bolt);
    expect(
      game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === bolt),
    ).toBe(false);
  });
});

describe("Suspend — Rift Bolt", () => {
  it("exiles with a time counter, then the engine casts it at the next upkeep", () => {
    const game = mkGame(["Rift Bolt"]);
    game.advanceUntil(atFirstMain);
    playN(game, "Mountain", 1);
    const rift = cardNamed(game, game.handOf(A), "Rift Bolt");

    const suspend = game.legalActions(A).find((x) => x.kind === "suspend" && x.card === rift);
    expect(suspend).toMatchObject({ kind: "suspend", n: 1, cost: "{R}" });

    game.dispatch({ type: "suspend", player: A, card: rift });
    expect(game.state.objects[rift].zone).toBe("exile");
    expect(game.state.objects[rift].suspended).toBe(true);
    expect(game.state.objects[rift].counters.time).toBe(1);
    expect(game.eventsOfType("card-suspended").some((e) => e.object === rift)).toBe(true);

    const totalLifeBefore = game.state.players[A].life + game.state.players[B].life;
    // Advance past Alice's next upkeep — the time counter comes off and Rift
    // Bolt is cast for free, then resolves before her main phase.
    game.advanceUntil((s) => s.turn.number >= 3 && s.turn.step === "precombat-main");

    expect(game.eventsOfType("time-counter-removed").some((e) => e.object === rift && e.remaining === 0)).toBe(true);
    expect(game.eventsOfType("spell-cast").some((e) => e.object === rift && e.via === "suspend")).toBe(true);
    expect(game.graveyardOf(A)).toContain(rift);
    // 3 damage went somewhere.
    expect(game.state.players[A].life + game.state.players[B].life).toBe(totalLifeBefore - 3);
  });
});
