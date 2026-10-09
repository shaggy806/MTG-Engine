/**
 * Emblems with triggered abilities (rule 114.4): `create-emblem`'s
 * `triggered` makes an emblem object in the command zone whose abilities
 * trigger and resolve as a permanent's do, "you" its owner. The planeswalker
 * ultimates that waited on it (2026-10-09); Ob Nixilis Reignited's — given to
 * an opponent — is in `precon-standins.test.ts`.
 */
import { describe, expect, it } from "vitest";

import type { Game } from "../game.js";
import type { ObjectId } from "../primitives.js";

import {
  A,
  B,
  attack,
  cast,
  counters,
  enter,
  hand,
  lands,
  life,
  loyalty,
  pickFromZone,
  pickModes,
  pickPermanents,
  pickTargets,
  pt,
  settle,
  spawn,
  table,
  toHand,
  toLibrary,
  toStep,
  tokensNamed,
  zone,
} from "./harness.js";

/** Put `name` on the battlefield and activate its `cost` loyalty ability,
 * with loyalty enough to pay it. */
function walker(game: Game, name: string, cost: number, opts: Parameters<typeof loyalty>[3] = {}): ObjectId {
  const id = spawn(game, name);
  loyalty(game, id, cost, { atLeast: -cost, ...opts });
  return id;
}

describe("Teferi, Hero of Dominaria", () => {
  it("−8: whenever you draw a card, exile target permanent an opponent controls", () => {
    const { game, a } = table();
    walker(game, "Teferi, Hero of Dominaria", -8);
    const bears = spawn(game, "Grizzly Bears", B);
    pickTargets(a, bears);
    game.debugApplyEffect(A, { kind: "draw", amount: 1 });
    settle(game);
    expect(zone(game, bears)).toBe("exile");
  });

  it("+1: draws, and untaps up to two lands at the next end step", () => {
    const { game, a } = table();
    const [l1, l2, l3] = lands(game, "Island", 3);
    for (const id of [l1, l2, l3]) game.state.objects[id].tapped = true;
    const before = hand(game).length;
    walker(game, "Teferi, Hero of Dominaria", 1);
    expect(hand(game).length).toBe(before + 1);
    pickPermanents(a, l1, l2);
    toStep(game, "end");
    settle(game);
    expect([l1, l2, l3].map((id) => game.state.objects[id].tapped)).toEqual([false, false, true]);
  });
});

describe("Koth, Fire of Resistance", () => {
  it("−7: whenever a Mountain you control enters, the emblem deals 4 damage to any target", () => {
    const { game, a } = table();
    walker(game, "Koth, Fire of Resistance", -7);
    pickTargets(a, B);
    enter(game, "Mountain");
    expect(life(game, B)).toBe(16);
    // Not another land.
    enter(game, "Forest");
    expect(life(game, B)).toBe(16);
  });

  it("−3: damage equal to the Mountains you control", () => {
    const { game, a } = table();
    lands(game, "Mountain", 3);
    const wurm = spawn(game, "Craw Wurm", B); // 6/4
    pickTargets(a, wurm);
    walker(game, "Koth, Fire of Resistance", -3, { targets: [{ kind: "object", object: wurm }] });
    expect(game.state.objects[wurm].damageMarked).toBe(3);
  });
});

describe("Vraska, Golgari Queen", () => {
  it("−9: a creature of yours dealing combat damage to a player makes them lose the game", () => {
    const { game, a } = table();
    walker(game, "Vraska, Golgari Queen", -9);
    const bears = spawn(game, "Grizzly Bears");
    attack(game, a, [bears]);
    expect(game.state.players[B].hasLost).toBe(true);
  });

  it("+2: sacrifice another permanent to gain 1 life and draw — or decline and get nothing", () => {
    const { game, a } = table();
    const bears = spawn(game, "Grizzly Bears");
    pickModes(a, 0);
    const before = hand(game).length;
    walker(game, "Vraska, Golgari Queen", 2);
    expect(zone(game, bears)).toBe("graveyard");
    expect(life(game, A)).toBe(21);
    expect(hand(game).length).toBe(before + 1);

    const second = table();
    pickModes(second.a);
    const kept = spawn(second.game, "Grizzly Bears");
    walker(second.game, "Vraska, Golgari Queen", 2);
    expect(zone(second.game, kept)).toBe("battlefield");
    expect(life(second.game, A)).toBe(20);
  });
});

describe("Nissa, Vital Force", () => {
  it("−6: whenever a land you control enters, you may draw a card", () => {
    const { game, a } = table();
    walker(game, "Nissa, Vital Force", -6);
    pickModes(a, 0);
    const before = hand(game).length;
    enter(game, "Forest");
    expect(hand(game).length).toBe(before + 1);
    enter(game, "Forest", B);
    expect(hand(game).length).toBe(before + 1);
  });

  it("+1: untaps a land of yours and makes it a 5/5 haste Elemental until your next turn", () => {
    const { game } = table();
    const [forest] = lands(game, "Forest", 1);
    game.state.objects[forest].tapped = true;
    walker(game, "Nissa, Vital Force", 1, { targets: [{ kind: "object", object: forest }] });
    expect(game.state.objects[forest].tapped).toBe(false);
    expect(pt(game, forest)).toEqual({ power: 5, toughness: 5 });
    toStep(game, "precombat-main", B);
    expect(pt(game, forest)).toEqual({ power: 5, toughness: 5 });
    toStep(game, "upkeep");
    expect(pt(game, forest)).toEqual({ power: 0, toughness: 0 });
  });
});

