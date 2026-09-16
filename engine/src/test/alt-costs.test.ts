/**
 * The last three phase-E mechanisms, all variations on "pay something other
 * than mana":
 *
 * - `AbilityCost.tapOthers` — "Tap five untapped Zombies you control"
 *   (Gravespawn Sovereign).
 * - `CardDefinition.alternativeCost` — "pay {W} and tap four untapped
 *   creatures with flying rather than pay this spell's mana cost" (Sephara).
 * - `{X}` inside a `may` cost — "you may pay {X}{R}. If you do, it deals X
 *   damage" (Flameblast Dragon).
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const makeGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Mountain") },
      { player: B, cards: Array<string>(40).fill("Mountain") },
    ],
  });

const readyLands = (game: Game, n: number, kind = "Mountain") => {
  for (let i = 0; i < n; i += 1) {
    const id = game.debugSpawn(kind, A, "battlefield");
    game.state.objects[id].tapped = false;
  }
};

/** Spawn `n` copies of `card` for A, ready to be tapped. */
const readyCreatures = (game: Game, card: string, n: number) => {
  const ids = [];
  for (let i = 0; i < n; i += 1) {
    const id = game.debugSpawn(card, A, "battlefield");
    game.state.objects[id].summoningSick = false;
    game.state.objects[id].tapped = false;
    ids.push(id);
  }
  return ids;
};

describe("Gravespawn Sovereign — tapping other permanents as a cost", () => {
  it("isn't offered without enough untapped Zombies", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyCreatures(game, "Gravespawn Sovereign", 1);
    readyCreatures(game, "Zombie Token", 2);
    game.debugSpawn("Grizzly Bears", B, "graveyard");

    const legal = game
      .legalActions(A)
      .find((a) => a.kind === "activate-ability" && a.cardName === "Gravespawn Sovereign");
    expect(legal).toBeUndefined();
  });

  it("taps five and reanimates from any graveyard", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const [sovereign] = readyCreatures(game, "Gravespawn Sovereign", 1);
    const zombies = readyCreatures(game, "Zombie Token", 4);
    const victim = game.debugSpawn("Craw Wurm", B, "graveyard");

    const legal = game
      .legalActions(A)
      .find((a) => a.kind === "activate-ability" && a.cardName === "Gravespawn Sovereign");
    expect(legal).toBeDefined();
    if (legal === undefined || legal.kind !== "activate-ability") return;

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: legal.source,
      abilityIndex: legal.abilityIndex,
      targets: [{ kind: "object", object: victim }],
    });
    // The Sovereign counts itself (`includeSelf`), so all five are tapped.
    const tapped = [sovereign, ...zombies].filter((id) => game.state.objects[id].tapped);
    expect(tapped.length).toBe(5);

    game.advanceUntil((s) => s.zones.shared.stack.length === 0 || s.result.over);
    expect(game.state.objects[victim].zone).toBe("battlefield");
    // "Under your control" — owned by B, controlled by A.
    expect(game.state.objects[victim].controller).toBe(A);
    expect(game.state.objects[victim].owner).toBe(B);
  });
});

describe("Sephara — an alternative cost", () => {
  it("is offered as a second cast variant when the fliers are there", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyLands(game, 1, "Plains");
    readyCreatures(game, "Serra Angel", 4);
    game.debugSpawn("Sephara, Sky's Blade", A, "hand");

    const variants = game
      .legalActions(A)
      .filter((a) => a.kind === "cast-spell" && a.cardName === "Sephara, Sky's Blade");
    // Only the alternative cost is affordable off one Plains.
    expect(variants.length).toBe(1);
    if (variants[0].kind !== "cast-spell") return;
    expect(variants[0].altCost).toBe(true);
  });

  it("taps four fliers as the spell is cast", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyLands(game, 1, "Plains");
    const angels = readyCreatures(game, "Serra Angel", 4);
    const card = game.debugSpawn("Sephara, Sky's Blade", A, "hand");

    game.dispatch({ type: "cast-spell", player: A, card, targets: [], altCost: true });
    expect(angels.every((id) => game.state.objects[id].tapped)).toBe(true);
  });

  it("is not offered with too few fliers", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyLands(game, 1, "Plains");
    readyCreatures(game, "Serra Angel", 3);
    game.debugSpawn("Sephara, Sky's Blade", A, "hand");

    const variants = game
      .legalActions(A)
      .filter((a) => a.kind === "cast-spell" && a.cardName === "Sephara, Sky's Blade");
    expect(variants.length).toBe(0);
  });

  it("only makes fliers indestructible", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    game.debugSpawn("Sephara, Sky's Blade", A, "battlefield");
    const angel = game.debugSpawn("Serra Angel", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");

    expect(game.characteristics(angel).keywords.has("indestructible")).toBe(true);
    expect(game.characteristics(bear).keywords.has("indestructible")).toBe(false);
  });
});

describe("Flameblast Dragon — {X} inside a may cost", () => {
  it("offers the choice with a maximum X, and deals that much", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyLands(game, 5);
    const dragon = game.debugSpawn("Flameblast Dragon", A, "battlefield");
    game.state.objects[dragon].summoningSick = false;

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: dragon, defender: B }],
    });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || s.awaiting?.kind === "choose-modes" || s.result.over);

    if (game.state.awaiting?.kind === "choose-targets") {
      game.dispatch({
        type: "choose-targets",
        player: A,
        targets: [{ kind: "player", player: B }],
      });
      game.advanceUntil((s) => s.awaiting?.kind === "choose-modes" || s.result.over);
    }

    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-modes");
    const legal = game.legalActions(A).find((a) => a.kind === "choose-modes");
    expect(legal).toBeDefined();
    if (legal === undefined || legal.kind !== "choose-modes") return;
    // {X}{R} off five Mountains — X can reach 4.
    expect(legal.xCost?.maxX).toBe(4);

    const lifeBefore = game.state.players[B].life;
    game.dispatch({ type: "choose-modes", player: A, modes: [0], xValue: 3 });
    expect(game.state.players[B].life).toBe(lifeBefore - 3);
  });

  it("does nothing when declined", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyLands(game, 5);
    const dragon = game.debugSpawn("Flameblast Dragon", A, "battlefield");
    game.state.objects[dragon].summoningSick = false;

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: dragon, defender: B }],
    });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || s.awaiting?.kind === "choose-modes" || s.result.over);
    if (game.state.awaiting?.kind === "choose-targets") {
      game.dispatch({
        type: "choose-targets",
        player: A,
        targets: [{ kind: "player", player: B }],
      });
      game.advanceUntil((s) => s.awaiting?.kind === "choose-modes" || s.result.over);
    }

    const lifeBefore = game.state.players[B].life;
    game.dispatch({ type: "choose-modes", player: A, modes: [] });
    expect(game.state.players[B].life).toBe(lifeBefore);
  });
});
