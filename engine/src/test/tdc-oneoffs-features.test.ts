/**
 * The TDC precons' one-off keywords and the cards they unblock: skulk
 * (Behind the Scenes), monstrosity and "becomes monstrous" (Stormbreath
 * Dragon, Giggling Skitterspike), entering from a graveyard (River Kelpie)
 * and a spell exiling itself as it resolves (Rise of the Eldrazi).
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { activePlayerOf } from "../state.js";
import type { GameState } from "../state.js";
import { slotOptions } from "../target.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });

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

/** Attack B with `attacker`, then report which of B's creatures may block it. */
const blockersFor = (game: Game, attacker: ObjectId): ObjectId[] => {
  game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
  game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker, defender: B }] });
  game.advanceUntil((s) => s.awaiting?.kind === "blockers" || s.result.over);
  const legal = game.legalActions(B).find((a) => a.kind === "declare-blockers");
  if (legal === undefined || legal.kind !== "declare-blockers") return [];
  return legal.eligible.filter((e) => e.canBlock.includes(attacker)).map((e) => e.blocker);
};

describe("skulk (Behind the Scenes)", () => {
  it("keeps creatures with greater power from blocking, and no others", () => {
    const game = setUp();
    game.debugSpawn("Behind the Scenes", A, "battlefield");
    const bears = ready(game, "Grizzly Bears");
    expect(game.characteristics(bears).keywords.has("skulk")).toBe(true);
    const giant = ready(game, "Hill Giant", B);
    const twin = ready(game, "Grizzly Bears", B);
    const blockers = blockersFor(game, bears);
    expect(blockers).toContain(twin);
    expect(blockers).not.toContain(giant);
  });

  it("is only on the controller's creatures, and pumps them for {4}{W}", () => {
    const game = setUp();
    const scenes = game.debugSpawn("Behind the Scenes", A, "battlefield");
    const mine = ready(game, "Grizzly Bears");
    const theirs = ready(game, "Grizzly Bears", B);
    expect(game.characteristics(theirs).keywords.has("skulk")).toBe(false);
    activate(game, scenes);
    game.advanceUntil(quiet);
    expect(game.characteristics(mine).power).toBe(3);
    expect(game.characteristics(theirs).power).toBe(2);
  });
});

describe("monstrosity (Stormbreath Dragon)", () => {
  it("puts three counters on it, makes it monstrous, and burns each opponent by hand size", () => {
    const game = setUp();
    const dragon = ready(game, "Stormbreath Dragon");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Island", B, "hand");
    const cards = handSize(game, B);
    activate(game, dragon);
    game.advanceUntil(quiet);
    expect(game.state.objects[dragon].counters["+1/+1"]).toBe(3);
    expect(game.state.objects[dragon].monstrous).toBe(true);
    expect(game.state.players[B].life).toBe(20 - cards);
    // Nothing for its own controller.
    expect(game.state.players[A].life).toBe(20);
  });

  it("does nothing a second time: no counters, no trigger", () => {
    const game = setUp();
    const dragon = ready(game, "Stormbreath Dragon");
    game.debugSpawn("Island", B, "hand");
    activate(game, dragon);
    game.advanceUntil(quiet);
    const life = game.state.players[B].life;
    activate(game, dragon);
    game.advanceUntil(quiet);
    expect(game.state.objects[dragon].counters["+1/+1"]).toBe(3);
    expect(game.state.players[B].life).toBe(life);
  });

  it("does nothing to a permanent that left and came back before it resolved", () => {
    const game = setUp();
    const dragon = ready(game, "Stormbreath Dragon");
    game.debugSpawn("Island", B, "hand");
    activate(game, dragon);
    // Blinked in response: a new object (rule 400.7).
    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [obj(dragon)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[dragon].zone).toBe("battlefield");
    expect(game.state.objects[dragon].counters["+1/+1"] ?? 0).toBe(0);
    expect(game.state.objects[dragon].monstrous).toBeUndefined();
    expect(game.state.players[B].life).toBe(20);
  });

  it("stops being monstrous once it leaves the battlefield", () => {
    const game = setUp();
    const dragon = ready(game, "Stormbreath Dragon");
    activate(game, dragon);
    game.advanceUntil(quiet);
    expect(game.state.objects[dragon].monstrous).toBe(true);
    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0 }, [obj(dragon)]);
    expect(game.state.objects[dragon].monstrous).toBeUndefined();
  });
});

describe("Giggling Skitterspike", () => {
  it("deals its power to each opponent as it attacks, and as it's targeted by a spell", () => {
    const game = setUp();
    const spike = ready(game, "Giggling Skitterspike");
    activate(game, spike);
    game.advanceUntil(quiet);
    expect(game.characteristics(spike).power).toBe(6);
    // Targeted by a spell: the trigger resolves before Giant Growth, at 6.
    cast(game, "Giant Growth", [obj(spike)]);
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(14);
    // Attacking: 9 power by now.
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: spike, defender: B }] });
    game.advanceUntil((s) => s.turn.step === "declare-blockers" || s.awaiting?.kind === "blockers");
    expect(game.state.players[B].life).toBe(5);
  });
});

