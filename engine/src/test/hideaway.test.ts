/**
 * Hideaway N (rule 702.75a): "When this permanent enters, look at the top N
 * cards of your library. Exile one of them face down and put the rest on the
 * bottom of your library in a random order. The exiled card gains 'The
 * player who controls the permanent that exiled this card may look at this
 * card in the exile zone.'" — and the linked ability (rule 607.2a) that
 * plays "the exiled card" without paying its mana cost: a spell cast for
 * free, a land played with the turn's land play (rules 305.2a, 305.3).
 *
 * The lands: Mosswort Bridge, Spinerock Knoll, Windbrisk Heights, Shelldock
 * Isle, Howltooth Hollow; Watcher for Tomorrow; the SNC/DSC enchantments.
 */
import { describe, expect, it } from "vitest";

import type { Action, LegalAction } from "../actions.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

type CastNowOffer = Extract<LegalAction, { kind: "cast-now" }>;
type Answer = Extract<Action, { type: "cast-spell" }> | Extract<Action, { type: "play-land" }> | null;

/** Nothing left to place, resolve or answer — a silent `debugSpawn(…, {
 * announceEntry: true })`'s trigger waits in `pendingTriggers` until the next
 * priority check. */
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;

/**
 * Alice on her first main phase with `top` on top of her library (first
 * listed on top), and `land` in her hand to play. `hide` names the card the
 * hideaway choice takes.
 */
const setUp = (land: string, top: readonly string[], hide: string, opts: { maxLands?: number } = {}) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: opts.maxLands ?? 1, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array(40).fill("Plains") },
      { player: B, cards: Array(40).fill("Plains") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  const looked: ObjectId[] = [];
  const ids: Record<string, ObjectId> = {};
  for (const name of [...top].reverse()) ids[name] = game.debugSpawn(name, A, "library");
  a.chooseFromZoneFn = (_view, eligible) => {
    looked.push(...eligible);
    const pick = eligible.filter((id) => game.state.objects[id].cardName === hide).slice(0, 1);
    return pick.length > 0 ? pick : eligible.slice(0, 1);
  };
  const permanent = game.debugSpawn(land, A, "hand");
  return { game, a, b, ids, looked, permanent };
};

/** Play the hideaway land from hand and let its trigger resolve. */
const playIt = (game: Game, land: ObjectId): void => {
  game.dispatch({ type: "play-land", player: A, card: land });
  game.advanceUntil(settled);
};

/** Ready the land (it entered tapped) and give Alice the mana for its cost. */
const readyToActivate = (game: Game, land: ObjectId, basic: string): void => {
  game.state.objects[land].tapped = false;
  game.debugSpawn(basic, A, "battlefield");
};

const activate = (game: Game, land: ObjectId): void => {
  game.dispatch({ type: "activate-ability", player: A, source: land, abilityIndex: 1, targets: [] });
  game.advanceUntil(settled);
};

const FOUR = ["Grizzly Bears", "Lightning Bolt", "Forest", "Divination"];

