/**
 * The `add-mana` extensions (gaps key `effect:add-mana-extensions`):
 *
 * - a choice in mana a spell or an ability **on the stack** adds is asked as
 *   it resolves (rule 608.2d), where it used to make white;
 * - lists read off the board: "any type that a land you control could
 *   produce" (rule 106.7, through other "could produce" lands without
 *   looping), "any color among …" and "for each color among …";
 * - "Choose a color. Add … equal to your devotion to that color" — an amount
 *   read for the colour chosen;
 * - a triggered mana ability's choice ("any type that land produced", "an
 *   additional one mana of any color") is the player's when they tap by hand,
 *   and its mana carries none of the tapped permanent's restrictions;
 * - "if you tap a permanent for mana, it produces twice as much" (rule
 *   106.12b), its own mana only.
 */
import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { Game } from "../game.js";
import { poolCounts } from "../mana.js";
import type { ManaType } from "../mana.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array(40).fill("Island") },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  game.advanceUntil((s: GameState) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const pool = (game: Game, p: PlayerId = A) => poolCounts(game.state.players[p].manaPool);

/** A permanent ready to tap: untapped, and not summoning sick. */
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const id = game.debugSpawn(name, player, "battlefield", { summoningSick: false });
  game.state.objects[id].tapped = false;
  return id;
};

type Activate = Extract<LegalAction, { kind: "activate-ability" }>;
const offers = (game: Game, source: ObjectId, abilityIndex?: number): Activate[] =>
  game
    .legalActions(A)
    .filter(
      (a): a is Activate =>
        a.kind === "activate-ability" &&
        a.source === source &&
        (abilityIndex === undefined || a.abilityIndex === abilityIndex),
    );
const picks = (game: Game, source: ObjectId, abilityIndex?: number): (readonly ManaType[] | undefined)[] =>
  offers(game, source, abilityIndex).map((a) => a.manaColors);

const tap = (game: Game, source: ObjectId, abilityIndex: number, manaColors?: readonly ManaType[]): void =>
  game.dispatch({
    type: "activate-ability",
    player: A,
    source,
    abilityIndex,
    targets: [],
    ...(manaColors !== undefined ? { manaColors } : {}),
  });

describe("mana a spell or an ability on the stack adds is chosen as it resolves", () => {
  it("asks Deathrite Shaman's colour, where it used to make white", () => {
    const game = mkGame();
    const shaman = spawn(game, "Deathrite Shaman");
    const land = game.debugSpawn("Forest", B, "graveyard");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: shaman,
      abilityIndex: 0,
      targets: [{ kind: "object", object: land }],
    });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind === "choose-modes" && awaiting.modes.map((m) => m.text)).toEqual([
      "Add {W}.",
      "Add {U}.",
      "Add {B}.",
      "Add {R}.",
      "Add {G}.",
    ]);
    game.dispatch({ type: "choose-modes", player: A, modes: [3] });
    game.advanceUntil(quiet);
    expect(pool(game)).toMatchObject({ R: 1, W: 0 });
    expect(game.state.objects[land].zone).toBe("exile");
  });

  it("offers each split of 'N mana in any combination of' as one choice", () => {
    const game = mkGame();
    game.debugApplyEffect(A, { kind: "add-mana", mana: { oneOf: ["B", "G"] }, amount: 3 }, []);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind === "choose-modes" && awaiting.modes.map((m) => m.text)).toEqual([
      "Add {B}{B}{B}.",
      "Add {B}{B}{G}.",
      "Add {B}{G}{G}.",
      "Add {G}{G}{G}.",
    ]);
    game.dispatch({ type: "choose-modes", player: A, modes: [1] });
    expect(pool(game)).toMatchObject({ B: 2, G: 1 });
  });

  it("asks each unit's colour in turn when the splits are too many to list", () => {
    const game = mkGame();
    // Four mana in any combination of five colours: 70 splits.
    game.debugApplyEffect(A, { kind: "add-mana", mana: { oneOf: ["W", "U", "B", "R", "G"] }, amount: 4 }, []);
    for (const pick of [0, 1, 1, 4]) {
      const awaiting = game.state.awaiting;
      expect(awaiting?.kind === "choose-modes" && awaiting.modes).toHaveLength(5);
      game.dispatch({ type: "choose-modes", player: A, modes: [pick] });
    }
    expect(game.state.awaiting).toBeNull();
    expect(pool(game)).toMatchObject({ W: 1, U: 2, B: 0, R: 0, G: 1 });
  });

  it("'each player adds {B}{R}{G}' fills every player's pool (`who`)", () => {
    const game = mkGame();
    game.debugApplyEffect(A, { kind: "add-mana", mana: { all: ["B", "R", "G"] }, amount: 1, who: "each-player" }, []);
    expect(pool(game)).toMatchObject({ B: 1, R: 1, G: 1 });
    expect(pool(game, B)).toMatchObject({ B: 1, R: 1, G: 1 });
  });

  it("doesn't ask when only one type is on offer", () => {
    const game = mkGame();
    game.debugApplyEffect(A, { kind: "add-mana", mana: { oneOf: ["G"] }, amount: 2 }, []);
    expect(game.state.awaiting).toBeNull();
    expect(pool(game).G).toBe(2);
  });
});

