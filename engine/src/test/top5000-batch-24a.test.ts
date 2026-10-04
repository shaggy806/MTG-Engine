/**
 * Top-5000 batch 24a. No engine change: each test pins the clause of one
 * card most likely to be wired wrong — an Aura's bonus gated on its host's
 * colour (Steel of the Godhead), "as long as it attacked this turn" and a
 * proliferate twice (Agent Frank Horrigan), a counter on the creature that
 * entered (Good-Fortune Unicorn), "first … each turn" on both a cost and an
 * opponent's cast (Shadow in the Warp), an intervening-if transform and the
 * back face's mana (Storm the Vault), a threaten ability (Captivating Crew),
 * a check-land replacement (Cori Mountain Monastery), "exile it" off a death
 * (Patron of the Vein), energy for any permanent to a graveyard, a token too
 * (Aetherworks Marvel), and a reanimation with counters and last-known power
 * (Rakdos Joins Up).
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

const setUp = (
  hand: readonly string[] = [],
  library = "Wastes",
  bHand: readonly string[] = [],
): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: [...bHand, ...Array<string>(40).fill("Wastes")] },
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
const keywords = (game: Game, id: ObjectId): ReadonlySet<string> =>
  computeCharacteristics(game.state, registry, id).keywords;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power ?? 0, c.toughness ?? 0];
};

describe("top-5000 batch 24a — Steel of the Godhead", () => {
  it("gives a white creature +1/+1 and lifelink, and a blue one +1/+1 and can't be blocked", () => {
    const { game } = setUp(["Steel of the Godhead", "Steel of the Godhead"], "Plains");
    lands(game, "Plains", 6);
    const lions = spawn(game, "Savannah Lions");
    const merfolk = spawn(game, "Coral Merfolk");
    const [first, second] = game.handOf(A).filter((id) => game.state.objects[id].cardName === "Steel of the Godhead");
    game.dispatch({ type: "cast-spell", player: A, card: first, targets: [{ kind: "object", object: lions }] });
    settle(game);
    game.dispatch({ type: "cast-spell", player: A, card: second, targets: [{ kind: "object", object: merfolk }] });
    settle(game);
    expect(game.state.objects[first].attachedTo).toBe(lions);
    expect(game.state.objects[second].attachedTo).toBe(merfolk);
    expect(pt(game, lions)).toEqual([3, 2]);
    expect(keywords(game, lions).has("lifelink")).toBe(true);
    expect(keywords(game, lions).has("unblockable")).toBe(false);
    expect(pt(game, merfolk)).toEqual([3, 2]);
    expect(keywords(game, merfolk).has("unblockable")).toBe(true);
    expect(keywords(game, merfolk).has("lifelink")).toBe(false);
  });
});

describe("top-5000 batch 24a — Agent Frank Horrigan", () => {
  it("proliferates twice as it enters, and is indestructible only once it has attacked", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 1 };
    const frank = game.debugSpawn("Agent Frank Horrigan", A, "battlefield", { announceEntry: true });
    for (let i = 0; i < 2; i += 1) {
      game.advanceUntil((s) => s.awaiting !== null || quiet(s));
      expect(game.state.awaiting?.kind).toBe("proliferate");
      game.dispatch({ type: "proliferate", player: A, chosen: [{ kind: "object", object: bears }] });
    }
    game.advanceUntil(quiet);
    expect(counters(game, bears)).toBe(3);
    expect(keywords(game, frank).has("indestructible")).toBe(false);
    game.state.objects[frank].attackedThisTurn = true;
    expect(keywords(game, frank).has("indestructible")).toBe(true);
  });
});

describe("top-5000 batch 24a — Good-Fortune Unicorn", () => {
  it("puts a +1/+1 counter on another creature that enters under your control", () => {
    const { game } = setUp();
    const unicorn = spawn(game, "Good-Fortune Unicorn");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, bears)).toBe(1);
    expect(counters(game, unicorn)).toBe(0);
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, theirs)).toBe(0);
  });
});

describe("top-5000 batch 24a — Shadow in the Warp", () => {
  it("takes {2} off only the first creature spell you cast each turn", () => {
    const { game } = setUp(["Hill Giant", "Hill Giant"], "Mountain");
    spawn(game, "Shadow in the Warp");
    lands(game, "Mountain", 4);
    const [first, second] = game.handOf(A).filter((id) => game.state.objects[id].cardName === "Hill Giant");
    game.dispatch({ type: "cast-spell", player: A, card: first, targets: [] });
    settle(game);
    expect(zone(game, first)).toBe("battlefield");
    // Two Mountains left: the second Giant costs its full {3}{R}.
    const castable = game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === second);
    expect(castable).toBe(false);
  });

  it("deals 2 damage to an opponent for their first noncreature spell of the turn only", () => {
    const { game } = setUp([], "Wastes", ["Ornithopter", "Sol Ring", "Sol Ring"]);
    spawn(game, "Shadow in the Warp");
    lands(game, "Wastes", 2, B);
    game.advanceUntil(
      (s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B && quiet(s),
    );
    const [ring1, ring2] = game.handOf(B).filter((id) => game.state.objects[id].cardName === "Sol Ring");
    game.dispatch({ type: "cast-spell", player: B, card: inHand(game, "Ornithopter", B), targets: [] });
    settle(game);
    expect(life(game, B)).toBe(20);
    game.dispatch({ type: "cast-spell", player: B, card: ring1, targets: [] });
    settle(game);
    expect(life(game, B)).toBe(18);
    game.dispatch({ type: "cast-spell", player: B, card: ring2, targets: [] });
    settle(game);
    expect(life(game, B)).toBe(18);
  });
});

describe("top-5000 batch 24a — Storm the Vault", () => {
  it("transforms at your end step with five artifacts, and the Vault taps for {U} per artifact", () => {
    const { game } = setUp();
    const vault = spawn(game, "Storm the Vault");
    lands(game, "Sol Ring", 5);
    game.advanceUntil((s) => s.turn.step === "end" && quiet(s) && s.priority.holder === A);
    expect(game.state.objects[vault].face).toBe(1);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    game.dispatch({ type: "activate-ability", player: A, source: vault, abilityIndex: 1 });
    expect(game.state.players[A].manaPool.filter((unit) => unit.type === "U")).toHaveLength(5);
  });

  it("doesn't transform with four artifacts", () => {
    const { game } = setUp();
    const vault = spawn(game, "Storm the Vault");
    lands(game, "Sol Ring", 4);
    game.advanceUntil((s) => s.turn.step === "cleanup" || s.turn.number > 1);
    expect(game.state.objects[vault].face ?? 0).toBe(0);
  });
});

describe("top-5000 batch 24a — Captivating Crew", () => {
  it("takes an opponent's tapped creature until end of turn, untapped and hasty", () => {
    const { game } = setUp([], "Mountain");
    lands(game, "Mountain", 4);
    const crew = spawn(game, "Captivating Crew");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield", { tapped: true });
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: crew,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    expect(game.state.objects[bears].controller).toBe(A);
    expect(game.state.objects[bears].tapped).toBe(false);
    expect(keywords(game, bears).has("haste")).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[bears].controller).toBe(B);
  });
});

describe("top-5000 batch 24a — Cori Mountain Monastery", () => {
  it("enters tapped unless you control a Plains or an Island", () => {
    const { game } = setUp();
    const first = spawn(game, "Cori Mountain Monastery");
    expect(game.state.objects[first].tapped).toBe(true);
    spawn(game, "Island");
    const second = spawn(game, "Cori Mountain Monastery");
    expect(game.state.objects[second].tapped).toBe(false);
  });
});

describe("top-5000 batch 24a — Patron of the Vein", () => {
  it("exiles an opponent's creature that dies and grows each Vampire you control", () => {
    const { game } = setUp();
    const patron = spawn(game, "Patron of the Vein");
    const bears = spawn(game, "Grizzly Bears", B);
    const mine = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(zone(game, bears)).toBe("exile");
    expect(counters(game, patron)).toBe(1);
    expect(counters(game, mine)).toBe(0);
    // A creature of yours dying doesn't trigger it.
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: mine }]);
    settle(game);
    expect(zone(game, mine)).toBe("graveyard");
    expect(counters(game, patron)).toBe(1);
  });
});

describe("top-5000 batch 24a — Aetherworks Marvel", () => {
  it("gets {E} for any permanent you control put into a graveyard, a token included", () => {
    const { game } = setUp();
    spawn(game, "Aetherworks Marvel");
    const ring = spawn(game, "Sol Ring");
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 }, []);
    settle(game);
    const treasure = game.battlefield.find((id) => game.state.objects[id].cardName === "Treasure Token")!;
    const theirs = spawn(game, "Sol Ring", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: ring }]);
    settle(game);
    expect(game.state.players[A].energy).toBe(1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: treasure }]);
    settle(game);
    expect(game.state.players[A].energy).toBe(2);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: theirs }]);
    settle(game);
    expect(game.state.players[A].energy).toBe(2);
  });
});

describe("top-5000 batch 24a — Rakdos Joins Up", () => {
  it("returns a creature card with two +1/+1 counters, and burns for a legend's last-known power", () => {
    const { game } = setUp();
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    game.debugSpawn("Rakdos Joins Up", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, giant)).toBe("battlefield");
    expect(counters(game, giant)).toBe(2);
    const isamaru = spawn(game, "Isamaru, Hound of Konda");
    game.state.objects[isamaru].counters = { "+1/+1": 2 };
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: isamaru }]);
    settle(game);
    expect(life(game, B)).toBe(16);
    // A nonlegendary creature dying deals nothing.
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: giant }]);
    settle(game);
    expect(life(game, B)).toBe(16);
  });
});
