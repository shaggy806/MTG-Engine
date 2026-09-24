import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { computeCharacteristics } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

/**
 * Skullbriar, the Walking Grave — {B}{G} legendary 1/1 Zombie Elemental.
 *   Haste
 *   Whenever Skullbriar deals combat damage to a player, put a +1/+1 counter
 *   on it.
 *   Counters remain on Skullbriar as it moves to any zone other than a
 *   player's hand or library.
 *
 * `CardDefinition.countersPersistAcrossZones`, honoured by `moveObject`.
 */

const SKULLBRIAR = "Skullbriar, the Walking Grave";
const reg = createDefaultRegistry();
const [A, B] = ["alice", "bob"].map(asPlayerId);

function table(commander?: string): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { maxLandsPerTurn: 99 },
    decks: [
      { player: A, cards: Array(60).fill("Mountain"), ...(commander ? { commander } : {}) },
      { player: B, cards: Array(60).fill("Mountain") },
    ],
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

function lands(game: Game, name: string, player: PlayerId, n: number): void {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, player, "battlefield");
}

/** Passes until the stack is empty, answering every 903.9a question with
 * `toCommandZone`. */
function settle(game: Game, toCommandZone = true): void {
  for (let i = 0; i < 200; i += 1) {
    const awaiting = game.state.awaiting;
    if (awaiting?.kind === "commander-replacement") {
      game.dispatch({ type: "commander-replacement", player: awaiting.player, toCommandZone });
      continue;
    }
    if (awaiting !== null) throw new Error(`unexpected ${awaiting.kind}`);
    if (game.state.zones.shared.stack.length === 0 && game.state.pendingTriggers.length === 0) {
      return;
    }
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
  }
  throw new Error("never settled");
}

function cast(game: Game, player: PlayerId, name: string, target?: ObjectId): void {
  const card = game.debugSpawn(name, player, "hand");
  game.dispatch({
    type: "cast-spell",
    player,
    card,
    targets: target === undefined ? [] : [{ kind: "object", object: target }],
  });
  settle(game);
}

/** A Skullbriar on A's battlefield carrying `n` +1/+1 counters. */
function grownSkullbriar(game: Game, n: number): ObjectId {
  const id = game.debugSpawn(SKULLBRIAR, A, "battlefield", { summoningSick: false });
  game.state.objects[id].counters["+1/+1"] = n;
  return id;
}

const plusOnes = (game: Game, id: ObjectId): number =>
  game.state.objects[id].counters["+1/+1"] ?? 0;
const power = (game: Game, id: ObjectId): number =>
  computeCharacteristics(game.state, reg, id).power;

