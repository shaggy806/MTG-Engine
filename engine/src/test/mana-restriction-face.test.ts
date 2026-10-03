/**
 * A mana restriction ("spend this mana only to cast a Dragon creature spell")
 * reads the face being cast, not the card's front (rule 715.3: an Adventure
 * on the stack has only its Adventure characteristics). Bathe in Gold — the
 * Adventure of Young Red Dragon — is an instant, so Haven of the Spirit
 * Dragon's coloured mana can't pay for it. The offer said it could and the
 * cast then threw "cannot pay the cost of Bathe in Gold" (a v1 deck run's
 * seed 630).
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

function setUp(lands: readonly string[]) {
  const game = Game.create({
    seed: 1,
    registry,
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Forest") })),
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  game.state.zones.perPlayer[A].hand = [];
  for (const land of lands) game.debugSpawn(land, A, "battlefield", { summoningSick: false });
  const card = game.debugSpawn("Young Red Dragon", A, "hand");
  const bathe = () =>
    game.legalActions(A).some((o) => o.kind === "cast-spell" && o.card === card && o.face === 1);
  return { game, card, bathe };
}

describe("a mana restriction reads the face being cast", () => {
  it("doesn't offer Bathe in Gold paid with Haven's Dragon-only mana", () => {
    const { game, card, bathe } = setUp(["Haven of the Spirit Dragon", "Forest"]);
    expect(bathe()).toBe(false);
    expect(game.canDispatch({ type: "cast-spell", player: A, card, targets: [], face: 1 })).not.toBeNull();
  });

  it("offers it once there's red mana it may spend", () => {
    const { bathe } = setUp(["Haven of the Spirit Dragon", "Mountain"]);
    expect(bathe()).toBe(true);
  });

  it("still lets Haven's mana pay for the Dragon side", () => {
    const { game, card } = setUp(["Haven of the Spirit Dragon", "Forest", "Forest", "Forest"]);
    expect(game.canDispatch({ type: "cast-spell", player: A, card, targets: [] })).toBeNull();
  });
});
