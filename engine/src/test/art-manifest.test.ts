/**
 * `Game.artManifest`: every card in every player's deck, once each, as the
 * art its tiles ask for — the front face's name and the owner's printing —
 * for a client to load ahead of time.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

describe("Game.artManifest", () => {
  it("lists each card in every deck once, front faces, no tokens", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      decks: [
        { player: A, cards: [...Array<string>(30).fill("Forest"), "Grizzly Bears", "Aang, at the Crossroads"] },
        { player: B, cards: [...Array<string>(30).fill("Island"), "Lightning Bolt"] },
      ],
    });
    game.debugApplyEffect(A, { kind: "create-token", token: "Soldier Token", count: 1 }, []);
    const names = game.artManifest().map((e) => e.name).sort();
    expect(names).toEqual(["Aang, at the Crossroads", "Forest", "Grizzly Bears", "Island", "Lightning Bolt"]);
  });

  it("carries the printing its owner chose", () => {
    const printing = "2f3b2e8d-0000-4000-8000-000000000000";
    const game = Game.create({
      seed: 1,
      shuffle: false,
      decks: [
        { player: A, cards: Array<string>(40).fill("Forest"), printings: { Forest: printing } },
        { player: B, cards: Array<string>(40).fill("Island") },
      ],
    });
    expect(game.artManifest()).toContainEqual({ name: "Forest", art: printing });
  });
});
