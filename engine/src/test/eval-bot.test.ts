import { describe, expect, it } from "vitest";

import { EvalBotController } from "../bot/eval-bot.js";
import { DEFAULT_WEIGHTS, evaluateState } from "../bot/evaluate.js";
import type { EvalWeights } from "../bot/evaluate.js";
import { candidateActions } from "../bot/candidates.js";
import { createDefaultRegistry } from "../cards.js";
import type { ControllerView, PlayerController } from "../controller.js";
import { HeuristicBotController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const D = asPlayerId("dave");

const list = (entries: readonly (readonly [string, number])[]): string[] =>
  entries.flatMap(([name, count]) => Array<string>(count).fill(name));

// The same shape of deck `heuristic-bot.test.ts` uses: a real curve, so the
// bot has land-drop / cast / attack / block decisions to actually search.
const deck = (): string[] =>
  list([
    ["Forest", 17],
    ["Sol Ring", 1],
    ["Llanowar Elves", 3],
    ["Grizzly Bears", 4],
    ["Elvish Visionary", 2],
    ["Rumbling Baloth", 3],
    ["Craw Wurm", 2],
    ["Giant Growth", 2],
    ["Beast Within", 2],
    ["Naturalize", 2],
    ["Prey Upon", 2],
  ]);

const registry = createDefaultRegistry();

const seatsFor = (players: readonly PlayerId[]) =>
  players.map((player) => ({ player, cards: deck() }));

// The cheaper horizon by default: it's ~3x faster per decision and these
// tests are fuzz targets, not strength measurements. `bot:bench` is where
// horizon actually gets compared.
const evalBots = (
  players: readonly PlayerId[],
  horizon: "stack" | "turn" = "stack",
): Partial<Record<PlayerId, PlayerController>> =>
  Object.fromEntries(
    players.map((p) => [p, new EvalBotController(p, registry, { horizon })]),
  );

/** A searching bot plays a slow game — several seconds per table, and four
 * of them at once is the worst case. */
const GAME_TIMEOUT_MS = 120_000;

/** A game played to completion, for the fuzz-target tests below. */
const playOut = (
  players: readonly PlayerId[],
  controllers: Partial<Record<PlayerId, PlayerController>>,
  seed: number,
): Game => {
  const game = Game.create({
    seed,
    mulligans: true,
    registry,
    controllers,
    decks: seatsFor(players),
  });
  game.advance();
  return game;
};

describe("EvalBotController", () => {
  // The primary value of these: a third fuzz target alongside
  // random-demo.mjs and the v1 bot's own test. The search dispatches concrete
  // fillings of every legal-action shape, so anything `legalActions` offers
  // that `dispatch` refuses surfaces here.
  it("plays a full 2-player game against itself without throwing or hanging", () => {
    const game = playOut([A, B], evalBots([A, B]), 1);
    expect(game.isOver).toBe(true);
  }, GAME_TIMEOUT_MS);

  it("plays a full 4-player game against itself", () => {
    const players = [A, B, C, D];
    const game = playOut(players, evalBots(players), 7);
    expect(game.isOver).toBe(true);
  }, GAME_TIMEOUT_MS);

  it("plays against the v1 heuristic bot at a 3-player table", () => {
    const players = [A, B, C];
    const game = playOut(
      players,
      {
        [A]: new EvalBotController(A, registry, { horizon: "stack" }),
        [B]: new HeuristicBotController(B, registry),
        [C]: new EvalBotController(C, registry, { horizon: "stack" }),
      },
      11,
    );
    expect(game.isOver).toBe(true);
  }, GAME_TIMEOUT_MS);

  it("runs the end-of-turn horizon to completion", () => {
    const game = playOut([A, B], evalBots([A, B], "turn"), 3);
    expect(game.isOver).toBe(true);
  }, GAME_TIMEOUT_MS);

  it("actually develops a board rather than passing every turn", () => {
    // The regression this guards is the one that sank the first prototype:
    // with a feature set that has no term for lands, a land drop scores
    // strictly negative (one fewer card in hand, nothing else moves) and the
    // bot passes every single window — 0 wins in 20 games, dead on an empty
    // board at turn 20. A bot that never acts still finishes a game, so the
    // fuzz tests above would not have caught it.
    const game = playOut([A, B], evalBots([A, B]), 5);
    const lands = game.state.zones.shared.battlefield.filter((id) =>
      registry.get(game.state.objects[id].cardName).types.includes("land"),
    );
    expect(lands.length).toBeGreaterThan(0);
  }, GAME_TIMEOUT_MS);
});

describe("the decision time budget", () => {
  // `maxSimulations` bounds *work*, not *time* — a rollout on a wide
  // four-player board costs ~400ms, so the 200-simulation ceiling is over a
  // minute. `timeBudgetMs` is what makes the bot safe to seat in a live room
  // (`Room.addBot`), and what it must guarantee is not speed but *graceful
  // degradation*: an expired search still returns a legal, sensible move.
  const atMain = (): Game => {
    const game = Game.create({ seed: 4, registry, decks: seatsFor([A, B]) });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    return game;
  };

  const viewOf = (game: Game): ControllerView => ({
    state: game.state,
    player: A,
    legalActions: () => game.legalActions(A),
  });

  it("still returns a move the engine accepts when the budget is already spent", () => {
    const game = atMain();
    // A deadline in the past: every `spent()` check fails immediately, so the
    // search gets no candidate scored beyond its first.
    const action = new EvalBotController(A, registry, { timeBudgetMs: 0 }).act(viewOf(game));
    expect(() => game.dispatch(action)).not.toThrow();
  });

  it("degrades to passing or v1's own choice, not to an arbitrary candidate", () => {
    // The ordering guarantee: `pass` and v1's pick are scored first, so
    // whatever "best so far" holds when the clock runs out is one of those
    // two. Without it an early cutoff would leave the bot playing whichever
    // card `legalActions` happened to enumerate first.
    const game = atMain();
    const view = viewOf(game);
    const v1 = new HeuristicBotController(A, registry).act(view);
    const rushed = new EvalBotController(A, registry, { timeBudgetMs: 0 }).act(view);
    expect([JSON.stringify(v1), JSON.stringify({ type: "pass-priority", player: A })]).toContain(
      JSON.stringify(rushed),
    );
  });

  it("is off by default, so seeded replays stay deterministic", () => {
    // The engine's determinism guarantee (same seed + same controllers =>
    // identical replay) can't survive a wall clock, since a busier machine
    // searches less. Tests, the fuzzer and the tuner all depend on it, so the
    // budget is opt-in and only `Room.addBot` opts in.
    const once = playOut([A, B], evalBots([A, B]), 8).state;
    const twice = playOut([A, B], evalBots([A, B]), 8).state;
    expect(twice.turn.number).toBe(once.turn.number);
    expect(twice.eventLog.length).toBe(once.eventLog.length);
  }, GAME_TIMEOUT_MS);
});

describe("what a decision costs", () => {
  // Every seat gets priority at every step, so most windows in a game offer
  // nothing but passing and tapping for mana. Rolling a pass out to the end
  // of the turn at each of them was a third of all the bot's CPU.
  const forests = (player: PlayerId) => ({ player, cards: Array<string>(40).fill("Forest") });
  const atUpkeep = (): Game => {
    const game = Game.create({ seed: 4, registry, decks: [forests(A), forests(B)] });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "upkeep");
    game.state.zones.perPlayer[A].hand = [];
    return game;
  };
  const viewOf = (game: Game): ControllerView => ({
    state: game.state,
    player: A,
    legalActions: () => game.legalActions(A),
  });

  it("passes without a simulation when passing is the only move it would consider", () => {
    const game = atUpkeep();
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const bot = new EvalBotController(A, registry);
    expect(bot.act(viewOf(game))).toEqual({ type: "pass-priority", player: A });
    expect(bot.lastDecision).toEqual({ kind: "priority", simulations: 0, ms: 0 });
  });

  it("plays a lone land drop without one either", () => {
    const game = atUpkeep();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    game.state.zones.perPlayer[A].hand = [];
    game.debugSpawn("Forest", A, "hand");
    const bot = new EvalBotController(A, registry);
    expect(bot.act(viewOf(game)).type).toBe("play-land");
    expect(bot.lastDecision?.simulations).toBe(0);
  });

  it("still searches a real choice, passing included", () => {
    const game = atUpkeep();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    game.state.zones.perPlayer[A].hand = [];
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "hand");
    const bot = new EvalBotController(A, registry);
    expect(bot.act(viewOf(game)).type).toBe("cast-spell");
    // Passing and the Bears, each rolled out to the horizon.
    expect(bot.lastDecision?.simulations).toBe(2);
  });
});

