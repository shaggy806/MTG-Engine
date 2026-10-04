/**
 * Top-10000 batch 31g. No engine change: each card is existing vocabulary.
 * The tests pin the clause most likely to be wired wrong — "each Elf on the
 * battlefield" counting every player's (Wellwisher), Zegana's "another"
 * intervening-if and adapt's once-only counters, Drannith Ruins' non-Human
 * entered-this-turn target, Reef Worm's chain of tokens, Brinelin's mana
 * value gate, Bottomless Pit's "that player", and Roiling Dragonstorm's
 * Dragon-you-control bounce.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

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
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const hand = (game: Game, player: PlayerId = A): number => game.state.zones.perPlayer[player].hand.length;
const graveyard = (game: Game, player: PlayerId): number => game.state.zones.perPlayer[player].graveyard.length;
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
const destroy = (game: Game, id: ObjectId): void => {
  game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: id }]);
  settle(game);
};

describe("top-10000 batch 31g — Wellwisher", () => {
  it("gains 1 life for each Elf on the battlefield, whoever controls it", () => {
    const { game } = setUp();
    const wellwisher = spawn(game, "Wellwisher");
    spawn(game, "Llanowar Elves");
    spawn(game, "Elvish Mystic", B);
    spawn(game, "Irregular Cohort", B); // changeling: an Elf too
    spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "activate-ability", player: A, source: wellwisher, abilityIndex: 0 });
    settle(game);
    expect(life(game, A)).toBe(24);
    expect(life(game, B)).toBe(20);
  });
});

describe("top-10000 batch 31g — Zegana, Utopian Speaker", () => {
  it("draws only if you control another creature with a +1/+1 counter", () => {
    const { game } = setUp();
    const theirs = spawn(game, "Grizzly Bears", B);
    game.state.objects[theirs].counters = { "+1/+1": 1 };
    spawn(game, "Grizzly Bears"); // no counter
    const before = hand(game);
    game.debugSpawn("Zegana, Utopian Speaker", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(hand(game)).toBe(before);

    const second = setUp();
    const mine = spawn(second.game, "Grizzly Bears");
    second.game.state.objects[mine].counters = { "+1/+1": 1 };
    const start = hand(second.game);
    second.game.debugSpawn("Zegana, Utopian Speaker", A, "battlefield", { announceEntry: true });
    settle(second.game);
    expect(hand(second.game)).toBe(start + 1);
  });

  it("adapts 4 once, and gives creatures with +1/+1 counters trample", () => {
    const { game } = setUp();
    lands(game, "Forest", 6);
    lands(game, "Island", 6);
    const zegana = spawn(game, "Zegana, Utopian Speaker");
    const bears = spawn(game, "Grizzly Bears");
    expect([...computeCharacteristics(game.state, registry, zegana).keywords]).not.toContain("trample");
    game.dispatch({ type: "activate-ability", player: A, source: zegana, abilityIndex: 0 });
    settle(game);
    expect(counters(game, zegana)).toBe(4);
    game.dispatch({ type: "activate-ability", player: A, source: zegana, abilityIndex: 0 });
    settle(game);
    expect(counters(game, zegana)).toBe(4);
    expect([...computeCharacteristics(game.state, registry, zegana).keywords]).toContain("trample");
    expect([...computeCharacteristics(game.state, registry, bears).keywords]).not.toContain("trample");
  });
});

describe("top-10000 batch 31g — Drannith Ruins", () => {
  it("targets only a non-Human creature that entered this turn", () => {
    const { game } = setUp();
    lands(game, "Wastes", 2);
    const ruins = spawn(game, "Drannith Ruins");
    const bears = spawn(game, "Grizzly Bears");
    const human = spawn(game, "Elite Vanguard");
    const changeling = spawn(game, "Irregular Cohort");
    const old = spawn(game, "Hill Giant", B);
    game.state.objects[old].enteredBattlefieldOnTurn = 0;
    const offer = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === ruins && x.abilityIndex === 1);
    expect(offer).toBeDefined();
    const options = offer!.kind === "activate-ability" ? offer!.targetOptions[0] : [];
    const ids = options.map((ref) => (ref.kind === "object" ? ref.object : undefined));
    expect(ids).toContain(bears);
    expect(ids).not.toContain(human);
    expect(ids).not.toContain(changeling);
    expect(ids).not.toContain(old);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: ruins,
      abilityIndex: 1,
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    expect(counters(game, bears)).toBe(2);
  });
});

describe("top-10000 batch 31g — Reef Worm", () => {
  it("dies into a 3/3 Fish, which dies into a 6/6 Whale, which dies into a 9/9 Kraken", () => {
    const { game } = setUp();
    destroy(game, spawn(game, "Reef Worm"));
    const fish = named(game, "Fish Token (Reef Worm)");
    expect(fish).toHaveLength(1);
    destroy(game, fish[0]);
    const whale = named(game, "Whale Token (Reef Worm)");
    expect(whale).toHaveLength(1);
    const c = computeCharacteristics(game.state, registry, whale[0]);
    expect([c.power, c.toughness]).toEqual([6, 6]);
    destroy(game, whale[0]);
    expect(named(game, "Kraken Token (Spawning Kraken)")).toHaveLength(1);
  });
});

describe("top-10000 batch 31g — Brinelin, the Moon Kraken", () => {
  it("may bounce on entering", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    a.chooseTargetsFn = () => [{ kind: "object", object: bears }];
    game.debugSpawn("Brinelin, the Moon Kraken", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, bears)).toBe("hand");
  });

  it("triggers on a spell with mana value 6 or greater, not on a smaller one", () => {
    const { game, a } = setUp(["Hill Giant", "Shivan Dragon"], "Mountain");
    lands(game, "Mountain", 10);
    spawn(game, "Brinelin, the Moon Kraken");
    const bears = spawn(game, "Grizzly Bears", B);
    a.chooseTargetsFn = () => [{ kind: "object", object: bears }];
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Hill Giant"), targets: [] });
    settle(game);
    expect(zone(game, bears)).toBe("battlefield");
    expect(game.state.turn.step).toBe("precombat-main");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Shivan Dragon"), targets: [] });
    settle(game);
    expect(zone(game, bears)).toBe("hand");
    expect(named(game, "Shivan Dragon")).toHaveLength(1);
  });
});

describe("top-10000 batch 31g — Bottomless Pit", () => {
  it("makes whoever's upkeep it is discard a card at random", () => {
    const { game } = setUp();
    spawn(game, "Bottomless Pit");
    const aGraveyard = graveyard(game, A);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(graveyard(game, B)).toBe(1);
    expect(graveyard(game, A)).toBe(aGraveyard);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(graveyard(game, A)).toBe(aGraveyard + 1);
    expect(graveyard(game, B)).toBe(1);
  });
});

describe("top-10000 batch 31g — Roiling Dragonstorm", () => {
  it("returns to its owner's hand when a Dragon you control enters, not an opponent's", () => {
    const { game } = setUp();
    const storm = spawn(game, "Roiling Dragonstorm");
    game.debugSpawn("Shivan Dragon", B, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, storm)).toBe("battlefield");
    game.debugSpawn("Shivan Dragon", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, storm)).toBe("hand");
  });
});
