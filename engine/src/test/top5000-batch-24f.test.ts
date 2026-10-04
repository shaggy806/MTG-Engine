/**
 * Top-5000 batch 24f. No engine change: each card is existing vocabulary.
 * These pin the clause most likely to be wired wrong on each — the two
 * halves of "this or another nontoken historic permanent" (Arbaaz Mir), a
 * Threaten that also adds a creature type (Coercive Recruiter), a mana rider
 * read off the spell it pays for (Scaled Nurturer), exactly X targets on an
 * activated ability (Magus of the Candelabra), "another" in a reflexive
 * trigger made by a sacrifice (Eden), a filtered target (Hidden Hideout),
 * a CDA over Rats plus a copy (Pack Rat), modular as its two abilities
 * (Arcbound Ravager), an enrage copy (Polyraptor) and a chosen-type pump
 * (And They Shall Know No Fear).
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
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pt = (game: Game, id: ObjectId): [number, number] => {
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

describe("top-5000 batch 24f — Arbaaz Mir", () => {
  it("fires for itself and another nontoken historic permanent, not a nonhistoric one or a token", () => {
    const { game } = setUp();
    game.debugSpawn("Arbaaz Mir", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(21);
    game.debugSpawn("Sol Ring", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    settle(game);
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 });
    settle(game);
    expect(named(game, "Treasure Token")).toHaveLength(1);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
  });
});

describe("top-5000 batch 24f — Coercive Recruiter", () => {
  it("steals, untaps and hastes the target, which becomes a Pirate too", () => {
    const { game, a } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield", { tapped: true });
    a.chooseTargetsFn = () => [{ kind: "object", object: bears }];
    game.debugSpawn("Coercive Recruiter", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.objects[bears].controller).toBe(A);
    expect(game.state.objects[bears].tapped).toBe(false);
    const c = computeCharacteristics(game.state, registry, bears);
    expect(c.keywords.has("haste")).toBe(true);
    expect(c.subtypes).toContain("Pirate");
    expect(c.subtypes).toContain("Bear");
  });
});

describe("top-5000 batch 24f — Scaled Nurturer", () => {
  it("gains 2 life when its mana pays for a Dragon creature spell", () => {
    const { game } = setUp(["Scaled Nurturer"]);
    const nurturer = spawn(game, "Scaled Nurturer");
    lands(game, "Forest", 1);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Scaled Nurturer"), targets: [] });
    expect(game.state.objects[nurturer].tapped).toBe(true);
    settle(game);
    expect(life(game, A)).toBe(22);
    expect(named(game, "Scaled Nurturer")).toHaveLength(2);
  });

  it("gains nothing when its mana pays for a non-Dragon", () => {
    const { game } = setUp(["Grizzly Bears"]);
    const nurturer = spawn(game, "Scaled Nurturer");
    lands(game, "Forest", 1);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears"), targets: [] });
    expect(game.state.objects[nurturer].tapped).toBe(true);
    settle(game);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-5000 batch 24f — Magus of the Candelabra", () => {
  it("untaps exactly the X lands targeted", () => {
    const { game } = setUp();
    const magus = spawn(game, "Magus of the Candelabra");
    const tapped = Array.from({ length: 3 }, () =>
      game.debugSpawn("Forest", A, "battlefield", { tapped: true, summoningSick: false }),
    );
    lands(game, "Wastes", 2);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: magus,
      abilityIndex: 0,
      xValue: 2,
      targets: [
        { kind: "object", object: tapped[0] },
        { kind: "object", object: tapped[1] },
      ],
    });
    settle(game);
    expect(game.state.objects[tapped[0]].tapped).toBe(false);
    expect(game.state.objects[tapped[1]].tapped).toBe(false);
    expect(game.state.objects[tapped[2]].tapped).toBe(true);
    expect(game.state.objects[magus].tapped).toBe(true);
  });
});

describe("top-5000 batch 24f — Eden, Seat of the Sanctum", () => {
  it("mills two, is sacrificed, and the reflexive trigger returns another permanent card", () => {
    // A library of instants, so the milled cards are no candidates.
    const { game } = setUp([], "Lightning Bolt");
    const eden = spawn(game, "Eden, Seat of the Sanctum");
    game.state.objects[eden].tapped = false;
    lands(game, "Wastes", 5);
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const before = game.state.zones.perPlayer[A].graveyard.length;
    game.dispatch({ type: "activate-ability", player: A, source: eden, abilityIndex: 1 });
    settle(game);
    expect(zone(game, eden)).toBe("graveyard");
    expect(zone(game, bears)).toBe("hand");
    // Two Bolts and Eden went in, the Bears came out.
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(before + 2);
  });

  it("can't return itself: with no other permanent card there, Eden stays in the graveyard", () => {
    const { game } = setUp([], "Lightning Bolt");
    const eden = spawn(game, "Eden, Seat of the Sanctum");
    game.state.objects[eden].tapped = false;
    lands(game, "Wastes", 5);
    game.dispatch({ type: "activate-ability", player: A, source: eden, abilityIndex: 1 });
    settle(game);
    expect(zone(game, eden)).toBe("graveyard");
  });
});

describe("top-5000 batch 24f — Hidden Hideout", () => {
  it("gives lifelink only to a creature you control with a counter on it", () => {
    const { game } = setUp();
    const hideout = spawn(game, "Hidden Hideout");
    game.state.objects[hideout].tapped = false;
    lands(game, "Wastes", 2);
    const bears = spawn(game, "Grizzly Bears");
    const canActivate = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === hideout && x.abilityIndex === 1);
    expect(canActivate()).toBe(false);
    game.state.objects[bears].counters = { "-1/-1": 1 };
    expect(canActivate()).toBe(true);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: hideout,
      abilityIndex: 1,
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("lifelink")).toBe(true);
  });
});

describe("top-5000 batch 24f — Pack Rat", () => {
  it("counts the Rats you control, and a discard makes a copy that counts too", () => {
    const { game } = setUp();
    const rat = spawn(game, "Pack Rat");
    lands(game, "Swamp", 3);
    expect(pt(game, rat)).toEqual([1, 1]);
    const handBefore = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: rat, abilityIndex: 0 });
    if (game.state.awaiting?.kind === "discard") {
      game.dispatch({ type: "discard", player: A, cards: [game.handOf(A)[0]] });
    }
    settle(game);
    expect(game.handOf(A)).toHaveLength(handBefore - 1);
    const rats = named(game, "Pack Rat");
    expect(rats).toHaveLength(2);
    for (const id of rats) expect(pt(game, id)).toEqual([2, 2]);
  });
});

describe("top-5000 batch 24f — Arcbound Ravager", () => {
  it("enters with a +1/+1 counter, and moves the counters it died with to an artifact creature", () => {
    const { game, a } = setUp(["Arcbound Ravager"]);
    lands(game, "Wastes", 2);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Arcbound Ravager"), targets: [] });
    settle(game);
    const ravager = named(game, "Arcbound Ravager")[0];
    expect(counters(game, ravager)).toBe(1);
    expect(pt(game, ravager)).toEqual([1, 1]);
    const thopter = spawn(game, "Ornithopter");
    a.chooseTargetsFn = () => [{ kind: "object", object: thopter }];
    game.state.objects[ravager].counters = { "+1/+1": 3 };
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: ravager }]);
    settle(game);
    expect(zone(game, ravager)).toBe("graveyard");
    expect(counters(game, thopter)).toBe(3);
  });
});

describe("top-5000 batch 24f — Polyraptor", () => {
  it("makes an undamaged copy of itself when it's dealt damage", () => {
    const { game } = setUp(["Lightning Bolt"]);
    lands(game, "Mountain", 1);
    const raptor = spawn(game, "Polyraptor");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Lightning Bolt"),
      targets: [{ kind: "object", object: raptor }],
    });
    settle(game);
    const raptors = named(game, "Polyraptor");
    expect(raptors).toHaveLength(2);
    const copy = raptors.find((id) => id !== raptor)!;
    expect(game.state.objects[copy].isToken).toBe(true);
    expect(game.state.objects[copy].damageMarked).toBe(0);
  });
});

describe("top-5000 batch 24f — And They Shall Know No Fear", () => {
  it("pumps and protects only your creatures of the chosen type", () => {
    const { game, a } = setUp();
    a.chooseCreatureTypeFn = (_view, _source, options) => options.find((t) => t === "Bear") ?? options[0];
    const bears = spawn(game, "Grizzly Bears");
    const elves = spawn(game, "Llanowar Elves");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, effectOf("And They Shall Know No Fear"));
    settle(game);
    expect(pt(game, bears)).toEqual([3, 2]);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("indestructible")).toBe(true);
    expect(pt(game, elves)).toEqual([1, 1]);
    expect(computeCharacteristics(game.state, registry, elves).keywords.has("indestructible")).toBe(false);
    expect(pt(game, theirs)).toEqual([2, 2]);
    expect(computeCharacteristics(game.state, registry, theirs).keywords.has("indestructible")).toBe(false);
  });
});
