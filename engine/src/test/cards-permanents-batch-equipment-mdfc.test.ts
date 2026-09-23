/**
 * Two legendary Equipment and two spell // land modal double-faced cards,
 * each driven through a real `Game`:
 *
 * - Mithril Coat: flash, indestructible itself, an enters trigger that
 *   attaches it to a legendary creature you control (no equip cost, no sorcery
 *   timing), indestructible for the equipped creature, and Equip {3}.
 * - Blackblade Reforged: +1/+1 per land its controller controls, "Equip
 *   legendary creature {3}" (a narrowed equip) and Equip {7} for anything.
 * - Fell the Profane // Fell Mire and Witch Enchanter // Witch-Blessed
 *   Meadow: the front is a spell, the back a land that enters tapped unless
 *   you pay 3 life.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { poolCounts } from "../mana.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (aCards: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aCards, ...Array<string>(40).fill("Forest")] },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const id = game.handOf(player).find((i) => game.state.objects[i].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const lands = (game: Game, player: PlayerId, name: string, n: number): ObjectId[] =>
  Array.from({ length: n }, () => game.debugSpawn(name, player, "battlefield"));
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const destroy = (game: Game, id: ObjectId): void => {
  game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(id)]);
  game.advanceUntil(quiet);
};
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = game.characteristics(id);
  return [c.power ?? 0, c.toughness ?? 0];
};
const abilityOffer = (game: Game, player: PlayerId, source: ObjectId, index: number) =>
  game
    .legalActions(player)
    .find((x) => x.kind === "activate-ability" && x.source === source && x.abilityIndex === index);

describe("Mithril Coat", () => {
  it("flashed in on an opponent's turn, it attaches itself to your legendary creature", () => {
    const { game } = setUp(["Mithril Coat"]);
    const rograkh = game.debugSpawn("Rograkh, Son of Rohgahh", A, "battlefield");
    lands(game, A, "Forest", 3);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    // Bob (active) holds priority in his upkeep; Alice gets it after he passes.
    game.dispatch({ type: "pass-priority", player: B });
    const coat = inHand(game, "Mithril Coat");
    game.dispatch({ type: "cast-spell", player: A, card: coat });
    game.advanceUntil(quiet);

    expect(game.state.objects[coat].zone).toBe("battlefield");
    expect(game.state.objects[coat].attachedTo).toBe(rograkh);
    expect(game.characteristics(rograkh).keywords.has("indestructible")).toBe(true);
    destroy(game, rograkh);
    expect(game.state.objects[rograkh].zone).toBe("battlefield");
  });

  it("won't attach to a nonlegendary creature or an opponent's legend, and is indestructible itself", () => {
    const { game } = setUp(["Mithril Coat"]);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugSpawn("Rograkh, Son of Rohgahh", B, "battlefield");
    lands(game, A, "Forest", 3);
    const coat = inHand(game, "Mithril Coat");
    game.dispatch({ type: "cast-spell", player: A, card: coat });
    game.advanceUntil(quiet);

    expect(game.state.objects[coat].zone).toBe("battlefield");
    expect(game.state.objects[coat].attachedTo).toBeNull();
    expect(game.characteristics(bears).keywords.has("indestructible")).toBe(false);
    destroy(game, coat);
    expect(game.state.objects[coat].zone).toBe("battlefield");
    destroy(game, bears);
    expect(game.state.objects[bears].zone).toBe("graveyard");
  });

  it("Equip {3} moves it onto any creature you control", () => {
    const { game } = setUp();
    const coat = game.debugSpawn("Mithril Coat", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const forests = lands(game, A, "Forest", 3);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: coat,
      abilityIndex: 0,
      targets: [obj(bears)],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[coat].attachedTo).toBe(bears);
    expect(forests.every((id) => game.state.objects[id].tapped)).toBe(true);
    destroy(game, bears);
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });
});

describe("Blackblade Reforged", () => {
  it("Equip legendary creature {3} reaches only your legends; the bonus is one per land you control", () => {
    const { game } = setUp();
    const blade = game.debugSpawn("Blackblade Reforged", A, "battlefield");
    const rograkh = game.debugSpawn("Rograkh, Son of Rohgahh", A, "battlefield"); // 0/1
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugSpawn("Rograkh, Son of Rohgahh", B, "battlefield");
    lands(game, A, "Forest", 3);

    const offer = abilityOffer(game, A, blade, 0);
    expect(offer?.kind === "activate-ability" ? offer.targetOptions : undefined).toEqual([
      [obj(rograkh)],
    ]);
    // Only three lands: Equip {7} isn't affordable.
    expect(abilityOffer(game, A, blade, 1)).toBeUndefined();

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: blade,
      abilityIndex: 0,
      targets: [obj(rograkh)],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[blade].attachedTo).toBe(rograkh);
    expect(pt(game, rograkh)).toEqual([3, 4]);

    // Tapped or not, a land is a land; an opponent's isn't yours.
    game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Forest", B, "battlefield");
    expect(pt(game, rograkh)).toEqual([4, 5]);
  });

  it("the legendary equip refuses a nonlegendary creature; Equip {7} takes it", () => {
    const { game } = setUp();
    const blade = game.debugSpawn("Blackblade Reforged", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    lands(game, A, "Forest", 7);
    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: blade,
        abilityIndex: 0,
        targets: [obj(bears)],
      }),
    ).toThrow();

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: blade,
      abilityIndex: 1,
      targets: [obj(bears)],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[blade].attachedTo).toBe(bears);
    expect(pt(game, bears)).toEqual([9, 9]);
  });

  it("counts the Equipment controller's lands, not the equipped creature's controller's", () => {
    const { game } = setUp();
    const blade = game.debugSpawn("Blackblade Reforged", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    lands(game, A, "Forest", 3);
    lands(game, B, "Forest", 5);
    game.debugApplyEffect(A, { kind: "attach", target: 0 }, [obj(theirs)], { source: blade });
    expect(pt(game, theirs)).toEqual([5, 5]);
  });
});

describe("Fell the Profane // Fell Mire", () => {
  it("offers the instant and the land as separate plays", () => {
    const { game } = setUp(["Fell the Profane"]);
    lands(game, A, "Swamp", 4);
    const card = inHand(game, "Fell the Profane");
    // With nothing to target, only the land is playable.
    expect(
      game.legalActions(A).filter((x) => "card" in x && x.card === card).map((x) => x.kind),
    ).toEqual(["play-land"]);
    game.debugSpawn("Grizzly Bears", B, "battlefield");
    const plays = game.legalActions(A).filter((x) => "card" in x && x.card === card);
    expect(plays).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "cast-spell", cardName: "Fell the Profane", face: 0 }),
        expect.objectContaining({ kind: "play-land", cardName: "Fell Mire", face: 1 }),
      ]),
    );
  });

  it("destroys a creature or a planeswalker, and nothing else", () => {
    const { game } = setUp(["Fell the Profane"]);
    lands(game, A, "Swamp", 4);
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const chandra = game.debugSpawn("Chandra, Acolyte of Flame", B, "battlefield");
    const ring = game.debugSpawn("Sol Ring", B, "battlefield");
    const card = inHand(game, "Fell the Profane");
    const cast = game
      .legalActions(A)
      .find((x) => x.kind === "cast-spell" && x.card === card && x.face === 0);
    const options = cast?.kind === "cast-spell" ? (cast.targetOptions?.[0] ?? []) : [];
    expect(options).toEqual(expect.arrayContaining([obj(bears), obj(chandra)]));
    expect(options).not.toContainEqual(obj(ring));
    expect(options.some((t) => t.kind === "object" && game.state.objects[t.object].cardName === "Swamp")).toBe(false);

    game.dispatch({ type: "cast-spell", player: A, card, face: 0, targets: [obj(chandra)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[chandra].zone).toBe("graveyard");
    expect(game.state.objects[card].zone).toBe("graveyard");
  });

  it("Fell Mire enters untapped for 3 life, or tapped for free, and taps for {B}", () => {
    const { game, a } = setUp(["Fell the Profane"]);
    a.payLifeForUntappedFn = (_view, _source, amount) => amount === 3;
    const card = inHand(game, "Fell the Profane");
    game.dispatch({ type: "play-land", player: A, card, face: 1 });
    game.advanceUntil(quiet);
    expect(game.state.objects[card].tapped).toBe(false);
    expect(life(game, A)).toBe(17);
    game.dispatch({ type: "activate-ability", player: A, source: card, abilityIndex: 0 });
    expect(poolCounts(game.state.players[A].manaPool).B).toBe(1);

    const { game: g2 } = setUp(["Fell the Profane"]);
    const declined = inHand(g2, "Fell the Profane");
    g2.dispatch({ type: "play-land", player: A, card: declined, face: 1 });
    g2.advanceUntil(quiet);
    expect(g2.state.objects[declined].tapped).toBe(true);
    expect(life(g2, A)).toBe(20);
  });

  it("at 2 life there's no offer to pay 3, and it enters tapped", () => {
    const { game, a } = setUp(["Fell the Profane"]);
    game.state.players[A].life = 2;
    let asked = false;
    a.payLifeForUntappedFn = () => {
      asked = true;
      return true;
    };
    const card = inHand(game, "Fell the Profane");
    game.dispatch({ type: "play-land", player: A, card, face: 1 });
    game.advanceUntil(quiet);
    expect(asked).toBe(false);
    expect(game.state.objects[card].tapped).toBe(true);
    expect(life(game, A)).toBe(2);
  });
});

describe("Witch Enchanter // Witch-Blessed Meadow", () => {
  it("destroys an artifact or enchantment an opponent controls, never your own", () => {
    const { game, a } = setUp(["Witch Enchanter"]);
    lands(game, A, "Plains", 4);
    const mine = game.debugSpawn("Bonesplitter", A, "battlefield");
    const anthem = game.debugSpawn("Glorious Anthem", B, "battlefield");
    const ring = game.debugSpawn("Sol Ring", B, "battlefield");
    game.debugSpawn("Grizzly Bears", B, "battlefield");
    let offered: readonly TargetRef[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, legal) => {
      offered = legal[0] ?? [];
      return [obj(anthem)];
    };
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Witch Enchanter"), face: 0 });
    game.advanceUntil(quiet);

    expect(offered).toHaveLength(2);
    expect(offered).toEqual(expect.arrayContaining([obj(anthem), obj(ring)]));
    expect(game.state.objects[anthem].zone).toBe("graveyard");
    expect(game.state.objects[ring].zone).toBe("battlefield");
    expect(game.state.objects[mine].zone).toBe("battlefield");
  });

  it("with only your own artifacts about, the trigger has nothing to destroy", () => {
    const { game } = setUp(["Witch Enchanter"]);
    lands(game, A, "Plains", 4);
    const mine = game.debugSpawn("Bonesplitter", A, "battlefield");
    const enchanter = inHand(game, "Witch Enchanter");
    game.dispatch({ type: "cast-spell", player: A, card: enchanter, face: 0 });
    game.advanceUntil(quiet);
    expect(game.state.objects[enchanter].zone).toBe("battlefield");
    expect(game.state.objects[mine].zone).toBe("battlefield");
    expect(game.characteristics(enchanter).subtypes).toEqual(expect.arrayContaining(["Human", "Warlock"]));
  });

  it("Witch-Blessed Meadow enters untapped for 3 life and taps for {W}", () => {
    const { game, a } = setUp(["Witch Enchanter"]);
    a.payLifeForUntappedFn = () => true;
    const card = inHand(game, "Witch Enchanter");
    game.dispatch({ type: "play-land", player: A, card, face: 1 });
    game.advanceUntil(quiet);
    expect(game.state.objects[card].tapped).toBe(false);
    expect(life(game, A)).toBe(17);
    expect(game.characteristics(card).types).toEqual(["land"]);
    game.dispatch({ type: "activate-ability", player: A, source: card, abilityIndex: 0 });
    expect(poolCounts(game.state.players[A].manaPool).W).toBe(1);

    const { game: g2 } = setUp(["Witch Enchanter"]);
    const declined = inHand(g2, "Witch Enchanter");
    g2.dispatch({ type: "play-land", player: A, card: declined, face: 1 });
    g2.advanceUntil(quiet);
    expect(g2.state.objects[declined].tapped).toBe(true);
    expect(life(g2, A)).toBe(20);
  });
});
