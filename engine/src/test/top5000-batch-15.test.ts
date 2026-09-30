/**
 * Top-5000 batch 15 (ranks 2036–2111). No new engine vocabulary; these pin
 * the clauses most likely to be wired wrong — the second draw of a turn
 * (Homunculus Horde), a search matching the sacrificed creature's mana value
 * plus one (Birthing Pod), the graveyard-count condition on a static
 * (Elvish Reclaimer), hexproof only while untapped (Paradise Druid), a hand
 * size CDA (Body of Knowledge), a discard cost firing a discard trigger
 * (Glint-Horn Buccaneer), and "twice X" (Drown in Dreams).
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
const setUp = (hand: readonly string[] = [], library = "Wastes"): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: yes(new ScriptedController(A)), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
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

describe("top-5000 batch 15 — Homunculus Horde", () => {
  it("copies itself on the second draw of the turn only", () => {
    const game = setUp();
    spawn(game, "Homunculus Horde");
    // The turn's draw step was the first.
    game.debugApplyEffect(A, { kind: "draw", amount: 1 }, []);
    settle(game);
    expect(named(game, "Homunculus Horde")).toHaveLength(2);
    game.debugApplyEffect(A, { kind: "draw", amount: 1 }, []);
    settle(game);
    expect(named(game, "Homunculus Horde")).toHaveLength(2);
  });
});

describe("top-5000 batch 15 — Birthing Pod", () => {
  it("finds a creature with mana value one more than the one sacrificed", () => {
    const game = setUp([], "Forest");
    lands(game, "Forest", 2);
    const pod = spawn(game, "Birthing Pod");
    const bears = spawn(game, "Grizzly Bears");
    const giant = game.debugSpawn("Hill Giant", A, "library");
    const courser = game.debugSpawn("Courser of Kruphix", A, "library");
    game.dispatch({ type: "activate-ability", player: A, source: pod, abilityIndex: 0, sacrifice: bears });
    settle(game);
    expect(zone(game, courser)).toBe("battlefield");
    expect(zone(game, giant)).toBe("library");
  });
});

describe("top-5000 batch 15 — Elvish Reclaimer", () => {
  it("gets +2/+2 with three land cards in your graveyard", () => {
    const game = setUp();
    const elf = spawn(game, "Elvish Reclaimer");
    game.debugSpawn("Forest", A, "graveyard");
    game.debugSpawn("Forest", A, "graveyard");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    expect(pt(game, elf)).toEqual([1, 2]);
    game.debugSpawn("Forest", A, "graveyard");
    expect(pt(game, elf)).toEqual([3, 4]);
  });
});

describe("top-5000 batch 15 — Paradise Druid", () => {
  it("has hexproof only while untapped", () => {
    const game = setUp();
    const druid = spawn(game, "Paradise Druid");
    expect([...computeCharacteristics(game.state, registry, druid).keywords]).toContain("hexproof");
    game.state.objects[druid].tapped = true;
    expect([...computeCharacteristics(game.state, registry, druid).keywords]).not.toContain("hexproof");
  });
});

describe("top-5000 batch 15 — Body of Knowledge", () => {
  it("is as big as your hand", () => {
    const game = setUp();
    const body = spawn(game, "Body of Knowledge");
    const n = game.handOf(A).length;
    expect(pt(game, body)).toEqual([n, n]);
  });
});

describe("top-5000 batch 15 — Glint-Horn Buccaneer", () => {
  it("pings each opponent for the card its own loot discards", () => {
    const game = setUp([], "Mountain");
    lands(game, "Mountain", 2);
    const horn = spawn(game, "Glint-Horn Buccaneer");
    game.state.objects[horn].attacking = B;
    const life = game.state.players[B].life;
    game.dispatch({ type: "activate-ability", player: A, source: horn, abilityIndex: 0 });
    settle(game);
    expect(game.state.players[B].life).toBe(life - 1);
  });
});

describe("top-5000 batch 15 — Drown in Dreams", () => {
  it("mills twice X", () => {
    const game = setUp(["Drown in Dreams"], "Island");
    lands(game, "Island", 5);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Drown in Dreams"),
      targets: [{ kind: "player", player: B }],
      xValue: 2,
      modes: [1],
    });
    settle(game);
    expect(game.state.zones.perPlayer[B].graveyard).toHaveLength(4);
  });
});
