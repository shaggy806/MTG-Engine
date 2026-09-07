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

const spawn = (game: Game, cardName: string, controller: PlayerId): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.objects[id] = {
    id,
    cardName,
    owner: controller,
    controller,
    zone: "battlefield",
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
    timestamp: 0,
    isToken: false,
    attachedTo: null,
    isCommander: false,
    xValue: null,
    counters: {},
    modifiers: [],
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

describe("deals-combat-damage-to-player triggers", () => {
  it("Thieving Magpie draws a card when it connects", () => {
    const { game, a } = makeGame();
    const magpie = spawn(game, "Thieving Magpie", A);
    a.declareAttackersFn = () => [{ attacker: magpie, defender: B }];
    game.advanceUntil(toPrecombat);
    const before = game.handOf(A).length;

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.state.players[B].life).toBe(19);
    expect(game.handOf(A).length).toBe(before + 1);
  });

  it("a blocked Magpie deals no damage to the player, so it doesn't trigger", () => {
    const { game, a, b } = makeGame();
    const magpie = spawn(game, "Thieving Magpie", A);
    const wall = spawn(game, "Wall of Wood", B); // 0/3, no flying/reach — can't block a flier
    const flyer = spawn(game, "Giant Spider", B); // 2/4 reach — CAN block it
    a.declareAttackersFn = () => [{ attacker: magpie, defender: B }];
    b.declareBlockersFn = () => [{ blocker: flyer, attacker: magpie }];
    void wall;
    game.advanceUntil(toPrecombat);
    const before = game.handOf(A).length;

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.handOf(A).length).toBe(before);
  });

  it("Hypnotic Specter makes the player it hit discard (auto-targeted)", () => {
    const { game, a } = makeGame();
    const specter = spawn(game, "Hypnotic Specter", A);
    a.declareAttackersFn = () => [{ attacker: specter, defender: B }];
    const before = game.handOf(B).length;

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.state.players[B].life).toBe(18);
    expect(game.handOf(B).length).toBe(before - 1);
    expect(game.eventsOfType("cards-discarded").some((e) => e.player === B)).toBe(true);
  });

  it("burn to a player is not combat damage — no saboteur trigger", () => {
    const { game } = makeGame();
    const magpie = spawn(game, "Thieving Magpie", A);
    void magpie;
    game.advanceUntil((s) => s.turn.step === "precombat-main");
    // A Prodigal Sorcerer ping (an ability, not combat) at Bob.
    const tim = spawn(game, "Prodigal Sorcerer", A);
    const before = game.handOf(A).length;
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: tim,
      abilityIndex: 0,
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);
    expect(game.handOf(A).length).toBe(before);
  });
});
