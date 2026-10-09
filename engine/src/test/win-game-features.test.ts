/**
 * The win-game cluster's cards, each against its Oracle text: the upkeep
 * "you win the game" cards (intervening-ifs, rule 603.4), Thassa's Oracle,
 * Jace, Wielder of Mysteries, Laboratory Maniac's kin, Platinum Angel's kin,
 * Angel's Grace, Everybody Lives!, the pacts, Vorpal Sword, Hellkite Tyrant,
 * Knuckles the Echidna, Revel in Riches, Simic Ascendancy and Helix
 * Pinnacle. The engine's side of winning and losing is `win-game.test.ts`.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { computeCharacteristics, playerHasHexproof } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const registry = createDefaultRegistry();

const setUp = (aCards: readonly string[] = [], players: readonly PlayerId[] = [A, B]) => {
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)]));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((player) => ({
      player,
      cards: [...(player === A ? aCards : []), ...Array<string>(40).fill("Wastes")],
    })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  const a = controllers[A] as ScriptedController;
  return { game, a, controllers };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};

const lands = (game: Game, player: PlayerId, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, player, "battlefield");
};

/** Run on to Alice's next turn's draw step (her upkeep done), or the end. */
const toNextUpkeepDone = (game: Game): void => {
  game.advanceUntil((s) => s.result.over || (s.turn.number === 3 && s.turn.step === "draw"));
};

const tokens = (game: Game, player: PlayerId, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, player, "battlefield");
};

