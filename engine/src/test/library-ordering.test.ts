/**
 * Library ordering (rule 401.4: the owner arranges cards put into a library
 * at the same time): a scry's or surveil's kept cards go back on top "in any
 * order", a scry's bottomed cards go to the bottom in any order (rules
 * 701.22a, 701.25a), a `look-and-choose`'s `"bottom-any-order"` leftover
 * ("the rest on the bottom of your library in any order"), and its
 * `"library-bottom"` destination, picked in order. Each order is a
 * `choose-from-zone` whose picks are the order (`order: true`), asked only
 * when there's something to choose between.
 */
import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: true, maxLandsPerTurn: 99, maxHandSize: 99, openingHandSize: 0 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
/** Put `names` on top of `player`'s library, the first on top; their ids in
 * that order. */
const onTop = (game: Game, names: readonly string[], player: PlayerId = A): ObjectId[] =>
  [...names]
    .reverse()
    .map((name) => game.debugSpawn(name, player, "library"))
    .reverse();
const library = (game: Game, player: PlayerId = A): readonly ObjectId[] => game.state.zones.perPlayer[player].library;
const hand = (game: Game, player: PlayerId = A): readonly ObjectId[] => game.state.zones.perPlayer[player].hand;
type ZoneOffer = Extract<LegalAction, { kind: "choose-from-zone" }>;
const zoneOffer = (game: Game, player: PlayerId = A): ZoneOffer | undefined =>
  game.legalActions(player).find((a): a is ZoneOffer => a.kind === "choose-from-zone");
const choose = (game: Game, chosen: readonly ObjectId[], player: PlayerId = A): void => {
  game.dispatch({ type: "choose-from-zone", player, chosen: [...chosen] });
};
const castFromHand = (game: Game, name: string, player: PlayerId = A): void => {
  const card = game.debugSpawn(name, player, "hand");
  game.dispatch({ type: "cast-spell", player, card });
};

describe("scry: the kept cards in any order, and the bottomed ones", () => {
  it("asks the order of two kept cards, and Preordain draws the one put on top", () => {
    const game = setUp();
    spawn(game, "Island");
    const [bears, giant] = onTop(game, ["Grizzly Bears", "Hill Giant"]);
    castFromHand(game, "Preordain");
    game.advanceUntil((s) => s.awaiting?.kind === "scry");
    game.dispatch({ type: "scry", player: A, away: [] });
    const offer = zoneOffer(game);
    expect(offer?.order).toBe(true);
    expect(offer?.destination).toBe("library-top");
    expect([...(offer?.ids ?? [])].sort()).toEqual([bears, giant].sort());
    expect(offer?.min).toBe(2);
    expect(offer?.max).toBe(2);
    // The draw waits for the order.
    expect(hand(game)).not.toContain(bears);
    expect(hand(game)).not.toContain(giant);
    // Both or nothing: an order names every card.
    expect(() => choose(game, [giant])).toThrow();
    choose(game, [giant, bears]);
    game.advanceUntil(quiet);
    expect(hand(game)).toContain(giant);
    expect(library(game)[0]).toBe(bears);
  });

  it("orders cards scried to the bottom, the last picked lowest", () => {
    const game = setUp();
    spawn(game, "Island");
    const [bears, giant] = onTop(game, ["Grizzly Bears", "Hill Giant"]);
    castFromHand(game, "Preordain");
    game.advanceUntil((s) => s.awaiting?.kind === "scry");
    game.dispatch({ type: "scry", player: A, away: [bears, giant] });
    const offer = zoneOffer(game);
    expect(offer?.order).toBe(true);
    expect(offer?.destination).toBe("library-bottom");
    choose(game, [giant, bears]);
    game.advanceUntil(quiet);
    const lib = library(game);
    expect(lib.slice(-2)).toEqual([giant, bears]);
    expect(hand(game)).not.toContain(bears);
    expect(hand(game)).not.toContain(giant);
  });

  it("asks nothing for one card each way, or for copies of one card", () => {
    const game = setUp();
    spawn(game, "Island");
    spawn(game, "Island");
    const [bears, giant] = onTop(game, ["Grizzly Bears", "Hill Giant"]);
    castFromHand(game, "Preordain");
    game.advanceUntil((s) => s.awaiting?.kind === "scry");
    game.dispatch({ type: "scry", player: A, away: [giant] });
    // No order to ask: the draw happened.
    expect(game.state.awaiting).toBeNull();
    expect(hand(game)).toContain(bears);
    expect(library(game).at(-1)).toBe(giant);

    const [first, second] = onTop(game, ["Grizzly Bears", "Grizzly Bears"]);
    castFromHand(game, "Preordain");
    game.advanceUntil((s) => s.awaiting?.kind === "scry");
    game.dispatch({ type: "scry", player: A, away: [] });
    expect(game.state.awaiting).toBeNull();
    expect(hand(game)).toContain(first);
    expect(library(game)[0]).toBe(second);
  });

  it("orders the cards kept on top, then the cards put on the bottom", () => {
    const game = setUp();
    const [a, b, c, d] = onTop(game, ["Grizzly Bears", "Hill Giant", "Craw Wurm", "Llanowar Elves"]);
    game.debugApplyEffect(A, { kind: "scry", amount: 4 });
    game.dispatch({ type: "scry", player: A, away: [c, d] });
    expect(zoneOffer(game)?.destination).toBe("library-top");
    choose(game, [b, a]);
    const second = zoneOffer(game);
    expect(second?.destination).toBe("library-bottom");
    expect([...(second?.ids ?? [])].sort()).toEqual([c, d].sort());
    choose(game, [d, c]);
    expect(game.state.awaiting).toBeNull();
    const lib = library(game);
    expect(lib.slice(0, 2)).toEqual([b, a]);
    expect(lib.slice(-2)).toEqual([d, c]);
  });

  it("orders a surveil's kept cards; the rest go to the graveyard", () => {
    const game = setUp();
    const [a, b, c] = onTop(game, ["Grizzly Bears", "Hill Giant", "Craw Wurm"]);
    game.debugApplyEffect(A, { kind: "surveil", amount: 3 });
    game.dispatch({ type: "scry", player: A, away: [b] });
    expect(game.state.objects[b].zone).toBe("graveyard");
    const offer = zoneOffer(game);
    expect(offer?.destination).toBe("library-top");
    choose(game, [c, a]);
    expect(library(game).slice(0, 2)).toEqual([c, a]);
  });
});

