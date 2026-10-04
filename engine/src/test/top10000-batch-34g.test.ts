/**
 * Top-10000 batch 34g. Pins the clause of each authored card most likely to
 * be wired wrong: Sunscape Familiar's reduction for a green spell (not a red
 * one); Beacon of Tomorrows giving the *target* player the turn and going
 * back into the library; Double Down copying an outlaw creature spell into a
 * token; Wildfire Awakener's X tokens, each pinging a player as it taps;
 * Deploy to the Front counting every player's creatures; Rockface Village's
 * Mouse pump; Scale the Heights' whole sequence; Two-Headed Sliver reaching an
 * opponent's Sliver; Gempalm Incinerator's cycle trigger counting Goblins
 * on both sides; Oathsworn Vampire castable from the graveyard only once life
 * was gained; Tourach's kicked discard and its counter per discarded card;
 * and Archghoul of Thraben's look for another Zombie and for itself.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const settle = (game: Game): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [0] });
    } else {
      game.advanceUntil(quiet);
    }
  }
  throw new Error("settle: still unresolved");
};
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === name);
/** How many permanents of that name, a token stack counted as every token in it. */
const howMany = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const canCast = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);

describe("top-10000 batch 34g — Sunscape Familiar", () => {
  it("takes {1} off a green spell, but not off a red one", () => {
    const { game } = setUp(["Grizzly Bears", "Hill Giant"]);
    spawn(game, "Sunscape Familiar");
    lands(game, "Forest", 1);
    lands(game, "Mountain", 2);
    // Bears ({1}{G}) for one Forest's {G}; Hill Giant ({3}{R}) still needs four.
    expect(canCast(game, inHand(game, "Grizzly Bears"))).toBe(true);
    expect(canCast(game, inHand(game, "Hill Giant"))).toBe(false);
  });
});

describe("top-10000 batch 34g — Beacon of Tomorrows", () => {
  it("gives the target player an extra turn and shuffles itself into its owner's library", () => {
    const { game } = setUp(["Beacon of Tomorrows"]);
    lands(game, "Island", 8);
    const beacon = inHand(game, "Beacon of Tomorrows");
    game.dispatch({ type: "cast-spell", player: A, card: beacon, targets: [{ kind: "player", player: B }] });
    settle(game);
    expect(game.state.extraTurns).toEqual([B]);
    expect(zone(game, beacon)).toBe("library");
  });
});

describe("top-10000 batch 34g — Double Down", () => {
  it("copies an outlaw creature spell, the copy becoming a token", () => {
    const { game } = setUp(["Agent of Kotis"]);
    spawn(game, "Double Down");
    lands(game, "Island", 2);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Agent of Kotis"), targets: [] });
    settle(game);
    const agents = named(game, "Agent of Kotis");
    expect(howMany(game, "Agent of Kotis")).toBe(2);
    expect(agents.filter((id) => game.state.objects[id].isToken === true)).toHaveLength(1);
  });

  it("doesn't copy a spell that isn't an outlaw", () => {
    const { game } = setUp(["Grizzly Bears"]);
    spawn(game, "Double Down");
    lands(game, "Forest", 2);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears"), targets: [] });
    settle(game);
    expect(howMany(game, "Grizzly Bears")).toBe(1);
  });
});

