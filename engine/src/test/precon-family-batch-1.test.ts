/**
 * Family Matters precon (BLC — Zinnia, Valley's Voice), batch 1. No engine
 * change: every card is existing vocabulary. The tests pin the clause most
 * likely to be wired wrong on each — a mass reanimation that only then makes
 * Spirits of what came back (Storm of Souls), a pump whose X is locked in as it resolves
 * (Jazal Goldmane), the third resolution of an alliance trigger turning into
 * a reflexive payment (Rose Room Treasurer), "if it wasn't cast" and base
 * power (Rapid Augmenter), counters read off the board as it enters and the
 * counters it died with (Boss's Chauffeur), doubling power (Devilish Valet),
 * "each untapped creature" (Calamity of Cinders), a spell count read at the
 * end step (Murmuration) and "draw that many" (Illusory Ambusher).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { nameOf } from "../state.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
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
const named = (game: Game, name: string, player?: PlayerId): ObjectId[] =>
  game.battlefield.filter(
    (id) => game.state.objects[id].cardName === name && (player === undefined || game.state.objects[id].controller === player),
  );
const tokens = (game: Game, name: string, player?: PlayerId): number =>
  named(game, name, player).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power ?? 0, c.toughness ?? 0];
};
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
const destroy = (game: Game, id: ObjectId): void => {
  game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: id }]);
  settle(game);
};
const toAttackers = (game: Game): void =>
  game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");

describe("Family batch 1 — Storm of Souls", () => {
  it("returns every creature card as a 1/1 flying Spirit, leaves the rest alone, and exiles itself", () => {
    const { game } = setUp(["Storm of Souls"], "Plains");
    lands(game, "Plains", 6);
    const onBoard = spawn(game, "Hill Giant");
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const theirs = game.debugSpawn("Grizzly Bears", B, "graveyard");
    const land = game.debugSpawn("Forest", A, "graveyard");
    const storm = inHand(game, "Storm of Souls");
    game.dispatch({ type: "cast-spell", player: A, card: storm, targets: [] });
    settle(game);

    for (const id of [giant, bears]) {
      expect(zone(game, id)).toBe("battlefield");
      const c = chars(game, id);
      expect([c.power, c.toughness]).toEqual([1, 1]);
      expect(c.keywords).toContain("flying");
      expect(c.subtypes).toContain("Spirit");
      expect(c.types).toContain("creature");
    }
    // In addition to its other types.
    expect(chars(game, giant).subtypes).toContain("Giant");
    // Only what came back this way, and only from your graveyard.
    expect(pt(game, onBoard)).toEqual([3, 3]);
    expect(chars(game, onBoard).keywords).not.toContain("flying");
    expect(zone(game, theirs)).toBe("graveyard");
    expect(zone(game, land)).toBe("graveyard");
    expect(zone(game, storm)).toBe("exile");
  });
});

describe("Family batch 1 — Jazal Goldmane", () => {
  it("gives attackers +X/+X for every attacking creature, X fixed as it resolves", () => {
    const { game } = setUp();
    lands(game, "Plains", 5);
    const jazal = spawn(game, "Jazal Goldmane");
    const bears = spawn(game, "Grizzly Bears");
    const home = spawn(game, "Hill Giant");
    toAttackers(game);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: jazal, defender: B },
        { attacker: bears, defender: B },
      ],
    });
    game.advanceUntil((s) => s.priority.holder === A && s.awaiting === null);
    const action = game.legalActions(A).find((x) => x.kind === "activate-ability" && x.source === jazal);
    expect(action).toBeDefined();
    game.dispatch({ type: "activate-ability", player: A, source: jazal, abilityIndex: 0, targets: [] });
    settle(game);
    expect(pt(game, jazal)).toEqual([6, 6]);
    expect(pt(game, bears)).toEqual([4, 4]);
    expect(pt(game, home)).toEqual([3, 3]);
    destroy(game, bears);
    expect(pt(game, jazal)).toEqual([6, 6]);
  });
});

describe("Family batch 1 — Rose Room Treasurer", () => {
  it("makes Treasures on its first two resolutions, then offers {X} for X damage", () => {
    const { game } = setUp();
    lands(game, "Mountain", 3);
    spawn(game, "Rose Room Treasurer");
    enter(game, "Grizzly Bears");
    settle(game);
    enter(game, "Grizzly Bears");
    settle(game);
    expect(tokens(game, "Treasure Token", A)).toBe(2);

    enter(game, "Grizzly Bears");
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    const before = game.state.players[B].life;
    game.dispatch({ type: "choose-modes", player: A, modes: [0], xValue: 3 });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || quiet(s));
    expect(game.state.awaiting?.kind).toBe("choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [{ kind: "player", player: B }] });
    settle(game);
    expect(game.state.players[B].life).toBe(before - 3);
    // No third Treasure.
    expect(tokens(game, "Treasure Token", A)).toBe(2);
  });
});

describe("Family batch 1 — Rapid Augmenter", () => {
  it("grows and turns unblockable when a creature enters without being cast, not when one is cast", () => {
    const { game } = setUp(["Grizzly Bears"], "Forest");
    lands(game, "Forest", 2);
    const otter = spawn(game, "Rapid Augmenter");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears"), targets: [] });
    settle(game);
    expect(counters(game, otter)).toBe(0);
    expect(chars(game, otter).keywords).not.toContain("unblockable");

    game.debugApplyEffect(A, { kind: "create-token", token: "Citizen Token", count: 1 }, []);
    settle(game);
    expect(counters(game, otter)).toBe(1);
    expect(chars(game, otter).keywords).toContain("unblockable");
  });

  it("gives haste only to an entering creature whose base power is 1", () => {
    const { game } = setUp();
    spawn(game, "Rapid Augmenter");
    const elves = enter(game, "Llanowar Elves");
    const bears = enter(game, "Grizzly Bears");
    settle(game);
    expect(chars(game, elves).keywords).toContain("haste");
    expect(chars(game, bears).keywords).not.toContain("haste");
  });
});

describe("Family batch 1 — Boss's Chauffeur", () => {
  it("enters with one plus a counter per other creature, and leaves a Citizen per counter", () => {
    const { game } = setUp();
    spawn(game, "Grizzly Bears");
    spawn(game, "Hill Giant");
    spawn(game, "Grizzly Bears", B);
    const chauffeur = enter(game, "Boss's Chauffeur");
    settle(game);
    expect(counters(game, chauffeur)).toBe(3);
    enter(game, "Llanowar Elves");
    settle(game);
    expect(counters(game, chauffeur)).toBe(4);
    destroy(game, chauffeur);
    expect(tokens(game, "Citizen Token", A)).toBe(4);
  });
});

describe("Family batch 1 — Devilish Valet", () => {
  it("doubles its power for each creature that enters", () => {
    const { game } = setUp();
    const valet = spawn(game, "Devilish Valet");
    enter(game, "Grizzly Bears");
    settle(game);
    expect(pt(game, valet)).toEqual([2, 3]);
    enter(game, "Grizzly Bears");
    settle(game);
    expect(pt(game, valet)).toEqual([4, 3]);
  });
});

describe("Family batch 1 — Calamity of Cinders", () => {
  it("deals 6 damage to each untapped creature only", () => {
    const { game } = setUp(["Calamity of Cinders"], "Mountain");
    lands(game, "Mountain", 7);
    const tapped = spawn(game, "Hill Giant", B);
    game.state.objects[tapped].tapped = true;
    const untapped = spawn(game, "Hill Giant", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Calamity of Cinders"), targets: [] });
    settle(game);
    expect(zone(game, untapped)).toBe("graveyard");
    expect(zone(game, tapped)).toBe("battlefield");
  });
});

describe("Family batch 1 — Murmuration", () => {
  it("pumps Birds and makes a Storm Crow per spell cast this turn at your end step", () => {
    const { game } = setUp(["Lightning Bolt", "Lightning Bolt"], "Mountain");
    lands(game, "Mountain", 2);
    spawn(game, "Murmuration");
    for (let i = 0; i < 2; i += 1) {
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: inHand(game, "Lightning Bolt"),
        targets: [{ kind: "player", player: B }],
      });
      settle(game);
    }
    game.advanceUntil((s) => s.turn.step === "end" && quiet(s) && s.priority.holder === A);
    settle(game);
    expect(tokens(game, "Storm Crow Token", A)).toBe(2);
    const crow = named(game, "Storm Crow Token", A)[0];
    expect(pt(game, crow)).toEqual([2, 3]);
    expect([...chars(game, crow).keywords]).toEqual(expect.arrayContaining(["flying", "vigilance"]));
    // Named Storm Crow in the game, though defined under a " Token" key.
    expect(nameOf(game.state.objects[crow])).toBe("Storm Crow");
  });
});

describe("Family batch 1 — Illusory Ambusher", () => {
  it("draws a card for each damage dealt, beyond its toughness too", () => {
    const { game } = setUp();
    const ambusher = spawn(game, "Illusory Ambusher");
    const before = game.handOf(A).length;
    game.debugApplyEffect(B, { kind: "damage", amount: 3, target: 0 }, [{ kind: "object", object: ambusher }]);
    settle(game);
    expect(game.handOf(A).length).toBe(before + 3);
  });
});

describe("Family batch 1 — Blade Splicer and Thopter Engineer", () => {
  it("makes a 3/3 Golem that has first strike, and gives artifact creatures haste", () => {
    const { game } = setUp();
    enter(game, "Blade Splicer");
    settle(game);
    const golem = named(game, "Phyrexian Golem Token", A)[0];
    expect(golem).toBeDefined();
    expect(pt(game, golem)).toEqual([3, 3]);
    expect(chars(game, golem).keywords).toContain("first-strike");

    enter(game, "Thopter Engineer");
    settle(game);
    const thopter = named(game, "Thopter Token", A)[0];
    expect([...chars(game, thopter).keywords]).toEqual(expect.arrayContaining(["flying", "haste"]));
    expect(chars(game, golem).keywords).toContain("haste");
    expect(chars(game, named(game, "Blade Splicer", A)[0]).keywords).not.toContain("haste");
  });
});
