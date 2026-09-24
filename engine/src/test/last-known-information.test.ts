/**
 * Last-known information for a permanent that has left the battlefield
 * (rules 603.10a, 608.2h).
 *
 * `moveObject` snapshots a permanent's computed characteristics as it leaves
 * (`GameObject.lastKnown`) — before the move resets control, counters,
 * modifiers and any copy effect — and every reader that asks about a
 * departed permanent reads that snapshot:
 *
 * - a leaves-the-battlefield trigger's filter and the permanent's own
 *   abilities, as the event happens (an animated land dying is a creature
 *   dying; a creature that had lost its abilities fires no dies trigger; a
 *   granted dies trigger still fires);
 * - a resolving ability's "its power", "that creature's controller", and the
 *   keywords of a source that has gone (Juri, Elenda);
 * - the permanent sacrificed to pay a cost (Dina, Soul Steeper).
 *
 * The victims of one simultaneous event are all snapshotted before the first
 * of them moves, a token that ceases to exist keeps its snapshot for the
 * turn, and a reference names the battlefield stint it means, so a card that
 * left and came back isn't read through the wrong one.
 */
import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import type { CardRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { matchesFilter } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { cloneGameState } from "../state.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** "Creatures you control have 'When this creature dies, you gain 2 life.'"
 * — a static that grants a dies trigger, which no pool card does yet. */
const graveWarden = defineCard({
  name: "Test Grave Warden",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: 'Creatures you control have "When this creature dies, you gain 2 life."',
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantsTriggered: [
        {
          trigger: { on: "dies", who: "self" },
          targets: [],
          effect: { kind: "gain-life", amount: 2 },
          resolve: null,
          text: "When this creature dies, you gain 2 life.",
        },
      ],
      text: 'Creatures you control have "When this creature dies, you gain 2 life."',
    },
  ],
});

/** The rest of the sacrificed-permanent vocabulary: the `sacrificed`
 * condition and `sharesCardTypeWith`. */
const altar = defineCard({
  name: "Test Reliquary Altar",
  manaCost: "{1}",
  types: ["artifact"],
  text:
    "{T}, Sacrifice another permanent: If it was a Bear, draw a card. Destroy each permanent " +
    "that shares a card type with it.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { controlledBy: "you" } } },
      otherOnly: true,
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "conditional",
            condition: { kind: "sacrificed", filter: { subtype: "Bear" } },
            then: { kind: "draw", amount: 1 },
          },
          { kind: "destroy-all", filter: { sharesCardTypeWith: "sacrificed" } },
        ],
      },
      resolve: null,
      text:
        "{T}, Sacrifice another permanent: If it was a Bear, draw a card. Destroy each " +
        "permanent that shares a card type with it.",
    },
  ],
});

/** "Sacrifice ~. If you do, you gain life equal to its power" — a
 * `sacrifice-source` step whose tail reads the sacrificed creature. */
const martyr = defineCard({
  name: "Test Martyr",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human"],
  power: 1,
  toughness: 1,
  text: "{0}: Sacrifice Test Martyr. If you do, you gain life equal to its power.",
  activated: [
    {
      cost: { mana: "{0}", tap: false },
      targets: [],
      effect: {
        kind: "sacrifice-source",
        then: { kind: "gain-life", amount: { powerOf: "sacrificed" } },
      },
      resolve: null,
      text: "{0}: Sacrifice Test Martyr. If you do, you gain life equal to its power.",
    },
  ],
});

/** A dies trigger whose `conditional`s ask about the creature that died —
 * which, when it was a token, has ceased to exist (rule 111.7) by the time
 * the trigger resolves, leaving only its snapshot to answer. */
const keepsake = defineCard({
  name: "Test Keepsake",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  text:
    "When this creature dies, if it had a +1/+1 counter on it, you gain 5 life. " +
    "If it was a Spirit, you gain 3 life.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "conditional",
            condition: {
              kind: "self-counters",
              counter: "+1/+1",
              compare: { op: "gte", n: 1 },
            },
            then: { kind: "gain-life", amount: 5 },
          },
          {
            kind: "conditional",
            condition: { kind: "source", filter: { subtype: "Spirit" } },
            then: { kind: "gain-life", amount: 3 },
          },
        ],
      },
      resolve: null,
      text:
        "When this creature dies, if it had a +1/+1 counter on it, you gain 5 life. " +
        "If it was a Spirit, you gain 3 life.",
    },
  ],
});

