/**
 * `AffectSpec.withKeyword` / `withoutKeyword` read the target's *computed*
 * keywords (layer 6), not its printed ones: rule 613.8a makes a "creatures
 * with flying get +1/+0" anthem depend on every effect that grants or
 * removes flying. Alela, Artful Provocateur is the card that asked for it —
 * her anthem is meant for the Faerie tokens she makes and for whatever an
 * Aura or Equipment she triggers off teaches to fly.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const makeGame = (players: readonly PlayerId[] = [A, B]) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 7 },
    decks: players.map((player) => ({
      player,
      cards: Array<string>(40).fill("Plains"),
    })),
  });

const openWith = (game: Game, n: number) => {
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const kind of ["Plains", "Island", "Swamp", "Mountain", "Forest"]) {
    for (let i = 0; i < n; i += 1) {
      const id = game.debugSpawn(kind, A, "battlefield");
      game.state.objects[id].tapped = false;
    }
  }
};

const settle = (game: Game) =>
  game.advanceUntil(
    (s) =>
      s.zones.shared.stack.length === 0 &&
      s.pendingTriggers.length === 0 &&
      s.awaiting === null &&
      s.priority.holder !== null,
  );

const power = (game: Game, id: ObjectId) => game.characteristics(id).power;

const faeriesOf = (game: Game, player: PlayerId) =>
  game.state.zones.shared.battlefield.filter((id) => {
    const o = game.state.objects[id];
    return o.cardName === "Faerie Token" && o.controller === player;
  });

/** Faerie tokens, counting every token in a stack. */
const faerieCount = (game: Game, player: PlayerId) =>
  faeriesOf(game, player).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);

describe("a keyword-scoped anthem sees granted keywords", () => {
  it("buffs a creature flying by an Aura", () => {
    const game = makeGame();
    openWith(game, 1);
    game.debugSpawn("Alela, Artful Provocateur", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", A, "battlefield");
    expect(power(game, giant)).toBe(3);
    const aura = game.debugSpawn("Flight", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: aura,
      targets: [{ kind: "object", object: giant }],
    });
    settle(game);
    expect(game.state.objects[aura].attachedTo).toBe(giant);
    expect(game.characteristics(giant).keywords.has("flying")).toBe(true);
    expect(power(game, giant)).toBe(4);
  });

  it("buffs a creature flying by an Equipment, and stops when it's moved", () => {
    const game = makeGame();
    openWith(game, 2);
    game.debugSpawn("Alela, Artful Provocateur", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const wings = game.debugSpawn("Cobbled Wings", A, "battlefield");
    const equip = (target: ObjectId) => {
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: wings,
        abilityIndex: 0,
        targets: [{ kind: "object", object: target }],
      });
      settle(game);
    };
    equip(giant);
    expect(power(game, giant)).toBe(4);
    expect(power(game, bear)).toBe(2);
    equip(bear);
    expect(power(game, giant)).toBe(3);
    expect(power(game, bear)).toBe(3);
  });

  it("buffs a creature given flying until end of turn by a spell", () => {
    const game = makeGame();
    openWith(game, 1);
    game.debugSpawn("Alela, Artful Provocateur", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", A, "battlefield");
    const jump = game.debugSpawn("Jump", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: jump,
      targets: [{ kind: "object", object: giant }],
    });
    settle(game);
    expect(power(game, giant)).toBe(4);
  });

  it("buffs a creature flying by another permanent's anthem", () => {
    const game = makeGame();
    openWith(game, 1);
    game.debugSpawn("Alela, Artful Provocateur", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", A, "battlefield");
    game.debugSpawn("Levitation", A, "battlefield");
    expect(power(game, giant)).toBe(4);
  });

  it("doesn't buff a flier that lost its abilities", () => {
    const game = makeGame();
    openWith(game, 2);
    game.debugSpawn("Alela, Artful Provocateur", A, "battlefield");
    const angel = game.debugSpawn("Serra Angel", A, "battlefield");
    expect(power(game, angel)).toBe(5);
    const frog = game.debugSpawn("Turn to Frog", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: frog,
      targets: [{ kind: "object", object: angel }],
    });
    settle(game);
    // A 1/1 Frog with no flying — and so no +1/+0.
    expect(game.characteristics(angel).keywords.has("flying")).toBe(false);
    expect(power(game, angel)).toBe(1);
  });

  it("Gravitational Shift's 'without flying' half skips a creature granted flying", () => {
    const game = makeGame();
    openWith(game, 1);
    game.debugSpawn("Gravitational Shift", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", B, "battlefield");
    expect(power(game, giant)).toBe(1); // 3 - 2
    const wings = game.debugSpawn("Cobbled Wings", B, "battlefield");
    game.state.objects[wings].attachedTo = giant;
    expect(power(game, giant)).toBe(5); // 3 + 2
  });

  it("a keyword-scoped keyword grant sees a granted keyword too (Sephara)", () => {
    const game = makeGame();
    openWith(game, 1);
    game.debugSpawn("Sephara, Sky's Blade", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", A, "battlefield");
    expect(game.characteristics(giant).keywords.has("indestructible")).toBe(false);
    game.debugSpawn("Levitation", A, "battlefield");
    expect(game.characteristics(giant).keywords.has("indestructible")).toBe(true);
  });
});

describe("Alela, Artful Provocateur", () => {
  it("doesn't buff herself, and only buffs her controller's fliers", () => {
    const game = makeGame();
    openWith(game, 1);
    const alela = game.debugSpawn("Alela, Artful Provocateur", A, "battlefield");
    const theirs = game.debugSpawn("Serra Angel", B, "battlefield");
    expect(power(game, alela)).toBe(2);
    expect(power(game, theirs)).toBe(4);
  });

  it("makes a Faerie for each artifact or enchantment spell, and buffs them", () => {
    const game = makeGame();
    openWith(game, 2);
    game.debugSpawn("Alela, Artful Provocateur", A, "battlefield");
    const wings = game.debugSpawn("Cobbled Wings", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: wings, targets: [] });
    settle(game);
    expect(faerieCount(game, A)).toBe(1);

    const giant = game.debugSpawn("Hill Giant", A, "battlefield");
    const aura = game.debugSpawn("Flight", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: aura,
      targets: [{ kind: "object", object: giant }],
    });
    settle(game);
    // A creature spell isn't an artifact or enchantment spell.
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] });
    settle(game);

    // The second Faerie folds into the first's object as a stack of two.
    const faeries = faeriesOf(game, A);
    expect(faerieCount(game, A)).toBe(2);
    for (const id of faeries) {
      expect(power(game, id)).toBe(2);
      expect(game.characteristics(id).toughness).toBe(1);
    }
  });

  it("buffs every token in a Faerie stack", () => {
    const game = makeGame();
    openWith(game, 1);
    game.debugSpawn("Alela, Artful Provocateur", A, "battlefield");
    const stack = game.debugSpawn("Faerie Token", A, "battlefield");
    game.state.objects[stack].isToken = true;
    game.state.objects[stack].stackCount = 12;
    expect(power(game, stack)).toBe(2);
    const view = game.viewFor(A);
    const shown = view.objects[stack];
    expect(shown?.power).toBe(2);
    expect(shown?.stackCount).toBe(12);
  });
});
