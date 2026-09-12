import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { ObjectId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const mkGame = (players: readonly (typeof A)[] = [A, B]) => {
  const controllers = Object.fromEntries(
    players.map((p) => [p, new ScriptedController(p)]),
  );
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((p) => ({ player: p, cards: Array(40).fill("Forest") })),
  });
  return game;
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0;
const firstHandLand = (game: Game): ObjectId => {
  const id = game.handOf(A).find((c) => game.state.objects[c].cardName === "Forest");
  if (id === undefined) throw new Error("no land in hand");
  return id;
};

describe("Tireless Provisioner — landfall create-token (modal)", () => {
  it("offers Food-or-Treasure on a land drop and mints the chosen token", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Tireless Provisioner", A, "battlefield");

    game.dispatch({ type: "play-land", player: A, card: firstHandLand(game) });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    expect(game.state.awaiting).toMatchObject({ kind: "choose-modes", player: A });

    game.dispatch({ type: "choose-modes", player: A, modes: [1] }); // Treasure
    game.advanceUntil(quiet);

    const treasures = game.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Treasure Token",
    );
    expect(treasures).toHaveLength(1);
    expect(game.state.objects[treasures[0]].isToken).toBe(true);
    expect(
      game.battlefield.some((id) => game.state.objects[id].cardName === "Food Token"),
    ).toBe(false);
  });
});

describe("Lotus Cobra — landfall add one mana of any color", () => {
  it("adds mana of the chosen colour to the pool", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Lotus Cobra", A, "battlefield");

    game.dispatch({ type: "play-land", player: A, card: firstHandLand(game) });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [3] }); // Add {R}
    game.advanceUntil(quiet);

    expect(game.state.players[A].manaPool.R).toBe(1);
    expect(game.state.players[A].manaPool.G).toBe(0);
  });
});

describe("Iridescent Vinelasher — landfall ping to an opponent", () => {
  it("deals 1 to the sole opponent with no decision (forced target)", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Iridescent Vinelasher", A, "battlefield");
    const bLife = game.state.players[B].life;

    game.dispatch({ type: "play-land", player: A, card: firstHandLand(game) });
    game.advanceUntil(quiet);

    expect(game.state.players[B].life).toBe(bLife - 1);
  });

  it("raises a choose-targets decision when there are two opponents", () => {
    const game = mkGame([A, B, C]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Iridescent Vinelasher", A, "battlefield");

    game.dispatch({ type: "play-land", player: A, card: firstHandLand(game) });
    game.advanceUntil((s) => s.awaiting !== null);
    expect(game.state.awaiting).toMatchObject({ kind: "choose-targets", source: expect.anything() });
    const opts = (game.state.awaiting as { options: readonly (readonly unknown[])[] }).options[0];
    // both opponents are offered, alice herself is not
    expect(opts).toHaveLength(2);
  });
});

// needed-cards P16 — a new EffectSpec "damage" `who` scope (untargeted,
// mirroring `lose-life`), instead of always needing a chosen target.
describe("Sabotender — landfall damage to each opponent (untargeted)", () => {
  it("hits every opponent in a multiplayer game, not just one", () => {
    const game = mkGame([A, B, C]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Sabotender", A, "battlefield");
    const bLife = game.state.players[B].life;
    const cLife = game.state.players[C].life;

    game.dispatch({ type: "play-land", player: A, card: firstHandLand(game) });
    game.advanceUntil(quiet);

    expect(game.state.players[B].life).toBe(bLife - 1);
    expect(game.state.players[C].life).toBe(cLife - 1);
    expect(game.state.players[A].life).toBe(20); // not itself
  });
});

describe("Tannuk, Memorial Ensign — landfall damage to each opponent", () => {
  it("deals 1 to the sole opponent on a land drop", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Tannuk, Memorial Ensign", A, "battlefield");
    const bLife = game.state.players[B].life;

    game.dispatch({ type: "play-land", player: A, card: firstHandLand(game) });
    game.advanceUntil(quiet);

    expect(game.state.players[B].life).toBe(bLife - 1);
  });
});

// needed-cards P16 — no new vocab: a landfall create-token trigger, and the
// token's own "may mill" attack trigger, were already shipped.
describe("Mole Man, Moloid Master — landfall creates a Moloid", () => {
  it("mints a 1/1 green Minion named Moloid on a land drop", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Mole Man, Moloid Master", A, "battlefield");

    game.dispatch({ type: "play-land", player: A, card: firstHandLand(game) });
    game.advanceUntil(quiet);

    const moloid = game.battlefield.find((id) => game.state.objects[id].cardName === "Moloid");
    expect(moloid).toBeDefined();
    expect(game.state.objects[moloid!].isToken).toBe(true);
    expect(game.characteristics(moloid!)).toMatchObject({ power: 1, toughness: 1 });
  });
});

// needed-cards P16 — search-library was already shipped; "return-to-hand"
// widened to accept `target: "source"` so it can bounce the effect's own
// permanent with no target at all.
describe("Encroaching Dragonstorm — searches on ETB, bounces itself on a Dragon ETB", () => {
  it("finds two basics, then returns itself to hand when a Dragon enters", () => {
    const a = new ScriptedController(A);
    a.chooseFromZoneFn = (_v, eligible, _min, max) => eligible.slice(0, max);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: a, [B]: new ScriptedController(B) },
      decks: [
        { player: A, cards: Array(40).fill("Forest") },
        { player: B, cards: Array(40).fill("Forest") },
      ],
    });
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 10; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const dragonstorm = game.debugSpawn("Encroaching Dragonstorm", A, "hand");
    const dragon = game.debugSpawn("Mossback Dragon", A, "hand");
    const libraryBefore = game.libraryOf(A).length;

    game.dispatch({ type: "cast-spell", player: A, card: dragonstorm });
    game.advanceUntil(quiet);

    expect(game.state.objects[dragonstorm].zone).toBe("battlefield");
    expect(game.libraryOf(A).length).toBe(libraryBefore - 2);

    game.dispatch({ type: "cast-spell", player: A, card: dragon });
    game.advanceUntil(quiet);

    expect(game.state.objects[dragonstorm].zone).toBe("hand");
  });
});

describe("Rydia, Summoner of Mist — landfall loot", () => {
  it("discards then draws when the player accepts", () => {
    const a = new ScriptedController(A);
    const b = new ScriptedController(B);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: a, [B]: b },
      decks: [
        { player: A, cards: Array(40).fill("Forest") },
        { player: B, cards: Array(40).fill("Forest") },
      ],
    });
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Rydia, Summoner of Mist", A, "battlefield");
    const before = game.eventsOfType("card-drawn").filter((e) => e.player === A).length;

    game.dispatch({ type: "play-land", player: A, card: firstHandLand(game) });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);

    expect(game.eventsOfType("card-drawn").filter((e) => e.player === A).length).toBe(before + 1);
    expect(game.eventsOfType("cards-discarded").some((e) => e.player === A)).toBe(true);
  });
});