describe("a defending player killed by an attack trigger", () => {
  it("isn't asked to declare blockers (rule 800.4a)", () => {
    const C = asPlayerId("carol");
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      decks: [A, B, C].map((p) => ({ player: p, cards: Array<string>(40).fill("Island") })),
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const spike = game.debugSpawn("Giggling Skitterspike", A, "battlefield");
    game.state.objects[spike].summoningSick = false;
    game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.state.players[B].life = 1;
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: spike, defender: B }] });
    let askedB = false;
    game.advanceUntil((s) => {
      if (s.awaiting?.kind === "blockers" && s.awaiting.player === B) askedB = true;
      return s.turn.step === "end" || s.result.over;
    });
    expect(game.state.players[B].hasLost).toBe(true);
    expect(askedB).toBe(false);
  });
});

describe("River Kelpie", () => {
  it("draws when it or another permanent enters from a graveyard, not from anywhere else", () => {
    const game = setUp();
    game.debugSpawn("River Kelpie", A, "battlefield");
    const bearInYard = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const before = handSize(game);
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [obj(bearInYard)]);
    game.advanceUntil(quiet);
    expect(handSize(game)).toBe(before + 1);
    // From anywhere else: nothing.
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(handSize(game)).toBe(before + 1);
  });

  it("sees itself and another permanent entering from a graveyard together", () => {
    const game = setUp();
    const kelpie = game.debugSpawn("River Kelpie", A, "graveyard");
    const bear = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const before = handSize(game);
    game.debugApplyEffect(A, {
      kind: "sequence",
      simultaneous: true,
      effects: [
        { kind: "put-onto-battlefield", target: 0 },
        { kind: "put-onto-battlefield", target: 1 },
      ],
    }, [obj(kelpie), obj(bear)]);
    game.advanceUntil(quiet);
    expect(handSize(game)).toBe(before + 2);
  });

  it("draws when a player casts a spell from a graveyard", () => {
    const game = setUp();
    game.debugSpawn("River Kelpie", A, "battlefield");
    const twice = game.debugSpawn("Think Twice", A, "graveyard");
    const before = handSize(game);
    game.dispatch({ type: "cast-spell", player: A, card: twice, targets: [], via: "flashback" });
    game.advanceUntil(quiet);
    // One from the Kelpie, one from Think Twice.
    expect(handSize(game)).toBe(before + 2);
  });
});

describe("Rise of the Eldrazi", () => {
  it("destroys, draws four, takes an extra turn, and exiles itself", () => {
    const game = setUp();
    const victim = ready(game, "Grizzly Bears", B);
    for (let i = 0; i < 12; i += 1) {
      const id = game.debugSpawn("Wastes", A, "battlefield");
      game.state.objects[id].tapped = false;
    }
    const before = handSize(game);
    const rise = cast(game, "Rise of the Eldrazi", [obj(victim), player(A)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[victim].zone).toBe("graveyard");
    expect(handSize(game)).toBe(before + 4);
    expect(game.state.objects[rise].zone).toBe("exile");
    expect(game.state.extraTurns.length).toBe(1);
  });
});

/** Cast `name` from A's hand and stop at its "as this enters" riot choice. */
const castToRiot = (game: Game, name: string): ObjectId => {
  const card = cast(game, name);
  game.advanceUntil((s) => s.awaiting !== null || s.zones.shared.stack.length === 0);
  return card;
};

describe("riot (Skarrgan Hellkite)", () => {
  it("asks as it enters, and a +1/+1 counter is a counter, not haste", () => {
    const game = setUp();
    const hellkite = castToRiot(game, "Skarrgan Hellkite");
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-creature-type");
    if (awaiting?.kind !== "choose-creature-type") return;
    expect(awaiting.source).toBe(hellkite);
    game.dispatch({ type: "choose-creature-type", player: A, creatureType: awaiting.options[0] });
    game.advanceUntil(quiet);
    expect(game.state.objects[hellkite].zone).toBe("battlefield");
    expect(game.state.objects[hellkite].counters["+1/+1"]).toBe(1);
    expect(game.characteristics(hellkite).keywords.has("haste")).toBe(false);
  });

  it("gains haste for good when the counter is declined", () => {
    const game = setUp();
    const hellkite = castToRiot(game, "Skarrgan Hellkite");
    game.dispatch({ type: "choose-creature-type", player: A, creatureType: "Haste" });
    game.advanceUntil(quiet);
    expect(game.state.objects[hellkite].counters["+1/+1"] ?? 0).toBe(0);
    expect(game.characteristics(hellkite).keywords.has("haste")).toBe(true);
    // Not until end of turn: still there next turn.
    game.advanceUntil((s) => activePlayerOf(s) === B && s.turn.step === "precombat-main");
    expect(game.state.turn.number).toBe(2);
    expect(game.characteristics(hellkite).keywords.has("haste")).toBe(true);
  });

  it("can't activate its damage without a +1/+1 counter", () => {
    const game = setUp();
    const hellkite = castToRiot(game, "Skarrgan Hellkite");
    game.dispatch({ type: "choose-creature-type", player: A, creatureType: "Haste" });
    game.advanceUntil(quiet);
    expect(() => activate(game, hellkite, 0, [player(B)])).toThrow();
  });
});

describe("damage divided by an activated ability (Skarrgan Hellkite)", () => {
  const withCounter = () => {
    const game = setUp();
    const hellkite = ready(game, "Skarrgan Hellkite");
    game.state.objects[hellkite].counters["+1/+1"] = 1;
    return { game, hellkite };
  };

  it("deals 2 to one target, or 1 to each of two", () => {
    const { game, hellkite } = withCounter();
    const [a, b] = [ready(game, "Grizzly Bears", B), ready(game, "Grizzly Bears", B)];
    activate(game, hellkite, 0, [obj(a)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[a].zone).toBe("graveyard");
    activate(game, hellkite, 0, [obj(b), player(B)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[b].damageMarked).toBe(1);
    expect(game.state.players[B].life).toBe(19);
  });

  it("keeps the split when one of two targets goes: the other is dealt only 1", () => {
    const { game, hellkite } = withCounter();
    const bear = ready(game, "Grizzly Bears", B);
    activate(game, hellkite, 0, [obj(bear), player(B)]);
    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0 }, [obj(bear)]);
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(19);
  });

  it("refuses a split that isn't at least 1 each, all of it", () => {
    const { game, hellkite } = withCounter();
    const bear = ready(game, "Grizzly Bears", B);
    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: hellkite,
        abilityIndex: 0,
        targets: [obj(bear), player(B)],
        division: [2, 0],
      }),
    ).toThrow();
  });
});

