/**
 * Prosper, Tome-Bound — and the origin zone recorded on `spell-cast` /
 * `land-played` that it rests on.
 *
 * Pact Boon ("whenever you play a card from exile") is the `plays-card`
 * trigger with `from: "exile"`: it has to see a land played off an impulse
 * exile as well as a foretold, suspended or adventure card cast from there,
 * and nothing played from hand. Mystic Arcanum is an impulse exile lasting
 * "until the end of your next turn". The `cast-spell` trigger's own
 * `from`/`notFrom` filter is covered separately at the end.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { defineCard } from "../cards/define.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import { activePlayerOf } from "../state.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const PROSPER = "Prosper, Tome-Bound";

const pad = (cards: readonly string[], land: string): string[] => [
  ...cards,
  ...Array<string>(Math.max(0, 40 - cards.length)).fill(land),
];

const makeGame = (aCards: readonly string[], land = "Mountain", registry = createDefaultRegistry()) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aCards, land) },
      { player: B, cards: pad([], land) },
    ],
  });
  return { game, a };
};

const atMain = (s: GameState): boolean =>
  s.turn.step === "precombat-main" && s.priority.holder === activePlayerOf(s);
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const inHand = (game: Game, name: string): ObjectId => {
  const id = game.handOf(A).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};

const untappedLands = (game: Game, land: string, n: number): void => {
  for (let i = 0; i < n; i += 1) {
    const id = game.debugSpawn(land, A, "battlefield");
    game.state.objects[id].tapped = false;
  }
};

/** Treasures Alice controls, a token stack counted as every token in it. */
const treasures = (game: Game): number =>
  game.state.zones.shared.battlefield
    .map((id) => game.state.objects[id])
    .filter((o) => o.cardName === "Treasure Token" && o.controller === A)
    .reduce((sum, o) => sum + (o.stackCount ?? 1), 0);

const impulseExiled = (game: Game): ObjectId[] =>
  game.state.zones.shared.exile.filter((id) => game.state.objects[id].impulse !== undefined);

describe("Prosper, Tome-Bound — Pact Boon", () => {
  it("a land played from exile makes a Treasure", () => {
    const { game } = makeGame([]);
    game.advanceUntil(atMain);
    game.debugSpawn(PROSPER, A, "battlefield");
    game.debugApplyEffect(A, { kind: "impulse-exile", amount: 1, duration: "your-next-turn" });
    const [exiled] = impulseExiled(game);
    expect(exiled).toBeDefined();

    game.dispatch({ type: "play-land", player: A, card: exiled });
    const played = game.eventsOfType("land-played").find((e) => e.object === exiled);
    expect(played?.from).toBe("exile");
    game.advanceUntil(settled);
    expect(treasures(game)).toBe(1);
  });

  it("a land played or a spell cast from hand makes nothing", () => {
    const { game } = makeGame(["Lightning Bolt"]);
    game.advanceUntil(atMain);
    game.debugSpawn(PROSPER, A, "battlefield");

    game.dispatch({ type: "play-land", player: A, card: inHand(game, "Mountain") });
    const bolt = inHand(game, "Lightning Bolt");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
    });
    expect(game.eventsOfType("spell-cast").find((e) => e.object === bolt)?.from).toBe("hand");
    game.advanceUntil(settled);
    expect(game.state.players[B].life).toBe(17);
    expect(treasures(game)).toBe(0);
  });

  it("a foretold card cast from exile makes a Treasure; foretelling it doesn't", () => {
    const { game } = makeGame(["Behold the Multiverse"], "Island");
    game.advanceUntil(atMain);
    game.debugSpawn(PROSPER, A, "battlefield");
    untappedLands(game, "Island", 2);

    const behold = inHand(game, "Behold the Multiverse");
    game.dispatch({ type: "foretell", player: A, card: behold });
    expect(game.state.objects[behold].zone).toBe("exile");
    game.advanceUntil(settled);
    expect(treasures(game)).toBe(0);

    game.advanceUntil((s) => s.turn.number >= 3 && atMain(s));
    untappedLands(game, "Island", 2);
    game.dispatch({ type: "cast-spell", player: A, card: behold, targets: [], via: "foretell" });
    game.advanceUntil(settled);
    expect(game.graveyardOf(A)).toContain(behold);
    expect(treasures(game)).toBe(1);
  });

  it("a suspended card cast as its last time counter comes off makes a Treasure", () => {
    const { game } = makeGame(["Rift Bolt"]);
    game.advanceUntil(atMain);
    game.debugSpawn(PROSPER, A, "battlefield");
    untappedLands(game, "Mountain", 1);

    const rift = inHand(game, "Rift Bolt");
    game.dispatch({ type: "suspend", player: A, card: rift });
    game.advanceUntil(settled);
    expect(treasures(game)).toBe(0);

    game.advanceUntil((s) => s.turn.number >= 3 && atMain(s));
    const cast = game.eventsOfType("spell-cast").find((e) => e.object === rift);
    expect(cast).toMatchObject({ via: "suspend", from: "exile" });
    expect(treasures(game)).toBe(1);
  });

  it("an adventurer cast from exile makes a Treasure; its adventure from hand doesn't", () => {
    const { game, a } = makeGame(["Beanstalk Giant"], "Forest");
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    game.advanceUntil(atMain);
    game.debugSpawn(PROSPER, A, "battlefield");
    untappedLands(game, "Forest", 10);

    const giant = inHand(game, "Beanstalk Giant");
    game.dispatch({ type: "cast-spell", player: A, card: giant, targets: [], face: 1 });
    game.advanceUntil(settled);
    expect(game.state.objects[giant].onAdventure).toBe(true);
    expect(treasures(game)).toBe(0);

    game.dispatch({ type: "cast-spell", player: A, card: giant, targets: [], via: "adventure" });
    game.advanceUntil(settled);
    expect(game.state.objects[giant].zone).toBe("battlefield");
    expect(treasures(game)).toBe(1);
  });

  it("an opponent playing a card from exile makes nothing", () => {
    const { game } = makeGame([]);
    game.advanceUntil(atMain);
    game.debugSpawn(PROSPER, A, "battlefield");
    game.advanceUntil((s) => s.turn.number === 2 && atMain(s));
    game.debugApplyEffect(B, { kind: "impulse-exile", amount: 1, duration: "end-of-turn" });
    const exiled = game.state.zones.shared.exile.find(
      (id) => game.state.objects[id].impulse?.player === B,
    );
    expect(exiled).toBeDefined();
    if (exiled === undefined) return;
    game.dispatch({ type: "play-land", player: B, card: exiled });
    game.advanceUntil(settled);
    expect(treasures(game)).toBe(0);
  });
});

