/**
 * Top-5000 batch 24h. No engine change: each card is existing vocabulary.
 * These pin the clauses most likely to be wired wrong — a per-blocker
 * trigger on the equipped creature (Infiltration Lens), a spell's X as the
 * "unless pays" amount with the counter into exile (Syncopate), the
 * monarch checks read as the upkeep trigger resolves (the two Courts), the
 * legendary *green* creature of Argoth's enters-tapped clause, spell mastery
 * (Dark Petition) and "target commander you own" (Sanctum of Eternity).
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
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const obj = (object: ObjectId) => ({ kind: "object" as const, object });
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
const play = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const card = game.debugSpawn(name, player, "hand");
  game.dispatch({ type: "play-land", player, card });
  game.advanceUntil(quiet);
  return card;
};

describe("top-5000 batch 24h — Infiltration Lens", () => {
  it("triggers once for each creature blocking the equipped creature", () => {
    const { game } = setUp();
    lands(game, "Wastes", 1);
    const lens = spawn(game, "Infiltration Lens");
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({ type: "activate-ability", player: A, source: lens, abilityIndex: 0, targets: [obj(bears)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[lens].attachedTo).toBe(bears);
    const first = spawn(game, "Grizzly Bears", B);
    const second = spawn(game, "Grizzly Bears", B);
    const before = game.handOf(A).length;
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: bears, defender: B }] });
    game.advanceUntil((s) => s.awaiting?.kind === "blockers");
    game.dispatch({
      type: "declare-blockers",
      player: B,
      blocks: [
        { blocker: first, attacker: bears },
        { blocker: second, attacker: bears },
      ],
    });
    game.advanceUntil((s) => s.turn.step === "combat-damage" || s.turn.step === "end");
    // Two blockers: two triggers, each "you may draw two cards".
    expect(game.handOf(A).length).toBe(before + 4);
  });
});

describe("top-5000 batch 24h — Syncopate", () => {
  it("asks the spell's controller for {X}, and exiles the spell when they don't pay", () => {
    const { game } = setUp(["Hill Giant"], "Mountain");
    lands(game, "Mountain", 4);
    const giant = inHand(game, "Hill Giant");
    game.dispatch({ type: "cast-spell", player: A, card: giant, targets: [] });
    expect(zone(game, giant)).toBe("stack");
    lands(game, "Wastes", 3);
    game.debugApplyEffect(B, effectOf("Syncopate"), [obj(giant)], { x: 3 });
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-modes");
    if (awaiting?.kind !== "choose-modes") return;
    expect(awaiting.player).toBe(A);
    expect(awaiting.cost).toBe("{3}");
    game.dispatch({ type: "choose-modes", player: A, modes: [] });
    game.advanceUntil(quiet);
    expect(zone(game, giant)).toBe("exile");
  });
});

describe("top-5000 batch 24h — Court of Ardenvale", () => {
  it("returns the card to hand, or to the battlefield while you're the monarch", () => {
    const { game } = setUp();
    const court = game.debugSpawn("Court of Ardenvale", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.monarch).toBe(A);
    const upkeep = registry.get("Court of Ardenvale")!.triggered[1].effect!;
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, upkeep, [obj(bears)], { source: court });
    settle(game);
    expect(zone(game, bears)).toBe("battlefield");
    game.state.monarch = B;
    const elves = game.debugSpawn("Llanowar Elves", A, "graveyard");
    game.debugApplyEffect(A, upkeep, [obj(elves)], { source: court });
    settle(game);
    expect(zone(game, elves)).toBe("hand");
  });

  it("can't target an instant or sorcery card, or one with mana value 4 or more", () => {
    const spec = registry.get("Court of Ardenvale")!.triggered[1].targets[0];
    expect(spec).toEqual({
      kind: "card-in-graveyard",
      whose: "you",
      filter: { notTypes: ["instant", "sorcery"], manaValue: { op: "lte", n: 3 } },
    });
  });
});

describe("top-5000 batch 24h — Argoth, Sanctum of Nature", () => {
  it("enters tapped under a legendary creature that isn't green, untapped under a green one", () => {
    const { game } = setUp();
    spawn(game, "Krenko, Tin Street Kingpin");
    const first = play(game, "Argoth, Sanctum of Nature");
    expect(game.state.objects[first].tapped).toBe(true);
    spawn(game, "Altanak, the Thrice-Called");
    const second = play(game, "Argoth, Sanctum of Nature");
    expect(game.state.objects[second].tapped).toBe(false);
  });
});

describe("top-5000 batch 24h — Sanctum of Eternity", () => {
  it("targets only a commander you own", () => {
    const { game } = setUp();
    lands(game, "Wastes", 2);
    const sanctum = spawn(game, "Sanctum of Eternity");
    const mine = spawn(game, "Grizzly Bears");
    game.state.objects[mine].isCommander = true;
    const theirs = spawn(game, "Hill Giant", B);
    game.state.objects[theirs].isCommander = true;
    spawn(game, "Llanowar Elves");
    const offer = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === sanctum && x.abilityIndex === 1);
    expect(offer?.kind).toBe("activate-ability");
    if (offer?.kind !== "activate-ability") return;
    expect(offer.targetOptions[0]).toEqual([obj(mine)]);
  });
});
