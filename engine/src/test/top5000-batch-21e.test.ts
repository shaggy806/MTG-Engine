/**
 * Top-5000 batch 21e. No engine change: each test pins the clause of its card
 * most likely to be wired wrong — the second landfall resolution doubling
 * instead of adding (Scythecat Cub), a land top card going to the battlefield
 * and anything else to the hand (Fecund Greenshell), "this or another
 * nontoken Zombie" (Headless Rider), the attacker's controller losing the
 * life (Revenge of Ravens), X counted from Vampires and sparing them
 * (Olivia's Wrath), exile-then-transform (Venat), the "if legendary" draw
 * (Hydaelyn), fliers spared and players hit (Earthquake), and {B} per mana
 * value (Sacrifice).
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { nameOf } from "../state.js";
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
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: true });
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
const destroy = (game: Game, id: ObjectId): void => {
  game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: id }]);
  settle(game);
};

describe("top-5000 batch 21e — Scythecat Cub", () => {
  it("adds a counter, doubles on the second resolution this turn, then adds again", () => {
    const { game } = setUp([], "Forest");
    const cub = spawn(game, "Scythecat Cub");
    game.state.objects[cub].counters = { "+1/+1": 2 };
    const play = (): void => {
      game.dispatch({ type: "play-land", player: A, card: inHand(game, "Forest") });
      settle(game);
    };
    play();
    expect(counters(game, cub)).toBe(3);
    play();
    expect(counters(game, cub)).toBe(6);
    play();
    expect(counters(game, cub)).toBe(7);
  });
});

describe("top-5000 batch 21e — Fecund Greenshell", () => {
  it("puts a land top card onto the battlefield tapped when a creature with toughness > power enters", () => {
    const { game } = setUp([], "Forest");
    spawn(game, "Fecund Greenshell");
    expect(named(game, "Forest")).toHaveLength(0);
    enter(game, "Ornithopter");
    settle(game);
    const forests = named(game, "Forest");
    expect(forests).toHaveLength(1);
    expect(game.state.objects[forests[0]].tapped).toBe(true);
  });

  it("puts a nonland top card into the hand, and ignores a creature whose toughness isn't greater", () => {
    const { game } = setUp([], "Grizzly Bears");
    spawn(game, "Fecund Greenshell");
    const hand = game.handOf(A).length;
    enter(game, "Llanowar Elves");
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand);
    enter(game, "Ornithopter");
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand + 1);
  });

  it("gives creatures +2/+2 only from the tenth land", () => {
    const { game } = setUp();
    const shell = spawn(game, "Fecund Greenshell");
    lands(game, "Forest", 9);
    expect(game.characteristics(shell).power).toBe(4);
    spawn(game, "Forest");
    expect(game.characteristics(shell).power).toBe(6);
    expect(game.characteristics(shell).toughness).toBe(8);
  });
});

describe("top-5000 batch 21e — Headless Rider", () => {
  it("makes a Zombie for itself and a nontoken Zombie, never for a Zombie token", () => {
    const { game } = setUp();
    const rider = spawn(game, "Headless Rider");
    const corpse = spawn(game, "Walking Corpse");
    destroy(game, corpse);
    const tokens = named(game, "Zombie Token");
    expect(tokens).toHaveLength(1);
    destroy(game, tokens[0]);
    expect(named(game, "Zombie Token")).toHaveLength(0);
    destroy(game, rider);
    expect(named(game, "Zombie Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 21e — Revenge of Ravens", () => {
  it("drains the attacking creature's controller", () => {
    const { game, a } = setUp();
    spawn(game, "Revenge of Ravens", B);
    const bears = spawn(game, "Grizzly Bears");
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, A)).toBe(19);
    expect(life(game, B)).toBe(19);
  });
});

describe("top-5000 batch 21e — Olivia's Wrath", () => {
  it("gives each non-Vampire creature -X/-X for the Vampires you control", () => {
    const { game } = setUp();
    const hawk = spawn(game, "Vampire Nighthawk");
    spawn(game, "Vampire Nighthawk");
    const mine = spawn(game, "Hill Giant");
    const theirs = spawn(game, "Hill Giant", B);
    spawn(game, "Vampire Nighthawk", B);
    game.debugApplyEffect(A, effectOf("Olivia's Wrath"));
    expect(game.characteristics(theirs).power).toBe(1);
    expect(game.characteristics(theirs).toughness).toBe(1);
    expect(game.characteristics(mine).toughness).toBe(1);
    expect(game.characteristics(hawk).toughness).toBe(3);
  });
});

describe("top-5000 batch 21e — Venat, Heart of Hydaelyn", () => {
  it("exiles the target and transforms into Hydaelyn", () => {
    const { game } = setUp();
    lands(game, "Wastes", 7);
    const venat = spawn(game, "Venat, Heart of Hydaelyn");
    const giant = spawn(game, "Hill Giant", B);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: venat,
      abilityIndex: 0,
      targets: [{ kind: "object", object: giant }],
    });
    settle(game);
    expect(zone(game, giant)).toBe("exile");
    expect(nameOf(game.state.objects[venat])).toBe("Hydaelyn, the Mothercrystal");
  });

  it("Hydaelyn draws only when the creature is legendary", () => {
    const { game } = setUp();
    // The back face's own ability, applied from Venat (a back face is never
    // spawned on its own).
    const hydaelyn = spawn(game, "Venat, Heart of Hydaelyn");
    const blessing = registry.get("Hydaelyn, the Mothercrystal")!.triggered[0].effect!;
    const bears = spawn(game, "Grizzly Bears");
    const jaxis = spawn(game, "Jaxis, the Troublemaker");
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, blessing, [{ kind: "object", object: bears }], { source: hydaelyn });
    settle(game);
    expect(counters(game, bears)).toBe(1);
    expect(game.characteristics(bears).keywords).toContain("indestructible");
    expect(game.handOf(A)).toHaveLength(hand);
    game.debugApplyEffect(A, blessing, [{ kind: "object", object: jaxis }], { source: hydaelyn });
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand + 1);
  });
});

describe("top-5000 batch 21e — Earthquake", () => {
  it("deals X to each creature without flying and to each player", () => {
    const { game } = setUp(["Earthquake"], "Mountain");
    lands(game, "Mountain", 3);
    const giant = spawn(game, "Hill Giant", B);
    const bears = spawn(game, "Grizzly Bears", B);
    const crow = spawn(game, "Storm Crow", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Earthquake"), targets: [], xValue: 2 });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(game.state.objects[giant].damageMarked).toBe(2);
    expect(game.state.objects[crow].damageMarked).toBe(0);
    expect(life(game, A)).toBe(18);
    expect(life(game, B)).toBe(18);
  });
});

describe("top-5000 batch 21e — Sacrifice", () => {
  it("adds {B} for each point of the sacrificed creature's mana value", () => {
    const { game } = setUp();
    spawn(game, "Swamp");
    const giant = spawn(game, "Hill Giant"); // mana value 4
    const card = game.debugSpawn("Sacrifice", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [], sacrifice: giant });
    game.advanceUntil(quiet);
    expect(zone(game, giant)).toBe("graveyard");
    expect(pool(game)).toEqual(["B", "B", "B", "B"]);
  });
});
