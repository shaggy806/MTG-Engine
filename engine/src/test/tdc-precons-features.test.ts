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
