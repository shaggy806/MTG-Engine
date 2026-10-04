/**
 * Top-10000 batch 32g. Pins the clause of each authored card most likely to
 * be wired wrong: Dawnglade Regent's hexproof only while you're the monarch;
 * Michiko's Reign of Truth's count pump and its chapter III flip; Knight of
 * the Reliquary's graveyard count and "a Forest or Plains" cost; Rise of the
 * Dread Marn counting only nontoken deaths, every player's; Al Bhed
 * Salvagers seeing a noncreature artifact die but not an opponent's; and
 * Dreadmaw's Ire's granted trigger hitting the damaged player's artifact.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { Keyword } from "../cards/define.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const named = (game: Game, name: string): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === name);
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;
const toStep = (game: Game, step: GameState["turn"]["step"]): void =>
  game.advanceUntil((s) => s.turn.step === step && quiet(s));
const destroy = (game: Game, id: ObjectId): void => {
  game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(id)]);
  game.advanceUntil(quiet);
};
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;
const hasKeyword = (game: Game, id: ObjectId, keyword: Keyword): boolean =>
  game.characteristics(id).keywords.has(keyword);

describe("top-10000 batch 32g — Dawnglade Regent", () => {
  it("makes you the monarch, and your permanents have hexproof only while you are", () => {
    const { game } = setUp();
    const regent = game.debugSpawn("Dawnglade Regent", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.monarch).toBe(A);
    const forest = spawn(game, "Forest");
    const theirs = spawn(game, "Grizzly Bears", B);
    expect(hasKeyword(game, regent, "hexproof")).toBe(true);
    expect(hasKeyword(game, forest, "hexproof")).toBe(true);
    expect(hasKeyword(game, theirs, "hexproof")).toBe(false);
    game.debugApplyEffect(B, { kind: "become-monarch" });
    game.advanceUntil(quiet);
    expect(game.state.monarch).toBe(B);
    expect(hasKeyword(game, regent, "hexproof")).toBe(false);
    expect(hasKeyword(game, forest, "hexproof")).toBe(false);
  });
});

describe("top-10000 batch 32g — Michiko's Reign of Truth", () => {
  it("I, II pump by artifacts and enchantments; III returns it as Portrait of Michiko", () => {
    const { game } = setUp();
    // It enters with a lore counter (rule 714.3a); chapter I finds no
    // creature yet and leaves the stack.
    const saga = spawn(game, "Michiko's Reign of Truth");
    game.advanceUntil(quiet);
    spawn(game, "Sol Ring");
    const bears = spawn(game, "Grizzly Bears");
    const chapters = registry.get("Michiko's Reign of Truth")!.chapters!;
    game.debugApplyEffect(A, chapters[0].effect!, [obj(bears)], { source: saga });
    game.advanceUntil(quiet);
    // The Saga and Sol Ring: +2/+2.
    expect(game.characteristics(bears).power).toBe(4);
    expect(game.characteristics(bears).toughness).toBe(4);

    game.debugApplyEffect(A, chapters[1].effect!, [], { source: saga });
    game.advanceUntil(quiet);
    const [portrait] = named(game, "Michiko's Reign of Truth");
    expect(portrait).toBeDefined();
    expect(game.state.objects[portrait].face).toBe(1);
    expect(game.state.objects[portrait].controller).toBe(A);
    // Itself (an enchantment creature) and Sol Ring.
    expect(game.characteristics(portrait).power).toBe(2);
    expect(game.characteristics(portrait).toughness).toBe(2);
  });
});

describe("top-10000 batch 32g — Knight of the Reliquary", () => {
  it("grows with land cards in your graveyard, and needs a Forest or Plains to sacrifice", () => {
    const { game } = setUp();
    const knight = spawn(game, "Knight of the Reliquary");
    game.debugSpawn("Wastes", A, "graveyard");
    game.debugSpawn("Wastes", A, "graveyard");
    game.debugSpawn("Wastes", B, "graveyard");
    expect(game.characteristics(knight).power).toBe(4);
    expect(game.characteristics(knight).toughness).toBe(4);

    const offered = (): boolean =>
      game.legalActions(A).some((o) => o.kind === "activate-ability" && o.source === knight);
    spawn(game, "Island");
    expect(offered()).toBe(false);
    spawn(game, "Plains");
    expect(offered()).toBe(true);
  });
});

describe("top-10000 batch 32g — Rise of the Dread Marn", () => {
  it("counts every player's nontoken creatures that died this turn, not tokens", () => {
    const { game } = setUp();
    const mine = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(A, { kind: "create-token", token: "Zombie Berserker Token", count: 1 });
    game.advanceUntil(quiet);
    const [token] = named(game, "Zombie Berserker Token");
    for (const id of [mine, theirs, token]) destroy(game, id);
    expect(named(game, "Zombie Berserker Token")).toHaveLength(0);

    game.debugApplyEffect(A, effectOf("Rise of the Dread Marn"));
    game.advanceUntil(quiet);
    const made = named(game, "Zombie Berserker Token");
    const total = made.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(total).toBe(2);
  });
});

describe("top-10000 batch 32g — Al Bhed Salvagers", () => {
  it("drains for a noncreature artifact of yours and for itself, not for an opponent's artifact", () => {
    const { game } = setUp();
    const salvagers = spawn(game, "Al Bhed Salvagers");
    const ring = spawn(game, "Sol Ring");
    const theirRing = spawn(game, "Sol Ring", B);
    destroy(game, ring);
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(21);
    destroy(game, theirRing);
    expect(life(game, B)).toBe(19);
    destroy(game, salvagers);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
  });
});

describe("top-10000 batch 32g — Dreadmaw's Ire", () => {
  it("+2/+2, trample, and combat damage to a player destroys that player's artifact", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const mine = spawn(game, "Sol Ring");
    const theirs = spawn(game, "Sol Ring", B);
    game.debugApplyEffect(A, effectOf("Dreadmaw's Ire"), [obj(bears)]);
    game.advanceUntil(quiet);
    expect(game.characteristics(bears).power).toBe(4);
    expect(hasKeyword(game, bears, "trample")).toBe(true);

    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    toStep(game, "postcombat-main");
    expect(life(game, B)).toBe(16);
    expect(game.state.objects[theirs].zone).toBe("graveyard");
    expect(game.state.objects[mine].zone).toBe("battlefield");
  });
});
