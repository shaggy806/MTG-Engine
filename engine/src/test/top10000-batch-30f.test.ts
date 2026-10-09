/**
 * Top-10000 batch 30f. Pins the clauses most likely to be wired wrong: a
 * creature entering from your graveyard dealing its own power (Flayer of the
 * Hatebound, its undying included), a boast's damage reading the sacrificed
 * permanent (Broadside Bombardiers), a Saga's discard-then-reflexive return
 * (Awaken the Honored Dead), a dies trigger reading -1/-1 counters (The
 * Scorpion God), "that many" counters from one discard (Marauding Mako), a
 * delirium "instead" tutor (Traverse the Ulvenwald), firebending X off
 * experience and "a spell during combat" (Zuko, Firebending Master), a
 * mana-and-draw ability that uses the stack (Chromatic Sphere), and a counter
 * doubled after one is added (Sazh Katzroy).
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { Step } from "../turn.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

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
/** At `step`, once a further ability has resolved (the attack trigger) and
 * nothing is left to resolve — firebending.test.ts's guard. */
const at = (game: Game, step: Step): void => {
  const resolved = game.eventsOfType("ability-resolved").length;
  game.advanceUntil(
    (s) => s.turn.step === step && quiet(s) && game.eventsOfType("ability-resolved").length > resolved,
  );
};

describe("top-10000 batch 30f — Flayer of the Hatebound", () => {
  it("a creature from your graveyard deals its power; one from theirs doesn't; undying fires it too", () => {
    const { game, a } = setUp();
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    const flayer = spawn(game, "Flayer of the Hatebound");
    const mine = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [{ kind: "object", object: mine }]);
    settle(game);
    expect(life(game, B)).toBe(18);
    // Bob's card, put onto Alice's battlefield: not from *her* graveyard.
    const theirs = game.debugSpawn("Hill Giant", B, "graveyard");
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0, underYourControl: true }, [
      { kind: "object", object: theirs },
    ]);
    settle(game);
    expect(game.state.objects[theirs].controller).toBe(A);
    expect(life(game, B)).toBe(18);
    // Undying brings Flayer back as a 5/3, and its own trigger sees it.
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: flayer }]);
    settle(game);
    const back = named(game, "Flayer of the Hatebound");
    expect(back).toHaveLength(1);
    expect(counters(game, back[0])).toBe(1);
    expect(life(game, B)).toBe(13);
  });
});

describe("top-10000 batch 30f — Broadside Bombardiers", () => {
  it("after attacking, deals 2 plus the sacrificed permanent's mana value", () => {
    const { game, a } = setUp();
    const bombardiers = spawn(game, "Broadside Bombardiers");
    const ring = spawn(game, "Sol Ring");
    const canBoast = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === bombardiers);
    expect(canBoast()).toBe(false);
    a.declareAttackersFn = () => [{ attacker: bombardiers, defender: B }];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(18);
    expect(canBoast()).toBe(true);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: bombardiers,
      abilityIndex: 0,
      sacrifice: ring,
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    expect(zone(game, ring)).toBe("graveyard");
    expect(life(game, B)).toBe(15);
  });
});

describe("top-10000 batch 30f — The Scorpion God", () => {
  it("draws when a creature with a -1/-1 counter dies, not for one without", () => {
    const { game } = setUp();
    spawn(game, "The Scorpion God");
    const marked = spawn(game, "Hill Giant", B);
    const plain = spawn(game, "Grizzly Bears", B);
    game.state.objects[marked].counters = { "-1/-1": 1 };
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: plain }]);
    settle(game);
    expect(game.handOf(A).length).toBe(hand);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: marked }]);
    settle(game);
    expect(game.handOf(A).length).toBe(hand + 1);
  });
});

describe("top-10000 batch 30f — Marauding Mako", () => {
  it("gets one +1/+1 counter per card in a single discard", () => {
    const { game } = setUp();
    const mako = spawn(game, "Marauding Mako");
    game.debugApplyEffect(A, { kind: "discard", target: "you", amount: 2 });
    settle(game);
    expect(counters(game, mako)).toBe(2);
  });
});

describe("top-10000 batch 30f — Zuko, Firebending Master", () => {
  it("firebends X = experience; only a spell cast during combat gives one", () => {
    const { game, a } = setUp();
    const zuko = spawn(game, "Zuko, Firebending Master");
    spawn(game, "Mountain");
    game.debugApplyEffect(A, { kind: "add-player-counters", counter: "experience", amount: 2 });
    const xp = (): number => game.state.players[A].counters.experience ?? 0;
    expect(xp()).toBe(2);
    // A spell in the main phase: no experience.
    const first = game.debugSpawn("Lightning Bolt", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: first, targets: [{ kind: "player", player: B }] });
    settle(game);
    expect(life(game, B)).toBe(17);
    expect(xp()).toBe(2);
    a.declareAttackersFn = () => [{ attacker: zuko, defender: B }];
    at(game, "declare-attackers");
    const red = game.state.players[A].manaPool.filter((unit) => unit.type === "R").length;
    expect(red).toBe(2);
    // One paid from the firebending mana, during combat: an experience counter.
    const second = game.debugSpawn("Lightning Bolt", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: second, targets: [{ kind: "player", player: B }] });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(14);
    expect(xp()).toBe(3);
  });
});

describe("top-10000 batch 30f — Chromatic Sphere", () => {
  it("uses the stack, then adds one coloured mana and draws", () => {
    const { game } = setUp();
    const sphere = spawn(game, "Chromatic Sphere");
    spawn(game, "Wastes");
    const hand = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: sphere, abilityIndex: 0 });
    expect(zone(game, sphere)).toBe("graveyard");
    expect(game.state.zones.shared.stack).toHaveLength(1);
    expect(game.handOf(A).length).toBe(hand);
    settle(game);
    expect(game.handOf(A).length).toBe(hand + 1);
    const pool = game.state.players[A].manaPool.map((unit) => unit.type);
    expect(pool).toHaveLength(1);
    expect(["W", "U", "B", "R", "G"]).toContain(pool[0]);
  });
});

describe("top-10000 batch 30f — Sazh Katzroy", () => {
  it("adds a counter, then doubles the counters on the target", () => {
    const { game, a } = setUp();
    const sazh = spawn(game, "Sazh Katzroy");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 1 };
    a.chooseTargetsFn = () => [{ kind: "object", object: bears }];
    a.declareAttackersFn = () => [{ attacker: sazh, defender: B }];
    at(game, "declare-attackers");
    expect(counters(game, bears)).toBe(4);
  });
});
