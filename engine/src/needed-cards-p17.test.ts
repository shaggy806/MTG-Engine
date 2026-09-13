/**
 * needed-cards P17 — a small grab-bag pass: Amulet of Vigor (untap effect
 * widened to accept `"trigger-object"`), Sakura-Tribe Elder (a sac-cost
 * search — zero new vocab), the SOC "Fen"/"Thicket" dual-land cycle-mates
 * (Bountiful Landscape, Festering Thicket, Vernal Fen, Turbulent Fen — the
 * last needing a new `opponents-control-total` StaticCondition, distinct
 * from `opponent-controls`'s per-opponent count), and Manifold Key (a new
 * `"artifact"` TargetSpec).
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A;

const makeGame = (aCards: readonly string[], bCards: readonly string[] = []) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad(bCards) },
    ],
  });
  game.advanceUntil(toPrecombat);
  return game;
};

describe("Amulet of Vigor", () => {
  it("untaps a permanent you control the instant it enters tapped", () => {
    const game = makeGame([]);
    game.debugSpawn("Amulet of Vigor", A);

    // Put a land that enters tapped straight into A's hand, then play it for
    // real so the enters-battlefield event actually gets emitted (debugSpawn
    // bypasses that — see the P12 note in neededCards-features.md).
    const id = asObjectId(`hand-${game.state.nextObjectSeq}`);
    game.state.nextObjectSeq += 1;
    game.state.objects[id] = { ...game.state.objects[game.handOf(A)[0]]!, id, cardName: "Sheltered Thicket" };
    game.state.zones.perPlayer[A].hand.push(id);

    game.dispatch({ type: "play-land", player: A, card: id });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);

    expect(game.state.objects[id]?.zone).toBe("battlefield");
    expect(game.state.objects[id]?.tapped).toBe(false);
  });

  it("doesn't fire off an opponent's tapped permanent", () => {
    const game = makeGame([], ["Sheltered Thicket"]);
    game.debugSpawn("Amulet of Vigor", A); // A's Amulet, not B's

    const toBTurn = (s: GameState): boolean =>
      s.turnOrder[s.turn.activePlayerIndex] === B &&
      s.turn.step === "precombat-main" &&
      s.priority.holder === B;
    game.advanceUntil(toBTurn); // A's ScriptedController auto-passes the whole turn

    const thicket = game.handOf(B).find((id) => game.state.objects[id].cardName === "Sheltered Thicket")!;
    game.dispatch({ type: "play-land", player: B, card: thicket });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);

    expect(game.state.objects[thicket]?.zone).toBe("battlefield");
    expect(game.state.objects[thicket]?.tapped).toBe(true);
  });
});

describe("Sakura-Tribe Elder", () => {
  it("sacrifices to fetch a basic land onto the battlefield tapped", () => {
    const a = new ScriptedController(A);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: a, [B]: new ScriptedController(B) },
      decks: [
        { player: A, cards: [...Array(8).fill("Island"), "Forest", ...Array(31).fill("Swamp")] },
        { player: B, cards: pad([]) },
      ],
    });
    game.advanceUntil(toPrecombat);
    const elder = game.debugSpawn("Sakura-Tribe Elder", A, "battlefield", { summoningSick: false });
    a.chooseFromZoneFn = (_v, eligible) => eligible.slice(0, 1);

    game.dispatch({ type: "activate-ability", player: A, source: elder, abilityIndex: 0 });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);

    expect(game.state.objects[elder]?.zone).toBe("graveyard");
    const forest = game.battlefield.find((id) => game.state.objects[id].cardName === "Forest");
    expect(forest).toBeDefined();
    expect(game.state.objects[forest!]?.tapped).toBe(true);
  });
});

describe("SOC dual-land cycle-mates", () => {
  it("Vernal Fen — tapped unless you already control two basics", () => {
    const none = makeGame([]);
    expect(none.state.objects[none.debugSpawn("Vernal Fen", A)]?.tapped).toBe(true);

    const two = makeGame([]);
    two.debugSpawn("Swamp", A);
    two.debugSpawn("Forest", A);
    expect(two.state.objects[two.debugSpawn("Vernal Fen", A)]?.tapped).toBe(false);
  });

  it("Turbulent Fen — tapped unless opponents control eight-plus lands combined", () => {
    const few = makeGame([]);
    for (let i = 0; i < 7; i++) few.debugSpawn("Island", B);
    expect(few.state.objects[few.debugSpawn("Turbulent Fen", A)]?.tapped).toBe(true);

    const many = makeGame([]);
    for (let i = 0; i < 8; i++) many.debugSpawn("Island", B);
    expect(many.state.objects[many.debugSpawn("Turbulent Fen", A)]?.tapped).toBe(false);

    // spread across two opponents still sums to the combined total
    const split = makeGame([]);
    for (let i = 0; i < 4; i++) split.debugSpawn("Island", B);
    for (let i = 0; i < 4; i++) split.debugSpawn("Mountain", A); // A's own lands don't count
    expect(split.state.objects[split.debugSpawn("Turbulent Fen", A)]?.tapped).toBe(true);
  });

  it("Festering Thicket always enters tapped; Bountiful Landscape never does", () => {
    const game = makeGame([]);
    expect(game.state.objects[game.debugSpawn("Festering Thicket", A)]?.tapped).toBe(true);
    expect(game.state.objects[game.debugSpawn("Bountiful Landscape", A)]?.tapped).toBe(false);
  });
});

describe("Manifold Key", () => {
  it("untaps another target artifact", () => {
    const game = makeGame([]);
    const key = game.debugSpawn("Manifold Key", A, "battlefield", { summoningSick: false, tapped: false });
    const sol = game.debugSpawn("Sol Ring", A, "battlefield", { tapped: true });
    game.debugSpawn("Island", A, "battlefield", { tapped: false });

    const target = { kind: "object" as const, object: sol };
    game.dispatch({ type: "activate-ability", player: A, source: key, abilityIndex: 0, targets: [target] });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);

    expect(game.state.objects[sol]?.tapped).toBe(false);
    expect(game.state.objects[key]?.tapped).toBe(true);
  });

  it("can't target a non-artifact permanent", () => {
    const game = makeGame([]);
    const key = game.debugSpawn("Manifold Key", A, "battlefield", { summoningSick: false, tapped: false });
    const bear = game.debugSpawn("Grizzly Bears", A);
    game.debugSpawn("Sol Ring", A, "battlefield", { tapped: true }); // another artifact, so the ability has a legal target at all
    game.debugSpawn("Island", A, "battlefield", { tapped: false });

    const legal = game
      .legalActions(A)
      .find((act) => act.kind === "activate-ability" && act.source === key && act.abilityIndex === 0);
    expect(legal?.kind).toBe("activate-ability");
    if (legal?.kind === "activate-ability") {
      const slot = legal.targetOptions?.[0] ?? [];
      expect(slot.some((t) => t.kind === "object" && t.object === bear)).toBe(false);
    }
  });

  it("can't target itself — no repeatable no-net-cost untap loop", () => {
    const game = makeGame([]);
    const key = game.debugSpawn("Manifold Key", A, "battlefield", { summoningSick: false, tapped: false });
    game.debugSpawn("Sol Ring", A, "battlefield", { tapped: true }); // another artifact, so the ability has a legal target at all
    game.debugSpawn("Island", A, "battlefield", { tapped: false });
    game.debugSpawn("Island", A, "battlefield", { tapped: false });

    const legal = game
      .legalActions(A)
      .find((act) => act.kind === "activate-ability" && act.source === key && act.abilityIndex === 0);
    expect(legal?.kind).toBe("activate-ability");
    if (legal?.kind === "activate-ability") {
      const slot = legal.targetOptions?.[0] ?? [];
      expect(slot.some((t) => t.kind === "object" && t.object === key)).toBe(false);
    }

    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: key,
        abilityIndex: 0,
        targets: [{ kind: "object", object: key }],
      }),
    ).toThrow();
  });
});
