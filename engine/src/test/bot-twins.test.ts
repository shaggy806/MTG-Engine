/**
 * Twin targets (`bot/twins.ts`): tokens nothing tells apart are one target
 * option for the search, not one each — seven Treasures are one "destroy a
 * Treasure" to simulate, and the rest of the candidate cap goes to real
 * alternatives. A token something sets apart stays its own option.
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { aimOffer } from "../bot/eval-bot.js";
import { collapseTwins } from "../bot/twins.js";
import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

/** Alice's main phase with Shatter and the mana for it; Bob has seven
 * Treasures and a Sol Ring. */
function board(): { game: Game; treasures: ObjectId[]; ring: ObjectId; shatter: ObjectId } {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    startingPlayer: A,
    decks: [
      { player: A, cards: Array(40).fill("Mountain") },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  for (let i = 0; i < 2; i += 1) game.debugSpawn("Mountain", A, "battlefield");
  const shatter = game.debugSpawn("Shatter", A, "hand");
  game.debugApplyEffect(B, { kind: "create-token", token: "Treasure Token", count: 7 });
  const ring = game.debugSpawn("Sol Ring", B, "battlefield");
  const treasures = game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === "Treasure Token",
  );
  return { game, treasures, ring, shatter };
}

const shatterOffer = (game: Game, card: ObjectId) =>
  game
    .legalActions(A)
    .find((l): l is Extract<LegalAction, { kind: "cast-spell" }> => l.kind === "cast-spell" && l.card === card);

describe("twin targets", () => {
  it("offers seven identical Treasures as one option", () => {
    const { game, treasures, ring, shatter } = board();
    expect(treasures).toHaveLength(7);
    const offer = shatterOffer(game, shatter);
    if (offer === undefined) throw new Error("Shatter isn't castable");
    expect(offer.targetOptions[0]).toHaveLength(8);
    const aimed = aimOffer(game.state, registry, A, offer);
    if (aimed.kind !== "cast-spell") throw new Error("not a cast");
    const options = aimed.targetOptions[0].map((t) => (t.kind === "object" ? t.object : t.player));
    expect(options).toHaveLength(2);
    expect(options).toContain(ring);
  });

  it("keeps as many twins as there are slots, and anything set apart", () => {
    const { game, treasures } = board();
    const refs = treasures.map((object) => ({ kind: "object" as const, object }));
    expect(collapseTwins(game.state, refs, 2)).toHaveLength(2);
    // A tapped Treasure is different from an untapped one.
    game.state.objects[treasures[3]].tapped = true;
    expect(collapseTwins(game.state, refs, 1)).toHaveLength(2);
  });
});
