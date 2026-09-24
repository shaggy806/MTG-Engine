/**
 * Reflexive triggered abilities (rule 603.12): "you may pay {2}. **When you
 * do**, return target creature card with power 3 or less from your graveyard
 * to the battlefield tapped" (Terra, Herald of Hope).
 *
 * The `reflexive-trigger` effect doesn't do anything itself: it triggers an
 * ability that goes on the stack once the spell or ability that made it has
 * finished resolving — the next time a player would receive priority — and
 * chooses its targets then, so unlike a `may`'s `then` it can target, and
 * players can respond to it. Its source, controller and X are the creating
 * ability's.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetSpec } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const SMALL_CREATURE_CARD: TargetSpec = {
  kind: "card-in-graveyard",
  whose: "you",
  filter: { type: "creature", power: { op: "lte", n: 3 } },
};

/** "Whenever this creature deals combat damage to a player, you may pay {2}.
 * When you do, return target creature card with power 3 or less from your
 * graveyard to the battlefield tapped." */
const HOPE = "Test Herald of Hope";
/** "{X}, {T}: You may pay {X} again. When you do, target creature gets -X/-X
 * until end of turn." — a reflexive ability reading the X paid for its
 * parent's choice. */
const WITHER = "Test Reflexive Wither";

const whenYouDo = (targets: readonly TargetSpec[], effect: EffectSpec, text: string): EffectSpec => ({
  kind: "reflexive-trigger",
  targets,
  effect,
  text,
});

const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: HOPE,
      manaCost: "{0}",
      types: ["creature"],
      power: 2,
      toughness: 2,
      text: "Whenever this creature deals combat damage to a player, you may pay {2}. When you do, return target creature card with power 3 or less from your graveyard to the battlefield tapped.",
      triggered: [
        {
          trigger: { on: "deals-combat-damage-to-player", who: "self" },
          targets: [],
          effect: {
            kind: "may",
            prompt: "Pay {2}?",
            cost: "{2}",
            effect: whenYouDo(
              [SMALL_CREATURE_CARD],
              { kind: "put-onto-battlefield", target: 0, enterTapped: true },
              "When you do, return target creature card with power 3 or less from your graveyard to the battlefield tapped.",
            ),
          },
          resolve: null,
          text: "Whenever this creature deals combat damage to a player, you may pay {2}. When you do, return target creature card with power 3 or less from your graveyard to the battlefield tapped.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: WITHER,
      manaCost: "{0}",
      types: ["artifact"],
      text: "{T}: You may pay {X}. When you do, target creature gets -X/-X until end of turn.",
      activated: [
        {
          cost: { mana: null, tap: true },
          targets: [],
          effect: {
            kind: "may",
            prompt: "Pay {X}?",
            cost: "{X}",
            effect: whenYouDo(
              ["creature"],
              { kind: "modify-pt", target: 0, power: { product: ["x", -1] }, toughness: { product: ["x", -1] }, duration: "end-of-turn" },
              "When you do, target creature gets -X/-X until end of turn.",
            ),
          },
          resolve: null,
          text: "{T}: You may pay {X}. When you do, target creature gets -X/-X until end of turn.",
        },
      ],
    }),
  );

const setUp = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
const inGraveyard = (game: Game, player: PlayerId, name: string): ObjectId =>
  game.debugSpawn(name, player, "graveyard");
const attackWith = (game: Game, a: ScriptedController, attacker: ObjectId): void => {
  a.declareAttackersFn = () => [{ attacker, defender: B }];
  game.advanceUntil((s) => s.turn.step === "combat-damage" && s.zones.shared.stack.length > 0);
};
const reflexiveOnStack = (s: GameState): boolean =>
  s.zones.shared.stack.some((id) => s.objects[id]?.reflexiveTrigger !== undefined);

describe("'you may pay {2}. When you do, …'", () => {
  it("paying puts a separate ability on the stack, which chooses its target then", () => {
    const { game, a } = setUp();
    const hope = game.debugSpawn(HOPE, A, "battlefield", { summoningSick: false });
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Island", A, "battlefield");
    const bears = inGraveyard(game, A, "Grizzly Bears");
    inGraveyard(game, A, "Colossal Dreadmaw"); // power 6 — not a legal target
    a.chooseModesFn = () => [0];
    attackWith(game, a, hope);

    // The combat-damage trigger resolves; paying makes a *new* ability that
    // waits for the next priority check.
    game.advanceUntil(reflexiveOnStack);
    const stack = game.state.zones.shared.stack;
    expect(stack).toHaveLength(1);
    const ability = game.state.objects[stack[0]];
    expect(ability.sourceObjectId).toBe(hope);
    expect(ability.controller).toBe(A);
    // One legal card: chosen for it, no question asked.
    expect(ability.targets).toEqual([{ kind: "object", object: bears }]);
    // Players get priority with it on the stack — it can be responded to.
    expect(game.state.priority.active).toBe(true);

    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[bears].tapped).toBe(true);
  });

  it("with a choice of targets, asks as it goes on the stack", () => {
    const { game, a } = setUp();
    const hope = game.debugSpawn(HOPE, A, "battlefield", { summoningSick: false });
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Island", A, "battlefield");
    inGraveyard(game, A, "Grizzly Bears");
    const giant = inGraveyard(game, A, "Hill Giant");
    a.chooseModesFn = () => [0];
    let asked: readonly (readonly unknown[])[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, options) => {
      asked = options;
      return [{ kind: "object", object: giant }];
    };
    attackWith(game, a, hope);
    game.advanceUntil(quiet);
    expect(asked).toHaveLength(1);
    expect(asked[0]).toHaveLength(2);
    expect(game.state.objects[giant].zone).toBe("battlefield");
  });

  it("declining triggers nothing", () => {
    const { game, a } = setUp();
    const hope = game.debugSpawn(HOPE, A, "battlefield", { summoningSick: false });
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Island", A, "battlefield");
    const bears = inGraveyard(game, A, "Grizzly Bears");
    a.chooseModesFn = () => [];
    attackWith(game, a, hope);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(game.eventsOfType("ability-triggered")).toHaveLength(1);
    expect(game.state.objects[bears].zone).toBe("graveyard");
  });

  it("with no legal target it is removed as it would go on the stack", () => {
    const { game, a } = setUp();
    const hope = game.debugSpawn(HOPE, A, "battlefield", { summoningSick: false });
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Island", A, "battlefield");
    a.chooseModesFn = () => [0];
    attackWith(game, a, hope);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(game.eventsOfType("trigger-removed")).toHaveLength(1);
  });
});

describe("the reflexive ability resolves as its creator's", () => {
  it("reads the X paid for the choice that made it", () => {
    const { game, a } = setUp();
    const wither = game.debugSpawn(WITHER, A, "battlefield");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Island", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", B, "battlefield");
    a.chooseModesFn = () => [0];
    // Answer the choice with X = 3 by hand: the scripted default pays X = 0.
    game.dispatch({ type: "activate-ability", player: A, source: wither, abilityIndex: 0, targets: [] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [0], xValue: 3 });
    game.advanceUntil(quiet);
    expect(game.state.objects[giant].zone).toBe("graveyard");
  });
});
