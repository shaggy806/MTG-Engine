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
  ...Array(Math.max(0, 40 - cards.length)).fill("Forest"),
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

const spawn = (
  game: Game,
  cardName: string,
  controller: PlayerId,
  opts: { counters?: Record<string, number>; tapped?: boolean; sick?: boolean } = {},
): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
  game.state.objects[id] = {
    id, cardName, owner: controller, controller, zone: "battlefield",
    tapped: opts.tapped ?? false, damageMarked: 0, markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0, summoningSick: opts.sick ?? false,
    loyaltyActivatedThisTurn: false, targets: null,
    attacking: null, blocking: null, blockedBy: [], blocked: false,
    kind: "card", abilityKind: null, sourceObjectId: null, abilityIndex: null,
    counters: { ...opts.counters }, modifiers: [], timestamp: game.state.timestampSeq,
    isToken: false, attachedTo: null, isCommander: false, xValue: null,
    controlEndsAtCleanup: false, copyOf: null,
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
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const loyaltyAbility = (game: Game, source: ObjectId, cost: number) => {
  const legal = game
    .legalActions(A)
    .find((x) => x.kind === "activate-ability" && x.source === source && x.loyalty === cost);
  if (legal?.kind !== "activate-ability") throw new Error(`no [${cost}] ability available`);
  return legal;
};

describe("planeswalkers enter with loyalty", () => {
  it("Garruk Wildspeaker enters with 3 loyalty counters", () => {
    const { game } = makeGame();
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 4; i += 1) spawn(game, "Forest", A);
    // put Garruk into hand and cast it
    const garruk = asObjectId("gw-1");
    game.state.objects[garruk] = {
      ...game.state.objects[game.battlefield[0]],
      id: garruk, cardName: "Garruk Wildspeaker", zone: "hand",
      counters: {}, timestamp: 0,
    };
    game.state.zones.perPlayer[A].hand.push(garruk);

    game.dispatch({ type: "cast-spell", player: A, card: garruk });
    game.advanceUntil(settled);

    expect(game.state.objects[garruk].zone).toBe("battlefield");
    expect(game.state.objects[garruk].counters.loyalty).toBe(3);
  });
});

