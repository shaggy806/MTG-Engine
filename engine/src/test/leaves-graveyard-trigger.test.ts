/**
 * The batched `leaves-graveyard` trigger — "whenever one or more cards leave
 * your graveyard" (Teval, the Balanced Scale; Tormod, the Desecrator; Imotekh
 * the Stormlord's "one or more artifact cards").
 *
 * The rulings all say the same thing: cards that leave at the same time
 * trigger it once. So the engine announces one `cards-left-graveyard` per
 * simultaneous move — a whole graveyard exiled, every card a "return all"
 * finds, the cards one choice takes, an escape cost, a `simultaneous`
 * sequence — and one per card for a move of its own, whatever took the card
 * out (a cast, a land play, a return, a graveyard ability's cost).
 *
 * The watchers below are test-only permanents, each gaining life when it
 * triggers, so life gained counts the triggers.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId, type ObjectId, type PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const watcher = (name: string, trigger: Record<string, unknown>, effect: EffectSpec) =>
  defineCard({
    name,
    manaCost: "{0}",
    colors: [],
    types: ["enchantment"],
    text: name,
    triggered: [
      {
        trigger: { on: "leaves-graveyard", who: "you", ...trigger } as never,
        targets: [],
        effect,
        resolve: null,
        text: name,
      },
    ],
  });

const gainOne: EffectSpec = { kind: "gain-life", amount: 1 };
/** "Whenever one or more cards leave your graveyard, you gain 1 life." */
const YOURS = "Test Yard Watcher";
/** "… one or more cards leave an opponent's graveyard …" */
const THEIRS = "Test Opponent Yard Watcher";
/** "… one or more cards leave a graveyard …" */
const ANY = "Test Any Yard Watcher";
/** "Whenever one or more artifact cards leave your graveyard, you gain that
 * much life" — one per artifact card. */
const ARTIFACTS = "Test Artifact Yard Watcher";
/** "Whenever one or more creature cards leave your graveyard, …" (Insidious
 * Roots) and its land-card twin. */
const CREATURES = "Test Creature Yard Watcher";
const LANDS = "Test Land Yard Watcher";

const registry = createDefaultRegistry()
  .register(watcher(YOURS, {}, gainOne))
  .register(watcher(THEIRS, { who: "opponent" }, gainOne))
  .register(watcher(ANY, { who: "any" }, gainOne))
  .register(
    watcher(
      ARTIFACTS,
      { filter: { type: "artifact" } },
      { kind: "gain-life", amount: { triggerValue: true } },
    ),
  )
  .register(watcher(CREATURES, { filter: { type: "creature" } }, gainOne))
  .register(watcher(LANDS, { filter: { type: "land" } }, gainOne));

const makeGame = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Mountain") },
      { player: B, cards: Array<string>(40).fill("Mountain") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  return game;
};

/** Put any triggers waiting to go on the stack there, and resolve them. */
const settle = (game: Game): void =>
  game.advanceUntil(
    (s: GameState) =>
      s.pendingTriggers.length === 0 && s.zones.shared.stack.length === 0 && s.awaiting === null,
  );

const lifeOf = (game: Game, player: PlayerId = A): number => game.state.players[player].life;
const triggersOf = (game: Game, source: ObjectId): number =>
  game.eventsOfType("ability-triggered").filter((e) => e.source === source).length;
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const yard = (game: Game, names: readonly string[], player: PlayerId = A): ObjectId[] =>
  names.map((name) => game.debugSpawn(name, player, "graveyard"));
const leftEvents = (game: Game) => game.eventsOfType("cards-left-graveyard");

