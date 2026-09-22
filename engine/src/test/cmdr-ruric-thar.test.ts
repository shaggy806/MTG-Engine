/**
 * Ruric Thar, the Unbowed — "Reach, vigilance / Ruric Thar attacks each combat
 * if able. / Whenever a player casts a noncreature spell, Ruric Thar deals 6
 * damage to that player."
 *
 * Driven through the real `Game`: casts are dispatched, the trigger goes on the
 * stack above the spell that fired it, and priority is passed by hand so a
 * response can be cast in between. What each test pins down:
 *
 * - **a** player, not an opponent: the caster takes 6 whoever they are, its own
 *   controller included (the 2018-03-16 ruling), and it is *that* player alone
 *   — not each opponent, and not whoever's turn it is;
 * - **noncreature**: a creature spell fires nothing, and neither does a land
 *   drop (a land is played, not cast);
 * - the ability is Ruric Thar's noncombat damage, and it resolves above the
 *   spell — so it still happens when that spell is countered;
 * - "attacks each combat if able" forces it into combat when its controller
 *   declares nothing, and vigilance leaves it untapped; a Ruric Thar that
 *   *can't* attack is not forced.
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

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const RURIC_THAR = "Ruric Thar, the Unbowed";
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

/** Ruric Thar on `player`'s battlefield. Summoning-sick by default, so combat
 * stays quiet in the tests that are about the cast trigger. */
const spawnRuricThar = (
  game: Game,
  player: PlayerId = A,
  opts: { tapped?: boolean; summoningSick?: boolean } = {},
): ObjectId => game.debugSpawn(RURIC_THAR, player, "battlefield", opts);

const giveLands = (game: Game, player: PlayerId, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) {
    game.debugSpawn(name, player, "battlefield", { summoningSick: false });
  }
};

const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const life = (game: Game, player: PlayerId): number => game.state.players[player].life;

type DamageDealt = Extract<GameEvent, { type: "damage-dealt" }>;
const noncombatDamageFrom = (game: Game, source: ObjectId): DamageDealt[] =>
  game.state.eventLog.filter(
    (e): e is DamageDealt => e.type === "damage-dealt" && e.source === source && !e.combat,
  );

