/**
 * The `becomes-untapped` trigger (rule 701.26b): fired by an untap step and
 * by any effect that untaps; its triggers from the untap step wait for the
 * upkeep (no player gets priority in the untap step — rule 502.4); a token
 * stack untapping is every token in it; and a shock land whose life was paid
 * entered untapped, which untaps nothing. Key to the City, Ghostly Pilferer
 * and Mesmeric Orb.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: true, maxLandsPerTurn: 99, maxHandSize: 99, openingHandSize: 0 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const hand = (game: Game, player: PlayerId = A): readonly ObjectId[] => game.state.zones.perPlayer[player].hand;
const graveyard = (game: Game, player: PlayerId = A): readonly ObjectId[] =>
  game.state.zones.perPlayer[player].graveyard;
const active = (s: GameState): PlayerId => s.turnOrder[s.turn.activePlayerIndex];

describe("Key to the City", () => {
  it("makes up to one creature unblockable for a discard, and offers a draw for {2} as it untaps", () => {
    const game = setUp();
    const key = spawn(game, "Key to the City");
    const bears = spawn(game, "Grizzly Bears");
    const card = game.debugSpawn("Hill Giant", A, "hand");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: key,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[card].zone).toBe("graveyard");
    expect(game.viewFor(A).objects[bears]?.keywords).toContain("unblockable");
    expect(game.state.objects[key].tapped).toBe(true);
    // Untapped in A's next untap step; asked in the upkeep that follows.
    spawn(game, "Wastes");
    spawn(game, "Wastes");
    game.advanceUntil((s) => active(s) === A && s.turn.number > 1 && s.awaiting?.kind === "choose-modes");
    expect(game.state.turn.step).toBe("upkeep");
    const before = hand(game).length;
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    expect(hand(game).length).toBe(before + 1);
  });

  it("can be activated with no target", () => {
    const game = setUp();
    const key = spawn(game, "Key to the City");
    game.debugSpawn("Hill Giant", A, "hand");
    expect(
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === key && x.abilityIndex === 0),
    ).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: key, abilityIndex: 0, targets: [null] });
    game.advanceUntil(quiet);
    expect(game.state.objects[key].tapped).toBe(true);
  });
});

describe("Ghostly Pilferer", () => {
  it("draws when an opponent casts a spell from anywhere but their hand, and not from their hand", () => {
    const game = setUp();
    spawn(game, "Ghostly Pilferer");
    game.advanceUntil((s) => active(s) === B && s.turn.step === "precombat-main" && s.priority.holder === B);
    ["Mountain", "Mountain", "Mountain", "Mountain"].forEach((name) => spawn(game, name, B));
    const fromHand = game.debugSpawn("Lightning Bolt", B, "hand");
    const before = hand(game).length;
    game.dispatch({ type: "cast-spell", player: B, card: fromHand, targets: [{ kind: "player", player: A }] });
    game.advanceUntil(quiet);
    expect(hand(game).length).toBe(before);
    const flashback = game.debugSpawn("Faithless Looting", B, "graveyard");
    game.dispatch({ type: "cast-spell", player: B, card: flashback, via: "flashback" });
    game.advanceUntil((s) => quiet(s) || s.awaiting?.kind === "discard");
    expect(hand(game).length).toBe(before + 1);
  });

  it("can't be blocked this turn for a discard", () => {
    const game = setUp();
    const pilferer = spawn(game, "Ghostly Pilferer");
    game.debugSpawn("Hill Giant", A, "hand");
    game.dispatch({ type: "activate-ability", player: A, source: pilferer, abilityIndex: 0 });
    game.advanceUntil(quiet);
    expect(game.viewFor(A).objects[pilferer]?.keywords).toContain("unblockable");
  });
});

describe("Mesmeric Orb", () => {
  it("mills the controller of each permanent that untaps, a token stack once per token", () => {
    const game = setUp();
    spawn(game, "Mesmeric Orb");
    const land = spawn(game, "Wastes", B);
    game.state.objects[land].tapped = true;
    game.debugApplyEffect(B, { kind: "create-token", token: "Soldier Token", count: 10, tapped: true });
    const millsOfB = (): number => graveyard(game, B).length;
    const before = millsOfB();
    game.advanceUntil((s) => active(s) === B && s.turn.step === "untap");
    // Folded into one stack at the cleanup step, they untap as one object.
    const soldiers = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Soldier Token",
    );
    expect(soldiers).toHaveLength(1);
    expect(game.state.objects[soldiers[0]].stackCount).toBe(10);
    game.advanceUntil((s) => active(s) === B && s.turn.step === "upkeep" && quiet(s) && s.priority.holder === B);
    // The Wastes and ten Soldiers: eleven mills.
    expect(millsOfB()).toBe(before + 11);
    expect(graveyard(game, A)).toHaveLength(0);
  });

  it("isn't fired by a shock land that entered untapped", () => {
    const game = setUp();
    spawn(game, "Mesmeric Orb");
    const shock = game.debugSpawn("Steam Vents", A, "hand");
    game.dispatch({ type: "play-land", player: A, card: shock });
    expect(game.state.awaiting?.kind).toBe("pay-life-for-untapped");
    game.dispatch({ type: "pay-life-for-untapped", player: A, pay: true });
    game.advanceUntil(quiet);
    expect(game.state.objects[shock].tapped).toBe(false);
    expect(graveyard(game, A)).toHaveLength(0);
  });
});
