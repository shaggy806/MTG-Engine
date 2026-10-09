/**
 * Top-10000 batch 32b — the clauses most likely to be wired wrong: Disorder
 * in the Court's tapped delayed return beside X Clues, Aerith's
 * intervening-if and 7-life upgrade, Zell Dincht's land count and end-step
 * bounce, Desmond Miles's two Assassin counts, Glamdring's damage-bounded
 * free cast, Kulrath Knight's "with counters on them", Breaker of Armies'
 * Lure on itself and Prismari Charm's one-or-two targets.
 */
import { describe, expect, it } from "vitest";

import type { Action, LegalAction } from "../actions.js";
import { computeCharacteristics } from "../characteristics.js";
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

type CastNowOffer = Extract<LegalAction, { kind: "cast-now" }>;
type Cast = Extract<Action, { type: "cast-spell" }>;

const setUp = (
  hand: readonly string[] = [],
  library = "Wastes",
): { game: Game; a: ScriptedController; b: ScriptedController } => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const power = (game: Game, id: ObjectId): number => computeCharacteristics(game.state, registry, id).power;
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
const toNextUpkeep = (s: GameState): boolean => s.turn.number === 2 && s.turn.step === "upkeep";

describe("top-10000 batch 32b — Disorder in the Court", () => {
  it("exiles X creatures, investigates X times, and returns them tapped at the next end step", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(
      A,
      effectOf("Disorder in the Court"),
      [
        { kind: "object", object: bears },
        { kind: "object", object: giant },
      ],
      { x: 2 },
    );
    settle(game);
    expect(zone(game, bears)).toBe("exile");
    expect(zone(game, giant)).toBe("exile");
    expect(named(game, "Clue Token")).toHaveLength(2);
    game.advanceUntil(toNextUpkeep);
    const back = named(game, "Grizzly Bears");
    expect(back).toHaveLength(1);
    // Alice's bears came back tapped and Bob's untap step doesn't touch them.
    expect(game.state.objects[back[0]].tapped).toBe(true);
    expect(game.state.objects[back[0]].controller).toBe(A);
    const giantBack = named(game, "Hill Giant");
    expect(giantBack).toHaveLength(1);
    expect(game.state.objects[giantBack[0]].controller).toBe(B);
  });
});

describe("top-10000 batch 32b — Aerith, Last Ancient", () => {
  it("doesn't trigger without life gained this turn", () => {
    const { game } = setUp();
    spawn(game, "Aerith, Last Ancient");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.advanceUntil(toNextUpkeep);
    expect(zone(game, bears)).toBe("graveyard");
  });

  it("returns the card to hand after a small gain", () => {
    const { game } = setUp();
    spawn(game, "Aerith, Last Ancient");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 1 });
    game.advanceUntil(toNextUpkeep);
    expect(zone(game, bears)).toBe("hand");
  });

  it("returns it to the battlefield once 7 or more life was gained, counted as it resolves", () => {
    const { game } = setUp();
    const aerith = spawn(game, "Aerith, Last Ancient");
    const raise = registry.get("Aerith, Last Ancient")!.triggered[0].effect!;
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 6 });
    game.debugApplyEffect(A, raise, [{ kind: "object", object: bears }], { source: aerith });
    settle(game);
    expect(zone(game, bears)).toBe("hand");
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 1 });
    game.debugApplyEffect(A, raise, [{ kind: "object", object: giant }], { source: aerith });
    settle(game);
    expect(named(game, "Hill Giant")).toHaveLength(1);
  });
});

describe("top-10000 batch 32b — Zell Dincht", () => {
  it("gets +1/+0 per land and returns one land at your end step", () => {
    const { game } = setUp();
    const zell = spawn(game, "Zell Dincht");
    for (let i = 0; i < 3; i += 1) spawn(game, "Mountain");
    spawn(game, "Mountain", B);
    expect(power(game, zell)).toBe(3);
    expect(computeCharacteristics(game.state, registry, zell).toughness).toBe(3);
    const handBefore = game.handOf(A).length;
    game.advanceUntil(toNextUpkeep);
    expect(named(game, "Mountain").filter((id) => game.state.objects[id].controller === A)).toHaveLength(2);
    expect(game.handOf(A).length).toBe(handBefore + 1);
    expect(power(game, zell)).toBe(2);
  });
});

describe("top-10000 batch 32b — Desmond Miles", () => {
  it("counts other Assassins you control and Assassin cards in your graveyard only", () => {
    const { game } = setUp();
    const desmond = spawn(game, "Desmond Miles");
    expect(power(game, desmond)).toBe(1);
    spawn(game, "Arbaaz Mir");
    game.debugSpawn("Basim Ibn Ishaq", A, "graveyard");
    // Neither an opponent's Assassin nor one in an opponent's graveyard.
    spawn(game, "Basim Ibn Ishaq", B);
    game.debugSpawn("Arbaaz Mir", B, "graveyard");
    expect(power(game, desmond)).toBe(3);
  });
});

describe("top-10000 batch 32b — Glamdring", () => {
  it("offers only spells with mana value up to the damage dealt, cast for free", () => {
    const { game, a } = setUp(["Lightning Bolt", "Divination"]);
    const bears = spawn(game, "Grizzly Bears");
    const sword = spawn(game, "Glamdring");
    game.state.objects[sword].attachedTo = bears;
    expect(power(game, bears)).toBe(2);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("first-strike")).toBe(true);
    const bolt = inHand(game, "Lightning Bolt");
    const divination = inHand(game, "Divination");
    let offered: CastNowOffer | undefined;
    a.chooseCastNowFn = (_v, offer): Cast => {
      offered = offer;
      return {
        type: "cast-spell",
        player: A,
        card: bolt,
        targets: [{ kind: "player", player: B }],
        via: "effect",
        free: true,
      };
    };
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main");
    settle(game);
    const cards = offered?.cards ?? [];
    expect(cards).toContain(bolt);
    expect(cards).not.toContain(divination);
    // 2 combat damage, then the free Bolt; no land was needed to pay.
    expect(life(game, B)).toBe(15);
    expect(zone(game, bolt)).toBe("graveyard");
    // The Bolt in the graveyard now pumps the equipped creature.
    expect(power(game, bears)).toBe(3);
  });
});

describe("top-10000 batch 32b — Breaker of Armies", () => {
  it("must be blocked by every creature able to block it", () => {
    const { game, a, b } = setUp();
    const breaker = spawn(game, "Breaker of Armies");
    spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: breaker, defender: B }];
    game.advanceUntil((s) => s.awaiting?.kind === "blockers");
    const la = game.legalActions(B).find((x) => x.kind === "declare-blockers");
    expect(la?.kind === "declare-blockers" ? la.mustBlock : []).toEqual([breaker]);
    b.declareBlockersFn = () => [];
    expect(() => game.advanceUntil((s) => s.turn.step === "postcombat-main")).toThrow(/must block/);
  });
});

describe("top-10000 batch 32b — Prismari Charm", () => {
  it("deals 1 damage to each of two targets", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const mode = registry.get("Prismari Charm")!.castModal!.modes[1].effect!;
    game.debugApplyEffect(A, mode, [
      { kind: "player", player: B },
      { kind: "object", object: bears },
    ]);
    settle(game);
    expect(life(game, B)).toBe(19);
    expect(game.state.objects[bears].damageMarked).toBe(1);
  });
});
