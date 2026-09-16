/**
 * `DeckList.printings` — which printing of a card a player brought.
 *
 * Purely cosmetic: it never touches a rule, and the only place it surfaces
 * is `VisibleObject.art`, which the client resolves to an image. These tests
 * pin that it reaches every seat's view (not just its owner's), that it
 * survives zone changes, and that it doesn't leak onto a face it can't
 * actually address.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** A stand-in Scryfall card id — the shape a deck actually stores. */
const PRINTING = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const OTHER_PRINTING = "11111111-2222-3333-4444-555555555555";

const deck = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 30 - cards.length)).fill("Forest"),
];

function artOf(game: Game, viewer: typeof A, id: ObjectId): string | null {
  const view = game.viewFor(viewer);
  const obj = view.objects[id];
  if (obj === undefined) throw new Error(`object ${id} is not visible to ${viewer}`);
  return obj.art;
}

function find(game: Game, name: string): ObjectId {
  const state = game.snapshot();
  const id = Object.values(state.objects).find((o) => o.cardName === name)?.id;
  if (id === undefined) throw new Error(`no object named ${name}`);
  return id;
}

describe("deck printings", () => {
  it("replaces a card's art for every seat's view, not just its owner's", () => {
    const game = Game.create({
      decks: [
        { player: A, cards: deck(["Sol Ring"]), printings: { "Sol Ring": PRINTING } },
        { player: B, cards: deck(["Sol Ring"]) },
      ],
      seed: 3,
      shuffle: false,
    });
    game.debugSpawn("Sol Ring", A, "battlefield");
    const id = Object.values(game.snapshot().objects).find(
      (o) => o.cardName === "Sol Ring" && o.zone === "battlefield",
    )!.id;

    // Alice's own copy carries her printing wherever it's looked at from.
    expect(artOf(game, A, id)).toBe(PRINTING);
    expect(artOf(game, B, id)).toBe(PRINTING);
  });

  it("is per-owner — two players can bring different printings of one card", () => {
    const game = Game.create({
      decks: [
        { player: A, cards: deck(["Sol Ring"]), printings: { "Sol Ring": PRINTING } },
        { player: B, cards: deck(["Sol Ring"]), printings: { "Sol Ring": OTHER_PRINTING } },
      ],
      seed: 3,
      shuffle: false,
    });
    game.debugSpawn("Sol Ring", A, "battlefield");
    game.debugSpawn("Sol Ring", B, "battlefield");
    const [first, second] = Object.values(game.snapshot().objects)
      .filter((o) => o.cardName === "Sol Ring" && o.zone === "battlefield")
      .map((o) => o.id);

    expect(artOf(game, A, first)).toBe(PRINTING);
    expect(artOf(game, A, second)).toBe(OTHER_PRINTING);
  });

  it("survives a zone change — it's a fact about the card, not about game state", () => {
    const game = Game.create({
      decks: [
        { player: A, cards: deck(["Sol Ring"]), printings: { "Sol Ring": PRINTING } },
        { player: B, cards: deck([]) },
      ],
      seed: 3,
      shuffle: false,
    });
    game.debugSpawn("Sol Ring", A, "battlefield");
    const id = Object.values(game.snapshot().objects).find(
      (o) => o.cardName === "Sol Ring" && o.zone === "battlefield",
    )!.id;
    expect(artOf(game, A, id)).toBe(PRINTING);

    game.debugSpawn("Sol Ring", A, "graveyard");
    const dead = Object.values(game.snapshot().objects).find(
      (o) => o.cardName === "Sol Ring" && o.zone === "graveyard",
    )!.id;
    expect(artOf(game, A, dead)).toBe(PRINTING);
  });

  it("leaves a name with no chosen printing on the card's own art", () => {
    const game = Game.create({
      decks: [
        { player: A, cards: deck(["Sol Ring", "Lightning Bolt"]), printings: { "Sol Ring": PRINTING } },
        { player: B, cards: deck([]) },
      ],
      seed: 3,
      shuffle: false,
    });
    game.debugSpawn("Lightning Bolt", A, "hand");
    expect(artOf(game, A, find(game, "Lightning Bolt"))).toBeNull();
  });

  // A decklist names a double-faced card by its front face, so that's the
  // key the printings map carries — but a turned-over permanent is still
  // the same physical card and wears the same printing.
  it("follows a card over when it transforms, keyed by its front face", () => {
    const game = Game.create({
      decks: [
        {
          player: A,
          cards: deck(["Harvesttide Infiltrator"]),
          printings: { "Harvesttide Infiltrator": PRINTING },
        },
        { player: B, cards: deck([]) },
      ],
      seed: 3,
      shuffle: false,
    });
    game.debugSpawn("Harvesttide Infiltrator", A, "battlefield");
    const id = Object.values(game.snapshot().objects).find(
      (o) => o.cardName === "Harvesttide Infiltrator" && o.zone === "battlefield",
    )!.id;
    expect(artOf(game, A, id)).toBe(PRINTING);
    expect(game.viewFor(A).objects[id].faceIsBack).toBe(false);

    const snap = game.snapshot();
    snap.objects[id].face = 1;
    const flipped = Game.fromSnapshot(snap, {});
    const back = flipped.viewFor(A).objects[id];
    expect(back.faceName).toBe("Harvesttide Assailant");
    expect(back.art).toBe(PRINTING);
    // A card id names the whole card and serves its front image, so the
    // client has to ask for `face=back` — and only the registry knows that
    // this two-entry `faces` list is a real second image.
    expect(back.faceIsBack).toBe(true);
  });

  it("doesn't call an adventure's spell half a back face — it's one image", () => {
    const game = Game.create({
      decks: [{ player: A, cards: deck(["Beanstalk Giant"]) }, { player: B, cards: deck([]) }],
      seed: 3,
      shuffle: false,
    });
    game.debugSpawn("Beanstalk Giant", A, "hand");
    const id = find(game, "Beanstalk Giant");

    const snap = game.snapshot();
    snap.objects[id].face = 1;
    const onAdventure = Game.fromSnapshot(snap, {});
    const view = onAdventure.viewFor(A).objects[id];
    expect(view.faceName).toBe("Fertile Footsteps");
    expect(view.faceIsBack).toBe(false);
  });
});
