/**
 * An adventurer's Adventure and an omen card's Omen in a view
 * (`VisibleObject.spellFace`): the other spell the card can be cast as, which
 * the printed card shows beside its creature, while it isn't on the
 * battlefield — a hand's Smaug, the Great Calamity showed only "Flying"
 * (a bug report, 2026-10-04).
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [
      { player: A, cards: Array<string>(40).fill("Mountain") },
      { player: B, cards: Array<string>(40).fill("Mountain") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  return game;
};

describe("an Adventure or Omen half in a view", () => {
  it("shows Smaug's Adventure in hand, and not once Smaug is on the battlefield", () => {
    const game = setUp();
    const inHand = game.debugSpawn("Smaug, the Great Calamity", A, "hand");
    const onBoard = game.debugSpawn("Smaug, the Great Calamity", A, "battlefield");
    const view = game.viewFor(A);
    expect(view.objects[inHand].spellFace).toMatchObject({ name: "Spew Flame", manaCost: "{4}{R}", types: ["sorcery"], subtypes: ["Adventure"] });
    expect(view.objects[inHand].spellFace?.text.length).toBeGreaterThan(0);
    expect(view.objects[onBoard].spellFace).toBeUndefined();
  });

  it("shows an omen card's Omen", () => {
    const game = setUp();
    const inHand = game.debugSpawn("Bloomvine Regent", A, "hand");
    const view = game.viewFor(A);
    expect(view.objects[inHand].spellFace?.name).toBe("Claim Territory");
  });

  it("gives an ordinary card none, and an opponent's hidden hand nothing to read", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    const theirs = game.debugSpawn("Smaug, the Great Calamity", B, "hand");
    const view = game.viewFor(A);
    expect(view.objects[bears].spellFace).toBeUndefined();
    expect(view.objects[theirs]).toBeUndefined();
  });
});
