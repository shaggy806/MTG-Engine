/**
 * Rin and Seri, Inseparable — every clause through the real `Game`:
 *
 * - "Whenever you cast a Dog spell, create a 1/1 green Cat creature token."
 * - "Whenever you cast a Cat spell, create a 1/1 white Dog creature token."
 *   Cast triggers (rule 601.2i), so the token arrives before the spell
 *   resolves; not off an opponent's spell, not off a spell that is neither,
 *   both off a spell that is both, and neither off Rin and Seri's own cast
 *   (ruling 2020-06-23 / rule 113.6).
 * - "{R}{G}{W}, {T}: Rin and Seri deals damage to any target equal to the
 *   number of Dogs you control. You gain life equal to the number of Cats you
 *   control." Both counts read on resolution (Rin and Seri counts itself
 *   while it's there, and not once it's gone), token stacks count in full,
 *   and an illegal target fizzles the whole thing, life gain included.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const RIN = "Rin and Seri, Inseparable";
const CAT = "1/1 Green Cat Token";
const DOG = "1/1 White Dog Token";
const RGW = ["Mountain", "Forest", "Plains"];

const mkGame = (aHand: readonly string[] = [], bHand: readonly string[] = []) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Swamp")] },
      { player: B, cards: [...bHand, ...Array<string>(40).fill("Swamp")] },
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
const cast = (game: Game, player: PlayerId, name: string, targets: TargetRef[] = []): void => {
  game.dispatch({ type: "cast-spell", player, card: inHand(game, player, name), targets });
};
/** Tokens named `name` that `player` controls, a compacted stack counting as every token in it. */
const tokens = (game: Game, name: string, player: PlayerId): number =>
  game.battlefield
    .map((id) => game.state.objects[id])
    .filter((o) => o.cardName === name && o.controller === player)
    .reduce((n, o) => n + (o.stackCount ?? 1), 0);
const firstToken = (game: Game, name: string): ObjectId => {
  const id = game.battlefield.find((i) => game.state.objects[i].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });
const activate = (game: Game, rin: ObjectId, target: TargetRef): void => {
  game.dispatch({
    type: "activate-ability",
    player: A,
    source: rin,
    abilityIndex: 0,
    targets: [target],
  });
};
const pingOffered = (game: Game, rin: ObjectId): boolean =>
  game
    .legalActions(A)
    .some((a) => a.kind === "activate-ability" && a.source === rin && a.abilityIndex === 0);
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;

describe("Rin and Seri — characteristics", () => {
  it("is a legendary 4/4 Dog Cat, red, green and white", () => {
    const def = createDefaultRegistry().get(RIN);
    expect(def.supertypes).toEqual(["legendary"]);
    expect([...def.subtypes]).toEqual(["Dog", "Cat"]);
    expect([def.power, def.toughness]).toEqual([4, 4]);
    expect(new Set(def.colors)).toEqual(new Set(["R", "G", "W"]));
    expect(identityString(colorIdentityOf(def))).toBe("WRG");
  });
});

describe("Rin and Seri — whenever you cast a Dog spell", () => {
  it("makes a 1/1 green Cat token, before the Dog spell resolves", () => {
    const game = mkGame(["Underworld Rage-Hound"]);
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, RIN, A);
    lands(game, A, ["Mountain", "Mountain"]);

    cast(game, A, "Underworld Rage-Hound");
    game.advanceUntil(quiet);

    expect(tokens(game, CAT, A)).toBe(1);
    expect(tokens(game, DOG, A)).toBe(0);
    const token = firstToken(game, CAT);
    const c = game.characteristics(token);
    expect(game.state.objects[token].isToken).toBe(true);
    expect([c.power, c.toughness]).toEqual([1, 1]);
    expect([...c.types]).toEqual(["creature"]);
    expect([...c.subtypes]).toEqual(["Cat"]);
    expect([...c.colors]).toEqual(["G"]);

    const log = game.state.eventLog;
    const tokenEntered = log.findIndex(
      (e) => e.type === "permanent-entered-battlefield" && e.object === token,
    );
    const houndResolved = log.findIndex(
      (e) =>
        e.type === "spell-resolved" &&
        game.state.objects[e.object]?.cardName === "Underworld Rage-Hound",
    );
    expect(tokenEntered).toBeGreaterThanOrEqual(0);
    expect(houndResolved).toBeGreaterThan(tokenEntered);
  });

  it("doesn't trigger off an opponent's Dog spell", () => {
    const game = mkGame([], ["Underworld Rage-Hound"]);
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, RIN, A);
    game.advanceUntil(mainPhaseOf(2, B));
    lands(game, B, ["Mountain", "Mountain"]);

    cast(game, B, "Underworld Rage-Hound");
    game.advanceUntil(quiet);
    expect(tokens(game, CAT, A)).toBe(0);
    expect(tokens(game, CAT, B)).toBe(0);
  });
});