describe("damage divided by a triggered ability", () => {
  const atarka = (game: Game, division: number[], targets: TargetRef[]) => {
    cast(game, "Dragonlord Atarka");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || quiet(s));
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-targets");
    if (awaiting?.kind !== "choose-targets") return;
    expect(awaiting.divide).toEqual({ total: 5, slot: 0 });
    game.dispatch({ type: "choose-targets", player: A, targets, division });
    game.advanceUntil(quiet);
  };

  it("deals 5 split as its controller chose among creatures their opponents control (Dragonlord Atarka)", () => {
    const game = setUp();
    const bear = ready(game, "Grizzly Bears", B);
    const giant = ready(game, "Hill Giant", B);
    atarka(game, [2, 3], [obj(bear), obj(giant)]);
    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.state.objects[giant].zone).toBe("graveyard");
  });

  it("puts a lopsided split where it was asked", () => {
    const game = setUp();
    const bear = ready(game, "Grizzly Bears", B);
    const giant = ready(game, "Hill Giant", B);
    atarka(game, [4, 1], [obj(bear), obj(giant)]);
    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.state.objects[giant].damageMarked).toBe(1);
  });

  it("can't reach its controller's own creatures or a player", () => {
    const game = setUp();
    const mine = ready(game, "Grizzly Bears");
    ready(game, "Grizzly Bears", B);
    cast(game, "Dragonlord Atarka");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || quiet(s));
    expect(() =>
      game.dispatch({ type: "choose-targets", player: A, targets: [obj(mine)], division: [5] }),
    ).toThrow();
    expect(() =>
      game.dispatch({ type: "choose-targets", player: A, targets: [player(B)], division: [5] }),
    ).toThrow();
  });

  it("refuses a division that doesn't add up", () => {
    const game = setUp();
    const bear = ready(game, "Grizzly Bears", B);
    const giant = ready(game, "Hill Giant", B);
    cast(game, "Dragonlord Atarka");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || quiet(s));
    expect(() =>
      game.dispatch({ type: "choose-targets", player: A, targets: [obj(bear), obj(giant)], division: [2, 2] }),
    ).toThrow();
    expect(() =>
      game.dispatch({ type: "choose-targets", player: A, targets: [obj(bear), obj(giant)], division: [5, 0] }),
    ).toThrow();
  });

  it("divides Inferno Titan's 3 among up to three targets as it attacks", () => {
    const game = setUp();
    const titan = ready(game, "Inferno Titan");
    const [a, b] = [ready(game, "Grizzly Bears", B), ready(game, "Grizzly Bears", B)];
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: titan, defender: B }] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(a), obj(b), player(B)], division: [1, 1, 1] });
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    expect(game.state.objects[a].damageMarked).toBe(1);
    expect(game.state.objects[b].damageMarked).toBe(1);
    expect(game.state.players[B].life).toBe(19);
  });
});

