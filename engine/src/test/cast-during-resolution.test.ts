/**
 * Casting during resolution (rule 608.2g) through `cast-now`: the top X
 * cards with X an amount, revealed or looked at (Sunbird's Invocation,
 * Kiora, Perception Bobblehead), and "any number of spells from among" cards
 * exiled this way (Etali, Primal Storm, Villainous Wealth, Kotis). Written on
 * the shared table in `harness.ts`.
 */
import { describe, expect, it } from "vitest";

import type { ScriptedController } from "../controller.js";
import type { Game } from "../game.js";
import type { ObjectId } from "../primitives.js";
import type { TargetRef } from "../target.js";

import {
  A,
  B,
  activate,
  attack,
  cast,
  controller,
  hand,
  lands,
  life,
  loyalty,
  named,
  pickFromZone,
  pickModes,
  pickTargets,
  ref,
  settle,
  spawn,
  table,
  toGraveyard,
  toHand,
  tokensNamed,
  toLibrary,
  toStep,
  zone,
} from "./harness.js";

/** The seat casts the first card offered that's in `wanted` (each once),
 * free, with no targets; declines once none is left. Records what was
 * offered each time. */
function castFromOffers(seat: ScriptedController, wanted: readonly ObjectId[]): { offered: (readonly ObjectId[])[] } {
  const seen = { offered: [] as (readonly ObjectId[])[] };
  const left = [...wanted];
  seat.chooseCastNowFn = (_view, offer) => {
    seen.offered.push(offer.cards);
    const pick = left.find((id) => offer.cards.includes(id));
    if (pick === undefined) return null;
    left.splice(left.indexOf(pick), 1);
    const way = offer.casts.find((c) => c.card === pick)!;
    return {
      type: "cast-spell",
      player: seat.playerId,
      card: pick,
      targets: [],
      via: way.via,
      ...(offer.free ? { free: true } : {}),
    };
  };
  return seen;
}

describe("Sunbird's Invocation", () => {
  it("reveals the top X for a spell of mana value X, offers only what costs X or less, and bottoms the rest", () => {
    const { game, a } = table();
    spawn(game, "Sunbird's Invocation");
    lands(game, "Island", 3);
    // Top down: Grizzly Bears (2), Hill Giant (4), Wastes.
    const wastes = toLibrary(game, "Wastes");
    const giant = toLibrary(game, "Hill Giant");
    const bears = toLibrary(game, "Grizzly Bears");
    const seen = castFromOffers(a, [bears]);
    cast(game, toHand(game, "Divination"));
    settle(game);
    expect(seen.offered[0]).toContain(bears);
    expect(seen.offered[0]).not.toContain(giant);
    expect(zone(game, bears)).toBe("battlefield");
    // Revealed to everyone, then the rest went to the bottom.
    expect(game.state.eventLog.some((e) => e.type === "cards-revealed" && e.objects.includes(giant))).toBe(true);
    const library = game.state.zones.perPlayer[A].library;
    expect(library.slice(-2)).toEqual(expect.arrayContaining([giant, wastes]));
  });
});

describe("Villainous Wealth", () => {
  it("casts any number of the exiled spells with mana value X or less, one after another", () => {
    const { game, a } = table();
    lands(game, "Swamp", 1);
    lands(game, "Forest", 1);
    lands(game, "Island", 1);
    lands(game, "Wastes", 3);
    const giant = toLibrary(game, "Hill Giant", B);
    const elves = toLibrary(game, "Llanowar Elves", B);
    const bears = toLibrary(game, "Grizzly Bears", B);
    const seen = castFromOffers(a, [bears, elves]);
    cast(game, toHand(game, "Villainous Wealth"), { x: 3, targets: [{ kind: "player", player: B }] });
    settle(game);
    expect(seen.offered[0]).toEqual(expect.arrayContaining([bears, elves]));
    expect(seen.offered[0]).not.toContain(giant);
    expect(zone(game, bears)).toBe("battlefield");
    expect(zone(game, elves)).toBe("battlefield");
    expect(game.state.objects[bears].controller).toBe(A);
    expect(zone(game, giant)).toBe("exile");
  });
});

