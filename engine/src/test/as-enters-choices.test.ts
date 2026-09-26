import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { TargetRef } from "../target.js";

/**
 * "As this enters" choices (rule 614.12) are made *before* the permanent
 * moves: a Clone is already the creature it copies as it arrives, so
 * whatever applies as a permanent enters (Giada's counters for an Angel) and
 * whatever triggers on it arriving (the copied creature's own "when this
 * enters") both see the copy. And they're made however it arrives — cast,
 * played, reanimated, blinked or tutored — not only as a spell resolves.
 *
 * The engine used to ask only for a permanent spell or a played land, and
 * only once the permanent was already on the battlefield and announced.
 */

const [A, B] = ["alice", "bob"].map(asPlayerId);

function table(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 1, maxHandSize: 99 },
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Island") })),
  });
  game.advanceUntil(
    (s) => s.turn.step === "precombat-main" && s.turnOrder[s.turn.activePlayerIndex] === A && s.priority.holder === A,
  );
  return game;
}

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

function spawn(game: Game, name: string, owner: PlayerId, zone: "battlefield" | "hand" | "graveyard" | "library" = "battlefield"): ObjectId {
  return game.debugSpawn(name, owner, zone, { summoningSick: false });
}

/** Pass priority until the stack is empty; stop at (and return) any decision. */
function passUntilDecision(game: Game): string | null {
  for (let i = 0; i < 50; i += 1) {
    if (game.state.awaiting !== null) return game.state.awaiting.kind;
    if (game.state.zones.shared.stack.length === 0 && game.state.pendingTriggers.length === 0) return null;
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
  }
  throw new Error("never settled");
}

function castClone(game: Game): ObjectId {
  for (let i = 0; i < 4; i += 1) spawn(game, "Island", A);
  const clone = spawn(game, "Clone", A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card: clone, targets: [] });
  return clone;
}

const copyEvents = (game: Game) => game.state.eventLog.filter((e) => e.type === "permanent-copied");

describe("\"as this enters\" choices are made before the permanent moves (rule 614.12)", () => {
  it("a Clone copying a creature with an enters trigger gets that trigger", () => {
    const game = table();
    const visionary = spawn(game, "Elvish Visionary", B);
    const clone = castClone(game);

    expect(passUntilDecision(game)).toBe("choose-copy");
    // Still resolving: it hasn't moved yet.
    expect(game.state.objects[clone].zone).toBe("stack");
    const handBefore = game.handOf(A).length;

    game.dispatch({ type: "choose-copy", player: A, copy: visionary });
    passUntilDecision(game);

    expect(game.state.objects[clone]).toMatchObject({ zone: "battlefield", copyOf: "Elvish Visionary" });
    // "When this creature enters, draw a card" — the Clone entered as one.
    expect(game.handOf(A).length).toBe(handBefore + 1);
    const log = game.state.eventLog.map((e) => e.type);
    expect(log.indexOf("permanent-copied")).toBeLessThan(log.lastIndexOf("permanent-entered-battlefield"));
  });

  it("a Clone copying an Angel gets Giada's counters as it enters", () => {
    const game = table();
    spawn(game, "Giada, Font of Hope", A);
    const angel = spawn(game, "Serra Angel", A);
    const clone = castClone(game);

    expect(passUntilDecision(game)).toBe("choose-copy");
    game.dispatch({ type: "choose-copy", player: A, copy: angel });
    passUntilDecision(game);

    // One +1/+1 counter for each Angel already there: Giada and the Serra Angel.
    expect(game.state.objects[clone].counters["+1/+1"]).toBe(2);
  });

  it("a reanimated Clone is asked what to copy, and the rest of the effect waits", () => {
    const game = table();
    const bears = spawn(game, "Grizzly Bears", B);
    const clone = spawn(game, "Clone", A, "graveyard");
    const handBefore = game.handOf(A).length;

    game.debugApplyEffect(
      A,
      {
        kind: "sequence",
        effects: [
          { kind: "put-onto-battlefield", target: 0, underYourControl: true },
          { kind: "draw", amount: 1 },
        ],
      },
      [obj(clone)],
    );
    expect(game.state.awaiting?.kind).toBe("choose-copy");
    expect(game.state.objects[clone].zone).toBe("graveyard");
    // "Draw a card" comes after the Clone is back, so it waits too.
    expect(game.handOf(A).length).toBe(handBefore);

    game.dispatch({ type: "choose-copy", player: A, copy: bears });

    expect(game.state.objects[clone]).toMatchObject({ zone: "battlefield", copyOf: "Grizzly Bears" });
    expect(game.handOf(A).length).toBe(handBefore + 1);
  });

  it("a blinked Clone copies afresh as it comes back", () => {
    const game = table();
    spawn(game, "Grizzly Bears", B);
    const angel = spawn(game, "Serra Angel", B);
    const clone = spawn(game, "Clone", A);
    game.state.objects[clone].copyOf = "Grizzly Bears";

    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [obj(clone)]);
    expect(game.state.awaiting?.kind).toBe("choose-copy");
    expect(game.state.objects[clone].zone).toBe("exile");

    game.dispatch({ type: "choose-copy", player: A, copy: angel });

    expect(game.state.objects[clone]).toMatchObject({ zone: "battlefield", copyOf: "Serra Angel" });
    expect(copyEvents(game).map((e) => e.type === "permanent-copied" && e.copyOf)).toEqual(["Serra Angel"]);
  });

  it("a land being played chooses before it enters", () => {
    const game = table();
    const cavern = spawn(game, "Cavern of Souls", A, "hand");

    game.dispatch({ type: "play-land", player: A, card: cavern });
    expect(game.state.awaiting?.kind).toBe("choose-creature-type");
    expect(game.state.objects[cavern].zone).toBe("hand");
    // The land drop is spent: it's being played.
    expect(game.state.players[A].landsPlayedThisTurn).toBe(1);

    game.dispatch({ type: "choose-creature-type", player: A, creatureType: "Elf" });

    expect(game.state.objects[cavern]).toMatchObject({ zone: "battlefield", chosenCreatureType: "Elf" });
    expect(game.state.eventLog.some((e) => e.type === "land-played" && e.object === cavern)).toBe(true);
    expect(game.state.priority.holder).toBe(A);
  });

  it("a land a search puts onto the battlefield chooses too", () => {
    const game = table();
    const cavern = spawn(game, "Cavern of Souls", A, "library");

    game.debugApplyEffect(
      A,
      { kind: "search-library", filter: { name: "Cavern of Souls" }, destination: "battlefield", min: 0, max: 1 },
      [],
    );
    expect(game.state.awaiting?.kind).toBe("choose-from-zone");
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [cavern] });

    expect(game.state.awaiting?.kind).toBe("choose-creature-type");
    expect(game.state.objects[cavern].zone).toBe("library");
    game.dispatch({ type: "choose-creature-type", player: A, creatureType: "Goblin" });

    expect(game.state.objects[cavern]).toMatchObject({ zone: "battlefield", chosenCreatureType: "Goblin" });
  });

  it("a Clone with nothing to copy enters as itself, asking nothing", () => {
    const game = table();
    const clone = castClone(game);

    expect(passUntilDecision(game)).toBeNull();
    expect(copyEvents(game)).toEqual([]);
    // A 0/0 Clone, gone to the state-based check.
    expect(game.state.objects[clone].zone).toBe("graveyard");
  });
});
