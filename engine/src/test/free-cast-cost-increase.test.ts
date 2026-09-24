import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

// Rule 601.2f: a spell cast "without paying its mana cost" has an
// alternative cost of nothing, and cost increases still apply on top of it.
// Cascade and suspend used to skip them, so Thalia, Guardian of Thraben's
// {1} never reached a cascaded or suspended noncreature spell.

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aLibrary: readonly string[]): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false },
    decks: [
      { player: A, cards: [...aLibrary, ...Array(40).fill("Mountain")] },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const onBattlefield = (game: Game, player: PlayerId, name: string, n: number): ObjectId[] =>
  Array.from({ length: n }, () => game.debugSpawn(name, player, "battlefield"));

const untappedLands = (game: Game, player: PlayerId): number =>
  game.state.zones.shared.battlefield.filter((id) => {
    const o = game.state.objects[id];
    return o.controller === player && !o.tapped && /Mountain|Forest/.test(o.cardName);
  }).length;

const soldiers = (game: Game): number =>
  Object.values(game.state.objects).filter(
    (o) => o.zone === "battlefield" && o.cardName === "Soldier Token",
  ).length;

describe("cascade under Thalia, Guardian of Thraben", () => {
  // Under the opening hand and the first draw, the library's top two cards:
  // an Island the cascade skips, then Raise the Alarm (mana value 2, an
  // instant — Thalia taxes it {1}).
  const castElf = (mountains: number): { game: Game; hit: ObjectId } => {
    const hand = ["Bloodbraid Elf", ...Array(6).fill("Mountain")];
    const game = mkGame([...hand, "Mountain", "Island", "Raise the Alarm"]);
    game.advanceUntil(atFirstMain);
    onBattlefield(game, B, "Thalia, Guardian of Thraben", 1);
    onBattlefield(game, A, "Forest", 1);
    onBattlefield(game, A, "Mountain", mountains);
    const elf = game.handOf(A).find((id) => game.state.objects[id].cardName === "Bloodbraid Elf");
    if (elf === undefined) throw new Error("no Bloodbraid Elf in hand");
    game.dispatch({ type: "cast-spell", player: A, card: elf, targets: [] });
    game.advanceUntil(settled);
    const hit = Object.values(game.state.objects).find((o) => o.cardName === "Raise the Alarm");
    if (hit === undefined) throw new Error("no Raise the Alarm");
    return { game, hit: hit.id };
  };

  it("pays Thalia's {1} for the cascaded noncreature spell", () => {
    // A Forest and three Mountains pay for the Elf ({2}{R}{G}); the fourth
    // Mountain pays Thalia's {1}.
    const { game, hit } = castElf(4);
    const cast = game.eventsOfType("spell-cast").find((e) => e.object === hit);
    expect(cast?.via).toBe("cascade");
    expect(soldiers(game)).toBe(2);
    expect(game.state.objects[hit].zone).toBe("graveyard");
    expect(untappedLands(game, A)).toBe(0);
  });

  it("puts it on the bottom, uncast, when the {1} can't be paid", () => {
    // Exactly enough for the Elf, nothing for Thalia's {1}.
    const { game, hit } = castElf(3);
    expect(game.eventsOfType("spell-cast").some((e) => e.object === hit)).toBe(false);
    expect(soldiers(game)).toBe(0);
    expect(game.state.objects[hit].zone).toBe("library");
    expect(game.state.zones.perPlayer[A].library).toContain(hit);
  });
});

describe("suspend under Thalia, Guardian of Thraben", () => {
  // Rift Bolt with its last time counter about to come off at alice's
  // upkeep; it targets, so the cast parks a choose-targets decision first.
  const suspendBolt = (lands: number): { game: Game; bolt: ObjectId } => {
    const game = mkGame([]);
    onBattlefield(game, B, "Thalia, Guardian of Thraben", 1);
    onBattlefield(game, A, "Mountain", lands);
    const bolt = game.debugSpawn("Rift Bolt", A, "exile");
    game.state.objects[bolt].suspended = true;
    game.state.objects[bolt].counters = { time: 1 };
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || atFirstMain(s));
    if (game.state.awaiting?.kind === "choose-targets") {
      game.dispatch({ type: "choose-targets", player: A, targets: [{ kind: "player", player: B }] });
    }
    game.advanceUntil(settled);
    return { game, bolt };
  };

  it("pays Thalia's {1}, then deals its 3", () => {
    const { game, bolt } = suspendBolt(1);
    expect(game.eventsOfType("spell-cast").find((e) => e.object === bolt)?.via).toBe("suspend");
    expect(game.state.players[B].life).toBe(17);
    expect(untappedLands(game, A)).toBe(0);
    expect(game.state.objects[bolt].zone).toBe("graveyard");
  });

  it("stays exiled, no longer suspended, when the {1} can't be paid", () => {
    const { game, bolt } = suspendBolt(0);
    expect(game.eventsOfType("spell-cast").some((e) => e.object === bolt)).toBe(false);
    expect(game.state.players[B].life).toBe(20);
    expect(game.state.objects[bolt].zone).toBe("exile");
    expect(game.state.objects[bolt].suspended).toBe(false);
  });
});
