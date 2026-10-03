/**
 * The Tarkir: Dragonstorm precons' remaining stand-ins and the small
 * features they needed: Baldin, Century Herdmaster (an any-number group
 * capped at 100, damage by toughness during your turn), Disciple of Bolas
 * and Tip the Scales (the sacrificed creature's power or toughness, and a
 * reflexive ability that carries it), Canopy Gargantuan (counters equal to
 * each creature's own toughness), Tree of Redemption (exchanging a life
 * total with a toughness — rule 701.12g).
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { activePlayerOf } from "../state.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const setUp = (library: readonly string[] = []) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: [...library, ...Array<string>(40).fill("Island")] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const [land, n] of [["Mountain", 10], ["Island", 6], ["Plains", 6], ["Swamp", 6], ["Forest", 6]] as const) {
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
const activate = (game: Game, source: ObjectId, abilityIndex = 0, targets: TargetRef[] = []) =>
  game.dispatch({ type: "activate-ability", player: A, source, abilityIndex, targets });
const handSize = (game: Game, who: PlayerId = A): number => game.state.zones.perPlayer[who].hand.length;
const ready = (game: Game, name: string, who: PlayerId = A): ObjectId => {
  const id = game.debugSpawn(name, who, "battlefield");
  game.state.objects[id].summoningSick = false;
  return id;
};
const life = (game: Game, who: PlayerId = A): number => game.state.players[who].life;

describe("Baldin, Century Herdmaster", () => {
  it("makes every creature deal combat damage by toughness, but only during its controller's turn", () => {
    const game = setUp();
    ready(game, "Baldin, Century Herdmaster");
    const mine = ready(game, "Giant Spider");
    const theirs = ready(game, "Giant Spider", B);
    expect(game.characteristics(mine).damageByToughness).toBe(true);
    expect(game.characteristics(theirs).damageByToughness).toBe(true);
    game.advanceUntil((s) => activePlayerOf(s) === B && s.turn.step === "precombat-main");
    expect(game.characteristics(mine).damageByToughness).toBe(false);
    expect(game.characteristics(theirs).damageByToughness).toBe(false);
  });

  it("gives any number of targets +0/+X, X the cards in hand as it resolves, and they hit for it", () => {
    const game = setUp();
    const baldin = ready(game, "Baldin, Century Herdmaster");
    const bears = ready(game, "Grizzly Bears");
    const other = ready(game, "Grizzly Bears");
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: baldin, defender: B },
        { attacker: bears, defender: B },
      ],
    });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets");
    // Three targets, the creature that isn't attacking among them.
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(baldin), obj(bears), obj(other)] });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.pendingTriggers.length === 0);
    const x = handSize(game);
    expect(game.characteristics(baldin).toughness).toBe(7 + x);
    expect(game.characteristics(bears).toughness).toBe(2 + x);
    expect(game.characteristics(other).toughness).toBe(2 + x);
    expect(game.characteristics(bears).power).toBe(2);
    game.advanceUntil((s) => s.turn.step === "end-of-combat" || s.result.over);
    // Each dealt its toughness: Baldin's 0 power doesn't matter.
    expect(life(game, B)).toBe(20 - (7 + x) - (2 + x));
  });

  it("refuses a hundred and first target", () => {
    const game = setUp();
    const baldin = ready(game, "Baldin, Century Herdmaster");
    const spec = game.registry.get("Baldin, Century Herdmaster").triggered[0].targets[0];
    expect(spec).toEqual({ kind: "any-number", of: "creature", max: 100 });
    expect(baldin).toBeDefined();
  });
});

describe("Disciple of Bolas", () => {
  it("sacrifices another creature, and gains and draws its power as it last existed", () => {
    const game = setUp();
    const wurm = ready(game, "Craw Wurm");
    // +2/+0 until end of turn: an 8-power Wurm as it's sacrificed.
    game.debugApplyEffect(
      A,
      { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
      [obj(wurm)],
    );
    const disciple = cast(game, "Disciple of Bolas");
    const hand = handSize(game);
    game.advanceUntil(quiet);
    expect(game.state.objects[wurm].zone).toBe("graveyard");
    expect(game.state.objects[disciple].zone).toBe("battlefield");
    expect(life(game)).toBe(28);
    expect(handSize(game)).toBe(hand + 8);
  });

  it("does nothing with no other creature to sacrifice", () => {
    const game = setUp();
    const disciple = cast(game, "Disciple of Bolas");
    const hand = handSize(game);
    game.advanceUntil(quiet);
    expect(game.state.objects[disciple].zone).toBe("battlefield");
    expect(life(game)).toBe(20);
    expect(handSize(game)).toBe(hand);
  });

  it("lets its controller choose which other creature", () => {
    const game = setUp();
    const wurm = ready(game, "Craw Wurm");
    const bears = ready(game, "Grizzly Bears");
    cast(game, "Disciple of Bolas");
    const hand = handSize(game);
    game.advanceUntil((s) => s.awaiting?.kind === "sacrifice" || quiet(s));
    expect(game.state.awaiting?.kind).toBe("sacrifice");
    game.dispatch({ type: "sacrifice", player: A, permanents: [bears] });
    game.advanceUntil(quiet);
    expect(game.state.objects[wurm].zone).toBe("battlefield");
    expect(life(game)).toBe(22);
    expect(handSize(game)).toBe(hand + 2);
  });
});

describe("Tip the Scales", () => {
  it("sacrifices a creature, then a reflexive ability gives all creatures -X/-X, X its toughness", () => {
    const game = setUp();
    const wurm = ready(game, "Craw Wurm"); // 6/4
    game.debugApplyEffect(
      A,
      { kind: "modify-pt", target: 0, power: 0, toughness: 1, duration: "end-of-turn" },
      [obj(wurm)],
    );
    const angel = ready(game, "Serra Angel", B); // 4/4
    const dreadmaw = ready(game, "Colossal Dreadmaw", B); // 6/6
    cast(game, "Tip the Scales");
    // The spell resolves; its reflexive ability waits on the stack, X known.
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 || s.pendingTriggers.length > 0 ||
      s.zones.shared.stack.some((id) => s.objects[id].kind === "ability"));
    game.advanceUntil((s) => s.zones.shared.stack.some((id) => s.objects[id].kind === "ability") || quiet(s));
    const ability = game.state.zones.shared.stack.find((id) => game.state.objects[id].kind === "ability");
    expect(ability).toBeDefined();
    expect(game.state.objects[ability!].triggerValue).toBe(5);
    game.advanceUntil(quiet);
    expect(game.state.objects[wurm].zone).toBe("graveyard");
    expect(game.state.objects[angel].zone).toBe("graveyard");
    expect(game.state.objects[dreadmaw].zone).toBe("battlefield");
    expect(game.characteristics(dreadmaw).power).toBe(1);
  });

  it("does nothing at all without a creature to sacrifice", () => {
    const game = setUp();
    const angel = ready(game, "Serra Angel", B);
    cast(game, "Tip the Scales");
    game.advanceUntil(quiet);
    expect(game.state.objects[angel].zone).toBe("battlefield");
    expect(game.characteristics(angel).toughness).toBe(4);
  });
});

describe("Canopy Gargantuan", () => {
  it("puts counters on each other creature you control equal to its own toughness, at your upkeep", () => {
    const game = setUp();
    const gargantuan = ready(game, "Canopy Gargantuan");
    const spider = ready(game, "Giant Spider"); // 2/4
    const bears = ready(game, "Grizzly Bears"); // 2/2
    const theirs = ready(game, "Grizzly Bears", B);
    game.advanceUntil((s) => activePlayerOf(s) === A && s.turn.number === 3 && s.turn.step === "draw");
    expect(game.state.objects[spider].counters["+1/+1"]).toBe(4);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(2);
    expect(game.state.objects[gargantuan].counters["+1/+1"] ?? 0).toBe(0);
    expect(game.state.objects[theirs].counters["+1/+1"] ?? 0).toBe(0);
    expect(game.characteristics(spider).toughness).toBe(8);
  });
});

describe("Tree of Redemption", () => {
  it("exchanges your life total with its toughness", () => {
    const game = setUp();
    const tree = ready(game, "Tree of Redemption");
    activate(game, tree);
    game.advanceUntil(quiet);
    expect(life(game)).toBe(13);
    expect(game.characteristics(tree).toughness).toBe(20);
    // For good, not until end of turn.
    game.advanceUntil((s) => activePlayerOf(s) === B && s.turn.step === "precombat-main");
    expect(game.characteristics(tree).toughness).toBe(20);
  });

  it("sets the toughness under counters and bonuses, and reads the one they gave (the Lunarch Mantle ruling)", () => {
    const game = setUp();
    const tree = ready(game, "Tree of Redemption");
    game.state.objects[tree].counters["+1/+1"] = 2; // 2/15
    game.state.players[A].life = 7;
    activate(game, tree);
    game.advanceUntil(quiet);
    expect(life(game)).toBe(15);
    expect(game.characteristics(tree).toughness).toBe(9);
    expect(game.characteristics(tree).power).toBe(2);
  });

  it("does nothing once it has left and come back", () => {
    const game = setUp();
    const tree = ready(game, "Tree of Redemption");
    activate(game, tree);
    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [obj(tree)]);
    game.advanceUntil(quiet);
    expect(life(game)).toBe(20);
    expect(game.characteristics(tree).toughness).toBe(13);
  });

  it("does nothing at all when its controller can't gain the life (rule 701.12a)", () => {
    const game = setUp();
    const tree = ready(game, "Tree of Redemption");
    game.debugSpawn("The Lord of Pain", B, "battlefield");
    game.state.players[A].life = 5;
    activate(game, tree);
    game.advanceUntil(quiet);
    expect(life(game)).toBe(5);
    expect(game.characteristics(tree).toughness).toBe(13);
  });

  it("Tree of Perdition exchanges a target opponent's life total instead", () => {
    const game = setUp();
    const tree = ready(game, "Tree of Perdition");
    game.state.players[B].life = 31;
    activate(game, tree, 0, [{ kind: "player", player: B }]);
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(13);
    expect(life(game)).toBe(20);
    expect(game.characteristics(tree).toughness).toBe(31);
    // Only an opponent.
    const other = ready(game, "Tree of Perdition");
    expect(() => activate(game, other, 0, [{ kind: "player", player: A }])).toThrow();
  });

  it("still lowers a life total under a can't-gain-life effect", () => {
    const game = setUp();
    const tree = ready(game, "Tree of Redemption");
    game.debugSpawn("The Lord of Pain", B, "battlefield");
    game.state.players[A].life = 30;
    activate(game, tree);
    game.advanceUntil(quiet);
    expect(life(game)).toBe(13);
    expect(game.characteristics(tree).toughness).toBe(30);
  });
});

/** A game where A has only the permanents a test gives them. */
const bare = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  return game;
};
const pool = (game: Game, who: PlayerId = A) => game.state.players[who].manaPool.map((u) => u.type);

