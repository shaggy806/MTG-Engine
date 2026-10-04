/**
 * Top-5000 batch 23g. No engine change: each test pins the clause of one
 * card most likely to be wired wrong — "except by Walls" as a
 * can't-be-blocked-by-non-Walls filter (Prowler's Helm), a noncreature-spell
 * count read off the turn's cast records (Lyse Hext), a free cast offered
 * only when cast from a graveyard (Ignite the Future), tokens attacking only
 * beside a legendary creature (Andúril), "that player controls" as the
 * damaged player (Trygon Predator), a chosen-type death trigger that sees a
 * creature dying beside it (Species Specialist), ward granted only while
 * untapped (K-9), every Faerie's shroud (Scion of Oona) and an Elf count of
 * one colour (Wirewood Channeler).
 */
import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
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
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((unit) => unit.type).sort();
const keywords = (game: Game, id: ObjectId): ReadonlySet<string> =>
  computeCharacteristics(game.state, registry, id).keywords;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power ?? 0, c.toughness ?? 0];
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
type BlockOffer = Extract<LegalAction, { kind: "declare-blockers" }>;
const blockOffer = (game: Game, player: PlayerId): BlockOffer => {
  const offer = game.legalActions(player).find((o): o is BlockOffer => o.kind === "declare-blockers");
  if (offer === undefined) throw new Error("no block offer");
  return offer;
};
const canBlock = (offer: BlockOffer, blocker: ObjectId): readonly ObjectId[] =>
  offer.eligible.find((e) => e.blocker === blocker)?.canBlock ?? [];

describe("top-5000 batch 23g — Prowler's Helm", () => {
  it("lets a Wall block the equipped creature, and nothing else", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const helm = spawn(game, "Prowler's Helm");
    game.state.objects[helm].attachedTo = bears;
    const wall = spawn(game, "Wall of Blossoms", B);
    const theirBears = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.awaiting?.kind === "blockers");
    const offer = blockOffer(game, B);
    expect(canBlock(offer, wall)).toEqual([bears]);
    expect(canBlock(offer, theirBears)).toEqual([]);
  });
});

describe("top-5000 batch 23g — Lyse Hext", () => {
  it("makes a {1} noncreature spell free, and has double strike from the second one", () => {
    const { game } = setUp(["Sol Ring", "Sol Ring"]);
    const lyse = spawn(game, "Lyse Hext");
    const first = inHand(game, "Sol Ring");
    // No lands: only the {1} reduction pays for it.
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === first)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: first, targets: [] });
    settle(game);
    expect(zone(game, first)).toBe("battlefield");
    expect(keywords(game, lyse).has("double-strike")).toBe(false);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Sol Ring"), targets: [] });
    settle(game);
    expect(keywords(game, lyse).has("double-strike")).toBe(true);
    // Prowess twice.
    expect(pt(game, lyse)).toEqual([4, 4]);
  });
});

describe("top-5000 batch 23g — Ignite the Future", () => {
  const exiledWithImpulse = (game: Game): ObjectId[] =>
    Object.values(game.state.objects)
      .filter((o) => o.zone === "exile" && o.impulse !== undefined && o.cardName === "Grizzly Bears")
      .map((o) => o.id);

  it("plays the cards for their costs cast from hand, and free once flashed back", () => {
    const { game } = setUp(["Ignite the Future"], "Grizzly Bears");
    lands(game, "Mountain", 4);
    const ignite = inHand(game, "Ignite the Future");
    game.dispatch({ type: "cast-spell", player: A, card: ignite, targets: [] });
    settle(game);
    const fromHand = exiledWithImpulse(game);
    expect(fromHand).toHaveLength(3);
    expect(fromHand.every((id) => game.state.objects[id].impulse?.free === undefined)).toBe(true);
    expect(zone(game, ignite)).toBe("graveyard");

    lands(game, "Mountain", 8);
    game.dispatch({ type: "cast-spell", player: A, card: ignite, targets: [], via: "flashback" });
    settle(game);
    const flashed = exiledWithImpulse(game).filter((id) => !fromHand.includes(id));
    expect(flashed).toHaveLength(3);
    expect(flashed.every((id) => game.state.objects[id].impulse?.free !== undefined)).toBe(true);
    expect(zone(game, ignite)).toBe("exile");
  });
});

