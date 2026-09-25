/**
 * Delayed triggers beyond "at the beginning of the next end step" and "when
 * it dies":
 *
 * - keyed to the controller's next spell this turn (`at: { nextSpell }`),
 *   whose trigger object is that spell — Yuna, Grand Summoner's "when you
 *   next cast a creature spell this turn, that creature enters with two
 *   additional +1/+1 counters on it" (`enters-with-counters`), Codie,
 *   Vociferous Codex's "when you cast your next spell this turn, exile cards
 *   … until you exile an instant or sorcery card with lesser mana value.
 *   Until end of turn, you may cast that card without paying its mana cost"
 *   (`reveal-until` and `allow-cast-from-exile`);
 * - carrying the creating ability's trigger object — Shirei, Shizo's
 *   Caretaker's "you may return that card to the battlefield … at the
 *   beginning of the next end step if Shirei is still on the battlefield"
 *   (the `source-on-battlefield` condition).
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** "Whenever a creature you control with power 1 or less dies, return that
 * card to the battlefield at the beginning of the next end step if this is
 * still on the battlefield." */
const CARETAKER = "Test Shrine Caretaker";
const registry = createDefaultRegistry().register(
  defineCard({
    name: CARETAKER,
    manaCost: "{0}",
    types: ["enchantment"],
    text: CARETAKER,
    triggered: [
      {
        trigger: { on: "dies", who: "you-control", filter: { type: "creature", power: { op: "lte", n: 1 } } },
        targets: [],
        effect: {
          kind: "delayed-trigger",
          at: "next-end-step",
          effect: {
            kind: "conditional",
            condition: { kind: "source-on-battlefield" },
            then: { kind: "put-onto-battlefield", target: "trigger-object" },
          },
          text: "Return that card to the battlefield.",
        },
        resolve: null,
        text: CARETAKER,
      },
    ],
  }),
);

const setUp = (library: readonly string[] = [], hand: readonly string[] = []) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      {
        player: A,
        // Seven in hand and one drawn; then `library` is on top.
        cards: [...hand, ...Array<string>(8 - hand.length).fill("Mountain"), ...library, ...Array<string>(30).fill("Mountain")],
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
const lands = (game: Game, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, A, "battlefield");
};
const delay = (game: Game, effect: EffectSpec): void => {
  const source = game.debugSpawn("Island", A, "battlefield");
  game.debugApplyEffect(A, effect, [], { source });
};
const cast = (game: Game, name: string): ObjectId => {
  const card = inHand(game, name);
  game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
  game.advanceUntil(quiet);
  return card;
};

describe("when you next cast a spell this turn", () => {
  const YUNA: EffectSpec = {
    kind: "delayed-trigger",
    at: { nextSpell: { type: "creature" } },
    effect: { kind: "enters-with-counters", target: "trigger-object", counter: "+1/+1", amount: 2 },
    text: "That creature enters with two additional +1/+1 counters on it.",
  };

  it("Yuna: the next creature spell enters with two more counters — once", () => {
    const game = setUp([], ["Lightning Bolt", "Grizzly Bears", "Grizzly Bears"]);
    lands(game, "Mountain", 1);
    lands(game, "Forest", 4);
    delay(game, YUNA);
    // A Bolt isn't a creature spell: it doesn't use it up.
    const bolt = inHand(game, "Lightning Bolt");
    game.dispatch({ type: "cast-spell", player: A, card: bolt, targets: [{ kind: "player", player: B }] });
    game.advanceUntil(quiet);
    const first = cast(game, "Grizzly Bears");
    expect(game.state.objects[first].counters["+1/+1"]).toBe(2);
    const second = cast(game, "Grizzly Bears");
    expect(game.state.objects[second].counters["+1/+1"] ?? 0).toBe(0);
  });

  it("…this turn only", () => {
    const game = setUp([], ["Grizzly Bears"]);
    delay(game, YUNA);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    lands(game, "Forest", 2);
    const bears = cast(game, "Grizzly Bears");
    expect(game.state.objects[bears].counters["+1/+1"] ?? 0).toBe(0);
    expect(game.state.delayedTriggers).toHaveLength(0);
  });

  it("Codie: exile until a cheaper instant or sorcery, and cast it free", () => {
    const game = setUp(["Grizzly Bears", "Hill Giant", "Lightning Bolt"], ["Hill Giant"]);
    lands(game, "Mountain", 4);
    delay(game, {
      kind: "delayed-trigger",
      at: { nextSpell: {} },
      effect: {
        kind: "reveal-until",
        exile: true,
        filter: {
          typesAnyOf: ["instant", "sorcery"],
          manaValue: { op: "lt", n: { amount: { manaValueOf: "trigger-object" } } },
        },
        then: { kind: "allow-cast-from-exile", target: 0, free: true },
        rest: "bottom-random",
        keepFound: true,
      },
      text: "Exile until an instant or sorcery with lesser mana value; cast it free this turn.",
    });
    cast(game, "Hill Giant");
    const bolt = game.state.zones.shared.exile.find((id) => game.state.objects[id].cardName === "Lightning Bolt");
    expect(bolt).toBeDefined();
    // The two cards before it went to the bottom.
    const library = game.state.zones.perPlayer[A].library.map((id) => game.state.objects[id].cardName);
    expect(library.slice(-2).sort()).toEqual(["Grizzly Bears", "Hill Giant"]);
    // Offered free — and only free.
    const offers = game
      .legalActions(A)
      .filter((o) => o.kind === "cast-spell" && o.card === bolt)
      .map((o) => (o.kind === "cast-spell" && o.free === true ? "free" : "paid"));
    expect(offers).toEqual(["free"]);
  });
});

describe("a delayed trigger that carries its creator's trigger object", () => {
  it("Shirei: that card comes back at the next end step", () => {
    const game = setUp();
    game.debugSpawn(CARETAKER, A, "battlefield");
    const elves = game.debugSpawn("Llanowar Elves", A, "battlefield");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: elves }]);
    game.advanceUntil(quiet);
    expect(game.state.objects[elves].zone).toBe("graveyard");
    game.advanceUntil((s) => s.turn.step === "cleanup");
    expect(game.state.objects[elves].zone).toBe("battlefield");
  });

  it("…not if the caretaker has left", () => {
    const game = setUp();
    const caretaker = game.debugSpawn(CARETAKER, A, "battlefield");
    const elves = game.debugSpawn("Llanowar Elves", A, "battlefield");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: elves }]);
    game.advanceUntil(quiet);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: caretaker }]);
    game.advanceUntil((s) => s.turn.step === "cleanup");
    expect(game.state.objects[elves].zone).toBe("graveyard");
  });

  it("…nor if the card has left its graveyard since", () => {
    const game = setUp();
    game.debugSpawn(CARETAKER, A, "battlefield");
    const elves = game.debugSpawn("Llanowar Elves", A, "battlefield");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: elves }]);
    game.advanceUntil(quiet);
    game.debugApplyEffect(A, { kind: "put-on-library", target: 0, position: "top" }, [
      { kind: "object", object: elves },
    ]);
    game.debugApplyEffect(A, { kind: "mill", target: "you", amount: 1 });
    expect(game.state.objects[elves].zone).toBe("graveyard");
    game.advanceUntil((s) => s.turn.step === "cleanup");
    expect(game.state.objects[elves].zone).toBe("graveyard");
  });
});
