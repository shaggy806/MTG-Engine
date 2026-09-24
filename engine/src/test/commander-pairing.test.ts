import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { createDefaultRegistry, defineCard, type CardDefinition } from "../cards.js";
import { partnerWithTrigger } from "../cards/helpers.js";
import { POOL_CARDS } from "../cards/generated.js";
import {
  canPairCommanders,
  hasPartner,
  pairingProblem,
  validateCommanderDeck,
} from "../deck-validation.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

// No real card of most partner variants is in the pool yet, so these stand in
// for them. Everything but the pairing is filler.
const legend = (
  name: string,
  extra: Partial<Parameters<typeof defineCard>[0]> = {},
): CardDefinition =>
  defineCard({
    name,
    manaCost: "{1}{G}",
    colors: ["G"],
    supertypes: ["legendary"],
    types: ["creature"],
    subtypes: ["Human"],
    power: 2,
    toughness: 2,
    ...extra,
  });

const PIR = legend("Test Pir", {
  pairing: { kind: "partner-with", name: "Test Toothy" },
  triggered: [partnerWithTrigger("Test Toothy")],
});
const TOOTHY = legend("Test Toothy", { pairing: { kind: "partner-with", name: "Test Pir" } });
// Names Toothy, but Toothy doesn't name it back.
const PIR_IMPOSTOR = legend("Test Pir Impostor", {
  pairing: { kind: "partner-with", name: "Test Toothy" },
});
const FRIEND_1 = legend("Test Friend One", { pairing: { kind: "partner-group", group: "Friends forever" } });
const FRIEND_2 = legend("Test Friend Two", { pairing: { kind: "partner-group", group: "Friends forever" } });
const SURVIVOR = legend("Test Survivor", { pairing: { kind: "partner-group", group: "Survivors" } });
const COMPANION = legend("Test Companion", { pairing: { kind: "doctors-companion" } });
const DOCTOR = legend("Test Doctor", { subtypes: ["Time Lord", "Doctor"] });
const ROGUE_DOCTOR = legend("Test Rogue Doctor", { subtypes: ["Time Lord", "Doctor", "Rogue"] });
const CHOOSER = legend("Test Chooser", { pairing: { kind: "choose-a-background" } });
const BACKGROUND = defineCard({
  name: "Test Background",
  manaCost: "{1}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  subtypes: ["Background"],
  text: "Commander creatures you own get +1/+1.",
});
const BACKGROUND_2 = defineCard({ ...BACKGROUND, name: "Test Background Two" });
// A legendary enchantment that isn't a Background.
const SHRINE = defineCard({ ...BACKGROUND, name: "Test Legendary Shrine", subtypes: ["Shrine"] });

const reg = createDefaultRegistry();
for (const def of [
  PIR,
  TOOTHY,
  PIR_IMPOSTOR,
  FRIEND_1,
  FRIEND_2,
  SURVIVOR,
  COMPANION,
  DOCTOR,
  ROGUE_DOCTOR,
  CHOOSER,
  BACKGROUND,
  BACKGROUND_2,
  SHRINE,
]) {
  reg.register(def);
}

/** A 100-card deck of `commanders` plus filler the pool doesn't have, which
 * the validator leaves to the import audit — so only the commanders are under
 * test here. */
const deckOf = (commanders: readonly string[]) =>
  validateCommanderDeck(
    { commanders, cards: Array<string>(100 - commanders.length).fill("Unimplemented Filler"), size: 100 },
    reg,
  );

