/**
 * Choices that belong to players other than the effect's controller. An
 * `each-player-may` asks each player in a scope in turn, from the active
 * player (rule 101.4) — Kwain, Itinerant Meddler's "each player may draw a
 * card, then each player who drew a card this way gains 1 life", Wernog's
 * "each opponent may investigate. Each opponent who doesn't loses 1 life. You
 * investigate for each opponent who investigated this way", Kynaios and
 * Tiro's "each player may put a land card from their hand onto the
 * battlefield, then each opponent who didn't draws a card", and a punisher
 * asked of each opponent. And `unless` asked of its own controller (The
 * Gitrog Monster's "sacrifice ~ unless you sacrifice a land") or with "or
 * discard a card" among its ways out (Tergrid's Lantern).
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

/** Selvala's shape: "Whenever another creature enters, its controller may
 * draw a card." */
const SELVALA = "Test Heart of the Wilds";
const registry = createDefaultRegistry().register(
  defineCard({
    name: SELVALA,
    manaCost: "{0}",
    types: ["enchantment"],
    text: SELVALA,
    triggered: [
      {
        trigger: { on: "enters-battlefield", who: "any", filter: { type: "creature" }, otherOnly: true },
        targets: [],
        effect: {
          kind: "each-player-may",
          who: "trigger-controller",
          prompt: "Draw a card?",
          effect: { kind: "draw", amount: 1 },
        },
        resolve: null,
        text: SELVALA,
      },
    ],
  }),
);

const setUp = (players: readonly PlayerId[] = [A, B], hands: Partial<Record<PlayerId, readonly string[]>> = {}) => {
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)])) as Record<
    string,
    ScriptedController
  >;
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((player) => ({
      player,
      cards: [...(hands[player] ?? []), ...Array<string>(40).fill("Island")],
    })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, controllers };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
const run = (game: Game, effect: EffectSpec, targets: readonly PlayerId[] = []): ObjectId => {
  const source = game.debugSpawn("Island", A, "battlefield");
  game.debugApplyEffect(
    A,
    effect,
    targets.map((player) => ({ kind: "player", player })),
    { source },
  );
  game.advanceUntil(quiet);
  return source;
};
const yes = () => [0];
const no = () => [];
const hand = (game: Game, player: PlayerId): number => game.handOf(player).length;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const named = (game: Game, player: PlayerId, name: string): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].controller === player && game.state.objects[id].cardName === name,
  );

const KWAIN: EffectSpec = {
  kind: "each-player-may",
  who: "each-player",
  prompt: "Draw a card?",
  effect: { kind: "draw", amount: 1 },
  ifDid: { kind: "gain-life", amount: 1, who: "that-player" },
};
const investigate: EffectSpec = { kind: "create-token", token: "Clue Token", count: 1 };
const WERNOG: EffectSpec = {
  kind: "each-player-may",
  who: "each-opponent",
  prompt: "Investigate?",
  effect: investigate,
  ifDidnt: { kind: "lose-life", amount: 1, who: "that-player" },
  ifDid: investigate,
};
const KYNAIOS: EffectSpec = {
  kind: "each-player-may",
  who: "each-player",
  options: [{ putFromHand: { type: "land" }, text: "Put a land card from your hand onto the battlefield" }],
  ifDidnt: { kind: "draw", amount: 1, who: "that-player" },
  resultsFor: "each-opponent",
};