describe("loyalty abilities", () => {
  it("a +1 raises loyalty, uses the stack, and only fires once per turn", () => {
    const { game } = makeGame();
    game.advanceUntil(toPrecombat);
    const garruk = spawn(game, "Garruk Wildspeaker", A, { counters: { loyalty: 3 } });
    const l1 = spawn(game, "Forest", A, { tapped: true });
    const l2 = spawn(game, "Forest", A, { tapped: true });

    const plusOne = loyaltyAbility(game, garruk, 1);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: garruk,
      abilityIndex: plusOne.kind === "activate-ability" ? plusOne.abilityIndex : 0,
      targets: [
        { kind: "object", object: l1 },
        { kind: "object", object: l2 },
      ],
    });
    // the ability is on the stack
    expect(game.state.zones.shared.stack).toHaveLength(1);
    expect(game.state.objects[garruk].counters.loyalty).toBe(4);

    game.advanceUntil(settled);
    expect(game.state.objects[l1].tapped).toBe(false);
    expect(game.state.objects[l2].tapped).toBe(false);

    // no second loyalty ability this turn
    expect(
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === garruk),
    ).toBe(false);
  });

  it("a minus ability needs enough loyalty and can be activated again next turn", () => {
    const { game } = makeGame();
    game.advanceUntil(toPrecombat);
    const garruk = spawn(game, "Garruk Wildspeaker", A, { counters: { loyalty: 3 } });

    // [-4] not available at 3 loyalty; [-1] is.
    expect(
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.loyalty === -4),
    ).toBe(false);
    const minusOne = loyaltyAbility(game, garruk, -1);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: garruk,
      abilityIndex: minusOne.kind === "activate-ability" ? minusOne.abilityIndex : 0,
    });
    game.advanceUntil(settled);
    expect(game.state.objects[garruk].counters.loyalty).toBe(2);
    expect(
      game.battlefield.some((id) => game.state.objects[id].cardName === "3/3 Beast Token"),
    ).toBe(true);

    // next turn (Alice's again — pass through Bob's)
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === garruk),
    ).toBe(true);
  });

  it("dies to a state-based action at 0 loyalty", () => {
    const { game } = makeGame();
    game.advanceUntil(toPrecombat);
    const garruk = spawn(game, "Garruk Wildspeaker", A, { counters: { loyalty: 1 } });
    const minusOne = loyaltyAbility(game, garruk, -1);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: garruk,
      abilityIndex: minusOne.kind === "activate-ability" ? minusOne.abilityIndex : 0,
    });
    game.advanceUntil(settled);
    expect(game.state.objects[garruk].zone).toBe("graveyard");
    expect(game.eventsOfType("permanent-destroyed").some((e) => e.reason === "0 loyalty")).toBe(true);
  });

  it("can only be activated at sorcery speed on your own turn", () => {
    const { game } = makeGame();
    game.advanceUntil(toPrecombat);
    const garruk = spawn(game, "Garruk Wildspeaker", A, { counters: { loyalty: 3 } });
    spawn(game, "Grizzly Bears", A); // so combat happens
    game.advanceUntil((s) => s.turn.step === "declare-attackers");
    expect(
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === garruk),
    ).toBe(false);
  });

  it("Chandra's [+0] deals 2 damage to any target", () => {
    const { game } = makeGame();
    game.advanceUntil(toPrecombat);
    const chandra = spawn(game, "Chandra, Acolyte of Flame", A, { counters: { loyalty: 4 } });
    const bear = spawn(game, "Grizzly Bears", B);
    const plusZero = loyaltyAbility(game, chandra, 0);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: chandra,
      abilityIndex: plusZero.kind === "activate-ability" ? plusZero.abilityIndex : 0,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(settled);
    expect(game.state.objects[chandra].counters.loyalty).toBe(4);
    expect(game.state.objects[bear].zone).toBe("graveyard");
  });
});

describe("Overrun ult (-4): group +3/+3 and trample", () => {
  it("pumps every creature the controller controls", () => {
    const { game } = makeGame();
    game.advanceUntil(toPrecombat);
    const garruk = spawn(game, "Garruk Wildspeaker", A, { counters: { loyalty: 5 } });
    const bear = spawn(game, "Grizzly Bears", A);
    const bobBear = spawn(game, "Grizzly Bears", B);

    const minusFour = loyaltyAbility(game, garruk, -4);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: garruk,
      abilityIndex: minusFour.kind === "activate-ability" ? minusFour.abilityIndex : 0,
    });
    game.advanceUntil(settled);

    expect(game.characteristics(bear).power).toBe(5);
    expect(game.characteristics(bear).keywords.has("trample")).toBe(true);
    // Bob's creature is untouched.
    expect(game.characteristics(bobBear).power).toBe(2);
  });
});

