/**
 * The "ready now" cards — ones whose recorded blockers the 2026-10-03 engine
 * passes built (a copy's new targets, copy exceptions, a token copy's
 * last-known information): Reverberate, Dualcaster Mage, Brain Freeze, Kitsa,
 * Jin-Gitaxias, Sword of Wealth and Power, Electroduplicate and Inalla — and
 * the pieces built alongside for the rest:
 *
 * - `copy-spell`'s `count` and a cast trigger's `countCastBefore` (Thousand-
 *   Year Storm), the `{ commanderCasts: "you" }` amount (Thunderclap Drake);
 * - a mana rider's "that spell" as a `"trigger-spell"`, copied even once
 *   countered (Primal Amulet // Primal Wellspring);
 * - copying an activated or triggered ability — the `copy-ability` effect,
 *   the `{ kind: "ability" }` target and the `activates-ability` trigger
 *   (Lithoform Engine, Weaver of Harmony, Vantress Visions, Illusionist's
 *   Bracers);
 * - trigger doublers reaching only a permanent's abilities, not a command-
 *   zone card's (Virtue of Knowledge beside Inalla's eminence).
 */

import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
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
/** Stop at a decision, or once everything has resolved. */
const settle = (s: GameState): boolean => s.awaiting !== null || quiet(s);

/** A game at A's first precombat main, both players with lands of every
 * colour. No controllers: every decision is answered by the test. */
const setUp = (opts: { commanders?: readonly string[] } = {}) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      {
        player: A,
        cards: Array<string>(40).fill("Island"),
        ...(opts.commanders !== undefined ? { commanders: [...opts.commanders] } : {}),
      },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const p of [A, B]) {
    for (const [land, n] of [["Mountain", 8], ["Island", 8], ["Swamp", 4], ["Forest", 4], ["Plains", 2]] as const) {
      for (let i = 0; i < n; i += 1) game.debugSpawn(land, p, "battlefield");
    }
  }
  return game;
};

/** The same, with scripted controllers answering for both players — for
 * combat, which they declare. */
const setUpScripted = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  for (const [land, n] of [["Mountain", 8], ["Island", 8]] as const) {
    for (let i = 0; i < n; i += 1) game.debugSpawn(land, A, "battlefield");
  }
  return { game, a, b };
};

const spawn = (game: Game, name: string, p: PlayerId = A): ObjectId =>
  game.debugSpawn(name, p, "battlefield", { summoningSick: false });
const cast = (game: Game, p: PlayerId, name: string, targets: TargetRef[] = [], extra = {}): ObjectId => {
  const card = game.debugSpawn(name, p, "hand");
  game.dispatch({ type: "cast-spell", player: p, card, targets, ...extra });
  return card;
};
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;
const zoneOf = (game: Game, id: ObjectId): string | undefined => game.state.objects[id]?.zone;
const libraryCount = (game: Game, p: PlayerId): number => game.state.zones.perPlayer[p].library.length;
const named = (game: Game, name: string, p?: PlayerId): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) =>
      (game.state.objects[id].copyOf ?? game.state.objects[id].cardName) === name &&
      (p === undefined || game.state.objects[id].controller === p),
  );
/** How many tokens copying `name` `p` controls — a token stack as each of its tokens. */
const copyTokens = (game: Game, name: string, p: PlayerId = A): number =>
  named(game, name, p)
    .filter((id) => game.state.objects[id].isToken)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
/** Answer the decision in front of us, which must be a copy's "choose new
 * targets" (rule 707.10c), with `targets`. */
const chooseCopyTargets = (game: Game, p: PlayerId, targets: TargetRef[]): void => {
  const awaiting = game.state.awaiting;
  expect(awaiting?.kind).toBe("choose-targets");
  game.dispatch({ type: "choose-targets", player: p, targets });
};
/** A gives B priority with the stack as it is. */
const passTo = (game: Game, from: PlayerId): void => {
  game.dispatch({ type: "pass-priority", player: from });
};

describe("Reverberate", () => {
  it("copies a spell, and the copy may get a new target", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const bolt = cast(game, A, "Lightning Bolt", [player(B)]);
    cast(game, A, "Reverberate", [obj(bolt)]);
    game.advanceUntil(settle);
    chooseCopyTargets(game, A, [obj(bears)]);
    game.advanceUntil(quiet);
    expect(zoneOf(game, bears)).toBe("graveyard");
    expect(life(game, B)).toBe(17);
    expect(game.eventsOfType("spell-copied")).toHaveLength(1);
  });
});

describe("Dualcaster Mage", () => {
  it("flashed in, copies an opponent's spell for its own controller, with a new target", () => {
    const game = setUp();
    const mine = spawn(game, "Grizzly Bears", A);
    const theirs = spawn(game, "Grizzly Bears", B);
    passTo(game, A);
    cast(game, B, "Lightning Bolt", [obj(mine)]);
    passTo(game, B);
    // A has priority again with B's Bolt on the stack.
    const bolt = game.state.zones.shared.stack[0];
    cast(game, A, "Dualcaster Mage");
    game.advanceUntil(settle);
    // Its enters trigger targets the one spell there is, then the copy asks.
    if (game.state.awaiting?.kind === "choose-targets" && game.state.awaiting.source !== undefined) {
      const awaiting = game.state.awaiting;
      if (awaiting.cardName === "Dualcaster Mage") {
        game.dispatch({ type: "choose-targets", player: A, targets: [obj(bolt)] });
        game.advanceUntil(settle);
      }
    }
    chooseCopyTargets(game, A, [obj(theirs)]);
    game.advanceUntil(quiet);
    expect(game.eventsOfType("spell-copied")[0].controller).toBe(A);
    expect(zoneOf(game, theirs)).toBe("graveyard");
    expect(zoneOf(game, mine)).toBe("graveyard");
  });
});