describe("leaves-graveyard — one trigger per simultaneous move", () => {
  it("a single card returned to hand triggers it once", () => {
    const game = makeGame();
    const w = game.debugSpawn(YOURS, A);
    const [bears] = yard(game, ["Grizzly Bears", "Lightning Bolt"]);
    const life = lifeOf(game);
    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0, from: "graveyard" }, [
      obj(bears),
    ]);
    settle(game);
    expect(game.state.objects[bears].zone).toBe("hand");
    expect(triggersOf(game, w)).toBe(1);
    expect(lifeOf(game)).toBe(life + 1);
    expect(leftEvents(game).at(-1)?.objects).toEqual([bears]);
  });

  it("exiling a whole graveyard is one move, however many cards", () => {
    const game = makeGame();
    const w = game.debugSpawn(YOURS, A);
    const cards = yard(game, ["Grizzly Bears", "Lightning Bolt", "Mountain", "Opt", "Sol Ring"]);
    const life = lifeOf(game);
    game.debugApplyEffect(A, { kind: "exile-graveyard", target: "you" });
    settle(game);
    for (const id of cards) expect(game.state.objects[id].zone).toBe("exile");
    expect(triggersOf(game, w)).toBe(1);
    expect(lifeOf(game)).toBe(life + 1);
    expect(leftEvents(game).at(-1)?.objects).toEqual(cards);
  });

  it("an empty graveyard exiled is no move at all", () => {
    const game = makeGame();
    const w = game.debugSpawn(YOURS, A);
    game.debugApplyEffect(A, { kind: "exile-graveyard", target: "you" });
    settle(game);
    expect(triggersOf(game, w)).toBe(0);
    expect(leftEvents(game)).toHaveLength(0);
  });

  it("\"return all land cards\" moves them at once", () => {
    const game = makeGame();
    const w = game.debugSpawn(YOURS, A);
    const lands = yard(game, ["Forest", "Swamp", "Island"]);
    yard(game, ["Grizzly Bears"]);
    game.debugApplyEffect(A, {
      kind: "return-from-graveyard",
      filter: { type: "land" },
      destination: "battlefield",
      count: "all",
      enterTapped: true,
    });
    settle(game);
    for (const id of lands) expect(game.state.objects[id].zone).toBe("battlefield");
    expect(triggersOf(game, w)).toBe(1);
  });

  it("the cards one choice takes leave together; taking none is no move", () => {
    const game = makeGame();
    const w = game.debugSpawn(YOURS, A);
    const [bears, bolt] = yard(game, ["Grizzly Bears", "Lightning Bolt", "Opt"]);
    const choose: EffectSpec = {
      kind: "look-and-choose",
      zone: "graveyard",
      min: 0,
      max: 2,
      destination: "hand",
      leftover: "stay",
    };
    game.debugApplyEffect(A, choose);
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [bears, bolt] });
    settle(game);
    expect(game.state.objects[bears].zone).toBe("hand");
    expect(game.state.objects[bolt].zone).toBe("hand");
    expect(triggersOf(game, w)).toBe(1);

    game.debugApplyEffect(A, choose);
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [] });
    settle(game);
    expect(triggersOf(game, w)).toBe(1);
  });

  it("two separate instructions are two moves; a `simultaneous` sequence is one", () => {
    const game = makeGame();
    const w = game.debugSpawn(YOURS, A);
    const [a, b, c, d] = yard(game, ["Grizzly Bears", "Lightning Bolt", "Opt", "Sol Ring"]);
    const twoReturns = (simultaneous: boolean): EffectSpec => ({
      kind: "sequence",
      ...(simultaneous ? { simultaneous: true } : {}),
      effects: [
        { kind: "return-to-hand", target: 0, from: "graveyard" },
        { kind: "return-to-hand", target: 1, from: "graveyard" },
      ],
    });
    game.debugApplyEffect(A, twoReturns(false), [obj(a), obj(b)]);
    settle(game);
    expect(triggersOf(game, w)).toBe(2);
    game.debugApplyEffect(A, twoReturns(true), [obj(c), obj(d)]);
    settle(game);
    expect(triggersOf(game, w)).toBe(3);
    for (const id of [a, b, c, d]) expect(game.state.objects[id].zone).toBe("hand");
  });

  it("Victimize returns its two creatures at once", () => {
    const game = makeGame();
    const w = game.debugSpawn(YOURS, A);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Swamp", A);
    game.debugSpawn("Grizzly Bears", A);
    const [x, y] = yard(game, ["Craw Wurm", "Hill Giant"]);
    const victimize = game.debugSpawn("Victimize", A, "hand");
    const offer = game
      .legalActions(A)
      .find((act) => act.kind === "cast-spell" && act.card === victimize);
    expect(offer).toBeDefined();
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: victimize,
      targets: [obj(x), obj(y)],
      sacrifice: game.state.zones.shared.battlefield.find(
        (id) => game.state.objects[id].cardName === "Grizzly Bears",
      ),
    });
    settle(game);
    expect(game.state.objects[x].zone).toBe("battlefield");
    expect(game.state.objects[y].zone).toBe("battlefield");
    expect(triggersOf(game, w)).toBe(1);
  });
});

