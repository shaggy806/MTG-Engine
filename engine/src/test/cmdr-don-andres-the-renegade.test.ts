/**
 * Don Andres, the Renegade — {1}{U}{B}{R} 4/3 legendary Vampire Pirate:
 *   Each creature you control but don't own gets +2/+2, has menace and
 *   deathtouch, and is a Pirate in addition to its other types.
 *   Whenever you cast a noncreature spell you don't own, create two tapped
 *   Treasure tokens.
 *
 * - "you control but don't own": a stolen creature, not your own, not the
 *   opponent's own; and the bonus goes when control goes back;
 * - the trigger wants a noncreature spell, cast by you, owned by someone
 *   else — neither your own spell nor someone else's creature spell counts.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const DON = "Don Andres, the Renegade";
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
const treasureCount = (game: Game) =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === "Treasure Token",
  ).length;

/** Put `name` in A's hand owned by B — a card A came to hold without owning it. */
function borrowed(game: Game, name: string): ObjectId {
  const id = game.debugSpawn(name, A, "hand");
  game.state.objects[id].owner = B;
  return id;
}

function cast(game: Game, card: ObjectId): void {
  const offer = game.legalActions(A).find((x) => x.kind === "cast-spell" && x.card === card);
  expect(offer).toBeDefined();
  game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
}

describe("Don Andres, the Renegade", () => {
  it("is a {1}{U}{B}{R} 4/3 legendary Vampire Pirate", () => {
    const def = registry.get(DON);
    expect(def.manaCost).toBe("{1}{U}{B}{R}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.subtypes).toEqual(["Vampire", "Pirate"]);
    expect([def.power, def.toughness]).toEqual([4, 3]);
    expect(identityString(colorIdentityOf(def))).toBe("UBR");
  });

  it("pumps only creatures you control but don't own, while you control them", () => {
    const game = makeGame();
    spawn(game, DON, A);
    const mine = spawn(game, "Grizzly Bears", A);
    const theirs = spawn(game, "Grizzly Bears", B);
    const stolen = spawn(game, "Llanowar Elves", B);
    game.debugApplyEffect(
      A,
      { kind: "gain-control", target: 0, untilEndOfTurn: true },
      [{ kind: "object", object: stolen }],
    );
    const c = game.characteristics(stolen);
    expect([c.power, c.toughness]).toEqual([3, 3]);
    expect([...c.keywords].sort()).toEqual(["deathtouch", "menace"]);
    expect(c.subtypes).toEqual(["Elf", "Druid", "Pirate"]);
    for (const id of [mine, theirs]) {
      expect(game.characteristics(id).power).toBe(2);
      expect(game.characteristics(id).subtypes).toEqual(["Bear"]);
    }
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.characteristics(stolen).power).toBe(1);
  });

  it("makes two tapped Treasures when you cast a noncreature spell you don't own", () => {
    const game = makeGame();
    spawn(game, DON, A);
    for (let i = 0; i < 4; i += 1) spawn(game, "Island", A);
    cast(game, game.debugSpawn("Mind Stone", A, "hand"));
    expect(treasureCount(game)).toBe(0);
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({ type: "pass-priority", player: B });

    cast(game, borrowed(game, "Mind Stone"));
    // The trigger resolves before the spell.
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({ type: "pass-priority", player: B });
    const made = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Treasure Token",
    );
    expect(made).toHaveLength(2);
    for (const id of made) expect(game.state.objects[id].tapped).toBe(true);
  });

  it("ignores a creature spell you don't own", () => {
    const game = makeGame();
    spawn(game, DON, A);
    for (let i = 0; i < 2; i += 1) spawn(game, "Forest", A);
    cast(game, borrowed(game, "Grizzly Bears"));
    expect(game.state.zones.shared.stack).toHaveLength(1);
  });
});
