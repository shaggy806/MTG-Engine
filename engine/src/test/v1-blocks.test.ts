/**
 * v1's blocks (`HeuristicBotController.declareBlockers`), which v2's attack
 * planner predicts every defender with (`simulateCombat`): a trade worth
 * taking, a gang block, no block into deathtouch — the deck autopsies of
 * 2026-10-02 found v2 attacking into blocks this model never made.
 */
import { describe, expect, it } from "vitest";

import type { BlockerDeclaration } from "../actions.js";
import { createDefaultRegistry } from "../cards.js";
import { HeuristicBotController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

/** Bob attacks Alice with `attackers`; returns v1-Alice's blocks. */
function blocksAgainst(mine: readonly string[], attackers: readonly string[], setup?: (game: Game, ids: { mine: ObjectId[]; theirs: ObjectId[] }) => void) {
  const game = Game.create({
    seed: 3,
    registry,
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Forest") })),
  });
  game.advanceUntil(
    (s) => s.turnOrder[s.turn.activePlayerIndex] === B && s.priority.holder === B && s.turn.step === "precombat-main",
  );
  game.state.players[A].life = 40;
  const ids = {
    mine: mine.map((n) => game.debugSpawn(n, A, "battlefield", { summoningSick: false })),
    theirs: attackers.map((n) => game.debugSpawn(n, B, "battlefield", { summoningSick: false })),
  };
  setup?.(game, ids);
  game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === B);
  game.dispatch({
    type: "declare-attackers",
    player: B,
    attackers: ids.theirs.map((attacker) => ({ attacker, defender: A })),
  });
  game.advanceUntil((s) => s.awaiting?.kind === "blockers" && s.awaiting.player === A);
  const blocks: readonly BlockerDeclaration[] = new HeuristicBotController(A, registry).declareBlockers(game.controllerView(A));
  return { blocks, ids };
}

describe("v1 blocks", () => {
  it("trades a small creature for an attacking commander", () => {
    const { blocks, ids } = blocksAgainst(["Centaur Courser"], ["Centaur Courser"], (game, { theirs }) => {
      game.state.objects[theirs[0]].isCommander = true;
    });
    expect(blocks).toEqual([{ blocker: ids.mine[0], attacker: ids.theirs[0] }]);
  });

  it("gang-blocks a big attacker two blockers kill together", () => {
    // A 4/4 against a 3/3 and a 2/2: it kills one, and dies.
    const { blocks, ids } = blocksAgainst(["Centaur Courser", "Grizzly Bears"], ["Rumbling Baloth"]);
    expect(blocks.map((b) => b.blocker).sort()).toEqual([...ids.mine].sort());
    expect(blocks.every((b) => b.attacker === ids.theirs[0])).toBe(true);
  });

  it("doesn't gang-block when the attacker would take both", () => {
    // A 6/4 against two 2/2s: it kills both — a 2-for-1 the wrong way.
    const { blocks } = blocksAgainst(["Grizzly Bears", "Grizzly Bears"], ["Craw Wurm"]);
    expect(blocks).toEqual([]);
  });

  it("doesn't block a deathtouch attacker with a creature that would survive anything else", () => {
    const { blocks } = blocksAgainst(["Craw Wurm"], ["Typhoid Rats"]);
    expect(blocks).toEqual([]);
  });
});
