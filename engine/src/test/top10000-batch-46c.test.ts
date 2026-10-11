/**
 * Top-10000 batch 46, part c. No engine change: each card is existing
 * vocabulary. These pin the clause most likely to be wired wrong on each —
 * a static that reads "attacking" (Gruul War Chant), a mana rider read off
 * the spell it pays for (Lapis Orb of Dragonkind), a Saga's token copies and
 * its final pump (Three Blind Mice), cascade on a spell cast by escape
 * (Bloodbraid Challenger), and a Command's untargeted modes done in printed
 * order (Gix's Command). Written on the shared table in `harness.ts`.
 */
import { describe, expect, it } from "vitest";

import type { Game } from "../game.js";

import {
  A,
  B,
  blockOffer,
  cast,
  counters,
  hand,
  keywords,
  lands,
  pickFromZone,
  pickPermanents,
  pt,
  settle,
  spawn,
  subtypes,
  table,
  toGraveyard,
  toHand,
  toLibrary,
  toStep,
  zone,
} from "./harness.js";

/** Alice's Mouse tokens on the battlefield, a stack counted as each token. */
const mice = (game: Game): number =>
  game.battlefield
    .filter((id) => {
      const o = game.state.objects[id];
      return o.isToken && o.controller === A && subtypes(game, id).includes("Mouse");
    })
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);

describe("Gruul War Chant", () => {
  it("gives attacking creatures you control +1/+0 and menace, and nothing to the rest", () => {
    const { game, a } = table();
    spawn(game, "Gruul War Chant");
    const attacker = spawn(game, "Grizzly Bears");
    const home = spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears", B); // so Bob is asked to block
    expect(pt(game, attacker)).toEqual({ power: 2, toughness: 2 });
    blockOffer(game, a, [attacker]);
    expect(pt(game, attacker)).toEqual({ power: 3, toughness: 2 });
    expect(keywords(game, attacker).has("menace")).toBe(true);
    expect(pt(game, home)).toEqual({ power: 2, toughness: 2 });
    expect(keywords(game, home).has("menace")).toBe(false);
  });
});

describe("Lapis Orb of Dragonkind", () => {
  it("scries 2 when its mana pays for a Dragon creature spell", () => {
    const { game, a } = table();
    const orb = spawn(game, "Lapis Orb of Dragonkind");
    lands(game, "Forest", 1);
    const scries: number[] = [];
    a.chooseScryFn = (_view, cards) => {
      scries.push(cards.length);
      return [];
    };
    // Scaled Nurturer is a {1}{G} Dragon: the Orb's {U} pays the {1}.
    cast(game, toHand(game, "Scaled Nurturer"));
    expect(game.state.objects[orb].tapped).toBe(true);
    expect(scries).toEqual([2]);
  });

  it("scries nothing when its mana pays for a non-Dragon", () => {
    const { game, a } = table();
    const orb = spawn(game, "Lapis Orb of Dragonkind");
    lands(game, "Forest", 1);
    const scries: number[] = [];
    a.chooseScryFn = (_view, cards) => {
      scries.push(cards.length);
      return [];
    };
    cast(game, toHand(game, "Grizzly Bears"));
    expect(game.state.objects[orb].tapped).toBe(true);
    expect(scries).toEqual([]);
  });
});

describe("Three Blind Mice", () => {
  it("makes a Mouse, copies a token you control on II and III, then pumps on IV and is sacrificed", () => {
    const { game } = table();
    const saga = spawn(game, "Three Blind Mice");
    game.state.objects[saga].counters.lore = 0;

    toStep(game, "precombat-main"); // I
    expect(mice(game)).toBe(1);
    toStep(game, "precombat-main"); // II
    expect(mice(game)).toBe(2);
    toStep(game, "precombat-main"); // III
    expect(mice(game)).toBe(3);

    toStep(game, "precombat-main"); // IV
    settle(game);
    const mouse = game.battlefield.find((id) => subtypes(game, id).includes("Mouse"));
    expect(mouse).toBeDefined();
    expect(pt(game, mouse!)).toEqual({ power: 2, toughness: 2 });
    expect(keywords(game, mouse!).has("vigilance")).toBe(true);
    expect(zone(game, saga)).toBe("graveyard");
  });
});

describe("Bloodbraid Challenger", () => {
  it("escapes from the graveyard, exiling three other cards, and cascades as it's cast", () => {
    const { game } = table();
    lands(game, "Mountain", 1);
    lands(game, "Forest", 1);
    lands(game, "Wastes", 3);
    const challenger = toGraveyard(game, "Bloodbraid Challenger");
    const others = [toGraveyard(game, "Wastes"), toGraveyard(game, "Wastes"), toGraveyard(game, "Wastes")];
    const bears = toLibrary(game, "Grizzly Bears");
    const before = game.eventsOfType("cascade-revealed").length;

    cast(game, challenger, { via: "escape", escapeExile: others });

    expect(game.eventsOfType("cascade-revealed").length).toBe(before + 1);
    // The cascade found the Bears (mana value 2 < 5); declined, it goes to
    // the bottom of the library.
    expect(zone(game, bears)).toBe("library");
    for (const id of others) expect(zone(game, id)).toBe("exile");
    expect(zone(game, challenger)).toBe("battlefield");
    expect(keywords(game, challenger).has("haste")).toBe(true);
  });
});

describe("Gix's Command", () => {
  it("puts the counters on before destroying power 2 or less, so the chosen creature survives", () => {
    const { game, a } = table();
    lands(game, "Swamp", 5);
    const mine = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", B);
    const seen = pickPermanents(a, mine);

    cast(game, toHand(game, "Gix's Command"), { modes: [0, 1] });

    // Any creature can get the counters, not only yours — and none targeted.
    expect(seen.offered).toEqual(expect.arrayContaining([mine, theirs, giant]));
    expect(counters(game, mine)).toBe(2);
    expect(keywords(game, mine).has("lifelink")).toBe(true);
    expect(zone(game, mine)).toBe("battlefield");
    expect(zone(game, theirs)).toBe("graveyard");
    expect(zone(game, giant)).toBe("battlefield");
  });

  it("returns up to two creature cards (one, here) and each opponent sacrifices its greatest-power creature", () => {
    const { game, a } = table();
    lands(game, "Swamp", 5);
    const giantCard = toGraveyard(game, "Hill Giant");
    const bearsCard = toGraveyard(game, "Grizzly Bears");
    const otherBears = toGraveyard(game, "Grizzly Bears");
    const theirGiant = spawn(game, "Hill Giant", B);
    const theirBears = spawn(game, "Grizzly Bears", B);
    const seen = pickFromZone(a, giantCard);

    cast(game, toHand(game, "Gix's Command"), { modes: [2, 3] });

    expect(seen.offered).toEqual(expect.arrayContaining([giantCard, bearsCard, otherBears]));
    expect(hand(game)).toContain(giantCard);
    expect(zone(game, bearsCard)).toBe("graveyard");
    expect(zone(game, otherBears)).toBe("graveyard");
    expect(zone(game, theirGiant)).toBe("graveyard");
    expect(zone(game, theirBears)).toBe("battlefield");
  });
});
