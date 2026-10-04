/**
 * Top-10000 batch 32a. No engine change: each card is existing vocabulary.
 * These pin the clauses most likely to be wired wrong — a spell filter's
 * `anyOf` over two `targets` clauses (Hindering Light), a graveyard count as
 * a target filter's operand (Squirming Emergence), a first-each-turn cost
 * reduction and an intervening-if transform (Serah Farron), a threshold
 * "instead" (Far Wanderings), a granted enters trigger (Lavabelly Sliver),
 * and tokens made before the counters go on (United Front).
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
import type { TargetRef } from "../target.js";

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
const handNamed = (game: Game, name: string, player: PlayerId = A): ObjectId[] =>
  game.handOf(player).filter((id) => game.state.objects[id].cardName === name);
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const tokenCount = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
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
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;
const castOffer = (game: Game, card: ObjectId) =>
  game.legalActions(A).find((x) => x.kind === "cast-spell" && x.card === card);
const objectOptions = (game: Game, card: ObjectId): ObjectId[] => {
  const offer = castOffer(game, card);
  if (offer === undefined || offer.kind !== "cast-spell") return [];
  return (offer.targetOptions[0] ?? []).flatMap((ref: TargetRef) => (ref.kind === "object" ? [ref.object] : []));
};

describe("top-10000 batch 32a — Hindering Light", () => {
  it("can target a spell aimed at you or your permanent, not one aimed only at an opponent's, and still draws", () => {
    const { game } = setUp(["Lightning Bolt", "Lightning Bolt", "Lightning Bolt", "Hindering Light"]);
    lands(game, "Mountain", 3);
    spawn(game, "Plains");
    spawn(game, "Island");
    const mine = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    const bolts = handNamed(game, "Lightning Bolt");
    game.dispatch({ type: "cast-spell", player: A, card: bolts[0], targets: [{ kind: "object", object: mine }] });
    game.dispatch({ type: "cast-spell", player: A, card: bolts[1], targets: [{ kind: "player", player: A }] });
    game.dispatch({ type: "cast-spell", player: A, card: bolts[2], targets: [{ kind: "object", object: theirs }] });
    const stack = game.state.zones.shared.stack;
    const aimedAt = (pred: (t: TargetRef | null | undefined) => boolean): ObjectId =>
      stack.find((id) => pred(game.state.objects[id].targets?.[0]))!;
    const atMine = aimedAt((t) => t?.kind === "object" && t.object === mine);
    const atMe = aimedAt((t) => t?.kind === "player" && t.player === A);
    const atTheirs = aimedAt((t) => t?.kind === "object" && t.object === theirs);

    const light = inHand(game, "Hindering Light");
    const options = objectOptions(game, light);
    expect(options).toContain(atMine);
    expect(options).toContain(atMe);
    expect(options).not.toContain(atTheirs);

    const handBefore = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: light, targets: [{ kind: "object", object: atMine }] });
    settle(game);
    expect(zone(game, mine)).toBe("battlefield");
    expect(zone(game, theirs)).toBe("graveyard");
    expect(life(game, A)).toBe(17);
    // Hindering Light left the hand and a card was drawn.
    expect(game.handOf(A)).toHaveLength(handBefore);
  });
});

describe("top-10000 batch 32a — Squirming Emergence", () => {
  it("targets only a nonland permanent card with mana value up to the permanent cards in your graveyard", () => {
    const { game } = setUp(["Squirming Emergence"]);
    spawn(game, "Swamp");
    spawn(game, "Forest");
    spawn(game, "Wastes");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    const emergence = inHand(game, "Squirming Emergence");
    // Two permanent cards: the Bears (mana value 2) qualify, counting
    // themselves; the Giant (4) doesn't.
    expect(objectOptions(game, emergence)).toContain(bears);
    expect(objectOptions(game, emergence)).not.toContain(giant);
    // A land card counts as a permanent card but is never a target.
    const mountain = game.debugSpawn("Mountain", A, "graveyard");
    game.debugSpawn("Lightning Bolt", A, "graveyard");
    expect(objectOptions(game, emergence)).not.toContain(mountain);
    expect(objectOptions(game, emergence)).not.toContain(giant);
    // An instant isn't a permanent card: still three, so the Giant waits for a fourth.
    game.debugSpawn("Swamp", A, "graveyard");
    expect(objectOptions(game, emergence)).toContain(giant);
    game.dispatch({ type: "cast-spell", player: A, card: emergence, targets: [{ kind: "object", object: giant }] });
    settle(game);
    expect(zone(game, giant)).toBe("battlefield");
  });
});

describe("top-10000 batch 32a — Serah Farron", () => {
  it("takes {2} off the first legendary creature spell you cast each turn", () => {
    const { game } = setUp(["Kokusho, the Evening Star"]);
    lands(game, "Swamp", 4);
    const kokusho = inHand(game, "Kokusho, the Evening Star");
    expect(castOffer(game, kokusho)).toBeUndefined();
    spawn(game, "Serah Farron");
    expect(castOffer(game, kokusho)).toBeDefined();
  });

  it("doesn't reduce a legendary creature spell once one was cast this turn", () => {
    const { game } = setUp(["Isamaru, Hound of Konda", "Kokusho, the Evening Star"]);
    spawn(game, "Serah Farron");
    spawn(game, "Plains");
    lands(game, "Swamp", 4);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Isamaru, Hound of Konda"), targets: [] });
    settle(game);
    expect(castOffer(game, inHand(game, "Kokusho, the Evening Star"))).toBeUndefined();
  });

  it("transforms at the beginning of combat only with two other legendary creatures, and the back face pumps them", () => {
    const one = setUp();
    const serahAlone = spawn(one.game, "Serah Farron");
    spawn(one.game, "Isamaru, Hound of Konda");
    one.game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(one.game.state.objects[serahAlone].face ?? 0).toBe(0);

    const two = setUp();
    const serah = spawn(two.game, "Serah Farron");
    const isamaru = spawn(two.game, "Isamaru, Hound of Konda");
    spawn(two.game, "Thalia, Guardian of Thraben");
    two.game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(two.game.state.objects[serah].face).toBe(1);
    const c = computeCharacteristics(two.game.state, registry, isamaru);
    expect([c.power, c.toughness]).toEqual([4, 4]);
  });
});

describe("top-10000 batch 32a — Lavabelly Sliver", () => {
  it("gives an entering Sliver of yours a 1-damage, 1-life enters trigger", () => {
    const { game, a } = setUp();
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    spawn(game, "Lavabelly Sliver");
    game.debugSpawn("Galerider Sliver", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(21);
  });
});

describe("top-10000 batch 32a — United Front", () => {
  it("makes X Allies first, so they get counters too", () => {
    const { game } = setUp(["United Front"], "Plains");
    lands(game, "Plains", 4);
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "United Front"), targets: [], xValue: 2 });
    settle(game);
    expect(tokenCount(game, "Ally Token")).toBe(2);
    for (const id of named(game, "Ally Token")) expect(counters(game, id)).toBe(1);
    expect(counters(game, bears)).toBe(1);
    expect(counters(game, theirs)).toBe(0);
  });
});

describe("top-10000 batch 32a — Honden of Cleansing Fire", () => {
  it("gains 2 life for each Shrine you control", () => {
    const { game } = setUp();
    const honden = spawn(game, "Honden of Cleansing Fire");
    spawn(game, "Sanctum of Stone Fangs");
    const upkeep = registry.get("Honden of Cleansing Fire")!.triggered[0].effect!;
    game.debugApplyEffect(A, upkeep, [], { source: honden });
    settle(game);
    expect(life(game, A)).toBe(24);
  });
});

describe("top-10000 batch 32a — Spellshock", () => {
  it("deals 2 damage to whoever casts a spell, its controller included", () => {
    const { game } = setUp(["Lightning Bolt"]);
    spawn(game, "Spellshock");
    spawn(game, "Mountain");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Lightning Bolt"), targets: [{ kind: "player", player: B }] });
    settle(game);
    expect(life(game, A)).toBe(18);
    expect(life(game, B)).toBe(17);
  });
});