const registry = (): CardRegistry =>
  createDefaultRegistry()
    .register(graveWarden)
    .register(altar)
    .register(martyr)
    .register(keepsake);

const setUp = (configure?: (a: ScriptedController, b: ScriptedController) => void) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  configure?.(a, b);
  const reg = registry();
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry: reg,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Swamp") },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b, reg };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.pendingSacrifices.length === 0 &&
  s.pendingSacrificeVictims.length === 0;
/** On to this turn's postcombat main with everything resolved — a board
 * changed by `debugApplyEffect` runs no state-based actions and places no
 * triggers until the game is advanced. */
const settle = (game: Game): void =>
  game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const ref = (object: ObjectId): TargetRef => ({ kind: "object", object });
const apply = (game: Game, effect: EffectSpec, ...targets: ObjectId[]): void =>
  game.debugApplyEffect(A, effect, targets.map(ref));
const counters = (game: Game, id: ObjectId, amount: number): void =>
  apply(game, { kind: "add-counter", target: 0, counter: "+1/+1", amount }, id);
const pump = (game: Game, id: ObjectId, power: number): void =>
  apply(game, { kind: "modify-pt", target: 0, power, toughness: 0, duration: "end-of-turn" }, id);
const destroy = (game: Game, id: ObjectId): void => apply(game, { kind: "destroy", target: 0 }, id);
const wrath = (game: Game): void =>
  apply(game, { kind: "destroy-all", filter: { type: "creature" } });
const triggersOf = (game: Game, source: ObjectId): number =>
  game.state.eventLog.filter((e) => e.type === "ability-triggered" && e.source === source).length;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const permanentsCounted = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const tokens = (game: Game, name: string, count: number): ObjectId[] => {
  const before = new Set(game.battlefield);
  apply(game, { kind: "create-token", token: name, count });
  return game.battlefield.filter((id) => !before.has(id));
};
const reanimate = (game: Game, id: ObjectId): void =>
  apply(game, { kind: "put-onto-battlefield", target: 0 }, id);
const abilityOnStackFrom = (source: ObjectId) => (s: GameState): boolean =>
  s.zones.shared.stack.some(
    (id) => s.objects[id]?.kind === "ability" && s.objects[id].sourceObjectId === source,
  );
/** Juri's "deals damage equal to its power to any target" aims at Bob. */
const aimAtBob = (a: ScriptedController): void => {
  a.chooseTargetsFn = () => [{ kind: "player", player: B }];
};