describe("hideaway — the trigger (rule 702.75a)", () => {
  it("looks at the top four, exiles the chosen one face down linked to the land, the rest on the bottom", () => {
    const { game, ids, looked, permanent } = setUp("Mosswort Bridge", FOUR, "Lightning Bolt");
    playIt(game, permanent);
    expect(looked.map((id) => game.state.objects[id].cardName).sort()).toEqual([...FOUR].sort());
    const bolt = game.state.objects[ids["Lightning Bolt"]];
    expect(bolt.zone).toBe("exile");
    expect(bolt.exiledFaceDown?.lookers).toEqual([A]);
    expect(bolt.exiledWith).toEqual({
      source: permanent,
      zoneChangeCount: game.state.objects[permanent].zoneChangeCount ?? 0,
    });
    // The other three on the bottom; the land entered tapped (its own line,
    // 702.75b — hideaway itself no longer taps it).
    const library = game.state.zones.perPlayer[A].library;
    expect(library.slice(-3).sort()).toEqual([ids["Grizzly Bears"], ids["Forest"], ids["Divination"]].sort());
    expect(game.state.objects[permanent].tapped).toBe(true);
  });

  it("is hidden from the opponent and visible to its controller (rule 406.3)", () => {
    const { game, ids, permanent } = setUp("Mosswort Bridge", FOUR, "Lightning Bolt");
    playIt(game, permanent);
    const bolt = ids["Lightning Bolt"];
    expect(game.viewFor(B).objects[bolt]).toBeUndefined();
    expect(game.viewFor(B).zones.exile).toContain(bolt);
    expect(game.viewFor(A).objects[bolt]?.cardName).toBe("Lightning Bolt");
  });

  it("must exile one — the choice isn't optional", () => {
    const { game, a, ids, permanent } = setUp("Mosswort Bridge", FOUR, "Lightning Bolt");
    a.chooseFromZoneFn = (_view, _eligible, min) => {
      expect(min).toBe(1);
      return [ids["Divination"]];
    };
    playIt(game, permanent);
    expect(game.state.objects[ids["Divination"]].zone).toBe("exile");
  });

  it("a new controller of the land may look at the card, and the old one still may", () => {
    const { game, ids, permanent } = setUp("Mosswort Bridge", FOUR, "Lightning Bolt");
    playIt(game, permanent);
    game.debugApplyEffect(B, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [
      { kind: "object", object: permanent },
    ]);
    const bolt = ids["Lightning Bolt"];
    expect(game.state.objects[permanent].controller).toBe(B);
    expect(game.viewFor(B).objects[bolt]?.cardName).toBe("Lightning Bolt");
    expect(game.viewFor(A).objects[bolt]?.cardName).toBe("Lightning Bolt");
  });
});

describe("hideaway — playing the exiled card", () => {
  it("Mosswort Bridge does nothing while creatures you control have total power under 10", () => {
    const { game, a, ids, permanent } = setUp("Mosswort Bridge", FOUR, "Grizzly Bears");
    playIt(game, permanent);
    readyToActivate(game, permanent, "Forest");
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Grizzly Bears", A, "battlefield");
    let asked = false;
    a.chooseCastNowFn = () => {
      asked = true;
      return null;
    };
    activate(game, permanent);
    expect(asked).toBe(false);
    expect(game.state.objects[ids["Grizzly Bears"]].zone).toBe("exile");
  });

  it("at total power 10 casts it without paying its mana cost, ignoring timing", () => {
    const { game, a, ids, permanent } = setUp("Mosswort Bridge", FOUR, "Grizzly Bears");
    playIt(game, permanent);
    readyToActivate(game, permanent, "Forest");
    for (let i = 0; i < 5; i += 1) game.debugSpawn("Grizzly Bears", A, "battlefield");
    let offered: CastNowOffer | undefined;
    a.chooseCastNowFn = (_v, offer): Answer => {
      offered = offer;
      return { type: "cast-spell", player: A, card: offer.casts[0].card, targets: [], via: "effect", free: true };
    };
    activate(game, permanent);
    expect(offered?.free).toBe(true);
    expect(offered?.cards).toEqual([ids["Grizzly Bears"]]);
    // Only the Forest (spent on {G}) could have paid: the Bears were free.
    expect(game.state.objects[ids["Grizzly Bears"]].zone).toBe("battlefield");
    expect(game.state.objects[ids["Grizzly Bears"]].exiledFaceDown).toBeUndefined();
  });

  it("plays a land with the turn's land play (rules 305.2a, 305.3)", () => {
    const { game, a, ids, permanent } = setUp("Mosswort Bridge", FOUR, "Forest", { maxLands: 2 });
    playIt(game, permanent);
    readyToActivate(game, permanent, "Forest");
    for (let i = 0; i < 5; i += 1) game.debugSpawn("Grizzly Bears", A, "battlefield");
    let offered: CastNowOffer | undefined;
    a.chooseCastNowFn = (_v, offer): Answer => {
      offered = offer;
      return { type: "play-land", player: A, card: ids["Forest"] };
    };
    const played = game.state.players[A].landsPlayedThisTurn;
    activate(game, permanent);
    expect(offered?.casts).toEqual([]);
    expect(offered?.lands?.map((l) => l.card)).toEqual([ids["Forest"]]);
    expect(game.state.objects[ids["Forest"]].zone).toBe("battlefield");
    expect(game.state.players[A].landsPlayedThisTurn).toBe(played + 1);
  });

  it("doesn't offer the land once the turn's land play is used", () => {
    const { game, a, ids, permanent } = setUp("Mosswort Bridge", FOUR, "Forest");
    playIt(game, permanent);
    readyToActivate(game, permanent, "Forest");
    for (let i = 0; i < 5; i += 1) game.debugSpawn("Grizzly Bears", A, "battlefield");
    let asked = false;
    a.chooseCastNowFn = () => {
      asked = true;
      return null;
    };
    activate(game, permanent);
    expect(asked).toBe(false);
    expect(game.state.objects[ids["Forest"]].zone).toBe("exile");
  });

  it("doesn't offer the land on another player's turn", () => {
    const { game, a, ids, permanent } = setUp("Mosswort Bridge", FOUR, "Forest", { maxLands: 2 });
    playIt(game, permanent);
    for (let i = 0; i < 5; i += 1) game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    game.state.objects[permanent].tapped = false;
    for (const id of game.battlefield) if (game.state.objects[id].controller === A) game.state.objects[id].tapped = false;
    let asked = false;
    a.chooseCastNowFn = () => {
      asked = true;
      return null;
    };
    // Bob's turn: Alice has priority once Bob passes it in his main phase.
    game.advanceUntil((s) => s.turn.number === 2 && s.priority.holder === A);
    activate(game, permanent);
    expect(asked).toBe(false);
    expect(game.state.objects[ids["Forest"]].zone).toBe("exile");
  });

  it("reaches only the card this object exiled: back from a blink, the land's a new object (rule 400.7)", () => {
    const { game, a, ids, permanent } = setUp("Mosswort Bridge", FOUR, "Grizzly Bears");
    playIt(game, permanent);
    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [{ kind: "object", object: permanent }]);
    game.advanceUntil(settled);
    readyToActivate(game, permanent, "Forest");
    for (let i = 0; i < 5; i += 1) game.debugSpawn("Grizzly Bears", A, "battlefield");
    const offers: CastNowOffer[] = [];
    a.chooseCastNowFn = (_v, offer): Answer => {
      offers.push(offer);
      return null;
    };
    activate(game, permanent);
    // The new Bridge's own hideaway took a card of its own; the first one
    // isn't on offer.
    expect(offers.flatMap((o) => o.cards)).not.toContain(ids["Grizzly Bears"]);
    expect(game.state.objects[ids["Grizzly Bears"]].zone).toBe("exile");
  });
});

