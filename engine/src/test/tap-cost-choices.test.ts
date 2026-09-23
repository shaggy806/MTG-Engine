import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

/**
 * "Tap N untapped … you control" costs — an ability's `AbilityCost.tapOthers`
 * and Sephara's alternative cost — let the player pick what to tap
 * (`tapCost` on the offer, `tap` on the action). They used to tap the first
 * eligible permanents, count a token stack as one, and let a creature pay
 * both the mana and the tap half of one cost.
 */

const A = asPlayerId("alice");
const B = asPlayerId("bob");

function mkGame(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

/** On the battlefield, ready — summoning-sick only if asked. */
function spawn(game: Game, name: string, player: PlayerId, sick = false): ObjectId {
  return game.debugSpawn(name, player, "battlefield", sick ? {} : { summoningSick: false });
}

function stackOf(game: Game, name: string, player: PlayerId, count: number): ObjectId {
  game.debugApplyEffect(player, { kind: "create-token", token: name, count });
  const stack = game.state.zones.shared.battlefield.find(
    (id) => game.state.objects[id].cardName === name && game.state.objects[id].isToken,
  );
  if (stack === undefined || (game.state.objects[stack].stackCount ?? 1) !== count) {
    throw new Error(`expected one stack of ${count} ${name}`);
  }
  return stack;
}

type AbilityOffer = Extract<LegalAction, { kind: "activate-ability" }>;
type CastOffer = Extract<LegalAction, { kind: "cast-spell" }>;

function abilityOffer(game: Game, source: ObjectId): AbilityOffer | undefined {
  return game
    .legalActions(A)
    .find((a): a is AbilityOffer => a.kind === "activate-ability" && a.source === source);
}

const tapped = (game: Game, id: ObjectId): boolean => game.state.objects[id].tapped;

describe("choosing what a tap cost taps", () => {
  it("offers the candidates and taps the one chosen", () => {
    const game = mkGame();
    const evangel = spawn(game, "Selesnya Evangel", A);
    const bears = spawn(game, "Grizzly Bears", A);
    const angel = spawn(game, "Serra Angel", A, true);
    spawn(game, "Forest", A);

    const offer = abilityOffer(game, evangel);
    expect(offer?.tapCost).toEqual({ count: 1, choices: [bears, angel] });

    game.dispatch({ type: "activate-ability", player: A, source: evangel, abilityIndex: 0, tap: [bears] });
    expect(tapped(game, bears)).toBe(true);
    expect(tapped(game, angel)).toBe(false);
  });

  it("a driver that doesn't choose gets a summoning-sick creature first", () => {
    const game = mkGame();
    const evangel = spawn(game, "Selesnya Evangel", A);
    const bears = spawn(game, "Grizzly Bears", A);
    const angel = spawn(game, "Serra Angel", A, true);
    spawn(game, "Forest", A);

    game.dispatch({ type: "activate-ability", player: A, source: evangel, abilityIndex: 0 });
    expect(tapped(game, angel)).toBe(true);
    expect(tapped(game, bears)).toBe(false);
  });

  it("refuses a pick that isn't one of the choices, or the wrong number of them", () => {
    const game = mkGame();
    const evangel = spawn(game, "Selesnya Evangel", A);
    const bears = spawn(game, "Grizzly Bears", A);
    const theirs = spawn(game, "Hill Giant", B);
    spawn(game, "Forest", A);

    const activate = (tap: ObjectId[]) => () =>
      game.dispatch({ type: "activate-ability", player: A, source: evangel, abilityIndex: 0, tap });
    expect(activate([theirs])).toThrow(/can't tap Hill Giant/);
    expect(activate([evangel])).toThrow(/can't tap Selesnya Evangel/);
    expect(activate([])).toThrow(/taps 1 permanent/);
    expect(game.canDispatch({
      type: "activate-ability", player: A, source: evangel, abilityIndex: 0, tap: [theirs],
    })).toMatch(/can't tap Hill Giant/);
    expect(tapped(game, evangel)).toBe(false);
    activate([bears])();
    expect(tapped(game, bears)).toBe(true);
  });
});

describe("one creature can't pay the mana and the tap half of a cost", () => {
  // Selesnya Evangel's {1} and "tap an untapped creature" with Llanowar
  // Elves as the only other creature: the Elves used to tap for the {1} and
  // count as the tapped creature too.
  it("isn't offered when the only creature to tap is also the only mana", () => {
    const game = mkGame();
    const evangel = spawn(game, "Selesnya Evangel", A);
    spawn(game, "Llanowar Elves", A);
    expect(abilityOffer(game, evangel)).toBeUndefined();
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: evangel, abilityIndex: 0 }),
    ).toThrow(/needs 1 untapped|cannot pay/);
  });

  it("pays the mana from something else when the creature is picked to tap", () => {
    const game = mkGame();
    const evangel = spawn(game, "Selesnya Evangel", A);
    const elves = spawn(game, "Llanowar Elves", A);
    const forest = spawn(game, "Forest", A);

    expect(abilityOffer(game, evangel)?.tapCost?.choices).toEqual([elves]);
    game.dispatch({ type: "activate-ability", player: A, source: evangel, abilityIndex: 0, tap: [elves] });
    expect(tapped(game, elves)).toBe(true);
    expect(tapped(game, forest)).toBe(true);
  });

  it("leaves out of the choices a creature the mana has to come from", () => {
    const game = mkGame();
    const evangel = spawn(game, "Selesnya Evangel", A);
    const elves = spawn(game, "Llanowar Elves", A);
    const bears = spawn(game, "Grizzly Bears", A);
    expect(abilityOffer(game, evangel)?.tapCost?.choices).toEqual([bears]);
    game.dispatch({ type: "activate-ability", player: A, source: evangel, abilityIndex: 0, tap: [bears] });
    expect(tapped(game, elves)).toBe(true); // paid the {1}
    expect(tapped(game, bears)).toBe(true);
  });
});

describe("a token stack pays a tap cost token by token", () => {
  it("counts every Zombie in a stack toward Gravespawn Sovereign's five", () => {
    const game = mkGame();
    const sovereign = spawn(game, "Gravespawn Sovereign", A);
    const zombies = stackOf(game, "Zombie Token", A, 9);
    game.debugSpawn("Grizzly Bears", B, "graveyard");

    const offer = abilityOffer(game, sovereign);
    expect(offer?.tapCost).toEqual({
      count: 5,
      choices: [sovereign, zombies],
      copies: { [zombies]: 9 },
    });
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: sovereign,
      abilityIndex: 0,
      targets: [offer!.targetOptions[0][0]],
      tap: [zombies, zombies, zombies, zombies, zombies],
    });

    const zombieTokens = game.state.zones.shared.battlefield
      .map((id) => game.state.objects[id])
      .filter((o) => o.cardName === "Zombie Token");
    const count = (want: boolean) =>
      zombieTokens.filter((o) => o.tapped === want).reduce((n, o) => n + (o.stackCount ?? 1), 0);
    expect(count(true)).toBe(5);
    expect(count(false)).toBe(4);
    expect(tapped(game, sovereign)).toBe(false);
  });

  it("won't name a permanent more times than it has tokens", () => {
    const game = mkGame();
    const sovereign = spawn(game, "Gravespawn Sovereign", A);
    const zombies = stackOf(game, "Zombie Token", A, 9);
    game.debugSpawn("Grizzly Bears", B, "graveyard");
    const target = abilityOffer(game, sovereign)!.targetOptions[0][0];

    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: sovereign,
        abilityIndex: 0,
        targets: [target],
        tap: [sovereign, sovereign, zombies, zombies, zombies],
      }),
    ).toThrow(/names Gravespawn Sovereign more times than there are to tap/);
  });
});

describe("Sephara's alternative cost", () => {
  it("taps the four flyers the caster picks", () => {
    const game = mkGame();
    const angels = [0, 1, 2, 3, 4].map(() => spawn(game, "Serra Angel", A));
    spawn(game, "Plains", A);
    const sephara = game.debugSpawn("Sephara, Sky's Blade", A, "hand");

    const offer = game
      .legalActions(A)
      .find((a): a is CastOffer => a.kind === "cast-spell" && a.card === sephara && a.altCost === true);
    expect(offer?.tapCost).toEqual({ count: 4, choices: angels });

    const picked = angels.slice(1);
    game.dispatch({ type: "cast-spell", player: A, card: sephara, altCost: true, tap: picked });
    expect(angels.map((id) => tapped(game, id))).toEqual([false, true, true, true, true]);
  });
});
