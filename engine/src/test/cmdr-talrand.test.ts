import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { computeCharacteristics } from "../characteristics.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { TargetRef } from "../target.js";

/**
 * Talrand, Sky Summoner — {2}{U}{U} legendary 2/2 Merfolk Wizard.
 *   Whenever you cast an instant or sorcery spell, create a 2/2 blue Drake
 *   creature token with flying.
 *
 * One printed clause, so the tests are about its edges: *you*, *instant or
 * sorcery*, and *cast* (not "resolves").
 */

const TALRAND = "Talrand, Sky Summoner";
const DRAKE = "Drake Token";
const reg = createDefaultRegistry();
const [A, B] = ["alice", "bob"].map(asPlayerId);

function table(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

function lands(game: Game, player: PlayerId, n: number): void {
  for (let i = 0; i < n; i += 1) game.debugSpawn("Island", player, "battlefield");
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

function cast(game: Game, player: PlayerId, name: string, targets: TargetRef[] = []): ObjectId {
  priorityTo(game, player);
  const card = game.debugSpawn(name, player, "hand");
  game.dispatch({ type: "cast-spell", player, card, targets });
  return card;
}

/** Drakes `player` controls, counting a token stack as every token in it. */
function drakes(game: Game, player: PlayerId): number {
  return game.state.zones.shared.battlefield
    .map((id) => game.state.objects[id])
    .filter((o) => o.cardName === DRAKE && o.controller === player)
    .reduce((n, o) => n + (o.stackCount ?? 1), 0);
}

const drakeIds = (game: Game, player: PlayerId): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => {
    const o = game.state.objects[id];
    return o.cardName === DRAKE && o.controller === player;
  });

describe("Talrand, Sky Summoner", () => {
  it("is a legendary 2/2 Merfolk Wizard with no keywords of its own", () => {
    const game = table();
    const talrand = game.debugSpawn(TALRAND, A, "battlefield", { summoningSick: false });
    const c = computeCharacteristics(game.state, reg, talrand);
    expect(c.power).toBe(2);
    expect(c.toughness).toBe(2);
    expect(c.types).toContain("creature");
    expect(c.subtypes).toEqual(expect.arrayContaining(["Merfolk", "Wizard"]));
    expect(reg.get(TALRAND).supertypes).toContain("legendary");
    expect(reg.get(TALRAND).manaCost).toBe("{2}{U}{U}");
    // Talrand himself doesn't fly — only the Drakes do.
    expect(c.keywords.has("flying")).toBe(false);
  });

  it("an instant you cast makes one Drake, and it arrives before that spell resolves", () => {
    const game = table();
    const talrand = game.debugSpawn(TALRAND, A, "battlefield", { summoningSick: false });
    lands(game, A, 1);
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");

    const unsummon = cast(game, A, "Unsummon", [{ kind: "object", object: bears }]);

    // The trigger sits above the spell that caused it.
    const stack = game.state.zones.shared.stack;
    expect(stack).toHaveLength(2);
    expect(stack[0]).toBe(unsummon);
    const trigger = game.state.objects[stack[1]];
    expect(trigger.kind).toBe("ability");
    expect(trigger.sourceObjectId).toBe(talrand);

    // One round of passes resolves the trigger alone: the Drake is on the
    // battlefield while Unsummon is still on the stack.
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
    expect(game.state.zones.shared.stack).toEqual([unsummon]);
    expect(drakes(game, A)).toBe(1);
    expect(game.state.objects[bears].zone).toBe("battlefield");

    settle(game);
    expect(drakes(game, A)).toBe(1);
    expect(game.state.objects[bears].zone).toBe("hand");
  });

  it("the Drake is a 2/2 blue flying Drake token", () => {
    const game = table();
    game.debugSpawn(TALRAND, A, "battlefield", { summoningSick: false });
    lands(game, A, 1);
    cast(game, A, "Tome Scour", [{ kind: "player", player: B }]);
    settle(game);

    const ids = drakeIds(game, A);
    expect(ids).toHaveLength(1);
    const drake = game.state.objects[ids[0]];
    expect(drake.isToken).toBe(true);
    expect(drake.owner).toBe(A);
    const c = computeCharacteristics(game.state, reg, ids[0]);
    expect(c.power).toBe(2);
    expect(c.toughness).toBe(2);
    expect([...c.colors]).toEqual(["U"]);
    expect(c.types).toEqual(["creature"]);
    expect(c.subtypes).toEqual(["Drake"]);
    expect(c.keywords.has("flying")).toBe(true);
  });

  it("a sorcery counts too, and each spell makes its own Drake", () => {
    const game = table();
    game.debugSpawn(TALRAND, A, "battlefield", { summoningSick: false });
    lands(game, A, 3);

    cast(game, A, "Tome Scour", [{ kind: "player", player: B }]);
    settle(game);
    expect(drakes(game, A)).toBe(1);

    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    cast(game, A, "Unsummon", [{ kind: "object", object: bears }]);
    settle(game);
    expect(drakes(game, A)).toBe(2);

    cast(game, A, "Tome Scour", [{ kind: "player", player: B }]);
    settle(game);
    expect(drakes(game, A)).toBe(3);
  });

  it("triggers on the cast, so a countered spell still leaves the Drake", () => {
    const game = table();
    game.debugSpawn(TALRAND, A, "battlefield", { summoningSick: false });
    lands(game, A, 1);
    lands(game, B, 2);

    const scour = cast(game, A, "Tome Scour", [{ kind: "player", player: B }]);
    const counterspell = cast(game, B, "Counterspell", [{ kind: "object", object: scour }]);
    expect(game.state.zones.shared.stack).toHaveLength(3);
    expect(game.state.zones.shared.stack[2]).toBe(counterspell);

    settle(game);
    expect(game.state.objects[scour].zone).toBe("graveyard");
    // Countered, so nobody was milled: B's graveyard holds only Counterspell.
    expect(game.state.zones.perPlayer[B].graveyard).toEqual([counterspell]);
    expect(drakes(game, A)).toBe(1);
    // B's own Counterspell is an instant, but it isn't *your* spell.
    expect(drakes(game, B)).toBe(0);
  });

  // --- negatives -------------------------------------------------------

  it("does NOT trigger on a creature spell, nor on an opponent's instant", () => {
    const game = table();
    game.debugSpawn(TALRAND, A, "battlefield", { summoningSick: false });
    lands(game, A, 2);
    lands(game, B, 1);

    // A casts a creature spell — not an instant or sorcery.
    const stalker = cast(game, A, "Invisible Stalker");
    expect(game.state.zones.shared.stack).toEqual([stalker]);
    expect(game.state.pendingTriggers).toHaveLength(0);
    settle(game);
    expect(game.state.objects[stalker].zone).toBe("battlefield");
    expect(drakes(game, A)).toBe(0);

    // B casts an instant — it's an instant, but it isn't A's.
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const unsummon = cast(game, B, "Unsummon", [{ kind: "object", object: bears }]);
    expect(game.state.zones.shared.stack).toEqual([unsummon]);
    expect(game.state.pendingTriggers).toHaveLength(0);
    settle(game);
    expect(drakes(game, A)).toBe(0);
    expect(drakes(game, B)).toBe(0);
  });

  it("does NOT trigger from the hand or the command zone", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      decks: [
        { player: A, cards: Array(60).fill("Island"), commanders: [TALRAND] },
        { player: B, cards: Array(60).fill("Island") },
      ],
    });
    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
    const inCommand = game.state.zones.shared.command.find(
      (id) => game.state.objects[id].cardName === TALRAND,
    );
    expect(inCommand).toBeDefined();
    game.debugSpawn(TALRAND, A, "hand");
    lands(game, A, 1);

    cast(game, A, "Tome Scour", [{ kind: "player", player: B }]);
    expect(game.state.zones.shared.stack).toHaveLength(1);
    settle(game);
    expect(drakes(game, A)).toBe(0);
  });
});
