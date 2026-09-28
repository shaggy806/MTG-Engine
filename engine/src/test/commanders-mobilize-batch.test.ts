import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

// Six top-500 commanders the 2026-09-28 backlog audit found ready (Astarion,
// Wolverine, Tannuk) or that mobilize (rule 702.181a) unblocked (the two
// Zurgos), and the top-5000 mobilize cards.

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (players: readonly PlayerId[] = [A, B], deck = "Mountain") => {
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)]));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40 },
    controllers,
    decks: players.map((player) => ({ player, cards: Array(40).fill(deck) })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, c: controllers as Record<PlayerId, ScriptedController> };
};

const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const toPostcombat = (s: GameState): boolean => s.turn.number === 1 && s.turn.step === "postcombat-main";
const afterAttackTriggers = (s: GameState): boolean =>
  s.turn.step === "declare-attackers" && s.zones.shared.stack.length === 0 && s.awaiting === null;

describe("Astarion, the Decadent", () => {
  it("Feed: the target opponent loses as much again as they lost this turn", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Astarion, the Decadent", A, "battlefield");
    game.debugApplyEffect(A, { kind: "lose-life", amount: 5, who: "each-opponent" });
    c[A].chooseModesFn = () => [0];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "cleanup");
    expect(game.state.players[B].life).toBe(40 - 5 - 5);
  });

  it("Friends: you gain as much again as you gained this turn", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Astarion, the Decadent", A, "battlefield");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 });
    c[A].chooseModesFn = () => [1];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "cleanup");
    expect(game.state.players[A].life).toBe(40 + 3 + 3);
  });
});

describe("Wolverine, Best There Is", () => {
  it("deals double damage, and grows at the end step after damaging another creature", () => {
    const { game, c } = mkGame();
    const wolverine = game.debugSpawn("Wolverine, Best There Is", A, "battlefield", { summoningSick: false });
    // A 1/1 blocker, so he survives the block.
    const elves = game.debugSpawn("Llanowar Elves", B, "battlefield");
    c[A].declareAttackersFn = () => [{ attacker: wolverine, defender: B }];
    c[B].declareBlockersFn = () => [{ blocker: elves, attacker: wolverine }];
    game.advanceUntil(toPostcombat);
    expect(game.state.objects[elves]?.zone).not.toBe("battlefield");
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[wolverine].counters["+1/+1"]).toBe(1);
  });

  it("doubles his damage to a player", () => {
    const { game, c } = mkGame();
    const wolverine = game.debugSpawn("Wolverine, Best There Is", A, "battlefield", { summoningSick: false });
    c[A].declareAttackersFn = () => [{ attacker: wolverine, defender: B }];
    game.advanceUntil(toPostcombat);
    expect(game.state.players[B].life).toBe(36);
  });

  it("doesn't double other sources' damage", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Wolverine, Best There Is", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    c[A].declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil(toPostcombat);
    expect(game.state.players[B].life).toBe(38);
  });
});

describe("Tannuk, Steadfast Second", () => {
  it("gives a red creature card in hand warp {2}{R}; cast that way, it's exiled at the end step", () => {
    const { game } = mkGame();
    game.debugSpawn("Tannuk, Steadfast Second", A, "battlefield");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", A, "hand");
    const warp = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.card === giant && a.via === "warp");
    expect(warp).toBeDefined();
    game.dispatch({ type: "cast-spell", player: A, card: giant, targets: [], via: "warp" });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
    expect(game.state.objects[giant].zone).toBe("battlefield");
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[giant].zone).toBe("exile");
  });

  it("offers no warp for a card that matches neither half", () => {
    const { game } = mkGame();
    game.debugSpawn("Tannuk, Steadfast Second", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    expect(
      game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === bears && a.via === "warp"),
    ).toBe(false);
  });
});

describe("mobilize (rule 702.181a)", () => {
  it("Zurgo Stormrender: a Warrior attacks and is sacrificed at the end step; a token dying attacking draws, one leaving later drains", () => {
    const { game, c } = mkGame();
    const zurgo = game.debugSpawn("Zurgo Stormrender", A, "battlefield", { summoningSick: false });
    c[A].declareAttackersFn = () => [{ attacker: zurgo, defender: B }];
    game.advanceUntil(afterAttackTriggers);
    const [warrior] = named(game, "Red Warrior Token");
    expect(game.state.objects[warrior].attacking).toBe(B);
    game.advanceUntil(toPostcombat);
    expect(game.state.players[B].life).toBe(40 - 3 - 1);
    game.advanceUntil((s) => s.turn.number === 2);
    // Sacrificed at the end step, not attacking any more: each opponent loses 1.
    expect(named(game, "Red Warrior Token")).toHaveLength(0);
    expect(game.state.players[B].life).toBe(40 - 3 - 1 - 1);
  });

  it("Zurgo, Thunder's Decree: during your end step the Warriors can't be sacrificed, so they stay", () => {
    const { game, c } = mkGame();
    const zurgo = game.debugSpawn("Zurgo, Thunder's Decree", A, "battlefield", { summoningSick: false });
    c[A].declareAttackersFn = () => [{ attacker: zurgo, defender: B }];
    game.advanceUntil((s) => s.turn.number === 2);
    expect(named(game, "Red Warrior Token")).toHaveLength(2);
  });

  it("Avenger of the Fallen: X is the creature cards in your graveyard", () => {
    const { game, c } = mkGame();
    const avenger = game.debugSpawn("Avenger of the Fallen", A, "battlefield", { summoningSick: false });
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Grizzly Bears", A, "graveyard");
    c[A].declareAttackersFn = () => [{ attacker: avenger, defender: B }];
    game.advanceUntil(afterAttackTriggers);
    expect(named(game, "Red Warrior Token")).toHaveLength(3);
  });
});