describe("look-and-choose: the rest on the bottom in any order", () => {
  it("Stock Up: two into hand, then the other three in the order picked", () => {
    const game = setUp();
    spawn(game, "Island");
    spawn(game, "Island");
    spawn(game, "Island");
    const [a, b, c, d, e] = onTop(game, ["Grizzly Bears", "Hill Giant", "Craw Wurm", "Llanowar Elves", "Wastes"]);
    castFromHand(game, "Stock Up");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    expect(zoneOffer(game)?.order).toBeUndefined();
    choose(game, [a, b]);
    expect(hand(game)).toEqual(expect.arrayContaining([a, b]));
    const offer = zoneOffer(game);
    expect(offer?.order).toBe(true);
    expect(offer?.destination).toBe("library-bottom");
    expect([...(offer?.ids ?? [])].sort()).toEqual([c, d, e].sort());
    // Only the cards taken are "chosen"; ordering the rest takes nothing.
    const chosenEvents = (): number =>
      game.state.eventLog.filter((event) => event.type === "cards-chosen-from-zone").length;
    const before = chosenEvents();
    choose(game, [e, c, d]);
    expect(chosenEvents()).toBe(before);
    game.advanceUntil(quiet);
    expect(library(game).slice(-3)).toEqual([e, c, d]);
  });

  it("Experimental Augury: proliferates once the rest are ordered", () => {
    const game = setUp();
    spawn(game, "Island");
    spawn(game, "Island");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [
      { kind: "object", object: bears },
    ]);
    const [a, b, c] = onTop(game, ["Hill Giant", "Craw Wurm", "Llanowar Elves"]);
    castFromHand(game, "Experimental Augury");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    choose(game, [a]);
    expect(zoneOffer(game)?.order).toBe(true);
    choose(game, [c, b]);
    expect(game.state.awaiting?.kind).toBe("proliferate");
    game.dispatch({ type: "proliferate", player: A, chosen: [{ kind: "object", object: bears }] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(2);
    expect(library(game).slice(-2)).toEqual([c, b]);
  });

  it("asks nothing when one card is left over", () => {
    const game = setUp();
    const [a, b] = onTop(game, ["Hill Giant", "Craw Wurm"]);
    game.debugApplyEffect(A, {
      kind: "look-and-choose",
      zone: "library",
      count: 2,
      min: 1,
      max: 1,
      destination: "hand",
      leftover: "bottom-any-order",
    });
    choose(game, [a]);
    expect(game.state.awaiting).toBeNull();
    expect(library(game).at(-1)).toBe(b);
  });
});

describe("look-and-choose: cards from a hand to the bottom, in the order picked", () => {
  it("Valakut Awakening: draws that many plus one", () => {
    const game = setUp();
    spawn(game, "Mountain");
    spawn(game, "Mountain");
    spawn(game, "Mountain");
    const x = game.debugSpawn("Grizzly Bears", A, "hand");
    const y = game.debugSpawn("Hill Giant", A, "hand");
    const z = game.debugSpawn("Craw Wurm", A, "hand");
    castFromHand(game, "Valakut Awakening");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    const offer = zoneOffer(game);
    expect(offer?.destination).toBe("library-bottom");
    expect(offer?.min).toBe(0);
    expect(offer?.max).toBe(3);
    choose(game, [y, x]);
    game.advanceUntil(quiet);
    expect(library(game).slice(-2)).toEqual([y, x]);
    // Two put there: three drawn, beside the one kept.
    expect(hand(game)).toHaveLength(4);
    expect(hand(game)).toContain(z);
  });

  it("Valakut Awakening: putting none still draws one", () => {
    const game = setUp();
    spawn(game, "Mountain");
    spawn(game, "Mountain");
    spawn(game, "Mountain");
    game.debugSpawn("Grizzly Bears", A, "hand");
    castFromHand(game, "Valakut Awakening");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    choose(game, []);
    game.advanceUntil(quiet);
    expect(hand(game)).toHaveLength(2);
  });

  it("Teferi's Puzzle Box: the player whose draw step it is bottoms their hand in order and redraws", () => {
    const game = setUp();
    spawn(game, "Teferi's Puzzle Box");
    const p = game.debugSpawn("Grizzly Bears", B, "hand");
    const q = game.debugSpawn("Hill Giant", B, "hand");
    game.advanceUntil((s) => s.turnOrder[s.turn.activePlayerIndex] === B && s.awaiting?.kind === "choose-from-zone");
    expect(game.state.turn.step).toBe("draw");
    const offer = zoneOffer(game, B);
    // The step's own draw came first: three cards, every one of them.
    expect(offer?.ids).toHaveLength(3);
    expect(offer?.min).toBe(3);
    expect(offer?.destination).toBe("library-bottom");
    const drawn = (offer?.ids ?? []).find((id) => id !== p && id !== q) as ObjectId;
    choose(game, [q, drawn, p], B);
    game.advanceUntil(quiet);
    expect(library(game, B).slice(-3)).toEqual([q, drawn, p]);
    expect(hand(game, B)).toHaveLength(3);
    expect(hand(game, B)).not.toContain(p);
  });

  it("Teferi's Puzzle Box: two of them trigger separately (its ruling)", () => {
    const game = setUp();
    spawn(game, "Teferi's Puzzle Box");
    spawn(game, "Teferi's Puzzle Box");
    game.debugSpawn("Grizzly Bears", B, "hand");
    game.debugSpawn("Hill Giant", B, "hand");
    game.advanceUntil((s) => s.turnOrder[s.turn.activePlayerIndex] === B && s.awaiting?.kind === "choose-from-zone");
    let asked = 0;
    for (let offer = zoneOffer(game, B); offer !== undefined && asked < 5; offer = zoneOffer(game, B)) {
      asked += 1;
      choose(game, offer.ids, B);
      game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || quiet(s));
    }
    expect(asked).toBe(2);
    expect(hand(game, B)).toHaveLength(3);
  });
});