describe("Etali, Primal Storm", () => {
  it("exiles each player's top card as it attacks, and casts from among them free", () => {
    const { game, a } = table();
    const etali = spawn(game, "Etali, Primal Storm");
    const mine = toLibrary(game, "Grizzly Bears");
    const theirs = toLibrary(game, "Hill Giant", B);
    castFromOffers(a, [mine, theirs]);
    attack(game, a, [etali]);
    settle(game);
    expect(zone(game, mine)).toBe("battlefield");
    expect(zone(game, theirs)).toBe("battlefield");
    expect(game.state.objects[theirs].controller).toBe(A);
  });
});

describe("Perception Bobblehead", () => {
  it("looks at as many cards as you control Bobbleheads", () => {
    const { game, a } = table();
    const bobble = spawn(game, "Perception Bobblehead");
    spawn(game, "Perception Bobblehead");
    lands(game, "Wastes", 3);
    toLibrary(game, "Wastes");
    const giant = toLibrary(game, "Hill Giant");
    const bears = toLibrary(game, "Grizzly Bears");
    const seen = castFromOffers(a, []);
    let looked: readonly ObjectId[] = [];
    const inner = a.chooseCastNowFn;
    a.chooseCastNowFn = (view, offer) => {
      looked = offer.looked ?? [];
      return inner(view, offer);
    };
    game.dispatch({ type: "activate-ability", player: A, source: bobble, abilityIndex: 1, targets: [] });
    settle(game);
    expect(looked).toEqual([bears, giant]);
    expect(seen.offered[0]).toEqual([bears]);
  });
});

/** The seat casts up to `times` of whatever's offered, free, aimed at
 * `targets`; declines after. Records each offer. */
function castCopies(
  seat: ScriptedController,
  times: number,
  targets: readonly TargetRef[] = [],
): { offered: (readonly ObjectId[])[]; cast: ObjectId[] } {
  const seen = { offered: [] as (readonly ObjectId[])[], cast: [] as ObjectId[] };
  seat.chooseCastNowFn = (_view, offer) => {
    seen.offered.push(offer.cards);
    if (seen.cast.length >= times || offer.casts.length === 0) return null;
    const way = offer.casts[0];
    seen.cast.push(way.card);
    return {
      type: "cast-spell",
      player: seat.playerId,
      card: way.card,
      targets,
      via: way.via,
      ...(offer.free ? { free: true } : {}),
    };
  };
  return seen;
}

const objectsNamed = (game: Game, name: string): ObjectId[] =>
  Object.values(game.state.objects)
    .filter((o) => o.cardName === name)
    .map((o) => o.id);

describe("Mnemonic Deluge", () => {
  it("casts three copies of the exiled card, one at a time, and exiles itself", () => {
    const { game, a } = table();
    lands(game, "Island", 9);
    const divination = toGraveyard(game, "Divination", B);
    for (let i = 0; i < 8; i += 1) toLibrary(game, "Wastes");
    const seen = castCopies(a, 3);
    const deluge = toHand(game, "Mnemonic Deluge");
    const before = hand(game).length;
    cast(game, deluge, { targets: [ref(divination)] });
    // Three offers, each one copy fewer; none is the card itself.
    expect(seen.cast).toHaveLength(3);
    expect(seen.cast).not.toContain(divination);
    expect(hand(game).length).toBe(before - 1 + 6);
    expect(zone(game, divination)).toBe("exile");
    expect(zone(game, deluge)).toBe("exile");
    // The copies are gone: only the exiled card is left by that name.
    expect(objectsNamed(game, "Divination")).toEqual([divination]);
  });

  it("removes the copies not cast (rule 704.5e)", () => {
    const { game, a } = table();
    lands(game, "Island", 9);
    const divination = toGraveyard(game, "Divination", B);
    for (let i = 0; i < 8; i += 1) toLibrary(game, "Wastes");
    const seen = castCopies(a, 1);
    const before = hand(game).length;
    cast(game, toHand(game, "Mnemonic Deluge"), { targets: [ref(divination)] });
    expect(seen.cast).toHaveLength(1);
    expect(hand(game).length).toBe(before + 2);
    expect(objectsNamed(game, "Divination")).toEqual([divination]);
    expect(game.state.zones.shared.exile.filter((id) => game.state.objects[id].isCopy === true)).toEqual([]);
  });
});

