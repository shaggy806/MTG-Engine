/**
 * The "keywords" batch's cards — toxic (rule 702.164), casualty (702.153)
 * and additional upkeep steps (500.10) — each tested from its Oracle text.
 * The mechanics themselves are `toxic.test.ts`, `casualty.test.ts` and
 * `additional-upkeep-steps.test.ts`.
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
const C = asPlayerId("carol");
const registry = createDefaultRegistry();

const setUp = (aCards: readonly string[] = [], opts: { players?: 2 | 3 } = {}) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const c = new ScriptedController(C);
  const three = opts.players === 3;
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: three ? { [A]: a, [B]: b, [C]: c } : { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aCards, ...Array<string>(40).fill("Island")] },
      { player: B, cards: Array<string>(40).fill("Island") },
      ...(three ? [{ player: C, cards: Array<string>(40).fill("Island") }] : []),
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b, c };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const id = game.handOf(player).find((i) => game.state.objects[i].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const named = (game: Game, ids: readonly ObjectId[], name: string): number =>
  ids.filter((id) => game.state.objects[id].cardName === name).length;
const lands = (game: Game, player: PlayerId, name: string, n: number): ObjectId[] =>
  Array.from({ length: n }, () => game.debugSpawn(name, player, "battlefield"));
const poisonOf = (game: Game, player: PlayerId): number => game.state.players[player].counters.poison ?? 0;
const givePoison = (game: Game, amount: number): void => {
  game.debugApplyEffect(A, { kind: "add-player-counters", counter: "poison", amount, who: "each-opponent" });
  game.advanceUntil(quiet);
};
const attack = (game: Game, a: ScriptedController, attackers: readonly ObjectId[]): void => {
  a.declareAttackersFn = () => attackers.map((attacker) => ({ attacker, defender: B }));
  game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
};
/** `player` sacrifices their permanent named `name`, then the game settles. */
const sacrificeTheir = (game: Game, player: PlayerId, name: string): void => {
  const id = game.battlefield.find(
    (each) => game.state.objects[each].cardName === name && game.state.objects[each].controller === player,
  );
  if (id === undefined) throw new Error(`${player} has no ${name}`);
  game.debugApplyEffect(player, { kind: "sacrifice-target", target: 0 }, [{ kind: "object", object: id }]);
  game.advanceUntil(quiet);
};
const offersOf = (game: Game, player: PlayerId, source: ObjectId) =>
  game.legalActions(player).filter((x) => x.kind === "activate-ability" && x.source === source);

describe("Karumonix, the Rat King", () => {
  it("other Rats you control have toxic 1, on top of their own", () => {
    const { game } = setUp();
    const king = game.debugSpawn("Karumonix, the Rat King", A, "battlefield");
    const rat = game.debugSpawn("Blightbelly Rat", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirRat = game.debugSpawn("Blightbelly Rat", B, "battlefield");
    expect(game.characteristics(king).toxic).toBe(1);
    expect(game.characteristics(rat).toxic).toBe(2);
    expect(game.characteristics(bears).toxic).toBe(0);
    expect(game.characteristics(theirRat).toxic).toBe(1);
  });

  it("as it enters, puts any number of the top five's Rat cards into your hand and the rest on the bottom", () => {
    const { game, a } = setUp(["Karumonix, the Rat King"]);
    lands(game, A, "Swamp", 3);
    // The top five, top first: Rat, Island, Insect, Rat, Island.
    for (const name of ["Island", "Blightbelly Rat", "Bilious Skulldweller", "Island", "Blightbelly Rat"]) {
      game.debugSpawn(name, A, "library");
    }
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible;
      return eligible;
    };
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Karumonix, the Rat King"), targets: [] });
    game.advanceUntil(quiet);
    expect(offered.map((id) => game.state.objects[id].cardName)).toEqual(["Blightbelly Rat", "Blightbelly Rat"]);
    expect(named(game, game.handOf(A), "Blightbelly Rat")).toBe(2);
    const library = game.state.zones.perPlayer[A].library;
    expect(game.state.objects[library[0]].cardName).toBe("Island");
    expect(library.slice(-3).map((id) => game.state.objects[id].cardName).sort()).toEqual([
      "Bilious Skulldweller",
      "Island",
      "Island",
    ]);
  });
});

describe("Bloated Contaminator", () => {
  it("toxic 1, then proliferate when it deals combat damage to a player", () => {
    const { game, a } = setUp();
    const beast = game.debugSpawn("Bloated Contaminator", A, "battlefield", { summoningSick: false });
    attack(game, a, [beast]);
    // One poison counter from toxic, then one more from proliferate.
    expect(poisonOf(game, B)).toBe(2);
  });
});

describe("Blightbelly Rat", () => {
  it("proliferates when it dies", () => {
    const { game } = setUp();
    const rat = game.debugSpawn("Blightbelly Rat", A, "battlefield");
    givePoison(game, 1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: rat }]);
    game.advanceUntil(quiet);
    expect(poisonOf(game, B)).toBe(2);
  });
});

