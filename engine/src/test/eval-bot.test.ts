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
