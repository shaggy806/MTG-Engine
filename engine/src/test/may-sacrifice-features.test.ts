/**
 * "You may sacrifice [a permanent]. When you do, [effect]": an
 * `each-player-may` whose sacrifice option, once taken, triggers a reflexive
 * ability (rule 603.12) that goes on the stack and chooses its targets then.
 * The option's `exceptSource` is "sacrifice **another** creature" (Ziatora,
 * the Incinerator). Felothar, Dawn of the Abzan's reflexive ability counts
 * the creatures as it resolves.
 */
import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Wastes") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
};

type Awaiting = NonNullable<GameState["awaiting"]>;

const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const onBattlefield = (game: Game, id: ObjectId): boolean => game.state.objects[id]?.zone === "battlefield";
const treasures = (game: Game): number =>
  game.battlefield
    .filter((id) => game.state.objects[id].cardName === "Treasure Token" && game.state.objects[id].controller === A)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const plusOnes = (game: Game, id: ObjectId): number => game.state.objects[id].counters["+1/+1"] ?? 0;

/** Answers: the "may" with `sacrifice` (or decline with null), the
 * sacrifice with it, and a reflexive ability's target with `target`. Records
 * what each decision offered. */
const answerer = (game: Game, sacrifice: ObjectId | null, target: PlayerId = B) => {
  const seen: { sacrificeChoices?: readonly ObjectId[]; asked: number } = { asked: 0 };
  const answer = (awaiting: Awaiting): void => {
    if (awaiting.kind === "choose-modes") {
      seen.asked += 1;
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: sacrifice === null ? [] : [0] });
      return;
    }
    if (awaiting.kind === "sacrifice") {
      seen.sacrificeChoices = awaiting.eligible;
      game.dispatch({ type: "sacrifice", player: awaiting.player, permanents: [sacrifice!] });
      return;
    }
    if (awaiting.kind === "attackers") {
      game.dispatch({ type: "declare-attackers", player: awaiting.player, attackers: [] });
      return;
    }
    if (awaiting.kind === "choose-targets") {
      game.dispatch({ type: "choose-targets", player: awaiting.player, targets: [{ kind: "player", player: target }] });
      return;
    }
    throw new Error(`unexpected ${awaiting.kind} decision`);
  };
  return { seen, answer };
};

/** Pass priority until `until` holds, answering decisions on the way. */
const runUntil = (game: Game, until: (s: GameState) => boolean, answer: (a: Awaiting) => void): void => {
  for (let i = 0; i < 400; i += 1) {
    if (game.state.awaiting !== null) {
      answer(game.state.awaiting);
      continue;
    }
    if (until(game.state)) return;
    const holder = game.state.priority.holder;
    if (holder === null) throw new Error("nobody holds priority");
    game.dispatch({ type: "pass-priority", player: holder });
  }
  throw new Error("never got there");
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

/** Into the end step, then until its triggers have all resolved. */
const throughEndStep = (game: Game, answer: (a: Awaiting) => void): void => {
  runUntil(game, (s) => s.turn.step === "end", answer);
  runUntil(game, (s) => s.turn.step === "end" && quiet(s) && s.eventLog.some((e) => e.type === "step-began" && e.step === "end"), answer);
};

describe("Ziatora, the Incinerator", () => {
  it("sacrifices another creature, then deals its power to a target chosen as the reflexive ability goes on the stack and makes three Treasures", () => {
    const game = setUp();
    const ziatora = spawn(game, "Ziatora, the Incinerator");
    const giant = spawn(game, "Hill Giant");
    const { seen, answer } = answerer(game, giant);
    throughEndStep(game, answer);
    expect(onBattlefield(game, giant)).toBe(false);
    expect(onBattlefield(game, ziatora)).toBe(true);
    expect(game.state.players[B].life).toBe(17);
    expect(treasures(game)).toBe(3);
    // "Another creature": Ziatora is never one of the choices.
    expect(seen.sacrificeChoices ?? [giant]).not.toContain(ziatora);
  });

  it("asks nothing when it is the only creature you control", () => {
    const game = setUp();
    spawn(game, "Ziatora, the Incinerator");
    const { seen, answer } = answerer(game, null);
    throughEndStep(game, answer);
    expect(seen.asked).toBe(0);
    expect(game.state.players[B].life).toBe(20);
    expect(treasures(game)).toBe(0);
  });

  it("does nothing when you decline", () => {
    const game = setUp();
    spawn(game, "Ziatora, the Incinerator");
    const giant = spawn(game, "Hill Giant");
    const { seen, answer } = answerer(game, null);
    throughEndStep(game, answer);
    expect(seen.asked).toBe(1);
    expect(onBattlefield(game, giant)).toBe(true);
    expect(game.state.players[B].life).toBe(20);
    expect(treasures(game)).toBe(0);
  });

  it("deals the power the creature had as it last existed on the battlefield", () => {
    const game = setUp();
    spawn(game, "Ziatora, the Incinerator");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters["+1/+1"] = 3;
    const { answer } = answerer(game, bears);
    throughEndStep(game, answer);
    expect(game.state.players[B].life).toBe(15);
  });
});

describe("Felothar, Dawn of the Abzan", () => {
  it("as it enters, sacrificing a nonland permanent puts a +1/+1 counter on each creature you control", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const opposing = spawn(game, "Grizzly Bears", B);
    const ring = spawn(game, "Sol Ring");
    for (let i = 0; i < 3; i += 1) spawn(game, "Plains");
    const card = game.debugSpawn("Felothar, Dawn of the Abzan", A, "hand");
    // {W}{B}{G} paid by a hand-free debug: put the mana in the pool.
    game.state.players[A].manaPool = [
      { type: "W" },
      { type: "B" },
      { type: "G" },
    ] as unknown as GameState["players"][PlayerId]["manaPool"];
    const { seen, answer } = answerer(game, ring);
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    runUntil(game, quiet, answer);
    const felothar = game.battlefield.find((id) => game.state.objects[id].cardName === "Felothar, Dawn of the Abzan")!;
    expect(onBattlefield(game, ring)).toBe(false);
    expect(plusOnes(game, bears)).toBe(1);
    expect(plusOnes(game, felothar)).toBe(1);
    expect(plusOnes(game, opposing)).toBe(0);
    // Lands can't be sacrificed to it.
    for (const id of seen.sacrificeChoices ?? []) expect(game.characteristics(id).types).not.toContain("land");
  });
});

