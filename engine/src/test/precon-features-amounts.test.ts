/**
 * Small amount and condition features, and the precon cards they unblock:
 * - `commanderCastsOf` (rule 903.8's count) — Study Hall;
 * - the `thisWay` amount's `perPlayer: "greatest"` — Windfall — and
 *   `sumOf: "power"`, read as the sacrificed creatures last existed — Reign
 *   of the Pit;
 * - `colorsSpentOf`, converge — Painful Truths;
 * - `sharesCreatureTypeWith: "trigger-object"` — Heirloom Blade;
 * - the `controls-greatest` condition — Thickest in the Thicket;
 * - `deals-combat-damage-to-player`'s `toPlayerControlsMore` — Cartographer's
 *   Hawk;
 * - a block filter reading its static's source — Champion of Lambholt;
 * - an intervening-if reading the X a permanent was cast with (ravenous,
 *   rule 702.156a) — Jacked Rabbit.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { whyCannotBlock } from "../combat/eligibility.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

interface SetUp {
  readonly game: Game;
  readonly a: ScriptedController;
  readonly b: ScriptedController;
}

const setUp = (opts: { library?: readonly string[]; commander?: string } = {}): SetUp => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  a.chooseModesFn = () => [0];
  a.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      {
        player: A,
        cards: [...(opts.library ?? []), ...Array<string>(40).fill("Wastes")],
        ...(opts.commander !== undefined ? { commanders: [opts.commander] } : {}),
      },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const settle = (game: Game): void => {
  game.advanceUntil(quiet);
};
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const id = game.debugSpawn(name, player, "battlefield", { summoningSick: false });
  game.state.objects[id].tapped = false;
  return id;
};
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const named = (game: Game, name: string, player?: PlayerId): ObjectId[] =>
  game.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === name &&
      (player === undefined || game.state.objects[id].controller === player),
  );
const tokens = (game: Game, name: string, player?: PlayerId): number =>
  named(game, name, player).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const cast = (game: Game, name: string, targets: TargetRef[] = [], xValue?: number): ObjectId => {
  const card = game.debugSpawn(name, A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card, targets, ...(xValue !== undefined ? { xValue } : {}) });
  settle(game);
  return card;
};
const handSize = (game: Game, player: PlayerId = A): number => game.handOf(player).length;
const life = (game: Game, player: PlayerId = A): number => game.state.players[player].life;
const power = (game: Game, id: ObjectId): number => computeCharacteristics(game.state, registry, id).power;

describe("Study Hall — scry X, X the commander's casts from the command zone", () => {
  const COMMANDER = "Anafenza, the Foremost";

  /** Study Hall's coloured mana made green, a further `generic` to pay with
   * Wastes, and a Plains and a Swamp for Anafenza's other pips. */
  const withHall = (generic: number): { s: SetUp; hall: ObjectId; scried: ObjectId[][] } => {
    const s = setUp({ commander: COMMANDER });
    const scried: ObjectId[][] = [];
    s.a.chooseScryFn = (_view, cards) => {
      scried.push([...cards]);
      return [];
    };
    const hall = spawn(s.game, "Study Hall");
    const wastes = lands(s.game, "Wastes", 1);
    s.game.dispatch({ type: "activate-ability", player: A, source: hall, abilityIndex: 1, targets: [], manaColors: ["G"] });
    expect(s.game.state.objects[wastes[0]].tapped).toBe(true);
    lands(s.game, "Plains", 1);
    lands(s.game, "Swamp", 1);
    lands(s.game, "Wastes", generic);
    return { s, hall, scried };
  };
  const commanderId = (game: Game): ObjectId =>
    game.state.zones.shared.command.find((id) => game.state.objects[id].cardName === COMMANDER)!;

  it("counts this cast: the first cast from the command zone scries 1", () => {
    const { s, scried } = withHall(0);
    s.game.dispatch({ type: "cast-spell", player: A, card: commanderId(s.game), targets: [] });
    settle(s.game);
    expect(scried).toHaveLength(1);
    expect(scried[0]).toHaveLength(1);
  });

  it("the third cast scries 3", () => {
    const { s, scried } = withHall(4);
    s.game.state.players[A].commanderCastCounts[COMMANDER] = 2;
    s.game.dispatch({ type: "cast-spell", player: A, card: commanderId(s.game), targets: [] });
    settle(s.game);
    expect(s.game.state.players[A].commanderCastCounts[COMMANDER]).toBe(3);
    expect(scried).toHaveLength(1);
    expect(scried[0]).toHaveLength(3);
  });

  it("does nothing when the mana casts something other than your commander", () => {
    const { s, scried } = withHall(0);
    cast(s.game, "Llanowar Elves");
    expect(named(s.game, "Llanowar Elves")).toHaveLength(1);
    expect(scried).toHaveLength(0);
  });
});

