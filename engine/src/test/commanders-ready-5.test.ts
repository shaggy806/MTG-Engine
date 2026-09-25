/**
 * The three commanders that needed a small engine addition first: Shadow the
 * Hedgehog (split second granted to spells), Michelangelo, the Heart (an
 * `all` condition) and Azlask, the Swelling Scourge (`grant-triggered-all`).
 */

import { describe, expect, it } from "vitest";

import { effectiveSubtypes, effectiveTypes } from "../characteristics.js";
import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (aDeck: readonly string[] = [], bDeck: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aDeck, ...Array<string>(40).fill("Island")] },
      { player: B, cards: [...bDeck, ...Array<string>(40).fill("Island")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name, player);
};
const named = (game: Game, name: string, player?: PlayerId): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === name && (player === undefined || game.state.objects[id].controller === player),
  );
const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const activate = (game: Game, source: ObjectId, abilityIndex: number, targets: (TargetRef | null)[] = [], extra = {}) => {
  game.dispatch({ type: "activate-ability", player: A, source, abilityIndex, targets, ...extra });
  game.advanceUntil(quiet);
};
const cast = (game: Game, card: ObjectId, targets: (TargetRef | null)[] = [], extra = {}) => {
  game.dispatch({ type: "cast-spell", player: A, card, targets, ...extra });
  game.advanceUntil(quiet);
};
const toStep = (game: Game, step: GameState["turn"]["step"]) =>
  game.advanceUntil((s) => s.turn.step === step && quiet(s));
const life = (game: Game, p: PlayerId) => game.state.players[p].life;
const types = (game: Game, id: ObjectId) => effectiveTypes(game.state, registry, game.state.objects[id]);

const boltOffered = (game: Game): boolean =>
  game.legalActions(A).some((o) => o.kind === "cast-spell" && o.card === inHand(game, A, "Lightning Bolt"));

describe("Shadow the Hedgehog", () => {
  it("a spell paid for with artifact mana has split second", () => {
    const { game } = setUp(["Mind Stone", "Lightning Bolt"]);
    spawn(game, "Shadow the Hedgehog");
    spawn(game, "Sol Ring");
    spawn(game, "Mountain");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, A, "Mind Stone"), targets: [] });
    expect(game.state.zones.shared.stack).toHaveLength(1);
    expect(boltOffered(game)).toBe(false);
  });

  it("…and one paid for with land mana doesn't", () => {
    const { game } = setUp(["Mind Stone", "Lightning Bolt"]);
    spawn(game, "Shadow the Hedgehog");
    lands(game, "Island", 2);
    spawn(game, "Mountain");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, A, "Mind Stone"), targets: [] });
    expect(game.state.zones.shared.stack).toHaveLength(1);
    expect(boltOffered(game)).toBe(true);
  });

  it("draws when a hasty creature of yours dies", () => {
    const { game } = setUp();
    spawn(game, "Shadow the Hedgehog");
    const hasty = spawn(game, "Human Knight Token");
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(hasty)], {});
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand + 1);
  });
});

describe("Michelangelo, the Heart", () => {
  it("a counter and a Food in your second main phase if you attacked", () => {
    const { game, a } = setUp();
    const mikey = spawn(game, "Michelangelo, the Heart");
    a.declareAttackersFn = () => [{ attacker: mikey, defender: B }];
    toStep(game, "postcombat-main");
    expect(named(game, "Food Token")).toHaveLength(1);
    expect(game.state.objects[mikey].counters["+1/+1"]).toBe(1);
  });

  it("nothing without an attack", () => {
    const { game } = setUp();
    spawn(game, "Michelangelo, the Heart");
    toStep(game, "postcombat-main");
    expect(named(game, "Food Token")).toHaveLength(0);
  });
});

describe("Azlask, the Swelling Scourge", () => {
  it("experience when a colorless creature of yours dies; the pump grants annihilator to Spawns", () => {
    const { game, a } = setUp();
    const azlask = spawn(game, "Azlask, the Swelling Scourge");
    const myr = spawn(game, "Darksteel Myr");
    game.state.objects[myr].modifiers.push({ power: 0, toughness: 0, keywords: [], loseAbilities: true });
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(myr)], {});
    game.advanceUntil(quiet);
    expect(game.state.players[A].counters.experience).toBe(1);
    const spawnToken = spawn(game, "Spawn Token");
    for (const land of ["Plains", "Island", "Swamp", "Mountain", "Forest"]) spawn(game, land);
    activate(game, azlask, 0);
    expect(game.characteristics(azlask).power).toBe(3);
    expect(game.characteristics(spawnToken).keywords).toContain("indestructible");
    for (let i = 0; i < 3; i += 1) spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: spawnToken, defender: B }];
    toStep(game, "declare-blockers");
    expect(named(game, "Grizzly Bears", B)).toHaveLength(2);
  });
});
