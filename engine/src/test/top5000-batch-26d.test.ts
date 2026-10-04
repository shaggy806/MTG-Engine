/**
 * Top-5000 batch 26d. No engine change: each test pins the clause of one
 * card most likely to be wired wrong — an outlaw-excluding target (Shoot the
 * Sheriff), "if you do" over two discards (Thrilling Discovery), a second
 * spell each turn (Alphinaud Leveilleur), a granted targeted ability that
 * lasts the turn (Retraction Helix), statics that hold only on your turn and
 * a finality-counter return (Yuna), a counter-gated draw and self-sacrifice
 * (Dawn of a New Age), morbid counters feeding a mana ability (Séance Board),
 * opponents' artifacts entering tapped and an {X}{X} wipe (Dauntless
 * Dismantler), and an attack trigger's pump (Oliphaunt).
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
const castable = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);

describe("top-5000 batch 26d — Shoot the Sheriff", () => {
  it("can't target an outlaw, only a non-outlaw creature", () => {
    const { game } = setUp(["Shoot the Sheriff"]);
    lands(game, "Swamp", 2);
    const sheriff = inHand(game, "Shoot the Sheriff");
    spawn(game, "Amphin Mutineer", B); // a Salamander Pirate — an outlaw
    expect(castable(game, sheriff)).toBe(false);
    const bears = spawn(game, "Grizzly Bears", B);
    expect(castable(game, sheriff)).toBe(true);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: sheriff,
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
  });
});

describe("top-5000 batch 26d — Thrilling Discovery", () => {
  it("gains 2, then discards two to draw three", () => {
    const { game } = setUp(["Thrilling Discovery"]);
    spawn(game, "Mountain");
    spawn(game, "Plains");
    const handBefore = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Thrilling Discovery"), targets: [] });
    settle(game);
    expect(life(game, A)).toBe(22);
    // −1 cast, −2 discarded, +3 drawn.
    expect(game.handOf(A)).toHaveLength(handBefore);
    expect(game.state.zones.perPlayer[A].graveyard).toHaveLength(3);
  });
});

describe("top-5000 batch 26d — Alphinaud Leveilleur", () => {
  it("draws on the second spell of the turn, not the first", () => {
    const { game } = setUp(["Ornithopter", "Ornithopter", "Ornithopter"]);
    spawn(game, "Alphinaud Leveilleur");
    const start = game.handOf(A).length;
    const [first, second, third] = game.handOf(A).filter((id) => game.state.objects[id].cardName === "Ornithopter");
    game.dispatch({ type: "cast-spell", player: A, card: first, targets: [] });
    settle(game);
    expect(game.handOf(A)).toHaveLength(start - 1);
    game.dispatch({ type: "cast-spell", player: A, card: second, targets: [] });
    settle(game);
    expect(game.handOf(A)).toHaveLength(start - 1);
    game.dispatch({ type: "cast-spell", player: A, card: third, targets: [] });
    settle(game);
    expect(game.handOf(A)).toHaveLength(start - 2);
  });
});

describe("top-5000 batch 26d — Retraction Helix", () => {
  it("gives the creature a {T} bounce for the turn", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const ring = spawn(game, "Sol Ring", B);
    game.debugApplyEffect(A, effectOf("Retraction Helix"), [{ kind: "object", object: bears }]);
    settle(game);
    const offer = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === bears);
    if (offer?.kind !== "activate-ability") throw new Error("not offered");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: bears,
      abilityIndex: offer.abilityIndex,
      targets: [{ kind: "object", object: ring }],
    });
    settle(game);
    expect(zone(game, ring)).toBe("hand");
    expect(game.state.objects[bears].tapped).toBe(true);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === bears)).toBe(false);
  });
});

describe("top-5000 batch 26d — Yuna, Hope of Spira", () => {
  it("has lifelink only on your turn, and returns an enchantment with a finality counter", () => {
    const { game, a } = setUp();
    a.chooseTargetsFn = (_view, _source, _specs, legal) => legal.map((options) => options[0] ?? null);
    const yuna = spawn(game, "Yuna, Hope of Spira");
    const anthem = game.debugSpawn("Glorious Anthem", A, "graveyard");
    expect(computeCharacteristics(game.state, registry, yuna).keywords.has("lifelink")).toBe(true);
    expect(computeCharacteristics(game.state, registry, yuna).keywords.has("trample")).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(zone(game, anthem)).toBe("battlefield");
    expect(counters(game, anthem, "finality")).toBe(1);
    expect(computeCharacteristics(game.state, registry, yuna).keywords.has("lifelink")).toBe(false);
  });
});

describe("top-5000 batch 26d — Dawn of a New Age", () => {
  it("enters with a hope counter per creature and spends one each end step for a card", () => {
    const { game } = setUp();
    spawn(game, "Grizzly Bears");
    spawn(game, "Hill Giant");
    const dawn = spawn(game, "Dawn of a New Age");
    expect(counters(game, dawn, "hope")).toBe(2);
    const handBefore = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(counters(game, dawn, "hope")).toBe(1);
    expect(zone(game, dawn)).toBe("battlefield");
    expect(game.handOf(A)).toHaveLength(handBefore + 1);
    expect(life(game, A)).toBe(20);
  });

  it("removing the last counter draws, then sacrifices it and gains 4 life", () => {
    const { game } = setUp();
    spawn(game, "Grizzly Bears");
    const dawn = spawn(game, "Dawn of a New Age");
    expect(counters(game, dawn, "hope")).toBe(1);
    const handBefore = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(zone(game, dawn)).toBe("graveyard");
    expect(game.handOf(A)).toHaveLength(handBefore + 1);
    expect(life(game, A)).toBe(24);
  });
});

describe("top-5000 batch 26d — Séance Board", () => {
  it("gets a soul counter at an end step after a death, then taps for that much of one colour", () => {
    const { game } = setUp();
    const board = spawn(game, "Séance Board");
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(counters(game, board, "soul")).toBe(1);
    // Turn 2 has no death: no counter at its end step.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(counters(game, board, "soul")).toBe(1);
    game.dispatch({ type: "activate-ability", player: A, source: board, abilityIndex: 0, manaColors: ["U"] });
    expect(pool(game)).toEqual(["U"]);
  });
});

describe("top-5000 batch 26d — Dauntless Dismantler", () => {
  it("taps opponents' artifacts as they enter, and destroys each artifact with mana value X", () => {
    const { game } = setUp();
    lands(game, "Plains", 3);
    const dismantler = spawn(game, "Dauntless Dismantler");
    const theirs = spawn(game, "Sol Ring", B);
    const mine = spawn(game, "Sol Ring");
    const thopter = spawn(game, "Ornithopter");
    const stone = spawn(game, "Mind Stone", B);
    expect(game.state.objects[theirs].tapped).toBe(true);
    expect(game.state.objects[mine].tapped).toBe(false);
    game.dispatch({ type: "activate-ability", player: A, source: dismantler, abilityIndex: 0, xValue: 1 });
    settle(game);
    expect(zone(game, dismantler)).toBe("graveyard");
    expect(zone(game, theirs)).toBe("graveyard");
    expect(zone(game, mine)).toBe("graveyard");
    expect(zone(game, thopter)).toBe("battlefield");
    expect(zone(game, stone)).toBe("battlefield");
  });
});

describe("top-5000 batch 26d — Oliphaunt", () => {
  it("gives another creature you control +2/+0 and trample as it attacks", () => {
    const { game, a } = setUp();
    const oliphaunt = spawn(game, "Oliphaunt");
    const bears = spawn(game, "Grizzly Bears");
    a.declareAttackersFn = () => [{ attacker: oliphaunt, defender: B }];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    const c = computeCharacteristics(game.state, registry, bears);
    expect(c.power).toBe(4);
    expect(c.keywords.has("trample")).toBe(true);
    expect(computeCharacteristics(game.state, registry, oliphaunt).power).toBe(6);
    expect(life(game, B)).toBe(14);
  });
});