describe("flanking (Sidar Kondo of Jamuraa)", () => {
  // Sidar is a 2/2 for its own block restriction, which would keep a
  // flanking-less blocker off it: a +1/+1 counter takes it past that.
  const blockWith = (game: Game, attacker: ObjectId, blocker: ObjectId) => {
    game.state.objects[attacker].counters["+1/+1"] = 1;
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker, defender: B }] });
    game.advanceUntil((s) => s.awaiting?.kind === "blockers");
    game.dispatch({ type: "declare-blockers", player: B, blocks: [{ blocker, attacker }] });
    game.advanceUntil((s) => s.turn.step === "combat-damage" || s.turn.step === "end" || quiet(s));
  };

  it("gives each blocker without flanking -1/-1 until end of turn", () => {
    const game = setUp();
    const sidar = ready(game, "Sidar Kondo of Jamuraa");
    const giant = ready(game, "Hill Giant", B);
    blockWith(game, sidar, giant);
    expect(game.characteristics(giant).power).toBe(2);
    expect(game.characteristics(giant).toughness).toBe(2);
  });

  it("doesn't shrink a blocker that has flanking itself", () => {
    const game = setUp();
    const sidar = ready(game, "Sidar Kondo of Jamuraa");
    const other = ready(game, "Sidar Kondo of Jamuraa", B);
    blockWith(game, sidar, other);
    expect(game.characteristics(other).toughness).toBe(5);
  });

  it("keeps opponents' creatures without flying or reach off creatures with power 2 or less", () => {
    const game = setUp();
    game.debugSpawn("Sidar Kondo of Jamuraa", A, "battlefield");
    const bears = ready(game, "Grizzly Bears");
    const giant = ready(game, "Hill Giant", B);
    const angel = ready(game, "Serra Angel", B);
    const blockers = blockersFor(game, bears);
    expect(blockers).not.toContain(giant);
    expect(blockers).toContain(angel);
  });

  it("lets them block a creature with power 3 or more", () => {
    const game = setUp();
    game.debugSpawn("Sidar Kondo of Jamuraa", A, "battlefield");
    const big = ready(game, "Hill Giant");
    const giant = ready(game, "Hill Giant", B);
    expect(blockersFor(game, big)).toContain(giant);
  });
});

describe("mill as a cost (Millikin)", () => {
  it("mills a card to pay, and adds {C} only as the ability resolves", () => {
    const game = setUp(["Grizzly Bears"]);
    const millikin = ready(game, "Millikin");
    const top = game.state.zones.perPlayer[A].library[0];
    activate(game, millikin);
    // Paid: the card is milled; the ability waits on the stack.
    expect(game.state.objects[top].zone).toBe("graveyard");
    expect(game.state.zones.shared.stack.length).toBe(1);
    game.advanceUntil((s) => s.zones.shared.stack.length === 0);
    expect(game.state.players[A].manaPool.length).toBe(1);
  });

  it("can't be activated with an empty library", () => {
    const game = setUp();
    const millikin = ready(game, "Millikin");
    game.state.zones.perPlayer[A].library = [];
    expect(game.legalActions(A).some((a) => a.kind === "activate-ability" && a.source === millikin)).toBe(false);
  });
});

describe("Necromantic Selection", () => {
  it("returns one creature card the wrath put into any graveyard, under its caster's control, as a black Zombie", () => {
    const game = setUp();
    const mine = ready(game, "Grizzly Bears");
    const theirs = ready(game, "Serra Angel", B);
    const before = new Set(game.state.zones.shared.battlefield);
    game.debugApplyEffect(B, { kind: "create-token", token: "Soldier Token", count: 1 });
    const token = game.state.zones.shared.battlefield.find((id) => !before.has(id));
    expect(token).toBeDefined();
    // Already in a graveyard before: not put there this way.
    const old = game.debugSpawn("Hill Giant", B, "graveyard");
    const selection = cast(game, "Necromantic Selection");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-from-zone") throw new Error("no choice");
    expect([...awaiting.eligible].sort()).toEqual([mine, theirs].sort());
    expect(awaiting.eligible).not.toContain(old);
    expect(awaiting.eligible).not.toContain(token);
    expect(awaiting.min).toBe(1);
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [theirs] });
    game.advanceUntil(quiet);
    expect(game.state.objects[theirs].zone).toBe("battlefield");
    expect(game.state.objects[theirs].controller).toBe(A);
    expect(game.state.objects[theirs].owner).toBe(B);
    const c = game.characteristics(theirs);
    expect(c.colors.has("B")).toBe(true);
    expect(c.colors.has("W")).toBe(true);
    expect(c.subtypes).toContain("Zombie");
    expect(c.subtypes).toContain("Angel");
    expect(game.state.objects[mine].zone).toBe("graveyard");
    expect(game.state.objects[selection].zone).toBe("exile");
  });

  it("stays under its caster's control past the next state-based check", () => {
    const game = setUp();
    const theirs = ready(game, "Serra Angel", B);
    cast(game, "Necromantic Selection");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [theirs] });
    game.advanceUntil(quiet);
    cast(game, "Shock", [player(B)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[theirs].controller).toBe(A);
  });
});

