/**
 * Morophon, the Boundless — {7} 6/6 legendary Shapeshifter:
 *   Changeling (This card is every creature type.)
 *   As Morophon enters, choose a creature type.
 *   Spells of the chosen type you cast cost {W}{U}{B}{R}{G} less to cast.
 *   This effect reduces only the amount of colored mana you pay.
 *   Other creatures you control of the chosen type get +1/+1.
 *
 * Changeling itself — every creature type, in every zone — is pinned in
 * `changeling.test.ts`; this is the rest of the card.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const MOROPHON = "Morophon, the Boundless";
/** A changeling spell with coloured pips — of whatever type was chosen. */
const CHANGELING = "Test Changeling Adept";

const registry = createDefaultRegistry().register(
  defineCard({
    name: CHANGELING,
    manaCost: "{1}{G}{U}",
    colors: ["G", "U"],
    types: ["creature"],
    subtypes: ["Shapeshifter"],
    power: 2,
    toughness: 2,
    keywords: ["changeling"],
    text: "Changeling (This card is every creature type.)",
  }),
);

function makeGame(aCards: readonly string[] = [], bCards: readonly string[] = []) {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [MOROPHON, ...aCards, ...Array<string>(40).fill("Wastes")] },
      { player: B, cards: [...bCards, ...Array<string>(40).fill("Wastes")] },
    ],
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return { game, a };
}

const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = game.characteristics(id);
  return [c.power, c.toughness];
};
/** What `player` would pay for a card in their hand, when that isn't its
 * printed cost. */
const costOf = (game: Game, id: ObjectId, player: PlayerId = A): string | undefined =>
  game.viewFor(player).objects[id]?.effectiveManaCost;

/** Cast Morophon from A's hand off seven fresh Wastes, naming `type`. */
function enterMorophon(game: Game, a: ScriptedController, type: string): ObjectId {
  for (let i = 0; i < 7; i += 1) spawn(game, "Wastes");
  a.chooseCreatureTypeFn = () => type;
  const morophon = inHand(game, MOROPHON);
  game.dispatch({ type: "cast-spell", player: A, card: morophon, targets: [] });
  game.advanceUntil(settled);
  expect(game.state.objects[morophon].zone).toBe("battlefield");
  return morophon;
}

describe("Morophon, the Boundless", () => {
  it("is a {7} 6/6 legendary Shapeshifter with changeling, in all five colours' identity", () => {
    const def = registry.get(MOROPHON);
    expect(def.manaCost).toBe("{7}");
    expect(def.colors).toEqual([]);
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.subtypes).toEqual(["Shapeshifter"]);
    expect(def.keywords).toEqual(["changeling"]);
    expect([def.power, def.toughness]).toEqual([6, 6]);
    expect(identityString(colorIdentityOf(def))).toBe("WUBRG");
  });

  it("asks for a creature type from the whole catalogue as it enters", () => {
    const { game } = makeGame();
    for (let i = 0; i < 7; i += 1) spawn(game, "Wastes");
    const morophon = inHand(game, MOROPHON);
    game.dispatch({ type: "cast-spell", player: A, card: morophon, targets: [] });
    game.advanceUntil((s) => s.awaiting !== null || settled(s));
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-creature-type");
    if (awaiting?.kind === "choose-creature-type") expect(awaiting.catalog).toBe(true);
    game.dispatch({ type: "choose-creature-type", player: A, creatureType: "Goblin" });
    game.advanceUntil(settled);
    expect(game.state.objects[morophon].chosenCreatureType).toBe("Goblin");
  });

  it("takes one pip of each colour off a spell of the chosen type, and no generic", () => {
    const { game, a } = makeGame(["Goblin Chieftain", "Raging Goblin", "Grizzly Bears", CHANGELING]);
    enterMorophon(game, a, "Goblin");
    // {1}{R}{R}: one {R} of the two (the second ruling).
    expect(costOf(game, inHand(game, "Goblin Chieftain"))).toBe("{1}{R}");
    expect(costOf(game, inHand(game, "Raging Goblin"))).toBe("{0}");
    // A changeling spell is of every type.
    expect(costOf(game, inHand(game, CHANGELING))).toBe("{1}");
    // Not a Goblin.
    expect(costOf(game, inHand(game, "Grizzly Bears"))).toBeUndefined();
  });

  it("pays a hybrid pip's coloured half for it — {R/W}{R/W} costs nothing (the first ruling)", () => {
    const { game, a } = makeGame(["Boros Guildmage"]);
    enterMorophon(game, a, "Wizard");
    const guildmage = inHand(game, "Boros Guildmage");
    expect(costOf(game, guildmage)).toBe("{0}");
    game.dispatch({ type: "cast-spell", player: A, card: guildmage, targets: [] });
    game.advanceUntil(settled);
    expect(game.state.objects[guildmage].zone).toBe("battlefield");
  });

  it("reduces only coloured mana — a generic-only spell of the type costs what it did", () => {
    const { game, a } = makeGame(["Alpha Myr"]);
    enterMorophon(game, a, "Myr");
    expect(costOf(game, inHand(game, "Alpha Myr"))).toBeUndefined();
  });

  it("is paid for real — Goblin Chieftain for {1}{R}", () => {
    const { game, a } = makeGame(["Goblin Chieftain"]);
    enterMorophon(game, a, "Goblin");
    const chieftain = inHand(game, "Goblin Chieftain");
    spawn(game, "Mountain");
    expect(game.canDispatch({ type: "cast-spell", player: A, card: chieftain, targets: [] })).not.toBeNull();
    spawn(game, "Wastes");
    game.dispatch({ type: "cast-spell", player: A, card: chieftain, targets: [] });
    game.advanceUntil(settled);
    expect(game.state.objects[chieftain].zone).toBe("battlefield");
  });

  it("reduces only the spells its controller casts", () => {
    const { game, a } = makeGame([], ["Raging Goblin"]);
    enterMorophon(game, a, "Goblin");
    expect(costOf(game, inHand(game, "Raging Goblin", B), B)).toBeUndefined();
  });

  it("gives other creatures you control of the chosen type +1/+1 — and a changeling", () => {
    const { game, a } = makeGame();
    const morophon = enterMorophon(game, a, "Goblin");
    const goblin = spawn(game, "Raging Goblin");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Raging Goblin", B);
    const changeling = spawn(game, CHANGELING);
    expect(pt(game, goblin)).toEqual([2, 2]);
    expect(pt(game, changeling)).toEqual([3, 3]);
    expect(pt(game, bears)).toEqual([2, 2]);
    expect(pt(game, theirs)).toEqual([1, 1]);
    // "Other": Morophon, every type itself, doesn't pump itself.
    expect(pt(game, morophon)).toEqual([6, 6]);
    // Read live: it ends as Morophon leaves.
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: morophon }]);
    expect(pt(game, goblin)).toEqual([1, 1]);
  });

  it("does nothing with no type chosen", () => {
    const { game } = makeGame(["Raging Goblin"]);
    // `debugSpawn` puts it onto the battlefield without the choice.
    const morophon = game.debugSpawn(MOROPHON, A, "battlefield");
    expect(game.state.objects[morophon].chosenCreatureType ?? null).toBeNull();
    const goblin = spawn(game, "Raging Goblin");
    expect(pt(game, goblin)).toEqual([1, 1]);
    expect(costOf(game, inHand(game, "Raging Goblin"))).toBeUndefined();
  });
});
