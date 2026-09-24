/**
 * Liesa, Shroud of Dusk — "Flying, lifelink / Rather than pay {2} for each
 * previous time you've cast this spell from the command zone this game, pay 2
 * life that many times. / Whenever a player casts a spell, they lose 2 life."
 *
 * Driven through the real `Game` with Liesa as Alice's commander. What each
 * test pins down:
 *
 * - the commander tax becomes life (`commanderTaxAsLife`): the first cast
 *   pays nothing extra, a third pays 4 life and no extra mana;
 * - rule 119.4: the life can be paid down to exactly 0, but not from below the
 *   payment — and a painland's damage, taken while paying the mana, counts
 *   against the same total;
 * - a cast from anywhere but the command zone owes no tax in either currency;
 * - every player who casts a spell loses 2, Liesa's own controller included,
 *   while Liesa's own cast (her ability isn't on the battlefield yet) fires
 *   nothing.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const LIESA = "Liesa, Shroud of Dusk";
const registry = createDefaultRegistry();

const makeGame = () => {
  const controllers: Record<PlayerId, ScriptedController> = {
    [A]: new ScriptedController(A),
    [B]: new ScriptedController(B),
  };
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: [
      { player: A, cards: Array<string>(40).fill("Plains"), commander: LIESA },
      { player: B, cards: Array<string>(40).fill("Plains") },
    ],
  });
  game.advanceUntil(
    (s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  const liesa = game.state.zones.shared.command.find(
    (id) => game.state.objects[id].cardName === LIESA,
  );
  if (liesa === undefined) throw new Error("Liesa is not in the command zone");
  return { game, liesa };
};

const giveLands = (game: Game, player: PlayerId, name: string, n: number): ObjectId[] => {
  const ids: ObjectId[] = [];
  for (let i = 0; i < n; i += 1) {
    ids.push(game.debugSpawn(name, player, "battlefield", { summoningSick: false }));
  }
  return ids;
};

/** Exactly {2}{W}{W}{B}: three Plains and two Swamps. */
const liesaMana = (game: Game): ObjectId[] => [
  ...giveLands(game, A, "Plains", 3),
  ...giveLands(game, A, "Swamp", 2),
];

const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const life = (game: Game, player: PlayerId): number => game.state.players[player].life;

const setPreviousCasts = (game: Game, n: number): void => {
  game.state.players[A].commanderCastCounts[LIESA] = n;
};

const canCast = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === card);

const lifeLossEvents = (game: Game, player: PlayerId): number[] =>
  game.state.eventLog.flatMap((e) =>
    e.type === "life-changed" && e.player === player && e.delta < 0 ? [e.delta] : [],
  );