describe("Windfall — draws the greatest number any one player discarded", () => {
  it("both players draw the larger hand's count", () => {
    const { game } = setUp();
    lands(game, "Island", 3);
    // Bob's hand outnumbers Alice's: everyone draws Bob's count.
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Wastes", B, "hand");
    const bobsHand = handSize(game, B);
    expect(bobsHand).toBeGreaterThan(handSize(game, A));
    cast(game, "Windfall");
    expect(handSize(game, A)).toBe(bobsHand);
    expect(handSize(game, B)).toBe(bobsHand);
  });

  it("not the total: two hands of three don't make six", () => {
    const { game } = setUp();
    lands(game, "Island", 3);
    game.debugApplyEffect(A, { kind: "discard-hand", who: "each-player" });
    expect(handSize(game, A) + handSize(game, B)).toBe(0);
    for (let i = 0; i < 3; i += 1) {
      game.debugSpawn("Wastes", A, "hand");
      game.debugSpawn("Wastes", B, "hand");
    }
    cast(game, "Windfall");
    expect(handSize(game, A)).toBe(3);
    expect(handSize(game, B)).toBe(3);
  });
});

describe("Painful Truths — converge counts the colours of mana spent", () => {
  it("three colours: draw three, lose three", () => {
    const { game } = setUp();
    lands(game, "Swamp", 1);
    lands(game, "Island", 1);
    lands(game, "Mountain", 1);
    const hand = handSize(game);
    cast(game, "Painful Truths");
    expect(handSize(game)).toBe(hand + 3);
    expect(life(game)).toBe(17);
  });

  it("one colour, however much of it", () => {
    const { game } = setUp();
    lands(game, "Swamp", 3);
    const hand = handSize(game);
    cast(game, "Painful Truths");
    expect(handSize(game)).toBe(hand + 1);
    expect(life(game)).toBe(19);
  });

  it("colourless isn't a colour", () => {
    const { game } = setUp();
    lands(game, "Swamp", 1);
    lands(game, "Wastes", 2);
    cast(game, "Painful Truths");
    expect(life(game)).toBe(19);
  });
});

describe("Heirloom Blade — a creature card sharing a creature type with the dead creature", () => {
  const equipAndKill = (s: SetUp, creature: string): void => {
    const { game } = s;
    lands(game, "Wastes", 1);
    const blade = spawn(game, "Heirloom Blade");
    const host = spawn(game, creature);
    game.dispatch({ type: "activate-ability", player: A, source: blade, abilityIndex: 0, targets: [obj(host)] });
    settle(game);
    expect(power(game, host)).toBe((registry.get(creature).power ?? 0) + 3);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(host)]);
    settle(game);
  };

  it("reads the dead creature's types, not the first creature card", () => {
    const s = setUp();
    // Top of library, in order: Elves (Elf Druid), Island, Bears (Bear).
    const bears = s.game.debugSpawn("Grizzly Bears", A, "library");
    const island = s.game.debugSpawn("Island", A, "library");
    const elves = s.game.debugSpawn("Llanowar Elves", A, "library");
    equipAndKill(s, "Grizzly Bears");
    expect(s.game.state.objects[bears].zone).toBe("hand");
    expect(s.game.state.objects[elves].zone).toBe("library");
    expect(s.game.state.objects[island].zone).toBe("library");
    // The rest went to the bottom.
    const lib = s.game.state.zones.perPlayer[A].library;
    expect(lib.slice(-2).sort()).toEqual([elves, island].sort());
  });

  it("a changeling in the library shares a type with anything", () => {
    const s = setUp();
    const changeling = s.game.debugSpawn("Changeling Outcast", A, "library");
    const island = s.game.debugSpawn("Island", A, "library");
    equipAndKill(s, "Grizzly Bears");
    expect(s.game.state.objects[changeling].zone).toBe("hand");
    expect(s.game.state.objects[island].zone).toBe("library");
  });

  it("finds nothing for a creature with no creature type", () => {
    const s = setUp();
    const bears = s.game.debugSpawn("Grizzly Bears", A, "library");
    const before = handSize(s.game);
    equipAndKill(s, "Ornithopter");
    expect(handSize(s.game)).toBe(before);
    expect(s.game.state.objects[bears].zone).toBe("library");
  });
});

