/**
 * Shiko and Narset, Unified — {1}{U}{R}{W} 4/4 legendary Human Spirit Dragon:
 * flying, vigilance, and Flurry: "Whenever you cast your second spell each
 * turn, copy that spell if it targets a permanent or player, and you may
 * choose new targets for the copy. If you don't copy a spell this way, draw a
 * card."
 *
 * Also pins what the card leans on: a copy keeps the spell's modes, a copy of
 * an Aura spell becomes a token, the copy is made from the spell as it last
 * was on the stack, and "choose new targets" (Twincast too) is a real choice.
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
/** Stop at the copy's "choose new targets", or once everything has resolved. */
const settle = (s: GameState): boolean => s.awaiting?.kind === "choose-targets" || quiet(s);

const setUp = (shiko = true) => {
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
  for (const [land, n] of [["Mountain", 6], ["Island", 6], ["Plains", 3]] as const) {
    for (let i = 0; i < n; i += 1) {
      const id = game.debugSpawn(land, A, "battlefield");
      game.state.objects[id].tapped = false;
    }
  }
  const shikoId = shiko ? game.debugSpawn("Shiko and Narset, Unified", A, "battlefield") : null;
  return { game, shikoId };
};

const cast = (
  game: Game,
  name: string,
  targets: TargetRef[] = [],
  extra: Record<string, unknown> = {},
): ObjectId => {
  const card = game.debugSpawn(name, A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card, targets, ...extra });
  return card;
};

const handSize = (game: Game): number => game.state.zones.perPlayer[A].hand.length;
const bears = (game: Game, n: number): ObjectId[] =>
  Array.from({ length: n }, () => game.debugSpawn("Grizzly Bears", B, "battlefield"));

/** The first spell of the turn: Lightning Bolt to B's face, resolved. */
const firstSpell = (game: Game): void => {
  cast(game, "Lightning Bolt", [playerRef(B)]);
  game.advanceUntil(quiet);
};

