/**
 * Top-10000 batch 30e. Pins the clauses most likely to be wired wrong: an
 * Island count read as the bounce resolves (Engulf the Shore), a -1/-1 counter
 * on entry spent as a cost (Wickerbough Elder), activated abilities granted to
 * another permanent (Necrotic Sliver, Underworld Connections), a spore-counter
 * engine and a Saproling sacrificed for mana (Utopia Mycon), a subtype-list
 * anthem that spares itself (Valley Questcaller), and a manland's animation and
 * "other creatures" attack pump (Restless Prairie).
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
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((unit) => unit.type).sort();
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power, c.toughness];
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
/** The activated-ability offer on `source` whose text contains `text` — a
 * granted ability's index comes after the printed and intrinsic ones. */
const offer = (game: Game, player: PlayerId, source: ObjectId, text: string) =>
  game
    .legalActions(player)
    .find((x) => x.kind === "activate-ability" && x.source === source && x.text.includes(text)) as
    | { readonly kind: "activate-ability"; readonly abilityIndex: number }
    | undefined;

describe("top-10000 batch 30e — Engulf the Shore", () => {
  it("bounces every creature with toughness at most the Islands you control, as it resolves", () => {
    const { game } = setUp(["Engulf the Shore"]);
    lands(game, "Island", 2);
    lands(game, "Wastes", 2);
    const elves = spawn(game, "Llanowar Elves");
    const bears = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Engulf the Shore"), targets: [] });
    settle(game);
    expect(zone(game, elves)).toBe("hand");
    expect(zone(game, bears)).toBe("hand");
    expect(zone(game, giant)).toBe("battlefield");
  });
});

describe("top-10000 batch 30e — Wickerbough Elder", () => {
  it("enters with a -1/-1 counter and spends it to destroy an artifact", () => {
    const { game } = setUp(["Wickerbough Elder"], "Forest");
    lands(game, "Forest", 5);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Wickerbough Elder"), targets: [] });
    settle(game);
    const elder = named(game, "Wickerbough Elder")[0];
    expect(counters(game, elder, "-1/-1")).toBe(1);
    expect(pt(game, elder)).toEqual([3, 3]);
    const ring = spawn(game, "Sol Ring", B);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: elder,
      abilityIndex: 0,
      targets: [{ kind: "object", object: ring }],
    });
    settle(game);
    expect(zone(game, ring)).toBe("graveyard");
    expect(counters(game, elder, "-1/-1")).toBe(0);
    expect(pt(game, elder)).toEqual([4, 4]);
    // No counter left: the ability can't be activated again.
    spawn(game, "Sol Ring", B);
    expect(offer(game, A, elder, "Destroy target artifact")).toBeUndefined();
  });
});

describe("top-10000 batch 30e — Necrotic Sliver", () => {
  it("gives another Sliver a sacrifice ability that destroys any permanent", () => {
    const { game } = setUp();
    spawn(game, "Necrotic Sliver");
    const sentinel = spawn(game, "Sentinel Sliver");
    lands(game, "Wastes", 3);
    const ring = spawn(game, "Sol Ring", B);
    const ability = offer(game, A, sentinel, "Destroy target permanent");
    expect(ability).toBeDefined();
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: sentinel,
      abilityIndex: ability!.abilityIndex,
      targets: [{ kind: "object", object: ring }],
    });
    settle(game);
    expect(zone(game, sentinel)).toBe("graveyard");
    expect(zone(game, ring)).toBe("graveyard");
    expect(named(game, "Necrotic Sliver")).toHaveLength(1);
  });

  it("doesn't reach a non-Sliver", () => {
    const { game } = setUp();
    spawn(game, "Necrotic Sliver");
    const bears = spawn(game, "Grizzly Bears");
    lands(game, "Wastes", 3);
    expect(offer(game, A, bears, "Destroy target permanent")).toBeUndefined();
  });
});

describe("top-10000 batch 30e — Underworld Connections", () => {
  it("gives the enchanted land a tap-and-pay-1-life draw", () => {
    const { game } = setUp();
    const swamp = spawn(game, "Swamp");
    const other = spawn(game, "Swamp");
    const aura = game.debugSpawn("Underworld Connections", A, "battlefield");
    game.state.objects[aura].attachedTo = swamp;
    expect(offer(game, A, other, "Draw a card")).toBeUndefined();
    const ability = offer(game, A, swamp, "Draw a card");
    expect(ability).toBeDefined();
    const hand = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: swamp, abilityIndex: ability!.abilityIndex });
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand + 1);
    expect(life(game, A)).toBe(19);
    expect(game.state.objects[swamp].tapped).toBe(true);
  });
});

describe("top-10000 batch 30e — Utopia Mycon", () => {
  it("turns three spore counters into a Saproling, and a Saproling into mana", () => {
    const { game } = setUp();
    const mycon = spawn(game, "Utopia Mycon");
    game.state.objects[mycon].counters = { spore: 3 };
    game.dispatch({ type: "activate-ability", player: A, source: mycon, abilityIndex: 0 });
    settle(game);
    expect(counters(game, mycon, "spore")).toBe(0);
    const saprolings = named(game, "Saproling Token");
    expect(saprolings).toHaveLength(1);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: mycon,
      abilityIndex: 1,
      sacrifice: saprolings[0],
      manaColors: ["B"],
    });
    expect(pool(game)).toEqual(["B"]);
    expect(named(game, "Saproling Token")).toHaveLength(0);
  });

  it("puts a spore counter on itself at the beginning of your upkeep", () => {
    const { game } = setUp();
    const mycon = spawn(game, "Utopia Mycon");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    settle(game);
    expect(counters(game, mycon, "spore")).toBe(1);
  });
});

describe("top-10000 batch 30e — Valley Questcaller", () => {
  it("pumps your other Rabbits, Bats, Birds and Mice, not itself or other creatures", () => {
    const { game } = setUp();
    const questcaller = spawn(game, "Valley Questcaller");
    const bats = spawn(game, "Bartizan Bats");
    const bears = spawn(game, "Grizzly Bears");
    const theirBats = spawn(game, "Bartizan Bats", B);
    expect(pt(game, questcaller)).toEqual([2, 3]);
    expect(pt(game, bats)).toEqual([4, 2]);
    expect(pt(game, bears)).toEqual([2, 2]);
    expect(pt(game, theirBats)).toEqual([3, 1]);
  });
});

describe("top-10000 batch 30e — Restless Prairie", () => {
  it("becomes a 3/3 green and white Llama land, and its attack pumps only the others", () => {
    const { game } = setUp();
    const prairie = spawn(game, "Restless Prairie");
    lands(game, "Forest", 2);
    lands(game, "Plains", 2);
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({ type: "activate-ability", player: A, source: prairie, abilityIndex: 1 });
    settle(game);
    const c = computeCharacteristics(game.state, registry, prairie);
    expect(c.types).toEqual(expect.arrayContaining(["land", "creature"]));
    expect([c.power, c.toughness]).toEqual([3, 3]);
    const pump = registry.get("Restless Prairie")!.triggered[0].effect!;
    game.debugApplyEffect(A, pump, [], { source: prairie });
    settle(game);
    expect(pt(game, bears)).toEqual([3, 3]);
    expect(pt(game, prairie)).toEqual([3, 3]);
  });
});
