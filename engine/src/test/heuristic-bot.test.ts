import { describe, expect, it } from "vitest";

import type { PlayerController } from "../controller.js";
import { AutomaticController, HeuristicBotController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const D = asPlayerId("dave");

const list = (entries: readonly (readonly [string, number])[]): string[] =>
  entries.flatMap(([name, count]) => Array<string>(count).fill(name));

// A lean, self-contained deck with a real mana curve (lands, mana dork,
// small/medium/big creatures, a pump spell, two removal spells) so the bot
// actually has land-drop / cast / attack / block decisions to make — a
// second fuzz target alongside random-demo.mjs's RandomController, not a
// "does the bot play well" test.
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

const seatsFor = (players: readonly PlayerId[]) =>
  players.map((player) => ({ player, cards: deck() }));

const botControllers = (
  players: readonly PlayerId[],
): Partial<Record<PlayerId, PlayerController>> =>
  Object.fromEntries(players.map((p) => [p, new HeuristicBotController(p)]));

describe("HeuristicBotController", () => {
  it("plays a full 2-player game against itself without throwing or hanging", () => {
    const players = [A, B];
    const game = Game.create({
      seed: 1,
      mulligans: true,
      controllers: botControllers(players),
      decks: seatsFor(players),
    });
    expect(() => game.advance()).not.toThrow();
    expect(game.state.result.over).toBe(true);
  });

  it("beats a passive AutomaticController opponent", () => {
    const game = Game.create({
      seed: 2,
      mulligans: true,
      controllers: { [A]: new HeuristicBotController(A), [B]: new AutomaticController(B) },
      decks: seatsFor([A, B]),
    });
    game.advance();
    expect(game.state.result.over).toBe(true);
    expect(game.winner).toBe(A);
  });

  it("plays lands and casts spells rather than sitting idle", () => {
    const game = Game.create({
      seed: 3,
      mulligans: true,
      controllers: { [A]: new HeuristicBotController(A), [B]: new HeuristicBotController(B) },
      decks: seatsFor([A, B]),
    });
    game.advanceUntil((s) => s.turn.number >= 6);
    const battlefield = game.state.zones.shared.battlefield.map(
      (id) => game.state.objects[id].cardName,
    );
    expect(battlefield.some((name) => name !== "Forest")).toBe(true);
  });

  it("never taps a land just to float mana", () => {
    // Casting auto-pays, so floating mana ahead of a spell gains this bot
    // nothing and strands the source — and, once bot moves are paced out one
    // at a time for the client, it shows up as a land flipping sideways for
    // no reason between a spell being cast and that spell resolving.
    const game = Game.create({
      seed: 3,
      mulligans: true,
      controllers: { [A]: new HeuristicBotController(A), [B]: new HeuristicBotController(B) },
      decks: seatsFor([A, B]),
    });
    game.advanceUntil((s) => s.turn.number >= 8);

    // A land is only ever tapped as part of paying for something, so no
    // ability-activated event should name one.
    const lands = new Set(
      Object.values(game.state.objects)
        .filter((o) => o.cardName === "Forest")
        .map((o) => o.id),
    );
    const floated = game.state.eventLog.filter(
      (e) => e.type === "ability-activated" && lands.has(e.source),
    );
    expect(floated).toEqual([]);
  });

  it("still casts the spells that mana pays for", () => {
    // The guard above must not have made the bot passive: it should still be
    // spending its lands via casts.
    const game = Game.create({
      seed: 3,
      mulligans: true,
      controllers: { [A]: new HeuristicBotController(A), [B]: new HeuristicBotController(B) },
      decks: seatsFor([A, B]),
    });
    game.advanceUntil((s) => s.turn.number >= 8);
    expect(game.state.eventLog.some((e) => e.type === "spell-cast")).toBe(true);
  });

  it("plays a full 3-player game without throwing or hanging", () => {
    const players = [A, B, C];
    const game = Game.create({
      seed: 4,
      mulligans: true,
      controllers: botControllers(players),
      decks: seatsFor(players),
    });
    expect(() => game.advance()).not.toThrow();
    expect(game.state.result.over).toBe(true);
  });

  it("plays a full 4-player game without throwing or hanging", () => {
    const players = [A, B, C, D];
    const game = Game.create({
      seed: 5,
      mulligans: true,
      controllers: botControllers(players),
      decks: seatsFor(players),
    });
    expect(() => game.advance()).not.toThrow();
    expect(game.state.result.over).toBe(true);
  });
});

// Found by playing the precon starter decks (sample-decks.ts) bot-vs-bot: each
// of these either threw out of `dispatch` or never left a main phase.
describe("HeuristicBotController — per-card legality", () => {
  const viewOf = (game: Game, player: PlayerId) => ({
    state: game.state,
    player,
    legalActions: () => game.legalActions(player),
  });

  const plainGame = (players: readonly PlayerId[], land = "Mountain") =>
    Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      decks: players.map((player) => ({ player, cards: Array<string>(40).fill(land) })),
    });

  it("sends a goaded attacker at someone other than its goader", () => {
    const game = plainGame([A, B, C]);
    game.advanceUntil((s) => s.priority.holder === B && s.turn.step === "precombat-main");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.state.objects[bears].summoningSick = false;
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [{ kind: "player", player: B }]);
    // The goader is also the most tempting target, which is what the bot
    // used to send every attacker at.
    game.state.players[A].life = 1;

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    const attackers = new HeuristicBotController(B).declareAttackers(viewOf(game, B));
    expect(attackers).toEqual([{ attacker: bears, defender: C }]);
    expect(() =>
      game.dispatch({ type: "declare-attackers", player: B, attackers }),
    ).not.toThrow();
  });

  it("casts Sephara for its alternative cost when that's the variant offered", () => {
    const game = plainGame([A, B]);
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const plains = game.debugSpawn("Plains", A, "battlefield");
    game.state.objects[plains].tapped = false;
    for (let i = 0; i < 4; i += 1) {
      const angel = game.debugSpawn("Serra Angel", A, "battlefield");
      game.state.objects[angel].summoningSick = false;
    }
    const sephara = game.debugSpawn("Sephara, Sky's Blade", A, "hand");

    const bot = new HeuristicBotController(A);
    // Land drops come first; play them all out to reach the cast.
    for (let i = 0; i < 20; i += 1) {
      const action = bot.act(viewOf(game, A));
      if (action.type === "cast-spell") {
        expect(action.card).toBe(sephara);
        expect(action.altCost).toBe(true);
        expect(() => game.dispatch(action)).not.toThrow();
        return;
      }
      game.dispatch(action);
    }
    throw new Error("the bot never cast Sephara");
  });

  it("doesn't shuffle a free Equip back and forth forever", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: new HeuristicBotController(A), [B]: new AutomaticController(B) },
      decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Mountain") })),
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    for (let i = 0; i < 2; i += 1) {
      const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
      game.state.objects[bear].summoningSick = false;
    }
    const greaves = game.debugSpawn("Lightning Greaves", A, "battlefield");
    const turn = game.state.turn.number;

    // Before the fix this exceeded `Game.advance`'s tick budget and threw.
    game.advanceUntil((s) => s.turn.number > turn || s.result.over);
    const equips = game.state.eventLog.filter(
      (e) => e.type === "ability-activated" && e.source === greaves,
    );
    expect(equips).toHaveLength(1);
    expect(game.state.objects[greaves].attachedTo).not.toBeNull();
  });
});