describe("each player may", () => {
  it("Kwain: each player who drew this way gains 1 life", () => {
    const { game, controllers } = setUp();
    controllers[A].chooseModesFn = yes;
    controllers[B].chooseModesFn = no;
    const [handA, handB] = [hand(game, A), hand(game, B)];
    run(game, KWAIN);
    expect(hand(game, A)).toBe(handA + 1);
    expect(life(game, A)).toBe(21);
    expect(hand(game, B)).toBe(handB);
    expect(life(game, B)).toBe(20);
  });

  it("asks one player at a time, from the active player, each after the last one's choice is done", () => {
    const { game, controllers } = setUp([A, B, C]);
    for (const p of [A, B, C]) controllers[p].chooseModesFn = yes;
    const handA = hand(game, A);
    const source = game.debugSpawn("Island", A, "battlefield");
    game.debugApplyEffect(A, KWAIN, [], { source });
    const askedInTurn: PlayerId[] = [];
    game.advanceUntil((s) => {
      if (s.awaiting?.kind === "choose-modes" && askedInTurn.at(-1) !== s.awaiting.player) {
        askedInTurn.push(s.awaiting.player);
        // Alice has drawn by the time Bob is asked.
        if (s.awaiting.player === B) expect(hand(game, A)).toBe(handA + 1);
      }
      return quiet(s);
    });
    expect(askedInTurn).toEqual([A, B, C]);
    for (const p of [A, B, C]) expect(life(game, p)).toBe(21);
  });

  it("Wernog: the opponents who don't lose 1 life, and you investigate for each who did", () => {
    const { game, controllers } = setUp([A, B, C]);
    controllers[B].chooseModesFn = yes;
    controllers[C].chooseModesFn = no;
    run(game, WERNOG);
    expect(named(game, B, "Clue Token")).toHaveLength(1);
    expect(named(game, C, "Clue Token")).toHaveLength(0);
    expect(named(game, A, "Clue Token")).toHaveLength(1);
    expect(life(game, B)).toBe(20);
    expect(life(game, C)).toBe(19);
    expect(life(game, A)).toBe(20);
  });

  it("Kynaios and Tiro: each opponent who didn't put a land draws; nobody without a land is asked", () => {
    // Alice and Bob hold lands; Carol holds nothing but spells.
    const { game, controllers } = setUp([A, B, C], { [C]: Array<string>(7).fill("Lightning Bolt") });
    controllers[A].chooseModesFn = yes;
    controllers[B].chooseModesFn = no;
    let carolAsked = false;
    controllers[C].chooseModesFn = () => {
      carolAsked = true;
      return [];
    };
    const [handA, handB, handC] = [hand(game, A), hand(game, B), hand(game, C)];
    const landsA = game.state.zones.shared.battlefield.length;
    run(game, KYNAIOS);
    expect(carolAsked).toBe(false);
    // Alice put a land in (and, not being an opponent, draws nothing).
    expect(hand(game, A)).toBe(handA - 1);
    expect(game.state.zones.shared.battlefield.length).toBe(landsA + 2);
    // Bob declined, Carol couldn't: each draws.
    expect(hand(game, B)).toBe(handB + 1);
    expect(hand(game, C)).toBe(handC + 1);
  });

  it("a punisher asked of each opponent: sacrifice a creature or discard a card, or lose 3 life", () => {
    const { game, controllers } = setUp([A, B, C]);
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    controllers[B].chooseModesFn = (_view, _min, _max, texts) => [texts.indexOf("Sacrifice a creature")];
    controllers[C].chooseModesFn = no;
    run(game, {
      kind: "each-player-may",
      who: "each-opponent",
      options: [
        { sacrifice: { type: "creature" }, text: "Sacrifice a creature" },
        { discard: 1, text: "Discard a card" },
      ],
      ifDidnt: { kind: "lose-life", amount: 3, who: "that-player" },
    });
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(life(game, B)).toBe(20);
    expect(life(game, C)).toBe(17);
  });

  it("follow-ups that stop to ask are answered one player at a time", () => {
    const { game, controllers } = setUp([A, B, C]);
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const giant = game.debugSpawn("Hill Giant", C, "battlefield");
    controllers[B].chooseModesFn = no;
    controllers[C].chooseModesFn = no;
    run(game, {
      kind: "sequence",
      effects: [
        {
          kind: "each-player-may",
          who: "each-opponent",
          prompt: "Draw a card?",
          effect: { kind: "draw", amount: 1 },
          ifDidnt: { kind: "sacrifice", who: "that-player", filter: { type: "creature" }, count: 1 },
        },
        { kind: "gain-life", amount: 5 },
      ],
    });
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.objects[giant].zone).toBe("graveyard");
    expect(life(game, A)).toBe(25);
  });
});

