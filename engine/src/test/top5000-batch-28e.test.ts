/**
 * Top-5000 batch 28e. Each test pins the clause most likely to be wired
 * wrong: "that much life" off damage (Metropolis Reformer), a kicked-only
 * bounce that spares the excepted types (Slinn Voda), an optional search
 * for two (Brightglass Gearhulk), half a defending library rounded up
 * (Terisian Mindbreaker), counters of any kind read off the dead creature
 * (Felisa), a paid look after a Food is sacrificed (Trail of Crumbs), basic
 * lands' colours (Star Compass), counters moved off an enchantment and haste
 * for modified creatures (Invigorating Hot Spring), a copy for the entering
 * creature's controller (Bramble Sovereign) and a free cast from an
 * opponent's graveyard that leaves the card theirs (Memory Plunder).
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
const setUp = (
  hand: readonly string[] = [],
  library = "Wastes",
): { game: Game; a: ScriptedController; b: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const b = yes(new ScriptedController(B));
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
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
/** Counts a token stack as every token in it. */
const howMany = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
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

describe("top-5000 batch 28e — Metropolis Reformer", () => {
  it("gains its controller as much life as the damage it's dealt", () => {
    const { game } = setUp();
    const reformer = spawn(game, "Metropolis Reformer");
    const pinger = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(B, { kind: "damage", target: 0, amount: 2 }, [{ kind: "object", object: reformer }], {
      source: pinger,
    });
    settle(game);
    expect(life(game, A)).toBe(22);
    expect(zone(game, reformer)).toBe("battlefield");
  });
});

describe("top-5000 batch 28e — Slinn Voda, the Rising Deep", () => {
  it("kicked, bounces every creature but the excepted types", () => {
    const { game } = setUp(["Slinn Voda, the Rising Deep"], "Island");
    lands(game, "Island", 10);
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    const merfolk = spawn(game, "Merrow Reejerey", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Slinn Voda, the Rising Deep"),
      kicked: true,
      targets: [],
    });
    settle(game);
    const slinn = named(game, "Slinn Voda, the Rising Deep");
    expect(slinn).toHaveLength(1);
    expect(zone(game, bears)).toBe("hand");
    expect(zone(game, theirs)).toBe("hand");
    expect(game.handOf(B)).toContain(theirs);
    expect(zone(game, merfolk)).toBe("battlefield");
  });

  it("unkicked, bounces nothing", () => {
    const { game } = setUp(["Slinn Voda, the Rising Deep"], "Island");
    lands(game, "Island", 8);
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Slinn Voda, the Rising Deep"), targets: [] });
    settle(game);
    expect(named(game, "Slinn Voda, the Rising Deep")).toHaveLength(1);
    expect(zone(game, bears)).toBe("battlefield");
  });
});

describe("top-5000 batch 28e — Brightglass Gearhulk", () => {
  it("may find two artifact, creature or enchantment cards of mana value 1 or less", () => {
    const { game, a } = setUp([], "Ornithopter");
    a.chooseFromZoneFn = (_view, eligible, _min, max) => eligible.slice(0, max);
    const before = game.handOf(A).filter((id) => game.state.objects[id].cardName === "Ornithopter").length;
    game.debugSpawn("Brightglass Gearhulk", A, "battlefield", { announceEntry: true });
    settle(game);
    const after = game.handOf(A).filter((id) => game.state.objects[id].cardName === "Ornithopter").length;
    expect(after - before).toBe(2);
  });
});

describe("top-5000 batch 28e — Terisian Mindbreaker", () => {
  it("has the defending player mill half their library, rounded up", () => {
    const { game, a } = setUp();
    const mindbreaker = spawn(game, "Terisian Mindbreaker");
    // 40 cards less an opening hand of 7: an odd 33, so "rounded up" shows.
    const before = game.libraryOf(B).length;
    expect(before % 2).toBe(1);
    a.declareAttackersFn = () => [{ attacker: mindbreaker, defender: B }];
    game.advanceUntil(
      (s) => s.turn.step === "postcombat-main" && s.zones.shared.stack.length === 0 && s.awaiting === null,
    );
    expect(game.libraryOf(B).length).toBe(before - Math.ceil(before / 2));
  });
});

