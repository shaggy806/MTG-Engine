/**
 * Cost modifications that depend on more than a count (rule 601.2f):
 *
 * - "for each target" (Hinata, Dawn-Crowned) — priced off the targets the
 *   spell is actually cast with, and offered with the range of target counts
 *   it's affordable at;
 * - a generic reduction reaching the `{2}` half of a twobrid pip (Reaper
 *   King — the Spectral Procession ruling);
 * - "the first … spell you cast each turn";
 * - taking coloured pips off ("costs {W}{B} less").
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { defineCard } from "../cards/define.js";
import { HeuristicBotController, RandomController } from "../controller.js";
import { candidateActions } from "../bot/candidates.js";
import { Game } from "../game.js";
import { manaValue, parseManaCost, reduceManaCost } from "../mana.js";
import { asPlayerId, createRng } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { TargetRef } from "../target.js";
import { distinctTargetCount, fitTargetCount, targetCountBounds } from "../target-count.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Two optional slots: "deals 1 damage to each of up to two targets". */
const twinPing = defineCard({
  name: "Test Twin Ping",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Test Twin Ping deals 1 damage to each of up to two targets.",
  targets: [
    { kind: "optional", of: "any-target" },
    { kind: "optional", of: "any-target" },
  ],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage", amount: 1, target: 0 },
      { kind: "damage", amount: 1, target: 1 },
    ],
  },
});

const firstCreatureDiscount = defineCard({
  name: "Test Nursery",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "The first creature spell you cast each turn costs {1} less to cast.",
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { type: "creature" },
        caster: "you",
        firstEachTurn: true,
        reduceGeneric: 1,
      },
      text: "The first creature spell you cast each turn costs {1} less to cast.",
    },
  ],
});

const scarecrow = defineCard({
  name: "Test Scarecrow",
  manaCost: "{1}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Scarecrow"],
  power: 1,
  toughness: 1,
  text: "",
});

const registry = () =>
  createDefaultRegistry().register(twinPing).register(firstCreatureDiscount).register(scarecrow);

const makeGame = (aHand: readonly string[] = []) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry: registry(),
    rules: { skipFirstDraw: true, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Island")] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
};

const lands = (game: Game, name: string, n: number, player: PlayerId = A): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, player);
};
const tappedCount = (game: Game, player: PlayerId = A): number =>
  game.state.zones.shared.battlefield.filter((id) => {
    const o = game.state.objects[id];
    return o.controller === player && o.tapped;
  }).length;
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const playerRef = (player: PlayerId): TargetRef => ({ kind: "player", player });

const castTwinPing = (game: Game, targets: (TargetRef | null)[]) => ({
  type: "cast-spell" as const,
  player: A,
  card: inHand(game, "Test Twin Ping"),
  targets,
});

describe("Hinata, Dawn-Crowned — your spells cost {1} less for each target", () => {
  const setup = (mountains: number) => {
    const game = makeGame(["Test Twin Ping"]);
    game.debugSpawn("Hinata, Dawn-Crowned", A);
    lands(game, "Mountain", mountains);
    return game;
  };

  it("takes nothing off with no targets", () => {
    const game = setup(3);
    game.dispatch(castTwinPing(game, [null, null]));
    expect(tappedCount(game)).toBe(3);
  });

  it("takes {1} off with one target", () => {
    const game = setup(3);
    game.dispatch(castTwinPing(game, [playerRef(B), null]));
    expect(tappedCount(game)).toBe(2);
  });

  it("takes {2} off with two different targets", () => {
    const game = setup(3);
    const creature = game.debugSpawn("Grizzly Bears", B);
    game.dispatch(castTwinPing(game, [playerRef(B), { kind: "object", object: creature }]));
    expect(tappedCount(game)).toBe(1);
  });

  it("counts one target named twice once (the card's ruling)", () => {
    const game = setup(3);
    game.dispatch(castTwinPing(game, [playerRef(B), playerRef(B)]));
    expect(tappedCount(game)).toBe(2);
  });

  it("never takes off coloured mana", () => {
    const game = makeGame(["Lightning Bolt"]);
    game.debugSpawn("Hinata, Dawn-Crowned", A);
    // {R} with a target — nothing generic to take off, so still one Mountain.
    expect(
      game.canDispatch({ type: "cast-spell", player: A, card: inHand(game, "Lightning Bolt"), targets: [playerRef(B)] }),
    ).not.toBeNull();
    lands(game, "Mountain", 1);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Lightning Bolt"), targets: [playerRef(B)] });
    expect(tappedCount(game)).toBe(1);
  });

  it("offers the spell with the target counts it's affordable at", () => {
    // One Mountain: only {R} is payable, which takes two targets.
    const game = setup(1);
    const offer = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.cardName === "Test Twin Ping");
    expect(offer?.kind === "cast-spell" ? offer.targetCount : undefined).toEqual({ min: 2, max: 2 });
    expect(game.canDispatch(castTwinPing(game, [playerRef(B), null]))).not.toBeNull();
    game.dispatch(castTwinPing(game, [playerRef(A), playerRef(B)]));
    expect(tappedCount(game)).toBe(1);
  });

  it("isn't offered when no legal choice of targets is affordable", () => {
    const game = makeGame(["Lightning Bolt"]);
    game.debugSpawn("Hinata, Dawn-Crowned", A);
    expect(
      game.legalActions(A).some((a) => a.kind === "cast-spell" && a.cardName === "Lightning Bolt"),
    ).toBe(false);
  });
});

