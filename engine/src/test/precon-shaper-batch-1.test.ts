/**
 * World Shaper precon (EOC, Hearthhull, the Worldseed), batch 1 — the cards
 * of its list the engine runs faithfully with the vocabulary it has. Each
 * test pins the clause most likely to be wired wrong: a sacrifice trigger's
 * filter (Scouring Swarm, Evendo Brushrazer), a gated impulse permission, a
 * mana ability that also puts a counter on, a cast trigger plus a graveyard
 * ability that leaves the card where it is (World Breaker), and a "from
 * anywhere" graveyard trigger that sees a land and its own card die together
 * (Centaur Vinecrasher).
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
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: yes(new ScriptedController(B)) },
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
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const id = game.debugSpawn(name, player, "battlefield", { summoningSick: false });
  // A land that enters tapped is set up ready to use.
  game.state.objects[id].tapped = false;
  return id;
};
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string, player?: PlayerId): ObjectId[] =>
  game.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === name &&
      (player === undefined || game.state.objects[id].controller === player),
  );
const tokens = (game: Game, name: string, player?: PlayerId): number =>
  named(game, name, player).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
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
const activate = (
  game: Game,
  source: ObjectId,
  abilityIndex: number,
  extra: { sacrifice?: ObjectId; targets?: TargetRef[] } = {},
): void => {
  game.dispatch({ type: "activate-ability", player: A, source, abilityIndex, targets: extra.targets ?? [], ...extra });
  settle(game);
};
const graveyardLands = (game: Game, n: number, player: PlayerId = A): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn("Forest", player, "graveyard");
};
/** Whether a legal action plays or casts `card`. */
const playable = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((x) => (x as { card?: ObjectId }).card === card);

describe("Shaper batch 1 — Hammer of Purphoros", () => {
  it("gives your creatures haste and makes an enchantment artifact Golem for a land", () => {
    const { game } = setUp();
    lands(game, "Mountain", 3);
    const fodder = spawn(game, "Forest");
    const hammer = spawn(game, "Hammer of Purphoros");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    expect(computeCharacteristics(game.state, registry, bears).keywords).toContain("haste");
    expect(computeCharacteristics(game.state, registry, theirs).keywords).not.toContain("haste");
    activate(game, hammer, 0, { sacrifice: fodder });
    expect(zone(game, fodder)).toBe("graveyard");
    const [golem] = named(game, "Golem Token (Enchantment Artifact)");
    const chars = computeCharacteristics(game.state, registry, golem);
    expect([...chars.types].sort()).toEqual(["artifact", "creature", "enchantment"]);
    expect([chars.power, chars.toughness]).toEqual([3, 3]);
    expect([...chars.colors]).toEqual([]);
    expect(chars.keywords).toContain("haste");
  });
});

describe("Shaper batch 1 — Mountain Valley", () => {
  it("enters tapped, and fetches a Mountain or Forest card untapped", () => {
    const { game } = setUp([], "Forest");
    const entered = game.debugSpawn("Mountain Valley", A, "battlefield");
    expect(game.state.objects[entered].tapped).toBe(true);
    const valley = spawn(game, "Mountain Valley");
    const before = named(game, "Forest").length;
    activate(game, valley, 0);
    expect(zone(game, valley)).toBe("graveyard");
    const forests = named(game, "Forest");
    expect(forests.length).toBe(before + 1);
    expect(game.state.objects[forests[forests.length - 1]].tapped).toBe(false);
  });

  it("Rocky Tar Pit finds nothing in a library of Forests", () => {
    const { game } = setUp([], "Forest");
    const pit = spawn(game, "Rocky Tar Pit");
    activate(game, pit, 0);
    expect(zone(game, pit)).toBe("graveyard");
    expect(named(game, "Forest").length).toBe(0);
  });
});

