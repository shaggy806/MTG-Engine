import { describe, expect, it } from "vitest";

import { createDefaultRegistry, defineCard } from "../cards.js";
import { computeCharacteristics } from "../characteristics.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameObject } from "../state.js";
import type { TargetRef } from "../target.js";

/**
 * A spell or ability targeting a token in a compacted stack targets *one*
 * token, and every step of its effect must reach that same token. The stack
 * is split once, as the targets are chosen (rules 601.2c / 602.2b / 603.3d),
 * so the target names a real single object from then on.
 *
 * Before, every effect step that touched the target peeled its own token off
 * the stack: Tamiyo's Safekeeping gave hexproof to one Goblin and
 * indestructible to another, and Act of Treason stole one, untapped a second
 * and gave haste to a third.
 */

const [A, B] = ["alice", "bob"].map(asPlayerId);
const GOBLIN = "Goblin Token";

// Two test-only cards whose cost taps creatures *and* which target one: no
// real card in the pool puts a token stack under both at once, and the order
// the two are paid in is exactly what they check.
const PUMP = {
  kind: "modify-pt",
  target: 0,
  power: 1,
  toughness: 1,
  duration: "end-of-turn",
} as const;
const convokePump = defineCard({
  name: "Test Convoke Pump",
  manaCost: "{8}",
  types: ["sorcery"],
  text: "Convoke\nTarget creature you control gets +1/+1 until end of turn.",
  convoke: true,
  targets: ["creature-you-control"],
  effect: PUMP,
});
const tapperPump = defineCard({
  name: "Test Tapper Pump",
  manaCost: "{1}",
  types: ["artifact"],
  text: "Tap eight untapped creatures you control: Target creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, tapOthers: { count: 8, filter: { type: "creature" } } },
      targets: ["creature"],
      effect: PUMP,
      resolve: null,
      text: "Tap eight untapped creatures you control: Target creature gets +1/+1 until end of turn.",
    },
  ],
});
const registry = createDefaultRegistry().register(convokePump).register(tapperPump);

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

function lands(game: Game, player: PlayerId, ...names: string[]): void {
  for (const name of names) game.debugSpawn(name, player, "battlefield");
}

/** Ten Goblin tokens made the way a card makes them: one stack object. */
function stackOf(game: Game, player: PlayerId, count = 10): ObjectId {
  game.debugApplyEffect(player, { kind: "create-token", token: GOBLIN, count });
  const stack = game.state.zones.shared.battlefield.find(
    (id) => game.state.objects[id].cardName === GOBLIN && game.state.objects[id].isToken,
  );
  if (stack === undefined || (game.state.objects[stack].stackCount ?? 1) !== count) {
    throw new Error(`expected one stack of ${count} Goblins`);
  }
  return stack;
}

const goblins = (game: Game): GameObject[] =>
  game.state.zones.shared.battlefield
    .map((id) => game.state.objects[id])
    .filter((o) => o.cardName === GOBLIN);

const tokenCount = (objects: readonly GameObject[]): number =>
  objects.reduce((n, o) => n + (o.stackCount ?? 1), 0);

const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
const has = (game: Game, id: ObjectId, keyword: string): boolean =>
  chars(game, id).keywords.has(keyword as never);

/** The Goblins some effect reached, by a predicate over their characteristics. */
const touched = (game: Game, pred: (id: ObjectId) => boolean): GameObject[] =>
  goblins(game).filter((o) => pred(o.id));

const ref = (object: ObjectId): TargetRef => ({ kind: "object", object });

function pass(game: Game): void {
  game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
}

function resolveStack(game: Game): void {
  for (let i = 0; i < 200 && game.state.zones.shared.stack.length > 0; i += 1) {
    if (game.state.awaiting !== null) {
      throw new Error(`unexpected ${game.state.awaiting.kind} decision`);
    }
    pass(game);
  }
}

function cast(game: Game, player: PlayerId, name: string, targets: TargetRef[]): ObjectId {
  const card = game.debugSpawn(name, player, "hand");
  game.dispatch({ type: "cast-spell", player, card, targets });
  return card;
}

/** The single object a spell or ability on the stack is targeting. */
function targetOf(game: Game, id: ObjectId): ObjectId {
  const target = game.state.objects[id].targets?.[0];
  if (target?.kind !== "object") throw new Error("no object target");
  return target.object;
}

