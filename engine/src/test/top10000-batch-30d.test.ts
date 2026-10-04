/**
 * Top-10000 batch 30d. No engine change: each test pins the clause of one
 * card most likely to be wired wrong — an overloaded token copy of each
 * artifact creature you control (March of Progress), a narrowed equip and
 * "draw that many" off the equipped creature (Robe of the Archmagi), "they"
 * and "that player" (Pain Distributor), undergrowth counting cards in your
 * own graveyard (Izoni), a once-a-turn land-to-graveyard trigger (Sand
 * Scout), the mill-then-return land (Tomb Fortress), "other … with defender"
 * (Stalwart Shield-Bearers) and "monocolored" (Sultai Charm).
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

describe("top-10000 batch 30d — Stalwart Shield-Bearers", () => {
  it("gives +0/+2 to other creatures you control with defender only", () => {
    const { game } = setUp();
    const bearers = spawn(game, "Stalwart Shield-Bearers");
    const wall = spawn(game, "Wall of Omens");
    const bears = spawn(game, "Grizzly Bears");
    const theirWall = spawn(game, "Wall of Omens", B);
    const toughness = (id: ObjectId): number | undefined =>
      computeCharacteristics(game.state, registry, id).toughness;
    expect(toughness(wall)).toBe(6);
    expect(toughness(bearers)).toBe(3);
    expect(toughness(bears)).toBe(2);
    expect(toughness(theirWall)).toBe(4);
  });
});

describe("top-10000 batch 30d — Robe of the Archmagi", () => {
  it("equips a Wizard for {1} but not a Bear, and draws as many cards as the damage dealt", () => {
    const { game } = setUp([], "Island");
    lands(game, "Island", 1);
    const robe = spawn(game, "Robe of the Archmagi");
    const wizard = spawn(game, "Pyromantic Pilgrim");
    const bears = spawn(game, "Grizzly Bears");
    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: robe,
        abilityIndex: 1,
        targets: [{ kind: "object", object: bears }],
      }),
    ).toThrow();
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: robe,
      abilityIndex: 1,
      targets: [{ kind: "object", object: wizard }],
    });
    settle(game);
    expect(game.state.objects[robe].attachedTo).toBe(wizard);
    const handBefore = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: wizard, defender: B }] });
    settle(game);
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    settle(game);
    expect(life(game, B)).toBe(17);
    expect(game.handOf(A).length).toBe(handBefore + 3);
  });
});

describe("top-10000 batch 30d — Pain Distributor", () => {
  it("makes a Treasure for a player's first spell only, and pings an opponent whose artifact goes to the graveyard", () => {
    const { game } = setUp(["Shatter", "Shock"], "Mountain");
    lands(game, "Mountain", 6);
    spawn(game, "Pain Distributor");
    const ring = spawn(game, "Sol Ring", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Shatter"),
      targets: [{ kind: "object", object: ring }],
    });
    settle(game);
    expect(zone(game, ring)).toBe("graveyard");
    expect(life(game, B)).toBe(19);
    expect(named(game, "Treasure Token")).toHaveLength(1);
    expect(game.state.objects[named(game, "Treasure Token")[0]].controller).toBe(A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Shock"),
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    expect(life(game, B)).toBe(17);
    expect(named(game, "Treasure Token")).toHaveLength(1);
  });
});

describe("top-10000 batch 30d — Izoni, Thousand-Eyed", () => {
  it("makes one Insect per creature card in your own graveyard", () => {
    const { game } = setUp();
    for (const card of ["Grizzly Bears", "Hill Giant", "Ornithopter", "Wastes"]) {
      game.debugSpawn(card, A, "graveyard");
    }
    game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.debugSpawn("Izoni, Thousand-Eyed", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(named(game, "Insect Token (Black-Green)")).toHaveLength(3);
  });
});

describe("top-10000 batch 30d — Sand Scout", () => {
  it("fetches a Desert tapped when behind on lands, and makes one Sand Warrior a turn", () => {
    const { game } = setUp([], "Ifnir Deadlands");
    lands(game, "Wastes", 2, B);
    game.debugSpawn("Sand Scout", A, "battlefield", { announceEntry: true });
    settle(game);
    const deserts = named(game, "Ifnir Deadlands");
    expect(deserts).toHaveLength(1);
    expect(game.state.objects[deserts[0]].tapped).toBe(true);
    // Fetched onto the battlefield, not into the graveyard: no token yet.
    expect(named(game, "Sand Warrior Token")).toHaveLength(0);
    game.debugApplyEffect(A, { kind: "mill", target: "you", amount: 2 }, []);
    settle(game);
    expect(named(game, "Sand Warrior Token")).toHaveLength(1);
    game.debugApplyEffect(A, { kind: "mill", target: "you", amount: 2 }, []);
    settle(game);
    expect(named(game, "Sand Warrior Token")).toHaveLength(1);
  });
});

describe("top-10000 batch 30d — Sultai Charm", () => {
  it("can't target a multicolored creature with its first mode, and destroys a monocolored one", () => {
    const { game } = setUp(["Sultai Charm"], "Island");
    lands(game, "Swamp", 1);
    lands(game, "Forest", 1);
    lands(game, "Island", 1);
    const wolf = spawn(game, "Watchwolf", B);
    const bears = spawn(game, "Grizzly Bears", B);
    const charm = inHand(game, "Sultai Charm");
    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: charm,
        modes: [0],
        targets: [{ kind: "object", object: wolf }],
      }),
    ).toThrow();
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: charm,
      modes: [0],
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, wolf)).toBe("battlefield");
  });
});
