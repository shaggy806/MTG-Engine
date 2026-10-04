/**
 * Choices of a permanent made as an effect resolves, untargeted: populate's
 * creature token (rule 701.36a) and amass's Army (rule 701.47a) are the
 * controller's to choose — on the board, through a `choose-permanents` —
 * whenever there's more than one, and made without asking when there isn't.
 */
import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Plains") })),
  });
  game.advanceUntil((s) => s.priority.holder === A);
  return game;
};

const mine = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name && game.state.objects[id].controller === A);
const count = (game: Game, name: string): number =>
  mine(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const plusOnes = (game: Game, id: ObjectId): number => game.state.objects[id].counters["+1/+1"] ?? 0;

describe("populate", () => {
  it("asks which creature token to copy when there are two, and copies the one chosen", () => {
    const game = setUp();
    game.debugApplyEffect(A, { kind: "create-token", token: "Elephant Token", count: 1 });
    game.debugApplyEffect(A, { kind: "create-token", token: "Soldier Token", count: 1 });
    game.debugApplyEffect(A, { kind: "populate" });
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-permanents");
    if (awaiting?.kind !== "choose-permanents") throw new Error("unreachable");
    const [soldier] = mine(game, "Soldier Token");
    const [elephant] = mine(game, "Elephant Token");
    expect([...awaiting.eligible].sort()).toEqual([soldier, elephant].sort());
    expect(awaiting.min).toBe(1);
    expect(awaiting.max).toBe(1);
    // The smaller one: populate no longer copies the biggest by itself.
    game.dispatch({ type: "choose-permanents", player: A, permanents: [soldier] });
    expect(count(game, "Soldier Token")).toBe(2);
    expect(count(game, "Elephant Token")).toBe(1);
  });

  it("doesn't ask among identical tokens made together: one more of them", () => {
    const game = setUp();
    game.debugApplyEffect(A, { kind: "create-token", token: "Soldier Token", count: 3 });
    game.debugApplyEffect(A, { kind: "populate" });
    expect(game.state.awaiting).toBeNull();
    expect(count(game, "Soldier Token")).toBe(4);
  });

  it("never offers an opponent's token", () => {
    const game = setUp();
    game.debugApplyEffect(A, { kind: "create-token", token: "Soldier Token", count: 1 });
    game.debugApplyEffect(B, { kind: "create-token", token: "Elephant Token", count: 1 });
    game.debugApplyEffect(A, { kind: "populate" });
    expect(game.state.awaiting).toBeNull();
    expect(count(game, "Soldier Token")).toBe(2);
  });
});

describe("amass", () => {
  it("asks which Army when a changeling is one beside an Army token", () => {
    const game = setUp();
    game.debugApplyEffect(A, { kind: "amass", amount: 1, creatureType: "Orc" });
    const [army] = mine(game, "Army Token");
    expect(plusOnes(game, army)).toBe(1);
    const changeling = game.debugSpawn("Changeling Outcast", A, "battlefield");
    game.debugApplyEffect(A, { kind: "amass", amount: 2, creatureType: "Orc" });
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-permanents");
    if (awaiting?.kind !== "choose-permanents") throw new Error("unreachable");
    expect([...awaiting.eligible].sort()).toEqual([army, changeling].sort());
    game.dispatch({ type: "choose-permanents", player: A, permanents: [changeling] });
    expect(plusOnes(game, changeling)).toBe(2);
    expect(plusOnes(game, army)).toBe(1);
    // No second Army token was made.
    expect(count(game, "Army Token")).toBe(1);
  });

  it("puts the counters on one of two identical Army tokens without asking", () => {
    const game = setUp();
    game.debugApplyEffect(A, { kind: "create-token", token: "Army Token", count: 2 });
    game.debugApplyEffect(A, { kind: "amass", amount: 1, creatureType: "Zombie" });
    expect(game.state.awaiting).toBeNull();
    expect(count(game, "Army Token")).toBe(2);
    const counters = mine(game, "Army Token").flatMap((id) =>
      Array<number>(game.state.objects[id].stackCount ?? 1).fill(plusOnes(game, id)),
    );
    // One token with the counter, one without.
    expect(counters.sort()).toEqual([0, 1]);
  });
});

/** Pass priority until the stack, triggers and decisions are all done. */
const settle = (game: Game): void => {
  for (let i = 0; i < 200; i += 1) {
    const s = game.state;
    if (s.awaiting !== null) throw new Error(`unexpected ${s.awaiting.kind} decision`);
    if (s.zones.shared.stack.length === 0 && s.pendingTriggers.length === 0) return;
    game.dispatch({ type: "pass-priority", player: s.priority.holder! });
  }
  throw new Error("never settled");
};

describe("Trostani, Selesnya's Voice", () => {
  it("gains life equal to another entering creature's toughness", () => {
    const game = setUp();
    game.debugSpawn("Trostani, Selesnya's Voice", A, "battlefield", { summoningSick: false });
    const life = game.state.players[A].life;
    game.debugSpawn("Hill Giant", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.players[A].life).toBe(life + 3);
  });

  it("populates, asking which of two different creature tokens to copy", () => {
    const game = setUp();
    const trostani = game.debugSpawn("Trostani, Selesnya's Voice", A, "battlefield", { summoningSick: false });
    for (const land of ["Forest", "Plains", "Forest"]) game.debugSpawn(land, A, "battlefield");
    game.debugApplyEffect(A, { kind: "create-token", token: "Elephant Token", count: 1 });
    game.debugApplyEffect(A, { kind: "create-token", token: "Soldier Token", count: 1 });
    settle(game);
    const ability = game
      .legalActions(A)
      .find((a) => a.kind === "activate-ability" && a.source === trostani && a.manaAbility !== true);
    if (ability?.kind !== "activate-ability") throw new Error("no populate ability offered");
    game.dispatch({ type: "activate-ability", player: A, source: trostani, abilityIndex: ability.abilityIndex, targets: [] });
    for (let i = 0; i < 20 && game.state.awaiting === null; i += 1) {
      game.dispatch({ type: "pass-priority", player: game.state.priority.holder! });
    }
    expect(game.state.awaiting?.kind).toBe("choose-permanents");
    const [elephant] = mine(game, "Elephant Token");
    game.dispatch({ type: "choose-permanents", player: A, permanents: [elephant] });
    settle(game);
    expect(count(game, "Elephant Token")).toBe(2);
    expect(count(game, "Soldier Token")).toBe(1);
  });
});

describe("Saruman, the White Hand", () => {
  it("amasses Orcs equal to a noncreature spell's mana value", () => {
    const game = setUp();
    game.advanceUntil((st) => st.turn.step === "precombat-main" && st.priority.holder === A);
    game.debugSpawn("Saruman, the White Hand", A, "battlefield", { summoningSick: false });
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Island", A, "battlefield");
    const divination = game.debugSpawn("Divination", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: divination, targets: [] });
    settle(game);
    const [army] = mine(game, "Army Token");
    expect(plusOnes(game, army)).toBe(3);
    expect(game.characteristics(army).subtypes).toContain("Orc");
  });

  it("doesn't amass for a creature spell", () => {
    const game = setUp();
    game.advanceUntil((st) => st.turn.step === "precombat-main" && st.priority.holder === A);
    game.debugSpawn("Saruman, the White Hand", A, "battlefield", { summoningSick: false });
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] });
    settle(game);
    expect(count(game, "Army Token")).toBe(0);
  });
});

