/**
 * "If this is the Nth time this ability has resolved this turn" — the
 * `resolved-this-turn` condition, and the three cards built on it:
 *
 * - Omnath, Locus of Creation: landfall gains 4 life the first time, adds
 *   {R}{G}{W}{U} the second, deals 4 to each opponent and each planeswalker
 *   you don't control the third, and does nothing after that;
 * - Tannuk, Memorial Ensign: landfall pings each opponent, and draws a card
 *   the second time;
 * - Ms. Bumbleflower: a cast trigger whose second resolution draws two.
 *
 * What the count must respect: it restarts each turn; it belongs to one
 * object, so a permanent that leaves and comes back starts again (rule
 * 400.7); and it counts resolutions, so an ability whose targets all became
 * illegal (it never resolved) doesn't advance it.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { computeCharacteristics } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { poolCounts } from "../mana.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();
const START = 20; // the default `startingLife`

const setUp = (aHand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Forest")] },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const firstInHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const playLand = (game: Game): void => {
  game.dispatch({ type: "play-land", player: A, card: firstInHand(game, A, "Forest") });
  game.advanceUntil(quiet);
};
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;
const hand = (game: Game, p: PlayerId): number => game.handOf(p).length;
const pool = (game: Game) => poolCounts(game.state.players[A].manaPool);

describe("Omnath, Locus of Creation", () => {
  it("draws a card as it enters", () => {
    const { game } = setUp(["Omnath, Locus of Creation"]);
    for (const c of ["Mountain", "Forest", "Plains", "Island"]) game.debugSpawn(c, A, "battlefield");
    const before = hand(game, A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: firstInHand(game, A, "Omnath, Locus of Creation"),
    });
    game.advanceUntil(quiet);
    // The cast took Omnath out of hand, the trigger drew one back.
    expect(hand(game, A)).toBe(before);
  });

  it("gains 4, then adds RGWU, then deals 4 — and a fourth does nothing", () => {
    const { game } = setUp();
    game.debugSpawn("Omnath, Locus of Creation", A, "battlefield");
    const mine = game.debugSpawn("Chandra, Acolyte of Flame", A, "battlefield");
    const theirs = game.debugSpawn("Chandra, Acolyte of Flame", B, "battlefield");
    const loyalty = (id: ObjectId): number => game.state.objects[id].counters.loyalty ?? 0;
    const theirLoyalty = loyalty(theirs);

    playLand(game);
    expect(life(game, A)).toBe(START + 4);
    expect(pool(game)).toMatchObject({ R: 0, G: 0, W: 0, U: 0 });

    playLand(game);
    expect(life(game, A)).toBe(START + 4);
    expect(pool(game)).toMatchObject({ R: 1, G: 1, W: 1, U: 1 });

    playLand(game);
    expect(life(game, B)).toBe(START - 4);
    expect(life(game, A)).toBe(START + 4);
    // Each planeswalker you don't control; not your own.
    expect(game.state.objects[theirs].zone === "battlefield" ? loyalty(theirs) : 0).toBe(
      Math.max(0, theirLoyalty - 4),
    );
    expect(loyalty(mine)).toBe(theirLoyalty);

    playLand(game);
    expect(life(game, A)).toBe(START + 4);
    expect(life(game, B)).toBe(START - 4);
  });

  it("starts counting again the next turn", () => {
    const { game } = setUp();
    game.debugSpawn("Omnath, Locus of Creation", A, "battlefield");
    playLand(game);
    playLand(game);
    expect(life(game, A)).toBe(START + 4);

    // Alice's next turn: the first land is the first resolution again.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    playLand(game);
    expect(life(game, A)).toBe(START + 8);
  });

  it("an Omnath that left and came back is a new object with its own count", () => {
    const { game } = setUp();
    const omnath = game.debugSpawn("Omnath, Locus of Creation", A, "battlefield");
    playLand(game);
    playLand(game);
    expect(life(game, A)).toBe(START + 4);

    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [{ kind: "object", object: omnath }]);
    playLand(game);
    // First resolution for the new Omnath: 4 life, not the third-time damage.
    expect(life(game, A)).toBe(START + 8);
    expect(life(game, B)).toBe(START);
  });
});

describe("Tannuk, Memorial Ensign", () => {
  it("pings each opponent every time, and draws only on the second", () => {
    const { game } = setUp();
    game.debugSpawn("Tannuk, Memorial Ensign", A, "battlefield");
    const before = hand(game, A);

    playLand(game);
    expect(life(game, B)).toBe(START - 1);
    expect(hand(game, A)).toBe(before - 1);

    playLand(game);
    expect(life(game, B)).toBe(START - 2);
    // Played one, drew one.
    expect(hand(game, A)).toBe(before - 1);

    playLand(game);
    expect(life(game, B)).toBe(START - 3);
    expect(hand(game, A)).toBe(before - 2);
  });
});

describe("Ms. Bumbleflower", () => {
  const withBumbleflower = (aHand: readonly string[]) => {
    const setup = setUp(aHand);
    const bumble = setup.game.debugSpawn("Ms. Bumbleflower", A, "battlefield");
    for (let i = 0; i < 4; i += 1) setup.game.debugSpawn("Forest", A, "battlefield");
    return { ...setup, bumble };
  };
  const cast = (game: Game, name: string): void => {
    game.dispatch({ type: "cast-spell", player: A, card: firstInHand(game, A, name) });
    game.advanceUntil(quiet);
  };

  it("feeds the opponent a card and grows a creature with flying; the second time you draw two", () => {
    const { game, bumble } = withBumbleflower(["Sol Ring", "Sol Ring", "Sol Ring"]);
    const mine = () => hand(game, A);
    const theirs = () => hand(game, B);

    const [a0, b0] = [mine(), theirs()];
    cast(game, "Sol Ring");
    expect(theirs()).toBe(b0 + 1);
    expect(mine()).toBe(a0 - 1);
    const c = computeCharacteristics(game.state, registry, bumble);
    expect(game.state.objects[bumble].counters["+1/+1"]).toBe(1);
    expect(c.keywords).toContain("flying");

    cast(game, "Sol Ring");
    expect(theirs()).toBe(b0 + 2);
    // Cast one, drew two.
    expect(mine()).toBe(a0 - 1 - 1 + 2);

    // The third time is not the second.
    cast(game, "Sol Ring");
    expect(theirs()).toBe(b0 + 3);
    expect(mine()).toBe(a0 - 1 - 1 + 2 - 1);
  });

  it("an ability that fizzled never resolved, so it doesn't count", () => {
    const { game, a } = withBumbleflower(["Sol Ring", "Sol Ring", "Sol Ring"]);
    const victim = game.debugSpawn("Grizzly Bears", B, "battlefield");
    a.chooseTargetsFn = (_view, _source, _specs, options) =>
      options.map(
        (slot) =>
          slot.find((t) => t.kind === "object" && t.object === victim) ??
          slot.find((t) => t.kind === "player") ??
          null,
      );
    game.dispatch({ type: "cast-spell", player: A, card: firstInHand(game, A, "Sol Ring") });
    // The trigger is on the stack above Sol Ring, aimed at Bob and his Bears.
    game.advanceUntil(
      (s) => s.zones.shared.stack.length === 2 && s.awaiting === null && s.pendingTriggers.length === 0,
    );
    // Both targets go away before it resolves: Bob gains hexproof, the Bears die.
    game.debugApplyEffect(B, { kind: "grant-player-hexproof" });
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: victim }]);
    const bobBefore = hand(game, B);
    game.advanceUntil(quiet);
    expect(
      game.state.eventLog.some(
        (e) => e.type === "spell-fizzled" && e.reason === "all targets are illegal",
      ),
    ).toBe(true);
    expect(hand(game, B)).toBe(bobBefore);

    // So the next resolution is the first, and the one after is the second.
    a.chooseTargetsFn = (_view, _source, _specs, options) =>
      options.map((slot) => slot[0] ?? null);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    const mine = hand(game, A);
    cast(game, "Sol Ring");
    expect(hand(game, A)).toBe(mine - 1);
    cast(game, "Sol Ring");
    expect(hand(game, A)).toBe(mine - 2 + 2);
  });
});