describe("leaves-graveyard — every way out counts", () => {
  it("casting a card from the graveyard (flashback) is a card leaving it", () => {
    const game = makeGame();
    const w = game.debugSpawn(YOURS, A);
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Mountain", A);
    const [looting] = yard(game, ["Faithless Looting"]);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: looting,
      targets: [],
      via: "flashback",
    });
    expect(triggersOf(game, w)).toBe(1);
  });

  it("an escape cast is two moves: the card to the stack, then the cost's exile", () => {
    const game = makeGame();
    const w = game.debugSpawn(YOURS, A);
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Mountain", A);
    const [hound, ...others] = yard(game, [
      "Underworld Rage-Hound",
      "Grizzly Bears",
      "Lightning Bolt",
      "Opt",
    ]);
    game.dispatch({ type: "cast-spell", player: A, card: hound, targets: [], via: "escape" });
    for (const id of others) expect(game.state.objects[id].zone).toBe("exile");
    expect(triggersOf(game, w)).toBe(2);
    const moves = leftEvents(game).map((e) => [...e.objects].sort());
    expect(moves).toContainEqual([hound]);
    expect(moves).toContainEqual([...others].sort());
  });

  it("playing a land from the graveyard is a card leaving it", () => {
    const game = makeGame();
    const w = game.debugSpawn(YOURS, A);
    game.debugSpawn("Ramunap Excavator", A);
    const [forest] = yard(game, ["Forest"]);
    game.dispatch({ type: "play-land", player: A, card: forest });
    expect(game.state.objects[forest].zone).toBe("battlefield");
    expect(triggersOf(game, w)).toBe(1);
  });

  it("a graveyard ability that exiles its own card as a cost", () => {
    const game = makeGame();
    const w = game.debugSpawn(YOURS, A);
    for (let i = 0; i < 6; i += 1) game.debugSpawn("Plains", A);
    const [lieutenant] = yard(game, ["Kangee's Lieutenant"]);
    const encore = game
      .legalActions(A)
      .find((act) => act.kind === "activate-ability" && act.source === lieutenant);
    expect(encore).toBeDefined();
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: lieutenant,
      abilityIndex: 0,
      targets: [],
    });
    expect(game.state.objects[lieutenant].zone).toBe("exile");
    expect(triggersOf(game, w)).toBe(1);
  });

  it("a card put on top of its owner's library from the graveyard", () => {
    const game = makeGame();
    const w = game.debugSpawn(YOURS, A);
    const [bears] = yard(game, ["Grizzly Bears"]);
    game.debugApplyEffect(A, { kind: "put-on-library", target: 0, position: "top" }, [
      obj(bears),
    ]);
    settle(game);
    expect(game.state.zones.perPlayer[A].library[0]).toBe(bears);
    expect(triggersOf(game, w)).toBe(1);
  });

  it("a card going *into* a graveyard (a mill) is not a card leaving it", () => {
    const game = makeGame();
    const w = game.debugSpawn(YOURS, A);
    game.debugApplyEffect(A, { kind: "mill", target: "you", amount: 3 });
    settle(game);
    expect(triggersOf(game, w)).toBe(0);
  });
});