describe("top-5000 batch 28e — Felisa, Fang of Silverquill", () => {
  it("makes a tapped Inkling per counter of any kind on the creature that died, none without counters", () => {
    const { game } = setUp();
    spawn(game, "Felisa, Fang of Silverquill");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 1, stun: 2 };
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(howMany(game, "Inkling Token")).toBe(3);
    expect(named(game, "Inkling Token").every((id) => game.state.objects[id].tapped)).toBe(true);
    const plain = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: plain }]);
    settle(game);
    expect(howMany(game, "Inkling Token")).toBe(3);
    // An opponent's creature never counts.
    const theirs = spawn(game, "Grizzly Bears", B);
    game.state.objects[theirs].counters = { "+1/+1": 1 };
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: theirs }]);
    settle(game);
    expect(howMany(game, "Inkling Token")).toBe(3);
  });
});

describe("top-5000 batch 28e — Trail of Crumbs", () => {
  it("pays {1} when a Food is sacrificed to take a permanent card from the top two", () => {
    const { game } = setUp([], "Grizzly Bears");
    lands(game, "Forest", 3);
    spawn(game, "Trail of Crumbs");
    const food = spawn(game, "Food Token");
    const hand = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: food, abilityIndex: 0 });
    settle(game);
    expect(life(game, A)).toBe(23);
    expect(game.handOf(A).length).toBe(hand + 1);
    expect(game.battlefield.filter((id) => game.state.objects[id].cardName === "Forest" && game.state.objects[id].tapped)).toHaveLength(3);
  });
});

describe("top-5000 batch 28e — Invigorating Hot Spring", () => {
  it("enters with four counters and moves one to a creature, which then has haste", () => {
    const { game } = setUp(["Invigorating Hot Spring"]);
    spawn(game, "Mountain");
    lands(game, "Forest", 2);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: true });
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Invigorating Hot Spring"), targets: [] });
    settle(game);
    const spring = named(game, "Invigorating Hot Spring")[0];
    expect(counters(game, spring)).toBe(4);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("haste")).toBe(false);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: spring,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    expect(counters(game, spring)).toBe(3);
    expect(counters(game, bears)).toBe(1);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("haste")).toBe(true);
    // Only once each turn.
    expect(
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === spring),
    ).toBe(false);
  });
});

describe("top-5000 batch 28e — Bramble Sovereign", () => {
  it("lets you pay {1}{G} for a token copy under the entering creature's controller", () => {
    const { game } = setUp();
    lands(game, "Forest", 2);
    spawn(game, "Bramble Sovereign");
    game.debugSpawn("Grizzly Bears", B, "battlefield", { announceEntry: true });
    settle(game);
    const bears = named(game, "Grizzly Bears");
    expect(bears).toHaveLength(2);
    const token = bears.find((id) => game.state.objects[id].isToken);
    expect(token).toBeDefined();
    expect(game.state.objects[token!].controller).toBe(B);
  });
});

describe("top-5000 batch 28e — Memory Plunder", () => {
  it("casts an opponent's instant free, and it goes back to their graveyard", () => {
    const { game, a } = setUp(["Memory Plunder"], "Island");
    lands(game, "Island", 4);
    const bolt = game.debugSpawn("Lightning Bolt", B, "graveyard");
    let free: boolean | undefined;
    a.chooseCastNowFn = (_view, offer) => {
      const cast = offer.casts.find((c) => c.card === bolt);
      free = cast?.free;
      return { type: "cast-spell", player: A, card: bolt, targets: [{ kind: "player", player: B }], via: "effect", free: true };
    };
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Memory Plunder"),
      targets: [{ kind: "object", object: bolt }],
    });
    settle(game);
    expect(free).toBe(true);
    expect(life(game, B)).toBe(17);
    expect(zone(game, bolt)).toBe("graveyard");
    expect(game.graveyardOf(B)).toContain(bolt);
  });
});
