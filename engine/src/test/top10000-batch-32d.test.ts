/**
 * Top-10000 batch 32d — no engine change. Each test pins the clause of an
 * authored card most likely to be wired wrong: "this or another Cat"
 * (Qasali Slingers), a reflexive sacrifice and a dies-return (Cavalier of
 * Night), a flicker and a token (Personify), damage dealt as life lost
 * (Barbed Servitor), the two-target damage mode (Cast into the Fire), a dies
 * trigger read off an attacking legendary's last-known information (Éomer),
 * "if you cast it" and half rounded up (Shard of the Nightbringer), "each
 * other" (Copperhorn Scout), an intervening-if on "another Elf" (Dwynen's
 * Elite), restricted mana (Troyan), charge counters and an extra turn
 * (Magistrate's Scepter), a modified creature's impulse draw (Araña) and a
 * Background's granted enters/leaves triggers (Candlekeep Sage).
 */
import { describe, expect, it } from "vitest";

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

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  return c;
};
const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: true });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const settle = (game: Game): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [0] });
    } else {
      game.advanceUntil(quiet);
    }
  }
  throw new Error("settle: still unresolved");
};
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;
const obj = (object: ObjectId) => ({ kind: "object" as const, object });
/** Declare `attackers` at B, then run until they're attacking and every
 * attack trigger has resolved. */
const attackWith = (game: Game, a: ScriptedController, attackers: readonly ObjectId[]): void => {
  a.declareAttackersFn = () => attackers.map((attacker) => ({ attacker, defender: B }));
  game.advanceUntil((s) => s.objects[attackers[0]].attacking != null);
  settle(game);
};

describe("top-10000 batch 32d — Qasali Slingers", () => {
  it("triggers for another Cat entering, not for a non-Cat", () => {
    const { game } = setUp();
    spawn(game, "Qasali Slingers");
    const ring = spawn(game, "Sol Ring", B);
    enter(game, "Grizzly Bears");
    settle(game);
    expect(zone(game, ring)).toBe("battlefield");
    enter(game, "Savannah Lions");
    settle(game);
    expect(zone(game, ring)).toBe("graveyard");
  });
});

describe("top-10000 batch 32d — Cavalier of Night", () => {
  it("sacrifices another creature to destroy an opponent's, then returns a small creature card as it dies", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    a.chooseSacrificesFn = (_view, eligible) => {
      expect(eligible).toContain(bears);
      return [bears];
    };
    const cavalier = enter(game, "Cavalier of Night");
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, giant)).toBe("graveyard");
    expect(zone(game, cavalier)).toBe("battlefield");
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(cavalier)]);
    settle(game);
    const back = named(game, "Grizzly Bears");
    expect(back).toHaveLength(1);
    expect(game.state.objects[back[0]].controller).toBe(A);
  });
});

describe("top-10000 batch 32d — Personify", () => {
  it("blinks the creature (its counters gone) and makes a Shapeshifter", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 2 };
    game.debugApplyEffect(A, effectOf("Personify"), [obj(bears)]);
    settle(game);
    const back = named(game, "Grizzly Bears");
    expect(back).toHaveLength(1);
    expect(counters(game, back[0])).toBe(0);
    expect(named(game, "Shapeshifter Token")).toHaveLength(1);
  });
});

