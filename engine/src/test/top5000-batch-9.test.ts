/**
 * Top-5000 batch 9 (ranks 1507–1632) and what it needed: an extra land drop
 * that reaches every player (Rites of Flourishing — `extraLandsForEachPlayer`),
 * a mill made "that many plus four" (The Water Crystal — `would-mill`'s
 * `plus`), "unless it escaped" (Uro — the `castVia` filter clause, read off
 * the permanent's entry), and a spell's own "when you cast this spell"
 * reading its X (Hydroid Krasis). One test per clause most likely to be
 * wrong.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (
  hand: readonly string[] = [],
  library = "Wastes",
  opts: { maxLandsPerTurn?: number; handB?: readonly string[] } = {},
): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: opts.maxLandsPerTurn ?? 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: [...(opts.handB ?? []), ...Array<string>(40).fill("Wastes")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const tokens = (game: Game, name: string, owner?: PlayerId): number =>
  named(game, name)
    .filter((id) => owner === undefined || game.state.objects[id].controller === owner)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const graveyard = (game: Game, p: PlayerId): readonly ObjectId[] => game.state.zones.perPlayer[p].graveyard;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
/** Resolve everything, answering "you may" and a modal choice with the first
 * option, and a pick from the hand with nothing. */
const settle = (game: Game): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [0] });
    } else {
      return;
    }
  }
  throw new Error("settle: still unresolved");
};

describe("top-5000 batch 9 — Rites of Flourishing", () => {
  it("gives every player, not only its controller, an extra land drop", () => {
    const game = setUp([], "Wastes", { maxLandsPerTurn: 1 });
    const g = game as unknown as { maxLandsFor(p: PlayerId): number };
    expect(g.maxLandsFor(A)).toBe(1);
    expect(g.maxLandsFor(B)).toBe(1);
    spawn(game, "Rites of Flourishing");
    expect(g.maxLandsFor(A)).toBe(2);
    expect(g.maxLandsFor(B)).toBe(2);
    // Azusa's is still only her controller's.
    spawn(game, "Azusa, Lost but Seeking");
    expect(g.maxLandsFor(A)).toBe(4);
    expect(g.maxLandsFor(B)).toBe(2);
  });

  it("makes the active player draw an extra card at their draw step", () => {
    const game = setUp();
    spawn(game, "Rites of Flourishing");
    const before = game.handOf(B).length;
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    // B's turn: the normal draw and one more.
    expect(game.handOf(B).length).toBe(before + 2);
  });
});

describe("top-5000 batch 9 — The Water Crystal", () => {
  it("adds four to an opponent's mill, never to its controller's, nor to a mill of none", () => {
    const game = setUp();
    spawn(game, "The Water Crystal");
    game.debugApplyEffect(A, { kind: "mill", target: "each-opponent", amount: 3 }, []);
    expect(graveyard(game, B).length).toBe(7);
    game.debugApplyEffect(A, { kind: "mill", target: "you", amount: 2 }, []);
    expect(graveyard(game, A).length).toBe(2);
    game.debugApplyEffect(A, { kind: "mill", target: "each-opponent", amount: 0 }, []);
    expect(graveyard(game, B).length).toBe(7);
  });

  it("goes after Bruvac's doubling: three becomes ten", () => {
    const game = setUp();
    spawn(game, "The Water Crystal");
    spawn(game, "Bruvac the Grandiloquent");
    game.debugApplyEffect(A, { kind: "mill", target: "each-opponent", amount: 3 }, []);
    expect(graveyard(game, B).length).toBe(10);
  });

  it("makes blue spells cost {1} less", () => {
    const game = setUp(["Maddening Cacophony"], "Island");
    lands(game, "Island", 1);
    // {1}{U} for one Island.
    expect(
      game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === inHand(game, "Maddening Cacophony")),
    ).toBe(false);
    spawn(game, "The Water Crystal");
    expect(
      game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === inHand(game, "Maddening Cacophony")),
    ).toBe(true);
  });
});

