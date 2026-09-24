/**
 * Things that happen at the same time count as one event.
 *
 * **Leaving together (rule 603.10a).** A leaves-the-battlefield ability
 * "looks back in time": it triggers on the game as it was just *before* the
 * event. The engine moves the victims of a wrath, a state-based sweep, an
 * edict or an overloaded bounce one at a time, so without help an observer
 * that happened to move early was already gone when the rest went — Zulaport
 * Cutthroat and two Bears under one Wrath of God drained once or three times
 * depending on the order the permanents sat in. Each such event is now one
 * leave batch (`Game.withLeaveBatch`), and every permanent in it sees every
 * other one leave. A permanent that left is read as it last existed on the
 * battlefield: "a creature you control" is whoever controlled it as it died.
 *
 * **Damage dealt at once.** Lifelink gains life once per *source* (two
 * lifelinkers are two gains, one lifelinker hitting several things is one —
 * the Oloro rulings, rule 119.9), and a "whenever this is dealt damage"
 * trigger fires once per permanent however many sources hit it at once
 * (enrage), for the total.
 *
 * And the two commanders that needed the life-gain half: Oloro, Ageless
 * Ascetic and Blech, Loafing Pest.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (
  opts: { aHand?: readonly string[]; commander?: string; configure?: (a: ScriptedController) => void } = {},
) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  opts.configure?.(a);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      {
        player: A,
        cards: [...(opts.aHand ?? []), ...Array<string>(40).fill("Swamp")],
        ...(opts.commander !== undefined ? { commander: opts.commander } : {}),
      },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.pendingSacrifices.length === 0 &&
  s.pendingSacrificeVictims.length === 0;
/** Move on to this turn's postcombat main with everything resolved — for a
 * board changed by `debugApplyEffect`, which runs no state-based actions and
 * places no triggers until the game is advanced. */
const toPostcombat = (s: GameState): boolean => s.turn.step === "postcombat-main" && quiet(s);
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in ${player}'s hand`);
  return id;
};
const spawnMany = (game: Game, name: string, player: PlayerId, n: number): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, player);
};
const triggersOf = (game: Game, source: ObjectId): number =>
  game.state.eventLog.filter((e) => e.type === "ability-triggered" && e.source === source).length;
const destroyAllCreatures = (game: Game): void => {
  game.debugApplyEffect(A, { kind: "destroy-all", filter: { type: "creature" } });
  game.advanceUntil(toPostcombat);
};
const castWrath = (game: Game): void => {
  spawnMany(game, "Plains", A, 4);
  game.dispatch({ type: "cast-spell", player: A, card: inHand(game, A, "Wrath of God"), targets: [] });
  game.advanceUntil(quiet);
};