describe("Rin and Seri — whenever you cast a Cat spell", () => {
  it("makes a 1/1 white Dog token, before the Cat spell resolves", () => {
    const game = mkGame(["Longtusk Cub"]);
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, RIN, A);
    lands(game, A, ["Forest", "Forest"]);

    cast(game, A, "Longtusk Cub");
    game.advanceUntil(quiet);

    expect(tokens(game, DOG, A)).toBe(1);
    expect(tokens(game, CAT, A)).toBe(0);
    const token = firstToken(game, DOG);
    const c = game.characteristics(token);
    expect(game.state.objects[token].isToken).toBe(true);
    expect([c.power, c.toughness]).toEqual([1, 1]);
    expect([...c.types]).toEqual(["creature"]);
    expect([...c.subtypes]).toEqual(["Dog"]);
    expect([...c.colors]).toEqual(["W"]);

    const log = game.state.eventLog;
    const tokenEntered = log.findIndex(
      (e) => e.type === "permanent-entered-battlefield" && e.object === token,
    );
    const cubResolved = log.findIndex(
      (e) =>
        e.type === "spell-resolved" && game.state.objects[e.object]?.cardName === "Longtusk Cub",
    );
    expect(tokenEntered).toBeGreaterThanOrEqual(0);
    expect(cubResolved).toBeGreaterThan(tokenEntered);
  });

  it("doesn't trigger off an opponent's Cat spell", () => {
    const game = mkGame([], ["Longtusk Cub"]);
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, RIN, A);
    game.advanceUntil(mainPhaseOf(2, B));
    lands(game, B, ["Forest", "Forest"]);

    cast(game, B, "Longtusk Cub");
    game.advanceUntil(quiet);
    expect(tokens(game, DOG, A)).toBe(0);
    expect(tokens(game, DOG, B)).toBe(0);
  });
});

describe("Rin and Seri — spells that are both, or neither", () => {
  it("makes nothing off a spell that is neither a Dog nor a Cat", () => {
    const game = mkGame(["Grizzly Bears", "Lightning Bolt"]);
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, RIN, A);
    lands(game, A, ["Forest", "Forest", "Mountain"]);

    cast(game, A, "Grizzly Bears");
    game.advanceUntil(quiet);
    cast(game, A, "Lightning Bolt", [player(B)]);
    game.advanceUntil(quiet);
    expect(tokens(game, CAT, A)).toBe(0);
    expect(tokens(game, DOG, A)).toBe(0);
  });

  it("doesn't trigger off casting Rin and Seri itself (ruling 2020-06-23)", () => {
    const game = mkGame([RIN]);
    game.advanceUntil(mainPhaseOf(1, A));
    lands(game, A, [...RGW, "Mountain"]);

    cast(game, A, RIN);
    game.advanceUntil(quiet);

    expect(game.battlefield.some((id) => game.state.objects[id].cardName === RIN)).toBe(true);
    expect(tokens(game, CAT, A)).toBe(0);
    expect(tokens(game, DOG, A)).toBe(0);
  });

  it("makes one of each off a spell that is both a Dog and a Cat", () => {
    // A second Rin and Seri, cast while the first is on the battlefield: a
    // Dog spell and a Cat spell at once. `otherOnly` excludes only the object
    // being cast, so the one on the battlefield sees both.
    const game = mkGame([RIN]);
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, RIN, A);
    lands(game, A, [...RGW, "Mountain"]);

    cast(game, A, RIN);
    game.advanceUntil(quiet);
    expect(tokens(game, CAT, A)).toBe(1);
    expect(tokens(game, DOG, A)).toBe(1);
  });
});

