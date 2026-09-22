import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

// Ognis, the Dragon's Lash — {1}{B/R}{R}{R/G} Legendary Creature — Lizard
// Warrior 3/3
//   Haste
//   Whenever a creature you control with haste attacks, create a tapped
//   Treasure token.

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Mountain"),
];

const makeGame = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 3,
    shuffle: false,
    rules: { skipFirstDraw: false },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad([]) },
      { player: B, cards: pad([]) },
    ],
  });
  return { game, a, b };
};

const treasures = (game: Game, controller = A): ObjectId[] =>
  game.battlefield.filter((id) => {
    const o = game.state.objects[id];
    return o.cardName === "Treasure Token" && o.controller === controller;
  });

const atPostcombat = (turn: number) => (s: GameState): boolean =>
  s.turn.number === turn && s.turn.step === "postcombat-main";

describe("Ognis, the Dragon's Lash", () => {
  it("creates one tapped Treasure when it attacks (it has haste itself)", () => {
    const { game, a } = makeGame();
    const ognis = game.debugSpawn("Ognis, the Dragon's Lash", A);
    a.declareAttackersFn = () => [{ attacker: ognis, defender: B }];

    game.advanceUntil(atPostcombat(1));

    const made = treasures(game);
    expect(made).toHaveLength(1);
    // "create a **tapped** Treasure token"
    expect(game.state.objects[made[0]].tapped).toBe(true);
    expect(game.state.objects[made[0]].isToken).toBe(true);
  });

  it("triggers once per hasty attacker, and not for one without haste", () => {
    const { game, a } = makeGame();
    const ognis = game.debugSpawn("Ognis, the Dragon's Lash", A);
    // Raging Goblin has printed haste; Grizzly Bears does not. Both attack.
    const goblin = game.debugSpawn("Raging Goblin", A);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", {
      summoningSick: false,
    });
    a.declareAttackersFn = () => [
      { attacker: ognis, defender: B },
      { attacker: goblin, defender: B },
      { attacker: bears, defender: B },
    ];

    game.advanceUntil(atPostcombat(1));

    // Three attackers, two of them hasty — two Treasures, not three.
    expect(treasures(game)).toHaveLength(2);
  });

  it("counts a creature whose haste was granted by something else", () => {
    const { game, a } = makeGame();
    // Ognis stays home; Fires of Yavimaya gives the Bears haste, so the
    // trigger has to read the *computed* keywords rather than the printed card.
    game.debugSpawn("Ognis, the Dragon's Lash", A, "battlefield", { tapped: true });
    game.debugSpawn("Fires of Yavimaya", A);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", {
      summoningSick: false,
    });
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];

    game.advanceUntil(atPostcombat(1));

    expect(treasures(game)).toHaveLength(1);
  });

  it("does not trigger off a creature you control without haste", () => {
    const { game, a } = makeGame();
    game.debugSpawn("Ognis, the Dragon's Lash", A, "battlefield", { tapped: true });
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", {
      summoningSick: false,
    });
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];

    game.advanceUntil(atPostcombat(1));

    // The Bears really did attack (2 damage through), so the absence of a
    // Treasure is the filter and not a combat that never happened.
    expect(game.state.players[B].life).toBe(game.state.rules.startingLife - 2);
    expect(treasures(game)).toHaveLength(0);
  });

  it("does not trigger off an opponent's hasty attacker", () => {
    const { game, a, b } = makeGame();
    game.debugSpawn("Ognis, the Dragon's Lash", A);
    a.declareAttackersFn = () => [];

    // Turn 2 is Bob's. His Raging Goblin has haste, but it isn't a creature
    // Ognis's controller controls, so "a creature you control" excludes it.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    const goblin = game.debugSpawn("Raging Goblin", B);
    b.declareAttackersFn = () => [{ attacker: goblin, defender: A }];

    game.advanceUntil(atPostcombat(2));

    // The Goblin really did attack (1 damage through) — same point as above.
    expect(game.state.players[A].life).toBe(game.state.rules.startingLife - 1);
    expect(treasures(game, A)).toHaveLength(0);
    expect(treasures(game, B)).toHaveLength(0);
  });
});
