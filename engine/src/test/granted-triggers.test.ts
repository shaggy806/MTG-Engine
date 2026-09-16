/**
 * Phase C of `docs/plans/engine-gaps.md` — granted triggered abilities and the
 * "becomes the target of" trigger.
 *
 * The load-bearing detail is that `PendingTrigger.abilityIndex` indexes into
 * the ability list, so everything that reads a triggered ability by index
 * (`detectTriggers`, `stackAbilityOf`, the intervening-if recheck,
 * `placeTrigger`) has to agree on the same list. Granted abilities are
 * appended *after* the printed ones so a printed index never shifts.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const makeGame = (players = [A, B]) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: players.map((player) => ({
      player,
      cards: Array<string>(40).fill("Mountain"),
      ...(player === A ? { commander: "Atarka, World Render" } : {}),
    })),
  });

const readyLands = (game: Game, n: number, player = A) => {
  for (let i = 0; i < n; i += 1) {
    const id = game.debugSpawn("Mountain", player, "battlefield");
    game.state.objects[id].tapped = false;
  }
};

describe("grant-triggered (one-shot, until end of turn)", () => {
  it("makes a creature draw off its own combat damage", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.state.objects[bear].summoningSick = false;

    game.debugApplyEffect(A, {
      kind: "grant-triggered",
      target: 0,
      duration: "end-of-turn",
      ability: {
        trigger: { on: "deals-combat-damage-to-player", who: "self" },
        targets: [],
        effect: { kind: "draw", amount: { triggerValue: true } },
        resolve: null,
        text: "draw that many",
      },
    }, [{ kind: "object", object: bear }]);

    const handBefore = game.state.zones.perPlayer[A].hand.length;
    // Attack with the 2/2 into an empty board.
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: bear, defender: B }],
    });
    game.advanceUntil((s) => s.turn.step === "end" || s.result.over);

    expect(game.state.players[B].life).toBe(18);
    // Two power dealt, so two cards.
    expect(game.state.zones.perPlayer[A].hand.length).toBe(handBefore + 2);
  });

  it("does not fire for a creature that was never granted it", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.state.objects[bear].summoningSick = false;

    const handBefore = game.state.zones.perPlayer[A].hand.length;
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: bear, defender: B }],
    });
    game.advanceUntil((s) => s.turn.step === "end" || s.result.over);

    expect(game.state.players[B].life).toBe(18);
    // Only the normal draw for the turn, if any — no extra cards.
    expect(game.state.zones.perPlayer[A].hand.length).toBe(handBefore);
  });

  it("expires at end of turn", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugApplyEffect(A, {
      kind: "grant-triggered",
      target: 0,
      duration: "end-of-turn",
      ability: {
        trigger: { on: "deals-combat-damage-to-player", who: "self" },
        targets: [],
        effect: { kind: "draw", amount: 1 },
        resolve: null,
        text: "draw",
      },
    }, [{ kind: "object", object: bear }]);
    expect(game.state.objects[bear].modifiers.length).toBe(1);

    const turn = game.state.turn.number;
    game.advanceUntil((s) => s.turn.number > turn + 1 || s.result.over);
    expect(game.state.objects[bear].modifiers.length).toBe(0);
  });
});

describe("grantsTriggered (a static grant)", () => {
  it("only applies while its condition holds", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const familiar = game.debugSpawn("Tyrant's Familiar", A, "battlefield");
    game.state.objects[familiar].summoningSick = false;
    const victim = game.debugSpawn("Grizzly Bears", B, "battlefield");

    // No commander on the battlefield: the Lieutenant clause is off, so it's
    // a plain 5/5 with no attack trigger.
    expect(game.characteristics(familiar).power).toBe(5);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: familiar, defender: B }],
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 || s.awaiting !== null);
    expect(game.state.objects[victim].zone).toBe("battlefield");
  });

  it("fires once the commander is out, hitting a defending player's creature", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const familiar = game.debugSpawn("Tyrant's Familiar", A, "battlefield");
    game.state.objects[familiar].summoningSick = false;
    const commander = game.debugSpawn("Atarka, World Render", A, "battlefield");
    game.state.objects[commander].isCommander = true;
    const victim = game.debugSpawn("Grizzly Bears", B, "battlefield");

    // Lieutenant is on: +2/+2 and the granted attack trigger.
    expect(game.characteristics(familiar).power).toBe(7);

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: familiar, defender: B }],
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 || s.result.over);

    // 7 damage kills the 2/2.
    expect(game.state.objects[victim].zone).toBe("graveyard");
  });
});

describe("becomes-target", () => {
  /** Pass priority around until `caster` holds it, then bolt `target`.
   * Lightning Bolt is an instant, so an opponent can only cast it in a
   * priority window of their own. */
  const boltAt = (game: Game, caster: typeof A, target: ReturnType<Game["debugSpawn"]>) => {
    for (let i = 0; i < 12 && game.state.priority.holder !== caster; i += 1) {
      const holder = game.state.priority.holder;
      if (holder === null) break;
      game.dispatch({ type: "pass-priority", player: holder });
    }
    const card = game.debugSpawn("Lightning Bolt", caster, "hand");
    game.dispatch({
      type: "cast-spell",
      player: caster,
      card,
      targets: [{ kind: "object", object: target }],
    });
  };

  it("fires when an opponent targets one of your Dragons", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    game.debugSpawn("Thunderbreak Regent", A, "battlefield");
    const dragon = game.debugSpawn("Thunderbreak Regent", A, "battlefield");
    readyLands(game, 4, B);

    const lifeBefore = game.state.players[B].life;
    boltAt(game, B, dragon);
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 || s.result.over);

    // Two Regents, each seeing the Dragon targeted: 3 damage twice.
    expect(game.state.players[B].life).toBe(lifeBefore - 6);
  });

  it("does not fire on your own spell", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const dragon = game.debugSpawn("Thunderbreak Regent", A, "battlefield");
    readyLands(game, 4);

    const lifeBefore = game.state.players[A].life;
    boltAt(game, A, dragon);
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 || s.result.over);
    expect(game.state.players[A].life).toBe(lifeBefore);
  });

  it("fires even though the spell is about to kill it", () => {
    // The trigger is on *targeting*, which happens as the spell goes on the
    // stack — before it resolves, and regardless of what it then does.
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const dragon = game.debugSpawn("Thunderbreak Regent", A, "battlefield");
    game.state.objects[dragon].damageMarked = 3; // one more point is lethal
    readyLands(game, 4, B);

    const lifeBefore = game.state.players[B].life;
    boltAt(game, B, dragon);
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 || s.result.over);

    expect(game.state.objects[dragon].zone).toBe("graveyard");
    expect(game.state.players[B].life).toBe(lifeBefore - 3);
  });

  it("aims at the targeting player, not just any opponent", () => {
    const game = makeGame([A, B, C]);
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const dragon = game.debugSpawn("Thunderbreak Regent", A, "battlefield");
    readyLands(game, 4, C);

    const bLife = game.state.players[B].life;
    const cLife = game.state.players[C].life;
    boltAt(game, C, dragon);
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 || s.result.over);

    expect(game.state.players[C].life).toBe(cLife - 3);
    expect(game.state.players[B].life).toBe(bLife);
  });
});