describe("a leaves-the-battlefield trigger matches the permanent as it last existed (603.10a)", () => {
  it("an animated land that dies was a creature dying", () => {
    const { game } = setUp();
    game.debugSpawn("Zulaport Cutthroat", A);
    const land = game.debugSpawn("Swamp", A);
    apply(
      game,
      {
        kind: "animate",
        target: 0,
        power: 3,
        toughness: 3,
        addTypes: ["creature"],
        addSubtypes: ["Elemental"],
        duration: "end-of-turn",
      },
      land,
    );

    destroy(game, land);
    settle(game);

    // In the graveyard it's a Swamp card, but it died a creature.
    expect(game.state.objects[land].zone).toBe("graveyard");
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(21);
  });

  it("a creature an effect made a Saproling triggers Slimefoot; a Saproling made a Bear doesn't", () => {
    const { game } = setUp();
    const slimefoot = game.debugSpawn("Slimefoot, the Stowaway", A);
    const bears = game.debugSpawn("Grizzly Bears", A);
    const [saproling] = tokens(game, "Saproling Token", 1);
    const becomes = (subtype: string): EffectSpec => ({
      kind: "animate",
      target: 0,
      power: 2,
      toughness: 2,
      addTypes: [],
      addSubtypes: [],
      setSubtypes: [subtype],
      duration: "end-of-turn",
    });
    apply(game, becomes("Saproling"), bears);
    apply(game, becomes("Bear"), saproling);

    destroy(game, bears);
    destroy(game, saproling);
    settle(game);

    expect(triggersOf(game, slimefoot)).toBe(1);
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(21);
  });

  it("a creature that had lost all its abilities fires no dies trigger of its own", () => {
    const { game, reg } = setUp(aimAtBob);
    const juri = game.debugSpawn("Juri, Master of the Revue", A);
    counters(game, juri, 2);
    // Turn to Frog: "loses all abilities and becomes a blue Frog with base
    // power and toughness 1/1".
    const frog = reg.get("Turn to Frog").effect as EffectSpec;
    apply(game, frog, juri);

    destroy(game, juri);
    settle(game);

    expect(game.state.objects[juri].zone).toBe("graveyard");
    expect(triggersOf(game, juri)).toBe(0);
    expect(life(game, B)).toBe(20);
  });

  it("a trigger from before its source lost its abilities and died still goes on the stack (113.7a)", () => {
    const { game } = setUp();
    const zulaport = game.debugSpawn("Zulaport Cutthroat", A);
    const bears = game.debugSpawn("Grizzly Bears", A);
    // One resolution: the Bears die (Zulaport triggers), then Zulaport loses
    // its abilities and becomes a 0/0 — dying to the next state-based check,
    // before its trigger is put on the stack.
    apply(
      game,
      {
        kind: "sequence",
        effects: [
          { kind: "destroy", target: 0 },
          {
            kind: "animate",
            target: 1,
            power: 0,
            toughness: 0,
            addTypes: [],
            addSubtypes: [],
            loseAbilities: true,
            duration: "end-of-turn",
          },
        ],
      },
      bears,
      zulaport,
    );
    settle(game);

    expect(game.state.objects[zulaport].zone).toBe("graveyard");
    // The Bears' trigger resolves; Zulaport's own death, abilityless, fires none.
    expect(triggersOf(game, zulaport)).toBe(1);
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(21);
  });

  it("a dies trigger granted by a static fires while the grantor stays behind", () => {
    const { game } = setUp();
    game.debugSpawn("Test Grave Warden", A);
    const bears = game.debugSpawn("Grizzly Bears", A);

    destroy(game, bears);
    settle(game);

    expect(life(game, A)).toBe(22);
  });

  it("…and when the grantor leaves in the same event", () => {
    const { game } = setUp();
    game.debugSpawn("Test Grave Warden", A);
    game.debugSpawn("Grizzly Bears", A);

    apply(game, { kind: "destroy-all", filter: { typesAnyOf: ["creature", "enchantment"] } });
    settle(game);

    expect(life(game, A)).toBe(22);
  });

  it("a one-shot granted dies trigger survives the move that clears its modifiers", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A);
    apply(
      game,
      {
        kind: "grant-triggered",
        target: 0,
        ability: {
          trigger: { on: "dies", who: "self" },
          targets: [],
          effect: { kind: "gain-life", amount: 3 },
          resolve: null,
          text: "When this creature dies, you gain 3 life.",
        },
        duration: "end-of-turn",
      },
      bears,
    );

    destroy(game, bears);
    settle(game);

    expect(life(game, A)).toBe(23);
  });

  it("Saproling tokens that died with Slimefoot each trigger it, and outlive their deletion", () => {
    const { game, reg } = setUp();
    const slimefoot = game.debugSpawn("Slimefoot, the Stowaway", A);
    const saprolings = tokens(game, "Saproling Token", 3);

    wrath(game);
    settle(game);

    // The ruling: once per Saproling, though Slimefoot died too — and it
    // deals the damage as it last existed.
    expect(game.state.objects[slimefoot].zone).toBe("graveyard");
    expect(triggersOf(game, slimefoot)).toBe(3);
    expect(life(game, B)).toBe(17);
    expect(life(game, A)).toBe(23);
    // The tokens have ceased to exist (rule 111.7), but not their snapshots.
    for (const id of saprolings) {
      expect(game.state.objects[id]).toBeUndefined();
      expect(game.state.ceasedTokens?.[id]?.subtypes).toContain("Saproling");
      expect(
        matchesFilter(game.state, reg, id, { subtype: "Saproling", controlledBy: "you" }, {
          you: A,
          lastKnown: true,
        }),
      ).toBe(true);
    }
  });
});