describe("pool Partner commanders (rule 702.124)", () => {
  const partners = POOL_CARDS.filter((c) => c.pairing?.kind === "partner").map((c) => c.name);

  it("every one pairs with every other", () => {
    expect(partners.length).toBeGreaterThanOrEqual(8);
    for (const a of partners) {
      for (const b of partners) {
        if (a !== b) expect(canPairCommanders(reg, a, b), `${a} + ${b}`).toBe(true);
      }
    }
    expect(deckOf(["Thrasios, Triton Hero", "Tana, the Bloodsower"]).violations).toEqual([]);
  });

  // `pairing` replaced a scan of the rules text for "partner"; this keeps the
  // declared field and the printed line from drifting apart.
  it("declare exactly the pairing their rules text prints", () => {
    for (const card of POOL_CARDS) {
      const printed = /^Partner \(/m.test(card.text)
        ? "partner"
        : /^Choose a Background\b/m.test(card.text)
          ? "choose-a-background"
          : undefined;
      expect(card.pairing?.kind, card.name).toBe(printed);
    }
  });

  it("won't pair a commander with two copies of itself", () => {
    expect(canPairCommanders(reg, "Thrasios, Triton Hero", "Thrasios, Triton Hero")).toBe(false);
  });
});

describe("Partner with [name]", () => {
  it("pairs two cards that name each other", () => {
    expect(deckOf(["Test Pir", "Test Toothy"]).violations).toEqual([]);
    expect(canPairCommanders(reg, "Test Toothy", "Test Pir")).toBe(true);
  });

  it("pairs with nothing else — not plain Partner, not a one-sided name", () => {
    expect(pairingProblem(reg, "Test Pir", "Thrasios, Triton Hero")).toBe(
      `"Test Pir" and "Thrasios, Triton Hero" can't be paired: "Test Pir" can only be paired with "Test Toothy"`,
    );
    expect(pairingProblem(reg, "Test Pir Impostor", "Test Toothy")).toBe(
      `"Test Pir Impostor" and "Test Toothy" can't be paired: "Test Toothy" doesn't have "Partner with Test Pir Impostor"`,
    );
    expect(canPairCommanders(reg, "Test Toothy", "Test Pir Impostor")).toBe(false);
  });
});

describe("Partner—[text] (Friends forever, Survivors, …)", () => {
  it("pairs within its own group only", () => {
    expect(deckOf(["Test Friend One", "Test Friend Two"]).violations).toEqual([]);
    expect(pairingProblem(reg, "Test Friend One", "Test Survivor")).toBe(
      `"Test Friend One" and "Test Survivor" can't be paired: Partner—Friends forever and Partner—Survivors don't combine`,
    );
    // Different partner abilities are distinct: plain Partner isn't a wildcard.
    expect(canPairCommanders(reg, "Test Friend One", "Thrasios, Triton Hero")).toBe(false);
  });
});

describe("Doctor's companion", () => {
  it("pairs with a legendary Time Lord Doctor that has no other creature types", () => {
    expect(deckOf(["Test Companion", "Test Doctor"]).violations).toEqual([]);
    expect(deckOf(["Test Doctor", "Test Companion"]).violations).toEqual([]);
    expect(canPairCommanders(reg, "Test Companion", "Test Rogue Doctor")).toBe(false);
    expect(canPairCommanders(reg, "Test Companion", "Thrasios, Triton Hero")).toBe(false);
    // The Doctor itself has no pairing ability to pair with anyone else.
    expect(canPairCommanders(reg, "Test Doctor", "Thrasios, Triton Hero")).toBe(false);
  });
});

describe("Choose a Background", () => {
  it("makes a Background a second commander, and the identity the union of both", () => {
    const r = deckOf(["Ganax, Astral Hunter", "Test Background"]);
    expect(r.violations).toEqual([]);
    expect(r.identity).toBe("WR");
    expect(deckOf(["Test Background", "Test Chooser"]).violations).toEqual([]);
  });

  it("won't let a Background command alone, or beside anything but a chooser", () => {
    expect(deckOf(["Test Background"]).violations).toEqual([
      `"Test Background" can't be a commander on its own (a Background needs a commander with "Choose a Background")`,
    ]);
    expect(deckOf(["Thrasios, Triton Hero", "Test Background"]).violations).toEqual([
      `"Thrasios, Triton Hero" and "Test Background" can't be paired: a Background needs a commander with "Choose a Background"`,
    ]);
    expect(deckOf(["Test Background", "Test Background Two"]).legal).toBe(false);
    expect(deckOf(["Atraxa, Praetors' Voice", "Test Background"]).legal).toBe(false);
  });

  it("won't pair a chooser with anything but a Background", () => {
    expect(pairingProblem(reg, "Ganax, Astral Hunter", "Test Chooser")).toBe(
      `"Ganax, Astral Hunter" and "Test Chooser" can't be paired: "Ganax, Astral Hunter" can only be paired with a Background`,
    );
    expect(canPairCommanders(reg, "Ganax, Astral Hunter", "Thrasios, Triton Hero")).toBe(false);
  });

  it("a non-Background enchantment still can't be a commander", () => {
    expect(deckOf(["Ganax, Astral Hunter", "Doubling Season"]).legal).toBe(false);
    expect(deckOf(["Ganax, Astral Hunter", "Test Legendary Shrine"]).legal).toBe(false);
  });

  it("hasPartner reports any pairing ability, and only that", () => {
    expect(hasPartner(reg, "Ganax, Astral Hunter")).toBe(true);
    expect(hasPartner(reg, "Test Pir")).toBe(true);
    expect(hasPartner(reg, "Test Background")).toBe(false);
    expect(hasPartner(reg, "Atraxa, Praetors' Voice")).toBe(false);
  });
});

// --- in play ---------------------------------------------------------------

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Plains"),
];
const stackEmpty = (s: GameState): boolean => s.zones.shared.stack.length === 0;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const untappedPlains = (game: Game): number =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === "Plains" && !game.state.objects[id].tapped,
  ).length;

