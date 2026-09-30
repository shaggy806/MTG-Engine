/**
 * Top-5000 batch 16 (ranks 2112–2184). No new engine vocabulary; these pin
 * the clauses most likely to be wired wrong — adapt only without counters,
 * and a trigger on the counters it puts (Basking Broodscale), counters for
 * Zombie cards in the graveyard as it enters (Diregraf Colossus), a discard
 * trigger split by card type (Bone Miser), a cost increase only for
 * opponents (Aura of Silence), and counters counted as it died (Aerith).
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
const setUp = (hand: readonly string[] = [], library = "Wastes", handB: readonly string[] = []): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: yes(new ScriptedController(A)), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: [...handB, ...Array<string>(40).fill("Wastes")] },
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
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const tokens = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
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

describe("top-5000 batch 16 — Basking Broodscale", () => {
  it("adapts once, and the counter makes a Spawn", () => {
    const game = setUp([], "Forest");
    lands(game, "Forest", 4);
    const scale = spawn(game, "Basking Broodscale");
    game.dispatch({ type: "activate-ability", player: A, source: scale, abilityIndex: 0 });
    settle(game);
    expect(counters(game, scale)).toBe(1);
    expect(tokens(game, "Eldrazi Spawn Token")).toBe(1);
    game.dispatch({ type: "activate-ability", player: A, source: scale, abilityIndex: 0 });
    settle(game);
    expect(counters(game, scale)).toBe(1);
    expect(tokens(game, "Eldrazi Spawn Token")).toBe(1);
  });
});

describe("top-5000 batch 16 — Diregraf Colossus", () => {
  it("enters with a counter for each Zombie card in your graveyard", () => {
    const game = setUp(["Diregraf Colossus"], "Swamp");
    lands(game, "Swamp", 3);
    game.debugSpawn("Binding Mummy", A, "graveyard");
    game.debugSpawn("Binding Mummy", A, "graveyard");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Binding Mummy", B, "graveyard");
    const colossus = inHand(game, "Diregraf Colossus");
    game.dispatch({ type: "cast-spell", player: A, card: colossus, targets: [] });
    settle(game);
    expect(counters(game, colossus)).toBe(2);
  });
});

describe("top-5000 batch 16 — Bone Miser", () => {
  it("answers each discarded card by its type", () => {
    const game = setUp();
    spawn(game, "Bone Miser");
    for (const id of [...game.handOf(A)]) {
      game.state.zones.perPlayer[A].hand.splice(game.state.zones.perPlayer[A].hand.indexOf(id), 1);
      game.state.zones.perPlayer[A].library.push(id);
      game.state.objects[id].zone = "library";
    }
    game.debugSpawn("Grizzly Bears", A, "hand");
    game.debugSpawn("Lightning Bolt", A, "hand");
    const handBefore = 2;
    game.debugApplyEffect(A, { kind: "discard", target: "you", amount: 2 }, []);
    settle(game);
    expect(tokens(game, "Zombie Token")).toBe(1);
    // The Bolt drew a card.
    expect(game.handOf(A)).toHaveLength(handBefore - 2 + 1);
  });
});

describe("top-5000 batch 16 — Aura of Silence", () => {
  it("taxes an opponent's artifact spells, not yours", () => {
    const game = setUp(["Sol Ring"], "Wastes", ["Sol Ring"]);
    spawn(game, "Aura of Silence");
    lands(game, "Wastes", 1);
    const mine = inHand(game, "Sol Ring");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === mine)).toBe(true);
    lands(game, "Wastes", 2, B);
    const theirs = inHand(game, "Sol Ring", B);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    expect(game.legalActions(B).some((x) => x.kind === "cast-spell" && x.card === theirs)).toBe(false);
  });
});

describe("top-5000 batch 16 — Aerith Gainsborough", () => {
  it("hands out the counters she died with to each legendary creature you control", () => {
    const game = setUp();
    const aerith = spawn(game, "Aerith Gainsborough");
    const legend = spawn(game, "Isamaru, Hound of Konda");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 1 }, []);
    settle(game);
    game.debugApplyEffect(A, { kind: "gain-life", amount: 1 }, []);
    settle(game);
    expect(counters(game, aerith)).toBe(2);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: aerith }]);
    settle(game);
    expect(counters(game, legend)).toBe(2);
    const c = computeCharacteristics(game.state, registry, legend);
    expect(c.power).toBe(4);
  });
});
