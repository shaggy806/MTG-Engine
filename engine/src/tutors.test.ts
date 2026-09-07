import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const spawn = (game: Game, cardName: string, controller: PlayerId): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
  game.state.objects[id] = {
    id, cardName, owner: controller, controller, zone: "battlefield",
    tapped: false, damageMarked: 0, markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0, summoningSick: false, loyaltyActivatedThisTurn: false, targets: null,
    attacking: null, blocking: null, blockedBy: [], blocked: false,
    kind: "card", abilityKind: null, sourceObjectId: null, abilityIndex: null,
    counters: {}, modifiers: [], timestamp: game.state.timestampSeq,
    isToken: false, attachedTo: null, isCommander: false, xValue: null,
    controlEndsAtCleanup: false, copyOf: null,
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const mkGame = (aLibrary: readonly string[]) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      // The tutor sits on top so it's in the opening hand; the rest is the
      // searchable library.
      { player: A, cards: [...aLibrary] },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};

describe("search-library — Demonic Tutor", () => {
  it("finds a chosen card, moves it to hand, and shuffles", () => {
    const { game, a } = mkGame([
      "Demonic Tutor",
      ...Array(6).fill("Swamp"),
      "Grizzly Bears",
      "Craw Wurm",
      ...Array(31).fill("Forest"),
    ]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Swamp", A);
    spawn(game, "Swamp", A);
    a.chooseFromZoneFn = (_v, eligible) => {
      // grab the Craw Wurm
      const wurm = eligible.find(
        (id) => game.state.objects[id].cardName === "Craw Wurm",
      );
      return wurm === undefined ? [] : [wurm];
    };

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Demonic Tutor"),
    });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    // the picker lists every card left in the library (search sees it all)
    expect(game.state.awaiting).toMatchObject({ kind: "choose-from-zone", min: 0, max: 1 });

    game.advanceUntil(settled);
    expect(game.handOf(A).some((id) => game.state.objects[id].cardName === "Craw Wurm")).toBe(
      true,
    );
    expect(
      game.state.zones.perPlayer[A].library.some(
        (id) => game.state.objects[id].cardName === "Craw Wurm",
      ),
    ).toBe(false);
    expect(game.eventsOfType("library-shuffled").some((e) => e.player === A)).toBe(true);
  });

  it("may whiff (choose nothing) and still shuffles", () => {
    const { game } = mkGame(["Demonic Tutor", ...Array(39).fill("Forest")]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Swamp", A);
    spawn(game, "Swamp", A);
    // ScriptedController default chooseFromZoneFn returns eligible.slice(0, min) = []

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Demonic Tutor"),
    });
    game.advanceUntil(settled);

    expect(game.eventsOfType("library-shuffled").some((e) => e.player === A)).toBe(true);
  });
});

describe("scry / surveil", () => {
  it("Preordain: scry 2 (bottom one), then draw", () => {
    const { game, a } = mkGame([
      "Preordain",
      ...Array(6).fill("Island"),
      "Grizzly Bears", // top of library after the turn-1 draw
      "Craw Wurm",
      "Elvish Visionary",
      ...Array(30).fill("Forest"),
    ]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Island", A);
    // library top is now [Craw Wurm, Elvish Visionary, ...] (Grizzly Bears drawn)
    const wurm = game.state.zones.perPlayer[A].library[0];
    a.chooseScryFn = (_v, cards) => [cards[0]]; // bottom the Craw Wurm

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Preordain"),
    });
    game.advanceUntil((s) => s.awaiting?.kind === "scry");
    expect(game.state.awaiting).toMatchObject({ kind: "scry", mode: "scry" });
    expect((game.state.awaiting as { cards: string[] }).cards).toHaveLength(2);

    game.advanceUntil(settled);
    // drew the Elvish Visionary (the card that was 2nd, now on top after Wurm bottomed)
    expect(
      game.handOf(A).some((id) => game.state.objects[id].cardName === "Elvish Visionary"),
    ).toBe(true);
    // the Craw Wurm is now on the bottom of the library
    const lib = game.state.zones.perPlayer[A].library;
    expect(lib[lib.length - 1]).toBe(wurm);
  });

  it("Consider: surveil 1 (to graveyard), then draw", () => {
    const { game, a } = mkGame([
      "Consider",
      ...Array(6).fill("Island"),
      "Grizzly Bears",
      "Craw Wurm",
      ...Array(31).fill("Forest"),
    ]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Island", A);
    const wurm = game.state.zones.perPlayer[A].library[0]; // top after the draw
    a.chooseScryFn = (_v, cards) => [cards[0]];
    const handBefore = game.handOf(A).length;

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Consider"),
    });
    game.advanceUntil(settled);

    expect(game.state.zones.perPlayer[A].graveyard).toContain(wurm);
    // Consider left the hand (-1), the surveilled card didn't come, then draw (+1)
    expect(game.handOf(A).length).toBe(handBefore - 1 + 1);
    expect(game.eventsOfType("scried").some((e) => e.mode === "surveil")).toBe(true);
  });

  it("keeping everything on top is a legal scry", () => {
    const { game } = mkGame(["Preordain", ...Array(39).fill("Island")]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Island", A);
    // ScriptedController default chooseScryFn returns []

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Preordain"),
    });
    game.advanceUntil(settled);
    expect(game.eventsOfType("scried").some((e) => e.movedAway === 0)).toBe(true);
  });
});

describe("search-library — Rampant Growth", () => {
  it("puts a basic land onto the battlefield tapped, and only basics are eligible", () => {
    const { game, a } = mkGame([
      "Rampant Growth",
      "Grizzly Bears",
      "Tranquil Thicket", // a nonbasic land — must NOT be eligible
      ...Array(20).fill("Forest"),
      ...Array(17).fill("Grizzly Bears"),
    ]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Forest", A);
    spawn(game, "Forest", A);
    const forestsBefore = new Set(
      game.battlefield.filter((id) => game.state.objects[id].cardName === "Forest"),
    );
    let seenEligible: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_v, eligible) => {
      seenEligible = eligible;
      return eligible.length > 0 ? [eligible[0]] : [];
    };

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Rampant Growth"),
    });
    game.advanceUntil(settled);

    // every eligible id is a basic Forest, never the Tranquil Thicket
    expect(seenEligible.length).toBeGreaterThan(0);
    for (const id of seenEligible) {
      expect(game.state.objects[id].cardName).toBe("Forest");
    }
    // the fetched Forest (the one not on the board before) entered tapped
    const fetched = game.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Forest" && !forestsBefore.has(id),
    );
    expect(fetched).toHaveLength(1);
    expect(game.state.objects[fetched[0]].tapped).toBe(true);
  });
});
