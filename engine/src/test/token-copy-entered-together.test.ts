import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

// `create-token-copy` `of: "entered-together"` — "for each of them, create a
// token that's a copy of it" over the permanents a batched entry trigger
// fired on (Kambal, Profiteering Mayor). Each is copied as it entered; one
// that has left since, as it last existed (rule 608.2h).

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = () => {
  const controllers = { [A]: new ScriptedController(A), [B]: new ScriptedController(B) };
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40 },
    controllers,
    decks: [A, B].map((player) => ({ player, cards: Array(40).fill("Plains") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, c: controllers as Record<PlayerId, ScriptedController> };
};

const quiet = (game: Game) =>
  game.advanceUntil(
    (s) => s.zones.shared.stack.length === 0 && s.pendingTriggers.length === 0 && s.awaiting === null,
  );
const tokens = (game: Game, player: PlayerId, name: string) =>
  game.battlefield.filter(
    (id) => game.state.objects[id].controller === player && game.state.objects[id].cardName === name,
  );
const total = (game: Game, ids: readonly string[]) =>
  ids.reduce((n, id) => n + (game.state.objects[id as never].stackCount ?? 1), 0);

describe("Kambal, Profiteering Mayor", () => {
  it("copies each token an opponent's entry brought, tapped, under Kambal's controller — once a turn", () => {
    const { game } = mkGame();
    game.debugSpawn("Kambal, Profiteering Mayor", A, "battlefield");
    game.debugApplyEffect(B, { kind: "create-token", token: "Goblin Token", count: 1 });
    game.debugApplyEffect(B, { kind: "create-token", token: "Clue Token", count: 1 });
    // Two effects are two entries: the first triggers, the second can't
    // this turn.
    quiet(game);
    const goblins = tokens(game, A, "Goblin Token");
    expect(goblins).toHaveLength(1);
    expect(game.state.objects[goblins[0]].tapped).toBe(true);
    expect(tokens(game, A, "Clue Token")).toHaveLength(0);
    // Kambal's own tokens entering drain once.
    expect(game.state.players[B].life).toBe(39);
    expect(game.state.players[A].life).toBe(41);
  });

  it("copies every token of a single entry, a compacted stack as each of its tokens", () => {
    const { game } = mkGame();
    game.debugSpawn("Kambal, Profiteering Mayor", A, "battlefield");
    game.debugApplyEffect(B, { kind: "create-token", token: "Soldier Token", count: 20 });
    quiet(game);
    const soldiers = tokens(game, A, "Soldier Token");
    expect(total(game, soldiers)).toBe(20);
    expect(soldiers.every((id) => game.state.objects[id].tapped)).toBe(true);
    // Twenty tokens entering together are still one drain.
    expect(game.state.players[B].life).toBe(39);
  });

  it("copies a token that has left by the time the ability resolves", () => {
    const { game } = mkGame();
    game.debugSpawn("Kambal, Profiteering Mayor", A, "battlefield");
    game.debugApplyEffect(B, { kind: "create-token", token: "Goblin Token", count: 1 });
    const [goblin] = tokens(game, B, "Goblin Token");
    game.debugApplyEffect(A, { kind: "exile", target: 0 }, [{ kind: "object", object: goblin }]);
    expect(tokens(game, B, "Goblin Token")).toHaveLength(0);
    expect(tokens(game, A, "Goblin Token")).toHaveLength(0);
    quiet(game);
    expect(tokens(game, A, "Goblin Token")).toHaveLength(1);
  });

  it("triggers again on a later turn", () => {
    const { game } = mkGame();
    game.debugSpawn("Kambal, Profiteering Mayor", A, "battlefield");
    game.debugApplyEffect(B, { kind: "create-token", token: "Goblin Token", count: 1 });
    quiet(game);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    game.debugApplyEffect(B, { kind: "create-token", token: "Goblin Token", count: 2 });
    quiet(game);
    expect(total(game, tokens(game, A, "Goblin Token"))).toBe(3);
  });
});
