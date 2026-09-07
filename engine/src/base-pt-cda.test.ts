import { describe, expect, it } from "vitest";

import { Game } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Swamp"),
];

const mkGame = (): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
    decks: [
      { player: A, cards: pad([]) },
      { player: B, cards: pad([]) },
    ],
  });

const mkObject = (
  game: Game,
  cardName: string,
  owner: PlayerId,
  zone: "battlefield" | "graveyard",
): ObjectId => {
  const id = asObjectId(`o-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
  game.state.objects[id] = {
    id,
    cardName,
    owner,
    controller: owner,
    zone,
    tapped: false,
    damageMarked: 0,
    markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0,
    summoningSick: false,
    targets: null,
    attacking: null,
    blocking: null,
    blockedBy: [],
    blocked: false,
    kind: "card",
    abilityKind: null,
    sourceObjectId: null,
    abilityIndex: null,
    timestamp: zone === "battlefield" ? game.state.timestampSeq : 0,
    isToken: false,
    attachedTo: null,
    isCommander: false,
    xValue: null,
    controlEndsAtCleanup: false,
    counters: {},
    modifiers: [],
  };
  if (zone === "battlefield") game.state.zones.shared.battlefield.push(id);
  else game.state.zones.perPlayer[owner].graveyard.push(id);
  return id;
};

describe("layer 7b — characteristic-defining P/T", () => {
  it("Mortivore is */* equal to creature cards in all graveyards", () => {
    const game = mkGame();
    mkObject(game, "Grizzly Bears", A, "graveyard");
    mkObject(game, "Hill Giant", B, "graveyard");
    mkObject(game, "Lightning Bolt", A, "graveyard"); // not a creature — ignored
    const mortivore = mkObject(game, "Mortivore", A, "battlefield");

    expect(game.characteristics(mortivore).power).toBe(2);
    expect(game.characteristics(mortivore).toughness).toBe(2);

    // Another creature dies -> it grows.
    mkObject(game, "Craw Wurm", B, "graveyard");
    expect(game.characteristics(mortivore).power).toBe(3);
  });

  it("Lord of Extinction counts every card in every graveyard", () => {
    const game = mkGame();
    for (let i = 0; i < 4; i += 1) mkObject(game, "Swamp", A, "graveyard");
    mkObject(game, "Lightning Bolt", B, "graveyard");
    const lord = mkObject(game, "Lord of Extinction", A, "battlefield");
    expect(game.characteristics(lord).power).toBe(5);
  });

  it("counters (7c) and anthems (7d) stack on top of the CDA base", () => {
    const game = mkGame();
    mkObject(game, "Grizzly Bears", A, "graveyard");
    mkObject(game, "Hill Giant", A, "graveyard");
    mkObject(game, "Glorious Anthem", A, "battlefield"); // +1/+1 to Alice's creatures
    const mortivore = mkObject(game, "Mortivore", A, "battlefield");
    game.state.objects[mortivore].counters["+1/+1"] = 2;

    // base 2 (7b) + 2 counters (7c) + 1 anthem (7d) = 5
    expect(game.characteristics(mortivore).power).toBe(5);
    expect(game.characteristics(mortivore).toughness).toBe(5);
  });

  it("a 0/0 Mortivore with empty graveyards dies to a state-based action", () => {
    const game = mkGame();
    mkObject(game, "Mortivore", A, "battlefield");
    game.advanceUntil((s) => s.turn.number > 1 || s.result.over);
    expect(
      game.eventsOfType("permanent-destroyed").some((e) => e.reason.includes("toughness")),
    ).toBe(true);
  });
});