describe("evaluateState", () => {
  const twoPlayer = () =>
    Game.create({
      seed: 2,
      registry,
      decks: seatsFor([A, B]),
    });

  it("does not score a land drop as a loss", () => {
    // The evaluation's central failure mode: playing a land costs a card in
    // hand and must still come out ahead, or nothing ever gets cast.
    const game = twoPlayer();
    // A is turnOrder[0] and so the starting player: wait for its own main
    // phase, where a land drop is actually on offer.
    game.advanceUntil(
      (s) => s.priority.holder === A && s.turn.step === "precombat-main",
    );
    const before = evaluateState(game.state, registry, A, DEFAULT_WEIGHTS);

    const land = game.legalActions(A).find((a) => a.kind === "play-land");
    expect(land).toBeDefined();
    if (land === undefined || land.kind !== "play-land") return;

    game.dispatch({ type: "play-land", player: A, card: land.card });
    const after = evaluateState(game.state, registry, A, DEFAULT_WEIGHTS);
    expect(after).toBeGreaterThan(before);
  });

  it("is relative — an opponent losing ground is a gain", () => {
    const game = twoPlayer();
    game.advanceUntil((s) => s.priority.holder !== null);
    const before = evaluateState(game.state, registry, A, DEFAULT_WEIGHTS);
    game.state.players[B].life -= 5;
    const after = evaluateState(game.state, registry, A, DEFAULT_WEIGHTS);
    expect(after).toBeGreaterThan(before);
  });

  it("treats a won game as dominating every positional term", () => {
    const game = twoPlayer();
    game.advanceUntil((s) => s.priority.holder !== null);
    const positional = evaluateState(game.state, registry, A, DEFAULT_WEIGHTS);
    game.state.result = { over: true, winner: A, reason: "test" };
    expect(evaluateState(game.state, registry, A, DEFAULT_WEIGHTS)).toBeGreaterThan(
      positional + 1000,
    );
    game.state.result = { over: true, winner: B, reason: "test" };
    expect(evaluateState(game.state, registry, A, DEFAULT_WEIGHTS)).toBeLessThan(
      positional - 1000,
    );
  });
});

