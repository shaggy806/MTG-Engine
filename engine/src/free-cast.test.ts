/**
 * Conditional free-cast (`CardDefinition.freeCastIf`) — the EDH-popularity
 * backlog's third Tier-1 feature (`neededCards-features.md`): "If you
 * control a commander, you may cast this spell without paying its mana
 * cost" (the CMM commander-precon free-spell cycle). Unlike `overload` this
 * doesn't change targets or effect at all — same spell, same targets, only
 * the cost differs, gated by a `StaticCondition` (the same union
 * `StaticAbility`/`TriggeredAbility`/`ActivatedAbility.condition` already
 * read). New `CardFilter.isCommander` for "if you control a commander".
 * Shipped against Fierce Guardianship, Deadly Rollick, Flawless Maneuver.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A;

const makeGame = (aCards: readonly string[], bCards: readonly string[] = []) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad(bCards) },
    ],
  });
  game.advanceUntil(toPrecombat);
  return game;
};

const settle = (game: Game): void =>
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);

describe("Fierce Guardianship", () => {
  it("cannot be cast free without a commander", () => {
    const game = makeGame(["Fierce Guardianship"]);
    const fg = game.handOf(A).find((id) => game.state.objects[id]?.cardName === "Fierce Guardianship")!;
    const freeAction = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.card === fg && a.free === true);
    expect(freeAction).toBeUndefined();
  });

  it("can be cast for free (no mana sources at all) while you control a commander, countering a noncreature spell", () => {
    const game = makeGame(["Fierce Guardianship"], []);
    const commander = game.debugSpawn("Anafenza, the Foremost", A);
    game.state.objects[commander]!.isCommander = true;

    // A noncreature spell on the stack to target — needed before Fierce
    // Guardianship has any legal target at all.
    const target = game.debugSpawn("Arcane Signet", B, "stack");

    const fg = game.handOf(A).find((id) => game.state.objects[id]?.cardName === "Fierce Guardianship")!;
    const freeAction = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.card === fg && a.free === true);
    expect(freeAction?.kind).toBe("cast-spell");
    if (freeAction?.kind !== "cast-spell") throw new Error("no free-cast action");

    // A has no lands or mana rocks at all — the cast only succeeds if it's
    // genuinely free.
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: fg,
      targets: [{ kind: "object", object: target }],
      free: true,
    });
    settle(game);
  });
});

describe("Deadly Rollick", () => {
  it("free-cast exiles a target creature with no mana paid", () => {
    const game = makeGame(["Deadly Rollick"], ["Prodigal Sorcerer"]);
    game.debugSpawn("Anafenza, the Foremost", A);
    const commander = game.battlefield.find((id) => game.state.objects[id]?.cardName === "Anafenza, the Foremost")!;
    game.state.objects[commander]!.isCommander = true;
    const victim = game.debugSpawn("Prodigal Sorcerer", B);

    const rollick = game.handOf(A).find((id) => game.state.objects[id]?.cardName === "Deadly Rollick")!;
    const freeAction = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.card === rollick && a.free === true);
    expect(freeAction?.kind).toBe("cast-spell");
    if (freeAction?.kind !== "cast-spell") throw new Error("no free-cast action");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: rollick,
      targets: [{ kind: "object", object: victim }],
      free: true,
    });
    settle(game);
    expect(game.state.objects[victim]?.zone).toBe("exile");
  });
});

describe("Flawless Maneuver", () => {
  it("free-cast grants your creatures indestructible with no mana paid, no targets", () => {
    const game = makeGame(["Flawless Maneuver"], []);
    game.debugSpawn("Anafenza, the Foremost", A);
    const commander = game.battlefield.find((id) => game.state.objects[id]?.cardName === "Anafenza, the Foremost")!;
    game.state.objects[commander]!.isCommander = true;
    const bear = game.debugSpawn("Prodigal Sorcerer", A);

    const fm = game.handOf(A).find((id) => game.state.objects[id]?.cardName === "Flawless Maneuver")!;
    const freeAction = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.card === fm && a.free === true);
    expect(freeAction?.kind).toBe("cast-spell");
    if (freeAction?.kind !== "cast-spell") throw new Error("no free-cast action");
    expect(freeAction.targetSpecs).toEqual([]);

    game.dispatch({ type: "cast-spell", player: A, card: fm, free: true });
    settle(game);

    const characteristics = game.viewFor(A).objects[bear];
    expect(characteristics?.keywords).toContain("indestructible");
  });
});
