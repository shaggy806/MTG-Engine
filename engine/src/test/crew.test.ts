/**
 * Crew (rule 702.122) and the Vehicles it brought in: "tap any number of
 * other untapped creatures you control with total power N or greater: this
 * Vehicle becomes an artifact creature until end of turn" — `crew(n)`,
 * whose cost is `tapOthers.totalPower` and whose offer says each choice's
 * power. Written on the shared table in `harness.ts`.
 */
import { describe, expect, it } from "vitest";

import type { Action, TapCostOffer } from "../actions.js";
import { defaultTapPicks, tapPicksPower } from "../actions.js";
import type { Game } from "../game.js";
import type { ObjectId } from "../primitives.js";

import {
  A,
  B,
  activate,
  attack,
  hand,
  life,
  pickModes,
  pickTargets,
  pt,
  settle,
  spawn,
  table,
  toGraveyard,
  toLibrary,
  toStep,
  tokensNamed,
  types,
  zone,
} from "./harness.js";

/** The crew offer for `vehicle`'s ability `index`. */
function crewOffer(game: Game, vehicle: ObjectId, index = 0): TapCostOffer {
  const offer = game
    .legalActions(A)
    .find((o) => o.kind === "activate-ability" && o.source === vehicle && o.abilityIndex === index);
  if (offer === undefined || offer.kind !== "activate-ability" || offer.tapCost === undefined) {
    throw new Error("no crew offer");
  }
  return offer.tapCost;
}

const crewWith = (game: Game, vehicle: ObjectId, tap: readonly ObjectId[], index = 0): string | null => {
  const action: Action = { type: "activate-ability", player: A, source: vehicle, abilityIndex: index, targets: [], tap };
  const why = game.canDispatch(action);
  if (why === null) {
    game.dispatch(action);
    settle(game);
  }
  return why;
};

describe("crew", () => {
  it("taps creatures with enough total power, and the Vehicle is an artifact creature until end of turn", () => {
    const { game } = table();
    const caravan = spawn(game, "Cultivator's Caravan");
    const bears = spawn(game, "Grizzly Bears");
    const elves = spawn(game, "Llanowar Elves");
    expect(types(game, caravan)).not.toContain("creature");
    const offer = crewOffer(game, caravan, 1);
    expect(offer.totalPower).toBe(3);
    expect(offer.power).toEqual({ [bears]: 2, [elves]: 1 });
    // Not the Vehicle itself ("other"), and 2 power isn't enough.
    expect(offer.choices).not.toContain(caravan);
    expect(crewWith(game, caravan, [bears], 1)).not.toBeNull();
    expect(crewWith(game, caravan, [bears, elves], 1)).toBeNull();
    expect(types(game, caravan)).toEqual(expect.arrayContaining(["artifact", "creature"]));
    expect(pt(game, caravan)).toEqual({ power: 5, toughness: 5 });
    expect(game.state.objects[bears].tapped).toBe(true);
    expect(game.state.objects[elves].tapped).toBe(true);
    toStep(game, "upkeep", B);
    expect(types(game, caravan)).not.toContain("creature");
  });

  it("can tap a creature that came under your control this turn", () => {
    const { game } = table();
    const copter = spawn(game, "Smuggler's Copter");
    const fresh = spawn(game, "Grizzly Bears", A, { sick: true });
    expect(crewWith(game, copter, [fresh])).toBeNull();
    expect(types(game, copter)).toContain("creature");
  });

  it("picks for a driver that names no creatures: the summoning-sick first, only as many as the power needs", () => {
    const { game } = table();
    const caravan = spawn(game, "Cultivator's Caravan");
    const giant = spawn(game, "Hill Giant");
    const fresh = spawn(game, "Grizzly Bears", A, { sick: true });
    const elves = spawn(game, "Llanowar Elves");
    const offer = crewOffer(game, caravan, 1);
    const picks = defaultTapPicks(offer, (id) => id === fresh);
    expect(picks[0]).toBe(fresh);
    expect(tapPicksPower(offer, picks)).toBeGreaterThanOrEqual(3);
    activate(game, caravan, 1);
    expect(game.state.objects[fresh].tapped).toBe(true);
    // Bears (2) and then the Giant (3) — the Elves weren't needed.
    expect(game.state.objects[giant].tapped).toBe(true);
    expect(game.state.objects[elves].tapped).toBe(false);
  });

  it("isn't offered without enough power to tap", () => {
    const { game } = table();
    const caravan = spawn(game, "Cultivator's Caravan");
    spawn(game, "Llanowar Elves");
    expect(
      game.legalActions(A).some((o) => o.kind === "activate-ability" && o.source === caravan && o.abilityIndex === 1),
    ).toBe(false);
  });
});

describe("Smuggler's Copter", () => {
  it("crewed, it attacks and loots", () => {
    const { game, a } = table();
    const copter = spawn(game, "Smuggler's Copter");
    const bears = spawn(game, "Grizzly Bears");
    toLibrary(game, "Wastes");
    crewWith(game, copter, [bears]);
    const before = hand(game).length;
    pickModes(a, 0);
    attack(game, a, [copter]);
    expect(life(game, B)).toBe(17);
    expect(hand(game).length).toBe(before);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(1);
  });
});

describe("Kotori, Pilot Prodigy", () => {
  it("gives Vehicles you control crew 2", () => {
    const { game } = table();
    spawn(game, "Kotori, Pilot Prodigy");
    const salvation = spawn(game, "Salvation Engine");
    // Crew 6 printed (ability 0), crew 2 granted (ability 1): Kotori alone (2) pays the second.
    const kotori = game.state.zones.shared.battlefield.find((id) => game.state.objects[id].cardName === "Kotori, Pilot Prodigy")!;
    const granted = game
      .legalActions(A)
      .find((o) => o.kind === "activate-ability" && o.source === salvation && o.tapCost?.totalPower === 2);
    expect(granted).toBeDefined();
    if (granted?.kind !== "activate-ability") return;
    expect(crewWith(game, salvation, [kotori], granted.abilityIndex)).toBeNull();
    expect(types(game, salvation)).toContain("creature");
  });
});

describe("Greasefang, Okiba Boss", () => {
  it("returns a Vehicle at the beginning of combat with haste, and bounces it at your next end step", () => {
    const { game, a } = table({ step: "upkeep" });
    spawn(game, "Greasefang, Okiba Boss");
    const copter = toGraveyard(game, "Smuggler's Copter");
    pickTargets(a, copter);
    toStep(game, "begin-combat");
    settle(game);
    expect(zone(game, copter)).toBe("battlefield");
    toStep(game, "end");
    settle(game);
    expect(zone(game, copter)).toBe("hand");
  });
});

describe("RMS Titanic", () => {
  it("sinks on its first hit, leaving that many Treasures", () => {
    const { game, a } = table();
    const titanic = spawn(game, "RMS Titanic");
    const giant = spawn(game, "Hill Giant");
    crewWith(game, titanic, [giant]);
    attack(game, a, [titanic]);
    expect(life(game, B)).toBe(13);
    expect(zone(game, titanic)).toBe("graveyard");
    expect(tokensNamed(game, "Treasure Token", A)).toBe(7);
  });
});
