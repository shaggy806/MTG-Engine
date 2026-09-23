import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

/**
 * The bugs `docs/plans/commander-replacement.md` listed as still open after
 * the 903.9a choice stopped being skipped. Each lost something *around* the
 * choice rather than the choice itself: an O-Ring's link, a sacrifice event,
 * the step the question is asked in, and the history-log events of other
 * permanents moved by the same effect.
 */

const [A, B] = ["alice", "bob"].map(asPlayerId);

function table(active: PlayerId): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Mountain") })),
  });
  game.advanceUntil(
    (s) =>
      s.turn.step === "precombat-main" &&
      s.turnOrder[s.turn.activePlayerIndex] === active &&
      s.priority.holder === active,
  );
  return game;
}

function spawn(game: Game, name: string, owner: PlayerId): ObjectId {
  return game.debugSpawn(name, owner, "battlefield", { summoningSick: false });
}

function commander(game: Game, name: string, owner: PlayerId): ObjectId {
  const id = spawn(game, name, owner);
  game.state.objects[id].isCommander = true;
  return id;
}

function lands(game: Game, name: string, player: PlayerId, count: number): void {
  for (let i = 0; i < count; i += 1) spawn(game, name, player);
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

/** Passes priority until nothing is left to resolve, answering every
 * commander choice with `toCommandZone` and every sacrifice with `sacrifice`
 * (the first eligible ones by default). */
function settle(
  game: Game,
  answers: { toCommandZone?: boolean; sacrifice?: (eligible: readonly ObjectId[]) => ObjectId[] } = {},
): void {
  for (let i = 0; i < 300; i += 1) {
    const awaiting = game.state.awaiting;
    if (awaiting?.kind === "commander-replacement") {
      game.dispatch({
        type: "commander-replacement",
        player: awaiting.player,
        toCommandZone: answers.toCommandZone ?? true,
      });
      continue;
    }
    if (awaiting?.kind === "sacrifice") {
      const permanents =
        answers.sacrifice?.(awaiting.eligible) ?? awaiting.eligible.slice(0, awaiting.count);
      game.dispatch({ type: "sacrifice", player: awaiting.player, permanents });
      continue;
    }
    if (awaiting !== null) throw new Error(`unexpected ${awaiting.kind} decision`);
    if (game.state.zones.shared.stack.length === 0 && game.state.pendingTriggers.length === 0) {
      return;
    }
    const holder = game.state.priority.holder;
    if (holder === null) throw new Error("nobody holds priority");
    game.dispatch({ type: "pass-priority", player: holder });
  }
  throw new Error("never settled");
}

describe("commander-replacement bugs that were still open", () => {
  it("Banishing Light keeps its link to a commander whose owner declined the command zone", () => {
    const game = table(B);
    const krenko = commander(game, "Krenko, Mob Boss", A);
    lands(game, "Plains", B, 5);

    const light = cast(game, B, "Banishing Light");
    settle(game, { toCommandZone: false });
    expect(game.state.objects[krenko].zone).toBe("exile");
    expect(game.state.objects[krenko].exiledBy).toBe(light);

    cast(game, B, "Disenchant", light);
    settle(game);
    expect(game.state.objects[krenko].zone).toBe("battlefield");
  });

  for (const toCommandZone of [true, false]) {
    it(`a commander sacrificed to an edict is still "sacrificed" (${toCommandZone ? "to the command zone" : "to the graveyard"})`, () => {
      const game = table(B);
      // Spawned straight onto the battlefield, so its own "enters" sacrifice
      // never triggers.
      const korvold = spawn(game, "Korvold, Fae-Cursed King", A);
      const counters = (): number => game.state.objects[korvold].counters["+1/+1"] ?? 0;
      const before = counters();

      const krenko = commander(game, "Krenko, Mob Boss", A);
      lands(game, "Swamp", B, 2);
      const edict = game.debugSpawn("Diabolic Edict", B, "hand");
      game.dispatch({
        type: "cast-spell",
        player: B,
        card: edict,
        targets: [{ kind: "player", player: A }],
      });
      settle(game, { toCommandZone, sacrifice: () => [krenko] });

      expect(
        game.events.some((e) => e.type === "permanent-sacrificed" && e.object === krenko),
      ).toBe(true);
      expect(counters()).toBe(before + 1);
      expect(game.state.objects[krenko].zone).toBe(toCommandZone ? "command" : "graveyard");
    });
  }

  it("a commander dying after the cleanup discard is asked about in that cleanup step", () => {
    const game = table(A);
    const rograkh = commander(game, "Rograkh, Son of Rohgahh", A); // 0/1
    // Giant Growth's +3/+3 holds it up against a -1/-1 counter until cleanup.
    game.state.objects[rograkh].modifiers.push({
      power: 3,
      toughness: 3,
      keywords: [],
      untilEndOfTurn: true,
    });
    game.state.objects[rograkh].counters["-1/-1"] = 1;
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Mountain", A, "hand");
    const turn = game.state.turn.number;

    game.advanceUntil((s) => s.awaiting?.kind === "discard");
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "discard") throw new Error("no cleanup discard");
    game.dispatch({
      type: "discard",
      player: A,
      cards: game.state.zones.perPlayer[A].hand.slice(0, awaiting.count),
    });

    expect(game.state.awaiting?.kind).toBe("commander-replacement");
    expect(game.state.turn.number).toBe(turn);
    expect(game.state.turn.step).toBe("cleanup");
  });

  it("an overloaded Cyclonic Rift logs every permanent it bounces, not only the ones before a commander", () => {
    const game = table(A);
    const kardur = commander(game, "Kardur, Doomscourge", B);
    const bears = spawn(game, "Grizzly Bears", B);
    lands(game, "Island", A, 7);

    const rift = game.debugSpawn("Cyclonic Rift", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: rift, targets: [], overload: true });
    settle(game, { toCommandZone: false });

    for (const id of [kardur, bears]) expect(game.state.objects[id].zone).toBe("hand");
    expect(
      game.events.filter((e) => e.type === "permanent-returned-to-hand" && e.object === bears),
    ).toHaveLength(1);
  });
});
