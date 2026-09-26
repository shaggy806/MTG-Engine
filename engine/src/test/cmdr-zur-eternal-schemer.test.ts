/**
 * Zur, Eternal Schemer — {W}{U}{B} legendary 1/4 Human Wizard.
 *
 *   Flying
 *   Enchantment creatures you control have deathtouch, lifelink, and hexproof.
 *   {1}{W}: Target non-Aura enchantment you control becomes a creature in
 *   addition to its other types and has base power and base toughness each
 *   equal to its mana value.
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
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
  const zur = game.debugSpawn("Zur, Eternal Schemer", A, "battlefield", { summoningSick: false });
  for (let i = 0; i < 4; i += 1) game.debugSpawn("Plains", A, "battlefield");
  return { game, zur };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
type Offer = Extract<LegalAction, { kind: "activate-ability" }>;
const offer = (game: Game, zur: ObjectId): Offer | undefined =>
  game.legalActions(A).find((o): o is Offer => o.kind === "activate-ability" && o.source === zur);
const animate = (game: Game, zur: ObjectId, target: ObjectId): void => {
  game.dispatch({
    type: "activate-ability",
    player: A,
    source: zur,
    abilityIndex: 0,
    targets: [{ kind: "object", object: target }],
  });
  game.advanceUntil(quiet);
};

describe("Zur, Eternal Schemer", () => {
  it("makes an enchantment a creature as big as its mana value, with deathtouch, lifelink and hexproof", () => {
    const { game, zur } = setUp();
    const arena = game.debugSpawn("Phyrexian Arena", A, "battlefield");
    animate(game, zur, arena);
    const c = game.characteristics(arena);
    expect(c.types).toEqual(expect.arrayContaining(["enchantment", "creature"]));
    expect([c.power, c.toughness]).toEqual([3, 3]);
    for (const k of ["deathtouch", "lifelink", "hexproof"] as const) expect(c.keywords.has(k)).toBe(true);
    // It lasts: still a creature next turn.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(game.characteristics(arena).types).toContain("creature");
    expect([game.characteristics(arena).power, game.characteristics(arena).toughness]).toEqual([3, 3]);
  });

  it("targets only a non-Aura enchantment you control", () => {
    const { game, zur } = setUp();
    const study = game.debugSpawn("Rhystic Study", A, "battlefield");
    game.debugSpawn("Phyrexian Arena", B, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const pacifism = game.debugSpawn("Pacifism", A, "battlefield");
    game.debugApplyEffect(A, { kind: "attach", target: 0 }, [{ kind: "object", object: bears }], { source: pacifism });
    expect(offer(game, zur)?.targetOptions[0]).toEqual([{ kind: "object", object: study }]);
  });

  it("gives its keywords only to enchantment creatures you control", () => {
    const { game, zur } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const arena = game.debugSpawn("Phyrexian Arena", A, "battlefield");
    expect(game.characteristics(bears).keywords.has("deathtouch")).toBe(false);
    expect(game.characteristics(arena).keywords.has("deathtouch")).toBe(false);
    expect(game.characteristics(zur).keywords.has("deathtouch")).toBe(false);
  });
});
