/**
 * Top-5000 batch 19c. No engine change: the clauses most likely to be wired
 * wrong — Dowsing Dagger's Plants going to the targeted opponent and its
 * transform into a land that falls off its creature, Liliana's Caress once per
 * card an opponent discards, Sol Talisman cast from suspend with no mana cost, and Berserkers'
 * Onslaught's double strike for attackers only.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { faceName } from "../state.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();
const PLANT = "Plant Token (Defender)";

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
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
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((unit) => unit.type).sort();
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

describe("top-5000 batch 19c — Dowsing Dagger // Lost Vale", () => {
  it("gives the target opponent two Plants, then transforms off a hit into a land that falls off", () => {
    const { game, a } = setUp();
    const dagger = game.debugSpawn("Dowsing Dagger", A, "battlefield", { announceEntry: true });
    settle(game);
    const plants = named(game, PLANT);
    expect(plants).toHaveLength(2);
    for (const plant of plants) {
      expect(game.state.objects[plant].controller).toBe(B);
      const c = computeCharacteristics(game.state, registry, plant);
      expect([c.power, c.toughness]).toEqual([0, 2]);
      expect(c.keywords.has("defender")).toBe(true);
    }

    // The trigger's resolution leaves turn 1's main phase behind; equip on the next.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    spawn(game, "Wastes");
    spawn(game, "Wastes");
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: dagger,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    expect(game.state.objects[dagger].attachedTo).toBe(bears);
    const pumped = computeCharacteristics(game.state, registry, bears);
    expect([pumped.power, pumped.toughness]).toEqual([4, 3]);

    // The 0/2 defenders don't block (bob's controller declares none).
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(16);
    expect(faceName(game.state.objects[dagger])).toBe("Lost Vale");
    expect(game.state.objects[dagger].zone).toBe("battlefield");
    // A land isn't an Equipment: it comes unattached (rule 704.5p).
    expect(game.state.objects[dagger].attachedTo).toBeNull();
    const bare = computeCharacteristics(game.state, registry, bears);
    expect([bare.power, bare.toughness]).toEqual([2, 2]);
  });
});

describe("top-5000 batch 19c — Liliana's Caress", () => {
  it("drains an opponent 2 for each card they discard, and not you for yours", () => {
    const { game } = setUp();
    spawn(game, "Liliana's Caress");
    const theirs = game.handOf(B).length;
    expect(theirs).toBeGreaterThan(1);
    expect(game.handOf(A).length).toBeGreaterThan(0);
    game.debugApplyEffect(A, { kind: "discard-hand", who: "each-player" });
    settle(game);
    expect(game.handOf(B)).toHaveLength(0);
    expect(life(game, B)).toBe(20 - 2 * theirs);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-5000 batch 19c — Sol Talisman", () => {
  it("can't be cast from hand, only suspended, and its free cast puts it onto the battlefield", () => {
    const { game, a } = setUp();
    spawn(game, "Wastes");
    const talisman = game.debugSpawn("Sol Talisman", A, "hand");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === talisman)).toBe(false);
    a.chooseCastNowFn = (_v, offer) =>
      offer.casts.length === 0
        ? null
        : { type: "cast-spell", player: A, card: offer.cards[0], targets: [], via: "effect", free: true };
    game.dispatch({ type: "suspend", player: A, card: talisman });
    game.advanceUntil(quiet);
    expect(game.state.objects[talisman].zone).toBe("exile");
    expect(game.state.objects[talisman].counters.time).toBe(3);
    game.advanceUntil((s) => s.turn.number === 7 && s.turn.step === "precombat-main" && quiet(s));
    const out = named(game, "Sol Talisman");
    expect(out).toHaveLength(1);
    game.dispatch({ type: "activate-ability", player: A, source: out[0], abilityIndex: 0 });
    expect(pool(game)).toEqual(["C", "C"]);
  });
});

describe("top-5000 batch 19c — Berserkers' Onslaught", () => {
  it("gives double strike to your attackers only", () => {
    const { game, a } = setUp();
    spawn(game, "Berserkers' Onslaught");
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant");
    const theirs = spawn(game, "Grizzly Bears", B);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("double-strike")).toBe(false);
    let seen = false;
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => {
      if (s.turn.step === "declare-blockers" && !seen) {
        seen = true;
        expect(computeCharacteristics(s, registry, bears).keywords.has("double-strike")).toBe(true);
        expect(computeCharacteristics(s, registry, giant).keywords.has("double-strike")).toBe(false);
        expect(computeCharacteristics(s, registry, theirs).keywords.has("double-strike")).toBe(false);
      }
      return s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s);
    });
    expect(seen).toBe(true);
    // Bob's bears don't block (his controller declares none): 2 + 2.
    expect(life(game, B)).toBe(16);
  });
});