describe("Liesa, Shroud of Dusk", () => {
  it("is a 5/5 white-black legendary Angel with flying and lifelink", () => {
    const def = registry.get(LIESA);
    expect(def.manaCost).toBe("{2}{W}{W}{B}");
    expect(def.colors).toEqual(["W", "B"]);
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.types).toEqual(["creature"]);
    expect(def.subtypes).toEqual(["Angel"]);
    expect([def.power, def.toughness]).toEqual([5, 5]);
    expect(def.keywords).toEqual(["flying", "lifelink"]);
    expect(def.commanderTaxAsLife).toBe(true);
    expect(identityString(colorIdentityOf(def))).toBe("WB");
  });

  it("first cast from the command zone pays the printed cost and no life", () => {
    const { game, liesa } = makeGame();
    const lands = liesaMana(game);
    const before = life(game, A);

    game.dispatch({ type: "cast-spell", player: A, card: liesa, targets: [] });
    game.advanceUntil(settled);

    expect(game.state.objects[liesa].zone).toBe("battlefield");
    expect(lands.every((id) => game.state.objects[id].tapped)).toBe(true);
    // No tax, and her own cast doesn't set off her drain.
    expect(life(game, A)).toBe(before);
    expect(life(game, B)).toBe(20);
    expect(game.state.players[A].commanderCastCounts[LIESA]).toBe(1);
  });

  it("a third cast pays 4 life and not a single extra mana", () => {
    const { game, liesa } = makeGame();
    const lands = liesaMana(game);
    setPreviousCasts(game, 2);
    const before = life(game, A);

    // Five lands is exactly the printed cost — an ordinary {4} tax would make
    // this uncastable.
    expect(canCast(game, liesa)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: liesa, targets: [] });
    game.advanceUntil(settled);

    expect(game.state.objects[liesa].zone).toBe("battlefield");
    expect(lands.every((id) => game.state.objects[id].tapped)).toBe(true);
    expect(life(game, A)).toBe(before - 4);
    expect(lifeLossEvents(game, A)).toEqual([-4]);
    expect(game.state.objects[liesa].manaSpent).toBe(5);
    expect(game.state.players[A].commanderCastCounts[LIESA]).toBe(3);
  });

  it("the life can be paid down to exactly 0, but not from below the payment (rule 119.4)", () => {
    const { game, liesa } = makeGame();
    liesaMana(game);
    setPreviousCasts(game, 2);

    game.state.players[A].life = 3;
    expect(canCast(game, liesa)).toBe(false);
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: liesa, targets: [] }),
    ).toThrow();
    expect(game.state.objects[liesa].zone).toBe("command");
    expect(life(game, A)).toBe(3);

    game.state.players[A].life = 4;
    expect(canCast(game, liesa)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: liesa, targets: [] });
    game.advanceUntil((s) => s.result !== null);
    expect(life(game, A)).toBe(0);
    expect(game.state.result).not.toBeNull();
  });

  it("a painland's damage while paying the mana comes out of the same life", () => {
    const { game, liesa } = makeGame();
    // Caves of Koilos is the only black source, so the {B} costs 1 damage.
    giveLands(game, A, "Plains", 4);
    giveLands(game, A, "Caves of Koilos", 1);
    setPreviousCasts(game, 2);

    // At 4 life the Caves would take Alice to 3 before the 4 life is paid —
    // an illegal payment, so the cast isn't offered at all.
    game.state.players[A].life = 4;
    expect(canCast(game, liesa)).toBe(false);

    game.state.players[A].life = 6;
    expect(canCast(game, liesa)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: liesa, targets: [] });
    game.advanceUntil(settled);
    expect(game.state.objects[liesa].zone).toBe("battlefield");
    expect(life(game, A)).toBe(1);
  });

  it("owes no tax at all when cast from hand after being bounced", () => {
    const { game, liesa } = makeGame();
    const lands = liesaMana(game);
    setPreviousCasts(game, 2);
    game.dispatch({ type: "cast-spell", player: A, card: liesa, targets: [] });
    game.advanceUntil(settled);
    expect(game.state.objects[liesa].zone).toBe("battlefield");

    // Bob bounces her; Alice declines the command zone (rule 903.9a) so she
    // lands in hand.
    giveLands(game, B, "Island", 1);
    const unsummon = game.debugSpawn("Unsummon", B, "hand");
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: unsummon,
      targets: [{ kind: "object", object: liesa }],
    });
    game.advanceUntil((s) => s.awaiting !== null || settled(s));
    if (game.state.awaiting?.kind === "commander-replacement") {
      game.dispatch({ type: "commander-replacement", player: A, toCommandZone: false });
    }
    game.advanceUntil(settled);
    expect(game.state.objects[liesa].zone).toBe("hand");

    for (const id of lands) game.state.objects[id].tapped = false;
    const before = life(game, A);
    game.dispatch({ type: "cast-spell", player: A, card: liesa, targets: [] });
    game.advanceUntil(settled);

    expect(game.state.objects[liesa].zone).toBe("battlefield");
    expect(life(game, A)).toBe(before);
    // Not a cast from the command zone, so the count doesn't move either.
    expect(game.state.players[A].commanderCastCounts[LIESA]).toBe(3);
  });

  it("makes every player who casts a spell lose 2 life, her controller included", () => {
    const { game } = makeGame();
    game.debugSpawn(LIESA, A, "battlefield");

    giveLands(game, A, "Plains", 1);
    const solRing = game.debugSpawn("Sol Ring", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: solRing });
    game.advanceUntil(settled);
    expect(life(game, A)).toBe(18);
    expect(life(game, B)).toBe(20);

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
    // Bob cast it, so Bob loses the 2; Alice's further 3 is the Bolt.
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(15);
  });
});