describe("Shaper batch 1 — Sprouting Goblin", () => {
  it("fetches a land with a basic land type to hand only when kicked", () => {
    const kicked = setUp(["Sprouting Goblin"], "Forest");
    lands(kicked.game, "Mountain", 2);
    lands(kicked.game, "Forest", 1);
    const handBefore = kicked.game.handOf(A).length;
    kicked.game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(kicked.game, "Sprouting Goblin"),
      targets: [],
      kicked: true,
    });
    settle(kicked.game);
    // The Goblin left the hand and a Forest came in.
    expect(kicked.game.handOf(A).length).toBe(handBefore);
    expect(kicked.game.handOf(A).some((id) => kicked.game.state.objects[id].cardName === "Forest")).toBe(true);

    const plain = setUp(["Sprouting Goblin"], "Forest");
    lands(plain.game, "Mountain", 2);
    const plainBefore = plain.game.handOf(A).length;
    plain.game.dispatch({ type: "cast-spell", player: A, card: inHand(plain.game, "Sprouting Goblin"), targets: [] });
    settle(plain.game);
    expect(plain.game.handOf(A).length).toBe(plainBefore - 1);
  });
});

describe("Shaper batch 1 — Uurg, Spawn of Turg", () => {
  it("has power equal to the land cards in your graveyard only", () => {
    const { game } = setUp();
    const uurg = spawn(game, "Uurg, Spawn of Turg");
    expect(computeCharacteristics(game.state, registry, uurg).power).toBe(0);
    graveyardLands(game, 3);
    graveyardLands(game, 2, B);
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    const chars = computeCharacteristics(game.state, registry, uurg);
    expect([chars.power, chars.toughness]).toEqual([3, 5]);
  });
});

describe("Shaper batch 1 — Eumidian Hatchery", () => {
  it("costs 1 life and adds a hatchling counter per use; dying, it makes that many Insects", () => {
    const { game } = setUp();
    const hatchery = spawn(game, "Eumidian Hatchery");
    const before = life(game, A);
    activate(game, hatchery, 0);
    expect(life(game, A)).toBe(before - 1);
    expect(counters(game, hatchery, "hatchling")).toBe(1);
    game.state.objects[hatchery].tapped = false;
    activate(game, hatchery, 0);
    expect(counters(game, hatchery, "hatchling")).toBe(2);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(hatchery)]);
    settle(game);
    expect(zone(game, hatchery)).toBe("graveyard");
    expect(tokens(game, "Insect Token (Black, Flying)", A)).toBe(2);
  });
});

describe("Shaper batch 1 — World Breaker", () => {
  it("exiles its cast trigger's target, and returns from the graveyard for {2}{C} and a land", () => {
    const { game, a } = setUp(["World Breaker"], "Wastes");
    lands(game, "Forest", 7);
    const their = spawn(game, "Wastes", B);
    a.chooseTargetsFn = () => [obj(their)];
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "World Breaker"), targets: [] });
    settle(game);
    expect(zone(game, their)).toBe("exile");
    const breaker = named(game, "World Breaker")[0];
    expect([...computeCharacteristics(game.state, registry, breaker).colors]).toEqual([]);

    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(breaker)]);
    settle(game);
    expect(zone(game, breaker)).toBe("graveyard");
    lands(game, "Wastes", 3);
    const fodder = spawn(game, "Forest");
    activate(game, breaker, 0, { sacrifice: fodder });
    expect(zone(game, fodder)).toBe("graveyard");
    expect(zone(game, breaker)).toBe("hand");
  });
});

describe("Shaper batch 1 — Scouring Swarm", () => {
  it("makes a tapped flying Insect for a sacrificed land, and a tapped copy at seven land cards", () => {
    const { game } = setUp();
    spawn(game, "Scouring Swarm");
    activate(game, spawn(game, "Mountain Valley"), 0);
    const [insect] = named(game, "Insect Token (Black, Flying)");
    expect(insect).toBeDefined();
    expect(game.state.objects[insect].tapped).toBe(true);
    expect(named(game, "Scouring Swarm").length).toBe(1);

    // Six more land cards: seven with the next sacrificed land.
    graveyardLands(game, 6);
    activate(game, spawn(game, "Mountain Valley"), 0);
    const swarms = named(game, "Scouring Swarm");
    expect(swarms.length).toBe(2);
    const copy = swarms.find((id) => game.state.objects[id].isToken)!;
    expect(game.state.objects[copy].tapped).toBe(true);
    expect(tokens(game, "Insect Token (Black, Flying)")).toBe(1);
  });

  it("doesn't trigger on a sacrificed creature", () => {
    const { game } = setUp();
    spawn(game, "Scouring Swarm");
    const seer = spawn(game, "Viscera Seer");
    const bears = spawn(game, "Grizzly Bears");
    activate(game, seer, 0, { sacrifice: bears });
    expect(zone(game, bears)).toBe("graveyard");
    expect(tokens(game, "Insect Token (Black, Flying)")).toBe(0);
  });
});

