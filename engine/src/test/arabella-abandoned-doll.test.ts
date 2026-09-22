/**
 * Arabella, Abandoned Doll: "Whenever Arabella attacks, it deals X damage to
 * each opponent and you gain X life, where X is the number of creatures you
 * control with power 2 or less."
 *
 * Driven through the real `Game`: the attack declaration, the trigger going on
 * the stack, priority with it there, and resolution. What each test pins down:
 *
 * - it fires when Arabella attacks, and not when another creature attacks
 *   without her;
 * - "each opponent": every opponent at a three-player table, whichever one
 *   she attacked, and never you;
 * - X counts creatures **you** control whose **computed** power is 2 or less.
 *   Arabella counts herself while she qualifies. Opponents' creatures and
 *   noncreature artifacts don't count, and an anthem or counters move a
 *   creature across the line;
 * - X is read as the ability resolves (the 2024-09-20 ruling, rule 608.2h), so
 *   a pump in response changes it, and the ability still resolves after
 *   Arabella has left the battlefield;
 * - "you" is the ability's controller, not Arabella's current one: stealing
 *   her in response changes neither who counts, who is hit nor who gains;
 * - "it deals": the damage is Arabella's, noncombat, so her lifelink applies.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import type { GameEvent } from "../events.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const ARABELLA = "Arabella, Abandoned Doll";
const registry = createDefaultRegistry();

const makeGame = (players: readonly PlayerId[] = [A, B]) => {
  const controllers: Record<PlayerId, ScriptedController> = {};
  for (const p of players) controllers[p] = new ScriptedController(p);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Plains") })),
  });
  game.advanceUntil(
    (s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  return { game, a: controllers[A] };
};

/** A permanent for `player` that can attack (or tap for mana) this turn. */
const ready = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

/** Arabella's trigger is on the stack and Alice holds priority over it. */
const triggerOnStack = (s: GameState): boolean =>
  s.turn.step === "declare-attackers" &&
  s.zones.shared.stack.length === 1 &&
  s.awaiting === null &&
  s.priority.holder === A;

/** Past the declare-attackers step, so the trigger has resolved, and before
 * combat damage, so every life total is still the trigger's doing alone. */
const afterTrigger = (s: GameState): boolean => s.turn.step === "declare-blockers";

type DamageDealt = Extract<GameEvent, { type: "damage-dealt" }>;
const noncombatDamageFrom = (game: Game, source: ObjectId): DamageDealt[] =>
  game.state.eventLog.filter(
    (e): e is DamageDealt => e.type === "damage-dealt" && e.source === source && !e.combat,
  );

const life = (game: Game, player: PlayerId): number => game.state.players[player].life;

