import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import { printedCardName } from "../state.js";
import type { GameState } from "../state.js";

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

/** Bloodline Keeper's transform is its *second* ability (the first makes a
 * token) and is gated on controlling five or more Vampires. */
const TRANSFORM_ABILITY = 1;

describe("transforming DFCs (ROADMAP Phase 10b)", () => {
  const castKeeper = (game: Game): ObjectId => {
    game.advanceUntil(atMain);
    for (const id of handCards(game, "Swamp").slice(0, 5)) {
      game.dispatch({ type: "play-land", player: A, card: id });
    }
    const card = handCards(game, "Bloodline Keeper")[0];
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    game.advanceUntil(settled);
    return card;
  };

  it("a self-transform ability turns the permanent over, keeping the same object", () => {
    const game = mkGame(["Bloodline Keeper"], "Swamp");
    const card = castKeeper(game);

    expect(game.state.objects[card].zone).toBe("battlefield");
    expect(game.state.objects[card].face ?? 0).toBe(0);
    expect(printedCardName(game.state.objects[card])).toBe("Bloodline Keeper");

    // "Activate only if you control five or more Vampires" — the Keeper is one
    // of them, so four tokens reach the threshold.
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Vampire Token", A);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: card,
      abilityIndex: TRANSFORM_ABILITY,
    });
    game.advanceUntil(settled);

    expect(game.state.objects[card].face).toBe(1);
    expect(printedCardName(game.state.objects[card])).toBe("Lord of Lineage");
    const c = computeCharacteristics(game.state, reg, card);
    expect([c.power, c.toughness]).toEqual([5, 5]);
    expect(c.keywords.has("flying")).toBe(true);
    // Same object (rule 712.10) — not a token, not re-summoned.
    expect(game.state.objects[card].isToken).toBeFalsy();
  });

  it("the transform ability is unavailable until its condition is met (rule 602.5)", () => {
    const game = mkGame(["Bloodline Keeper"], "Swamp");
    const card = castKeeper(game);

    const transformOffered = (): boolean =>
      game
        .legalActions(A)
        .some(
          (x) =>
            x.kind === "activate-ability" &&
            x.source === card &&
            x.abilityIndex === TRANSFORM_ABILITY,
        );

    expect(transformOffered()).toBe(false); // one Vampire — the Keeper itself
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Vampire Token", A);
    expect(transformOffered()).toBe(false); // four
    game.debugSpawn("Vampire Token", A);
    expect(transformOffered()).toBe(true); // five
  });

  it("a `transforms` trigger on the back face fires as the permanent turns over", () => {
    // Sidequest: Raise a Chocobo flips itself at your first main phase once you
    // control four or more Birds; Black Chocobo's transforms trigger then
    // fetches a land.
    // A scripted Alice actually takes the card out of the search (the default
    // controller takes the minimum, which is zero for an "up to one" search).
    const alice = new ScriptedController(A);
    alice.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { maxLandsPerTurn: 99, skipFirstDraw: false },
      controllers: { [A]: alice, [B]: new ScriptedController(B) },
      decks: [
        { player: A, cards: fill(["Sidequest: Raise a Chocobo"], "Forest") },
        { player: B, cards: fill([], "Forest") },
      ],
    });
    game.advanceUntil(atMain);
    const sidequest = game.debugSpawn("Sidequest: Raise a Chocobo", A);
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Chocobo Bird Token", A);
    const forests = (): readonly ObjectId[] =>
      game.state.zones.shared.battlefield.filter(
        (id) => game.state.objects[id].cardName === "Forest",
      );
    const before = forests().length;

    game.advanceUntil((s) => s.turn.number === 3 && atMain(s));
    // The trigger is only *pending* at the moment the step begins — let it
    // reach the stack before waiting for the stack to drain.
    game.advanceUntil((s) => s.pendingTriggers.length === 0);
    game.advanceUntil(settled);

    expect(game.state.objects[sidequest].face).toBe(1);
    expect(printedCardName(game.state.objects[sidequest])).toBe("Black Chocobo");
    expect(forests().length).toBe(before + 1);
    // The fetched land entered tapped.
    expect(forests().some((id) => game.state.objects[id].tapped)).toBe(true);
  });

  it("legalActions only offers the front face of a transforming DFC", () => {
    const game = mkGame(["Bloodline Keeper"], "Swamp");
    game.advanceUntil(atMain);
    for (const id of handCards(game, "Swamp").slice(0, 4)) {
      game.dispatch({ type: "play-land", player: A, card: id });
    }
    const card = handCards(game, "Bloodline Keeper")[0];
    const actions = game.legalActions(A).filter((x) => "card" in x && x.card === card);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ kind: "cast-spell", cardName: "Bloodline Keeper" });
    expect("face" in actions[0]).toBe(false);
  });

  it("a daybound werewolf makes it day, then transforms with the day/night cycle", () => {
    const game = mkGame(
      [
        "Harvesttide Infiltrator",
        "Mountain",
        "Mountain",
        "Mountain",
        "Mountain",
        "Raging Goblin",
        "Raging Goblin",
      ],
      "Mountain",
    );
    game.advanceUntil(atMain);
    for (const id of handCards(game, "Mountain").slice(0, 3)) {
      game.dispatch({ type: "play-land", player: A, card: id });
    }
    const card = handCards(game, "Harvesttide Infiltrator")[0];
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
    expect(printedCardName(game.state.objects[card])).toBe("Harvesttide Assailant");
    const night = computeCharacteristics(game.state, reg, card);
    expect([night.power, night.toughness]).toEqual([4, 4]);
    expect(night.keywords.has("trample")).toBe(true);

    // Alice casts two spells this turn → turn 4 begins day (726.4), transforms back.
    for (const id of handCards(game, "Mountain").slice(0, 2)) {
      game.dispatch({ type: "play-land", player: A, card: id });
    }
    for (const goblin of handCards(game, "Raging Goblin")) {
      game.dispatch({ type: "cast-spell", player: A, card: goblin, targets: [] });
      game.advanceUntil(settled);
    }
    game.advanceUntil((s) => s.turn.number === 4 && s.turn.step === "upkeep");
    expect(game.state.dayNight).toBe("day");
    expect(game.state.objects[card].face ?? 0).toBe(0);
    expect(computeCharacteristics(game.state, reg, card).power).toBe(3);
  });

  it("a daybound werewolf enters transformed while it's already night", () => {
    const game = mkGame(
      [
        "Harvesttide Infiltrator",
        "Harvesttide Infiltrator",
        "Mountain",
        "Mountain",
        "Mountain",
        "Mountain",
        "Mountain",
      ],
      "Mountain",
    );
    game.advanceUntil(atMain);
    for (const id of handCards(game, "Mountain").slice(0, 3)) {
      game.dispatch({ type: "play-land", player: A, card: id });
    }
    const first = handCards(game, "Harvesttide Infiltrator")[0];
    game.dispatch({ type: "cast-spell", player: A, card: first, targets: [] });
    game.advanceUntil(settled); // becomes day

    // Bob's turn (no spells) → turn 3 becomes night; the first werewolf flips.
    game.advanceUntil((s) => s.turn.number === 3 && atMain(s));
    expect(game.state.dayNight).toBe("night");

    // Cast the second copy now, at night — it enters already transformed.
    for (const id of handCards(game, "Mountain").slice(0, 3)) {
      game.dispatch({ type: "play-land", player: A, card: id });
    }
    const second = handCards(game, "Harvesttide Infiltrator")[0];
    game.dispatch({ type: "cast-spell", player: A, card: second, targets: [] });
    game.advanceUntil(settled);
    expect(game.state.objects[second].face).toBe(1);
    expect(printedCardName(game.state.objects[second])).toBe("Harvesttide Assailant");
  });

  it("a transformed permanent reverts to its front face when it leaves the battlefield", () => {
    const game = mkGame(
      ["Bloodline Keeper", "Swamp", "Swamp", "Swamp", "Swamp", "Swamp"],
      "Island",
      ["Unsummon"],
    );
    const card = castKeeper(game);
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Vampire Token", A);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: card,
      abilityIndex: TRANSFORM_ABILITY,
    });
    game.advanceUntil(settled);
    expect(game.state.objects[card].face).toBe(1);

    // Bob bounces the Lord back to alice's hand.
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
    expect(printedCardName(game.state.objects[card])).toBe("Bloodline Keeper");
  });
});