/** Into A's combat attacking B with `attackers`, then answering each
 * decision with `answer` (which returns false to fall back on the defaults
 * below) until the stack and triggers are empty after the attack. */
const attackAndSettle = (game: Game, attackers: readonly ObjectId[], answer: (a: Awaiting) => boolean): void => {
  for (let i = 0; i < 400; i += 1) {
    const s = game.state;
    const a = s.awaiting;
    if (a !== null) {
      if (answer(a)) continue;
      if (a.kind === "attackers") {
        game.dispatch({
          type: "declare-attackers",
          player: a.player,
          attackers: a.player === A ? attackers.map((attacker) => ({ attacker, defender: B })) : [],
        });
        continue;
      }
      if (a.kind === "blockers") {
        game.dispatch({ type: "declare-blockers", player: a.player, blockers: [] });
        continue;
      }
      throw new Error(`unexpected ${a.kind} decision`);
    }
    if ((s.turn.step === "declare-blockers" || s.turn.step === "combat-damage") && quiet(s)) return;
    game.dispatch({ type: "pass-priority", player: s.priority.holder! });
  }
  throw new Error("never settled");
};

describe("Iron Man, Titan of Innovation", () => {
  it("makes a Treasure, then sacrificing a noncreature artifact finds one with mana value 1 more, tapped", () => {
    const game = setUp();
    const ironMan = spawn(game, "Iron Man, Titan of Innovation");
    const ring = spawn(game, "Sol Ring");
    const stone = game.debugSpawn("Mind Stone", A, "library");
    let searched: readonly ObjectId[] = [];
    attackAndSettle(game, [ironMan], (a) => {
      if (a.kind === "choose-modes") {
        game.dispatch({ type: "choose-modes", player: A, modes: [0] });
        return true;
      }
      if (a.kind === "sacrifice") {
        game.dispatch({ type: "sacrifice", player: A, permanents: [ring] });
        return true;
      }
      if (a.kind === "choose-from-zone") {
        searched = a.eligible;
        game.dispatch({ type: "choose-from-zone", player: A, chosen: a.eligible.includes(stone) ? [stone] : [] });
        return true;
      }
      return false;
    });
    expect(onBattlefield(game, ring)).toBe(false);
    expect(searched).toEqual([stone]);
    expect(onBattlefield(game, stone)).toBe(true);
    expect(game.state.objects[stone].tapped).toBe(true);
    expect(treasures(game)).toBe(1);
  });
});

describe("Yuma, Proud Protector", () => {
  it("costs {1} less for each land card in your graveyard", () => {
    const game = setUp();
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", A, "graveyard");
    for (const land of ["Mountain", "Forest", "Plains", "Plains", "Plains"]) spawn(game, land);
    const yuma = game.debugSpawn("Yuma, Proud Protector", A, "hand");
    expect(game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === yuma)).toBe(true);
  });

  it("draws when a land is sacrificed as it enters, and a Desert sacrificed makes a Plant Warrior", () => {
    const game = setUp();
    const desert = spawn(game, "Desert of the True");
    const hand = game.handOf(A).length;
    game.debugSpawn("Yuma, Proud Protector", A, "battlefield", { summoningSick: false, announceEntry: true });
    const { answer } = answerer(game, desert);
    for (let i = 0; i < 40 && !quiet(game.state); i += 1) {
      if (game.state.awaiting !== null) answer(game.state.awaiting);
      else game.dispatch({ type: "pass-priority", player: game.state.priority.holder! });
    }
    expect(onBattlefield(game, desert)).toBe(false);
    expect(game.handOf(A).length).toBe(hand + 1);
    expect(game.battlefield.some((id) => game.state.objects[id].cardName === "Plant Warrior Token")).toBe(true);
  });
});

