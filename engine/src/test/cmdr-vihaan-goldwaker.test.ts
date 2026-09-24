/**
 * Vihaan, Goldwaker — {R}{W}{B} 3/3 legendary Dwarf Warlock:
 *   Other outlaws you control have vigilance and haste.
 *   At the beginning of combat on your turn, you may have Treasures you
 *   control become 3/3 Construct Assassin artifact creatures in addition to
 *   their other types until end of turn.
 *
 * - "outlaws" are the five creature types; Vihaan itself isn't "other";
 * - the animated Treasures are Assassins, so outlaws, so they have haste and
 *   can attack at once — a subtype one effect grants feeding another
 *   static's scope;
 * - declining the "may" leaves them alone, and the animation ends with the
 *   turn.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const VIHAAN = "Vihaan, Goldwaker";
const registry = createDefaultRegistry();

function makeGame() {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Mountain") })),
  });
  game.advanceUntil(
    (s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  return { game, a, b };
}

const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const treasures = (game: Game, player: PlayerId): ObjectId[] => {
  game.debugApplyEffect(player, { kind: "create-token", token: "Treasure Token", count: 2 });
  return game.state.zones.shared.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === "Treasure Token" &&
      game.state.objects[id].controller === player,
  );
};

describe("Vihaan, Goldwaker", () => {
  it("is a {R}{W}{B} 3/3 legendary Dwarf Warlock", () => {
    const def = registry.get(VIHAAN);
    expect(def.manaCost).toBe("{R}{W}{B}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.subtypes).toEqual(["Dwarf", "Warlock"]);
    expect([def.power, def.toughness]).toEqual([3, 3]);
    expect(identityString(colorIdentityOf(def))).toBe("WBR");
  });

  it("gives other outlaws you control vigilance and haste", () => {
    const { game } = makeGame();
    const vihaan = spawn(game, VIHAAN, A);
    const rogue = spawn(game, "Bria, Riptide Rogue", A);
    const bear = spawn(game, "Grizzly Bears", A);
    const theirs = spawn(game, "Bria, Riptide Rogue", B);
    expect([...game.characteristics(rogue).keywords].sort()).toEqual(["haste", "vigilance"]);
    for (const id of [vihaan, bear, theirs]) {
      expect(game.characteristics(id).keywords.has("haste")).toBe(false);
    }
  });

  it("turns Treasures into hasty 3/3 Construct Assassins that attack, until end of turn", () => {
    const { game, a } = makeGame();
    spawn(game, VIHAAN, A);
    const mine = treasures(game, A);
    const theirs = treasures(game, B);
    for (const id of mine) game.state.objects[id].summoningSick = true;
    a.chooseModesFn = () => [0];
    a.declareAttackersFn = () => mine.map((attacker) => ({ attacker, defender: B }));
    game.advanceUntil((s) => s.turn.step === "declare-attackers");
    for (const id of mine) {
      const c = game.characteristics(id);
      expect(c.types).toEqual(["artifact", "creature"]);
      expect(c.subtypes).toEqual(["Treasure", "Construct", "Assassin"]);
      expect([c.power, c.toughness]).toEqual([3, 3]);
      expect(c.keywords.has("haste")).toBe(true);
    }
    for (const id of theirs) expect(game.characteristics(id).types).toEqual(["artifact"]);
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(game.state.players[B].life).toBe(14);
    // Vigilance: attacking didn't tap them, so they still make mana.
    for (const id of mine) expect(game.state.objects[id].tapped).toBe(false);
    game.advanceUntil((s) => s.turn.number === 2);
    for (const id of mine) expect(game.characteristics(id).types).toEqual(["artifact"]);
  });

  it("does nothing when you decline", () => {
    const { game, a } = makeGame();
    spawn(game, VIHAAN, A);
    const mine = treasures(game, A);
    a.chooseModesFn = () => [];
    game.advanceUntil((s) => s.turn.step === "declare-attackers");
    for (const id of mine) expect(game.characteristics(id).types).toEqual(["artifact"]);
  });
});