describe("Brain Freeze", () => {
  it("storm copies it for each spell cast before it, each with its own target player", () => {
    const game = setUp();
    cast(game, A, "Lightning Bolt", [player(B)]);
    game.advanceUntil(quiet);
    cast(game, A, "Shock", [player(B)]);
    game.advanceUntil(quiet);
    const [libA, libB] = [libraryCount(game, A), libraryCount(game, B)];
    cast(game, A, "Brain Freeze", [player(B)]);
    game.advanceUntil(settle);
    // Two copies, asked one at a time: the first aims at A, the second stays.
    chooseCopyTargets(game, A, [player(A)]);
    game.advanceUntil(settle);
    chooseCopyTargets(game, A, [player(B)]);
    game.advanceUntil(quiet);
    expect(libraryCount(game, A)).toBe(libA - 3);
    expect(libraryCount(game, B)).toBe(libB - 6);
  });
});

describe("Kitsa, Otterball Elite", () => {
  it("copies an instant or sorcery you control only once its power is 3 or greater", () => {
    const game = setUp();
    const kitsa = spawn(game, "Kitsa, Otterball Elite");
    const theirs = spawn(game, "Grizzly Bears", B);
    // Prowess once: 2/4. A spell on the stack, but Kitsa can't copy it yet.
    cast(game, A, "Shock", [player(B)]);
    game.advanceUntil((s) => s.zones.shared.stack.length === 1 && s.pendingTriggers.length === 0);
    expect(game.characteristics(kitsa).power).toBe(2);
    const shock = game.state.zones.shared.stack[0];
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: kitsa, abilityIndex: 1, targets: [obj(shock)] }),
    ).toThrow();
    game.advanceUntil(quiet);
    // Prowess twice: 3/5, and now it can.
    const bolt = cast(game, A, "Lightning Bolt", [player(B)]);
    game.advanceUntil((s) => s.zones.shared.stack.length === 1 && s.pendingTriggers.length === 0);
    expect(game.characteristics(kitsa).power).toBe(3);
    game.dispatch({ type: "activate-ability", player: A, source: kitsa, abilityIndex: 1, targets: [obj(bolt)] });
    game.advanceUntil(settle);
    chooseCopyTargets(game, A, [obj(theirs)]);
    game.advanceUntil(quiet);
    expect(zoneOf(game, theirs)).toBe("graveyard");
    expect(life(game, B)).toBe(20 - 2 - 3);
  });

  it("can't copy an opponent's spell", () => {
    const game = setUp();
    const kitsa = spawn(game, "Kitsa, Otterball Elite");
    game.state.objects[kitsa].counters["+1/+1"] = 2;
    passTo(game, A);
    const bolt = cast(game, B, "Lightning Bolt", [player(A)]);
    passTo(game, B);
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: kitsa, abilityIndex: 1, targets: [obj(bolt)] }),
    ).toThrow();
  });
});

describe("Jin-Gitaxias, Progress Tyrant", () => {
  it("copies your first artifact, instant or sorcery spell each turn — an artifact's copy a token", () => {
    const game = setUp();
    spawn(game, "Jin-Gitaxias, Progress Tyrant");
    cast(game, A, "Mind Stone");
    game.advanceUntil(quiet);
    const stones = named(game, "Mind Stone", A);
    expect(stones).toHaveLength(2);
    expect(stones.filter((id) => game.state.objects[id].isToken)).toHaveLength(1);
    // Once each turn: the next one isn't copied.
    cast(game, A, "Lightning Bolt", [player(B)]);
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(17);
  });

  it("counters an opponent's first artifact, instant or sorcery spell each turn, and only that one", () => {
    const game = setUp();
    spawn(game, "Jin-Gitaxias, Progress Tyrant");
    passTo(game, A);
    const first = cast(game, B, "Lightning Bolt", [player(A)]);
    game.advanceUntil(quiet);
    expect(zoneOf(game, first)).toBe("graveyard");
    expect(life(game, A)).toBe(20);
    expect(game.eventsOfType("spell-countered").some((e) => e.object === first)).toBe(true);
    game.advanceUntil((s) => s.priority.holder === A && quiet(s));
    passTo(game, A);
    cast(game, B, "Shock", [player(A)]);
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(18);
  });
});

