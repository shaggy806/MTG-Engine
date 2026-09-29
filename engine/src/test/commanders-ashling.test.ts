import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

// Ashling, the Limitless: "Elemental permanent spells you cast from your hand
// gain evoke {4} as you cast them" (keyword:evoke, granted — rule 702.74),
// and "whenever you sacrifice a nontoken Elemental, create a token that's a
// copy of it. The token gains haste until end of turn. At the beginning of
// your next end step, sacrifice it unless you pay {W}{U}{B}{R}{G}."

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = () => {
  const controllers = { [A]: new ScriptedController(A), [B]: new ScriptedController(B) };
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40 },
    controllers,
    decks: [A, B].map((player) => ({ player, cards: Array(40).fill("Mountain") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  const c = controllers as Record<PlayerId, ScriptedController>;
  const ashling = game.debugSpawn("Ashling, the Limitless", A, "battlefield");
  return { game, c, ashling };
};

const quiet = (game: Game) =>
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
const lands = (game: Game, names: readonly string[]) => {
  for (const name of names) game.debugSpawn(name, A, "battlefield");
};
const evokeOffers = (game: Game, card: ObjectId) =>
  game
    .legalActions(A)
    .flatMap((a) => (a.kind === "cast-spell" && a.card === card && a.evoke === true ? [a.evokeCost] : []));
const named = (game: Game, name: string) =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);

describe("Ashling, the Limitless", () => {
  it("gives an Elemental permanent spell in hand evoke {4} — not a non-Elemental", () => {
    const { game } = mkGame();
    lands(game, ["Mountain", "Mountain", "Mountain", "Mountain"]);
    const brute = game.debugSpawn("Cobblebrute", A, "hand");
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    expect(evokeOffers(game, brute)).toEqual(["{4}"]);
    expect(evokeOffers(game, bears)).toEqual([]);
  });

  it("beside a printed evoke, each is its own choice", () => {
    const { game } = mkGame();
    lands(game, ["Mountain", "Mountain", "Mountain", "Forest"]);
    const breaker = game.debugSpawn("Foundation Breaker", A, "hand");
    expect([...evokeOffers(game, breaker)].sort()).toEqual(["{1}{G}", "{4}"]);
  });

  it("only from the hand", () => {
    const { game } = mkGame();
    lands(game, ["Mountain", "Mountain", "Mountain", "Mountain"]);
    const brute = game.debugSpawn("Cobblebrute", A, "graveyard");
    expect(game.canDispatch({ type: "cast-spell", player: A, card: brute, targets: [], evoke: true })).not.toBeNull();
  });

  it("evoked, it's sacrificed, and Ashling makes a hasty token copy that goes at the end step unless paid", () => {
    const { game, c } = mkGame();
    lands(game, ["Mountain", "Mountain", "Mountain", "Mountain"]);
    const brute = game.debugSpawn("Cobblebrute", A, "hand");
    c[A].chooseModesFn = () => [];
    game.dispatch({ type: "cast-spell", player: A, card: brute, targets: [], evoke: true, evokeCost: "{4}" });
    quiet(game);
    expect(game.state.objects[brute].zone).toBe("graveyard");
    const [token] = named(game, "Cobblebrute");
    expect(token).toBeDefined();
    expect(game.state.objects[token].isToken).toBe(true);
    expect(game.characteristics(token).keywords).toContain("haste");
    game.advanceUntil((s) => s.turn.number === 2);
    // Declined: sacrificed — and a token isn't a nontoken Elemental, so no new copy.
    expect(named(game, "Cobblebrute")).toHaveLength(0);
  });

  it("paying {W}{U}{B}{R}{G} keeps the token", () => {
    const { game, c } = mkGame();
    lands(game, ["Mountain", "Mountain", "Mountain", "Mountain", "Plains", "Island", "Swamp", "Mountain", "Forest"]);
    const brute = game.debugSpawn("Cobblebrute", A, "hand");
    c[A].chooseModesFn = () => [0];
    game.dispatch({ type: "cast-spell", player: A, card: brute, targets: [], evoke: true });
    quiet(game);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(named(game, "Cobblebrute")).toHaveLength(1);
  });

  it("the spell keeps evoke if Ashling leaves before it resolves (the ruling)", () => {
    const { game, ashling } = mkGame();
    lands(game, ["Mountain", "Mountain", "Mountain", "Mountain"]);
    const brute = game.debugSpawn("Cobblebrute", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: brute, targets: [], evoke: true });
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: ashling }]);
    expect(game.state.objects[ashling].zone).toBe("graveyard");
    quiet(game);
    expect(game.state.objects[brute].zone).toBe("graveyard");
    expect(named(game, "Cobblebrute")).toHaveLength(0);
  });

  it("copies the sacrificed Elemental's enters ability too (Mulldrifter)", () => {
    const { game, c } = mkGame();
    lands(game, ["Island", "Island", "Island"]);
    const drifter = game.debugSpawn("Mulldrifter", A, "hand");
    c[A].chooseModesFn = () => [];
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({ type: "cast-spell", player: A, card: drifter, targets: [], evoke: true, evokeCost: "{2}{U}" });
    quiet(game);
    // Two from the evoked Mulldrifter, two from its token copy.
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand - 1 + 4);
    expect(named(game, "Mulldrifter")).toHaveLength(1);
  });
});