describe("Eddie Brock // Venom, Lethal Protector", () => {
  it("Eddie returns a creature card of mana value 1 or less as it enters, and transforms for {3}{B}{R}{G}", () => {
    const game = setUp();
    const elves = game.debugSpawn("Llanowar Elves", A, "graveyard");
    game.debugSpawn("Hill Giant", A, "graveyard");
    const eddie = game.debugSpawn("Eddie Brock", A, "battlefield", { summoningSick: false, announceEntry: true });
    for (let i = 0; i < 40 && !quiet(game.state); i += 1) {
      const a = game.state.awaiting;
      if (a?.kind === "choose-targets") {
        expect(a.options[0]).toEqual([{ kind: "object", object: elves }]);
        game.dispatch({ type: "choose-targets", player: A, targets: [{ kind: "object", object: elves }] });
      } else game.dispatch({ type: "pass-priority", player: game.state.priority.holder! });
    }
    expect(onBattlefield(game, elves)).toBe(true);
    game.advanceUntil(
      (s) => s.turn.step === "precombat-main" && s.priority.holder === A && s.turnOrder[s.turn.activePlayerIndex] === A,
    );
    for (const land of ["Swamp", "Mountain", "Forest", "Swamp", "Swamp", "Swamp"]) spawn(game, land);
    const transform = game
      .legalActions(A)
      .find((a) => a.kind === "activate-ability" && a.source === eddie && a.text.startsWith("{3}{B}{R}{G}"));
    if (transform?.kind !== "activate-ability") throw new Error("no transform offered");
    game.dispatch({ type: "activate-ability", player: A, source: eddie, abilityIndex: transform.abilityIndex, targets: [] });
    for (let i = 0; i < 20 && !quiet(game.state); i += 1) game.dispatch({ type: "pass-priority", player: game.state.priority.holder! });
    expect(game.state.objects[eddie].face).toBe(1);
    expect(game.characteristics(eddie).power).toBe(5);
    expect(game.characteristics(eddie).keywords.has("menace")).toBe(true);
  });

  it("Venom sacrifices another creature to draw X, then may put a permanent card of mana value X or less from hand", () => {
    const game = setUp();
    const venom = game.debugSpawn("Eddie Brock", A, "battlefield", { summoningSick: false });
    game.state.objects[venom].face = 1;
    const giant = spawn(game, "Hill Giant");
    game.state.zones.perPlayer[A].hand = [];
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    const wurm = game.debugSpawn("Craw Wurm", A, "hand");
    let offered: readonly ObjectId[] = [];
    attackAndSettle(game, [venom], (a) => {
      if (a.kind === "choose-modes") {
        game.dispatch({ type: "choose-modes", player: A, modes: [0] });
        return true;
      }
      if (a.kind === "sacrifice") {
        game.dispatch({ type: "sacrifice", player: A, permanents: [giant] });
        return true;
      }
      if (a.kind === "choose-from-zone") {
        offered = a.eligible;
        game.dispatch({ type: "choose-from-zone", player: A, chosen: [bears] });
        return true;
      }
      return false;
    });
    expect(onBattlefield(game, giant)).toBe(false);
    // Hill Giant's mana value is 4: four cards drawn, then Grizzly Bears (2)
    // put in; Craw Wurm (6) was never eligible.
    expect(game.handOf(A)).toHaveLength(4 + 2 - 1);
    expect(onBattlefield(game, bears)).toBe(true);
    expect(offered).toContain(bears);
    expect(offered).not.toContain(wurm);
  });
});

describe("Caesar, Legion's Emperor", () => {
  it("whenever you attack, sacrificing another creature triggers a reflexive ability whose two modes and target are chosen as it goes on the stack", () => {
    const game = setUp();
    const caesar = spawn(game, "Caesar, Legion's Emperor");
    const bears = spawn(game, "Grizzly Bears");
    const hand = game.handOf(A).length;
    const asked: string[] = [];
    attackAndSettle(game, [caesar], (a) => {
      if (a.kind === "choose-modes" && a.minModes === 0) {
        asked.push("may");
        game.dispatch({ type: "choose-modes", player: A, modes: [0] });
        return true;
      }
      if (a.kind === "choose-modes" && a.minModes === 2) {
        asked.push(`modes ${a.modes.length}`);
        game.dispatch({ type: "choose-modes", player: A, modes: [0, 2] });
        return true;
      }
      if (a.kind === "choose-targets") {
        asked.push("target");
        game.dispatch({ type: "choose-targets", player: A, targets: [{ kind: "player", player: B }] });
        return true;
      }
      return false;
    });
    expect(onBattlefield(game, bears)).toBe(false);
    // The third mode's only legal target (two players) is taken without asking.
    expect(asked).toEqual(["may", "modes 3"]);
    // Two Soldiers, tapped and attacking; the damage counted them both.
    expect(game.state.players[B].life).toBe(18);
    expect(game.handOf(A).length).toBe(hand);
  });
});