describe("leaves-graveyard — whose graveyard", () => {
  it("\"your\" graveyard only; an opponent's cards fire the opponent watcher", () => {
    const game = makeGame();
    const mine = game.debugSpawn(YOURS, A);
    const theirs = game.debugSpawn(THEIRS, A);
    yard(game, ["Grizzly Bears", "Opt"], B);
    game.debugApplyEffect(A, { kind: "exile-graveyard", target: 0 }, [
      { kind: "player", player: B },
    ]);
    settle(game);
    expect(triggersOf(game, mine)).toBe(0);
    expect(triggersOf(game, theirs)).toBe(1);
  });

  it("\"exile all graveyards\" is one move for a watcher of any graveyard", () => {
    const game = makeGame();
    const any = game.debugSpawn(ANY, A);
    const mine = game.debugSpawn(YOURS, A);
    const bobs = game.debugSpawn(YOURS, B);
    yard(game, ["Grizzly Bears", "Opt"], A);
    yard(game, ["Lightning Bolt", "Mountain"], B);
    game.debugApplyEffect(A, { kind: "exile-graveyard", target: "each-player" });
    settle(game);
    expect(leftEvents(game)).toHaveLength(1);
    expect(triggersOf(game, any)).toBe(1);
    expect(triggersOf(game, mine)).toBe(1);
    expect(triggersOf(game, bobs)).toBe(1);
  });
});

describe("leaves-graveyard — a filter, read as the cards were in the graveyard", () => {
  it("fires once for the matching cards, and counts only them", () => {
    const game = makeGame();
    const w = game.debugSpawn(ARTIFACTS, A);
    yard(game, ["Sol Ring", "Grizzly Bears", "Mind Stone", "Opt"]);
    const life = lifeOf(game);
    game.debugApplyEffect(A, { kind: "exile-graveyard", target: "you" });
    settle(game);
    expect(triggersOf(game, w)).toBe(1);
    // Two artifact cards: "that much" is two.
    expect(lifeOf(game)).toBe(life + 2);
  });

  it("a move with no matching card doesn't fire", () => {
    const game = makeGame();
    const w = game.debugSpawn(ARTIFACTS, A);
    yard(game, ["Grizzly Bears", "Opt"]);
    game.debugApplyEffect(A, { kind: "exile-graveyard", target: "you" });
    settle(game);
    expect(triggersOf(game, w)).toBe(0);
  });

  it("a creature card that becomes an artifact on the way out was not an artifact card", () => {
    const game = makeGame();
    const w = game.debugSpawn(ARTIFACTS, A);
    const [bears] = yard(game, ["Grizzly Bears"]);
    // Returned and animated into an artifact in one instruction, so the move
    // is announced only once the creature already is one.
    game.debugApplyEffect(
      A,
      {
        kind: "sequence",
        simultaneous: true,
        effects: [
          { kind: "put-onto-battlefield", target: 0 },
          {
            kind: "animate",
            target: 0,
            power: 2,
            toughness: 2,
            addTypes: ["artifact"],
            addSubtypes: [],
            duration: "permanent",
          },
        ],
      },
      [obj(bears)],
    );
    settle(game);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(triggersOf(game, w)).toBe(0);
  });
});

describe("leaves-graveyard — a multi-face card is its front face in the graveyard", () => {
  it("a creature // land card played as its land from the graveyard left as a creature card", () => {
    // Kazandu Mammoth // Kazandu Valley, played as the land through
    // Muldrotha's permission. In the graveyard it had only its front face's
    // characteristics (rule 712.8a): a creature card, not a land card — though
    // the land face is already up by the time the card moves.
    const game = makeGame();
    const creatures = game.debugSpawn(CREATURES, A);
    const lands = game.debugSpawn(LANDS, A);
    game.debugSpawn("Muldrotha, the Gravetide", A);
    const [mammoth] = yard(game, ["Kazandu Mammoth"]);
    const offer = game
      .legalActions(A)
      .find((act) => act.kind === "play-land" && act.card === mammoth);
    if (offer?.kind !== "play-land") throw new Error("no graveyard land play offered");
    expect(offer.face).toBe(1);
    game.dispatch({
      type: "play-land",
      player: A,
      card: mammoth,
      face: 1,
      ...(offer.graveyardGrant !== undefined ? { graveyardGrant: offer.graveyardGrant } : {}),
    });
    settle(game);
    expect(game.state.objects[mammoth].zone).toBe("battlefield");
    expect(triggersOf(game, creatures)).toBe(1);
    expect(triggersOf(game, lands)).toBe(0);
  });
});