describe("Rin and Seri — {R}{G}{W}, {T}: damage per Dog, life per Cat", () => {
  it("counts Rin and Seri itself: 1 damage and 1 life on an otherwise empty board", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const rin = spawn(game, RIN, A);
    lands(game, A, RGW);

    expect(pingOffered(game, rin)).toBe(true);
    activate(game, rin, player(B));
    expect(game.state.objects[rin].tapped).toBe(true);
    game.advanceUntil(quiet);

    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(21);
  });

  it("damage counts Dogs you control, life counts Cats you control — not an opponent's", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const rin = spawn(game, RIN, A);
    spawn(game, "Underworld Rage-Hound", A); // Dog
    game.debugApplyEffect(A, { kind: "create-token", token: DOG, count: 2 });
    spawn(game, "Longtusk Cub", A); // Cat
    spawn(game, "Ajani's Pridemate", A); // Cat
    game.debugApplyEffect(A, { kind: "create-token", token: CAT, count: 3 });
    spawn(game, "Grizzly Bears", A); // neither
    // Opponent's Dogs and Cats count for nothing.
    spawn(game, "Underworld Rage-Hound", B);
    spawn(game, "Longtusk Cub", B);
    game.debugApplyEffect(B, { kind: "create-token", token: DOG, count: 2 });
    game.debugApplyEffect(B, { kind: "create-token", token: CAT, count: 2 });
    lands(game, A, RGW);

    activate(game, rin, player(B));
    game.advanceUntil(quiet);

    // Dogs: Rin and Seri, the Rage-Hound, two Dog tokens = 4.
    expect(life(game, B)).toBe(20 - 4);
    // Cats: Rin and Seri, the Cub, the Pridemate, three Cat tokens = 6.
    expect(life(game, A)).toBe(20 + 6);
  });

  it("a compacted token stack counts as every token in it", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const rin = spawn(game, RIN, A);
    game.debugApplyEffect(A, { kind: "create-token", token: DOG, count: 9 });
    game.debugApplyEffect(A, { kind: "create-token", token: CAT, count: 12 });
    expect(game.state.objects[firstToken(game, DOG)].stackCount).toBe(9);
    expect(game.state.objects[firstToken(game, CAT)].stackCount).toBe(12);
    lands(game, A, RGW);

    activate(game, rin, player(B));
    game.advanceUntil(quiet);

    expect(life(game, B)).toBe(20 - 10);
    expect(life(game, A)).toBe(20 + 13);
  });

  it("can target a creature, and a Cat it kills still counts for the life", () => {
    // Damage first, life second — but state-based actions wait for the
    // whole ability, so the Cat token is still on the battlefield when the
    // Cats are counted.
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const rin = spawn(game, RIN, A);
    game.debugApplyEffect(A, { kind: "create-token", token: CAT, count: 1 });
    const cat = firstToken(game, CAT);
    lands(game, A, RGW);

    activate(game, rin, obj(cat));
    game.advanceUntil(quiet);

    expect(game.battlefield.includes(cat)).toBe(false);
    expect(life(game, A)).toBe(20 + 2);
  });

  it("kills an opponent's creature with enough Dogs", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const rin = spawn(game, RIN, A);
    game.debugApplyEffect(A, { kind: "create-token", token: DOG, count: 1 });
    const bears = spawn(game, "Grizzly Bears", B);
    lands(game, A, RGW);

    activate(game, rin, obj(bears));
    game.advanceUntil(quiet);
    expect(game.battlefield.includes(bears)).toBe(false);
    expect(game.state.zones.perPlayer[B].graveyard.includes(bears)).toBe(true);
    expect(life(game, A)).toBe(21);
  });

  it("counts as it resolves: a Dog and a Cat made in response both count", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const rin = spawn(game, RIN, A);
    lands(game, A, RGW);

    activate(game, rin, player(B));
    // What matters is only that they arrive between activation and
    // resolution, so make them directly.
    game.debugApplyEffect(A, { kind: "create-token", token: DOG, count: 1 });
    game.debugApplyEffect(A, { kind: "create-token", token: CAT, count: 1 });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
  });

  it("doesn't count Rin and Seri once it has left the battlefield (ruling 2020-06-23)", () => {
    const game = mkGame(["Unsummon"]);
    game.advanceUntil(mainPhaseOf(1, A));
    const rin = spawn(game, RIN, A);
    game.debugApplyEffect(A, { kind: "create-token", token: DOG, count: 2 });
    game.debugApplyEffect(A, { kind: "create-token", token: CAT, count: 1 });
    lands(game, A, [...RGW, "Island"]);

    activate(game, rin, player(B));
    // In response, bounce Rin and Seri: the ability still resolves (it's
    // independent of its source), with Rin and Seri no longer counted.
    cast(game, A, "Unsummon", [obj(rin)]);
    game.advanceUntil(quiet);

    expect(game.handOf(A).some((id) => game.state.objects[id].cardName === RIN)).toBe(true);
    expect(life(game, B)).toBe(20 - 2);
    expect(life(game, A)).toBe(20 + 1);
  });

  it("fizzles with an illegal target — no damage and no life (ruling 2020-06-23)", () => {
    const game = mkGame(["Lightning Bolt"]);
    game.advanceUntil(mainPhaseOf(1, A));
    const rin = spawn(game, RIN, A);
    game.debugApplyEffect(A, { kind: "create-token", token: CAT, count: 2 });
    const bears = spawn(game, "Grizzly Bears", B);
    lands(game, A, [...RGW, "Mountain"]);

    activate(game, rin, obj(bears));
    // Bolt the target in response; Rin and Seri's ability has nothing left
    // to target when it tries to resolve.
    cast(game, A, "Lightning Bolt", [obj(bears)]);
    game.advanceUntil(quiet);

    expect(game.battlefield.includes(bears)).toBe(false);
    expect(life(game, A)).toBe(20);
    expect(life(game, B)).toBe(20);
  });

  it("needs {R}{G}{W}", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const rin = spawn(game, RIN, A);
    lands(game, A, ["Mountain", "Forest", "Forest", "Forest"]);
    expect(pingOffered(game, rin)).toBe(false);
  });

  it("can't be activated while Rin and Seri is summoning sick ({T} in the cost)", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const rin = game.debugSpawn(RIN, A, "battlefield");
    expect(game.state.objects[rin].summoningSick).toBe(true);
    lands(game, A, RGW);
    expect(pingOffered(game, rin)).toBe(false);
  });

  it("works at instant speed — on an opponent's turn", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const rin = spawn(game, RIN, A);
    game.advanceUntil((s) => s.turn.number === 2 && s.priority.holder === A);
    lands(game, A, RGW);
    expect(pingOffered(game, rin)).toBe(true);
    activate(game, rin, player(B));
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(21);
  });
});
