/**
 * The EDH-popularity backlog's first bulk-authoring pass
 * (`neededCards-features.md`) — 53 top-200 Commander staples, almost all of
 * them expressible with the vocabulary already in the engine. The one new
 * piece of engine surface is `TriggerSpec.on: "becomes-tapped"` (rule
 * 701.21a), which City of Brass needs and a `predicate` trigger can't express:
 * a predicate sees only the raw event, not which permanent carries the
 * ability, so two Cities on the battlefield would each fire for the other's
 * tapping. It also can't be a `painToController` rider on the mana ability —
 * City of Brass hurts however it got tapped, including when tapped to pay a
 * cost rather than activated on its own.
 *
 * The land cycles (shock/fetch/check/pain/BFZ-dual) are pure `helpers.ts`
 * calls already covered by the P0/P1 land tests and `card:verify`; what's
 * tested here is the new trigger plus the cards that assemble existing pieces
 * in a new shape.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const atFirstMain = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A;

const makeGame = (
  aCards: readonly string[] = [],
  bCards: readonly string[] = [],
  configure: (controller: ScriptedController) => void = () => {},
): Game => {
  const alice = new ScriptedController(A);
  configure(alice);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    controllers: { [A]: alice, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad(bCards) },
    ],
  });
  game.advanceUntil(atFirstMain);
  return game;
};

/** A trigger that fired with an empty stack is still only *pending* — nothing
 * is on the stack yet, so the plain "stack empty and nothing awaited" test
 * would report the game settled before the trigger ever resolved. Wait for it
 * to reach the stack first. */
const settle = (game: Game): void => {
  if (game.state.pendingTriggers.length > 0) {
    game.advanceUntil((s) => s.pendingTriggers.length === 0);
  }
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
};

const lifeOf = (game: Game, player: PlayerId): number => game.state.players[player].life;

const handCard = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.state.zones.perPlayer[player].hand.find(
    (x) => game.state.objects[x].cardName === name,
  );
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};

/** Activate the one ability of `source` whose printed text matches. */
const activate = (game: Game, player: PlayerId, source: ObjectId, match: string): void => {
  const action = game
    .legalActions(player)
    .find((a) => a.kind === "activate-ability" && a.source === source && a.text.includes(match));
  if (action === undefined || action.kind !== "activate-ability") {
    throw new Error(`no ability matching "${match}" on ${source}`);
  }
  game.dispatch({
    type: "activate-ability",
    player,
    source,
    abilityIndex: action.abilityIndex,
    targets: [],
  });
};

describe("City of Brass — the becomes-tapped trigger", () => {
  it("deals 1 damage to its controller when tapped for mana", () => {
    const game = makeGame();
    const city = game.debugSpawn("City of Brass", A);

    activate(game, A, city, "Add one mana of any color");
    settle(game);

    expect(game.state.objects[city].tapped).toBe(true);
    expect(lifeOf(game, A)).toBe(19);
  });

  it("fires when it is tapped to pay a cost, not only on a standalone activation", () => {
    // The auto-payer taps mana sources through a different code path than a
    // player activating the ability directly; the trigger keys off the tap
    // event, so both charge the life.
    const game = makeGame(["Lightning Bolt"]);
    const city = game.debugSpawn("City of Brass", A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, A, "Lightning Bolt"),
      targets: [{ kind: "player", player: B }],
    });
    settle(game);

    expect(game.state.objects[city].tapped).toBe(true);
    expect(lifeOf(game, A)).toBe(19);
    expect(lifeOf(game, B)).toBe(17);
  });

  it("charges only the controller of the City that was actually tapped", () => {
    const game = makeGame();
    const mine = game.debugSpawn("City of Brass", A);
    game.debugSpawn("City of Brass", B);

    activate(game, A, mine, "Add one mana of any color");
    settle(game);

    expect(lifeOf(game, A)).toBe(19);
    expect(lifeOf(game, B)).toBe(20);
  });
});

describe("Ancient Tomb", () => {
  it("adds two colorless and deals 2 damage to its controller", () => {
    const game = makeGame();
    const tomb = game.debugSpawn("Ancient Tomb", A);

    activate(game, A, tomb, "Add {C}{C}");
    settle(game);

    expect(lifeOf(game, A)).toBe(18);
    expect(game.state.players[A].manaPool.C).toBe(2);
  });
});

