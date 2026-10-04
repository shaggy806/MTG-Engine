/**
 * Top-5000 batch 27h. No engine change: each test pins the clause of one
 * card most likely to be wired wrong — The Ten Rings' "draw the difference",
 * Flow State's two-for-one switch, Serum Snare's mana-value gate on a
 * bounced permanent, Syr Vondam's "while its power is 4 or greater",
 * Nemesis of Reason's defending player, Bloodsoaked Champion's Raid gate,
 * Tower Winder's graveyard search, and Nightshade Harvester's "that player".
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
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
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
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
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;
/** Attack `defender: B` with `attacker` at the next declaration only. */
const attackOnce = (a: ScriptedController, attacker: ObjectId): void => {
  let done = false;
  a.declareAttackersFn = () => {
    if (done) return [];
    done = true;
    return [{ attacker, defender: B }];
  };
};

describe("top-5000 batch 27h — The Ten Rings", () => {
  it("draws up to ten cards in hand at its controller's end step", () => {
    const { game } = setUp();
    spawn(game, "The Ten Rings");
    const before = game.handOf(A).length;
    expect(before).toBeLessThan(10);
    const library = game.libraryOf(A).length;
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "cleanup");
    settle(game);
    expect(game.handOf(A).length).toBe(10);
    expect(game.libraryOf(A).length).toBe(library - (10 - before));
  });

  it("does nothing with ten or more cards in hand (the intervening if)", () => {
    const { game } = setUp();
    spawn(game, "The Ten Rings");
    for (let i = game.handOf(A).length; i < 11; i += 1) game.debugSpawn("Wastes", A, "hand");
    const library = game.libraryOf(A).length;
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "cleanup");
    settle(game);
    expect(game.libraryOf(A).length).toBe(library);
  });
});

describe("top-5000 batch 27h — Serum Snare", () => {
  it("proliferates only when the returned permanent had mana value 3 or less", () => {
    const { game } = setUp();
    const mine = spawn(game, "Grizzly Bears");
    game.state.objects[mine].counters = { "+1/+1": 1 };
    const giant = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(A, effectOf("Serum Snare"), [{ kind: "object", object: giant }]);
    settle(game);
    expect(zone(game, giant)).toBe("hand");
    expect(counters(game, mine)).toBe(1);

    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, effectOf("Serum Snare"), [{ kind: "object", object: bears }]);
    settle(game);
    expect(zone(game, bears)).toBe("hand");
    expect(counters(game, mine)).toBe(2);
  });
});

describe("top-5000 batch 27h — Syr Vondam, Sunstar Exemplar", () => {
  it("grows when another creature of yours dies, and destroys on leaving with power 4 or more", () => {
    const { game, a } = setUp();
    const syr = spawn(game, "Syr Vondam, Sunstar Exemplar");
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    a.chooseTargetsFn = () => [{ kind: "object", object: giant }];
    const startLife = life(game, A);
    game.state.objects[syr].counters = { "+1/+1": 1 };
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(counters(game, syr)).toBe(2);
    expect(life(game, A)).toBe(startLife + 1);
    // Now a 4/4: dying, it takes the Giant with it.
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: syr }]);
    settle(game);
    expect(zone(game, giant)).toBe("graveyard");
  });

  it("doesn't trigger on leaving with power below 4", () => {
    const { game, a } = setUp();
    const syr = spawn(game, "Syr Vondam, Sunstar Exemplar");
    const giant = spawn(game, "Hill Giant", B);
    a.chooseTargetsFn = () => [{ kind: "object", object: giant }];
    game.debugApplyEffect(A, { kind: "exile", target: 0 }, [{ kind: "object", object: syr }]);
    settle(game);
    expect(zone(game, giant)).toBe("battlefield");
  });
});

describe("top-5000 batch 27h — Nemesis of Reason", () => {
  it("makes the defending player mill ten", () => {
    const { game, a } = setUp();
    const nemesis = spawn(game, "Nemesis of Reason");
    attackOnce(a, nemesis);
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    settle(game);
    expect(game.graveyardOf(B).length).toBe(10);
    expect(game.graveyardOf(A).length).toBe(0);
  });
});

describe("top-5000 batch 27h — Bloodsoaked Champion", () => {
  it("returns from the graveyard only after you attacked this turn", () => {
    const { game, a } = setUp();
    spawn(game, "Swamp");
    spawn(game, "Swamp");
    const champion = game.debugSpawn("Bloodsoaked Champion", A, "graveyard");
    const offered = (): boolean =>
      game.legalActions(A).some((l) => l.kind === "activate-ability" && l.source === champion);
    expect(offered()).toBe(false);
    attackOnce(a, spawn(game, "Grizzly Bears"));
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    settle(game);
    expect(offered()).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: champion, abilityIndex: 0, targets: [] });
    settle(game);
    expect(zone(game, champion)).toBe("battlefield");
  });
});

describe("top-5000 batch 27h — Tower Winder", () => {
  it("can find Command Tower in the graveyard", () => {
    const { game } = setUp();
    const tower = game.debugSpawn("Command Tower", A, "graveyard");
    game.debugSpawn("Tower Winder", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, tower)).toBe("hand");
  });
});

describe("top-5000 batch 27h — Nightshade Harvester", () => {
  it("drains the land's controller and grows, for an opponent's land only", () => {
    const { game } = setUp();
    const harvester = spawn(game, "Nightshade Harvester");
    const bLife = life(game, B);
    const aLife = life(game, A);
    game.debugSpawn("Wastes", B, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, B)).toBe(bLife - 1);
    expect(counters(game, harvester)).toBe(1);
    game.debugSpawn("Wastes", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, A)).toBe(aLife);
    expect(counters(game, harvester)).toBe(1);
    expect(named(game, "Nightshade Harvester")).toHaveLength(1);
  });
});
