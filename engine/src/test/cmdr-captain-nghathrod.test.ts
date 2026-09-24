/**
 * Captain N'ghathrod, and the marker it needs — a card "put into a graveyard
 * from a library this turn" (`GameObject.putIntoGraveyardFromLibraryOnTurn`,
 * `CardFilter.putIntoGraveyardFromLibraryThisTurn`):
 *
 *   Horrors you control have menace.
 *   Whenever a Horror you control deals combat damage to a player, that
 *   player mills that many cards.
 *   At the beginning of your end step, choose target artifact or creature
 *   card in an opponent's graveyard that was put there from a library this
 *   turn. Put it onto the battlefield under your control.
 *
 * What each test pins down:
 *
 * - menace reaches every Horror you control, the Captain included, and not a
 *   non-Horror or an opponent's Horror;
 * - each Horror's combat damage mills "that many" — per Horror, and a
 *   non-Horror attacker mills nothing;
 * - the end-step target is an artifact or creature card milled into an
 *   **opponent's** graveyard this turn: not a milled instant or land, not a
 *   card milled into your own graveyard, and the chosen one enters under your
 *   control while its owner stays the opponent;
 * - a discarded card is not "put there from a library";
 * - a card milled on an earlier turn is not "this turn";
 * - rule 400.7: a milled card that leaves the graveyard and comes back is a
 *   new object and loses the mark.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { matchesFilter } from "../filter.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const CAPTAIN = "Captain N'ghathrod";
const registry = createDefaultRegistry();

const MILLED_THIS_TURN = { putIntoGraveyardFromLibraryThisTurn: true } as const;

const makeGame = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Swamp") })),
  });
  game.advanceUntil(
    (s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  // Every target offer the Captain's end-step trigger makes, and what was
  // picked from it.
  const offers: (readonly TargetRef[])[] = [];
  a.chooseTargetsFn = (_view, source, _specs, legal) => {
    if (source === CAPTAIN) offers.push(legal[0] ?? []);
    return legal.map((options) => options[0]);
  };
  return { game, a, b, offers };
};

const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });

/** Puts `names` on top of `player`'s library, the first name on top. */
const stackLibrary = (game: Game, player: PlayerId, names: readonly string[]): ObjectId[] =>
  [...names].reverse().map((name) => game.debugSpawn(name, player, "library")).reverse();

const milled = (game: Game, id: ObjectId): boolean =>
  matchesFilter(game.state, registry, id, MILLED_THIS_TURN, { you: A });

const mill = (game: Game, player: PlayerId, amount: number): void =>
  game.debugApplyEffect(A, { kind: "mill", target: 0, amount }, [{ kind: "player", player }]);

/** Through Alice's end step of `turn`, with its triggers resolved. */
const pastEndStep = (turn: number) => (s: GameState): boolean =>
  s.turn.number === turn && s.turn.step === "cleanup";

const objectIds = (refs: readonly TargetRef[]): ObjectId[] =>
  refs.flatMap((r) => (r.kind === "object" ? [r.object] : []));

