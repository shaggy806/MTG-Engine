/**
 * Top-10000 batch 46, part a: Goblin Piledriver, Layla Hassan, Gwaihir the
 * Windlord, Ringwraiths, Drafna, Founder of Lat-Nam. (Prying Blade is
 * Goldvein Pick's trigger with a different bonus.) Written on the shared
 * table in `harness.ts`.
 */
import { describe, expect, it } from "vitest";

import type { ObjectId } from "../primitives.js";

import {
  A,
  B,
  activate,
  attack,
  cast,
  enter,
  hand,
  keywords,
  lands,
  life,
  named,
  pickTargets,
  pt,
  ref,
  settle,
  spawn,
  table,
  toGraveyard,
  toHand,
  zone,
} from "./harness.js";

describe("Goblin Piledriver", () => {
  it("gets +2/+0 for each other attacking Goblin, not one that stayed home", () => {
    const { game, a } = table();
    const piledriver = spawn(game, "Goblin Piledriver");
    const first = spawn(game, "Goblin Token");
    const second = spawn(game, "Goblin Token");
    spawn(game, "Goblin Token"); // doesn't attack
    attack(game, a, [piledriver, first, second]);
    expect(pt(game, piledriver)).toEqual({ power: 5, toughness: 2 });
    expect(life(game, B)).toBe(20 - 5 - 1 - 1);
  });
});

describe("Layla Hassan", () => {
  it("enters returning a historic card, not a nonhistoric one", () => {
    const { game, a } = table();
    // Two historic cards, so the target is asked rather than taken.
    const ring = toGraveyard(game, "Sol Ring");
    const hound = toGraveyard(game, "Isamaru, Hound of Konda");
    const bears = toGraveyard(game, "Grizzly Bears");
    let offered: readonly (ObjectId | undefined)[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, legal) => {
      offered = (legal[0] ?? []).map((t) => (t.kind === "object" ? t.object : undefined));
      return [ref(ring)];
    };
    enter(game, "Layla Hassan");
    expect(offered).toEqual(expect.arrayContaining([ring, hound]));
    expect(offered).not.toContain(bears);
    expect(zone(game, ring)).toBe("hand");
    expect(zone(game, hound)).toBe("graveyard");
  });

  it("triggers once when two Assassins deal combat damage to a player together", () => {
    const { game, a } = table();
    spawn(game, "Layla Hassan");
    const ring = toGraveyard(game, "Sol Ring");
    const hound = toGraveyard(game, "Isamaru, Hound of Konda");
    let asked = 0;
    a.chooseTargetsFn = (_view, _source, _specs, legal) => {
      asked += 1;
      const first = legal[0]?.[0];
      return first === undefined ? [null] : [first];
    };
    attack(game, a, [spawn(game, "Assassin Token"), spawn(game, "Assassin Token")]);
    expect(life(game, B)).toBe(18);
    expect(asked).toBe(1);
    expect([zone(game, ring), zone(game, hound)].sort()).toEqual(["graveyard", "hand"]);
  });
});

describe("Gwaihir the Windlord", () => {
  it("costs {2} less once you've drawn two cards this turn, and gives other Birds you control vigilance", () => {
    const { game } = table();
    lands(game, "Plains", 2);
    lands(game, "Island", 2);
    const card = toHand(game, "Gwaihir the Windlord");
    // Turn 1's draw is one card: four lands aren't enough.
    expect(game.state.players[A].cardsDrawnThisTurn).toBe(1);
    expect(() => cast(game, card)).toThrow();
    game.state.players[A].cardsDrawnThisTurn = 2;
    cast(game, card);
    expect(zone(game, card)).toBe("battlefield");

    const crow = spawn(game, "Storm Crow Token");
    const theirs = spawn(game, "Storm Crow Token", B);
    expect(keywords(game, crow).has("vigilance")).toBe(true);
    expect(keywords(game, theirs).has("vigilance")).toBe(false);
  });
});

describe("Ringwraiths", () => {
  it("shrinks an opponent's creature, and its controller loses 3 life only if it's legendary", () => {
    const { game, a } = table();
    const hound = spawn(game, "Isamaru, Hound of Konda", B);
    pickTargets(a, hound);
    enter(game, "Ringwraiths");
    expect(zone(game, hound)).toBe("graveyard");
    expect(life(game, B)).toBe(17);

    const dreadmaw = spawn(game, "Colossal Dreadmaw", B);
    pickTargets(a, dreadmaw);
    enter(game, "Ringwraiths");
    expect(pt(game, dreadmaw)).toEqual({ power: 3, toughness: 3 });
    expect(life(game, B)).toBe(17);
  });

  it("returns from the graveyard to hand when the Ring tempts you, with no creature to choose", () => {
    const { game } = table();
    const wraiths = toGraveyard(game, "Ringwraiths");
    enter(game, "Inherited Envelope");
    expect(zone(game, wraiths)).toBe("hand");
    expect(hand(game)).toContain(wraiths);
  });
});

describe("Drafna, Founder of Lat-Nam", () => {
  it("copies an artifact spell you control into a token", () => {
    const { game } = table();
    const drafna = spawn(game, "Drafna, Founder of Lat-Nam");
    lands(game, "Wastes", 4);
    const ring = toHand(game, "Sol Ring");
    cast(game, ring, { settle: false });
    activate(game, drafna, 1, { targets: [ref(ring)] });
    settle(game);
    const rings = named(game, "Sol Ring", A);
    expect(rings).toHaveLength(2);
    expect(rings.filter((id) => game.state.objects[id].isToken)).toHaveLength(1);
  });
});
