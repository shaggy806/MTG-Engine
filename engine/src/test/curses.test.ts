/**
 * Curses: Auras that enchant a player (rule 303.4 — "Enchant player"). An
 * Aura spell targeting a player enters attached to them; one entering any
 * other way has its controller choose a player (303.4f); one on a player
 * who has left the game is put into its owner's graveyard (704.5m).
 *
 * And the Commander 2017 Curses' trigger, "Whenever enchanted player is
 * attacked, [X]. Each opponent attacking that player does the same" —
 * once per declaration, not for an attack on only their planeswalkers —
 * and Trespasser's Curse's "a creature enchanted player controls enters".
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";
import { auraPolarity } from "../target-polarity.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;

/** Three players, Alice's first main phase, with mana for anything. */
const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    decks: [A, B, C].map((p) => ({ player: p, cards: Array<string>(60).fill("Island") })),
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const land of ["Mountain", "Mountain", "Swamp", "Swamp", "Forest", "Forest", "Island", "Island"]) {
    game.debugSpawn(land, A, "battlefield", { summoningSick: false });
  }
  return game;
};

const spawn = (game: Game, name: string, p: PlayerId): ObjectId =>
  game.debugSpawn(name, p, "battlefield", { summoningSick: false });

/** Cast `name` from Alice's hand at `at`, and let it resolve. */
const castCurse = (game: Game, name: string, at: PlayerId): ObjectId => {
  const card = game.debugSpawn(name, A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card, targets: [player(at)] });
  game.advanceUntil(quiet);
  return card;
};

/** On to `attacker`'s declare-attackers step, then attack with `attackers`. */
const attack = (game: Game, attacker: PlayerId, attackers: readonly { attacker: ObjectId; defender: PlayerId | ObjectId }[]) => {
  game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === attacker);
  game.dispatch({ type: "declare-attackers", player: attacker, attackers });
  game.advanceUntil((s) => quiet(s) && s.turn.step !== "declare-attackers");
};

/** A token entering under `p`'s control the ordinary way — an event the
 * enters triggers see, which a debug spawn isn't. */
const enterUnder = (game: Game, p: PlayerId, token: string): void => {
  const source = game.debugSpawn("Island", p, "battlefield");
  game.debugApplyEffect(p, { kind: "create-token", token, count: 1 }, [], { source });
  game.advanceUntil(quiet);
};

const tokens = (game: Game, name: string, p: PlayerId): number =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === name && game.state.objects[id].controller === p,
  ).length;

describe("an Aura that enchants a player (rule 303.4)", () => {
  it("cast at a player, enters attached to them and to no permanent", () => {
    const game = setUp();
    const curse = castCurse(game, "Curse of Opulence", B);
    expect(game.state.objects[curse].zone).toBe("battlefield");
    expect(game.state.objects[curse].attachedToPlayer).toBe(B);
    expect(game.state.objects[curse].attachedTo).toBeNull();
  });

  it("goes to its owner's graveyard once the enchanted player leaves the game (704.5m)", () => {
    const game = setUp();
    const curse = castCurse(game, "Curse of Opulence", B);
    game.concede(B);
    game.advanceUntil(quiet);
    expect(game.state.objects[curse].zone).toBe("graveyard");
    expect(game.state.objects[curse].attachedToPlayer).toBeUndefined();
  });

  it("put onto the battlefield without being cast, has its controller choose a player (303.4f)", () => {
    const game = setUp();
    const curse = game.debugSpawn("Curse of Verbosity", A, "graveyard");
    const source = game.debugSpawn("Island", A, "battlefield");
    const reanimate: EffectSpec = { kind: "put-onto-battlefield", target: 0, underYourControl: true };
    game.debugApplyEffect(A, reanimate, [obj(curse)], { source });
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-enchant");
    if (awaiting?.kind !== "choose-enchant") return;
    expect(awaiting.options).toEqual([]);
    expect([...(awaiting.players ?? [])].sort()).toEqual([A, B, C].sort());
    game.dispatch({ type: "choose-enchant", player: A, enchant: C });
    game.advanceUntil(quiet);
    expect(game.state.objects[curse].zone).toBe("battlefield");
    expect(game.state.objects[curse].attachedToPlayer).toBe(C);
  });
});