describe("a resolving ability reads a departed permanent as it last existed (608.2h)", () => {
  it("Juri deals damage equal to the power it died with, counters and pumps included", () => {
    const { game } = setUp(aimAtBob);
    const juri = game.debugSpawn("Juri, Master of the Revue", A);
    counters(game, juri, 2);
    pump(game, juri, 3);

    destroy(game, juri);
    settle(game);

    expect(life(game, B)).toBe(20 - 6);
  });

  it("Juri with power 0 or less deals no damage", () => {
    const { game } = setUp(aimAtBob);
    const juri = game.debugSpawn("Juri, Master of the Revue", A);
    pump(game, juri, -3);

    destroy(game, juri);
    settle(game);

    expect(triggersOf(game, juri)).toBe(1);
    expect(life(game, B)).toBe(20);
  });

  it("Juri counts a counter for each permanent sacrificed before it died", () => {
    const { game } = setUp(aimAtBob);
    const juri = game.debugSpawn("Juri, Master of the Revue", A);
    for (let i = 0; i < 2; i += 1) {
      const bears = game.debugSpawn("Grizzly Bears", A);
      apply(game, { kind: "sacrifice-target", target: 0 }, bears);
      settle(game);
    }
    expect(game.state.objects[juri].counters["+1/+1"]).toBe(2);

    destroy(game, juri);
    settle(game);

    expect(life(game, B)).toBe(20 - 3);
  });

  it("a token's dies trigger answers conditions about itself after it has ceased to exist", () => {
    const { game } = setUp();
    const [token] = tokens(game, "Test Keepsake", 1);
    counters(game, token, 1);

    destroy(game, token);
    settle(game);

    expect(game.state.objects[token]).toBeUndefined();
    expect(triggersOf(game, token)).toBe(1);
    expect(life(game, A)).toBe(20 + 5 + 3);
  });

  it("…exactly as the same card does, which is still in the graveyard", () => {
    const { game } = setUp();
    const card = game.debugSpawn("Test Keepsake", A);
    counters(game, card, 1);

    destroy(game, card);
    settle(game);

    expect(game.state.objects[card].zone).toBe("graveyard");
    expect(life(game, A)).toBe(20 + 5 + 3);
  });

  it("Elenda makes a Vampire for each point of power she died with", () => {
    const { game } = setUp();
    const elenda = game.debugSpawn("Elenda, the Dusk Rose", A);
    for (const id of [game.debugSpawn("Grizzly Bears", B), game.debugSpawn("Grizzly Bears", B)]) {
      destroy(game, id);
      settle(game);
    }
    expect(game.state.objects[elenda].counters["+1/+1"]).toBe(2);

    destroy(game, elenda);
    settle(game);

    expect(permanentsCounted(game, "Lifelink Vampire Token")).toBe(3);
  });

  it("Elenda dying alongside other creatures gets none of their counters (the ruling)", () => {
    const { game } = setUp();
    const elenda = game.debugSpawn("Elenda, the Dusk Rose", A);
    game.debugSpawn("Grizzly Bears", A);
    game.debugSpawn("Grizzly Bears", B);

    wrath(game);
    settle(game);

    // Both "another creature dies" abilities trigger, but find her gone.
    expect(triggersOf(game, elenda)).toBe(3);
    expect(permanentsCounted(game, "Lifelink Vampire Token")).toBe(1);
  });

  for (const order of ["first", "last"] as const) {
    it(`a lord and the creatures it pumps are snapshotted before any of them moves (lord moved ${order})`, () => {
      const { game } = setUp(aimAtBob);
      let maja: ObjectId | undefined;
      if (order === "first") maja = game.debugSpawn("Maja, Bretagard Protector", A);
      const juri = game.debugSpawn("Juri, Master of the Revue", A);
      const bears = game.debugSpawn("Grizzly Bears", A);
      if (order === "last") maja = game.debugSpawn("Maja, Bretagard Protector", A);

      wrath(game);
      settle(game);

      // Juri died a 2/2 with Maja's +1/+1, whichever of them the engine
      // moved first.
      expect(life(game, B)).toBe(20 - 2);
      expect(game.state.objects[bears].lastKnown?.power).toBe(3);
      expect(game.state.objects[maja as ObjectId].lastKnown?.power).toBe(2);
    });
  }

  it("a commander in the wrath is read as the wrath began, however long its owner takes", () => {
    const a = new ScriptedController(A);
    aimAtBob(a);
    a.commanderReplacementFn = () => false;
    const game = Game.create({
      seed: 1,
      shuffle: false,
      registry: registry(),
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: a, [B]: new ScriptedController(B) },
      decks: [
        {
          player: A,
          cards: Array<string>(40).fill("Swamp"),
          commander: "Juri, Master of the Revue",
        },
        { player: B, cards: Array<string>(40).fill("Forest") },
      ],
    });
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
    // Maja first, so the wrath moves her before it gets to Juri — whose own
    // move then waits on Alice's 903.9a answer.
    game.debugSpawn("Maja, Bretagard Protector", A);
    game.debugSpawn("Swamp", A);
    game.debugSpawn("Mountain", A);
    const juri = game.state.zones.shared.command.find(
      (id) => game.state.objects[id].owner === A,
    ) as ObjectId;
    game.dispatch({ type: "cast-spell", player: A, card: juri, targets: [] });
    settle(game);
    expect(game.state.objects[juri].zone).toBe("battlefield");

    wrath(game);
    settle(game);

    expect(game.state.objects[juri].zone).toBe("graveyard");
    expect(life(game, B)).toBe(20 - 2);
  });

  it("a source that died with lifelink and deathtouch still has them for the damage it deals", () => {
    const { game } = setUp((a) => {
      a.chooseTargetsFn = (_view, _source, _specs, options) => {
        const bears = options[0].find(
          (o) => o.kind === "object" && game.state.objects[o.object].cardName === "Grizzly Bears",
        );
        return [bears as TargetRef];
      };
    });
    const juri = game.debugSpawn("Juri, Master of the Revue", A);
    const collar = game.debugSpawn("Basilisk Collar", A);
    game.state.objects[collar].attachedTo = juri;
    const bears = game.debugSpawn("Grizzly Bears", B);

    destroy(game, juri);
    settle(game);

    // One damage from a deathtoucher kills the 2/2; lifelink gains Alice 1.
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(life(game, A)).toBe(21);
  });
});

