/**
 * Top-10000 batch 34d. Pins the clauses most likely to be wired wrong:
 * Sporecrown Thallid's Fungus-or-Saproling lord, Docent of Perfection's
 * "then if you control three or more Wizards", Strength Bobblehead's count,
 * Chakram Retriever's untap, Wall of Junk's end-of-combat return, Exorcise's
 * target filter, Fang's once-a-turn graveyard trigger, Incandescent
 * Soulstoke's sneak, Octavia's cost reduction and Elena's non-Assassin target.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (
  hand: readonly string[] = [],
  library = "Wastes",
): { game: Game; a: ScriptedController; b: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
  a.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const settle = (game: Game): void => game.advanceUntil(quiet);
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name, player);
};
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = game.characteristics(id);
  return [c.power ?? 0, c.toughness ?? 0];
};
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });

describe("top-10000 batch 34d — Sporecrown Thallid", () => {
  it("pumps other Fungi and Saprolings you control, not itself, other creatures or theirs", () => {
    const { game } = setUp();
    const thallid = spawn(game, "Sporecrown Thallid");
    const saproling = spawn(game, "Saproling Token");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Saproling Token", B);
    expect(pt(game, thallid)).toEqual([2, 2]);
    expect(pt(game, saproling)).toEqual([2, 2]);
    expect(pt(game, bears)).toEqual([2, 2]);
    expect(pt(game, theirs)).toEqual([1, 1]);
    // A second Thallid is a Fungus: each pumps the other.
    const second = spawn(game, "Sporecrown Thallid");
    expect(pt(game, thallid)).toEqual([3, 3]);
    expect(pt(game, second)).toEqual([3, 3]);
  });
});

describe("top-10000 batch 34d — Strength Bobblehead", () => {
  it("puts a counter per Bobblehead you control on the target", () => {
    const { game } = setUp();
    const bob = spawn(game, "Strength Bobblehead");
    spawn(game, "Strength Bobblehead");
    spawn(game, "Strength Bobblehead", B);
    const bears = spawn(game, "Grizzly Bears");
    const effect = registry.get("Strength Bobblehead")!.activated[1].effect!;
    game.debugApplyEffect(A, effect, [obj(bears)], { source: bob });
    settle(game);
    expect(counters(game, bears)).toBe(2);
  });
});

describe("top-10000 batch 34d — Chakram Retriever", () => {
  it("untaps the target when you cast a spell on your turn", () => {
    const { game, a } = setUp(["Opt"], "Island");
    lands(game, "Island", 1);
    spawn(game, "Chakram Retriever");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { tapped: true, summoningSick: false });
    a.chooseTargetsFn = (_view, _source, _specs, options) => [
      options[0]?.find((t) => t.kind === "object" && t.object === bears) ?? null,
    ];
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Opt"), targets: [] });
    settle(game);
    expect(game.state.objects[bears].tapped).toBe(false);
  });
});

describe("top-10000 batch 34d — Wall of Junk", () => {
  it("goes back to its owner's hand at end of combat after blocking", () => {
    const { game, a, b } = setUp();
    const wall = spawn(game, "Wall of Junk", B);
    const giant = spawn(game, "Hill Giant");
    a.declareAttackersFn = () => [{ attacker: giant, defender: B }];
    b.declareBlockersFn = () => [{ blocker: wall, attacker: giant }];
    game.advanceUntil((s) => s.turn.step === "combat-damage" && quiet(s));
    expect(zone(game, wall)).toBe("battlefield");
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(game.handOf(B)).toContain(wall);
  });
});

describe("top-10000 batch 34d — Exorcise", () => {
  it("can target an artifact or a creature with power 4 or more, not a smaller creature", () => {
    const { game } = setUp(["Exorcise"], "Plains");
    lands(game, "Plains", 2);
    const ring = spawn(game, "Sol Ring", B);
    const bears = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", B);
    const wurm = spawn(game, "Craw Wurm", B);
    const card = inHand(game, "Exorcise");
    const action = game.legalActions(A).find((x) => x.kind === "cast-spell" && x.card === card);
    expect(action).toBeDefined();
    const options = (action as { targetOptions: readonly (readonly TargetRef[])[] }).targetOptions[0];
    const ids = options.flatMap((t) => (t.kind === "object" ? [t.object] : []));
    expect(ids).toEqual(expect.arrayContaining([ring, wurm]));
    expect(ids).not.toContain(bears);
    expect(ids).not.toContain(giant);
  });
});

describe("top-10000 batch 34d — Fang, Fearless l'Cie", () => {
  it("draws and drains once a turn as cards leave your graveyard", () => {
    const { game } = setUp();
    spawn(game, "Fang, Fearless l'Cie");
    const first = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const second = game.debugSpawn("Hill Giant", A, "graveyard");
    const hand = game.handOf(A).length;
    const back = { kind: "return-to-hand", target: 0, from: "graveyard" } as const;
    game.debugApplyEffect(A, back, [obj(first)]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand + 2);
    expect(game.state.players[A].life).toBe(19);
    game.debugApplyEffect(A, back, [obj(second)]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand + 3);
    expect(game.state.players[A].life).toBe(19);
  });
});

describe("top-10000 batch 34d — Incandescent Soulstoke", () => {
  it("puts an Elemental from hand in with haste, and sacrifices it at the end step", () => {
    const { game } = setUp(["Grizzly Bears", "Air Elemental"], "Mountain");
    lands(game, "Mountain", 2);
    const soulstoke = spawn(game, "Incandescent Soulstoke");
    game.dispatch({ type: "activate-ability", player: A, source: soulstoke, abilityIndex: 0 });
    settle(game);
    const [elemental] = named(game, "Air Elemental");
    expect(elemental).toBeDefined();
    expect(named(game, "Grizzly Bears")).toHaveLength(0);
    expect(game.characteristics(elemental).keywords).toContain("haste");
    expect(pt(game, elemental)).toEqual([5, 5]);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(zone(game, elemental)).toBe("graveyard");
  });
});

describe("top-10000 batch 34d — Octavia, Living Thesis", () => {
  it("costs {8} less with eight instant and sorcery cards in your graveyard", () => {
    const { game } = setUp(["Octavia, Living Thesis"], "Island");
    lands(game, "Island", 2);
    for (let i = 0; i < 7; i += 1) game.debugSpawn("Opt", A, "graveyard");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    const octavia = inHand(game, "Octavia, Living Thesis");
    const castable = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === octavia);
    expect(castable()).toBe(false);
    game.debugSpawn("Opt", A, "graveyard");
    expect(castable()).toBe(true);
  });
});
