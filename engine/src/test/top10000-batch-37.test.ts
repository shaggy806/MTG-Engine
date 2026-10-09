/**
 * Card batch 37 (2026-10-09): the cards whose recorded blockers had all been
 * built since their triage (`cards:needs -- --stale`), and the top-5000
 * cards no batch had triaged (ranks 1187–1210). Written on the shared table
 * in `harness.ts`.
 */
import { describe, expect, it } from "vitest";

import { poolCounts } from "../mana.js";

import {
  A,
  B,
  activate,
  attack,
  cast,
  counters,
  enter,
  hand,
  lands,
  life,
  pickFromZone,
  pickModes,
  pickPermanents,
  pickTargets,
  ref,
  settle,
  spawn,
  table,
  toGraveyard,
  toHand,
  toLibrary,
  toStep,
  zone,
} from "./harness.js";

describe("Torpor Orb", () => {
  it("stops a creature entering from triggering anything, and leaves a land's landfall alone", () => {
    const { game } = table();
    spawn(game, "Torpor Orb");
    const warden = spawn(game, "Soul Warden");
    spawn(game, "Lotus Cobra");
    const before = hand(game).length;
    toLibrary(game, "Wastes");
    // Its own enters trigger (draw a card) and Soul Warden's both go quiet.
    enter(game, "Elvish Visionary");
    expect(hand(game).length).toBe(before);
    expect(life(game)).toBe(20);
    // A land isn't a creature: Lotus Cobra's landfall still adds mana.
    enter(game, "Wastes");
    expect(game.state.players[A].manaPool.length).toBe(1);
    game.debugMove(warden, "graveyard");
    // Gone, the Orb's ban lifts.
    game.debugMove(named0(game, "Torpor Orb"), "graveyard");
    enter(game, "Elvish Visionary");
    expect(hand(game).length).toBe(before + 1);
  });
});

const named0 = (game: ReturnType<typeof table>["game"], name: string) =>
  game.state.zones.shared.battlefield.find((id) => game.state.objects[id].cardName === name)!;

describe("Neheb, the Eternal", () => {
  it("afflicts the player who blocks it, then adds {R} for each life the opponents lost", () => {
    const { game, a, b } = table();
    const neheb = spawn(game, "Neheb, the Eternal");
    const bears = spawn(game, "Grizzly Bears", B);
    b.declareBlockersFn = () => [{ blocker: bears, attacker: neheb }];
    a.declareAttackersFn = () => [{ attacker: neheb, defender: B }];
    // Stop at the start of the postcombat main step, before the trigger resolves.
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(life(game, B)).toBe(17);
    settle(game);
    expect(poolCounts(game.state.players[A].manaPool).R).toBe(3);
  });
});

describe("Muddle the Mixture", () => {
  it("transmutes from the hand for a card of its own mana value, only as a sorcery", () => {
    const { game, a } = table();
    lands(game, "Island", 3);
    const muddle = toHand(game, "Muddle the Mixture");
    const bears = toLibrary(game, "Grizzly Bears");
    toLibrary(game, "Hill Giant");
    pickFromZone(a, bears);
    activate(game, muddle, 0);
    expect(zone(game, muddle)).toBe("graveyard");
    expect(zone(game, bears)).toBe("hand");
    // Not on someone else's turn.
    const again = toHand(game, "Muddle the Mixture");
    lands(game, "Island", 3);
    toStep(game, "upkeep", B);
    expect(game.legalActivationsOf(A, again)).toEqual([]);
  });
});

describe("Unstoppable Slasher", () => {
  it("halves the damaged player's life rounded up, and comes back stunned only from a counterless death", () => {
    const { game, a } = table({ life: 21 });
    const slasher = spawn(game, "Unstoppable Slasher");
    attack(game, a, [slasher]);
    // 21 - 2 combat damage = 19; half of 19, rounded up, is 10.
    expect(life(game, B)).toBe(9);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [ref(slasher)]);
    settle(game);
    const back = named0(game, "Unstoppable Slasher");
    expect(back).toBeDefined();
    expect(game.state.objects[back].tapped).toBe(true);
    expect(counters(game, back, "stun")).toBe(2);
    // With its stun counters on it, a second death keeps it in the graveyard.
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [ref(back)]);
    settle(game);
    expect(zone(game, back)).toBe("graveyard");
  });
});

describe("Badgermole Cub", () => {
  it("adds {G} more when you tap a creature for mana, not a land", () => {
    const { game } = table();
    spawn(game, "Badgermole Cub");
    const elves = spawn(game, "Llanowar Elves");
    const forest = spawn(game, "Forest");
    activate(game, elves, 0);
    expect(poolCounts(game.state.players[A].manaPool).G).toBe(2);
    activate(game, forest, 0);
    expect(poolCounts(game.state.players[A].manaPool).G).toBe(3);
  });
});

