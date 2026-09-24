/**
 * Annihilator N (the `annihilator` helper — rule 702.86): "whenever this
 * creature attacks, defending player sacrifices N permanents". And a
 * `cast-spell` trigger's `copyOnly` — "whenever you copy an instant spell"
 * (Kalamax, the Stormsire) — beside magecraft's `orCopy`.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { annihilator } from "../cards/helpers.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const ELDRAZI = "Test Annihilating Eldrazi";
const COPIER = "Test Stormsire";
const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: ELDRAZI,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Eldrazi"],
      power: 5,
      toughness: 5,
      text: "Annihilator 2",
      triggered: [annihilator(2)],
    }),
  )
  .register(
    defineCard({
      name: COPIER,
      manaCost: "{0}",
      types: ["enchantment"],
      text: COPIER,
      triggered: [
        {
          trigger: { on: "cast-spell", who: "you", copyOnly: true, filter: { type: "instant" } },
          targets: [],
          effect: { kind: "gain-life", amount: 1 },
          resolve: null,
          text: COPIER,
        },
      ],
    }),
  );

const setUp = (hand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill("Mountain")] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const permanentsOf = (game: Game, player: typeof A): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].controller === player);

describe("annihilator", () => {
  it("the defending player sacrifices N permanents as it attacks", () => {
    const { game, a } = setUp();
    const eldrazi = game.debugSpawn(ELDRAZI, A, "battlefield", { summoningSick: false });
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Island", B, "battlefield");
    a.declareAttackersFn = () => [{ attacker: eldrazi, defender: B }];
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(permanentsOf(game, B)).toHaveLength(1);
  });
});

describe("whenever you copy a spell", () => {
  it("fires for the copy, not for the cast", () => {
    const { game } = setUp(["Lightning Bolt"]);
    const watcher = game.debugSpawn(COPIER, A, "battlefield");
    game.debugSpawn("Mountain", A, "battlefield");
    const bolt = game.handOf(A).find((id) => game.state.objects[id].cardName === "Lightning Bolt")!;
    game.dispatch({ type: "cast-spell", player: A, card: bolt, targets: [{ kind: "player", player: B }] });
    const fired = () => game.eventsOfType("ability-triggered").filter((e) => e.source === watcher).length;
    expect(fired()).toBe(0);
    game.debugApplyEffect(A, { kind: "copy-spell", target: 0 }, [{ kind: "object", object: bolt }], {
      source: watcher,
    });
    game.advanceUntil(quiet);
    expect(fired()).toBe(1);
    expect(game.state.players[A].life).toBe(21);
  });
});
