/**
 * Top-5000 batch 20 (group g). Pins the clauses most likely to be wired
 * wrong: Throne of the God-Pharaoh counting only tapped creatures, Gleeful
 * Arsonist hitting the caster for its current power, Vat of Rebirth's oil from
 * another permanent dying, Heritage Reclamation drawing with or without its
 * optional target, Dawnsire's 10+ attack trigger while still a noncreature,
 * and Cunning Rhetoric exiling the attacking player's top card.
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

describe("top-5000 batch 20g — Throne of the God-Pharaoh", () => {
  it("drains each opponent for your tapped creatures only, at your end step", () => {
    const { game } = setUp();
    spawn(game, "Throne of the God-Pharaoh");
    const tapped = spawn(game, "Grizzly Bears");
    const tapped2 = spawn(game, "Hill Giant");
    spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    for (const id of [tapped, tapped2, theirs]) game.state.objects[id].tapped = true;
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "end");
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-5000 batch 20g — Gleeful Arsonist", () => {
  it("deals damage equal to its power to the opponent who cast a noncreature spell", () => {
    const { game } = setUp();
    const arsonist = spawn(game, "Gleeful Arsonist");
    game.state.objects[arsonist].counters = { "+1/+1": 1 };
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    lands(game, "Mountain", 1, B);
    const bolt = game.debugSpawn("Lightning Bolt", B, "hand");
    game.dispatch({ type: "cast-spell", player: B, card: bolt, targets: [{ kind: "player", player: A }] });
    settle(game);
    // Power 2 (a +1/+1 counter), not a fixed 1.
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(17);
  });
});

describe("top-5000 batch 20g — Vat of Rebirth", () => {
  it("gets an oil counter when another creature or artifact of yours dies, not an opponent's", () => {
    const { game } = setUp();
    const vat = spawn(game, "Vat of Rebirth");
    const bears = spawn(game, "Grizzly Bears");
    const rock = spawn(game, "Sol Ring");
    const theirs = spawn(game, "Grizzly Bears", B);
    for (const id of [bears, rock, theirs]) {
      game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: id }]);
      settle(game);
    }
    expect(counters(game, vat, "oil")).toBe(2);
  });
});

describe("top-5000 batch 20g — Heritage Reclamation", () => {
  const cast = (target: "none" | "card"): { game: Game; card: ObjectId; handBefore: number } => {
    const { game } = setUp();
    lands(game, "Forest", 2);
    const card = game.debugSpawn("Grizzly Bears", B, "graveyard");
    const spell = game.debugSpawn("Heritage Reclamation", A, "hand");
    const handBefore = game.handOf(A).length - 1;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: spell,
      modes: [2],
      targets: [target === "card" ? { kind: "object", object: card } : null],
    });
    settle(game);
    return { game, card, handBefore };
  };
  it("exiles the chosen graveyard card and draws", () => {
    const { game, card, handBefore } = cast("card");
    expect(zone(game, card)).toBe("exile");
    expect(game.handOf(A).length).toBe(handBefore + 1);
  });
  it("still draws with no target chosen", () => {
    const { game, card, handBefore } = cast("none");
    expect(zone(game, card)).toBe("graveyard");
    expect(game.handOf(A).length).toBe(handBefore + 1);
  });
});

describe("top-5000 batch 20g — Dawnsire, Sunstar Dreadnought", () => {
  it("at 10 counters, a noncreature whose 'whenever you attack' deals 100 damage", () => {
    const { game, a } = setUp();
    const dawnsire = spawn(game, "Dawnsire, Sunstar Dreadnought");
    game.state.objects[dawnsire].counters = { charge: 10 };
    expect(computeCharacteristics(game.state, registry, dawnsire).types).not.toContain("creature");
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    a.chooseTargetsFn = () => [{ kind: "object", object: giant }];
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: bears, defender: B }] });
    settle(game);
    expect(zone(game, giant)).toBe("graveyard");
  });
  it("below 10 counters has no attack trigger", () => {
    const { game, a } = setUp();
    const dawnsire = spawn(game, "Dawnsire, Sunstar Dreadnought");
    game.state.objects[dawnsire].counters = { charge: 9 };
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    a.chooseTargetsFn = () => [{ kind: "object", object: giant }];
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: bears, defender: B }] });
    settle(game);
    expect(zone(game, giant)).toBe("battlefield");
  });
});

describe("top-5000 batch 20g — Cunning Rhetoric", () => {
  it("exiles the top card of the attacking opponent's library", () => {
    const { game } = setUp();
    spawn(game, "Cunning Rhetoric");
    const raider = spawn(game, "Grizzly Bears", B);
    game.advanceUntil(
      (s) => s.turn.number === 2 && s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers",
    );
    const top = game.libraryOf(B)[0];
    const before = game.libraryOf(B).length;
    game.dispatch({ type: "declare-attackers", player: B, attackers: [{ attacker: raider, defender: A }] });
    settle(game);
    expect(game.libraryOf(B).length).toBe(before - 1);
    expect(zone(game, top)).toBe("exile");
    expect(game.state.objects[top].owner).toBe(B);
  });
});