describe("Wall of Roots", () => {
  it("adds {G} for a -0/-1 counter, once each turn, tapped or summoning sick", () => {
    const game = bare();
    const wall = game.debugSpawn("Wall of Roots", A, "battlefield");
    game.state.objects[wall].tapped = true;
    activate(game, wall);
    expect(pool(game)).toEqual(["G"]);
    expect(game.state.objects[wall].counters["-0/-1"]).toBe(1);
    expect(game.characteristics(wall).toughness).toBe(4);
    expect(game.characteristics(wall).power).toBe(0);
    expect(() => activate(game, wall)).toThrow();
  });

  it("works again next turn, on an opponent's turn too", () => {
    const game = bare();
    const wall = game.debugSpawn("Wall of Roots", A, "battlefield");
    activate(game, wall);
    game.advanceUntil((s) => activePlayerOf(s) === B && s.turn.step === "upkeep" && s.priority.holder === B);
    game.dispatch({ type: "pass-priority", player: B });
    expect(game.state.priority.holder).toBe(A);
    activate(game, wall);
    expect(game.state.objects[wall].counters["-0/-1"]).toBe(2);
    expect(game.characteristics(wall).toughness).toBe(3);
  });

  it("dies when the counter takes its toughness to 0", () => {
    const game = bare();
    const wall = game.debugSpawn("Wall of Roots", A, "battlefield");
    game.state.objects[wall].counters["-0/-1"] = 4;
    activate(game, wall);
    expect(pool(game)).toEqual(["G"]);
    expect(game.characteristics(wall).toughness).toBe(0);
    // Spending the {G} on a spell, its controller gets priority again, and
    // the state-based actions put it into the graveyard.
    const elves = cast(game, "Llanowar Elves");
    expect(game.state.objects[elves].zone).toBe("stack");
    expect(game.state.objects[wall].zone).toBe("graveyard");
  });

  it("pays a cost through the auto-payer, last of all", () => {
    const game = bare();
    const wall = game.debugSpawn("Wall of Roots", A, "battlefield");
    const forest = game.debugSpawn("Forest", A, "battlefield");
    game.state.objects[forest].tapped = false;
    const bears = cast(game, "Grizzly Bears");
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[forest].tapped).toBe(true);
    expect(game.state.objects[wall].counters["-0/-1"]).toBe(1);
    // Once each turn: it can't pay a second spell.
    expect(() => cast(game, "Llanowar Elves")).toThrow();
  });

  it("Devoted Druid untaps for a -1/-1 counter, and dies before the untap at 0 toughness", () => {
    const game = bare();
    const druid = game.debugSpawn("Devoted Druid", A, "battlefield");
    game.state.objects[druid].summoningSick = false;
    activate(game, druid, 0);
    expect(pool(game)).toEqual(["G"]);
    expect(game.state.objects[druid].tapped).toBe(true);
    activate(game, druid, 1);
    expect(game.state.objects[druid].counters["-1/-1"]).toBe(1);
    game.advanceUntil(quiet);
    expect(game.state.objects[druid].tapped).toBe(false);
    activate(game, druid, 0);
    activate(game, druid, 1);
    game.advanceUntil(quiet);
    // The second counter made it a -2/0: gone before its untap could resolve.
    expect(game.state.objects[druid].zone).toBe("graveyard");
  });

  it("isn't used while lands can pay", () => {
    const game = bare();
    const wall = game.debugSpawn("Wall of Roots", A, "battlefield");
    for (let i = 0; i < 2; i += 1) game.state.objects[game.debugSpawn("Forest", A, "battlefield")].tapped = false;
    cast(game, "Grizzly Bears");
    game.advanceUntil(quiet);
    expect(game.state.objects[wall].counters["-0/-1"] ?? 0).toBe(0);
  });
});