describe("Curse of Opulence", () => {
  it("makes a Gold for its controller and for the opponent attacking the enchanted player — once per attack", () => {
    const game = setUp();
    castCurse(game, "Curse of Opulence", C);
    const one = spawn(game, "Grizzly Bears", B);
    const two = spawn(game, "Hill Giant", B);
    attack(game, B, [
      { attacker: one, defender: C },
      { attacker: two, defender: C },
    ]);
    expect(tokens(game, "Gold Token", A)).toBe(1);
    expect(tokens(game, "Gold Token", B)).toBe(1);
    expect(tokens(game, "Gold Token", C)).toBe(0);
  });

  it("doesn't trigger when someone other than the enchanted player is attacked", () => {
    const game = setUp();
    castCurse(game, "Curse of Opulence", C);
    const bears = spawn(game, "Grizzly Bears", B);
    attack(game, B, [{ attacker: bears, defender: A }]);
    expect(tokens(game, "Gold Token", A)).toBe(0);
    expect(tokens(game, "Gold Token", B)).toBe(0);
  });

  it("doesn't trigger for an attack on only the enchanted player's planeswalker", () => {
    const game = setUp();
    castCurse(game, "Curse of Opulence", C);
    const walker = spawn(game, "Ajani, Caller of the Pride", C);
    const bears = spawn(game, "Grizzly Bears", B);
    attack(game, B, [{ attacker: bears, defender: walker }]);
    expect(tokens(game, "Gold Token", A)).toBe(0);
  });

  it("its controller attacking the enchanted player makes one Gold, not two", () => {
    const game = setUp();
    castCurse(game, "Curse of Opulence", B);
    const bears = spawn(game, "Grizzly Bears", A);
    attack(game, A, [{ attacker: bears, defender: B }]);
    expect(tokens(game, "Gold Token", A)).toBe(1);
  });

  it("a Gold token sacrifices for one mana of any color, without tapping", () => {
    const game = setUp();
    castCurse(game, "Curse of Opulence", B);
    const bears = spawn(game, "Grizzly Bears", A);
    attack(game, A, [{ attacker: bears, defender: B }]);
    const gold = game.state.zones.shared.battlefield.find((id) => game.state.objects[id].cardName === "Gold Token")!;
    game.dispatch({ type: "activate-ability", player: A, source: gold, abilityIndex: 0, targets: [], manaColors: ["R"] });
    // Sacrificed, and — the state-based actions checked as A gets priority
    // back (117.3c, 117.5) — a token gone from the game (704.5d).
    expect(game.state.objects[gold]).toBeUndefined();
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["R"]);
  });
});

describe("Curse of Verbosity", () => {
  it("draws a card for its controller and for the opponent attacking", () => {
    const game = setUp();
    castCurse(game, "Curse of Verbosity", C);
    const bears = spawn(game, "Grizzly Bears", B);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === B);
    const handA = game.state.zones.perPlayer[A].hand.length;
    const handB = game.state.zones.perPlayer[B].hand.length;
    game.dispatch({ type: "declare-attackers", player: B, attackers: [{ attacker: bears, defender: C }] });
    game.advanceUntil((s) => quiet(s) && s.turn.step !== "declare-attackers");
    expect(game.state.zones.perPlayer[A].hand.length).toBe(handA + 1);
    expect(game.state.zones.perPlayer[B].hand.length).toBe(handB + 1);
  });
});

describe("Curse of Disturbance", () => {
  it("makes a 2/2 Zombie for its controller and for the opponent attacking", () => {
    const game = setUp();
    castCurse(game, "Curse of Disturbance", C);
    const bears = spawn(game, "Grizzly Bears", B);
    attack(game, B, [{ attacker: bears, defender: C }]);
    expect(tokens(game, "Zombie Token", A)).toBe(1);
    expect(tokens(game, "Zombie Token", B)).toBe(1);
  });
});

describe("Curse of Bounty", () => {
  it("untaps its controller's and the attacking opponent's nonland permanents, not their lands", () => {
    const game = setUp();
    castCurse(game, "Curse of Bounty", C);
    const rock = game.debugSpawn("Mind Stone", A, "battlefield", { tapped: true });
    const land = game.debugSpawn("Forest", A, "battlefield", { tapped: true });
    const theirs = game.debugSpawn("Mind Stone", B, "battlefield", { tapped: true });
    const bystander = game.debugSpawn("Mind Stone", C, "battlefield", { tapped: true });
    const bears = spawn(game, "Grizzly Bears", B);
    attack(game, B, [{ attacker: bears, defender: C }]);
    expect(game.state.objects[rock].tapped).toBe(false);
    expect(game.state.objects[land].tapped).toBe(true);
    expect(game.state.objects[theirs].tapped).toBe(false);
    expect(game.state.objects[bystander].tapped).toBe(true);
    // Untapping an attacker doesn't remove it from combat (the ruling).
    expect(game.state.objects[bears].tapped).toBe(false);
    expect(game.state.objects[bears].attacking).toBe(C);
  });
});

describe("Trespasser's Curse", () => {
  it("drains 1 whenever a creature the enchanted player controls enters", () => {
    const game = setUp();
    castCurse(game, "Trespasser's Curse", B);
    const lifeA = game.state.players[A].life;
    enterUnder(game, B, "Zombie Token");
    expect(game.state.players[B].life).toBe(19);
    expect(game.state.players[A].life).toBe(lifeA + 1);
  });

  it("ignores creatures other players control, and the enchanted player's noncreatures", () => {
    const game = setUp();
    castCurse(game, "Trespasser's Curse", B);
    enterUnder(game, C, "Zombie Token");
    enterUnder(game, B, "Gold Token");
    expect(game.state.players[B].life).toBe(20);
    expect(game.state.players[C].life).toBe(20);
  });
});

describe("bots and Curses", () => {
  it("aim every Curse as harm, so a bot casts one at an opponent", () => {
    const registry = createDefaultRegistry();
    for (const name of [
      "Curse of Opulence",
      "Curse of Verbosity",
      "Curse of Bounty",
      "Curse of Disturbance",
      "Trespasser's Curse",
    ]) {
      expect(auraPolarity(registry.get(name)), name).toBe("harm");
    }
  });
});