describe("a commander put from its owner's hand into their library (rule 903.9b)", () => {
  /** A card in `player`'s hand that is their commander. */
  const commanderInHand = (game: Game, name: string, player: PlayerId = A): ObjectId => {
    const id = game.debugSpawn(name, player, "hand");
    game.state.objects[id].isCommander = true;
    return id;
  };
  const answer = (game: Game, toCommandZone: boolean, player: PlayerId = A): void => {
    expect(game.state.awaiting?.kind).toBe("commander-replacement");
    expect(game.state.awaiting?.player).toBe(player);
    game.dispatch({ type: "commander-replacement", player, toCommandZone });
  };

  it("Valakut Awakening: to the command zone instead, which isn't put on the bottom", () => {
    const game = setUp();
    ["Mountain", "Mountain", "Mountain"].forEach((name) => spawn(game, name));
    const general = commanderInHand(game, "Grizzly Bears");
    const giant = game.debugSpawn("Hill Giant", A, "hand");
    castFromHand(game, "Valakut Awakening");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    choose(game, [giant, general]);
    // Asked before anything moves.
    expect(game.state.objects[giant].zone).toBe("hand");
    answer(game, true);
    game.advanceUntil(quiet);
    expect(game.state.objects[general].zone).toBe("command");
    expect(library(game).at(-1)).toBe(giant);
    // One card put on the bottom: two drawn.
    expect(hand(game)).toHaveLength(2);
  });

  it("Valakut Awakening: kept for the library, it goes where it was picked and counts", () => {
    const game = setUp();
    ["Mountain", "Mountain", "Mountain"].forEach((name) => spawn(game, name));
    const general = commanderInHand(game, "Grizzly Bears");
    const giant = game.debugSpawn("Hill Giant", A, "hand");
    castFromHand(game, "Valakut Awakening");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    choose(game, [general, giant]);
    answer(game, false);
    game.advanceUntil(quiet);
    expect(library(game).slice(-2)).toEqual([general, giant]);
    expect(hand(game)).toHaveLength(3);
  });

  it("Teferi's Puzzle Box: the whole hand, the commander offered the command zone", () => {
    const game = setUp();
    spawn(game, "Teferi's Puzzle Box");
    const general = commanderInHand(game, "Grizzly Bears", B);
    game.debugSpawn("Hill Giant", B, "hand");
    game.advanceUntil((s) => s.turnOrder[s.turn.activePlayerIndex] === B && s.awaiting?.kind === "choose-from-zone");
    choose(game, zoneOffer(game, B)?.ids ?? [], B);
    answer(game, true, B);
    game.advanceUntil(quiet);
    expect(game.state.objects[general].zone).toBe("command");
    // Three cards in hand (two and the step's draw), two of them put there.
    expect(hand(game, B)).toHaveLength(2);
  });

  it("Brainstorm: the commander put back on top where it was picked, or to the command zone", () => {
    for (const toCommandZone of [false, true]) {
      const game = setUp();
      spawn(game, "Island");
      const general = commanderInHand(game, "Grizzly Bears");
      const giant = game.debugSpawn("Hill Giant", A, "hand");
      castFromHand(game, "Brainstorm");
      game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
      choose(game, [giant, general]);
      answer(game, toCommandZone);
      game.advanceUntil(quiet);
      if (toCommandZone) {
        expect(game.state.objects[general].zone).toBe("command");
        expect(library(game)[0]).toBe(giant);
      } else {
        expect(library(game).slice(0, 2)).toEqual([giant, general]);
      }
    }
  });
});

