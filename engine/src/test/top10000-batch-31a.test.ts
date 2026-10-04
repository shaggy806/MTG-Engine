/**
 * Top-10000 batch 31a. No engine change: each test pins the clause of a card
 * most likely to be wired wrong — Kumena's "another" against its "including
 * itself", Gruff Triplets' token-copy intervening-if and its last-known
 * power, Necrogen Communion's granted toxic and return, the Shrines' X, a
 * granted "third card each turn" trigger, amass on an Army attacking.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
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
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
/** How many permanents `ids` stand for — a token stack counts every token. */
const howMany = (game: Game, ids: readonly ObjectId[]): number =>
  ids.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((unit) => unit.type).sort();
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
const canActivate = (game: Game, source: ObjectId, abilityIndex: number): boolean =>
  game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === source && x.abilityIndex === abilityIndex);
/** On to A's next precombat main phase (turn 3), its triggers left waiting. */
const toNextMain = (game: Game): void => {
  game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
};

describe("top-10000 batch 31a — Kumena, Tyrant of Orazca", () => {
  it("needs another Merfolk to go unblockable, but taps itself toward five", () => {
    const { game } = setUp();
    const kumena = spawn(game, "Kumena, Tyrant of Orazca");
    expect(canActivate(game, kumena, 0)).toBe(false);
    const coral = spawn(game, "Coral Merfolk");
    expect(canActivate(game, kumena, 0)).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: kumena, abilityIndex: 0, tap: [coral] });
    settle(game);
    expect(computeCharacteristics(game.state, registry, kumena).keywords.has("unblockable")).toBe(true);

    const more = lands(game, "Coral Merfolk", 4);
    const theirs = spawn(game, "Coral Merfolk", B);
    // Four untapped others plus Kumena itself make five.
    game.dispatch({ type: "activate-ability", player: A, source: kumena, abilityIndex: 2, tap: [kumena, ...more] });
    settle(game);
    for (const id of [kumena, coral, ...more]) expect(counters(game, id)).toBe(1);
    expect(counters(game, theirs)).toBe(0);
  });
});

describe("top-10000 batch 31a — Gruff Triplets", () => {
  it("makes two token copies that don't copy again, and a dying one grows the rest by its power", () => {
    const { game } = setUp();
    const original = game.debugSpawn("Gruff Triplets", A, "battlefield", { announceEntry: true });
    settle(game);
    const tokens = named(game, "Gruff Triplets").filter((id) => game.state.objects[id].isToken);
    expect(howMany(game, tokens)).toBe(2);
    expect(howMany(game, named(game, "Gruff Triplets"))).toBe(3);
    // A pumped original dies: its last power (5) goes on each token.
    game.debugApplyEffect(A, { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" }, [
      { kind: "object", object: original },
    ]);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: original }]);
    settle(game);
    expect(zone(game, original)).toBe("graveyard");
    const left = named(game, "Gruff Triplets");
    expect(howMany(game, left)).toBe(2);
    for (const id of left) expect(counters(game, id)).toBe(5);
  });
});

describe("top-10000 batch 31a — Necrogen Communion", () => {
  it("gives toxic 2, and returns the creature card when it dies", () => {
    const { game } = setUp(["Necrogen Communion"], "Swamp");
    lands(game, "Swamp", 2);
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Necrogen Communion"),
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    const aura = named(game, "Necrogen Communion")[0];
    expect(game.state.objects[aura].attachedTo).toBe(bears);
    expect(computeCharacteristics(game.state, registry, bears).toxic).toBe(2);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    const back = named(game, "Grizzly Bears");
    expect(back).toHaveLength(1);
    expect(game.state.objects[back[0]].controller).toBe(A);
    expect(computeCharacteristics(game.state, registry, back[0]).toxic).toBe(0);
  });
});

describe("top-10000 batch 31a — Sanctum of Fruitful Harvest", () => {
  it("adds X mana of one colour at the first main phase, X counting every Shrine", () => {
    const { game } = setUp();
    spawn(game, "Sanctum of Fruitful Harvest");
    spawn(game, "Sanctum of Stone Fangs");
    toNextMain(game);
    settle(game);
    expect(pool(game)).toEqual(["W", "W"]);
  });
});

