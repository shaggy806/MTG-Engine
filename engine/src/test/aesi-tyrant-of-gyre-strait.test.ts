/**
 * Aesi, Tyrant of Gyre Strait — both clauses driven through the real `Game`
 * (legal-action checks, the stack, the `choose-modes` "you may" decision):
 *
 * - "You may play an additional land on each of your turns." Its controller's
 *   land-drop budget is one higher while Aesi is on the battlefield, and only
 *   then; it adds to other extra-land effects (the 2020-11-10 ruling), and it
 *   is nobody else's.
 * - "Landfall — Whenever a land you control enters, you may draw a card." A
 *   land entering under Aesi's controller's control *by any means* triggers it
 *   — played, or put there by a spell — while a permanent already on the
 *   battlefield becoming a land does not (the 2024-11-08 rulings). The draw
 *   is optional (rule 603.5): accepting draws one card, declining draws none.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const AESI = "Aesi, Tyrant of Gyre Strait";
const registry = createDefaultRegistry();

/** Opening hands are the first seven cards of each (unshuffled) deck, plus
 * the turn-1 draw; the rest of the library is Islands. */
const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array<string>(Math.max(0, 40 - cards.length)).fill("Island"),
];

interface Setup {
  readonly aHand?: readonly string[];
  readonly bHand?: readonly string[];
  /** A's answer to Aesi's "you may draw a card?" — accept by default. */
  readonly draw?: boolean;
}

const makeGame = ({ aHand = [], bHand = [], draw = true }: Setup = {}) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const prompts: { player: PlayerId; source: ObjectId; modes: readonly string[] }[] = [];
  a.chooseModesFn = (view, _min, _max, modeTexts) => {
    const awaiting = view.state.awaiting;
    if (awaiting?.kind === "choose-modes") {
      prompts.push({ player: awaiting.player, source: awaiting.source, modes: modeTexts });
    }
    return draw ? [0] : [];
  };
  // Rampant Growth's search: take the first basic land offered.
  a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aHand) },
      { player: B, cards: pad(bHand) },
    ],
  });
  game.advanceUntil(
    (s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  return { game, a, b, prompts };
};

/** Nothing left to place, resolve or answer. `pendingTriggers` matters after
 * a silent `debugSpawn(..., { announceEntry: true })`, whose trigger isn't on
 * the stack until the next priority check puts it there. */
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;

const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((i) => game.state.objects[i].cardName === name);
  if (id === undefined) throw new Error(`${player} has no ${name} in hand`);
  return id;
};

/** Whether `player` may play `name` from hand right now — `null` means yes. */
const whyNotPlayLand = (game: Game, player: PlayerId, name: string): string | null =>
  game.canDispatch({ type: "play-land", player, card: inHand(game, player, name) });

const playLand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const card = inHand(game, player, name);
  game.dispatch({ type: "play-land", player, card });
  game.advanceUntil(settled);
  return card;
};

const untappedLands = (game: Game, player: PlayerId, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) {
    game.debugSpawn(name, player, "battlefield");
  }
};

const count = (game: Game, name: string): number =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name).length;