describe("any type a land you control could produce (rule 106.7)", () => {
  it("reads your lands — every type, colorless included, tapped or not — and not an opponent's", () => {
    const game = mkGame();
    const reflecting = spawn(game, "Reflecting Pool");
    spawn(game, "Forest");
    game.debugSpawn("Reliquary Tower", A, "battlefield", { tapped: true });
    spawn(game, "Mountain", B);
    expect(picks(game, reflecting)).toEqual([["G"], ["C"]]);
    tap(game, reflecting, 0, ["C"]);
    expect(pool(game).C).toBe(1);
  });

  it("reads through another 'could produce' land, but two Reflecting Pools alone make nothing", () => {
    const game = mkGame();
    const first = spawn(game, "Reflecting Pool");
    spawn(game, "Reflecting Pool");
    // Offered once — it can still be tapped, for nothing (the ruling).
    expect(picks(game, first)).toEqual([[]]);
    tap(game, first, 0, []);
    expect(game.state.players[A].manaPool).toHaveLength(0);
    // An Exotic Orchard reads the opponent's Swamp, and the Pool reads it.
    spawn(game, "Exotic Orchard");
    spawn(game, "Swamp", B);
    const second = game.battlefield.find(
      (id) => id !== first && game.state.objects[id].cardName === "Reflecting Pool",
    ) as ObjectId;
    expect(picks(game, second)).toEqual([["B"]]);
  });

  it("is what the auto-payer pays with", () => {
    const game = mkGame();
    spawn(game, "Reflecting Pool");
    spawn(game, "Forest");
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] });
    expect(game.state.objects[bears].zone).toBe("stack");
  });
});

describe("any color among …", () => {
  it("Mox Amber names the colours of your legendary creatures and planeswalkers, and nothing without one", () => {
    const game = mkGame();
    const mox = spawn(game, "Mox Amber");
    expect(picks(game, mox)).toEqual([[]]);
    spawn(game, "Grizzly Bears"); // not legendary
    spawn(game, "Teysa Karlov", B); // not yours
    expect(picks(game, mox)).toEqual([[]]);
    spawn(game, "Teysa Karlov");
    expect(picks(game, mox)).toEqual([["W"], ["B"]]);
    tap(game, mox, 0, ["B"]);
    expect(pool(game).B).toBe(1);
  });

  it("Bloom Tender makes one of each colour among your permanents, each once", () => {
    const game = mkGame();
    const tender = spawn(game, "Bloom Tender");
    spawn(game, "Grizzly Bears");
    spawn(game, "Teysa Karlov");
    spawn(game, "Savannah Lions", B);
    expect(picks(game, tender)).toEqual([undefined]);
    tap(game, tender, 0);
    expect(pool(game)).toEqual({ W: 1, U: 0, B: 1, R: 0, G: 1, C: 0 });
  });
});