describe("Weathered Sentinels", () => {
  const C = asPlayerId("carol");
  const threePlayers = () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      decks: [A, B, C].map((p) => ({ player: p, cards: Array<string>(40).fill("Island") })),
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    return game;
  };
  const toAttackers = (game: Game, who: PlayerId) =>
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" && activePlayerOf(s) === who);
  const defendersOf = (game: Game, attacker: ObjectId) => {
    const legal = game.legalActions(A).find((a) => a.kind === "declare-attackers");
    return legal !== undefined && legal.kind === "declare-attackers" ? (legal.defendersFor[attacker] ?? []) : [];
  };

  it("attacks only a player who attacked you during their last turn, and grows as it does", () => {
    const game = threePlayers();
    const sentinels = ready(game, "Weathered Sentinels");
    ready(game, "Grizzly Bears");
    const bBears = ready(game, "Grizzly Bears", B);
    const cBears = ready(game, "Grizzly Bears", C);
    toAttackers(game, A);
    expect(defendersOf(game, sentinels)).toEqual([]);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [] });
    toAttackers(game, B);
    game.dispatch({ type: "declare-attackers", player: B, attackers: [{ attacker: bBears, defender: A }] });
    // Carol attacks Bob, not you.
    toAttackers(game, C);
    game.dispatch({ type: "declare-attackers", player: C, attackers: [{ attacker: cBears, defender: B }] });
    toAttackers(game, A);
    expect(defendersOf(game, sentinels)).toEqual([B]);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: sentinels, defender: B }] });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.pendingTriggers.length === 0 &&
      s.turn.step === "declare-attackers" && s.awaiting === null);
    expect(game.characteristics(sentinels).power).toBe(5);
    expect(game.characteristics(sentinels).toughness).toBe(8);
    expect(game.characteristics(sentinels).keywords.has("indestructible")).toBe(true);
  });

  it("doesn't count an attack on your planeswalker, nor one from an earlier turn", () => {
    const game = threePlayers();
    const sentinels = ready(game, "Weathered Sentinels");
    ready(game, "Grizzly Bears");
    const walker = game.debugSpawn("Ajani, Caller of the Pride", A, "battlefield");
    const bBears = ready(game, "Grizzly Bears", B);
    const cBears = ready(game, "Grizzly Bears", C);
    toAttackers(game, A);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [] });
    toAttackers(game, B);
    game.dispatch({ type: "declare-attackers", player: B, attackers: [{ attacker: bBears, defender: walker }] });
    toAttackers(game, C);
    game.dispatch({ type: "declare-attackers", player: C, attackers: [{ attacker: cBears, defender: A }] });
    toAttackers(game, A);
    expect(defendersOf(game, sentinels)).toEqual([C]);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [] });
    // Bob's and Carol's next turns pass without an attack: nobody, now.
    toAttackers(game, B);
    game.dispatch({ type: "declare-attackers", player: B, attackers: [] });
    toAttackers(game, C);
    game.dispatch({ type: "declare-attackers", player: C, attackers: [] });
    toAttackers(game, A);
    expect(defendersOf(game, sentinels)).toEqual([]);
  });
});