describe("Prosper, Tome-Bound — Mystic Arcanum", () => {
  it("exiles the top card at your end step, playable until the end of your next turn", () => {
    const { game } = makeGame([]);
    game.advanceUntil(atMain);
    game.debugSpawn(PROSPER, A, "battlefield");
    const libraryTop = game.state.zones.perPlayer[A].library[0];

    // Alice's end step: the top card goes to exile with the permission.
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[libraryTop].zone).toBe("exile");
    expect(game.state.objects[libraryTop].impulse?.player).toBe(A);

    // Still there through Bob's turn, and playable on Alice's next one.
    game.advanceUntil((s) => s.turn.number === 3 && atMain(s));
    expect(game.state.objects[libraryTop].impulse).toBeDefined();
    expect(
      game.legalActions(A).some((x) => x.kind === "play-land" && x.card === libraryTop),
    ).toBe(true);

    // Gone once that turn ends — while the card Mystic Arcanum exiled at
    // this turn's end step keeps its own permission.
    game.advanceUntil((s) => s.turn.number === 4);
    expect(game.state.objects[libraryTop].zone).toBe("exile");
    expect(game.state.objects[libraryTop].impulse).toBeUndefined();
    expect(impulseExiled(game).length).toBe(1);
  });

  it("playing the Mystic Arcanum card on your next turn triggers Pact Boon", () => {
    const { game } = makeGame([]);
    game.advanceUntil(atMain);
    game.debugSpawn(PROSPER, A, "battlefield");
    game.advanceUntil((s) => s.turn.number === 3 && atMain(s));
    const [exiled] = impulseExiled(game);
    game.dispatch({ type: "play-land", player: A, card: exiled });
    game.advanceUntil(settled);
    expect(treasures(game)).toBe(1);
  });
});

describe("cast-spell trigger — from / notFrom", () => {
  const WATCHER = "Test Origin Watcher";
  const registry = createDefaultRegistry().register(
    defineCard({
      name: WATCHER,
      manaCost: "{2}",
      colors: [],
      types: ["artifact"],
      text: "Test-only.",
      triggered: [
        {
          trigger: { on: "cast-spell", who: "you", from: "exile" },
          targets: [],
          effect: { kind: "gain-life", amount: 1 },
          resolve: null,
          text: "Whenever you cast a spell from exile, you gain 1 life.",
        },
        {
          trigger: { on: "cast-spell", who: "you", notFrom: "hand" },
          targets: [],
          effect: { kind: "gain-life", amount: 10 },
          resolve: null,
          text: "Whenever you cast a spell from anywhere other than your hand, you gain 10 life.",
        },
      ],
    }),
  );

  it("tells hand, graveyard and exile apart", () => {
    const { game } = makeGame(["Faithless Looting"], "Mountain", registry);
    game.advanceUntil(atMain);
    game.debugSpawn(WATCHER, A, "battlefield");
    untappedLands(game, "Mountain", 6);
    const life = () => game.state.players[A].life;

    // From hand: neither.
    const looting = inHand(game, "Faithless Looting");
    game.dispatch({ type: "cast-spell", player: A, card: looting, targets: [] });
    game.advanceUntil(settled);
    expect(life()).toBe(20);

    // From the graveyard (flashback): only "not from your hand".
    game.dispatch({ type: "cast-spell", player: A, card: looting, targets: [], via: "flashback" });
    game.advanceUntil(settled);
    expect(life()).toBe(30);

    // From exile (an impulse exile of the Bolt): both.
    const bolt = game.debugSpawn("Lightning Bolt", A, "exile");
    game.state.objects[bolt].impulse = {
      player: A,
      expiry: { kind: "end-of-turn", turn: game.state.turn.number },
    };
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
      via: "impulse",
    });
    game.advanceUntil(settled);
    expect(life()).toBe(41);
  });
});
