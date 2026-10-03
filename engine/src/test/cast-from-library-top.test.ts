/**
 * Casting from the top of the library — a `castFromLibraryTop` static (Glarb,
 * Calamity's Augur; Sigarda, Font of Blessings; Thundermane Dragon), offered
 * as `via: "library-top"` and judged as the spell it would be (rule 601.3e:
 * the face cast, `{X}` at the X announced) — and `looksAtOwnLibraryTop`,
 * "you may look at the top card of your library any time" (rule 401.5): the
 * top card in its controller's own view and no one else's.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = () => {
  const controllers = { [A]: new ScriptedController(A), [B]: new ScriptedController(B) };
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40, maxLandsPerTurn: 1 },
    controllers,
    decks: [A, B].map((player) => ({ player, cards: Array(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return { game, c: controllers as Record<PlayerId, ScriptedController> };
};

const quiet = (game: Game) =>
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0);

const offers = (game: Game, card: ObjectId, player: PlayerId = A) =>
  game.legalActions(player).filter((a) => (a.kind === "cast-spell" || a.kind === "play-land") && a.card === card);

const lands = (game: Game, name: string, n: number) => {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, A, "battlefield");
};

describe("Glarb — lands and mana value 4 or greater from the top", () => {
  it("casts a four-mana spell off the top, as from the hand", () => {
    const { game } = mkGame();
    game.debugSpawn("Glarb, Calamity's Augur", A, "battlefield");
    lands(game, "Forest", 6);
    const dreadmaw = game.debugSpawn("Colossal Dreadmaw", A, "library");
    const offer = offers(game, dreadmaw);
    expect(offer).toHaveLength(1);
    expect(offer[0].kind === "cast-spell" && offer[0].via).toBe("library-top");
    game.dispatch({ type: "cast-spell", player: A, card: dreadmaw, targets: [], via: "library-top" });
    quiet(game);
    expect(game.state.objects[dreadmaw].zone).toBe("battlefield");
  });

  it("not a three-mana spell, not the card under the top, and not without Glarb", () => {
    const { game } = mkGame();
    const glarb = game.debugSpawn("Glarb, Calamity's Augur", A, "battlefield");
    lands(game, "Forest", 6);
    const under = game.debugSpawn("Colossal Dreadmaw", A, "library");
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    expect(offers(game, bears)).toHaveLength(0);
    expect(offers(game, under)).toHaveLength(0);
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [], via: "library-top" }),
    ).toThrow();
    const top = game.debugSpawn("Colossal Dreadmaw", A, "library");
    expect(offers(game, top)).toHaveLength(1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: glarb }]);
    expect(offers(game, top)).toHaveLength(0);
  });

  it("plays a land off the top with the land drop", () => {
    const { game } = mkGame();
    game.debugSpawn("Glarb, Calamity's Augur", A, "battlefield");
    const forest = game.debugSpawn("Forest", A, "library");
    expect(offers(game, forest).map((a) => a.kind)).toEqual(["play-land"]);
    game.dispatch({ type: "play-land", player: A, card: forest });
    expect(game.state.objects[forest].zone).toBe("battlefield");
  });

  it("an X spell only at an X that makes its mana value 4 or greater (601.3e, the ruling)", () => {
    const { game } = mkGame();
    game.debugSpawn("Glarb, Calamity's Augur", A, "battlefield");
    lands(game, "Wastes", 6);
    const serpent = game.debugSpawn("Stonecoil Serpent", A, "library");
    const offer = offers(game, serpent);
    expect(offer).toHaveLength(1);
    const cast = offer[0];
    if (cast.kind !== "cast-spell") throw new Error("expected a cast");
    expect(cast.xCost?.minX).toBe(4);
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: serpent, targets: [], via: "library-top", xValue: 3 }),
    ).toThrow();
    game.dispatch({ type: "cast-spell", player: A, card: serpent, targets: [], via: "library-top", xValue: 4 });
    quiet(game);
    expect(game.state.objects[serpent].zone).toBe("battlefield");
  });

  it("the top card is in Alice's view and not in Bob's (rule 401.5)", () => {
    const { game } = mkGame();
    const top = game.debugSpawn("Grizzly Bears", A, "library");
    expect(game.viewFor(A).revealedLibraryTop[A]).toBeNull();
    game.debugSpawn("Glarb, Calamity's Augur", A, "battlefield");
    expect(game.viewFor(A).revealedLibraryTop[A]).toBe(top);
    expect(game.viewFor(A).objects[top]?.cardName).toBe("Grizzly Bears");
    expect(game.viewFor(B).revealedLibraryTop[A]).toBeNull();
    expect(game.viewFor(B).objects[top]).toBeUndefined();
  });
});

describe("Sigarda — Angel and Human spells", () => {
  it("casts a Human from the top, not a Bear", () => {
    const { game } = mkGame();
    game.debugSpawn("Sigarda, Font of Blessings", A, "battlefield");
    // Mana for either: so only the permission decides.
    lands(game, "Plains", 3);
    lands(game, "Forest", 2);
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    expect(offers(game, bears)).toHaveLength(0);
    const angel = game.debugSpawn("Serra Angel", A, "library");
    expect(offers(game, angel)).toHaveLength(1);
  });
});

describe("Thundermane Dragon — power 4 or greater, and haste", () => {
  it("a creature cast this way has haste on the battlefield; one cast from the hand doesn't", () => {
    const { game } = mkGame();
    game.debugSpawn("Thundermane Dragon", A, "battlefield");
    lands(game, "Forest", 12);
    const fromTop = game.debugSpawn("Colossal Dreadmaw", A, "library");
    game.dispatch({ type: "cast-spell", player: A, card: fromTop, targets: [], via: "library-top" });
    quiet(game);
    const fromHand = game.debugSpawn("Colossal Dreadmaw", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: fromHand, targets: [] });
    quiet(game);
    const hasty = (id: ObjectId) =>
      game.state.objects[id].zone === "battlefield" && game.characteristics(id).keywords.has("haste");
    expect(hasty(fromTop)).toBe(true);
    expect(hasty(fromHand)).toBe(false);
    // Until end of turn only.
    game.advanceUntil((s) => s.turn.number === 2 && s.priority.holder !== null);
    expect(game.characteristics(fromTop).keywords.has("haste")).toBe(false);
  });

  it("not a creature with power 3 or less", () => {
    const { game } = mkGame();
    game.debugSpawn("Thundermane Dragon", A, "battlefield");
    lands(game, "Forest", 6);
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    expect(offers(game, bears)).toHaveLength(0);
  });
});