describe("Colfenor's Urn", () => {
  /** Destroy `victim`, then answer the Urn's "you may exile it" with `exile`
   * if it asks. Returns whether it asked. */
  const kill = (game: Game, victim: ObjectId, exile = true): boolean => {
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(victim)]);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes" || quiet(s));
    const asked = game.state.awaiting?.kind === "choose-modes";
    if (asked) game.dispatch({ type: "choose-modes", player: A, modes: exile ? [0] : [] });
    game.advanceUntil(quiet);
    return asked;
  };

  it("exiles creatures of toughness 4 or more from your graveyard, then returns them with three", () => {
    const game = setUp();
    const urn = game.debugSpawn("Colfenor's Urn", A, "battlefield");
    const spider = ready(game, "Giant Spider");
    const angel = ready(game, "Serra Angel");
    const wurm = ready(game, "Craw Wurm");
    const bears = ready(game, "Grizzly Bears");
    const theirs = ready(game, "Serra Angel", B);
    expect(kill(game, bears)).toBe(false);
    expect(kill(game, theirs)).toBe(false);
    expect(kill(game, spider)).toBe(true);
    expect(game.state.objects[spider].zone).toBe("exile");
    expect(kill(game, angel)).toBe(true);
    // Two so far: the end step does nothing.
    game.advanceUntil((s) => s.turn.step === "end" && quiet(s));
    expect(game.state.objects[urn].zone).toBe("battlefield");
    game.advanceUntil((s) => activePlayerOf(s) === B && s.turn.step === "precombat-main");
    expect(kill(game, wurm)).toBe(true);
    game.advanceUntil((s) => s.turn.step === "end" && quiet(s));
    expect(game.state.objects[urn].zone).toBe("graveyard");
    for (const id of [spider, angel, wurm]) {
      expect(game.state.objects[id].zone).toBe("battlefield");
      expect(game.state.objects[id].controller).toBe(A);
    }
  });

  it("reads toughness as it last existed, and lets you decline", () => {
    const game = setUp();
    game.debugSpawn("Colfenor's Urn", A, "battlefield");
    const bears = ready(game, "Grizzly Bears");
    game.debugApplyEffect(
      A,
      { kind: "modify-pt", target: 0, power: 0, toughness: 2, duration: "end-of-turn" },
      [obj(bears)],
    );
    const spider = ready(game, "Giant Spider");
    expect(kill(game, bears)).toBe(true);
    expect(game.state.objects[bears].zone).toBe("exile");
    expect(kill(game, spider, false)).toBe(true);
    expect(game.state.objects[spider].zone).toBe("graveyard");
  });

  it("counts every card ever exiled with it, but returns only those still exiled", () => {
    const game = setUp();
    const urn = game.debugSpawn("Colfenor's Urn", A, "battlefield");
    const [spider, angel, wurm] = ["Giant Spider", "Serra Angel", "Craw Wurm"].map((n) => ready(game, n));
    kill(game, spider);
    kill(game, angel);
    // The Spider leaves exile: still one of the three exiled with the Urn.
    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0, from: "exile" }, [obj(spider)]);
    expect(game.state.objects[spider].zone).toBe("hand");
    kill(game, wurm);
    game.advanceUntil((s) => s.turn.step === "end" && quiet(s));
    expect(game.state.objects[urn].zone).toBe("graveyard");
    expect(game.state.objects[angel].zone).toBe("battlefield");
    expect(game.state.objects[wurm].zone).toBe("battlefield");
    expect(game.state.objects[spider].zone).toBe("hand");
  });

  it("returns nothing when it has left before the end step", () => {
    const game = setUp();
    const urn = game.debugSpawn("Colfenor's Urn", A, "battlefield");
    const ids = ["Giant Spider", "Serra Angel", "Craw Wurm"].map((n) => ready(game, n));
    for (const id of ids) kill(game, id);
    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0 }, [obj(urn)]);
    game.advanceUntil((s) => s.turn.step === "end" && quiet(s));
    for (const id of ids) expect(game.state.objects[id].zone).toBe("exile");
  });
});

const zombies = (game: Game, who: PlayerId = A) =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === "Zombie Druid Token" && game.state.objects[id].controller === who,
  );

describe("Welcome the Dead", () => {
  /** Cast it (or flash it back), discarding the first card offered. */
  const resolve = (game: Game, card: ObjectId, extra: Record<string, unknown> = {}) => {
    game.dispatch({ type: "cast-spell", player: A, card, targets: [], ...extra });
    game.advanceUntil((s) => s.awaiting?.kind === "discard" || quiet(s));
    const awaiting = game.state.awaiting;
    if (awaiting?.kind === "discard") {
      game.dispatch({ type: "discard", player: A, cards: [game.state.zones.perPlayer[A].hand[0]] });
    }
    game.advanceUntil(quiet);
  };

  it("makes a tapped Zombie for each card put into your graveyard from your hand or library this turn", () => {
    const game = setUp();
    game.debugApplyEffect(A, { kind: "mill", target: "you", amount: 2 }, []);
    // From the battlefield and an opponent's mill: neither counts.
    const bears = ready(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bears)]);
    game.debugApplyEffect(A, { kind: "mill", target: "each-opponent", amount: 3 }, []);
    const welcome = game.debugSpawn("Welcome the Dead", A, "hand");
    const hand = handSize(game);
    resolve(game, welcome);
    // Two milled and the one discarded.
    expect(zombies(game)).toHaveLength(3);
    expect(zombies(game).every((id) => game.state.objects[id].tapped)).toBe(true);
    expect(life(game)).toBe(18);
    expect(handSize(game)).toBe(hand - 1 + 2 - 1);
    expect(game.state.objects[welcome].zone).toBe("graveyard");
  });

  it("counts only this turn's, flashed back on a later turn, and exiles itself", () => {
    const game = setUp();
    const welcome = game.debugSpawn("Welcome the Dead", A, "hand");
    resolve(game, welcome);
    // The discard alone: going to the graveyard from the stack doesn't count.
    expect(zombies(game)).toHaveLength(1);
    expect(game.state.objects[welcome].zone).toBe("graveyard");
    game.advanceUntil((s) => activePlayerOf(s) === A && s.turn.number === 3 && s.turn.step === "precombat-main");
    game.debugApplyEffect(A, { kind: "mill", target: "you", amount: 1 }, []);
    resolve(game, welcome, { via: "flashback" });
    expect(zombies(game)).toHaveLength(1 + 2);
    expect(game.state.objects[welcome].zone).toBe("exile");
  });
});