describe("upkeep win conditions (intervening-if, rule 603.4)", () => {
  it("Felidar Sovereign wins with 40 life as the upkeep begins, and not with 39", () => {
    const { game } = setUp();
    game.debugSpawn("Felidar Sovereign", A, "battlefield");
    game.state.players[A].life = 40;
    toNextUpkeepDone(game);
    expect(game.state.result).toMatchObject({ over: true, winner: A, reason: "won the game with Felidar Sovereign" });

    const short = setUp().game;
    short.debugSpawn("Felidar Sovereign", A, "battlefield");
    short.state.players[A].life = 39;
    toNextUpkeepDone(short);
    expect(short.state.result.over).toBe(false);
  });

  it("Felidar Sovereign does nothing if the life is gone by the time it resolves", () => {
    const { game } = setUp();
    game.debugSpawn("Felidar Sovereign", A, "battlefield");
    game.state.players[A].life = 40;
    game.advanceUntil((s) => s.result.over || (s.turn.number === 3 && s.zones.shared.stack.length > 0));
    expect(game.state.result.over).toBe(false);
    game.debugApplyEffect(B, { kind: "lose-life", amount: 1, who: "each-opponent" });
    toNextUpkeepDone(game);
    expect(game.state.result.over).toBe(false);
  });

  it("Test of Endurance wins at 50", () => {
    const { game } = setUp();
    game.debugSpawn("Test of Endurance", A, "battlefield");
    game.state.players[A].life = 50;
    toNextUpkeepDone(game);
    expect(game.state.result.winner).toBe(A);
  });

  it("Triskaidekaphile wins with exactly thirteen cards in hand, not fourteen", () => {
    const fill = (game: Game, n: number): void => {
      while (game.handOf(A).length < n) game.debugSpawn("Wastes", A, "hand");
    };
    const { game } = setUp();
    game.debugSpawn("Triskaidekaphile", A, "battlefield");
    fill(game, 13);
    toNextUpkeepDone(game);
    expect(game.state.result.winner).toBe(A);

    const more = setUp().game;
    more.debugSpawn("Triskaidekaphile", A, "battlefield");
    fill(more, 14);
    toNextUpkeepDone(more);
    expect(more.state.result.over).toBe(false);
  });

  it("Revel in Riches makes a Treasure for an opponent's creature dying, and wins on ten", () => {
    const { game } = setUp();
    game.debugSpawn("Revel in Riches", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const mine = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const treasures = (): number =>
      game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === "Treasure Token").length;
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: mine }]);
    game.advanceUntil(quiet);
    expect(treasures()).toBe(0);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: theirs }]);
    game.advanceUntil(quiet);
    expect(treasures()).toBe(1);
    tokens(game, A, "Treasure Token", 9);
    toNextUpkeepDone(game);
    expect(game.state.result.winner).toBe(A);
  });

  it("Knuckles makes one Treasure per damage step, and wins on thirty artifacts", () => {
    const { game, a } = setUp();
    const knuckles = game.debugSpawn("Knuckles the Echidna", A, "battlefield");
    a.declareAttackersFn = () => [{ attacker: knuckles, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" || s.result.over);
    const treasures = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Treasure Token",
    );
    // Double strike: two combat damage steps, two events.
    expect(treasures.length).toBe(2);
    expect(game.state.players[B].life).toBe(16);
    tokens(game, A, "Treasure Token", 27);
    toNextUpkeepDone(game);
    expect(game.state.result.over).toBe(false);
  });

  it("Knuckles wins with thirty artifacts as the upkeep begins", () => {
    const { game } = setUp();
    game.debugSpawn("Knuckles the Echidna", A, "battlefield");
    tokens(game, A, "Treasure Token", 30);
    toNextUpkeepDone(game);
    expect(game.state.result.winner).toBe(A);
  });

  it("Hellkite Tyrant takes only the damaged player's artifacts, and wins on twenty", () => {
    const { game, a } = setUp([], [A, B, C]);
    const hellkite = game.debugSpawn("Hellkite Tyrant", A, "battlefield", { summoningSick: false });
    const bRing = game.debugSpawn("Sol Ring", B, "battlefield");
    const cRing = game.debugSpawn("Sol Ring", C, "battlefield");
    a.declareAttackersFn = () => [{ attacker: hellkite, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" || s.result.over);
    expect(game.state.objects[bRing].controller).toBe(A);
    expect(game.state.objects[cRing].controller).toBe(C);

    const win = setUp().game;
    win.debugSpawn("Hellkite Tyrant", A, "battlefield");
    tokens(win, A, "Treasure Token", 20);
    toNextUpkeepDone(win);
    expect(win.state.result.winner).toBe(A);
  });

  it("Simic Ascendancy grows with each +1/+1 placement and wins at twenty", () => {
    const { game } = setUp();
    const ascendancy = game.debugSpawn("Simic Ascendancy", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 3 }, [
      { kind: "object", object: bears },
    ]);
    game.advanceUntil(quiet);
    expect(game.state.objects[ascendancy].counters.growth).toBe(3);
    // Not for an opponent's creature.
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 }, [
      { kind: "object", object: theirs },
    ]);
    game.advanceUntil(quiet);
    expect(game.state.objects[ascendancy].counters.growth).toBe(3);
    game.state.objects[ascendancy].counters.growth = 20;
    toNextUpkeepDone(game);
    expect(game.state.result.winner).toBe(A);
  });

  it("Helix Pinnacle takes X tower counters and wins at a hundred", () => {
    const { game } = setUp();
    const pinnacle = game.debugSpawn("Helix Pinnacle", A, "battlefield");
    lands(game, A, "Wastes", 3);
    game.dispatch({ type: "activate-ability", player: A, source: pinnacle, abilityIndex: 0, xValue: 3 });
    game.advanceUntil(quiet);
    expect(game.state.objects[pinnacle].counters.tower).toBe(3);
    toNextUpkeepDone(game);
    expect(game.state.result.over).toBe(false);

    const won = setUp().game;
    const p2 = won.debugSpawn("Helix Pinnacle", A, "battlefield");
    won.state.objects[p2].counters.tower = 100;
    toNextUpkeepDone(won);
    expect(won.state.result.winner).toBe(A);
  });
});

