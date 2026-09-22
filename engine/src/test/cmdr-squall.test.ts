/**
 * Squall, SeeD Mercenary — {2}{W}{B} legendary 3/4 Human Knight Mercenary.
 *
 *   Rough Divide — Whenever a creature you control attacks alone, it gains
 *   double strike until end of turn.
 *   Whenever Squall deals combat damage to a player, return target permanent
 *   card with mana value 3 or less from your graveyard to the battlefield.
 *
 * Nothing new in the engine: `attacks-alone` + `"trigger-object"` (Exalted's
 * shape) for the first ability, and a `deals-combat-damage-to-player` trigger
 * over a `card-in-graveyard` slot (Sun Titan's shape, minus the "you may")
 * for the second.
 */

import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Swamp"),
];

const makeGame = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad([]) },
      { player: B, cards: pad([]) },
    ],
  });
  return { game, a, b };
};

const onBoard = (game: Game, name: string, who: PlayerId): ObjectId =>
  game.debugSpawn(name, who, "battlefield", { summoningSick: false });

const inGraveyard = (game: Game, name: string, who: PlayerId): ObjectId =>
  game.debugSpawn(name, who, "graveyard");

const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

/** Squall + a lone attacker, run through turn 1's combat. */
const attackWith = (attackers: readonly string[], graveyard: readonly string[] = []) => {
  const { game, a, b } = makeGame();
  const squall = onBoard(game, "Squall, SeeD Mercenary", A);
  const others = attackers.map((name) => onBoard(game, name, A));
  const yard = graveyard.map((name) => inGraveyard(game, name, A));
  return { game, a, b, squall, others, yard };
};

describe("Squall, SeeD Mercenary — Rough Divide", () => {
  it("gives the lone attacker double strike until end of turn", () => {
    const { game, a, others } = attackWith(["Craw Wurm"]);
    const wurm = others[0];
    a.declareAttackersFn = () => [{ attacker: wurm, defender: B }];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.characteristics(wurm).keywords.has("double-strike")).toBe(true);
    // 6/4 hitting twice, not once.
    expect(game.state.players[B].life).toBe(8);
  });

  it("wears off at end of turn", () => {
    const { game, a, others } = attackWith(["Craw Wurm"]);
    const wurm = others[0];
    a.declareAttackersFn = () => [{ attacker: wurm, defender: B }];

    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");

    expect(game.characteristics(wurm).keywords.has("double-strike")).toBe(false);
  });

  it("counts Squall itself — it attacks alone and gains double strike", () => {
    const { game, a, squall } = attackWith([]);
    a.declareAttackersFn = () => [{ attacker: squall, defender: B }];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.characteristics(squall).keywords.has("double-strike")).toBe(true);
    expect(game.state.players[B].life).toBe(14); // 3 + 3
  });

  // NEGATIVE: "attacks alone" means the only attacker in the declaration.
  it("does not fire when two creatures attack together", () => {
    const { game, a, others } = attackWith(["Craw Wurm", "Grizzly Bears"]);
    const [wurm, bears] = others;
    a.declareAttackersFn = () => [
      { attacker: wurm, defender: B },
      { attacker: bears, defender: B },
    ];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.characteristics(wurm).keywords.has("double-strike")).toBe(false);
    expect(game.characteristics(bears).keywords.has("double-strike")).toBe(false);
    expect(game.state.players[B].life).toBe(12); // 6 + 2, each hitting once
  });

  // NEGATIVE: "a creature **you** control" — an opponent's lone attacker is
  // never pumped by your Squall.
  it("does not pump an opponent's lone attacker", () => {
    const { game, b } = makeGame();
    onBoard(game, "Squall, SeeD Mercenary", A); // Alice's
    const wurm = onBoard(game, "Craw Wurm", B); // Bob's attacker
    b.declareAttackersFn = () => [{ attacker: wurm, defender: A }];

    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "postcombat-main");
    game.advanceUntil(settled);

    expect(game.characteristics(wurm).keywords.has("double-strike")).toBe(false);
    expect(game.state.players[A].life).toBe(14); // 6 once, not twice
  });
});