describe("its controller may", () => {
  it("Selvala: the entering creature's controller is asked, not the watcher's", () => {
    const { game, controllers } = setUp();
    game.debugSpawn(SELVALA, A, "battlefield");
    let aliceAsked = false;
    controllers[A].chooseModesFn = () => {
      aliceAsked = true;
      return [0];
    };
    controllers[B].chooseModesFn = yes;
    const [handA, handB] = [hand(game, A), hand(game, B)];
    game.debugSpawn("Grizzly Bears", B, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(aliceAsked).toBe(false);
    expect(hand(game, B)).toBe(handB + 1);
    expect(hand(game, A)).toBe(handA);
  });
});

describe("a villainous choice", () => {
  it("each opponent picks one; the pick is the controller's effect, about that player", () => {
    const { game, controllers } = setUp([A, B, C]);
    controllers[B].chooseModesFn = () => [0];
    controllers[C].chooseModesFn = () => [1];
    const [handA, handB] = [hand(game, A), hand(game, B)];
    run(game, {
      kind: "each-player-may",
      who: "each-opponent",
      choices: [
        { text: "You draw a card.", effect: { kind: "draw", amount: 1 } },
        { text: "That player loses 2 life.", effect: { kind: "lose-life", amount: 2, who: "that-player" } },
      ],
    });
    expect(hand(game, A)).toBe(handA + 1);
    expect(hand(game, B)).toBe(handB);
    expect(life(game, B)).toBe(20);
    expect(life(game, C)).toBe(18);
    expect(life(game, A)).toBe(20);
  });
});

describe("unless, asked of others", () => {
  const GITROG: EffectSpec = {
    kind: "unless",
    chooser: "you",
    options: [{ sacrifice: { type: "land" }, text: "Sacrifice a land" }],
    otherwise: { kind: "sacrifice-source" },
  };

  it("The Gitrog Monster: sacrifice a land, or it goes", () => {
    const { game, controllers } = setUp();
    const gitrog = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const land = game.debugSpawn("Forest", A, "battlefield");
    controllers[A].chooseModesFn = yes;
    game.debugApplyEffect(A, GITROG, [], { source: gitrog });
    game.advanceUntil(quiet);
    expect(game.state.objects[gitrog].zone).toBe("battlefield");
    expect(game.state.objects[land].zone).toBe("graveyard");
  });

  it("…declined, or with no land to sacrifice, it's sacrificed", () => {
    const { game, controllers } = setUp();
    const gitrog = game.debugSpawn("Grizzly Bears", A, "battlefield");
    let asked = false;
    controllers[A].chooseModesFn = () => {
      asked = true;
      return [];
    };
    game.debugApplyEffect(A, GITROG, [], { source: gitrog });
    game.advanceUntil(quiet);
    expect(asked).toBe(false);
    expect(game.state.objects[gitrog].zone).toBe("graveyard");

    const again = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const land = game.debugSpawn("Forest", A, "battlefield");
    game.debugApplyEffect(A, GITROG, [], { source: again });
    game.advanceUntil(quiet);
    expect(asked).toBe(true);
    expect(game.state.objects[again].zone).toBe("graveyard");
    expect(game.state.objects[land].zone).toBe("battlefield");
  });

  it("Tergrid's Lantern: with no nonland permanent, discarding is the one way out", () => {
    const { game, controllers } = setUp();
    let offered: readonly string[] = [];
    controllers[B].chooseModesFn = (_view, _min, _max, texts) => {
      offered = texts;
      return [0];
    };
    const handB = hand(game, B);
    run(
      game,
      {
        kind: "unless",
        chooser: 0,
        options: [
          { sacrifice: { notTypes: ["land"] }, text: "Sacrifice a nonland permanent" },
          { discard: 1, text: "Discard a card" },
        ],
        otherwise: { kind: "lose-life", amount: 3, target: 0 },
      },
      [B],
    );
    expect(offered).toEqual(["Discard a card"]);
    expect(hand(game, B)).toBe(handB - 1);
    expect(life(game, B)).toBe(20);
  });

  it("life can be paid down to exactly 0 (rule 119.4)", () => {
    const { game, controllers } = setUp();
    game.state.players[B].life = 3;
    let asked = false;
    controllers[B].chooseModesFn = () => {
      asked = true;
      return [];
    };
    run(
      game,
      {
        kind: "unless",
        chooser: 0,
        options: [{ payLife: 3, text: "Pay 3 life" }],
        otherwise: { kind: "draw", amount: 1 },
      },
      [B],
    );
    expect(asked).toBe(true);
  });
});