describe("top-10000 batch 34g — Wildfire Awakener", () => {
  const TOKEN = "Elemental Token (Wildfire Awakener)";
  const cast = (x: number): { game: Game; a: ScriptedController } => {
    const set = setUp(["Wildfire Awakener"]);
    lands(set.game, "Mountain", 1);
    lands(set.game, "Plains", 1);
    lands(set.game, "Wastes", 1 + x);
    set.a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    set.game.dispatch({ type: "cast-spell", player: A, card: inHand(set.game, "Wildfire Awakener"), targets: [], xValue: x });
    settle(set.game);
    return set;
  };

  it("makes X Elementals", () => {
    const { game } = cast(2);
    expect(howMany(game, TOKEN)).toBe(2);
  });

  it("an Elemental deals 1 damage to a target player as it becomes tapped", () => {
    const { game } = cast(1);
    expect(howMany(game, TOKEN)).toBe(1);
    game.debugApplyEffect(A, { kind: "tap", target: 0 }, [obj(named(game, TOKEN)[0])]);
    settle(game);
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-10000 batch 34g — Deploy to the Front", () => {
  it("makes one Soldier per creature on the battlefield, every player's", () => {
    const { game } = setUp(["Deploy to the Front"]);
    lands(game, "Plains", 7);
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Deploy to the Front"), targets: [] });
    settle(game);
    expect(howMany(game, "Soldier Token")).toBe(3);
  });
});

describe("top-10000 batch 34g — Rockface Village", () => {
  it("gives a Mouse you control +1/+0 and haste", () => {
    const { game } = setUp();
    const village = spawn(game, "Rockface Village");
    lands(game, "Mountain", 1);
    const duo = spawn(game, "Brave-Kin Duo");
    game.dispatch({ type: "activate-ability", player: A, source: village, abilityIndex: 2, targets: [obj(duo)] });
    settle(game);
    const c = computeCharacteristics(game.state, registry, duo);
    expect([c.power, c.toughness]).toEqual([2, 1]);
    expect(c.keywords.has("haste")).toBe(true);
  });
});

describe("top-10000 batch 34g — Scale the Heights", () => {
  it("puts a counter on the target, gains 2 life and draws a card", () => {
    const { game } = setUp(["Scale the Heights"]);
    lands(game, "Forest", 3);
    const bears = spawn(game, "Grizzly Bears");
    const hand = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Scale the Heights"), targets: [obj(bears)] });
    settle(game);
    expect(counters(game, bears)).toBe(1);
    expect(life(game, A)).toBe(22);
    expect(game.handOf(A).length).toBe(hand);
  });
});

describe("top-10000 batch 34g — Two-Headed Sliver", () => {
  it("gives menace to every Sliver creature, an opponent's too", () => {
    const { game } = setUp();
    const mine = spawn(game, "Two-Headed Sliver");
    const theirs = spawn(game, "Sinew Sliver", B);
    const bears = spawn(game, "Grizzly Bears", B);
    expect(computeCharacteristics(game.state, registry, mine).keywords.has("menace")).toBe(true);
    expect(computeCharacteristics(game.state, registry, theirs).keywords.has("menace")).toBe(true);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("menace")).toBe(false);
  });
});

describe("top-10000 batch 34g — Gempalm Incinerator", () => {
  it("when cycled, deals X damage to the target creature, X the Goblins on the battlefield", () => {
    const { game, a } = setUp(["Gempalm Incinerator"]);
    lands(game, "Mountain", 2);
    spawn(game, "Goblin Bully");
    spawn(game, "Goblin Bully");
    spawn(game, "Goblin Bully", B);
    const giant = spawn(game, "Hill Giant", B);
    a.chooseTargetsFn = () => [obj(giant)];
    const hand = game.handOf(A).length;
    game.dispatch({ type: "cycle", player: A, card: inHand(game, "Gempalm Incinerator") });
    settle(game);
    // Three Goblins (the cycled card is in the graveyard): lethal to a 3/3.
    expect(zone(game, giant)).toBe("graveyard");
    expect(game.handOf(A).length).toBe(hand);
  });
});

describe("top-10000 batch 34g — Oathsworn Vampire", () => {
  it("is castable from the graveyard only once you've gained life this turn", () => {
    const { game } = setUp();
    lands(game, "Swamp", 2);
    const vampire = game.debugSpawn("Oathsworn Vampire", A, "graveyard");
    expect(canCast(game, vampire)).toBe(false);
    game.debugApplyEffect(A, { kind: "gain-life", amount: 1 });
    settle(game);
    expect(canCast(game, vampire)).toBe(true);
  });
});

describe("top-10000 batch 34g — Tourach, Dread Cantor", () => {
  it("kicked, makes the opponent discard two at random, and grows once per card", () => {
    const { game } = setUp(["Tourach, Dread Cantor"]);
    lands(game, "Swamp", 4);
    const handB = game.handOf(B).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Tourach, Dread Cantor"), targets: [], kicked: true });
    settle(game);
    const tourach = named(game, "Tourach, Dread Cantor")[0];
    expect(game.handOf(B).length).toBe(handB - 2);
    expect(counters(game, tourach)).toBe(2);
  });

  it("unkicked, makes nobody discard", () => {
    const { game } = setUp(["Tourach, Dread Cantor"]);
    lands(game, "Swamp", 2);
    const handB = game.handOf(B).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Tourach, Dread Cantor"), targets: [] });
    settle(game);
    expect(game.handOf(B).length).toBe(handB);
  });
});

describe("top-10000 batch 34g — Archghoul of Thraben", () => {
  it("takes a Zombie off the top when another Zombie dies, and when it dies itself", () => {
    const { game } = setUp([], "Bog Raiders");
    const ghoul = spawn(game, "Archghoul of Thraben");
    const raiders = spawn(game, "Bog Raiders");
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(raiders)]);
    settle(game);
    expect(game.handOf(A).length).toBe(hand + 1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(ghoul)]);
    settle(game);
    expect(game.handOf(A).length).toBe(hand + 2);
  });

  it("may put a card that isn't a Zombie into the graveyard instead", () => {
    const { game } = setUp();
    const ghoul = spawn(game, "Archghoul of Thraben");
    const hand = game.handOf(A).length;
    const library = game.libraryOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(ghoul)]);
    settle(game);
    expect(game.handOf(A).length).toBe(hand);
    expect(game.libraryOf(A).length).toBe(library - 1);
  });
});