describe("Sword of Wealth and Power", () => {
  it("+2/+2 and protection from instants and sorceries", () => {
    const { game } = setUpScripted();
    const sword = spawn(game, "Sword of Wealth and Power");
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({ type: "activate-ability", player: A, source: sword, abilityIndex: 0, targets: [obj(bears)] });
    game.advanceUntil(quiet);
    expect(game.characteristics(bears).power).toBe(4);
    expect([...game.characteristics(bears).protectionFrom.types].sort()).toEqual(["instant", "sorcery"]);
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand");
    expect(() => game.dispatch({ type: "cast-spell", player: A, card: bolt, targets: [obj(bears)] })).toThrow();
  });

  it("combat damage to a player: a Treasure, and the next instant or sorcery this turn is copied", () => {
    const { game, a } = setUpScripted();
    const sword = spawn(game, "Sword of Wealth and Power");
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({ type: "activate-ability", player: A, source: sword, abilityIndex: 0, targets: [obj(bears)] });
    game.advanceUntil(quiet);
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(16);
    expect(named(game, "Treasure Token", A)).toHaveLength(1);
    cast(game, A, "Lightning Bolt", [player(B)]);
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(10);
    // Only the next one.
    cast(game, A, "Shock", [player(B)]);
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(8);
  });
});

describe("Electroduplicate", () => {
  it("makes a hasty token copy that's sacrificed at the end step; flashback does it again", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const spell = cast(game, A, "Electroduplicate", [obj(bears)]);
    game.advanceUntil(quiet);
    const copies = named(game, "Grizzly Bears", A).filter((id) => game.state.objects[id].isToken);
    expect(copies).toHaveLength(1);
    expect(game.characteristics(copies[0]).keywords).toContain("haste");
    expect(zoneOf(game, spell)).toBe("graveyard");

    game.dispatch({ type: "cast-spell", player: A, card: spell, targets: [obj(bears)], via: "flashback" });
    game.advanceUntil(quiet);
    expect(zoneOf(game, spell)).toBe("exile");
    expect(copyTokens(game, "Grizzly Bears")).toBe(2);

    game.advanceUntil((s) => s.turn.step === "cleanup" || (s.turn.number === 2 && s.turn.step === "upkeep"));
    expect(copyTokens(game, "Grizzly Bears")).toBe(0);
    expect(zoneOf(game, bears)).toBe("battlefield");
  });

  it("a copy of the token has haste and the sacrifice trigger too (copiable values)", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears");
    cast(game, A, "Electroduplicate", [obj(bears)]);
    game.advanceUntil(quiet);
    const token = named(game, "Grizzly Bears", A).find((id) => game.state.objects[id].isToken)!;
    game.debugApplyEffect(A, { kind: "create-token-copy", of: 0, count: 1 }, [obj(token)]);
    expect(copyTokens(game, "Grizzly Bears")).toBe(2);
    for (const id of named(game, "Grizzly Bears", A).filter((i) => game.state.objects[i].isToken)) {
      expect(game.characteristics(id).keywords).toContain("haste");
    }
    game.advanceUntil((s) => s.turn.step === "cleanup" || (s.turn.number === 2 && s.turn.step === "upkeep"));
    expect(copyTokens(game, "Grizzly Bears")).toBe(0);
  });
});

describe("Inalla, Archmage Ritualist", () => {
  const wizardFromHand = (game: Game): ObjectId => cast(game, A, "Prodigal Sorcerer");

  it("eminence from the command zone: pay {1} for a hasty token copy of the Wizard, exiled at the end step", () => {
    const game = setUp({ commanders: ["Inalla, Archmage Ritualist"] });
    expect(game.state.zones.shared.command.some((id) => game.state.objects[id].cardName === "Inalla, Archmage Ritualist")).toBe(true);
    wizardFromHand(game);
    game.advanceUntil(settle);
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    const sorcerers = named(game, "Prodigal Sorcerer", A);
    expect(sorcerers).toHaveLength(2);
    const token = sorcerers.find((id) => game.state.objects[id].isToken)!;
    // Haste: its {T} ability works the turn it arrived.
    game.dispatch({ type: "activate-ability", player: A, source: token, abilityIndex: 0, targets: [player(B)] });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(19);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(named(game, "Prodigal Sorcerer", A)).toHaveLength(1);
  });

  it("declined, or for a token Wizard, makes nothing", () => {
    const game = setUp();
    spawn(game, "Inalla, Archmage Ritualist");
    wizardFromHand(game);
    game.advanceUntil(settle);
    game.dispatch({ type: "choose-modes", player: A, modes: [] });
    game.advanceUntil(quiet);
    expect(named(game, "Prodigal Sorcerer", A)).toHaveLength(1);
    // A token Wizard entering doesn't trigger it.
    game.debugApplyEffect(A, { kind: "create-token-copy", of: 0, count: 1 }, [obj(named(game, "Prodigal Sorcerer", A)[0])]);
    game.advanceUntil(settle);
    expect(game.state.awaiting).toBeNull();
  });

  it("the haste it gains isn't copiable: a copy of the token doesn't have it", () => {
    const game = setUp();
    spawn(game, "Inalla, Archmage Ritualist");
    wizardFromHand(game);
    game.advanceUntil(settle);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    const token = named(game, "Prodigal Sorcerer", A).find((id) => game.state.objects[id].isToken)!;
    expect(game.characteristics(token).keywords).toContain("haste");
    game.debugApplyEffect(A, { kind: "create-token-copy", of: 0, count: 1 }, [obj(token)]);
    const second = named(game, "Prodigal Sorcerer", A).find((id) => id !== token && game.state.objects[id].isToken)!;
    expect(game.characteristics(second).keywords).not.toContain("haste");
  });

  it("Hate Mirage's tokens gain haste the same way: a copy of one doesn't", () => {
    const game = setUp();
    const theirs = spawn(game, "Grizzly Bears", B);
    const mirage = game.debugSpawn("Hate Mirage", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: mirage, targets: [obj(theirs), null] });
    game.advanceUntil(quiet);
    const token = named(game, "Grizzly Bears", A).find((id) => game.state.objects[id].isToken)!;
    expect(game.characteristics(token).keywords).toContain("haste");
    game.debugApplyEffect(A, { kind: "create-token-copy", of: 0, count: 1 }, [obj(token)]);
    const copy = named(game, "Grizzly Bears", A).find((id) => id !== token && game.state.objects[id].isToken)!;
    expect(game.characteristics(copy).keywords).not.toContain("haste");
  });

  it("taps five untapped Wizards, Inalla and new ones included: target player loses 7", () => {
    const game = setUp();
    const inalla = spawn(game, "Inalla, Archmage Ritualist");
    const wizards = [0, 1, 2, 3].map(() => game.debugSpawn("Prodigal Sorcerer", A, "battlefield"));
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: inalla,
      abilityIndex: 0,
      targets: [player(B)],
      tap: [inalla, ...wizards],
    });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(13);
    for (const id of [inalla, ...wizards]) expect(game.state.objects[id].tapped).toBe(true);
  });
});

