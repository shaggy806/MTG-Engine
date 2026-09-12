import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Mountain"),
];

const spawn = (game: Game, cardName: string, controller: PlayerId): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
  game.state.objects[id] = {
    id, cardName, owner: controller, controller, zone: "battlefield",
    tapped: false, damageMarked: 0, markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0, summoningSick: false, loyaltyActivatedThisTurn: false, targets: null,
    attacking: null, blocking: null, blockedBy: [], blocked: false,
    kind: "card", abilityKind: null, sourceObjectId: null, abilityIndex: null,
    counters: {}, modifiers: [], timestamp: game.state.timestampSeq,
    isToken: false, attachedTo: null, isCommander: false, xValue: null,
    controlEndsAtCleanup: false, copyOf: null,
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const mkGame = (aHand: readonly string[]) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aHand) },
      { player: B, cards: pad([]) },
    ],
  });
  return { game };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const untapped = (game: Game, name: string): number =>
  game.battlefield.filter(
    (id) => game.state.objects[id].cardName === name && !game.state.objects[id].tapped,
  ).length;

describe("cost reduction — Foundry Inspector", () => {
  it("makes an artifact spell cost {1} less, and stacks", () => {
    const { game } = mkGame(["Bonesplitter", "Bonesplitter"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Foundry Inspector", A);
    spawn(game, "Foundry Inspector", A);
    // Bonesplitter is {1}; two Inspectors -> {0}. No mana needed.

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Bonesplitter"),
    });
    game.advanceUntil(settled);
    expect(
      game.battlefield.some((id) => game.state.objects[id].cardName === "Bonesplitter"),
    ).toBe(true);
  });

  it("only reduces your own artifact spells, not a non-artifact", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Foundry Inspector", A);
    spawn(game, "Mountain", A);

    // Lightning Bolt is {R} — not an artifact, so Inspector doesn't touch it.
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Lightning Bolt"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);
    expect(game.state.players[B].life).toBe(17);
    expect(untapped(game, "Mountain")).toBe(0);
  });
});

describe("cost increase — Thalia, Guardian of Thraben", () => {
  it("taxes a noncreature spell {1} more", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Thalia, Guardian of Thraben", B); // taxes everyone
    spawn(game, "Mountain", A);

    // {R} + {1} = 2 mana, but Alice has one Mountain -> can't cast.
    expect(
      game.canDispatch({
        type: "cast-spell",
        player: A,
        card: named(game, game.handOf(A), "Lightning Bolt"),
      }),
    ).not.toBeNull();

    spawn(game, "Mountain", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Lightning Bolt"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);
    expect(game.state.players[B].life).toBe(17);
  });

  it("does not tax a creature spell", () => {
    const { game } = mkGame(["Grizzly Bears"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Thalia, Guardian of Thraben", A);
    spawn(game, "Forest", A);
    spawn(game, "Forest", A);

    // Grizzly Bears is {1}{G} — a creature spell, untouched by Thalia.
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Grizzly Bears"),
    });
    game.advanceUntil(settled);
    expect(
      game.battlefield.some((id) => game.state.objects[id].cardName === "Grizzly Bears"),
    ).toBe(true);
  });
});

// needed-cards P14 — a new "choose a creature type as this enters" decision
// (mirrors Clone's choose-copy) feeding a costModification whose filter
// is completed from the chosen type, not fixed on the card.
describe("cost reduction keyed to a chosen creature type — Urza's Incubator", () => {
  it("reduces a creature spell of the chosen type, and only that type", () => {
    const { game } = mkGame(["Urza's Incubator", "Grizzly Bears"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 4; i += 1) spawn(game, "Forest", A); // {3} for the artifact + {G} for Bears

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Urza's Incubator"),
    });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-creature-type");
    expect(game.state.awaiting).toMatchObject({ kind: "choose-creature-type", player: A });
    game.dispatch({ type: "choose-creature-type", player: A, creatureType: "Bear" });
    game.advanceUntil(settled);

    // Grizzly Bears is {1}{G}, reduced by {2} (clamped) to just {G} — the one
    // remaining untapped Forest pays it.
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Grizzly Bears"),
    });
    game.advanceUntil(settled);
    expect(
      game.battlefield.some((id) => game.state.objects[id].cardName === "Grizzly Bears"),
    ).toBe(true);
  });

  it("does not reduce a creature spell of a different type", () => {
    const { game } = mkGame(["Urza's Incubator", "Grizzly Bears"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) spawn(game, "Forest", A); // pays the artifact's {3}

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Urza's Incubator"),
    });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-creature-type");
    game.dispatch({ type: "choose-creature-type", player: A, creatureType: "Dragon" });
    game.advanceUntil(settled);

    // Grizzly Bears is still {1}{G} — one Forest can't pay it.
    spawn(game, "Forest", A);
    expect(
      game.canDispatch({
        type: "cast-spell",
        player: A,
        card: named(game, game.handOf(A), "Grizzly Bears"),
      }),
    ).not.toBeNull();

    spawn(game, "Forest", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Grizzly Bears"),
    });
    game.advanceUntil(settled);
    expect(
      game.battlefield.some((id) => game.state.objects[id].cardName === "Grizzly Bears"),
    ).toBe(true);
  });
});
