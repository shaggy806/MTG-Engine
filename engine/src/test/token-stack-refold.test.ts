import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { defineCard } from "../cards/define.js";
import { computeCharacteristics, turnStatOf } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameObject } from "../state.js";

/**
 * A token stack is a representation, not a rule: each token in it is still
 * its own object (rule 111), so how the engine groups them must never change
 * what happens. Two halves of that are tested here.
 *
 * - A token split off a stack goes back into one once nothing tells it apart
 *   any more. A trigger that fires once per token and puts counters on "it"
 *   (Tribute to the World Tree) peels each token off in turn, and every one
 *   ends up with the same counters: the stack used to stay in pieces, one
 *   object per token, for good when there were fewer than eight of them.
 * - Counters put on every token of a stack at once are put on each token, so
 *   a "whenever counters are put on a creature" watcher fires once per token
 *   (Simic Ascendancy, Hapatra), not once per stack.
 */

const [A, B] = ["alice", "bob"].map(asPlayerId);
const WARRIOR = "Warrior Token";
const registry = createDefaultRegistry();

function table(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { maxHandSize: 99 },
    decks: [A, B].map((player) => ({ player, cards: Array<string>(60).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

function lands(game: Game, player: PlayerId, name: string, count: number): void {
  for (let i = 0; i < count; i += 1) game.debugSpawn(name, player, "battlefield");
}

function pass(game: Game): void {
  game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
}

/** Pass priority until the stack is empty, answering nothing. */
function resolveStack(game: Game): void {
  for (let i = 0; i < 400 && game.state.zones.shared.stack.length > 0; i += 1) {
    if (game.state.awaiting !== null) throw new Error(`unexpected ${game.state.awaiting.kind} decision`);
    pass(game);
  }
  expect(game.state.zones.shared.stack).toHaveLength(0);
}

function cast(game: Game, player: PlayerId, name: string, targets: ObjectId[] = [], xValue?: number): void {
  const card = game.debugSpawn(name, player, "hand");
  game.dispatch({
    type: "cast-spell",
    player,
    card,
    targets: targets.map((object) => ({ kind: "object", object })),
    ...(xValue !== undefined ? { xValue } : {}),
  });
}

/** Secure the Wastes for `x`: X Warrior tokens, one entry, one stack. */
function secureTheWastes(game: Game, x: number): void {
  lands(game, A, "Plains", x + 1);
  cast(game, A, "Secure the Wastes", [], x);
  resolveStack(game);
}

const objectsNamed = (game: Game, name: string, controller: PlayerId = A): GameObject[] =>
  game.state.zones.shared.battlefield
    .map((id) => game.state.objects[id])
    .filter((o) => o.cardName === name && o.controller === controller);

const tokenCount = (objects: readonly GameObject[]): number =>
  objects.reduce((n, o) => n + (o.stackCount ?? 1), 0);

const stackOf = (game: Game, name: string, controller: PlayerId = A): ObjectId => {
  const all = objectsNamed(game, name, controller);
  if (all.length !== 1) throw new Error(`expected one ${name} object, found ${all.length}`);
  return all[0].id;
};

describe("a token split off a stack folds back once it's identical again", () => {
  it("Tribute to the World Tree's counters on each Warrior leave one stack of ten", () => {
    const game = table();
    game.debugSpawn("Tribute to the World Tree", A, "battlefield");

    secureTheWastes(game, 10);

    // Ten triggers, each putting two counters on one Warrior: all ten got
    // them, and nothing tells one from another.
    const warriors = objectsNamed(game, WARRIOR);
    expect(tokenCount(warriors)).toBe(10);
    expect(warriors).toHaveLength(1);
    expect(warriors[0].stackCount).toBe(10);
    expect(warriors[0].counters["+1/+1"]).toBe(2);
    const c = computeCharacteristics(game.state, registry, warriors[0].id);
    expect([c.power, c.toughness]).toEqual([3, 3]);
  });

  it("three Warriors joining a stack of ten end up a stack of three beside it", () => {
    // Fewer than eight, and none of them a stack once peeled off: the end-of-
    // turn fold never put these back together.
    const game = table();
    secureTheWastes(game, 10);
    const ten = stackOf(game, WARRIOR);
    game.debugSpawn("Tribute to the World Tree", A, "battlefield");

    // The three fold into the ten as they enter (one stack of 13); Tribute
    // triggers three times, and each puts its counters on one of them.
    secureTheWastes(game, 3);

    const warriors = objectsNamed(game, WARRIOR);
    expect(tokenCount(warriors)).toBe(13);
    expect(warriors).toHaveLength(2);
    const plain = warriors.find((o) => o.counters["+1/+1"] === undefined);
    const grown = warriors.find((o) => o.counters["+1/+1"] === 2);
    expect(plain?.id).toBe(ten);
    expect(plain?.stackCount).toBe(10);
    expect(grown?.stackCount).toBe(3);
  });

  it("two Warriors each given a counter by its own Battlegrowth become one stack of two", () => {
    const game = table();
    secureTheWastes(game, 10);
    const stack = stackOf(game, WARRIOR);
    lands(game, A, "Forest", 2);

    cast(game, A, "Battlegrowth", [stack]);
    resolveStack(game);
    cast(game, A, "Battlegrowth", [stack]);
    resolveStack(game);

    const warriors = objectsNamed(game, WARRIOR);
    expect(tokenCount(warriors)).toBe(10);
    expect(warriors).toHaveLength(2);
    expect(game.state.objects[stack].stackCount).toBe(8);
    const grown = warriors.find((o) => o.id !== stack);
    expect(grown?.stackCount).toBe(2);
    expect(grown?.counters["+1/+1"]).toBe(1);
  });

  it("doesn't fold a token something still names by id: an Aura's host stays its own", () => {
    const game = table();
    secureTheWastes(game, 10);
    const stack = stackOf(game, WARRIOR);
    lands(game, A, "Forest", 2);

    cast(game, A, "Battlegrowth", [stack]);
    resolveStack(game);
    const first = objectsNamed(game, WARRIOR).find((o) => o.id !== stack);
    if (first === undefined) throw new Error("no Warrior split off");
    // Enchanted, it's one particular Warrior (an Aura on a whole stack would
    // be on every token of it).
    const aura = game.debugSpawn("Holy Strength", A, "battlefield");
    game.state.objects[aura].attachedTo = first.id;
    cast(game, A, "Battlegrowth", [stack]);
    resolveStack(game);

    const grown = objectsNamed(game, WARRIOR).filter((o) => o.id !== stack);
    expect(grown).toHaveLength(2);
    expect(grown.every((o) => (o.stackCount ?? 1) === 1)).toBe(true);
    expect(game.state.objects[aura].attachedTo).toBe(first.id);
  });

  it("keeps what entered this turn countable: Thalisse still sees ten tokens made", () => {
    // The fold keeps the stack that entered — the object the turn's history
    // names — and folds the split-off tokens into it, not the other way round.
    const game = table();
    game.debugSpawn("Tribute to the World Tree", A, "battlefield");
    game.debugSpawn("Thalisse, Reverent Medium", A, "battlefield");

    secureTheWastes(game, 10);
    expect(objectsNamed(game, WARRIOR)).toHaveLength(1);
    game.advanceUntil(
      (s) => s.turn.step === "end" && s.zones.shared.stack.length === 0 && s.pendingTriggers.length === 0,
    );

    expect(tokenCount(objectsNamed(game, "Spirit Token"))).toBe(10);
  });
});

describe("counters put on a whole stack are put on each token in it", () => {
  it("Simic Ascendancy gets a growth counter for each Warrior Basri's Solidarity grows", () => {
    const game = table();
    secureTheWastes(game, 10);
    const ascendancy = game.debugSpawn("Simic Ascendancy", A, "battlefield");
    lands(game, A, "Plains", 2);

    cast(game, A, "Basri's Solidarity");
    resolveStack(game);

    // Still one stack of ten, each with its counter.
    const stack = stackOf(game, WARRIOR);
    expect(game.state.objects[stack].stackCount).toBe(10);
    expect(game.state.objects[stack].counters["+1/+1"]).toBe(1);
    // "Whenever one or more +1/+1 counters are put on a creature you control,
    // put that many growth counters": ten creatures, one counter each.
    expect(game.state.objects[ascendancy].counters.growth).toBe(10);
  });

  it("proliferating a stack keeps it one stack, and Simic Ascendancy sees every token", () => {
    const game = table();
    secureTheWastes(game, 10);
    lands(game, A, "Plains", 2);
    cast(game, A, "Basri's Solidarity");
    resolveStack(game);
    const ascendancy = game.debugSpawn("Simic Ascendancy", A, "battlefield");
    lands(game, A, "Island", 2);

    cast(game, A, "Contentious Plan");
    for (let i = 0; i < 20 && game.state.awaiting?.kind !== "proliferate"; i += 1) pass(game);
    const stack = stackOf(game, WARRIOR);
    game.dispatch({ type: "proliferate", player: A, chosen: [{ kind: "object", object: stack }] });
    resolveStack(game);

    expect(stackOf(game, WARRIOR)).toBe(stack);
    expect(game.state.objects[stack].stackCount).toBe(10);
    expect(game.state.objects[stack].counters["+1/+1"]).toBe(2);
    expect(game.state.objects[ascendancy].counters.growth).toBe(10);
  });

  it("each Dragon entering with Dragonstorm Globe's counter grows Simic Ascendancy, stacked or not", () => {
    // Entering with counters is having them put on it (rule 122.6). Ten
    // Dragons made at once are one new stack; three more fold into it.
    const game = table();
    game.debugSpawn("Dragonstorm Globe", A, "battlefield");
    const ascendancy = game.debugSpawn("Simic Ascendancy", A, "battlefield");
    const settle = (): void => {
      for (let i = 0; i < 50 && (game.state.zones.shared.stack.length > 0 || game.state.pendingTriggers.length > 0); i += 1) {
        pass(game);
      }
    };

    game.debugApplyEffect(A, { kind: "create-token", token: "Dragon Token", count: 10 });
    settle();
    expect(game.state.objects[ascendancy].counters.growth).toBe(10);

    game.debugApplyEffect(A, { kind: "create-token", token: "Dragon Token", count: 3 });
    settle();
    const dragons = stackOf(game, "Dragon Token");
    expect(game.state.objects[dragons].stackCount).toBe(13);
    expect(game.state.objects[dragons].counters["+1/+1"]).toBe(1);
    // Three more, not thirteen: the ten already there got nothing.
    expect(game.state.objects[ascendancy].counters.growth).toBe(13);
  });

  it("Hapatra makes a Snake for each token Black Sun's Zenith puts a -1/-1 counter on", () => {
    const game = table();
    const hapatra = game.debugSpawn("Hapatra, Vizier of Poisons", A, "battlefield");
    game.debugApplyEffect(B, { kind: "create-token", token: WARRIOR, count: 10 });
    expect(objectsNamed(game, WARRIOR, B)).toHaveLength(1);
    lands(game, A, "Swamp", 3);

    cast(game, A, "Black Sun's Zenith", [], 1);
    resolveStack(game);

    // Ten Warriors and Hapatra herself each got one: eleven creatures.
    expect(game.state.objects[hapatra].counters["-1/-1"]).toBe(1);
    expect(tokenCount(objectsNamed(game, "Deathtouch Snake Token"))).toBe(11);
  });

  it("a stack's own 'counters put on this' fires for the tokens that got them: a joining batch's, not the stack's", () => {
    // No stackable token in the pool watches its own counters, so a test
    // enchantment grants one to every creature: "Whenever one or more +1/+1
    // counters are put on this creature, you gain 1 life."
    const local = createDefaultRegistry();
    local.register(
      defineCard({
        name: "Test Counter Watcher Grantor",
        manaCost: "{1}",
        colors: [],
        types: ["enchantment"],
        text: "Creatures you control have \"Whenever one or more +1/+1 counters are put on this creature, you gain 1 life.\"",
        static: [
          {
            affects: { scope: "creatures-you-control" },
            grantsTriggered: [
              {
                trigger: { on: "counters-put", who: "self", counter: "+1/+1" },
                targets: [],
                effect: { kind: "gain-life", amount: 1 },
                resolve: null,
                text: "Whenever one or more +1/+1 counters are put on this creature, you gain 1 life.",
              },
            ],
            text: "Creatures you control have the ability.",
          },
        ],
      }),
    );
    const game = Game.create({
      seed: 1,
      shuffle: false,
      registry: local,
      rules: { maxHandSize: 99 },
      decks: [A, B].map((player) => ({ player, cards: Array<string>(60).fill("Island") })),
    });
    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
    game.debugSpawn("Dragonstorm Globe", A, "battlefield");
    game.debugSpawn("Test Counter Watcher Grantor", A, "battlefield");
    const settle = (): void => {
      for (let i = 0; i < 50 && (game.state.zones.shared.stack.length > 0 || game.state.pendingTriggers.length > 0); i += 1) {
        pass(game);
      }
    };
    const life = game.state.players[A].life;

    // Ten Dragons, one new stack, each entering with a counter: ten.
    game.debugApplyEffect(A, { kind: "create-token", token: "Dragon Token", count: 10 });
    settle();
    expect(game.state.players[A].life).toBe(life + 10);

    // Three more fold into it, each with its counter: three, not thirteen.
    game.debugApplyEffect(A, { kind: "create-token", token: "Dragon Token", count: 3 });
    settle();
    expect(game.state.objects[stackOf(game, "Dragon Token")].stackCount).toBe(13);
    expect(game.state.players[A].life).toBe(life + 13);
  });
});

describe("a token that attacked waits for cleanup to fold back", () => {
  it("two Warriors attacking in both of two combats are two creatures that attacked, not three", () => {
    // Windbrisk Heights' "if you attacked with three or more creatures this
    // turn" counts each creature once over the turn (the `attackers` turn
    // stat, kept by object). Folded back together after the first combat,
    // the two would attack in the second as one object and a fresh token
    // split off it — a third creature as far as the count could tell.
    const game = Game.create({
      seed: 1,
      shuffle: false,
      registry,
      rules: { maxHandSize: 99 },
      controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
      decks: [A, B].map((player) => ({ player, cards: Array<string>(60).fill("Mountain") })),
    });
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
    game.debugApplyEffect(A, { kind: "create-token", token: WARRIOR, count: 10 });
    const stack = stackOf(game, WARRIOR);
    game.advanceUntil((s) => s.turn.number === 3 && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: stack, defender: B, count: 2 }] });
    game.advanceUntil(
      (s) =>
        s.turn.number === 3 &&
        s.turn.step === "postcombat-main" &&
        s.priority.holder === A &&
        s.zones.shared.stack.length === 0,
    );
    expect(turnStatOf(game.state, A, "attackers")).toBe(2);
    // Still two objects, each named by the turn's attackers.
    expect(objectsNamed(game, WARRIOR).filter((o) => o.attackedThisTurn === true)).toHaveLength(2);

    // Relentless Assault: untap them, and a second combat.
    lands(game, A, "Mountain", 4);
    cast(game, A, "Relentless Assault");
    game.advanceUntil((s) => s.turn.number === 3 && s.awaiting?.kind === "attackers");
    const attacked = objectsNamed(game, WARRIOR).filter((o) => o.attackedThisTurn === true);
    expect(tokenCount(attacked)).toBe(2);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: attacked.map((o) => ({ attacker: o.id, defender: B })),
    });
    expect(turnStatOf(game.state, A, "attackers")).toBe(2);

    // At cleanup they fold back, into a stack of their own beside the eight.
    game.advanceUntil((s) => s.turn.number === 4 && s.turn.step === "upkeep");
    const warriors = objectsNamed(game, WARRIOR);
    expect(tokenCount(warriors)).toBe(10);
    expect(warriors).toHaveLength(2);
  });
});
