/**
 * Top-10000 batch 36e. Pins the clauses most likely to be wired wrong:
 * Nightpack Ambusher's "if you didn't cast a spell this turn" and its
 * Wolves-and-Werewolves anthem, Thing in the Ice's fourth-spell transform and
 * Awoken Horror's bounce, Combustion Man's choice belonging to the target's
 * controller, Thunder Magic's tier cost, Ballad of the Black Flag's
 * historic pick and chapter IV discount, Fungal Plots' two-Saproling cost,
 * Wharf Infiltrator's pay-{2} discard trigger, Crawling Barrens' optional
 * animation, Cracked Earth Technique's two earthbends on one land, and
 * Gadwick's X draw and blue-spell tap.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { Step } from "../turn.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (
  hand: readonly string[] = [],
): { game: Game; a: ScriptedController; b: ScriptedController } => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  a.chooseModesFn = () => [0];
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill("Wastes")] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name));
const toHand = (game: Game, name: string): ObjectId => game.debugSpawn(name, A, "hand");
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pt = (game: Game, id: ObjectId): [number | null, number | null] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power, c.toughness];
};
const obj = (object: ObjectId) => ({ kind: "object" as const, object });
const player = (p: PlayerId) => ({ kind: "player" as const, player: p });
/** At `step`, once a further ability has resolved and nothing is left. */
const at = (game: Game, step: Step): void => {
  const resolved = game.eventsOfType("ability-resolved").length;
  game.advanceUntil(
    (s) => s.turn.step === step && quiet(s) && game.eventsOfType("ability-resolved").length > resolved,
  );
};
const bobsUpkeep = (s: GameState): boolean => s.turn.number === 2 && s.turn.step === "upkeep";

describe("top-10000 batch 36e — Nightpack Ambusher", () => {
  it("pumps other Wolves, not itself, and makes a Wolf at your end step if you cast no spell", () => {
    const { game } = setUp();
    const ambusher = spawn(game, "Nightpack Ambusher");
    const wolf = spawn(game, "Wolf Token");
    const bears = spawn(game, "Grizzly Bears");
    expect(pt(game, ambusher)).toEqual([4, 4]);
    expect(pt(game, wolf)).toEqual([3, 3]);
    expect(pt(game, bears)).toEqual([2, 2]);
    game.advanceUntil(bobsUpkeep);
    expect(named(game, "Wolf Token")).toHaveLength(2);
  });

  it("makes no Wolf in a turn you cast a spell", () => {
    const { game } = setUp();
    spawn(game, "Nightpack Ambusher");
    lands(game, "Mountain", 1);
    game.dispatch({ type: "cast-spell", player: A, card: toHand(game, "Lightning Bolt"), targets: [player(B)] });
    game.advanceUntil(quiet);
    game.advanceUntil(bobsUpkeep);
    expect(named(game, "Wolf Token")).toHaveLength(0);
  });
});