describe("a multi-step effect on one token of a stack reaches that one token", () => {
  it("Tamiyo's Safekeeping gives the same Goblin hexproof and indestructible", () => {
    const game = table();
    lands(game, A, "Forest");
    const stack = stackOf(game, A);

    cast(game, A, "Tamiyo's Safekeeping", [ref(stack)]);
    resolveStack(game);

    const hexproof = touched(game, (id) => has(game, id, "hexproof"));
    const indestructible = touched(game, (id) => has(game, id, "indestructible"));
    expect(hexproof).toHaveLength(1);
    expect(indestructible).toHaveLength(1);
    expect(hexproof[0].id).toBe(indestructible[0].id);
    expect(hexproof[0].stackCount).toBeUndefined();
    // Nine untouched Goblins still in the stack, ten in all.
    expect(tokenCount(goblins(game))).toBe(10);
    expect(game.state.objects[stack].stackCount).toBe(9);
  });

  it("Act of Treason steals, untaps and hastes the same Goblin", () => {
    const game = table();
    lands(game, A, "Mountain", "Mountain", "Mountain");
    const stack = stackOf(game, B);
    game.state.objects[stack].tapped = true;

    cast(game, A, "Act of Treason", [ref(stack)]);
    resolveStack(game);

    const stolen = goblins(game).filter((o) => o.controller === A);
    expect(stolen).toHaveLength(1);
    expect(stolen[0].stackCount).toBeUndefined();
    expect(stolen[0].tapped).toBe(false);
    expect(has(game, stolen[0].id, "haste")).toBe(true);
    // Bob's other nine are untouched: still his, still tapped, no haste.
    const kept = goblins(game).filter((o) => o.controller === B);
    expect(tokenCount(kept)).toBe(9);
    expect(kept.every((o) => o.tapped)).toBe(true);
    expect(kept.some((o) => has(game, o.id, "haste"))).toBe(false);
  });

  it("Blossoming Defense pumps and hexproofs the same Goblin", () => {
    const game = table();
    lands(game, A, "Forest");
    const stack = stackOf(game, A);

    cast(game, A, "Blossoming Defense", [ref(stack)]);
    resolveStack(game);

    const pumped = touched(game, (id) => chars(game, id).power === 3);
    expect(pumped).toHaveLength(1);
    expect(chars(game, pumped[0].id).toughness).toBe(3);
    expect(has(game, pumped[0].id, "hexproof")).toBe(true);
    expect(touched(game, (id) => has(game, id, "hexproof"))).toHaveLength(1);
    expect(tokenCount(goblins(game))).toBe(10);
  });

  it("an activated ability (Kessig Wolf Run) reaches one Goblin with both halves", () => {
    const game = table();
    lands(game, A, "Mountain", "Forest", "Forest");
    const wolfRun = game.debugSpawn("Kessig Wolf Run", A, "battlefield");
    const stack = stackOf(game, A);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: wolfRun,
      abilityIndex: 1,
      targets: [ref(stack)],
      xValue: 1,
    });
    resolveStack(game);

    const pumped = touched(game, (id) => chars(game, id).power === 2);
    expect(pumped).toHaveLength(1);
    expect(has(game, pumped[0].id, "trample")).toBe(true);
    expect(touched(game, (id) => has(game, id, "trample"))).toHaveLength(1);
  });

  it("a triggered ability's chosen target (Bruse Tarl) is one Goblin for both keywords", () => {
    const game = table();
    lands(game, A, "Mountain", "Plains", "Mountain", "Mountain");
    const stack = stackOf(game, A);

    cast(game, A, "Bruse Tarl, Boorish Herder", []);
    resolveStack(game);
    // Bruse himself and the stack are both legal, so the target is asked.
    expect(game.state.awaiting?.kind).toBe("choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [ref(stack)] });
    resolveStack(game);

    const doubled = touched(game, (id) => has(game, id, "double-strike"));
    const lifelinked = touched(game, (id) => has(game, id, "lifelink"));
    expect(doubled).toHaveLength(1);
    expect(lifelinked).toHaveLength(1);
    expect(doubled[0].id).toBe(lifelinked[0].id);
  });
});

