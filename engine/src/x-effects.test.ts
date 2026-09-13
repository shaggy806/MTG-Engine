import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { ObjectId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aHand: readonly string[], aLibrary: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...aLibrary, ...Array(40).fill("Forest")] },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};

describe("Kessig Wolf Run — {X} activated ability pumps power", () => {
  it("gives target creature +X/+0 until end of turn", () => {
    const { game } = mkGame(["Kessig Wolf Run"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Kessig Wolf Run", A, "battlefield"); // enters tapped, but debugSpawn skips that
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    for (let i = 0; i < 5; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    const land = game.battlefield.find(
      (id) => game.state.objects[id].cardName === "Kessig Wolf Run",
    )!;
    game.state.objects[land].tapped = false;

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: land,
      abilityIndex: 1,
      targets: [{ kind: "object", object: bear }],
      xValue: 3,
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[bear].modifiers).toContainEqual(
      expect.objectContaining({ power: 3, toughness: 0 }),
    );
  });
});

describe("Gaze of Granite — destroys each nonland permanent with mana value X or less", () => {
  it("spares creatures above the threshold, and spares lands entirely", () => {
    const { game } = mkGame(["Gaze of Granite"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Swamp", A, "battlefield");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", B, "battlefield"); // mv 2
    const wurm = game.debugSpawn("Craw Wurm", B, "battlefield"); // mv 5
    const land = game.debugSpawn("Island", B, "battlefield"); // mv 0, but a land

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Gaze of Granite"),
      targets: [],
      xValue: 3,
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.state.objects[wurm].zone).toBe("battlefield");
    expect(game.state.objects[land].zone).toBe("battlefield");
  });
});

// needed-cards P13 — a new CardFilter.notKeyword, plus a plain sequence of
// two damage-all sweeps (creatures-without-flying, then planeswalkers)
// rather than one filter matching either.
describe("Magmaquake — X damage to each non-flying creature and each planeswalker", () => {
  it("spares a flyer, kills a grounded creature, and drains a planeswalker's loyalty", () => {
    const { game } = mkGame(["Magmaquake"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 6; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", B, "battlefield"); // 2/2, no flying
    const specter = game.debugSpawn("Hypnotic Specter", B, "battlefield"); // 2/2 flying
    const chandra = game.debugSpawn("Chandra, Acolyte of Flame", B, "battlefield"); // loyalty 4

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Magmaquake"),
      targets: [],
      xValue: 2,
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.state.objects[specter].zone).toBe("battlefield");
    expect(game.state.objects[specter].damageMarked).toBe(0);
    expect(game.state.objects[chandra].counters.loyalty).toBe(2);
  });
});

describe("Finale of Devastation — tutors a creature onto the battlefield, Ferocious reduces its cost", () => {
  it("finds a creature with mana value X or less and puts it onto the battlefield", () => {
    const { game, a } = mkGame(
      ["Finale of Devastation", ...Array(6).fill("Plains")],
      // A buffer card absorbs the turn-1 draw (skipFirstDraw is off in
      // `mkGame`) so the two searchable creatures stay in the library.
      ["Plains", "Grizzly Bears", "Craw Wurm"],
    );
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 6; i += 1) game.debugSpawn("Forest", A, "battlefield");
    a.chooseFromZoneFn = (_v, eligible, _min, max) => eligible.slice(0, max);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Finale of Devastation"),
      targets: [],
      xValue: 2,
    });
    game.advanceUntil(quiet);

    expect(
      game.battlefield.some(
        (id) => game.state.objects[id].cardName === "Grizzly Bears" && game.state.objects[id].controller === A,
      ),
    ).toBe(true);
    expect(
      game.battlefield.some((id) => game.state.objects[id].cardName === "Craw Wurm"),
    ).toBe(false);
  });

  it("costs {2} less with a power-4+ creature already in play (Ferocious)", () => {
    const { game } = mkGame(["Finale of Devastation"], ["Grizzly Bears"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Craw Wurm", A, "battlefield"); // 6/4
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Forest", A, "battlefield");

    // {X}{G}{G} with X=1 costs 1 generic + {G}{G} = 3 mana normally — only 2
    // Forests are in play, so this only goes through with Ferocious's {2} off.
    const card = named(game, game.handOf(A), "Finale of Devastation");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      targets: [],
      xValue: 1,
    });
    game.advanceUntil(quiet);

    expect(game.handOf(A)).not.toContain(card);
  });
});
