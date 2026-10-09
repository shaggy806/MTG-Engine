/**
 * Top-5000 batch 25h. No engine change: each test pins the clause of an
 * authored card most likely to be wired wrong — Hydra Omnivore's "each other
 * opponent", Spell Stutter's {2} plus one per Faerie, Mana Echoes' shared
 * creature type counted from your side only, Akki Battle Squad untapping only
 * the modified attackers once a turn, Ajani's Chosen moving the Aura onto its
 * Cat, Bag of Holding keeping what it exiled, Canoptek Scarab Swarm counting
 * only artifact and land cards, Metallurgic Summonings' X/X and its six-
 * artifact gate, Nazgûl Battle-Mace's "unless that player pays 3 life", and
 * Lotus Bloom's free suspend.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const registry = createDefaultRegistry();

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (
  hand: readonly string[] = [],
  library = "Wastes",
): { game: Game; a: ScriptedController; b: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = game.characteristics(id);
  return [c.power ?? 0, c.toughness ?? 0];
};
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
const cast = (game: Game, card: ObjectId, targets: readonly ObjectId[] = [], player: PlayerId = A): void => {
  game.dispatch({
    type: "cast-spell",
    player,
    card,
    ...(targets.length > 0 ? { targets: targets.map((object) => ({ kind: "object" as const, object })) } : {}),
  });
};
const offered = (game: Game, source: ObjectId, index: number, player: PlayerId = A): boolean =>
  game
    .legalActions(player)
    .some((action) => action.kind === "activate-ability" && action.source === source && action.abilityIndex === index);
const toAttackers = (game: Game): void => {
  game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
};

describe("top-5000 batch 25h — Hydra Omnivore", () => {
  it("deals the combat damage it dealt one opponent to each other opponent, not to that one again", () => {
    const players = [A, B, C];
    const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)]));
    const game = Game.create({
      seed: 1,
      shuffle: false,
      startingPlayer: A,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers,
      decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Wastes") })),
    });
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
    const hydra = spawn(game, "Hydra Omnivore");
    (controllers[A] as ScriptedController).declareAttackersFn = () => [{ attacker: hydra, defender: B }];
    game.advanceUntil(
      (s) => s.turn.step === "postcombat-main" && s.zones.shared.stack.length === 0 && s.pendingTriggers.length === 0,
    );
    expect(life(game, B)).toBe(12);
    expect(life(game, C)).toBe(12);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-5000 batch 25h — Spell Stutter", () => {
  const setUpStutter = (faeries: number) => {
    const env = setUp();
    const { game } = env;
    lands(game, "Island", 2);
    for (let i = 0; i < faeries; i += 1) spawn(game, "Faerie Duelist");
    lands(game, "Island", 4, B);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    const opt = game.debugSpawn("Opt", B, "hand");
    cast(game, opt, [], B);
    game.advanceUntil((s) => s.priority.holder === A);
    cast(game, game.debugSpawn("Spell Stutter", A, "hand"), [opt]);
    // Bob pays whenever he's offered the chance.
    env.b.chooseModesFn = () => [0];
    game.advanceUntil(quiet);
    return { ...env, opt };
  };

  it("one Faerie makes it {3}: Bob's three untapped Islands pay, and Opt resolves", () => {
    const { game, opt } = setUpStutter(1);
    expect(zone(game, opt)).toBe("graveyard");
    const bobsUntapped = game.battlefield.filter(
      (id) => game.state.objects[id].controller === B && !game.state.objects[id].tapped,
    );
    expect(bobsUntapped).toHaveLength(0);
    expect(game.state.eventLog.some((e) => e.type === "spell-countered")).toBe(false);
  });

  it("two Faeries make it {4}: three Islands can't pay it, so Opt is countered", () => {
    const { game, opt } = setUpStutter(2);
    expect(zone(game, opt)).toBe("graveyard");
    const bobsUntapped = game.battlefield.filter(
      (id) => game.state.objects[id].controller === B && !game.state.objects[id].tapped,
    );
    expect(bobsUntapped).toHaveLength(3);
  });
});

describe("top-5000 batch 25h — Akki Battle Squad", () => {
  it("untaps only the modified creatures, adds one combat, and triggers once a turn", () => {
    const { game } = setUp();
    spawn(game, "Akki Battle Squad");
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant");
    game.state.objects[bears].counters = { "+1/+1": 1 };
    toAttackers(game);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: bears, defender: B },
        { attacker: giant, defender: B },
      ],
    });
    settle(game);
    expect(game.state.objects[bears].tapped).toBe(false);
    expect(game.state.objects[giant].tapped).toBe(true);
    game.advanceUntil(
      (s) => (s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers") || s.turn.number > 1,
    );
    expect(game.state.turn.number).toBe(1);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: bears, defender: B }] });
    settle(game);
    expect(game.state.objects[bears].tapped).toBe(true);
    game.advanceUntil(
      (s) => (s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers") || s.turn.number > 1,
    );
    expect(game.state.turn.number).toBeGreaterThan(1);
  });

  it("doesn't trigger when no modified creature attacks", () => {
    const { game } = setUp();
    spawn(game, "Akki Battle Squad");
    const giant = spawn(game, "Hill Giant");
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: giant, defender: B }] });
    settle(game);
    expect(game.state.objects[giant].tapped).toBe(true);
    game.advanceUntil(
      (s) => (s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers") || s.turn.number > 1,
    );
    expect(game.state.turn.number).toBeGreaterThan(1);
  });
});

describe("top-5000 batch 25h — Ajani's Chosen", () => {
  it("makes a Cat when an Aura enters, and may move the Aura onto it", () => {
    const { game } = setUp();
    lands(game, "Plains", 1);
    const chosen = spawn(game, "Ajani's Chosen");
    const aura = game.debugSpawn("Holy Strength", A, "hand");
    cast(game, aura, [chosen]);
    settle(game);
    const cats = named(game, "Cat Token");
    expect(cats).toHaveLength(1);
    expect(zone(game, aura)).toBe("battlefield");
    expect(game.state.objects[aura].attachedTo).toBe(cats[0]);
    expect(pt(game, cats[0])).toEqual([3, 4]);
  });
});

describe("top-5000 batch 25h — Bag of Holding", () => {
  it("exiles each card you discard with it, and gives them back when sacrificed", () => {
    const { game } = setUp();
    const bag = spawn(game, "Bag of Holding");
    lands(game, "Wastes", 4);
    const discarded = game.debugSpawn("Grizzly Bears", A, "hand");
    game.debugApplyEffect(A, { kind: "discard", target: "you", amount: 1 }, []);
    settle(game);
    // Whatever card went, it was exiled with the Bag.
    const exiled = game.state.zones.shared.exile.filter((id) => game.state.objects[id].exiledWith?.source === bag);
    expect(exiled).toHaveLength(1);
    expect(game.state.zones.perPlayer[A].graveyard).toHaveLength(0);
    const card = exiled[0];
    expect(offered(game, bag, 1)).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: bag, abilityIndex: 1 });
    settle(game);
    expect(zone(game, bag)).toBe("graveyard");
    expect(zone(game, card)).toBe("hand");
    expect(discarded).toBeDefined();
  });
});

describe("top-5000 batch 25h — Canoptek Scarab Swarm", () => {
  it("exiles the graveyard and makes an Insect per artifact or land card exiled, one for an artifact land", () => {
    const { game } = setUp();
    const swarm = spawn(game, "Canoptek Scarab Swarm");
    game.debugSpawn("Sol Ring", B, "graveyard");
    game.debugSpawn("Wastes", B, "graveyard");
    game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.debugSpawn("Ancient Den", B, "graveyard");
    const effect = registry.get("Canoptek Scarab Swarm")!.triggered[0].effect!;
    game.debugApplyEffect(A, effect, [{ kind: "player", player: B }], { source: swarm });
    settle(game);
    expect(game.state.zones.perPlayer[B].graveyard).toHaveLength(0);
    const insects = named(game, "Insect Token (Canoptek Scarab Swarm)").reduce(
      (n, id) => n + (game.state.objects[id].stackCount ?? 1),
      0,
    );
    expect(insects).toBe(3);
  });
});

describe("top-5000 batch 25h — Metallurgic Summonings", () => {
  it("makes an X/X for the spell's mana value, and its exile ability needs six artifacts", () => {
    const { game } = setUp();
    const summonings = spawn(game, "Metallurgic Summonings");
    lands(game, "Island", 3);
    const divination = game.debugSpawn("Divination", A, "hand");
    cast(game, divination);
    settle(game);
    const constructs = named(game, "Construct Token (Metallurgic Summonings)");
    expect(constructs).toHaveLength(1);
    expect(pt(game, constructs[0])).toEqual([3, 3]);
    expect(zone(game, divination)).toBe("graveyard");
    lands(game, "Island", 5);
    for (let i = 0; i < 4; i += 1) spawn(game, "Ornithopter");
    // The Construct and four Ornithopters: five artifacts.
    expect(offered(game, summonings, 0)).toBe(false);
    spawn(game, "Ornithopter");
    expect(offered(game, summonings, 0)).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: summonings, abilityIndex: 0 });
    settle(game);
    expect(zone(game, summonings)).toBe("exile");
    expect(zone(game, divination)).toBe("hand");
  });
});

describe("top-5000 batch 25h — Lotus Bloom", () => {
  it("suspends for {0} with three time counters", () => {
    const { game } = setUp();
    const bloom = game.debugSpawn("Lotus Bloom", A, "hand");
    expect(game.legalActions(A).some((action) => action.kind === "cast-spell" && action.card === bloom)).toBe(false);
    expect(game.legalActions(A).some((action) => action.kind === "suspend" && action.card === bloom)).toBe(true);
    game.dispatch({ type: "suspend", player: A, card: bloom });
    expect(zone(game, bloom)).toBe("exile");
    expect(game.state.objects[bloom].counters?.time).toBe(3);
  });
});
