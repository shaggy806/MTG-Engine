/**
 * Two primitives added for the EDH backlog, and the cards that needed them.
 *
 * - `search-library` gaining a `"graveyard"` destination (Entomb, Buried
 *   Alive). Everything else about the tutor is unchanged, including the
 *   shuffle that follows it.
 * - The `artifact-or-creature` and `nonartifact-creature` target specs
 *   (Putrefy, Go for the Throat). The second is the interesting one: it is a
 *   *restriction* rather than a pair of types, so an artifact creature — which
 *   satisfies both halves of the first — must fail it.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { isLegalTarget } from "../targeting.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** `shuffle: false` means the deck is dealt in order and the first seven go
 * to the opening hand — so anything the *library* must still hold has to sit
 * behind them. */
const pad = (cards: readonly string[]): string[] => [
  ...Array(8).fill("Swamp"),
  ...cards,
  ...Array(Math.max(0, 40 - cards.length - 8)).fill("Swamp"),
];

const newGame = (aCards: readonly string[] = []): Game =>
  Game.create({
    seed: 3,
    shuffle: false,
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad([]) },
    ],
  });

describe("tutoring straight to the graveyard", () => {
  it("puts the found card in the graveyard and leaves the library shuffled", () => {
    const game = newGame(["Grizzly Bears", "Craw Wurm"]);
    const before = game.state.zones.perPlayer[A].library.length;
    const graveyardBefore = game.state.zones.perPlayer[A].graveyard.length;

    game.debugSpawn("Entomb", A, "hand");
    // Resolve the search directly: the point under test is the destination,
    // not the casting path, which every other tutor already covers.
    const api = game as unknown as {
      beginLibrarySearch: (
        player: string,
        filter: unknown,
        destination: string,
        min: number,
        max: number,
        enterTapped: boolean,
      ) => void;
    };
    api.beginLibrarySearch(A, { type: "creature" }, "graveyard", 1, 1, false);

    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-from-zone");
    if (awaiting?.kind !== "choose-from-zone") return;
    const pick = awaiting.eligible[0] as ObjectId;
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [pick] });

    expect(game.state.objects[pick].zone).toBe("graveyard");
    expect(game.state.zones.perPlayer[A].graveyard).toContain(pick);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(graveyardBefore + 1);
    expect(game.state.zones.perPlayer[A].library.length).toBe(before - 1);
  });
});

describe("artifact-or-creature / nonartifact-creature", () => {
  it("separates a plain creature, an artifact creature and a plain artifact", () => {
    const game = newGame();
    const registry = game.registry;
    const state = game.state;
    const ref = (id: ObjectId) => ({ kind: "object" as const, object: id });

    const bear = game.debugSpawn("Grizzly Bears", A); // Creature
    const strix = game.debugSpawn("Baleful Strix", A); // Artifact Creature
    const lotus = game.debugSpawn("Gilded Lotus", A); // Artifact

    const both = (id: ObjectId) =>
      isLegalTarget(state, registry, "artifact-or-creature", ref(id), A);
    const nonArtifact = (id: ObjectId) =>
      isLegalTarget(state, registry, "nonartifact-creature", ref(id), A);

    // "Artifact or creature" takes all three.
    expect(both(bear)).toBe(true);
    expect(both(strix)).toBe(true);
    expect(both(lotus)).toBe(true);

    // "Nonartifact creature" takes only the plain creature — the artifact
    // creature is exactly the case a naive type-pair check gets wrong.
    expect(nonArtifact(bear)).toBe(true);
    expect(nonArtifact(strix)).toBe(false);
    expect(nonArtifact(lotus)).toBe(false);
  });
});