describe("top-10000 batch 36e — Thing in the Ice", () => {
  it("enters with four ice counters, transforms on the fourth instant and bounces non-Horrors", () => {
    const { game } = setUp();
    lands(game, "Mountain", 4);
    const thing = spawn(game, "Thing in the Ice");
    const mine = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Hill Giant", B);
    expect(counters(game, thing, "ice")).toBe(4);
    for (let i = 0; i < 3; i += 1) {
      game.dispatch({ type: "cast-spell", player: A, card: toHand(game, "Lightning Bolt"), targets: [player(B)] });
      game.advanceUntil(quiet);
    }
    expect(counters(game, thing, "ice")).toBe(1);
    expect(game.state.objects[thing].face ?? 0).toBe(0);
    game.dispatch({ type: "cast-spell", player: A, card: toHand(game, "Lightning Bolt"), targets: [player(B)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[thing].face).toBe(1);
    expect(zone(game, thing)).toBe("battlefield");
    expect(pt(game, thing)).toEqual([7, 8]);
    expect(zone(game, mine)).toBe("hand");
    expect(zone(game, theirs)).toBe("hand");
  });
});

describe("top-10000 batch 36e — Combustion Man", () => {
  const attack = (bobChooses: number) => {
    const { game, a, b } = setUp();
    const man = spawn(game, "Combustion Man");
    const ring = spawn(game, "Sol Ring", B);
    a.chooseTargetsFn = () => [obj(ring)];
    a.declareAttackersFn = () => [{ attacker: man, defender: B }];
    b.chooseModesFn = () => [bobChooses];
    at(game, "declare-attackers");
    return { game, ring };
  };

  it("the permanent's controller may take damage equal to his power to keep it", () => {
    const { game, ring } = attack(0);
    expect(life(game, B)).toBe(16);
    expect(zone(game, ring)).toBe("battlefield");
  });

  it("or let it be destroyed", () => {
    const { game, ring } = attack(1);
    expect(life(game, B)).toBe(20);
    expect(zone(game, ring)).toBe("graveyard");
  });
});

describe("top-10000 batch 36e — Thunder Magic", () => {
  it("Thundara costs {R} plus {3} and deals 4", () => {
    const { game } = setUp();
    const mountains = lands(game, "Mountain", 4);
    const giant = spawn(game, "Colossal Dreadmaw", B);
    const magic = toHand(game, "Thunder Magic");
    game.dispatch({ type: "cast-spell", player: A, card: magic, modes: [1], targets: [obj(giant)] });
    expect(mountains.filter((id) => game.state.objects[id].tapped)).toHaveLength(4);
    game.advanceUntil(quiet);
    expect(game.state.objects[giant].damageMarked).toBe(4);
  });

  it("only one tier may be chosen", () => {
    const { game } = setUp();
    lands(game, "Mountain", 10);
    const giant = spawn(game, "Colossal Dreadmaw", B);
    const magic = toHand(game, "Thunder Magic");
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: magic, modes: [0, 1], targets: [obj(giant), obj(giant)] }),
    ).toThrow();
  });
});

describe("top-10000 batch 36e — Ballad of the Black Flag", () => {
  it("chapter I mills three and may take a historic card from among them", () => {
    const { game, a } = setUp();
    lands(game, "Island", 3);
    // Top of library, top first: Grizzly Bears, Sol Ring, Wastes.
    game.debugSpawn("Wastes", A, "library");
    const ring = game.debugSpawn("Sol Ring", A, "library");
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    const offered: ObjectId[][] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered.push([...eligible]);
      return eligible.slice(0, 1);
    };
    game.dispatch({ type: "cast-spell", player: A, card: toHand(game, "Ballad of the Black Flag"), targets: [] });
    game.advanceUntil(quiet);
    expect(offered).toEqual([[ring]]);
    expect(zone(game, ring)).toBe("hand");
    expect(zone(game, bears)).toBe("graveyard");
  });

  it("chapter IV makes historic spells cost {2} less this turn, and others not", () => {
    const { game } = setUp();
    const ballad = spawn(game, "Ballad of the Black Flag");
    game.state.objects[ballad].counters = { lore: 3 };
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    expect(zone(game, ballad)).toBe("graveyard");
    // Three Mountains: a {4} artifact is castable only with the discount, and
    // a nonhistoric {3}{R} creature isn't discounted.
    lands(game, "Mountain", 3);
    const castable = (card: ObjectId): boolean =>
      game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);
    expect(castable(toHand(game, "Solemn Simulacrum"))).toBe(true);
    expect(castable(toHand(game, "Hill Giant"))).toBe(false);
  });
});