describe("top-5000 batch 23g — Andúril, Flame of the West", () => {
  const spirits = (game: Game): ObjectId[] => named(game, "Spirit Token");

  it("makes two tapped and attacking Spirits beside a legendary creature", () => {
    const { game, a } = setUp();
    const isamaru = spawn(game, "Isamaru, Hound of Konda");
    const anduril = spawn(game, "Andúril, Flame of the West");
    game.state.objects[anduril].attachedTo = isamaru;
    expect(pt(game, isamaru)).toEqual([5, 3]);
    a.declareAttackersFn = () => [{ attacker: isamaru, defender: B }];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "declare-blockers");
    const made = spirits(game);
    expect(made.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(2);
    expect(made.every((id) => game.state.objects[id].tapped && game.state.objects[id].attacking)).toBe(true);
  });

  it("makes them only tapped beside a creature that isn't legendary", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const anduril = spawn(game, "Andúril, Flame of the West");
    game.state.objects[anduril].attachedTo = bears;
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "declare-blockers");
    const made = spirits(game);
    expect(made.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(2);
    expect(made.every((id) => game.state.objects[id].tapped && !game.state.objects[id].attacking)).toBe(true);
  });
});

describe("top-5000 batch 23g — Trygon Predator", () => {
  it("destroys an artifact the damaged player controls", () => {
    const { game, a } = setUp();
    const trygon = spawn(game, "Trygon Predator");
    const mine = spawn(game, "Sol Ring");
    const theirs = spawn(game, "Sol Ring", B);
    a.declareAttackersFn = () => [{ attacker: trygon, defender: B }];
    a.chooseTargetsFn = () => [{ kind: "object", object: theirs }];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main");
    settle(game);
    expect(game.state.players[B].life).toBe(18);
    expect(zone(game, theirs)).toBe("graveyard");
    expect(zone(game, mine)).toBe("battlefield");
  });
});

describe("top-5000 batch 23g — Species Specialist", () => {
  it("draws for a creature of the chosen type, not another", () => {
    const { game } = setUp();
    const specialist = spawn(game, "Species Specialist");
    game.state.objects[specialist].chosenCreatureType = "Bear";
    const bears = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", B);
    const before = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: giant }]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(before);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(before + 1);
  });

  it("sees a creature of the chosen type die at the same time as it", () => {
    const { game } = setUp();
    const specialist = spawn(game, "Species Specialist");
    game.state.objects[specialist].chosenCreatureType = "Bear";
    spawn(game, "Grizzly Bears", B);
    const before = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy-all", filter: { type: "creature" } }, []);
    settle(game);
    expect(zone(game, specialist)).toBe("graveyard");
    expect(game.handOf(A)).toHaveLength(before + 1);
  });
});

describe("top-5000 batch 23g — K-9, Mark I", () => {
  it("gives other legendary creatures ward {1} only while it's untapped", () => {
    const { game } = setUp(["Lightning Bolt", "Lightning Bolt"]);
    const k9 = spawn(game, "K-9, Mark I", B);
    const isamaru = spawn(game, "Isamaru, Hound of Konda", B);
    lands(game, "Mountain", 1);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Lightning Bolt"),
      targets: [{ kind: "object", object: isamaru }],
    });
    settle(game);
    // No mana left for the ward: the Bolt is countered.
    expect(zone(game, isamaru)).toBe("battlefield");
    expect(game.eventsOfType("spell-countered").length).toBe(1);

    game.state.objects[k9].tapped = true;
    lands(game, "Mountain", 1);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Lightning Bolt"),
      targets: [{ kind: "object", object: isamaru }],
    });
    settle(game);
    expect(zone(game, isamaru)).toBe("graveyard");
  });
});

describe("top-5000 batch 23g — Scion of Oona", () => {
  it("pumps and shrouds the other Faeries you control, not itself or an opponent's", () => {
    const { game } = setUp();
    const scion = spawn(game, "Scion of Oona");
    const faerie = spawn(game, "Bitterbloom Bearer");
    const theirs = spawn(game, "Bitterbloom Bearer", B);
    expect(pt(game, faerie)).toEqual([2, 2]);
    expect(keywords(game, faerie).has("shroud")).toBe(true);
    expect(pt(game, scion)).toEqual([1, 1]);
    expect(keywords(game, scion).has("shroud")).toBe(false);
    expect(pt(game, theirs)).toEqual([1, 1]);
    expect(keywords(game, theirs).has("shroud")).toBe(false);
  });
});

describe("top-5000 batch 23g — Wirewood Channeler", () => {
  it("adds one colour, as much as there are Elves on the battlefield", () => {
    const { game } = setUp();
    const channeler = spawn(game, "Wirewood Channeler");
    spawn(game, "Llanowar Elves");
    spawn(game, "Llanowar Elves", B);
    spawn(game, "Grizzly Bears");
    game.dispatch({ type: "activate-ability", player: A, source: channeler, abilityIndex: 0, manaColors: ["U"] });
    expect(pool(game)).toEqual(["U", "U", "U"]);
  });
});