describe("leaves-graveyard — a commander returned to hand (rule 903.9b)", () => {
  const returnWithCommander = (toCommandZone: boolean) => {
    const game = makeGame();
    const w = game.debugSpawn(YOURS, A);
    const [cmdr, opt] = yard(game, ["Grizzly Bears", "Opt"]);
    game.state.objects[cmdr].isCommander = true;
    game.debugApplyEffect(A, {
      kind: "look-and-choose",
      zone: "graveyard",
      min: 0,
      max: 2,
      destination: "hand",
      leftover: "stay",
    });
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [cmdr, opt] });
    game.advanceUntil((s) => s.awaiting?.kind === "commander-replacement");
    game.dispatch({ type: "commander-replacement", player: A, toCommandZone });
    settle(game);
    return { game, w, cmdr, opt };
  };

  it.each([true, false])(
    "leaves with the cards returned beside it, whatever its owner answers (command zone: %s)",
    (toCommandZone) => {
      const { game, w, cmdr, opt } = returnWithCommander(toCommandZone);
      expect(game.state.objects[cmdr].zone).toBe(toCommandZone ? "command" : "hand");
      expect(game.state.objects[opt].zone).toBe("hand");
      // One move — the replacement only changed where the commander went.
      expect(triggersOf(game, w)).toBe(1);
      expect(leftEvents(game)).toHaveLength(1);
      expect([...(leftEvents(game)[0]?.objects ?? [])].sort()).toEqual([cmdr, opt].sort());
    },
  );

  it.each([true, false])(
    "a commander returned on its own is one move, not two (command zone: %s)",
    (toCommandZone) => {
      const game = makeGame();
      const w = game.debugSpawn(YOURS, A);
      const [cmdr] = yard(game, ["Grizzly Bears"]);
      game.state.objects[cmdr].isCommander = true;
      game.debugApplyEffect(A, { kind: "return-to-hand", target: 0, from: "graveyard" }, [
        obj(cmdr),
      ]);
      game.advanceUntil((s) => s.awaiting?.kind === "commander-replacement");
      game.dispatch({ type: "commander-replacement", player: A, toCommandZone });
      settle(game);
      expect(game.state.objects[cmdr].zone).toBe(toCommandZone ? "command" : "hand");
      expect(triggersOf(game, w)).toBe(1);
      expect(leftEvents(game)).toHaveLength(1);
    },
  );
});

describe("leaves-graveyard — the watcher itself", () => {
  it("a watcher returned from the graveyard wasn't on the battlefield to see it", () => {
    const game = makeGame();
    const [w, bears] = yard(game, [YOURS, "Grizzly Bears"]);
    game.debugApplyEffect(
      A,
      {
        kind: "sequence",
        simultaneous: true,
        effects: [
          { kind: "put-onto-battlefield", target: 0 },
          { kind: "put-onto-battlefield", target: 1 },
        ],
      },
      [obj(w), obj(bears)],
    );
    settle(game);
    expect(game.state.objects[w].zone).toBe("battlefield");
    expect(triggersOf(game, w)).toBe(0);
    // Once it's there, the next card to leave does trigger it.
    const [opt] = yard(game, ["Opt"]);
    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0, from: "graveyard" }, [
      obj(opt),
    ]);
    settle(game);
    expect(triggersOf(game, w)).toBe(1);
  });
});
