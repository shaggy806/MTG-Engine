/**
 * Delayed triggered abilities (rule 603.7) — "at the beginning of the next end
 * step, do this". They belong to no permanent, so `detectTriggers`' scan over
 * the battlefield can't see them; `enterStep` fires them directly.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aCards: readonly string[], bCards: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aCards, ...Array(40).fill("Swamp")] },
      { player: B, cards: [...bCards, ...Array(40).fill("Island")] },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const handCard = (game: Game, player: typeof A, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in ${player}'s hand`);
  return id;
};

describe("Whip of Erebos — reanimate now, exile at the next end step", () => {
  it("brings the creature back hasty and exiles it as the turn ends", () => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    const whip = game.debugSpawn("Whip of Erebos", A, "battlefield");
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Swamp", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "graveyard");

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: whip,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[bear].zone).toBe("battlefield");
    expect(game.state.delayedTriggers).toHaveLength(1);

    // Play on to this turn's end step — the delayed ability fires there.
    game.advanceUntil((s) => s.turn.step === "end" && quiet(s));
    expect(game.state.objects[bear].zone).toBe("exile");
    expect(game.state.delayedTriggers).toHaveLength(0);
  });
});

describe("Arcane Denial — compensation on the next turn's upkeep", () => {
  it("draws for both players, and the countered spell's controller controls their own", () => {
    const { game, b } = mkGame(["Arcane Denial", "Island", "Island"], ["Grizzly Bears"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Island", A, "battlefield");
    // Bob casts something for Alice to counter.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", B, "battlefield");
    const bears = handCard(game, B, "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: B, card: bears, targets: [] });
    // Bob keeps priority after casting; Alice only gets it once he passes.
    game.advanceUntil(
      (s) => s.priority.holder === A && s.zones.shared.stack.includes(bears),
    );

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, A, "Arcane Denial"),
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0);

    expect(game.state.objects[bears].zone).toBe("graveyard");
    // Two delayed abilities, one per player.
    expect(game.state.delayedTriggers.map((t) => t.controller).sort()).toEqual([A, B].sort());

    b.chooseModesFn = () => [0]; // take the "may draw two"
    const aHand = game.handOf(A).length;
    const bHand = game.handOf(B).length;
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");

    expect(game.state.delayedTriggers).toHaveLength(0);
    // Alice drew her 1 plus turn 3's draw step; Bob drew 2 (he is not the
    // active player on turn 3, so he has no draw step of his own in between).
    expect(game.handOf(B).length).toBe(bHand + 2);
    expect(game.handOf(A).length).toBeGreaterThan(aHand);
  });
});

describe("Kiki-Jiki — a token copy sacrificed at the next end step", () => {
  it("makes a hasty copy that dies to the delayed sacrifice", () => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    const kiki = game.debugSpawn("Kiki-Jiki, Mirror Breaker", A, "battlefield");
    game.state.objects[kiki].summoningSick = false;
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: kiki,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(quiet);

    const copies = game.battlefield.filter(
      (id) => id !== bear && game.state.objects[id].cardName === "Grizzly Bears",
    );
    expect(copies).toHaveLength(1);

    game.advanceUntil((s) => s.turn.number === 2);
    // Sacrificed, not exiled — it is in a graveyard, so dies-triggers saw it.
    expect(game.battlefield).not.toContain(copies[0]);
    expect(game.state.objects[bear].zone).toBe("battlefield");
  });
});

describe("timing", () => {
  it("an ability created during the end step waits for the next turn's", () => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    const whip = game.debugSpawn("Whip of Erebos", A, "battlefield");
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Swamp", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "graveyard");

    // `sorcerySpeed` keeps the Whip to a main phase, so drive the delayed
    // ability directly to put one in play during the end step itself.
    game.advanceUntil((s) => s.turn.step === "end" && quiet(s));
    game.state.delayedTriggers.push({
      id: "test-delayed",
      controller: A,
      at: "next-end-step",
      createdOnTurn: game.state.turn.number,
      createdDuringEndStep: true,
      source: whip,
      sourceName: "Whip of Erebos",
      targets: [{ kind: "object", object: bear }],
      effect: { kind: "exile", target: 0 },
      text: "test",
    });

    // This turn's end step is already in progress — it must not fire here.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(game.state.delayedTriggers).toHaveLength(1);

    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "end" && quiet(s));
    expect(game.state.delayedTriggers).toHaveLength(0);
  });
});