describe("top-10000 batch 36e — Fungal Plots", () => {
  it("sacrifices two Saprolings — never another creature — to gain 2 and draw", () => {
    const { game } = setUp();
    const plots = spawn(game, "Fungal Plots");
    const bears = spawn(game, "Grizzly Bears");
    const offered = () =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === plots && x.abilityIndex === 1);
    spawn(game, "Saproling Token");
    expect(offered()).toBe(false);
    spawn(game, "Saproling Token");
    expect(offered()).toBe(true);
    const hand = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: plots, abilityIndex: 1 });
    game.advanceUntil(quiet);
    expect(named(game, "Saproling Token")).toHaveLength(0);
    expect(zone(game, bears)).toBe("battlefield");
    expect(life(game, A)).toBe(22);
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  it("exiles a creature card from your graveyard to make a Saproling", () => {
    const { game } = setUp();
    lands(game, "Forest", 2);
    const plots = spawn(game, "Fungal Plots");
    const dead = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Lightning Bolt", A, "graveyard");
    game.dispatch({ type: "activate-ability", player: A, source: plots, abilityIndex: 0 });
    game.advanceUntil(quiet);
    expect(zone(game, dead)).toBe("exile");
    expect(named(game, "Saproling Token")).toHaveLength(1);
  });
});

describe("top-10000 batch 36e — Wharf Infiltrator", () => {
  it("discarding a creature card offers {2} for a 3/2 Eldrazi Horror; a noncreature card doesn't", () => {
    const { game, a } = setUp();
    spawn(game, "Wharf Infiltrator");
    lands(game, "Wastes", 4);
    const bolt = toHand(game, "Lightning Bolt");
    const bears = toHand(game, "Grizzly Bears");
    a.chooseDiscardsFn = () => [bolt];
    game.debugApplyEffect(A, { kind: "discard", target: "you", amount: 1 }, []);
    game.advanceUntil(quiet);
    expect(named(game, "Eldrazi Horror Token")).toHaveLength(0);
    a.chooseDiscardsFn = () => [bears];
    game.debugApplyEffect(A, { kind: "discard", target: "you", amount: 1 }, []);
    game.advanceUntil(quiet);
    const horrors = named(game, "Eldrazi Horror Token");
    expect(horrors).toHaveLength(1);
    expect(pt(game, horrors[0])).toEqual([3, 2]);
  });
});

describe("top-10000 batch 36e — Crawling Barrens", () => {
  it("puts two counters on it, then may make it a 0/0 creature that the counters size", () => {
    const { game, a } = setUp();
    lands(game, "Wastes", 8);
    const barrens = spawn(game, "Crawling Barrens");
    a.chooseModesFn = () => [];
    game.dispatch({ type: "activate-ability", player: A, source: barrens, abilityIndex: 1 });
    game.advanceUntil(quiet);
    expect(counters(game, barrens)).toBe(2);
    expect(computeCharacteristics(game.state, registry, barrens).types).not.toContain("creature");
    a.chooseModesFn = () => [0];
    game.dispatch({ type: "activate-ability", player: A, source: barrens, abilityIndex: 1 });
    game.advanceUntil(quiet);
    const c = computeCharacteristics(game.state, registry, barrens);
    expect(c.types).toEqual(expect.arrayContaining(["land", "creature"]));
    expect([c.power, c.toughness]).toEqual([4, 4]);
  });
});

describe("top-10000 batch 36e — Cracked Earth Technique", () => {
  it("both earthbends may name the same land: six counters, and 3 life", () => {
    const { game } = setUp();
    lands(game, "Forest", 5);
    const target = spawn(game, "Wastes");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: toHand(game, "Cracked Earth Technique"),
      targets: [obj(target), obj(target)],
    });
    game.advanceUntil(quiet);
    expect(counters(game, target)).toBe(6);
    expect(pt(game, target)).toEqual([6, 6]);
    expect(life(game, A)).toBe(23);
  });
});

describe("top-10000 batch 36e — Gadwick, the Wizened", () => {
  it("draws X as it enters, and a blue spell taps an opponent's nonland permanent", () => {
    const { game, a } = setUp();
    lands(game, "Island", 6);
    const ring = spawn(game, "Sol Ring", B);
    const hand = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: toHand(game, "Gadwick, the Wizened"), targets: [], xValue: 2 });
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand + 2);
    a.chooseTargetsFn = () => [obj(ring)];
    a.chooseScryFn = () => [];
    game.dispatch({ type: "cast-spell", player: A, card: toHand(game, "Opt"), targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[ring].tapped).toBe(true);
  });
});
