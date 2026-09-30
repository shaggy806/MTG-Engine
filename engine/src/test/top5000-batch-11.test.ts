/**
 * Top-5000 batch 11 (ranks 1723–1801). No new engine vocabulary: each card
 * reuses what's there, so these tests pin the clauses most likely to be
 * wired wrong — an overlapping anthem (Death Baron), a target filter read
 * off the source's power (Alesha), a copy's exceptions and its end-step
 * sacrifice (Molten Duplication), control passed to a target (Humble
 * Defector), a death copy that skips tokens (Vaultborn Tyrant), an amount
 * of cards drawn this turn less one (Proft's Eidetic Memory).
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

/** A player who says yes to every "you may" and finds a card when searching. */
const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
let alice = new ScriptedController(A);
const setUp = (hand: readonly string[] = [], library = "Wastes"): Game => {
  alice = yes(new ScriptedController(A));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: alice, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
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
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power, c.toughness];
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
const destroy = (game: Game, id: ObjectId): void => {
  game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: id }]);
  settle(game);
};

describe("top-5000 batch 11 — Death Baron", () => {
  it("pumps Skeletons and other Zombies once each, never itself", () => {
    const game = setUp();
    const baron = spawn(game, "Death Baron");
    const zombie = spawn(game, "Binding Mummy");
    const theirs = spawn(game, "Binding Mummy", B);
    expect(pt(game, baron)).toEqual([2, 2]);
    expect(pt(game, zombie)).toEqual([3, 3]);
    expect(pt(game, theirs)).toEqual([2, 2]);
    expect([...computeCharacteristics(game.state, registry, zombie).keywords]).toContain("deathtouch");
  });
});

describe("top-5000 batch 11 — Alesha, Who Laughs at Fate", () => {
  it("can target only creature cards with mana value up to her power", () => {
    const game = setUp();
    const alesha = spawn(game, "Alesha, Who Laughs at Fate");
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    // She attacks (a counter: 3 power), then the raid trigger at the end step
    // may return the 3-drop but not the 4-drop.
    const hound = game.debugSpawn("Hill Giant", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    alice.declareAttackersFn = () => [{ attacker: alesha, defender: B }];
    game.advanceUntil((s) => s.turn.step === "end");
    settle(game);
    expect(counters(game, alesha)).toBe(1);
    // The 4-drops sit first in the graveyard: only the filter keeps them out.
    expect(zone(game, bears)).toBe("battlefield");
    expect(zone(game, giant)).toBe("graveyard");
    expect(zone(game, hound)).toBe("graveyard");
  });
});

describe("top-5000 batch 11 — Molten Duplication", () => {
  it("makes an artifact copy with haste, sacrificed at the next end step", () => {
    const game = setUp(["Molten Duplication"], "Mountain");
    lands(game, "Mountain", 2);
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Molten Duplication"),
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    const copies = named(game, "Grizzly Bears").filter((id) => id !== bears);
    expect(copies).toHaveLength(1);
    const c = computeCharacteristics(game.state, registry, copies[0]);
    expect(c.types).toContain("artifact");
    expect([...c.keywords]).toContain("haste");
    game.advanceUntil((s) => s.turn.number === 2);
    expect(named(game, "Grizzly Bears")).toEqual([bears]);
  });
});

describe("top-5000 batch 11 — Humble Defector", () => {
  it("draws two and hands itself to the targeted opponent, only on its controller's turn", () => {
    const game = setUp();
    const defector = spawn(game, "Humble Defector");
    const hand = game.handOf(A).length;
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: defector,
      abilityIndex: 0,
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    expect(game.handOf(A).length).toBe(hand + 2);
    expect(game.state.objects[defector].controller).toBe(B);
    game.state.objects[defector].tapped = false;
    expect(
      game.legalActions(B).some((x) => x.kind === "activate-ability" && x.source === defector),
    ).toBe(false);
  });
});

describe("top-5000 batch 11 — Vaultborn Tyrant", () => {
  it("returns as an artifact token copy when it dies, and the token doesn't do it again", () => {
    const game = setUp();
    const tyrant = spawn(game, "Vaultborn Tyrant");
    destroy(game, tyrant);
    const copies = named(game, "Vaultborn Tyrant");
    expect(copies).toHaveLength(1);
    expect(game.state.objects[copies[0]].isToken).toBe(true);
    expect(computeCharacteristics(game.state, registry, copies[0]).types).toContain("artifact");
    destroy(game, copies[0]);
    expect(named(game, "Vaultborn Tyrant")).toHaveLength(0);
  });
});

describe("top-5000 batch 11 — Proft's Eidetic Memory", () => {
  it("puts cards-drawn-minus-one counters on the target at combat", () => {
    const game = setUp();
    spawn(game, "Proft's Eidetic Memory");
    const bears = spawn(game, "Grizzly Bears");
    // The turn's draw, plus three more.
    game.debugApplyEffect(A, { kind: "draw", amount: 3 }, []);
    game.advanceUntil((s) => s.turn.step === "begin-combat" && (s.awaiting !== null || s.pendingTriggers.length > 0 || s.zones.shared.stack.length > 0));
    settle(game);
    expect(counters(game, bears)).toBe(3);
  });
});

describe("top-5000 batch 11 — Urabrask the Hidden", () => {
  it("makes an opponent's creature enter tapped, and gives yours haste", () => {
    const game = setUp();
    spawn(game, "Urabrask the Hidden");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield", { announceEntry: true });
    const mine = game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    expect(game.state.objects[theirs].tapped).toBe(true);
    expect(game.state.objects[mine].tapped).toBe(false);
    expect([...computeCharacteristics(game.state, registry, mine).keywords]).toContain("haste");
  });
});

describe("top-5000 batch 11 — Ilysian Caryatid", () => {
  it("makes two mana with a 4-power creature out, one without", () => {
    const game = setUp();
    const caryatid = spawn(game, "Ilysian Caryatid");
    const pool = (): number => game.state.players[A].manaPool.length;
    game.dispatch({ type: "activate-ability", player: A, source: caryatid, abilityIndex: 0 });
    settle(game);
    expect(pool()).toBe(1);
    game.state.objects[caryatid].tapped = false;
    spawn(game, "Colossal Dreadmaw");
    game.dispatch({ type: "activate-ability", player: A, source: caryatid, abilityIndex: 0 });
    settle(game);
    expect(pool()).toBe(3);
  });
});
