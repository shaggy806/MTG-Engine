/**
 * Bria, Riptide Rogue — {2}{U}{R} 3/3 legendary Otter Rogue:
 *   Prowess
 *   Other creatures you control have prowess.
 *   Whenever you cast a noncreature spell, target creature you control can't
 *   be blocked this turn.
 *
 * The grant is what the engine fix under this card was for: a creature-scoped
 * static used to ask whether a permanent was *printed* as a creature, so an
 * animated land never got prowess. Each clause is checked, plus the negatives:
 * an opponent's creature gets nothing, a creature spell pumps nothing, and a
 * land that is only a land has no prowess to trigger.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { computeCharacteristics } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const BRIA = "Bria, Riptide Rogue";
const registry = createDefaultRegistry();

const setUp = (aHand: readonly string[]) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Forest")] },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  const bria = game.debugSpawn(BRIA, A, "battlefield", { summoningSick: false });
  for (let i = 0; i < 6; i += 1) game.debugSpawn("Forest", A, "battlefield");
  return { game, a, b, bria };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const inHand = (game: Game, name: string): ObjectId => {
  const id = game.handOf(A).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
const cast = (game: Game, name: string): void => {
  game.dispatch({ type: "cast-spell", player: A, card: inHand(game, name) });
  game.advanceUntil(quiet);
};

describe("Bria, Riptide Rogue", () => {
  it("has prowess itself, and gives it to your other creatures", () => {
    const { game, bria } = setUp(["Sol Ring"]);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");

    cast(game, "Sol Ring");

    expect(chars(game, bria).power).toBe(4);
    expect(chars(game, bria).toughness).toBe(4);
    // Exactly one instance on the Bears: +1/+1, not +2/+2.
    expect(chars(game, bears).power).toBe(3);
    expect(chars(game, bears).toughness).toBe(3);
  });

  it("gives an animated land prowess — a creature now, not a printed one", () => {
    const { game, bria } = setUp(["Sol Ring"]);
    const factory = game.debugSpawn("Mishra's Factory", A, "battlefield", { summoningSick: false });
    void bria;

    game.dispatch({ type: "activate-ability", player: A, source: factory, abilityIndex: 1 });
    game.advanceUntil(quiet);
    expect(chars(game, factory).types).toContain("creature");
    expect(chars(game, factory).power).toBe(2);

    cast(game, "Sol Ring");
    expect(chars(game, factory).power).toBe(3);
    expect(chars(game, factory).toughness).toBe(3);
  });

  it("a land that is only a land has no prowess to trigger", () => {
    const { game } = setUp(["Sol Ring"]);
    const factory = game.debugSpawn("Mishra's Factory", A, "battlefield", { summoningSick: false });
    cast(game, "Sol Ring");
    // Animated only afterwards: the spell was cast while it was a land.
    game.dispatch({ type: "activate-ability", player: A, source: factory, abilityIndex: 1 });
    game.advanceUntil(quiet);
    expect(chars(game, factory).power).toBe(2);
  });

  it("gives nothing to an opponent's creature, and a creature spell pumps nothing", () => {
    const { game, bria } = setUp(["Grizzly Bears", "Sol Ring"]);
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");

    cast(game, "Grizzly Bears");
    expect(chars(game, bria).power).toBe(3);

    cast(game, "Sol Ring");
    expect(chars(game, bria).power).toBe(4);
    expect(chars(game, theirs).power).toBe(2);
  });

  it("makes the chosen creature you control unblockable this turn", () => {
    const { game, a, bria } = setUp(["Sol Ring"]);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    const opposing = game.debugSpawn("Grizzly Bears", B, "battlefield");
    a.chooseTargetsFn = (_view, _source, _specs, options) =>
      options.map((slot) => slot.find((t) => t.kind === "object" && t.object === bears) ?? null);

    cast(game, "Sol Ring");
    expect(chars(game, bears).keywords).toContain("unblockable");
    expect(chars(game, bria).keywords).not.toContain("unblockable");
    // The opponent's creature was never an option: "creature you control".
    const offered = game.state.eventLog.some(
      (e) => e.type === "object-targeted" && e.object === opposing,
    );
    expect(offered).toBe(false);

    // Until end of turn only.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(chars(game, bears).keywords).not.toContain("unblockable");
  });
});