describe("Isochron Scepter", () => {
  it("imprints an instant with mana value 2 or less and casts a copy of it each activation", () => {
    const { game, a } = table();
    lands(game, "Wastes", 6);
    const bolt = toHand(game, "Lightning Bolt");
    toHand(game, "Divination");
    const imprint = pickFromZone(a, bolt);
    cast(game, toHand(game, "Isochron Scepter"));
    expect(imprint.offered).toEqual([bolt]);
    expect(zone(game, bolt)).toBe("exile");
    const seen = castCopies(a, 1, [ref(B)]);
    const scepter = named(game, "Isochron Scepter")[0];
    activate(game, scepter);
    expect(seen.cast).toHaveLength(1);
    expect(seen.cast[0]).not.toBe(bolt);
    expect(life(game, B)).toBe(17);
    // The imprinted card stays; the copy is gone.
    expect(zone(game, bolt)).toBe("exile");
    expect(objectsNamed(game, "Lightning Bolt")).toEqual([bolt]);
  });
});

describe("Mizzix's Mastery", () => {
  it("overloaded, exiles each instant and sorcery in your graveyard and casts a copy of each", () => {
    const { game, a } = table();
    lands(game, "Mountain", 8);
    const one = toGraveyard(game, "Divination");
    const two = toGraveyard(game, "Divination");
    const bears = toGraveyard(game, "Grizzly Bears");
    for (let i = 0; i < 8; i += 1) toLibrary(game, "Wastes");
    const seen = castCopies(a, 5);
    const mastery = toHand(game, "Mizzix's Mastery");
    const before = hand(game).length;
    cast(game, mastery, { overload: true });
    expect(seen.cast).toHaveLength(2);
    expect(hand(game).length).toBe(before - 1 + 4);
    expect(zone(game, one)).toBe("exile");
    expect(zone(game, two)).toBe("exile");
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, mastery)).toBe("exile");
    expect(objectsNamed(game, "Divination").sort()).toEqual([one, two].sort());
  });
});

describe("Narset, Enlightened Exile", () => {
  it("casts a copy of a graveyard's artifact card as it attacks, which becomes a token (rule 608.3f)", () => {
    const { game, a } = table();
    const narset = spawn(game, "Narset, Enlightened Exile");
    const ring = toGraveyard(game, "Sol Ring", B);
    pickTargets(a, ring);
    const seen = castCopies(a, 1);
    attack(game, a, [narset]);
    settle(game);
    expect(seen.cast).toHaveLength(1);
    expect(zone(game, ring)).toBe("exile");
    expect(tokensNamed(game, "Sol Ring", A)).toBe(1);
  });
});

describe("Chandra, Torch of Defiance", () => {
  it("casts the exiled card, paying for it, or else deals 2 damage to each opponent", () => {
    const { game, a } = table();
    const chandra = spawn(game, "Chandra, Torch of Defiance");
    const forests = lands(game, "Forest", 2);
    toLibrary(game, "Mountain");
    const bears = toLibrary(game, "Grizzly Bears");
    const seen = castCopies(a, 5);
    loyalty(game, chandra, 1);
    expect(seen.cast).toEqual([bears]);
    expect(zone(game, bears)).toBe("battlefield");
    // Paid for, not free.
    expect(forests.every((f) => game.state.objects[f].tapped)).toBe(true);
    expect(life(game, B)).toBe(20);
    // Next turn the top card is a land, which can't be cast.
    toStep(game, "precombat-main");
    loyalty(game, chandra, 1);
    expect(life(game, B)).toBe(18);
  });
});

