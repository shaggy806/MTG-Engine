/**
 * Chulane, Teller of Tales — every printed clause driven through a real `Game`.
 *
 * - "Vigilance" — on `keywords`, checked with the rest of the stat block.
 * - "Whenever you cast a creature spell, draw a card, then you may put a land
 *   card from your hand onto the battlefield." The trigger goes on the stack
 *   above the spell that caused it and so resolves first (the 2019-10-04
 *   ruling); the draw happens *before* the land choice, so the card just drawn
 *   is one of the ones you may put down; the land is **put** onto the
 *   battlefield rather than played, so it costs no land drop and works on
 *   anyone's turn (the second 2019-10-04 ruling); and the whole second half is
 *   a "may".
 *   The negatives matter as much: a noncreature spell, an opponent's creature
 *   spell, and — rule 113.6 — Chulane's *own* cast all do nothing.
 * - "{3}, {T}: Return target creature you control to its owner's hand." Costs
 *   three mana and taps Chulane, reaches only creatures its controller
 *   controls (including Chulane itself — the printed ability says no
 *   "another"), and returns the creature to its **owner's** hand, which is a
 *   different seat from the controller's once control has changed.
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
const CHULANE = "Chulane, Teller of Tales";
const registry = createDefaultRegistry();

interface Setup {
  /** The front of A's deck — the first seven cards are A's opening hand, the
   * eighth is the turn-1 draw, and the rest is the library. */
  readonly aFront?: readonly string[];
  readonly bFront?: readonly string[];
  /** What A's library is padded with. */
  readonly fill?: string;
}

const mkGame = ({ aFront = [], bFront = [], fill = "Forest" }: Setup = {}) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    // The real one-land-a-turn rule, so nothing below can pass because land
    // drops were unlimited.
    rules: { skipFirstDraw: false, maxLandsPerTurn: 1, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aFront, ...Array<string>(50).fill(fill)] },
      { player: B, cards: [...bFront, ...Array<string>(50).fill("Island")] },
    ],
  });
  game.advanceUntil(
    (s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  return { game, a, b };
};

/** Nothing left on the stack, pending, or waiting on an answer. */
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const nameOf = (game: Game, id: ObjectId): string => game.state.objects[id].cardName;

const isLand = (game: Game, id: ObjectId): boolean =>
  game.registry.get(nameOf(game, id)).types.includes("land");

const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => nameOf(game, each) === name);
  if (id === undefined) throw new Error(`${player} has no ${name} in hand`);
  return id;
};

const landsOut = (game: Game, player: PlayerId): number =>
  game.battlefield.filter(
    (id) => game.state.objects[id].controller === player && isLand(game, id),
  ).length;

const tappedLands = (game: Game, player: PlayerId): number =>
  game.battlefield.filter(
    (id) =>
      game.state.objects[id].controller === player &&
      isLand(game, id) &&
      game.state.objects[id].tapped,
  ).length;

const spawnLands = (game: Game, player: PlayerId, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, player, "battlefield");
};

/** Every `look-and-choose` offer Chulane's trigger made, and what was taken. */
const watchChoices = (
  a: ScriptedController,
  pick: (eligible: readonly ObjectId[]) => readonly ObjectId[],
): (readonly ObjectId[])[] => {
  const offers: (readonly ObjectId[])[] = [];
  a.chooseFromZoneFn = (_view, eligible) => {
    offers.push(eligible);
    return pick(eligible);
  };
  return offers;
};

const takeFirst = (eligible: readonly ObjectId[]): readonly ObjectId[] => eligible.slice(0, 1);
const takeNone = (): readonly ObjectId[] => [];

const cast = (game: Game, player: PlayerId, name: string): ObjectId => {
  const card = inHand(game, player, name);
  game.dispatch({ type: "cast-spell", player, card, targets: [] });
  return card;
};

