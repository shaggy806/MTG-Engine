/**
 * "The amount of mana spent to cast it", recorded on the spell as it's cast
 * (`GameObject.manaSpent`) and read as an amount (`{ manaSpentOf }`) or a
 * filter clause (`manaSpent`).
 *
 * Prossh, Skyraider of Kher: X Kobolds, X = mana spent, so commander tax
 * counts (the 2020-11-10 ruling) — a recast commander makes two more. Its
 * sacrifice outlet takes another creature, never Prossh itself.
 *
 * The Emperor of Palamecia // The Lord Master of Hell: a counter for each
 * noncreature spell with at least four mana spent on it (not a cheap one,
 * not a creature), transforming at three; its mana won't pay for a creature
 * spell; and the back face's attack trigger counts noncreature, nonland
 * cards in your graveyard.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (aHand: readonly string[], commander?: string) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      {
        player: A,
        cards: [...aHand, ...Array<string>(40).fill("Forest")],
        ...(commander !== undefined ? { commander } : {}),
      },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const lands = (game: Game, player: PlayerId, names: readonly string[]): void => {
  for (const name of names) game.debugSpawn(name, player, "battlefield");
};
const kobolds = (game: Game): number =>
  game.battlefield
    .filter((id) => game.state.objects[id].cardName === "Kobolds of Kher Keep")
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const cardIn = (game: Game, zone: readonly ObjectId[], name: string): ObjectId => {
  const id = zone.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};

describe("Prossh, Skyraider of Kher", () => {
  it("makes one Kobold per mana spent, before Prossh itself resolves", () => {
    const { game } = setUp(["Prossh, Skyraider of Kher"]);
    lands(game, A, ["Swamp", "Mountain", "Forest", "Forest", "Forest", "Forest"]);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardIn(game, game.handOf(A), "Prossh, Skyraider of Kher"),
    });
    // Stop once the cast trigger has resolved: Prossh is still on the stack.
    game.advanceUntil((s) => kobolds(game) > 0 || quiet(s));
    expect(kobolds(game)).toBe(6);
    expect(game.state.zones.shared.stack.map((id) => game.state.objects[id].cardName)).toContain(
      "Prossh, Skyraider of Kher",
    );
    const k = game.battlefield.find((id) => game.state.objects[id].cardName === "Kobolds of Kher Keep");
    if (k === undefined) throw new Error("no Kobold");
    const c = game.characteristics(k);
    expect([c.power, c.toughness]).toEqual([0, 1]);
    expect([...c.colors]).toEqual(["R"]);
    expect(game.state.objects[k].isToken).toBe(true);
  });

  it("counts commander tax as mana spent", () => {
    const { game } = setUp([], "Prossh, Skyraider of Kher");
    const prossh = cardIn(game, game.state.zones.shared.command, "Prossh, Skyraider of Kher");
    lands(game, A, ["Swamp", "Mountain", "Forest", "Forest", "Forest", "Forest", "Forest", "Forest"]);
    // Pretend it was cast once already this game: {2} of tax.
    game.state.players[A].commanderCastCounts["Prossh, Skyraider of Kher"] = 1;
    game.dispatch({ type: "cast-spell", player: A, card: prossh });
    game.advanceUntil(quiet);
    expect(kobolds(game)).toBe(8);
  });

  it("sacrifices another creature for +1/+0, never itself", () => {
    const { game } = setUp([]);
    const prossh = game.debugSpawn("Prossh, Skyraider of Kher", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const offer = game
      .legalActions(A)
      .find((o) => o.kind === "activate-ability" && o.source === prossh);
    expect(offer).toBeDefined();
    const choices = offer !== undefined && "sacrifice" in offer ? (offer.sacrifice?.choices ?? []) : [];
    expect(choices).toEqual([bears]);
    game.dispatch({ type: "activate-ability", player: A, source: prossh, abilityIndex: 0, sacrifice: bears });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.characteristics(prossh).power).toBe(6);
  });
});

describe("The Emperor of Palamecia", () => {
  const counters = (game: Game, id: ObjectId): number => game.state.objects[id].counters["+1/+1"] ?? 0;
  const cast = (game: Game, name: string): void => {
    game.dispatch({ type: "cast-spell", player: A, card: cardIn(game, game.handOf(A), name) });
    game.advanceUntil(quiet);
  };

  it("counts only noncreature spells with four or more mana spent, and transforms at three", () => {
    const hand = ["Sol Ring", "Behold the Multiverse", "Behold the Multiverse", "Behold the Multiverse", "Prossh, Skyraider of Kher"];
    const { game } = setUp(hand);
    const emperor = game.debugSpawn("The Emperor of Palamecia", A, "battlefield");
    lands(game, A, [...Array<string>(20).fill("Island"), "Swamp", "Mountain", "Forest", "Forest", "Forest", "Forest"]);

    cast(game, "Sol Ring"); // one mana: no counter
    expect(counters(game, emperor)).toBe(0);
    cast(game, "Prossh, Skyraider of Kher"); // six mana, but a creature
    expect(counters(game, emperor)).toBe(0);
    cast(game, "Behold the Multiverse");
    cast(game, "Behold the Multiverse");
    expect(counters(game, emperor)).toBe(2);
    expect(game.state.objects[emperor].face ?? 0).toBe(0);
    cast(game, "Behold the Multiverse");
    expect(counters(game, emperor)).toBe(3);
    expect(game.state.objects[emperor].face).toBe(1);
    const back = game.characteristics(emperor);
    expect(back.subtypes).toContain("Demon");
  });

  it("its mana pays for a noncreature spell but not a creature spell", () => {
    const { game } = setUp(["Sol Ring", "Grizzly Bears"]);
    game.debugSpawn("The Emperor of Palamecia", A, "battlefield", { summoningSick: false });
    const castable = (name: string): boolean =>
      game
        .legalActions(A)
        .some((o) => o.kind === "cast-spell" && game.state.objects[o.card]?.cardName === name);
    expect(castable("Sol Ring")).toBe(true);
    // Bears need {1}{G}: the Emperor alone can't pay for them, and one Forest
    // plus the Emperor could only if its mana could go to a creature spell.
    game.debugSpawn("Forest", A, "battlefield");
    expect(castable("Grizzly Bears")).toBe(false);
  });

  it("the Lord Master of Hell deals X to each opponent, X = noncreature nonland cards in your graveyard", () => {
    const { game, a } = setUp([]);
    const lord = game.debugSpawn("The Emperor of Palamecia", A, "battlefield", { summoningSick: false });
    game.state.objects[lord].face = 1;
    for (const name of ["Sol Ring", "Behold the Multiverse", "Grizzly Bears", "Forest"]) {
      game.debugSpawn(name, A, "graveyard");
    }
    game.debugSpawn("Sol Ring", B, "graveyard"); // not yours
    a.declareAttackersFn = () => [{ attacker: lord, defender: B }];
    game.advanceUntil((s) => s.turn.step === "declare-blockers" || s.turn.step === "combat-damage");
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(20 - 2);
  });
});