describe("Aesi, Tyrant of Gyre Strait", () => {
  it("is a 5/5 green-blue legendary Serpent for {4}{G}{U}", () => {
    const def = registry.get(AESI);
    expect(def.manaCost).toBe("{4}{G}{U}");
    expect(def.colors).toEqual(["G", "U"]);
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.types).toEqual(["creature"]);
    expect(def.subtypes).toEqual(["Serpent"]);
    expect([def.power, def.toughness]).toEqual([5, 5]);
    expect(identityString(colorIdentityOf(def))).toBe("UG"); // WUBRG order
    expect(def.keywords).toEqual([]);
    expect(def.activated).toEqual([]);
  });

  describe("You may play an additional land on each of your turns", () => {
    it("without Aesi a second land is refused (the baseline)", () => {
      const { game } = makeGame({ aHand: ["Forest", "Forest"] });
      playLand(game, A, "Forest");
      expect(whyNotPlayLand(game, A, "Forest")).not.toBeNull();
    });

    it("with Aesi on the battlefield, two lands a turn and not a third", () => {
      const { game } = makeGame({ aHand: ["Forest", "Forest", "Forest"] });
      game.debugSpawn(AESI, A, "battlefield");

      playLand(game, A, "Forest");
      expect(whyNotPlayLand(game, A, "Forest")).toBeNull();
      playLand(game, A, "Forest");
      expect(count(game, "Forest")).toBe(2);
      expect(whyNotPlayLand(game, A, "Forest")).not.toBeNull();
    });

    it("does nothing from the hand — only a permanent on the battlefield grants it", () => {
      const { game } = makeGame({ aHand: [AESI, "Forest", "Forest"] });
      playLand(game, A, "Forest");
      expect(whyNotPlayLand(game, A, "Forest")).not.toBeNull();
    });

    it("stops the moment Aesi leaves the battlefield", () => {
      const { game } = makeGame({ aHand: ["Forest", "Forest"] });
      const aesi = game.debugSpawn(AESI, A, "battlefield");
      playLand(game, A, "Forest");
      expect(whyNotPlayLand(game, A, "Forest")).toBeNull();

      game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: aesi }]);
      game.advanceUntil(settled);
      expect(game.state.objects[aesi].zone).toBe("graveyard");
      expect(whyNotPlayLand(game, A, "Forest")).not.toBeNull();
    });

    it("adds to another extra-land effect — Exploration as well makes three", () => {
      const { game } = makeGame({ aHand: ["Forest", "Forest", "Forest", "Forest"] });
      game.debugSpawn(AESI, A, "battlefield");
      game.debugSpawn("Exploration", A, "battlefield");

      for (let i = 0; i < 3; i += 1) {
        expect(whyNotPlayLand(game, A, "Forest")).toBeNull();
        playLand(game, A, "Forest");
      }
      expect(count(game, "Forest")).toBe(3);
      expect(whyNotPlayLand(game, A, "Forest")).not.toBeNull();
    });

    it("is its controller's alone — the opponent still gets one land on their turn", () => {
      const { game } = makeGame({ bHand: ["Mountain", "Mountain"] });
      game.debugSpawn(AESI, A, "battlefield");
      game.advanceUntil(
        (s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B,
      );

      playLand(game, B, "Mountain");
      expect(whyNotPlayLand(game, B, "Mountain")).not.toBeNull();
    });

    it("comes back each turn — two lands again on Aesi's controller's next turn", () => {
      const { game } = makeGame({ aHand: ["Forest", "Forest", "Forest", "Forest"] });
      game.debugSpawn(AESI, A, "battlefield");
      playLand(game, A, "Forest");
      playLand(game, A, "Forest");
      game.advanceUntil(
        (s) => s.turn.number === 3 && s.turn.step === "precombat-main" && s.priority.holder === A,
      );

      playLand(game, A, "Forest");
      expect(whyNotPlayLand(game, A, "Forest")).toBeNull();
      playLand(game, A, "Forest");
      expect(count(game, "Forest")).toBe(4);
    });
  });

  describe("Landfall — whenever a land you control enters, you may draw a card", () => {
    it("asks Aesi's controller, and accepting draws exactly one card", () => {
      const { game, prompts } = makeGame({ aHand: ["Forest"] });
      const aesi = game.debugSpawn(AESI, A, "battlefield");
      const library = game.libraryOf(A).length;
      const hand = game.handOf(A).length;

      const forest = inHand(game, A, "Forest");
      game.dispatch({ type: "play-land", player: A, card: forest });
      // The trigger uses the stack (rule 603.3): it's there before anyone
      // has answered anything.
      expect(game.state.zones.shared.stack).toHaveLength(1);
      const trigger = game.state.objects[game.state.zones.shared.stack[0]];
      expect(trigger.kind).toBe("ability");
      expect(trigger.sourceObjectId).toBe(aesi);
      game.advanceUntil(settled);

      expect(prompts).toEqual([{ player: A, source: aesi, modes: ["Draw a card?"] }]);
      expect(game.libraryOf(A).length).toBe(library - 1);
      // One card left the hand as a land, one came in from the draw.
      expect(game.handOf(A).length).toBe(hand);
    });

    it("declining draws nothing", () => {
      const { game, prompts } = makeGame({ aHand: ["Forest"], draw: false });
      game.debugSpawn(AESI, A, "battlefield");
      const library = game.libraryOf(A).length;
      const hand = game.handOf(A).length;

      playLand(game, A, "Forest");

      expect(prompts).toHaveLength(1);
      expect(game.libraryOf(A).length).toBe(library);
      expect(game.handOf(A).length).toBe(hand - 1);
    });

    it("triggers once per land — both of the turn's land drops draw", () => {
      const { game, prompts } = makeGame({ aHand: ["Forest", "Island"] });
      game.debugSpawn(AESI, A, "battlefield");
      const library = game.libraryOf(A).length;

      playLand(game, A, "Forest");
      playLand(game, A, "Island");

      expect(prompts).toHaveLength(2);
      expect(game.libraryOf(A).length).toBe(library - 2);
    });

    it("triggers on a land a spell puts onto the battlefield, not only a played one", () => {
      const { game, prompts } = makeGame({ aHand: ["Rampant Growth"] });
      game.debugSpawn(AESI, A, "battlefield");
      untappedLands(game, A, "Forest", 2);
      const library = game.libraryOf(A).length;

      game.dispatch({
        type: "cast-spell",
        player: A,
        card: inHand(game, A, "Rampant Growth"),
        targets: [],
      });
      game.advanceUntil(settled);

      // Rampant Growth fetched an Island (the library is all Islands), tapped.
      expect(count(game, "Island")).toBe(1);
      expect(prompts).toHaveLength(1);
      // One card searched out onto the battlefield, one drawn by Aesi.
      expect(game.libraryOf(A).length).toBe(library - 2);
      // A land put onto the battlefield isn't a land *played* — the drop
      // is still unused (rule 305.4).
      expect(game.state.players[A].landsPlayedThisTurn).toBe(0);
    });

    it("triggers on a land entering on an opponent's turn too", () => {
      const { game, prompts } = makeGame();
      game.debugSpawn(AESI, A, "battlefield");
      game.advanceUntil(
        (s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B,
      );
      const library = game.libraryOf(A).length;

      game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
      game.advanceUntil(settled);

      expect(prompts).toHaveLength(1);
      expect(game.libraryOf(A).length).toBe(library - 1);
    });

    it("ignores a land entering under an opponent's control", () => {
      const { game, prompts } = makeGame({ bHand: ["Mountain"] });
      game.debugSpawn(AESI, A, "battlefield");
      game.advanceUntil(
        (s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B,
      );
      const library = game.libraryOf(A).length;

      playLand(game, B, "Mountain");

      expect(prompts).toHaveLength(0);
      expect(game.libraryOf(A).length).toBe(library);
    });

    it("ignores a nonland permanent entering", () => {
      const { game, prompts } = makeGame();
      game.debugSpawn(AESI, A, "battlefield");

      game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
      game.advanceUntil(settled);

      expect(prompts).toHaveLength(0);
    });

    it("ignores a permanent already on the battlefield becoming a land", () => {
      const { game, prompts } = makeGame();
      game.debugSpawn(AESI, A, "battlefield");
      const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");

      game.debugApplyEffect(
        A,
        {
          kind: "animate",
          target: 0,
          power: 2,
          toughness: 2,
          addTypes: ["land"],
          addSubtypes: [],
          duration: "end-of-turn",
        },
        [{ kind: "object", object: bears }],
      );
      game.advanceUntil(settled);

      expect(game.characteristics(bears).types).toContain("land");
      expect(prompts).toHaveLength(0);
    });

    it("does nothing while Aesi isn't on the battlefield", () => {
      const { game, prompts } = makeGame({ aHand: [AESI, "Forest"] });
      playLand(game, A, "Forest");
      expect(prompts).toHaveLength(0);
    });
  });

  it("played for real: cast from hand after the turn's land, then a second land draws", () => {
    const { game, prompts } = makeGame({ aHand: [AESI, "Forest", "Island"] });
    // Five lands already out, spawned silently so none of them is a land drop.
    untappedLands(game, A, "Forest", 3);
    untappedLands(game, A, "Island", 2);

    playLand(game, A, "Forest"); // the turn's one ordinary land drop
    expect(whyNotPlayLand(game, A, "Island")).not.toBeNull();

    const aesi = inHand(game, A, AESI);
    game.dispatch({ type: "cast-spell", player: A, card: aesi, targets: [] });
    game.advanceUntil(settled);
    expect(game.state.objects[aesi].zone).toBe("battlefield");
    expect(prompts).toHaveLength(0); // it arrived after that land

    const library = game.libraryOf(A).length;
    expect(whyNotPlayLand(game, A, "Island")).toBeNull();
    playLand(game, A, "Island");
    expect(prompts).toHaveLength(1);
    expect(game.libraryOf(A).length).toBe(library - 1);
  });
});