describe("Wick, the Whorled Mind", () => {
  it("makes a Snail when it enters and you control none", () => {
    const game = setUp();
    game.debugSpawn("Wick, the Whorled Mind", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(count(game, "Snail Token")).toBe(1);
  });

  it("otherwise puts a +1/+1 counter on a Snail you choose when another Rat enters", () => {
    const game = setUp();
    game.debugSpawn("Wick, the Whorled Mind", A, "battlefield", { summoningSick: false });
    game.debugApplyEffect(A, { kind: "create-token", token: "Snail Token", count: 1 });
    const [first] = mine(game, "Snail Token");
    game.state.objects[first].counters["+1/+1"] = 1;
    game.debugApplyEffect(A, { kind: "create-token", token: "Snail Token", count: 1 });
    const second = mine(game, "Snail Token").find((id) => id !== first)!;
    game.debugSpawn("Muck Rats", A, "battlefield", { announceEntry: true });
    for (let i = 0; i < 20 && game.state.awaiting === null; i += 1) {
      game.dispatch({ type: "pass-priority", player: game.state.priority.holder! });
    }
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-permanents");
    if (awaiting?.kind !== "choose-permanents") throw new Error("unreachable");
    expect([...awaiting.eligible].sort()).toEqual([first, second].sort());
    game.dispatch({ type: "choose-permanents", player: A, permanents: [second] });
    settle(game);
    expect(count(game, "Snail Token")).toBe(2);
    expect(plusOnes(game, first)).toBe(1);
    expect(plusOnes(game, second)).toBe(1);
  });

  it("sacrifices a Snail to deal its power to each opponent and draw that many", () => {
    const game = setUp();
    const wick = game.debugSpawn("Wick, the Whorled Mind", A, "battlefield", { summoningSick: false });
    for (const land of ["Island", "Swamp", "Mountain"]) game.debugSpawn(land, A, "battlefield");
    game.debugApplyEffect(A, { kind: "create-token", token: "Snail Token", count: 1 });
    const [snail] = mine(game, "Snail Token");
    game.state.objects[snail].counters["+1/+1"] = 2;
    settle(game);
    const hand = game.handOf(A).length;
    const ability = game
      .legalActions(A)
      .find((a) => a.kind === "activate-ability" && a.source === wick && a.manaAbility !== true);
    if (ability?.kind !== "activate-ability") throw new Error("no Wick ability offered");
    game.dispatch({ type: "activate-ability", player: A, source: wick, abilityIndex: ability.abilityIndex, targets: [], sacrifice: snail });
    settle(game);
    expect(game.state.players[B].life).toBe(17);
    expect(game.handOf(A).length).toBe(hand + 3);
  });
});

describe("Tovolar, Dire Overlord", () => {
  /** Tovolar and `wolves` Wolf tokens on A's battlefield before the first
   * turn's upkeep (it's day: a daybound permanent made it so, rule 702.145d),
   * then into that upkeep and through its triggers. */
  const toFirstUpkeep = (wolves: number): { game: Game; tovolar: ObjectId } => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      startingPlayer: A,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Plains") })),
    });
    const tovolar = game.debugSpawn("Tovolar, Dire Overlord", A, "battlefield", { summoningSick: false });
    for (let i = 0; i < wolves; i += 1) game.debugSpawn("Wolf Token", A, "battlefield", { summoningSick: false });
    expect(game.state.dayNight).toBe("day");
    game.advanceUntil((s) => s.turn.step === "upkeep" && (s.priority.holder === A || s.awaiting !== null));
    settle(game);
    return { game, tovolar };
  };

  it("makes it night at your upkeep with three or more Wolves and Werewolves, Tovolar transforming by its daybound", () => {
    const { game, tovolar } = toFirstUpkeep(2);
    expect(game.state.eventLog.some((e) => e.type === "ability-triggered" && e.source === tovolar)).toBe(true);
    expect(game.state.dayNight).toBe("night");
    // Night transformed Tovolar through its daybound; nothing was asked, since
    // a daybound Human Werewolf can't be chosen to transform.
    expect(game.state.objects[tovolar].face).toBe(1);
    expect(game.characteristics(tovolar).subtypes).toEqual(["Werewolf"]);
  });

  it("doesn't trigger with fewer than three", () => {
    const { game, tovolar } = toFirstUpkeep(1);
    expect(game.state.eventLog.some((e) => e.type === "ability-triggered" && e.source === tovolar)).toBe(false);
    expect(game.state.dayNight).toBe("day");
    expect(game.state.objects[tovolar].face ?? 0).toBe(0);
  });
});