describe("Essence Anchor", () => {
  it("surveils at your upkeep", () => {
    const game = setUp();
    game.debugSpawn("Essence Anchor", A, "battlefield");
    game.advanceUntil((s) => activePlayerOf(s) === A && s.turn.number === 3 && s.turn.step === "upkeep" &&
      (s.awaiting !== null || s.zones.shared.stack.length > 0));
    game.advanceUntil((s) => s.awaiting?.kind === "scry" || s.turn.step === "draw");
    expect(game.state.awaiting?.kind).toBe("scry");
  });

  it("makes a Zombie only during your turn and once a card has left your graveyard", () => {
    const game = setUp();
    const anchor = ready(game, "Essence Anchor");
    expect(() => activate(game, anchor)).toThrow();
    // An opponent's card leaving their graveyard doesn't count.
    const theirs = game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.debugApplyEffect(B, { kind: "exile-graveyard", target: 0 }, [obj(theirs)]);
    expect(() => activate(game, anchor)).toThrow();
    const mine = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0, from: "graveyard" }, [obj(mine)]);
    activate(game, anchor);
    game.advanceUntil(quiet);
    expect(zombies(game)).toHaveLength(1);
    // Not on an opponent's turn, however many cards leave.
    game.advanceUntil((s) => activePlayerOf(s) === B && s.turn.step === "upkeep" && s.priority.holder === B);
    const again = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0, from: "graveyard" }, [obj(again)]);
    game.dispatch({ type: "pass-priority", player: B });
    expect(() => activate(game, anchor)).toThrow();
  });
});

describe("Lord of the Forsaken", () => {
  it("mills a target player three for {B} and another creature", () => {
    const game = setUp();
    const lord = ready(game, "Lord of the Forsaken");
    const bears = ready(game, "Grizzly Bears");
    const library = game.state.zones.perPlayer[B].library.length;
    // Not itself: "another creature".
    expect(() =>
      game.dispatch({
        type: "activate-ability", player: A, source: lord, abilityIndex: 0,
        targets: [{ kind: "player", player: B }], sacrifice: lord,
      }),
    ).toThrow();
    game.dispatch({
      type: "activate-ability", player: A, source: lord, abilityIndex: 0,
      targets: [{ kind: "player", player: B }], sacrifice: bears,
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.zones.perPlayer[B].library.length).toBe(library - 3);
  });

  it("makes {C} for 1 life that pays only for a spell cast from your graveyard", () => {
    const game = bare();
    const lord = ready(game, "Lord of the Forsaken");
    activate(game, lord, 1);
    expect(pool(game)).toEqual(["C"]);
    // A spell from the hand can't spend it.
    const ring = game.debugSpawn("Sol Ring", A, "hand");
    expect(() => game.dispatch({ type: "cast-spell", player: A, card: ring, targets: [] })).toThrow();
    activate(game, lord, 1);
    expect(pool(game)).toEqual(["C", "C"]);
    expect(life(game)).toBe(18);
    // Flashing back Think Twice can: {2} of it, an Island's {U} for the rest.
    game.state.objects[game.debugSpawn("Island", A, "battlefield")].tapped = false;
    const twice = game.debugSpawn("Think Twice", A, "graveyard");
    const hand = handSize(game);
    game.dispatch({ type: "cast-spell", player: A, card: twice, targets: [], via: "flashback" });
    expect(pool(game)).toEqual([]);
    game.advanceUntil(quiet);
    expect(handSize(game)).toBe(hand + 1);
    expect(game.state.objects[twice].zone).toBe("exile");
  });
});

/** A three-player game, A's main phase, A with lands of every colour. */
const C = asPlayerId("carol");
const threeWay = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [A, B, C].map((p) => ({ player: p, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const land of ["Plains", "Swamp"] as const) {
    for (let i = 0; i < 9; i += 1) game.state.objects[game.debugSpawn(land, A, "battlefield")].tapped = false;
  }
  return game;
};

describe("Dismantling Wave", () => {
  it("destroys up to one artifact or enchantment of each opponent's", () => {
    const game = threeWay();
    const mine = game.debugSpawn("Sol Ring", A, "battlefield");
    const bRing = game.debugSpawn("Sol Ring", B, "battlefield");
    const bStone = game.debugSpawn("Mind Stone", B, "battlefield");
    const cPrison = game.debugSpawn("Ghostly Prison", C, "battlefield");
    const wave = game.debugSpawn("Dismantling Wave", A, "hand");
    const offer = game.legalActions(A).find((a) => a.kind === "cast-spell" && a.card === wave);
    expect(offer).toBeDefined();
    // Each slot is one opponent's: Bob's next, then Carol's, then nobody's.
    if (offer?.kind === "cast-spell") {
      const options = offer.targetOptions ?? [];
      expect(options[0]?.map((t) => (t.kind === "object" ? t.object : null)).sort()).toEqual([bRing, bStone].sort());
      expect(options[1]?.map((t) => (t.kind === "object" ? t.object : null))).toEqual([cPrison]);
      expect(options[2] ?? []).toEqual([]);
    }
    // Two of Bob's is not one per opponent.
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: wave, targets: [obj(bRing), obj(bStone), null] }),
    ).toThrow();
    game.dispatch({ type: "cast-spell", player: A, card: wave, targets: [obj(bRing), obj(cPrison), null] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bRing].zone).toBe("graveyard");
    expect(game.state.objects[cPrison].zone).toBe("graveyard");
    expect(game.state.objects[bStone].zone).toBe("battlefield");
    expect(game.state.objects[mine].zone).toBe("battlefield");
  });

  it("spares a target that's no longer that player's", () => {
    const game = threeWay();
    const bRing = game.debugSpawn("Sol Ring", B, "battlefield");
    const cPrison = game.debugSpawn("Ghostly Prison", C, "battlefield");
    cast(game, "Dismantling Wave", [obj(bRing), obj(cPrison), null] as TargetRef[]);
    // Carol takes Bob's Sol Ring in response: still an opponent's, but not
    // Bob's — the player it was chosen for.
    game.debugApplyEffect(C, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(bRing)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[bRing].zone).toBe("battlefield");
    expect(game.state.objects[cPrison].zone).toBe("graveyard");
  });

  it("when cycled, destroys every artifact and enchantment before the cycling draw", () => {
    const game = threeWay();
    const mine = game.debugSpawn("Sol Ring", A, "battlefield");
    const theirs = game.debugSpawn("Ghostly Prison", C, "battlefield");
    const wave = game.debugSpawn("Dismantling Wave", A, "hand");
    const hand = handSize(game);
    game.dispatch({ type: "cycle", player: A, card: wave });
    expect(game.state.objects[wave].zone).toBe("graveyard");
    // The trigger above the cycling ability: it resolves first.
    expect(game.state.zones.shared.stack).toHaveLength(2);
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({ type: "pass-priority", player: B });
    game.dispatch({ type: "pass-priority", player: C });
    expect(game.state.objects[mine].zone).toBe("graveyard");
    expect(game.state.objects[theirs].zone).toBe("graveyard");
    expect(handSize(game)).toBe(hand - 1);
    game.advanceUntil(quiet);
    expect(handSize(game)).toBe(hand);
  });
});