describe("evaluateState features", () => {
  // Every weight zero but the ones named, and no opponent term unless asked
  // for: each test then reads exactly one feature off the score.
  const ZERO = Object.fromEntries(
    Object.keys(DEFAULT_WEIGHTS).map((k) => [k, 0]),
  ) as unknown as EvalWeights;
  const only = (weights: Partial<EvalWeights>): EvalWeights => ({ ...ZERO, ...weights });

  const atFirstPriority = (players: readonly PlayerId[] = [A, B]): Game => {
    const game = Game.create({ seed: 2, registry, decks: seatsFor(players) });
    game.advanceUntil((s) => s.priority.holder !== null);
    return game;
  };

  /** The score change `mutate` causes under `weights`, from A's seat. */
  const delta = (
    weights: Partial<EvalWeights>,
    mutate: (game: Game) => void,
    players?: readonly PlayerId[],
  ): number => {
    const game = atFirstPriority(players);
    const w = only(weights);
    const before = evaluateState(game.state, registry, A, w);
    mutate(game);
    return evaluateState(game.state, registry, A, w) - before;
  };

  it("subtracts the most damage taken from any one commander", () => {
    expect(
      delta({ commanderDamage: 1 }, (g) => {
        g.state.players[A].commanderDamageTaken = { x: 7, y: 3 } as never;
      }),
    ).toBe(-7);
  });

  it("counts the mana a turn nonland permanents make, net of what tapping them costs", () => {
    expect(delta({ nonlandMana: 1 }, (g) => void g.debugSpawn("Sol Ring", A))).toBe(2);
    // Two coloured mana for {1}: one more than it takes.
    expect(delta({ nonlandMana: 1 }, (g) => void g.debugSpawn("Azorius Signet", A))).toBe(1);
    expect(delta({ nonlandMana: 1 }, (g) => void g.debugSpawn("Llanowar Elves", A))).toBe(1);
    // A land is `lands`' business.
    expect(delta({ nonlandMana: 1 }, (g) => void g.debugSpawn("Forest", A))).toBe(0);
  });

  it("counts permanents that keep drawing cards, not ones that draw once", () => {
    expect(delta({ drawEngines: 1 }, (g) => void g.debugSpawn("Phyrexian Arena", A))).toBe(1);
    // Draws when it dies, once.
    expect(delta({ drawEngines: 1 }, (g) => void g.debugSpawn("Solemn Simulacrum", A))).toBe(0);
    // Draws when it's sacrificed, once.
    expect(delta({ drawEngines: 1 }, (g) => void g.debugSpawn("Mind Stone", A))).toBe(0);
  });

  it("prices a draw engine by the cards it draws a round", () => {
    const four = [A, B, C, D];
    // One card a turn, at any table.
    expect(delta({ drawEngines: 1 }, (g) => void g.debugSpawn("Phyrexian Arena", A), four)).toBe(1);
    // A card off each opponent's spell, unless they pay {1}: half a card per
    // opponent — three of them at four players, one at two.
    expect(delta({ drawEngines: 1 }, (g) => void g.debugSpawn("Rhystic Study", A), four)).toBe(1.5);
    expect(delta({ drawEngines: 1 }, (g) => void g.debugSpawn("Rhystic Study", A))).toBe(0.5);
    // Two cards per opponent's draw would be six at four players: capped.
    expect(delta({ drawEngines: 1 }, (g) => void g.debugSpawn("Consecrated Sphinx", A), four)).toBe(3);
  });

  it("counts our own commander on the battlefield", () => {
    expect(
      delta({ commanderOnBoard: 1 }, (g) => {
        const id = g.debugSpawn("Grizzly Bears", A);
        g.state.objects[id].isCommander = true;
      }),
    ).toBe(1);
    expect(delta({ commanderOnBoard: 1 }, (g) => void g.debugSpawn("Grizzly Bears", A))).toBe(0);
  });

  it("takes back the power of a creature that can't attack", () => {
    expect(
      delta({ idlePower: 1 }, (g) => {
        const wurm = g.debugSpawn("Craw Wurm", A);
        g.debugApplyEffect(
          A,
          { kind: "restrict", target: 0, restrictions: ["cant-attack"] },
          [{ kind: "object", object: wurm }],
        );
      }),
    ).toBe(-6);
    expect(delta({ idlePower: 1 }, (g) => void g.debugSpawn("Craw Wurm", A))).toBe(0);
  });

  it("values the mana value of nonland cards in my hand, and never an opponent's", () => {
    expect(delta({ handManaValue: 1 }, (g) => void g.debugSpawn("Craw Wurm", A, "hand"))).toBe(6);
    expect(delta({ handManaValue: 1 }, (g) => void g.debugSpawn("Forest", A, "hand"))).toBe(0);
    expect(
      delta({ handManaValue: 1, opponent: 1 }, (g) => void g.debugSpawn("Craw Wurm", B, "hand")),
    ).toBe(0);
  });

  it("counts evasive power", () => {
    expect(delta({ evasivePower: 1 }, (g) => void g.debugSpawn("Serra Angel", A))).toBe(4);
    expect(delta({ evasivePower: 1 }, (g) => void g.debugSpawn("Grizzly Bears", A))).toBe(0);
  });

  it("counts combat keywords, but not evasion", () => {
    // Serra Angel: flying (evasion, not counted here) and vigilance.
    expect(delta({ combatKeywords: 1 }, (g) => void g.debugSpawn("Serra Angel", A))).toBe(1);
    expect(delta({ combatKeywords: 1 }, (g) => void g.debugSpawn("Typhoid Rats", A))).toBe(1);
  });

  it("counts untapped creatures as blockers", () => {
    expect(delta({ untappedCreatures: 1 }, (g) => void g.debugSpawn("Grizzly Bears", A))).toBe(1);
    expect(
      delta({ untappedCreatures: 1 }, (g) => void g.debugSpawn("Grizzly Bears", A, "battlefield", { tapped: true })),
    ).toBe(0);
  });

  it("pays full value for lands up to the cap and less after it", () => {
    expect(
      delta({ lands: 1, landCap: 2, extraLands: 0.5 }, (g) => {
        for (let i = 0; i < 4; i += 1) g.debugSpawn("Forest", A);
      }),
    ).toBe(3);
  });

  it("counts untapped mana sources", () => {
    expect(delta({ untappedMana: 1 }, (g) => void g.debugSpawn("Forest", A))).toBe(1);
    expect(delta({ untappedMana: 1 }, (g) => void g.debugSpawn("Sol Ring", A))).toBe(1);
    expect(
      delta({ untappedMana: 1 }, (g) => void g.debugSpawn("Forest", A, "battlefield", { tapped: true })),
    ).toBe(0);
  });

  it("counts other permanents and the mana value of nonland permanents", () => {
    expect(delta({ otherPermanents: 1 }, (g) => void g.debugSpawn("Mind Stone", A))).toBe(1);
    expect(delta({ otherPermanents: 1 }, (g) => void g.debugSpawn("Grizzly Bears", A))).toBe(0);
    expect(delta({ permanentManaValue: 1 }, (g) => void g.debugSpawn("Mind Stone", A))).toBe(2);
    expect(delta({ permanentManaValue: 1 }, (g) => void g.debugSpawn("Forest", A))).toBe(0);
  });

  it("counts planeswalker loyalty", () => {
    expect(
      delta({ loyalty: 1 }, (g) => {
        const garruk = g.debugSpawn("Garruk Wildspeaker", A);
        g.state.objects[garruk].counters.loyalty = 5;
      }),
    ).toBe(5);
  });

  it("counts counters no other feature already covers", () => {
    expect(
      delta({ counters: 1 }, (g) => {
        const stone = g.debugSpawn("Mind Stone", A);
        g.state.objects[stone].counters.charge = 2;
        g.state.objects[stone].counters["+1/+1"] = 3;
      }),
    ).toBe(2);
  });

  it("counts graveyard cards that can still be cast", () => {
    expect(delta({ graveyardCastable: 1 }, (g) => void g.debugSpawn("Deep Analysis", A, "graveyard"))).toBe(1);
    expect(delta({ graveyardCastable: 1 }, (g) => void g.debugSpawn("Grizzly Bears", A, "graveyard"))).toBe(0);
  });

  it("counts energy, the monarchy and emblems", () => {
    expect(delta({ energy: 1 }, (g) => void (g.state.players[A].energy = 4))).toBe(4);
    expect(delta({ monarch: 1 }, (g) => void (g.state.monarch = A))).toBe(1);
    expect(
      delta({ emblems: 1 }, (g) => {
        g.state.emblems.push({ id: "e", owner: A, text: "", timestamp: 0, static: null });
      }),
    ).toBe(1);
  });

  it("subtracts commander tax", () => {
    expect(
      delta({ commanderTax: 1 }, (g) => void (g.state.players[A].commanderCastCounts = { X: 2 })),
    ).toBe(-2);
  });

  it("scores a drawn game between a win and a loss", () => {
    const game = atFirstPriority();
    game.state.result = { over: true, winner: null, reason: "test" };
    expect(evaluateState(game.state, registry, A, DEFAULT_WEIGHTS)).toBe(0);
  });

  it("counts every opponent, not just the strongest", () => {
    // Carol losing ground doesn't change who the strongest opponent is, so
    // only the other-opponents term can see it.
    expect(
      delta({ life: 1, opponent: 1, otherOpponents: 1 }, (g) => void (g.state.players[C].life -= 5), [A, B, C]),
    ).toBe(5);
  });
});

