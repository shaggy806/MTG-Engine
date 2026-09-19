/**
 * Revealing cards (rule 701.16).
 *
 * The event is the easy half. The half that matters is that the card's
 * *identity* reaches every seat: a reveal is momentary, but a client only ever
 * sees whole frames, so without `revealedThisTurn` the event would name a card
 * the opponent's view renders as a face-down back.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aCards: readonly string[], aLibrary: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      {
        player: A,
        cards: [
          ...aCards,
          ...Array(Math.max(0, 9 - aCards.length)).fill("Island"),
          ...aLibrary,
          ...Array(40).fill("Island"),
        ],
      },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });
  return { game, a };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const handCard = (game: Game, name: string): ObjectId => {
  const id = game.handOf(A).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};

describe("a tutor that says 'reveal it'", () => {
  const castMysticalTutor = () => {
    const { game, a } = mkGame(["Mystical Tutor", "Island"], ["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Island", A, "battlefield");
    a.chooseFromZoneFn = (_v, eligible) => eligible.slice(0, 1);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, "Mystical Tutor"),
      targets: [],
    });
    game.advanceUntil(quiet);
    return game;
  };

  it("emits a cards-revealed event naming the find", () => {
    const game = castMysticalTutor();
    const revealed = game.eventsOfType("cards-revealed");
    expect(revealed).toHaveLength(1);
    expect(revealed[0].player).toBe(A);
    expect(revealed[0].from).toBe("library");
    expect(
      revealed[0].objects.map((id) => game.state.objects[id].cardName),
    ).toEqual(["Lightning Bolt"]);
  });

  it("puts the card's identity in the OPPONENT's view — the whole point", () => {
    const game = castMysticalTutor();
    const id = game.eventsOfType("cards-revealed")[0].objects[0];

    // Bob can name it, even though it is sitting in Alice's library.
    expect(game.viewFor(B).objects[id]?.cardName).toBe("Lightning Bolt");
    expect(game.state.objects[id].zone).toBe("library");
    // Its *position* is still hidden — a library is never listed in a view.
    expect(Object.keys(game.viewFor(B).zones)).not.toContain("library");
  });

  it("stops being visible once the turn is over", () => {
    const game = castMysticalTutor();
    const id = game.eventsOfType("cards-revealed")[0].objects[0];
    expect(game.viewFor(B).objects[id]).toBeDefined();

    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.revealedThisTurn).toEqual([]);
    // Otherwise a revealed card drawn later would be permanently face-up in
    // its owner's hand for everyone else.
    expect(game.viewFor(B).objects[id]).toBeUndefined();
  });
});

describe("a tutor that does not say 'reveal'", () => {
  it("Vampiric Tutor reveals nothing", () => {
    const { game, a } = mkGame(["Vampiric Tutor", "Swamp"], ["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Swamp", A, "battlefield");
    a.chooseFromZoneFn = (_v, eligible) => eligible.slice(0, 1);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, "Vampiric Tutor"),
      targets: [],
    });
    game.advanceUntil(quiet);

    expect(game.eventsOfType("cards-revealed")).toHaveLength(0);
    expect(game.state.revealedThisTurn).toEqual([]);
  });
});