describe("Arabella, Abandoned Doll", () => {
  it("is a 1/3 red-white legendary artifact creature — Toy with one attack trigger", () => {
    const def = registry.get(ARABELLA);
    expect(def.manaCost).toBe("{R}{W}");
    expect(def.colors).toEqual(["R", "W"]);
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.types).toEqual(["artifact", "creature"]);
    expect(def.subtypes).toEqual(["Toy"]);
    expect([def.power, def.toughness]).toEqual([1, 3]);
    expect(identityString(colorIdentityOf(def))).toBe("WR");
    expect(def.triggered).toHaveLength(1);
    expect(def.triggered[0].trigger).toEqual({ on: "attacks", who: "self" });
    expect(def.triggered[0].targets).toEqual([]);
  });

  it("deals X to each opponent and gains X, counting only your creatures with power 2 or less", () => {
    const { game, a } = makeGame([A, B, C]);
    const arabella = ready(game, ARABELLA); // 1/3 — counts herself
    ready(game, "Llanowar Elves"); // 1/1 — counts
    ready(game, "Grizzly Bears"); // 2/2 — counts (exactly 2)
    ready(game, "Hill Giant"); // 3/3 — too big
    ready(game, "Sol Ring"); // an artifact, but not a creature
    ready(game, "Llanowar Elves", B); // small, but not yours
    ready(game, "Grizzly Bears", C);

    a.declareAttackersFn = () => [{ attacker: arabella, defender: B }];
    game.advanceUntil(afterTrigger);

    // X = 3. Carol takes it too: "each opponent", not just the one attacked.
    expect(life(game, B)).toBe(17);
    expect(life(game, C)).toBe(17);
    expect(life(game, A)).toBe(23);

    // Arabella is the source, the damage is noncombat, and it never hits you.
    const hits = noncombatDamageFrom(game, arabella);
    expect(hits.map((e) => e.target)).toEqual([
      { kind: "player", player: B },
      { kind: "player", player: C },
    ]);
    expect(hits.every((e) => e.amount === 3)).toBe(true);

    // Her combat damage is separate, and only to the player she attacked.
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(life(game, B)).toBe(16);
    expect(life(game, C)).toBe(17);
    expect(life(game, A)).toBe(23);
  });

  it("doesn't trigger when another creature attacks without her", () => {
    const { game, a } = makeGame();
    ready(game, ARABELLA);
    const elves = ready(game, "Llanowar Elves");

    a.declareAttackersFn = () => [{ attacker: elves, defender: B }];
    game.advanceUntil(afterTrigger);

    expect(life(game, B)).toBe(20);
    expect(life(game, A)).toBe(20);
  });

  it("reads computed power: an anthem lifts a 2/2 out of X and leaves a 1/1 in", () => {
    const { game, a } = makeGame();
    const arabella = ready(game, ARABELLA);
    const elves = ready(game, "Llanowar Elves");
    const bears = ready(game, "Grizzly Bears");
    ready(game, "Glorious Anthem");
    // Arabella 2/4 and the Elves 2/2 still count; the Bears are now 3/3.
    expect(game.characteristics(arabella).power).toBe(2);
    expect(game.characteristics(elves).power).toBe(2);
    expect(game.characteristics(bears).power).toBe(3);

    a.declareAttackersFn = () => [{ attacker: arabella, defender: B }];
    game.advanceUntil(afterTrigger);

    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
  });

  it("counts Arabella only while her own power is 2 or less, and does nothing at X = 0", () => {
    const { game, a } = makeGame();
    const arabella = ready(game, ARABELLA);
    ready(game, "Hill Giant");
    game.debugApplyEffect(
      A,
      { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
      [obj(arabella)],
    );
    expect(game.characteristics(arabella).power).toBe(3);

    a.declareAttackersFn = () => [{ attacker: arabella, defender: B }];
    game.advanceUntil(afterTrigger);

    // The trigger still fired and resolved, with nothing to count.
    expect(
      game.state.eventLog.some((e) => e.type === "ability-resolved" && e.source === arabella),
    ).toBe(true);
    expect(noncombatDamageFrom(game, arabella)).toEqual([]);
    expect(life(game, B)).toBe(20);
    expect(life(game, A)).toBe(20);
  });

  it("fixes X as the ability resolves: a Giant Growth in response takes the pumped creature out", () => {
    const { game, a } = makeGame();
    const arabella = ready(game, ARABELLA);
    const elves = ready(game, "Llanowar Elves");
    ready(game, "Grizzly Bears");
    ready(game, "Forest");
    const growth = game.debugSpawn("Giant Growth", A, "hand");

    a.declareAttackersFn = () => [{ attacker: arabella, defender: B }];
    game.advanceUntil(triggerOnStack);
    // X would be 3 if it were read as the ability triggered.
    game.dispatch({ type: "cast-spell", player: A, card: growth, targets: [obj(elves)] });
    game.advanceUntil(afterTrigger);

    expect(game.characteristics(elves).power).toBe(4);
    // X = 2: Arabella and the Bears.
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
  });

  it("still resolves after Arabella has left the battlefield, counting what's left", () => {
    const { game, a } = makeGame();
    const arabella = ready(game, ARABELLA);
    ready(game, "Llanowar Elves");
    ready(game, "Grizzly Bears");
    for (let i = 0; i < 3; i += 1) ready(game, "Swamp");
    const murder = game.debugSpawn("Murder", A, "hand");

    a.declareAttackersFn = () => [{ attacker: arabella, defender: B }];
    game.advanceUntil(triggerOnStack);
    game.dispatch({ type: "cast-spell", player: A, card: murder, targets: [obj(arabella)] });
    game.advanceUntil(afterTrigger);

    expect(game.state.objects[arabella].zone).toBe("graveyard");
    // The ability exists independently of its source (rule 113.7a). X = 2:
    // the Elves and the Bears, and no longer Arabella.
    expect(noncombatDamageFrom(game, arabella).map((e) => e.amount)).toEqual([2]);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
  });

  it("stays its controller's ability when Arabella changes hands in response", () => {
    const { game, a } = makeGame();
    const arabella = ready(game, ARABELLA);
    ready(game, "Llanowar Elves");
    ready(game, "Grizzly Bears");
    ready(game, "Llanowar Elves", B);

    a.declareAttackersFn = () => [{ attacker: arabella, defender: B }];
    game.advanceUntil(triggerOnStack);
    game.debugApplyEffect(
      B,
      { kind: "gain-control", target: 0, untilEndOfTurn: true },
      [obj(arabella)],
    );
    expect(game.state.objects[arabella].controller).toBe(B);
    game.advanceUntil(afterTrigger);

    // The ability is still Alice's (rule 113.8), so "you" is Alice: X counts
    // the creatures *she* controls (the Elves and the Bears, not Arabella and
    // not Bob's Elves), Bob is the opponent dealt damage, and Alice gains.
    expect(noncombatDamageFrom(game, arabella).map((e) => e.amount)).toEqual([2]);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
  });

  it("is Arabella's damage, so her lifelink gains that life on top of the X", () => {
    const { game, a } = makeGame();
    const arabella = ready(game, ARABELLA);
    ready(game, "Llanowar Elves");
    game.debugApplyEffect(
      A,
      { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "end-of-turn" },
      [obj(arabella)],
    );

    a.declareAttackersFn = () => [{ attacker: arabella, defender: B }];
    game.advanceUntil(afterTrigger);

    // X = 2: 2 damage to Bob, 2 life from lifelink, 2 more from the ability.
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(24);
  });
});