describe("Powerbalance", () => {
  it("casts the revealed top card free when its mana value matches the opponent's spell", () => {
    const { game, a } = table();
    spawn(game, "Powerbalance");
    const giant = toLibrary(game, "Hill Giant");
    const bears = toLibrary(game, "Grizzly Bears");
    toStep(game, "precombat-main", B);
    lands(game, "Forest", 6, B);
    pickModes(a, 0);
    const seen = castCopies(a, 5);
    cast(game, toHand(game, "Grizzly Bears", B), { player: B });
    expect(seen.cast).toEqual([bears]);
    expect(zone(game, bears)).toBe("battlefield");
    expect(controller(game, bears)).toBe(A);
    // A four-drop doesn't match the next two-mana spell: it stays on top.
    seen.cast.length = 0;
    cast(game, toHand(game, "Grizzly Bears", B), { player: B });
    expect(seen.cast).toEqual([]);
    expect(game.state.zones.perPlayer[A].library[0]).toBe(giant);
  });
});

describe("Cecily, Haunted Mage", () => {
  it("draws, loses 1 life, and casts an instant or sorcery free with eleven cards in hand", () => {
    const { game, a } = table();
    const cecily = spawn(game, "Cecily, Haunted Mage");
    // Ten in hand (the table dealt some), eleven after the draw.
    while (hand(game).length < 9) toHand(game, "Wastes");
    const divination = toHand(game, "Divination");
    const seen = castCopies(a, 1);
    attack(game, a, [cecily]);
    settle(game);
    expect(seen.cast).toEqual([divination]);
    expect(hand(game).length).toBe(10 + 1 - 1 + 2);
    expect(life(game, A)).toBe(19);
  });

  it("offers nothing with ten cards in hand after the draw", () => {
    const { game, a } = table();
    const cecily = spawn(game, "Cecily, Haunted Mage");
    while (hand(game).length < 8) toHand(game, "Wastes");
    toHand(game, "Divination");
    const seen = castCopies(a, 1);
    attack(game, a, [cecily]);
    settle(game);
    expect(seen.offered).toEqual([]);
    expect(hand(game).length).toBe(10);
  });
});

describe("Aetherflux Conduit", () => {
  it("gets energy equal to the mana spent, and casts any number of spells from hand free after drawing seven", () => {
    const { game, a } = table();
    const conduit = spawn(game, "Aetherflux Conduit");
    lands(game, "Mountain", 4);
    cast(game, toHand(game, "Hill Giant"));
    expect(game.state.players[A].energy).toBe(4);
    game.state.players[A].energy = 50;
    const bears = toHand(game, "Grizzly Bears");
    const elves = toHand(game, "Llanowar Elves");
    const seen = castCopies(a, 2);
    const before = hand(game).length;
    activate(game, conduit);
    expect(seen.cast).toEqual(expect.arrayContaining([bears, elves]));
    expect(hand(game).length).toBe(before + 7 - 2);
    // The free casts spent no mana, so no energy.
    expect(game.state.players[A].energy).toBe(0);
  });
});

describe("an ability that lets you cast a spell as it resolves", () => {
  it("is still on the stack while you cast it (rule 608.2n), so the spell may target it", () => {
    const { game, a } = table();
    const conduit = spawn(game, "Aetherflux Conduit");
    game.state.players[A].energy = 50;
    const visions = toHand(game, "Vantress Visions");
    let offered: readonly TargetRef[] = [];
    a.chooseCastNowFn = (_view, offer) => {
      const way = offer.casts.find((c) => c.card === visions && c.cardName === "Vantress Visions");
      if (way === undefined) return null;
      offered = way.targetOptions[0] ?? [];
      return {
        type: "cast-spell",
        player: A,
        card: visions,
        targets: [offered[0]],
        via: way.via,
        face: way.face,
        free: true,
      };
    };
    activate(game, conduit);
    expect(offered).toHaveLength(1);
    // The ability finished first and is gone: the copy has nothing to copy.
    expect(game.state.zones.shared.stack).toEqual([]);
    expect(zone(game, visions)).toBe("graveyard");
  });
});
