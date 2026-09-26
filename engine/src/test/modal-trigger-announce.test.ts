/**
 * A modal triggered ability ("Choose one —") announces its modes as it goes
 * on the stack (rules 603.3c, 700.2b), before its targets, not as it
 * resolves — the `modal` effect's `announced`. Felidar Retreat is the
 * example; Riku of Many Paths' tests cover "up to X" and choosing none.
 *
 * Also the cast trigger's "shares no creature type" clause (Volo, Guide to
 * Monsters), with a test card.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const NOVELTY_TEXT =
  "Whenever you cast a creature spell that shares no creature type with a creature you control or a creature card " +
  "in your graveyard, draw a card.";
const NOVELTY = defineCard({
  name: "Test Novelty Watcher",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: NOVELTY_TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature" }, sharesNoCreatureType: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: NOVELTY_TEXT,
    },
  ],
});

/** A modal trigger that a stack of tokens entering fires many times at once
 * (`PendingTrigger.copies`). */
const WELCOME_TEXT = "Whenever a creature you control enters, choose one — • You gain 1 life. • You gain 2 life.";
const WELCOME = defineCard({
  name: "Test Modal Welcome",
  manaCost: "{1}",
  colors: [],
  types: ["enchantment"],
  text: WELCOME_TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: "You gain 1 life.", effect: { kind: "gain-life", amount: 1 } },
          { text: "You gain 2 life.", effect: { kind: "gain-life", amount: 2 } },
        ],
      },
      resolve: null,
      text: WELCOME_TEXT,
    },
  ],
});

const makeGame = () => {
  const registry = createDefaultRegistry();
  registry.register(NOVELTY);
  registry.register(WELCOME);
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Forest") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

describe("a modal triggered ability announces its modes as it goes on the stack", () => {
  it("asks before the ability is on the stack, and it resolves as chosen without asking again", () => {
    const { game } = makeGame();
    game.debugSpawn("Felidar Retreat", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.awaiting !== null);
    const asked = game.state.awaiting;
    expect(asked?.kind === "choose-modes" ? asked.announcing : null).toBe(true);
    expect(game.state.zones.shared.stack).toHaveLength(0);

    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    const [ability] = game.state.zones.shared.stack;
    expect(game.state.objects[ability].chosenModes).toEqual([0]);
    let askedAgain = false;
    game.advanceUntil((s) => {
      if (s.awaiting !== null) askedAgain = true;
      return quiet(s);
    });
    expect(askedAgain).toBe(false);
    const cats = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Cat Beast Token",
    );
    expect(cats).toHaveLength(1);
  });

  it("each of a trigger's copies — a stack of tokens entering at once — announces its own modes", () => {
    const { game, a } = makeGame();
    game.debugSpawn("Test Modal Welcome", A, "battlefield");
    let asked = 0;
    a.chooseModesFn = () => {
      asked += 1;
      return [asked % 2 === 0 ? 1 : 0];
    };
    const life = game.state.players[A].life;
    game.debugApplyEffect(A, { kind: "create-token", token: "Soldier Token", count: 10 });
    game.advanceUntil(quiet);
    expect(asked).toBe(10);
    expect(game.state.players[A].life).toBe(life + 15);
  });

  it("a choice made on resolution (a Food or a Treasure) is still asked as it resolves", () => {
    const { game } = makeGame();
    game.debugSpawn("Tireless Provisioner", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    // The ability is on the stack, unannounced, and asks as it resolves.
    expect(game.state.zones.shared.stack.length + (game.state.awaiting === null ? 0 : 1)).toBeGreaterThan(0);
    const asked = game.state.awaiting;
    expect(asked?.kind === "choose-modes" ? asked.announcing : undefined).toBeUndefined();
  });
});

describe("a cast trigger's sharesNoCreatureType (Volo, Guide to Monsters)", () => {
  /** Cast `name`; how many cards Alice drew for it. */
  const cast = (game: Game, name: string): number => {
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const drawn = game.state.players[A].cardsDrawnThisTurn;
    game.dispatch({ type: "cast-spell", player: A, card: game.debugSpawn(name, A, "hand") });
    game.advanceUntil(quiet);
    return game.state.players[A].cardsDrawnThisTurn - drawn;
  };

  it("fires for a creature spell sharing no creature type with yours", () => {
    const { game } = makeGame();
    game.debugSpawn("Test Novelty Watcher", A, "battlefield");
    game.debugSpawn("Grizzly Bears", B, "battlefield"); // an opponent's doesn't count
    expect(cast(game, "Grizzly Bears")).toBe(1);
  });

  it("not when a creature you control shares one", () => {
    const { game } = makeGame();
    game.debugSpawn("Test Novelty Watcher", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    expect(cast(game, "Grizzly Bears")).toBe(0);
  });

  it("not when a creature card in your graveyard shares one", () => {
    const { game } = makeGame();
    game.debugSpawn("Test Novelty Watcher", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    expect(cast(game, "Grizzly Bears")).toBe(0);
  });

  it("a changeling you control shares every creature type", () => {
    const { game } = makeGame();
    game.debugSpawn("Test Novelty Watcher", A, "battlefield");
    game.debugSpawn("Morophon, the Boundless", A, "battlefield");
    expect(cast(game, "Grizzly Bears")).toBe(0);
  });
});