describe("Ruric Thar, the Unbowed", () => {
  it("is a 6/6 red-green legendary Ogre Warrior with reach, vigilance and a must-attack clause", () => {
    const def = registry.get(RURIC_THAR);
    expect(def.manaCost).toBe("{4}{R}{G}");
    expect(def.colors).toEqual(["R", "G"]);
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.types).toEqual(["creature"]);
    expect(def.subtypes).toEqual(["Ogre", "Warrior"]);
    expect([def.power, def.toughness]).toEqual([6, 6]);
    expect(def.keywords).toEqual(["reach", "vigilance"]);
    expect(identityString(colorIdentityOf(def))).toBe("RG");

    expect(def.triggered).toHaveLength(1);
    expect(def.triggered[0].trigger).toEqual({
      on: "cast-spell",
      who: "any",
      noncreatureOnly: true,
    });
    expect(def.triggered[0].targets).toEqual([]);

    // The computed characteristics a live permanent shows the board.
    const { game } = makeGame();
    const ruric = spawnRuricThar(game);
    const c = game.characteristics(ruric);
    expect([c.power, c.toughness]).toEqual([6, 6]);
    expect(c.keywords).toContain("reach");
    expect(c.keywords).toContain("vigilance");
    expect(c.restrictions).toContain("must-attack");
  });

  it("deals 6 to an opponent who casts a noncreature spell", () => {
    const { game } = makeGame();
    const ruric = spawnRuricThar(game);
    giveLands(game, B, "Mountain", 1);
    const bolt = game.debugSpawn("Lightning Bolt", B, "hand");

    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: bolt,
      targets: [{ kind: "player", player: A }],
    });
    game.advanceUntil(settled);

    // Bob cast it, so Bob takes the 6 — not Alice, who merely controls Ruric
    // Thar. Alice's 3 is the Bolt, which resolved underneath the trigger.
    expect(life(game, B)).toBe(14);
    expect(life(game, A)).toBe(17);

    const hits = noncombatDamageFrom(game, ruric);
    expect(hits).toHaveLength(1);
    expect(hits[0].amount).toBe(6);
    expect(hits[0].target).toEqual({ kind: "player", player: B });
  });

  it("hits its own controller too — 'a player' includes you", () => {
    const { game } = makeGame();
    const ruric = spawnRuricThar(game);
    giveLands(game, A, "Plains", 1);
    const solRing = game.debugSpawn("Sol Ring", A, "hand");

    game.dispatch({ type: "cast-spell", player: A, card: solRing });
    game.advanceUntil(settled);

    expect(game.state.objects[solRing].zone).toBe("battlefield");
    expect(life(game, A)).toBe(14);
    expect(life(game, B)).toBe(20);
    expect(noncombatDamageFrom(game, ruric).map((e) => e.target)).toEqual([
      { kind: "player", player: A },
    ]);
  });

  it("does not fire on a creature spell, nor on a land being played", () => {
    const { game } = makeGame();
    const ruric = spawnRuricThar(game);
    giveLands(game, A, "Forest", 2);
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    const forest = game.debugSpawn("Forest", A, "hand");

    game.dispatch({ type: "play-land", player: A, card: forest });
    game.advanceUntil(settled);
    expect(game.state.objects[forest].zone).toBe("battlefield");
    expect(noncombatDamageFrom(game, ruric)).toEqual([]);

    game.dispatch({ type: "cast-spell", player: A, card: bears });
    game.advanceUntil(settled);

    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(noncombatDamageFrom(game, ruric)).toEqual([]);
    expect(life(game, A)).toBe(20);
    expect(life(game, B)).toBe(20);
  });

  it("hits only the caster at a three-player table, not each opponent", () => {
    const { game } = makeGame([A, B, C]);
    const ruric = spawnRuricThar(game);
    giveLands(game, B, "Mountain", 1);
    const bolt = game.debugSpawn("Lightning Bolt", B, "hand");

    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: bolt,
      targets: [{ kind: "player", player: C }],
    });
    game.advanceUntil(settled);

    // "That player" is Bob, who cast it — not Alice (the active player and
    // Ruric Thar's controller) and not Carol, whom the Bolt hit for 3.
    expect(life(game, B)).toBe(14);
    expect(life(game, A)).toBe(20);
    expect(life(game, C)).toBe(17);
    expect(noncombatDamageFrom(game, ruric).map((e) => e.target)).toEqual([
      { kind: "player", player: B },
    ]);
  });

  it("still resolves when the spell that fired it is countered", () => {
    const { game } = makeGame();
    const ruric = spawnRuricThar(game);
    giveLands(game, A, "Island", 2);
    giveLands(game, B, "Mountain", 1);
    const counter = game.debugSpawn("Counterspell", A, "hand");
    const bolt = game.debugSpawn("Lightning Bolt", B, "hand");

    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: bolt,
      targets: [{ kind: "player", player: A }],
    });
    // Bob's trigger is placed above the Bolt and priority comes back round to
    // Alice, who answers it — Counterspell is itself a noncreature spell, so
    // the ability fires a second time, at her.
    game.advanceUntil((s) => s.priority.holder === A && s.zones.shared.stack.length === 2);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: counter,
      targets: [{ kind: "object", object: bolt }],
    });
    game.advanceUntil(settled);

    expect(game.eventsOfType("spell-countered").some((e) => e.object === bolt)).toBe(true);
    // Alice took the 6 from her own Counterspell and none of the Bolt's 3;
    // Bob's trigger resolved under the counter all the same.
    expect(life(game, A)).toBe(14);
    expect(life(game, B)).toBe(14);
    expect(noncombatDamageFrom(game, ruric).map((e) => e.target)).toEqual([
      { kind: "player", player: A },
      { kind: "player", player: B },
    ]);
  });

  it("attacks each combat if able even when its controller declares nothing, and vigilance leaves it untapped", () => {
    const { game } = makeGame();
    const ruric = spawnRuricThar(game, A, { summoningSick: false });

    // `declareAttackersFn` defaults to an empty declaration — the requirement
    // has to put Ruric Thar in by itself. Read it before combat ends, since
    // `attacking` is cleared once the step is over.
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(game.state.objects[ruric].attacking).toBe(B);
    expect(game.state.objects[ruric].tapped).toBe(false);

    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(life(game, B)).toBe(14);
  });

  it("is not forced to attack when it can't — a tapped Ruric Thar stays home", () => {
    const { game } = makeGame();
    const ruric = spawnRuricThar(game, A, { summoningSick: false, tapped: true });

    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(game.state.objects[ruric].attacking).toBe(null);

    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(life(game, B)).toBe(20);
  });
});
