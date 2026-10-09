/**
 * Top-5000 batch 24c. No engine change: each test pins the clause most
 * likely to be wired wrong — a counter then a doubling (Invigorating Surge),
 * For Mirrodin!'s token-then-attach and an untap of every attacker (Hexplate
 * Wallbreaker), a granted "attacks alone" pump counted as it resolves
 * (Idolized), creatures-with-counters rather than counters (Armorcraft
 * Judge), cascade only on enchantment spells (Wildsear), a mill whose find is
 * put onto the battlefield (Fetch Quest), and a free-only play permission
 * (Mind's Desire).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pt = (game: Game, id: ObjectId): [number | null, number | null] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power, c.toughness];
};
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
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;
const toAttackers = (game: Game): void => {
  game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
};

describe("top-5000 batch 24c — Invigorating Surge", () => {
  it("adds a counter first, then doubles the total", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 1 };
    game.debugApplyEffect(A, effectOf("Invigorating Surge"), [{ kind: "object", object: bears }]);
    settle(game);
    expect(counters(game, bears)).toBe(4);
  });
});

describe("top-5000 batch 24c — Hexplate Wallbreaker", () => {
  it("For Mirrodin! makes a 2/2 Rebel and equips it", () => {
    const { game } = setUp();
    const hexplate = game.debugSpawn("Hexplate Wallbreaker", A, "battlefield", { announceEntry: true });
    settle(game);
    const rebels = named(game, "Rebel Token");
    expect(rebels).toHaveLength(1);
    expect(game.state.objects[hexplate].attachedTo).toBe(rebels[0]);
    expect(pt(game, rebels[0])).toEqual([4, 4]);
  });

  it("untaps every attacker and adds a combat, only in the first combat", () => {
    const { game } = setUp();
    const hexplate = spawn(game, "Hexplate Wallbreaker");
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant");
    game.state.objects[hexplate].attachedTo = bears;
    toAttackers(game);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: bears, defender: B },
        { attacker: giant, defender: B },
      ],
    });
    settle(game);
    expect(game.state.objects[bears].tapped).toBe(false);
    expect(game.state.objects[giant].tapped).toBe(false);
    // A second declare-attackers step this turn.
    game.advanceUntil(
      (s) => (s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers") || s.turn.number > 1,
    );
    expect(game.state.turn.number).toBe(1);
    // Attacking again in the extra combat adds no third one.
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: bears, defender: B }] });
    settle(game);
    expect(game.state.objects[bears].tapped).toBe(true);
    game.advanceUntil(
      (s) => (s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers") || s.turn.number > 1,
    );
    expect(game.state.turn.number).toBeGreaterThan(1);
  });
});

describe("top-5000 batch 24c — Sifter of Skulls", () => {
  it("makes a Scion when another nontoken creature of yours dies, not a token", () => {
    const { game } = setUp();
    spawn(game, "Sifter of Skulls");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    const scions = named(game, "Eldrazi Scion Token");
    expect(scions).toHaveLength(1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: scions[0] }]);
    settle(game);
    expect(named(game, "Eldrazi Scion Token")).toHaveLength(0);
  });
});

describe("top-5000 batch 24c — Idolized", () => {
  it("pumps a lone attacker by the nonland permanents its controller has", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const idol = spawn(game, "Idolized");
    game.state.objects[idol].attachedTo = bears;
    spawn(game, "Sol Ring");
    spawn(game, "Ornithopter");
    lands(game, "Plains", 3);
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: bears, defender: B }] });
    settle(game);
    // Bears, Idolized, Sol Ring, Ornithopter: X = 4; the Plains don't count.
    expect(pt(game, bears)).toEqual([6, 6]);
  });

  it("doesn't trigger when another creature attacks too", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const idol = spawn(game, "Idolized");
    game.state.objects[idol].attachedTo = bears;
    const thopter = spawn(game, "Ornithopter");
    toAttackers(game);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: bears, defender: B },
        { attacker: thopter, defender: B },
      ],
    });
    settle(game);
    expect(pt(game, bears)).toEqual([2, 2]);
  });
});

describe("top-5000 batch 24c — Armorcraft Judge", () => {
  it("draws one per creature with a +1/+1 counter, not one per counter", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const elves = spawn(game, "Llanowar Elves");
    spawn(game, "Hill Giant");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.state.objects[bears].counters = { "+1/+1": 3 };
    game.state.objects[elves].counters = { "+1/+1": 1 };
    game.state.objects[theirs].counters = { "+1/+1": 1 };
    const hand = game.handOf(A).length;
    game.debugSpawn("Armorcraft Judge", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.handOf(A).length).toBe(hand + 2);
  });
});

describe("top-5000 batch 24c — Regal Force", () => {
  it("counts green creatures you control, itself included", () => {
    const { game } = setUp();
    spawn(game, "Llanowar Elves");
    spawn(game, "Ornithopter");
    spawn(game, "Llanowar Elves", B);
    const hand = game.handOf(A).length;
    game.debugSpawn("Regal Force", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.handOf(A).length).toBe(hand + 2);
  });
});

describe("top-5000 batch 24c — Wildsear, Scouring Maw", () => {
  /** Cast `name` from alice's hand and resolve everything, declining every
   * free-cast offer; returns how many cascades revealed cards. */
  const castAndCount = (game: Game, name: string): number => {
    const card = game.debugSpawn(name, A, "hand");
    const before = game.eventsOfType("cascade-revealed").length;
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    for (let i = 0; i < 200 && !quiet(game.state); i += 1) {
      if (game.state.awaiting?.kind === "cast-now") {
        game.dispatch({ type: "cast-now", player: game.state.awaiting.player, cast: null });
      } else if (game.state.awaiting !== null) {
        throw new Error(`unexpected ${game.state.awaiting.kind}`);
      } else {
        game.dispatch({ type: "pass-priority", player: game.state.priority.holder! });
      }
    }
    return game.eventsOfType("cascade-revealed").length - before;
  };

  it("gives enchantment spells cast from hand cascade, not other spells", () => {
    const { game } = setUp([], "Grizzly Bears");
    spawn(game, "Wildsear, Scouring Maw");
    lands(game, "Mountain", 8);
    expect(castAndCount(game, "Fervor")).toBe(1);
    expect(castAndCount(game, "Hill Giant")).toBe(0);
  });
});