describe("transforming a daybound or nightbound permanent", () => {
  it("does nothing: only its own ability transforms it (rules 702.145b, 702.145e)", () => {
    const game = setUp();
    const wolf = game.debugSpawn("Harvesttide Infiltrator", A, "battlefield", { summoningSick: false });
    expect(game.state.objects[wolf].face ?? 0).toBe(0);
    game.debugApplyEffect(A, { kind: "transform", target: 0 }, [{ kind: "object", object: wolf }]);
    expect(game.state.objects[wolf].face ?? 0).toBe(0);
  });
});

describe("Breena, the Demagogue", () => {
  const C = asPlayerId("carol");
  /** Three players; B attacks C with a Grizzly Bears on B's turn. */
  const bAttacksC = (bLife: number, cLife: number) => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      startingPlayer: B,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      decks: [A, B, C].map((player) => ({ player, cards: Array<string>(40).fill("Plains") })),
    });
    game.advanceUntil((s) => s.priority.holder === B);
    game.debugSpawn("Breena, the Demagogue", A, "battlefield", { summoningSick: false });
    const hill = game.debugSpawn("Hill Giant", A, "battlefield", { summoningSick: false });
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false });
    game.state.players[B].life = bLife;
    game.state.players[C].life = cLife;
    let bHand = -1;
    let asked: readonly ObjectId[] | undefined;
    for (let i = 0; i < 200; i += 1) {
      const s = game.state;
      if (s.awaiting?.kind === "attackers") {
        if (s.awaiting.player === B) bHand = game.handOf(B).length;
        game.dispatch({
          type: "declare-attackers",
          player: B,
          attackers: s.awaiting.player === B ? [{ attacker: bears, defender: C }] : [],
        });
        continue;
      }
      if (s.awaiting?.kind === "choose-permanents") {
        asked = s.awaiting.eligible;
        game.dispatch({ type: "choose-permanents", player: s.awaiting.player, permanents: [hill] });
        continue;
      }
      if (s.awaiting?.kind === "blockers") {
        game.dispatch({ type: "declare-blockers", player: s.awaiting.player, blockers: [] });
        continue;
      }
      if (s.awaiting !== null) throw new Error(`unexpected ${s.awaiting.kind}`);
      if (s.turn.step === "combat-damage" || s.turn.step === "end-of-combat") break;
      game.dispatch({ type: "pass-priority", player: s.priority.holder! });
    }
    return { game, hill, bears, bHand, asked };
  };

  it("draws the attacking player a card and puts two +1/+1 counters on a creature you choose", () => {
    const { game, hill, bHand, asked } = bAttacksC(10, 20);
    expect(game.handOf(B).length).toBe(bHand + 1);
    expect(plusOnes(game, hill)).toBe(2);
    // Only your own creatures are offered.
    expect(asked).toBeDefined();
    for (const id of asked ?? []) expect(game.state.objects[id].controller).toBe(A);
  });

  it("does nothing when the attacked opponent doesn't have more life than another", () => {
    const { game, hill, bHand, asked } = bAttacksC(20, 10);
    expect(game.handOf(B).length).toBe(bHand);
    expect(plusOnes(game, hill)).toBe(0);
    expect(asked).toBeUndefined();
  });
});

