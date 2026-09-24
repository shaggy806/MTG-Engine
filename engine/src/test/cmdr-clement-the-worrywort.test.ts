/**
 * Clement, the Worrywort, and the vocabulary it needed: a `NumCompare` whose
 * number is read off the game (`DynamicOperand`) rather than printed.
 *
 * - "return up to one target creature you control **with lesser mana
 *   value**" compares against the *entering* creature's mana value — a
 *   target filter reading `{ manaValueOf: "trigger-object" }`. Offered
 *   targets, the validator and the recheck on resolution all read it, and the
 *   recheck reads it *again* rather than remembering the first answer.
 * - "Frogs you control have '{T}: Add {G} or {U}. Spend this mana only to
 *   cast a creature spell.'"
 * - `{ own }`: "toughness greater than its power" is about each object
 *   matched, and needs no context.
 * - `{ amount }` with nothing to answer it fails closed, and an effect's
 *   filters are bound to numbers as the effect applies.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { applyEffectSpec, bindDynamicCompares } from "../effects.js";
import type { EffectSpec, ResolutionContext } from "../effects.js";
import { matchesFilter } from "../filter.js";
import type { CardFilter } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const CLEMENT = "Clement, the Worrywort";
const registry = createDefaultRegistry();

const mkGame = (aHand: readonly string[] = []): Game =>
  Game.create({
    seed: 3,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Plains")] },
      { player: B, cards: Array<string>(40).fill("Plains") },
    ],
  });

const atMain = (s: GameState): boolean =>
  s.turn.step === "precombat-main" && s.priority.holder === A;
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: true });

/** Put a permanent into its owner's graveyard, as a removal spell cast in
 * response would. */
const kill = (game: Game, id: ObjectId): void => {
  (game as unknown as { moveObject(id: ObjectId, to: string): boolean }).moveObject(id, "graveyard");
};

/** Run until Clement's trigger asks for its target, and return the offer. */
const targetOffer = (game: Game): readonly ObjectId[] => {
  game.advanceUntil((s) => s.awaiting?.kind === "choose-targets");
  const awaiting = game.state.awaiting;
  if (awaiting?.kind !== "choose-targets") throw new Error("no choose-targets");
  expect(awaiting.cardName).toBe(CLEMENT);
  return awaiting.options[0].flatMap((ref) => (ref.kind === "object" ? [ref.object] : []));
};

const choose = (game: Game, target: ObjectId | null): void => {
  game.dispatch({
    type: "choose-targets",
    player: A,
    targets: [target === null ? null : { kind: "object", object: target }],
  });
};

describe("Clement, the Worrywort — the enters trigger", () => {
  it("offers only creatures you control with lesser mana value than Clement", () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    // Grizzly Bears is mana value 2, Craw Wurm 6; Clement is 3.
    const bears = spawn(game, "Grizzly Bears");
    const wurm = spawn(game, "Craw Wurm");
    const theirBears = spawn(game, "Grizzly Bears", B);
    const clement = enter(game, CLEMENT);

    const offer = targetOffer(game);
    expect(offer).toContain(bears);
    expect(offer).not.toContain(wurm);
    expect(offer).not.toContain(theirBears); // "you control"
    expect(offer).not.toContain(clement); // not lesser than itself

    // The validator reads the same number the offer did.
    expect(
      game.canDispatch({
        type: "choose-targets",
        player: A,
        targets: [{ kind: "object", object: wurm }],
      }),
    ).not.toBeNull();

    choose(game, bears);
    game.advanceUntil(settled);
    expect(game.state.objects[bears].zone).toBe("hand");
    expect(game.state.objects[clement].zone).toBe("battlefield");
  });

  it("measures against another creature entering, not against Clement", () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    const clement = spawn(game, CLEMENT);
    const bears = spawn(game, "Grizzly Bears");
    const wurm = enter(game, "Craw Wurm");

    const offer = targetOffer(game);
    // Both are below the Wurm's 6, Clement's own 3 notwithstanding.
    expect(offer).toEqual(expect.arrayContaining([clement, bears]));
    expect(offer).not.toContain(wurm);

    choose(game, clement);
    game.advanceUntil(settled);
    expect(game.state.objects[clement].zone).toBe("hand");
  });

  it("doesn't trigger on an opponent's creature", () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    spawn(game, CLEMENT);
    spawn(game, "Grizzly Bears");
    enter(game, "Craw Wurm", B);
    game.advanceUntil(settled);
    expect(game.state.eventLog.some((e) => e.type === "ability-triggered")).toBe(false);
  });

  it("may return nothing", () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    const bears = spawn(game, "Grizzly Bears");
    enter(game, CLEMENT);
    targetOffer(game);
    choose(game, null);
    game.advanceUntil(settled);
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });

  it("re-reads the entering creature's mana value on resolution", () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    const clement = spawn(game, CLEMENT);
    const wurm = enter(game, "Craw Wurm");
    targetOffer(game);
    choose(game, clement); // 3 < 6: legal now

    // Before it resolves, the Wurm becomes a copy of Grizzly Bears (layer 1,
    // as a Cytoshape would make it): mana value 2, and Clement's 3 is no
    // longer lesser. The target is illegal and the ability does nothing.
    expect(game.state.zones.shared.stack.length).toBe(1);
    game.state.objects[wurm].copyOf = "Grizzly Bears";
    game.advanceUntil(settled);
    expect(game.state.objects[clement].zone).toBe("battlefield");
    expect(
      game.state.eventLog.some(
        (e) => e.type === "spell-fizzled" && e.reason === "all targets are illegal",
      ),
    ).toBe(true);
  });
});

