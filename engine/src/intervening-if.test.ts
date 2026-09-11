/**
 * Intervening-if triggered abilities (rule 603.4) — needed-cards P7.
 *
 * `TriggeredAbility.condition` is a `StaticCondition` checked *twice*: as the
 * event happens (a false condition means the ability never triggers at all)
 * and again as the ability resolves (a condition that has since gone false
 * removes it from the stack with no effect). Cards: Garruk's Uprising (an ETB
 * "if you control a creature with power 4 or greater"), Defense of the Heart
 * (an upkeep "if an opponent controls three or more creatures", plus the new
 * `opponent-controls` condition and the `sacrifice-source` effect).
 */

import { describe, expect, it } from "vitest";

import { staticConditionMet } from "./characteristics.js";
import { createDefaultRegistry } from "./cards.js";
import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** `library` is buried below the opening hand + first draws, so it stays in
 * A's library to be searched up. */
const mkGame = (aHand: readonly string[], library: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      {
        player: A,
        cards: [
          ...aHand,
          ...Array(12).fill("Forest"),
          ...library,
          ...Array(28).fill("Forest"),
        ],
      },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const drawsBy = (game: Game, player: PlayerId): number =>
  game.eventsOfType("card-drawn").filter((e) => e.player === player).length;
const creaturesOf = (game: Game, player: PlayerId): ObjectId[] =>
  game.battlefield.filter(
    (id) =>
      game.state.objects[id].controller === player &&
      game.characteristics(id).types.includes("creature"),
  );

describe("Garruk's Uprising — an intervening-if ETB draw", () => {
  it("doesn't trigger at all with no power-4-or-greater creature", () => {
    const { game } = mkGame(["Garruk's Uprising"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "battlefield"); // 2/2 — not big enough
    const before = drawsBy(game, A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Garruk's Uprising"),
    });
    game.advanceUntil(quiet);

    expect(drawsBy(game, A)).toBe(before);
    // The condition was false as the event happened, so the ability never went
    // on the stack at all — there is nothing to fizzle later.
    expect(game.eventsOfType("spell-fizzled")).toHaveLength(0);
  });

  it("triggers and draws when you control a creature with power 4 or greater", () => {
    const { game } = mkGame(["Garruk's Uprising"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Dragon Token", A, "battlefield"); // 5/5
    const before = drawsBy(game, A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Garruk's Uprising"),
    });
    game.advanceUntil(quiet);

    expect(drawsBy(game, A)).toBe(before + 1);
  });

  it("does nothing if the big creature is gone by the time it resolves", () => {
    const { game } = mkGame(["Garruk's Uprising", "Rapid Hybridization"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Island", A, "battlefield");
    const dragon = game.debugSpawn("Dragon Token", A, "battlefield"); // 5/5
    const before = drawsBy(game, A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Garruk's Uprising"),
    });
    // Let the enchantment resolve and its ETB trigger go on the stack.
    game.advanceUntil(
      (s) =>
        s.awaiting === null &&
        s.zones.shared.stack.length === 1 &&
        s.objects[s.zones.shared.stack[0]].abilityKind === "triggered",
    );

    // In response, swap the only big creature for a 3/3 Frog Lizard.
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Rapid Hybridization"),
      targets: [{ kind: "object", object: dragon }],
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[dragon].zone).toBe("graveyard");
    expect(drawsBy(game, A)).toBe(before);
    expect(
      game.eventsOfType("spell-fizzled").some((e) => e.reason.includes("intervening-if")),
    ).toBe(true);
  });

  it("still draws for every big creature that enters (the unconditional clause)", () => {
    const { game } = mkGame(["Rumbling Baloth", "Grizzly Bears"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Garruk's Uprising", A, "battlefield");
    for (let i = 0; i < 6; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const before = drawsBy(game, A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Rumbling Baloth"), // 4/4 — draws
    });
    game.advanceUntil(quiet);
    expect(drawsBy(game, A)).toBe(before + 1);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Grizzly Bears"), // 2/2 — doesn't
    });
    game.advanceUntil(quiet);
    expect(drawsBy(game, A)).toBe(before + 1);
  });

  it("grants trample to your creatures only", () => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Garruk's Uprising", A, "battlefield");
    const mine = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");

    expect(game.characteristics(mine).keywords.has("trample")).toBe(true);
    expect(game.characteristics(theirs).keywords.has("trample")).toBe(false);
  });
});

describe("a trigger's condition counts its own source", () => {
  it("includeSelf separates a trigger's intervening-if from a static's condition", () => {
    // A static ability's condition leaves its own permanent out of the scan (a
    // recursion guard — see `conditionInProgress`); a trigger's intervening-if
    // is evaluated outside the layer fold and must count it ("When ~ enters,
    // if you control a Dragon …" on a Dragon counts itself).
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    const dragon = game.debugSpawn("Dragon Token", A, "battlefield");
    const registry = createDefaultRegistry();
    const condition = {
      kind: "controls",
      filter: { subtype: "Dragon" },
      atLeast: 1,
    } as const;
    const source = game.state.objects[dragon];

    expect(staticConditionMet(game.state, registry, source, condition)).toBe(false);
    expect(
      staticConditionMet(game.state, registry, source, condition, { includeSelf: true }),
    ).toBe(true);
  });
});

describe("Defense of the Heart — opponent-controls + sacrifice-source", () => {
  const toATurn3Upkeep = (s: GameState): boolean =>
    s.turn.number === 3 && s.turn.step === "upkeep";

  it("doesn't trigger while the opponent controls only two creatures", () => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    const defense = game.debugSpawn("Defense of the Heart", A, "battlefield");
    game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.debugSpawn("Grizzly Bears", B, "battlefield");

    game.advanceUntil(toATurn3Upkeep);
    game.advanceUntil(quiet);

    expect(game.state.objects[defense].zone).toBe("battlefield");
    expect(creaturesOf(game, A)).toHaveLength(0);
  });

  it("counts creatures per opponent, not across them", () => {
    // Two apiece across two opponents is not "an opponent controls three or
    // more creatures".
    const C = asPlayerId("carol");
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: {
        [A]: new ScriptedController(A),
        [B]: new ScriptedController(B),
        [C]: new ScriptedController(C),
      },
      decks: [
        { player: A, cards: Array(40).fill("Forest") },
        { player: B, cards: Array(40).fill("Forest") },
        { player: C, cards: Array(40).fill("Forest") },
      ],
    });
    game.advanceUntil(toPrecombat);
    const defense = game.debugSpawn("Defense of the Heart", A, "battlefield");
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Grizzly Bears", B, "battlefield");
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Grizzly Bears", C, "battlefield");

    game.advanceUntil((s) => s.turn.number === 4 && s.turn.step === "upkeep");
    game.advanceUntil(quiet);

    expect(game.state.objects[defense].zone).toBe("battlefield");
  });

  it("sacrifices itself and fetches two creatures once an opponent has three", () => {
    const { game, a } = mkGame([], ["Grizzly Bears", "Llanowar Elves"]);
    game.advanceUntil(toPrecombat);
    const defense = game.debugSpawn("Defense of the Heart", A, "battlefield");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Grizzly Bears", B, "battlefield");
    a.chooseFromZoneFn = (_view, eligible, _min, max) => eligible.slice(0, max);

    game.advanceUntil(toATurn3Upkeep);
    game.advanceUntil(quiet);

    expect(game.state.objects[defense].zone).toBe("graveyard");
    expect(
      game.eventsOfType("permanent-sacrificed").some((e) => e.object === defense),
    ).toBe(true);
    expect(creaturesOf(game, A)).toHaveLength(2);
    expect(game.eventsOfType("library-shuffled").some((e) => e.player === A)).toBe(true);
  });

  it("does nothing at all if it left the battlefield before resolving", () => {
    // The condition still holds, but "sacrifice ~" can't be performed — so the
    // "if you do" search doesn't happen either.
    const { game, a } = mkGame(["Beast Within"], ["Grizzly Bears", "Llanowar Elves"]);
    game.advanceUntil(toPrecombat);
    const defense = game.debugSpawn("Defense of the Heart", A, "battlefield");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", A, "battlefield");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Grizzly Bears", B, "battlefield");
    a.chooseFromZoneFn = (_view, eligible, _min, max) => eligible.slice(0, max);

    game.advanceUntil(toATurn3Upkeep);
    game.advanceUntil((s) => s.zones.shared.stack.length === 1 && s.awaiting === null);

    // Destroy our own enchantment in response to its trigger.
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Beast Within"),
      targets: [{ kind: "object", object: defense }],
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[defense].zone).toBe("graveyard");
    // Only the 3/3 Beast Within token — nothing was searched up.
    expect(creaturesOf(game, A)).toHaveLength(1);
    expect(game.handOf(A).map((id) => game.state.objects[id].cardName)).not.toContain(
      "Llanowar Elves",
    );
  });
});