describe("Venerated Rotpriest", () => {
  it("whenever a spell targets a creature you control, the opponent you choose gets a poison counter", () => {
    const { game, b } = setUp(["Lightning Bolt"], { players: 3 });
    lands(game, A, "Mountain", 1);
    game.debugSpawn("Venerated Rotpriest", B, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    // Alice's spell did the targeting, but Bob names Carol.
    b.chooseTargetsFn = () => [{ kind: "player", player: C }];
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Lightning Bolt"),
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(quiet);
    expect(poisonOf(game, C)).toBe(1);
    expect(poisonOf(game, A)).toBe(0);
  });
});

describe("Mirrex", () => {
  it("taps for any colour only the turn it entered, and makes toxic Mites that can't block", () => {
    const { game } = setUp();
    const mirrex = game.debugSpawn("Mirrex", A, "battlefield");
    lands(game, A, "Island", 3);
    expect(offersOf(game, A, mirrex).some((o) => o.kind === "activate-ability" && o.abilityIndex === 1)).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: mirrex, abilityIndex: 2 });
    game.advanceUntil(quiet);
    const mite = game.battlefield.find((id) => game.state.objects[id].cardName === "Phyrexian Mite Token");
    expect(mite).toBeDefined();
    expect(game.characteristics(mite!).toxic).toBe(1);
    expect(game.characteristics(mite!).restrictions.has("cant-block")).toBe(true);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    const offers = offersOf(game, A, mirrex);
    expect(offers.some((o) => o.kind === "activate-ability" && o.abilityIndex === 0)).toBe(true);
    expect(offers.some((o) => o.kind === "activate-ability" && o.abilityIndex === 1)).toBe(false);
  });
});

describe("Contaminant Grafter", () => {
  it("proliferates once when creatures you control deal combat damage to players", () => {
    const { game, a } = setUp();
    const grafter = game.debugSpawn("Contaminant Grafter", A, "battlefield", { summoningSick: false });
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    attack(game, a, [grafter, bears]);
    // Toxic 1, then one proliferate however many creatures dealt damage.
    expect(poisonOf(game, B)).toBe(2);
  });

  it("corrupted: at your end step, draws a card and may put a land from your hand onto the battlefield", () => {
    const { game, a } = setUp();
    game.debugSpawn("Contaminant Grafter", A, "battlefield");
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    const landsBefore = (): number =>
      game.battlefield.filter((id) => game.state.objects[id].cardName === "Island").length;
    const before = landsBefore();
    const hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.step === "cleanup" || (s.turn.step === "end" && quiet(s)));
    // No opponent has three poison counters: nothing.
    expect(game.handOf(A).length).toBe(hand);
    expect(landsBefore()).toBe(before);

    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    givePoison(game, 3);
    const before3 = landsBefore();
    const hand3 = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.step === "end" && quiet(s));
    expect(game.handOf(A).length).toBe(hand3);
    expect(landsBefore()).toBe(before3 + 1);
  });
});

describe("Bloodroot Apothecary", () => {
  it("you and the target opponent each get a Treasure; an opponent sacrificing a noncreature token gets two poison", () => {
    const { game } = setUp(["Bloodroot Apothecary"]);
    lands(game, A, "Forest", 3);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Bloodroot Apothecary"), targets: [] });
    game.advanceUntil(quiet);
    const treasures = (player: PlayerId): number =>
      game.battlefield.filter(
        (id) => game.state.objects[id].cardName === "Treasure Token" && game.state.objects[id].controller === player,
      ).length;
    expect(treasures(A)).toBe(1);
    expect(treasures(B)).toBe(1);
    // Bob's Treasure: two poison for Bob. Alice's own: nothing.
    sacrificeTheir(game, B, "Treasure Token");
    expect(poisonOf(game, B)).toBe(2);
    sacrificeTheir(game, A, "Treasure Token");
    expect(poisonOf(game, A)).toBe(0);
    expect(poisonOf(game, B)).toBe(2);
  });

  it("an opponent's sacrificed creature token gives nothing", () => {
    const { game } = setUp();
    game.debugSpawn("Bloodroot Apothecary", A, "battlefield");
    game.debugApplyEffect(B, { kind: "create-token", token: "Soldier Token", count: 1 });
    sacrificeTheir(game, B, "Soldier Token");
    expect(game.battlefield.some((id) => game.state.objects[id].cardName === "Soldier Token")).toBe(false);
    expect(poisonOf(game, B)).toBe(0);
  });
});

describe("White Sun's Twilight", () => {
  it("X = 5: gain 5, five Mites, and every other creature is destroyed", () => {
    const { game } = setUp(["White Sun's Twilight"]);
    lands(game, A, "Plains", 7);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const life = game.state.players[A].life;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "White Sun's Twilight"), targets: [], xValue: 5 });
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(life + 5);
    expect(named(game, game.battlefield, "Phyrexian Mite Token")).toBe(5);
    expect(game.state.objects[bears].zone).not.toBe("battlefield");
    expect(game.state.objects[theirs].zone).not.toBe("battlefield");
  });

  it("X = 4: the creatures stay", () => {
    const { game } = setUp(["White Sun's Twilight"]);
    lands(game, A, "Plains", 6);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "White Sun's Twilight"), targets: [], xValue: 4 });
    game.advanceUntil(quiet);
    expect(named(game, game.battlefield, "Phyrexian Mite Token")).toBe(4);
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });
});
