import { describe, expect, it } from "vitest";

import { HeuristicBotController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

// Rule 702.85a: cascade's caster casts the card it finds, which means they
// choose its targets (601.2c). The engine used to take the first legal target
// of each slot for them, so a cascaded Lightning Bolt went wherever the
// board's first legal target happened to be. A real choice now parks a
// `choose-targets` decision, the way a suspended spell's cast does.

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const settled = (s: GameState): boolean => s.zones.shared.stack.length === 0 && s.awaiting === null;

const cascadeOffer = (s: GameState): boolean =>
  s.awaiting?.kind === "choose-modes" && /^Cast .* without paying/.test(s.awaiting.modes[0]?.text ?? "");

/** Alice casts Bloodbraid Elf; under the opening hand and the first draw the
 * library's top two are an Island the cascade skips, then Lightning Bolt.
 * She says yes to casting the Bolt unless `decline`. */
const castElf = (
  opts: { thalia?: boolean; mountains?: number; decline?: boolean } = {},
): { game: Game; bolt: ObjectId } => {
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
  if (cascadeOffer(game.state)) {
    game.dispatch({ type: "choose-modes", player: A, modes: opts.decline === true ? [] : [0] });
  }
  game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || settled(s));
  const bolt = Object.values(game.state.objects).find((o) => o.cardName === "Lightning Bolt");
  if (bolt === undefined) throw new Error("no Lightning Bolt");
  return { game, bolt: bolt.id };
};

describe("cascade's \"you may cast it\" (rule 702.85a)", () => {
  it("is asked, naming the card found", () => {
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
    game.debugSpawn("Forest", A, "battlefield");
    for (let i = 0; i < 3; i++) game.debugSpawn("Mountain", A, "battlefield");
    const elf = game.handOf(A).find((id) => game.state.objects[id].cardName === "Bloodbraid Elf");
    if (elf === undefined) throw new Error("no Bloodbraid Elf in hand");
    game.dispatch({ type: "cast-spell", player: A, card: elf, targets: [] });
    game.advanceUntil((s) => cascadeOffer(s) || settled(s));
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-modes") throw new Error("cascade didn't ask");
    expect(awaiting.player).toBe(A);
    expect(awaiting.minModes).toBe(0);
    expect(awaiting.modes.map((m) => m.text)).toEqual(["Cast Lightning Bolt without paying its mana cost"]);
  });

  it("the bot says yes: a free spell is worth about a card to it", () => {
    const bot = new HeuristicBotController(A);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { maxLandsPerTurn: 99, skipFirstDraw: false },
      decks: [
        {
          player: A,
          cards: ["Bloodbraid Elf", ...Array(6).fill("Mountain"), "Mountain", "Island", "Lightning Bolt", ...Array(40).fill("Mountain")],
        },
        { player: B, cards: Array(40).fill("Forest") },
      ],
    });
    game.advanceUntil(atFirstMain);
    game.debugSpawn("Forest", A, "battlefield");
    for (let i = 0; i < 3; i++) game.debugSpawn("Mountain", A, "battlefield");
    const elf = game.handOf(A).find((id) => game.state.objects[id].cardName === "Bloodbraid Elf");
    if (elf === undefined) throw new Error("no Bloodbraid Elf in hand");
    game.dispatch({ type: "cast-spell", player: A, card: elf, targets: [] });
    game.advanceUntil((s) => cascadeOffer(s) || settled(s));
    if (!cascadeOffer(game.state)) throw new Error("cascade didn't ask");
    const answer = bot.act({ state: game.state, player: A, legalActions: () => game.legalActions(A) });
    expect(answer).toEqual({ type: "choose-modes", player: A, modes: [0] });
  });

  it("declined, the card goes to the bottom with the rest, uncast", () => {
    const { game, bolt } = castElf({ decline: true });
    game.advanceUntil(settled);
    expect(game.eventsOfType("spell-cast").some((e) => e.object === bolt)).toBe(false);
    expect(game.state.players[B].life).toBe(20);
    expect(game.state.objects[bolt].zone).toBe("library");
    const island = Object.values(game.state.objects).find((o) => o.cardName === "Island");
    expect(island?.zone).toBe("library");
  });
});

describe("a cascaded spell's targets (rule 702.85a)", () => {
  it("are the caster's to choose", () => {
    const { game, bolt } = castElf();
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-targets") throw new Error("no target choice for the cascaded spell");
    expect(awaiting.player).toBe(A);
    expect(awaiting.source).toBe(bolt);
    // Both players are there to choose between, not just the first of them.
    const players = awaiting.options[0].flatMap((t) => (t.kind === "player" ? [t.player] : []));
    expect(players).toEqual(expect.arrayContaining([A, B]));

    game.dispatch({ type: "choose-targets", player: A, targets: [{ kind: "player", player: B }] });
    game.advanceUntil(settled);
    expect(game.eventsOfType("spell-cast").find((e) => e.object === bolt)?.via).toBe("cascade");
    expect(game.state.players[B].life).toBe(17);
    expect(game.state.players[A].life).toBe(20);
    expect(game.state.objects[bolt].zone).toBe("graveyard");
  });

  it("the cards it passed over go to the bottom while the choice is asked", () => {
    const { game, bolt } = castElf();
    const island = Object.values(game.state.objects).find((o) => o.cardName === "Island");
    expect(island?.zone).toBe("library");
    expect(game.state.objects[bolt].zone).toBe("exile");
  });

  it("goes to the bottom, uncast, when a cost increase can't be paid once it's targeted", () => {
    // Thalia taxes the Bolt {1}, and the three Mountains and a Forest are
    // all spent on the Elf.
    const { game, bolt } = castElf({ thalia: true });
    if (game.state.awaiting?.kind !== "choose-targets") throw new Error("no target choice");
    game.dispatch({ type: "choose-targets", player: A, targets: [{ kind: "player", player: B }] });
    game.advanceUntil(settled);
    expect(game.eventsOfType("spell-cast").some((e) => e.object === bolt)).toBe(false);
    expect(game.state.players[B].life).toBe(20);
    expect(game.state.objects[bolt].zone).toBe("library");
    const library = game.state.zones.perPlayer[A].library;
    expect(library.indexOf(bolt)).toBeGreaterThanOrEqual(0);
  });
});