describe("Kaito, Cunning Infiltrator", () => {
  it("−9: whenever a player casts a spell, you create a 2/1 Ninja", () => {
    const { game } = table();
    walker(game, "Kaito, Cunning Infiltrator", -9);
    lands(game, "Forest", 2);
    cast(game, toHand(game, "Grizzly Bears"));
    expect(tokensNamed(game, "Ninja Token", A)).toBe(1);
  });

  it("gains a loyalty counter when a creature you control deals combat damage to a player", () => {
    const { game, a } = table();
    const kaito = spawn(game, "Kaito, Cunning Infiltrator");
    const bears = spawn(game, "Grizzly Bears");
    attack(game, a, [bears]);
    expect(counters(game, kaito, "loyalty")).toBe(3 + 1);
  });

  it("+1 with no target still draws and discards", () => {
    const { game } = table();
    const before = hand(game).length;
    // An activation's targets come with it: `null` declines the optional slot.
    walker(game, "Kaito, Cunning Infiltrator", 1, { targets: [null] });
    expect(hand(game).length).toBe(before);
    expect(game.eventsOfType("cards-discarded").length).toBe(1);
  });
});

describe("Zariel, Archduke of Avernus", () => {
  it("−6: after your first combat, untap a creature and take an extra combat — once", () => {
    const { game, a } = table();
    walker(game, "Zariel, Archduke of Avernus", -6);
    const bears = spawn(game, "Grizzly Bears");
    pickTargets(a, bears);
    attack(game, a, [bears]);
    // Attacked in both combats; the extra one didn't trigger a third.
    expect(life(game, B)).toBe(20 - 2 - 2);
  });
});

describe("Jace, Unraveler of Secrets", () => {
  it("−8: each opponent's first spell each turn is countered, and only the first", () => {
    const { game } = table();
    walker(game, "Jace, Unraveler of Secrets", -8);
    toStep(game, "precombat-main", B);
    lands(game, "Forest", 4, B);
    const first = toHand(game, "Grizzly Bears", B);
    const second = toHand(game, "Grizzly Bears", B);
    cast(game, first, { player: B });
    cast(game, second, { player: B });
    expect([zone(game, first), zone(game, second)]).toEqual(["graveyard", "battlefield"]);
  });
});

describe("Tezzeret, Artifice Master", () => {
  it("−9: at your end step, a permanent card from your library onto the battlefield", () => {
    const { game, a } = table();
    walker(game, "Tezzeret, Artifice Master", -9);
    const bears = toLibrary(game, "Grizzly Bears");
    pickFromZone(a, bears);
    toStep(game, "end");
    settle(game);
    expect(zone(game, bears)).toBe("battlefield");
  });

  it("0: draws two with three or more artifacts, one without", () => {
    const { game } = table();
    lands(game, "Sol Ring", 3);
    const before = hand(game).length;
    walker(game, "Tezzeret, Artifice Master", 0);
    expect(hand(game).length).toBe(before + 2);
    const other = table();
    const start = hand(other.game).length;
    walker(other.game, "Tezzeret, Artifice Master", 0);
    expect(hand(other.game).length).toBe(start + 1);
  });
});

describe("Tezzeret, Cruel Captain", () => {
  it("−7: three counters on an artifact at your combat; a noncreature one becomes a 0/0 Robot creature", () => {
    const { game, a } = table();
    walker(game, "Tezzeret, Cruel Captain", -7);
    const ring = spawn(game, "Sol Ring");
    pickTargets(a, ring);
    toStep(game, "begin-combat");
    settle(game);
    expect(counters(game, ring)).toBe(3);
    expect(pt(game, ring)).toEqual({ power: 3, toughness: 3 });
  });

  it("0: untaps; the +1/+1 counter only on an artifact creature", () => {
    const { game } = table();
    const ring = spawn(game, "Sol Ring", A, { tapped: true });
    walker(game, "Tezzeret, Cruel Captain", 0, { targets: [{ kind: "object", object: ring }] });
    expect(game.state.objects[ring].tapped).toBe(false);
    expect(counters(game, ring)).toBe(0);
  });

  it("gains a loyalty counter when an artifact you control enters", () => {
    const { game } = table();
    const tez = spawn(game, "Tezzeret, Cruel Captain");
    enter(game, "Sol Ring");
    expect(counters(game, tez, "loyalty")).toBe(5);
  });
});

describe("an emblem's trigger in a player's view", () => {
  it("reads as the ability's text, with no hidden source to look up", () => {
    const { game, a } = table();
    walker(game, "Koth, Fire of Resistance", -7);
    pickTargets(a, B);
    enter(game, "Mountain", A, { settle: false });
    game.advanceUntil((s) => s.zones.shared.stack.length > 0);
    const [id] = game.state.zones.shared.stack;
    const shown = game.viewFor(B).objects[id];
    expect(shown?.kind).toBe("ability");
    expect(shown?.sourceObjectId).toBeNull();
    expect(shown?.text).toBe("Whenever a Mountain you control enters, this emblem deals 4 damage to any target.");
  });
});
