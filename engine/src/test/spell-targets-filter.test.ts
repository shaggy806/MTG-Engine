/**
 * A `CardFilter`'s `targets` clause (`SpellTargetsFilter`): what a spell on
 * the stack targets, read by a cast trigger ("whenever you cast a spell that
 * targets a creature you control" — Season of Growth; "that targets only
 * Zada"), a damage trigger's source filter ("a spell that targets only a
 * single creature" — Imodane, the Pyrohammer) and a spell target spec
 * ("counter target spell that targets a permanent you control" — Rebuff the
 * Wicked, "…that targets you" — Dawn Charm).
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

const setUp = () => {
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
  for (const player of [A, B]) {
    for (const [land, n] of [["Mountain", 5], ["Plains", 4], ["Forest", 3], ["Island", 4]] as const) {
      for (let i = 0; i < n; i += 1) game.debugSpawn(land, player, "battlefield", { tapped: false });
    }
  }
  return game;
};

const cast = (game: Game, player: PlayerId, name: string, targets: TargetRef[] = [], extra = {}): ObjectId => {
  const card = game.debugSpawn(name, player, "hand");
  game.dispatch({ type: "cast-spell", player, card, targets, ...extra });
  return card;
};

const hand = (game: Game, player: PlayerId = A): number => game.state.zones.perPlayer[player].hand.length;

describe("a cast trigger on what the spell targets", () => {
  it("draws for a spell that targets a creature you control — Season of Growth", () => {
    const game = setUp();
    game.debugSpawn("Season of Growth", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const before = hand(game);
    cast(game, A, "Giant Growth", [objectRef(bear)]);
    game.advanceUntil(quiet);
    expect(hand(game)).toBe(before + 1);
  });

  it("scries once for each creature entering together, a token stack's included", () => {
    // The Season of Growth ruling: two creatures at once is two scry 1s.
    const game = setUp();
    game.debugSpawn("Season of Growth", A, "battlefield");
    cast(game, A, "Raise the Alarm");
    let scries = 0;
    for (let i = 0; i < 5; i += 1) {
      game.advanceUntil((s) => s.awaiting !== null || quiet(s));
      if (game.state.awaiting?.kind !== "scry") break;
      scries += 1;
      game.dispatch({ type: "scry", player: A, away: [] });
    }
    expect(scries).toBe(2);
  });

  it("doesn't for an opponent's creature, a player, or a spell with no targets", () => {
    const game = setUp();
    game.debugSpawn("Season of Growth", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const before = hand(game);
    cast(game, A, "Giant Growth", [objectRef(theirs)]);
    game.advanceUntil(quiet);
    cast(game, A, "Shock", [playerRef(B)]);
    game.advanceUntil(quiet);
    cast(game, A, "Divination");
    game.advanceUntil(quiet);
    // Divination's two only.
    expect(hand(game)).toBe(before + 2);
  });

  it("counts a spell that targets other things too, once", () => {
    // The Season of Growth ruling: at least one of the targets is enough,
    // and it doesn't trigger once per target.
    const game = setUp();
    game.debugSpawn("Season of Growth", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const before = hand(game);
    // 2 damage to the Bear, and target player (A) creates a Treasure.
    cast(game, A, "Prismari Command", [objectRef(bear), playerRef(A)], { modes: [0, 2] });
    game.advanceUntil(quiet);
    expect(hand(game)).toBe(before + 1);
  });

  it("fires only for a spell whose every target is the source — Zada", () => {
    const game = setUp();
    const zada = game.debugSpawn("Zada, Hedron Grinder", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    // Aimed at Zada and a player: not "only Zada", so nothing is copied.
    cast(game, A, "Prismari Command", [objectRef(zada), playerRef(A)], { modes: [0, 2] });
    game.advanceUntil(quiet);
    expect(game.eventsOfType("spell-copied")).toHaveLength(0);
    expect(game.state.objects[bear].damageMarked).toBe(0);
    // Aimed at Zada alone: copied for the Bear.
    cast(game, A, "Giant Growth", [objectRef(zada)]);
    game.advanceUntil(quiet);
    expect(game.eventsOfType("spell-copied")).toHaveLength(1);
  });
});

describe("a damage trigger on a spell that targets only a single creature — Imodane", () => {
  it("deals the damage that creature was dealt to each opponent", () => {
    const game = setUp();
    game.debugSpawn("Imodane, the Pyrohammer", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", B, "battlefield");
    cast(game, A, "Lightning Bolt", [objectRef(bear)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.state.players[B].life).toBe(17);
  });

  it("ignores a spell aimed at a player, or at a creature and a player", () => {
    const game = setUp();
    game.debugSpawn("Imodane, the Pyrohammer", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", B, "battlefield");
    cast(game, A, "Shock", [playerRef(B)]);
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(18);
    // 2 damage to the Bear, and a Treasure for A: two targets.
    cast(game, A, "Prismari Command", [objectRef(bear), playerRef(A)], { modes: [0, 2] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.state.players[B].life).toBe(18);
  });

  it("ignores a spell aimed at two different creatures", () => {
    // "Only a single creature": Magma Opus taps the Wurm and the Bear and
    // deals its 4 to the Wurm — every target a creature, but two of them.
    const game = setUp();
    game.debugSpawn("Imodane, the Pyrohammer", A, "battlefield");
    const wurm = game.debugSpawn("Craw Wurm", B, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", B, "battlefield");
    cast(game, A, "Magma Opus", [objectRef(wurm), objectRef(bear), objectRef(wurm)], { division: [4] });
    game.advanceUntil(quiet);
    expect(game.state.objects[wurm].zone).toBe("graveyard");
    expect(game.state.players[B].life).toBe(20);
  });

  it("ignores an opponent's spell", () => {
    const game = setUp();
    game.debugSpawn("Imodane, the Pyrohammer", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.dispatch({ type: "pass-priority", player: A });
    cast(game, B, "Shock", [objectRef(bear)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.state.players[A].life).toBe(20);
    expect(game.state.players[B].life).toBe(20);
  });
});

describe("a spell target spec on what the spell targets", () => {
  it("counters a spell that targets a permanent you control — Rebuff the Wicked", () => {
    const game = setUp();
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.dispatch({ type: "pass-priority", player: A });
    const shock = cast(game, B, "Shock", [objectRef(bear)]);
    game.dispatch({ type: "pass-priority", player: B });
    cast(game, A, "Rebuff the Wicked", [objectRef(shock)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[shock].zone).toBe("graveyard");
    expect(game.state.objects[bear].zone).toBe("battlefield");
    expect(game.state.objects[bear].damageMarked).toBe(0);
  });

  it("can't target a spell aimed only at a player or an opponent's permanent", () => {
    const game = setUp();
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.dispatch({ type: "pass-priority", player: A });
    const atA = cast(game, B, "Shock", [playerRef(A)]);
    const atTheirs = cast(game, B, "Shock", [objectRef(theirs)]);
    game.dispatch({ type: "pass-priority", player: B });
    for (const spell of [atA, atTheirs]) {
      expect(() => cast(game, A, "Rebuff the Wicked", [objectRef(spell)])).toThrow();
    }
  });

  it("doesn't resolve once the permanent the spell targeted has left", () => {
    // The ruling: the target spell no longer targets a permanent you control.
    const game = setUp();
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.dispatch({ type: "pass-priority", player: A });
    const shock = cast(game, B, "Shock", [objectRef(bear)]);
    game.dispatch({ type: "pass-priority", player: B });
    cast(game, A, "Rebuff the Wicked", [objectRef(shock)]);
    // In response, the Bear goes back to its owner's hand.
    cast(game, A, "Unsummon", [objectRef(bear)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[bear].zone).toBe("hand");
    // Rebuff fizzled, so Shock resolved — and fizzled itself, its target gone.
    expect(game.eventsOfType("spell-countered")).toHaveLength(0);
  });

  it("doesn't resolve once that permanent has left and come back, a new object", () => {
    // Rule 400.7: the Bear Cloudshift returns isn't the one Shock targets,
    // though it's on the battlefield under your control again.
    const game = setUp();
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.dispatch({ type: "pass-priority", player: A });
    const shock = cast(game, B, "Shock", [objectRef(bear)]);
    game.dispatch({ type: "pass-priority", player: B });
    cast(game, A, "Rebuff the Wicked", [objectRef(shock)]);
    cast(game, A, "Cloudshift", [objectRef(bear)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[bear].zone).toBe("battlefield");
    expect(game.eventsOfType("spell-countered")).toHaveLength(0);
    expect(game.state.objects[shock].zone).toBe("graveyard");
    expect(game.state.objects[bear].damageMarked).toBe(0);
  });

  it("counters a spell that targets you — Dawn Charm", () => {
    const game = setUp();
    game.dispatch({ type: "pass-priority", player: A });
    const bolt = cast(game, B, "Lightning Bolt", [playerRef(A)]);
    game.dispatch({ type: "pass-priority", player: B });
    cast(game, A, "Dawn Charm", [objectRef(bolt)], { modes: [2] });
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(20);
    expect(game.state.objects[bolt].zone).toBe("graveyard");
  });
});