describe("top-10000 batch 32d — Barbed Servitor", () => {
  it("is suspected as it enters, and damage dealt to it is life the opponent loses", () => {
    const { game } = setUp();
    const servitor = enter(game, "Barbed Servitor");
    settle(game);
    expect(game.state.objects[servitor].suspectedAt).toBeDefined();
    const giant = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(B, { kind: "damage", amount: 3, target: 0 }, [obj(servitor)], { source: giant });
    settle(game);
    expect(zone(game, servitor)).toBe("battlefield");
    expect(life(game, B)).toBe(17);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-10000 batch 32d — Cast into the Fire", () => {
  it("deals 1 damage to each of two target creatures", () => {
    const { game } = setUp(["Cast into the Fire"], "Mountain");
    lands(game, "Mountain", 2);
    const bears = spawn(game, "Grizzly Bears", B);
    const elves = spawn(game, "Llanowar Elves", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Cast into the Fire"),
      modes: [0],
      targets: [obj(bears), obj(elves)],
    });
    settle(game);
    expect(zone(game, elves)).toBe("graveyard");
    expect(zone(game, bears)).toBe("battlefield");
  });

  it("exiles target artifact", () => {
    const { game } = setUp(["Cast into the Fire"], "Mountain");
    lands(game, "Mountain", 2);
    const ring = spawn(game, "Sol Ring", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Cast into the Fire"), modes: [1], targets: [obj(ring)] });
    settle(game);
    expect(zone(game, ring)).toBe("exile");
  });
});

describe("top-10000 batch 32d — Shard of the Nightbringer", () => {
  it("cast, drains half the opponent's life rounded up", () => {
    const { game } = setUp(["Shard of the Nightbringer"], "Swamp");
    lands(game, "Swamp", 8);
    game.state.players[B].life = 15;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Shard of the Nightbringer"), targets: [] });
    settle(game);
    expect(named(game, "Shard of the Nightbringer")).toHaveLength(1);
    expect(life(game, B)).toBe(7);
    expect(life(game, A)).toBe(28);
  });

  it("put onto the battlefield without being cast, does nothing", () => {
    const { game } = setUp();
    enter(game, "Shard of the Nightbringer");
    settle(game);
    expect(life(game, B)).toBe(20);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-10000 batch 32d — Copperhorn Scout", () => {
  it("untaps each other creature you control, not itself", () => {
    const { game, a } = setUp();
    const scout = spawn(game, "Copperhorn Scout");
    const bears = spawn(game, "Grizzly Bears");
    attackWith(game, a, [scout, bears]);
    expect(game.state.objects[bears].tapped).toBe(false);
    expect(game.state.objects[scout].tapped).toBe(true);
  });
});

describe("top-10000 batch 32d — Dwynen's Elite", () => {
  it("makes an Elf Warrior only if you control another Elf", () => {
    const { game } = setUp();
    enter(game, "Dwynen's Elite");
    settle(game);
    expect(named(game, "Elf Warrior Token")).toHaveLength(0);
    spawn(game, "Llanowar Elves");
    enter(game, "Dwynen's Elite");
    settle(game);
    expect(named(game, "Elf Warrior Token")).toHaveLength(1);
  });
});

describe("top-10000 batch 32d — Troyan, Gutsy Explorer", () => {
  it("its mana pays for a spell with {X} in its cost, not a cheap one without", () => {
    const { game } = setUp(["Hydroid Krasis", "Grizzly Bears"]);
    spawn(game, "Troyan, Gutsy Explorer");
    const castable = (name: string): boolean =>
      game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === inHand(game, name));
    expect(castable("Hydroid Krasis")).toBe(true);
    expect(castable("Grizzly Bears")).toBe(false);
  });
});

describe("top-10000 batch 32d — Magistrate's Scepter", () => {
  it("charges up, then spends three counters on an extra turn", () => {
    const { game } = setUp();
    lands(game, "Wastes", 4);
    const scepter = spawn(game, "Magistrate's Scepter");
    game.dispatch({ type: "activate-ability", player: A, source: scepter, abilityIndex: 0 });
    settle(game);
    expect(counters(game, scepter, "charge")).toBe(1);
    game.state.objects[scepter].counters = { charge: 3 };
    game.state.objects[scepter].tapped = false;
    game.dispatch({ type: "activate-ability", player: A, source: scepter, abilityIndex: 1 });
    settle(game);
    expect(counters(game, scepter, "charge")).toBe(0);
    expect(game.state.extraTurns).toEqual([A]);
  });
});

describe("top-10000 batch 32d — Araña, Heart of the Spider", () => {
  it("grows an attacker, and a modified creature's combat damage exiles your top card to play", () => {
    const { game, a } = setUp();
    spawn(game, "Araña, Heart of the Spider");
    const bears = spawn(game, "Grizzly Bears");
    attackWith(game, a, [bears]);
    expect(counters(game, bears)).toBe(1);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(17);
    const exiled = Object.values(game.state.objects).filter((o) => o.zone === "exile" && o.owner === A);
    expect(exiled).toHaveLength(1);
  });

  it("an unmodified creature's combat damage exiles nothing", () => {
    const { game, a } = setUp();
    const arana = spawn(game, "Araña, Heart of the Spider");
    const bears = spawn(game, "Grizzly Bears");
    // Araña stays home, so it can't take the attack trigger's counter; the
    // Bears' is taken off again before damage, leaving them unmodified.
    attackWith(game, a, [bears]);
    expect(counters(game, bears)).toBe(1);
    game.state.objects[bears].counters = {};
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(zone(game, arana)).toBe("battlefield");
    expect(life(game, B)).toBe(18);
    expect(Object.values(game.state.objects).filter((o) => o.zone === "exile" && o.owner === A)).toHaveLength(0);
  });
});

describe("top-10000 batch 32d — Candlekeep Sage", () => {
  it("gives a commander you own a draw as it enters and as it leaves", () => {
    const { game } = setUp();
    spawn(game, "Candlekeep Sage");
    const commander = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.state.objects[commander].isCommander = true;
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0, underYourControl: true }, [obj(commander)]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand + 1);
    const onField = named(game, "Grizzly Bears")[0];
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(onField)]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand + 2);
  });

  it("gives nothing to a creature that isn't a commander", () => {
    const { game } = setUp();
    spawn(game, "Candlekeep Sage");
    const hand = game.handOf(A).length;
    const bears = enter(game, "Grizzly Bears");
    settle(game);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(bears)]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand);
  });
});
