/**
 * Class cards (rule 716): a level bar is a sorcery-speed activated ability
 * from the level below (716.2a), the abilities under it the Class's only from
 * that level on, and a level a designation that's gone once the Class leaves
 * (716.2b) — none is level 1 (716.2d). Written on the shared table in
 * `harness.ts`.
 */
import { describe, expect, it } from "vitest";

import type { Game } from "../game.js";
import type { ObjectId } from "../primitives.js";

import {
  A,
  B,
  cast,
  enter,
  hand,
  lands,
  life,
  pickTargets,
  pt,
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

/** The index of `cls`'s level bar to level `n`. */
const bar = (game: Game, cls: ObjectId, n: number): number =>
  game.registry
    .get(game.state.objects[cls].cardName)
    .activated.findIndex((a) => a.effect?.kind === "gain-class-level" && a.effect.level === n);

const levelUp = (game: Game, cls: ObjectId, n: number): void => {
  game.dispatch({ type: "activate-ability", player: A, source: cls, abilityIndex: bar(game, cls, n), targets: [] });
  settle(game);
};

describe("Class levels", () => {
  it("level 2 is gained as a sorcery from level 1, and 'when this Class becomes level 2' triggers", () => {
    const { game } = table();
    const wizard = spawn(game, "Wizard Class");
    lands(game, "Island", 8);
    for (let i = 0; i < 4; i += 1) toLibrary(game, "Island");
    // Level 3 isn't offered from level 1.
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: wizard, abilityIndex: bar(game, wizard, 3), targets: [] }),
    ).toThrow();
    const before = hand(game).length;
    levelUp(game, wizard, 2);
    expect(game.state.objects[wizard].classLevel).toBe(2);
    expect(hand(game).length).toBe(before + 2);
    // Level 2 can't be gained again.
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: wizard, abilityIndex: bar(game, wizard, 2), targets: [] }),
    ).toThrow();
  });

  it("can't be leveled at instant speed", () => {
    const { game } = table();
    const wizard = spawn(game, "Wizard Class");
    lands(game, "Island", 3);
    toStep(game, "upkeep");
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: wizard, abilityIndex: bar(game, wizard, 2), targets: [] }),
    ).toThrow();
  });

  it("a level's static ability applies from that level on (Paladin Class's anthem)", () => {
    const { game } = table();
    const paladin = spawn(game, "Paladin Class");
    const bears = spawn(game, "Grizzly Bears");
    lands(game, "Plains", 3);
    expect(pt(game, bears)).toEqual({ power: 2, toughness: 2 });
    levelUp(game, paladin, 2);
    expect(pt(game, bears)).toEqual({ power: 3, toughness: 3 });
  });

  it("a level's replacement applies from that level on (Artist's Talent's +2)", () => {
    const { game } = table();
    const artist = spawn(game, "Artist's Talent");
    lands(game, "Mountain", 8);
    cast(game, toHand(game, "Shock"), { targets: [{ kind: "player", player: B }] });
    expect(life(game, B)).toBe(18);
    levelUp(game, artist, 2);
    levelUp(game, artist, 3);
    cast(game, toHand(game, "Shock"), { targets: [{ kind: "player", player: B }] });
    expect(life(game, B)).toBe(14);
  });

  it("is lost when the Class leaves the battlefield: it comes back at level 1", () => {
    const { game } = table();
    const paladin = spawn(game, "Paladin Class");
    lands(game, "Plains", 3);
    levelUp(game, paladin, 2);
    game.debugMove(paladin, "hand");
    game.debugMove(paladin, "battlefield");
    expect(game.state.objects[paladin].classLevel).toBeUndefined();
    const bears = spawn(game, "Grizzly Bears");
    expect(pt(game, bears)).toEqual({ power: 2, toughness: 2 });
  });
});

describe("the Classes", () => {
  it("Gourmand's Talent's level 2 makes a Raccoon only for the first life gained each turn", () => {
    const { game } = table();
    const gourmand = spawn(game, "Gourmand's Talent");
    lands(game, "Forest", 3);
    levelUp(game, gourmand, 2);
    // Soul Warden's 1 life, twice: only the first gain this turn counts.
    spawn(game, "Soul Warden");
    enter(game, "Grizzly Bears");
    enter(game, "Grizzly Bears");
    // Two Bears and the Raccoon itself entering: three gains, one Raccoon.
    expect(life(game, A)).toBe(23);
    expect(tokensNamed(game, "Raccoon Token", A)).toBe(1);
  });

  it("Alchemist's Talent grants its Treasures the two-mana ability only from level 2", () => {
    const { game } = table();
    lands(game, "Mountain", 6);
    const alchemist = toHand(game, "Alchemist's Talent");
    cast(game, alchemist);
    const treasure = Object.values(game.state.objects).find((o) => o.cardName === "Treasure Token")!;
    const abilities = (): string[] =>
      game
        .legalActions(A)
        .flatMap((a) => (a.kind === "activate-ability" && a.source === treasure.id ? [a.text] : []));
    // Tapped as created: untap it to see what it offers.
    treasure.tapped = false;
    expect(abilities().some((t) => t.includes("two mana"))).toBe(false);
    levelUp(game, alchemist, 2);
    expect(abilities().some((t) => t.includes("two mana"))).toBe(true);
  });

  it("Cleric Class's level 3 returns a creature card and gains its toughness in life", () => {
    const { game, a } = table();
    const cleric = spawn(game, "Cleric Class");
    lands(game, "Plains", 9);
    const giant = toGraveyard(game, "Hill Giant");
    levelUp(game, cleric, 2);
    pickTargets(a, giant);
    levelUp(game, cleric, 3);
    expect(zone(game, giant)).toBe("battlefield");
    // 3 toughness, plus Cleric Class's own +1.
    expect(life(game, A)).toBe(24);
  });

  it("Hunter's Talent's level 3 draws only with a creature of power 4 or greater", () => {
    const { game } = table();
    const hunter = spawn(game, "Hunter's Talent");
    lands(game, "Forest", 6);
    levelUp(game, hunter, 2);
    levelUp(game, hunter, 3);
    const before = hand(game).length;
    toStep(game, "end");
    settle(game);
    expect(hand(game).length).toBe(before);
    spawn(game, "Craw Wurm");
    toStep(game, "end");
    settle(game);
    // The next turn's draw, and the end step's.
    expect(hand(game).length).toBe(before + 2);
  });
});