describe("Hinata, Dawn-Crowned — your opponents' spells cost {1} more for each target", () => {
  const setup = (mountains: number) => {
    const game = makeGame(["Test Twin Ping"]);
    game.debugSpawn("Hinata, Dawn-Crowned", B);
    lands(game, "Mountain", mountains);
    return game;
  };

  it("adds nothing with no targets", () => {
    const game = setup(5);
    game.dispatch(castTwinPing(game, [null, null]));
    expect(tappedCount(game)).toBe(3);
  });

  it("adds {1} with one target", () => {
    const game = setup(5);
    game.dispatch(castTwinPing(game, [playerRef(B), null]));
    expect(tappedCount(game)).toBe(4);
  });

  it("adds {2} with two different targets", () => {
    const game = setup(5);
    game.dispatch(castTwinPing(game, [playerRef(A), playerRef(B)]));
    expect(tappedCount(game)).toBe(5);
    expect(game.state.players[B].life).toBe(game.state.rules.startingLife);
    game.advanceUntil((s) => s.zones.shared.stack.length === 0);
  });

  it("refuses a choice of targets the caster can't afford, and offers the range they can", () => {
    const game = setup(4);
    expect(game.canDispatch(castTwinPing(game, [playerRef(A), playerRef(B)]))).not.toBeNull();
    const offer = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.cardName === "Test Twin Ping");
    expect(offer?.kind === "cast-spell" ? offer.targetCount : undefined).toEqual({ min: 0, max: 1 });
    game.dispatch(castTwinPing(game, [playerRef(B), null]));
    expect(tappedCount(game)).toBe(4);
  });

  it("doesn't tax its controller's own spells", () => {
    const game = makeGame();
    game.debugSpawn("Hinata, Dawn-Crowned", A);
    game.debugSpawn("Hinata, Dawn-Crowned", B);
    // Mine takes {1} off, theirs puts {1} on: {2}{R} with one target is 3.
    game.debugSpawn("Test Twin Ping", A, "hand");
    lands(game, "Mountain", 3);
    game.dispatch(castTwinPing(game, [playerRef(B), null]));
    expect(tappedCount(game)).toBe(3);
  });

  it("the fuzzer's random driver keeps to the offered range", () => {
    const counts = new Set<number>();
    for (let seed = 0; seed < 20; seed += 1) {
      const game = setup(4);
      const rng = createRng(seed);
      const random = new RandomController(A, () => rng.next());
      const offer = game
        .legalActions(A)
        .find((a) => a.kind === "cast-spell" && a.cardName === "Test Twin Ping");
      if (offer === undefined) throw new Error("not offered");
      const action = (random as unknown as { toAction(l: typeof offer): Parameters<Game["dispatch"]>[0] }).toAction(
        offer,
      );
      expect(game.canDispatch(action)).toBeNull();
      if (action.type === "cast-spell") counts.add(distinctTargetCount(action.targets));
    }
    // It still explores: some casts with a target, some without.
    expect([...counts].sort()).toEqual([0, 1]);
  });
});