describe("Kotis, Sibsig Champion", () => {
  const withYard = () => {
    const game = setUp();
    const kotis = ready(game, "Kotis, Sibsig Champion");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const fodder = ["Island", "Island", "Island", "Island"].map((n) => game.debugSpawn(n, A, "graveyard"));
    return { game, kotis, bears, fodder };
  };
  const castFromYard = (game: Game, card: ObjectId, escapeExile?: ObjectId[]) =>
    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      targets: [],
      via: "graveyard-permission",
      ...(escapeExile !== undefined ? { escapeExile } : {}),
    });

  it("casts a creature from the graveyard by exiling three other cards, and grows as it enters", () => {
    const { game, kotis, bears, fodder } = withYard();
    const offer = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.card === bears && a.via === "graveyard-permission");
    expect(offer?.kind === "cast-spell" ? offer.escapeExile?.count : undefined).toBe(3);
    const chosen = [fodder[1], fodder[2], fodder[3]];
    castFromYard(game, bears, chosen);
    for (const id of chosen) expect(game.state.objects[id].zone).toBe("exile");
    expect(game.state.objects[fodder[0]].zone).toBe("graveyard");
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[bears].castVia).not.toBe("escape");
    expect(game.state.objects[kotis].counters["+1/+1"]).toBe(2);
  });

  it("does it once a turn, and not without three other cards", () => {
    const { game, bears } = withYard();
    const other = game.debugSpawn("Hill Giant", A, "graveyard");
    castFromYard(game, bears);
    game.advanceUntil(quiet);
    expect(() => castFromYard(game, other)).toThrow();
    const fresh = withYard();
    for (const id of fresh.fodder.slice(1)) fresh.game.debugApplyEffect(A, { kind: "exile", target: 0 }, [obj(id)]);
    expect(() => castFromYard(fresh.game, fresh.bears)).toThrow();
  });

  it("can't cast a creature card's noncreature half", () => {
    const game = setUp();
    ready(game, "Kotis, Sibsig Champion");
    const omen = game.debugSpawn("Stormshriek Feral", A, "graveyard");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Island", A, "graveyard");
    const offers = game.legalActions(A).filter((a) => a.kind === "cast-spell" && a.card === omen);
    expect(offers.length).toBeGreaterThan(0);
    expect(offers.every((a) => a.kind === "cast-spell" && (a.face ?? 0) === 0)).toBe(true);
  });

  it("grows when a creature is put onto the battlefield from a graveyard, not when one is cast from a hand", () => {
    const game = setUp();
    const kotis = ready(game, "Kotis, Sibsig Champion");
    cast(game, "Grizzly Bears");
    game.advanceUntil(quiet);
    expect(game.state.objects[kotis].counters["+1/+1"] ?? 0).toBe(0);
    const dead = game.debugSpawn("Hill Giant", A, "graveyard");
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [obj(dead)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[kotis].counters["+1/+1"]).toBe(2);
  });
});

describe("targets controlled by different players (Protector of the Wastes)", () => {
  const C = asPlayerId("carol");
  const threeWay = () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      decks: [A, B, C].map((p) => ({ player: p, cards: Array<string>(40).fill("Plains") })),
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    for (let i = 0; i < 8; i += 1) {
      const id = game.debugSpawn("Plains", A, "battlefield");
      game.state.objects[id].tapped = false;
    }
    return game;
  };
  const enterTargets = (game: Game) => {
    cast(game, "Protector of the Wastes");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || quiet(s));
  };

  it("exiles one artifact or enchantment from each of two players", () => {
    const game = threeWay();
    const [b1, c1] = [game.debugSpawn("Sol Ring", B, "battlefield"), game.debugSpawn("Sol Ring", C, "battlefield")];
    enterTargets(game);
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(b1), obj(c1)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[b1].zone).toBe("exile");
    expect(game.state.objects[c1].zone).toBe("exile");
  });

  it("refuses two controlled by the same player, and offers the second slot nothing of theirs", () => {
    const game = threeWay();
    const [b1, b2] = [game.debugSpawn("Sol Ring", B, "battlefield"), game.debugSpawn("Sol Ring", B, "battlefield")];
    const c1 = game.debugSpawn("Sol Ring", C, "battlefield");
    enterTargets(game);
    expect(() => game.dispatch({ type: "choose-targets", player: A, targets: [obj(b1), obj(b2)] })).toThrow();
    const facts = game.controllerView(A).targetFacts;
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-targets") throw new Error("no targets asked");
    const second = slotOptions(awaiting.specs, awaiting.options, 1, [obj(b1)], facts);
    expect(second.some((r) => r.kind === "object" && r.object === b2)).toBe(false);
    expect(second.some((r) => r.kind === "object" && r.object === c1)).toBe(true);
  });

  it("makes both targets illegal once one player controls both", () => {
    const game = threeWay();
    const [b1, c1] = [game.debugSpawn("Sol Ring", B, "battlefield"), game.debugSpawn("Sol Ring", C, "battlefield")];
    enterTargets(game);
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(b1), obj(c1)] });
    // In response, B gains control of C's Sol Ring.
    game.debugApplyEffect(B, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(c1)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[b1].zone).toBe("battlefield");
    expect(game.state.objects[c1].zone).toBe("battlefield");
  });

  it("triggers again as it becomes monstrous", () => {
    const game = threeWay();
    const protector = ready(game, "Protector of the Wastes");
    for (let i = 0; i < 5; i += 1) {
      const id = game.debugSpawn("Plains", A, "battlefield");
      game.state.objects[id].tapped = false;
    }
    const ring = game.debugSpawn("Sol Ring", B, "battlefield");
    activate(game, protector);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || quiet(s));
    // One legal target and two optional slots: still a choice.
    if (game.state.awaiting?.kind === "choose-targets") {
      game.dispatch({ type: "choose-targets", player: A, targets: [obj(ring), null] });
    }
    game.advanceUntil(quiet);
    expect(game.state.objects[ring].zone).toBe("exile");
    expect(game.state.objects[protector].monstrous).toBe(true);
  });
});