describe("Afterlife from the Loam", () => {
  it("returns up to one creature card from each player's graveyard under your control, as Zombies", () => {
    const game = threeWay();
    const mine = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const bobs = game.debugSpawn("Craw Wurm", B, "graveyard");
    const bobsOther = game.debugSpawn("Serra Angel", B, "graveyard");
    const carols = game.debugSpawn("Giant Spider", C, "graveyard");
    // Two of Bob's is two from one graveyard.
    const loam = game.debugSpawn("Afterlife from the Loam", A, "hand");
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: loam, targets: [obj(mine), obj(bobs), obj(bobsOther), null] }),
    ).toThrow();
    game.dispatch({ type: "cast-spell", player: A, card: loam, targets: [obj(mine), obj(bobs), obj(carols), null] });
    game.advanceUntil(quiet);
    for (const id of [mine, bobs, carols]) {
      expect(game.state.objects[id].zone).toBe("battlefield");
      expect(game.state.objects[id].controller).toBe(A);
      expect(game.characteristics(id).subtypes).toContain("Zombie");
    }
    expect(game.state.objects[bobsOther].zone).toBe("graveyard");
  });
});

describe("Windgrace's Judgment", () => {
  it("destroys a nonland permanent of each opponent's it targets", () => {
    const game = threeWay();
    for (const land of ["Forest", "Forest"] as const) {
      game.state.objects[game.debugSpawn(land, A, "battlefield")].tapped = false;
    }
    const bobs = ready(game, "Craw Wurm", B);
    const carols = game.debugSpawn("Ghostly Prison", C, "battlefield");
    const carolsLand = game.debugSpawn("Island", C, "battlefield");
    const judgment = game.debugSpawn("Windgrace's Judgment", A, "hand");
    // Not a land; not Bob's in Carol's slot.
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: judgment, targets: [obj(bobs), obj(carolsLand), null] }),
    ).toThrow();
    game.dispatch({ type: "cast-spell", player: A, card: judgment, targets: [obj(bobs), obj(carols), null] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bobs].zone).toBe("graveyard");
    expect(game.state.objects[carols].zone).toBe("graveyard");
    expect(game.state.objects[carolsLand].zone).toBe("battlefield");
  });
});

describe("cycling on the stack, and 'when you cycle this card'", () => {
  /** Cycle `name` from A's hand: the ability and any trigger above it. */
  const cycle = (game: Game, name: string): ObjectId => {
    const card = game.debugSpawn(name, A, "hand");
    game.dispatch({ type: "cycle", player: A, card });
    return card;
  };
  const library = (game: Game, who: PlayerId) => game.state.zones.perPlayer[who].library.length;

  it("draws as the cycling ability resolves, under its trigger (Fractured Sanity)", () => {
    const game = setUp();
    const hand = handSize(game);
    const before = library(game, B);
    const sanity = cycle(game, "Fractured Sanity");
    expect(game.state.objects[sanity].zone).toBe("graveyard");
    expect(game.state.zones.shared.stack).toHaveLength(2);
    expect(handSize(game)).toBe(hand);
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({ type: "pass-priority", player: B });
    // The trigger first: Bob mills four, and A hasn't drawn yet.
    expect(library(game, B)).toBe(before - 4);
    expect(handSize(game)).toBe(hand);
    game.advanceUntil(quiet);
    expect(handSize(game)).toBe(hand + 1);
  });

  it("can be responded to: the card is drawn after a spell cast in response", () => {
    const game = setUp();
    const hand = handSize(game);
    const card = game.debugSpawn("Migratory Route", A, "hand");
    game.dispatch({ type: "cycle", player: A, card });
    expect(game.state.zones.shared.stack).toHaveLength(1);
    const think = cast(game, "Think Twice");
    expect(game.state.zones.shared.stack).toHaveLength(2);
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    // Think Twice resolved first; the landcycling search asks next.
    expect(game.state.objects[think].zone).toBe("graveyard");
    expect(game.state.awaiting?.kind).toBe("choose-from-zone");
    expect(handSize(game)).toBe(hand + 1);
  });

  it("Fractured Sanity cast mills each opponent fourteen", () => {
    const game = setUp();
    const before = library(game, B);
    cast(game, "Fractured Sanity");
    game.advanceUntil(quiet);
    expect(library(game, B)).toBe(before - 14);
  });

  it("Decree of Pain destroys every creature and draws for each one destroyed; cycled, shrinks them all", () => {
    const game = setUp();
    ready(game, "Grizzly Bears");
    ready(game, "Craw Wurm", B);
    const myr = ready(game, "Darksteel Myr", B);
    const decree = cast(game, "Decree of Pain");
    const hand = handSize(game);
    game.advanceUntil(quiet);
    expect(game.state.objects[myr].zone).toBe("battlefield");
    expect(handSize(game)).toBe(hand + 2);
    expect(game.state.objects[decree].zone).toBe("graveyard");
    const angel = ready(game, "Serra Angel", B);
    cycle(game, "Decree of Pain");
    game.advanceUntil(quiet);
    expect(game.state.objects[myr].zone).toBe("graveyard");
    expect(game.characteristics(angel).toughness).toBe(2);
  });

  it("Agonasaur Rex's trigger pumps up to one target, or none", () => {
    const game = setUp();
    const bears = ready(game, "Grizzly Bears");
    cycle(game, "Agonasaur Rex");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(bears)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(2);
    expect(game.characteristics(bears).keywords.has("trample")).toBe(true);
    expect(game.characteristics(bears).keywords.has("indestructible")).toBe(true);
    const hand = handSize(game);
    cycle(game, "Agonasaur Rex");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [null] });
    game.advanceUntil(quiet);
    // The Rex spawned into the hand and cycled away, and the draw.
    expect(handSize(game)).toBe(hand + 1);
  });

  it("Magmakin Artillerist burns each opponent for each discard, and for 1 when cycled", () => {
    const game = setUp();
    ready(game, "Magmakin Artillerist");
    game.debugApplyEffect(A, { kind: "discard", target: "you", amount: 2, random: true }, []);
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(18);
    expect(life(game)).toBe(20);
    cycle(game, "Magmakin Artillerist");
    game.advanceUntil(quiet);
    // The cycled one's own 1, and the one on the battlefield's 1 for the
    // discard.
    expect(life(game, B)).toBe(16);
  });

  it("Vizier of Tumbling Sands untaps another permanent, or any when cycled", () => {
    const game = setUp();
    const vizier = ready(game, "Vizier of Tumbling Sands");
    const land = game.debugSpawn("Island", A, "battlefield");
    game.state.objects[land].tapped = true;
    expect(() => activate(game, vizier, 0, [obj(vizier)])).toThrow();
    activate(game, vizier, 0, [obj(land)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[land].tapped).toBe(false);
    expect(game.state.objects[vizier].tapped).toBe(true);
    cycle(game, "Vizier of Tumbling Sands");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(vizier)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[vizier].tapped).toBe(false);
  });

  it("Titanoth Rex puts a trample counter on a creature you control", () => {
    const game = setUp();
    const bears = ready(game, "Grizzly Bears");
    cycle(game, "Titanoth Rex");
    // The only creature you control: the target is chosen for you.
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].counters.trample).toBe(1);
    expect(game.characteristics(bears).keywords.has("trample")).toBe(true);
  });

  it("The Balrog of Moria makes two Treasures when cycled", () => {
    const game = setUp();
    cycle(game, "The Balrog of Moria");
    game.advanceUntil(quiet);
    const treasures = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Treasure Token" && game.state.objects[id].controller === A,
    );
    expect(treasures.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(2);
  });
});