describe("the sacrificed permanent (Dina, Soul Steeper)", () => {
  const withDina = () => {
    const env = setUp(aimAtBob);
    const dina = env.game.debugSpawn("Dina, Soul Steeper", A, "battlefield", {
      summoningSick: false,
    });
    env.game.debugSpawn("Swamp", A);
    const activate = (victim: ObjectId): void => {
      env.game.dispatch({
        type: "activate-ability",
        player: A,
        source: dina,
        abilityIndex: 0,
        targets: [],
        sacrifice: victim,
      });
      settle(env.game);
    };
    const power = (): number => env.game.characteristics(dina).power;
    return { ...env, dina, activate, power };
  };

  it("gets +X/+0 for the power the creature had on the battlefield", () => {
    const { game, activate, power } = withDina();
    const bears = game.debugSpawn("Grizzly Bears", A);
    counters(game, bears, 2);

    activate(bears);

    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(power()).toBe(1 + 4);
  });

  it("reads a sacrificed token that has ceased to exist by the time it resolves", () => {
    const { game, activate, power } = withDina();
    const [saproling] = tokens(game, "Saproling Token", 1);
    pump(game, saproling, 2);

    activate(saproling);

    expect(game.state.objects[saproling]).toBeUndefined();
    expect(power()).toBe(1 + 3);
  });

  it("sacrificing Juri: Dina gets its power, and Juri's own trigger deals it", () => {
    const { game, activate, power } = withDina();
    const juri = game.debugSpawn("Juri, Master of the Revue", A);
    counters(game, juri, 2);

    activate(juri);

    // Juri's "whenever you sacrifice a permanent" saw its own sacrifice, but
    // found it gone; its dies trigger deals the 3 it died with.
    expect(power()).toBe(1 + 3);
    expect(life(game, B)).toBe(20 - 3);
  });

  it("whenever Alice gains life, each opponent loses 1", () => {
    const { game } = withDina();
    apply(game, { kind: "gain-life", amount: 5 });
    settle(game);
    expect(life(game, B)).toBe(19);
  });

  it("the sacrificed condition and sharesCardTypeWith read the snapshot", () => {
    const { game } = setUp();
    const altarId = game.debugSpawn("Test Reliquary Altar", A);
    const bears = game.debugSpawn("Grizzly Bears", A);
    const theirs = game.debugSpawn("Grizzly Bears", B);
    const artifact = game.debugSpawn("Basilisk Collar", B);
    const hand = game.handOf(A).length;

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: altarId,
      abilityIndex: 0,
      targets: [],
      sacrifice: bears,
    });
    settle(game);

    expect(game.handOf(A).length).toBe(hand + 1);
    expect(game.state.objects[theirs].zone).toBe("graveyard");
    expect(game.state.objects[artifact].zone).toBe("battlefield");
  });

  it("a sacrifice-source step's tail reads the source as it was sacrificed", () => {
    const { game } = setUp();
    const martyrId = game.debugSpawn("Test Martyr", A, "battlefield", { summoningSick: false });
    counters(game, martyrId, 3);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: martyrId,
      abilityIndex: 0,
      targets: [],
    });
    settle(game);

    expect(game.state.objects[martyrId].zone).toBe("graveyard");
    expect(life(game, A)).toBe(24);
  });
});