/** Play everything out, every copy keeping the targets it has (rule
 * 707.10c's "may" declined). */
const settleKeeping = (game: Game): void => {
  for (;;) {
    game.advanceUntil(settle);
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-targets" || awaiting.current === undefined) return;
    game.dispatch({ type: "choose-targets", player: awaiting.player, targets: [...awaiting.current] });
  }
};
/** The ability objects on the stack. */
const abilitiesOnStack = (game: Game): ObjectId[] =>
  game.state.zones.shared.stack.filter((id) => game.state.objects[id].kind === "ability");

describe("Thousand-Year Storm", () => {
  it("copies each instant or sorcery once per earlier one you cast this turn, creatures not counted", () => {
    const game = setUp();
    spawn(game, "Thousand-Year Storm");
    cast(game, A, "Lightning Bolt", [player(B)]);
    settleKeeping(game);
    expect(life(game, B)).toBe(17);
    cast(game, A, "Grizzly Bears");
    settleKeeping(game);
    cast(game, A, "Shock", [player(B)]);
    settleKeeping(game);
    expect(life(game, B)).toBe(17 - 2 * 2);
    cast(game, A, "Lightning Bolt", [player(B)]);
    settleKeeping(game);
    expect(life(game, B)).toBe(13 - 3 * 3);
    expect(game.eventsOfType("spell-copied")).toHaveLength(3);
  });

  it("counts as it triggers: a spell cast in response doesn't add to an earlier one's copies", () => {
    const game = setUp();
    spawn(game, "Thousand-Year Storm");
    cast(game, A, "Lightning Bolt", [player(B)]);
    // Holding priority over the Bolt and its trigger (which counted none).
    cast(game, A, "Shock", [player(B)]);
    settleKeeping(game);
    // Bolt 3, Shock 2 and one copy of the Shock: the Bolt's trigger stays 0.
    expect(life(game, B)).toBe(20 - 3 - 2 - 2);
  });

  it("each copy may get its own new target", () => {
    const game = setUp();
    spawn(game, "Thousand-Year Storm");
    const bears = spawn(game, "Grizzly Bears", B);
    cast(game, A, "Shock", [player(B)]);
    settleKeeping(game);
    cast(game, A, "Shock", [player(B)]);
    game.advanceUntil(settle);
    chooseCopyTargets(game, A, [obj(bears)]);
    game.advanceUntil(quiet);
    expect(zoneOf(game, bears)).toBe("graveyard");
    expect(life(game, B)).toBe(16);
  });
});

