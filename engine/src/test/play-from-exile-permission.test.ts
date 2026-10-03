/**
 * A `playFromExile` static — a permanent's permission to play cards from
 * exile picked out by a counter on them (Grolnok, the Omnivore's croak
 * counters, Haldan, Avid Arcanist's fetch counters, Tinybones, Bauble
 * Burglar's stash counters): offered as `via: "impulse"` casts and land plays,
 * only while the permanent is on the battlefield, with its own gates —
 * `exiledByYou`, `spells`, `yourTurnOnly`, `spendAs`.
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
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40 },
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

/** Exile the top card of `whose` library with a `kind` counter, as `by`'s
 * effect — Pako's shape. */
const exileWithCounter = (game: Game, by: PlayerId, whose: PlayerId, name: string, kind: string): ObjectId => {
  const id = game.debugSpawn(name, whose, "library");
  game.debugApplyEffect(
    by,
    { kind: "exile-from-library", whose: whose === by ? "you" : "each-opponent", amount: 1, withCounters: { kind, amount: 1 } },
    [],
  );
  expect(game.state.objects[id].zone).toBe("exile");
  return id;
};

describe("Grolnok's croak counters — cards you own", () => {
  it("plays a land and casts a spell from exile, each the ordinary way", () => {
    const { game } = mkGame();
    game.debugSpawn("Grolnok, the Omnivore", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    const land = exileWithCounter(game, A, A, "Forest", "croak");
    const bears = exileWithCounter(game, A, A, "Grizzly Bears", "croak");

    expect(offers(game, land).map((a) => a.kind)).toEqual(["play-land"]);
    const cast = offers(game, bears);
    expect(cast).toHaveLength(1);
    expect(cast[0].kind === "cast-spell" && cast[0].via).toBe("impulse");

    game.dispatch({ type: "play-land", player: A, card: land });
    expect(game.state.objects[land].zone).toBe("battlefield");
    // The land drop is spent: a second land from exile isn't offered.
    const another = exileWithCounter(game, A, A, "Forest", "croak");
    expect(offers(game, another)).toHaveLength(0);

    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [], via: "impulse" });
    quiet(game);
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });

  it("not without the counter, not a card someone else owns, and not once Grolnok is gone", () => {
    const { game } = mkGame();
    const grolnok = game.debugSpawn("Grolnok, the Omnivore", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    const bare = game.debugSpawn("Grizzly Bears", A, "exile");
    const theirs = exileWithCounter(game, A, B, "Grizzly Bears", "croak");
    const mine = exileWithCounter(game, A, A, "Grizzly Bears", "croak");
    expect(offers(game, bare)).toHaveLength(0);
    expect(offers(game, theirs)).toHaveLength(0);
    expect(offers(game, mine)).toHaveLength(1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: grolnok }]);
    expect(offers(game, mine)).toHaveLength(0);
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: mine, targets: [], via: "impulse" }),
    ).toThrow();
  });

  it("sorcery timing still applies", () => {
    const { game } = mkGame();
    game.debugSpawn("Grolnok, the Omnivore", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    const bears = exileWithCounter(game, A, A, "Grizzly Bears", "croak");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === A);
    expect(offers(game, bears)).toHaveLength(0);
  });
});

describe("Haldan's fetch counters — cards you exiled, noncreature spells, any colour", () => {
  it("casts an opponent's noncreature card off the wrong colours, and plays a land", () => {
    const { game } = mkGame();
    game.debugSpawn("Haldan, Avid Arcanist", A, "battlefield");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    const divination = exileWithCounter(game, A, B, "Divination", "fetch");
    const land = exileWithCounter(game, A, B, "Island", "fetch");
    expect(game.state.objects[divination].exiledByPlayer).toBe(A);
    expect(offers(game, divination)).toHaveLength(1);
    expect(offers(game, land).map((a) => a.kind)).toEqual(["play-land"]);
    game.dispatch({ type: "cast-spell", player: A, card: divination, targets: [], via: "impulse" });
    quiet(game);
    // Bob's card, cast by Alice: it goes to its owner's graveyard.
    expect(game.state.zones.perPlayer[B].graveyard).toContain(divination);
  });

  it("not a creature spell, and not a card another player's effect exiled", () => {
    const { game } = mkGame();
    game.debugSpawn("Haldan, Avid Arcanist", A, "battlefield");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const bears = exileWithCounter(game, A, B, "Grizzly Bears", "fetch");
    expect(offers(game, bears)).toHaveLength(0);
    // Bob's own effect put this one there: Alice didn't exile it.
    const bobs = exileWithCounter(game, B, B, "Divination", "fetch");
    expect(game.state.objects[bobs].exiledByPlayer).toBe(B);
    expect(offers(game, bobs)).toHaveLength(0);
  });

  it("who exiled a card is forgotten once it leaves exile", () => {
    const { game } = mkGame();
    const card = exileWithCounter(game, A, B, "Divination", "fetch");
    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0, from: "exile" }, [{ kind: "object", object: card }]);
    expect(game.state.objects[card].exiledByPlayer).toBeUndefined();
  });
});

describe("Tinybones' stash counters — cards you don't own, during your turn, any type", () => {
  it("casts Bob's card off the wrong colours on Alice's turn only", () => {
    const { game } = mkGame();
    game.debugSpawn("Tinybones, Bauble Burglar", A, "battlefield");
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    const bears = exileWithCounter(game, A, B, "Grizzly Bears", "stash");
    const mine = exileWithCounter(game, A, A, "Grizzly Bears", "stash");
    expect(offers(game, bears)).toHaveLength(1);
    expect(offers(game, mine)).toHaveLength(0);
    // On Bob's turn, with flash it would still be his turn: nothing offered.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder !== null);
    const bolt = exileWithCounter(game, A, B, "Lightning Bolt", "stash");
    game.advanceUntil((s) => s.turn.number === 2 && s.priority.holder === A);
    expect(offers(game, bolt, A)).toHaveLength(0);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "upkeep" && s.priority.holder === A);
    expect(offers(game, bolt, A)).toHaveLength(1);
  });
});
