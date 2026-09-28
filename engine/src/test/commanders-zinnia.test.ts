import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

// Zinnia, Valley's Voice: "creature spells you cast gain offspring {2} as you
// cast them" (static:grant-offspring-to-spells — rule 702.175), and +X/+0 for
// each other creature you control with base power 1.

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = () => {
  const controllers = { [A]: new ScriptedController(A), [B]: new ScriptedController(B) };
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40 },
    controllers,
    decks: [A, B].map((player) => ({ player, cards: Array(40).fill("Forest") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, c: controllers as Record<PlayerId, ScriptedController> };
};

const quiet = (game: Game) =>
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);

describe("Zinnia, Valley's Voice", () => {
  it("gets +1/+0 for each other creature with base power 1", () => {
    const { game } = mkGame();
    const zinnia = game.debugSpawn("Zinnia, Valley's Voice", A, "battlefield");
    game.debugSpawn("Llanowar Elves", A, "battlefield");
    game.debugSpawn("Llanowar Elves", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    expect(game.characteristics(zinnia).power).toBe(3);
  });

  it("offers each creature spell with offspring {2} too, and paid, it makes a 1/1 copy", () => {
    const { game } = mkGame();
    game.debugSpawn("Zinnia, Valley's Voice", A, "battlefield");
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    const offers = game.legalActions(A).filter((a) => a.kind === "cast-spell" && a.card === bears);
    expect(offers.map((o) => (o.kind === "cast-spell" ? o.offspring === true : null)).sort()).toEqual([false, true]);
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [], offspring: true });
    quiet(game);
    const all = game.battlefield.filter((id) => game.state.objects[id].cardName === "Grizzly Bears");
    expect(all).toHaveLength(2);
    const copy = all.find((id) => game.state.objects[id].isToken)!;
    expect(game.characteristics(copy).power).toBe(1);
    expect(game.characteristics(copy).toughness).toBe(1);
  });

  it("without the offspring paid, no copy — and a noncreature spell isn't offered it", () => {
    const { game } = mkGame();
    game.debugSpawn("Zinnia, Valley's Voice", A, "battlefield");
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] });
    quiet(game);
    expect(game.battlefield.filter((id) => game.state.objects[id].cardName === "Grizzly Bears")).toHaveLength(1);
    const growth = game.debugSpawn("Giant Growth", A, "hand");
    expect(
      game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === growth && a.offspring === true),
    ).toBe(false);
  });

  it("a creature with offspring of its own can pay both (rule 702.175b)", () => {
    const { game } = mkGame();
    game.debugSpawn("Zinnia, Valley's Voice", A, "battlefield");
    for (let i = 0; i < 8; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    const agate = game.debugSpawn("Agate Instigator", A, "hand");
    const both = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.card === agate && a.kicked === true && a.offspring === true);
    expect(both).toBeDefined();
    game.dispatch({ type: "cast-spell", player: A, card: agate, targets: [], kicked: true, offspring: true });
    quiet(game);
    expect(game.battlefield.filter((id) => game.state.objects[id].cardName === "Agate Instigator")).toHaveLength(3);
  });
});