describe("the split-off target behaves like any single target", () => {
  it("killing the targeted Goblin in response makes the spell fizzle", () => {
    const game = table();
    lands(game, A, "Forest");
    lands(game, B, "Mountain");
    const stack = stackOf(game, A);

    const defense = cast(game, A, "Blossoming Defense", [ref(stack)]);
    // The spell names one real Goblin, not the stack.
    const target = targetOf(game, defense);
    expect(target).not.toBe(stack);
    expect(game.state.objects[target].stackCount).toBeUndefined();

    pass(game); // Alice passes; Bob answers by bolting that very Goblin
    expect(game.state.priority.holder).toBe(B);
    cast(game, B, "Lightning Bolt", [ref(target)]);
    resolveStack(game);

    expect(game.state.objects[target]).toBeUndefined();
    expect(
      game.state.eventLog.some((e) => e.type === "spell-fizzled" && e.object === defense),
    ).toBe(true);
    // Nothing else was pumped: nine plain Goblins left.
    expect(tokenCount(goblins(game))).toBe(9);
    expect(touched(game, (id) => chars(game, id).power !== 1)).toHaveLength(0);
    expect(touched(game, (id) => has(game, id, "hexproof"))).toHaveLength(0);
  });

  it("a copy of the spell (Twincast) targets the same Goblin as the original", () => {
    const game = table();
    lands(game, A, "Forest", "Island", "Island");
    const stack = stackOf(game, A);

    const defense = cast(game, A, "Blossoming Defense", [ref(stack)]);
    cast(game, A, "Twincast", [ref(defense)]);
    resolveStack(game);

    // Both resolutions pumped one Goblin: 5/5, and everyone else is 1/1.
    const pumped = touched(game, (id) => chars(game, id).power !== 1);
    expect(pumped).toHaveLength(1);
    expect(chars(game, pumped[0].id).power).toBe(5);
    expect(chars(game, pumped[0].id).toughness).toBe(5);
  });

  it("new tokens made while the spell waits don't fold into the Goblin it targets", () => {
    const game = table();
    lands(game, A, "Forest");
    const stack = stackOf(game, A);

    const defense = cast(game, A, "Blossoming Defense", [ref(stack)]);
    const target = targetOf(game, defense);
    // The rest of the stack is gone before the spell resolves, so the only
    // Goblin a new batch could join is the targeted one.
    game.state.zones.shared.battlefield = game.state.zones.shared.battlefield.filter(
      (id) => id !== stack,
    );
    delete game.state.objects[stack];
    game.debugApplyEffect(A, { kind: "create-token", token: GOBLIN, count: 10 });
    expect(game.state.objects[target].stackCount).toBeUndefined();
    resolveStack(game);

    // One Goblin got both halves; the new ten are untouched.
    const pumped = touched(game, (id) => chars(game, id).power === 3);
    expect(pumped.map((o) => o.id)).toEqual([target]);
    expect(has(game, target, "hexproof")).toBe(true);
    expect(touched(game, (id) => has(game, id, "hexproof"))).toHaveLength(1);
    expect(tokenCount(goblins(game))).toBe(11);
  });

  it("the split-off Goblin folds back into its stack at cleanup once nothing tells them apart", () => {
    const game = table();
    lands(game, A, "Forest");
    const stack = stackOf(game, A);

    cast(game, A, "Blossoming Defense", [ref(stack)]);
    resolveStack(game);
    expect(goblins(game)).toHaveLength(2);

    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    const after = goblins(game);
    expect(after).toHaveLength(1);
    expect(after[0].stackCount).toBe(10);
  });

  it("a cast that can't be paid for leaves the stack whole", () => {
    const game = table();
    const stack = stackOf(game, A);
    const card = game.debugSpawn("Blossoming Defense", A, "hand");

    // No land to pay {G} with: the cast is refused, and refusing it must not
    // have peeled the target off its stack on the way.
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card, targets: [ref(stack)] }),
    ).toThrow();
    expect(goblins(game)).toHaveLength(1);
    expect(game.state.objects[stack].stackCount).toBe(10);
  });

  it("a spell convoked with every token of the stack it targets taps all of them", () => {
    const game = table();
    const stack = stackOf(game, A, 8);
    const card = game.debugSpawn(convokePump.name, A, "hand");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      targets: [ref(stack)],
      convoke: Array.from({ length: 8 }, () => ({ creature: stack })),
    });
    // The target is one of the eight that paid, not a ninth Goblin.
    const target = targetOf(game, card);
    expect(game.state.objects[target].tapped).toBe(true);
    resolveStack(game);

    expect(tokenCount(goblins(game))).toBe(8);
    expect(goblins(game).every((o) => o.tapped)).toBe(true);
    const pumped = touched(game, (id) => chars(game, id).power === 2);
    expect(pumped.map((o) => o.id)).toEqual([target]);
  });

  it("an ability whose cost taps every token of the stack it targets taps all of them", () => {
    const game = table();
    const tapper = game.debugSpawn(tapperPump.name, A, "battlefield");
    const stack = stackOf(game, A, 8);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: tapper,
      abilityIndex: 0,
      targets: [ref(stack)],
      tap: Array.from({ length: 8 }, () => stack),
    });
    resolveStack(game);

    expect(tokenCount(goblins(game))).toBe(8);
    expect(goblins(game).every((o) => o.tapped)).toBe(true);
    expect(touched(game, (id) => chars(game, id).power === 2)).toHaveLength(1);
  });

  it("a Goblin a delayed trigger still refers to is not folded away at cleanup", () => {
    const game = table();
    lands(game, A, "Forest");
    const stack = stackOf(game, A);

    const defense = cast(game, A, "Blossoming Defense", [ref(stack)]);
    const target = targetOf(game, defense);
    resolveStack(game);
    // Something is still coming for this particular Goblin next upkeep.
    game.debugApplyEffect(
      A,
      {
        kind: "delayed-trigger",
        at: "next-upkeep",
        effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
        text: "Put a +1/+1 counter on that Goblin.",
      },
      [ref(target)],
    );

    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(game.state.objects[target]).toBeDefined();
    resolveStack(game);
    expect(game.state.objects[target].counters["+1/+1"]).toBe(1);
    expect(touched(game, (id) => chars(game, id).power !== 1)).toHaveLength(1);
    expect(tokenCount(goblins(game))).toBe(10);
  });
});
