/**
 * Things that leave play partway through, found by playing the precon starter
 * decks against each other:
 *
 * - an ability granted by an Aura, still on the stack after both the creature
 *   and the Aura are gone (rule 113.7a — the ability exists independently of
 *   its source), and
 * - a blocker removed from combat before damage (rule 506.4), including a
 *   token one, which stops existing altogether.
 */

import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const plainGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Forest") })),
  });

describe("a granted ability whose grant is gone before it resolves", () => {
  it("still resolves as the granted ability", () => {
    const game = plainGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.state.objects[bear].summoningSick = false;
    const gond = game.debugSpawn("Presence of Gond", A, "battlefield");
    game.state.objects[gond].attachedTo = bear;

    const grant = game
      .legalActions(A)
      .find((a) => a.kind === "activate-ability" && a.source === bear);
    if (grant?.kind !== "activate-ability") throw new Error("Presence of Gond granted nothing");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: bear,
      abilityIndex: grant.abilityIndex,
      targets: [],
    });

    // In response, the creature dies; the Aura goes with it as a state-based
    // action. Neither is around to say what the ability on the stack was.
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: bear }]);
    expect(() => {
      game.dispatch({ type: "pass-priority", player: A });
      game.dispatch({ type: "pass-priority", player: B });
    }).not.toThrow();

    expect(game.state.zones.shared.stack).toEqual([]);
    expect(game.state.objects[gond]?.zone).not.toBe("battlefield");
    const elves = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Elf Warrior Token",
    );
    expect(elves).toHaveLength(1);
  });
});

describe("a blocker removed from combat before damage", () => {
  const combatGame = () => {
    const a = new ScriptedController(A);
    const b = new ScriptedController(B);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: a, [B]: b },
      decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Forest") })),
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    return { game, a, b };
  };
  const inDeclareBlockers = (s: GameState) =>
    s.turn.step === "declare-blockers" && s.awaiting === null;
  const afterCombat = (s: GameState) => s.turn.step === "postcombat-main";

  it("doesn't crash the damage step when the blocker was a token", () => {
    const { game, a, b } = combatGame();
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.state.objects[bear].summoningSick = false;
    const saproling = game.debugSpawn("Saproling Token", B, "battlefield");
    // debugSpawn doesn't know a token from a card.
    game.state.objects[saproling].isToken = true;
    a.declareAttackersFn = () => [{ attacker: bear, defender: B }];
    b.declareBlockersFn = () => [{ blocker: saproling, attacker: bear }];

    game.advanceUntil(inDeclareBlockers);
    game.debugApplyEffect(A, { kind: "exile", target: 0 }, [{ kind: "object", object: saproling }]);
    expect(() => game.advanceUntil(afterCombat)).not.toThrow();

    expect(game.state.objects[saproling]).toBeUndefined();
    // Still blocked (rule 509.1h), so no damage to Bob.
    expect(game.state.players[B].life).toBe(20);
  });

  it("doesn't give combat a first-strike step for a first striker that has left", () => {
    const { game, a, b } = combatGame();
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.state.objects[bear].summoningSick = false;
    const knight = game.debugSpawn("White Knight", B, "battlefield");
    a.declareAttackersFn = () => [{ attacker: bear, defender: B }];
    b.declareBlockersFn = () => [{ blocker: knight, attacker: bear }];

    game.advanceUntil(inDeclareBlockers);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: knight }]);
    const passes = new Set<string>();
    game.advanceUntil((s) => {
      if (s.combatDamage !== null) passes.add(s.combatDamage.pass);
      return afterCombat(s);
    });

    expect(passes.has("first")).toBe(false);
  });
});
