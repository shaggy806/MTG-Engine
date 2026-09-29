import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

// Evoke (rule 702.74): "You may cast this spell by paying [cost] rather than
// paying its mana cost" and "When this permanent enters, if its evoke cost
// was paid, its controller sacrifices it."

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
const lands = (game: Game, name: string, n: number) => {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, A, "battlefield");
};
const castOffers = (game: Game, card: ObjectId) =>
  game.legalActions(A).filter((a) => a.kind === "cast-spell" && a.card === card);

describe("evoke", () => {
  it("is offered beside the mana cost, and only it when the mana cost is out of reach", () => {
    const { game } = mkGame();
    lands(game, "Island", 3);
    const drifter = game.debugSpawn("Mulldrifter", A, "hand");
    const offers = castOffers(game, drifter);
    expect(offers).toHaveLength(1);
    expect(offers[0].kind === "cast-spell" && offers[0].evoke === true && offers[0].evokeCost === "{2}{U}").toBe(true);
    lands(game, "Island", 2);
    expect(castOffers(game, drifter).map((o) => o.kind === "cast-spell" && o.evoke === true).sort()).toEqual([
      false,
      true,
    ]);
  });

  it("evoked, it enters, its enters trigger resolves, and it's sacrificed", () => {
    const { game } = mkGame();
    lands(game, "Island", 3);
    const drifter = game.debugSpawn("Mulldrifter", A, "hand");
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({ type: "cast-spell", player: A, card: drifter, targets: [], evoke: true });
    // Only the evoke cost was paid.
    expect(game.battlefield.filter((id) => game.state.objects[id].cardName === "Island" && !game.state.objects[id].tapped))
      .toHaveLength(0);
    quiet(game);
    expect(game.state.objects[drifter].zone).toBe("graveyard");
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand - 1 + 2);
    // Its mana value is still that of its mana cost (the ruling).
    expect(game.state.objects[drifter].cardName).toBe("Mulldrifter");
  });

  it("its own enters trigger resolves first, while it's still on the battlefield (the rulings)", () => {
    const { game } = mkGame();
    lands(game, "Island", 3);
    const drifter = game.debugSpawn("Mulldrifter", A, "hand");
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({ type: "cast-spell", player: A, card: drifter, targets: [], evoke: true });
    game.advanceUntil((s) => s.zones.shared.stack.length === 2);
    game.advanceUntil((s) => s.zones.shared.stack.length === 1);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand - 1 + 2);
    expect(game.state.objects[drifter].zone).toBe("battlefield");
    quiet(game);
    expect(game.state.objects[drifter].zone).toBe("graveyard");
  });

  it("cast for its mana cost, it stays", () => {
    const { game } = mkGame();
    lands(game, "Island", 5);
    const drifter = game.debugSpawn("Mulldrifter", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: drifter, targets: [] });
    quiet(game);
    expect(game.state.objects[drifter].zone).toBe("battlefield");
  });

  it("the sacrifice is an enters trigger, so a leaves trigger fires off it (Reveillark)", () => {
    const { game } = mkGame();
    lands(game, "Plains", 6);
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    const lark = game.debugSpawn("Reveillark", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: lark, targets: [], evoke: true });
    quiet(game);
    expect(game.state.objects[lark].zone).toBe("graveyard");
    expect(game.state.objects[bears].zone).toBe("battlefield");
    // Power 3: not a legal target.
    expect(game.state.objects[giant].zone).toBe("graveyard");
  });

  it("isn't offered for a card without it, and can't be dispatched for one", () => {
    const { game } = mkGame();
    lands(game, "Forest", 4);
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    expect(castOffers(game, bears).some((o) => o.kind === "cast-spell" && o.evoke === true)).toBe(false);
    expect(game.canDispatch({ type: "cast-spell", player: A, card: bears, targets: [], evoke: true })).toMatch(
      /no evoke/,
    );
  });

  it("is an alternative cost: never with another (rule 118.9a)", () => {
    const { game } = mkGame();
    lands(game, "Swamp", 5);
    const maw = game.debugSpawn("Shriekmaw", A, "hand");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    expect(
      game.canDispatch({
        type: "cast-spell",
        player: A,
        card: maw,
        targets: [],
        evoke: true,
        free: true,
      }),
    ).not.toBeNull();
    game.dispatch({ type: "cast-spell", player: A, card: maw, targets: [], evoke: true });
    quiet(game);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.objects[maw].zone).toBe("graveyard");
  });

  it("a cast trigger still draws when it's evoked (Nulldrifter)", () => {
    const { game } = mkGame();
    lands(game, "Island", 3);
    const nd = game.debugSpawn("Nulldrifter", A, "hand");
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({ type: "cast-spell", player: A, card: nd, targets: [], evoke: true });
    quiet(game);
    expect(game.state.objects[nd].zone).toBe("graveyard");
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand - 1 + 2);
  });
});
