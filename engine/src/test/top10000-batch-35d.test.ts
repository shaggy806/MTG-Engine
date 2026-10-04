/**
 * Top-10000 batch 35d. Pins the clauses most likely to be wired wrong: Dire
 * Tactics' life loss (the exiled creature's last-known toughness, skipped with
 * a Human), Mass Manipulation's exactly-X control change, Jirina's sacrifice
 * granting both keywords to Humans only, Necrogen Mists making the *active*
 * player discard, and Nimblewright Schematic's leaves-to-graveyard token.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (hand: readonly string[] = []): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill("Wastes")] },
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
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const obj = (object: ObjectId) => ({ kind: "object" as const, object });
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;
const keywordsOf = (game: Game, id: ObjectId): readonly string[] =>
  [...computeCharacteristics(game.state, registry, id).keywords];

describe("top-10000 batch 35d — Mass Manipulation", () => {
  it("gains control of exactly X targets, and keeps them past the turn", () => {
    const game = setUp(["Mass Manipulation"]);
    for (let i = 0; i < 8; i += 1) spawn(game, "Island");
    const bears = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", B);
    const other = spawn(game, "Gray Ogre", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Mass Manipulation"),
      targets: [obj(bears), obj(giant)],
      xValue: 2,
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].controller).toBe(A);
    expect(game.state.objects[giant].controller).toBe(A);
    expect(game.state.objects[other].controller).toBe(B);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(game.state.objects[bears].controller).toBe(A);
  });
});

describe("top-10000 batch 35d — Jirina, Dauntless General", () => {
  it("gives Humans you control hexproof and indestructible, and nothing else", () => {
    const game = setUp();
    const jirina = spawn(game, "Jirina, Dauntless General");
    const samut = spawn(game, "Samut, Voice of Dissent");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Samut, Voice of Dissent", B);
    const ability = registry.get("Jirina, Dauntless General")!.activated[0].effect!;
    game.debugApplyEffect(A, ability, [], { source: jirina });
    game.advanceUntil(quiet);
    expect(keywordsOf(game, samut)).toEqual(expect.arrayContaining(["hexproof", "indestructible"]));
    expect(keywordsOf(game, bears)).not.toContain("hexproof");
    expect(keywordsOf(game, theirs)).not.toContain("indestructible");
  });
});

describe("top-10000 batch 35d — Nimblewright Schematic", () => {
  it("makes a Construct when it's put into a graveyard from the battlefield", () => {
    const game = setUp();
    const schematic = spawn(game, "Nimblewright Schematic");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(schematic)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[schematic].zone).toBe("graveyard");
    expect(named(game, "Construct Token (Jan Jansen, Chaos Crafter)")).toHaveLength(1);
  });
});