describe("Hinata, Dawn-Crowned — the bots keep to the offered range", () => {
  // One Mountain and her discount: Test Twin Ping costs {R} only with two
  // different targets, and both bots' first instinct is one target twice.
  const setup = () => {
    const game = makeGame(["Test Twin Ping"]);
    game.debugSpawn("Hinata, Dawn-Crowned", A);
    lands(game, "Mountain", 1);
    const offer = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.cardName === "Test Twin Ping");
    if (offer === undefined) throw new Error("not offered");
    return { game, offer };
  };

  it("v2's candidates are all castable", () => {
    const { game, offer } = setup();
    const candidates = candidateActions(offer, A);
    expect(candidates.length).toBeGreaterThan(0);
    for (const action of candidates) expect(game.canDispatch(action)).toBeNull();
  });

  it("v1's pick is castable", () => {
    const { game, offer } = setup();
    const bot = new HeuristicBotController(A, game.registry);
    const action = (bot as unknown as { toCastSpell(l: typeof offer): Parameters<Game["dispatch"]>[0] }).toCastSpell(
      offer,
    );
    expect(game.canDispatch(action)).toBeNull();
  });
});

describe("Reaper King — twobrid pips", () => {
  const castKing = (game: Game) => ({
    type: "cast-spell" as const,
    player: A,
    card: inHand(game, "Reaper King"),
  });

  it("is paid with one mana of each colour", () => {
    const game = makeGame(["Reaper King"]);
    for (const land of ["Plains", "Island", "Swamp", "Mountain", "Forest"]) lands(game, land, 1);
    game.dispatch(castKing(game));
    expect(tappedCount(game)).toBe(5);
  });

  it("is paid with two generic mana for each pip it can't pay in colour", () => {
    // Nine Mountains: {R}, then {2} four times.
    const game = makeGame(["Reaper King"]);
    lands(game, "Mountain", 8);
    expect(game.canDispatch(castKing(game))).not.toBeNull();
    lands(game, "Mountain", 1);
    game.dispatch(castKing(game));
    expect(tappedCount(game)).toBe(9);
  });

  it("is paid with a mix: colours where it can, two generic elsewhere", () => {
    // W, U and B in colour; R and G as {2} each off four more Islands.
    const game = makeGame(["Reaper King"]);
    for (const land of ["Plains", "Island", "Swamp"]) lands(game, land, 1);
    lands(game, "Island", 4);
    game.dispatch(castKing(game));
    expect(tappedCount(game)).toBe(7);
  });

  it("has mana value 10 and is every colour", () => {
    const def = registry().get("Reaper King");
    expect(def.colors).toEqual(["W", "U", "B", "R", "G"]);
    expect(manaValue(parseManaCost(def.manaCost))).toBe(10);
  });

  it("takes a generic reduction off the {2} half of a pip paid generically", () => {
    // Foundry Inspector: artifact spells cost {1} less. With no generic part,
    // the {1} comes off the one pip paid generically — {2/G}, with no Forest
    // — so W U B R plus one more mana pays it all.
    const game = makeGame(["Reaper King"]);
    game.debugSpawn("Foundry Inspector", A);
    for (const land of ["Plains", "Island", "Swamp", "Mountain"]) lands(game, land, 1);
    expect(game.canDispatch(castKing(game))).not.toBeNull();
    lands(game, "Island", 1);
    game.dispatch(castKing(game));
    expect(tappedCount(game)).toBe(5);
  });

  it("takes a larger reduction off one pip and then the next", () => {
    // Three Inspectors take {3}: {R} in colour, then {0}+{1}+{2}+{2} = 5
    // generic — six Mountains, where nine would be needed without them.
    const game = makeGame(["Reaper King"]);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Foundry Inspector", A);
    lands(game, "Mountain", 5);
    expect(game.canDispatch(castKing(game))).not.toBeNull();
    lands(game, "Mountain", 1);
    game.dispatch(castKing(game));
    expect(tappedCount(game)).toBe(6);
  });

  it("spends a reduction too big for the pips paid generically on a colour-paid one", () => {
    // Two Inspectors, and a land of every colour: every pip can go in colour,
    // but {2} off pays {2/W} generically for nothing — four lands, not five.
    const game = makeGame(["Reaper King"]);
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Foundry Inspector", A);
    for (const land of ["Plains", "Island", "Swamp", "Mountain", "Forest"]) lands(game, land, 1);
    game.dispatch(castKing(game));
    expect(tappedCount(game)).toBe(4);
  });

  it("gives other Scarecrows +1/+1 and destroys a permanent when one enters", () => {
    const game = makeGame();
    game.debugSpawn("Reaper King", A);
    const victim = game.debugSpawn("Grizzly Bears", B);
    const crow = game.debugSpawn("Test Scarecrow", A, "battlefield", { announceEntry: true });
    expect(game.characteristics(crow).power).toBe(2);
    expect(game.characteristics(crow).toughness).toBe(2);
    game.advanceUntil((s) => s.awaiting !== null || s.zones.shared.stack.length > 0);
    if (game.state.awaiting?.kind === "choose-targets") {
      game.dispatch({ type: "choose-targets", player: A, targets: [{ kind: "object", object: victim }] });
    }
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
    expect(game.state.objects[victim].zone).toBe("graveyard");
  });

  it("doesn't trigger on itself or on a non-Scarecrow", () => {
    const game = makeGame();
    const bears = game.debugSpawn("Grizzly Bears", B);
    game.debugSpawn("Reaper King", A, "battlefield", { announceEntry: true });
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });
});

