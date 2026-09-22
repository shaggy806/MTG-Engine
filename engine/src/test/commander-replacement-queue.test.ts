import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

/**
 * A commander's 903.9a choice must be asked every time, even when it can't be
 * asked at the moment the commander would leave.
 *
 * Two ways it used to be lost. A spell that raised a decision of its own
 * *after* deferring a commander's move (Path to Exile: exile, then "its
 * controller may search") overwrote the question — the commander never left,
 * and `deferredCommanderMove` stayed set for the rest of the game, so every
 * commander after that moved with nobody asked. That was found from a live
 * game, where a later Hour of Reckoning killed a Krenko without offering the
 * command zone. And a mass effect that reached a second commander while the
 * first was being asked (an overloaded Cyclonic Rift) moved it unasked.
 */

const [A, B, C, D] = ["alice", "bob", "carol", "dave"].map(asPlayerId);

function table(players: readonly PlayerId[], active: PlayerId): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: players.map((player) => ({ player, cards: Array(60).fill("Mountain") })),
  });
  game.advanceUntil(
    (s) =>
      s.turn.step === "precombat-main" &&
      s.turnOrder[s.turn.activePlayerIndex] === active &&
      s.priority.holder === active,
  );
  return game;
}

function commander(game: Game, name: string, owner: PlayerId): ObjectId {
  const id = game.debugSpawn(name, owner, "battlefield", { summoningSick: false });
  game.state.objects[id].isCommander = true;
  return id;
}

function lands(game: Game, name: string, player: PlayerId, count: number): void {
  for (let i = 0; i < count; i += 1) {
    game.debugSpawn(name, player, "battlefield", { summoningSick: false });
  }
}

/**
 * Passes priority until the stack is empty. Every commander choice is
 * answered with `toCommandZone` and recorded as "owner:cardName"; a library
 * search finds nothing.
 */
function resolveStack(game: Game, toCommandZone = true): string[] {
  const asked: string[] = [];
  for (let i = 0; i < 200; i += 1) {
    const awaiting = game.state.awaiting;
    if (awaiting?.kind === "commander-replacement") {
      asked.push(`${awaiting.player}:${game.state.objects[awaiting.commander].cardName}`);
      game.dispatch({ type: "commander-replacement", player: awaiting.player, toCommandZone });
      continue;
    }
    if (awaiting?.kind === "choose-from-zone") {
      game.dispatch({ type: "choose-from-zone", player: awaiting.player, chosen: [] });
      continue;
    }
    if (awaiting !== null) throw new Error(`unexpected ${awaiting.kind} decision`);
    if (game.state.zones.shared.stack.length === 0) return asked;
    const holder = game.state.priority.holder;
    if (holder === null) throw new Error("nobody holds priority");
    game.dispatch({ type: "pass-priority", player: holder });
  }
  throw new Error("the stack never emptied");
}

function cast(game: Game, player: PlayerId, name: string, target?: ObjectId): ObjectId {
  const card = game.debugSpawn(name, player, "hand");
  game.dispatch({
    type: "cast-spell",
    player,
    card,
    targets: target === undefined ? [] : [{ kind: "object", object: target }],
  });
  return card;
}

describe("a removal spell that goes on to raise a decision of its own", () => {
  for (const [removal, zone] of [
    ["Path to Exile", "exile"],
    ["Assassin's Trophy", "graveyard"],
  ] as const) {
    it(`${removal}: the commander's owner is asked after the search, and nothing is left stuck`, () => {
      const game = table([A, B], B);
      const krenko = commander(game, "Krenko, Mob Boss", A);
      for (const land of ["Plains", "Swamp", "Forest"]) lands(game, land, B, 2);

      cast(game, B, removal, krenko);
      expect(resolveStack(game)).toEqual(["alice:Krenko, Mob Boss"]);
      expect(game.state.objects[krenko].zone).toBe("command");
      expect(game.state.deferredCommanderMove).toBeNull();
      expect(game.state.pendingCommanderMoves).toEqual([]);

      // Declining puts it where the removal sent it.
      const again = commander(game, "Kardur, Doomscourge", A);
      cast(game, B, removal, again);
      resolveStack(game, false);
      expect(game.state.objects[again].zone).toBe(zone);
    });
  }

  it("a later board wipe still asks — the Hour of Reckoning that killed Krenko unasked", () => {
    const game = table([A, B], B);
    // The bot's commander came down first, as in the game this was found in.
    const emmara = commander(game, "Emmara, Soul of the Accord", B);
    const first = commander(game, "Krenko, Mob Boss", A);
    lands(game, "Plains", B, 8);

    // Earlier in the game: Path to Exile on Krenko, who goes home and is recast.
    cast(game, B, "Path to Exile", first);
    expect(resolveStack(game)).toEqual(["alice:Krenko, Mob Boss"]);
    const krenko = commander(game, "Krenko, Mob Boss", A);

    // Hour of Reckoning on the opponent's turn, convoked by tapping Emmara
    // (which triggers her).
    const hour = game.debugSpawn("Hour of Reckoning", B, "hand");
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: hour,
      targets: [],
      convoke: [{ creature: emmara, pays: "W" }],
    });
    expect(resolveStack(game)).toEqual([
      "bob:Emmara, Soul of the Accord",
      "alice:Krenko, Mob Boss",
    ]);
    expect(game.state.objects[krenko].zone).toBe("command");
    expect(game.state.objects[emmara].zone).toBe("command");
  });
});

describe("a mass effect that reaches a second commander while the first is being asked", () => {
  it("overloaded Cyclonic Rift asks each opponent in turn", () => {
    const game = table([A, B, C, D], A);
    const theirs = [
      commander(game, "Kardur, Doomscourge", B),
      commander(game, "Isperia, Supreme Judge", C),
      commander(game, "Emmara, Soul of the Accord", D),
    ];
    const mine = commander(game, "Krenko, Mob Boss", A);
    lands(game, "Island", A, 7);

    const rift = game.debugSpawn("Cyclonic Rift", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: rift, targets: [], overload: true });
    expect(resolveStack(game, false)).toEqual([
      "bob:Kardur, Doomscourge",
      "carol:Isperia, Supreme Judge",
      "dave:Emmara, Soul of the Accord",
    ]);
    for (const id of theirs) expect(game.state.objects[id].zone).toBe("hand");
    expect(game.state.objects[mine].zone).toBe("battlefield");
  });

  it("a wrath at four players asks every owner, the caster included", () => {
    const game = table([A, B, C, D], A);
    const all = [
      commander(game, "Kardur, Doomscourge", B),
      commander(game, "Krenko, Mob Boss", A),
      commander(game, "Isperia, Supreme Judge", C),
      commander(game, "Emmara, Soul of the Accord", D),
    ];
    lands(game, "Plains", A, 4);
    cast(game, A, "Wrath of God");
    expect(resolveStack(game)).toHaveLength(4);
    for (const id of all) expect(game.state.objects[id].zone).toBe("command");
  });
});