describe("Thunderclap Drake", () => {
  it("copies the next instant or sorcery once for each time you've cast your commanders from the command zone", () => {
    const game = setUp({ commanders: ["Kitsa, Otterball Elite"] });
    game.state.players[A].commanderCastCounts["Kitsa, Otterball Elite"] = 2;
    const drake = spawn(game, "Thunderclap Drake");
    game.dispatch({ type: "activate-ability", player: A, source: drake, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, drake)).toBe("graveyard");
    cast(game, A, "Lightning Bolt", [player(B)]);
    settleKeeping(game);
    expect(life(game, B)).toBe(20 - 3 * 3);
    // Only the next one.
    cast(game, A, "Lightning Bolt", [player(B)]);
    settleKeeping(game);
    expect(life(game, B)).toBe(8);
  });

  it("with no commander cast, copies nothing", () => {
    const game = setUp();
    const drake = spawn(game, "Thunderclap Drake");
    game.dispatch({ type: "activate-ability", player: A, source: drake, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    cast(game, A, "Lightning Bolt", [player(B)]);
    settleKeeping(game);
    expect(life(game, B)).toBe(17);
    expect(game.eventsOfType("spell-copied")).toHaveLength(0);
  });
});

describe("Primal Amulet // Primal Wellspring", () => {
  const amuletWithCounters = (game: Game, n: number): ObjectId => {
    const amulet = spawn(game, "Primal Amulet");
    game.state.objects[amulet].counters.charge = n;
    return amulet;
  };

  it("the fourth charge counter lets you remove them all and transform it", () => {
    const game = setUp();
    const amulet = amuletWithCounters(game, 3);
    cast(game, A, "Lightning Bolt", [player(B)]);
    game.advanceUntil(settle);
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    expect(game.characteristics(amulet).types).toEqual(["land"]);
    expect(game.state.objects[amulet].counters.charge ?? 0).toBe(0);
  });

  it("declined, it keeps the counters and stays an Amulet", () => {
    const game = setUp();
    const amulet = amuletWithCounters(game, 3);
    cast(game, A, "Lightning Bolt", [player(B)]);
    game.advanceUntil(settle);
    game.dispatch({ type: "choose-modes", player: A, modes: [] });
    game.advanceUntil(quiet);
    expect(game.characteristics(amulet).types).toEqual(["artifact"]);
    expect(game.state.objects[amulet].counters.charge).toBe(4);
  });

  /** A Wellspring (an Amulet transformed), its mana floating in A's pool. */
  const floatWellspringMana = (game: Game): void => {
    const amulet = amuletWithCounters(game, 0);
    game.debugApplyEffect(A, { kind: "transform", target: 0 }, [obj(amulet)]);
    expect(game.characteristics(amulet).types).toEqual(["land"]);
    game.dispatch({ type: "activate-ability", player: A, source: amulet, abilityIndex: 0, targets: [], manaColors: ["R"] });
    expect(game.state.players[A].manaPool).toHaveLength(1);
  };

  it("Wellspring's mana spent on an instant copies it", () => {
    const game = setUp();
    floatWellspringMana(game);
    cast(game, A, "Lightning Bolt", [player(B)]);
    settleKeeping(game);
    expect(life(game, B)).toBe(14);
    expect(game.eventsOfType("spell-copied")).toHaveLength(1);
  });

  it("copies the spell even when it's countered before the rider resolves", () => {
    const game = setUp();
    floatWellspringMana(game);
    const bolt = cast(game, A, "Lightning Bolt", [player(B)]);
    game.advanceUntil((s) => s.pendingTriggers.length === 0 && s.zones.shared.stack.length === 2);
    cast(game, A, "Counterspell", [obj(bolt)]);
    settleKeeping(game);
    expect(zoneOf(game, bolt)).toBe("graveyard");
    // The Bolt itself never resolved; its copy did.
    expect(life(game, B)).toBe(17);
  });
});

describe("Lithoform Engine", () => {
  it("copies an activated ability you control, which may get a new target", () => {
    const game = setUp();
    const engine = spawn(game, "Lithoform Engine");
    const sorcerer = spawn(game, "Prodigal Sorcerer");
    const elves = spawn(game, "Llanowar Elves", B);
    game.dispatch({ type: "activate-ability", player: A, source: sorcerer, abilityIndex: 0, targets: [player(B)] });
    const ability = abilitiesOnStack(game)[0];
    game.dispatch({ type: "activate-ability", player: A, source: engine, abilityIndex: 0, targets: [obj(ability)] });
    game.advanceUntil(settle);
    chooseCopyTargets(game, A, [obj(elves)]);
    game.advanceUntil(quiet);
    expect(zoneOf(game, elves)).toBe("graveyard");
    expect(life(game, B)).toBe(19);
    // The copy's source is the Sorcerer's (rule 707.10b).
    const hit = game.eventsOfType("damage-dealt").find((e) => e.target.kind === "object" && e.target.object === elves);
    expect(hit?.source).toBe(sorcerer);
    expect(game.eventsOfType("ability-copied")).toHaveLength(1);
  });

  it("can't copy an opponent's ability", () => {
    const game = setUp();
    const engine = spawn(game, "Lithoform Engine");
    const theirs = spawn(game, "Prodigal Sorcerer", B);
    passTo(game, A);
    game.dispatch({ type: "activate-ability", player: B, source: theirs, abilityIndex: 0, targets: [player(A)] });
    passTo(game, B);
    const ability = abilitiesOnStack(game)[0];
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: engine, abilityIndex: 0, targets: [obj(ability)] }),
    ).toThrow();
  });

  it("copies a triggered ability with its trigger object, and a permanent spell into a token", () => {
    const game = setUp();
    const engine = spawn(game, "Lithoform Engine");
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.debugSpawn("Elvish Visionary", A, "battlefield", { announceEntry: true });
    // Its trigger goes on the stack with A still holding priority.
    (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(A);
    expect(abilitiesOnStack(game)).toHaveLength(1);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: engine,
      abilityIndex: 0,
      targets: [obj(abilitiesOnStack(game)[0])],
    });
    settleKeeping(game);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand + 2);

    // The {4} ability, the Engine untapped again (a second one would meet the
    // legend rule).
    game.state.objects[engine].tapped = false;
    const bears = cast(game, A, "Grizzly Bears");
    game.dispatch({ type: "activate-ability", player: A, source: engine, abilityIndex: 2, targets: [obj(bears)] });
    settleKeeping(game);
    const all = named(game, "Grizzly Bears", A);
    expect(all).toHaveLength(2);
    expect(all.filter((id) => game.state.objects[id].isToken)).toHaveLength(1);
  });
});