describe("the first matching spell each turn", () => {
  it("discounts only the first creature spell you cast each turn", () => {
    const game = makeGame(["Grizzly Bears", "Grizzly Bears"]);
    game.debugSpawn("Test Nursery", A);
    lands(game, "Forest", 1);
    const [first, second] = game.handOf(A).filter((id) => game.state.objects[id].cardName === "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: A, card: first });
    expect(tappedCount(game)).toBe(1);
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.priority.holder === A);
    lands(game, "Forest", 1);
    // The second Bears is back to {1}{G}: one untapped Forest can't pay it.
    expect(game.canDispatch({ type: "cast-spell", player: A, card: second })).not.toBeNull();
  });

  it("isn't used up by a spell it doesn't apply to", () => {
    const game = makeGame(["Lightning Bolt", "Grizzly Bears"]);
    game.debugSpawn("Test Nursery", A);
    lands(game, "Mountain", 1);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Lightning Bolt"),
      targets: [playerRef(B)],
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.priority.holder === A);
    lands(game, "Forest", 1);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears") });
    expect(tappedCount(game)).toBe(2);
  });

  it("doesn't discount an opponent's creature spell", () => {
    const game = makeGame(["Grizzly Bears"]);
    game.debugSpawn("Test Nursery", B);
    lands(game, "Forest", 1);
    expect(
      game.canDispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears") }),
    ).not.toBeNull();
  });
});

describe("reduceManaCost", () => {
  const cost = (text: string) => parseManaCost(text);
  const W_B = { W: 1, U: 0, B: 1, R: 0, G: 0 };

  it("takes a coloured reduction off matching pips", () => {
    const out = reduceManaCost(cost("{1}{W}{B}{B}"), 0, [{ colors: W_B, coloredOnly: true }]);
    expect(out.generic).toBe(1);
    expect(out.colored).toMatchObject({ W: 0, B: 1 });
  });

  it("takes a coloured reduction off a hybrid pip of that colour", () => {
    const out = reduceManaCost(cost("{2/W}{W/B}"), 0, [{ colors: W_B, coloredOnly: true }]);
    expect(out.hybrid).toEqual([]);
  });

  it("puts what finds no coloured pip onto generic — unless it reduces only coloured mana", () => {
    const loose = reduceManaCost(cost("{3}{W}"), 0, [{ colors: W_B, coloredOnly: false }]);
    expect(loose.generic).toBe(2);
    expect(loose.colored.W).toBe(0);
    const strict = reduceManaCost(cost("{3}{W}"), 0, [{ colors: W_B, coloredOnly: true }]);
    expect(strict.generic).toBe(3);
  });

  it("carries a generic reduction past the generic part over to the twobrid pips", () => {
    const out = reduceManaCost(cost("{1}{2/W}{2/U}"), 4);
    expect(out.generic).toBe(0);
    expect(out.hybrid).toEqual(cost("{2/W}{2/U}").hybrid);
    expect(out.twobridReduction).toBe(3);
    // No more than the twobrid pips' generic halves can use.
    expect(reduceManaCost(cost("{2/W}"), 9).twobridReduction).toBe(2);
  });

  it("never reduces a plain hybrid or Phyrexian pip with generic mana", () => {
    const out = reduceManaCost(cost("{W/U}{B/P}"), 3);
    expect(out.hybrid).toEqual(cost("{W/U}{B/P}").hybrid);
    expect(out.twobridReduction).toBeUndefined();
  });
});

