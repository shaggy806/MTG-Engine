import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { computeCharacteristics } from "../characteristics.js";
import { validateCommanderDeck } from "../deck-validation.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { TargetRef } from "../target.js";

/**
 * Ishai, Ojutai Dragonspeaker — {2}{W}{U} 1/1 Bird Monk.
 *   Flying
 *   Whenever an opponent casts a spell, put a +1/+1 counter on Ishai.
 *   Partner
 */

const ISHAI = "Ishai, Ojutai Dragonspeaker";
const reg = createDefaultRegistry();
const [A, B, C] = ["alice", "bob", "carol"].map(asPlayerId);

function table(players: readonly PlayerId[] = [A, B]): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: players.map((player) => ({ player, cards: Array(60).fill("Mountain") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

function lands(game: Game, name: string, player: PlayerId, n: number): void {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, player, "battlefield");
}

/** Passes until the stack and the trigger queue are empty. */
function settle(game: Game): void {
  for (let i = 0; i < 200; i += 1) {
    const awaiting = game.state.awaiting;
    if (awaiting !== null) throw new Error(`unexpected ${awaiting.kind}`);
    if (game.state.zones.shared.stack.length === 0 && game.state.pendingTriggers.length === 0) return;
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
  }
  throw new Error("never settled");
}

/** Hands priority round to `player` (never a full lap, so the step holds). */
function priorityTo(game: Game, player: PlayerId): void {
  for (let i = 0; i < 4 && game.state.priority.holder !== player; i += 1) {
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
  }
  expect(game.state.priority.holder).toBe(player);
}

function cast(game: Game, player: PlayerId, name: string, targets: TargetRef[]): ObjectId {
  priorityTo(game, player);
  const card = game.debugSpawn(name, player, "hand");
  game.dispatch({ type: "cast-spell", player, card, targets });
  return card;
}

const counters = (game: Game, id: ObjectId): number => game.state.objects[id].counters["+1/+1"] ?? 0;
const power = (game: Game, id: ObjectId): number => computeCharacteristics(game.state, reg, id).power ?? 0;

describe("Ishai, Ojutai Dragonspeaker", () => {
  it("is a 1/1 flier", () => {
    const game = table();
    const ishai = game.debugSpawn(ISHAI, A, "battlefield", { summoningSick: false });
    const c = computeCharacteristics(game.state, reg, ishai);
    expect(c.power).toBe(1);
    expect(c.toughness).toBe(1);
    expect(c.keywords).toContain("flying");
  });

  it("flying: a ground creature can't block it, a flier can", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      decks: [A, B].map((player) => ({ player, cards: Array(40).fill("Mountain") })),
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const ishai = game.debugSpawn(ISHAI, A, "battlefield", { summoningSick: false });
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const nighthawk = game.debugSpawn("Vampire Nighthawk", B, "battlefield");
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: ishai, defender: B }] });
    game.advanceUntil((s) => s.awaiting?.kind === "blockers" || s.result.over);
    const legal = game.legalActions(B).find((a) => a.kind === "declare-blockers");
    if (legal === undefined || legal.kind !== "declare-blockers") throw new Error("no block offer");
    const canBlock = legal.eligible.filter((e) => e.canBlock.includes(ishai)).map((e) => e.blocker);
    expect(canBlock).toContain(nighthawk);
    expect(canBlock).not.toContain(bears);
  });

  it("an opponent's spell puts a counter on it, and the trigger resolves before that spell", () => {
    const game = table();
    const ishai = game.debugSpawn(ISHAI, A, "battlefield", { summoningSick: false });
    lands(game, "Mountain", B, 1);
    const bolt = cast(game, B, "Lightning Bolt", [{ kind: "player", player: A }]);

    // The trigger sits above the Bolt on the stack.
    const stack = game.state.zones.shared.stack;
    expect(stack).toHaveLength(2);
    expect(stack[0]).toBe(bolt);
    const trigger = game.state.objects[stack[1]];
    expect(trigger.kind).toBe("ability");
    expect(trigger.sourceObjectId).toBe(ishai);

    // One round of passes resolves the trigger alone: the Bolt is still there.
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
    expect(game.state.zones.shared.stack).toEqual([bolt]);
    expect(counters(game, ishai)).toBe(1);
    expect(game.state.players[A].life).toBe(20);

    settle(game);
    expect(game.state.players[A].life).toBe(17);
    expect(counters(game, ishai)).toBe(1);
    expect(power(game, ishai)).toBe(2);
    expect(computeCharacteristics(game.state, reg, ishai).toughness).toBe(2);
  });

  it("counts any spell — a creature spell too — once per spell", () => {
    const game = table();
    const ishai = game.debugSpawn(ISHAI, A, "battlefield", { summoningSick: false });
    lands(game, "Mountain", B, 3);
    cast(game, B, "Lightning Bolt", [{ kind: "player", player: A }]);
    settle(game);
    cast(game, B, "Lightning Bolt", [{ kind: "player", player: A }]);
    settle(game);
    expect(counters(game, ishai)).toBe(2);

    // A creature spell, cast on B's own turn at sorcery speed.
    game.advanceUntil(
      (s) =>
        s.turnOrder[s.turn.activePlayerIndex] === B &&
        s.turn.step === "precombat-main" &&
        s.priority.holder === B,
    );
    const swiftspear = game.debugSpawn("Monastery Swiftspear", B, "hand");
    game.dispatch({ type: "cast-spell", player: B, card: swiftspear, targets: [] });
    settle(game);
    expect(game.state.objects[swiftspear].zone).toBe("battlefield");
    expect(counters(game, ishai)).toBe(3);
    expect(power(game, ishai)).toBe(4);
  });

  it("ignores its controller's own spells", () => {
    const game = table();
    const ishai = game.debugSpawn(ISHAI, A, "battlefield", { summoningSick: false });
    lands(game, "Mountain", A, 2);
    cast(game, A, "Lightning Bolt", [{ kind: "player", player: B }]);
    expect(game.state.zones.shared.stack).toHaveLength(1);
    settle(game);
    cast(game, A, "Lightning Bolt", [{ kind: "player", player: B }]);
    settle(game);
    expect(game.state.players[B].life).toBe(14);
    expect(counters(game, ishai)).toBe(0);
  });

  it("still gets its counter when the spell is countered", () => {
    const game = table();
    const ishai = game.debugSpawn(ISHAI, A, "battlefield", { summoningSick: false });
    lands(game, "Mountain", B, 1);
    lands(game, "Island", A, 2);
    const bolt = cast(game, B, "Lightning Bolt", [{ kind: "player", player: A }]);
    // A answers with Counterspell on top of Ishai's trigger — A's own spell
    // doesn't trigger Ishai.
    const counterspell = cast(game, A, "Counterspell", [{ kind: "object", object: bolt }]);
    expect(game.state.zones.shared.stack).toHaveLength(3);
    expect(game.state.zones.shared.stack[2]).toBe(counterspell);
    settle(game);
    expect(game.state.objects[bolt].zone).toBe("graveyard");
    expect(game.state.players[A].life).toBe(20);
    expect(counters(game, ishai)).toBe(1);
  });

  it("triggers for each opponent at a multiplayer table", () => {
    const game = table([A, B, C]);
    const ishai = game.debugSpawn(ISHAI, A, "battlefield", { summoningSick: false });
    lands(game, "Mountain", B, 1);
    lands(game, "Mountain", C, 1);
    cast(game, B, "Lightning Bolt", [{ kind: "player", player: C }]);
    settle(game);
    cast(game, C, "Lightning Bolt", [{ kind: "player", player: B }]);
    settle(game);
    expect(counters(game, ishai)).toBe(2);
  });

  it("doesn't trigger from the command zone or a hand", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      decks: [
        { player: A, cards: Array(60).fill("Mountain"), commanders: [ISHAI, "Kraum, Ludevic's Opus"] },
        { player: B, cards: Array(60).fill("Mountain") },
      ],
    });
    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
    const inCommand = game.state.zones.shared.command.find((id) => game.state.objects[id].cardName === ISHAI);
    expect(inCommand).toBeDefined();
    game.debugSpawn(ISHAI, A, "hand");
    lands(game, "Mountain", B, 1);
    cast(game, B, "Lightning Bolt", [{ kind: "player", player: A }]);
    expect(game.state.zones.shared.stack).toHaveLength(1);
    settle(game);
    expect(game.state.players[A].life).toBe(17);
  });
});