describe("Clement, the Worrywort — the entering creature has left (rule 608.2h)", () => {
  it("reads a copy that died in response as the creature it copied", () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    const clement = spawn(game, CLEMENT);
    // A Clone entering as a Craw Wurm: mana value 6 while it's a Wurm.
    const clone = enter(game, "Grizzly Bears");
    game.state.objects[clone].copyOf = "Craw Wurm";
    expect(targetOffer(game)).toContain(clement);
    choose(game, clement);

    // Killed in response: the move ends the copy effect (rule 707.2), but
    // the ability reads the creature as it last existed on the battlefield.
    kill(game, clone);
    game.advanceUntil(settled);
    expect(game.state.objects[clone].zone).toBe("graveyard");
    expect(game.state.objects[clement].zone).toBe("hand");
  });

  it("reads a token that ceased to exist as it last existed", () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    const clement = spawn(game, CLEMENT);
    // A token copy of a Craw Wurm.
    const token = enter(game, "Craw Wurm");
    game.state.objects[token].isToken = true;
    targetOffer(game);
    choose(game, clement);

    kill(game, token);
    game.advanceUntil(settled);
    expect(game.state.objects[token]).toBeUndefined(); // rule 111.7
    expect(game.state.objects[clement].zone).toBe("hand");
  });
});

describe("Clement, the Worrywort — Frogs' mana", () => {
  const canCast = (game: Game, name: string): boolean => {
    const card = game.handOf(A).find((id) => game.state.objects[id].cardName === name);
    if (card === undefined) throw new Error(`no ${name}`);
    return game.canDispatch({ type: "cast-spell", player: A, card, targets: [] }) === null;
  };

  it("pays for a creature spell, green or blue, and not for anything else", () => {
    // Clement is the only mana on the board — a Frog, so it has the ability.
    const game = mkGame(["Llanowar Elves", "Giant Growth", "Opt"]);
    game.advanceUntil(atMain);
    spawn(game, CLEMENT);
    expect(canCast(game, "Llanowar Elves")).toBe(true);
    expect(canCast(game, "Giant Growth")).toBe(false);
    expect(canCast(game, "Opt")).toBe(false);
  });

  it("reaches other Frogs you control, not other creatures", () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    spawn(game, CLEMENT);
    const flubs = spawn(game, "Flubs, the Fool"); // a Frog Scout
    const bears = spawn(game, "Grizzly Bears");
    const theirFlubs = spawn(game, "Flubs, the Fool", B);
    const hasFrogMana = (id: ObjectId): boolean =>
      game.state.objects[id] !== undefined &&
      game
        .legalActions(game.state.objects[id].controller)
        .some((a) => a.kind === "activate-ability" && a.source === id);
    expect(hasFrogMana(flubs)).toBe(true);
    expect(hasFrogMana(bears)).toBe(false);
    expect(hasFrogMana(theirFlubs)).toBe(false);
  });
});

describe("DynamicOperand", () => {
  const filterOn = (game: Game, id: ObjectId, filter: CardFilter, amount?: (a: unknown) => number) =>
    matchesFilter(game.state, registry, id, filter, {
      you: A,
      ...(amount !== undefined ? { amount } : {}),
    });

  it("{ own } compares against the matched object's own characteristic", () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    const wall = spawn(game, "Wall of Wood"); // 0/3
    const bears = spawn(game, "Grizzly Bears"); // 2/2
    const tougher: CardFilter = { toughness: { op: "gt", n: { own: "power" } } };
    expect(filterOn(game, wall, tougher)).toBe(true);
    expect(filterOn(game, bears, tougher)).toBe(false);
  });

  it("{ amount } fails closed with nothing to answer it", () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    const bears = spawn(game, "Grizzly Bears");
    const filter: CardFilter = { manaValue: { op: "lt", n: { amount: 5 } } };
    expect(filterOn(game, bears, filter)).toBe(false);
    expect(filterOn(game, bears, filter, () => 5)).toBe(true);
  });

  it("an effect's filters are bound to numbers as it applies, nested effects left alone", () => {
    const spec: EffectSpec = {
      kind: "sequence",
      effects: [
        {
          kind: "destroy-all",
          filter: { manaValue: { op: "lte", n: { amount: "x" } } },
        },
      ],
    };
    const ctx = { x: 4 } as unknown as ResolutionContext;
    // The sequence itself holds nothing to bind — its steps are bound as
    // each applies.
    expect(bindDynamicCompares(spec, ctx)).toBe(spec);
    const step = (spec as Extract<EffectSpec, { kind: "sequence" }>).effects[0];
    expect(bindDynamicCompares(step, ctx)).toEqual({
      kind: "destroy-all",
      filter: { manaValue: { op: "lte", n: 4 } },
    });
  });

  it("applyEffectSpec hands the engine a filter with the number already in it", () => {
    const seen: CardFilter[] = [];
    const ctx = {
      x: 3,
      destroyAll: (filter: CardFilter) => seen.push(filter),
    } as unknown as ResolutionContext;
    applyEffectSpec(
      { kind: "destroy-all", filter: { manaValue: { op: "eq", n: { amount: "x" } } } },
      ctx,
    );
    expect(seen).toEqual([{ manaValue: { op: "eq", n: 3 } }]);
  });
});