describe("Skullbriar, the Walking Grave", () => {
  it("is a {B}{G} legendary 1/1 Zombie Elemental with haste", () => {
    const def = reg.get(SKULLBRIAR);
    expect(def.manaCost).toBe("{B}{G}");
    expect(def.colors).toEqual(["B", "G"]);
    expect(def.supertypes).toContain("legendary");
    expect(def.subtypes).toEqual(["Zombie", "Elemental"]);
    expect([def.power, def.toughness]).toEqual([1, 1]);
    expect(def.keywords).toContain("haste");
    expect(def.countersPersistAcrossZones).toBe(true);
  });

  it("grows by a +1/+1 counter when it deals combat damage to a player", () => {
    const a = new ScriptedController(A);
    const b = new ScriptedController(B);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      controllers: { [A]: a, [B]: b },
      decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Swamp") })),
    });
    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
    // Summoning sick, but haste lets it attack the turn it arrives.
    const skull = game.debugSpawn(SKULLBRIAR, A, "battlefield");
    a.declareAttackersFn = () => [{ attacker: skull, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);

    expect(game.state.players[B].life).toBe(19);
    expect(plusOnes(game, skull)).toBe(1);
    expect(power(game, skull)).toBe(2);
  });

  it("dies and is reanimated with its counters", () => {
    const game = table();
    const skull = grownSkullbriar(game, 3);
    lands(game, "Swamp", A, 4);

    cast(game, A, "Murder", skull);
    expect(game.state.objects[skull].zone).toBe("graveyard");
    expect(plusOnes(game, skull)).toBe(3);
    // Layer 7c applies in every zone: it's a 4/4 card in the graveyard, and
    // the player view shows it that way.
    expect(power(game, skull)).toBe(4);
    const seen = game.viewFor(B).objects[skull];
    expect(seen?.counters["+1/+1"]).toBe(3);

    cast(game, A, "Reanimate", skull);
    expect(game.state.objects[skull].zone).toBe("battlefield");
    expect(plusOnes(game, skull)).toBe(3);
    expect(power(game, skull)).toBe(4);
    // Reanimate's life loss reads the card's mana value, not its size.
    expect(game.state.players[A].life).toBe(18);
  });

  it("is exiled and returned with its counters (Banishing Light, then Disenchant)", () => {
    const game = table();
    const skull = grownSkullbriar(game, 2);
    lands(game, "Plains", B, 5);
    game.advanceUntil(
      (s) =>
        s.turn.step === "precombat-main" &&
        s.turnOrder[s.turn.activePlayerIndex] === B &&
        s.priority.holder === B,
    );

    cast(game, B, "Banishing Light"); // its one legal target
    // Can't decline — Skullbriar isn't anyone's commander here.
    expect(game.state.objects[skull].zone).toBe("exile");
    expect(plusOnes(game, skull)).toBe(2);

    const light = game.state.objects[skull].exiledBy as ObjectId;
    cast(game, B, "Disenchant", light);
    expect(game.state.objects[skull].zone).toBe("battlefield");
    expect(plusOnes(game, skull)).toBe(2);
    expect(power(game, skull)).toBe(3);
  });

  it("NEGATIVE: bounced to hand, it loses its counters and is recast a 1/1", () => {
    const game = table();
    const skull = grownSkullbriar(game, 4);
    lands(game, "Island", A, 1);
    lands(game, "Swamp", A, 1);
    lands(game, "Forest", A, 1);

    cast(game, A, "Unsummon", skull);
    expect(game.state.objects[skull].zone).toBe("hand");
    expect(game.state.objects[skull].counters).toEqual({});

    game.dispatch({ type: "cast-spell", player: A, card: skull, targets: [] });
    settle(game);
    expect(game.state.objects[skull].zone).toBe("battlefield");
    expect(plusOnes(game, skull)).toBe(0);
    expect(power(game, skull)).toBe(1);
  });

  it("NEGATIVE: an ordinary creature still loses its counters on dying and returning", () => {
    const game = table();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    game.state.objects[bears].counters["+1/+1"] = 3;
    lands(game, "Swamp", A, 4);

    cast(game, A, "Murder", bears);
    expect(game.state.objects[bears].counters).toEqual({});
    cast(game, A, "Reanimate", bears);
    expect(plusOnes(game, bears)).toBe(0);
  });

  it("NEGATIVE: having lost its abilities as it leaves (Turn to Frog), it loses its counters", () => {
    const game = table();
    const skull = grownSkullbriar(game, 2);
    lands(game, "Island", A, 2);
    lands(game, "Swamp", A, 3);

    cast(game, A, "Turn to Frog", skull);
    expect(plusOnes(game, skull)).toBe(2); // still on it — counters aren't abilities
    cast(game, A, "Murder", skull);
    expect(game.state.objects[skull].zone).toBe("graveyard");
    expect(game.state.objects[skull].counters).toEqual({});
  });

  it("a copy of Skullbriar has the ability as it leaves, so it keeps its counters (ruling)", () => {
    const game = table();
    const clone = game.debugSpawn("Clone", A, "battlefield", { summoningSick: false });
    game.state.objects[clone].copyOf = SKULLBRIAR;
    game.state.objects[clone].counters["+1/+1"] = 2;
    lands(game, "Swamp", A, 3);

    cast(game, A, "Murder", clone);
    expect(game.state.objects[clone].zone).toBe("graveyard");
    // In the graveyard it's a Clone again (rule 707.2), still carrying them.
    expect(game.state.objects[clone].copyOf).toBeNull();
    expect(plusOnes(game, clone)).toBe(2);
  });

  it("as a commander: goes to the command zone and is recast with its counters", () => {
    const game = table(SKULLBRIAR);
    const skull = game.state.zones.shared.command.find(
      (id) => game.state.objects[id].owner === A,
    )!;
    lands(game, "Swamp", A, 6);
    lands(game, "Forest", A, 4);

    game.dispatch({ type: "cast-spell", player: A, card: skull, targets: [] });
    settle(game);
    expect(game.state.objects[skull].zone).toBe("battlefield");
    game.state.objects[skull].counters["+1/+1"] = 2;

    cast(game, A, "Murder", skull); // 903.9a — `settle` sends it to the command zone
    expect(game.state.objects[skull].zone).toBe("command");
    expect(plusOnes(game, skull)).toBe(2);
    expect(game.viewFor(A).objects[skull]?.counters["+1/+1"]).toBe(2);

    // {B}{G} plus a {2} tax. On the stack it's a 3/3 spell, and it brings
    // the counters with it onto the battlefield.
    game.dispatch({ type: "cast-spell", player: A, card: skull, targets: [] });
    expect(game.state.objects[skull].zone).toBe("stack");
    expect(plusOnes(game, skull)).toBe(2);
    settle(game);
    expect(game.state.objects[skull].zone).toBe("battlefield");
    expect(plusOnes(game, skull)).toBe(2);
    expect(power(game, skull)).toBe(3);
  });

  it("as a commander: bounced, the command zone replaces the hand, so it keeps its counters", () => {
    const game = table(SKULLBRIAR);
    const skull = game.state.zones.shared.command.find(
      (id) => game.state.objects[id].owner === A,
    )!;
    lands(game, "Swamp", A, 1);
    lands(game, "Forest", A, 1);
    lands(game, "Island", A, 1);
    game.dispatch({ type: "cast-spell", player: A, card: skull, targets: [] });
    settle(game);
    game.state.objects[skull].counters["+1/+1"] = 2;

    cast(game, A, "Unsummon", skull);
    expect(game.state.objects[skull].zone).toBe("command");
    expect(plusOnes(game, skull)).toBe(2);
  });

  it("NEGATIVE: as a commander whose owner lets the bounce through, it reaches the hand without them", () => {
    const game = table(SKULLBRIAR);
    const skull = game.state.zones.shared.command.find(
      (id) => game.state.objects[id].owner === A,
    )!;
    lands(game, "Swamp", A, 1);
    lands(game, "Forest", A, 1);
    lands(game, "Island", A, 1);
    game.dispatch({ type: "cast-spell", player: A, card: skull, targets: [] });
    settle(game);
    game.state.objects[skull].counters["+1/+1"] = 2;

    const unsummon = game.debugSpawn("Unsummon", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: unsummon,
      targets: [{ kind: "object", object: skull }],
    });
    settle(game, false);
    expect(game.state.objects[skull].zone).toBe("hand");
    expect(game.state.objects[skull].counters).toEqual({});
  });
});
