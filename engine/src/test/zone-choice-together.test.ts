/**
 * A search whose finds must obey a rule *as a set* — `search-library`'s
 * `together`, carried on the `choose-from-zone` decision:
 *
 * - `share: "land-type"` (Myriad Landscape's "up to two basic land cards that
 *   share a land type"): a Forest and an Island can't be found together; one
 *   card alone always can (the card's ruling).
 * - `oneEach` (Krosan Verge's "a Forest card and a Plains card"): one find
 *   per slot, a card that fits both slots filling either, and either slot
 *   may be missed (rule 701.19b).
 *
 * The decision offers every card the search's filter admits and rejects a
 * set that breaks the rule; the bots' answers are turned into legal sets;
 * and which land types each library card has is the searcher's to see.
 */

import { describe, expect, it } from "vitest";

import { EvalBotController } from "../bot/eval-bot.js";
import { HeuristicBotController, RandomController } from "../controller.js";
import type { PlayerController } from "../controller.js";
import { chooseFromZone } from "../decisions/choose-from-zone.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { LegalAction } from "../actions.js";
import { completeTogether, fitsTogether, togetherViolation } from "../zone-choice-together.js";
import type { ZoneChoiceTogether } from "../zone-choice-together.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const LIBRARY = [
  ...Array<string>(8).fill("Grizzly Bears"),
  "Forest",
  "Forest",
  "Island",
  "Island",
  "Wastes",
  "Snow-Covered Forest",
  "Plains",
  "Temple Garden",
  "Dryad Arbor",
  ...Array<string>(20).fill("Grizzly Bears"),
];

/** Alice's main phase with `land` and two untapped Swamps to pay its {2}. */
const setUp = (land: string): { game: Game; land: ObjectId } => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: LIBRARY },
      { player: B, cards: Array<string>(40).fill("Swamp") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  const id = game.debugSpawn(land, A, "battlefield");
  game.state.objects[id].tapped = false;
  for (let i = 0; i < 2; i += 1) {
    const swamp = game.debugSpawn("Swamp", A, "battlefield");
    game.state.objects[swamp].tapped = false;
  }
  return { game, land: id };
};

/** Crack it and stop at the search. */
const search = (game: Game, land: ObjectId) => {
  game.dispatch({ type: "activate-ability", player: A, source: land, abilityIndex: 1 });
  game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || s.result.over);
  const awaiting = game.state.awaiting;
  if (awaiting?.kind !== "choose-from-zone") throw new Error("no search");
  return awaiting;
};

const inLibrary = (game: Game, name: string): ObjectId[] =>
  game.state.zones.perPlayer[A].library.filter((id) => game.state.objects[id].cardName === name);

const choose = (game: Game, chosen: readonly ObjectId[]) =>
  game.dispatch({ type: "choose-from-zone", player: A, chosen });

