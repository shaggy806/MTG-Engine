/**
 * A cost to attack (rule 508.1h): Ghostly Prison, Propaganda and Windborn
 * Muse's "creatures can't attack you unless their controller pays {2} for
 * each creature they control that's attacking you". Paid after the attackers
 * tap (508.1f, 508.1j), so an attacker can't pay its own way; a planeswalker
 * isn't "you"; a creature that must attack isn't obliged to pay (508.1d).
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { withinAttackTax } from "../combat/attacking.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

type Offer = Extract<LegalAction, { kind: "declare-attackers" }>;

/** A to declare attackers, with `lands` untapped Forests and `creatures`
 * ready to attack; B with `bTax` taxing permanents. */
const toAttack = (lands: number, creatures: readonly string[], bTax: readonly string[] = ["Ghostly Prison"]) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Forest") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (let i = 0; i < lands; i += 1) {
    const id = game.debugSpawn("Forest", A, "battlefield");
    game.state.objects[id].tapped = false;
  }
  const ids = creatures.map((name) => {
    const id = game.debugSpawn(name, A, "battlefield");
    game.state.objects[id].summoningSick = false;
    game.state.objects[id].tapped = false;
    return id;
  });
  for (const name of bTax) game.debugSpawn(name, B, "battlefield");
  game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
  const offer = game.legalActions(A).find((a): a is Offer => a.kind === "declare-attackers");
  return { game, ids, offer };
};
const untappedForests = (game: Game): number =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === "Forest" && game.state.objects[id].controller === A && !game.state.objects[id].tapped,
  ).length;

describe("an attack tax", () => {
  it("is paid for each creature attacking the taxing player", () => {
    const { game, ids } = toAttack(5, ["Grizzly Bears", "Grizzly Bears"]);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: ids.map((attacker) => ({ attacker, defender: B })),
    });
    expect(ids.every((id) => game.state.objects[id].attacking === B)).toBe(true);
    // {2} each: four of the five Forests.
    expect(untappedForests(game)).toBe(1);
  });

  it("refuses an attack its controller can't pay for, and allows a smaller one", () => {
    const { game, ids } = toAttack(3, ["Grizzly Bears", "Grizzly Bears"]);
    expect(
      game.canDispatch({
        type: "declare-attackers",
        player: A,
        attackers: ids.map((attacker) => ({ attacker, defender: B })),
      }),
    ).toMatch(/can't pay/);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: ids[0], defender: B }] });
    expect(game.state.objects[ids[0]].attacking).toBe(B);
    expect(untappedForests(game)).toBe(1);
  });

  it("doesn't let an attacker tap for its own tax", () => {
    // Three Forests and Llanowar Elves are four mana — but Elves attacking
    // is tapped before the {4} is paid.
    const { game, ids } = toAttack(3, ["Llanowar Elves", "Grizzly Bears"]);
    // Refused by validation, before anything taps.
    expect(
      game.canDispatch({
        type: "declare-attackers",
        player: A,
        attackers: ids.map((attacker) => ({ attacker, defender: B })),
      }),
    ).toMatch(/can't pay/);
    // The Bears alone: {2}, which the Elves at home help pay.
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: ids[1], defender: B }] });
    expect(game.state.objects[ids[1]].attacking).toBe(B);
  });

  it("stacks: two Prisons are {4} a creature", () => {
    const { offer } = toAttack(5, ["Grizzly Bears"], ["Ghostly Prison", "Propaganda"]);
    expect(offer?.attackTax?.perCreature[B]).toBe(4);
    expect(offer?.attackTax?.budget).toBe(5);
  });

  it("doesn't tax an attack on the player's planeswalker", () => {
    const { game, ids } = toAttack(0, ["Grizzly Bears"], ["Ghostly Prison", "Ajani, Caller of the Pride"]);
    const walker = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Ajani, Caller of the Pride",
    ) as ObjectId;
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: ids[0], defender: walker }] });
    expect(game.state.objects[ids[0]].attacking).toBe(walker);
  });

  it("is what a bot's or a random player's declaration is cut down to", () => {
    const { game, ids, offer } = toAttack(3, ["Grizzly Bears", "Grizzly Bears", "Grizzly Bears"]);
    if (offer === undefined) throw new Error("no offer");
    expect(offer.attackTax?.budget).toBe(3);
    const trimmed = withinAttackTax(
      ids.map((attacker) => ({ attacker, defender: B })),
      offer,
    );
    expect(trimmed).toHaveLength(1);
    game.dispatch({ type: "declare-attackers", player: A, attackers: trimmed });
    expect(game.state.objects[trimmed[0].attacker].attacking).toBe(B);
  });

  it("is offered nowhere without a taxing permanent", () => {
    const { offer } = toAttack(3, ["Grizzly Bears"], []);
    expect(offer?.attackTax).toBeUndefined();
  });
});
