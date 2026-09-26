/**
 * Power-up (rule 702.193a): "Power-up — [Cost]: [Effect]" means "[Cost]:
 * [Effect]. If this permanent entered this turn, this ability's cost is
 * reduced by this permanent's mana cost. Activate this ability only once."
 * The reduction follows rule 118.7 (702.193b): generic by generic, each
 * coloured symbol by its colour, a hybrid one by the half its controller
 * chooses.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Plains") },
      { player: B, cards: Array<string>(40).fill("Plains") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name);
};
/** Alice's offer to activate `source`'s power-up ability, if she can. */
const powerUp = (game: Game, source: ObjectId) =>
  game
    .legalActions(A)
    .find((a) => a.kind === "activate-ability" && a.source === source && a.text.startsWith("Power-up"));
const activate = (game: Game, source: ObjectId): void => {
  const offer = powerUp(game, source);
  if (offer === undefined || offer.kind !== "activate-ability") throw new Error("power-up isn't offered");
  game.dispatch({ type: "activate-ability", player: A, source, abilityIndex: offer.abilityIndex, targets: [] });
  game.advanceUntil(quiet);
};
const counters = (game: Game, id: ObjectId): number => game.state.objects[id].counters["+1/+1"] ?? 0;

describe("the cost (rule 702.193a)", () => {
  it("the turn it entered, less by its mana cost: Aerial Doombot's {5}{U} is {5}", () => {
    const game = setUp();
    const doombot = spawn(game, "Aerial Doombot");
    lands(game, "Plains", 4);
    expect(powerUp(game, doombot)).toBeUndefined();
    spawn(game, "Plains");
    expect(powerUp(game, doombot)).toBeDefined();
  });

  it("after that turn, its full cost", () => {
    const game = setUp();
    const doombot = spawn(game, "Aerial Doombot");
    game.state.objects[doombot].enteredBattlefieldOnTurn = 0;
    lands(game, "Island", 5);
    expect(powerUp(game, doombot)).toBeUndefined();
    spawn(game, "Island");
    expect(powerUp(game, doombot)).toBeDefined();
  });

  it("a coloured symbol takes off a symbol of its colour: Extremis Elite's {4}{R} is {3}, no red needed", () => {
    const game = setUp();
    const elite = spawn(game, "Extremis Elite");
    lands(game, "Plains", 3);
    expect(powerUp(game, elite)).toBeDefined();
  });

  it("a hybrid symbol takes off the cost's hybrid symbol (118.7e): Brawn's {4}{G/U} is {3}", () => {
    const game = setUp();
    const brawn = spawn(game, "Brawn, Amadeus Cho");
    lands(game, "Plains", 3);
    expect(powerUp(game, brawn)).toBeDefined();
  });

  it("…one hybrid symbol of two: Abomination's {5}{R/G}{R/G} is {2}{R/G}", () => {
    const game = setUp();
    const abomination = spawn(game, "Abomination, Terrifying Titan");
    lands(game, "Plains", 3);
    expect(powerUp(game, abomination)).toBeUndefined();
    spawn(game, "Forest");
    expect(powerUp(game, abomination)).toBeDefined();
  });
});

describe("activate only once", () => {
  it("once it has been activated, it isn't offered again", () => {
    const game = setUp();
    const doombot = spawn(game, "Aerial Doombot");
    lands(game, "Plains", 10);
    activate(game, doombot);
    expect(counters(game, doombot)).toBe(3);
    expect(powerUp(game, doombot)).toBeUndefined();
    const offer = game.legalActions(A).find((a) => a.kind === "activate-ability" && a.source === doombot);
    expect(offer).toBeUndefined();
  });

  it("a permanent that left and came back is a new object, and may power up again", () => {
    const game = setUp();
    const doombot = spawn(game, "Aerial Doombot");
    lands(game, "Plains", 10);
    activate(game, doombot);
    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [{ kind: "object", object: doombot }]);
    game.advanceUntil(quiet);
    expect(game.state.objects[doombot].zone).toBe("battlefield");
    expect(powerUp(game, doombot)).toBeDefined();
  });
});

describe("the cards", () => {
  it("Captain Marvel gets a +1/+1 counter and an indestructible counter", () => {
    const game = setUp();
    const marvel = spawn(game, "Captain Marvel, Earth's Protector");
    lands(game, "Plains", 7);
    activate(game, marvel);
    expect(counters(game, marvel)).toBe(1);
    expect(game.characteristics(marvel).keywords.has("indestructible")).toBe(true);
  });

  it("Namora gets a counter and makes two 1/1 Merfolk", () => {
    const game = setUp();
    const namora = spawn(game, "Namora, the Sea Queen");
    lands(game, "Plains", 5);
    spawn(game, "Island");
    activate(game, namora);
    expect(counters(game, namora)).toBe(1);
    const merfolk = game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === "Merfolk Token");
    expect(merfolk.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(2);
  });

  it("She-Hulk, Attorney-at-Law gets a counter, then doubles every creature's +1/+1 counters", () => {
    const game = setUp();
    const shehulk = spawn(game, "She-Hulk, Attorney-at-Law");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters["+1/+1"] = 2;
    lands(game, "Plains", 9);
    activate(game, shehulk);
    expect(counters(game, shehulk)).toBe(2);
    expect(counters(game, bears)).toBe(4);
  });
});
