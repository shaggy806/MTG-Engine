/**
 * Rootha, Mastering the Moment — {2}{U}{R} legendary 3/4 Orc Sorcerer.
 *
 *   At the beginning of combat on your turn, if you've cast an instant or
 *   sorcery spell this turn, create an X/X blue and red Elemental creature
 *   token with flying and haste, where X is the greatest mana value among
 *   instant and sorcery spells you've cast this turn.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();
const ELEMENTAL = "X/X Elemental Token (Flying, Haste)";

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  game.debugSpawn("Rootha, Mastering the Moment", A, "battlefield");
  for (let i = 0; i < 8; i += 1) game.debugSpawn("Island", A, "battlefield");
  for (let i = 0; i < 6; i += 1) game.debugSpawn("Forest", A, "battlefield");
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const cast = (game: Game, name: string, x?: number): void => {
  const card = game.debugSpawn(name, A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card, ...(x === undefined ? {} : { xValue: x }) });
  game.advanceUntil(quiet);
};
const toCombat = (game: Game) =>
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "begin-combat" && quiet(s));
const elementals = (game: Game): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === ELEMENTAL);

describe("Rootha, Mastering the Moment", () => {
  it("makes an X/X flying, hasty Elemental, X the greatest mana value among your instants and sorceries", () => {
    const game = setUp();
    cast(game, "Opt"); // mana value 1
    cast(game, "Mind Spring", 3); // mana value 5, its X counted
    cast(game, "Craw Wurm"); // a creature spell's 6 doesn't count
    toCombat(game);
    const made = elementals(game);
    expect(made).toHaveLength(1);
    const c = game.characteristics(made[0]);
    expect([c.power, c.toughness]).toEqual([5, 5]);
    expect(c.keywords.has("flying")).toBe(true);
    expect(c.keywords.has("haste")).toBe(true);
    expect([...c.colors].sort()).toEqual(["R", "U"]);
  });

  it("without an instant or sorcery cast, makes nothing", () => {
    const game = setUp();
    cast(game, "Grizzly Bears");
    toCombat(game);
    expect(elementals(game)).toEqual([]);
  });

  it("the X/X is what the token is: counters go on top, and a later 'becomes 1/1' replaces it", () => {
    const game = setUp();
    cast(game, "Mind Spring", 1); // mana value 3
    toCombat(game);
    const [token] = elementals(game);
    const pt = () => [game.characteristics(token).power, game.characteristics(token).toughness];
    expect(pt()).toEqual([3, 3]);
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [
      { kind: "object", object: token },
    ]);
    expect(pt()).toEqual([4, 4]);
    game.debugApplyEffect(B, registry.get("Turn to Frog").effect!, [{ kind: "object", object: token }]);
    expect(pt()).toEqual([2, 2]);
  });
});
