import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import { activePlayerOf } from "../state.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const WILSON = "Wilson, Refined Grizzly";

const pad = (cards: readonly string[], fill: string): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill(fill),
];

const mkGame = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad([WILSON, "Lightning Bolt"], "Forest") },
      { player: B, cards: pad(["Counterspell", "Lightning Bolt"], "Island") },
    ],
  });
  game.advanceUntil(
    (s) => s.turn.step === "precombat-main" && s.priority.holder === A && activePlayerOf(s) === A,
  );
  return { game, a, b };
};

const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

describe("Wilson, Refined Grizzly", () => {
  it("is a 2/2 green legendary Bear Warrior: uncounterable, reach/vigilance/trample, ward {2}, Choose a Background", () => {
    const def = createDefaultRegistry().get(WILSON);
    expect(def.manaCost).toBe("{1}{G}");
    expect(def.subtypes).toEqual(["Bear", "Warrior"]);
    expect([def.power, def.toughness]).toEqual([2, 2]);
    expect(def.cantBeCountered).toBe(true);
    expect(def.keywords).toEqual(["reach", "vigilance", "trample"]);
    expect(def.pairing).toEqual({ kind: "choose-a-background" });
    expect(def.triggered.map((t) => t.effect)).toEqual([{ kind: "ward", cost: { mana: "{2}" } }]);
    expect(identityString(colorIdentityOf(def))).toBe("G");
  });

  it("can't be countered as it's cast", () => {
    const { game } = mkGame();
    game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Island", B, "battlefield");
    game.debugSpawn("Island", B, "battlefield");
    const wilson = game.handOf(A).find((id) => game.state.objects[id].cardName === WILSON);
    if (wilson === undefined) throw new Error("no Wilson");
    game.dispatch({ type: "cast-spell", player: A, card: wilson, targets: [] });
    game.dispatch({ type: "pass-priority", player: A });
    const counter = game.handOf(B).find((id) => game.state.objects[id].cardName === "Counterspell");
    if (counter === undefined) throw new Error("no Counterspell");
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: counter,
      targets: [{ kind: "object", object: wilson }],
    });
    game.advanceUntil(settled);
    expect(game.eventsOfType("counter-failed")).toHaveLength(1);
    expect(game.state.objects[wilson].zone).toBe("battlefield");
  });

  it("ward {2} counters an opponent's spell that targets it unless they pay", () => {
    const { game } = mkGame();
    const wilson = game.debugSpawn(WILSON, A, "battlefield");
    game.debugSpawn("Mountain", B, "battlefield");
    game.dispatch({ type: "pass-priority", player: A });
    const bolt = game.handOf(B).find((id) => game.state.objects[id].cardName === "Lightning Bolt");
    if (bolt === undefined) throw new Error("no Bolt");
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: bolt,
      targets: [{ kind: "object", object: wilson }],
    });
    game.advanceUntil(settled);
    // One Mountain: the Bolt's {R} and nothing for ward.
    expect(game.eventsOfType("ward-unpaid")).toEqual([
      expect.objectContaining({ object: wilson, player: B }),
    ]);
    expect(game.state.objects[wilson].zone).toBe("battlefield");
    expect(game.state.objects[bolt].zone).toBe("graveyard");
  });
});
