import { describe, expect, it } from "vitest";

import { HeuristicBotController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

// Rule 702.85a: cascade's caster may cast the card it finds without paying
// its mana cost — a real cast, chosen as any cast is (rule 601.2b–c): its
// targets, modes, kicker and costs are theirs to choose, or they decline.
// The offer is a `cast-now` decision; then everything still exiled goes to
// the bottom in a random order.

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const settled = (s: GameState): boolean => s.zones.shared.stack.length === 0 && s.awaiting === null;

const cascadeOffer = (s: GameState): boolean => s.awaiting?.kind === "cast-now";

/** Alice casts Bloodbraid Elf; under the opening hand and the first draw the
 * library's top two are an Island the cascade skips, then Lightning Bolt.
 * Stops at the offer (or once everything has settled, when there isn't one). */
const castElf = (opts: { thalia?: boolean; mountains?: number } = {}): { game: Game; bolt: ObjectId } => {
  const hand = ["Bloodbraid Elf", ...Array(6).fill("Mountain")];
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false },
    decks: [
      { player: A, cards: [...hand, "Mountain", "Island", "Lightning Bolt", ...Array(40).fill("Mountain")] },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });
  game.advanceUntil(atFirstMain);
  if (opts.thalia === true) game.debugSpawn("Thalia, Guardian of Thraben", B, "battlefield");
  game.debugSpawn("Forest", A, "battlefield");
  for (let i = 0; i < (opts.mountains ?? 3); i++) game.debugSpawn("Mountain", A, "battlefield");
  const elf = game.handOf(A).find((id) => game.state.objects[id].cardName === "Bloodbraid Elf");
  if (elf === undefined) throw new Error("no Bloodbraid Elf in hand");
  game.dispatch({ type: "cast-spell", player: A, card: elf, targets: [] });
  game.advanceUntil((s) => cascadeOffer(s) || settled(s));
  const bolt = Object.values(game.state.objects).find((o) => o.cardName === "Lightning Bolt");
  if (bolt === undefined) throw new Error("no Lightning Bolt");
  return { game, bolt: bolt.id };
};

describe("cascade's \"you may cast it\" (rule 702.85a)", () => {
  it("offers the card found as a free cast, its targets the caster's to choose", () => {
    const { game, bolt } = castElf();
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "cast-now") throw new Error("cascade didn't ask");
    expect(awaiting.player).toBe(A);
    expect(awaiting.cards).toEqual([bolt]);
    expect(awaiting.free).toBe(true);
    expect(awaiting.freeCastOf).toBe("cascade");
    // Both players are there to aim the Bolt at, not just the first of them.
    const offer = awaiting.offers.find((o) => o.card === bolt);
    const players = (offer?.targetOptions[0] ?? []).flatMap((t) => (t.kind === "player" ? [t.player] : []));
    expect(players).toEqual(expect.arrayContaining([A, B]));
  });

  it("the bot says yes: a free spell is worth about a card to it", () => {
    const { game, bolt } = castElf();
    if (!cascadeOffer(game.state)) throw new Error("cascade didn't ask");
    const bot = new HeuristicBotController(A);
    const answer = bot.act({ state: game.state, player: A, legalActions: () => game.legalActions(A) });
    expect(answer.type).toBe("cast-now");
    expect(answer.type === "cast-now" && answer.cast?.type === "cast-spell" && answer.cast.card).toBe(bolt);
  });

  it("cast at the target chosen, it's cast via cascade, and the cards passed over go to the bottom after", () => {
    const { game, bolt } = castElf();
    const island = Object.values(game.state.objects).find((o) => o.cardName === "Island");
    // Still exiled while the choice is asked: "then put all cards exiled this
    // way that weren't cast on the bottom".
    expect(island?.zone).toBe("exile");
    game.dispatch({
      type: "cast-now",
      player: A,
      cast: { type: "cast-spell", player: A, card: bolt, targets: [{ kind: "player", player: B }], via: "effect", free: true },
    });
    expect(game.state.objects[bolt].zone).toBe("stack");
    expect(game.state.objects[bolt].castVia).toBe("cascade");
    game.advanceUntil(settled);
    expect(game.state.players[B].life).toBe(17);
    expect(game.state.players[A].life).toBe(20);
    expect(game.state.objects[bolt].zone).toBe("graveyard");
    expect(island?.zone).toBe("library");
  });

  it("declined, the card goes to the bottom with the rest, uncast", () => {
    const { game, bolt } = castElf();
    game.dispatch({ type: "cast-now", player: A, cast: null });
    game.advanceUntil(settled);
    expect(game.eventsOfType("spell-cast").some((e) => e.object === bolt)).toBe(false);
    expect(game.state.players[B].life).toBe(20);
    expect(game.state.objects[bolt].zone).toBe("library");
    const island = Object.values(game.state.objects).find((o) => o.cardName === "Island");
    expect(island?.zone).toBe("library");
  });

  it("isn't offered when a cost increase can't be paid, and goes to the bottom uncast", () => {
    // Thalia taxes the Bolt {1}, and the three Mountains and a Forest are
    // all spent on the Elf.
    const { game, bolt } = castElf({ thalia: true });
    expect(cascadeOffer(game.state)).toBe(false);
    game.advanceUntil(settled);
    expect(game.eventsOfType("spell-cast").some((e) => e.object === bolt)).toBe(false);
    expect(game.state.players[B].life).toBe(20);
    expect(game.state.objects[bolt].zone).toBe("library");
  });
});
