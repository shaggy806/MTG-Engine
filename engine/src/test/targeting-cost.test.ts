/**
 * Terror of the Peaks: "Spells your opponents cast that target this creature
 * cost an additional 3 life to cast." An additional cost of the spell, paid
 * as it's cast (rule 601.2f) — it used to run as ward, paid (or countered)
 * after the cast and reaching abilities too.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Bob's main phase, turn 2, a Lightning Bolt in his hand and a Mountain to
 * cast it; Alice controls Terror of the Peaks. */
const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array(40).fill("Mountain") },
      { player: B, cards: ["Lightning Bolt", ...Array(40).fill("Mountain")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
  const terror = game.debugSpawn("Terror of the Peaks", A, "battlefield");
  const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
  game.debugSpawn("Mountain", B, "battlefield");
  const bolt = game.handOf(B).find((id) => game.state.objects[id].cardName === "Lightning Bolt")!;
  return { game, terror, bears, bolt };
};

const settled = (s: GameState): boolean => s.zones.shared.stack.length === 0 && s.awaiting === null;
const boltAt = (game: Game, caster: PlayerId, bolt: ObjectId, target: ObjectId) =>
  game.dispatch({ type: "cast-spell", player: caster, card: bolt, targets: [{ kind: "object", object: target }] });
const boltOptions = (game: Game, bolt: ObjectId): readonly ObjectId[] => {
  const offer = game.legalActions(B).find((a) => a.kind === "cast-spell" && a.card === bolt);
  return offer?.kind === "cast-spell"
    ? offer.targetOptions[0].flatMap((r) => (r.kind === "object" ? [r.object] : []))
    : [];
};

describe("Terror of the Peaks — a spell targeting it costs 3 more life", () => {
  it("an opponent's Bolt at it costs 3 life as it's cast", () => {
    const { game, terror, bolt } = setUp();
    const life = game.state.players[B].life;
    boltAt(game, B, bolt, terror);
    // Paid with the spell still on the stack: it's part of the cast.
    expect(game.state.players[B].life).toBe(life - 3);
    game.advanceUntil(settled);
    expect(game.state.objects[terror].damageMarked).toBe(3);
  });

  it("can't be targeted by a spell its caster can't pay the life for", () => {
    const { game, terror, bears, bolt } = setUp();
    game.state.players[B].life = 2;
    expect(boltOptions(game, bolt)).not.toContain(terror);
    expect(boltOptions(game, bolt)).toContain(bears);
    expect(() => boltAt(game, B, bolt, terror)).toThrow(/life/);
  });

  it("costs nothing to aim elsewhere", () => {
    const { game, bears, bolt } = setUp();
    const life = game.state.players[B].life;
    boltAt(game, B, bolt, bears);
    expect(game.state.players[B].life).toBe(life);
  });

  it("costs its own controller nothing", () => {
    const { game, terror } = setUp();
    game.state.objects[terror].controller = B;
    const { bolt } = { bolt: game.handOf(B).find((id) => game.state.objects[id].cardName === "Lightning Bolt")! };
    const life = game.state.players[B].life;
    boltAt(game, B, bolt, terror);
    expect(game.state.players[B].life).toBe(life);
  });

  it("isn't paid for an ability targeting it", () => {
    const { game, terror } = setUp();
    const sorcerer = game.debugSpawn("Prodigal Sorcerer", B, "battlefield", { summoningSick: false });
    const life = game.state.players[B].life;
    game.dispatch({
      type: "activate-ability",
      player: B,
      source: sorcerer,
      abilityIndex: 0,
      targets: [{ kind: "object", object: terror }],
    });
    game.advanceUntil(settled);
    expect(game.state.players[B].life).toBe(life);
    expect(game.state.objects[terror].damageMarked).toBe(1);
  });
});
