/**
 * Choco, Seeker of Paradise — {1}{G}{W}{U} legendary 3/5 Bird.
 *
 *   Whenever one or more Birds you control attack, look at that many cards
 *   from the top of your library. You may put one of them into your hand.
 *   Then put any number of land cards from among them onto the battlefield
 *   tapped and the rest into your graveyard.
 *   Landfall — Whenever a land you control enters, Choco gets +1/+0 until
 *   end of turn.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

/** Choco and `birds - 1` Birds of Paradise, and `top` on top of Alice's
 * library, first listed on top. */
const setUp = (birds: number, top: readonly string[]) => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Plains") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  const choco = game.debugSpawn("Choco, Seeker of Paradise", A, "battlefield", { summoningSick: false });
  const attackers = [choco];
  for (let i = 1; i < birds; i += 1) {
    attackers.push(game.debugSpawn("Birds of Paradise", A, "battlefield", { summoningSick: false }));
  }
  const cards = [...top].reverse().map((name) => game.debugSpawn(name, A, "library")).reverse();
  a.declareAttackersFn = () => attackers.map((attacker) => ({ attacker, defender: B }));
  return { game, a, choco, cards };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const toBlocks = (game: Game) =>
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "declare-blockers" && quiet(s));
const zoneOf = (game: Game, id: ObjectId) => game.state.objects[id].zone;

describe("Choco, Seeker of Paradise", () => {
  it("looks at one card per attacking Bird: one to hand, then lands onto the battlefield tapped, the rest to the graveyard", () => {
    const { game, a, choco, cards } = setUp(3, ["Hill Giant", "Forest", "Island"]);
    const [giant, forest, island] = cards;
    const asked: ObjectId[][] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      asked.push([...eligible]);
      return asked.length === 1 ? [giant] : [forest];
    };
    toBlocks(game);
    // The first choice is of any of the three; the second, of the lands left.
    expect(asked).toEqual([[giant, forest, island], [forest, island]]);
    expect(zoneOf(game, giant)).toBe("hand");
    expect(zoneOf(game, forest)).toBe("battlefield");
    expect(game.state.objects[forest].tapped).toBe(true);
    // Straight from the library: the rest wait for the second choice.
    expect(game.state.objects[forest].entry?.from).toBe("library");
    expect(zoneOf(game, island)).toBe("graveyard");
    // Landfall: the Forest entering.
    expect(game.characteristics(choco).power).toBe(4);
  });

  it("with no land left for the second choice, the rest go to the graveyard at once", () => {
    const { game, a, cards } = setUp(2, ["Hill Giant", "Grizzly Bears"]);
    const [giant, bears] = cards;
    let asked = 0;
    a.chooseFromZoneFn = () => {
      asked += 1;
      return [giant];
    };
    toBlocks(game);
    expect(asked).toBe(1);
    expect(zoneOf(game, giant)).toBe("hand");
    expect(zoneOf(game, bears)).toBe("graveyard");
  });

  it("may take nothing into hand and every land onto the battlefield", () => {
    const { game, a, cards } = setUp(3, ["Forest", "Hill Giant", "Island"]);
    const [forest, giant, island] = cards;
    let asked = 0;
    a.chooseFromZoneFn = (_view, eligible) => {
      asked += 1;
      return asked === 1 ? [] : [...eligible];
    };
    toBlocks(game);
    expect(zoneOf(game, forest)).toBe("battlefield");
    expect(zoneOf(game, island)).toBe("battlefield");
    expect(zoneOf(game, giant)).toBe("graveyard");
  });

  it("one Bird attacking looks at one card", () => {
    const { game, a, cards } = setUp(1, ["Hill Giant", "Forest"]);
    const [giant, forest] = cards;
    const asked: ObjectId[][] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      asked.push([...eligible]);
      return [];
    };
    toBlocks(game);
    expect(asked).toEqual([[giant]]);
    expect(zoneOf(game, giant)).toBe("graveyard");
    expect(zoneOf(game, forest)).toBe("library");
  });
});