describe("Myriad Landscape: finds that share a land type", () => {
  it("offers every basic land card, and the set rule with it", () => {
    const { game, land } = setUp("Myriad Landscape");
    const awaiting = search(game, land);
    const names = awaiting.eligible.map((id) => game.state.objects[id].cardName).sort();
    // Temple Garden and Dryad Arbor aren't basic; Plains, Wastes and the
    // snow Forest are.
    expect(names).toEqual(
      ["Forest", "Forest", "Island", "Island", "Plains", "Snow-Covered Forest", "Wastes"].sort(),
    );
    expect(awaiting.max).toBe(2);
    expect(awaiting.together?.rule).toBe("share");
    const offer = game.legalActions(A).find((a) => a.kind === "choose-from-zone");
    expect(offer?.kind === "choose-from-zone" ? offer.together?.text : undefined).toBe(
      "that share a land type",
    );
  });

  it("rejects a Forest and an Island, and a Wastes with anything", () => {
    const { game, land } = setUp("Myriad Landscape");
    search(game, land);
    const [forest] = inLibrary(game, "Forest");
    const [island] = inLibrary(game, "Island");
    const [wastes] = inLibrary(game, "Wastes");
    expect(() => choose(game, [forest, island])).toThrow(/share a land type/);
    expect(() => choose(game, [wastes, forest])).toThrow(/share a land type/);
    expect(game.state.awaiting?.kind).toBe("choose-from-zone");
  });

  it("puts two Forests — a snow one among them — onto the battlefield tapped, then shuffles", () => {
    const { game, land } = setUp("Myriad Landscape");
    search(game, land);
    const [forest] = inLibrary(game, "Forest");
    const [snow] = inLibrary(game, "Snow-Covered Forest");
    const libraryBefore = game.state.zones.perPlayer[A].library.length;
    choose(game, [forest, snow]);

    const battlefield = game.state.zones.shared.battlefield;
    expect(battlefield).toContain(forest);
    expect(battlefield).toContain(snow);
    expect(game.state.objects[forest].tapped).toBe(true);
    expect(game.state.objects[snow].tapped).toBe(true);
    expect(game.state.zones.perPlayer[A].library.length).toBe(libraryBefore - 2);
    expect(battlefield).not.toContain(land);
    expect(game.state.zones.perPlayer[A].graveyard).toContain(land);
  });

  it("finds one card alone — even a Wastes, which has no land type — or none", () => {
    for (const pick of ["Wastes", "Island", null] as const) {
      const { game, land } = setUp("Myriad Landscape");
      search(game, land);
      const chosen = pick === null ? [] : [inLibrary(game, pick)[0]];
      choose(game, chosen);
      expect(game.state.awaiting).toBeNull();
      for (const id of chosen) expect(game.state.zones.shared.battlefield).toContain(id);
    }
  });

  it("shows the land types only to the searcher", () => {
    const { game, land } = setUp("Myriad Landscape");
    search(game, land);
    const [island] = inLibrary(game, "Island");
    const mine = game.viewFor(A).awaiting;
    const theirs = game.viewFor(B).awaiting;
    expect(mine?.kind === "choose-from-zone" ? mine.together?.tags[island] : undefined).toEqual(["Island"]);
    expect(theirs?.kind === "choose-from-zone" ? theirs.together?.tags : undefined).toEqual({});
  });
});

describe("Krosan Verge: a Forest card and a Plains card", () => {
  it("offers every Forest or Plains card, basic or not, at most two", () => {
    const { game, land } = setUp("Krosan Verge");
    const awaiting = search(game, land);
    const names = awaiting.eligible.map((id) => game.state.objects[id].cardName).sort();
    expect(names).toEqual(
      ["Dryad Arbor", "Forest", "Forest", "Plains", "Snow-Covered Forest", "Temple Garden"].sort(),
    );
    expect(awaiting.max).toBe(2);
    expect(awaiting.together?.text).toBe("a Forest card and a Plains card");
  });

  it("takes a Forest and a Plains, together and tapped", () => {
    const { game, land } = setUp("Krosan Verge");
    search(game, land);
    const [forest] = inLibrary(game, "Forest");
    const [plains] = inLibrary(game, "Plains");
    choose(game, [forest, plains]);
    for (const id of [forest, plains]) {
      expect(game.state.zones.shared.battlefield).toContain(id);
      expect(game.state.objects[id].tapped).toBe(true);
    }
  });

  it("rejects two Forests, but a Forest Plains fills the Plains slot beside a Forest", () => {
    const { game, land } = setUp("Krosan Verge");
    search(game, land);
    const [forest, other] = inLibrary(game, "Forest");
    const [garden] = inLibrary(game, "Temple Garden");
    expect(() => choose(game, [forest, other])).toThrow(/a Forest card and a Plains card/);
    choose(game, [garden, forest]);
    expect(game.state.zones.shared.battlefield).toContain(garden);
    expect(game.state.zones.shared.battlefield).toContain(forest);
  });

  it("may find only one of the two (rule 701.19b)", () => {
    const { game, land } = setUp("Krosan Verge");
    search(game, land);
    const [plains] = inLibrary(game, "Plains");
    choose(game, [plains]);
    expect(game.state.zones.shared.battlefield).toContain(plains);
  });
});