describe("Weaver of Harmony", () => {
  it("other enchantment creatures you control get +1/+1", () => {
    const game = setUp();
    const weaver = spawn(game, "Weaver of Harmony");
    const other = spawn(game, "Weaver of Harmony");
    const bears = spawn(game, "Grizzly Bears");
    expect(game.characteristics(weaver).power).toBe(3);
    expect(game.characteristics(other).power).toBe(3);
    expect(game.characteristics(bears).power).toBe(2);
  });

  it("copies an ability from an enchantment source — a linked exile whose cards all come back", () => {
    const game = setUp();
    const weaver = spawn(game, "Weaver of Harmony");
    const first = spawn(game, "Grizzly Bears", B);
    const second = spawn(game, "Llanowar Elves", B);
    const light = cast(game, A, "Banishing Light");
    game.advanceUntil(settle);
    expect(game.state.awaiting?.kind).toBe("choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(first)] });
    const trigger = abilitiesOnStack(game)[0];
    expect(game.state.objects[trigger].sourceObjectId).toBe(light);
    game.dispatch({ type: "activate-ability", player: A, source: weaver, abilityIndex: 0, targets: [obj(trigger)] });
    game.advanceUntil(settle);
    chooseCopyTargets(game, A, [obj(second)]);
    game.advanceUntil(quiet);
    expect(zoneOf(game, first)).toBe("exile");
    expect(zoneOf(game, second)).toBe("exile");
    // Both linked to the one Banishing Light (the ruling): both come back.
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(light)]);
    game.advanceUntil(quiet);
    expect(zoneOf(game, first)).toBe("battlefield");
    expect(zoneOf(game, second)).toBe("battlefield");
  });

  it("can't copy an ability from a non-enchantment source", () => {
    const game = setUp();
    const weaver = spawn(game, "Weaver of Harmony");
    const sorcerer = spawn(game, "Prodigal Sorcerer");
    game.dispatch({ type: "activate-ability", player: A, source: sorcerer, abilityIndex: 0, targets: [player(B)] });
    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: weaver,
        abilityIndex: 0,
        targets: [obj(abilitiesOnStack(game)[0])],
      }),
    ).toThrow();
  });
});

describe("Virtue of Knowledge // Vantress Visions", () => {
  it("a permanent entering makes your permanents' abilities trigger an additional time", () => {
    const game = setUp();
    spawn(game, "Virtue of Knowledge");
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.debugSpawn("Elvish Visionary", A, "battlefield", { announceEntry: true });
    settleKeeping(game);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand + 2);
  });

  it("doesn't double a commander's eminence from the command zone — not a permanent's ability", () => {
    const game = setUp({ commanders: ["Inalla, Archmage Ritualist"] });
    spawn(game, "Virtue of Knowledge");
    cast(game, A, "Prodigal Sorcerer");
    game.advanceUntil(settle);
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(settle);
    // Asked once, not twice.
    expect(game.state.awaiting).toBeNull();
    expect(named(game, "Prodigal Sorcerer", A)).toHaveLength(2);
  });

  it("Vantress Visions copies an ability you control, then waits in exile as an adventure", () => {
    const game = setUp();
    const sorcerer = spawn(game, "Prodigal Sorcerer");
    game.dispatch({ type: "activate-ability", player: A, source: sorcerer, abilityIndex: 0, targets: [player(B)] });
    const visions = cast(game, A, "Virtue of Knowledge", [obj(abilitiesOnStack(game)[0])], { face: 1 });
    settleKeeping(game);
    expect(life(game, B)).toBe(18);
    expect(zoneOf(game, visions)).toBe("exile");
    expect(game.state.objects[visions].onAdventure).toBe(true);
  });
});

