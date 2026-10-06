/**
 * Top-10000 batch 36g. Pins the clauses most likely to be wired wrong:
 * Sanctum of Shattered Heights' "discard a land card or Shrine card" cost and
 * its Shrine count, Virulent Sliver's poisonous on every Sliver (one instance
 * per Virulent Sliver), Teysa, Envoy of Ghosts' untargeted destroy of a
 * creature that deals her controller combat damage, Adept Watershaper's
 * "other tapped creatures", Mogg Salvage's free cast, and Summon: Anima's
 * fourth chapter.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (
  hand: readonly string[] = [],
  a: ScriptedController = new ScriptedController(A),
  b: ScriptedController = new ScriptedController(B),
): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
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
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const obj = (object: ObjectId) => ({ kind: "object" as const, object });
const attackWith = (game: Game, attackers: readonly ObjectId[]): void => {
  game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
  game.dispatch({
    type: "declare-attackers",
    player: A,
    attackers: attackers.map((attacker) => ({ attacker, defender: B })),
  });
  game.advanceUntil((s) => s.turn.step === "postcombat-main");
  game.advanceUntil(quiet);
};

describe("top-10000 batch 36g — Sanctum of Shattered Heights", () => {
  it("discards only a land or Shrine card, and deals damage equal to the Shrines you control", () => {
    const a = new ScriptedController(A);
    const offered: string[][] = [];
    a.chooseDiscardsFn = (hand, count) => {
      offered.push(hand.map((o) => o.cardName));
      return hand.slice(0, count).map((o) => o.id);
    };
    // A hand of a creature, a Shrine and a land (the deck's Wastes).
    const game = setUp(["Grizzly Bears", "Sanctum of Calm Waters"], a);
    const sanctum = spawn(game, "Sanctum of Shattered Heights");
    spawn(game, "Sanctum of Calm Waters");
    spawn(game, "Wastes");
    const target = spawn(game, "Colossal Dreadmaw", B);
    game.dispatch({ type: "activate-ability", player: A, source: sanctum, abilityIndex: 0, targets: [obj(target)] });
    game.advanceUntil(quiet);
    expect(offered).toHaveLength(1);
    expect(offered[0]).not.toContain("Grizzly Bears");
    expect(offered[0]).toContain("Sanctum of Calm Waters");
    expect(offered[0]).toContain("Wastes");
    expect(inHand(game, "Grizzly Bears")).toBeDefined();
    // Two Shrines on the battlefield: 2 damage.
    expect(game.state.objects[target].damageMarked).toBe(2);
  });
});

describe("top-10000 batch 36g — Virulent Sliver", () => {
  it("gives every Sliver poisonous 1, one instance per Virulent Sliver, whoever controls them", () => {
    const game = setUp();
    spawn(game, "Virulent Sliver");
    spawn(game, "Virulent Sliver", B);
    const attacker = spawn(game, "Muscle Sliver");
    attackWith(game, [attacker]);
    // Two instances (one from each Virulent Sliver), each a poison counter,
    // however much damage it dealt.
    expect(game.state.players[B].counters?.poison ?? 0).toBe(2);
  });
});

describe("top-10000 batch 36g — Teysa, Envoy of Ghosts", () => {
  it("destroys a creature that deals her controller combat damage and makes her controller a W/B Spirit", () => {
    const game = setUp();
    spawn(game, "Teysa, Envoy of Ghosts", B);
    const bears = spawn(game, "Grizzly Bears");
    attackWith(game, [bears]);
    expect(zone(game, bears)).toBe("graveyard");
    const spirits = named(game, "Spirit Token (White-Black)");
    expect(spirits).toHaveLength(1);
    expect(game.state.objects[spirits[0]].controller).toBe(B);
  });

  it("still makes the Spirit when the creature survives (indestructible)", () => {
    const game = setUp();
    spawn(game, "Teysa, Envoy of Ghosts", B);
    const god = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" }, [obj(god)]);
    attackWith(game, [god]);
    expect(zone(game, god)).toBe("battlefield");
    expect(named(game, "Spirit Token (White-Black)")).toHaveLength(1);
  });
});

describe("top-10000 batch 36g — Adept Watershaper", () => {
  it("makes other tapped creatures you control indestructible, not untapped ones or itself", () => {
    const game = setUp();
    const shaper = spawn(game, "Adept Watershaper");
    const tapped = spawn(game, "Grizzly Bears");
    const untapped = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "tap", target: 0 }, [obj(tapped)]);
    game.debugApplyEffect(A, { kind: "tap", target: 0 }, [obj(shaper)]);
    game.debugApplyEffect(B, { kind: "tap", target: 0 }, [obj(theirs)]);
    game.advanceUntil(quiet);
    expect(game.characteristics(tapped).keywords).toContain("indestructible");
    expect(game.characteristics(untapped).keywords).not.toContain("indestructible");
    expect(game.characteristics(shaper).keywords).not.toContain("indestructible");
    expect(game.characteristics(theirs).keywords).not.toContain("indestructible");
  });
});

describe("top-10000 batch 36g — Mogg Salvage", () => {
  it("is offered free only while an opponent controls an Island and you control a Mountain", () => {
    const game = setUp(["Mogg Salvage"]);
    const card = inHand(game, "Mogg Salvage");
    spawn(game, "Sol Ring", B);
    const freeOffered = (): boolean =>
      game.legalActions(A).some((act) => act.kind === "cast-spell" && act.card === card && act.free === true);
    spawn(game, "Mountain");
    expect(freeOffered()).toBe(false);
    spawn(game, "Island", B);
    expect(freeOffered()).toBe(true);
  });
});

describe("top-10000 batch 36g — Summon: Anima", () => {
  it("chapter IV makes each opponent sacrifice a creature and lose 3 life, then the Saga is sacrificed", () => {
    const game = setUp();
    const saga = spawn(game, "Summon: Anima");
    game.advanceUntil(quiet);
    const bears = spawn(game, "Grizzly Bears", B);
    const [lifeA, lifeB] = [game.state.players[A].life, game.state.players[B].life];
    // Three more lore counters: chapters II, III and IV trigger.
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "lore", amount: 3 }, [obj(saga)]);
    game.advanceUntil(quiet);
    expect(zone(game, bears)).toBe("graveyard");
    expect(game.state.players[B].life).toBe(lifeB - 3);
    expect(game.state.players[A].life).toBe(lifeA - 2);
    expect(zone(game, saga)).toBe("graveyard");
  });
});