describe("Reign of the Pit — X is the total power sacrificed", () => {
  it("makes a Demon as big as both sacrificed creatures' powers together", () => {
    const { game } = setUp();
    lands(game, "Swamp", 6);
    const mine = spawn(game, "Grizzly Bears");
    game.state.objects[mine].counters = { "+1/+1": 1 };
    const theirs = spawn(game, "Llanowar Elves", B);
    cast(game, "Reign of the Pit");
    expect(game.state.objects[mine].zone).toBe("graveyard");
    expect(game.state.objects[theirs].zone).toBe("graveyard");
    const [demon] = named(game, "X/X Demon Token (Flying)", A);
    const c = computeCharacteristics(game.state, registry, demon);
    // 3 (its counter, as it last existed) + 1.
    expect([c.power, c.toughness]).toEqual([4, 4]);
    expect(c.keywords).toContain("flying");
  });

  it("a negative power counts against the total", () => {
    const { game } = setUp();
    lands(game, "Swamp", 6);
    spawn(game, "Craw Wurm");
    const weak = spawn(game, "Grizzly Bears", B);
    game.state.objects[weak].counters = { "-1/-1": 1 };
    game.debugApplyEffect(B, { kind: "modify-pt", target: 0, power: -3, toughness: 0, duration: "end-of-turn" }, [obj(weak)]);
    expect(power(game, weak)).toBe(-2);
    cast(game, "Reign of the Pit");
    const [demon] = named(game, "X/X Demon Token (Flying)", A);
    // 6 + (-2).
    expect(power(game, demon)).toBe(4);
  });
});

describe("Thickest in the Thicket", () => {
  it("doubles a creature's power with counters as it enters", () => {
    const { game } = setUp();
    lands(game, "Forest", 5);
    const wurm = spawn(game, "Craw Wurm");
    // The only creature, so the enters trigger targets it.
    cast(game, "Thickest in the Thicket");
    expect(game.state.objects[wurm].counters["+1/+1"]).toBe(6);
  });

  const endStepDraws = (mine: number, theirs: number | null): number => {
    const { game } = setUp();
    game.debugSpawn("Thickest in the Thicket", A);
    const a = spawn(game, "Grizzly Bears");
    game.state.objects[a].counters = { "+1/+1": mine - 2 };
    if (theirs !== null) {
      const b = spawn(game, "Grizzly Bears", B);
      game.state.objects[b].counters = { "+1/+1": theirs - 2 };
    }
    const before = handSize(game);
    game.advanceUntil((s) => s.turn.step === "cleanup" || s.turn.number > 1);
    return handSize(game) - before;
  };

  it("draws two when you control the greatest power", () => expect(endStepDraws(5, 3)).toBe(2));
  it("draws two when tied for it", () => expect(endStepDraws(4, 4)).toBe(2));
  it("draws nothing when an opponent's creature is bigger", () => expect(endStepDraws(3, 5)).toBe(0));
});