describe("the player who sacrifices a permanent is its controller, not its owner (701.21a)", () => {
  /** Alice and Bob each control a Juri, and Alice has taken `name` from Bob. */
  const stolenFromBob = (name: string) => {
    const env = setUp();
    const alices = env.game.debugSpawn("Juri, Master of the Revue", A);
    const bobs = env.game.debugSpawn("Juri, Master of the Revue", B);
    const victim = env.game.debugSpawn(name, B);
    apply(env.game, { kind: "gain-control", target: 0, untilEndOfTurn: true }, victim);
    settle(env.game);
    expect(env.game.state.objects[victim].controller).toBe(A);
    /** Alice sacrificed it, so her Juri counts it and Bob's doesn't. */
    const sacrificedByAlice = (): void => {
      expect(env.game.state.eventLog).toContainEqual(
        expect.objectContaining({ type: "permanent-sacrificed", object: victim, player: A }),
      );
      expect(env.game.state.objects[alices].counters["+1/+1"] ?? 0).toBe(1);
      expect(env.game.state.objects[bobs].counters["+1/+1"] ?? 0).toBe(0);
    };
    return { ...env, victim, sacrificedByAlice };
  };

  it("sacrificed to pay a spell's additional cost (Village Rites)", () => {
    const { game, victim, sacrificedByAlice } = stolenFromBob("Grizzly Bears");
    game.debugSpawn("Swamp", A);
    const rites = game.debugSpawn("Village Rites", A, "hand");

    game.dispatch({ type: "cast-spell", player: A, card: rites, sacrifice: victim });
    settle(game);

    expect(game.state.objects[victim].zone).toBe("graveyard");
    sacrificedByAlice();
  });

  it("sacrificed for mana (a Treasure)", () => {
    const { game, victim, sacrificedByAlice } = stolenFromBob("Treasure Token");
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
    });
    settle(game);

    expect(life(game, B)).toBe(17);
    sacrificedByAlice();
  });

  it("sacrificing itself by a sacrifice-source step", () => {
    const { game, victim, sacrificedByAlice } = stolenFromBob("Test Martyr");

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: victim,
      abilityIndex: 0,
      targets: [],
    });
    settle(game);

    expect(game.state.objects[victim].zone).toBe("graveyard");
    sacrificedByAlice();
  });

  it("sacrificed by a sacrifice-target effect", () => {
    const { game, victim, sacrificedByAlice } = stolenFromBob("Grizzly Bears");

    apply(game, { kind: "sacrifice-target", target: 0 }, victim);
    settle(game);

    expect(game.state.objects[victim].zone).toBe("graveyard");
    sacrificedByAlice();
  });
});