describe("a commander put into a library from a graveyard (rule 903.9b: \"from anywhere\")", () => {
  it("Noxious Revival: asked first, then on top of the library or in the command zone", () => {
    for (const toCommandZone of [false, true]) {
      const game = setUp();
      spawn(game, "Forest");
      const general = game.debugSpawn("Grizzly Bears", A, "graveyard");
      game.state.objects[general].isCommander = true;
      const revival = game.debugSpawn("Noxious Revival", A, "hand");
      game.dispatch({ type: "cast-spell", player: A, card: revival, targets: [{ kind: "object", object: general }] });
      game.advanceUntil((s) => s.awaiting?.kind === "commander-replacement" || quiet(s));
      const awaiting = game.state.awaiting;
      expect(awaiting?.kind === "commander-replacement" && awaiting.intendedZone).toBe("library");
      // A replacement, so asked before it moves: it waits in the graveyard.
      expect(game.state.objects[general].zone).toBe("graveyard");
      game.dispatch({ type: "commander-replacement", player: A, toCommandZone });
      game.advanceUntil(quiet);
      if (toCommandZone) {
        expect(game.state.objects[general].zone).toBe("command");
      } else {
        // Declined, it goes where the spell put it: on top, not the bottom.
        expect(library(game)[0]).toBe(general);
      }
    }
  });
});