describe("Cartographer's Hawk — combat damage to a player with more lands", () => {
  const hawkAttack = (theirLands: number): Game => {
    const { game, a } = setUp({ library: [] });
    // A Plains to find, on top.
    game.debugSpawn("Plains", A, "library");
    lands(game, "Wastes", 2);
    lands(game, "Wastes", theirLands, B);
    const hawk = spawn(game, "Cartographer's Hawk");
    a.declareAttackersFn = () => [{ attacker: hawk, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" || s.result.over);
    settle(game);
    return game;
  };

  it("returns to hand and fetches a Plains tapped when they control more lands", () => {
    const game = hawkAttack(3);
    expect(game.state.players[B].life).toBe(18);
    const hawk = game.handOf(A).find((id) => game.state.objects[id].cardName === "Cartographer's Hawk");
    expect(hawk).toBeDefined();
    const [plains] = named(game, "Plains", A);
    expect(plains).toBeDefined();
    expect(game.state.objects[plains].tapped).toBe(true);
  });

  it("doesn't trigger when they control no more lands than you", () => {
    const game = hawkAttack(2);
    expect(game.state.players[B].life).toBe(18);
    expect(named(game, "Cartographer's Hawk", A)).toHaveLength(1);
    expect(named(game, "Plains", A)).toHaveLength(0);
  });
});

describe("Champion of Lambholt", () => {
  it("creatures with less power than it can't block your creatures", () => {
    const { game, a } = setUp();
    const champion = spawn(game, "Champion of Lambholt");
    game.state.objects[champion].counters = { "+1/+1": 1 };
    const bears = spawn(game, "Grizzly Bears");
    const elves = spawn(game, "Llanowar Elves", B);
    const ogre = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.awaiting?.kind === "blockers");
    // Champion's power is 2: Elves (1) can't block; a 2-power Bears can.
    expect(whyCannotBlock(game.state, registry, B, elves, bears)).not.toBeNull();
    expect(whyCannotBlock(game.state, registry, B, ogre, bears)).toBeNull();
  });

  it("grows as another creature you control enters", () => {
    const { game } = setUp();
    lands(game, "Forest", 1);
    const champion = spawn(game, "Champion of Lambholt");
    cast(game, "Llanowar Elves");
    expect(game.state.objects[champion].counters["+1/+1"]).toBe(1);
    expect(power(game, champion)).toBe(2);
  });
});

describe("Jacked Rabbit — ravenous", () => {
  it("X of 5 enters with five counters and draws a card", () => {
    const { game } = setUp();
    lands(game, "Plains", 7);
    const hand = handSize(game);
    const rabbit = cast(game, "Jacked Rabbit", [], 5);
    expect(game.state.objects[rabbit].counters["+1/+1"]).toBe(5);
    // Cast from the hand it was put in; then the draw.
    expect(handSize(game)).toBe(hand + 1);
  });

  it("X of 4 never triggers the draw", () => {
    const { game } = setUp();
    lands(game, "Plains", 6);
    const hand = handSize(game);
    const triggersBefore = game.state.eventLog.filter((e) => e.type === "ability-triggered").length;
    const rabbit = cast(game, "Jacked Rabbit", [], 4);
    expect(game.state.objects[rabbit].counters["+1/+1"]).toBe(4);
    expect(handSize(game)).toBe(hand);
    expect(game.state.eventLog.filter((e) => e.type === "ability-triggered").length).toBe(triggersBefore);
  });

  it("put onto the battlefield without being cast, X is 0", () => {
    const { game } = setUp();
    const hand = handSize(game);
    const rabbit = game.debugSpawn("Jacked Rabbit", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.objects[rabbit].counters["+1/+1"] ?? 0).toBe(0);
    expect(handSize(game)).toBe(hand);
  });

  it("attacks for a Rabbit per point of power", () => {
    const { game, a } = setUp();
    const rabbit = spawn(game, "Jacked Rabbit");
    game.state.objects[rabbit].counters = { "+1/+1": 2 };
    a.declareAttackersFn = () => [{ attacker: rabbit, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" || s.result.over);
    expect(tokens(game, "Rabbit Token", A)).toBe(3);
  });
});
