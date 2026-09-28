/**
 * The evaluation's sense of threat (`bot/features.ts`, `threat`): who
 * attacked whom is remembered (`PlayerState.lastAttackedBy`), and a creature
 * whose controller swung at us last round counts its combat damage in full,
 * where anyone else's is split across that player's opponents. A search
 * scores a move at the end of the turn, when nothing is attacking any more.
 */

import { describe, expect, it } from "vitest";

import { DEFAULT_WEIGHTS } from "../bot/evaluate.js";
import { playerFeatures } from "../bot/features.js";
import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const [A, B, C, D] = ["alice", "bob", "carol", "dave"].map(asPlayerId);
const registry = createDefaultRegistry();

function table(): Game {
  const game = Game.create({
    seed: 3,
    shuffle: false,
    registry,
    startingPlayer: C,
    decks: [A, B, C, D].map((player) => ({ player, cards: Array(40).fill("Forest") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === C);
  return game;
}

const threatTo = (game: Game) =>
  playerFeatures(game.state, registry, A, true, DEFAULT_WEIGHTS.landCap).threat;

describe("threat", () => {
  it("splits an opponent's creature across their opponents until they attack us", () => {
    const game = table();
    const wurm = game.debugSpawn("Craw Wurm", C, "battlefield", { summoningSick: false });
    game.debugSpawn("Craw Wurm", B, "battlefield", { summoningSick: false });
    // Two 6-power Wurms, each split three ways.
    expect(threatTo(game)).toBeCloseTo(4);

    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: C, attackers: [{ attacker: wurm, defender: A }] });
    expect(game.state.players[A].lastAttackedBy?.[C]).toBe(game.state.turn.number);
    // Carol's now counts in full: 6 + 2.
    expect(threatTo(game)).toBeCloseTo(8);
  });

  it("counts only what could attack us next turn", () => {
    const game = table();
    const wurm = game.debugSpawn("Craw Wurm", C, "battlefield", { summoningSick: false });
    expect(threatTo(game)).toBeCloseTo(2);
    // Tapped and summoning sick now, both gone by carol's next combat.
    game.state.objects[wurm].tapped = true;
    game.state.objects[wurm].summoningSick = true;
    expect(threatTo(game)).toBeCloseTo(2);
    // Goaded by us, with others to attack: it has to go elsewhere.
    game.state.objects[wurm].goadedForGameBy = [A];
    expect(threatTo(game)).toBeCloseTo(0);
    game.state.objects[wurm].goadedForGameBy = undefined;
    // Under our Vow of Duty it can't attack us at all, +2/+2 or not.
    const vow = game.debugSpawn("Vow of Duty", A, "battlefield");
    game.state.objects[vow].attachedTo = wurm;
    expect(threatTo(game)).toBeCloseTo(0);
    // Under bob's it can't attack bob: an 8/8 split between us and dave.
    game.state.objects[vow].controller = B;
    expect(threatTo(game)).toBeCloseTo(4);
  });

  it("scales a commander by what's left of its 21", () => {
    const game = table();
    const commander = game.debugSpawn("Anafenza, the Foremost", B, "battlefield", { summoningSick: false });
    game.state.objects[commander].isCommander = true;
    const plain = threatTo(game);
    game.state.players[A].commanderDamageTaken = { [commander]: 18 };
    expect(threatTo(game)).toBeGreaterThan(plain * 5);
  });
});
