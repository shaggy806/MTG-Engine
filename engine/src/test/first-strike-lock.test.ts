import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { PtModifier, GameState } from "../state.js";

/**
 * Rule 510.4: the second combat-damage step is dealt by the combatants that
 * had *neither* first strike nor double strike as the first step began, plus
 * whoever has double strike *now*. The engine used to ask "lacks first strike
 * now" instead, so a first striker that lost first strike between the steps
 * dealt damage twice and a creature that gained it dealt none (702.7c), and a
 * double striker that lost double strike still hit again (702.4c).
 */

const A = asPlayerId("alice");
const B = asPlayerId("bob");

function mkGame(): { game: Game; a: ScriptedController; b: ScriptedController } {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [A, B].map((player) => ({ player, cards: Array(40).fill("Forest") })),
  });
  b.declareBlockersFn = () => [];
  return { game, a, b };
}

const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });

const modify = (game: Game, id: ObjectId, mod: Partial<PtModifier>): void => {
  game.state.objects[id].modifiers.push({
    power: 0,
    toughness: 0,
    keywords: [],
    untilEndOfTurn: true,
    ...mod,
  });
};

/** The priority window between the two combat-damage steps: first-strike
 * damage has been dealt and the regular step is still owed. */
const betweenSteps = (s: GameState): boolean =>
  s.turn.step === "combat-damage" &&
  s.combatDamage?.pass === "first" &&
  s.combatDamage.regularOwed &&
  s.awaiting === null;

const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";

const life = (game: Game, p: PlayerId): number => game.state.players[p].life;

describe("rule 510.4 — who deals damage in the second combat-damage step", () => {
  it("a first striker that loses first strike between the steps doesn't deal damage again", () => {
    const { game, a } = mkGame();
    const knight = spawn(game, "White Knight", A); // 2/2 first strike
    a.declareAttackersFn = () => [{ attacker: knight, defender: B }];

    game.advanceUntil(betweenSteps);
    expect(life(game, B)).toBe(18);
    modify(game, knight, { loseAbilities: true });
    game.advanceUntil(toPostcombat);

    expect(life(game, B)).toBe(18);
  });

  it("a creature that gains first strike between the steps still deals its damage", () => {
    const { game, a } = mkGame();
    const knight = spawn(game, "White Knight", A); // opens a first-strike step
    const bears = spawn(game, "Grizzly Bears", A);
    a.declareAttackersFn = () => [
      { attacker: knight, defender: B },
      { attacker: bears, defender: B },
    ];

    game.advanceUntil(betweenSteps);
    expect(life(game, B)).toBe(18); // the Knight alone
    modify(game, bears, { keywords: ["first-strike"] });
    game.advanceUntil(toPostcombat);

    expect(life(game, B)).toBe(16);
  });

  it("a double striker that loses double strike between the steps doesn't deal damage again", () => {
    const { game, a } = mkGame();
    const ace = spawn(game, "Fencing Ace", A); // 1/1 double strike
    a.declareAttackersFn = () => [{ attacker: ace, defender: B }];

    game.advanceUntil(betweenSteps);
    expect(life(game, B)).toBe(19);
    modify(game, ace, { loseAbilities: true });
    game.advanceUntil(toPostcombat);

    expect(life(game, B)).toBe(19);
  });

  it("a creature that gains double strike after the first step deals damage once, in the second", () => {
    const { game, a } = mkGame();
    const knight = spawn(game, "White Knight", A);
    const bears = spawn(game, "Grizzly Bears", A);
    a.declareAttackersFn = () => [
      { attacker: knight, defender: B },
      { attacker: bears, defender: B },
    ];

    game.advanceUntil(betweenSteps);
    expect(life(game, B)).toBe(18);
    modify(game, bears, { keywords: ["double-strike"] });
    game.advanceUntil(toPostcombat);

    expect(life(game, B)).toBe(16); // Knight 2 + Bears 2, not 2 + 4
  });

  it("a first striker that gains double strike after the first step deals damage in the second too (702.4d)", () => {
    const { game, a } = mkGame();
    const knight = spawn(game, "White Knight", A);
    a.declareAttackersFn = () => [{ attacker: knight, defender: B }];

    game.advanceUntil(betweenSteps);
    modify(game, knight, { keywords: ["double-strike"] });
    game.advanceUntil(toPostcombat);

    expect(life(game, B)).toBe(16);
  });

  it("the record lives only as long as the combat-damage step", () => {
    const { game, a } = mkGame();
    const knight = spawn(game, "White Knight", A);
    a.declareAttackersFn = () => [{ attacker: knight, defender: B }];
    game.advanceUntil(betweenSteps);
    expect(game.state.combatDamage?.firstStepStrikers).toEqual({
      [knight]: game.state.objects[knight].timestamp,
    });
    game.advanceUntil(toPostcombat);
    expect(game.state.combatDamage).toBeNull();
  });
});