describe("attacking a planeswalker", () => {
  it("combat damage removes loyalty; the planeswalker dies at 0", () => {
    const { game, a } = makeGame();
    const garruk = spawn(game, "Garruk Wildspeaker", B, { counters: { loyalty: 3 } });
    const wurm = spawn(game, "Craw Wurm", A); // 6/4
    a.declareAttackersFn = () => [{ attacker: wurm, defender: garruk }];

    game.advanceUntil(toPostcombat);

    expect(game.state.players[B].life).toBe(20); // damage went to Garruk, not Bob
    expect(game.state.objects[garruk].zone).toBe("graveyard");
    expect(game.eventsOfType("loyalty-changed").some((e) => e.delta === -6)).toBe(true);
  });

  it("the planeswalker's controller may block the attacker", () => {
    const { game, a, b } = makeGame();
    const garruk = spawn(game, "Garruk Wildspeaker", B, { counters: { loyalty: 3 } });
    const bear = spawn(game, "Grizzly Bears", A);
    const blocker = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: bear, defender: garruk }];
    b.declareBlockersFn = () => [{ blocker, attacker: bear }];

    game.advanceUntil(toPostcombat);

    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.state.objects[blocker].zone).toBe("graveyard");
    expect(game.state.objects[garruk].counters.loyalty).toBe(3); // no damage got through
  });

  it("you can't attack your own planeswalker", () => {
    const { game, a } = makeGame();
    const garruk = spawn(game, "Garruk Wildspeaker", A, { counters: { loyalty: 3 } });
    const bear = spawn(game, "Grizzly Bears", A);
    a.declareAttackersFn = () => [{ attacker: bear, defender: garruk }];
    expect(() => game.advanceUntil(toPostcombat)).toThrow(/can't attack that planeswalker/);
  });
});

describe("legend rule", () => {
  it("two copies of the same legendary planeswalker — the newer one is destroyed", () => {
    const { game } = makeGame();
    game.advanceUntil(toPrecombat);
    const first = spawn(game, "Chandra, Acolyte of Flame", A, { counters: { loyalty: 4 } });
    const second = spawn(game, "Chandra, Acolyte of Flame", A, { counters: { loyalty: 4 } });
    game.advance();
    expect(game.state.objects[first].zone).toBe("battlefield");
    expect(game.state.objects[second].zone).toBe("graveyard");
  });
});

// needed-cards P12. Real Oracle text has no static keyword grant (the
// planning note's guess was wrong) — just a power>=4 filtered ETB draw
// (the same shape Garruk's Uprising uses) and an ordinary single-target -1.
describe("Kiora, Behemoth Beckoner", () => {
  it("enters with 7 loyalty", () => {
    const { game } = makeGame();
    game.advanceUntil(toPrecombat);
    const kiora = game.debugSpawn("Kiora, Behemoth Beckoner", A, "battlefield");
    expect(game.state.objects[kiora].counters.loyalty).toBe(7);
  });

  it("draws a card whenever a creature you control with power 4+ enters", () => {
    // Real trigger-firing entries go through the actual cast, not debugSpawn
    // (debugSpawn never emits `permanent-entered-battlefield` itself — the
    // same convention `trigger-value.test.ts` uses for Terror of the Peaks).
    const { game } = makeGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Kiora, Behemoth Beckoner", A, "battlefield");
    for (let i = 0; i < 8; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const wurm = game.debugSpawn("Craw Wurm", A, "hand"); // 6/4
    const bear = game.debugSpawn("Grizzly Bears", A, "hand"); // 2/2 — too small
    const before = game.eventsOfType("card-drawn").filter((e) => e.player === A).length;

    game.dispatch({ type: "cast-spell", player: A, card: bear });
    game.advanceUntil(settled);
    expect(game.eventsOfType("card-drawn").filter((e) => e.player === A).length).toBe(before);

    game.dispatch({ type: "cast-spell", player: A, card: wurm });
    game.advanceUntil(settled);
    expect(game.eventsOfType("card-drawn").filter((e) => e.player === A).length).toBe(before + 1);
  });

  it("[-1] untaps a target permanent", () => {
    const { game } = makeGame();
    game.advanceUntil(toPrecombat);
    const kiora = spawn(game, "Kiora, Behemoth Beckoner", A, { counters: { loyalty: 7 } });
    const land = spawn(game, "Forest", A, { tapped: true });

    const minusOne = loyaltyAbility(game, kiora, -1);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: kiora,
      abilityIndex: minusOne.kind === "activate-ability" ? minusOne.abilityIndex : 0,
      targets: [{ kind: "object", object: land }],
    });
    game.advanceUntil(settled);

    expect(game.state.objects[land].tapped).toBe(false);
    expect(game.state.objects[kiora].counters.loyalty).toBe(6);
  });
});
