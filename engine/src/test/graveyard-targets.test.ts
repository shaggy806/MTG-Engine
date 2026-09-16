/**
 * Phase B1 of `docs/plans/engine-gaps.md` — targeting a card in a graveyard.
 *
 * `TargetSpec` gains its one structured (non-string) form: every other spec
 * describes a permanent on the battlefield, a small enumerable set, whereas
 * graveyard targeting varies on *whose* graveyard and on an arbitrary card
 * filter, which would not converge as string literals.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import { describeTargetSpec } from "../target.js";
import { legalTargets } from "../targeting.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const makeGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
    registry,
    decks: [
      { player: A, cards: Array<string>(40).fill("Swamp") },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });

describe("card-in-graveyard targeting", () => {
  it("reaches every player's graveyard by default", () => {
    const game = makeGame();
    const mine = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const theirs = game.debugSpawn("Craw Wurm", B, "graveyard");
    const targets = legalTargets(game.state, registry, { kind: "card-in-graveyard" }, A);
    const ids = targets.map((t) => (t.kind === "object" ? t.object : null));
    expect(ids).toContain(mine);
    expect(ids).toContain(theirs);
  });

  it("honours `whose`", () => {
    const game = makeGame();
    const mine = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const theirs = game.debugSpawn("Craw Wurm", B, "graveyard");

    const yours = legalTargets(
      game.state,
      registry,
      { kind: "card-in-graveyard", whose: "you" },
      A,
    ).map((t) => (t.kind === "object" ? t.object : null));
    expect(yours).toEqual([mine]);

    const opponents = legalTargets(
      game.state,
      registry,
      { kind: "card-in-graveyard", whose: "opponent" },
      A,
    ).map((t) => (t.kind === "object" ? t.object : null));
    expect(opponents).toEqual([theirs]);
  });

  it("honours a card filter", () => {
    const game = makeGame();
    game.debugSpawn("Lightning Bolt", A, "graveyard");
    const creature = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const targets = legalTargets(
      game.state,
      registry,
      { kind: "card-in-graveyard", filter: { type: "creature" } },
      A,
    ).map((t) => (t.kind === "object" ? t.object : null));
    expect(targets).toEqual([creature]);
  });

  it("never offers a permanent on the battlefield", () => {
    const game = makeGame();
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    expect(legalTargets(game.state, registry, { kind: "card-in-graveyard" }, A)).toEqual([]);
  });

  it("describes itself for a UI prompt", () => {
    expect(describeTargetSpec({ kind: "card-in-graveyard" })).toBe("card in a graveyard");
    expect(
      describeTargetSpec({ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }),
    ).toBe("creature in your graveyard");
    expect(describeTargetSpec("creature")).toBe("creature");
  });
});

describe("Withered Wretch — exiling a graveyard card", () => {
  it("exiles the targeted card from an opponent's graveyard", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const swamp = game.debugSpawn("Swamp", A, "battlefield");
    game.state.objects[swamp].tapped = false;
    game.debugSpawn("Withered Wretch", A, "battlefield");
    const victim = game.debugSpawn("Craw Wurm", B, "graveyard");

    const legal = game
      .legalActions(A)
      .find((a) => a.kind === "activate-ability" && a.cardName === "Withered Wretch");
    expect(legal).toBeDefined();
    if (legal === undefined || legal.kind !== "activate-ability") return;

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: legal.source,
      abilityIndex: legal.abilityIndex,
      targets: [{ kind: "object", object: victim }],
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0);
    expect(game.state.objects[victim].zone).toBe("exile");
  });
});

describe("Scavenging Ooze — a condition on the chosen target", () => {
  const exileWith = (card: string) => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const forest = game.debugSpawn("Forest", A, "battlefield");
    game.state.objects[forest].tapped = false;
    const ooze = game.debugSpawn("Scavenging Ooze", A, "battlefield");
    const victim = game.debugSpawn(card, B, "graveyard");
    const lifeBefore = game.state.players[A].life;

    const legal = game
      .legalActions(A)
      .find((a) => a.kind === "activate-ability" && a.cardName === "Scavenging Ooze");
    if (legal === undefined || legal.kind !== "activate-ability") {
      throw new Error("Scavenging Ooze's ability was not offered");
    }
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: legal.source,
      abilityIndex: legal.abilityIndex,
      targets: [{ kind: "object", object: victim }],
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0);
    return {
      exiled: game.state.objects[victim].zone === "exile",
      counters: game.state.objects[ooze].counters["+1/+1"] ?? 0,
      lifeGained: game.state.players[A].life - lifeBefore,
    };
  };

  it("grows and gains life off a creature card", () => {
    expect(exileWith("Craw Wurm")).toEqual({ exiled: true, counters: 1, lifeGained: 1 });
  });

  it("only exiles a noncreature card", () => {
    expect(exileWith("Lightning Bolt")).toEqual({ exiled: true, counters: 0, lifeGained: 0 });
  });
});
