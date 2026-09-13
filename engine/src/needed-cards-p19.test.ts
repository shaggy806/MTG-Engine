/**
 * needed-cards P19 — four small, precedented vocab widenings found while
 * following up on the P18 `neededCards.txt` audit, each unblocking one card:
 * `selfCostReduction.reduceGeneric` accepts a live count (mirroring P16's
 * `costModification.reduceGeneric`) for Blasphemous Act; `look-and-choose`
 * gained a `leftover: "hand"` variant, and a new `exileOnResolve` field lets
 * a spell exile itself after resolving unconditionally, for Genesis
 * Ultimatum; the resolution-time `may` effect gained `then`/`else` tails
 * (mirroring `sacrifice-source.then`), and `lose-life` gained a targeted
 * `target` form (mirroring `damage`'s `target`/`who` split), for Ob Nixilis,
 * the Fallen; and `ActivatedAbility` gained a `condition` gate (mirroring
 * `StaticAbility`/`TriggeredAbility`'s), for Fanatic of Rhonas's Ferocious
 * mana ability (Eternalize remains unmodeled and is dropped, documented in
 * the card file).
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import { asPlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A;
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const cast = (game: Game, player: PlayerId, name: string): void => {
  game.dispatch({ type: "cast-spell", player, card: named(game, game.handOf(player), name) });
};
const playLand = (game: Game, player: PlayerId, name: string): void => {
  game.dispatch({ type: "play-land", player, card: named(game, game.handOf(player), name) });
};

const makeGame = (aCards: readonly string[], bCards: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad(bCards) },
    ],
  });
  game.advanceUntil(toPrecombat);
  return { game, a, b };
};

describe("Blasphemous Act", () => {
  it("costs {1} less per creature on the battlefield, for anyone", () => {
    const { game } = makeGame(["Blasphemous Act"]);
    game.debugSpawn("Grizzly Bears", A);
    game.debugSpawn("Grizzly Bears", B);
    // {8}{R} - 2 (two creatures, either controller) = {6}{R} = 7 mana. If the
    // reduction didn't apply, casting this would throw for lack of mana.
    for (let i = 0; i < 7; i += 1) game.debugSpawn("Mountain", A);

    cast(game, A, "Blasphemous Act");
    game.advanceUntil(settled);

    expect(game.battlefield.filter((id) => game.state.objects[id].cardName === "Grizzly Bears")).toHaveLength(0);
  });
});

describe("Genesis Ultimatum", () => {
  it("puts chosen permanents onto the battlefield, the rest to hand, and exiles itself", () => {
    const { game, a } = makeGame(["Genesis Ultimatum"]);
    // Library order: unshift puts each new card on top, so spawn top-to-bottom
    // in reverse — the last call ends up as the actual top card.
    for (const name of ["Giant Growth", "Naturalize", "Forest", "Elvish Visionary", "Grizzly Bears"]) {
      game.debugSpawn(name, A, "library");
    }
    // {G}{G}{U}{U}{U}{R}{R} = 7 mana.
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Forest", A);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Island", A);
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Mountain", A);

    a.chooseFromZoneFn = (_v, eligible) => eligible; // take every permanent offered
    cast(game, A, "Genesis Ultimatum");
    game.advanceUntil(settled);

    for (const permanent of ["Grizzly Bears", "Elvish Visionary"]) {
      expect(game.battlefield.some((id) => game.state.objects[id].cardName === permanent)).toBe(true);
    }
    const hand = game.handOf(A);
    for (const nonPermanent of ["Giant Growth", "Naturalize"]) {
      expect(hand.some((id) => game.state.objects[id].cardName === nonPermanent)).toBe(true);
    }
    const spell = named(game, [...game.state.zones.shared.exile], "Genesis Ultimatum");
    expect(game.state.objects[spell]?.zone).toBe("exile");
  });
});

describe("Ob Nixilis, the Fallen", () => {
  const setup = () => {
    const { game, a } = makeGame(["Forest"]);
    const nixilis = game.debugSpawn("Ob Nixilis, the Fallen", A, "battlefield", { summoningSick: false });
    a.chooseTargetsFn = (_v, _source, _specs, legalOptions) => [
      legalOptions[0].find((ref) => ref.kind === "player" && ref.player === B)!,
    ];
    return { game, a, nixilis };
  };

  it("landfall: accepting drains 3 and grows three +1/+1 counters", () => {
    const { game, a, nixilis } = setup();
    a.chooseModesFn = () => [0]; // accept the "you may"

    playLand(game, A, "Forest");
    game.advanceUntil(settled);

    expect(game.state.players[B].life).toBe(17);
    expect(game.state.objects[nixilis]?.counters["+1/+1"]).toBe(3);
  });

  it("landfall: declining does neither", () => {
    const { game, a, nixilis } = setup();
    a.chooseModesFn = () => []; // decline

    playLand(game, A, "Forest");
    game.advanceUntil(settled);

    expect(game.state.players[B].life).toBe(20);
    expect(game.state.objects[nixilis]?.counters["+1/+1"] ?? 0).toBe(0);
  });
});

describe("Fanatic of Rhonas", () => {
  it("Ferocious mana ability is unavailable without a power-4+ creature, available with one", () => {
    const { game } = makeGame([]);
    const fanatic = game.debugSpawn("Fanatic of Rhonas", A, "battlefield", { summoningSick: false });

    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: fanatic, abilityIndex: 1 }),
    ).toThrow();

    game.debugSpawn("Craw Wurm", A); // 6/4
    game.dispatch({ type: "activate-ability", player: A, source: fanatic, abilityIndex: 1 });
    expect(game.state.players[A].manaPool.G).toBe(4);
  });
});
