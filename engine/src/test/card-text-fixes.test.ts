import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { TargetRef } from "../target.js";
import { legalTargets } from "../targeting.js";

/**
 * Cards whose behaviour didn't match a clause of their Oracle text — found by
 * `npm run card:text`'s PARTIAL check (a clause that matched, minus content
 * words): Hypnotic Specter and Thieving Magpie triggered on combat damage to
 * any player where the cards say any damage to an opponent (and the Specter's
 * discard is at random), and Anafenza, the Foremost's counter could go on any
 * other creature you control where the card says a tapped one.
 */

const [A, B] = ["alice", "bob"].map(asPlayerId);
const registry = createDefaultRegistry();

function table(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Island") })),
  });
  game.advanceUntil(
    (s) => s.turn.step === "precombat-main" && s.turnOrder[s.turn.activePlayerIndex] === A && s.priority.holder === A,
  );
  return game;
}

function spawn(game: Game, name: string, owner: PlayerId, opts: { tapped?: boolean } = {}): ObjectId {
  return game.debugSpawn(name, owner, "battlefield", { summoningSick: false, ...opts });
}

/** `source` deals 1 damage to `to`, not in combat, and whatever that
 * triggers resolves. */
function ping(game: Game, source: ObjectId, to: TargetRef): void {
  game.debugApplyEffect(A, { kind: "damage", target: 0, amount: 1 }, [to], { source });
  (game as unknown as { prepareForPriority(player: PlayerId): void }).prepareForPriority(A);
  for (let i = 0; i < 20 && game.state.zones.shared.stack.length > 0; i += 1) {
    if (game.state.awaiting !== null) throw new Error(`unexpected ${game.state.awaiting.kind} decision`);
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
  }
}

const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });

describe("Hypnotic Specter", () => {
  it("makes an opponent it deals any damage to discard at random — nobody chooses", () => {
    const game = table();
    const specter = spawn(game, "Hypnotic Specter", A);
    const hand = game.handOf(B).length;

    ping(game, specter, player(B));

    expect(game.handOf(B).length).toBe(hand - 1);
    expect(game.state.awaiting).toBeNull();
    expect(game.state.eventLog.some((e) => e.type === "cards-discarded" && e.player === B)).toBe(true);
  });

  it("doesn't trigger on damage to its controller or to a creature", () => {
    const game = table();
    const specter = spawn(game, "Hypnotic Specter", A);
    const bears = spawn(game, "Grizzly Bears", B);
    const hands = [game.handOf(A).length, game.handOf(B).length];

    ping(game, specter, player(A));
    ping(game, specter, { kind: "object", object: bears });

    expect([game.handOf(A).length, game.handOf(B).length]).toEqual(hands);
  });
});

describe("Thieving Magpie", () => {
  it("draws when it deals any damage to an opponent, combat or not", () => {
    const game = table();
    const magpie = spawn(game, "Thieving Magpie", A);
    const hand = game.handOf(A).length;
    ping(game, magpie, player(B));
    expect(game.handOf(A).length).toBe(hand + 1);
  });
});

describe("Anafenza, the Foremost", () => {
  it("puts its counter only on another tapped creature you control", () => {
    const game = table();
    const anafenza = spawn(game, "Anafenza, the Foremost", A, { tapped: true });
    const tapped = spawn(game, "Grizzly Bears", A, { tapped: true });
    const untapped = spawn(game, "Hill Giant", A);
    const theirs = spawn(game, "Craw Wurm", B, { tapped: true });
    const spec = registry.get("Anafenza, the Foremost").triggered[0].targets[0];

    const options = legalTargets(game.state, registry, spec, A, {
      colors: [],
      types: ["creature"],
      object: anafenza,
    });
    expect(options).toEqual([{ kind: "object", object: tapped }]);
    expect(options).not.toContainEqual({ kind: "object", object: untapped });
    expect(options).not.toContainEqual({ kind: "object", object: theirs });
  });
});