describe("hideaway — each card's condition", () => {
  it("Spinerock Knoll: an opponent dealt 7 or more damage this turn", () => {
    const { game, a, ids, permanent } = setUp("Spinerock Knoll", FOUR, "Grizzly Bears");
    playIt(game, permanent);
    readyToActivate(game, permanent, "Mountain");
    let asked = 0;
    a.chooseCastNowFn = () => {
      asked += 1;
      return null;
    };
    game.debugApplyEffect(A, { kind: "damage", amount: 6, target: 0 }, [{ kind: "player", player: B }]);
    activate(game, permanent);
    expect(asked).toBe(0);
    game.state.objects[permanent].tapped = false;
    game.debugSpawn("Mountain", A, "battlefield");
    game.debugApplyEffect(A, { kind: "damage", amount: 1, target: 0 }, [{ kind: "player", player: B }]);
    activate(game, permanent);
    expect(asked).toBe(1);
    expect(game.state.objects[ids["Grizzly Bears"]].zone).toBe("exile");
  });

  it("Windbrisk Heights: three different creatures declared as attackers this turn", () => {
    for (const [attackers, expected] of [
      [2, false],
      [3, true],
    ] as const) {
      const { game, a, permanent } = setUp("Windbrisk Heights", FOUR, "Grizzly Bears");
      playIt(game, permanent);
      const bears = Array.from({ length: attackers }, () =>
        game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false }),
      );
      a.declareAttackersFn = () => bears.map((attacker) => ({ attacker, defender: B }));
      game.advanceUntil((s) => s.turn.step === "postcombat-main" && settled(s));
      readyToActivate(game, permanent, "Plains");
      let asked = false;
      a.chooseCastNowFn = () => {
        asked = true;
        return null;
      };
      activate(game, permanent);
      expect(asked).toBe(expected);
    }
  });

  it("Shelldock Isle: a library with twenty or fewer cards — anyone's", () => {
    const { game, a, permanent } = setUp("Shelldock Isle", FOUR, "Grizzly Bears");
    playIt(game, permanent);
    readyToActivate(game, permanent, "Island");
    let asked = 0;
    a.chooseCastNowFn = () => {
      asked += 1;
      return null;
    };
    activate(game, permanent);
    expect(asked).toBe(0);
    // Bob mills down to 20.
    const bobLibrary = game.state.zones.perPlayer[B].library.length;
    game.debugApplyEffect(B, { kind: "mill", target: "you", amount: bobLibrary - 20 }, []);
    game.state.objects[permanent].tapped = false;
    game.debugSpawn("Island", A, "battlefield");
    activate(game, permanent);
    expect(asked).toBe(1);
  });

  it("Howltooth Hollow: each player has no cards in hand", () => {
    const { game, a, permanent } = setUp("Howltooth Hollow", FOUR, "Grizzly Bears");
    playIt(game, permanent);
    readyToActivate(game, permanent, "Swamp");
    let asked = 0;
    a.chooseCastNowFn = () => {
      asked += 1;
      return null;
    };
    game.debugApplyEffect(A, { kind: "discard-hand", who: "you" }, []);
    activate(game, permanent);
    expect(asked).toBe(0);
    game.debugApplyEffect(B, { kind: "discard-hand", who: "you" }, []);
    game.state.objects[permanent].tapped = false;
    game.debugSpawn("Swamp", A, "battlefield");
    activate(game, permanent);
    expect(asked).toBe(1);
  });

  it("Watcher for Tomorrow: the exiled card goes to its owner's hand as it leaves", () => {
    const { game, ids } = setUp("Mosswort Bridge", FOUR, "Lightning Bolt");
    const watcher = game.debugSpawn("Watcher for Tomorrow", A, "battlefield", { announceEntry: true });
    game.advanceUntil(settled);
    const bolt = ids["Lightning Bolt"];
    expect(game.state.objects[bolt].zone).toBe("exile");
    expect(game.state.objects[watcher].tapped).toBe(true);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: watcher }]);
    game.advanceUntil(settled);
    expect(game.state.objects[bolt].zone).toBe("hand");
    expect(game.handOf(A)).toContain(bolt);
  });

  it("Watcher for Tomorrow: gone before its hideaway resolves, the card stays exiled (the ruling)", () => {
    const { game, b, ids } = setUp("Mosswort Bridge", FOUR, "Lightning Bolt");
    game.debugSpawn("Mountain", B, "battlefield");
    const bolt = game.debugSpawn("Lightning Bolt", B, "hand");
    const watcher = game.debugSpawn("Watcher for Tomorrow", A, "battlefield", { announceEntry: true });
    // Bob bolts the Watcher in response to its hideaway trigger: its leaves
    // trigger resolves first and finds nothing; then the hideaway exiles a
    // card with no way back.
    b.enqueue({
      action: { type: "cast-spell", player: B, card: bolt, targets: [{ kind: "object", object: watcher }] },
      when: (view) => view.state.zones.shared.stack.length > 0,
    });
    game.advanceUntil(settled);
    expect(game.state.objects[watcher].zone).toBe("graveyard");
    expect(game.state.objects[ids["Lightning Bolt"]].zone).toBe("exile");
  });

  it("Rabble Rousing: Citizens for each attacker, then the card at ten creatures", () => {
    const { game, a, ids } = setUp("Mosswort Bridge", FOUR, "Grizzly Bears");
    game.debugSpawn("Rabble Rousing", A, "battlefield", { announceEntry: true });
    game.advanceUntil(settled);
    expect(game.state.objects[ids["Grizzly Bears"]].zone).toBe("exile");
    const attackers = Array.from({ length: 5 }, () =>
      game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false }),
    );
    a.declareAttackersFn = () => attackers.map((attacker) => ({ attacker, defender: B }));
    let offered: CastNowOffer | undefined;
    a.chooseCastNowFn = (_v, offer): Answer => {
      offered = offer;
      return { type: "cast-spell", player: A, card: offer.casts[0].card, targets: [], via: "effect", free: true };
    };
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && settled(s));
    expect(offered?.cards).toEqual([ids["Grizzly Bears"]]);
    expect(game.state.objects[ids["Grizzly Bears"]].zone).toBe("battlefield");
  });
});
