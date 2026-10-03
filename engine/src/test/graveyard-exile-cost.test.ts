/**
 * "Exile N [kind of] cards from your graveyard" as part of an activated
 * ability's cost (`AbilityCost.exileFromGraveyard`): gated on having enough
 * matching cards, the source aside; paid as the ability goes on the stack
 * (rule 602.2b, as 601.2h pays costs) with a `choose-from-zone` decision
 * (`destination: "exile"`) narrowed to the matching cards — skipped when
 * there's no choice; the cards leave the graveyard as one move; and the
 * player who activated gets priority back (rule 117.3c).
 */
import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: true, maxLandsPerTurn: 99, maxHandSize: 99, openingHandSize: 0 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const toGraveyard = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "graveyard");
const zone = (game: Game, id: ObjectId): string | undefined => game.state.objects[id]?.zone;
const canActivate = (game: Game, source: ObjectId, index: number, player: PlayerId = A): boolean =>
  game.legalActions(player).some((x) => x.kind === "activate-ability" && x.source === source && x.abilityIndex === index);
type ZoneOffer = Extract<LegalAction, { kind: "choose-from-zone" }>;
const zoneOffer = (game: Game, player: PlayerId = A): ZoneOffer | undefined =>
  game.legalActions(player).find((a): a is ZoneOffer => a.kind === "choose-from-zone");
const spirits = (game: Game): number =>
  game.state.zones.shared.battlefield
    .filter((id) => game.state.objects[id].cardName === "Spirit Token")
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);

describe("exiling cards from your graveyard as an activation cost", () => {
  it("can't be activated without enough matching cards in the graveyard", () => {
    const game = setUp();
    spawn(game, "Plains");
    spawn(game, "Island");
    const haunt = spawn(game, "Moorland Haunt");
    toGraveyard(game, "Wastes");
    expect(canActivate(game, haunt, 1)).toBe(false);
    toGraveyard(game, "Grizzly Bears");
    expect(canActivate(game, haunt, 1)).toBe(true);
  });

  it("offers only the matching cards, refuses the rest, and pays before the ability resolves", () => {
    const game = setUp();
    spawn(game, "Plains");
    spawn(game, "Island");
    const haunt = spawn(game, "Moorland Haunt");
    const land = toGraveyard(game, "Wastes");
    const bears = toGraveyard(game, "Grizzly Bears");
    const giant = toGraveyard(game, "Hill Giant");
    game.dispatch({ type: "activate-ability", player: A, source: haunt, abilityIndex: 1 });
    const offer = zoneOffer(game);
    expect(offer?.destination).toBe("exile");
    expect([...(offer?.eligible ?? [])].sort()).toEqual([bears, giant].sort());
    expect(offer?.ids).toContain(land);
    expect(offer?.min).toBe(1);
    expect(offer?.max).toBe(1);
    // On the stack, waiting on its cost.
    expect(game.state.zones.shared.stack).toHaveLength(1);
    expect(() => game.dispatch({ type: "choose-from-zone", player: A, chosen: [land] })).toThrow();
    expect(() => game.dispatch({ type: "choose-from-zone", player: A, chosen: [bears, giant] })).toThrow();
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [giant] });
    expect(zone(game, giant)).toBe("exile");
    expect(spirits(game)).toBe(0);
    game.advanceUntil(quiet);
    expect(spirits(game)).toBe(1);
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, land)).toBe("graveyard");
  });

  it("with no more matching cards than it needs, exiles them without asking, as one move", () => {
    const game = setUp();
    spawn(game, "Wastes");
    spawn(game, "Wastes");
    const varina = spawn(game, "Varina, Lich Queen");
    const first = toGraveyard(game, "Grizzly Bears");
    const second = toGraveyard(game, "Hill Giant");
    const leaves = (): number => game.state.eventLog.filter((e) => e.type === "cards-left-graveyard").length;
    const before = leaves();
    game.dispatch({ type: "activate-ability", player: A, source: varina, abilityIndex: 0 });
    expect(game.state.awaiting?.kind).not.toBe("choose-from-zone");
    expect(zone(game, first)).toBe("exile");
    expect(zone(game, second)).toBe("exile");
    expect(leaves()).toBe(before + 1);
  });

  it("chosen cards leave the graveyard as one move", () => {
    const game = setUp();
    spawn(game, "Wastes");
    spawn(game, "Wastes");
    const varina = spawn(game, "Varina, Lich Queen");
    const cards = ["Grizzly Bears", "Hill Giant", "Craw Wurm"].map((name) => toGraveyard(game, name));
    game.dispatch({ type: "activate-ability", player: A, source: varina, abilityIndex: 0 });
    const leaves = (): number => game.state.eventLog.filter((e) => e.type === "cards-left-graveyard").length;
    const before = leaves();
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [cards[0], cards[2]] });
    expect(leaves()).toBe(before + 1);
    expect(zone(game, cards[1])).toBe("graveyard");
  });

  it("hands priority back to the player who activated, on another player's turn (rule 117.3c)", () => {
    const game = setUp();
    spawn(game, "Plains");
    spawn(game, "Island");
    const haunt = spawn(game, "Moorland Haunt");
    toGraveyard(game, "Grizzly Bears");
    const giant = toGraveyard(game, "Hill Giant");
    game.advanceUntil(
      (s) => s.turnOrder[s.turn.activePlayerIndex] === B && s.turn.step === "upkeep" && s.priority.holder === A,
    );
    game.dispatch({ type: "activate-ability", player: A, source: haunt, abilityIndex: 1 });
    expect(zoneOffer(game)?.destination).toBe("exile");
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [giant] });
    expect(game.state.awaiting).toBeNull();
    expect(game.state.priority.holder).toBe(A);
    expect(game.state.zones.shared.stack).toHaveLength(1);
  });

  it("is a decision every player sees pending, which only its payer answers", () => {
    const game = setUp();
    spawn(game, "Wastes");
    spawn(game, "Wastes");
    const varina = spawn(game, "Varina, Lich Queen");
    ["Grizzly Bears", "Hill Giant", "Craw Wurm"].forEach((name) => toGraveyard(game, name));
    game.dispatch({ type: "activate-ability", player: A, source: varina, abilityIndex: 0 });
    // The graveyard is public: the opponent sees the same decision pending.
    expect(game.viewFor(B).awaiting?.kind).toBe("choose-from-zone");
    expect(zoneOffer(game, B)).toBeUndefined();
  });
});