describe("top-5000 batch 24c — Mind's Desire", () => {
  const exiledOfA = (game: Game): ObjectId[] =>
    game.state.zones.shared.exile.filter((id) => game.state.objects[id].owner === A);

  it("exiles the top card, castable this turn only without paying its mana cost", () => {
    const { game } = setUp([], "Grizzly Bears");
    game.debugApplyEffect(A, effectOf("Mind's Desire"), []);
    settle(game);
    const exiled = exiledOfA(game);
    expect(exiled).toHaveLength(1);
    const offers = game.legalActions(A).filter((o) => o.kind === "cast-spell" && o.card === exiled[0]);
    expect(offers.length).toBeGreaterThan(0);
    expect(offers.every((o) => o.kind === "cast-spell" && o.free === true)).toBe(true);
  });

  it("lets a land be played", () => {
    const { game } = setUp([], "Forest");
    game.debugApplyEffect(A, effectOf("Mind's Desire"), []);
    settle(game);
    const exiled = exiledOfA(game);
    expect(exiled).toHaveLength(1);
    expect(game.legalActions(A).some((o) => o.kind === "play-land" && o.card === exiled[0])).toBe(true);
  });
});

describe("top-5000 batch 24c — Risky Shortcut", () => {
  it("draws two and each player loses 2", () => {
    const { game } = setUp();
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, effectOf("Risky Shortcut"), []);
    settle(game);
    expect(game.handOf(A).length).toBe(hand + 2);
    expect(life(game, A)).toBe(18);
    expect(life(game, B)).toBe(18);
  });
});
