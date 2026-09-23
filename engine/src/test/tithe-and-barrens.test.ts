/**
 * Two cards the batch's engine fixes unblocked.
 *
 * Smothering Tithe: the drawing opponent decides whether to pay {2}; if they
 * don't — or can't — the Treasure is Tithe's controller's, not theirs (the
 * `unless` fix). Your own draws don't trigger it.
 *
 * Ash Barrens: {T}: Add {C}; basic landcycling {1}, which reveals the land
 * it finds (the landcycling fix).
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (aHand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Plains")] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const treasures = (game: Game, player: PlayerId): number =>
  game.battlefield
    .filter(
      (id) =>
        game.state.objects[id].cardName === "Treasure Token" &&
        game.state.objects[id].controller === player,
    )
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);

describe("Smothering Tithe", () => {
  it("asks the drawer; if they decline, its controller gets the Treasure", () => {
    const { game } = setUp();
    game.debugSpawn("Smothering Tithe", A, "battlefield");
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Island", B, "battlefield");
    game.debugApplyEffect(B, { kind: "draw", amount: 1 });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    expect(game.state.awaiting?.player).toBe(B);
    game.dispatch({ type: "choose-modes", player: B, modes: [] });
    game.advanceUntil(quiet);
    expect(treasures(game, A)).toBe(1);
    expect(treasures(game, B)).toBe(0);
  });

  it("makes nothing when the drawer pays, and pays with their own mana", () => {
    const { game } = setUp();
    game.debugSpawn("Smothering Tithe", A, "battlefield");
    const islands = [0, 1].map(() => game.debugSpawn("Island", B, "battlefield"));
    game.debugApplyEffect(B, { kind: "draw", amount: 1 });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    game.dispatch({ type: "choose-modes", player: B, modes: [0] });
    game.advanceUntil(quiet);
    expect(treasures(game, A)).toBe(0);
    expect(islands.every((id) => game.state.objects[id].tapped)).toBe(true);
  });

  it("makes the Treasure without asking a drawer who can't pay, and ignores your own draws", () => {
    const { game } = setUp();
    game.debugSpawn("Smothering Tithe", A, "battlefield");
    game.debugApplyEffect(B, { kind: "draw", amount: 2 });
    game.advanceUntil(quiet);
    expect(treasures(game, A)).toBe(2);
    game.debugApplyEffect(A, { kind: "draw", amount: 1 });
    game.advanceUntil(quiet);
    expect(treasures(game, A)).toBe(2);
  });
});

describe("Ash Barrens", () => {
  it("taps for {C}, and landcycles for {1}, revealing the basic land it finds", () => {
    const { game, a } = setUp(["Ash Barrens"]);
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    game.debugSpawn("Plains", A, "battlefield");
    const island = game.debugSpawn("Island", A, "library");
    const barrens = game.handOf(A).find((id) => game.state.objects[id].cardName === "Ash Barrens");
    if (barrens === undefined) throw new Error("no Ash Barrens");
    game.dispatch({ type: "cycle", player: A, card: barrens });
    game.advanceUntil(quiet);
    expect(game.state.objects[barrens].zone).toBe("graveyard");
    expect(game.state.objects[island].zone).toBe("hand");
    const revealed = game.state.eventLog.flatMap((e) => (e.type === "cards-revealed" ? e.objects : []));
    expect(revealed).toContain(island);

    const onBoard = game.debugSpawn("Ash Barrens", A, "battlefield");
    const manaAbility = game
      .legalActions(A)
      .find((o) => o.kind === "activate-ability" && o.source === onBoard);
    expect(manaAbility).toBeDefined();
  });

  it("can't landcycle without {1}", () => {
    const { game } = setUp(["Ash Barrens"]);
    const offered = game
      .legalActions(A)
      .some((o) => o.kind === "cycle" && game.state.objects[o.card]?.cardName === "Ash Barrens");
    expect(offered).toBe(false);
  });
});
