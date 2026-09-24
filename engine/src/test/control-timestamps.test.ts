/**
 * Layer 2 in timestamp order (rule 613.7): every control-changing effect on a
 * permanent — a resolved `gain-control`, an until-end-of-turn steal, an
 * attached control-granting Aura — is weighed by its timestamp and the latest
 * wins. An Aura used to beat any lasting effect outright, and an
 * until-end-of-turn steal ending used to hand the permanent to its owner even
 * when an earlier lasting effect still said otherwise.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { defineCard } from "../cards/define.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

// The pool has no Sliver but the Overlord itself, and stealing one Overlord
// with another trips the legend rule — so a vanilla test-only Sliver.
const registry = createDefaultRegistry().register(
  defineCard({
    name: "Test Sliver",
    manaCost: "{1}",
    colors: [],
    types: ["creature"],
    subtypes: ["Sliver"],
    power: 1,
    toughness: 1,
    text: "",
  }),
);

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const mainOf = (turn: number, player: PlayerId) => (s: GameState): boolean =>
  s.turn.number === turn &&
  s.turn.step === "precombat-main" &&
  s.priority.holder === player &&
  quiet(s);

const mkGame = (aCards: readonly string[] = [], bCards: readonly string[] = []) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...aCards, ...Array<string>(40).fill("Island")] },
      { player: B, cards: [...bCards, ...Array<string>(40).fill("Island")] },
    ],
  });
  game.advanceUntil(mainOf(1, A));
  return game;
};

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

const steal = (game: Game, player: PlayerId, id: ObjectId, untilEndOfTurn = false): void => {
  game.debugApplyEffect(player, { kind: "gain-control", target: 0, untilEndOfTurn }, [obj(id)]);
  game.advanceUntil(quiet);
};

const handCard = (game: Game, p: PlayerId, name: string): ObjectId => {
  const id = game.handOf(p).find((x) => game.state.objects[x].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in ${p}'s hand`);
  return id;
};

const castMindControl = (game: Game, player: PlayerId, on: ObjectId): ObjectId => {
  for (let i = 0; i < 5; i += 1) game.debugSpawn("Island", player, "battlefield");
  const aura = handCard(game, player, "Mind Control");
  game.dispatch({ type: "cast-spell", player, card: aura, targets: [obj(on)] });
  game.advanceUntil(quiet);
  expect(game.state.objects[aura].attachedTo).toBe(on);
  return aura;
};

describe("layer 2 applies control effects in timestamp order", () => {
  it("a gain-control effect after a control Aura wins", () => {
    const game = mkGame(["Mind Control"]);
    const bear = game.debugSpawn("Grizzly Bears", B, "battlefield");
    castMindControl(game, A, bear);
    expect(game.state.objects[bear].controller).toBe(A);

    // Bob takes his Bears back with a lasting effect, timestamped after the Aura.
    steal(game, B, bear);
    expect(game.state.objects[bear].controller).toBe(B);
    // …and it stays his through later state-based-action passes and turns.
    game.advanceUntil(mainOf(3, A));
    expect(game.state.objects[bear].controller).toBe(B);
  });

  it("a control Aura attached after a gain-control effect wins", () => {
    const game = mkGame(["Mind Control"]);
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    steal(game, B, bear);
    expect(game.state.objects[bear].controller).toBe(B);

    castMindControl(game, A, bear);
    expect(game.state.objects[bear].controller).toBe(A);
  });

  it("the earlier effect takes over again when the later one's Aura leaves", () => {
    const game = mkGame(["Mind Control"]);
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    steal(game, B, bear);
    const aura = castMindControl(game, A, bear);
    expect(game.state.objects[bear].controller).toBe(A);

    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(aura)]);
    // Layer 2 is re-read with the state-based actions, before anyone's priority.
    game.advanceUntil(mainOf(2, B));
    expect(game.state.objects[aura].zone).toBe("graveyard");
    expect(game.state.objects[bear].controller).toBe(B);
  });

  it("an until-end-of-turn steal ends back with the lasting effect's player, not the owner", () => {
    const game = mkGame();
    const bear = game.debugSpawn("Grizzly Bears", B, "battlefield");
    steal(game, A, bear); // Alice takes it for good…
    steal(game, B, bear, true); // …Bob borrows it back for the turn.
    expect(game.state.objects[bear].controller).toBe(B);

    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[bear].controller).toBe(A);
    game.advanceUntil(mainOf(3, A));
    expect(game.state.objects[bear].controller).toBe(A);
  });

  it("an until-end-of-turn steal over a control Aura ends back with the Aura's controller", () => {
    const game = mkGame(["Mind Control"]);
    const bear = game.debugSpawn("Grizzly Bears", B, "battlefield");
    castMindControl(game, A, bear);
    steal(game, B, bear, true);
    expect(game.state.objects[bear].controller).toBe(B);

    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[bear].controller).toBe(A);
  });

  it("an until-end-of-turn steal with nothing under it reverts to the owner", () => {
    const game = mkGame();
    const bear = game.debugSpawn("Grizzly Bears", B, "battlefield");
    steal(game, A, bear, true);
    expect(game.state.objects[bear].controller).toBe(A);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[bear].controller).toBe(B);
    expect(game.state.objects[bear].controlEffects).toBeUndefined();
  });

  it("a permanent that changes zones forgets its control effects (rule 400.7)", () => {
    const game = mkGame(["Mind Control"]);
    const bear = game.debugSpawn("Grizzly Bears", B, "battlefield");
    steal(game, A, bear);
    // A control Aura elsewhere keeps layer 2 from taking its early-out.
    const other = game.debugSpawn("Grizzly Bears", B, "battlefield");
    castMindControl(game, A, other);

    game.debugApplyEffect(B, { kind: "return-to-hand", target: 0 }, [obj(bear)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[bear].zone).toBe("hand");
    expect(game.state.objects[bear].controlEffects).toBeUndefined();

    game.debugApplyEffect(
      B,
      { kind: "put-onto-battlefield", target: 0, underYourControl: false },
      [obj(bear)],
    );
    game.advanceUntil(mainOf(2, B));
    expect(game.state.objects[bear].zone).toBe("battlefield");
    expect(game.state.objects[bear].controller).toBe(B);
  });
});