describe("Illusionist's Bracers", () => {
  const equipBracers = (game: Game, creature: ObjectId): ObjectId => {
    const bracers = spawn(game, "Illusionist's Bracers");
    game.dispatch({ type: "activate-ability", player: A, source: bracers, abilityIndex: 0, targets: [obj(creature)] });
    settleKeeping(game);
    expect(game.state.objects[bracers].attachedTo).toBe(creature);
    return bracers;
  };

  it("copies each ability the equipped creature activates, the copy may get a new target", () => {
    const game = setUp();
    const sorcerer = spawn(game, "Prodigal Sorcerer");
    equipBracers(game, sorcerer);
    const elves = spawn(game, "Llanowar Elves", B);
    game.dispatch({ type: "activate-ability", player: A, source: sorcerer, abilityIndex: 0, targets: [player(B)] });
    game.advanceUntil(settle);
    chooseCopyTargets(game, A, [obj(elves)]);
    game.advanceUntil(quiet);
    expect(zoneOf(game, elves)).toBe("graveyard");
    expect(life(game, B)).toBe(19);
  });

  it("still copies an ability countered in response, as it last was", () => {
    const game = setUp();
    const sorcerer = spawn(game, "Prodigal Sorcerer");
    equipBracers(game, sorcerer);
    game.dispatch({ type: "activate-ability", player: A, source: sorcerer, abilityIndex: 0, targets: [player(B)] });
    game.advanceUntil((s) => s.pendingTriggers.length === 0 && abilitiesOnStack(game).length === 2);
    const [ability] = abilitiesOnStack(game);
    cast(game, A, "Sublime Epiphany", [obj(ability)], { modes: [1] });
    settleKeeping(game);
    expect(game.state.objects[ability]).toBeUndefined();
    expect(life(game, B)).toBe(19);
  });

  it("doesn't see a mana ability, or an ability whose cost sacrificed the creature", () => {
    const game = setUp();
    const elves = spawn(game, "Llanowar Elves");
    equipBracers(game, elves);
    game.dispatch({ type: "activate-ability", player: A, source: elves, abilityIndex: 0, targets: [] });
    game.advanceUntil(settle);
    expect(game.state.zones.shared.stack).toHaveLength(0);
    expect(game.state.pendingTriggers).toHaveLength(0);

    const elder = spawn(game, "Sakura-Tribe Elder");
    equipBracers(game, elder);
    game.dispatch({ type: "activate-ability", player: A, source: elder, abilityIndex: 0, targets: [] });
    game.advanceUntil((s) => s.pendingTriggers.length === 0);
    expect(abilitiesOnStack(game)).toHaveLength(1);
    expect(game.eventsOfType("ability-copied")).toHaveLength(0);
  });
});

describe("Sink into Stupor // Soporific Springs", () => {
  it("returns an opponent's spell to its owner's hand — it never resolves", () => {
    const game = setUp();
    passTo(game, A);
    const bolt = cast(game, B, "Lightning Bolt", [player(A)]);
    passTo(game, B);
    cast(game, A, "Sink into Stupor", [obj(bolt)]);
    game.advanceUntil(quiet);
    expect(zoneOf(game, bolt)).toBe("hand");
    expect(game.state.objects[bolt].owner).toBe(B);
    expect(life(game, A)).toBe(20);
  });

  it("or an opponent's nonland permanent; not a land of theirs, nor anything of yours", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    cast(game, A, "Sink into Stupor", [obj(bears)]);
    game.advanceUntil(quiet);
    expect(zoneOf(game, bears)).toBe("hand");

    const land = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].controller === B && game.state.objects[id].cardName === "Island",
    )!;
    const mine = spawn(game, "Grizzly Bears", A);
    for (const target of [land, mine]) {
      const card = game.debugSpawn("Sink into Stupor", A, "hand");
      expect(() => game.dispatch({ type: "cast-spell", player: A, card, targets: [obj(target)] })).toThrow();
    }
    const ownBolt = cast(game, A, "Lightning Bolt", [player(B)]);
    const card = game.debugSpawn("Sink into Stupor", A, "hand");
    expect(() => game.dispatch({ type: "cast-spell", player: A, card, targets: [obj(ownBolt)] })).toThrow();
  });

  it("Soporific Springs enters tapped unless its controller pays 3 life", () => {
    const game = setUp();
    const card = game.debugSpawn("Sink into Stupor", A, "hand");
    game.dispatch({ type: "play-land", player: A, card, face: 1 });
    expect(game.state.awaiting).toMatchObject({ kind: "pay-life-for-untapped", life: 3 });
    game.dispatch({ type: "pay-life-for-untapped", player: A, pay: true });
    expect(game.state.objects[card].tapped).toBe(false);
    expect(life(game, A)).toBe(17);
    expect(game.characteristics(card).types).toEqual(["land"]);
  });
});

describe("Chain of Vapor", () => {
  const landsOf = (game: Game, p: PlayerId): ObjectId[] =>
    game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].controller === p && game.characteristics(id).types.includes("land"),
    );
  /** The bounced permanent's controller answers "sacrifice a land?" — with
   * which land, if asked. */
  const answerSacrifice = (game: Game, p: PlayerId, take: boolean): void => {
    game.advanceUntil(settle);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-modes");
    expect(awaiting?.kind === "choose-modes" ? awaiting.player : null).toBe(p);
    game.dispatch({ type: "choose-modes", player: p, modes: take ? [0] : [] });
    game.advanceUntil(settle);
    const next = game.state.awaiting;
    if (take && next?.kind === "sacrifice") {
      game.dispatch({ type: "sacrifice", player: p, permanents: [next.eligible[0]] });
      game.advanceUntil(settle);
    }
  };

  it("the bounced permanent's controller may sacrifice a land to copy it, aimed and controlled by them", () => {
    const game = setUp();
    const theirs = spawn(game, "Grizzly Bears", B);
    const mine = spawn(game, "Grizzly Bears", A);
    const lands = landsOf(game, B).length;
    cast(game, A, "Chain of Vapor", [obj(theirs)]);
    answerSacrifice(game, B, true);
    expect(zoneOf(game, theirs)).toBe("hand");
    expect(landsOf(game, B)).toHaveLength(lands - 1);
    // B may copy it, choosing a new target for the copy.
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: B, modes: [0] });
    game.advanceUntil(settle);
    chooseCopyTargets(game, B, [obj(mine)]);
    expect(game.eventsOfType("spell-copied")[0].controller).toBe(B);
    // The copy resolves: A, whose Bears it bounced, may carry on — and doesn't.
    answerSacrifice(game, A, false);
    game.advanceUntil(quiet);
    expect(zoneOf(game, mine)).toBe("hand");
    expect(game.eventsOfType("spell-copied")).toHaveLength(1);
  });

  it("declined, nothing more happens", () => {
    const game = setUp();
    const theirs = spawn(game, "Grizzly Bears", B);
    const lands = landsOf(game, B).length;
    cast(game, A, "Chain of Vapor", [obj(theirs)]);
    answerSacrifice(game, B, false);
    game.advanceUntil(quiet);
    expect(zoneOf(game, theirs)).toBe("hand");
    expect(landsOf(game, B)).toHaveLength(lands);
    expect(game.eventsOfType("spell-copied")).toHaveLength(0);
  });
});

