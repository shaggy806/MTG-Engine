/**
 * Syr Gwyn, Hero of Ashvale — {3}{R}{W}{B} 5/5 legendary Human Knight:
 *   Vigilance, menace
 *   Whenever an equipped creature you control attacks, you draw a card and
 *   you lose 1 life.
 *   Equipment you control have equip Knight {0}.
 *
 * - every Equipment you control gains an equip ability that costs nothing
 *   and can target only a Knight you control;
 * - each equipped attacker draws one card and costs one life; an unequipped
 *   one does nothing.
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const GWYN = "Syr Gwyn, Hero of Ashvale";
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
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Plains") })),
  });
  game.advanceUntil(
    (s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  return { game, a, b };
}

const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const equipKnight = (game: Game, source: ObjectId) =>
  game
    .legalActions(A)
    .find(
      (x): x is Extract<LegalAction, { kind: "activate-ability" }> =>
        x.kind === "activate-ability" && x.source === source && x.text === "Equip Knight {0}",
    );

describe("Syr Gwyn, Hero of Ashvale", () => {
  it("is a {3}{R}{W}{B} 5/5 legendary Human Knight with vigilance and menace", () => {
    const def = registry.get(GWYN);
    expect(def.manaCost).toBe("{3}{R}{W}{B}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.subtypes).toEqual(["Human", "Knight"]);
    expect([def.power, def.toughness]).toEqual([5, 5]);
    expect(def.keywords).toEqual(["vigilance", "menace"]);
    expect(identityString(colorIdentityOf(def))).toBe("WBR");
  });

  it("gives your Equipment a free equip that targets only Knights you control", () => {
    const { game } = makeGame();
    const gwyn = spawn(game, GWYN, A);
    const knight = spawn(game, "White Knight", A);
    spawn(game, "Grizzly Bears", A);
    spawn(game, "White Knight", B);
    const splitter = spawn(game, "Bonesplitter", A);
    const theirs = spawn(game, "Bonesplitter", B);
    const offer = equipKnight(game, splitter);
    expect(offer).toBeDefined();
    expect(offer!.targetOptions[0].map((t) => (t.kind === "object" ? t.object : null)).sort()).toEqual(
      [gwyn, knight].sort(),
    );
    expect(game.legalActions(B).some((x) => x.kind === "activate-ability" && x.source === theirs && x.text === "Equip Knight {0}")).toBe(false);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: splitter,
      abilityIndex: offer!.abilityIndex,
      targets: [{ kind: "object", object: knight }],
    });
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({ type: "pass-priority", player: B });
    expect(game.state.objects[splitter].attachedTo).toBe(knight);
    expect(game.characteristics(knight).power).toBe(4);
  });

  it("draws and loses 1 life per equipped attacker", () => {
    const { game, a } = makeGame();
    spawn(game, GWYN, A);
    const knight = spawn(game, "White Knight", A);
    const bear = spawn(game, "Grizzly Bears", A);
    const splitter = spawn(game, "Bonesplitter", A);
    game.state.objects[splitter].attachedTo = knight;
    a.declareAttackersFn = () => [
      { attacker: knight, defender: B },
      { attacker: bear, defender: B },
    ];
    const hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(game.handOf(A).length).toBe(hand + 1);
    expect(game.state.players[A].life).toBe(19);
  });
});