describe("the set rule, and the bots' answers", () => {
  const ids = (...names: string[]) => names as unknown as ObjectId[];
  const share: ZoneChoiceTogether = {
    rule: "share",
    tags: { f1: ["Forest"], f2: ["Forest"], i1: ["Island"], w: [], dual: ["Forest", "Island"] },
    text: "that share a land type",
  };
  const oneEach: ZoneChoiceTogether = {
    rule: "one-each",
    tags: { f1: ["0"], f2: ["0"], p1: ["1"], dual: ["0", "1"] },
    text: "a Forest card and a Plains card",
  };

  it("checks a set", () => {
    expect(fitsTogether(share, ids("f1", "f2"))).toBe(true);
    expect(fitsTogether(share, ids("f1", "i1"))).toBe(false);
    expect(fitsTogether(share, ids("dual", "i1"))).toBe(true);
    expect(fitsTogether(share, ids("w"))).toBe(true);
    expect(fitsTogether(share, ids("w", "f1"))).toBe(false);
    expect(fitsTogether(oneEach, ids("f1", "p1"))).toBe(true);
    expect(fitsTogether(oneEach, ids("f1", "f2"))).toBe(false);
    expect(fitsTogether(oneEach, ids("dual", "f1"))).toBe(true);
    expect(fitsTogether(oneEach, ids("dual", "dual2"))).toBe(false);
    expect(togetherViolation(share, ids("f1", "f2"))).toBeNull();
  });

  it("turns a pick that breaks it into the nearest one that doesn't", () => {
    const eligible = ids("f1", "i1", "f2", "w", "dual");
    // Keeps the first pick, drops the Island, tops up with the other Forest.
    expect(completeTogether(share, ids("f1", "i1"), eligible, 0, 2)).toEqual(ids("f1", "f2"));
    // Never adds a card past the number the chooser wanted.
    expect(completeTogether(share, ids("i1"), eligible, 0, 2)).toEqual(ids("i1"));
    expect(completeTogether(oneEach, ids("f1", "f2"), ids("f1", "f2", "p1"), 0, 2)).toEqual(ids("f1", "p1"));
  });

  it("enumerates only legal sets for the eval bot, and draws only legal ones at random", () => {
    const legal: Extract<LegalAction, { kind: "choose-from-zone" }> = {
      kind: "choose-from-zone",
      ids: ids("f1", "i1", "f2", "w", "dual"),
      eligible: ids("f1", "i1", "f2", "w", "dual"),
      min: 0,
      max: 2,
      destination: "battlefield",
      together: share,
    };
    const candidates = chooseFromZone.candidates!(legal, A, 50, {
      order: (list) => list,
      controllerOf: () => undefined,
    });
    expect(candidates.length).toBeGreaterThan(0);
    for (const action of candidates) {
      if (action.type !== "choose-from-zone") throw new Error("not a choice");
      expect(fitsTogether(share, action.chosen)).toBe(true);
    }
    // f1+f2, f1+dual, i1+dual, f2+dual: four pairs, five singletons, none.
    expect(candidates.length).toBe(1 + 5 + 4);

    let seed = 7;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 200; i += 1) {
      const action = chooseFromZone.randomAnswer!(legal, A, {
        random,
        pickIndex: (n: number) => Math.floor(random() * n),
      } as never);
      if (action.type !== "choose-from-zone") throw new Error("not a choice");
      expect(fitsTogether(share, action.chosen)).toBe(true);
    }
  });

  it("asks a controller for cards one at a time, then makes its pick legal", () => {
    const { game, land } = setUp("Myriad Landscape");
    const awaiting = search(game, land);
    const [forest, other] = inLibrary(game, "Forest");
    const [island] = inLibrary(game, "Island");
    const naive = { chooseFromZone: () => [forest, island] } as unknown as PlayerController;
    const action = chooseFromZone.ask(naive, game.controllerView(A), awaiting, A);
    expect(action.type === "choose-from-zone" ? action.chosen : []).toEqual([forest, other]);
    expect(() => game.dispatch(action)).not.toThrow();
  });

  it("every bot cracking Myriad Landscape answers legally", () => {
    const bots: (() => PlayerController)[] = [
      () => new HeuristicBotController(A),
      () => new EvalBotController(A),
    ];
    for (let seed = 1; seed <= 20; seed += 1) {
      let s = seed;
      bots.push(
        () =>
          new RandomController(A, () => {
            s = (s * 16807) % 2147483647;
            return s / 2147483647;
          }),
      );
    }
    for (const make of bots) {
      const { game, land } = setUp("Myriad Landscape");
      search(game, land);
      const action = make().act(game.controllerView(A));
      expect(() => game.dispatch(action)).not.toThrow();
    }
  });
});
