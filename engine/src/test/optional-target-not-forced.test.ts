/**
 * An "up to one target" slot with exactly one legal option is still a
 * choice: the player may leave it empty. The engine used to take a lone
 * option as forced and pick it without asking, which made Displacer Kitten
 * blink itself (losing its counters) and would have made Loran destroy its
 * controller's own only artifact.
 *
 * Displacer Kitten: exile up to one target nonland permanent you control and
 * return it, whenever you cast a noncreature spell.
 * Loran of the Third Path: vigilance; destroy up to one target artifact or
 * enchantment on entering; {T}: you and target opponent each draw.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
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
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Plains")] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const cast = (game: Game, name: string): ObjectId => {
  const card = game.handOf(A).find((id) => game.state.objects[id].cardName === name);
  if (card === undefined) throw new Error(`no ${name}`);
  game.dispatch({ type: "cast-spell", player: A, card });
  return card;
};

describe("Displacer Kitten", () => {
  it("asks rather than blinking itself when it's the only candidate, and may skip", () => {
    const { game } = setUp(["Sol Ring"]);
    const kitten = game.debugSpawn("Displacer Kitten", A, "battlefield");
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [
      { kind: "object", object: kitten },
    ]);
    game.debugSpawn("Plains", A, "battlefield");
    cast(game, "Sol Ring");
    expect(game.state.awaiting?.kind).toBe("choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [null] });
    game.advanceUntil(quiet);
    // Not blinked: it kept its counter.
    expect(game.state.objects[kitten].counters["+1/+1"]).toBe(1);
  });

  it("blinks the chosen permanent, which returns as a new object", () => {
    const { game } = setUp(["Sol Ring"]);
    game.debugSpawn("Displacer Kitten", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [
      { kind: "object", object: bears },
    ]);
    game.debugSpawn("Plains", A, "battlefield");
    cast(game, "Sol Ring");
    game.dispatch({ type: "choose-targets", player: A, targets: [{ kind: "object", object: bears }] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[bears].counters["+1/+1"] ?? 0).toBe(0);
  });

  it("offers no land and nothing an opponent controls, and ignores creature spells", () => {
    const { game } = setUp(["Sol Ring", "Grizzly Bears"]);
    game.debugSpawn("Displacer Kitten", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", A, "battlefield");
    cast(game, "Grizzly Bears");
    expect(game.state.awaiting?.kind).not.toBe("choose-targets");
    game.advanceUntil(quiet);
    cast(game, "Sol Ring");
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-targets") throw new Error("expected a target choice");
    const options = awaiting.options[0].map((t) => (t.kind === "object" ? t.object : null));
    expect(options).not.toContain(theirs);
    expect(options.every((id) => id === null || game.state.objects[id].cardName !== "Forest")).toBe(true);
  });
});

describe("Loran of the Third Path", () => {
  it("may leave its own controller's only artifact alone, or destroy it", () => {
    const { game } = setUp(["Loran of the Third Path", "Loran of the Third Path"]);
    const ring = game.debugSpawn("Sol Ring", A, "battlefield");
    for (let i = 0; i < 6; i += 1) game.debugSpawn("Plains", A, "battlefield");
    cast(game, "Loran of the Third Path");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [null] });
    game.advanceUntil(quiet);
    expect(game.state.objects[ring].zone).toBe("battlefield");
  });

  it("destroys the chosen artifact or enchantment", () => {
    const { game } = setUp(["Loran of the Third Path"]);
    const theirs = game.debugSpawn("Sol Ring", B, "battlefield");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Plains", A, "battlefield");
    cast(game, "Loran of the Third Path");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [{ kind: "object", object: theirs }] });
    game.advanceUntil(quiet);
    expect(game.state.objects[theirs].zone).toBe("graveyard");
  });

  it("{T}: you and target opponent each draw", () => {
    const { game } = setUp([]);
    const loran = game.debugSpawn("Loran of the Third Path", A, "battlefield", { summoningSick: false });
    const [mine, theirs] = [game.handOf(A).length, game.handOf(B).length];
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: loran,
      abilityIndex: 0,
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(mine + 1);
    expect(game.handOf(B).length).toBe(theirs + 1);
    expect(game.characteristics(loran).keywords.has("vigilance")).toBe(true);
  });
});
