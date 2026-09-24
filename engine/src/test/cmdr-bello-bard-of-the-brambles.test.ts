/**
 * Bello, Bard of the Brambles — {1}{R}{G} 3/3 legendary Raccoon Bard:
 *   During your turn, each non-Equipment artifact and non-Aura enchantment
 *   you control with mana value 4 or greater is a 4/4 Elemental creature in
 *   addition to its other types and has indestructible, haste, and "Whenever
 *   this creature deals combat damage to a player, draw a card."
 *
 * - only your own non-Equipment artifacts and non-Aura enchantments of mana
 *   value 4 or more, and only during your turn;
 * - an artifact creature among them is a 4/4 too (base P/T, layer 7b);
 * - the animated permanent is a creature everywhere: it can attack the turn
 *   it arrived (haste) and draws on combat damage;
 * - it all stops on an opponent's turn and when Bello leaves.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry, defineCard } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const BELLO = "Bello, Bard of the Brambles";

const registry = createDefaultRegistry();
registry.register(
  defineCard({
    name: "Test Maul",
    manaCost: "{4}",
    types: ["artifact"],
    subtypes: ["Equipment"],
    text: "",
  }),
);
registry.register(
  defineCard({
    name: "Test Shroud",
    manaCost: "{4}",
    types: ["enchantment"],
    subtypes: ["Aura"],
    targets: ["creature"],
    text: "Enchant creature",
  }),
);

function makeGame() {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Forest") })),
  });
  game.advanceUntil(
    (s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  return { game, a, b };
}

const spawn = (game: Game, name: string, player: PlayerId, sick = false): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: sick });
const isCreature = (game: Game, id: ObjectId) =>
  game.characteristics(id).types.includes("creature");

describe("Bello, Bard of the Brambles", () => {
  it("is a {1}{R}{G} 3/3 legendary Raccoon Bard", () => {
    const def = registry.get(BELLO);
    expect(def.manaCost).toBe("{1}{R}{G}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.subtypes).toEqual(["Raccoon", "Bard"]);
    expect([def.power, def.toughness]).toEqual([3, 3]);
    expect(identityString(colorIdentityOf(def))).toBe("RG");
  });

  it("animates only your own big non-Equipment artifacts and non-Aura enchantments", () => {
    const { game } = makeGame();
    spawn(game, BELLO, A);
    const archive = spawn(game, "Hedron Archive", A);
    const season = spawn(game, "Doubling Season", A);
    const wurmcoil = spawn(game, "Wurmcoil Engine", A);
    const ring = spawn(game, "Sol Ring", A);
    const maul = spawn(game, "Test Maul", A);
    const theirs = spawn(game, "Hedron Archive", B);

    for (const id of [archive, season]) {
      const c = game.characteristics(id);
      expect(c.types).toContain("creature");
      expect(c.subtypes).toContain("Elemental");
      expect([c.power, c.toughness]).toEqual([4, 4]);
      expect([...c.keywords].sort()).toEqual(["haste", "indestructible"]);
    }
    // An artifact creature already: its base P/T becomes 4/4.
    const w = game.characteristics(wurmcoil);
    expect([w.power, w.toughness]).toEqual([4, 4]);
    expect(w.keywords.has("indestructible")).toBe(true);

    for (const id of [ring, maul, theirs]) expect(isCreature(game, id)).toBe(false);
  });

  it("leaves an Aura alone", () => {
    const { game } = makeGame();
    spawn(game, BELLO, A);
    const bear = spawn(game, "Grizzly Bears", A);
    const aura = spawn(game, "Test Shroud", A);
    game.state.objects[aura].attachedTo = bear;
    expect(isCreature(game, aura)).toBe(false);
  });

  it("applies only during your turn, and not once Bello is gone", () => {
    const { game } = makeGame();
    const bello = spawn(game, BELLO, A);
    const archive = spawn(game, "Hedron Archive", A);
    expect(isCreature(game, archive)).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(isCreature(game, archive)).toBe(false);
    expect(game.characteristics(archive).keywords.size).toBe(0);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(isCreature(game, archive)).toBe(true);
    game.debugApplyEffect(B, { kind: "exile", target: 0 }, [{ kind: "object", object: bello }]);
    expect(isCreature(game, archive)).toBe(false);
  });

  it("is indestructible", () => {
    const { game } = makeGame();
    spawn(game, BELLO, A);
    const archive = spawn(game, "Hedron Archive", A);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: archive }]);
    expect(game.state.objects[archive].zone).toBe("battlefield");
  });

  it("attacks the turn it arrives and draws a card on combat damage", () => {
    const { game, a } = makeGame();
    spawn(game, BELLO, A);
    const archive = spawn(game, "Hedron Archive", A, true);
    a.declareAttackersFn = () => [{ attacker: archive, defender: B }];
    const hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && s.zones.shared.stack.length === 0);
    expect(game.state.players[B].life).toBe(16);
    expect(game.handOf(A).length).toBe(hand + 1);
  });
});