describe("Choose a color. Add … equal to your devotion to that color", () => {
  it("offers each colour with what it makes, every colour that makes none as one entry", () => {
    const game = mkGame();
    const nykthos = spawn(game, "Nykthos, Shrine to Nyx");
    spawn(game, "Gray Merchant of Asphodel");
    spawn(game, "Island");
    spawn(game, "Island");
    const devotion = offers(game, nykthos, 1);
    expect(devotion.map((a) => a.manaColors)).toEqual([["B", "B"], []]);
    expect(devotion[0].text).toContain("(add {B}{B})");
    tap(game, nykthos, 1, ["B", "B"]);
    expect(pool(game)).toMatchObject({ B: 2, U: 0 });
  });

  it("is a source the auto-payer reaches for, sized by the devotion it would make", () => {
    const game = mkGame();
    spawn(game, "Nykthos, Shrine to Nyx");
    spawn(game, "Gray Merchant of Asphodel");
    spawn(game, "Gray Merchant of Asphodel");
    for (let i = 0; i < 3; i += 1) spawn(game, "Island");
    // Three Islands alone can't cast {3}{B}{B}; two of them paying Nykthos's
    // {2} for four {B} can.
    const merchant = game.debugSpawn("Gray Merchant of Asphodel", A, "hand");
    expect(game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === merchant)).toBe(true);
  });
});

describe("a triggered mana ability's choice, tapped by hand", () => {
  it("lets the player pick which type a two-type land made for Mirari's Wake", () => {
    const game = mkGame();
    spawn(game, "Mirari's Wake");
    const chancery = spawn(game, "Azorius Chancery");
    const options = offers(game, chancery);
    expect(options.map((a) => a.manaColors)).toEqual([["W"], ["U"]]);
    expect(options[1].text).toContain("(add {W}{U}{U})");
    tap(game, chancery, 0, ["U"]);
    expect(pool(game)).toMatchObject({ W: 1, U: 2 });
  });

  it("lets the player pick Fertile Ground's colour", () => {
    const game = mkGame();
    const forest = spawn(game, "Forest");
    const ground = game.debugSpawn("Fertile Ground", A, "battlefield");
    game.state.objects[ground].attachedTo = forest;
    expect(picks(game, forest)).toEqual([["W"], ["U"], ["B"], ["R"], ["G"]]);
    tap(game, forest, 0, ["R"]);
    expect(pool(game)).toMatchObject({ G: 1, R: 1 });
  });

  it("carries none of the tapped land's restriction when the auto-payer taps it", () => {
    const game = mkGame();
    spawn(game, "Mirari's Wake");
    spawn(game, "Ancient Ziggurat");
    const lions = game.debugSpawn("Savannah Lions", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: lions, targets: [] });
    // Ziggurat's restricted unit paid for the creature; Wake's extra unit,
    // left floating, can be spent on anything.
    const left = game.state.players[A].manaPool;
    expect(left).toHaveLength(1);
    expect(left[0].restriction).toBeUndefined();
  });
});

describe("if you tap a permanent for mana, it produces twice as much", () => {
  it("doubles a land tapped by hand, and a triggered mana ability's extra not at all", () => {
    const game = mkGame();
    spawn(game, "Mana Reflection");
    const forest = spawn(game, "Forest");
    const growth = game.debugSpawn("Wild Growth", A, "battlefield");
    game.state.objects[growth].attachedTo = forest;
    tap(game, forest, 0);
    expect(pool(game).G).toBe(3);
  });

  it("compounds — two Mana Reflections and a Nyxbloom Ancient are twelve times", () => {
    const game = mkGame();
    spawn(game, "Mana Reflection");
    spawn(game, "Mana Reflection");
    spawn(game, "Nyxbloom Ancient");
    const forest = spawn(game, "Forest");
    tap(game, forest, 0);
    expect(pool(game).G).toBe(12);
  });

  it("makes one colour of an 'any color' unit, twice — for the auto-payer too", () => {
    const game = mkGame();
    spawn(game, "Mana Reflection");
    const birds = spawn(game, "Birds of Paradise");
    expect(picks(game, birds)).toEqual([["W"], ["U"], ["B"], ["R"], ["G"]]);
    expect(offers(game, birds)[4].text).toContain("(add {G}{G})");
    // One Birds pays {U}{U} (a doubled blue) but never {U}{R}.
    const castable = (name: string): boolean => {
      const card = game.debugSpawn(name, A, "hand");
      return game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === card);
    };
    expect(castable("Plated Seastrider")).toBe(true);
    expect(castable("Expressive Iteration")).toBe(false);
  });

  it("only touches what its controller taps", () => {
    const game = mkGame();
    spawn(game, "Mana Reflection", B);
    const forest = spawn(game, "Forest");
    tap(game, forest, 0);
    expect(pool(game).G).toBe(1);
  });
});
