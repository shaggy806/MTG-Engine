/**
 * Escape's "exile N other cards from your graveyard" is the caster's choice
 * (rule 702.139a), made as the cost is paid. `legalActions` offers it on the
 * escape variant (`escapeExile: {count, choices}`), the `cast-spell` action
 * names the cards (`escapeExile`), and a driver that names none still gets
 * the oldest — the engine's pick before this was a choice.
 *
 * Underworld Rage-Hound is the pool's escape card: Escape—{3}{R}, exile three
 * other cards from your graveyard.
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const HOUND = "Underworld Rage-Hound";

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";

/** Alice in her first main phase with four Mountains out, the Hound in her
 * graveyard and five other cards there with it, oldest first. */
const setup = (): { game: Game; hound: ObjectId; others: ObjectId[] } => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false },
    decks: [
      { player: A, cards: Array(40).fill("Mountain") },
      { player: B, cards: Array(40).fill("Mountain") },
    ],
  });
  game.advanceUntil(atFirstMain);
  for (let i = 0; i < 4; i += 1) game.debugSpawn("Mountain", A);
  const first = game.debugSpawn("Grizzly Bears", A, "graveyard");
  const hound = game.debugSpawn(HOUND, A, "graveyard");
  const rest = ["Lightning Bolt", "Mountain", "Opt", "Mountain"].map((name) =>
    game.debugSpawn(name, A, "graveyard"),
  );
  return { game, hound, others: [first, ...rest] };
};

const escapeOffer = (
  game: Game,
  hound: ObjectId,
): Extract<LegalAction, { kind: "cast-spell" }> | undefined =>
  game
    .legalActions(A)
    .find(
      (a): a is Extract<LegalAction, { kind: "cast-spell" }> =>
        a.kind === "cast-spell" && a.card === hound && a.via === "escape",
    );

const escape = (hound: ObjectId, escapeExile?: readonly ObjectId[]) =>
  ({
    type: "cast-spell",
    player: A,
    card: hound,
    targets: [],
    via: "escape",
    ...(escapeExile !== undefined ? { escapeExile } : {}),
  }) as const;

describe("escape — choosing which cards to exile", () => {
  it("offers the exile count and every other card in the graveyard, in order", () => {
    const { game, hound, others } = setup();
    expect(game.graveyardOf(A)).toEqual([others[0], hound, ...others.slice(1)]);
    const offer = escapeOffer(game, hound);
    expect(offer?.escapeExile).toEqual({ count: 3, choices: others });
    expect(offer?.escapeExile?.choices).not.toContain(hound);
  });

  it("only the escape variant carries the offer", () => {
    const { game, hound } = setup();
    const inHand = game.debugSpawn(HOUND, A, "hand");
    const casts = game.legalActions(A).filter((a) => a.kind === "cast-spell");
    const fromHand = casts.find((a) => a.card === inHand);
    expect(fromHand).toBeDefined();
    expect(fromHand?.escapeExile).toBeUndefined();
    expect(casts.filter((a) => a.escapeExile !== undefined).map((a) => a.card)).toEqual([hound]);
  });

  it("exiles exactly the chosen cards and leaves the rest", () => {
    const { game, hound, others } = setup();
    const chosen = [others[4], others[2], others[1]];
    game.dispatch(escape(hound, chosen));
    const exile = game.state.zones.shared.exile;
    for (const id of chosen) expect(exile).toContain(id);
    expect(game.graveyardOf(A)).toEqual([others[0], others[3]]);
    expect(game.state.objects[hound].zone).toBe("stack");
    const paid = game.eventsOfType("escape-cost-paid").find((e) => e.object === hound);
    expect(paid?.exiled).toEqual(chosen);
  });

  it("still exiles the oldest three when no choice is named", () => {
    const { game, hound, others } = setup();
    game.dispatch(escape(hound));
    const exile = game.state.zones.shared.exile;
    for (const id of others.slice(0, 3)) expect(exile).toContain(id);
    expect(game.graveyardOf(A)).toEqual(others.slice(3));
  });

  describe("refuses a choice that can't pay the cost", () => {
    const refused = (
      pick: (hound: ObjectId, others: ObjectId[], game: Game) => ObjectId[],
      reason: RegExp,
    ) => {
      const { game, hound, others } = setup();
      const graveyard = [...game.graveyardOf(A)];
      const action = escape(hound, pick(hound, others, game));
      expect(game.canDispatch(action)).toMatch(reason);
      expect(() => game.dispatch(action)).toThrow(reason);
      // Nothing was paid.
      expect(game.graveyardOf(A)).toEqual(graveyard);
      expect(game.state.objects[hound].zone).toBe("graveyard");
    };

    it("too few cards", () => {
      refused((_h, others) => others.slice(0, 2), /exactly 3 other cards, not 2/);
    });

    it("too many cards", () => {
      refused((_h, others) => others.slice(0, 4), /exactly 3 other cards, not 4/);
    });

    it("the same card twice", () => {
      refused((_h, others) => [others[0], others[0], others[1]], /same card twice/);
    });

    it("the escaping card itself", () => {
      refused((hound, others) => [hound, others[0], others[1]], /can't exile itself/);
    });

    it("a card that isn't in the graveyard", () => {
      refused(
        (_h, others, game) => [others[0], others[1], game.handOf(A)[0]],
        /is not in alice's graveyard/,
      );
    });

    it("an opponent's graveyard card", () => {
      refused(
        (_h, others, game) => [others[0], others[1], game.debugSpawn("Opt", B, "graveyard")],
        /is not in alice's graveyard/,
      );
    });
  });

  it("refuses an exile list on a cast that isn't an escape", () => {
    const { game, others } = setup();
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand");
    const action = {
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
      escapeExile: others.slice(0, 3),
    } as const;
    expect(game.canDispatch(action)).toMatch(/only an escape cast/);
  });
});