describe("top-10000 batch 31a — Sanctum of Calm Waters", () => {
  it("draws X then discards one, if you choose to", () => {
    const { game } = setUp();
    spawn(game, "Sanctum of Calm Waters");
    spawn(game, "Sanctum of Stone Fangs");
    const hand = game.handOf(A).length;
    const graveyard = game.state.zones.perPlayer[A].graveyard.length;
    toNextMain(game);
    settle(game);
    // The draw step's card, two drawn, one discarded.
    expect(game.handOf(A).length).toBe(hand + 2);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(graveyard + 1);
  });
});

describe("top-10000 batch 31a — Astrologian's Planisphere", () => {
  it("makes a Wizard Hero wearing it, which grows on the third card drawn this turn only", () => {
    const { game } = setUp();
    const planisphere = game.debugSpawn("Astrologian's Planisphere", A, "battlefield", { announceEntry: true });
    settle(game);
    const hero = named(game, "Hero Token (Black Mage's Rod)");
    expect(hero).toHaveLength(1);
    expect(game.state.objects[planisphere].attachedTo).toBe(hero[0]);
    expect(computeCharacteristics(game.state, registry, hero[0]).subtypes).toContain("Wizard");
    // Wherever the turn's draws stood, the third falls within five more.
    for (let i = 0; i < 5; i += 1) {
      game.debugApplyEffect(A, { kind: "draw", amount: 1 });
      settle(game);
    }
    expect(counters(game, hero[0])).toBe(1);
  });
});

describe("top-10000 batch 31a — March from the Black Gate", () => {
  it("amasses Orcs as it enters and again when the Army attacks", () => {
    const { game, a } = setUp();
    game.debugSpawn("March from the Black Gate", A, "battlefield", { announceEntry: true });
    settle(game);
    const army = named(game, "Army Token");
    expect(army).toHaveLength(1);
    expect(counters(game, army[0])).toBe(1);
    expect(computeCharacteristics(game.state, registry, army[0]).subtypes).toContain("Orc");
    game.state.objects[army[0]].summoningSick = false;
    a.declareAttackersFn = () => [{ attacker: army[0], defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(counters(game, army[0])).toBe(2);
    expect(life(game, B)).toBe(18);
  });
});

describe("top-10000 batch 31a — Fervent Charge", () => {
  it("pumps each attacking creature of yours by +2/+2", () => {
    const { game, a } = setUp();
    spawn(game, "Fervent Charge");
    const bears = spawn(game, "Grizzly Bears");
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(16);
  });
});

describe("top-10000 batch 31a — Rile", () => {
  it("deals 1 to your creature, gives it trample, and draws", () => {
    const { game } = setUp();
    const giant = spawn(game, "Hill Giant");
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, effectOf("Rile"), [{ kind: "object", object: giant }]);
    settle(game);
    expect(game.state.objects[giant].damageMarked).toBe(1);
    expect(computeCharacteristics(game.state, registry, giant).keywords.has("trample")).toBe(true);
    expect(game.handOf(A).length).toBe(hand + 1);
  });
});

describe("top-10000 batch 31a — Combat Tutorial", () => {
  it("has the target player draw two and counters your creature", () => {
    const { game } = setUp(["Combat Tutorial"], "Island");
    lands(game, "Island", 3);
    const bears = spawn(game, "Grizzly Bears");
    const theirHand = game.handOf(B).length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Combat Tutorial"),
      targets: [
        { kind: "player", player: B },
        { kind: "object", object: bears },
      ],
    });
    settle(game);
    expect(game.handOf(B).length).toBe(theirHand + 2);
    expect(counters(game, bears)).toBe(1);
  });
});

describe("top-10000 batch 31a — Macabre Waltz", () => {
  it("returns the creature card chosen, then discards", () => {
    const { game, a } = setUp(["Macabre Waltz"], "Swamp");
    lands(game, "Swamp", 2);
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    a.chooseDiscardsFn = (hand, count) =>
      hand.filter((o) => o.cardName === "Swamp").slice(0, count).map((o) => o.id);
    const handBefore = game.handOf(A).length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Macabre Waltz"),
      targets: [{ kind: "object", object: bears }, null],
    });
    settle(game);
    expect(zone(game, bears)).toBe("hand");
    // Waltz left the hand, the Bears came in, a Swamp went out.
    expect(game.handOf(A).length).toBe(handBefore - 1);
    expect(
      game.state.zones.perPlayer[A].graveyard.filter((id) => game.state.objects[id].cardName === "Swamp"),
    ).toHaveLength(1);
  });
});