describe("Homeward Path", () => {
  it("gives each player back the creatures they own", () => {
    const { game } = table();
    const path = spawn(game, "Homeward Path");
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [ref(bears)]);
    expect(game.state.objects[bears].controller).toBe(A);
    activate(game, path, 1);
    expect(game.state.objects[bears].controller).toBe(B);
  });
});

describe("Wasteland", () => {
  it("destroys only a nonbasic land", () => {
    const { game } = table();
    const wasteland = spawn(game, "Wasteland");
    const forest = spawn(game, "Forest", B);
    const tower = spawn(game, "Command Tower", B);
    // A basic land is no legal target: the activation is refused.
    expect(() => activate(game, wasteland, 1, { targets: [ref(forest)] })).toThrow();
    expect(zone(game, wasteland)).toBe("battlefield");
    activate(game, wasteland, 1, { targets: [ref(tower)] });
    expect(zone(game, tower)).toBe("graveyard");
    expect(zone(game, forest)).toBe("battlefield");
  });
});

describe("Fire Magic", () => {
  it("is cast for exactly one tier, paying that tier's cost", () => {
    const { game } = table();
    const giant = spawn(game, "Hill Giant", B);
    const bears = spawn(game, "Grizzly Bears", B);
    lands(game, "Mountain", 3);
    const fire = toHand(game, "Fire Magic");
    cast(game, fire, { modes: [1] });
    // Fira: 2 damage to each creature, {R} + {2}.
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, giant)).toBe("battlefield");
    expect(game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].tapped).length).toBe(3);
  });
});

describe("Cyberman Patrol", () => {
  it("gives artifact creatures you control afflict 3, and nothing else", () => {
    const { game, a, b } = table();
    spawn(game, "Cyberman Patrol");
    const memnite = spawn(game, "Memnite");
    const bears = spawn(game, "Grizzly Bears");
    const wall = spawn(game, "Hill Giant", B);
    const wall2 = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [
      { attacker: memnite, defender: B },
      { attacker: bears, defender: B },
    ];
    b.declareBlockersFn = () => [
      { blocker: wall, attacker: memnite },
      { blocker: wall2, attacker: bears },
    ];
    toStep(game, "postcombat-main");
    expect(life(game, B)).toBe(17);
  });
});

describe("Starfield Mystic", () => {
  it("grows when an enchantment you control goes to the graveyard from the battlefield", () => {
    const { game } = table();
    const mystic = spawn(game, "Starfield Mystic");
    const pacifism = spawn(game, "Pacifism");
    const theirs = spawn(game, "Pacifism", B);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [ref(theirs)]);
    settle(game);
    expect(counters(game, mystic)).toBe(0);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [ref(pacifism)]);
    settle(game);
    expect(counters(game, mystic)).toBe(1);
  });
});

describe("Power Depot", () => {
  it("enters tapped with a +1/+1 counter, and passes it on as it goes", () => {
    const { game, a } = table();
    const depot = enter(game, "Power Depot");
    expect(game.state.objects[depot].tapped).toBe(true);
    expect(counters(game, depot)).toBe(1);
    const memnite = spawn(game, "Memnite");
    pickTargets(a, memnite);
    pickModes(a, 0);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [ref(depot)]);
    settle(game);
    expect(counters(game, memnite)).toBe(1);
  });
});

describe("Scapeshift", () => {
  it("sacrifices the lands chosen together, then fetches that many lands tapped", () => {
    const { game, a } = table();
    const [f1, f2, f3, f4] = lands(game, "Forest", 4);
    const scapeshift = toHand(game, "Scapeshift");
    const tower = toLibrary(game, "Command Tower");
    const delta = toLibrary(game, "Polluted Delta");
    toLibrary(game, "Wastes");
    pickPermanents(a, f3, f4);
    pickFromZone(a, tower, delta);
    cast(game, scapeshift);
    expect([f1, f2].map((id) => game.state.objects[id].tapped)).toEqual([true, true]);
    expect(zone(game, f3)).toBe("graveyard");
    expect(zone(game, f4)).toBe("graveyard");
    expect(zone(game, tower)).toBe("battlefield");
    expect(zone(game, delta)).toBe("battlefield");
    expect(game.state.objects[tower].tapped).toBe(true);
  });
});

describe("Artisan of Kozilek", () => {
  it("returns a creature card from your graveyard as it's cast", () => {
    const { game, a } = table();
    lands(game, "Wastes", 9);
    const bears = toGraveyard(game, "Grizzly Bears");
    const artisan = toHand(game, "Artisan of Kozilek");
    pickTargets(a, bears);
    pickModes(a, 0);
    cast(game, artisan);
    expect(zone(game, bears)).toBe("battlefield");
    expect(zone(game, artisan)).toBe("battlefield");
  });
});
