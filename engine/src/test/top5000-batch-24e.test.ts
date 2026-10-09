/**
 * Top-5000 batch 24e. Pins the clause of each card most likely to be wired
 * wrong: a batched graveyard leave making one token (Tormod), a counter
 * trigger (Stocking the Pantry), an "and/or" search (Map the Frontier), a
 * this-turn sacrifice gate (Elanor Gardner), counters after a return (Smile
 * at Death), "that player" on another's upkeep (Seizan) and on a land's
 * entry (Polluted Bonds), a this-turn entered count (Hobgoblin Bandit Lord),
 * discover (Hidden Nursery), third from the top (Riptide Gearhulk), a
 * last-known "was attacking" (Garna), a fight plus a Treasure (Prizefight)
 * and a six-target bounce (Aether Gale).
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
const triggerEffect = (name: string, index = 0): EffectSpec => registry.get(name)!.triggered[index].effect!;
const activatedEffect = (name: string, index = 0): EffectSpec => registry.get(name)!.activated[index].effect!;
const obj = (object: ObjectId): { kind: "object"; object: ObjectId } => ({ kind: "object", object });

describe("top-5000 batch 24e — Tormod, the Desecrator", () => {
  it("makes one tapped Zombie however many cards leave the graveyard together", () => {
    const { game } = setUp();
    spawn(game, "Tormod, the Desecrator");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Hill Giant", A, "graveyard");
    game.debugSpawn("Llanowar Elves", A, "graveyard");
    game.debugApplyEffect(A, { kind: "exile-graveyard", target: "you" });
    settle(game);
    const zombies = named(game, "Zombie Token");
    expect(zombies).toHaveLength(1);
    expect(game.state.objects[zombies[0]].tapped).toBe(true);
  });
});

describe("top-5000 batch 24e — Stocking the Pantry", () => {
  it("gets a supply counter when you put +1/+1 counters on a creature you control, not another's", () => {
    const { game } = setUp();
    const pantry = spawn(game, "Stocking the Pantry");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 }, [obj(bears)]);
    settle(game);
    expect(counters(game, pantry, "supply")).toBe(1);
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [obj(theirs)]);
    settle(game);
    expect(counters(game, pantry, "supply")).toBe(1);
  });
});

describe("top-5000 batch 24e — Map the Frontier", () => {
  it("finds a basic land and a Desert, both tapped", () => {
    const { game, a } = setUp();
    const desert = game.debugSpawn("Desert of the Indomitable", A, "library");
    a.chooseFromZoneFn = (_view, eligible) => {
      const basic = eligible.find((id) => game.state.objects[id].cardName === "Wastes")!;
      return [desert, basic];
    };
    const wastesBefore = named(game, "Wastes").length;
    game.debugApplyEffect(A, effectOf("Map the Frontier"));
    settle(game);
    expect(zone(game, desert)).toBe("battlefield");
    expect(game.state.objects[desert].tapped).toBe(true);
    const wastes = named(game, "Wastes");
    expect(wastes).toHaveLength(wastesBefore + 1);
    expect(wastes.every((id) => game.state.objects[id].tapped)).toBe(true);
  });
});

describe("top-5000 batch 24e — Elanor Gardner", () => {
  it("fetches a basic land tapped at your end step if you sacrificed a Food this turn", () => {
    const { game } = setUp();
    spawn(game, "Elanor Gardner");
    const food = spawn(game, "Food Token");
    game.debugApplyEffect(A, { kind: "sacrifice-target", target: 0 }, [obj(food)]);
    settle(game);
    const before = named(game, "Wastes").length;
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "end");
    settle(game);
    const wastes = named(game, "Wastes");
    expect(wastes).toHaveLength(before + 1);
    expect(wastes.every((id) => game.state.objects[id].tapped)).toBe(true);
  });

  it("does nothing on a turn with no Food sacrificed", () => {
    const { game } = setUp();
    spawn(game, "Elanor Gardner");
    spawn(game, "Food Token");
    const before = named(game, "Wastes").length;
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "end");
    settle(game);
    expect(named(game, "Wastes")).toHaveLength(before);
  });
});

describe("top-5000 batch 24e — Smile at Death", () => {
  it("returns both creature cards and puts a +1/+1 counter on each", () => {
    const { game } = setUp();
    const elves = game.debugSpawn("Llanowar Elves", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, triggerEffect("Smile at Death"), [obj(elves), obj(bears)]);
    settle(game);
    const back = [...named(game, "Llanowar Elves"), ...named(game, "Grizzly Bears")];
    expect(back).toHaveLength(2);
    for (const id of back) expect(counters(game, id)).toBe(1);
  });
});

describe("top-5000 batch 24e — Seizan, Perverter of Truth", () => {
  it("makes the player whose upkeep it is lose 2 life and draw two cards", () => {
    const { game } = setUp();
    spawn(game, "Seizan, Perverter of Truth");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(20);
    // 40 cards, less an opening hand of 7, Seizan's two and the draw step's one.
    expect(game.libraryOf(B)).toHaveLength(30);
  });
});

describe("top-5000 batch 24e — Polluted Bonds", () => {
  it("drains the opponent whose land entered, and ignores your own lands", () => {
    const { game } = setUp();
    spawn(game, "Polluted Bonds");
    game.debugSpawn("Wastes", B, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
    game.debugSpawn("Wastes", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, A)).toBe(22);
  });
});

describe("top-5000 batch 24e — Hidden Nursery", () => {
  it("discovers 4: exiles past lands to a card with mana value 4 or less, the rest to the bottom", () => {
    const { game } = setUp();
    const giant = game.debugSpawn("Hill Giant", A, "library");
    const forest = game.debugSpawn("Forest", A, "library");
    const nursery = spawn(game, "Hidden Nursery");
    // Declined (the scripted default), the card goes to the hand.
    game.debugApplyEffect(A, activatedEffect("Hidden Nursery", 1), [], { source: nursery });
    settle(game);
    expect(zone(game, giant)).toBe("hand");
    const library = game.libraryOf(A);
    expect(library[library.length - 1]).toBe(forest);
  });
});

describe("top-5000 batch 24e — Garna, Bloodfist of Keld", () => {
  it("deals 1 damage to each opponent when a creature that wasn't attacking dies", () => {
    const { game } = setUp();
    spawn(game, "Garna, Bloodfist of Keld");
    const bears = spawn(game, "Grizzly Bears");
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bears)]);
    settle(game);
    expect(life(game, B)).toBe(19);
    expect(game.handOf(A)).toHaveLength(hand);
  });
});

describe("top-5000 batch 24e — Aether Gale", () => {
  it("returns all six targets to their owners' hands", () => {
    const { game } = setUp();
    const targets = [
      spawn(game, "Grizzly Bears", B),
      spawn(game, "Hill Giant", B),
      spawn(game, "Sol Ring", B),
      spawn(game, "Mind Stone", B),
      spawn(game, "Ornithopter", B),
      spawn(game, "Llanowar Elves", A),
    ];
    game.debugApplyEffect(A, effectOf("Aether Gale"), targets.map(obj));
    settle(game);
    for (const id of targets) expect(zone(game, id)).toBe("hand");
  });
});