describe("top-5000 batch 9 — Uro's 'unless it escaped'", () => {
  it("is sacrificed when cast from hand, after its enters trigger still gains and draws", () => {
    const game = setUp(["Uro, Titan of Nature's Wrath"], "Forest");
    lands(game, "Forest", 1);
    lands(game, "Island", 2);
    const uro = inHand(game, "Uro, Titan of Nature's Wrath");
    const hand = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: uro, targets: [] });
    settle(game);
    for (let guard = 0; guard < 5 && game.state.awaiting !== null; guard += 1) {
      const awaiting = game.state.awaiting!;
      // Put no land from the hand onto the battlefield.
      game.dispatch({ type: "choose-from-zone", player: awaiting.player, chosen: [] });
      settle(game);
    }
    expect(zone(game, uro)).toBe("graveyard");
    expect(life(game, A)).toBe(23);
    // Uro left the hand, one card came in.
    expect(game.handOf(A).length).toBe(hand);
  });

  it("stays when it escaped", () => {
    const game = setUp([], "Forest");
    lands(game, "Forest", 2);
    lands(game, "Island", 2);
    const uro = game.debugSpawn("Uro, Titan of Nature's Wrath", A, "graveyard");
    for (let i = 0; i < 5; i += 1) game.debugSpawn("Wastes", A, "graveyard");
    game.dispatch({ type: "cast-spell", player: A, card: uro, targets: [], via: "escape" });
    settle(game);
    for (let guard = 0; guard < 5 && game.state.awaiting !== null; guard += 1) {
      game.dispatch({ type: "choose-from-zone", player: game.state.awaiting!.player, chosen: [] });
      settle(game);
    }
    expect(zone(game, uro)).toBe("battlefield");
  });
});

describe("top-5000 batch 9 — Hydroid Krasis's cast trigger", () => {
  it("reads the X it was cast for: X=5 gains 2 life, draws 2, and enters with five counters", () => {
    const game = setUp(["Hydroid Krasis"], "Forest");
    lands(game, "Forest", 4);
    lands(game, "Island", 3);
    const krasis = inHand(game, "Hydroid Krasis");
    const hand = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: krasis, targets: [], xValue: 5 });
    settle(game);
    expect(life(game, A)).toBe(22);
    expect(game.handOf(A).length).toBe(hand - 1 + 2);
    expect(counters(game, krasis)).toBe(5);
  });
});

describe("top-5000 batch 9 — Stubborn Denial's ferocious", () => {
  // B casts Opt on its own turn and would pay {1}; A answers with the Denial.
  const denial = (bigCreature: boolean): { game: Game; opt: ObjectId } => {
    const b = new ScriptedController(B);
    b.chooseModesFn = () => [0];
    const game = Game.create({
      seed: 1,
      shuffle: false,
      startingPlayer: A,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: new ScriptedController(A), [B]: b },
      decks: [
        { player: A, cards: Array<string>(40).fill("Island") },
        { player: B, cards: Array<string>(40).fill("Island") },
      ],
    });
    spawn(game, "Island");
    lands(game, "Island", 3, B);
    if (bigCreature) spawn(game, "Colossal Dreadmaw");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    const opt = game.debugSpawn("Opt", B, "hand");
    game.dispatch({ type: "cast-spell", player: B, card: opt, targets: [] });
    game.advanceUntil((s) => s.priority.holder === A);
    const card = game.debugSpawn("Stubborn Denial", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [{ kind: "object", object: opt }] });
    game.advanceUntil(quiet);
    return { game, opt };
  };

  it("lets its controller pay {1} without a 4-power creature", () => {
    const { game, opt } = denial(false);
    expect(zone(game, opt)).toBe("graveyard");
    // Opt resolved: B scried and drew.
    expect(game.eventsOfType("spell-countered").some((e) => e.object === opt)).toBe(false);
  });

  it("counters it outright with one, payment or no", () => {
    const { game, opt } = denial(true);
    expect(game.eventsOfType("spell-countered").some((e) => e.object === opt)).toBe(true);
  });
});

describe("top-5000 batch 9 — Rumor Gatherer", () => {
  it("draws instead of scrying on exactly its second resolution this turn", () => {
    const game = setUp();
    spawn(game, "Rumor Gatherer");
    const hand = game.handOf(A).length;
    // A creature token entering fires it; the scripted controller keeps the
    // scried card on top.
    const enterOne = (): void => {
      game.debugApplyEffect(A, { kind: "create-token", token: "Servo Token", count: 1 }, []);
      game.advanceUntil(quiet);
    };
    enterOne();
    expect(game.handOf(A).length).toBe(hand);
    enterOne();
    expect(game.handOf(A).length).toBe(hand + 1);
    enterOne();
    expect(game.handOf(A).length).toBe(hand + 1);
  });
});

