/**
 * Sythis, Harvest's Hand — its one clause through the real `Game`:
 *
 * - "Whenever you cast an enchantment spell, you gain 1 life and draw a card."
 *   A cast trigger (rule 601.2i), so it resolves on top of the enchantment
 *   spell and the card is drawn before that spell resolves. Any enchantment
 *   spell — a plain enchantment, an Aura, an enchantment creature — and only
 *   an enchantment spell, only one *you* cast.
 * - The ruling (2021-06-18): it doesn't trigger when Sythis itself is cast
 *   (rule 113.6), whether from hand or from the command zone — but a second
 *   Sythis cast while the first is on the battlefield is an enchantment spell
 *   the first one sees.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { TargetRef } from "../target.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const SYTHIS = "Sythis, Harvest's Hand";

const mkGame = (
  aHand: readonly string[] = [],
  bHand: readonly string[] = [],
  aCommander?: string,
) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      {
        player: A,
        cards: [...aHand, ...Array<string>(40).fill("Plains")],
        ...(aCommander === undefined ? {} : { commander: aCommander }),
      },
      { player: B, cards: [...bHand, ...Array<string>(40).fill("Forest")] },
    ],
  });

const mainPhaseOf = (turn: number, player: PlayerId) => (s: GameState): boolean =>
  s.turn.number === turn && s.turn.step === "precombat-main" && s.priority.holder === player;
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, player: PlayerId, names: readonly string[]): void => {
  for (const name of names) spawn(game, name, player);
};
const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((i) => game.state.objects[i].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in ${player}'s hand`);
  return id;
};
const cast = (
  game: Game,
  player: PlayerId,
  card: ObjectId,
  targets: readonly TargetRef[] = [],
): void => {
  game.dispatch({ type: "cast-spell", player, card, targets });
};
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const handSize = (game: Game, player: PlayerId): number => game.handOf(player).length;
const drawsSince = (game: Game, player: PlayerId, from: number): number =>
  game.state.eventLog.slice(from).filter((e) => e.type === "card-drawn" && e.player === player)
    .length;
const sythisTriggers = (game: Game, from: number): number =>
  game.state.eventLog
    .slice(from)
    .filter(
      (e) =>
        e.type === "ability-triggered" && game.state.objects[e.source]?.cardName === SYTHIS,
    ).length;

describe("Sythis — characteristics", () => {
  it("is a 1/2 legendary enchantment creature — Nymph, green-white", () => {
    const def = createDefaultRegistry().get(SYTHIS);
    expect(def.supertypes).toEqual(["legendary"]);
    expect([...def.types].sort()).toEqual(["creature", "enchantment"]);
    expect(def.subtypes).toEqual(["Nymph"]);
    expect([def.power, def.toughness]).toEqual([1, 2]);
    expect(identityString(colorIdentityOf(def))).toBe("WG");
  });
});

describe("Sythis — whenever you cast an enchantment spell", () => {
  it("gains 1 life and draws a card off a plain enchantment, before the spell resolves", () => {
    const game = mkGame(["Glorious Anthem"]);
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, SYTHIS, A);
    lands(game, A, ["Plains", "Plains", "Plains"]);
    const life0 = life(game, A);
    const hand0 = handSize(game, A);
    const from = game.state.eventLog.length;

    const anthem = inHand(game, A, "Glorious Anthem");
    cast(game, A, anthem);
    game.advanceUntil(quiet);

    expect(life(game, A)).toBe(life0 + 1);
    expect(drawsSince(game, A, from)).toBe(1);
    // Anthem left the hand, one card came in.
    expect(handSize(game, A)).toBe(hand0);
    expect(game.battlefield).toContain(anthem);

    // A cast trigger, so the draw happens with Glorious Anthem still on the
    // stack beneath it.
    const log = game.state.eventLog;
    const drew = log.findIndex(
      (e, i) => i >= from && e.type === "card-drawn" && e.player === A,
    );
    const anthemResolved = log.findIndex(
      (e, i) => i >= from && e.type === "spell-resolved" && e.object === anthem,
    );
    expect(drew).toBeGreaterThanOrEqual(0);
    expect(anthemResolved).toBeGreaterThan(drew);
  });

  it("triggers off an Aura spell", () => {
    const game = mkGame(["Pacifism"]);
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, SYTHIS, A);
    const bears = spawn(game, "Grizzly Bears", B);
    lands(game, A, ["Plains", "Plains"]);
    const life0 = life(game, A);
    const from = game.state.eventLog.length;

    cast(game, A, inHand(game, A, "Pacifism"), [{ kind: "object", object: bears }]);
    game.advanceUntil(quiet);

    expect(life(game, A)).toBe(life0 + 1);
    expect(drawsSince(game, A, from)).toBe(1);
  });

  it("triggers off an enchantment creature spell", () => {
    const game = mkGame(["Summon: Titan"]);
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, SYTHIS, A);
    lands(game, A, ["Forest", "Forest", "Forest", "Forest", "Forest"]);
    const life0 = life(game, A);
    const from = game.state.eventLog.length;

    cast(game, A, inHand(game, A, "Summon: Titan"));
    game.advanceUntil(quiet);

    expect(life(game, A)).toBe(life0 + 1);
    expect(drawsSince(game, A, from)).toBe(1);
  });

  it("triggers once per enchantment spell", () => {
    const game = mkGame(["Glorious Anthem", "Pacifism"]);
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, SYTHIS, A);
    const bears = spawn(game, "Grizzly Bears", B);
    lands(game, A, ["Plains", "Plains", "Plains", "Plains", "Plains"]);
    const life0 = life(game, A);
    const from = game.state.eventLog.length;

    cast(game, A, inHand(game, A, "Glorious Anthem"));
    game.advanceUntil(quiet);
    cast(game, A, inHand(game, A, "Pacifism"), [{ kind: "object", object: bears }]);
    game.advanceUntil(quiet);

    expect(life(game, A)).toBe(life0 + 2);
    expect(drawsSince(game, A, from)).toBe(2);
    expect(sythisTriggers(game, from)).toBe(2);
  });

  it("doesn't trigger off a spell that isn't an enchantment", () => {
    const game = mkGame(["Grizzly Bears"]);
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, SYTHIS, A);
    lands(game, A, ["Forest", "Forest"]);
    const life0 = life(game, A);
    const from = game.state.eventLog.length;

    cast(game, A, inHand(game, A, "Grizzly Bears"));
    game.advanceUntil(quiet);

    expect(game.battlefield.some((id) => game.state.objects[id].cardName === "Grizzly Bears"))
      .toBe(true);
    expect(life(game, A)).toBe(life0);
    expect(drawsSince(game, A, from)).toBe(0);
    expect(sythisTriggers(game, from)).toBe(0);
  });

  it("doesn't trigger off an opponent's enchantment spell", () => {
    const game = mkGame([], ["Glorious Anthem"]);
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, SYTHIS, A);
    game.advanceUntil(mainPhaseOf(2, B));
    lands(game, B, ["Plains", "Plains", "Plains"]);
    const lifeA = life(game, A);
    const lifeB = life(game, B);
    const from = game.state.eventLog.length;

    cast(game, B, inHand(game, B, "Glorious Anthem"));
    game.advanceUntil(quiet);

    expect(life(game, A)).toBe(lifeA);
    expect(life(game, B)).toBe(lifeB);
    expect(drawsSince(game, A, from)).toBe(0);
    expect(drawsSince(game, B, from)).toBe(0);
    expect(sythisTriggers(game, from)).toBe(0);
  });

  it("doesn't trigger off an opponent's Sythis when you cast an enchantment", () => {
    // "You" is the Sythis's controller: B's Sythis ignores A's enchantment.
    const game = mkGame(["Glorious Anthem"]);
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, SYTHIS, B);
    lands(game, A, ["Plains", "Plains", "Plains"]);
    const lifeA = life(game, A);
    const lifeB = life(game, B);
    const from = game.state.eventLog.length;

    cast(game, A, inHand(game, A, "Glorious Anthem"));
    game.advanceUntil(quiet);

    expect(life(game, A)).toBe(lifeA);
    expect(life(game, B)).toBe(lifeB);
    expect(drawsSince(game, A, from)).toBe(0);
    expect(drawsSince(game, B, from)).toBe(0);
  });
});

describe("Sythis — doesn't trigger when it is cast (2021-06-18 ruling)", () => {
  it("from hand", () => {
    const game = mkGame([SYTHIS]);
    game.advanceUntil(mainPhaseOf(1, A));
    lands(game, A, ["Forest", "Plains"]);
    const life0 = life(game, A);
    const from = game.state.eventLog.length;

    cast(game, A, inHand(game, A, SYTHIS));
    game.advanceUntil(quiet);

    // Sythis is an enchantment spell, and the spell being cast is in the
    // trigger scan, so without `otherOnly` it would draw off its own cast.
    expect(game.battlefield.some((id) => game.state.objects[id].cardName === SYTHIS)).toBe(
      true,
    );
    expect(life(game, A)).toBe(life0);
    expect(drawsSince(game, A, from)).toBe(0);
    expect(sythisTriggers(game, from)).toBe(0);
  });

  it("from the command zone, as a commander", () => {
    const game = mkGame([], [], SYTHIS);
    game.advanceUntil(mainPhaseOf(1, A));
    lands(game, A, ["Forest", "Plains"]);
    const sythis = game.state.zones.shared.command.find(
      (id) => game.state.objects[id].cardName === SYTHIS,
    );
    if (sythis === undefined) throw new Error("Sythis isn't in the command zone");
    const life0 = life(game, A);
    const from = game.state.eventLog.length;

    cast(game, A, sythis);
    game.advanceUntil(quiet);

    expect(game.battlefield).toContain(sythis);
    expect(life(game, A)).toBe(life0);
    expect(drawsSince(game, A, from)).toBe(0);
    expect(sythisTriggers(game, from)).toBe(0);

    // …and once it's on the battlefield it works as normal.
    game.debugSpawn("Glorious Anthem", A, "hand");
    lands(game, A, ["Plains", "Plains", "Plains"]);
    cast(game, A, inHand(game, A, "Glorious Anthem"));
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(life0 + 1);
    expect(drawsSince(game, A, from)).toBe(1);
  });

  it("but a second Sythis cast while the first is on the battlefield triggers the first", () => {
    // `otherOnly` excludes only the object being cast; the Sythis already on
    // the battlefield is a different object and sees an enchantment spell.
    const game = mkGame([SYTHIS]);
    game.advanceUntil(mainPhaseOf(1, A));
    const first = spawn(game, SYTHIS, A);
    lands(game, A, ["Forest", "Plains"]);
    const life0 = life(game, A);
    const from = game.state.eventLog.length;

    cast(game, A, inHand(game, A, SYTHIS));
    game.advanceUntil(quiet);

    expect(life(game, A)).toBe(life0 + 1);
    expect(drawsSince(game, A, from)).toBe(1);
    const triggered = game.state.eventLog
      .slice(from)
      .filter((e) => e.type === "ability-triggered")
      .map((e) => (e.type === "ability-triggered" ? e.source : null));
    expect(triggered).toEqual([first]);
  });
});