describe("Squall, SeeD Mercenary — combat-damage recursion", () => {
  it("returns the only legal permanent card, ignoring the rest of the graveyard", () => {
    // Only Grizzly Bears ({1}{G}, mana value 2, a creature) qualifies:
    // Lightning Bolt is not a permanent card, Solemn Simulacrum is mana value
    // 4 and Craw Wurm is mana value 6.
    const { game, a, squall, others, yard } = attackWith(
      ["Grizzly Bears"],
      ["Lightning Bolt", "Solemn Simulacrum", "Craw Wurm", "Grizzly Bears"],
    );
    const [bolt, solemn, wurm, bears] = yard;
    // Two attackers, so Rough Divide stays quiet and Squall connects once.
    a.declareAttackersFn = () => [
      { attacker: squall, defender: B },
      { attacker: others[0], defender: B },
    ];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[bears].controller).toBe(A);
    // NEGATIVE: none of the three ineligible cards moved.
    expect(game.state.objects[bolt].zone).toBe("graveyard");
    expect(game.state.objects[solemn].zone).toBe("graveyard");
    expect(game.state.objects[wurm].zone).toBe("graveyard");
  });

  it("reaches a noncreature permanent card at exactly mana value 3", () => {
    const { game, a, squall, others, yard } = attackWith(
      ["Grizzly Bears"],
      ["Glorious Anthem"], // {1}{W}{W}, an enchantment
    );
    a.declareAttackersFn = () => [
      { attacker: squall, defender: B },
      { attacker: others[0], defender: B },
    ];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.state.objects[yard[0]].zone).toBe("battlefield");
  });

  it("fires twice when double strike makes Squall connect twice", () => {
    const { game, a, squall, yard } = attackWith([], ["Grizzly Bears", "Glorious Anthem"]);
    a.declareAttackersFn = () => [{ attacker: squall, defender: B }];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.state.players[B].life).toBe(14);
    expect(game.state.objects[yard[0]].zone).toBe("battlefield");
    expect(game.state.objects[yard[1]].zone).toBe("battlefield");
  });

  // NEGATIVE: nothing in the graveyard qualifies, so the trigger is removed
  // rather than reaching for something it shouldn't.
  it("returns nothing when only ineligible cards are in the graveyard", () => {
    const { game, a, squall, others, yard } = attackWith(
      ["Grizzly Bears"],
      ["Lightning Bolt", "Solemn Simulacrum"],
    );
    a.declareAttackersFn = () => [
      { attacker: squall, defender: B },
      { attacker: others[0], defender: B },
    ];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.state.objects[yard[0]].zone).toBe("graveyard");
    expect(game.state.objects[yard[1]].zone).toBe("graveyard");
    expect(
      game
        .eventsOfType("trigger-removed")
        .some((e) => e.source === squall && e.reason === "no legal targets"),
    ).toBe(true);
  });

  // NEGATIVE: "from **your** graveyard" — an opponent's graveyard is out of
  // reach even when it holds a perfectly eligible card.
  it("never reaches an opponent's graveyard", () => {
    const { game, a, squall, others } = attackWith(["Grizzly Bears"]);
    const theirs = inGraveyard(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [
      { attacker: squall, defender: B },
      { attacker: others[0], defender: B },
    ];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.state.objects[theirs].zone).toBe("graveyard");
  });

  // NEGATIVE: blocked, so no combat damage reaches the player at all.
  it("does not trigger when Squall is blocked", () => {
    const { game, a, b, squall, yard } = attackWith([], ["Grizzly Bears"]);
    const wall = onBoard(game, "Wall of Wood", B); // 0/3 — it soaks the hit
    a.declareAttackersFn = () => [{ attacker: squall, defender: B }];
    b.declareBlockersFn = () => [{ blocker: wall, attacker: squall }];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.state.players[B].life).toBe(20);
    expect(game.state.objects[yard[0]].zone).toBe("graveyard");
  });
});
