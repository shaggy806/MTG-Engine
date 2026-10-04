/**
 * Cascade's and suspend's free casts are whole casts (rules 702.85a,
 * 702.62a; 601.2b–c): offered as a `cast-now`, so a modal spell is cast with
 * its modes, kicker is offered (and paid), targets are chosen, and the
 * caster may decline. Before, they were cast with only `def.targets` filled:
 * a Command cascaded into resolved with no modes, doing nothing.
 */
import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const settled = (s: GameState): boolean => s.zones.shared.stack.length === 0 && s.awaiting === null;

/** Alice casts Bloodbraid Elf with `hit` on top of her library (under her
 * opening hand and first draw), and stops at the free-cast offer. */
const cascadeInto = (hit: string, extraLands: readonly string[] = []): { game: Game; card: ObjectId } => {
  const hand = ["Bloodbraid Elf", ...Array(6).fill("Mountain")];
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false },
    decks: [
      { player: A, cards: [...hand, "Mountain", hit, ...Array(40).fill("Mountain")] },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main");
  for (const land of ["Forest", "Mountain", "Mountain", "Mountain", ...extraLands]) game.debugSpawn(land, A, "battlefield");
  const elf = game.handOf(A).find((id) => game.state.objects[id].cardName === "Bloodbraid Elf")!;
  game.dispatch({ type: "cast-spell", player: A, card: elf, targets: [] });
  game.advanceUntil((s) => s.awaiting?.kind === "cast-now" || settled(s));
  const card = Object.values(game.state.objects).find((o) => o.cardName === hit)!.id;
  return { game, card };
};

describe("a cascaded modal spell", () => {
  it("is offered with its modes, and cast with the two chosen", () => {
    const { game, card } = cascadeInto("Kolaghan's Command");
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "cast-now") throw new Error("no offer");
    const offers = awaiting.offers.filter((o) => o.card === card);
    expect(offers.length).toBeGreaterThan(0);
    // "Choose two": every offer carries its modal choice, two at a time.
    for (const offer of offers) expect(offer.castModal?.minModes).toBe(2);
    // "Target player discards a card" and "2 damage to any target".
    game.dispatch({
      type: "cast-now",
      player: A,
      cast: {
        type: "cast-spell",
        player: A,
        card,
        modes: [1, 3],
        targets: [{ kind: "player", player: B }, { kind: "player", player: B }],
        via: "effect",
        free: true,
      },
    });
    game.advanceUntil(settled);
    expect(game.state.players[B].life).toBe(18);
    expect(game.state.objects[card].zone).toBe("graveyard");
  });
});

describe("a cascaded kicker spell", () => {
  it("is offered kicked as well, the kicker paid", () => {
    const { game, card } = cascadeInto("Orim's Chant", ["Plains"]);
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "cast-now") throw new Error("no offer");
    const kicked = awaiting.offers.filter((o) => o.card === card).map((o) => o.kicked === true);
    expect(kicked).toEqual(expect.arrayContaining([false, true]));
  });
});

describe("a suspended card coming off suspend", () => {
  const offAtUpkeep = (): { game: Game; bolt: ObjectId } => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { maxLandsPerTurn: 99, skipFirstDraw: false },
      decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Mountain") })),
    });
    const bolt = game.debugSpawn("Rift Bolt", A, "exile");
    game.state.objects[bolt].suspended = true;
    game.state.objects[bolt].counters = { time: 1 };
    game.advanceUntil((s) => s.awaiting?.kind === "cast-now" || s.turn.step === "precombat-main");
    return { game, bolt };
  };

  it("may be declined: it stays exiled, no longer suspended", () => {
    const { game, bolt } = offAtUpkeep();
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "cast-now") throw new Error("no offer");
    expect(awaiting.freeCastOf).toBe("suspend");
    game.dispatch({ type: "cast-now", player: A, cast: null });
    game.advanceUntil(settled);
    expect(game.state.objects[bolt].zone).toBe("exile");
    expect(game.state.objects[bolt].suspended).toBe(false);
    expect(game.state.players[B].life).toBe(20);
  });

  it("cast, it's cast via suspend at the target chosen", () => {
    const { game, bolt } = offAtUpkeep();
    game.dispatch({
      type: "cast-now",
      player: A,
      cast: { type: "cast-spell", player: A, card: bolt, targets: [{ kind: "player", player: B }], via: "effect", free: true },
    });
    expect(game.eventsOfType("spell-cast").find((e) => e.object === bolt)?.via).toBe("suspend");
    game.advanceUntil(settled);
    expect(game.state.players[B].life).toBe(17);
  });
});