describe("leaving together — every one of them sees every other one leave (rule 603.10a)", () => {
  for (const order of ["first", "last"] as const) {
    it(`Zulaport Cutthroat and two Bears under one Wrath of God drain three times (Cutthroat moved ${order})`, () => {
      const { game } = setUp({ aHand: ["Wrath of God"] });
      if (order === "first") game.debugSpawn("Zulaport Cutthroat", A);
      spawnMany(game, "Grizzly Bears", A, 2);
      if (order === "last") game.debugSpawn("Zulaport Cutthroat", A);

      castWrath(game);

      expect(life(game, B)).toBe(20 - 3);
      expect(life(game, A)).toBe(20 + 3);
    });

    it(`Blood Artist sees itself and both Bears die (Artist moved ${order})`, () => {
      const { game } = setUp({
        aHand: ["Wrath of God"],
        configure: (a) => {
          a.chooseTargetsFn = () => [{ kind: "player", player: B }];
        },
      });
      let artist: ObjectId | undefined;
      if (order === "first") artist = game.debugSpawn("Blood Artist", A);
      spawnMany(game, "Grizzly Bears", A, 2);
      if (order === "last") artist = game.debugSpawn("Blood Artist", A);

      castWrath(game);

      expect(triggersOf(game, artist as ObjectId)).toBe(3);
      expect(life(game, B)).toBe(20 - 3);
      expect(life(game, A)).toBe(20 + 3);
    });

    it(`"another creature" still leaves out the source itself (Pitiless Plunderer moved ${order})`, () => {
      const { game } = setUp();
      if (order === "first") game.debugSpawn("Pitiless Plunderer", A);
      spawnMany(game, "Grizzly Bears", A, 2);
      if (order === "last") game.debugSpawn("Pitiless Plunderer", A);

      destroyAllCreatures(game);

      const treasures = game.battlefield.filter(
        (id) => game.state.objects[id].cardName === "Treasure Token",
      );
      expect(treasures).toHaveLength(2);
    });

    it(`a token stack that dies with Zulaport counts every token in it (Cutthroat moved ${order})`, () => {
      const { game } = setUp();
      if (order === "first") game.debugSpawn("Zulaport Cutthroat", A);
      game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 10 });
      if (order === "last") game.debugSpawn("Zulaport Cutthroat", A);
      const stack = game.battlefield.find((id) => game.state.objects[id].cardName === "Goblin Token");
      expect(game.state.objects[stack as ObjectId].stackCount).toBe(10);

      destroyAllCreatures(game);

      expect(life(game, B)).toBe(20 - 11);
      expect(life(game, A)).toBe(20 + 11);
    });
  }

  it("a lone death is unchanged: Zulaport by itself drains once", () => {
    const { game } = setUp({ aHand: ["Wrath of God"] });
    game.debugSpawn("Zulaport Cutthroat", A);
    castWrath(game);
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(21);
  });

  it("creatures that die to one damage sweep die together (state-based actions)", () => {
    const { game } = setUp({ aHand: ["Pyroclasm"] });
    const cutthroat = game.debugSpawn("Zulaport Cutthroat", A);
    spawnMany(game, "Grizzly Bears", A, 2);
    spawnMany(game, "Mountain", A, 2);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, A, "Pyroclasm"), targets: [] });
    game.advanceUntil(quiet);

    expect(game.state.objects[cutthroat].zone).toBe("graveyard");
    expect(life(game, B)).toBe(20 - 3);
  });

  it("an edict's victims are sacrificed at once, after every player has chosen", () => {
    // Fleshbag Marauder: Alice chooses Blood Artist over the Marauder, Bob
    // has only his Bears. Both go at the same time, so the Artist sees the
    // Bears die too — it used to be gone before Bob was even asked.
    const { game, a } = setUp({ aHand: ["Fleshbag Marauder"] });
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    const artist = game.debugSpawn("Blood Artist", A);
    const bears = game.debugSpawn("Grizzly Bears", B);
    a.chooseSacrificesFn = () => [artist];
    spawnMany(game, "Swamp", A, 3);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, A, "Fleshbag Marauder"),
      targets: [],
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[artist].zone).toBe("graveyard");
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(triggersOf(game, artist)).toBe(2);
    expect(life(game, B)).toBe(20 - 2);
  });

  it("an overloaded bounce is one event: Vela sees every creature leave", () => {
    const { game } = setUp();
    game.debugSpawn("Vela the Night-Clad", A);
    spawnMany(game, "Grizzly Bears", A, 2);

    game.debugApplyEffect(A, {
      kind: "return-to-hand-all",
      filter: { type: "creature", controlledBy: "you" },
    });
    game.advanceUntil(toPostcombat);

    expect(life(game, B)).toBe(20 - 3);
  });

  it("Grave Pact destroyed alongside the creatures still triggers for each of them", () => {
    const { game } = setUp();
    const pact = game.debugSpawn("Grave Pact", A);
    spawnMany(game, "Grizzly Bears", A, 2);

    game.debugApplyEffect(A, {
      kind: "destroy-all",
      filter: { typesAnyOf: ["creature", "enchantment"] },
    });
    game.advanceUntil(toPostcombat);

    expect(game.state.objects[pact].zone).toBe("graveyard");
    expect(triggersOf(game, pact)).toBe(2);
  });

  describe("a commander in the wrath", () => {
    const withVela = (toCommandZone: boolean) => {
      const { game } = setUp({
        aHand: ["Wrath of God"],
        commander: "Vela the Night-Clad",
        configure: (a) => {
          a.chooseTargetsFn = () => [{ kind: "player", player: B }];
          a.commanderReplacementFn = () => toCommandZone;
        },
      });
      spawnMany(game, "Island", A, 5);
      game.debugSpawn("Swamp", A);
      const vela = game.state.zones.shared.command.find(
        (id) => game.state.objects[id].owner === A,
      ) as ObjectId;
      game.dispatch({ type: "cast-spell", player: A, card: vela, targets: [] });
      game.advanceUntil(quiet);
      expect(game.state.objects[vela].zone).toBe("battlefield");
      const artist = game.debugSpawn("Blood Artist", A);
      game.debugSpawn("Grizzly Bears", A);
      const start = life(game, B);
      castWrath(game);
      return { game, vela, artist, lost: start - life(game, B) };
    };

    it("its move waits for the owner's answer, but it still died with the others", () => {
      const { game, vela, artist, lost } = withVela(false);
      expect(game.state.objects[vela].zone).toBe("graveyard");
      // Blood Artist: itself, the Bears, and Vela.
      expect(triggersOf(game, artist)).toBe(3);
      // Vela: itself, the Artist and the Bears.
      expect(triggersOf(game, vela)).toBe(3);
      expect(lost).toBe(6);
    });

    it("sent to the command zone instead, it didn't die — but it did leave with them", () => {
      const { game, vela, artist, lost } = withVela(true);
      expect(game.state.objects[vela].zone).toBe("command");
      expect(triggersOf(game, artist)).toBe(2);
      expect(triggersOf(game, vela)).toBe(3);
      expect(lost).toBe(5);
    });
  });

  describe("a permanent that left is read as it last existed there", () => {
    const steal = (game: Game, id: ObjectId): void => {
      game.debugApplyEffect(A, { kind: "gain-control", target: 0, untilEndOfTurn: true }, [
        { kind: "object", object: id },
      ]);
      expect(game.state.objects[id].controller).toBe(A);
    };
    const destroy = (game: Game, id: ObjectId): void => {
      game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: id }]);
      game.advanceUntil(toPostcombat);
    };

    it("a stolen creature that dies was a creature you controlled", () => {
      const { game } = setUp();
      game.debugSpawn("Zulaport Cutthroat", A);
      const theirs = game.debugSpawn("Grizzly Bears", B);
      steal(game, theirs);

      destroy(game, theirs);

      // It goes to its owner's graveyard, but Alice controlled it as it died.
      expect(game.state.zones.perPlayer[B].graveyard).toContain(theirs);
      expect(life(game, B)).toBe(19);
      expect(life(game, A)).toBe(21);
    });

    it("the ability of a stolen Zulaport that dies is the thief's", () => {
      const { game } = setUp();
      const cutthroat = game.debugSpawn("Zulaport Cutthroat", B);
      steal(game, cutthroat);

      destroy(game, cutthroat);

      // Alice's drain: Bob loses the life, Alice gains it.
      expect(life(game, B)).toBe(19);
      expect(life(game, A)).toBe(21);
    });

    it("…and so is a stolen creature that dies alongside Alice's own", () => {
      const { game } = setUp();
      const cutthroat = game.debugSpawn("Zulaport Cutthroat", B);
      game.debugSpawn("Grizzly Bears", A);
      steal(game, cutthroat);

      destroyAllCreatures(game);

      // Both drains are Alice's: for the Cutthroat and for her Bears.
      expect(life(game, B)).toBe(20 - 2);
      expect(life(game, A)).toBe(20 + 2);
    });
  });

  it("the legend rule keeps a copy that's staying, not one dying anyway", () => {
    const { game } = setUp();
    const older = game.debugSpawn("Vela the Night-Clad", A);
    game.debugApplyEffect(A, { kind: "damage", amount: 4, target: 0 }, [
      { kind: "object", object: older },
    ]);
    const newer = game.debugSpawn("Vela the Night-Clad", A);

    game.advanceUntil(toPostcombat);

    expect(game.state.objects[older].zone).toBe("graveyard");
    expect(game.state.objects[newer].zone).toBe("battlefield");
  });
});

