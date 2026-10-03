/**
 * Copying the spell that fired a cast trigger, aimed by the effect: "copy
 * that spell for each other creature you control that the spell could
 * target. Each copy targets a different one of those creatures" (rule
 * 707.10d — Zada, Hedron Grinder), "you may copy that spell. The copy targets
 * Ivy" (707.10e — Ivy, Gleeful Spellthief); "return that spell to its owner's
 * hand" (Krark, the Thumbless); and a trigger condition asked only as the
 * spell is cast ("whenever you cast a spell while Fire Lord Azula is
 * attacking", rule 603.1) or of the spell's place among the turn's casts
 * ("if it's the first instant spell … you've cast this turn" — Alania).
 */

import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const objectRef = (object: ObjectId): TargetRef => ({ kind: "object", object });
const playerRef = (player: PlayerId): TargetRef => ({ kind: "player", player });

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
/** Stop at a decision, or once everything has resolved. */
const settle = (s: GameState): boolean => s.awaiting !== null || quiet(s);

const setUp = (seed = 1) => {
  const game = Game.create({
    seed,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const player of [A, B]) {
    for (const [land, n] of [["Mountain", 12], ["Forest", 4], ["Island", 6], ["Plains", 2]] as const) {
      for (let i = 0; i < n; i += 1) game.debugSpawn(land, player, "battlefield", { tapped: false });
    }
  }
  return game;
};

const cast = (game: Game, player: PlayerId, name: string, targets: TargetRef[] = [], extra = {}): ObjectId => {
  const card = game.debugSpawn(name, player, "hand");
  game.dispatch({ type: "cast-spell", player, card, targets, ...extra });
  return card;
};

const power = (game: Game, id: ObjectId): number => computeCharacteristics(game.state, game.registry, id).power;

describe("copy for each permanent it could target — Zada, Hedron Grinder", () => {
  it("copies once per other creature, skipping one it couldn't target, in the order chosen", () => {
    const game = setUp();
    const zada = game.debugSpawn("Zada, Hedron Grinder", A, "battlefield");
    const first = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const second = game.debugSpawn("Grizzly Bears", A, "battlefield");
    // Shroud: Giant Growth couldn't target it (the ruling: just ignored).
    const shrouded = game.debugSpawn("Argothian Enchantress", A, "battlefield");
    // Not A's: never a copy's target.
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");

    cast(game, A, "Giant Growth", [objectRef(zada)]);
    game.advanceUntil(settle);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-permanents");
    if (awaiting?.kind !== "choose-permanents") return;
    expect([...awaiting.eligible].sort()).toEqual([first, second].sort());
    expect(awaiting.min).toBe(2);
    expect(awaiting.max).toBe(2);
    // The second Bear's copy goes on the stack first, so resolves last.
    game.dispatch({ type: "choose-permanents", player: A, permanents: [second, first] });
    const stack = game.state.zones.shared.stack.map((id) => game.state.objects[id]);
    const copies = stack.filter((o) => o.isCopy);
    expect(copies.map((c) => c.targets)).toEqual([[objectRef(second)], [objectRef(first)]]);
    game.advanceUntil(quiet);

    expect(power(game, zada)).toBe(6);
    expect(power(game, first)).toBe(5);
    expect(power(game, second)).toBe(5);
    expect(power(game, shrouded)).toBe(0);
    expect(power(game, theirs)).toBe(2);
    expect(game.eventsOfType("spell-copied")).toHaveLength(2);
  });

  it("copies straight away for a single other creature", () => {
    const game = setUp();
    const zada = game.debugSpawn("Zada, Hedron Grinder", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    cast(game, A, "Giant Growth", [objectRef(zada)]);
    game.advanceUntil(settle);
    expect(game.state.awaiting).toBeNull();
    expect(power(game, zada)).toBe(6);
    expect(power(game, bear)).toBe(5);
  });

  it("copies a spell aimed at Zada in every slot, each copy aimed at one creature in every slot", () => {
    // The rulings: every target Zada triggers it, and so does nothing less —
    // Zada and another creature isn't "only Zada".
    const game = setUp();
    const zada = game.debugSpawn("Zada, Hedron Grinder", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    cast(game, A, "Seeds of Strength", [objectRef(zada), objectRef(zada), objectRef(bear)]);
    game.advanceUntil(quiet);
    expect(game.eventsOfType("spell-copied")).toHaveLength(0);
    expect(power(game, zada)).toBe(5);
    cast(game, A, "Seeds of Strength", [objectRef(zada), objectRef(zada), objectRef(zada)]);
    game.advanceUntil(quiet);
    expect(game.eventsOfType("spell-copied")).toHaveLength(1);
    expect(power(game, zada)).toBe(8);
    expect(power(game, bear)).toBe(6);
  });

  it("gives each token of a stack its own copy", () => {
    const game = setUp();
    const zada = game.debugSpawn("Zada, Hedron Grinder", A, "battlefield");
    cast(game, A, "Raise the Alarm");
    game.advanceUntil(quiet);
    const soldiers = (): ObjectId[] =>
      game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === "Soldier Token");
    const count = soldiers().reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(count).toBe(2);

    cast(game, A, "Giant Growth", [objectRef(zada)]);
    game.advanceUntil(settle);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-permanents");
    if (awaiting?.kind !== "choose-permanents") return;
    expect(awaiting.eligible).toHaveLength(2);
    game.dispatch({ type: "choose-permanents", player: A, permanents: [...awaiting.eligible] });
    game.advanceUntil(quiet);
    expect(soldiers()).toHaveLength(2);
    for (const id of soldiers()) expect(power(game, id)).toBe(4);
  });

  it("still copies a spell countered in response, from its last-known targets", () => {
    const game = setUp();
    const zada = game.debugSpawn("Zada, Hedron Grinder", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const growth = cast(game, A, "Giant Growth", [objectRef(zada)]);
    // Zada's trigger is above Giant Growth; Counterspell goes above both.
    cast(game, A, "Counterspell", [objectRef(growth)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[growth].zone).toBe("graveyard");
    expect(power(game, zada)).toBe(3);
    expect(power(game, bear)).toBe(5);
  });
});

describe("a copy that targets the source — Ivy, Gleeful Spellthief", () => {
  const opponentGrowth = (game: Game, target: ObjectId): void => {
    game.dispatch({ type: "pass-priority", player: A });
    cast(game, B, "Giant Growth", [objectRef(target)]);
    game.dispatch({ type: "pass-priority", player: B });
    game.advanceUntil(settle);
  };

  it("copies an opponent's spell on their own creature, onto Ivy", () => {
    const game = setUp();
    const ivy = game.debugSpawn("Ivy, Gleeful Spellthief", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    opponentGrowth(game, theirs);
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    expect(power(game, ivy)).toBe(5);
    expect(power(game, theirs)).toBe(5);
    const copy = game.eventsOfType("spell-copied")[0];
    expect(copy.controller).toBe(A);
  });

  it("copies nothing when declined", () => {
    const game = setUp();
    const ivy = game.debugSpawn("Ivy, Gleeful Spellthief", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    opponentGrowth(game, theirs);
    game.dispatch({ type: "choose-modes", player: A, modes: [] });
    game.advanceUntil(quiet);
    expect(power(game, ivy)).toBe(2);
    expect(game.eventsOfType("spell-copied")).toHaveLength(0);
  });

  it("can't copy onto Ivy when Ivy isn't a legal target", () => {
    // The ruling: no copy can be created. Lightning Greaves gives Ivy shroud.
    const game = setUp();
    const ivy = game.debugSpawn("Ivy, Gleeful Spellthief", A, "battlefield");
    const greaves = game.debugSpawn("Lightning Greaves", A, "battlefield");
    game.state.objects[greaves].attachedTo = ivy;
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    opponentGrowth(game, theirs);
    if (game.state.awaiting?.kind === "choose-modes") game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    expect(power(game, ivy)).toBe(2);
    expect(game.eventsOfType("spell-copied")).toHaveLength(0);
  });

  it("doesn't trigger for a spell aimed at Ivy, or at a player", () => {
    const game = setUp();
    const ivy = game.debugSpawn("Ivy, Gleeful Spellthief", A, "battlefield");
    cast(game, A, "Giant Growth", [objectRef(ivy)]);
    game.advanceUntil(settle);
    cast(game, A, "Shock", [playerRef(B)]);
    game.advanceUntil(settle);
    expect(game.state.awaiting).toBeNull();
    expect(game.eventsOfType("spell-copied")).toHaveLength(0);
  });

  it("needs a single creature: two different ones don't count, one in every slot does", () => {
    // The rulings: only one creature and nothing else; several targets all
    // that one creature still count, and every target of the copy is Ivy.
    const game = setUp();
    const ivy = game.debugSpawn("Ivy, Gleeful Spellthief", A, "battlefield");
    const first = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const second = game.debugSpawn("Grizzly Bears", A, "battlefield");
    cast(game, A, "Seeds of Strength", [objectRef(first), objectRef(second), objectRef(first)]);
    game.advanceUntil(settle);
    expect(game.state.awaiting).toBeNull();
    expect(game.eventsOfType("spell-copied")).toHaveLength(0);
    cast(game, A, "Seeds of Strength", [objectRef(second), objectRef(second), objectRef(second)]);
    game.advanceUntil(settle);
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    expect(power(game, ivy)).toBe(5);
    expect(power(game, second)).toBe(6);
  });
});

describe("a lost flip returns the spell; a won one copies it — Krark, the Thumbless", () => {
  /** The first seed whose flip comes out `won`. */
  const run = (won: boolean, counter = false) => {
    for (let seed = 1; seed < 40; seed += 1) {
      const game = setUp(seed);
      game.debugSpawn("Krark, the Thumbless", A, "battlefield");
      const bear = game.debugSpawn("Grizzly Bears", B, "battlefield");
      const shock = cast(game, A, "Shock", [objectRef(bear)]);
      if (counter) cast(game, A, "Counterspell", [objectRef(shock)]);
      game.advanceUntil(settle);
      const flip = game.eventsOfType("coin-flipped")[0];
      if (flip === undefined || flip.won !== won) continue;
      return { game, bear, shock };
    }
    throw new Error("no seed gave that flip");
  };

  it("returns the spell to its owner's hand on a lost flip", () => {
    const { game, bear, shock } = run(false);
    game.advanceUntil(quiet);
    expect(game.state.objects[shock].zone).toBe("hand");
    expect(game.state.objects[bear].damageMarked).toBe(0);
  });

  it("returns nothing once the spell was countered", () => {
    // The ruling: the card stays where it is.
    const { game, shock } = run(false, true);
    game.advanceUntil(quiet);
    expect(game.state.objects[shock].zone).toBe("graveyard");
  });

  it("copies the spell on a won flip, offering new targets", () => {
    const { game, bear, shock } = run(true);
    expect(game.state.awaiting?.kind).toBe("choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [playerRef(B)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[shock].zone).toBe("graveyard");
    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.state.players[B].life).toBe(18);
  });
});

describe("a trigger condition asked only as the spell is cast — Fire Lord Azula", () => {
  const attackWithAzula = (game: Game): ObjectId => {
    const azula = game.debugSpawn("Fire Lord Azula", A, "battlefield", { summoningSick: false });
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: azula, defender: B }] });
    // Firebending's mana, then priority in the declare-attackers step.
    game.advanceUntil((s) => quiet(s) && s.priority.holder === A && s.turn.step === "declare-attackers");
    return azula;
  };

  it("copies a spell cast while Azula is attacking, even once Azula has left combat", () => {
    const game = setUp();
    const azula = attackWithAzula(game);
    cast(game, A, "Shock", [playerRef(B)]);
    game.advanceUntil((s) => s.zones.shared.stack.length === 2 && s.pendingTriggers.length === 0);
    // With the trigger on the stack, Azula is removed from combat (rule
    // 506.4) but stays on the battlefield — so an intervening "if" would now
    // be false, where one that left would be read as it last was. The copy
    // is still made: "while attacking" was asked as Shock was cast.
    game.state.objects[azula].attacking = null;
    game.advanceUntil(settle);
    expect(game.state.awaiting?.kind).toBe("choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [playerRef(B)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[azula].zone).toBe("battlefield");
    expect(game.eventsOfType("spell-copied")).toHaveLength(1);
    expect(game.state.players[B].life).toBe(16);
  });

  it("doesn't trigger while Azula isn't attacking", () => {
    const game = setUp();
    game.debugSpawn("Fire Lord Azula", A, "battlefield");
    cast(game, A, "Shock", [playerRef(B)]);
    game.advanceUntil(settle);
    expect(game.eventsOfType("spell-copied")).toHaveLength(0);
    expect(game.state.players[B].life).toBe(18);
  });
});

describe("the first spell of a kind this turn — Alania, Divergent Storm", () => {
  const answer = (game: Game, yes: boolean): void => {
    game.advanceUntil(settle);
    if (game.state.awaiting?.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: A, modes: yes ? [0] : [] });
      game.advanceUntil(settle);
    }
    if (game.state.awaiting?.kind === "choose-targets") {
      const current = game.state.awaiting.current ?? [];
      game.dispatch({ type: "choose-targets", player: A, targets: [...current] });
    }
    game.advanceUntil(quiet);
  };

  it("copies the first instant and the first sorcery, not the second instant", () => {
    const game = setUp();
    game.debugSpawn("Alania, Divergent Storm", A, "battlefield");
    const bHand = game.state.zones.perPlayer[B].hand.length;
    cast(game, A, "Shock", [playerRef(B)], {});
    // The trigger targets the opponent as it goes on the stack.
    game.advanceUntil(settle);
    answer(game, true);
    expect(game.state.players[B].life).toBe(16);
    expect(game.state.zones.perPlayer[B].hand.length).toBe(bHand + 1);

    cast(game, A, "Shock", [playerRef(B)]);
    answer(game, true);
    expect(game.state.players[B].life).toBe(14);

    cast(game, A, "Divination");
    answer(game, true);
    expect(game.eventsOfType("spell-copied")).toHaveLength(2);
  });

  it("counts an Otter spell, but not Alania's own cast earlier in the turn", () => {
    const game = setUp();
    // Alania cast this turn: "other than Alania" leaves it out of the count.
    const alania = cast(game, A, "Alania, Divergent Storm");
    game.advanceUntil(quiet);
    expect(game.state.objects[alania].zone).toBe("battlefield");
    cast(game, A, "Kindlespark Duo");
    answer(game, true);
    expect(game.eventsOfType("spell-copied")).toHaveLength(1);
    // A second Otter isn't the first any more.
    cast(game, A, "Kindlespark Duo");
    answer(game, true);
    expect(game.eventsOfType("spell-copied")).toHaveLength(1);
  });
});