describe("Shaper batch 1 — Evendo Brushrazer", () => {
  it("exiles a card per nontoken sacrifice, playable on your turn once you've sacrificed one", () => {
    // An instant, so it's castable whichever step of the turn the test
    // reaches once the trigger has resolved.
    const { game } = setUp([], "Lightning Bolt");
    lands(game, "Mountain", 2);
    const razer = spawn(game, "Evendo Brushrazer");
    const libraryTop = game.state.zones.perPlayer[A].library[0];
    activate(game, razer, 0, { sacrifice: spawn(game, "Mountain") });
    expect(zone(game, libraryTop)).toBe("exile");
    expect(playable(game, libraryTop)).toBe(true);

    // A new turn of yours: no nontoken sacrifice yet.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    settle(game);
    expect(playable(game, libraryTop)).toBe(false);
    // A sacrificed token neither triggers it nor opens the permission.
    const seer = spawn(game, "Viscera Seer");
    const exiled = (): number => game.state.zones.shared.exile.length;
    const exiledBefore = exiled();
    game.debugApplyEffect(A, { kind: "create-token", token: "Insect Token (Black, Flying)", count: 1 }, []);
    activate(game, seer, 0, { sacrifice: named(game, "Insect Token (Black, Flying)")[0] });
    expect(exiled()).toBe(exiledBefore);
    expect(playable(game, libraryTop)).toBe(false);
    // A sacrificed land does.
    game.state.objects[razer].tapped = false;
    activate(game, razer, 0, { sacrifice: spawn(game, "Mountain") });
    expect(exiled()).toBe(exiledBefore + 1);
    expect(playable(game, libraryTop)).toBe(true);
  });
});

describe("Shaper batch 1 — Planetary Annihilation", () => {
  it("leaves each player six lands, then deals 6 damage to each creature", () => {
    const { game } = setUp(["Planetary Annihilation"]);
    lands(game, "Mountain", 9);
    lands(game, "Wastes", 7, B);
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Planetary Annihilation"), targets: [] });
    settle(game);
    const landsOf = (p: PlayerId): number =>
      game.battlefield.filter((id) => game.state.objects[id].controller === p && game.state.objects[id].cardName !== "Grizzly Bears" && game.state.objects[id].cardName !== "Hill Giant").length;
    expect(landsOf(A)).toBe(6);
    expect(landsOf(B)).toBe(6);
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, giant)).toBe("graveyard");
  });
});

describe("Shaper batch 1 — Centaur Vinecrasher", () => {
  it("enters with a counter per land card in all graveyards", () => {
    const { game } = setUp(["Centaur Vinecrasher"]);
    lands(game, "Forest", 4);
    graveyardLands(game, 2);
    graveyardLands(game, 1, B);
    game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Centaur Vinecrasher"), targets: [] });
    settle(game);
    const crasher = named(game, "Centaur Vinecrasher")[0];
    expect(counters(game, crasher)).toBe(3);
  });

  it("returns to hand for {G}{G} when a land card hits a graveyard", () => {
    const { game } = setUp();
    lands(game, "Forest", 2);
    const crasher = game.debugSpawn("Centaur Vinecrasher", A, "graveyard");
    // A nonland card doesn't count.
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(spawn(game, "Grizzly Bears", B))]);
    settle(game);
    expect(zone(game, crasher)).toBe("graveyard");
    // An opponent's land card does.
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(spawn(game, "Wastes", B))]);
    settle(game);
    expect(zone(game, crasher)).toBe("hand");
    expect(named(game, "Forest").every((id) => game.state.objects[id].tapped)).toBe(true);
  });

  it.each([true, false])("sees a land card die alongside it (the ruling; Arbor first: %s)", (arborFirst) => {
    const { game } = setUp();
    lands(game, "Forest", 2);
    if (arborFirst) spawn(game, "Dryad Arbor");
    const crasher = spawn(game, "Centaur Vinecrasher");
    if (!arborFirst) spawn(game, "Dryad Arbor");
    game.debugApplyEffect(A, { kind: "destroy-all", filter: { type: "creature" } }, []);
    settle(game);
    expect(zone(game, crasher)).toBe("hand");
  });
});
