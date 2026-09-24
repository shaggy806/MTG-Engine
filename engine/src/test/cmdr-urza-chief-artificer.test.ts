/**
 * Urza, Chief Artificer — {3}{W}{U}{B} 4/5 legendary Human Artificer:
 *   Affinity for artifact creatures
 *   Artifact creatures you control have menace.
 *   At the beginning of your end step, create a 0/0 colorless Construct
 *   artifact creature token with "This token gets +1/+1 for each artifact
 *   you control."
 *
 * - affinity counts artifact creatures, not artifacts;
 * - menace reaches an artifact that is a creature only because something
 *   animated it, and not a plain artifact or a non-artifact creature;
 * - the Construct counts every artifact you control, itself included.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const URZA = "Urza, Chief Artificer";
const registry = createDefaultRegistry();

function makeGame(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const constructs = (game: Game) =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === "Construct Token",
  );

describe("Urza, Chief Artificer", () => {
  it("is a {3}{W}{U}{B} 4/5 legendary Human Artificer", () => {
    const def = registry.get(URZA);
    expect(def.manaCost).toBe("{3}{W}{U}{B}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.subtypes).toEqual(["Human", "Artificer"]);
    expect([def.power, def.toughness]).toEqual([4, 5]);
    expect(identityString(colorIdentityOf(def))).toBe("WUB");
  });

  it("costs {1} less for each artifact creature you control", () => {
    const game = makeGame();
    const urza = game.debugSpawn(URZA, A, "hand");
    for (const land of ["Plains", "Island", "Swamp"]) spawn(game, land, A);
    spawn(game, "Sol Ring", A);
    const castable = () =>
      game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === urza);
    // Sol Ring is an artifact but not a creature: {3}{W}{U}{B} with 5 mana.
    expect(castable()).toBe(false);
    spawn(game, "Wurmcoil Engine", A);
    // One artifact creature: {2}{W}{U}{B}, and Sol Ring makes two.
    expect(castable()).toBe(true);
  });

  it("gives menace to artifact creatures you control, animated ones too", () => {
    const game = makeGame();
    spawn(game, URZA, A);
    const wurm = spawn(game, "Wurmcoil Engine", A);
    const ring = spawn(game, "Sol Ring", A);
    const bear = spawn(game, "Grizzly Bears", A);
    const theirs = spawn(game, "Wurmcoil Engine", B);
    expect(game.characteristics(wurm).keywords.has("menace")).toBe(true);
    for (const id of [ring, bear, theirs]) {
      expect(game.characteristics(id).keywords.has("menace")).toBe(false);
    }
    game.debugApplyEffect(A, {
      kind: "animate-all",
      filter: { name: "Sol Ring" },
      power: 1,
      toughness: 1,
      addTypes: ["creature"],
      duration: "end-of-turn",
    });
    expect(game.characteristics(ring).keywords.has("menace")).toBe(true);
  });

  it("makes a Construct at your end step that counts your artifacts", () => {
    const game = makeGame();
    spawn(game, URZA, A);
    spawn(game, "Sol Ring", A);
    spawn(game, "Sol Ring", B);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(constructs(game)).toHaveLength(1);
    const [construct] = constructs(game);
    const c = game.characteristics(construct);
    // Sol Ring and itself.
    expect([c.power, c.toughness]).toEqual([2, 2]);
    expect(c.keywords.has("menace")).toBe(true);
    // Nothing on the opponent's end step.
    game.advanceUntil((s) => s.turn.number === 3);
    expect(constructs(game)).toHaveLength(1);
  });
});
