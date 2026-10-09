/**
 * "Exile that card instead of putting it into your graveyard as it
 * resolves. If you do, return it to your hand at the beginning of the next
 * end step" — Feather, the Redeemed (the `exile-spell-as-it-resolves`
 * effect, `GameObject.exileAsItResolves`). Only a resolving spell is
 * exiled; another replacement that would exile it too (flashback, Rest in
 * Peace) leaves its owner the choice of which applies first (rule 616.1).
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const objectRef = (object: ObjectId): TargetRef => ({ kind: "object", object });
const playerRef = (player: PlayerId): TargetRef => ({ kind: "player", player });

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const settle = (s: GameState): boolean => s.awaiting !== null || quiet(s);
/** A's end step has begun and its triggers have resolved. */
const afterEndStep = (s: GameState): boolean => s.turn.step === "end" && quiet(s);

const setUp = (feather = true) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const [land, n] of [["Mountain", 4], ["Forest", 4], ["Island", 4], ["Plains", 4]] as const) {
    for (let i = 0; i < n; i += 1) game.debugSpawn(land, A, "battlefield", { tapped: false });
  }
  const featherId = feather ? game.debugSpawn("Feather, the Redeemed", A, "battlefield") : null;
  const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
  return { game, featherId, bear };
};

const cast = (game: Game, name: string, targets: TargetRef[] = [], extra = {}, zone: "hand" | "graveyard" = "hand"): ObjectId => {
  const card = game.debugSpawn(name, A, zone);
  game.dispatch({ type: "cast-spell", player: A, card, targets, ...extra });
  return card;
};

describe("Feather, the Redeemed", () => {
  it("exiles a resolved spell that targeted your creature, and returns it at the end step", () => {
    const { game, bear } = setUp();
    const growth = cast(game, "Giant Growth", [objectRef(bear)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[growth].zone).toBe("exile");
    game.advanceUntil(afterEndStep);
    expect(game.state.objects[growth].zone).toBe("hand");
    expect(game.state.zones.perPlayer[A].hand).toContain(growth);
  });

  it("leaves a spell aimed elsewhere to the graveyard", () => {
    const { game } = setUp();
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const growth = cast(game, "Giant Growth", [objectRef(theirs)]);
    const shock = cast(game, "Shock", [playerRef(B)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[growth].zone).toBe("graveyard");
    expect(game.state.objects[shock].zone).toBe("graveyard");
  });

  it("doesn't exile a spell that's countered, or return it", () => {
    // The ruling: a spell that doesn't resolve isn't exiled.
    const { game, bear } = setUp();
    const growth = cast(game, "Giant Growth", [objectRef(bear)]);
    cast(game, "Counterspell", [objectRef(growth)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[growth].zone).toBe("graveyard");
    game.advanceUntil(afterEndStep);
    expect(game.state.objects[growth].zone).toBe("graveyard");
  });

  it("still exiles and returns the spell after Feather has left", () => {
    // The ruling: both take effect even if Feather leaves after it triggers.
    const { game, featherId, bear } = setUp();
    const growth = cast(game, "Giant Growth", [objectRef(bear)]);
    // Feather's trigger resolves first, then Unsummon takes Feather away
    // with Giant Growth still on the stack.
    game.advanceUntil((s) => s.zones.shared.stack.length === 1 && s.pendingTriggers.length === 0);
    cast(game, "Unsummon", [objectRef(featherId as ObjectId)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[featherId as ObjectId].zone).toBe("hand");
    expect(game.state.objects[growth].zone).toBe("exile");
    game.advanceUntil(afterEndStep);
    expect(game.state.objects[growth].zone).toBe("hand");
  });

  it("still returns the card when Feather leaves after the spell resolved", () => {
    // The delayed trigger is the return's, not Feather's to lose.
    const { game, featherId, bear } = setUp();
    const growth = cast(game, "Giant Growth", [objectRef(bear)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[growth].zone).toBe("exile");
    cast(game, "Unsummon", [objectRef(featherId as ObjectId)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[featherId as ObjectId].zone).toBe("hand");
    game.advanceUntil(afterEndStep);
    expect(game.state.objects[growth].zone).toBe("hand");
  });

  it("asks which replacement applies first beside flashback — Feather's first returns it", () => {
    const { game, bear } = setUp();
    const gravity = cast(game, "Defy Gravity", [objectRef(bear)], { via: "flashback" }, "graveyard");
    game.advanceUntil(settle);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-modes");
    if (awaiting?.kind !== "choose-modes") return;
    expect(awaiting.modes).toHaveLength(2);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    expect(game.state.objects[gravity].zone).toBe("exile");
    game.advanceUntil(afterEndStep);
    expect(game.state.objects[gravity].zone).toBe("hand");
  });

  it("…and flashback's first leaves it exiled", () => {
    const { game, bear } = setUp();
    const gravity = cast(game, "Defy Gravity", [objectRef(bear)], { via: "flashback" }, "graveyard");
    game.advanceUntil(settle);
    game.dispatch({ type: "choose-modes", player: A, modes: [1] });
    game.advanceUntil(quiet);
    expect(game.state.objects[gravity].zone).toBe("exile");
    game.advanceUntil(afterEndStep);
    expect(game.state.objects[gravity].zone).toBe("exile");
  });

  it("asks beside Rest in Peace too", () => {
    const { game, bear } = setUp();
    game.debugSpawn("Rest in Peace", B, "battlefield");
    const growth = cast(game, "Giant Growth", [objectRef(bear)]);
    game.advanceUntil(settle);
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(afterEndStep);
    expect(game.state.objects[growth].zone).toBe("hand");
  });

  it("asks beside an Adventure's exile: Feather's first returns the card, the Adventure's sends it on one", () => {
    // Rule 715.3d's "instead of putting it into its owner's graveyard … exiles
    // it" is a replacement too (rule 616.1).
    for (const featherFirst of [true, false]) {
      const { game, bear } = setUp();
      for (let i = 0; i < 2; i += 1) game.debugSpawn("Swamp", A, "battlefield", { tapped: false });
      // Swift End, Murderous Rider's Adventure, aimed at A's own Bear.
      const rider = cast(game, "Murderous Rider", [objectRef(bear)], { face: 1 });
      game.advanceUntil(settle);
      expect(game.state.awaiting?.kind).toBe("choose-modes");
      game.dispatch({ type: "choose-modes", player: A, modes: [featherFirst ? 0 : 1] });
      game.advanceUntil(quiet);
      expect(game.state.objects[bear].zone).toBe("graveyard");
      expect(game.state.objects[rider].zone).toBe("exile");
      expect(game.state.objects[rider].onAdventure === true).toBe(!featherFirst);
      game.advanceUntil(afterEndStep);
      expect(game.state.objects[rider].zone).toBe(featherFirst ? "hand" : "exile");
    }
  });

  it("leaves alone a spell its caster doesn't own", () => {
    // The ruling: it won't try to go to your graveyard, so it isn't exiled.
    const { game, bear } = setUp();
    const growth = cast(game, "Giant Growth", [objectRef(bear)]);
    // Stands in for a card of B's that A cast (the pool's ways to do that
    // bring their own exile, which would compete).
    Object.assign(game.state.objects[growth], { owner: B });
    game.advanceUntil(quiet);
    expect(game.state.objects[growth].zone).toBe("graveyard");
    expect(game.state.zones.perPlayer[B].graveyard).toContain(growth);
  });

  it("does nothing without Feather", () => {
    const { game, bear } = setUp(false);
    const growth = cast(game, "Giant Growth", [objectRef(bear)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[growth].zone).toBe("graveyard");
  });
});
