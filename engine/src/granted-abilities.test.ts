import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const spawn = (
  game: Game,
  cardName: string,
  controller: PlayerId,
  opts: { sick?: boolean } = {},
): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
  game.state.objects[id] = {
    id, cardName, owner: controller, controller, zone: "battlefield",
    tapped: false, damageMarked: 0, markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0, summoningSick: opts.sick ?? false, loyaltyActivatedThisTurn: false, targets: null,
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
const onBattlefield = (game: Game, name: string): boolean =>
  game.battlefield.some((id) => game.state.objects[id].cardName === name);
const canCast = (game: Game, name: string): boolean =>
  game.legalActions(A).some((x) => x.kind === "cast-spell" && x.cardName === name);

describe("Cryptolith Rite — grants a mana ability to creatures you control", () => {
  it("lets a non-sick creature tap for any colour", () => {
    // Deck is all Forest, so {W} is otherwise unpayable.
    const { game } = mkGame(["Soul Warden", ...Array(39).fill("Forest")]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Cryptolith Rite", A);
    const bear = spawn(game, "Grizzly Bears", A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Soul Warden"),
    });
    game.advanceUntil(settled);

    expect(game.state.objects[bear].tapped).toBe(true);
    expect(onBattlefield(game, "Soul Warden")).toBe(true);
  });

  it("does not help a summoning-sick creature", () => {
    const { game } = mkGame(["Soul Warden", ...Array(39).fill("Forest")]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Cryptolith Rite", A);
    spawn(game, "Grizzly Bears", A, { sick: true });

    expect(canCast(game, "Soul Warden")).toBe(false);
    expect(
      game.legalActions(A).some((x) => x.kind === "activate-ability"),
    ).toBe(false);
  });
});

describe("Chromatic Lantern — grants a mana ability to lands you control", () => {
  it("lets a Forest tap for a colour it never could", () => {
    const { game } = mkGame(["Soul Warden", ...Array(39).fill("Forest")]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Chromatic Lantern", A);
    const forest = spawn(game, "Forest", A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Soul Warden"),
    });
    game.advanceUntil(settled);

    expect(game.state.objects[forest].tapped).toBe(true);
    expect(onBattlefield(game, "Soul Warden")).toBe(true);
  });

  it("a granted mana ability is an alternative, not extra — one mana per tap", () => {
    // Cryptolith Rite (an enchantment, so no mana of its own) grants a
    // Llanowar Elves "{T}: Add any colour". The Elves already had "{T}: Add
    // {G}" — so it now has two {T} abilities, but a single tap still makes
    // exactly one mana. One Elves can't pay {W}{W}; two can.
    const { game } = mkGame(["White Knight", ...Array(39).fill("Forest")]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Cryptolith Rite", A);
    spawn(game, "Llanowar Elves", A);
    expect(canCast(game, "White Knight")).toBe(false);

    spawn(game, "Llanowar Elves", A);
    expect(canCast(game, "White Knight")).toBe(true);
  });

  it("the Lantern itself taps for any colour", () => {
    const { game } = mkGame(["Soul Warden", ...Array(39).fill("Forest")]);
    game.advanceUntil(toPrecombat);
    const lantern = spawn(game, "Chromatic Lantern", A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Soul Warden"),
    });
    game.advanceUntil(settled);

    expect(game.state.objects[lantern].tapped).toBe(true);
    expect(onBattlefield(game, "Soul Warden")).toBe(true);
  });
});

describe("Evolving Wilds — a fetchland (tap, sacrifice, search)", () => {
  it("sacrifices itself and fetches a basic land tapped", () => {
    const { game, a } = mkGame([
      "Grizzly Bears",
      ...Array(20).fill("Forest"),
      "Tranquil Thicket", // a nonbasic land — never eligible
      ...Array(18).fill("Grizzly Bears"),
    ]);
    game.advanceUntil(toPrecombat);
    const wilds = spawn(game, "Evolving Wilds", A);
    let seen: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_v, eligible) => {
      seen = eligible;
      return eligible.length > 0 ? [eligible[0]] : [];
    };
    const forestsBefore = new Set(
      game.battlefield.filter((id) => game.state.objects[id].cardName === "Forest"),
    );

    game.dispatch({ type: "activate-ability", player: A, source: wilds, abilityIndex: 0 });
    game.advanceUntil(settled);

    expect(game.state.objects[wilds].zone).toBe("graveyard");
    for (const id of seen) {
      expect(game.state.objects[id].cardName).toBe("Forest");
    }
    const fetched = game.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Forest" && !forestsBefore.has(id),
    );
    expect(fetched).toHaveLength(1);
    expect(game.state.objects[fetched[0]].tapped).toBe(true);
    expect(game.eventsOfType("library-shuffled").some((e) => e.player === A)).toBe(true);
  });

  it("may whiff and still sacrifices + shuffles", () => {
    const { game } = mkGame(Array(40).fill("Grizzly Bears"));
    game.advanceUntil(toPrecombat);
    const wilds = spawn(game, "Evolving Wilds", A);
    // default chooseFromZoneFn returns [] (min 0)

    game.dispatch({ type: "activate-ability", player: A, source: wilds, abilityIndex: 0 });
    game.advanceUntil(settled);

    expect(game.state.objects[wilds].zone).toBe("graveyard");
    expect(game.eventsOfType("library-shuffled").some((e) => e.player === A)).toBe(true);
  });
});