describe("Wandering Archaic // Explore the Vastlands", () => {
  /** B casts a Bolt at A, A's Archaic triggers; B answers its "pay {2}?". */
  const opponentBolts = (game: Game, pays: boolean): void => {
    passTo(game, A);
    cast(game, B, "Lightning Bolt", [player(A)]);
    passTo(game, B);
    game.advanceUntil(settle);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-modes");
    expect(awaiting?.kind === "choose-modes" ? awaiting.player : null).toBe(B);
    game.dispatch({ type: "choose-modes", player: B, modes: pays ? [0] : [] });
  };

  it("an opponent who doesn't pay {2} lets you copy their instant, with a new target", () => {
    const game = setUp();
    spawn(game, "Wandering Archaic");
    opponentBolts(game, false);
    game.advanceUntil(settle);
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(settle);
    chooseCopyTargets(game, A, [player(B)]);
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(17);
    expect(life(game, A)).toBe(17);
    expect(game.eventsOfType("spell-copied")[0].controller).toBe(A);
  });

  it("paid, there's no copy", () => {
    const game = setUp();
    spawn(game, "Wandering Archaic");
    opponentBolts(game, true);
    game.advanceUntil(quiet);
    expect(game.eventsOfType("spell-copied")).toHaveLength(0);
    expect(life(game, A)).toBe(17);
  });

  it("each player, in turn, takes a land and an instant or sorcery from their own top five, then gains 3", () => {
    const game = setUp();
    // Tops of the libraries, the last spawned on top.
    for (const name of ["Island", "Grizzly Bears", "Shock", "Forest", "Opt"]) game.debugSpawn(name, A, "library");
    for (const name of ["Island", "Grizzly Bears", "Lightning Bolt", "Swamp", "Divination"]) game.debugSpawn(name, B, "library");
    const handA = game.state.zones.perPlayer[A].hand.length;
    const handB = game.state.zones.perPlayer[B].hand.length;
    const libA = game.state.zones.perPlayer[A].library.length;
    cast(game, A, "Wandering Archaic", [], { face: 1 });
    const pick = (p: PlayerId, name: string | null): void => {
      game.advanceUntil(settle);
      const awaiting = game.state.awaiting;
      expect(awaiting?.kind).toBe("choose-from-zone");
      if (awaiting?.kind !== "choose-from-zone") return;
      expect(awaiting.player).toBe(p);
      const id = name === null ? undefined : awaiting.eligible.find((e) => game.state.objects[e].cardName === name);
      game.dispatch({ type: "choose-from-zone", player: p, chosen: id === undefined ? [] : [id] });
    };
    // The active player first: a land, then an instant or sorcery.
    pick(A, "Forest");
    pick(A, "Shock");
    pick(B, "Swamp");
    pick(B, null);
    game.advanceUntil(quiet);
    const handNames = (p: PlayerId): string[] =>
      game.state.zones.perPlayer[p].hand.map((id) => game.state.objects[id].cardName);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(handA + 2);
    expect(handNames(A)).toEqual(expect.arrayContaining(["Forest", "Shock"]));
    expect(game.state.zones.perPlayer[B].hand.length).toBe(handB + 1);
    expect(handNames(B)).toContain("Swamp");
    expect(life(game, A)).toBe(23);
    expect(life(game, B)).toBe(23);
    // The rest went to the bottom: A's top card is no longer one of them.
    expect(game.state.zones.perPlayer[A].library.length).toBe(libA - 2);
    const bottom = game.state.zones.perPlayer[A].library.slice(-3).map((id) => game.state.objects[id].cardName);
    expect([...bottom].sort()).toEqual(["Grizzly Bears", "Island", "Opt"]);
    // Both of A's picks were revealed, the second one too.
    const revealed = game.eventsOfType("cards-revealed").flatMap((e) => e.objects);
    expect(revealed.map((id) => game.state.objects[id].cardName)).toEqual(
      expect.arrayContaining(["Forest", "Shock", "Swamp"]),
    );
  });
});