describe("Abdel Adrian, Gorion's Ward", () => {
  const enter = (pick: (eligible: readonly ObjectId[]) => readonly ObjectId[]) => {
    const game = setUp();
    const ring = game.debugSpawn("Sol Ring", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const plains = game.debugSpawn("Plains", A, "battlefield");
    const abdel = game.debugSpawn("Abdel Adrian, Gorion's Ward", A, "battlefield", { announceEntry: true });
    let offered: readonly ObjectId[] = [];
    for (let i = 0; i < 40 && game.state.awaiting === null; i += 1) {
      game.dispatch({ type: "pass-priority", player: game.state.priority.holder! });
    }
    const awaiting = game.state.awaiting;
    if (awaiting?.kind === "choose-permanents") {
      offered = awaiting.eligible;
      game.dispatch({ type: "choose-permanents", player: A, permanents: [...pick(awaiting.eligible)] });
    }
    settle(game);
    return { game, ring, bears, plains, abdel, offered };
  };

  it("exiles the other nonland permanents chosen, makes a Soldier for each, and returns them when it leaves", () => {
    const { game, ring, bears, plains, abdel, offered } = enter((eligible) => eligible);
    expect([...offered].sort()).toEqual([ring, bears].sort());
    expect(offered).not.toContain(abdel);
    expect(offered).not.toContain(plains);
    expect(game.state.objects[ring].zone).toBe("exile");
    expect(game.state.objects[bears].zone).toBe("exile");
    expect(count(game, "Soldier Token")).toBe(2);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: abdel }]);
    settle(game);
    expect(mine(game, "Sol Ring")).toHaveLength(1);
    expect(mine(game, "Grizzly Bears")).toHaveLength(1);
    // The Soldiers stay.
    expect(count(game, "Soldier Token")).toBe(2);
  });

  it("makes no Soldiers when nothing is chosen", () => {
    const { game, ring } = enter(() => []);
    expect(game.state.objects[ring].zone).toBe("battlefield");
    expect(count(game, "Soldier Token")).toBe(0);
  });
});
