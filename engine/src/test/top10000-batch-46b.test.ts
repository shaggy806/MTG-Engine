/**
 * Card batch 46, part b (2026-10-10): top-5000 cards in EDHREC rank order
 * (ranks 6693–6709). Written on the shared table in `harness.ts`.
 */
import { describe, expect, it } from "vitest";

import { faceName } from "../state.js";

import {
  A,
  B,
  activate,
  attack,
  blockOffer,
  cast,
  counters,
  destroy,
  graveyard,
  hand,
  lands,
  life,
  named,
  pickModes,
  pt,
  ref,
  settle,
  spawn,
  table,
  toGraveyard,
  toHand,
  toLibrary,
  toStep,
  tokensNamed,
  zone,
} from "./harness.js";

describe("Cabal Pit", () => {
  it("shrinks a creature only with threshold — seven cards in your graveyard", () => {
    const { game } = table();
    const pit = spawn(game, "Cabal Pit");
    lands(game, "Swamp", 1);
    const bears = spawn(game, "Grizzly Bears", B);
    for (let i = 0; i < 6; i += 1) toGraveyard(game, "Wastes");
    expect(() => activate(game, pit, 1, { targets: [ref(bears)] })).toThrow();
    toGraveyard(game, "Wastes");
    activate(game, pit, 1, { targets: [ref(bears)] });
    expect(zone(game, pit)).toBe("graveyard");
    expect(zone(game, bears)).toBe("graveyard");
  });
});

describe("Wedding Announcement // Wedding Festivity", () => {
  it("makes a Human when you didn't attack with two creatures, and doesn't transform early", () => {
    const { game } = table();
    const announcement = spawn(game, "Wedding Announcement");
    toStep(game, "end");
    settle(game);
    expect(counters(game, announcement, "invitation")).toBe(1);
    expect(tokensNamed(game, "Human Token", A)).toBe(1);
    expect(faceName(game.state.objects[announcement])).toBe("Wedding Announcement");
  });

  it("draws after an attack with two creatures, then transforms on its third counter into an anthem", () => {
    const { game, a } = table();
    const announcement = spawn(game, "Wedding Announcement");
    game.state.objects[announcement].counters.invitation = 2;
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant");
    attack(game, a, [bears, giant]);
    const before = hand(game).length;
    toStep(game, "end");
    settle(game);
    expect(hand(game).length).toBe(before + 1);
    expect(tokensNamed(game, "Human Token", A)).toBe(0);
    // It keeps its counters as it turns over (the ruling), and the back face pumps.
    expect(faceName(game.state.objects[announcement])).toBe("Wedding Festivity");
    expect(counters(game, announcement, "invitation")).toBe(3);
    expect(pt(game, bears)).toEqual({ power: 3, toughness: 3 });
  });
});

describe("Scalding Viper // Steam Clean", () => {
  it("pings an opponent who casts a spell of mana value 3 or less, not one of 4", () => {
    const { game } = table();
    spawn(game, "Scalding Viper");
    toStep(game, "precombat-main", B);
    lands(game, "Forest", 2, B);
    lands(game, "Mountain", 4, B);
    cast(game, toHand(game, "Grizzly Bears", B), { player: B });
    expect(life(game, B)).toBe(19);
    cast(game, toHand(game, "Hill Giant", B), { player: B });
    expect(life(game, B)).toBe(19);
  });
});

describe("Nemesis Mask", () => {
  it("once equipped, every creature able to block the equipped creature must", () => {
    const { game, a } = table();
    const mask = spawn(game, "Nemesis Mask");
    lands(game, "Wastes", 3);
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears", B);
    activate(game, mask, 0, { targets: [ref(bears)] });
    expect(game.state.objects[mask].attachedTo).toBe(bears);
    const offer = blockOffer(game, a, [bears]);
    expect(offer.mustBlock).toEqual([bears]);
  });
});

describe("Harabaz Druid", () => {
  it("adds one colour, as much as the Allies you control — not an opponent's", () => {
    const { game } = table();
    const druid = spawn(game, "Harabaz Druid");
    spawn(game, "Harabaz Druid");
    spawn(game, "Harabaz Druid", B);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: druid,
      abilityIndex: 0,
      targets: [],
      manaColors: ["G", "G"],
    });
    const pool = game.state.players[A].manaPool;
    expect(pool).toHaveLength(2);
  });
});

