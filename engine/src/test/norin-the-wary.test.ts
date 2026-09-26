/**
 * Norin the Wary — a `flicker` of the ability's own source with a delayed
 * return linked to the exile (rules 400.7 and 610.3).
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aCards: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aCards, ...Array(40).fill("Mountain")] },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const toEndStep = (s: GameState): boolean => s.turn.step === "end" && quiet(s);

const handCard = (game: Game, name: string): ObjectId => {
  const id = game.handOf(A).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};

/** Cast a Lightning Bolt at Bob — an instant, so a second can follow while
 * the first one's Norin trigger is still on the stack. */
const castBolt = (game: Game): void => {
  game.debugSpawn("Mountain", A, "battlefield");
  game.dispatch({
    type: "cast-spell",
    player: A,
    card: handCard(game, "Lightning Bolt"),
    targets: [{ kind: "player", player: B }],
  });
};

describe("Norin the Wary — exiled when a spell is cast or a creature attacks", () => {
  it("is exiled by a spell and returns at the next end step as a new object", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    const norin = game.debugSpawn("Norin the Wary", A, "battlefield", { summoningSick: false });
    const before = game.state.objects[norin].timestamp;

    castBolt(game);
    game.advanceUntil(quiet);
    expect(game.state.objects[norin].zone).toBe("exile");
    expect(game.state.delayedTriggers).toHaveLength(1);

    game.advanceUntil(toEndStep);
    expect(game.state.objects[norin].zone).toBe("battlefield");
    expect(game.state.objects[norin].controller).toBe(A);
    expect(game.state.objects[norin].timestamp).not.toBe(before);
    expect(game.state.delayedTriggers).toHaveLength(0);
  });

  it("several triggers in one turn: exiled once, returned once", () => {
    const { game } = mkGame(["Lightning Bolt", "Lightning Bolt", "Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    const norin = game.debugSpawn("Norin the Wary", A, "battlefield");

    // Two triggers on the stack at once: the first to resolve exiles Norin,
    // the second finds it gone and does nothing.
    castBolt(game);
    castBolt(game);
    expect(
      game.state.zones.shared.stack.filter(
        (id) => game.state.objects[id].sourceObjectId === norin,
      ),
    ).toHaveLength(2);
    game.advanceUntil(quiet);
    expect(game.state.objects[norin].zone).toBe("exile");
    // And one more spell while it is away sees no Norin at all.
    castBolt(game);
    game.advanceUntil(quiet);
    expect(game.state.delayedTriggers).toHaveLength(1);

    const entries = (): number =>
      game.state.eventLog.filter(
        (e) => e.type === "permanent-entered-battlefield" && e.object === norin,
      ).length;
    const entered = entries();
    game.advanceUntil(toEndStep);
    expect(game.state.objects[norin].zone).toBe("battlefield");
    expect(entries()).toBe(entered + 1);
    expect(game.state.delayedTriggers).toHaveLength(0);
  });

  it("is exiled when a creature attacks, leaving combat", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const norin = game.debugSpawn("Norin the Wary", A, "battlefield", { summoningSick: false });
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });

    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: norin, defender: B },
        { attacker: bear, defender: B },
      ],
    });
    game.advanceUntil((s) => s.turn.step === "combat-damage" || s.turn.step === "end");
    expect(game.state.objects[norin].zone).toBe("exile");
    expect(game.state.delayedTriggers).toHaveLength(1);

    game.advanceUntil(toEndStep);
    expect(game.state.objects[norin].zone).toBe("battlefield");
    expect(game.state.objects[norin].attacking).toBeNull();
    // Only the Bears connected.
    expect(game.state.players[B].life).toBe(18);
  });

  it("a Norin that left exile and was exiled again isn't returned (rule 610.3)", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    const norin = game.debugSpawn("Norin the Wary", A, "battlefield");
    castBolt(game);
    game.advanceUntil(quiet);
    expect(game.state.objects[norin].zone).toBe("exile");

    // Out of exile and straight back in: a new object the return doesn't know.
    const ref = [{ kind: "object" as const, object: norin }];
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, ref);
    game.debugApplyEffect(A, { kind: "exile", target: 0 }, ref);
    expect(game.state.objects[norin].zone).toBe("exile");

    game.advanceUntil(toEndStep);
    expect(game.state.objects[norin].zone).toBe("exile");
    expect(game.state.delayedTriggers).toHaveLength(0);
  });

  it("a trigger from a Norin that has since blinked doesn't exile the new Norin (rule 400.7)", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    const norin = game.debugSpawn("Norin the Wary", A, "battlefield");
    castBolt(game);
    // The trigger is on the stack; Norin blinks before it resolves.
    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [{ kind: "object", object: norin }]);
    game.advanceUntil(quiet);

    expect(game.state.objects[norin].zone).toBe("battlefield");
    expect(game.state.delayedTriggers).toHaveLength(0);
  });

  it("a token copy is exiled for good", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    const token = game.debugSpawn("Norin the Wary", A, "battlefield");
    game.state.objects[token].isToken = true;
    castBolt(game);
    game.advanceUntil(quiet);
    expect(game.state.objects[token]).toBeUndefined();
    expect(game.state.delayedTriggers).toHaveLength(0);
  });

  it("as a commander, declining the command zone still returns it at end step", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    const norin = game.debugSpawn("Norin the Wary", A, "battlefield");
    game.state.objects[norin].isCommander = true;
    castBolt(game);
    game.advanceUntil((s) => s.awaiting?.kind === "commander-replacement");
    game.dispatch({ type: "commander-replacement", player: A, toCommandZone: false });
    game.advanceUntil(quiet);
    expect(game.state.objects[norin].zone).toBe("exile");
    expect(game.state.delayedTriggers).toHaveLength(1);

    game.advanceUntil(toEndStep);
    expect(game.state.objects[norin].zone).toBe("battlefield");
  });
});

