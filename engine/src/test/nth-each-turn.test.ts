/**
 * "The Nth one each turn", for spells and for draws.
 *
 * - A cast trigger with a `filter` counts first/Nth among the caster's
 *   *matching* spells this turn: Tuvasa the Sunlit's "your first enchantment
 *   spell each turn" fires for an enchantment cast after an artifact, and not
 *   for the second enchantment.
 * - A draw trigger can skip "the first one they draw in each of their draw
 *   steps" (Xyris, the Writhing Storm), or fire only on the Nth card of the
 *   turn.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry, defineCard } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const registry = createDefaultRegistry().register(
  defineCard({
    name: "Second Draw Watcher",
    types: ["enchantment"],
    text: "Whenever you draw your second card each turn, you gain 1 life.",
    triggered: [
      {
        trigger: { on: "draws", who: "you", nthEachTurn: 2 },
        targets: [],
        effect: { kind: "gain-life", amount: 1 },
        resolve: null,
        text: "Whenever you draw your second card each turn, you gain 1 life.",
      },
    ],
  }),
);

const setUp = (aHand: readonly string[] = [], fill = "Plains") => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill(fill)] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
/** Snake tokens, counting every member of a token stack. */
const snakes = (game: Game): number =>
  game.battlefield
    .filter((id) => game.state.objects[id].cardName === "Snake Token")
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const draw = (game: Game, player: PlayerId, amount: number): void => {
  game.debugApplyEffect(player, { kind: "draw", amount });
  game.advanceUntil(quiet);
};

describe("Tuvasa the Sunlit", () => {
  it("draws for the first enchantment spell each turn, even when it isn't the first spell", () => {
    const { game, a } = setUp(["Sol Ring", "Holy Strength", "Pacifism"]);
    const tuvasa = game.debugSpawn("Tuvasa the Sunlit", A, "battlefield");
    const victim = game.debugSpawn("Grizzly Bears", B, "battlefield");
    for (let i = 0; i < 5; i += 1) game.debugSpawn("Plains", A, "battlefield");
    a.chooseTargetsFn = () => [{ kind: "object", object: victim }];
    const cast = (name: string): number => {
      const card = game.handOf(A).find((id) => game.state.objects[id].cardName === name);
      if (card === undefined) throw new Error(`no ${name}`);
      const before = game.handOf(A).length;
      game.dispatch({
        type: "cast-spell",
        player: A,
        card,
        targets: name === "Sol Ring" ? [] : [{ kind: "object", object: victim }],
      });
      game.advanceUntil(quiet);
      return game.handOf(A).length - before;
    };

    expect(cast("Sol Ring")).toBe(-1);
    expect(cast("Holy Strength")).toBe(0); // -1 cast, +1 drawn
    expect(cast("Pacifism")).toBe(-1);
    // +1/+1 for each enchantment you control (both Auras are Alice's).
    const c = game.characteristics(tuvasa);
    expect([c.power, c.toughness]).toEqual([3, 3]);
  });
});

describe("Xyris, the Writhing Storm", () => {
  it("skips an opponent's first draw in their draw step, and counts every other draw", () => {
    const { game } = setUp();
    game.debugSpawn("Xyris, the Writhing Storm", A, "battlefield");

    // Bob draws two on Alice's turn: two Snakes.
    draw(game, B, 2);
    expect(snakes(game)).toBe(2);
    // Alice's own draws are no one else's.
    draw(game, A, 1);
    expect(snakes(game)).toBe(2);

    // Bob's turn: his draw-step draw is exempt, a second one that step isn't.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "draw" && s.priority.holder === B);
    expect(snakes(game)).toBe(2);
    draw(game, B, 1);
    expect(snakes(game)).toBe(3);
  });

  it("makes you and the damaged player each draw that many, which grows the Snakes", () => {
    const { game, a } = setUp();
    const xyris = game.debugSpawn("Xyris, the Writhing Storm", A, "battlefield", {
      summoningSick: false,
    });
    a.declareAttackersFn = () => [{ attacker: xyris, defender: B }];
    const [mine, theirs] = [game.handOf(A).length, game.handOf(B).length];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(game.handOf(A).length).toBe(mine + 3);
    expect(game.handOf(B).length).toBe(theirs + 3);
    expect(snakes(game)).toBe(3);
  });
});

describe("the Nth card drawn each turn", () => {
  it("fires on the second card, not the first or the third", () => {
    const { game } = setUp();
    game.debugSpawn("Second Draw Watcher", A, "battlefield");
    // Alice has drawn one already this turn (her draw step).
    const life = game.state.players[A].life;
    draw(game, A, 1);
    expect(game.state.players[A].life).toBe(life + 1);
    draw(game, A, 1);
    expect(game.state.players[A].life).toBe(life + 1);
  });
});
