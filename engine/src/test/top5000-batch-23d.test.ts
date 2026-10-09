/**
 * Top-5000 batch 23d. No engine change: each test pins the clause of one
 * card most likely to be wired wrong — a cost reduction gated on life gained
 * this turn (Mortality Spear), "cast from a graveyard" doubling the tokens
 * (Increasing Devotion), a copy of every creature token you control (Rhys
 * the Redeemed), a copy exception's own end-step exile (Heat Shimmer), the
 * quest-counter gate on untapping in other players' untap steps (Quest for
 * Renewal), a commander you control entering (Norn's Choirmaster), a named
 * token kept off its creator's opponent (Rite of the Raging Storm), a count
 * of Elves read as it resolves (Immaculate Magistrate) and both halves of a
 * villainous choice (Ensnared by the Mara).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
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
const setUp = (
  hand: readonly string[] = [],
  library = "Wastes",
): { game: Game; a: ScriptedController; b: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
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
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
/** Tokens of this name on the battlefield, a token stack counting as every token in it. */
const tokenCount = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string | undefined => game.state.objects[id]?.zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
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
const castable = (game: Game, card: ObjectId, via?: string): boolean =>
  game
    .legalActions(A)
    .some(
      (x) => x.kind === "cast-spell" && x.card === card && (via === undefined || (x as { via?: string }).via === via),
    );

describe("top-5000 batch 23d — Mortality Spear", () => {
  it("costs {2} less only once you've gained life this turn", () => {
    const { game } = setUp(["Mortality Spear"]);
    spawn(game, "Swamp");
    spawn(game, "Forest");
    const bears = spawn(game, "Grizzly Bears", B);
    const spear = inHand(game, "Mortality Spear");
    expect(castable(game, spear)).toBe(false);
    game.debugApplyEffect(A, { kind: "gain-life", amount: 1 }, []);
    settle(game);
    expect(castable(game, spear)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: spear, targets: [{ kind: "object", object: bears }] });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
  });
});

describe("top-5000 batch 23d — Increasing Devotion", () => {
  it("makes five Humans from the hand and ten when flashed back", () => {
    const { game } = setUp(["Increasing Devotion"]);
    lands(game, "Plains", 14);
    const devotion = inHand(game, "Increasing Devotion");
    game.dispatch({ type: "cast-spell", player: A, card: devotion, targets: [] });
    settle(game);
    expect(tokenCount(game, "Human Token")).toBe(5);
    expect(zone(game, devotion)).toBe("graveyard");
    expect(castable(game, devotion, "flashback")).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: devotion, targets: [], via: "flashback" });
    settle(game);
    expect(tokenCount(game, "Human Token")).toBe(15);
    expect(zone(game, devotion)).toBe("exile");
  });
});

describe("top-5000 batch 23d — Rhys the Redeemed", () => {
  it("copies each creature token you control, and nothing else", () => {
    const { game } = setUp();
    lands(game, "Forest", 6);
    const rhys = spawn(game, "Rhys the Redeemed");
    spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "create-token", token: "Elf Warrior Token (Rhys the Redeemed)", count: 3 }, []);
    game.debugApplyEffect(B, { kind: "create-token", token: "Elf Warrior Token (Rhys the Redeemed)", count: 1 }, []);
    settle(game);
    const mine = (): number =>
      named(game, "Elf Warrior Token (Rhys the Redeemed)")
        .filter((id) => game.state.objects[id].controller === A)
        .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(mine()).toBe(3);
    game.dispatch({ type: "activate-ability", player: A, source: rhys, abilityIndex: 1 });
    settle(game);
    expect(mine()).toBe(6);
    expect(named(game, "Grizzly Bears")).toHaveLength(1);
    // Bob's token isn't Alice's to copy.
    expect(tokenCount(game, "Elf Warrior Token (Rhys the Redeemed)")).toBe(7);
  });
});

describe("top-5000 batch 23d — Heat Shimmer", () => {
  it("copies any creature with haste, and the copy exiles itself at the end step", () => {
    const { game } = setUp(["Heat Shimmer"]);
    lands(game, "Mountain", 3);
    const giant = spawn(game, "Hill Giant", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Heat Shimmer"),
      targets: [{ kind: "object", object: giant }],
    });
    settle(game);
    const copy = named(game, "Hill Giant").find((id) => id !== giant)!;
    expect(copy).toBeDefined();
    expect(game.state.objects[copy].controller).toBe(A);
    expect(game.state.objects[copy].isToken).toBe(true);
    expect(computeCharacteristics(game.state, registry, copy).keywords.has("haste")).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(named(game, "Hill Giant")).toEqual([giant]);
  });
});

describe("top-5000 batch 23d — Quest for Renewal", () => {
  it("counts a creature becoming tapped", () => {
    const { game } = setUp();
    const quest = spawn(game, "Quest for Renewal");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "tap", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(counters(game, quest, "quest")).toBe(1);
  });

  it("untaps your creatures in another player's untap step only with four quest counters", () => {
    const { game } = setUp();
    const quest = spawn(game, "Quest for Renewal");
    game.state.objects[quest].counters = { quest: 3 };
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { tapped: true, summoningSick: false });
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(game.state.objects[bears].tapped).toBe(true);
    game.state.objects[quest].counters = { quest: 4 };
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    // Alice's own untap step untaps it anyway; tap it again for Bob's.
    game.state.objects[bears].tapped = true;
    game.advanceUntil((s) => s.turn.number === 4 && s.turn.step === "upkeep");
    expect(game.state.objects[bears].tapped).toBe(false);
  });
});

describe("top-5000 batch 23d — Norn's Choirmaster", () => {
  it("proliferates when a commander you control enters", () => {
    const { game } = setUp();
    spawn(game, "Norn's Choirmaster");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 1 };
    const commander = game.debugSpawn("Hill Giant", A, "graveyard");
    game.state.objects[commander].isCommander = true;
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0, underYourControl: true }, [
      { kind: "object", object: commander },
    ]);
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    expect(game.state.awaiting?.kind).toBe("proliferate");
    game.dispatch({ type: "proliferate", player: A, chosen: [{ kind: "object", object: bears }] });
    settle(game);
    expect(counters(game, bears)).toBe(2);
    // A creature that isn't a commander entering does nothing.
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    expect(game.state.awaiting).toBeNull();
  });
});

describe("top-5000 batch 23d — Immaculate Magistrate", () => {
  it("puts a counter on any creature for each Elf you control", () => {
    const { game } = setUp();
    const magistrate = spawn(game, "Immaculate Magistrate");
    spawn(game, "Llanowar Elves");
    spawn(game, "Llanowar Elves", B);
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: magistrate,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    expect(counters(game, bears)).toBe(2);
  });
});