describe("a Background in the command zone", () => {
  it("is cast from there like any commander, and pays the {2} tax on a recast", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      registry: reg,
      rules: { maxLandsPerTurn: 99 },
      decks: [
        { player: A, cards: pad(["Disenchant"]), commanders: ["Test Chooser", "Test Background"] },
        { player: B, cards: pad([]) },
      ],
    });
    game.advanceUntil((s) => s.turn.step === "precombat-main");
    const background = named(game, game.state.zones.shared.command, "Test Background");
    expect(game.state.objects[background].isCommander).toBe(true);
    for (let i = 0; i < 6; i += 1) {
      game.dispatch({ type: "play-land", player: A, card: named(game, game.handOf(A), "Plains") });
    }

    game.dispatch({ type: "cast-spell", player: A, card: background, targets: [] });
    expect(untappedPlains(game)).toBe(4);
    game.advanceUntil(stackEmpty);
    expect(game.state.objects[background].zone).toBe("battlefield");
    expect(game.state.players[A].commanderCastCounts["Test Background"]).toBe(1);

    // Destroyed, it goes home (903.9a — the automatic owner says yes).
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Disenchant"),
      targets: [{ kind: "object", object: background }],
    });
    game.advanceUntil((s) => stackEmpty(s) && s.awaiting === null);
    expect(game.state.objects[background].zone).toBe("command");

    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    const before = untappedPlains(game);
    game.dispatch({ type: "cast-spell", player: A, card: background, targets: [] });
    // {1}{W} plus one previous cast's {2}.
    expect(before - untappedPlains(game)).toBe(4);
    expect(game.state.players[A].commanderCastCounts["Test Background"]).toBe(2);
  });
});

describe("Partner with's enters trigger", () => {
  // Both players keep a Toothy deep in their library; whoever is targeted is
  // the one who searches.
  const run = (target: typeof A) => {
    const alice = new ScriptedController(A);
    alice.chooseTargetsFn = () => [{ kind: "player", player: target }];
    alice.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    const bob = new ScriptedController(B);
    bob.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      registry: reg,
      rules: { maxLandsPerTurn: 99 },
      controllers: { [A]: alice, [B]: bob },
      decks: [
        { player: A, cards: pad(["Test Pir", "Forest", "Forest"]).concat(["Test Toothy"]) },
        { player: B, cards: pad([]).concat(["Test Toothy"]) },
      ],
    });
    game.advanceUntil((s) => s.turn.step === "precombat-main");
    for (const land of ["Forest", "Forest"]) {
      game.dispatch({ type: "play-land", player: A, card: named(game, game.handOf(A), land) });
    }
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Test Pir"),
      targets: [],
    });
    game.advanceUntil((s) => stackEmpty(s) && s.awaiting === null);
    const hasToothy = (p: typeof A): boolean =>
      game.handOf(p).some((id) => game.state.objects[id].cardName === "Test Toothy");
    return { game, hasToothy };
  };

  it("lets the target player search their library for the named partner, revealed", () => {
    const { game, hasToothy } = run(A);
    expect(hasToothy(A)).toBe(true);
    expect(hasToothy(B)).toBe(false);
    expect(game.state.eventLog.some((e) => e.type === "cards-revealed")).toBe(true);
  });

  it("searches the target's library, not the controller's", () => {
    const { hasToothy } = run(B);
    expect(hasToothy(B)).toBe(true);
    expect(hasToothy(A)).toBe(false);
  });
});
