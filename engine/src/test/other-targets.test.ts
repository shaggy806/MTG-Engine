/**
 * "**Another** target …" — the `other` target spec: what its inner spec
 * accepts, less the ability's own source (the default), the object or player
 * the triggering event names, or the target an earlier slot took.
 *
 * Triggered and activated abilities and spells alike; nests either way round
 * with `optional`. `ActivatedAbility.otherOnly` is now only "sacrifice
 * another", so "untap another target artifact" (Manifold Key) is an `other`
 * slot.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef, TargetSpec } from "../target.js";
import { describeTargetSpec, otherSlotConflict, slotOptions } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

/** "When this enters, put a +1/+1 counter on another target creature you
 * control." */
const MENTOR = "Test Entering Mentor";
/** "Whenever another creature you control enters, put a +1/+1 counter on
 * target creature other than that creature." */
const WELCOMER = "Test Welcomer";
/** "Whenever this creature deals combat damage to a player, it deals 1
 * damage to another target player." */
const RICOCHET = "Test Ricochet Striker";
/** "Target creature you control fights another target creature." */
const TRACKER_FIGHT = "Test Tracker Fight";
/** "When this enters, put a +1/+1 counter on up to one other target creature
 * you control." — written `other` around `optional`. */
const UP_TO_ONE = "Test Up To One Other";

const counterOn = (target: number) =>
  ({ kind: "add-counter", target, counter: "+1/+1", amount: 1 }) as const;

const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: MENTOR,
      manaCost: "{0}",
      types: ["creature"],
      power: 1,
      toughness: 1,
      text: "When this enters, put a +1/+1 counter on another target creature you control.",
      triggered: [
        {
          trigger: { on: "enters-battlefield", who: "self" },
          targets: [{ kind: "other", of: "creature-you-control" }],
          effect: counterOn(0),
          resolve: null,
          text: "When this enters, put a +1/+1 counter on another target creature you control.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: WELCOMER,
      manaCost: "{0}",
      types: ["enchantment"],
      text: "Whenever another creature you control enters, put a +1/+1 counter on target creature other than that creature.",
      triggered: [
        {
          trigger: { on: "enters-battlefield", who: "you-control", otherOnly: true, filter: { type: "creature" } },
          targets: [{ kind: "other", of: "creature", than: "trigger-object" }],
          effect: counterOn(0),
          resolve: null,
          text: "Whenever another creature you control enters, put a +1/+1 counter on target creature other than that creature.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: RICOCHET,
      manaCost: "{0}",
      types: ["creature"],
      power: 1,
      toughness: 1,
      text: "Whenever this creature deals combat damage to a player, it deals 1 damage to another target player.",
      triggered: [
        {
          trigger: { on: "deals-combat-damage-to-player", who: "self" },
          targets: [{ kind: "other", of: "player", than: "trigger-player" }],
          effect: { kind: "damage", amount: 1, target: 0 },
          resolve: null,
          text: "Whenever this creature deals combat damage to a player, it deals 1 damage to another target player.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: TRACKER_FIGHT,
      manaCost: "{0}",
      types: ["sorcery"],
      text: "Target creature you control fights another target creature.",
      targets: ["creature-you-control", { kind: "other", of: "creature", than: { slot: 0 } }],
      effect: { kind: "fight", a: 0, b: 1 },
    }),
  )
  .register(
    defineCard({
      name: UP_TO_ONE,
      manaCost: "{0}",
      types: ["creature"],
      power: 1,
      toughness: 1,
      text: "When this enters, put a +1/+1 counter on up to one other target creature you control.",
      triggered: [
        {
          trigger: { on: "enters-battlefield", who: "self" },
          targets: [{ kind: "other", of: { kind: "optional", of: "creature-you-control" } }],
          effect: counterOn(0),
          resolve: null,
          text: "When this enters, put a +1/+1 counter on up to one other target creature you control.",
        },
      ],
    }),
  );

const setUp = (aHand: readonly string[] = [], players: readonly PlayerId[] = [A, B]) => {
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)]));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((player) => ({
      player,
      cards: [...(player === A ? aHand : []), ...Array<string>(40).fill("Island")],
    })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a: controllers[A] as ScriptedController };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
const counters = (game: Game, id: ObjectId): number => game.state.objects[id].counters["+1/+1"] ?? 0;
const objectIds = (refs: readonly TargetRef[]): ObjectId[] =>
  refs.flatMap((r) => (r.kind === "object" ? [r.object] : []));
const enter = (game: Game, name: string): ObjectId => {
  const id = game.debugSpawn(name, A, "battlefield", { announceEntry: true });
  game.advanceUntil(quiet);
  return id;
};