describe("Run Away Together", () => {
  it("returns two creatures controlled by different players, and refuses two of one player's", () => {
    const game = setUp();
    const mine = ready(game, "Grizzly Bears");
    const [a, b] = [ready(game, "Grizzly Bears", B), ready(game, "Hill Giant", B)];
    expect(() => cast(game, "Run Away Together", [obj(a), obj(b)])).toThrow();
    cast(game, "Run Away Together", [obj(mine), obj(a)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[mine].zone).toBe("hand");
    expect(game.state.objects[a].zone).toBe("hand");
    expect(game.state.objects[b].zone).toBe("battlefield");
  });

  it("isn't offered when one player controls every creature", () => {
    const game = setUp();
    ready(game, "Grizzly Bears", B);
    ready(game, "Hill Giant", B);
    game.debugSpawn("Run Away Together", A, "hand");
    expect(
      game.legalActions(A).some((a) => a.kind === "cast-spell" && a.cardName === "Run Away Together"),
    ).toBe(false);
  });
});

describe("Hydra Broodmaster", () => {
  it("makes X X/X Hydras as it becomes monstrous, X as activated", () => {
    const game = setUp();
    const hydra = ready(game, "Hydra Broodmaster");
    const before = new Set(game.state.zones.shared.battlefield);
    game.dispatch({ type: "activate-ability", player: A, source: hydra, abilityIndex: 0, targets: [], xValue: 2 });
    game.advanceUntil(quiet);
    expect(game.state.objects[hydra].counters["+1/+1"]).toBe(2);
    const tokens = game.state.zones.shared.battlefield.filter((id) => !before.has(id) && id !== hydra);
    const count = tokens.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(count).toBe(2);
    for (const id of tokens) {
      expect(game.characteristics(id).power).toBe(2);
      expect(game.characteristics(id).toughness).toBe(2);
    }
  });

  it("makes Hydras whose X/X is copied with them (rules 111.3, 707.2)", () => {
    const game = setUp();
    const hydra = ready(game, "Hydra Broodmaster");
    const before = new Set(game.state.zones.shared.battlefield);
    game.dispatch({ type: "activate-ability", player: A, source: hydra, abilityIndex: 0, targets: [], xValue: 2 });
    game.advanceUntil(quiet);
    // Populate: a token copy of one of them is a 2/2 Hydra too, not a 0/0.
    game.debugApplyEffect(A, { kind: "populate" });
    game.advanceUntil(quiet);
    const hydras = game.state.zones.shared.battlefield.filter((id) => !before.has(id) && id !== hydra);
    expect(hydras.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(3);
    for (const id of hydras) expect(game.characteristics(id).power).toBe(2);
  });
});

describe("Marang River Regent", () => {
  it("bounces up to two other nonland permanents, or draws three and discards as an Omen", () => {
    const game = setUp();
    const [x, y] = [ready(game, "Grizzly Bears", B), ready(game, "Sol Ring", B)];
    cast(game, "Marang River Regent");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || quiet(s));
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(x), obj(y)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[x].zone).toBe("hand");
    expect(game.state.objects[y].zone).toBe("hand");

    const omen = cast(game, "Marang River Regent", [], { face: 1 });
    game.advanceUntil((s) => s.awaiting?.kind === "discard" || quiet(s));
    if (game.state.awaiting?.kind === "discard") {
      game.dispatch({ type: "discard", player: A, cards: [game.state.zones.perPlayer[A].hand[0]] });
    }
    game.advanceUntil(quiet);
    expect(game.state.objects[omen].zone).toBe("library");
  });
});