describe("Thassa's Oracle", () => {
  it("wins when the library is no bigger than the devotion to blue", () => {
    const { game } = setUp(["Thassa's Oracle"]);
    lands(game, A, "Island", 2);
    const library = game.state.zones.perPlayer[A].library;
    game.state.zones.perPlayer[A].library = library.slice(0, 2);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, A, "Thassa's Oracle") });
    game.advanceUntil((s) => quiet(s) || s.result.over);
    expect(game.state.result).toMatchObject({ over: true, winner: A, reason: "won the game with Thassa's Oracle" });
  });

  it("with a bigger library, looks at X, keeps up to one on top and doesn't win", () => {
    const { game, a } = setUp(["Thassa's Oracle"]);
    lands(game, A, "Island", 2);
    const library = game.state.zones.perPlayer[A].library;
    game.state.zones.perPlayer[A].library = library.slice(0, 5);
    const [first, second] = game.state.zones.perPlayer[A].library;
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible;
      return [second];
    };
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, A, "Thassa's Oracle") });
    game.advanceUntil((s) => quiet(s) || s.result.over);
    expect(game.state.result.over).toBe(false);
    // Devotion 2: the top two, the second kept on top, the first to the bottom.
    expect([...offered].sort()).toEqual([first, second].sort());
    const after = game.state.zones.perPlayer[A].library;
    expect(after[0]).toBe(second);
    expect(after[after.length - 1]).toBe(first);
    expect(after.length).toBe(5);
  });

  it("with an empty library, looks at nothing without asking, and wins", () => {
    const { game, a } = setUp(["Thassa's Oracle"]);
    lands(game, A, "Island", 2);
    game.state.zones.perPlayer[A].library = [];
    let asked = false;
    a.chooseFromZoneFn = () => {
      asked = true;
      return [];
    };
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, A, "Thassa's Oracle") });
    game.advanceUntil((s) => quiet(s) || s.result.over);
    expect(asked).toBe(false);
    expect(game.state.result).toMatchObject({ over: true, winner: A, reason: "won the game with Thassa's Oracle" });
  });
});

describe("Jace, Wielder of Mysteries", () => {
  it("its −8 wins with a short library even once Jace has died for the loyalty", () => {
    const { game } = setUp();
    const jace = game.debugSpawn("Jace, Wielder of Mysteries", A, "battlefield");
    game.state.objects[jace].counters.loyalty = 8;
    const library = game.state.zones.perPlayer[A].library;
    game.state.zones.perPlayer[A].library = library.slice(0, 3);
    game.dispatch({ type: "activate-ability", player: A, source: jace, abilityIndex: 1 });
    game.advanceUntil((s) => quiet(s) || s.result.over);
    expect(game.state.result).toMatchObject({ over: true, winner: A, reason: "won the game with Jace, Wielder of Mysteries" });
  });

  it("while it's on the battlefield, a draw from an empty library wins", () => {
    const { game } = setUp();
    game.debugSpawn("Jace, Wielder of Mysteries", A, "battlefield");
    game.state.zones.perPlayer[A].library = [];
    game.debugApplyEffect(A, { kind: "draw", amount: 1 });
    expect(game.state.result.winner).toBe(A);
  });

  it("its +1 mills the target two and draws you one", () => {
    const { game } = setUp();
    const jace = game.debugSpawn("Jace, Wielder of Mysteries", A, "battlefield");
    const hand = game.handOf(A).length;
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: jace,
      abilityIndex: 0,
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[B].graveyard.length).toBe(2);
    expect(game.handOf(A).length).toBe(hand + 1);
    expect(game.state.objects[jace].counters.loyalty).toBe(5);
  });
});