describe("Ishai as a Partner commander", () => {
  it("pairs with another Partner commander in deck validation", () => {
    const r = validateCommanderDeck(
      {
        commanders: [ISHAI, "Kraum, Ludevic's Opus"],
        cards: ["Counterspell", "Lightning Bolt", "Swords to Plowshares", ...Array<string>(95).fill("Island")],
        size: 100,
      },
      reg,
    );
    expect(r.violations).toEqual([]);
    expect(r.legal).toBe(true);
    expect(r.identity).toBe("WUR");
  });

  it("both Partners start in the command zone, and Ishai is castable from there", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      decks: [
        { player: A, cards: Array(60).fill("Mountain"), commanders: [ISHAI, "Kraum, Ludevic's Opus"] },
        { player: B, cards: Array(60).fill("Mountain") },
      ],
    });
    const named = (name: string): ObjectId => {
      const id = game.state.zones.shared.command.find((i) => game.state.objects[i].cardName === name);
      if (id === undefined) throw new Error(`no ${name} in the command zone`);
      return id;
    };
    const ishai = named(ISHAI);
    expect(game.state.objects[named("Kraum, Ludevic's Opus")].isCommander).toBe(true);
    expect(game.state.objects[ishai].isCommander).toBe(true);

    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
    lands(game, "Plains", A, 2);
    lands(game, "Island", A, 2);
    game.dispatch({ type: "cast-spell", player: A, card: ishai, targets: [] });
    settle(game);
    expect(game.state.objects[ishai].zone).toBe("battlefield");
    expect(game.state.players[A].commanderCastCounts[ISHAI]).toBe(1);
    expect(game.state.players[A].commanderCastCounts["Kraum, Ludevic's Opus"] ?? 0).toBe(0);
  });
});