describe("targets with a total power cap (Reunion of the House)", () => {
  it("returns creature cards whose power adds up to 10 or less, then exiles itself", () => {
    const game = setUp();
    const angel = game.debugSpawn("Serra Angel", A, "graveyard");
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const reunion = cast(game, "Reunion of the House", [obj(angel), obj(giant), obj(bears)]);
    game.advanceUntil(quiet);
    for (const id of [angel, giant, bears]) expect(game.state.objects[id].zone).toBe("battlefield");
    expect(game.state.objects[reunion].zone).toBe("exile");
  });

  it("refuses a set over 10, and a chooser is offered only what fits", () => {
    const game = setUp();
    const cards = ["Serra Angel", "Serra Angel", "Hill Giant"].map((n) => game.debugSpawn(n, A, "graveyard"));
    expect(() => cast(game, "Reunion of the House", cards.map(obj))).toThrow();
    const offer = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.cardName === "Reunion of the House");
    if (offer?.kind !== "cast-spell") throw new Error("no offer");
    const facts = game.controllerView(A).targetFacts;
    const next = slotOptions(offer.targetSpecs, offer.targetOptions, 2, [obj(cards[0]), obj(cards[1])], facts);
    // 4 + 4 taken: a 3-power Hill Giant fits no more.
    expect(next.length).toBe(0);
  });

  it("returns nothing when the total has gone over 10 by the time it resolves", () => {
    const game = setUp();
    const angels = ["Serra Angel", "Serra Angel"].map((n) => game.debugSpawn(n, A, "graveyard"));
    const reunion = cast(game, "Reunion of the House", angels.map(obj));
    // A card's power rising in the graveyard: here, a stand-in for a CDA.
    game.state.objects[angels[0]].modifiers.push({ power: 3, toughness: 0, keywords: [], untilEndOfTurn: false });
    game.advanceUntil(quiet);
    expect(game.state.objects[angels[0]].zone).toBe("graveyard");
    expect(game.state.objects[angels[1]].zone).toBe("graveyard");
    expect(game.state.objects[reunion].zone).toBe("graveyard");
  });
});

describe("omen cards", () => {
  const inLibrary = (game: Game, id: ObjectId) => game.state.zones.perPlayer[A].library.includes(id);

  it("shuffles an Omen into its owner's library as it resolves (Flush Out)", () => {
    const game = setUp();
    game.debugSpawn("Island", A, "hand");
    const before = handSize(game);
    const card = cast(game, "Stormshriek Feral", [], { face: 1 });
    expect(game.state.objects[card].zone).toBe("stack");
    game.advanceUntil((s) => s.awaiting?.kind === "discard" || quiet(s));
    if (game.state.awaiting?.kind === "discard") {
      const [first] = game.state.zones.perPlayer[A].hand;
      game.dispatch({ type: "discard", player: A, cards: [first] });
    }
    game.advanceUntil(quiet);
    expect(game.state.objects[card].zone).toBe("library");
    expect(inLibrary(game, card)).toBe(true);
    // The Island discarded, two drawn (the omen card itself left the hand).
    expect(handSize(game)).toBe(before - 1 + 2);
  });

  it("has a copy of an Omen cease to exist, its owner still shuffling (Coil and Catch)", () => {
    const game = setUp();
    const card = cast(game, "Marang River Regent", [], { face: 1 });
    game.debugApplyEffect(A, { kind: "copy-spell", target: 0 }, [obj(card)]);
    const copy = game.state.zones.shared.stack.find((id) => id !== card);
    expect(copy).toBeDefined();
    const from = game.state.eventLog.length;
    // Resolve the copy alone: draw three, discard one.
    game.advanceUntil((s) => s.awaiting?.kind === "discard" || !s.zones.shared.stack.includes(copy!));
    if (game.state.awaiting?.kind === "discard") {
      game.dispatch({ type: "discard", player: A, cards: [game.state.zones.perPlayer[A].hand[0]] });
    }
    game.advanceUntil((s) => s.awaiting !== null || !s.zones.shared.stack.includes(copy!));
    expect(game.state.objects[copy!]).toBeUndefined();
    const shuffles = game.state.eventLog.slice(from).filter((e) => e.type === "library-shuffled");
    expect(shuffles).toEqual([expect.objectContaining({ player: A })]);
    // The original is still waiting on the stack.
    expect(game.state.zones.shared.stack).toContain(card);
  });

  it("casts the creature half as a creature", () => {
    const game = setUp();
    const card = cast(game, "Stormshriek Feral");
    game.advanceUntil(quiet);
    expect(game.state.objects[card].zone).toBe("battlefield");
    expect(game.characteristics(card).types).toContain("creature");
  });

  it("puts a countered Omen into the graveyard, not the library", () => {
    const game = setUp();
    const card = cast(game, "Stormshriek Feral", [], { face: 1 });
    cast(game, "Counterspell", [obj(card)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[card].zone).toBe("graveyard");
  });

  it("puts a fizzled Omen into the graveyard (Dynamic Soar)", () => {
    const game = setUp();
    const bear = ready(game, "Grizzly Bears");
    const card = cast(game, "Whirlwing Stormbrood", [obj(bear)], { face: 1 });
    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0 }, [obj(bear)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[card].zone).toBe("graveyard");
  });

  it("resolves Dynamic Soar's three counters, then shuffles it away", () => {
    const game = setUp();
    const bear = ready(game, "Grizzly Bears");
    const card = cast(game, "Whirlwing Stormbrood", [obj(bear)], { face: 1 });
    game.advanceUntil(quiet);
    expect(game.state.objects[bear].counters["+1/+1"]).toBe(3);
    expect(game.state.objects[card].zone).toBe("library");
  });

  it("lets Whirlwing Stormbrood's controller cast sorceries and Dragons at instant speed, judged by the half cast", () => {
    const game = setUp();
    game.debugSpawn("Whirlwing Stormbrood", A, "battlefield");
    // Something on the stack: only instant speed is open.
    cast(game, "Shock", [player(B)]);
    const soar = game.debugSpawn("Whirlwing Stormbrood", A, "hand");
    const bear = ready(game, "Grizzly Bears");
    // Dynamic Soar is a sorcery: allowed.
    expect(() => game.dispatch({ type: "cast-spell", player: A, card: soar, targets: [obj(bear)], face: 1 })).not.toThrow();
    // A non-Dragon creature isn't.
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    expect(() => game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] })).toThrow();
    // A Dragon is.
    const feral = game.debugSpawn("Stormshriek Feral", A, "hand");
    expect(() => game.dispatch({ type: "cast-spell", player: A, card: feral, targets: [] })).not.toThrow();
  });
});