describe("can't lose / can't win", () => {
  it("Herald of Eternal Dawn holds 0 life off and stops an opponent's win", () => {
    const { game } = setUp();
    game.debugSpawn("Herald of Eternal Dawn", A, "battlefield");
    game.debugApplyEffect(B, { kind: "lose-life", amount: 30, who: "each-opponent" });
    game.debugApplyEffect(B, { kind: "win-game" });
    game.advanceUntil((s) => s.result.over || s.turn.number === 2);
    expect(game.state.result.over).toBe(false);
    expect(game.state.players[A].hasLost).toBe(false);
  });

  it("Angel's Grace: damage stops at 1, and 0 life doesn't lose until this turn's cleanup", () => {
    const { game } = setUp(["Angel's Grace"]);
    lands(game, A, "Plains", 1);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, A, "Angel's Grace") });
    // Split second: while it's on the stack nobody casts anything.
    expect(game.legalActions(A).some((x) => x.type === "cast-spell")).toBe(false);
    game.advanceUntil(quiet);
    game.debugApplyEffect(B, { kind: "damage", who: "each-opponent", amount: 50 });
    expect(game.state.players[A].life).toBe(1);
    game.debugApplyEffect(B, { kind: "lose-life", amount: 5, who: "each-opponent" });
    game.debugApplyEffect(B, { kind: "win-game" });
    game.advanceUntil((s) => s.result.over || s.turn.step === "end");
    expect(game.state.result.over).toBe(false);
    game.advanceUntil((s) => s.result.over || s.turn.number === 2);
    expect(game.state.result.winner).toBe(B);
    expect(game.state.turn.number).toBe(1);
  });

  it("Everybody Lives!: hexproof and indestructible creatures, hexproof players, no life lost, no winner or loser", () => {
    const { game } = setUp(["Everybody Lives!"]);
    lands(game, A, "Plains", 2);
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, A, "Everybody Lives!") });
    game.advanceUntil(quiet);
    const bear = computeCharacteristics(game.state, registry, bears);
    expect([...bear.keywords]).toEqual(expect.arrayContaining(["hexproof", "indestructible"]));
    expect(playerHasHexproof(game.state, registry, A)).toBe(true);
    expect(playerHasHexproof(game.state, registry, B)).toBe(true);
    const life = game.state.players[B].life;
    game.debugApplyEffect(A, { kind: "damage", who: "each-opponent", amount: 40 });
    expect(game.state.players[B].life).toBe(life);
    game.debugApplyEffect(A, { kind: "lose-game", who: "each-opponent" });
    game.debugApplyEffect(A, { kind: "win-game" });
    expect(game.state.result.over).toBe(false);
    // All of it ends at cleanup.
    game.advanceUntil((s) => s.turn.number === 2 || s.result.over);
    expect(playerHasHexproof(game.state, registry, B)).toBe(false);
    game.debugApplyEffect(A, { kind: "win-game" });
    expect(game.state.result.winner).toBe(A);
  });
});

describe("the pacts", () => {
  it("Pact of Negation counters, and its upkeep payment is a choice: unpaid, you lose", () => {
    const { game } = setUp(["Grizzly Bears", "Pact of Negation"]);
    lands(game, A, "Forest", 2);
    const bears = inHand(game, A, "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: A, card: bears });
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, A, "Pact of Negation"),
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    // No blue mana: nothing to pay with at the next upkeep.
    toNextUpkeepDone(game);
    expect(game.state.players[A].lossReason).toBe("lost the game to Pact of Negation");
    expect(game.state.result.winner).toBe(B);
  });

  it("at a table of three, the unpaid pact's controller leaves during their own upkeep and the game goes on", () => {
    const { game } = setUp(["Grizzly Bears", "Pact of Negation"], [A, B, C]);
    lands(game, A, "Forest", 2);
    const bears = inHand(game, A, "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: A, card: bears });
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, A, "Pact of Negation"),
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(quiet);
    // Alice's next turn is the fourth; she can't pay, loses, and play passes on.
    game.advanceUntil((s) => s.result.over || s.turn.number === 6);
    expect(game.state.players[A].lossReason).toBe("lost the game to Pact of Negation");
    expect(game.state.result.over).toBe(false);
    expect(game.state.turn.number).toBe(6);
  });

  it("Pact of Negation's payment, made, keeps you in the game", () => {
    const { game, a } = setUp(["Grizzly Bears", "Pact of Negation"]);
    lands(game, A, "Forest", 2);
    const bears = inHand(game, A, "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: A, card: bears });
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, A, "Pact of Negation"),
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(quiet);
    lands(game, A, "Island", 5);
    let asked = false;
    a.chooseModesFn = (_view, _min, _max, texts) => {
      asked = texts.some((t) => t.includes("{3}{U}{U}"));
      return [0];
    };
    toNextUpkeepDone(game);
    expect(asked).toBe(true);
    expect(game.state.result.over).toBe(false);
    expect(game.state.players[A].hasLost).toBe(false);
  });

  it("Summoner's Pact tutors a green creature, then wants {2}{G}{G}", () => {
    const { game, a } = setUp(["Summoner's Pact", "Grizzly Bears"]);
    // The Bears start in the library.
    const bears = inHand(game, A, "Grizzly Bears");
    game.state.zones.perPlayer[A].hand = game.state.zones.perPlayer[A].hand.filter((id) => id !== bears);
    game.state.zones.perPlayer[A].library.push(bears);
    game.state.objects[bears].zone = "library";
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, A, "Summoner's Pact") });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("hand");
    toNextUpkeepDone(game);
    expect(game.state.players[A].lossReason).toBe("lost the game to Summoner's Pact");
  });
});