describe("The Balrog of Moria", () => {
  it("exiled as it dies, exiles up to one creature of each opponent's", () => {
    const game = threeWay();
    const balrog = ready(game, "The Balrog of Moria");
    const bobs = ready(game, "Craw Wurm", B);
    const bobsOther = ready(game, "Grizzly Bears", B);
    const carols = ready(game, "Serra Angel", C);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(balrog)]);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets");
    expect(game.state.objects[balrog].zone).toBe("exile");
    // Two opponents: the third seat's slot has nothing, and isn't asked.
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind === "choose-targets" ? awaiting.specs.length : 0).toBe(2);
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(bobs), obj(carols)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bobs].zone).toBe("exile");
    expect(game.state.objects[carols].zone).toBe("exile");
    expect(game.state.objects[bobsOther].zone).toBe("battlefield");
  });

  it("exiles nothing if it isn't exiled", () => {
    const game = threeWay();
    const balrog = ready(game, "The Balrog of Moria");
    const bobs = ready(game, "Craw Wurm", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(balrog)]);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[balrog].zone).toBe("graveyard");
    expect(game.state.objects[bobs].zone).toBe("battlefield");
  });
});

describe("Teval's Judgment", () => {
  it("chooses a mode not chosen this turn each time cards leave your graveyard", () => {
    const game = setUp();
    game.debugSpawn("Teval's Judgment", A, "battlefield");
    const leave = () => {
      const card = game.debugSpawn("Grizzly Bears", A, "graveyard");
      game.debugApplyEffect(A, { kind: "return-to-hand", target: 0, from: "graveyard" }, [obj(card)]);
      game.advanceUntil((s) => s.awaiting?.kind === "choose-modes" || quiet(s));
    };
    const offered = (): string[] => {
      const awaiting = game.state.awaiting;
      return awaiting?.kind === "choose-modes" ? awaiting.modes.map((m) => m.text) : [];
    };
    leave();
    expect(offered()).toHaveLength(3);
    game.dispatch({ type: "choose-modes", player: A, modes: [2] });
    game.advanceUntil(quiet);
    expect(zombies(game)).toHaveLength(1);
    leave();
    expect(offered()).toEqual(["Draw a card.", "Create a Treasure token."]);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    leave();
    expect(offered()).toEqual(["Create a Treasure token."]);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    // Every mode chosen this turn: the fourth is removed.
    leave();
    expect(game.state.awaiting).toBeNull();
  });
});

describe("Gravecrawler", () => {
  const graveyardOffer = (game: Game, card: ObjectId) =>
    game.legalActions(A).find((a) => a.kind === "cast-spell" && a.card === card);

  it("casts from your graveyard only while you control a Zombie", () => {
    const game = setUp();
    const crawler = game.debugSpawn("Gravecrawler", A, "graveyard");
    expect(graveyardOffer(game, crawler)).toBeUndefined();
    // An opponent's Zombie isn't yours.
    game.debugApplyEffect(B, { kind: "create-token", token: "Zombie Druid Token", count: 1 }, []);
    expect(graveyardOffer(game, crawler)).toBeUndefined();
    game.debugApplyEffect(A, { kind: "create-token", token: "Zombie Druid Token", count: 1 }, []);
    expect(graveyardOffer(game, crawler)).toBeDefined();
    game.dispatch({ type: "cast-spell", player: A, card: crawler, targets: [], via: "graveyard-permission" });
    game.advanceUntil(quiet);
    expect(game.state.objects[crawler].zone).toBe("battlefield");
  });

  it("can't block", () => {
    const game = setUp();
    const crawler = ready(game, "Gravecrawler");
    expect(game.characteristics(crawler).restrictions.has("cant-block")).toBe(true);
  });
});