describe("another target — not the source", () => {
  it("an enters trigger's 'another target creature you control' can't pick the creature itself", () => {
    const { game, a } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    let offered: readonly TargetRef[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, options) => {
      offered = options[0];
      return [options[0][0]];
    };
    const mentor = enter(game, MENTOR);
    // One legal option left, so it's filled in without a question.
    expect(offered).toEqual([]);
    expect(counters(game, bears)).toBe(1);
    expect(counters(game, mentor)).toBe(0);
  });

  it("with nothing else to target, the trigger is removed", () => {
    const { game } = setUp();
    const mentor = enter(game, MENTOR);
    expect(counters(game, mentor)).toBe(0);
    expect(game.eventsOfType("trigger-removed")).toHaveLength(1);
  });

  it("'up to one other target' may still be left empty, and still isn't the source", () => {
    const { game, a } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", A, "battlefield");
    let offered: readonly ObjectId[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, options) => {
      offered = objectIds(options[0]);
      return [null];
    };
    const upToOne = enter(game, UP_TO_ONE);
    expect(offered).toEqual(expect.arrayContaining([bears, giant]));
    expect(offered).not.toContain(upToOne);
    expect(counters(game, bears) + counters(game, giant)).toBe(0);
  });

  it("Manifold Key can't untap itself", () => {
    const { game } = setUp();
    const key = game.debugSpawn("Manifold Key", A, "battlefield", { tapped: true });
    const other = game.debugSpawn("Manifold Key", A, "battlefield", { tapped: true });
    game.debugSpawn("Island", A, "battlefield");
    // Untap the first Key by hand: the ability on the second one is what's asked.
    game.state.objects[key].tapped = false;
    const offer = game
      .legalActions(A)
      .find((o) => o.kind === "activate-ability" && o.source === key && o.abilityIndex === 0);
    expect(offer?.kind === "activate-ability" ? objectIds(offer.targetOptions[0]) : []).toEqual([other]);
    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: key,
        abilityIndex: 0,
        targets: [{ kind: "object", object: key }],
      }),
    ).toThrow();
  });
});

describe("another target — not the triggering object or player", () => {
  it("'target creature other than that creature' leaves out the one that entered", () => {
    const { game, a } = setUp();
    game.debugSpawn(WELCOMER, A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    let offered: readonly ObjectId[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, options) => {
      offered = objectIds(options[0]);
      return [options[0][0]];
    };
    const giant = enter(game, "Hill Giant");
    expect(offered).toEqual([]);
    expect(counters(game, bears)).toBe(1);
    expect(counters(game, giant)).toBe(0);
  });

  it("'another target player' leaves out the player the event names", () => {
    const { game, a } = setUp([], [A, B, C]);
    const striker = game.debugSpawn(RICOCHET, A, "battlefield", { summoningSick: false });
    let offered: readonly PlayerId[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, options) => {
      offered = options[0].flatMap((r) => (r.kind === "player" ? [r.player] : []));
      return [{ kind: "player", player: C }];
    };
    a.declareAttackersFn = () => [{ attacker: striker, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(offered).toEqual([A, C]);
    expect(game.state.players[B].life).toBe(19);
    expect(game.state.players[C].life).toBe(19);
  });
});

describe("another target — not an earlier slot's", () => {
  const specs: readonly TargetSpec[] = [
    "creature-you-control",
    { kind: "other", of: "creature", than: { slot: 0 } },
  ];

  it("the pair is checked together, and a chooser narrows the second slot", () => {
    const { game } = setUp([TRACKER_FIGHT]);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", B, "battlefield");
    const spell = game.handOf(A).find((id) => game.state.objects[id].cardName === TRACKER_FIGHT)!;
    const offer = game.legalActions(A).find((o) => o.kind === "cast-spell" && o.card === spell);
    if (offer?.kind !== "cast-spell") throw new Error("expected the fight to be castable");
    // Each slot lists everything it could hold on its own…
    expect(objectIds(offer.targetOptions[1])).toEqual(expect.arrayContaining([bears, giant]));
    // …and a chooser that took the Bears for the first leaves them out of the second.
    const second = slotOptions(offer.targetSpecs, offer.targetOptions, 1, [{ kind: "object", object: bears }]);
    expect(objectIds(second)).toEqual([giant]);

    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: spell,
        targets: [
          { kind: "object", object: bears },
          { kind: "object", object: bears },
        ],
      }),
    ).toThrow(/another/);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: spell,
      targets: [
        { kind: "object", object: bears },
        { kind: "object", object: giant },
      ],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("graveyard");
  });

  it("the helpers read an optional slot and a skipped one", () => {
    const bear: TargetRef = { kind: "object", object: "b" as ObjectId };
    expect(otherSlotConflict(specs, [bear, bear])).toEqual({ slot: 1, than: 0 });
    expect(otherSlotConflict(specs, [null, bear])).toBeNull();
    expect(describeTargetSpec({ kind: "other", of: "creature" })).toBe("another creature");
  });
});