describe("damage dealt at once", () => {
  it("an enraged creature blocked by two is dealt damage once, for the total", () => {
    const { game, a, b } = setUp();
    const taunter = game.debugSpawn("Brash Taunter", A, "battlefield", { summoningSick: false });
    const first = game.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false });
    const second = game.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [{ attacker: taunter, defender: B }];
    b.declareBlockersFn = () => [
      { blocker: first, attacker: taunter },
      { blocker: second, attacker: taunter },
    ];

    game.advanceUntil(toPostcombat);

    expect(triggersOf(game, taunter)).toBe(1);
    expect(life(game, B)).toBe(20 - 4);
  });
});

describe("Blech, Loafing Pest", () => {
  it("two lifelinkers are two life gains, so Blech triggers twice", () => {
    const { game, a } = setUp();
    const blech = game.debugSpawn("Blech, Loafing Pest", A);
    const spider = game.debugSpawn("Giant Spider", A);
    const viper = game.debugSpawn("Ambush Viper", A);
    const theirSpider = game.debugSpawn("Giant Spider", B);
    const hawks = [
      game.debugSpawn("Vampire Nighthawk", A, "battlefield", { summoningSick: false }),
      game.debugSpawn("Vampire Nighthawk", A, "battlefield", { summoningSick: false }),
    ];
    a.declareAttackersFn = () => hawks.map((attacker) => ({ attacker, defender: B }));
    // Bob's Spider has reach, but Bob doesn't block.

    game.advanceUntil(toPostcombat);

    const gains = game.state.eventLog.filter(
      (e) => e.type === "life-changed" && e.player === A && e.delta > 0,
    );
    expect(gains).toHaveLength(2);
    expect(triggersOf(game, blech)).toBe(2);
    const counters = (id: ObjectId): number => game.state.objects[id].counters["+1/+1"] ?? 0;
    expect(counters(blech)).toBe(2); // a Pest itself
    expect(counters(spider)).toBe(2);
    expect(counters(viper)).toBe(2);
    expect(counters(theirSpider)).toBe(0);
    expect(counters(hawks[0])).toBe(0); // a Vampire Shaman
  });

  it("one lifelinker hitting two blockers at once is one gain, so Blech triggers once", () => {
    const { game, a, b } = setUp();
    const blech = game.debugSpawn("Blech, Loafing Pest", A);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    game.debugApplyEffect(
      A,
      { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "end-of-turn" },
      [{ kind: "object", object: bears }],
    );
    const first = game.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false });
    const second = game.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    a.assignCombatDamageFn = () => [1, 1];
    b.declareBlockersFn = () => [
      { blocker: first, attacker: bears },
      { blocker: second, attacker: bears },
    ];

    game.advanceUntil(toPostcombat);

    const dealt = game.state.eventLog.filter(
      (e) => e.type === "damage-dealt" && e.source === bears,
    );
    expect(dealt).toHaveLength(2);
    expect(triggersOf(game, blech)).toBe(1);
    expect(game.state.objects[blech].counters["+1/+1"]).toBe(1);
  });

  it("counts a creature with two of the types once", () => {
    const { game } = setUp();
    const blech = game.debugSpawn("Blech, Loafing Pest", A);
    const nest = game.debugSpawn("Hornet Nest", A); // an Insect
    const bears = game.debugSpawn("Grizzly Bears", A);
    game.debugApplyEffect(A, {
      kind: "animate",
      target: 0,
      power: 0,
      toughness: 2,
      addTypes: [],
      addSubtypes: ["Spider"],
      duration: "end-of-turn",
    }, [{ kind: "object", object: nest }]);

    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 });
    game.advanceUntil(toPostcombat);

    expect(game.state.objects[blech].counters["+1/+1"]).toBe(1);
    expect(game.state.objects[nest].counters["+1/+1"]).toBe(1);
    expect(game.state.objects[bears].counters["+1/+1"] ?? 0).toBe(0);
  });
});

