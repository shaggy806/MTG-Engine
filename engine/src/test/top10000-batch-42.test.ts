/**
 * Top-5000 batch 42: the cards whose recorded blockers had all been built
 * since — the exile-and-return-transformed cards a single-faced copy can't
 * follow (rule 712.14a): Jill, Shiva's Dominant // Shiva, Warden of Ice,
 * The Restoration of Eiganjo // Architect of Restoration, The Legend of
 * Kyoshi // Avatar Kyoshi. Written on the shared table in `harness.ts`.
 */
import { describe, expect, it } from "vitest";

import { faceName } from "../state.js";
import type { ObjectId } from "../primitives.js";

import {
  B,
  activate,
  counters,
  enter,
  hand,
  keywords,
  lands,
  pickModes,
  pickTargets,
  settle,
  spawn,
  subtypes,
  table,
  toGraveyard,
  toStep,
  zone,
} from "./harness.js";
import type { Game } from "../game.js";

const face = (game: Game, id: ObjectId): string => faceName(game.state.objects[id]);

describe("Jill, Shiva's Dominant // Shiva, Warden of Ice", () => {
  it("bounces a nonland permanent, flips into Shiva, and Shiva's chapter III taps their lands and flips back", () => {
    const { game, a } = table();
    const theirs = spawn(game, "Hill Giant", B);
    pickTargets(a, theirs);
    const jill = enter(game, "Jill, Shiva's Dominant");
    expect(zone(game, theirs)).toBe("hand");

    toStep(game, "postcombat-main");
    lands(game, "Island", 5);
    game.state.objects[jill].summoningSick = false;
    const bears = spawn(game, "Grizzly Bears");
    pickTargets(a, bears);
    activate(game, jill);
    expect(face(game, jill)).toBe("Shiva, Warden of Ice");
    expect(game.state.objects[jill].counters.lore).toBe(1);
    expect(keywords(game, bears).has("unblockable")).toBe(true);

    // Chapter III on the next turn: Bob's lands tap, and Shiva comes back as
    // Jill, whose enters trigger asks again (up to one — none here).
    const bobsLands = lands(game, "Forest", 2, B);
    game.state.objects[jill].counters.lore = 2;
    a.chooseTargetsFn = () => [null];
    toStep(game, "precombat-main");
    settle(game);
    expect(bobsLands.every((l) => game.state.objects[l].tapped)).toBe(true);
    expect(zone(game, jill)).toBe("battlefield");
    expect(face(game, jill)).toBe("Jill, Shiva's Dominant");
  });
});

describe("The Restoration of Eiganjo", () => {
  it("discards for a reflexive return of a permanent card with mana value 2 or less, tapped", () => {
    const { game, a } = table();
    const saga = spawn(game, "The Restoration of Eiganjo");
    game.state.objects[saga].counters.lore = 1;
    const bears = toGraveyard(game, "Grizzly Bears");
    const giant = toGraveyard(game, "Hill Giant");
    pickModes(a, 0);
    let offered: readonly { kind: string; object?: ObjectId }[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, legal) => {
      offered = legal[0] ?? [];
      return [{ kind: "object", object: bears }];
    };
    const before = hand(game).length;
    toStep(game, "precombat-main");
    settle(game);
    // The turn's draw, less the discard.
    expect(hand(game).length).toBe(before);
    // The Bears and the discarded Wastes (a permanent card, mana value 0) —
    // the target is chosen after the discard — but not the four-drop.
    expect(offered.map((t) => t.object)).toContain(bears);
    expect(offered.map((t) => t.object)).not.toContain(giant);
    expect(offered).toHaveLength(2);
    expect(zone(game, bears)).toBe("battlefield");
    expect(game.state.objects[bears].tapped).toBe(true);
  });

  it("does nothing without the discard, and chapter III returns it as Architect of Restoration", () => {
    const { game, a } = table();
    const saga = spawn(game, "The Restoration of Eiganjo");
    game.state.objects[saga].counters.lore = 1;
    const bears = toGraveyard(game, "Grizzly Bears");
    pickModes(a);
    toStep(game, "precombat-main");
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    toStep(game, "precombat-main");
    settle(game);
    expect(zone(game, saga)).toBe("battlefield");
    expect(face(game, saga)).toBe("Architect of Restoration");
  });
});

describe("The Legend of Kyoshi // Avatar Kyoshi", () => {
  it("earthbends X for the cards in hand into an Island, then returns as Avatar Kyoshi", () => {
    const { game, a } = table();
    const saga = spawn(game, "The Legend of Kyoshi");
    game.state.objects[saga].counters.lore = 1;
    const [land] = lands(game, "Forest", 1);
    pickTargets(a, land);
    toStep(game, "precombat-main");
    settle(game);
    // The hand after the turn's draw, as chapter II resolves.
    expect(counters(game, land)).toBe(hand(game).length);
    expect(subtypes(game, land)).toEqual(expect.arrayContaining(["Forest", "Island"]));

    toStep(game, "precombat-main");
    settle(game);
    expect(face(game, saga)).toBe("Avatar Kyoshi");
    expect(keywords(game, land).has("hexproof")).toBe(true);
    expect(keywords(game, land).has("trample")).toBe(true);
  });
});
