import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

// Minn, Wily Illusionist:
//   Whenever you draw your second card each turn, create a 1/1 blue
//   Illusion creature token with "This token gets +1/+0 for each other
//   Illusion you control."
//   Whenever an Illusion you control dies, you may put a permanent card with
//   mana value less than or equal to that creature's power from your hand
//   onto the battlefield.

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const TOKEN = "Illusion Token (Minn)";

const mkGame = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
};

// A debug effect's triggers wait in `pendingTriggers` until the engine next
// hands out priority, so "settled" has to count them too.
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

/** How many Illusion tokens, a token stack counting once per token. */
const illusionCount = (game: Game): number =>
  illusions(game).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);

const illusions = (game: Game): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === TOKEN);

const powerOf = (game: Game, id: ObjectId): number | null =>
  game.viewFor(A).objects[id]?.power ?? null;

describe("Minn, Wily Illusionist", () => {
  it("makes an Illusion on the second card drawn each turn, and only then", () => {
    const game = mkGame();
    game.debugSpawn("Minn, Wily Illusionist", A, "battlefield");
    // The starting player skipped her first draw, so these are her first
    // and second cards this turn.
    game.debugApplyEffect(A, { kind: "draw", amount: 1 });
    game.advanceUntil(settled);
    expect(illusionCount(game)).toBe(0);
    game.debugApplyEffect(A, { kind: "draw", amount: 1 });
    game.advanceUntil(settled);
    expect(illusionCount(game)).toBe(1);

    game.debugApplyEffect(A, { kind: "draw", amount: 2 });
    game.advanceUntil(settled);
    expect(illusionCount(game)).toBe(1);
  });

  it("gives each Illusion +1/+0 for each other Illusion you control", () => {
    const game = mkGame();
    game.debugApplyEffect(A, { kind: "create-token", token: TOKEN, count: 1 });
    game.debugApplyEffect(A, { kind: "create-token", token: TOKEN, count: 2 });
    game.debugApplyEffect(B, { kind: "create-token", token: TOKEN, count: 1 });
    const mine = illusions(game).filter((id) => game.state.objects[id].controller === A);
    const theirs = illusions(game).filter((id) => game.state.objects[id].controller === B);
    // Three of Alice's (however the engine stacks them) and one of Bob's:
    // each of hers sees two others, his sees none — Bob's isn't "you
    // control" for Alice's, and vice versa.
    expect(mine.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(3);
    for (const id of mine) expect(powerOf(game, id)).toBe(3);
    for (const id of theirs) expect(powerOf(game, id)).toBe(1);
  });

  it("puts a permanent card with mana value up to the dead Illusion's power onto the battlefield", () => {
    const game = mkGame();
    game.debugSpawn("Minn, Wily Illusionist", A, "battlefield");
    game.debugApplyEffect(A, { kind: "create-token", token: TOKEN, count: 1 });
    const [illusion] = illusions(game);
    // Two +1/+1 counters: it dies as a 3/3.
    game.state.objects[illusion].counters = { "+1/+1": 2 };
    const bears = game.debugSpawn("Grizzly Bears", A, "hand"); // mana value 2
    const giant = game.debugSpawn("Hill Giant", A, "hand"); // mana value 4
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand"); // not a permanent

    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: illusion }]);
    game.advanceUntil((s) => s.awaiting !== null || settled(s));

    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-from-zone");
    if (awaiting?.kind !== "choose-from-zone") return;
    expect(awaiting.min).toBe(0);
    expect(awaiting.eligible).toContain(bears);
    expect(awaiting.eligible).not.toContain(giant);
    expect(awaiting.eligible).not.toContain(bolt);

    game.dispatch({ type: "choose-from-zone", player: A, chosen: [bears] });
    game.advanceUntil(settled);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[giant].zone).toBe("hand");
  });

  it("ignores a creature that isn't an Illusion", () => {
    const game = mkGame();
    game.debugSpawn("Minn, Wily Illusionist", A, "battlefield");
    const hill = game.debugSpawn("Hill Giant", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "hand");

    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: hill }]);
    game.advanceUntil((s) => s.awaiting !== null || settled(s));
    expect(game.state.awaiting).toBeNull();
  });
});