describe("Oloro, Ageless Ascetic", () => {
  const drainEach = (a: ScriptedController): void => {
    a.chooseModesFn = () => [0];
  };

  it("gains 2 life at your upkeep from the command zone — from the first turn", () => {
    const { game } = setUp({ commander: "Oloro, Ageless Ascetic", configure: drainEach });
    const oloro = game.state.zones.shared.command.find(
      (id) => game.state.objects[id].owner === A,
    ) as ObjectId;
    const start = game.state.rules.startingLife;
    // Turn 1's upkeep has already happened.
    expect(life(game, A)).toBe(start + 2);
    // Only that ability: "whenever you gain life" doesn't work from the
    // command zone, so the gain didn't trigger it.
    expect(triggersOf(game, oloro)).toBe(1);
    expect(life(game, B)).toBe(start);

    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    // Bob's upkeep isn't yours; your next one is.
    expect(life(game, A)).toBe(start + 4);
  });

  it("on the battlefield: 2 life at upkeep, and each gain may be turned into a card and a drain", () => {
    const { game } = setUp({ configure: drainEach });
    game.debugSpawn("Oloro, Ageless Ascetic", A);
    game.debugSpawn("Plains", A);
    const start = game.state.rules.startingLife;
    const hand = game.handOf(A).length;

    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));

    // Only the battlefield upkeep ability: the command-zone one's condition
    // is false while Oloro is on the battlefield.
    expect(life(game, A)).toBe(start + 2);
    expect(life(game, B)).toBe(start - 1);
    // The draw step's card, and Oloro's.
    expect(game.handOf(A).length).toBe(hand + 2);
  });

  it("declining the {1} does nothing", () => {
    const { game } = setUp();
    game.debugSpawn("Oloro, Ageless Ascetic", A);
    game.debugSpawn("Plains", A);
    const start = game.state.rules.startingLife;

    game.debugApplyEffect(A, { kind: "gain-life", amount: 1 });
    game.advanceUntil(toPostcombat);

    expect(life(game, A)).toBe(start + 1);
    expect(life(game, B)).toBe(start);
  });

  it("two lifelinkers dealing combat damage at once trigger it twice", () => {
    const { game, a } = setUp({ configure: drainEach });
    const oloro = game.debugSpawn("Oloro, Ageless Ascetic", A);
    spawnMany(game, "Plains", A, 2);
    const hawks = [
      game.debugSpawn("Vampire Nighthawk", A, "battlefield", { summoningSick: false }),
      game.debugSpawn("Vampire Nighthawk", A, "battlefield", { summoningSick: false }),
    ];
    a.declareAttackersFn = () => hawks.map((attacker) => ({ attacker, defender: B }));
    const hand = game.handOf(A).length;

    game.advanceUntil(toPostcombat);

    expect(triggersOf(game, oloro)).toBe(2);
    expect(life(game, B)).toBe(20 - 4 - 2);
    expect(game.handOf(A).length).toBe(hand + 2);
  });
});
