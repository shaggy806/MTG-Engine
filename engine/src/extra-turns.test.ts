import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import type { GameConfig } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[], filler = "Island"): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill(filler),
];

const spawn = (
  game: Game,
  cardName: string,
  controller: PlayerId,
  opts: { tapped?: boolean; sick?: boolean } = {},
): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.objects[id] = {
    id,
    cardName,
    owner: controller,
    controller,
    zone: "battlefield",
    tapped: opts.tapped ?? false,
    damageMarked: 0,
    markedByDeathtouch: false,
    enteredBattlefieldOnTurn: opts.sick ? game.state.turn.number : 0,
    summoningSick: opts.sick ?? false,
    loyaltyActivatedThisTurn: false,
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
    controlEndsAtCleanup: false,
    copyOf: null,
    counters: {},
    modifiers: [],
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const mkGame = (
  aCards: readonly string[],
  overrides: Partial<GameConfig> = {},
): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false, ...overrides.rules },
    ...overrides,
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad([], "Forest") },
    ],
  });

const cardNamed = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};

const atMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const playAll = (game: Game, name: string): void => {
  for (const id of [...game.handOf(A)]) {
    if (game.state.objects[id].cardName === name) {
      game.dispatch({ type: "play-land", player: A, card: id });
    }
  }
};

describe("Time Warp — an extra turn", () => {
  it("the caster takes another turn before the rotation advances", () => {
    const game = mkGame(["Time Warp"]);
    game.advanceUntil(atMain);
    playAll(game, "Island");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Time Warp"),
      targets: [],
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0);
    expect(game.eventsOfType("extra-turn-queued").some((e) => e.player === A)).toBe(true);
    expect(game.state.turn.number).toBe(1);

    // Turn 2 is Alice's extra turn.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(game.state.turn.activePlayerIndex).toBe(game.state.turnOrder.indexOf(A));
    expect(game.state.turn.isExtra).toBe(true);
    expect(
      game.eventsOfType("turn-began").find((e) => e.turn === 2)?.extra,
    ).toBe(true);

    // Turn 3 goes to Bob, rotation resumed.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "upkeep");
    expect(game.state.turn.activePlayerIndex).toBe(game.state.turnOrder.indexOf(B));
    expect(game.state.turn.isExtra).toBe(false);
  });
});

describe("Aggravated Assault — an additional combat phase", () => {
  it("loops back to combat after the post-combat main phase", () => {
    const a = new ScriptedController(A);
    const b = new ScriptedController(B);
    const game = mkGame([], { controllers: { [A]: a, [B]: b } });
    game.advanceUntil(atMain);

    spawn(game, "Aggravated Assault", A);
    const bear1 = spawn(game, "Grizzly Bears", A);
    const bear2 = spawn(game, "Grizzly Bears", A);
    for (let i = 0; i < 6; i += 1) spawn(game, "Mountain", A);

    // Attack every combat, and fire the ability once in the post-combat main.
    a.declareAttackersFn = (view) =>
      view
        .legalActions()
        .flatMap((x) =>
          x.kind === "declare-attackers"
            ? x.eligible.map((attacker) => ({ attacker, defender: B }))
            : [],
        );
    a.enqueue({
      action: { type: "activate-ability", player: A, source: game.state.zones.shared.battlefield[0], abilityIndex: 0 },
      when: (v) => v.state.turn.step === "postcombat-main" && v.state.extraCombats === 0,
    });

    const bobStart = game.state.players[B].life;
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");

    expect(game.eventsOfType("additional-combat-phase")).toHaveLength(1);
    expect(game.eventsOfType("attacker-declared").length).toBeGreaterThanOrEqual(4);
    // Two 2/2s hit twice = 8 damage.
    expect(game.state.players[B].life).toBe(bobStart - 8);
    void bear1;
    void bear2;
  });
});

describe("Rogue's Passage — can't be blocked", () => {
  it("grants unblockable until end of turn", () => {
    const a = new ScriptedController(A);
    const b = new ScriptedController(B);
    const game = mkGame([], { controllers: { [A]: a, [B]: b } });
    game.advanceUntil(atMain);

    const passage = spawn(game, "Rogue's Passage", A);
    const bear = spawn(game, "Grizzly Bears", A);
    spawn(game, "Grizzly Bears", B); // a would-be blocker
    for (let i = 0; i < 5; i += 1) spawn(game, "Mountain", A);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: passage,
      abilityIndex: 1,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0);
    expect(game.eventsOfType("keyword-granted").some((e) => e.object === bear)).toBe(true);

    a.declareAttackersFn = () => [{ attacker: bear, defender: B }];
    b.declareBlockersFn = (view) =>
      view
        .legalActions()
        .flatMap((x) =>
          x.kind === "declare-blockers"
            ? x.eligible.flatMap((e) => e.canBlock.map((attacker) => ({ blocker: e.blocker, attacker })))
            : [],
        );

    const bobStart = game.state.players[B].life;
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    // Bob had no legal block — 2 damage through.
    expect(game.state.players[B].life).toBe(bobStart - 2);
  });
});