describe("target counting", () => {
  const p = playerRef;
  const o = (id: string): TargetRef => ({ kind: "object", object: id as ObjectId });

  it("counts distinct targets", () => {
    expect(distinctTargetCount([p(A), p(A), null, o("x")])).toBe(2);
  });

  it("bounds a choice: required slots can share, optional ones can be skipped", () => {
    expect(targetCountBounds([[p(A), p(B)], [p(A), p(B)]], ["player", "player"])).toEqual({ min: 1, max: 2 });
    expect(
      targetCountBounds(
        [[p(A)], [p(A), p(B)]],
        [{ kind: "optional", of: "player" }, { kind: "optional", of: "player" }],
      ),
    ).toEqual({ min: 0, max: 2 });
    expect(targetCountBounds([[]], ["creature"])).toBeNull();
  });

  it("fits a choice into a range", () => {
    const opt = [
      { kind: "optional", of: "player" },
      { kind: "optional", of: "player" },
    ] as const;
    const options = [[p(A), p(B)], [p(A), p(B)]];
    expect(distinctTargetCount(fitTargetCount([p(A), p(B)], options, opt, { min: 0, max: 1 }))).toBe(1);
    expect(distinctTargetCount(fitTargetCount([null, null], options, opt, { min: 2, max: 2 }))).toBe(2);
    expect(distinctTargetCount(fitTargetCount([p(A), p(A)], options, ["player", "player"], { min: 2, max: 2 }))).toBe(2);
    expect(fitTargetCount([p(A)], [[p(A)]], ["player"], { min: 2, max: 2 })).toBeNull();
  });
});

describe("Hinata, Dawn-Crowned — a token stack named in two slots is two targets", () => {
  // Each slot naming a compacted stack is given its own token as the spell is
  // cast (`lockInTargets`), so the spell targets two creatures, and Hinata
  // counts two — not the one object id both slots named.
  const setup = (mountains: number) => {
    const game = makeGame(["Test Twin Ping"]);
    game.debugSpawn("Hinata, Dawn-Crowned", B);
    game.debugApplyEffect(B, { kind: "create-token", token: "Goblin Token", count: 10 });
    const stack = game.state.zones.shared.battlefield.find(
      (id) => (game.state.objects[id].stackCount ?? 1) > 1,
    );
    if (stack === undefined) throw new Error("no token stack");
    lands(game, "Mountain", mountains);
    return { game, ref: { kind: "object", object: stack } as TargetRef };
  };

  it("taxes both tokens", () => {
    const short = setup(4);
    expect(() => short.game.dispatch(castTwinPing(short.game, [short.ref, short.ref]))).toThrow();
    const { game, ref } = setup(5);
    game.dispatch(castTwinPing(game, [ref, ref]));
    expect(tappedCount(game)).toBe(5);
    const spell = game.state.objects[game.state.zones.shared.stack.at(-1) as ObjectId];
    const [first, second] = spell.targets ?? [];
    expect(first?.kind === "object" && second?.kind === "object" && first.object !== second.object).toBe(true);
  });

  it("offers the stack's size with the range, and fits a pick by it", () => {
    const { game, ref } = setup(4);
    const legal = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.cardName === "Test Twin Ping");
    if (legal?.kind !== "cast-spell" || legal.targetCount === undefined) throw new Error("not offered");
    expect(legal.targetCount.max).toBe(1);
    expect(Object.values(legal.targetCount.copies ?? {})).toEqual([10]);
    const fitted = fitTargetCount([ref, ref], legal.targetOptions, legal.targetSpecs, legal.targetCount);
    expect(distinctTargetCount(fitted ?? [], legal.targetCount.copies)).toBe(1);
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: legal.card, targets: fitted ?? [] }),
    ).not.toThrow();
  });

  it("counts, bounds and fits stacks by their size", () => {
    const stack: TargetRef = { kind: "object", object: "obj-s" as ObjectId };
    const copies = { "obj-s": 3 };
    expect(distinctTargetCount([stack, stack], copies)).toBe(2);
    expect(distinctTargetCount([stack, stack, stack, stack], copies)).toBe(3);
    expect(distinctTargetCount([stack, stack])).toBe(1);
    // Two required slots with only the stack to point at: two targets at
    // least, not one.
    expect(targetCountBounds([[stack], [stack]], ["creature", "creature"], copies)).toEqual({
      min: 2,
      max: 2,
    });
    expect(targetCountBounds([[stack], [stack]], ["creature", "creature"])).toEqual({ min: 1, max: 1 });
  });
});
