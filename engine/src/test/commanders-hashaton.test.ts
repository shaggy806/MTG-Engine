import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

// Hashaton, Scarab's Fist — the gaps list had it waiting on token-copy
// options and discard-trigger extensions; `discards` per card, a `may` with
// a mana cost and a tapped `create-token-copy` of the card with copy
// exceptions already say it.

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = () => {
  const controllers = { [A]: new ScriptedController(A), [B]: new ScriptedController(B) };
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40 },
    controllers,
    decks: [A, B].map((player) => ({ player, cards: Array(40).fill("Plains") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, c: controllers as Record<PlayerId, ScriptedController> };
};

const quiet = (game: Game) =>
  game.advanceUntil(
    (s) => s.zones.shared.stack.length === 0 && s.pendingTriggers.length === 0 && s.awaiting === null,
  );
const copiesOf = (game: Game, name: string) =>
  game.battlefield.filter((id) => game.state.objects[id].isToken && game.state.objects[id].cardName === name);

const setup = (pay: boolean) => {
  const { game, c } = mkGame();
  game.debugSpawn("Hashaton, Scarab's Fist", A, "battlefield");
  for (let i = 0; i < 3; i++) game.debugSpawn("Island", A, "battlefield");
  // Discard only the creature card, whatever else is in hand.
  const giant = game.debugSpawn("Hill Giant", A, "hand");
  c[A].chooseDiscardsFn = () => [giant];
  c[A].chooseModesFn = () => (pay ? [0] : []);
  game.debugApplyEffect(A, { kind: "discard", target: "you", amount: 1 });
  quiet(game);
  return game;
};

describe("Hashaton, Scarab's Fist", () => {
  it("paying {2}{U} makes a tapped 4/4 black Zombie copy of the discarded creature", () => {
    const game = setup(true);
    const [token] = copiesOf(game, "Hill Giant");
    expect(token).toBeDefined();
    const ch = game.characteristics(token);
    expect([ch.power, ch.toughness]).toEqual([4, 4]);
    expect([...ch.colors]).toEqual(["B"]);
    expect([...ch.subtypes]).toEqual(["Zombie"]);
    expect([...ch.types]).toContain("creature");
    expect(game.state.objects[token].tapped).toBe(true);
    expect(game.state.objects[token].controller).toBe(A);
    expect(game.battlefield.filter((id) => game.state.objects[id].cardName === "Island" && game.state.objects[id].tapped)).toHaveLength(3);
  });

  it("still copies the card if it has left the graveyard by then (rule 608.2h)", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Hashaton, Scarab's Fist", A, "battlefield");
    for (let i = 0; i < 3; i++) game.debugSpawn("Island", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", A, "hand");
    c[A].chooseDiscardsFn = () => [giant];
    c[A].chooseModesFn = () => [0];
    game.debugApplyEffect(A, { kind: "discard", target: "you", amount: 1 });
    game.advanceUntil((s) => s.objects[giant].zone === "graveyard");
    expect(copiesOf(game, "Hill Giant")).toHaveLength(0);
    game.debugApplyEffect(A, { kind: "exile", target: 0 }, [{ kind: "object", object: giant }]);
    expect(game.state.objects[giant].zone).toBe("exile");
    quiet(game);
    expect(copiesOf(game, "Hill Giant")).toHaveLength(1);
  });

  it("declining makes nothing", () => {
    const game = setup(false);
    expect(copiesOf(game, "Hill Giant")).toHaveLength(0);
  });

  it("a noncreature card discarded doesn't trigger it", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Hashaton, Scarab's Fist", A, "battlefield");
    for (let i = 0; i < 3; i++) game.debugSpawn("Island", A, "battlefield");
    const island = game.debugSpawn("Island", A, "hand");
    c[A].chooseDiscardsFn = () => [island];
    c[A].chooseModesFn = () => [0];
    game.debugApplyEffect(A, { kind: "discard", target: "you", amount: 1 });
    quiet(game);
    expect(game.battlefield.filter((id) => game.state.objects[id].isToken)).toHaveLength(0);
  });
});