describe("Shiko and Narset, Unified", () => {
  it("copies a second spell that targets a creature, onto a new target", () => {
    const { game } = setUp();
    const [first, second] = bears(game, 2);
    firstSpell(game);
    const before = handSize(game);

    cast(game, "Shock", [objectRef(first)]);
    game.advanceUntil(settle);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-targets");
    if (awaiting?.kind !== "choose-targets") return;
    // The copy's target is offered first, and kept by default.
    expect(awaiting.current).toEqual([objectRef(first)]);
    expect(awaiting.options[0][0]).toEqual(objectRef(first));
    game.dispatch({ type: "choose-targets", player: A, targets: [objectRef(second)] });
    game.advanceUntil(quiet);

    expect(game.state.objects[first].zone).toBe("graveyard");
    expect(game.state.objects[second].zone).toBe("graveyard");
    // Copied, so no card drawn.
    expect(handSize(game)).toBe(before);
  });

  it("keeps the target when its controller doesn't change it", () => {
    const { game } = setUp();
    firstSpell(game);
    cast(game, "Shock", [playerRef(B)]);
    game.advanceUntil(settle);
    game.dispatch({ type: "choose-targets", player: A, targets: [playerRef(B)] });
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(20 - 3 - 2 - 2);
  });

  it("draws a card when the second spell targets nothing", () => {
    const { game } = setUp();
    firstSpell(game);
    const before = handSize(game);
    cast(game, "Divination");
    game.advanceUntil(quiet);
    // Divination's two, and Shiko's one.
    expect(handSize(game)).toBe(before + 3);
  });

  it("draws a card when the second spell targets only a spell", () => {
    const { game } = setUp();
    const bolt = cast(game, "Lightning Bolt", [playerRef(B)]);
    const before = handSize(game);
    // Holding priority: Counterspell is the second spell, and a spell isn't a
    // permanent or a player.
    cast(game, "Counterspell", [objectRef(bolt)]);
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(20);
    expect(handSize(game)).toBe(before + 1);
  });

  it("only fires on the second spell", () => {
    const { game } = setUp();
    const before = handSize(game);
    cast(game, "Shock", [playerRef(B)]);
    game.advanceUntil(settle);
    expect(game.state.awaiting).toBeNull();
    expect(game.state.players[B].life).toBe(18);
    expect(handSize(game)).toBe(before);
  });

  it("copies the spell even after it was countered in response", () => {
    // The ruling: the ability and its copy resolve even if the original spell
    // is countered before the copy is created — copied as it last was.
    const { game } = setUp();
    firstSpell(game);
    const shock = cast(game, "Shock", [playerRef(B)]);
    // Shiko's trigger is on the stack above Shock; Counterspell goes above it.
    cast(game, "Counterspell", [objectRef(shock)]);
    game.advanceUntil(settle);
    expect(game.state.objects[shock].zone).toBe("graveyard");
    expect(game.state.awaiting?.kind).toBe("choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [playerRef(B)] });
    game.advanceUntil(quiet);
    // Bolt's 3 and the copy's 2; the countered Shock dealt nothing.
    expect(game.state.players[B].life).toBe(15);
  });

  it("copies a modal spell with the same modes", () => {
    const { game } = setUp();
    const [bear] = bears(game, 1);
    firstSpell(game);
    // Modes: 2 damage to any target, and target player creates a Treasure.
    cast(game, "Prismari Command", [objectRef(bear), playerRef(A)], { modes: [0, 2] });
    game.advanceUntil(settle);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-targets");
    if (awaiting?.kind !== "choose-targets") return;
    expect(awaiting.current).toEqual([objectRef(bear), playerRef(A)]);
    // The copy aims its damage at B instead, and keeps the Treasure for A.
    game.dispatch({ type: "choose-targets", player: A, targets: [playerRef(B), playerRef(A)] });
    game.advanceUntil(quiet);

    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.state.players[B].life).toBe(20 - 3 - 2);
    const treasures = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Treasure Token" && game.state.objects[id].controller === A,
    );
    expect(treasures).toHaveLength(2);
  });

  it("copies an Aura spell, and the copy becomes a token Aura", () => {
    const { game } = setUp();
    const [first, second] = bears(game, 2);
    firstSpell(game);
    const pacifism = cast(game, "Pacifism", [objectRef(first)]);
    game.advanceUntil(settle);
    game.dispatch({ type: "choose-targets", player: A, targets: [objectRef(second)] });
    game.advanceUntil(quiet);

    expect(game.state.objects[pacifism].attachedTo).toBe(first);
    const copies = game.state.zones.shared.battlefield.filter(
      (id) => id !== pacifism && game.state.objects[id].cardName === "Pacifism",
    );
    expect(copies).toHaveLength(1);
    const copy = game.state.objects[copies[0]];
    expect(copy.isToken).toBe(true);
    expect(copy.attachedTo).toBe(second);
    expect(copy.controller).toBe(A);
    // A token that wasn't "created" (the ruling).
    expect(game.state.players[A].createdTokenThisTurn).toBe(false);
  });
});

describe("Twincast", () => {
  it("lets its controller choose a new target for the copy", () => {
    const { game } = setUp(false);
    const [first, second] = bears(game, 2);
    const shock = cast(game, "Shock", [objectRef(first)]);
    cast(game, "Twincast", [objectRef(shock)]);
    game.advanceUntil(settle);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-targets");
    if (awaiting?.kind !== "choose-targets") return;
    expect(awaiting.current).toEqual([objectRef(first)]);
    game.dispatch({ type: "choose-targets", player: A, targets: [objectRef(second)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[first].zone).toBe("graveyard");
    expect(game.state.objects[second].zone).toBe("graveyard");
  });

  it("refuses a new target that isn't legal", () => {
    const { game } = setUp(false);
    const [first] = bears(game, 1);
    const shock = cast(game, "Shock", [objectRef(first)]);
    cast(game, "Twincast", [objectRef(shock)]);
    game.advanceUntil(settle);
    // Shock can't target a spell.
    expect(() =>
      game.dispatch({ type: "choose-targets", player: A, targets: [objectRef(shock)] }),
    ).toThrow();
  });
});