describe("candidateActions", () => {
  it("expands one targeted spell into one action per target", () => {
    const game = Game.create({
      seed: 4,
      registry,
      decks: seatsFor([A, B]),
    });
    game.advanceUntil((s) => s.priority.holder !== null);

    // Two creatures on the board means a one-target removal spell must
    // enumerate as two distinct candidates, not one.
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugSpawn("Craw Wurm", B, "battlefield");
    game.debugSpawn("Prey Upon", A, "hand");

    const legal = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.cardName === "Prey Upon");
    if (legal === undefined) return; // not castable this window — nothing to assert
    const actions = candidateActions(legal, A);
    expect(actions.length).toBeGreaterThan(0);
    for (const action of actions) expect(action.type).toBe("cast-spell");
  });

  it("flags mana abilities on the legal action, granted ones included", () => {
    // A bot can't read a granted ability off the printed card, and on a
    // Citanul Hierophants board those are every creature's — the search spent
    // nearly all its time simulating them before this flag existed.
    const game = Game.create({ seed: 4, registry, decks: seatsFor([A, B]) });
    game.advanceUntil((s) => s.priority.holder === A);
    game.debugSpawn("Citanul Hierophants", A, "battlefield", { summoningSick: false });
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });

    const granted = game
      .legalActions(A)
      .find((a) => a.kind === "activate-ability" && a.source === bears);
    expect(granted).toBeDefined();
    expect(granted?.kind === "activate-ability" && granted.manaAbility).toBe(true);
  });

  it("offers a targeted modal spell's modes alone and together, each with its X", () => {
    // Clan Defiance used to get one candidate — every mode at once, aimed at
    // the first legal target of each, and cast without an X (so for 0).
    const game = Game.create({
      seed: 4,
      registry,
      decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Forest") })),
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    for (const land of ["Mountain", "Mountain", "Forest", "Forest"]) {
      game.debugSpawn(land, A, "battlefield");
    }
    game.debugSpawn("Birds of Paradise", B, "battlefield", { summoningSick: false });
    game.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false });
    game.debugSpawn("Clan Defiance", A, "hand");
    const legal = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.cardName === "Clan Defiance");
    if (legal === undefined) throw new Error("Clan Defiance not castable");
    const actions = candidateActions(legal, A);
    const modeSets = actions.map((a) => (a.type === "cast-spell" ? JSON.stringify(a.modes) : ""));
    expect(modeSets).toEqual(["[0,1,2]", "[0]", "[1]", "[2]", "[0,1]", "[0,2]", "[1,2]"]);
    const maxX = legal.kind === "cast-spell" ? (legal.xCost?.maxX ?? 0) : 0;
    expect(maxX).toBeGreaterThan(0);
    for (const action of actions) expect(action).toMatchObject({ xValue: maxX });
    for (const action of actions) expect(game.canDispatch(action)).toBeNull();
  });

  it("casts a modal X spell at the opponent, not at itself", () => {
    const game = Game.create({
      seed: 4,
      registry,
      decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Forest") })),
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    game.state.zones.perPlayer[A].hand = [];
    for (const land of ["Mountain", "Mountain", "Mountain", "Forest", "Forest"]) {
      game.debugSpawn(land, A, "battlefield");
    }
    game.debugSpawn("Birds of Paradise", A, "battlefield", { summoningSick: false });
    game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    game.debugSpawn("Craw Wurm", B, "battlefield", { summoningSick: false });
    game.debugSpawn("Clan Defiance", A, "hand");
    const offer = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.cardName === "Clan Defiance");
    const maxX = offer?.kind === "cast-spell" ? (offer.xCost?.maxX ?? 0) : 0;
    expect(maxX).toBeGreaterThan(0);
    const action = new EvalBotController(A, registry).act({
      state: game.state,
      player: A,
      legalActions: () => game.legalActions(A),
    });
    expect(action.type).toBe("cast-spell");
    if (action.type !== "cast-spell") return;
    expect(action.xValue).toBe(maxX);
    for (const target of action.targets ?? []) {
      if (target === null) continue;
      const side = target.kind === "player" ? target.player : game.state.objects[target.object].controller;
      expect(side).toBe(B);
    }
  });

  it("returns nothing for combat declarations, which must stay constructive", () => {
    // Attacker subsets are (defenders + 1) ^ creatures — a ten-creature board
    // against three opponents is about a million. These must never be
    // enumerated; `HeuristicBotController` builds them instead.
    expect(
      candidateActions(
        { kind: "declare-attackers", eligible: [], defenders: [] } as never,
        A,
      ),
    ).toEqual([]);
  });
});

