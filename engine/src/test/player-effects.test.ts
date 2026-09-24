/**
 * Continuous effects a resolved ability gives a player for a while (the
 * `player-effect` effect — an emblem that expires): Rowan, Scion of War's
 * "spells you cast this turn that are black and/or red cost {X} less to
 * cast, where X is the amount of life you lost this turn" (X fixed as it
 * resolves — rule 611.2b), and Yusri, Fortune's Flame's "you may cast spells
 * from your hand this turn without paying their mana costs".
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (hand: readonly string[]) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry: createDefaultRegistry(),
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill("Island")] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const run = (game: Game, effect: EffectSpec): void => {
  const source = game.debugSpawn("Grizzly Bears", A, "battlefield");
  game.debugApplyEffect(A, effect, [], { source });
};
const inHand = (game: Game, name: string): ObjectId =>
  game.handOf(A).find((id) => game.state.objects[id].cardName === name)!;
const castOffers = (game: Game, card: ObjectId): Extract<LegalAction, { kind: "cast-spell" }>[] =>
  game
    .legalActions(A)
    .filter((o): o is Extract<LegalAction, { kind: "cast-spell" }> => o.kind === "cast-spell" && o.card === card);

const ROWAN: EffectSpec = {
  kind: "player-effect",
  duration: "end-of-turn",
  reduceSpells: {
    applies: { anyOf: [{ colors: ["B"] }, { colors: ["R"] }] },
    reduceGeneric: { turnStat: "life-lost", who: "you" },
  },
};

describe("a spell cost reduction for the turn", () => {
  it("Rowan: black and/or red spells cost {X} less, X fixed as it resolves", () => {
    const game = setUp(["Hill Giant", "Grizzly Bears"]);
    game.debugSpawn("Mountain", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    const giant = inHand(game, "Hill Giant");
    expect(castOffers(game, giant)).toHaveLength(0);
    run(game, { kind: "lose-life", amount: 3, who: "you" });
    run(game, ROWAN);
    // {3}{R} less 3: a Mountain pays it.
    expect(castOffers(game, giant).length).toBeGreaterThan(0);
    // Losing more life later doesn't change X.
    run(game, { kind: "lose-life", amount: 2, who: "you" });
    expect(game.state.playerEffects?.[0]?.reduceSpells?.reduceGeneric).toBe(3);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.playerEffects).toEqual([]);
  });
});

describe("cast spells from your hand without paying their mana costs", () => {
  it("Yusri: a free cast is offered for cards in hand, this turn only", () => {
    const game = setUp(["Hill Giant"]);
    const giant = inHand(game, "Hill Giant");
    expect(castOffers(game, giant)).toHaveLength(0);
    run(game, { kind: "player-effect", duration: "end-of-turn", castFromHandFree: {} });
    const free = castOffers(game, giant).find((o) => o.free === true);
    expect(free).toBeDefined();
    game.dispatch({ type: "cast-spell", player: A, card: giant, targets: [], free: true });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0);
    expect(game.state.objects[giant].zone).toBe("battlefield");
  });

  it("until your next turn: it lasts through the opponent's turn", () => {
    const game = setUp([]);
    run(game, { kind: "player-effect", duration: "until-your-next-turn", castFromHandFree: {} });
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.playerEffects).toHaveLength(1);
    game.advanceUntil((s) => s.turn.number === 3);
    expect(game.state.playerEffects).toHaveLength(0);
  });
});

describe("damage to a player, multiplied until your next turn", () => {
  it("Lightning's shape: sources deal that player — and their permanents — double", () => {
    const game = setUp([]);
    run(game, {
      kind: "player-effect",
      duration: "until-your-next-turn",
      damageTo: { who: "each-opponent", multiplier: 2, permanentsToo: true },
    });
    const source = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const hit = (to: { kind: "player"; player: typeof A } | { kind: "object"; object: ObjectId }) =>
      game.debugApplyEffect(A, { kind: "damage", amount: 3, target: 0 }, [to], { source });
    hit({ kind: "player", player: B });
    expect(game.state.players[B].life).toBe(14);
    const theirs = game.debugSpawn("Hill Giant", B, "battlefield");
    hit({ kind: "object", object: theirs });
    expect(game.state.objects[theirs].damageMarked).toBe(6);
    hit({ kind: "player", player: A });
    expect(game.state.players[A].life).toBe(17);
    // Bob's turn: still on. Alice's next: gone.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    hit({ kind: "player", player: B });
    expect(game.state.players[B].life).toBe(8);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    hit({ kind: "player", player: B });
    expect(game.state.players[B].life).toBe(5);
  });
});
