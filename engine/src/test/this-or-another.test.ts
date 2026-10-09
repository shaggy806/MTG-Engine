/**
 * "Whenever this creature or another X …" is two triggers (`thisOrAnother`):
 * one for the source itself, whatever it is by then, and one for every other
 * X. Written as one trigger requiring the object to be an X, it missed the
 * source's own entry or death when the source wasn't one — here a token copy
 * that's another colour or creature type, or a token copy of a "nontoken"
 * one, each still the named card.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: true, maxLandsPerTurn: 99, maxHandSize: 99, openingHandSize: 0 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const obj = (object: ObjectId) => ({ kind: "object" as const, object });
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const run = (game: Game, effect: EffectSpec, target: ObjectId): void => {
  game.debugApplyEffect(A, effect, [obj(target)]);
  game.advanceUntil(quiet);
};
const named = (game: Game, name: string): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === name);

describe("this or another X: the source's own event counts whatever it is", () => {
  it("Ayara: a white token copy of her drains for its own entry, and only once", () => {
    const game = setUp();
    const ayara = spawn(game, "Ayara, First of Locthwain");
    const before = life(game, B);
    run(game, { kind: "create-token-copy", of: 0, count: 1, exceptions: { setColors: ["W"], notLegendary: true } }, ayara);
    // The copy is "Ayara", so its own entry counts; the original sees a white
    // creature enter, which doesn't.
    expect(life(game, B)).toBe(before - 1);
  });

  it("Bloomvine Regent: a token copy that's an Elf, not a Dragon, gains life for its own entry", () => {
    const game = setUp();
    const regent = spawn(game, "Bloomvine Regent");
    const before = life(game, A);
    run(game, { kind: "create-token-copy", of: 0, count: 1, exceptions: { setSubtypes: ["Elf"] } }, regent);
    expect(life(game, A)).toBe(before + 3);
  });

  it("Millicent: a token copy of her dying is Millicent dying, though it isn't a nontoken Spirit", () => {
    const game = setUp();
    const millicent = spawn(game, "Millicent, Restless Revenant");
    run(game, { kind: "create-token-copy", of: 0, count: 1, exceptions: { notLegendary: true } }, millicent);
    const copy = named(game, "Millicent, Restless Revenant").find((id) => id !== millicent) as ObjectId;
    expect(game.state.objects[copy].isToken).toBe(true);
    run(game, { kind: "destroy", target: 0 }, copy);
    expect(named(game, "Spirit Token")).toHaveLength(1);
  });

  it("Vela: her own leaving and another creature's drain; a land's doesn't", () => {
    const game = setUp();
    const vela = spawn(game, "Vela the Night-Clad");
    const bears = spawn(game, "Grizzly Bears");
    const land = spawn(game, "Wastes");
    const before = life(game, B);
    run(game, { kind: "destroy", target: 0 }, land);
    expect(life(game, B)).toBe(before);
    run(game, { kind: "destroy", target: 0 }, bears);
    expect(life(game, B)).toBe(before - 1);
    run(game, { kind: "destroy", target: 0 }, vela);
    expect(life(game, B)).toBe(before - 2);
  });
});
