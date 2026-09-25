/**
 * Keywords and abilities spells have on the stack (rule 113.6): a
 * `grantsToSpells` static — Abaddon the Despoiler's "during your turn,
 * spells you cast from your hand with mana value X or less have cascade,
 * where X is the total amount of life your opponents have lost this turn",
 * "spells you cast have lifelink" — and a `grant-keyword` on a spell, Judith,
 * Carnage Connoisseur's "that spell gains deathtouch and lifelink". A
 * spell's lifelink and deathtouch apply to the damage it deals.
 */

import { describe, expect, it } from "vitest";

import type { TriggeredAbility } from "../abilities.js";
import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const CASCADE: TriggeredAbility = {
  trigger: { on: "this-cast" },
  targets: [],
  effect: { kind: "cascade" },
  resolve: null,
  text: "Cascade",
};

const DESPOILER = "Test Despoiler";
const LIFELINKER = "Test Lifelink Banner";
const CONNOISSEUR = "Test Carnage Connoisseur";

const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: DESPOILER,
      manaCost: "{0}",
      types: ["enchantment"],
      text: DESPOILER,
      static: [
        {
          affects: { scope: "self" },
          condition: { kind: "your-turn" },
          grantsToSpells: {
            castFrom: ["hand"],
            filter: { manaValue: { op: "lte", n: { amount: { turnStat: "life-lost", who: "opponent" } } } },
            triggered: [CASCADE],
          },
          text: DESPOILER,
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: LIFELINKER,
      manaCost: "{0}",
      types: ["enchantment"],
      text: "Spells you cast have lifelink.",
      static: [
        { affects: { scope: "self" }, grantsToSpells: { keywords: ["lifelink"] }, text: "Spells you cast have lifelink." },
      ],
    }),
  )
  .register(
    defineCard({
      name: CONNOISSEUR,
      manaCost: "{0}",
      types: ["enchantment"],
      text: CONNOISSEUR,
      triggered: [
        {
          trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
          targets: [],
          effect: {
            kind: "sequence",
            effects: [
              { kind: "grant-keyword", target: "trigger-object", keyword: "deathtouch", duration: "end-of-turn" },
              { kind: "grant-keyword", target: "trigger-object", keyword: "lifelink", duration: "end-of-turn" },
            ],
          },
          resolve: null,
          text: CONNOISSEUR,
        },
      ],
    }),
  );

const setUp = (hand: readonly string[]) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      // Under the opening seven and the first draw: Grizzly Bears — a cascade
      // from a four-drop finds it.
      {
        player: A,
        cards: [...hand, ...Array<string>(8 - hand.length).fill("Mountain"), "Grizzly Bears", ...Array<string>(40).fill("Mountain")],
      },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const inHand = (game: Game, name: string): ObjectId =>
  game.handOf(A).find((id) => game.state.objects[id].cardName === name)!;
const mountains = (game: Game, n: number): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn("Mountain", A, "battlefield");
};

describe("a static that grants cascade to spells", () => {
  it("Abaddon: a spell from hand with mana value up to the life opponents lost cascades", () => {
    // Opening hand: seven cards, the first a Hill Giant ({3}{R}).
    const game = setUp(["Hill Giant", ...Array<string>(6).fill("Mountain")]);
    game.debugSpawn(DESPOILER, A, "battlefield");
    mountains(game, 4);
    game.debugApplyEffect(A, { kind: "lose-life", amount: 4, who: "each-opponent" });
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Hill Giant"), targets: [] });
    game.advanceUntil(quiet);
    expect(game.eventsOfType("cascade-revealed")).toHaveLength(1);
    expect(
      game.state.zones.shared.battlefield.some((id) => game.state.objects[id].cardName === "Grizzly Bears"),
    ).toBe(true);
  });

  it("…but not above that mana value", () => {
    const game = setUp(["Hill Giant", ...Array<string>(6).fill("Mountain")]);
    game.debugSpawn(DESPOILER, A, "battlefield");
    mountains(game, 4);
    game.debugApplyEffect(A, { kind: "lose-life", amount: 3, who: "each-opponent" });
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Hill Giant"), targets: [] });
    game.advanceUntil(quiet);
    expect(game.eventsOfType("cascade-revealed")).toHaveLength(0);
  });
});

describe("keywords on a spell", () => {
  it("spells you cast have lifelink: a Bolt gains its caster 3", () => {
    const game = setUp(["Lightning Bolt"]);
    game.debugSpawn(LIFELINKER, A, "battlefield");
    mountains(game, 1);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Lightning Bolt"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(17);
    expect(game.state.players[A].life).toBe(23);
  });

  it("Judith: that spell gains deathtouch and lifelink", () => {
    const game = setUp(["Lightning Bolt"]);
    game.debugSpawn(CONNOISSEUR, A, "battlefield");
    mountains(game, 1);
    const giant = game.debugSpawn("Hill Giant", B, "battlefield");
    // Hill Giant is a 3/3: make it bigger, so only deathtouch kills it.
    game.state.objects[giant].counters["+1/+1"] = 2;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Lightning Bolt"),
      targets: [{ kind: "object", object: giant }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[giant].zone).toBe("graveyard");
    expect(game.state.players[A].life).toBe(23);
  });

  it("without the grant, a Bolt has neither", () => {
    const game = setUp(["Lightning Bolt"]);
    mountains(game, 1);
    const giant = game.debugSpawn("Hill Giant", B, "battlefield");
    game.state.objects[giant].counters["+1/+1"] = 2;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Lightning Bolt"),
      targets: [{ kind: "object", object: giant }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[giant].zone).toBe("battlefield");
    expect(game.state.players[A].life).toBe(20);
  });
});