describe("exert as it attacks", () => {
  /** Declare `attackers` against B and stop at the first exert question. */
  const attackWith = (game: Game, ...attackers: ObjectId[]) => {
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: attackers.map((attacker) => ({ attacker, defender: B })),
    });
  };
  const exertQuestion = (game: Game) => {
    const awaiting = game.state.awaiting;
    return awaiting?.kind === "choose-modes" && awaiting.modes[0]?.effect.kind === "exert" ? awaiting : undefined;
  };

  it("asks as the attack is declared, and Glorybringer's 'when you do' deals 4", () => {
    const game = setUp();
    const glory = ready(game, "Glorybringer");
    const bear = ready(game, "Grizzly Bears", B);
    attackWith(game, glory);
    expect(exertQuestion(game)?.source).toBe(glory);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    // The bear is the only legal target, so it's chosen without asking.
    game.advanceUntil((s) => quiet(s) || s.awaiting?.kind === "blockers");
    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.state.objects[glory].exertedBy).toBe(A);
  });

  it("does nothing when declined, and an exerted creature skips its next untap step only", () => {
    const game = setUp();
    const glory = ready(game, "Glorybringer");
    const other = ready(game, "Glorybringer");
    attackWith(game, glory, other);
    // One question per attacker that may exert.
    game.dispatch({ type: "choose-modes", player: A, modes: [] });
    expect(exertQuestion(game)?.source).toBe(other);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    // Into A's next turn: the declined one untapped, the exerted one didn't.
    game.advanceUntil((s) => activePlayerOf(s) === A && s.turn.step === "precombat-main" && s.turn.number > 1);
    expect(game.state.turn.number).toBe(3);
    expect(game.state.objects[glory].tapped).toBe(false);
    expect(game.state.objects[other].tapped).toBe(true);
    expect(game.state.objects[other].exertedBy).toBeUndefined();
    // …and the turn after, it does.
    game.advanceUntil((s) => activePlayerOf(s) === A && s.turn.step === "precombat-main" && s.turn.number > 3);
    expect(game.state.turn.number).toBe(5);
    expect(game.state.objects[other].tapped).toBe(false);
  });

  it("can't target a Dragon, nor a creature of its controller's", () => {
    const game = setUp();
    const glory = ready(game, "Glorybringer");
    const dragon = ready(game, "Glorybringer", B);
    const mine = ready(game, "Grizzly Bears");
    attackWith(game, glory);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    // No legal target at all: the trigger is removed, the exert stands.
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    expect(game.state.awaiting?.kind).not.toBe("choose-targets");
    expect(game.state.objects[dragon].damageMarked).toBe(0);
    expect(game.state.objects[mine].damageMarked).toBe(0);
    expect(game.state.objects[glory].exertedBy).toBe(A);
  });

  it("gives Combat Celebrant an extra combat with everything else untapped, once a turn", () => {
    const game = setUp();
    const celebrant = ready(game, "Combat Celebrant");
    const bears = ready(game, "Grizzly Bears");
    const before = game.state.players[B].life;
    attackWith(game, celebrant, bears);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil((s) => s.turn.step === "declare-blockers" || s.awaiting?.kind === "blockers");
    // The other attacker is untapped (and still attacking); the Celebrant isn't.
    expect(game.state.objects[bears].tapped).toBe(false);
    expect(game.state.objects[celebrant].tapped).toBe(true);
    // The second combat: the Bears attack again, the Celebrant can't be
    // exerted a second time this turn (and is tapped anyway).
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.turn.step === "end");
    expect(game.state.awaiting?.kind).toBe("attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: bears, defender: B }] });
    expect(exertQuestion(game)).toBeUndefined();
    game.advanceUntil((s) => s.turn.step === "end");
    // 4 + 2 in the first combat, 2 in the second.
    expect(game.state.players[B].life).toBe(before - 8);
  });
});
