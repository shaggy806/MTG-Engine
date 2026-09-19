/**
 * "You may put a land card from your hand onto the battlefield" — a
 * `look-and-choose` over `zone: "hand"`.
 *
 * It sidesteps the land-drop rule entirely, which is the point of the whole
 * family: putting a land onto the battlefield is not *playing* one.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aCards: readonly string[]) => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    // maxLandsPerTurn 1 on purpose — the real rule, so a test that passes
    // can't be passing because land drops were unlimited.
    rules: { skipFirstDraw: false, maxLandsPerTurn: 1, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...aCards, ...Array(40).fill("Forest")] },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  return { game, a };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const handCard = (game: Game, name: string): ObjectId => {
  const id = game.handOf(A).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};

describe("Growth Spiral", () => {
  it("puts a land from hand onto the battlefield without using the land drop", () => {
    const { game, a } = mkGame(["Growth Spiral", "Island", "Island"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Island", A, "battlefield");
    // Spend the turn's one land drop first, so the only way a land can reach
    // the battlefield below is the spell itself.
    game.dispatch({ type: "play-land", player: A, card: handCard(game, "Island") });
    expect(game.state.players[A].landsPlayedThisTurn).toBe(1);

    const lands0 = game.battlefield.filter(
      (id) => game.state.objects[id].controller === A,
    ).length;
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_v, eligible) => {
      offered = eligible;
      return eligible.slice(0, 1);
    };

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, "Growth Spiral"),
      targets: [],
    });
    game.advanceUntil(quiet);

    // Only land cards were choosable, and the Spiral itself is gone.
    expect(offered.length).toBeGreaterThan(0);
    expect(
      offered.every((id) =>
        game.registry.get(game.state.objects[id].cardName).types.includes("land"),
      ),
    ).toBe(true);
    expect(
      game.battlefield.filter((id) => game.state.objects[id].controller === A).length,
    ).toBe(lands0 + 1);
    expect(game.state.players[A].landsPlayedThisTurn).toBe(1);
  });

  it("is optional — declining leaves the hand alone", () => {
    const { game, a } = mkGame(["Growth Spiral", "Island"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Island", A, "battlefield");
    a.chooseFromZoneFn = () => [];
    const before = game.battlefield.length;

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, "Growth Spiral"),
      targets: [],
    });
    game.advanceUntil(quiet);

    expect(game.battlefield.length).toBe(before);
    // The drawn card and the untaken Island are both still in hand.
    expect(game.handOf(A).some((id) => game.state.objects[id].cardName === "Island")).toBe(true);
  });
});

describe("Ghalta, Stampede Tyrant", () => {
  it("dumps any number of creature cards out of hand, and only creatures", () => {
    const { game, a } = mkGame([]);
    game.advanceUntil(toPrecombat);
    for (const name of ["Grizzly Bears", "Craw Wurm", "Island"]) {
      game.debugSpawn(name, A, "hand");
    }
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_v, eligible) => {
      offered = eligible;
      return [...eligible];
    };

    game.debugSpawn("Ghalta, Stampede Tyrant", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);

    expect(offered.map((id) => game.state.objects[id].cardName).sort()).toEqual(
      ["Craw Wurm", "Grizzly Bears"].sort(),
    );
    for (const name of ["Grizzly Bears", "Craw Wurm"]) {
      expect(game.battlefield.some((id) => game.state.objects[id].cardName === name)).toBe(true);
    }
    // The Island was never eligible and stayed put.
    expect(game.handOf(A).some((id) => game.state.objects[id].cardName === "Island")).toBe(true);
  });
});

describe("Terrain Generator", () => {
  it("puts a basic land in tapped", () => {
    const { game, a } = mkGame([]);
    game.advanceUntil(toPrecombat);
    const gen = game.debugSpawn("Terrain Generator", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    const island = game.debugSpawn("Island", A, "hand");
    // The opening hand is full of basics too, so name the one under test.
    a.chooseFromZoneFn = (_v, eligible) => eligible.filter((id) => id === island);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: gen,
      abilityIndex: 1,
      targets: [],
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[island].zone).toBe("battlefield");
    expect(game.state.objects[island].tapped).toBe(true);
  });
});

/**
 * `look-and-choose`'s `then`, which is what lets anything downstream refer to
 * the card that was *chosen* — it was never a target of the spell, so before
 * this there was no way to say "that creature gains haste" about it.
 */
describe("Sneak Attack", () => {
  it("cheats a creature in hasty, then sacrifices it at the next end step", () => {
    const { game, a } = mkGame([]);
    game.advanceUntil(toPrecombat);
    const sneak = game.debugSpawn("Sneak Attack", A, "battlefield");
    game.debugSpawn("Mountain", A, "battlefield");
    const wurm = game.debugSpawn("Craw Wurm", A, "hand");
    a.chooseFromZoneFn = (_v, eligible) => eligible.filter((id) => id === wurm);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: sneak,
      abilityIndex: 0,
      targets: [],
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[wurm].zone).toBe("battlefield");
    expect([
      ...computeCharacteristics(game.state, game.registry, wurm).keywords,
    ]).toContain("haste");
    expect(game.state.delayedTriggers).toHaveLength(1);

    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[wurm].zone).toBe("graveyard");
    expect(game.state.delayedTriggers).toHaveLength(0);
  });

  it("declining the choice sets up no delayed sacrifice", () => {
    const { game, a } = mkGame([]);
    game.advanceUntil(toPrecombat);
    const sneak = game.debugSpawn("Sneak Attack", A, "battlefield");
    game.debugSpawn("Mountain", A, "battlefield");
    game.debugSpawn("Craw Wurm", A, "hand");
    a.chooseFromZoneFn = () => [];

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: sneak,
      abilityIndex: 0,
      targets: [],
    });
    game.advanceUntil(quiet);

    expect(game.state.delayedTriggers).toHaveLength(0);
  });
});