describe("Sapling of Colfenor", () => {
  it("gains the revealed creature's toughness, loses its power, then takes it", () => {
    const { game, a } = table();
    const sapling = spawn(game, "Sapling of Colfenor");
    const wurm = toLibrary(game, "Craw Wurm"); // 6/4
    attack(game, a, [sapling]);
    expect(life(game)).toBe(18);
    expect(zone(game, wurm)).toBe("hand");
  });

  it("leaves a noncreature card on top of the library", () => {
    const { game, a } = table();
    const sapling = spawn(game, "Sapling of Colfenor");
    const top = toLibrary(game, "Wastes");
    attack(game, a, [sapling]);
    expect(life(game)).toBe(20);
    expect(game.state.zones.perPlayer[A].library[0]).toBe(top);
  });
});

describe("Koll, the Forgemaster", () => {
  it("returns a nontoken creature that died equipped to its owner's hand, but not a bare one", () => {
    const { game } = table();
    spawn(game, "Koll, the Forgemaster");
    const equipped = spawn(game, "Grizzly Bears");
    const bare = spawn(game, "Grizzly Bears");
    const splitter = spawn(game, "Bonesplitter");
    game.state.objects[splitter].attachedTo = equipped;
    destroy(game, equipped);
    expect(zone(game, equipped)).toBe("hand");
    destroy(game, bare);
    expect(zone(game, bare)).toBe("graveyard");
    expect(graveyard(game)).toContain(bare);
  });

  it("gives an equipped creature token +1/+1, once, and a bare one nothing", () => {
    const { game } = table();
    spawn(game, "Koll, the Forgemaster");
    game.debugApplyEffect(A, { kind: "create-token", token: "Human Token", count: 1 });
    settle(game);
    const [token] = named(game, "Human Token", A);
    expect(pt(game, token)).toEqual({ power: 1, toughness: 1 });
    const splitter = spawn(game, "Bonesplitter");
    game.state.objects[splitter].attachedTo = token;
    // Bonesplitter's +2/+0 and Koll's +1/+1.
    expect(pt(game, token)).toEqual({ power: 4, toughness: 2 });
  });
});

describe("Unexplained Absence", () => {
  it("exiles up to one nonland permanent per player, each controller cloaking one", () => {
    const { game } = table();
    lands(game, "Plains", 4);
    const memnite = spawn(game, "Memnite");
    const bears = spawn(game, "Grizzly Bears", B);
    const mine = toLibrary(game, "Elvish Visionary");
    const theirs = toLibrary(game, "Craw Wurm", B);
    cast(game, toHand(game, "Unexplained Absence"), { targets: [ref(memnite), ref(bears), null, null] });
    expect(zone(game, memnite)).toBe("exile");
    expect(zone(game, bears)).toBe("exile");
    expect(game.state.objects[mine]).toMatchObject({ zone: "battlefield", controller: A });
    expect(game.state.objects[mine].faceDown?.kind).toBe("cloak");
    expect(game.state.objects[theirs]).toMatchObject({ zone: "battlefield", controller: B });
    expect(game.state.objects[theirs].faceDown?.kind).toBe("cloak");
  });

  it("a player with nothing exiled this way cloaks nothing", () => {
    const { game } = table();
    lands(game, "Plains", 4);
    spawn(game, "Memnite");
    const bears = spawn(game, "Grizzly Bears", B);
    const mine = toLibrary(game, "Elvish Visionary");
    cast(game, toHand(game, "Unexplained Absence"), { targets: [null, ref(bears), null, null] });
    expect(zone(game, bears)).toBe("exile");
    expect(zone(game, mine)).toBe("library");
    expect(game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].faceDown !== undefined)).toHaveLength(1);
  });
});

describe("Great Intelligence's Plan", () => {
  const setUp = () => {
    const t = table();
    lands(t.game, "Island", 5);
    lands(t.game, "Swamp", 1);
    for (let i = 0; i < 4; i += 1) toHand(t.game, "Wastes", B);
    return { ...t, bobs: hand(t.game, B).length };
  };

  it("draws three, then the target opponent may choose to discard three", () => {
    const { game, b, bobs } = setUp();
    const before = hand(game).length;
    pickModes(b, 0);
    cast(game, toHand(game, "Great Intelligence's Plan"), { targets: [ref(B)] });
    expect(hand(game).length).toBe(before + 3);
    expect(hand(game, B)).toHaveLength(bobs - 3);
  });

  it("or let you cast a spell from your hand for free", () => {
    const { game, a, b, bobs } = setUp();
    const bears = toHand(game, "Grizzly Bears");
    pickModes(b, 1);
    a.chooseCastNowFn = (_view, offer) => {
      const way = offer.casts.find((c) => c.card === bears);
      if (way === undefined) return null;
      return { type: "cast-spell", player: A, card: bears, targets: [], via: way.via, ...(offer.free ? { free: true } : {}) };
    };
    cast(game, toHand(game, "Great Intelligence's Plan"), { targets: [ref(B)] });
    settle(game);
    expect(zone(game, bears)).toBe("battlefield");
    expect(hand(game, B)).toHaveLength(bobs);
  });
});
