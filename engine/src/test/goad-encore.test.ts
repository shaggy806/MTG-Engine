/**
 * Goad (rule 701.38) and Encore (702.140), which share a mechanism: an attack
 * *requirement* aimed at a particular player.
 *
 * Goad is "attacks each combat if able, and attacks someone other than me if
 * able" — the second half only bites when another defender was actually
 * legal. Encore is the positive form: "attacks **that** opponent if able".
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const makeGame = (players: readonly PlayerId[] = [A, B]) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
    decks: players.map((player) => ({
      player,
      cards: Array<string>(40).fill("Swamp"),
    })),
  });

describe("goad", () => {
  it("marks every creature the target player controls", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const mine = game.debugSpawn("Grizzly Bears", A, "battlefield");

    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [{ kind: "player", player: B }]);

    expect(game.state.objects[theirs].goadedBy).toEqual([A]);
    expect(game.state.objects[mine].goadedBy).toBeUndefined();
  });

  it("forces a goaded creature to attack", () => {
    const game = makeGame();
    // Advance to B's turn so B is the one declaring attackers.
    game.advanceUntil((s) => s.priority.holder === B && s.turn.step === "precombat-main");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.state.objects[theirs].summoningSick = false;
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [{ kind: "player", player: B }]);

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    // Declaring nothing leaves out a creature that must attack (rule 508.1d).
    expect(() => game.dispatch({ type: "declare-attackers", player: B, attackers: [] })).toThrow(
      /must attack if able/,
    );
    game.dispatch({ type: "declare-attackers", player: B, attackers: [{ attacker: theirs, defender: A }] });

    expect(game.state.objects[theirs].attacking).toBe(A);
  });

  it("lapses when the goader's next turn begins", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [{ kind: "player", player: B }]);
    expect(game.state.objects[theirs].goadedBy).toEqual([A]);

    // Round the table back to A's next turn.
    const turn = game.state.turn.number;
    game.advanceUntil((s) => s.turn.number > turn + 1 || s.result.over);
    expect(game.state.objects[theirs].goadedBy).toBeUndefined();
  });

  it("must attack someone other than the goader when it can", () => {
    const game = makeGame([A, B, C]);
    game.advanceUntil((s) => s.priority.holder === B && s.turn.step === "precombat-main");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.state.objects[theirs].summoningSick = false;
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [{ kind: "player", player: B }]);

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    // C is a legal alternative, so attacking the goader is refused.
    expect(() =>
      game.dispatch({
        type: "declare-attackers",
        player: B,
        attackers: [{ attacker: theirs, defender: A }],
      }),
    ).toThrow(/goaded/);

    game.dispatch({
      type: "declare-attackers",
      player: B,
      attackers: [{ attacker: theirs, defender: C }],
    });
    expect(game.state.objects[theirs].attacking).toBe(C);
  });

  it("may attack the goader when there's nobody else", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === B && s.turn.step === "precombat-main");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.state.objects[theirs].summoningSick = false;
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [{ kind: "player", player: B }]);

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    // Only A to attack, so the "someone else" clause can't be satisfied.
    expect(() =>
      game.dispatch({
        type: "declare-attackers",
        player: B,
        attackers: [{ attacker: theirs, defender: A }],
      }),
    ).not.toThrow();
  });
});

describe("encore", () => {
  it("makes one hasty copy per opponent, each aimed at that opponent", () => {
    const game = makeGame([A, B, C]);
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const card = game.debugSpawn("Rakshasa Debaser", A, "exile");

    game.debugApplyEffect(A, { kind: "encore" }, [], { source: card });

    const tokens = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].isToken && game.state.objects[id].controller === A,
    );
    expect(tokens.length).toBe(2);
    const aimed = tokens.map((id) => game.state.objects[id].mustAttackPlayer).sort();
    expect(aimed).toEqual([B, C].sort());
    for (const id of tokens) {
      expect(game.characteristics(id).keywords.has("haste")).toBe(true);
      expect(game.state.objects[id].sacrificeAtEndStep).toBe(true);
    }
  });

  it("sacrifices the copies at the next end step", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const card = game.debugSpawn("Rakshasa Debaser", A, "exile");
    game.debugApplyEffect(A, { kind: "encore" }, [], { source: card });

    const token = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].isToken,
    );
    expect(token).toBeDefined();
    if (token === undefined) return;

    const turn = game.state.turn.number;
    game.advanceUntil((s) => s.turn.number > turn || s.result.over);
    expect(game.state.zones.shared.battlefield).not.toContain(token);
  });
});

describe("goad and legalActions", () => {
  it("never offers a goaded creature its goader while anyone else is legal", () => {
    const game = makeGame([A, B, C]);
    game.advanceUntil((s) => s.priority.holder === B && s.turn.step === "precombat-main");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.state.objects[theirs].summoningSick = false;
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [{ kind: "player", player: B }]);

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    const legal = game.legalActions(B).find((a) => a.kind === "declare-attackers");
    expect(legal).toBeDefined();
    if (legal === undefined || legal.kind !== "declare-attackers") return;

    // The union still lists A — someone else's creature could attack them.
    expect(legal.defenders).toContain(A);
    // But *this* attacker may only be sent at C.
    expect(legal.defendersFor[theirs]).toEqual([C]);
  });

  it("the union's first defender can be illegal for a given attacker", () => {
    // Why `defendersFor` exists, stated as a fact rather than a comment.
    // A UI that fills in "attack with everything" by handing every eligible
    // creature `defenders[0]` builds a declaration the engine refuses — which
    // is precisely the bug the client's attack-with-all button had.
    const game = makeGame([A, B, C]);
    game.advanceUntil((s) => s.priority.holder === B && s.turn.step === "precombat-main");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.state.objects[theirs].summoningSick = false;
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [{ kind: "player", player: B }]);

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    const legal = game.legalActions(B).find((a) => a.kind === "declare-attackers");
    if (legal === undefined || legal.kind !== "declare-attackers") return;

    const union = legal.defenders[0];
    expect(legal.defendersFor[theirs]).not.toContain(union);
    expect(() =>
      game.dispatch({
        type: "declare-attackers",
        player: B,
        attackers: [{ attacker: theirs, defender: union }],
      }),
    ).toThrow();
  });

  it("offers the goader once there is nobody else", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === B && s.turn.step === "precombat-main");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.state.objects[theirs].summoningSick = false;
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [{ kind: "player", player: B }]);

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    const legal = game.legalActions(B).find((a) => a.kind === "declare-attackers");
    if (legal === undefined || legal.kind !== "declare-attackers") return;
    // Two-player: the "someone else" clause can't be satisfied, so A is legal.
    expect(legal.defendersFor[theirs]).toContain(A);
  });

  it("agrees with what dispatch will accept", () => {
    // The fuzzer's repro: `legalActions` enumerated defenders with
    // `whyCannotAttack` alone, which doesn't know about goad, so a caller
    // picking uniformly from `defenders` built declarations dispatch refused.
    const game = makeGame([A, B, C]);
    game.advanceUntil((s) => s.priority.holder === B && s.turn.step === "precombat-main");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.state.objects[theirs].summoningSick = false;
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [{ kind: "player", player: B }]);

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    const legal = game.legalActions(B).find((a) => a.kind === "declare-attackers");
    if (legal === undefined || legal.kind !== "declare-attackers") return;

    // One declaration is enough to prove the agreement: the only offered
    // defender is the one dispatch accepts, and the old code would have
    // offered A as well.
    expect(legal.defendersFor[theirs]).toEqual([C]);
    expect(() =>
      game.dispatch({
        type: "declare-attackers",
        player: B,
        attackers: [{ attacker: theirs, defender: legal.defendersFor[theirs][0] }],
      }),
    ).not.toThrow();
  });
});