describe("Norin the Wary — owner, command zone, and \"next\" end step", () => {
  it("stolen Norin returns under owner's control", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    const norin = game.debugSpawn("Norin the Wary", B, "battlefield");
    game.debugApplyEffect(A, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [{ kind: "object", object: norin }]);
    game.advanceUntil(quiet);
    expect(game.state.objects[norin].controller).toBe(A);
    castBolt(game);
    game.advanceUntil(quiet);
    expect(game.state.objects[norin].zone).toBe("exile");
    expect(game.state.delayedTriggers[0].controller).toBe(A);
    game.advanceUntil(toEndStep);
    expect(game.state.objects[norin].zone).toBe("battlefield");
    expect(game.state.objects[norin].controller).toBe(B);
    // The delayed return is plain data (GameState is a structuredClone-able tree).
    expect(structuredClone(game.state.delayedTriggers)).toEqual(game.state.delayedTriggers);
  });
  it("commander to command zone: no return", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    const norin = game.debugSpawn("Norin the Wary", A, "battlefield");
    game.state.objects[norin].isCommander = true;
    castBolt(game);
    game.advanceUntil((s) => s.awaiting?.kind === "commander-replacement");
    expect(game.state.delayedTriggers).toHaveLength(1);
    game.dispatch({ type: "commander-replacement", player: A, toCommandZone: true });
    game.advanceUntil(quiet);
    expect(game.state.objects[norin].zone).toBe("command");
    game.advanceUntil(toEndStep);
    expect(game.state.objects[norin].zone).toBe("command");
    expect(game.state.delayedTriggers).toHaveLength(0);
  });
  it("exiled again during end step returns next turn's end step", () => {
    const { game } = mkGame(["Lightning Bolt", "Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    const norin = game.debugSpawn("Norin the Wary", A, "battlefield");
    castBolt(game);
    game.advanceUntil(quiet);
    game.advanceUntil(toEndStep);
    expect(game.state.objects[norin].zone).toBe("battlefield");
    castBolt(game);
    game.advanceUntil(quiet);
    expect(game.state.objects[norin].zone).toBe("exile");
    expect(game.state.delayedTriggers).toHaveLength(1);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(game.state.objects[norin].zone).toBe("exile");
    game.advanceUntil((s) => s.turn.number === 2 && toEndStep(s));
    expect(game.state.objects[norin].zone).toBe("battlefield");
  });
});
