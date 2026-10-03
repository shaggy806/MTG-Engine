/**
 * Spending mana "as though it were mana of any color" / "mana of any type can
 * be spent" (rules 118.14, 609.4b) — `SpendAs`: a `spendManaAs` static
 * (Chromatic Orrery's every cost, Vizier of the Menagerie's creature spells)
 * and a permission's own (`impulse-exile`'s `spendAs`, Gonti, Canny
 * Acquisitor), which is only for a spell cast under that permission.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { parseManaCost } from "../mana.js";
import { costAsSpendable } from "../mana-payment.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = () => {
  const controllers = { [A]: new ScriptedController(A), [B]: new ScriptedController(B) };
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40 },
    controllers,
    decks: [A, B].map((player) => ({ player, cards: Array(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return { game, c: controllers as Record<PlayerId, ScriptedController> };
};

const quiet = (game: Game) =>
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0);

const castable = (game: Game, card: ObjectId, player: PlayerId = A) =>
  game.legalActions(player).some((a) => a.kind === "cast-spell" && a.card === card);

const mountains = (game: Game, n: number, player: PlayerId = A) => {
  for (let i = 0; i < n; i += 1) game.debugSpawn("Mountain", player, "battlefield");
};

describe("costAsSpendable — how a cost reads when mana may be spent freely", () => {
  it("any colour folds every coloured pip into generic, but keeps {C}", () => {
    const cost = costAsSpendable(parseManaCost("{2}{C}{U}{U}"), "any-color");
    expect(cost.generic).toBe(4);
    expect(cost.colorless).toBe(1);
    expect(Object.values(cost.colored).every((n) => n === 0)).toBe(true);
  });

  it("any type folds {C} too", () => {
    const cost = costAsSpendable(parseManaCost("{2}{C}{U}{U}"), "any-type");
    expect(cost.generic).toBe(5);
    expect(cost.colorless).toBe(0);
  });

  it("no permission leaves the cost alone", () => {
    const printed = parseManaCost("{1}{G}");
    expect(costAsSpendable(printed, undefined)).toBe(printed);
  });
});

describe("a spendManaAs static", () => {
  it("Chromatic Orrery: Mountains pay a blue spell from the hand, and the colours spent stay red", () => {
    const { game } = mkGame();
    game.debugSpawn("Chromatic Orrery", A, "battlefield", { tapped: true });
    mountains(game, 3);
    const counter = game.debugSpawn("Divination", A, "hand");
    expect(castable(game, counter)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: counter, targets: [] });
    // Rule 609.4b: it didn't change what was actually spent.
    expect(game.state.objects[counter].manaSpentColors).toEqual(["R"]);
    quiet(game);
    expect(game.state.objects[counter].zone).toBe("graveyard");
  });

  it("Chromatic Orrery: a {C} pip still wants colourless mana (any colour isn't colourless)", () => {
    const { game } = mkGame();
    game.debugSpawn("Chromatic Orrery", A, "battlefield", { tapped: true });
    mountains(game, 3);
    const raker = game.debugSpawn("Glaring Fleshraker", A, "hand");
    expect(castable(game, raker)).toBe(false);
    game.debugSpawn("Wastes", A, "battlefield");
    expect(castable(game, raker)).toBe(true);
  });

  it("without it, the same Mountains can't pay blue", () => {
    const { game } = mkGame();
    mountains(game, 3);
    expect(castable(game, game.debugSpawn("Divination", A, "hand"))).toBe(false);
  });

  it("Vizier of the Menagerie: any type pays a creature spell — {C} included — but not a noncreature one", () => {
    const { game } = mkGame();
    game.debugSpawn("Vizier of the Menagerie", A, "battlefield");
    mountains(game, 3);
    expect(castable(game, game.debugSpawn("Grizzly Bears", A, "hand"))).toBe(true);
    expect(castable(game, game.debugSpawn("Glaring Fleshraker", A, "hand"))).toBe(true);
    expect(castable(game, game.debugSpawn("Divination", A, "hand"))).toBe(false);
  });
});

describe("deny-list mana — \"can't be spent to cast nonartifact spells\" (spendOnly.notSpell)", () => {
  const powerstoneMana = (game: Game, n: number) =>
    game.debugApplyEffect(A, {
      kind: "add-mana",
      mana: "C",
      amount: n,
      persists: true,
      spendOnly: { notSpell: { notTypes: ["artifact"] }, text: "This mana can't be spent to cast nonartifact spells." },
    });

  it("pays an artifact spell and an ability, never a nonartifact spell", () => {
    const { game } = mkGame();
    powerstoneMana(game, 2);
    game.debugSpawn("Forest", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    // {1}{G}: the Forest pays {G}, but the {1} can't come from this mana.
    expect(castable(game, bears)).toBe(false);
    const sol = game.debugSpawn("Sol Ring", A, "hand");
    expect(castable(game, sol)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: sol, targets: [] });
    expect(game.state.players[A].manaPool.length).toBe(1);
  });

  it("pays an ability's cost (Karn's ruling)", () => {
    const { game } = mkGame();
    powerstoneMana(game, 2);
    const bauble = game.debugSpawn("Wayfarer's Bauble", A, "battlefield");
    const ability = game.legalActions(A).find((a) => a.kind === "activate-ability" && a.source === bauble);
    if (ability?.kind !== "activate-ability") throw new Error("Wayfarer's Bauble not activatable");
    game.dispatch({ type: "activate-ability", player: A, source: bauble, abilityIndex: ability.abilityIndex, targets: [] });
    expect(game.state.players[A].manaPool.length).toBe(0);
  });
});

describe("a permission's spendAs is only for the spell cast under it (rule 118.14)", () => {
  it("an impulse exile with any-type spending: castable off Mountains; the same card in hand isn't", () => {
    const { game } = mkGame();
    mountains(game, 2);
    const theirs = game.debugSpawn("Grizzly Bears", B, "library");
    game.debugApplyEffect(
      A,
      { kind: "impulse-exile", amount: 1, whose: "each-opponent", duration: "while-exiled", spendAs: "any-type" },
      [],
    );
    expect(game.state.objects[theirs].zone).toBe("exile");
    expect(castable(game, theirs)).toBe(true);
    const mine = game.debugSpawn("Grizzly Bears", A, "hand");
    expect(castable(game, mine)).toBe(false);

    game.dispatch({ type: "cast-spell", player: A, card: theirs, targets: [], via: "impulse" });
    quiet(game);
    expect(game.state.objects[theirs].zone).toBe("battlefield");
    expect(game.state.objects[theirs].controller).toBe(A);
  });

  it("floating mana made by hand pays it too", () => {
    const { game } = mkGame();
    mountains(game, 2);
    const theirs = game.debugSpawn("Grizzly Bears", B, "library");
    game.debugApplyEffect(
      A,
      { kind: "impulse-exile", amount: 1, whose: "each-opponent", duration: "while-exiled", spendAs: "any-color" },
      [],
    );
    for (const id of game.state.zones.shared.battlefield) {
      if (game.state.objects[id].cardName !== "Mountain") continue;
      const tap = game
        .legalActions(A)
        .find((a) => a.kind === "activate-ability" && a.source === id);
      if (tap?.kind !== "activate-ability") throw new Error("no mana ability");
      game.dispatch({ type: "activate-ability", player: A, source: id, abilityIndex: tap.abilityIndex, targets: [] });
    }
    expect(game.state.players[A].manaPool.length).toBe(2);
    game.dispatch({ type: "cast-spell", player: A, card: theirs, targets: [], via: "impulse" });
    expect(game.state.players[A].manaPool.length).toBe(0);
  });

  it("without the spendAs, an impulse card is paid as printed", () => {
    const { game } = mkGame();
    mountains(game, 2);
    const theirs = game.debugSpawn("Grizzly Bears", B, "library");
    game.debugApplyEffect(A, { kind: "impulse-exile", amount: 1, whose: "each-opponent", duration: "while-exiled" }, []);
    expect(castable(game, theirs)).toBe(false);
  });

  it("any colour from a permission doesn't pay a {C} pip; any type does", () => {
    const { game } = mkGame();
    mountains(game, 3);
    const colour = game.debugSpawn("Glaring Fleshraker", B, "library");
    game.debugApplyEffect(
      A,
      { kind: "impulse-exile", amount: 1, whose: "each-opponent", duration: "while-exiled", spendAs: "any-color" },
      [],
    );
    expect(castable(game, colour)).toBe(false);
    const type = game.debugSpawn("Glaring Fleshraker", B, "library");
    game.debugApplyEffect(
      A,
      { kind: "impulse-exile", amount: 1, whose: "each-opponent", duration: "while-exiled", spendAs: "any-type" },
      [],
    );
    expect(castable(game, type)).toBe(true);
  });
});
