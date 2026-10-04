/**
 * Top-5000 batch 20b. No engine changes: every card here is existing
 * vocabulary. The tests pin the clause of each most likely to be wired
 * wrong — "another green creature" (Ivy Lane Denizen), any artifact going to
 * a graveyard (Disciple of the Vault), X read off tapped artifacts as the
 * batch attack trigger resolves (Alibou), three mana from creatures
 * (Inga and Esika), "other" in the count (Valley Rotcaller), the tap-five
 * cost and the lasting steal (Captivating Vampire), "modified"
 * (Envoy of the Ancestors), the Vampire-counted cost reduction and the Blood
 * token (Voldaren Estate), and the delirium-gated extra combat (Fear of
 * Missing Out).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
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
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
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
const canActivate = (game: Game, source: ObjectId, abilityIndex: number): boolean =>
  game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === source && x.abilityIndex === abilityIndex);

describe("top-5000 batch 20b — Ivy Lane Denizen", () => {
  it("grows a target when another green creature of yours enters, and not for a colourless one", () => {
    const { game, a } = setUp();
    const ivy = spawn(game, "Ivy Lane Denizen");
    a.chooseTargetsFn = () => [{ kind: "object", object: ivy }];
    game.debugSpawn("Ornithopter", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, ivy)).toBe(0);
    game.debugSpawn("Llanowar Elves", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, ivy)).toBe(1);
    // An opponent's green creature isn't "you control".
    game.debugSpawn("Llanowar Elves", B, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, ivy)).toBe(1);
  });
});

describe("top-5000 batch 20b — Disciple of the Vault", () => {
  it("drains a target opponent for any artifact going to a graveyard from the battlefield", () => {
    const { game } = setUp();
    spawn(game, "Disciple of the Vault");
    const theirs = spawn(game, "Sol Ring", B);
    const mine = spawn(game, "Sol Ring");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: theirs }]);
    settle(game);
    expect(life(game, B)).toBe(19);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: mine }]);
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-5000 batch 20b — Infectious Inquiry", () => {
  it("draws two, loses 2 life, and gives each opponent a poison counter", () => {
    const { game } = setUp(["Infectious Inquiry"], "Swamp");
    lands(game, "Swamp", 3);
    const handBefore = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Infectious Inquiry"), targets: [] });
    settle(game);
    expect(game.handOf(A)).toHaveLength(handBefore + 1);
    expect(life(game, A)).toBe(18);
    expect(game.state.players[B].counters.poison).toBe(1);
    expect(game.state.players[A].counters.poison).toBeUndefined();
  });
});

describe("top-5000 batch 20b — Alibou, Ancient Witness", () => {
  it("gives other artifact creatures haste, and deals X = tapped artifacts once per attack", () => {
    const { game, a } = setUp();
    const alibou = spawn(game, "Alibou, Ancient Witness");
    const fresh = game.debugSpawn("Ornithopter", A, "battlefield", { summoningSick: true });
    expect(chars(game, fresh).keywords.has("haste")).toBe(true);
    expect(chars(game, alibou).keywords.has("haste")).toBe(false);
    const thopter = spawn(game, "Ornithopter");
    game.debugSpawn("Sol Ring", A, "battlefield", { tapped: true });
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: thopter, defender: B },
        { attacker: fresh, defender: B },
      ],
    });
    settle(game);
    // Two attacking Ornithopters (tapped) and the tapped Sol Ring: X = 3,
    // dealt once for the whole declaration.
    expect(life(game, B)).toBe(17);
  });
});

describe("top-5000 batch 20b — Inga and Esika", () => {
  it("grants vigilance and draws when three mana from creatures paid for a creature spell", () => {
    const { game } = setUp(["Centaur Courser"], "Island");
    spawn(game, "Inga and Esika");
    const elves = lands(game, "Llanowar Elves", 3);
    expect(chars(game, elves[0]).keywords.has("vigilance")).toBe(true);
    const handBefore = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Centaur Courser"), targets: [] });
    settle(game);
    expect(named(game, "Centaur Courser")).toHaveLength(1);
    expect(game.handOf(A)).toHaveLength(handBefore);
  });

  it("doesn't draw when fewer than three of the mana came from creatures", () => {
    const { game } = setUp(["Centaur Courser"], "Island");
    game.debugSpawn("Inga and Esika", A, "battlefield", { summoningSick: true });
    spawn(game, "Llanowar Elves");
    lands(game, "Forest", 2);
    const handBefore = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Centaur Courser"), targets: [] });
    settle(game);
    expect(named(game, "Centaur Courser")).toHaveLength(1);
    expect(game.handOf(A)).toHaveLength(handBefore - 1);
  });
});

describe("top-5000 batch 20b — Valley Rotcaller", () => {
  it("drains for each other Squirrel, Bat, Lizard and Rat, not counting itself", () => {
    const { game } = setUp();
    const rotcaller = spawn(game, "Valley Rotcaller");
    spawn(game, "Squirrel Token");
    spawn(game, "Grizzly Bears");
    const attack = registry.get("Valley Rotcaller")!.triggered[0].effect!;
    game.debugApplyEffect(A, attack, [], { source: rotcaller });
    settle(game);
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(21);
  });
});

describe("top-5000 batch 20b — Captivating Vampire", () => {
  it("pumps other Vampires, and taps five to steal a creature for good, making it a Vampire", () => {
    const { game } = setUp();
    const captivating = spawn(game, "Captivating Vampire");
    const hawks = lands(game, "Vampire Nighthawk", 3);
    expect([chars(game, hawks[0]).power, chars(game, hawks[0]).toughness]).toEqual([3, 4]);
    expect([chars(game, captivating).power, chars(game, captivating).toughness]).toEqual([2, 2]);
    expect(canActivate(game, captivating, 0)).toBe(false);
    // A summoning-sick Vampire can still be tapped for the cost (no {T}).
    const sick = game.debugSpawn("Vampire Nighthawk", A, "battlefield", { summoningSick: true });
    expect(canActivate(game, captivating, 0)).toBe(true);
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: captivating,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    for (const id of [captivating, sick, ...hawks]) expect(game.state.objects[id].tapped).toBe(true);
    expect(chars(game, bears).controller).toBe(A);
    expect(chars(game, bears).subtypes).toContain("Vampire");
    // Now one of the "other Vampire creatures you control".
    expect([chars(game, bears).power, chars(game, bears).toughness]).toEqual([3, 3]);
    // No duration: it stays after Captivating Vampire leaves.
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: captivating }]);
    settle(game);
    expect(chars(game, bears).controller).toBe(A);
    expect(chars(game, bears).subtypes).toContain("Vampire");
  });
});

describe("top-5000 batch 20b — Envoy of the Ancestors", () => {
  it("gives lifelink only to modified creatures you control", () => {
    const { game } = setUp();
    const envoy = spawn(game, "Envoy of the Ancestors");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    expect(chars(game, bears).keywords.has("lifelink")).toBe(false);
    game.state.objects[bears].counters = { "+1/+1": 1 };
    game.state.objects[theirs].counters = { "+1/+1": 1 };
    expect(chars(game, bears).keywords.has("lifelink")).toBe(true);
    expect(chars(game, theirs).keywords.has("lifelink")).toBe(false);
    expect(chars(game, envoy).keywords.has("lifelink")).toBe(false);
  });
});

describe("top-5000 batch 20b — Voldaren Estate", () => {
  it("pays 1 life for Vampire mana, and its Blood costs {1} less per Vampire", () => {
    const { game } = setUp();
    const estate = spawn(game, "Voldaren Estate");
    lands(game, "Wastes", 3);
    expect(canActivate(game, estate, 2)).toBe(false);
    lands(game, "Vampire Nighthawk", 2);
    expect(canActivate(game, estate, 2)).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: estate, abilityIndex: 2 });
    settle(game);
    const blood = named(game, "Blood Token");
    expect(blood).toHaveLength(1);

    // The Blood token: {1}, {T}, discard a card, sacrifice it: draw a card.
    spawn(game, "Wastes");
    const handBefore = game.handOf(A).length;
    const graveBefore = game.state.zones.perPlayer[A].graveyard.length;
    game.dispatch({ type: "activate-ability", player: A, source: blood[0], abilityIndex: 0 });
    settle(game);
    expect(named(game, "Blood Token")).toHaveLength(0);
    expect(game.handOf(A)).toHaveLength(handBefore);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(graveBefore + 1);
  });

  it("taps for a colour at 1 life", () => {
    const { game } = setUp();
    const estate = spawn(game, "Voldaren Estate");
    game.dispatch({ type: "activate-ability", player: A, source: estate, abilityIndex: 1, manaColors: ["B"] });
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["B"]);
    expect(life(game, A)).toBe(19);
  });
});

describe("top-5000 batch 20b — Fear of Missing Out", () => {
  it("with delirium, untaps a target creature and adds a combat after this one", () => {
    const { game, a } = setUp();
    for (const card of ["Grizzly Bears", "Forest", "Sol Ring", "Lightning Bolt"]) {
      game.debugSpawn(card, A, "graveyard");
    }
    const fomo = spawn(game, "Fear of Missing Out");
    const tapped = game.debugSpawn("Grizzly Bears", A, "battlefield", { tapped: true, summoningSick: false });
    a.chooseTargetsFn = () => [{ kind: "object", object: tapped }];
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: fomo, defender: B }] });
    settle(game);
    expect(game.state.objects[tapped].tapped).toBe(false);
    // A second declare-attackers step in the same turn.
    game.advanceUntil(
      (s) => (s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers") || s.turn.number > 1,
    );
    expect(game.state.turn.number).toBe(1);
  });

  it("without delirium, doesn't trigger", () => {
    const { game, a } = setUp();
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    const fomo = spawn(game, "Fear of Missing Out");
    const tapped = game.debugSpawn("Grizzly Bears", A, "battlefield", { tapped: true, summoningSick: false });
    a.chooseTargetsFn = () => [{ kind: "object", object: tapped }];
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: fomo, defender: B }] });
    settle(game);
    expect(game.state.objects[tapped].tapped).toBe(true);
    game.advanceUntil(
      (s) => (s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers") || s.turn.number > 1,
    );
    expect(game.state.turn.number).toBeGreaterThan(1);
  });
});
