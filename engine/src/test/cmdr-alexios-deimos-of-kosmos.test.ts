/**
 * Alexios, Deimos of Kosmos — {3}{R} 4/4 legendary Human Berserker:
 *   Trample
 *   Alexios attacks each combat if able, can't be sacrificed, and can't
 *   attack its owner.
 *   At the beginning of each player's upkeep, that player gains control of
 *   Alexios, untaps it, and puts a +1/+1 counter on it. It gains haste until
 *   end of turn.
 *
 * - it goes round the table, one upkeep at a time, and the player whose
 *   upkeep it is puts the counter on it;
 * - it must attack, but never its owner — whose planeswalkers it may attack
 *   (ruling);
 * - an edict must take another creature, and alone it takes nothing;
 * - when its controller leaves the game it goes back to the player still in
 *   the game who most recently controlled it (ruling), and when its owner
 *   leaves it leaves with them.
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { createDefaultRegistry } from "../cards.js";
import { matchesFilter } from "../filter.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const [A, B, C] = ["alice", "bob", "carol"].map(asPlayerId);
const ALEXIOS = "Alexios, Deimos of Kosmos";
const registry = createDefaultRegistry();

function table(players: readonly PlayerId[] = [A, B, C]): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    registry,
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Mountain") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

const spawn = (game: Game, name: string, owner: PlayerId): ObjectId =>
  game.debugSpawn(name, owner, "battlefield", { summoningSick: false });
const mainOf = (turn: number) => (s: GameState): boolean =>
  s.turn.number === turn && s.turn.step === "precombat-main";
const counters = (game: Game, id: ObjectId): number => game.state.objects[id].counters["+1/+1"] ?? 0;

function check(game: Game): void {
  (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(
    game.state.priority.holder ?? A,
  );
}

function knockOut(game: Game, p: PlayerId): void {
  game.state.players[p].life = 0;
  check(game);
  expect(game.state.players[p].hasLost).toBe(true);
}

type AttackOffer = Extract<LegalAction, { kind: "declare-attackers" }>;
const attackOffer = (game: Game, p: PlayerId): AttackOffer => {
  const offer = game.legalActions(p).find((o): o is AttackOffer => o.kind === "declare-attackers");
  if (offer === undefined) throw new Error("no attack offer");
  return offer;
};

describe("Alexios, Deimos of Kosmos", () => {
  it("is a {3}{R} 4/4 legendary Human Berserker with trample", () => {
    const def = registry.get(ALEXIOS);
    expect(def.manaCost).toBe("{3}{R}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.subtypes).toEqual(["Human", "Berserker"]);
    expect([def.power, def.toughness]).toEqual([4, 4]);
    expect(def.keywords).toEqual(["trample"]);
    expect(identityString(colorIdentityOf(def))).toBe("R");
  });

  it("at each player's upkeep that player takes it, untaps it and puts a +1/+1 counter on it", () => {
    const game = table();
    const alexios = spawn(game, ALEXIOS, A);
    game.state.objects[alexios].tapped = true;

    game.advanceUntil(mainOf(2));
    expect(game.state.objects[alexios].controller).toBe(B);
    expect(counters(game, alexios)).toBe(1);
    expect(game.characteristics(alexios).keywords.has("haste")).toBe(true);
    // Bob put the counter on it, not Alice, whose trigger it was.
    const added = game.eventsOfType("counter-added").filter((e) => e.object === alexios);
    expect(added.map((e) => e.by)).toEqual([B]);

    game.advanceUntil(mainOf(3));
    expect(game.state.objects[alexios].controller).toBe(C);
    expect(counters(game, alexios)).toBe(2);
    expect(game.state.objects[alexios].tapped).toBe(false);

    game.advanceUntil(mainOf(4));
    expect(game.state.objects[alexios].controller).toBe(A);
    expect(counters(game, alexios)).toBe(3);
    expect([game.characteristics(alexios).power, game.characteristics(alexios).toughness]).toEqual([7, 7]);
  });

  it("blinked in response, it's a new object the trigger can't find (rule 400.7)", () => {
    const game = table([A, B]);
    const alexios = spawn(game, ALEXIOS, A);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep" && s.zones.shared.stack.length === 1);
    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [{ kind: "object", object: alexios }]);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "draw");
    expect(game.state.objects[alexios].controller).toBe(A);
    expect(counters(game, alexios)).toBe(0);
    expect(game.characteristics(alexios).keywords.has("haste")).toBe(false);
  });

  // "That player gains control of Alexios, untaps it, and puts a +1/+1
  // counter on it": a player who has left the game does none of it (rule
  // 800.4b for the control). "It gains haste" names no player.
  it("does nothing for a player who left the game before it resolved, bar the haste", () => {
    const game = table();
    const alexios = spawn(game, ALEXIOS, A);
    game.state.objects[alexios].tapped = true;
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep" && s.zones.shared.stack.length === 1);
    knockOut(game, B);
    game.advanceUntil((s) => s.zones.shared.stack.length === 0);
    expect(game.state.objects[alexios].controller).toBe(A);
    expect(game.state.objects[alexios].tapped).toBe(true);
    expect(counters(game, alexios)).toBe(0);
    expect(game.characteristics(alexios).keywords.has("haste")).toBe(true);
  });

  it("untaps it even after it attacked for the player before", () => {
    const game = table();
    const alexios = spawn(game, ALEXIOS, A);
    game.advanceUntil(mainOf(2));
    game.state.objects[alexios].tapped = true;
    game.advanceUntil(mainOf(3));
    expect(game.state.objects[alexios].tapped).toBe(false);
  });

  it("must attack if able, but not its owner", () => {
    const game = table();
    const alexios = spawn(game, ALEXIOS, A);
    game.advanceUntil((s) => s.turn.number === 2 && s.awaiting?.kind === "attackers");
    const offer = attackOffer(game, B);
    expect(offer.defendersFor[alexios]).toEqual([C]);
    expect(offer.mustAttack).toContain(alexios);
    expect(() => game.dispatch({ type: "declare-attackers", player: B, attackers: [] })).toThrow(/must attack/);
    expect(() =>
      game.dispatch({ type: "declare-attackers", player: B, attackers: [{ attacker: alexios, defender: A }] }),
    ).toThrow(/owner/);
  });

  it("may attack a planeswalker its owner controls — and so must", () => {
    const game = table([A, B]);
    const alexios = spawn(game, ALEXIOS, A);
    const walker = spawn(game, "Ajani, Caller of the Pride", A);
    game.advanceUntil((s) => s.turn.number === 2 && s.awaiting?.kind === "attackers");
    const offer = attackOffer(game, B);
    expect(offer.defendersFor[alexios]).toEqual([walker]);
    expect(offer.mustAttack).toContain(alexios);
  });

  it("with nothing but its owner to attack, it doesn't attack", () => {
    const game = table([A, B]);
    const alexios = spawn(game, ALEXIOS, A);
    game.advanceUntil((s) => s.turn.number === 2 && s.awaiting?.kind === "attackers");
    const offer = game.legalActions(B).find((o): o is AttackOffer => o.kind === "declare-attackers");
    expect(offer?.defendersFor[alexios]).toBeUndefined();
    expect(offer?.mustAttack ?? []).not.toContain(alexios);
  });

  it("can't be sacrificed: an edict takes another creature, or nothing", () => {
    const game = table([A, B]);
    const alexios = spawn(game, ALEXIOS, A);
    const bears = spawn(game, "Grizzly Bears", A);
    const edict = { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 1 } as const;
    game.debugApplyEffect(B, edict);
    check(game);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.objects[alexios].zone).toBe("battlefield");
    game.debugApplyEffect(B, edict);
    check(game);
    expect(game.state.awaiting).toBeNull();
    expect(game.state.objects[alexios].zone).toBe("battlefield");
  });

  it("can't pay a 'sacrifice a creature' cost", () => {
    const game = table([A, B]);
    const altar = spawn(game, "Ashnod's Altar", A);
    spawn(game, ALEXIOS, A);
    expect(game.legalActions(A).some((o) => o.kind === "activate-ability" && o.source === altar)).toBe(false);
  });

  it("goes back to whoever most recently controlled it when its controller leaves", () => {
    const game = table();
    const alexios = spawn(game, ALEXIOS, A);
    game.advanceUntil(mainOf(3));
    expect(game.state.objects[alexios].controller).toBe(C);
    knockOut(game, C);
    expect(game.state.objects[alexios].controller).toBe(B);
    expect(game.state.objects[alexios].zone).toBe("battlefield");
  });

  it("leaves the game with its owner", () => {
    const game = table();
    const alexios = spawn(game, ALEXIOS, A);
    game.advanceUntil(mainOf(2));
    expect(game.state.objects[alexios].controller).toBe(B);
    knockOut(game, A);
    expect(game.state.objects[alexios].controller).toBe(A);
    expect(
      matchesFilter(game.state, registry, alexios, { type: "creature", controlledBy: "you" }, { you: B }),
    ).toBe(false);
  });
});
