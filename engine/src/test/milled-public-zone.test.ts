/**
 * "From among the milled cards" finds a milled card in whatever public zone
 * it went to from the library (rule 701.17c): with Rest in Peace out, the
 * milled cards are in exile, and an effect choosing among them still sees
 * them there. Bramble Familiar's Fetch Quest is the card that waited on it.
 */

import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (library: readonly string[]) => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...Array<string>(8).fill("Island"), ...library, ...Array<string>(30).fill("Island")] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};

const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const MILL_AND_TAKE: EffectSpec = {
  kind: "sequence",
  effects: [
    { kind: "mill", target: "you", amount: 3 },
    {
      kind: "look-and-choose",
      zone: "graveyard",
      min: 0,
      max: 1,
      destination: "hand",
      leftover: "stay",
      filter: { thisWay: "milled", type: "creature" },
    },
  ],
};

describe("milled cards in any public zone (rule 701.17c)", () => {
  it("cards Rest in Peace exiled instead are still among the milled cards", () => {
    const { game } = setUp(["Grizzly Bears", "Hill Giant", "Island"]);
    game.debugSpawn("Rest in Peace", B, "battlefield");
    const bears = game.state.zones.perPlayer[A].library.find((id) => game.state.objects[id].cardName === "Grizzly Bears")!;
    game.debugApplyEffect(A, MILL_AND_TAKE);
    expect(game.state.objects[bears].zone).toBe("exile");
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-from-zone");
    if (awaiting?.kind !== "choose-from-zone") throw new Error("no choice");
    expect(awaiting.eligible).toHaveLength(2);
    expect(awaiting.eligible).toContain(bears);
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [bears] });
    expect(game.state.objects[bears].zone).toBe("hand");
  });

  it("an exiled card that wasn't milled this way isn't", () => {
    const { game } = setUp(["Island", "Island", "Island"]);
    game.debugSpawn("Rest in Peace", B, "battlefield");
    const exiled = game.debugSpawn("Grizzly Bears", A, "exile");
    game.debugApplyEffect(A, MILL_AND_TAKE);
    game.advanceUntil(settled);
    const awaiting = game.state.awaiting;
    if (awaiting?.kind === "choose-from-zone") expect(awaiting.eligible).not.toContain(exiled);
    expect(game.state.objects[exiled].zone).toBe("exile");
  });

  it("Bramble Familiar's Fetch Quest puts a milled permanent card onto the battlefield from exile", () => {
    const { game, a } = setUp(["Grizzly Bears", "Lightning Bolt", "Island", "Island", "Island", "Island", "Island"]);
    for (let i = 0; i < 7; i += 1) game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Rest in Peace", B, "battlefield");
    const familiar = game.debugSpawn("Bramble Familiar", A, "hand");
    const bears = game.state.zones.perPlayer[A].library.find((id) => game.state.objects[id].cardName === "Grizzly Bears")!;
    const bolt = game.state.zones.perPlayer[A].library.find((id) => game.state.objects[id].cardName === "Lightning Bolt")!;
    a.chooseFromZoneFn = (_view, eligible) => {
      expect(eligible).toContain(bears);
      expect(eligible).not.toContain(bolt);
      return [bears];
    };
    game.dispatch({ type: "cast-spell", player: A, card: familiar, targets: [], face: 1 });
    game.advanceUntil(settled);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[bolt].zone).toBe("exile");
    // The adventure spell itself goes on an adventure — Rest in Peace's
    // replacement and the adventure's both exile it.
    expect(game.state.objects[familiar].zone).toBe("exile");
  });

  it("Bramble Familiar: {1}{G}, {T}, discard a card returns it to its owner's hand", () => {
    const { game } = setUp([]);
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const familiar = game.debugSpawn("Bramble Familiar", A, "battlefield", { summoningSick: false });
    const handBefore = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({ type: "activate-ability", player: A, source: familiar, abilityIndex: 1 });
    game.advanceUntil(settled);
    expect(game.state.objects[familiar].zone).toBe("hand");
    // One card discarded, the Familiar back: the same hand size.
    expect(game.state.zones.perPlayer[A].hand.length).toBe(handBefore);
    expect(game.state.zones.perPlayer[A].graveyard).toHaveLength(1);
  });
});
