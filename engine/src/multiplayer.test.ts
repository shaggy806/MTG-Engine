import { describe, expect, it } from "vitest";

import type { LegalAction } from "./actions.js";
import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const D = asPlayerId("dave");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Forest"),
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
    counters: {},
    modifiers: [],
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";

interface Setup {
  game: Game;
  a: ScriptedController;
  b: ScriptedController;
  c: ScriptedController;
}

const makeThreePlayerGame = (): Setup => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const c = new ScriptedController(C);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false },
    controllers: { [A]: a, [B]: b, [C]: c },
    decks: [
      { player: A, cards: pad([]) },
      { player: B, cards: pad([]) },
      { player: C, cards: pad([]) },
    ],
  });
  return { game, a, b, c };
};

describe("Game.create player count", () => {
  it("still rejects a single player", () => {
    expect(() =>
      Game.create({ decks: [{ player: A, cards: pad([]) }] }),
    ).toThrow(/two to four/);
  });

  it("accepts 3 and 4 players", () => {
    expect(() =>
      Game.create({
        decks: [
          { player: A, cards: pad([]) },
          { player: B, cards: pad([]) },
          { player: C, cards: pad([]) },
        ],
      }),
    ).not.toThrow();
    expect(() =>
      Game.create({
        decks: [
          { player: A, cards: pad([]) },
          { player: B, cards: pad([]) },
          { player: C, cards: pad([]) },
          { player: D, cards: pad([]) },
        ],
      }),
    ).not.toThrow();
  });

  it("rejects more than four players", () => {
    const E = asPlayerId("erin");
    expect(() =>
      Game.create({
        decks: [
          { player: A, cards: pad([]) },
          { player: B, cards: pad([]) },
          { player: C, cards: pad([]) },
          { player: D, cards: pad([]) },
          { player: E, cards: pad([]) },
        ],
      }),
    ).toThrow(/two to four/);
  });
});

describe("attacking multiple opponents", () => {
  it("one attacker can hit opponent B while another hits opponent C in the same declaration", () => {
    const { game, a } = makeThreePlayerGame();
    const toB = spawn(game, "Grizzly Bears", A);
    const toC = spawn(game, "Grizzly Bears", A);
    a.declareAttackersFn = () => [
      { attacker: toB, defender: B },
      { attacker: toC, defender: C },
    ];

    game.advanceUntil(toPostcombat);

    expect(game.state.players[B].life).toBe(18);
    expect(game.state.players[C].life).toBe(18);
  });

  it("legalActions offers every non-eliminated opponent as a defender", () => {
    const { game } = makeThreePlayerGame();
    spawn(game, "Grizzly Bears", A);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");

    const legal = game.legalActions(A);
    const declare = legal.find(
      (l): l is Extract<LegalAction, { kind: "declare-attackers" }> =>
        l.kind === "declare-attackers",
    );
    expect([...(declare?.defenders ?? [])].sort()).toEqual([B, C]);
  });
});

describe("declaring blockers with multiple defenders", () => {
  it("asks each attacked defender in turn, skipping one with no eligible blocker", () => {
    const { game, a, b, c } = makeThreePlayerGame();
    const attackerToB = spawn(game, "Grizzly Bears", A);
    const attackerToC = spawn(game, "Grizzly Bears", A);
    spawn(game, "Grizzly Bears", B); // B has a blocker; C has none at all.
    a.declareAttackersFn = () => [
      { attacker: attackerToB, defender: B },
      { attacker: attackerToC, defender: C },
    ];
    let bAsked = 0;
    let cAsked = 0;
    b.declareBlockersFn = () => {
      bAsked += 1;
      return [];
    };
    c.declareBlockersFn = () => {
      cAsked += 1;
      return [];
    };

    game.advanceUntil(toPostcombat);

    expect(bAsked).toBe(1);
    expect(cAsked).toBe(0);
    // Unblocked either way — both attacks still connect.
    expect(game.state.players[B].life).toBe(18);
    expect(game.state.players[C].life).toBe(18);
  });

  it("a defender's declared block actually stops the attacker aimed at them", () => {
    const { game, a, b } = makeThreePlayerGame();
    const attackerToB = spawn(game, "Grizzly Bears", A);
    const blocker = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: attackerToB, defender: B }];
    b.declareBlockersFn = () => [{ blocker, attacker: attackerToB }];

    game.advanceUntil(toPostcombat);

    expect(game.state.players[B].life).toBe(20);
    expect(game.eventsOfType("blocker-declared")).toHaveLength(1);
  });

  it("rejects a block on an attacker that isn't attacking the blocking player", () => {
    const { game, a } = makeThreePlayerGame();
    const attackerToB = spawn(game, "Grizzly Bears", A);
    const attackerToC = spawn(game, "Grizzly Bears", A);
    const cCreature = spawn(game, "Grizzly Bears", C);
    // B has no creature (skipped automatically), so C gets the legitimate
    // declare-blockers turn this exercises.
    a.declareAttackersFn = () => [
      { attacker: attackerToB, defender: B },
      { attacker: attackerToC, defender: C },
    ];
    game.advanceUntil(
      (s) => s.awaiting?.kind === "blockers" && s.awaiting.player === C,
    );

    expect(
      game.canDispatch({
        type: "declare-blockers",
        player: C,
        blocks: [{ blocker: cCreature, attacker: attackerToB }],
      }),
    ).toMatch(/isn't attacking/);
  });
});

describe("loss conditions with more than two players", () => {
  it("keeps playing after only one of three players loses", () => {
    const { game } = makeThreePlayerGame();
    game.state.players[B].life = 0;
    game.advanceUntil((s) => s.players[B].hasLost);

    expect(game.state.result.over).toBe(false);
    expect(game.state.players[A].hasLost).toBe(false);
    expect(game.state.players[C].hasLost).toBe(false);
  });

  it("ends once only one player remains", () => {
    const { game } = makeThreePlayerGame();
    game.state.players[B].life = 0;
    game.state.players[C].life = 0;
    game.advanceUntil((s) => s.result.over);

    expect(game.state.result.winner).toBe(A);
  });
});

describe("APNAP trigger ordering with more than two players", () => {
  it("orders simultaneous non-active-player triggers by turn order, not scan order", () => {
    const { game } = makeThreePlayerGame();
    // Spawned in reverse-of-turn-order (C then B) so the old "everyone else
    // in scan order" bug and the turn-order-correct fix disagree.
    const cGhoul = spawn(game, "Vengeful Ghoul", C);
    const bGhoul = spawn(game, "Vengeful Ghoul", B);
    game.state.objects[cGhoul].damageMarked = 99;
    game.state.objects[bGhoul].damageMarked = 99;

    game.advanceUntil((s) => s.zones.shared.stack.length === 2);

    const [bottom, top] = game.state.zones.shared.stack.map(
      (id) => game.state.objects[id].sourceObjectId,
    );
    // Turn order from active A is [A, B, C]; B's trigger goes on the stack
    // first (resolves last, bottom), C's goes on top (resolves first).
    expect(bottom).toBe(bGhoul);
    expect(top).toBe(cGhoul);
  });
});
