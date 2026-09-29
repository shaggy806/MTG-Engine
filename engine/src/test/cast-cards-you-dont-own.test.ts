import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

// Casting or playing a card you don't own (zone:cast-cards-you-dont-own):
// the player who casts a spell controls it (rule 601.2a), and a permanent
// spell resolves under its controller's control (rule 608.3a) — a land
// played, under whoever played it (305.1, 110.2). Wherever it goes after
// that is its owner's zone (rule 400.3).

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = () => {
  const controllers = { [A]: new ScriptedController(A), [B]: new ScriptedController(B) };
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40 },
    controllers,
    decks: [A, B].map((player) => ({ player, cards: Array(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, c: controllers as Record<PlayerId, ScriptedController> };
};

const quiet = (game: Game) =>
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
/** `card` (Bob's) in exile, Alice allowed to play it this turn. */
const bobsExiled = (game: Game, name: string): ObjectId => {
  const card = game.debugSpawn(name, B, "exile");
  game.state.objects[card].impulse = { player: A, expiry: { kind: "end-of-turn", turn: game.state.turn.number } };
  return card;
};

describe("casting a card you don't own", () => {
  it("the spell and the permanent are the caster's; it dies into its owner's graveyard", () => {
    const { game } = mkGame();
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const bears = bobsExiled(game, "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [], via: "impulse" });
    expect(game.state.objects[bears].controller).toBe(A);
    quiet(game);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[bears].controller).toBe(A);
    expect(game.state.objects[bears].owner).toBe(B);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    expect(game.state.zones.perPlayer[B].graveyard).toContain(bears);
  });

  it("an instant's \"you\" is its caster, and it goes to its owner's graveyard", () => {
    const { game } = mkGame();
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Island", A, "battlefield");
    const divination = bobsExiled(game, "Divination");
    const aHand = game.state.zones.perPlayer[A].hand.length;
    const bHand = game.state.zones.perPlayer[B].hand.length;
    game.dispatch({ type: "cast-spell", player: A, card: divination, targets: [], via: "impulse" });
    quiet(game);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(aHand + 2);
    expect(game.state.zones.perPlayer[B].hand.length).toBe(bHand);
    expect(game.state.zones.perPlayer[B].graveyard).toContain(divination);
  });

  it("a land played from an opponent's exiled card is the player's", () => {
    const { game } = mkGame();
    const swamp = bobsExiled(game, "Swamp");
    expect(game.legalActions(A).some((a) => a.kind === "play-land" && a.card === swamp)).toBe(true);
    game.dispatch({ type: "play-land", player: A, card: swamp });
    quiet(game);
    expect(game.state.objects[swamp].zone).toBe("battlefield");
    expect(game.state.objects[swamp].controller).toBe(A);
  });

  it("a permission to play it from exile ends when it leaves exile (rule 400.7)", () => {
    const { game } = mkGame();
    const bears = bobsExiled(game, "Grizzly Bears");
    game.debugApplyEffect(B, { kind: "put-onto-battlefield", target: 0 }, [{ kind: "object", object: bears }]);
    game.debugApplyEffect(B, { kind: "exile", target: 0 }, [{ kind: "object", object: bears }]);
    expect(game.state.objects[bears].zone).toBe("exile");
    expect(game.state.objects[bears].impulse).toBeUndefined();
  });
});
