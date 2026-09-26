/**
 * `grant-activated` / `grant-activated-all`: a resolving spell or ability
 * gives permanents an activated ability, riding on their own modifiers (the
 * one-shot counterpart of a `grantsActivated` static). Rain of Filth's "until
 * end of turn, lands you control gain 'Sacrifice this land: Add {B}.'" — only
 * the lands there as it resolves (rule 611.2c), gone at cleanup, and lost to
 * a later "loses all abilities" (rule 613.7).
 */

import { describe, expect, it } from "vitest";

import { manaTapAbility } from "../cards/helpers.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

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
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
/** The "Sacrifice this land" abilities offered on `id`. */
const sacrificeOf = (game: Game, id: ObjectId) =>
  game.legalActions(game.state.objects[id].controller).filter(
    (action) => action.kind === "activate-ability" && action.source === id && action.text.startsWith("Sacrifice"),
  );

describe("grant-activated", () => {
  it("Rain of Filth: your lands gain 'Sacrifice this land: Add {B}' until end of turn", () => {
    const game = setUp();
    const swamps = [game.debugSpawn("Swamp", A, "battlefield"), game.debugSpawn("Swamp", A, "battlefield")];
    const theirs = game.debugSpawn("Swamp", B, "battlefield");
    const rain = game.debugSpawn("Rain of Filth", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: rain });
    game.advanceUntil(quiet);
    // Both of yours, tapped or not — the ability has no {T}. Not theirs (bob's
    // abilities aren't offered while alice has priority, so read the grant).
    const [sacrifice] = sacrificeOf(game, swamps[0]);
    expect(sacrifice).toMatchObject({ text: "Sacrifice this land: Add {B}." });
    expect(sacrificeOf(game, swamps[1])).toHaveLength(1);
    expect(game.state.objects[theirs].modifiers.some((m) => m.grantsActivated !== undefined)).toBe(false);
    // A land that arrives afterwards doesn't have it (rule 611.2c).
    const late = game.debugSpawn("Swamp", A, "battlefield");
    expect(sacrificeOf(game, late)).toEqual([]);
    if (sacrifice?.kind !== "activate-ability") throw new Error("not offered");
    game.dispatch({ type: "activate-ability", player: A, source: swamps[0], abilityIndex: sacrifice.abilityIndex });
    expect(game.state.objects[swamps[0]].zone).toBe("graveyard");
    expect(game.state.players[A].manaPool.map((unit) => unit.type)).toEqual(["B"]);
    // Gone at cleanup.
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[swamps[1]].modifiers.some((m) => m.grantsActivated !== undefined)).toBe(false);
  });

  it("a granted mana ability with {T} pays for a spell, until the permanent loses all its abilities", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.state.objects[bears].summoningSick = false;
    game.debugApplyEffect(
      A,
      { kind: "grant-activated", target: 0, ability: manaTapAbility("G"), duration: "end-of-turn" },
      [{ kind: "object", object: bears }],
    );
    const elves = game.debugSpawn("Llanowar Elves", A, "hand");
    const castable = () =>
      game.legalActions(A).some((action) => action.kind === "cast-spell" && action.card === elves);
    expect(castable()).toBe(true);
    // A later loss of all abilities takes it (rule 613.7).
    game.debugApplyEffect(B, registry.get("Turn to Frog").effect!, [{ kind: "object", object: bears }]);
    expect(castable()).toBe(false);
  });
});
