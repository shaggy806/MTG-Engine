import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import { publicNameAt } from "../state.js";
import type { GameState } from "../state.js";

// The history names an event's objects by what everyone knew them to be when
// the event happened (`PublicStint`), so a line doesn't lose its card's name
// once the card goes somewhere hidden — and never gains one nobody knew.

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const quiet = (s: GameState): boolean => s.zones.shared.stack.length === 0 && s.awaiting === null;
/** The name Bob's history gives `id` in the event numbered `seq`. */
const seenAs = (game: Game, id: ObjectId, seq: number): string | undefined =>
  publicNameAt(game.viewFor(B).publicStints, id, seq);
const lastSeq = (game: Game): number => game.state.eventSeq - 1;

describe("public stints", () => {
  it("a bounced permanent keeps its name in every line up to and past the bounce", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    const onBoard = lastSeq(game);
    game.debugApplyEffect(B, { kind: "return-to-hand", target: 0 }, [{ kind: "object", object: bears }]);
    game.advanceUntil(quiet);
    const bounced = game.eventsOfType("permanent-returned-to-hand").find((e) => e.object === bears);
    if (bounced === undefined) throw new Error("no bounce event");

    // Bob can't see it now…
    expect(game.viewFor(B).objects[bears]).toBeUndefined();
    // …but the history still knows what it was, including in the bounce itself.
    expect(seenAs(game, bears, onBoard + 1)).toBe("Grizzly Bears");
    expect(seenAs(game, bears, bounced.seq)).toBe("Grizzly Bears");
  });

  it("a card drawn and later cast isn't named in the draw", () => {
    const game = setUp();
    const bolt = game.debugSpawn("Lightning Bolt", A, "library");
    game.state.zones.perPlayer[A].library = [
      bolt,
      ...game.state.zones.perPlayer[A].library.filter((id) => id !== bolt),
    ];
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    const drawn = game.eventsOfType("card-drawn").find((e) => e.object === bolt);
    if (drawn === undefined) throw new Error("no draw event");
    game.debugSpawn("Mountain", A, "battlefield");
    game.dispatch({ type: "cast-spell", player: A, card: bolt, targets: [{ kind: "player", player: B }] });
    game.advanceUntil(quiet);

    expect(seenAs(game, bolt, lastSeq(game))).toBe("Lightning Bolt");
    expect(seenAs(game, bolt, drawn.seq)).toBeUndefined();
  });

  it("knowledge ends when the card moves on from a hidden zone, or its library is shuffled", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    game.debugApplyEffect(B, { kind: "put-on-library", target: 0, position: "top" }, [
      { kind: "object", object: bears },
    ]);
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("library");
    // On top of Alice's library, known to be there.
    expect(seenAs(game, bears, lastSeq(game))).toBe("Grizzly Bears");

    (game as unknown as { shuffleLibraryOf(player: typeof A): void }).shuffleLibraryOf(A);
    const shuffled = game.eventsOfType("library-shuffled").at(-1);
    if (shuffled === undefined) throw new Error("no shuffle event");
    expect(seenAs(game, bears, shuffled.seq - 1)).toBe("Grizzly Bears");
    expect(seenAs(game, bears, shuffled.seq)).toBeUndefined();
  });
});