describe("Captain N'ghathrod", () => {
  it("is a 3/5 blue-black legendary Horror Pirate", () => {
    const def = registry.get(CAPTAIN);
    expect(def.manaCost).toBe("{3}{U}{B}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.types).toEqual(["creature"]);
    expect(def.subtypes).toEqual(["Horror", "Pirate"]);
    expect([def.power, def.toughness]).toEqual([3, 5]);
    expect(identityString(colorIdentityOf(def))).toBe("UB");
  });

  it("gives Horrors you control menace, itself included", () => {
    const { game } = makeGame();
    const captain = spawn(game, CAPTAIN);
    const spitter = spawn(game, "Fume Spitter");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Fume Spitter", B);
    const menace = (id: ObjectId) => game.characteristics(id).keywords.has("menace");
    expect(menace(captain)).toBe(true);
    expect(menace(spitter)).toBe(true);
    expect(menace(bears)).toBe(false);
    expect(menace(theirs)).toBe(false);
  });

  it("mills per Horror's combat damage, then reanimates a milled artifact or creature at end step", () => {
    const { game, a, offers } = makeGame();
    const captain = spawn(game, CAPTAIN);
    const spitter = spawn(game, "Fume Spitter");
    const bears = spawn(game, "Grizzly Bears");
    // 3 (Captain) + 1 (Fume Spitter) = four cards milled; the Bears' 2 mills none.
    const [elves, bolt, ring, forest, giant] = stackLibrary(game, B, [
      "Llanowar Elves",
      "Lightning Bolt",
      "Sol Ring",
      "Forest",
      "Hill Giant",
    ]);
    // Alice's own milled creature is in the wrong graveyard.
    const [own] = stackLibrary(game, A, ["Grizzly Bears"]);
    mill(game, A, 1);
    a.declareAttackersFn = () =>
      [captain, spitter, bears].map((attacker) => ({ attacker, defender: B }));

    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main");
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);

    expect(game.state.players[B].life).toBe(20 - 6);
    for (const id of [elves, bolt, ring, forest]) {
      expect(game.state.objects[id].zone).toBe("graveyard");
      expect(milled(game, id)).toBe(true);
    }
    expect(game.state.objects[giant].zone).toBe("library");

    game.advanceUntil(pastEndStep(1));

    expect(offers).toHaveLength(1);
    expect(objectIds(offers[0]).sort()).toEqual([elves, ring].sort());
    expect(objectIds(offers[0])).not.toContain(own);
    // The first option was taken: it's on Alice's side of the table, still Bob's card.
    const taken = objectIds(offers[0])[0];
    expect(game.state.objects[taken].zone).toBe("battlefield");
    expect(game.state.objects[taken].controller).toBe(A);
    expect(game.state.objects[taken].owner).toBe(B);
  });

  it("does not offer a discarded card", () => {
    const { game, offers } = makeGame();
    spawn(game, CAPTAIN);
    const bears = game.debugSpawn("Grizzly Bears", B, "hand");
    game.debugApplyEffect(A, { kind: "discard-hand", who: "each-opponent" });
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(milled(game, bears)).toBe(false);
    // Nor is one spawned there: `debugSpawn` stages through the library, which
    // must not read as a mill.
    const spawned = game.debugSpawn("Hill Giant", B, "graveyard");
    expect(milled(game, spawned)).toBe(false);

    game.advanceUntil(pastEndStep(1));

    expect(offers).toHaveLength(0);
    expect(game.state.objects[bears].zone).toBe("graveyard");
  });

  it("does not offer a card milled on an earlier turn", () => {
    const { game, offers } = makeGame();
    const [bears] = stackLibrary(game, B, ["Grizzly Bears"]);
    mill(game, B, 1);
    expect(milled(game, bears)).toBe(true);

    // The Captain arrives on Bob's turn, so its first end step is Alice's turn 3.
    game.advanceUntil((s) => s.turn.number === 2);
    expect(milled(game, bears)).toBe(false);
    spawn(game, CAPTAIN);
    game.advanceUntil(pastEndStep(3));

    expect(offers).toHaveLength(0);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.objects[bears].controller).toBe(B);
  });

  it("forgets the mark when the card leaves the graveyard and comes back (rule 400.7)", () => {
    const { game } = makeGame();
    const [bears] = stackLibrary(game, B, ["Grizzly Bears"]);
    mill(game, B, 1);
    expect(milled(game, bears)).toBe(true);

    game.debugApplyEffect(B, {
      kind: "return-from-graveyard",
      filter: { name: "Grizzly Bears" },
      destination: "hand",
      count: "all",
    });
    expect(game.state.objects[bears].zone).toBe("hand");
    expect(milled(game, bears)).toBe(false);
    game.debugApplyEffect(A, { kind: "discard-hand", who: "each-opponent" });
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(milled(game, bears)).toBe(false);
  });
});