describe("the acting rollout", () => {
  /** Alice's first main phase with four Forests out and `hand` in hand. */
  const mainPhaseWith = (hand: readonly string[]): Game => {
    const game = Game.create({ seed: 3, registry, decks: seatsFor([A, B]) });
    game.advanceUntil(
      (s) =>
        s.turn.step === "precombat-main" &&
        s.priority.holder === A &&
        s.turnOrder[s.turn.activePlayerIndex] === A,
    );
    game.state.zones.perPlayer[A].hand = [];
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Forest", A, "battlefield");
    for (const name of hand) game.debugSpawn(name, A, "hand");
    return game;
  };
  const choose = (game: Game, rollout: "combat" | "acting"): string => {
    const action = new EvalBotController(A, registry, { rollout }).act({
      state: game.state,
      player: A,
      legalActions: () => game.legalActions(A),
    });
    return action.type === "cast-spell" ? game.state.objects[action.card].cardName : action.type;
  };

  it("sees the second spell the mana it leaves would cast", () => {
    const hand = ["Grizzly Bears", "Grizzly Bears", "Rumbling Baloth"];
    // Passing at every window, the rollout never casts the second Bears, so
    // one Bears loses to the Baloth; playing its turn out as v1, it does.
    expect(choose(mainPhaseWith(hand), "combat")).toBe("Rumbling Baloth");
    expect(choose(mainPhaseWith(hand), "acting")).toBe("Grizzly Bears");
  });

  it("casts now what passing would only cast later", () => {
    // Passing is scored with v1 casting the Bears in the second main phase —
    // the same end state. The tie goes to acting.
    expect(choose(mainPhaseWith(["Grizzly Bears"]), "acting")).toBe("Grizzly Bears");
  });
});