describe("Twenty-Toed Toad", () => {
  const fill = (game: Game, n: number): void => {
    while (game.handOf(A).length < n) game.debugSpawn("Wastes", A, "hand");
  };
  const toCleanupDone = (game: Game): void => {
    game.advanceUntil((s) => s.result.over || s.turn.number === 2);
  };

  it("its maximum hand size of twenty applies in timestamp order with 'no maximum' (rule 613.11)", () => {
    const { game } = setUp();
    game.debugSpawn("Reliquary Tower", A, "battlefield");
    game.debugSpawn("Twenty-Toed Toad", A, "battlefield");
    fill(game, 25);
    toCleanupDone(game);
    // The Toad is newer: twenty.
    expect(game.handOf(A).length).toBe(20);

    const other = setUp().game;
    other.debugSpawn("Twenty-Toed Toad", A, "battlefield");
    other.debugSpawn("Reliquary Tower", A, "battlefield");
    fill(other, 25);
    toCleanupDone(other);
    // The Tower is newer: no maximum.
    expect(other.handOf(A).length).toBe(25);
  });

  it("attacking with two or more creatures grows it and draws a card", () => {
    const { game, a } = setUp();
    const toad = game.debugSpawn("Twenty-Toed Toad", A, "battlefield", { summoningSick: false });
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    const hand = game.handOf(A).length;
    a.declareAttackersFn = () => [
      { attacker: toad, defender: B },
      { attacker: bears, defender: B },
    ];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" || s.result.over);
    expect(game.state.objects[toad].counters["+1/+1"]).toBe(1);
    expect(game.handOf(A).length).toBe(hand + 1);
    expect(game.state.result.over).toBe(false);
  });

  it("wins as it attacks with twenty counters on it, or with twenty cards in hand", () => {
    const { game, a } = setUp();
    const toad = game.debugSpawn("Twenty-Toed Toad", A, "battlefield", { summoningSick: false });
    game.state.objects[toad].counters["+1/+1"] = 19;
    game.state.objects[toad].counters.oil = 1;
    a.declareAttackersFn = () => [{ attacker: toad, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" || s.result.over);
    expect(game.state.result).toMatchObject({ over: true, winner: A, reason: "won the game with Twenty-Toed Toad" });

    const handful = setUp();
    const toad2 = handful.game.debugSpawn("Twenty-Toed Toad", A, "battlefield", { summoningSick: false });
    fill(handful.game, 20);
    handful.a.declareAttackersFn = () => [{ attacker: toad2, defender: B }];
    handful.game.advanceUntil((s) => s.turn.step === "postcombat-main" || s.result.over);
    expect(handful.game.state.result.winner).toBe(A);

    const neither = setUp();
    const toad3 = neither.game.debugSpawn("Twenty-Toed Toad", A, "battlefield", { summoningSick: false });
    fill(neither.game, 19);
    neither.game.state.objects[toad3].counters["+1/+1"] = 19;
    // Enough life to survive a 22/22.
    neither.game.state.players[B].life = 100;
    neither.a.declareAttackersFn = () => [{ attacker: toad3, defender: B }];
    neither.game.advanceUntil((s) => s.turn.step === "postcombat-main" || s.result.over);
    expect(neither.game.state.result.over).toBe(false);
  });
});

describe("Approach of the Second Sun", () => {
  const castApproach = (game: Game, card: ObjectId): void => {
    lands(game, A, "Plains", 1);
    lands(game, A, "Wastes", 6);
    game.dispatch({ type: "cast-spell", player: A, card });
    game.advanceUntil((s) => quiet(s) || s.result.over);
  };

  it("the first goes seventh from the top and gains 7 life; the second, cast from hand, wins", () => {
    const { game } = setUp(["Approach of the Second Sun", "Approach of the Second Sun"]);
    const [first, second] = game
      .handOf(A)
      .filter((id) => game.state.objects[id].cardName === "Approach of the Second Sun");
    const life = game.state.players[A].life;
    castApproach(game, first);
    expect(game.state.result.over).toBe(false);
    expect(game.state.players[A].life).toBe(life + 7);
    expect(game.state.zones.perPlayer[A].library.indexOf(first)).toBe(6);
    castApproach(game, second);
    expect(game.state.result).toMatchObject({ over: true, winner: A, reason: "won the game with Approach of the Second Sun" });
  });

  it("goes to the bottom of a library with fewer than six cards", () => {
    const { game } = setUp(["Approach of the Second Sun"]);
    const library = game.state.zones.perPlayer[A].library;
    game.state.zones.perPlayer[A].library = library.slice(0, 3);
    const card = inHand(game, A, "Approach of the Second Sun");
    castApproach(game, card);
    const after = game.state.zones.perPlayer[A].library;
    expect(after.length).toBe(4);
    expect(after[3]).toBe(card);
  });

  it("an earlier one that never resolved still counts; one not cast from hand doesn't win", () => {
    const { game } = setUp(["Approach of the Second Sun"]);
    // Cast once before (countered, say): only the record of the cast matters.
    game.state.players[A].spellNamesCastThisGame = { "Approach of the Second Sun": 1 };
    castApproach(game, inHand(game, A, "Approach of the Second Sun"));
    expect(game.state.result.winner).toBe(A);

    const noHand = setUp(["Approach of the Second Sun"]);
    noHand.game.state.players[A].spellNamesCastThisGame = { "Approach of the Second Sun": 5 };
    // The record alone isn't enough: this one has to have been cast from hand.
    noHand.game.debugApplyEffect(
      A,
      registry.get("Approach of the Second Sun").effect ?? { kind: "sequence", effects: [] },
      [],
      { source: inHand(noHand.game, A, "Approach of the Second Sun") },
    );
    expect(noHand.game.state.result.over).toBe(false);
  });
});

describe("Summon: Primal Odin", () => {
  it("chapter II gives it 'that player loses the game' on combat damage", () => {
    const { game, a } = setUp([], [A, B, C]);
    const odin = game.debugSpawn("Summon: Primal Odin", A, "battlefield", { summoningSick: false });
    game.state.objects[odin].counters.lore = 1;
    // Next turn's precombat main adds the second lore counter.
    a.declareAttackersFn = (view) => (view.state.turn.number === 4 ? [{ attacker: odin, defender: B }] : []);
    game.advanceUntil((s) => s.result.over || (s.turn.number === 4 && s.turn.step === "postcombat-main"));
    expect(game.state.objects[odin].counters.lore).toBe(2);
    expect(game.state.players[B].lossReason).toBe("lost the game to Summon: Primal Odin");
    expect(game.state.players[C].hasLost).toBe(false);
  });
});

describe("Mirrodin Besieged", () => {
  it("Phyrexian: loots at your end step, then with fifteen artifacts in your graveyard the target opponent loses", () => {
    const { game } = setUp([], [A, B, C]);
    const besieged = game.debugSpawn("Mirrodin Besieged", A, "battlefield");
    game.state.objects[besieged].chosenOnEnter = "Phyrexian";
    for (let i = 0; i < 15; i += 1) game.debugSpawn("Sol Ring", A, "graveyard");
    const hand = game.handOf(A).length;
    game.advanceUntil((s) => s.result.over || s.turn.number === 2);
    // Drew one, discarded one.
    expect(game.handOf(A).length).toBe(hand);
    expect(game.state.players[B].lossReason).toBe("lost the game to Mirrodin Besieged");
    expect(game.state.players[C].hasLost).toBe(false);
  });

  it("Phyrexian: the trigger resolves though the enchantment is destroyed in response (rule 113.7a)", () => {
    const { game } = setUp([], [A, B, C]);
    const besieged = game.debugSpawn("Mirrodin Besieged", A, "battlefield");
    game.state.objects[besieged].chosenOnEnter = "Phyrexian";
    for (let i = 0; i < 15; i += 1) game.debugSpawn("Sol Ring", A, "graveyard");
    game.advanceUntil((s) => s.result.over || s.zones.shared.stack.length > 0);
    expect(game.state.turn.step).toBe("end");
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: besieged }]);
    expect(game.state.objects[besieged].zone).toBe("graveyard");
    game.advanceUntil((s) => s.result.over || s.turn.number === 2);
    expect(game.state.players[B].lossReason).toBe("lost the game to Mirrodin Besieged");
  });

  it("Phyrexian with fourteen: nobody loses; Mirran instead makes a Myr per artifact spell", () => {
    const { game } = setUp([], [A, B]);
    const besieged = game.debugSpawn("Mirrodin Besieged", A, "battlefield");
    game.state.objects[besieged].chosenOnEnter = "Phyrexian";
    for (let i = 0; i < 13; i += 1) game.debugSpawn("Sol Ring", A, "graveyard");
    game.advanceUntil((s) => s.result.over || s.turn.number === 2);
    expect(game.state.result.over).toBe(false);

    const mirran = setUp(["Sol Ring"]).game;
    const m = mirran.debugSpawn("Mirrodin Besieged", A, "battlefield");
    mirran.state.objects[m].chosenOnEnter = "Mirran";
    lands(mirran, A, "Wastes", 1);
    mirran.dispatch({ type: "cast-spell", player: A, card: inHand(mirran, A, "Sol Ring") });
    mirran.advanceUntil(quiet);
    const myr = mirran.state.zones.shared.battlefield.filter((id) => mirran.state.objects[id].cardName === "Myr Token");
    expect(myr.length).toBe(1);
  });
});