describe("Elas il-Kor, Sadistic Pilgrim", () => {
  it("gains 1 life for each other creature Alice's that enters, not for itself", () => {
    const { game } = setUp();
    game.debugSpawn("Elas il-Kor, Sadistic Pilgrim", A, "battlefield", { announceEntry: true });
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    game.debugSpawn("Grizzly Bears", B, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, A)).toBe(21);
  });

  it("drains for other creatures of hers that die — as they were, and alongside her", () => {
    const { game } = setUp();
    const elas = game.debugSpawn("Elas il-Kor, Sadistic Pilgrim", A);
    game.debugSpawn("Grizzly Bears", A);
    game.debugSpawn("Grizzly Bears", B);
    // Bob's creature, but Alice's as it dies.
    const stolen = game.debugSpawn("Grizzly Bears", B);
    apply(game, { kind: "gain-control", target: 0, untilEndOfTurn: true }, stolen);
    // A land that is a creature only until end of turn.
    const land = game.debugSpawn("Swamp", A);
    apply(
      game,
      {
        kind: "animate",
        target: 0,
        power: 1,
        toughness: 1,
        addTypes: ["creature"],
        addSubtypes: [],
        duration: "end-of-turn",
      },
      land,
    );

    wrath(game);
    settle(game);

    // Her own Bears, the stolen one and the animated land — not Bob's own
    // Bears, and not Elas herself.
    expect(game.state.objects[elas].zone).toBe("graveyard");
    expect(triggersOf(game, elas)).toBe(3);
    expect(life(game, B)).toBe(17);
  });
});

describe("a card that left and came back", () => {
  it("Juri reanimated in response: its trigger still deals the power it died with", () => {
    const { game } = setUp(aimAtBob);
    const juri = game.debugSpawn("Juri, Master of the Revue", A);
    counters(game, juri, 2);
    destroy(game, juri);
    game.advanceUntil(abilityOnStackFrom(juri));

    reanimate(game, juri);
    expect(game.state.objects[juri].zone).toBe("battlefield");
    settle(game);

    // The new Juri is a 1/1; the one that died was a 3/3.
    expect(game.characteristics(juri).power).toBe(1);
    expect(life(game, B)).toBe(20 - 3);
  });

  it("is read as the new object, not through the snapshot of its earlier death", () => {
    const { game } = setUp(aimAtBob);
    const dina = game.debugSpawn("Dina, Soul Steeper", A, "battlefield", { summoningSick: false });
    game.debugSpawn("Swamp", A);
    const bears = game.debugSpawn("Grizzly Bears", A);
    counters(game, bears, 3);
    destroy(game, bears);
    settle(game);
    expect(game.state.objects[bears].lastKnown?.power).toBe(5);
    reanimate(game, bears);
    settle(game);
    counters(game, bears, 1);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: dina,
      abilityIndex: 0,
      targets: [],
      sacrifice: bears,
    });
    settle(game);

    // Sacrificed as the 3/3 it was this time — not the 5/5 it died as
    // before, nor the 2/2 card in the graveyard.
    expect(game.characteristics(dina).power).toBe(1 + 3);
  });
});

describe("snapshot and restore", () => {
  it("round-trips last-known information and ceased tokens", () => {
    const configure = (a: ScriptedController) => aimAtBob(a);
    const { game } = setUp(configure);
    game.debugSpawn("Slimefoot, the Stowaway", A);
    const [saproling] = tokens(game, "Saproling Token", 1);
    destroy(game, saproling);
    settle(game);
    const juri = game.debugSpawn("Juri, Master of the Revue", A);
    counters(game, juri, 2);
    destroy(game, juri);
    game.advanceUntil(abilityOnStackFrom(juri));

    const snap = game.snapshot();
    expect(snap.objects[juri].lastKnown?.power).toBe(3);
    expect(snap.ceasedTokens?.[saproling]?.subtypes).toEqual(["Saproling"]);
    expect(cloneGameState(snap)).toStrictEqual(structuredClone(snap));

    const a = new ScriptedController(A);
    configure(a);
    const restored = Game.fromSnapshot(snap, {
      registry: registry(),
      controllers: { [A]: a, [B]: new ScriptedController(B) },
    });
    expect(restored.state.objects[juri].lastKnown).toStrictEqual(game.state.objects[juri].lastKnown);
    settle(game);
    settle(restored);
    expect(life(restored, B)).toBe(life(game, B));
    expect(life(restored, B)).toBe(20 - 1 - 3);
  });
});
