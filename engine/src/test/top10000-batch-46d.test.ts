/**
 * Top-5000 batch 46, part d: Well of Ideas, Termagant Swarm, Soulcatchers'
 * Aerie, Skitterbeam Battalion, Immoral Bargain, Kami of Celebration and
 * Darksteel Splicer. (Blur Sliver is Bonescythe Sliver's Sliver lord with
 * haste.) Written on the shared table in `harness.ts`.
 */
import { describe, expect, it } from "vitest";

import type { ObjectId } from "../primitives.js";
import type { Game } from "../game.js";

import {
  A,
  B,
  cast,
  counters,
  destroy,
  enter,
  hand,
  keywords,
  lands,
  named,
  pt,
  ref,
  spawn,
  table,
  toHand,
  toStep,
  tokensNamed,
  zone,
  attack,
} from "./harness.js";

const exiledBy = (game: Game, player = A): ObjectId[] =>
  game.state.zones.shared.exile.filter((id) => game.state.objects[id].owner === player);

describe("Well of Ideas", () => {
  it("draws two on entering, gives each other player one extra on their draw step, and you two extra on yours", () => {
    const { game } = table();
    const before = hand(game).length;
    enter(game, "Well of Ideas");
    expect(hand(game).length).toBe(before + 2);

    // Bob's turn 2: his normal draw plus one.
    const bobs = hand(game, B).length;
    toStep(game, "precombat-main", B);
    expect(hand(game, B).length).toBe(bobs + 2);

    // Alice's turn 3: her normal draw plus two.
    const alices = hand(game).length;
    toStep(game, "precombat-main");
    expect(hand(game).length).toBe(alices + 3);
  });
});

describe("Termagant Swarm", () => {
  it("enters with X counters (drawing at X 5) and dies into Tyranids equal to its last power", () => {
    const { game } = table();
    lands(game, "Forest", 6);
    const swarm = toHand(game, "Termagant Swarm");
    const before = hand(game).length;
    cast(game, swarm, { x: 5 });
    expect(counters(game, swarm)).toBe(5);
    expect(pt(game, swarm)).toEqual({ power: 5, toughness: 5 });
    // The Swarm left the hand; ravenous drew one.
    expect(hand(game).length).toBe(before);

    destroy(game, swarm);
    expect(zone(game, swarm)).toBe("graveyard");
    expect(tokensNamed(game, "Tyranid Token", A)).toBe(5);
  });
});

describe("Soulcatchers' Aerie", () => {
  it("counts a feather for each Bird put into your graveyard, and pumps every player's Bird creatures", () => {
    const { game } = table();
    const aerie = spawn(game, "Soulcatchers' Aerie");
    const mine = spawn(game, "Birds of Paradise");
    const theirs = spawn(game, "Birds of Paradise", B);
    const bears = spawn(game, "Grizzly Bears");

    destroy(game, bears); // not a Bird
    expect(counters(game, aerie, "feather")).toBe(0);

    destroy(game, mine);
    expect(counters(game, aerie, "feather")).toBe(1);
    // Bob's Bird gets it too.
    expect(pt(game, theirs)).toEqual({ power: 1, toughness: 2 });

    // Bob's Bird goes to Bob's graveyard, not yours.
    destroy(game, theirs);
    expect(counters(game, aerie, "feather")).toBe(1);
  });
});

describe("Skitterbeam Battalion", () => {
  it("cast prototyped, it and its two token copies are red 2/2s; the copies don't copy themselves", () => {
    const { game } = table();
    lands(game, "Mountain", 5);
    const card = toHand(game, "Skitterbeam Battalion");
    cast(game, card, { prototype: true });
    expect(pt(game, card)).toEqual({ power: 2, toughness: 2 });
    const all = named(game, "Skitterbeam Battalion", A);
    expect(all).toHaveLength(3);
    expect(tokensNamed(game, "Skitterbeam Battalion", A)).toBe(2);
    for (const id of all) {
      expect(pt(game, id)).toEqual({ power: 2, toughness: 2 });
      expect([...game.characteristics(id).colors]).toEqual(["R"]);
      expect(keywords(game, id).has("haste")).toBe(true);
      expect(keywords(game, id).has("trample")).toBe(true);
    }
  });

  it("put onto the battlefield without being cast, it makes no copies", () => {
    const { game } = table();
    enter(game, "Skitterbeam Battalion");
    expect(named(game, "Skitterbeam Battalion", A)).toHaveLength(1);
  });
});

describe("Immoral Bargain", () => {
  it("sacrifices X creatures and destroys X target nonland permanents, never a land", () => {
    const { game, a } = table();
    spawn(game, "Swamp");
    spawn(game, "Forest");
    spawn(game, "Wastes");
    const mine = [spawn(game, "Grizzly Bears"), spawn(game, "Llanowar Elves")];
    const fervor = spawn(game, "Fervor", B);
    const ring = spawn(game, "Sol Ring", B);
    const land = spawn(game, "Forest", B);
    const card = toHand(game, "Immoral Bargain");

    a.chooseSacrificesFn = () => mine;
    // A land isn't a legal target (the cast is refused as it's announced).
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card, xValue: 2, targets: [ref(fervor), ref(land)] }),
    ).toThrow(/illegal target/);
    expect(zone(game, card)).toBe("hand");


    cast(game, card, { x: 2, targets: [ref(fervor), ref(ring)] });
    expect(mine.map((id) => zone(game, id))).toEqual(["graveyard", "graveyard"]);
    expect([zone(game, fervor), zone(game, ring), zone(game, land)]).toEqual(["graveyard", "graveyard", "battlefield"]);
  });
});

describe("Kami of Celebration", () => {
  it("exiles the top card for each modified attacker only", () => {
    const { game, a } = table();
    spawn(game, "Kami of Celebration");
    const modified = spawn(game, "Grizzly Bears");
    game.state.objects[modified].counters["+1/+1"] = 1;
    const plain = spawn(game, "Hill Giant");
    const before = exiledBy(game).length;
    attack(game, a, [modified, plain]);
    expect(exiledBy(game).length).toBe(before + 1);
  });
});

describe("Darksteel Splicer", () => {
  it("makes a Golem per opponent for itself and for each other nontoken Phyrexian, and Golems are indestructible", () => {
    const { game } = table({ players: 3 });
    enter(game, "Darksteel Splicer");
    // Two opponents; the Phyrexian Golem tokens don't trigger it again.
    expect(tokensNamed(game, "Phyrexian Golem Token", A)).toBe(2);
    const golem = game.battlefield.find((id) => game.state.objects[id].cardName === "Phyrexian Golem Token")!;
    expect(keywords(game, golem).has("indestructible")).toBe(true);

    // Blade Splicer (a nontoken Phyrexian): its own Golem, plus two more.
    enter(game, "Blade Splicer");
    expect(tokensNamed(game, "Phyrexian Golem Token", A)).toBe(5);
  });
});
