/**
 * Card sweep 2, batch C2 (top-500 commanders): the cards the engine could
 * run faithfully, each driven through real play.
 */

import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (aDeck: readonly string[] = [], bDeck: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aDeck, ...Array<string>(40).fill("Island")] },
      { player: B, cards: [...bDeck, ...Array<string>(40).fill("Island")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name, player);
};
const named = (game: Game, name: string, player?: PlayerId): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === name && (player === undefined || game.state.objects[id].controller === player),
  );
const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const activate = (game: Game, source: ObjectId, abilityIndex: number, targets: (TargetRef | null)[] = [], extra = {}) => {
  game.dispatch({ type: "activate-ability", player: A, source, abilityIndex, targets, ...extra });
  game.advanceUntil(quiet);
};
const cast = (game: Game, card: ObjectId, targets: (TargetRef | null)[] = [], extra = {}, player: PlayerId = A) => {
  game.dispatch({ type: "cast-spell", player, card, targets, ...extra });
  game.advanceUntil(quiet);
};
const toStep = (game: Game, step: GameState["turn"]["step"]) =>
  game.advanceUntil((s) => s.turn.step === step && quiet(s));
const life = (game: Game, p: PlayerId) => game.state.players[p].life;
const power = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id).power;

describe("Dina, Essence Brewer", () => {
  it("sacrificing another creature gains X life and X counters; the draw triggers once a turn", () => {
    const { game } = setUp();
    const dina = spawn(game, "Dina, Essence Brewer");
    lands(game, "Swamp", 2);
    const giant = spawn(game, "Hill Giant");
    const bears = spawn(game, "Grizzly Bears");
    const hand = game.handOf(A).length;
    activate(game, dina, 0, [obj(bears)], { sacrifice: giant });
    expect(game.state.objects[giant].zone).toBe("graveyard");
    expect(life(game, A)).toBe(23);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(3);
    expect(game.handOf(A).length).toBe(hand + 1);
    // A second sacrifice the same turn draws nothing more.
    const seer = spawn(game, "Viscera Seer");
    const fodder = spawn(game, "Llanowar Elves");
    activate(game, seer, 0, [], { sacrifice: fodder });
    expect(game.state.objects[fodder].zone).toBe("graveyard");
    expect(game.handOf(A).length).toBe(hand + 1);
  });
});

describe("Dina, Essence Brewer — sacrificing a commander", () => {
  it("still draws and reads its power when the commander goes to the command zone", () => {
    const { game } = setUp();
    const dina = spawn(game, "Dina, Essence Brewer");
    lands(game, "Swamp", 2);
    const cmdr = spawn(game, "Hill Giant");
    game.state.objects[cmdr].isCommander = true;
    const bears = spawn(game, "Grizzly Bears");
    const hand = game.handOf(A).length;
    activate(game, dina, 0, [obj(bears)], { sacrifice: cmdr });
    expect(game.state.objects[cmdr].zone).toBe("command");
    expect(life(game, A)).toBe(23);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(3);
    expect(game.handOf(A).length).toBe(hand + 1);
  });
});

describe("Grand Arbiter Augustin IV", () => {
  const castable = (game: Game, id: ObjectId) =>
    game.legalActions(A).some((o) => o.kind === "cast-spell" && o.card === id);
  it("a white and blue spell costs {2} less", () => {
    const { game } = setUp(["Grand Arbiter Augustin IV"]);
    spawn(game, "Grand Arbiter Augustin IV");
    const second = inHand(game, A, "Grand Arbiter Augustin IV");
    spawn(game, "Plains");
    expect(castable(game, second)).toBe(false);
    spawn(game, "Island");
    expect(castable(game, second)).toBe(true);
  });
  it("an opponent's Arbiter makes your spells cost {1} more", () => {
    const { game } = setUp(["Ajani's Pridemate"]);
    spawn(game, "Grand Arbiter Augustin IV", B);
    const pridemate = inHand(game, A, "Ajani's Pridemate");
    lands(game, "Plains", 2);
    expect(castable(game, pridemate)).toBe(false);
    spawn(game, "Plains");
    expect(castable(game, pridemate)).toBe(true);
  });
});



describe("Lord of the Nazgûl", () => {
  it("makes a Wraith per instant or sorcery; at nine Wraiths they're all 9/9 this turn", () => {
    const { game } = setUp(["Opt", "Opt"]);
    const lord = spawn(game, "Lord of the Nazgûl");
    lands(game, "Island", 2);
    cast(game, inHand(game, A, "Opt"));
    expect(named(game, "Wraith Token", A).length).toBe(1);
    expect(power(game, lord)).toBe(4);
    game.debugApplyEffect(A, { kind: "create-token", token: "Wraith Token", count: 6 }, []);
    game.advanceUntil(quiet);
    cast(game, inHand(game, A, "Opt"));
    const wraiths = named(game, "Wraith Token", A);
    expect(power(game, lord)).toBe(9);
    expect(computeCharacteristics(game.state, registry, wraiths[0]).toughness).toBe(9);
    // A Wraith made after the effect began isn't affected by it.
    game.debugApplyEffect(A, { kind: "create-token", token: "Wraith Token", count: 1 }, []);
    game.advanceUntil(quiet);
    const late = named(game, "Wraith Token", A).find((id) => !wraiths.includes(id))!;
    expect(power(game, late)).toBe(3);
    toStep(game, "cleanup");
    game.advanceUntil((s) => s.turn.number === 2 && quiet(s));
    expect(power(game, lord)).toBe(4);
  });
});
