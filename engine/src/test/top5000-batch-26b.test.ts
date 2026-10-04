/**
 * Top-5000 batch 26b — the clauses most likely to be wired wrong: a static
 * keyed on +1/+1 counters (Badgermole), an animated land's keyword
 * (Restless Reef), a count read as the trigger resolves (Smaug), "each other
 * planeswalker" (Ajani), a targeted extra turn beside an optional bounce
 * (Karn's Temporal Sundering), twice X looked at (Stargaze), proliferate
 * before a fight (Smell Fear), a power check as the Chaos trigger resolves
 * (Vincent), a subtype-list combat trigger (Spawning Kraken), and an
 * opponent count / second draw (Ethereal Investigator).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const registry = createDefaultRegistry();

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (
  players: 2 | 3 = 2,
  library = "Wastes",
): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const seats = players === 3 ? [A, B, C] : [A, B];
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: Object.fromEntries(seats.map((p) => [p, p === A ? a : new ScriptedController(p)])),
    decks: seats.map((p) => ({ player: p, cards: Array<string>(40).fill(p === A ? library : "Wastes") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const countNamed = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const settle = (game: Game): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [0] });
    } else {
      game.advanceUntil(quiet);
    }
  }
  throw new Error("settle: still unresolved");
};

describe("top-5000 batch 26b — Badgermole", () => {
  it("gives trample only to creatures you control with a +1/+1 counter", () => {
    const { game } = setUp();
    spawn(game, "Badgermole");
    const countered = spawn(game, "Grizzly Bears");
    game.state.objects[countered].counters = { "+1/+1": 1 };
    const plain = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.state.objects[theirs].counters = { "+1/+1": 1 };
    expect(computeCharacteristics(game.state, registry, countered).keywords.has("trample")).toBe(true);
    expect(computeCharacteristics(game.state, registry, plain).keywords.has("trample")).toBe(false);
    expect(computeCharacteristics(game.state, registry, theirs).keywords.has("trample")).toBe(false);
  });
});

describe("top-5000 batch 26b — Restless Reef", () => {
  it("becomes a 4/4 blue and black Shark with deathtouch that's still a land", () => {
    const { game } = setUp();
    const reef = spawn(game, "Restless Reef");
    const animate = registry.get("Restless Reef")!.activated[1].effect!;
    game.debugApplyEffect(A, animate, [], { source: reef });
    settle(game);
    const c = computeCharacteristics(game.state, registry, reef);
    expect([c.power, c.toughness]).toEqual([4, 4]);
    expect(c.types).toContain("land");
    expect(c.types).toContain("creature");
    expect(c.subtypes).toContain("Shark");
    expect(c.keywords.has("deathtouch")).toBe(true);
    expect([...c.colors].sort()).toEqual(["B", "U"]);
  });
});

describe("top-5000 batch 26b — Smaug the Magnificent", () => {
  it("deals damage equal to the Treasures you control as he attacks", () => {
    const { game, a } = setUp();
    const smaug = spawn(game, "Smaug the Magnificent");
    spawn(game, "Treasure Token");
    spawn(game, "Treasure Token");
    spawn(game, "Treasure Token", B);
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    a.declareAttackersFn = () => [{ attacker: smaug, defender: B }];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    // 2 from the trigger (only A's two Treasures), 4 combat.
    expect(life(game, B)).toBe(14);
  });
});

describe("top-5000 batch 26b — Ajani, the Greathearted", () => {
  it("−2: a +1/+1 counter on each creature, a loyalty counter on each *other* planeswalker", () => {
    const { game } = setUp();
    const ajani = spawn(game, "Ajani, the Greathearted");
    const chandra = spawn(game, "Chandra, Acolyte of Flame");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    const ajaniLoyalty = counters(game, ajani, "loyalty");
    const chandraLoyalty = counters(game, chandra, "loyalty");
    const minus = registry.get("Ajani, the Greathearted")!.activated[1].effect!;
    game.debugApplyEffect(A, minus, [], { source: ajani });
    settle(game);
    expect(counters(game, bears)).toBe(1);
    expect(counters(game, theirs)).toBe(0);
    expect(counters(game, chandra, "loyalty")).toBe(chandraLoyalty + 1);
    expect(counters(game, ajani, "loyalty")).toBe(ajaniLoyalty);
  });
});

describe("top-5000 batch 26b — Karn's Temporal Sundering", () => {
  it("gives the target player an extra turn and bounces the optional target", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const effect = registry.get("Karn's Temporal Sundering")!.effect!;
    game.debugApplyEffect(A, effect, [
      { kind: "player", player: B },
      { kind: "object", object: bears },
    ]);
    settle(game);
    expect(game.state.extraTurns).toEqual([B]);
    expect(game.state.objects[bears].zone).toBe("hand");
  });

  it("can't be cast without a legendary creature or planeswalker", () => {
    const def = registry.get("Karn's Temporal Sundering")!;
    expect(def.castOnlyIf).not.toBeNull();
    expect(def.exileOnResolve).toBe(true);
  });
});

describe("top-5000 batch 26b — Stargaze", () => {
  it("looks at twice X, keeps X, bins the rest and loses X life", () => {
    const { game, a } = setUp();
    a.chooseFromZoneFn = (_view, eligible, min, max) => {
      expect(eligible).toHaveLength(6);
      expect([min, max]).toEqual([3, 3]);
      return eligible.slice(0, 3);
    };
    const hand = game.handOf(A).length;
    const yard = game.graveyardOf(A).length;
    const before = life(game, A);
    game.debugApplyEffect(A, registry.get("Stargaze")!.effect!, [], { x: 3 });
    settle(game);
    expect(game.handOf(A).length).toBe(hand + 3);
    expect(game.graveyardOf(A).length).toBe(yard + 3);
    expect(life(game, A)).toBe(before - 3);
  });
});

describe("top-5000 batch 26b — Smell Fear", () => {
  it("proliferates first, then the bigger creature fights", () => {
    const { game } = setUp();
    const giant = spawn(game, "Hill Giant");
    game.state.objects[giant].counters = { "+1/+1": 1 };
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, registry.get("Smell Fear")!.effect!, [
      { kind: "object", object: giant },
      { kind: "object", object: bears },
    ]);
    settle(game);
    expect(counters(game, giant)).toBe(2);
    // The Giant fights as a 5/5 — after the proliferate.
    const bearsNow = game.state.objects[bears];
    expect(bearsNow.zone === "graveyard" || bearsNow.damageMarked === 5).toBe(true);
    if (bearsNow.zone === "battlefield") expect(bearsNow.damageMarked).toBe(5);
    expect(game.state.objects[giant].damageMarked).toBe(2);
  });

  it("with no second target, proliferates and nothing fights", () => {
    const { game } = setUp();
    const giant = spawn(game, "Hill Giant");
    game.state.objects[giant].counters = { "+1/+1": 1 };
    game.debugApplyEffect(A, registry.get("Smell Fear")!.effect!, [{ kind: "object", object: giant }]);
    settle(game);
    expect(counters(game, giant)).toBe(2);
    expect(game.state.objects[giant].damageMarked).toBe(0);
  });
});

describe("top-5000 batch 26b — Vincent, Vengeful Atoner", () => {
  it("at power 7 or more, deals the combat damage again to each other opponent", () => {
    const { game, a } = setUp(3);
    const vincent = spawn(game, "Vincent, Vengeful Atoner");
    game.state.objects[vincent].counters = { "+1/+1": 4 };
    a.declareAttackersFn = () => [{ attacker: vincent, defender: B }];
    const [b0, c0] = [life(game, B), life(game, C)];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(b0 - 7);
    expect(life(game, C)).toBe(c0 - 7);
    expect(counters(game, vincent)).toBe(5);
  });

  it("below power 7, only the +1/+1 counter", () => {
    const { game, a } = setUp(3);
    const vincent = spawn(game, "Vincent, Vengeful Atoner");
    a.declareAttackersFn = () => [{ attacker: vincent, defender: B }];
    const [b0, c0] = [life(game, B), life(game, C)];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(b0 - 3);
    expect(life(game, C)).toBe(c0);
    expect(counters(game, vincent)).toBe(1);
  });
});

describe("top-5000 batch 26b — Spawning Kraken", () => {
  it("makes a 9/9 Kraken for a Kraken dealing combat damage, not for another creature", () => {
    const { game, a } = setUp();
    const kraken = spawn(game, "Spawning Kraken");
    const bears = spawn(game, "Grizzly Bears");
    a.declareAttackersFn = () => [
      { attacker: kraken, defender: B },
      { attacker: bears, defender: B },
    ];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(countNamed(game, "Kraken Token (Spawning Kraken)")).toBe(1);
    const token = named(game, "Kraken Token (Spawning Kraken)")[0];
    const c = computeCharacteristics(game.state, registry, token);
    expect([c.power, c.toughness]).toEqual([9, 9]);
  });
});

describe("top-5000 batch 26b — Ethereal Investigator", () => {
  it("investigates once per opponent, and a second draw makes one Spirit", () => {
    const { game } = setUp(3);
    game.debugSpawn("Ethereal Investigator", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(countNamed(game, "Clue Token")).toBe(2);
    // However many A has drawn this turn already, two more draws cross "second" once.
    game.debugApplyEffect(A, { kind: "draw", amount: 2 }, []);
    settle(game);
    expect(countNamed(game, "Spirit Token")).toBe(1);
  });
});