describe("Kaya, Geist Hunter", () => {
  const tokensNamed = (game: Game, name: string): number =>
    game.state.zones.shared.battlefield
      .filter((id) => game.state.objects[id].cardName === name && game.state.objects[id].controller === A)
      .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);

  it("+1: deathtouch for your creatures, and a counter on up to one creature token of yours", () => {
    const game = setUp();
    const kaya = game.debugSpawn("Kaya, Geist Hunter", A, "battlefield");
    const bears = ready(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "create-token", token: "Spirit Token", count: 1 }, []);
    const spirit = game.state.zones.shared.battlefield.find((id) => game.state.objects[id].cardName === "Spirit Token")!;
    // A nontoken creature isn't a legal target.
    expect(() => activate(game, kaya, 0, [obj(bears)])).toThrow();
    activate(game, kaya, 0, [obj(spirit)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[spirit].counters["+1/+1"]).toBe(1);
    expect(game.characteristics(bears).keywords.has("deathtouch")).toBe(true);
    expect(game.state.objects[kaya].counters.loyalty).toBe(4);
  });

  it("−2: doubles the tokens you create this turn, and no longer", () => {
    const game = setUp();
    const kaya = game.debugSpawn("Kaya, Geist Hunter", A, "battlefield");
    activate(game, kaya, 1);
    game.advanceUntil(quiet);
    game.debugApplyEffect(A, { kind: "create-token", token: "Spirit Token", count: 2 }, []);
    expect(tokensNamed(game, "Spirit Token")).toBe(4);
    // An opponent's tokens aren't doubled.
    game.debugApplyEffect(B, { kind: "create-token", token: "Spirit Token", count: 1 }, []);
    const theirs = game.state.zones.shared.battlefield
      .filter((id) => game.state.objects[id].cardName === "Spirit Token" && game.state.objects[id].controller === B)
      .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(theirs).toBe(1);
    game.advanceUntil((s) => activePlayerOf(s) === B && s.turn.step === "precombat-main");
    game.debugApplyEffect(A, { kind: "create-token", token: "Spirit Token", count: 1 }, []);
    expect(tokensNamed(game, "Spirit Token")).toBe(5);
  });

  it("−6: exiles every graveyard and makes a Spirit for each card exiled", () => {
    const game = setUp();
    const kaya = game.debugSpawn("Kaya, Geist Hunter", A, "battlefield");
    // 7, so she survives the cost (at 0 she'd die first and be exiled too).
    game.state.objects[kaya].counters.loyalty = 7;
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Grizzly Bears", A, "graveyard");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Island", B, "graveyard");
    activate(game, kaya, 2);
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[A].graveyard).toHaveLength(0);
    expect(game.state.zones.perPlayer[B].graveyard).toHaveLength(0);
    expect(tokensNamed(game, "Spirit Token")).toBe(5);
  });
});

describe("Will of the Mardu", () => {
  const redWarriors = (game: Game): number =>
    game.state.zones.shared.battlefield
      .filter((id) => game.state.objects[id].cardName === "Red Warrior Token" && game.state.objects[id].controller === A)
      .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);

  it("makes a Warrior for each creature target player controls", () => {
    const game = setUp();
    for (let i = 0; i < 3; i += 1) ready(game, "Grizzly Bears", B);
    ready(game, "Grizzly Bears");
    cast(game, "Will of the Mardu", [{ kind: "player", player: B }], { modes: [0] });
    game.advanceUntil(quiet);
    expect(redWarriors(game)).toBe(3);
  });

  it("with a commander, both: the Warriors count toward the damage", () => {
    const game = setUp();
    const commander = ready(game, "Grizzly Bears");
    game.state.objects[commander].isCommander = true;
    for (let i = 0; i < 2; i += 1) ready(game, "Grizzly Bears", B);
    const wurm = ready(game, "Craw Wurm", B); // 6/4
    cast(game, "Will of the Mardu", [{ kind: "player", player: B }, obj(wurm)], { modes: [0, 1] });
    game.advanceUntil(quiet);
    // Three Warriors (Bob's three creatures), then 1 + 3 = 4 damage.
    expect(redWarriors(game)).toBe(3);
    expect(game.state.objects[wurm].zone).toBe("graveyard");
  });
});

describe("Gala Greeters", () => {
  it("offers only the modes not yet chosen this turn as creatures enter", () => {
    const game = setUp();
    const greeters = ready(game, "Gala Greeters");
    const enter = () => {
      game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
      game.advanceUntil((s) => s.awaiting?.kind === "choose-modes" || quiet(s));
      const awaiting = game.state.awaiting;
      return awaiting?.kind === "choose-modes" ? awaiting.modes.map((m) => m.text) : [];
    };
    expect(enter()).toHaveLength(3);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    expect(game.state.objects[greeters].counters["+1/+1"]).toBe(1);
    expect(enter()).toEqual(["Create a tapped Treasure token.", "You gain 2 life."]);
    game.dispatch({ type: "choose-modes", player: A, modes: [1] });
    game.advanceUntil(quiet);
    expect(life(game)).toBe(22);
  });
});

describe("Within Range", () => {
  it("makes two Warriors, then drains each opponent by the creatures attacking them", () => {
    const game = threeWay();
    const range = game.debugSpawn("Within Range", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    const warriors = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Red Warrior Token",
    );
    expect(warriors.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(2);
    expect(range).toBeDefined();
    const [a, b, c, d] = ["Grizzly Bears", "Grizzly Bears", "Grizzly Bears", "Grizzly Bears"].map((n) => ready(game, n));
    const walker = game.debugSpawn("Ajani, Caller of the Pride", C, "battlefield");
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" && activePlayerOf(s) === A);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: a, defender: B },
        { attacker: b, defender: B },
        { attacker: c, defender: C },
        // At Carol's planeswalker: not attacking her.
        { attacker: d, defender: walker },
      ],
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.pendingTriggers.length === 0 && s.awaiting === null);
    expect(life(game, B)).toBe(18);
    expect(life(game, C)).toBe(19);
    expect(life(game)).toBe(20);
  });
});

describe("Faeburrow Elder", () => {
  it("grows and taps for one mana of each color among your permanents", () => {
    const game = bare();
    const elder = ready(game, "Faeburrow Elder");
    expect(game.characteristics(elder).power).toBe(2);
    game.debugSpawn("Hypnotic Specter", A, "battlefield");
    game.debugSpawn("Raging Goblin", A, "battlefield");
    // An opponent's colours don't count.
    game.debugSpawn("Serra Angel", B, "battlefield");
    expect(game.characteristics(elder).toughness).toBe(4);
    activate(game, elder);
    expect(pool(game)).toEqual(["W", "B", "R", "G"]);
  });

  it("pays a cost through the auto-payer", () => {
    const game = bare();
    ready(game, "Faeburrow Elder");
    game.debugSpawn("Hypnotic Specter", A, "battlefield");
    const doran = cast(game, "Doran, the Siege Tower");
    game.advanceUntil(quiet);
    expect(game.state.objects[doran].zone).toBe("battlefield");
  });
});