describe("top-5000 batch 9 — It That Betrays", () => {
  it("takes an opponent's sacrificed nontoken permanent, not a token", () => {
    const game = setUp();
    spawn(game, "It That Betrays");
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(B, { kind: "create-token", token: "Servo Token", count: 1 }, []);
    const token = named(game, "Servo Token")[0];
    // The sacrifice is made at the priority check the resolution ends in.
    const edict = (filter: object): void => {
      game.debugApplyEffect(B, { kind: "sacrifice", who: "you", filter: { type: "creature", ...filter }, count: 1 }, []);
      (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(A);
      settle(game);
    };
    edict({ token: true });
    expect(game.battlefield).not.toContain(token);
    expect(tokens(game, "Servo Token", A)).toBe(0);
    edict({ token: false });
    expect(zone(game, bears)).toBe("battlefield");
    expect(game.state.objects[bears].controller).toBe(A);
  });
});

describe("top-5000 batch 9 — Gratuitous Violence", () => {
  it("doubles your creatures' damage and nothing else's", () => {
    const game = setUp();
    spawn(game, "Gratuitous Violence");
    const bears = spawn(game, "Grizzly Bears");
    const violence = named(game, "Gratuitous Violence")[0];
    game.debugApplyEffect(A, { kind: "damage", amount: 2, who: "each-opponent" }, [], { source: bears });
    expect(life(game, B)).toBe(16);
    // A noncreature source (the enchantment itself) deals its own amount.
    game.debugApplyEffect(A, { kind: "damage", amount: 2, who: "each-opponent" }, [], { source: violence });
    expect(life(game, B)).toBe(14);
  });
});

describe("top-5000 batch 9 — Pawn of Ulamog", () => {
  it("offers a Spawn for itself and a nontoken creature, never for a token", () => {
    const game = setUp();
    const pawn = spawn(game, "Pawn of Ulamog");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "create-token", token: "Servo Token", count: 1 }, []);
    const servo = named(game, "Servo Token")[0];
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: servo }]);
    settle(game);
    expect(tokens(game, "Eldrazi Spawn Token")).toBe(0);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(tokens(game, "Eldrazi Spawn Token")).toBe(1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: pawn }]);
    settle(game);
    expect(tokens(game, "Eldrazi Spawn Token")).toBe(2);
  });
});

describe("top-5000 batch 9 — Hangarback Walker", () => {
  it("makes a Thopter for each +1/+1 counter it died with", () => {
    const game = setUp(["Hangarback Walker"], "Wastes");
    lands(game, "Wastes", 6);
    const walker = inHand(game, "Hangarback Walker");
    game.dispatch({ type: "cast-spell", player: A, card: walker, targets: [], xValue: 3 });
    settle(game);
    expect(counters(game, walker)).toBe(3);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: walker }]);
    settle(game);
    expect(tokens(game, "Thopter Token")).toBe(3);
  });
});

describe("top-5000 batch 9 — Codsworth's attach ability", () => {
  it("moves an Equipment you control onto a creature you control", () => {
    const game = setUp();
    const cods = spawn(game, "Codsworth, Handy Helper");
    const sword = spawn(game, "Sword of Vengeance");
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: cods,
      abilityIndex: 1,
      targets: [
        { kind: "object", object: sword },
        { kind: "object", object: bears },
      ],
    });
    settle(game);
    expect(game.state.objects[sword].attachedTo).toBe(bears);
  });
});

describe("top-5000 batch 9 — Elvish Warmaster", () => {
  it("makes one Elf Warrior a turn however many Elves enter", () => {
    const game = setUp();
    spawn(game, "Elvish Warmaster");
    game.debugSpawn("Llanowar Elves", A, "battlefield", { announceEntry: true });
    settle(game);
    game.debugSpawn("Llanowar Elves", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(tokens(game, "Elf Warrior Token")).toBe(1);
  });
});

describe("top-5000 batch 9 — Relentless Assault", () => {
  it("untaps only the creatures that attacked this turn", () => {
    const game = setUp(["Relentless Assault"], "Mountain");
    lands(game, "Mountain", 4);
    const attacker = spawn(game, "Grizzly Bears");
    const tapped = spawn(game, "Grizzly Bears");
    game.state.objects[tapped].tapped = true;
    game.state.objects[attacker].tapped = true;
    game.state.objects[attacker].attackedThisTurn = true;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Relentless Assault"), targets: [] });
    settle(game);
    expect(game.state.objects[attacker].tapped).toBe(false);
    expect(game.state.objects[tapped].tapped).toBe(true);
  });
});

describe("top-5000 batch 9 — life-gain doubling", () => {
  it("doubles after Bilbo's plus one: 3 becomes 8, and two doublers make 16", () => {
    const game = setUp();
    spawn(game, "Rhox Faithmender");
    spawn(game, "Bilbo, Birthday Celebrant");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 }, []);
    expect(life(game, A)).toBe(28);
    spawn(game, "Boon Reflection");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 }, []);
    expect(life(game, A)).toBe(28 + 16);
  });

  it("never doubles an opponent's gain", () => {
    const game = setUp();
    spawn(game, "The Wind Crystal");
    game.debugApplyEffect(B, { kind: "gain-life", amount: 3 }, []);
    expect(life(game, B)).toBe(23);
  });
});