describe("Talisman of Dominance", () => {
  it("taps for colorless painlessly, or for a color at the cost of 1 life", () => {
    const painless = makeGame();
    const t1 = painless.debugSpawn("Talisman of Dominance", A);
    activate(painless, A, t1, "Add {C}");
    settle(painless);
    expect(painless.state.players[A].manaPool.C).toBe(1);
    expect(lifeOf(painless, A)).toBe(20);

    const painful = makeGame();
    const t2 = painful.debugSpawn("Talisman of Dominance", A);
    activate(painful, A, t2, "Add {U}");
    settle(painful);
    expect(painful.state.players[A].manaPool.U).toBe(1);
    expect(lifeOf(painful, A)).toBe(19);
  });
});

describe("Blood Artist", () => {
  it("drains a chosen player whenever a creature dies — its own death included", () => {
    const game = makeGame([], [], (alice) => {
      alice.chooseTargetsFn = () => [{ kind: "player", player: B }];
    });
    const altar = game.debugSpawn("Ashnod's Altar", A);
    const artist = game.debugSpawn("Blood Artist", A);
    const bears = game.debugSpawn("Grizzly Bears", A);

    // Another creature dying.
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: altar,
      abilityIndex: 0,
      targets: [],
      sacrifice: bears,
    });
    settle(game);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(lifeOf(game, B)).toBe(19);
    expect(lifeOf(game, A)).toBe(21);

    // Then Blood Artist itself — "this creature **or another**" (rule 603.10:
    // a leaves-the-battlefield trigger looks back at the game before the
    // sacrifice, so its own death still sees it on the battlefield).
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: altar,
      abilityIndex: 0,
      targets: [],
      sacrifice: artist,
    });
    settle(game);
    expect(game.state.objects[artist].zone).toBe("graveyard");
    expect(lifeOf(game, B)).toBe(18);
    expect(lifeOf(game, A)).toBe(22);
  });
});

describe("Mind Stone", () => {
  it("sacrifices itself to draw a card", () => {
    const game = makeGame();
    const stone = game.debugSpawn("Mind Stone", A);
    game.debugSpawn("Island", A);
    const handBefore = game.state.zones.perPlayer[A].hand.length;

    activate(game, A, stone, "Draw a card");
    settle(game);

    expect(game.state.objects[stone].zone).toBe("graveyard");
    expect(game.state.zones.perPlayer[A].hand.length).toBe(handBefore + 1);
  });
});

describe("Generous Gift", () => {
  it("destroys any permanent and gives its controller a 3/3 Elephant", () => {
    const game = makeGame(["Generous Gift"]);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Command Tower", A);
    const target = game.debugSpawn("Grizzly Bears", B);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, A, "Generous Gift"),
      targets: [{ kind: "object", object: target }],
    });
    settle(game);

    expect(game.state.objects[target].zone).toBe("graveyard");
    const tokens = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].isToken === true,
    );
    expect(tokens).toHaveLength(1);
    expect(game.state.objects[tokens[0]].controller).toBe(B);
    expect(game.state.objects[tokens[0]].cardName).toBe("Elephant Token");
  });
});

describe("Solemn Simulacrum", () => {
  it("fetches a basic land tapped as it enters", () => {
    // The ETB is a "you may" — `chooseModesFn` takes the offer (the scripted
    // default declines every optional mode) and `chooseFromZoneFn` actually
    // picks a card out of the search (the default takes the `min`, which is 0
    // for an "up to one" search).
    const game = makeGame(["Solemn Simulacrum"], [], (alice) => {
      alice.chooseModesFn = () => [0];
      alice.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    });
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Command Tower", A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, A, "Solemn Simulacrum"),
    });
    settle(game);

    const fetched = game.state.zones.shared.battlefield.filter(
      (id) =>
        game.state.objects[id].controller === A &&
        game.state.objects[id].cardName === "Island",
    );
    expect(fetched).toHaveLength(1);
    expect(game.state.objects[fetched[0]].tapped).toBe(true);
  });
});
