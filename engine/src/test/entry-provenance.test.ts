/**
 * How a permanent came onto the battlefield (`GameObject.entry`): the zone it
 * came from, whether it was cast — by whom and from where — and whose
 * ability put it there. Read by the filter clauses `cast` / `castBy` ("if
 * you cast it" — Anti-Venom, Rocco, Tiamat), `enteredFrom` ("whenever a
 * permanent you control enters from exile" — Fire Lord Zuko), `castFrom`
 * and `putThereBySource` (Kodama of the East Tree's "if it wasn't put onto
 * the battlefield with this ability").
 */

import { describe, expect, it } from "vitest";

import type { TriggerSpec } from "../abilities.js";
import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const gain = (n: number): EffectSpec => ({ kind: "gain-life", amount: n });
const watcher = (name: string, trigger: TriggerSpec, effect: EffectSpec) =>
  defineCard({
    name,
    manaCost: "{0}",
    types: ["enchantment"],
    text: name,
    triggered: [{ trigger, targets: [], effect, resolve: null, text: name }],
  });

/** "When this enters, if you cast it, you gain 5 life." */
const ANTI_VENOM = "Test Horrifying Healer";
/** "Whenever a permanent you control enters from exile, you gain 1 life." */
const ZUKO = "Test Fire Lord";
/** "Whenever another permanent you control enters, if it wasn't put onto the
 * battlefield with this ability, you may put a land card from your hand
 * onto the battlefield." */
const KODAMA = "Test East Tree";
/** "Whenever a creature you control dies, if it was cast, you gain 2 life." */
const MOURNER = "Test Mourner";

const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: ANTI_VENOM,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Symbiote"],
      power: 2,
      toughness: 2,
      text: ANTI_VENOM,
      triggered: [
        {
          trigger: { on: "enters-battlefield", who: "self", filter: { cast: true, castBy: "you" } },
          targets: [],
          effect: gain(5),
          resolve: null,
          text: ANTI_VENOM,
        },
      ],
    }),
  )
  .register(watcher(ZUKO, { on: "enters-battlefield", who: "you-control", filter: { enteredFrom: "exile" } }, gain(1)))
  .register(
    watcher(
      KODAMA,
      { on: "enters-battlefield", who: "you-control", otherOnly: true, filter: { putThereBySource: false } },
      {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "land" },
      },
    ),
  )
  .register(watcher(MOURNER, { on: "dies", who: "you-control", filter: { type: "creature", cast: true } }, gain(2)));

const setUp = (hand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill("Island")] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const cast = (game: Game, name: string): ObjectId => {
  const card = inHand(game, A, name);
  game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
  game.advanceUntil(quiet);
  return card;
};
const run = (game: Game, effect: EffectSpec, target?: ObjectId): void => {
  const source = game.debugSpawn("Island", A, "battlefield");
  game.debugApplyEffect(A, effect, target === undefined ? [] : [{ kind: "object", object: target }], {
    source,
  });
  game.advanceUntil(quiet);
};
const fired = (game: Game, source: ObjectId): number =>
  game.eventsOfType("ability-triggered").filter((e) => e.source === source).length;
const life = (game: Game): number => game.state.players[A].life;

describe("if you cast it", () => {
  it("fires for a cast permanent, and records who cast it from where", () => {
    const { game } = setUp([ANTI_VENOM]);
    const healer = cast(game, ANTI_VENOM);
    expect(life(game)).toBe(25);
    expect(game.state.objects[healer].entry).toEqual({ from: "stack", cast: { by: A, from: "hand" } });
  });

  it("not when an effect puts it onto the battlefield", () => {
    const { game } = setUp();
    const healer = game.debugSpawn(ANTI_VENOM, A, "graveyard");
    run(game, { kind: "put-onto-battlefield", target: 0 }, healer);
    expect(game.state.objects[healer].zone).toBe("battlefield");
    expect(life(game)).toBe(20);
    expect(game.state.objects[healer].entry?.from).toBe("graveyard");
  });

  it("a creature that left is asked as it last was", () => {
    const { game } = setUp([ANTI_VENOM]);
    game.debugSpawn(MOURNER, A, "battlefield");
    const healer = cast(game, ANTI_VENOM);
    run(game, { kind: "destroy", target: 0 }, healer);
    expect(life(game)).toBe(25 + 2);
    // A creature that wasn't cast doesn't count.
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    run(game, { kind: "destroy", target: 0 }, bears);
    expect(life(game)).toBe(27);
  });
});

describe("enters from exile", () => {
  it("Zuko: a flickered permanent enters from exile; a cast one from the stack", () => {
    const { game } = setUp([ANTI_VENOM]);
    const zuko = game.debugSpawn(ZUKO, A, "battlefield");
    cast(game, ANTI_VENOM);
    expect(fired(game, zuko)).toBe(0);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    run(game, { kind: "flicker", target: 0 }, bears);
    expect(fired(game, zuko)).toBe(1);
  });
});

describe("put onto the battlefield with this ability", () => {
  it("Kodama: what its own ability puts in doesn't trigger it again", () => {
    // Forests to put in, beyond the Islands the rest of the hand holds.
    const { game, a } = setUp(["Forest", "Forest", "Forest"]);
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    const kodama = game.debugSpawn(KODAMA, A, "battlefield");
    const hand = game.handOf(A).length;
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    // One trigger, one land put in — not a chain through the whole hand.
    expect(fired(game, kodama)).toBe(1);
    expect(game.handOf(A).length).toBe(hand - 1);
    const land = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].entry?.by?.source === kodama,
    );
    expect(land).toBeDefined();
  });

  it("…but a land played afterwards does", () => {
    const { game, a } = setUp(["Forest"]);
    a.chooseFromZoneFn = () => [];
    const kodama = game.debugSpawn(KODAMA, A, "battlefield");
    game.dispatch({ type: "play-land", player: A, card: inHand(game, A, "Forest") });
    game.advanceUntil(quiet);
    expect(fired(game, kodama)).toBe(1);
  });
});
