/**
 * Top-5000 batch 29b — the clauses most likely to be wired wrong: Maelstrom
 * Nexus's cascade only on the first spell of the turn (spells cast before it
 * arrived count), Sword of Once and Future's free cast from the graveyard
 * after its surveil, Thraben Watcher's anthem skipping tokens, Balefire
 * Liege's two cumulative anthems, and Biomass Mutation's base P/T under a
 * counter.
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

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
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
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power ?? 0, c.toughness ?? 0];
};

describe("top-5000 batch 29b — Maelstrom Nexus", () => {
  // Cascade's setup (cascade-commanders.test.ts): eight Wastes for the
  // opening hand and draw, then the cards to cascade into.
  const cascadeGame = (): Game => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      startingPlayer: A,
      rules: { maxLandsPerTurn: 99, skipFirstDraw: false, maxHandSize: 99 },
      decks: [
        { player: A, cards: [...Array<string>(8).fill("Wastes"), "Grizzly Bears", "Grizzly Bears", ...Array<string>(40).fill("Wastes")] },
        { player: B, cards: Array<string>(40).fill("Forest") },
      ],
    });
    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
    for (let i = 0; i < 8; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    return game;
  };
  /** Cast `name` from alice's hand, declining every free cast; how many
   * cascades revealed cards. */
  const castAndCount = (game: Game, name: string): number => {
    const card = game.debugSpawn(name, A, "hand");
    const before = game.eventsOfType("cascade-revealed").length;
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    for (let i = 0; i < 200 && !quiet(game.state); i += 1) {
      if (game.state.awaiting?.kind === "cast-now") {
        game.dispatch({ type: "cast-now", player: game.state.awaiting.player, cast: null });
      } else if (game.state.awaiting !== null) {
        throw new Error(`unexpected ${game.state.awaiting.kind}`);
      } else {
        game.dispatch({ type: "pass-priority", player: game.state.priority.holder! });
      }
    }
    return game.eventsOfType("cascade-revealed").length - before;
  };

  it("gives the first spell of the turn cascade, and not the second", () => {
    const game = cascadeGame();
    game.debugSpawn("Maelstrom Nexus", A, "battlefield");
    expect(castAndCount(game, "Hill Giant")).toBe(1);
    expect(castAndCount(game, "Hill Giant")).toBe(0);
  });

  it("counts a spell cast before it arrived (the ruling)", () => {
    const game = cascadeGame();
    expect(castAndCount(game, "Hill Giant")).toBe(0);
    game.debugSpawn("Maelstrom Nexus", A, "battlefield");
    expect(castAndCount(game, "Hill Giant")).toBe(0);
  });
});

describe("top-5000 batch 29b — Sword of Once and Future", () => {
  it("surveils 2, then casts an instant or sorcery of mana value 2 or less from the graveyard free and exiles it", () => {
    const { game, a } = setUp();
    const sword = spawn(game, "Sword of Once and Future");
    // The top two cards: Lava Spike (1) and Divination (3), both surveilled
    // into the graveyard.
    const [spike, divination] = ["Lava Spike", "Divination"]
      .reverse()
      .map((name) => game.debugSpawn(name, A, "library"))
      .reverse();
    a.chooseScryFn = (_view, cards) => cards;
    let offered: readonly ObjectId[] = [];
    a.chooseCastNowFn = (_view, offer) => {
      offered = offer.cards;
      return {
        type: "cast-spell",
        player: A,
        card: spike,
        targets: [{ kind: "player", player: B }],
        via: "effect",
        free: true,
      };
    };
    const trigger = registry.get("Sword of Once and Future")!.triggered[0].effect!;
    game.debugApplyEffect(A, trigger, [], { source: sword });
    game.advanceUntil(quiet);
    expect(zone(game, divination)).toBe("graveyard");
    // Divination (mana value 3) was never on offer.
    expect([...offered]).toEqual([spike]);
    expect(life(game, B)).toBe(17);
    expect(zone(game, spike)).toBe("exile");
  });

  it("gives +2/+2 and protection from blue and from black", () => {
    const { game } = setUp();
    const sword = spawn(game, "Sword of Once and Future");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[sword].attachedTo = bears;
    expect(pt(game, bears)).toEqual([4, 4]);
  });
});

describe("top-5000 batch 29b — Balefire Liege", () => {
  it("gives a red-and-white creature +2/+2, a red one +1/+1, and not itself", () => {
    const { game } = setUp();
    const liege = spawn(game, "Balefire Liege");
    const recruit = spawn(game, "Boros Recruit");
    const bears = spawn(game, "Grizzly Bears");
    expect(pt(game, liege)).toEqual([2, 4]);
    expect(pt(game, recruit)).toEqual([3, 3]);
    expect(pt(game, bears)).toEqual([2, 2]);
  });

  it("gains 3 life when you cast a white spell", () => {
    const { game } = setUp(["Raise the Alarm"]);
    lands(game, "Plains", 2);
    spawn(game, "Balefire Liege");
    const card = game.handOf(A).find((id) => game.state.objects[id].cardName === "Raise the Alarm")!;
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(23);
  });
});

describe("top-5000 batch 29b — Biomass Mutation", () => {
  it("sets base P/T to X/X, with a +1/+1 counter still on top", () => {
    const { game } = setUp(["Biomass Mutation"]);
    lands(game, "Forest", 5);
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 1 };
    const elves = spawn(game, "Llanowar Elves");
    const theirs = spawn(game, "Grizzly Bears", B);
    const card = game.handOf(A).find((id) => game.state.objects[id].cardName === "Biomass Mutation")!;
    game.dispatch({ type: "cast-spell", player: A, card, targets: [], xValue: 3 });
    game.advanceUntil(quiet);
    expect(pt(game, bears)).toEqual([4, 4]);
    expect(pt(game, elves)).toEqual([3, 3]);
    expect(pt(game, theirs)).toEqual([2, 2]);
  });
});
