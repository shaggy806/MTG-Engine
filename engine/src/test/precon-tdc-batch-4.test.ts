/**
 * TDC precons batch 4 — more of Jeskai Striker's missing cards, each needing
 * one engine piece: Sublime Epiphany (counter target activated or triggered
 * ability), and the rest of the batch below.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const settle = (s: GameState): boolean => s.awaiting !== null || quiet(s);

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(60).fill("Island") },
      { player: B, cards: Array<string>(60).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const [land, n] of [["Mountain", 8], ["Island", 8], ["Plains", 6]] as const) {
    for (let i = 0; i < n; i += 1) {
      const id = game.debugSpawn(land, A, "battlefield");
      game.state.objects[id].tapped = false;
    }
  }
  return game;
};

const cast = (game: Game, name: string, targets: TargetRef[] = [], extra: Record<string, unknown> = {}) => {
  const card = game.debugSpawn(name, A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card, targets, ...extra });
  return card;
};
const handSize = (game: Game, p: PlayerId = A): number => game.state.zones.perPlayer[p].hand.length;

describe("Sublime Epiphany", () => {
  it("counters a triggered ability, and draws with another mode", () => {
    const game = setUp();
    game.debugSpawn("Elvish Visionary", A, "battlefield", { announceEntry: true });
    // The enters trigger goes on the stack when A next gets priority.
    game.advanceUntil((s) => s.zones.shared.stack.length === 1 && s.priority.holder === A);
    const trigger = game.state.zones.shared.stack[0];
    expect(game.state.objects[trigger].kind).toBe("ability");
    const before = handSize(game);
    cast(game, "Sublime Epiphany", [obj(trigger), player(A)], { modes: [1, 4] });
    game.advanceUntil(quiet);
    // Only Epiphany's card: the Visionary's draw was countered.
    expect(handSize(game)).toBe(before + 1);
    expect(game.state.objects[trigger]).toBeUndefined();
  });

  it("can't target a spell with the ability mode", () => {
    const game = setUp();
    const shock = cast(game, "Shock", [player(B)]);
    const card = game.debugSpawn("Sublime Epiphany", A, "hand");
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card, targets: [obj(shock)], modes: [1] }),
    ).toThrow();
    // …while the spell mode can.
    game.dispatch({ type: "cast-spell", player: A, card, targets: [obj(shock)], modes: [0] });
    game.advanceUntil(settle);
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(20);
  });
});

describe("Expressive Iteration", () => {
  it("puts one into hand, one on the bottom, and exiles one you may play this turn", () => {
    const game = setUp();
    const library = game.state.zones.perPlayer[A].library;
    const [plains, mountain, swamp] = ["Plains", "Mountain", "Swamp"].map((name) =>
      game.debugSpawn(name, A, "library"),
    );
    const rest = library.filter((id) => ![plains, mountain, swamp].includes(id));
    library.splice(0, library.length, plains, mountain, swamp, ...rest);

    cast(game, "Expressive Iteration");
    game.advanceUntil(settle);
    let awaiting = game.state.awaiting;
    expect(awaiting?.kind === "choose-from-zone" && awaiting.destination).toBe("hand");
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [mountain] });
    awaiting = game.state.awaiting;
    expect(awaiting?.kind === "choose-from-zone" && awaiting.destination).toBe("library-bottom");
    // The one already in hand isn't offered again.
    expect(awaiting?.kind === "choose-from-zone" && awaiting.eligible).toEqual([plains, swamp]);
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [swamp] });
    game.advanceUntil(quiet);

    expect(game.state.objects[mountain].zone).toBe("hand");
    const after = game.state.zones.perPlayer[A].library;
    expect(after[after.length - 1]).toBe(swamp);
    expect(game.state.objects[plains].zone).toBe("exile");
    // A land exiled this way can be played, this turn only.
    const plays = game.legalActions(A).filter((a) => a.kind === "play-land" && a.card === plains);
    expect(plays).toHaveLength(1);
  });
});

describe("Compulsive Research", () => {
  // The opening hand is all Islands, so there's always a land to offer.
  const research = () => ({ game: setUp() });

  it("discards a single land card instead of two", () => {
    const { game } = research();
    cast(game, "Compulsive Research", [player(A)]);
    game.advanceUntil(settle);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("discard");
    if (awaiting?.kind !== "discard") return;
    const before = handSize(game);
    const land = awaiting.orOneOf?.[0];
    expect(land).toBeDefined();
    game.dispatch({ type: "discard", player: A, cards: [land as ObjectId] });
    game.advanceUntil(quiet);
    expect(handSize(game)).toBe(before - 1);
  });

  it("refuses a single nonland card", () => {
    const { game } = research();
    const spell = game.debugSpawn("Shock", A, "hand");
    cast(game, "Compulsive Research", [player(A)]);
    game.advanceUntil(settle);
    expect(() => game.dispatch({ type: "discard", player: A, cards: [spell] })).toThrow();
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "discard") return;
    const two = game.state.zones.perPlayer[A].hand.slice(0, 2);
    game.dispatch({ type: "discard", player: A, cards: two });
    game.advanceUntil(quiet);
    expect(game.state.awaiting).toBeNull();
  });
});

describe("Mangara, the Diplomat", () => {
  /** B's turn, B's creatures ready to attack, Mangara on A's side. */
  const toBobsAttack = (attackerCount: number) => {
    const game = setUp();
    game.debugSpawn("Mangara, the Diplomat", A, "battlefield");
    const attackers = Array.from({ length: attackerCount }, () => {
      const id = game.debugSpawn("Grizzly Bears", B, "battlefield");
      game.state.objects[id].summoningSick = false;
      return id;
    });
    game.advanceUntil((s) => (s.awaiting?.kind === "attackers" && s.awaiting.player === B) || s.result.over);
    return { game, attackers };
  };
  const attack = (game: Game, attackers: readonly ObjectId[]) =>
    game.dispatch({
      type: "declare-attackers",
      player: B,
      attackers: attackers.map((attacker) => ({ attacker, defender: A })),
    });
  const mangaraOnStack = (s: GameState): boolean =>
    s.zones.shared.stack.some((id) => s.objects[id].kind === "ability") && s.priority.holder === A;

  it("draws when two or more creatures attack you", () => {
    const { game, attackers } = toBobsAttack(2);
    const before = handSize(game);
    attack(game, attackers);
    game.advanceUntil((s) => quiet(s) && s.turn.step !== "declare-attackers");
    expect(handSize(game)).toBe(before + 1);
  });

  it("doesn't for one", () => {
    const { game, attackers } = toBobsAttack(1);
    const before = handSize(game);
    attack(game, attackers);
    game.advanceUntil((s) => quiet(s) && s.turn.step !== "declare-attackers");
    expect(handSize(game)).toBe(before);
  });

  it("still counts an attacker that left the battlefield, not one removed from combat", () => {
    const killed = toBobsAttack(2);
    let before = handSize(killed.game);
    attack(killed.game, killed.attackers);
    killed.game.advanceUntil(mangaraOnStack);
    killed.game.dispatch({
      type: "cast-spell",
      player: A,
      card: killed.game.debugSpawn("Shock", A, "hand"),
      targets: [obj(killed.attackers[0])],
    });
    killed.game.advanceUntil((s) => quiet(s) && !s.zones.shared.stack.length);
    expect(killed.game.state.objects[killed.attackers[0]].zone).toBe("graveyard");
    expect(handSize(killed.game)).toBe(before + 1);

    const removed = toBobsAttack(2);
    before = handSize(removed.game);
    attack(removed.game, removed.attackers);
    removed.game.advanceUntil(mangaraOnStack);
    // Removed from combat, still on the battlefield: no longer attacking you.
    removed.game.state.objects[removed.attackers[0]].attacking = null;
    removed.game.advanceUntil((s) => quiet(s) && s.turn.step !== "declare-attackers");
    expect(handSize(removed.game)).toBe(before);
  });

  it("draws on an opponent's second spell each turn", () => {
    const game = setUp();
    game.debugSpawn("Mangara, the Diplomat", B, "battlefield");
    const before = handSize(game, B);
    cast(game, "Shock", [player(B)]);
    game.advanceUntil(quiet);
    expect(handSize(game, B)).toBe(before);
    cast(game, "Shock", [player(B)]);
    game.advanceUntil(quiet);
    expect(handSize(game, B)).toBe(before + 1);
  });
});
