/**
 * Top-5000 batch 26a. No engine change: every card is existing vocabulary.
 * These pin the clause of each that is most likely to be wired wrong — a
 * your-turn grant to commanders (Anara), control for as long as the source
 * stays (Sower), "an opponent's graveyard" as the owner's (Viridian Revel),
 * a land played from the graveyard (Titania), X read from life gained this
 * turn (Blossoming Bogbeast), "that many" counters (Necropolis Regent), the
 * attacking player's hand under a monarch-only trigger (Emberwilde Captain),
 * "that land's controller" (Zo-Zu), X targets flickered to the end step
 * (Hide on the Ceiling) and the mill-then-return (Port of Karfell).
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
const setUp = (
  hand: readonly string[] = [],
  library = "Wastes",
): { game: Game; a: ScriptedController; b: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power!, c.toughness!];
};
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

describe("top-5000 batch 26a — Anara, Wolvid Familiar", () => {
  it("gives commanders you control indestructible during your turn only", () => {
    const { game } = setUp();
    spawn(game, "Anara, Wolvid Familiar");
    const commander = spawn(game, "Grizzly Bears");
    game.state.objects[commander].isCommander = true;
    const plain = spawn(game, "Hill Giant");
    const keywords = (id: ObjectId) => computeCharacteristics(game.state, registry, id).keywords;
    expect(keywords(commander).has("indestructible")).toBe(true);
    expect(keywords(plain).has("indestructible")).toBe(false);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(keywords(commander).has("indestructible")).toBe(false);
  });
});

describe("top-5000 batch 26a — Sower of Temptation", () => {
  it("keeps the creature only while Sower stays on the battlefield", () => {
    const { game, a } = setUp();
    const theirs = spawn(game, "Grizzly Bears", B);
    a.chooseTargetsFn = () => [{ kind: "object", object: theirs }];
    const sower = game.debugSpawn("Sower of Temptation", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.objects[theirs].controller).toBe(A);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: sower }]);
    settle(game);
    expect(zone(game, sower)).toBe("graveyard");
    expect(game.state.objects[theirs].controller).toBe(B);
  });
});

describe("top-5000 batch 26a — Viridian Revel", () => {
  it("draws for an artifact put into an opponent's graveyard, not into yours", () => {
    const { game } = setUp();
    spawn(game, "Viridian Revel");
    const theirs = spawn(game, "Sol Ring", B);
    const mine = spawn(game, "Sol Ring");
    const before = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: theirs }]);
    settle(game);
    expect(game.handOf(A).length).toBe(before + 1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: mine }]);
    settle(game);
    expect(game.handOf(A).length).toBe(before + 1);
  });
});

describe("top-5000 batch 26a — Titania, Nature's Force", () => {
  it("plays a Forest from the graveyard, and its entering makes a 5/3 Elemental", () => {
    const { game } = setUp();
    spawn(game, "Titania, Nature's Force");
    const forest = game.debugSpawn("Forest", A, "graveyard");
    const island = game.debugSpawn("Island", A, "graveyard");
    const plays = (card: ObjectId): boolean =>
      game.legalActions(A).some((x) => x.kind === "play-land" && x.card === card);
    expect(plays(forest)).toBe(true);
    expect(plays(island)).toBe(false);
    game.dispatch({ type: "play-land", player: A, card: forest });
    settle(game);
    expect(zone(game, forest)).toBe("battlefield");
    expect(named(game, "5/3 Green Elemental Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 26a — Blossoming Bogbeast", () => {
  it("pumps by all the life gained this turn, the 2 included", () => {
    const { game, a } = setUp();
    const beast = spawn(game, "Blossoming Bogbeast");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 }, []);
    a.declareAttackersFn = () => [{ attacker: beast, defender: B }];
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.priority.holder === A && quiet(s));
    expect(life(game, A)).toBe(25);
    expect(pt(game, beast)).toEqual([8, 8]);
    expect(pt(game, bears)).toEqual([7, 7]);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("trample")).toBe(true);
  });
});

describe("top-5000 batch 26a — Necropolis Regent", () => {
  it("puts as many +1/+1 counters as the combat damage dealt", () => {
    const { game, a } = setUp();
    spawn(game, "Necropolis Regent");
    const giant = spawn(game, "Hill Giant");
    a.declareAttackersFn = () => [{ attacker: giant, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(17);
    expect(counters(game, giant)).toBe(3);
  });
});

describe("top-5000 batch 26a — Emberwilde Captain", () => {
  it("deals the attacking opponent damage equal to their hand while you're the monarch", () => {
    const { game, b } = setUp();
    game.debugSpawn("Emberwilde Captain", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.monarch).toBe(A);
    const bears = spawn(game, "Grizzly Bears", B);
    b.declareAttackersFn = () => [{ attacker: bears, defender: A }];
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "declare-attackers" && quiet(s));
    const hand = game.handOf(B).length;
    expect(hand).toBeGreaterThan(0);
    expect(life(game, B)).toBe(20 - hand);
  });

  it("doesn't trigger while someone else is the monarch", () => {
    const { game, b } = setUp();
    spawn(game, "Emberwilde Captain");
    game.state.monarch = B;
    const bears = spawn(game, "Grizzly Bears", B);
    b.declareAttackersFn = () => [{ attacker: bears, defender: A }];
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "declare-attackers" && quiet(s));
    expect(life(game, B)).toBe(20);
  });
});

describe("top-5000 batch 26a — Zo-Zu the Punisher", () => {
  it("deals 2 damage to the controller of whichever land entered", () => {
    const { game } = setUp();
    spawn(game, "Zo-Zu the Punisher");
    game.debugSpawn("Forest", B, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(20);
    game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, A)).toBe(18);
  });
});

describe("top-5000 batch 26a — Hide on the Ceiling", () => {
  it("exiles exactly X artifacts and/or creatures and returns them at the next end step", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const ring = spawn(game, "Sol Ring", B);
    for (let i = 0; i < 3; i += 1) spawn(game, "Island");
    const hide = game.debugSpawn("Hide on the Ceiling", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: hide,
      targets: [
        { kind: "object", object: bears },
        { kind: "object", object: ring },
      ],
      xValue: 2,
    });
    game.advanceUntil(quiet);
    expect([zone(game, bears), zone(game, ring)]).toEqual(["exile", "exile"]);
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "cleanup");
    expect([zone(game, bears), zone(game, ring)]).toEqual(["battlefield", "battlefield"]);
    expect(game.state.objects[bears].controller).toBe(B);
  });
});

describe("top-5000 batch 26a — Port of Karfell", () => {
  it("mills four, then returns one creature card tapped", () => {
    const { game } = setUp([], "Grizzly Bears");
    const effect = registry.get("Port of Karfell")!.activated[1].effect!;
    game.debugApplyEffect(A, effect, []);
    settle(game);
    const back = named(game, "Grizzly Bears");
    expect(back).toHaveLength(1);
    expect(game.state.objects[back[0]].tapped).toBe(true);
    expect(game.graveyardOf(A).length).toBe(3);
  });
});
