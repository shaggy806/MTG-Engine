import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "./characteristics.js";
import { createDefaultRegistry } from "./cards.js";
import { Game } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { ObjectId } from "./primitives.js";
import { printedCardName } from "./state.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const reg = createDefaultRegistry();

const fill = (cards: readonly string[], land: string): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill(land),
];

const mkGame = (
  aCards: readonly string[],
  land: string,
  bCards: readonly string[] = [],
): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false },
    decks: [
      { player: A, cards: fill(aCards, land) },
      { player: B, cards: fill(bCards, land) },
    ],
  });

const atMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const handCards = (game: Game, name: string): ObjectId[] =>
  game.handOf(A).filter((i) => game.state.objects[i].cardName === name);

describe("transforming DFCs (ROADMAP Phase 10b)", () => {
  it("a self-transform ability turns the permanent over and fires its transforms trigger", () => {
    const game = mkGame(["Nightfall Cultist"], "Swamp");
    game.advanceUntil(atMain);
    for (const id of handCards(game, "Swamp").slice(0, 5)) {
      game.dispatch({ type: "play-land", player: A, card: id });
    }
    const card = handCards(game, "Nightfall Cultist")[0];
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    game.advanceUntil(settled);

    expect(game.state.objects[card].zone).toBe("battlefield");
    expect(game.state.objects[card].face ?? 0).toBe(0);
    expect(printedCardName(game.state.objects[card])).toBe("Nightfall Cultist");
    const beforeLife = game.state.players[B].life;

    game.dispatch({ type: "activate-ability", player: A, source: card, abilityIndex: 0 });
    game.advanceUntil(settled);

    expect(game.state.objects[card].face).toBe(1);
    expect(printedCardName(game.state.objects[card])).toBe("Voidfall Horror");
    const c = computeCharacteristics(game.state, reg, card);
    expect([c.power, c.toughness]).toEqual([5, 5]);
    expect(c.keywords.has("menace")).toBe(true);
    // The `transforms` trigger on the back face resolved.
    expect(game.state.players[B].life).toBe(beforeLife - 2);
    // Same object, same timestamp (rule 712.10) — no re-summoning-sickness reset.
    expect(game.state.objects[card].isToken).toBeFalsy();
  });

  it("legalActions only offers the front face of a transforming DFC", () => {
    const game = mkGame(["Nightfall Cultist"], "Swamp");
    game.advanceUntil(atMain);
    for (const id of handCards(game, "Swamp").slice(0, 3)) {
      game.dispatch({ type: "play-land", player: A, card: id });
    }
    const card = handCards(game, "Nightfall Cultist")[0];
    const actions = game.legalActions(A).filter((x) => "card" in x && x.card === card);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ kind: "cast-spell", cardName: "Nightfall Cultist" });
    expect("face" in actions[0]).toBe(false);
  });

  it("a daybound werewolf makes it day, then transforms with the day/night cycle", () => {
    const game = mkGame(
      ["Moonrise Cultivator", "Forest", "Forest", "Forest", "Forest", "Grizzly Bears", "Grizzly Bears"],
      "Forest",
    );
    game.advanceUntil(atMain);
    for (const id of handCards(game, "Forest").slice(0, 2)) {
      game.dispatch({ type: "play-land", player: A, card: id });
    }
    const card = handCards(game, "Moonrise Cultivator")[0];
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    game.advanceUntil(settled);

    // Casting a daybound permanent makes it day (rule 726.2).
    expect(game.state.dayNight).toBe("day");
    expect(game.state.objects[card].face ?? 0).toBe(0);

    // Turn 2 is bob's; he casts nothing. Turn 3 begins → night (726.3), and the
    // werewolf transforms.
    game.advanceUntil((s) => s.turn.number === 3 && atMain(s));
    expect(game.state.dayNight).toBe("night");
    expect(game.state.objects[card].face).toBe(1);
    expect(printedCardName(game.state.objects[card])).toBe("Moonrise Marauder");
    const night = computeCharacteristics(game.state, reg, card);
    expect([night.power, night.toughness]).toEqual([4, 4]);
    expect(night.keywords.has("trample")).toBe(true);

    // Alice casts two spells this turn → turn 4 begins day (726.4), transforms back.
    for (const id of handCards(game, "Forest").slice(0, 2)) {
      game.dispatch({ type: "play-land", player: A, card: id });
    }
    for (const bear of handCards(game, "Grizzly Bears")) {
      game.dispatch({ type: "cast-spell", player: A, card: bear, targets: [] });
      game.advanceUntil(settled);
    }
    game.advanceUntil((s) => s.turn.number === 4 && s.turn.step === "upkeep");
    expect(game.state.dayNight).toBe("day");
    expect(game.state.objects[card].face ?? 0).toBe(0);
    expect(computeCharacteristics(game.state, reg, card).power).toBe(2);
  });

  it("a daybound werewolf enters transformed while it's already night", () => {
    const game = mkGame(
      ["Moonrise Cultivator", "Moonrise Cultivator", "Forest", "Forest", "Forest", "Forest", "Forest"],
      "Forest",
    );
    game.advanceUntil(atMain);
    for (const id of handCards(game, "Forest").slice(0, 2)) {
      game.dispatch({ type: "play-land", player: A, card: id });
    }
    const first = handCards(game, "Moonrise Cultivator")[0];
    game.dispatch({ type: "cast-spell", player: A, card: first, targets: [] });
    game.advanceUntil(settled); // becomes day

    // Bob's turn (no spells) → turn 3 becomes night; the first werewolf flips.
    game.advanceUntil((s) => s.turn.number === 3 && atMain(s));
    expect(game.state.dayNight).toBe("night");

    // Cast the second copy now, at night — it enters already transformed.
    for (const id of handCards(game, "Forest").slice(0, 2)) {
      game.dispatch({ type: "play-land", player: A, card: id });
    }
    const second = handCards(game, "Moonrise Cultivator")[0];
    game.dispatch({ type: "cast-spell", player: A, card: second, targets: [] });
    game.advanceUntil(settled);
    expect(game.state.objects[second].face).toBe(1);
    expect(printedCardName(game.state.objects[second])).toBe("Moonrise Marauder");
  });

  it("a transformed permanent reverts to its front face when it leaves the battlefield", () => {
    const game = mkGame(
      ["Nightfall Cultist", "Swamp", "Swamp", "Swamp", "Swamp", "Swamp"],
      "Island",
      ["Unsummon"],
    );
    game.advanceUntil(atMain);
    for (const id of handCards(game, "Swamp").slice(0, 5)) {
      game.dispatch({ type: "play-land", player: A, card: id });
    }
    const card = handCards(game, "Nightfall Cultist")[0];
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    game.advanceUntil(settled);
    game.dispatch({ type: "activate-ability", player: A, source: card, abilityIndex: 0 });
    game.advanceUntil(settled);
    expect(game.state.objects[card].face).toBe(1);

    // Bob bounces the Horror back to alice's hand.
    game.advanceUntil((s) => s.turn.number === 2 && atMain(s));
    const island = game.handOf(B).find((i) => game.state.objects[i].cardName === "Island")!;
    game.dispatch({ type: "play-land", player: B, card: island });
    const unsummon = game.handOf(B).find((i) => game.state.objects[i].cardName === "Unsummon")!;
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: unsummon,
      targets: [{ kind: "object", object: card }],
    });
    game.advanceUntil(settled);
    expect(game.state.objects[card].zone).toBe("hand");
    expect(game.state.objects[card].face ?? 0).toBe(0);
    expect(printedCardName(game.state.objects[card])).toBe("Nightfall Cultist");
  });
});
