import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { computeCharacteristics } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

/**
 * Shroofus Sproutsire — {2}{G} Legendary Creature — Saproling 1/1.
 * "Trample. Whenever a Saproling you control deals combat damage to a player,
 * create that many 1/1 green Saproling creature tokens."
 */

const A = asPlayerId("alice");
const B = asPlayerId("bob");

function table() {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Forest") })),
  });
  return { game, a, b };
}

function spawn(game: Game, name: string, player: PlayerId): ObjectId {
  return game.debugSpawn(name, player, "battlefield", { summoningSick: false });
}

/** A real Saproling token — minted through `create-token`, then readied. */
function saprolingToken(game: Game, player: PlayerId): ObjectId {
  const before = new Set(game.state.zones.shared.battlefield);
  game.debugApplyEffect(player, { kind: "create-token", token: "Saproling Token", count: 1 });
  const id = game.state.zones.shared.battlefield.find((o) => !before.has(o));
  if (id === undefined) throw new Error("no token");
  game.state.objects[id].summoningSick = false;
  return id;
}

/** Every Saproling token `player` controls, counting each copy in a stack. */
function saprolings(game: Game, player: PlayerId): number {
  return game.state.zones.shared.battlefield
    .map((id) => game.state.objects[id])
    .filter((o) => o.cardName === "Saproling Token" && o.controller === player)
    .reduce((n, o) => n + (o.stackCount ?? 1), 0);
}

const activeIs = (s: GameState, player: PlayerId): boolean =>
  s.turnOrder[s.turn.activePlayerIndex] === player;

/** Runs `player`'s next combat through to its postcombat main phase with the
 * stack empty. */
function fight(game: Game, player: PlayerId): void {
  game.advanceUntil((s) => activeIs(s, player) && s.turn.step === "postcombat-main");
  game.advanceUntil(
    (s) =>
      s.zones.shared.stack.length === 0 &&
      s.awaiting === null &&
      s.pendingTriggers.length === 0,
  );
}

describe("Shroofus Sproutsire", () => {
  it("is a 1/1 legendary Saproling with trample", () => {
    const { game } = table();
    const shroofus = spawn(game, "Shroofus Sproutsire", A);
    const c = computeCharacteristics(game.state, createDefaultRegistry(), shroofus);
    expect(c.power).toBe(1);
    expect(c.toughness).toBe(1);
    expect(c.subtypes).toContain("Saproling");
    expect(c.keywords.has("trample")).toBe(true);
  });

  it("makes a Saproling when Shroofus itself connects — it is a Saproling you control", () => {
    const { game, a } = table();
    const shroofus = spawn(game, "Shroofus Sproutsire", A);
    a.declareAttackersFn = () => [{ attacker: shroofus, defender: B }];

    fight(game, A);

    expect(game.state.players[B].life).toBe(19);
    expect(saprolings(game, A)).toBe(1);
  });

  it("makes that many: each Saproling that connects triggers for the damage it dealt", () => {
    const { game, a } = table();
    const shroofus = spawn(game, "Shroofus Sproutsire", A);
    const big = saprolingToken(game, A);
    game.state.objects[big].counters["+1/+1"] = 2; // a 3/3 Saproling
    const small = saprolingToken(game, A);
    a.declareAttackersFn = () => [
      { attacker: shroofus, defender: B },
      { attacker: big, defender: B },
      { attacker: small, defender: B },
    ];

    fight(game, A);

    expect(game.state.players[B].life).toBe(20 - 1 - 3 - 1);
    // Two tokens were already there; 1 + 3 + 1 new ones.
    expect(saprolings(game, A)).toBe(2 + 5);
    // One trigger per Saproling that connected, not one per combat.
    const triggered = game
      .eventsOfType("ability-triggered")
      .filter((e) => e.source === shroofus);
    expect(triggered).toHaveLength(3);
  });

  it("a creature you control that isn't a Saproling doesn't trigger it", () => {
    const { game, a } = table();
    spawn(game, "Shroofus Sproutsire", A);
    const bears = spawn(game, "Grizzly Bears", A);
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];

    fight(game, A);

    expect(game.state.players[B].life).toBe(18);
    expect(saprolings(game, A)).toBe(0);
  });

  it("an opponent's Saproling connecting doesn't trigger it", () => {
    const { game, b } = table();
    spawn(game, "Shroofus Sproutsire", A);
    const theirs = saprolingToken(game, B);
    b.declareAttackersFn = () => [{ attacker: theirs, defender: A }];

    fight(game, B);

    expect(game.state.players[A].life).toBe(19);
    expect(saprolings(game, A)).toBe(0);
    expect(saprolings(game, B)).toBe(1);
  });

  it("combat damage to a blocking creature isn't damage to a player", () => {
    const { game, a, b } = table();
    spawn(game, "Shroofus Sproutsire", A);
    const token = saprolingToken(game, A);
    const wall = spawn(game, "Wall of Wood", B);
    a.declareAttackersFn = () => [{ attacker: token, defender: B }];
    b.declareBlockersFn = () => [{ blocker: wall, attacker: token }];

    fight(game, A);

    expect(game.state.players[B].life).toBe(20);
    expect(saprolings(game, A)).toBe(1); // just the attacker
  });

  it("trample: damage beyond lethal to its blocker reaches the player and counts", () => {
    const { game, a, b } = table();
    const shroofus = spawn(game, "Shroofus Sproutsire", A);
    game.state.objects[shroofus].counters["+1/+1"] = 2; // a 3/3 trampler
    const bears = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: shroofus, defender: B }];
    b.declareBlockersFn = () => [{ blocker: bears, attacker: shroofus }];

    fight(game, A);

    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.players[B].life).toBe(19);
    expect(saprolings(game, A)).toBe(1);
  });
});
