/**
 * Top-10000 batch 30b. No engine change: each test pins the clause of one
 * card most likely to be wired wrong — the old two-trigger Oblivion Ring
 * (exiled for good if the Ring leaves first), a reflexive "when you do", a
 * chosen-mode land permission, a threshold restriction, the kicked counters,
 * X on an enter trigger, a granted attack trigger and the end-step untap.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

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
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
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
/** Targets `pick` wherever a slot offers it, else the first option. */
const aimAt = (a: ScriptedController, pick: ObjectId): void => {
  a.chooseTargetsFn = (_view, _source, _specs, options) =>
    options.map((slot) => slot.find((ref) => ref.kind === "object" && ref.object === pick) ?? slot[0] ?? null);
};

describe("top-10000 batch 30b — Glacierwood Siege", () => {
  it("lets you play a land from your graveyard only when Sultai was chosen", () => {
    const { game } = setUp();
    const siege = spawn(game, "Glacierwood Siege");
    const forest = game.debugSpawn("Forest", A, "graveyard");
    const canPlay = (): boolean => game.legalActions(A).some((x) => x.kind === "play-land" && x.card === forest);
    game.state.objects[siege].chosenOnEnter = "Temur";
    expect(canPlay()).toBe(false);
    game.state.objects[siege].chosenOnEnter = "Sultai";
    expect(canPlay()).toBe(true);
  });
});

describe("top-10000 batch 30b — Putrid Imp", () => {
  it("gets +1/+1 and can't block only with threshold", () => {
    const { game } = setUp();
    const imp = spawn(game, "Putrid Imp");
    for (let i = 0; i < 6; i += 1) game.debugSpawn("Wastes", A, "graveyard");
    expect(game.characteristics(imp).power).toBe(1);
    expect(game.characteristics(imp).restrictions.has("cant-block")).toBe(false);
    game.debugSpawn("Wastes", A, "graveyard");
    const c = game.characteristics(imp);
    expect([c.power, c.toughness]).toEqual([2, 2]);
    expect(c.restrictions.has("cant-block")).toBe(true);
  });
});

describe("top-10000 batch 30b — Vastwood Surge", () => {
  it("kicked, fetches two basics tapped and puts two counters on each creature you control", () => {
    const { game, a } = setUp(["Vastwood Surge"], "Forest");
    a.chooseFromZoneFn = (_view, eligible, _min, max) => eligible.slice(0, max);
    lands(game, "Forest", 8);
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Vastwood Surge"), targets: [], kicked: true });
    settle(game);
    expect(named(game, "Forest").filter((id) => game.state.objects[id].controller === A)).toHaveLength(10);
    expect(counters(game, bears)).toBe(2);
    expect(counters(game, theirs)).toBe(0);
  });
});

describe("top-10000 batch 30b — Hugs, Grisly Guardian", () => {
  it("exiles the top X cards as it enters, and lets you play them", () => {
    const { game } = setUp(["Hugs, Grisly Guardian"]);
    lands(game, "Mountain", 2);
    lands(game, "Forest", 2);
    lands(game, "Wastes", 2);
    const before = game.state.zones.shared.exile.length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Hugs, Grisly Guardian"), targets: [], xValue: 2 });
    settle(game);
    const exiled = game.state.zones.shared.exile.filter((id) => game.state.objects[id].owner === A);
    expect(game.state.zones.shared.exile.length - before).toBe(2);
    expect(exiled).toHaveLength(2);
    expect(game.legalActions(A).some((x) => x.kind === "play-land" && x.card === exiled[0])).toBe(true);
  });
});

describe("top-10000 batch 30b — Aunt May", () => {
  it("gains 1 life for each creature, and counters only a Spider", () => {
    const { game } = setUp();
    spawn(game, "Aunt May");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, A)).toBe(21);
    expect(counters(game, bears)).toBe(0);
    const spider = game.debugSpawn("Giant Spider", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, A)).toBe(22);
    expect(counters(game, spider)).toBe(1);
  });
});

describe("top-10000 batch 30b — Flaming Fist", () => {
  it("gives an attacking commander you own double strike", () => {
    const { game, a } = setUp();
    spawn(game, "Flaming Fist");
    const commander = spawn(game, "Grizzly Bears");
    game.state.objects[commander].isCommander = true;
    a.declareAttackersFn = () => [{ attacker: commander, defender: B }];
    game.advanceUntil((s) => s.turn.step === "end-combat" && quiet(s));
    expect(life(game, B)).toBe(16);
  });
});

describe("top-10000 batch 30b — Olivia, Opulent Outlaw", () => {
  it("makes a Treasure when an outlaw deals combat damage to a player", () => {
    const { game, a } = setUp();
    const olivia = spawn(game, "Olivia, Opulent Outlaw");
    a.declareAttackersFn = () => [{ attacker: olivia, defender: B }];
    game.advanceUntil((s) => s.turn.step === "end-combat" && quiet(s));
    expect(life(game, B)).toBe(17);
    expect(named(game, "Treasure Token")).toHaveLength(1);
  });
});

describe("top-10000 batch 30b — Xolatoyac, the Smiling Flood", () => {
  it("floods a land into an Island, and untaps only permanents with counters at your end step", () => {
    const { game, a } = setUp();
    const forest = spawn(game, "Forest");
    aimAt(a, forest);
    game.debugSpawn("Xolatoyac, the Smiling Flood", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, forest, "flood")).toBe(1);
    expect(game.characteristics(forest).subtypes).toContain("Island");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[forest].tapped = true;
    game.state.objects[bears].tapped = true;
    game.advanceUntil(
      (s) =>
        s.turn.step === "end" && quiet(s) && s.eventLog.some((e) => e.type === "step-began" && e.step === "end"),
    );
    expect(game.state.objects[forest].tapped).toBe(false);
    expect(game.state.objects[bears].tapped).toBe(true);
  });
});