describe("Vorpal Sword", () => {
  it("activated, the equipped creature's combat damage makes that player lose", () => {
    const { game, a } = setUp([], [A, B, C]);
    const sword = game.debugSpawn("Vorpal Sword", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    lands(game, A, "Swamp", 10);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: sword,
      abilityIndex: 1,
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[sword].attachedTo).toBe(bears);
    game.dispatch({ type: "activate-ability", player: A, source: sword, abilityIndex: 0 });
    game.advanceUntil(quiet);
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" || s.result.over);
    expect(game.state.players[B].lossReason).toBe("lost the game to Vorpal Sword");
    expect(game.state.players[C].hasLost).toBe(false);
    expect(game.state.result.over).toBe(false);
  });

  it("without the activation, it's +2/+0 and deathtouch only", () => {
    const { game, a } = setUp();
    const sword = game.debugSpawn("Vorpal Sword", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    lands(game, A, "Swamp", 2);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: sword,
      abilityIndex: 1,
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(quiet);
    const bear = computeCharacteristics(game.state, registry, bears);
    expect(bear.power).toBe(4);
    expect(bear.keywords).toContain("deathtouch");
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" || s.result.over);
    expect(game.state.players[B].hasLost).toBe(false);
    expect(game.state.players[B].life).toBe(16);
  });
});
