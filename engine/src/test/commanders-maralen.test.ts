import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

// Maralen, Fae Ascendant: "Whenever Maralen or another Elf or Faerie you
// control enters, exile the top two cards of target opponent's library. Once
// each turn, you may cast a spell with mana value less than or equal to the
// number of Elves and Faeries you control from among cards exiled with
// Maralen this turn without paying its mana cost." — and Agent of Treachery,
// whose end-step draw counts permanents you don't own.

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
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0);
/** Put `names` on top of Bob's library, the first on top. */
const stackBobsLibrary = (game: Game, names: readonly string[]): ObjectId[] =>
  [...names].reverse().map((name) => game.debugSpawn(name, B, "library")).reverse();
const castable = (game: Game, card: ObjectId) =>
  game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === card);
/** Cast Maralen, so she and her enters trigger resolve in the main phase. */
const maralenEnters = (game: Game): ObjectId => {
  for (const land of ["Swamp", "Forest", "Island", "Island", "Island"]) game.debugSpawn(land, A, "battlefield");
  const maralen = game.debugSpawn("Maralen, Fae Ascendant", A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card: maralen, targets: [] });
  quiet(game);
  expect(game.state.turn.step).toBe("precombat-main");
  return maralen;
};

describe("Maralen, Fae Ascendant", () => {
  it("exiles the top two of the opponent's library, and one of mana value ≤ her Elves and Faeries may be cast free", () => {
    const { game } = mkGame();
    const [elves, giant] = stackBobsLibrary(game, ["Llanowar Elves", "Hill Giant"]);
    maralenEnters(game);
    expect(game.state.objects[elves].zone).toBe("exile");
    expect(game.state.objects[giant].zone).toBe("exile");
    // One Elf or Faerie (Maralen): mana value 1 only, and never paid for.
    expect(castable(game, elves)).toBe(true);
    expect(castable(game, giant)).toBe(false);
    const offer = game.legalActions(A).find((a) => a.kind === "cast-spell" && a.card === elves);
    expect(offer?.kind === "cast-spell" && offer.free === true).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: elves, targets: [], via: "impulse", free: true });
    quiet(game);
    expect(game.state.objects[elves].zone).toBe("battlefield");
    expect(game.state.objects[elves].controller).toBe(A);
  });

  it("only once each turn — across both cards and both exiles", () => {
    const { game } = mkGame();
    const [first, second] = stackBobsLibrary(game, ["Llanowar Elves", "Llanowar Elves"]);
    maralenEnters(game);
    game.dispatch({ type: "cast-spell", player: A, card: first, targets: [], via: "impulse", free: true });
    quiet(game);
    // The Elf entering exiles two more; with two Elves and Faeries now, the
    // second Elf would fit — but the once-a-turn cast is spent.
    expect(game.state.objects[second].zone).toBe("exile");
    expect(castable(game, second)).toBe(false);
  });

  it("counts Elves and Faeries live, as the spell is cast", () => {
    const { game } = mkGame();
    const [giant] = stackBobsLibrary(game, ["Hill Giant", "Island"]);
    maralenEnters(game);
    expect(castable(game, giant)).toBe(false);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Llanowar Elves", A, "battlefield");
    expect(castable(game, giant)).toBe(true);
  });

  it("only this turn, and only while Maralen stays", () => {
    const { game } = mkGame();
    const [elves] = stackBobsLibrary(game, ["Llanowar Elves", "Island"]);
    const maralen = maralenEnters(game);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: maralen }]);
    expect(castable(game, elves)).toBe(false);

    const next = mkGame().game;
    const [later] = stackBobsLibrary(next, ["Llanowar Elves", "Island"]);
    maralenEnters(next);
    next.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(next.state.objects[later].zone).toBe("exile");
    expect(castable(next, later)).toBe(false);
  });
});

describe("Agent of Treachery", () => {
  it("takes a permanent, and draws three at the end step with three permanents you don't own", () => {
    const { game, c } = mkGame();
    const taken = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.debugSpawn("Island", B, "battlefield");
    game.debugSpawn("Island", B, "battlefield");
    c[A].chooseTargetsFn = (_view, _source, _specs, options) => [
      options[0].find((t) => t.kind === "object" && t.object === taken) ?? options[0][0],
    ];
    game.debugSpawn("Agent of Treachery", A, "battlefield", { announceEntry: true });
    quiet(game);
    expect(game.state.objects[taken].controller).toBe(A);
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.advanceUntil((s) => s.turn.step === "cleanup" || s.turn.number === 2);
    // Only one permanent Alice doesn't own: no draw.
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand);
  });

  it("with three, it draws", () => {
    const { game } = mkGame();
    const theirs = [0, 1, 2].map(() => game.debugSpawn("Grizzly Bears", B, "battlefield"));
    for (const id of theirs) {
      game.debugApplyEffect(A, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [{ kind: "object", object: id }]);
    }
    game.debugSpawn("Agent of Treachery", A, "battlefield");
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.advanceUntil((s) => s.turn.step === "cleanup" || s.turn.number === 2);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand + 3);
  });
});