describe("Chulane, Teller of Tales", () => {
  it("is a 2/4 legendary Human Druid with vigilance for {2}{G}{W}{U}", () => {
    const def = registry.get(CHULANE);
    expect(def.manaCost).toBe("{2}{G}{W}{U}");
    expect(def.colors).toEqual(["G", "W", "U"]);
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.types).toEqual(["creature"]);
    expect(def.subtypes).toEqual(["Human", "Druid"]);
    expect([def.power, def.toughness]).toEqual([2, 4]);
    expect(def.keywords).toEqual(["vigilance"]);
    expect(identityString(colorIdentityOf(def))).toBe("WUG"); // WUBRG order
    expect(def.triggered).toHaveLength(1);
    expect(def.activated).toHaveLength(1);
  });

  describe("Whenever you cast a creature spell, draw a card, then you may put a land down", () => {
    it("goes on the stack above the creature spell and resolves first", () => {
      const { game, a } = mkGame({ aFront: ["Grizzly Bears"] });
      const chulane = game.debugSpawn(CHULANE, A, "battlefield");
      spawnLands(game, A, "Forest", 2);
      watchChoices(a, takeNone);

      const bears = cast(game, A, "Grizzly Bears");

      const stack = game.state.zones.shared.stack;
      expect(stack).toHaveLength(2);
      expect(stack[0]).toBe(bears); // bottom — cast first
      const trigger = game.state.objects[stack[1]];
      expect(trigger.kind).toBe("ability");
      expect(trigger.sourceObjectId).toBe(chulane);
    });

    it("draws a card and puts a land from hand onto the battlefield", () => {
      const { game, a } = mkGame({ aFront: ["Grizzly Bears"] });
      game.debugSpawn(CHULANE, A, "battlefield");
      spawnLands(game, A, "Forest", 2);
      const library = game.libraryOf(A).length;
      const before = landsOut(game, A);
      const offers = watchChoices(a, takeFirst);

      cast(game, A, "Grizzly Bears");
      game.advanceUntil(quiet);

      expect(offers).toHaveLength(1);
      expect(game.libraryOf(A).length).toBe(library - 1);
      expect(landsOut(game, A)).toBe(before + 1);
      // Put onto the battlefield, not played — the drop is untouched, and the
      // land arrives untapped (nothing on the card says otherwise).
      expect(game.state.players[A].landsPlayedThisTurn).toBe(0);
      const put = offers[0][0];
      expect(game.state.objects[put].zone).toBe("battlefield");
      expect(game.state.objects[put].tapped).toBe(false);
    });

    it("offers only land cards — a creature card in hand is never eligible", () => {
      const { game, a } = mkGame({ aFront: ["Grizzly Bears"] });
      game.debugSpawn(CHULANE, A, "battlefield");
      spawnLands(game, A, "Forest", 2);
      const wurm = game.debugSpawn("Craw Wurm", A, "hand");
      const offers = watchChoices(a, takeNone);

      cast(game, A, "Grizzly Bears");
      game.advanceUntil(quiet);

      expect(offers[0].length).toBeGreaterThan(0);
      expect(offers[0].every((id) => isLand(game, id))).toBe(true);
      expect(offers[0]).not.toContain(wurm);
      expect(game.state.objects[wurm].zone).toBe("hand");
    });

    it("draws *then* offers — the card just drawn is the land you may put down", () => {
      // An opening hand (and turn-1 draw) of nothing but creatures, over a
      // library of Forests: the only land A can possibly have is the one
      // Chulane's own draw hands them.
      const { game, a } = mkGame({ aFront: Array<string>(8).fill("Grizzly Bears") });
      game.debugSpawn(CHULANE, A, "battlefield");
      spawnLands(game, A, "Forest", 2);
      expect(game.handOf(A).some((id) => isLand(game, id))).toBe(false);
      const offers = watchChoices(a, takeFirst);

      cast(game, A, "Grizzly Bears");
      game.advanceUntil(quiet);

      expect(offers).toHaveLength(1);
      expect(offers[0]).toHaveLength(1);
      const drawn = offers[0][0];
      expect(nameOf(game, drawn)).toBe("Forest");
      expect(game.state.objects[drawn].zone).toBe("battlefield");
    });

    it("is a 'may' — declining puts no land down and leaves the hand alone", () => {
      const { game, a } = mkGame({ aFront: ["Grizzly Bears"] });
      game.debugSpawn(CHULANE, A, "battlefield");
      spawnLands(game, A, "Forest", 2);
      const library = game.libraryOf(A).length;
      const before = landsOut(game, A);
      const hand = game.handOf(A).length;
      const offers = watchChoices(a, takeNone);

      cast(game, A, "Grizzly Bears");
      game.advanceUntil(quiet);

      expect(offers).toHaveLength(1);
      // The draw still happened — only the land half is optional.
      expect(game.libraryOf(A).length).toBe(library - 1);
      expect(landsOut(game, A)).toBe(before);
      // One card left as the Bears cast, one came in from the draw.
      expect(game.handOf(A).length).toBe(hand);
    });

    it("still puts a land down after the turn's land drop is already spent", () => {
      const { game, a } = mkGame({ aFront: ["Grizzly Bears"] });
      game.debugSpawn(CHULANE, A, "battlefield");
      spawnLands(game, A, "Forest", 2);
      game.dispatch({ type: "play-land", player: A, card: inHand(game, A, "Forest") });
      game.advanceUntil(quiet);
      expect(game.state.players[A].landsPlayedThisTurn).toBe(1);
      const before = landsOut(game, A);
      watchChoices(a, takeFirst);

      cast(game, A, "Grizzly Bears");
      game.advanceUntil(quiet);

      expect(landsOut(game, A)).toBe(before + 1);
      expect(game.state.players[A].landsPlayedThisTurn).toBe(1);
    });

    it("works on an opponent's turn, off a creature spell cast with flash", () => {
      const { game, a } = mkGame({ aFront: ["Ambush Viper"] });
      game.debugSpawn(CHULANE, A, "battlefield");
      spawnLands(game, A, "Forest", 2);
      game.advanceUntil(
        (s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === A,
      );
      const library = game.libraryOf(A).length;
      const before = landsOut(game, A);
      const offers = watchChoices(a, takeFirst);

      cast(game, A, "Ambush Viper");
      game.advanceUntil(quiet);

      expect(offers).toHaveLength(1);
      expect(game.libraryOf(A).length).toBe(library - 1);
      expect(landsOut(game, A)).toBe(before + 1);
      expect(game.state.players[A].landsPlayedThisTurn).toBe(0);
    });

    it("does not trigger on a noncreature spell", () => {
      const { game, a } = mkGame({ aFront: ["Sol Ring"] });
      game.debugSpawn(CHULANE, A, "battlefield");
      spawnLands(game, A, "Forest", 1);
      const library = game.libraryOf(A).length;
      const before = landsOut(game, A);
      const offers = watchChoices(a, takeFirst);

      cast(game, A, "Sol Ring");
      game.advanceUntil(quiet);

      expect(offers).toHaveLength(0);
      expect(game.libraryOf(A).length).toBe(library);
      expect(landsOut(game, A)).toBe(before);
    });

    it("does not trigger on an opponent's creature spell", () => {
      const { game, a } = mkGame({ bFront: ["Grizzly Bears"] });
      game.debugSpawn(CHULANE, A, "battlefield");
      spawnLands(game, B, "Forest", 2);
      game.advanceUntil(
        (s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B,
      );
      const library = game.libraryOf(A).length;
      const before = landsOut(game, A);
      const offers = watchChoices(a, takeFirst);

      cast(game, B, "Grizzly Bears");
      game.advanceUntil(quiet);

      expect(offers).toHaveLength(0);
      expect(game.libraryOf(A).length).toBe(library);
      expect(landsOut(game, A)).toBe(before);
    });

    it("does not trigger on its own cast — the ability only works from the battlefield", () => {
      // Rule 113.6. The spell a `spell-cast` event is about joins the trigger
      // scan carrying all of its abilities, so without the `otherOnly` guard a
      // Chulane on the stack would draw off casting itself.
      const { game, a } = mkGame({ aFront: [CHULANE] });
      spawnLands(game, A, "Forest", 3);
      spawnLands(game, A, "Plains", 1);
      spawnLands(game, A, "Island", 1);
      const library = game.libraryOf(A).length;
      const before = landsOut(game, A);
      const offers = watchChoices(a, takeFirst);

      const chulane = cast(game, A, CHULANE);
      game.advanceUntil(quiet);

      expect(game.state.objects[chulane].zone).toBe("battlefield");
      expect(offers).toHaveLength(0);
      expect(game.libraryOf(A).length).toBe(library);
      expect(landsOut(game, A)).toBe(before);
    });

    it("does nothing while Chulane is only in hand", () => {
      const { game, a } = mkGame({ aFront: ["Grizzly Bears", CHULANE] });
      spawnLands(game, A, "Forest", 2);
      const library = game.libraryOf(A).length;
      const offers = watchChoices(a, takeFirst);

      cast(game, A, "Grizzly Bears");
      game.advanceUntil(quiet);

      expect(offers).toHaveLength(0);
      expect(game.libraryOf(A).length).toBe(library);
    });
  });

  describe("{3}, {T}: Return target creature you control to its owner's hand", () => {
    /** A board where Chulane can actually use the ability: not summoning sick,
     * three untapped Forests, and a Grizzly Bears of A's own to bounce. */
    const board = () => {
      const { game, a } = mkGame();
      const chulane = game.debugSpawn(CHULANE, A, "battlefield", { summoningSick: false });
      spawnLands(game, A, "Forest", 3);
      const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
      return { game, a, chulane, bears };
    };

    const activate = (game: Game, chulane: ObjectId, target: ObjectId): void => {
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: chulane,
        abilityIndex: 0,
        targets: [{ kind: "object", object: target }],
      });
      game.advanceUntil(quiet);
    };

    it("returns the creature to hand, tapping Chulane and paying {3}", () => {
      const { game, chulane, bears } = board();
      expect(tappedLands(game, A)).toBe(0);

      activate(game, chulane, bears);

      expect(game.state.objects[bears].zone).toBe("hand");
      expect(game.handOf(A)).toContain(bears);
      expect(game.state.objects[chulane].tapped).toBe(true);
      expect(tappedLands(game, A)).toBe(3);
    });

    it("may target Chulane itself — the printed ability says no 'another'", () => {
      const { game, chulane } = board();

      activate(game, chulane, chulane);

      expect(game.state.objects[chulane].zone).toBe("hand");
      expect(game.handOf(A)).toContain(chulane);
    });

    it("returns the creature to its *owner's* hand, not its controller's", () => {
      const { game, chulane } = board();
      const stolen = game.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false });
      game.debugApplyEffect(A, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [
        { kind: "object", object: stolen },
      ]);
      game.advanceUntil(quiet);
      expect(game.state.objects[stolen].controller).toBe(A);

      activate(game, chulane, stolen);

      expect(game.state.objects[stolen].zone).toBe("hand");
      expect(game.handOf(B)).toContain(stolen);
      expect(game.handOf(A)).not.toContain(stolen);
    });

    it("cannot target a creature an opponent controls", () => {
      const { game, chulane, bears } = board();
      const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");

      // `canDispatch` doesn't inspect an activated ability's targets at all —
      // the slot's options come off `legalActions`, and `dispatch` re-checks.
      const offered = game
        .legalActions(A)
        .filter((la) => la.kind === "activate-ability" && la.source === chulane);
      expect(offered).toHaveLength(1);
      const options = offered[0].kind === "activate-ability" ? offered[0].targetOptions[0] : [];
      expect(options).toContainEqual({ kind: "object", object: bears });
      expect(options).not.toContainEqual({ kind: "object", object: theirs });

      expect(() =>
        game.dispatch({
          type: "activate-ability",
          player: A,
          source: chulane,
          abilityIndex: 0,
          targets: [{ kind: "object", object: theirs }],
        }),
      ).toThrow();
      expect(game.state.objects[theirs].zone).toBe("battlefield");
    });

    it("cannot be activated without three mana", () => {
      const { game } = mkGame();
      const chulane = game.debugSpawn(CHULANE, A, "battlefield", { summoningSick: false });
      spawnLands(game, A, "Forest", 2);
      const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });

      expect(
        game.canDispatch({
          type: "activate-ability",
          player: A,
          source: chulane,
          abilityIndex: 0,
          targets: [{ kind: "object", object: bears }],
        }),
      ).not.toBeNull();
      expect(game.state.objects[bears].zone).toBe("battlefield");
    });

    it("cannot be activated while Chulane is summoning sick", () => {
      const { game } = mkGame();
      const chulane = game.debugSpawn(CHULANE, A, "battlefield");
      spawnLands(game, A, "Forest", 3);
      const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
      expect(game.state.objects[chulane].summoningSick).toBe(true);

      expect(
        game.canDispatch({
          type: "activate-ability",
          player: A,
          source: chulane,
          abilityIndex: 0,
          targets: [{ kind: "object", object: bears }],
        }),
      ).not.toBeNull();
    });
  });
});
