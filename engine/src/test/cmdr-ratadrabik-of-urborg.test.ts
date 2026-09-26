/**
 * Ratadrabik of Urborg — {2}{W}{B} legendary 3/3 Zombie Wizard.
 *
 *   Vigilance, ward {2}
 *   Other Zombies you control have vigilance.
 *   Whenever another legendary creature you control dies, create a token
 *   that's a copy of that creature, except it's not legendary and it's a 2/2
 *   black Zombie in addition to its other colors and types.
 *
 * "That creature" as it last existed on the battlefield (rule 608.2h).
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { nameOf } from "../state.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  const ratadrabik = game.debugSpawn("Ratadrabik of Urborg", A, "battlefield");
  return { game, a, ratadrabik };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const kill = (game: Game, id: ObjectId): void => {
  game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: id }]);
  game.advanceUntil(quiet);
};
const tokens = (game: Game, player: PlayerId = A): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].isToken === true && game.state.objects[id].controller === player,
  );

describe("Ratadrabik of Urborg", () => {
  it("copies a legendary creature of yours that dies: not legendary, a 2/2 black Zombie besides", () => {
    const { game } = setUp();
    const krenko = game.debugSpawn("Krenko, Mob Boss", A, "battlefield");
    kill(game, krenko);
    const [token] = tokens(game);
    expect(token).toBeDefined();
    const c = game.characteristics(token);
    expect(nameOf(game.state.objects[token])).toBe("Krenko, Mob Boss");
    expect([c.power, c.toughness]).toEqual([2, 2]);
    expect([...c.colors].sort()).toEqual(["B", "R"]);
    expect(c.subtypes).toEqual(expect.arrayContaining(["Goblin", "Zombie"]));
    expect(game.state.objects[token].notLegendary).toBe(true);
    // A Zombie: Ratadrabik gives it vigilance.
    expect(c.keywords.has("vigilance")).toBe(true);
  });

  it("copies a Clone as what it was: the legend it copied, not a Clone", () => {
    const { game, a } = setUp();
    const krenko = game.debugSpawn("Krenko, Mob Boss", B, "battlefield");
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Island", A, "battlefield");
    a.chooseCopyFn = () => krenko;
    const clone = game.debugSpawn("Clone", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: clone });
    game.advanceUntil(quiet);
    expect(game.state.objects[clone].copyOf).toBe("Krenko, Mob Boss");
    kill(game, clone);
    const [token] = tokens(game);
    expect(token).toBeDefined();
    expect(nameOf(game.state.objects[token])).toBe("Krenko, Mob Boss");
  });

  it("copies a legendary token that ceased to exist", () => {
    const { game } = setUp();
    // A legendary Krenko token, the only Krenko: a copy of the card.
    const card = game.debugSpawn("Krenko, Mob Boss", A, "graveyard");
    game.debugApplyEffect(A, { kind: "create-token-copy", of: 0, count: 1, who: "you" }, [
      { kind: "object", object: card },
    ]);
    const [legendToken] = tokens(game);
    expect(legendToken).toBeDefined();
    expect(game.state.objects[legendToken].notLegendary).toBeUndefined();
    kill(game, legendToken);
    expect(game.state.objects[legendToken]).toBeUndefined();
    const [copy] = tokens(game);
    expect(copy).toBeDefined();
    expect(nameOf(game.state.objects[copy])).toBe("Krenko, Mob Boss");
    expect(game.state.objects[copy].notLegendary).toBe(true);
  });

  it("a copy that dies keeps its own copy exceptions in the new copy", () => {
    const { game } = setUp();
    const card = game.debugSpawn("Krenko, Mob Boss", A, "graveyard");
    game.debugApplyEffect(
      A,
      {
        kind: "create-token-copy",
        of: 0,
        count: 1,
        who: "you",
        exceptions: { addSubtypes: ["Balloon"], keywords: ["flying"] },
      },
      [{ kind: "object", object: card }],
    );
    const [balloon] = tokens(game);
    kill(game, balloon);
    const [copy] = tokens(game);
    const c = game.characteristics(copy);
    expect(c.subtypes).toEqual(expect.arrayContaining(["Balloon", "Zombie", "Goblin"]));
    expect(c.keywords.has("flying")).toBe(true);
    expect([c.power, c.toughness]).toEqual([2, 2]);
  });

  it("not for itself, a nonlegendary creature, or an opponent's legend", () => {
    const { game, ratadrabik } = setUp();
    kill(game, game.debugSpawn("Grizzly Bears", A, "battlefield"));
    kill(game, game.debugSpawn("Krenko, Mob Boss", B, "battlefield"));
    kill(game, ratadrabik);
    expect(tokens(game)).toEqual([]);
    expect(tokens(game, B)).toEqual([]);
  });
});
