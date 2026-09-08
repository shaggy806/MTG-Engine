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

const spawn = (
  game: Game,
  cardName: string,
  controller: PlayerId,
  opts: { tapped?: boolean } = {},
): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
  game.state.objects[id] = {
    id, cardName, owner: controller, controller, zone: "battlefield",
    tapped: opts.tapped ?? false, damageMarked: 0, markedByDeathtouch: false,
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

const mkGame = () => {
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

const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";
const zoneOf = (game: Game, id: ObjectId): string => game.state.objects[id]?.zone ?? "gone";

describe("EG-4a — trample / multi-block damage assignment as a player choice", () => {
  it("a trampler blocked by one creature — the controller splits the damage", () => {
    const { game, a, b } = mkGame();
    const wurm = spawn(game, "Craw Wurm", A); // 6/4 trample
    const bear = spawn(game, "Grizzly Bears", B); // 2/2
    a.declareAttackersFn = () => [{ attacker: wurm, defender: B }];
    b.declareBlockersFn = () => [{ blocker: bear, attacker: wurm }];
    let seen: { blockers: readonly ObjectId[]; power: number; trample: boolean } | null = null;
    a.assignCombatDamageFn = (_v, info) => {
      seen = { blockers: info.blockers, power: info.power, trample: info.trample };
      return [2]; // exactly lethal to the bear; 4 tramples over
    };

    game.advanceUntil(toPostcombat);

    expect(seen).toEqual({ blockers: [bear], power: 6, trample: true });
    expect(zoneOf(game, bear)).toBe("graveyard");
    expect(game.state.players[B].life).toBe(16); // 20 − 4 trampled
  });

  it("the controller may over-assign to the blocker and trample nothing", () => {
    const { game, a, b } = mkGame();
    const wurm = spawn(game, "Craw Wurm", A);
    const bear = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: wurm, defender: B }];
    b.declareBlockersFn = () => [{ blocker: bear, attacker: wurm }];
    a.assignCombatDamageFn = () => [6];

    game.advanceUntil(toPostcombat);
    expect(zoneOf(game, bear)).toBe("graveyard");
    expect(game.state.players[B].life).toBe(20);
  });

  it("a non-trampler double-blocked — the controller chooses the split", () => {
    const { game, a, b } = mkGame();
    const baloth = spawn(game, "Rumbling Baloth", A); // 4/4 vanilla
    const b1 = spawn(game, "Grizzly Bears", B);
    const b2 = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: baloth, defender: B }];
    b.declareBlockersFn = () => [
      { blocker: b1, attacker: baloth },
      { blocker: b2, attacker: baloth },
    ];
    a.assignCombatDamageFn = (_v, info) => {
      // All 4 to the first blocker — the second survives.
      expect(info.trample).toBe(false);
      expect(info.blockers).toHaveLength(2);
      return [4, 0];
    };

    game.advanceUntil(toPostcombat);
    expect(zoneOf(game, b1)).toBe("graveyard");
    expect(zoneOf(game, b2)).toBe("battlefield");
  });

  it("rejects an illegal assignment (a later blocker before an earlier one has lethal)", () => {
    const { game, a, b } = mkGame();
    const baloth = spawn(game, "Rumbling Baloth", A); // 4/4, no trample
    const b1 = spawn(game, "Grizzly Bears", B); // 2/2 — lethal 2, ordered first
    const b2 = spawn(game, "Giant Spider", B); // 2/4
    a.declareAttackersFn = () => [{ attacker: baloth, defender: B }];
    b.declareBlockersFn = () => [
      { blocker: b1, attacker: baloth },
      { blocker: b2, attacker: baloth },
    ];

    a.assignCombatDamageFn = () => [0, 4]; // b2 gets damage while b1 has 0 of its 2 lethal
    expect(() => game.advanceUntil(toPostcombat)).toThrow(/lethal/);
  });

  it("no decision when there's only one legal split (single blocker, no trample)", () => {
    const { game, a, b } = mkGame();
    const baloth = spawn(game, "Rumbling Baloth", A); // 4/4
    const bear = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: baloth, defender: B }];
    b.declareBlockersFn = () => [{ blocker: bear, attacker: baloth }];
    let asked = false;
    a.assignCombatDamageFn = () => {
      asked = true;
      return [4];
    };
    game.advanceUntil(toPostcombat);
    expect(asked).toBe(false);
    expect(zoneOf(game, bear)).toBe("graveyard");
    expect(zoneOf(game, baloth)).toBe("battlefield"); // took 2, survives
  });
});

describe("EG-4b — the first-strike combat-damage sub-passes", () => {
  it("first-strike damage lands before the regular sub-pass, with a priority window between", () => {
    const { game, a, b } = mkGame();
    const knight = spawn(game, "White Knight", A); // 2/2 first strike
    const spider = spawn(game, "Giant Spider", B); // 2/4
    a.declareAttackersFn = () => [{ attacker: knight, defender: B }];
    b.declareBlockersFn = () => [{ blocker: spider, attacker: knight }];

    let sawFirstPass = false;
    game.advanceUntil((s) => {
      if (s.combatDamage?.pass === "first") sawFirstPass = true;
      return toPostcombat(s);
    });

    expect(sawFirstPass).toBe(true);
    // First strike: Knight deals 2 to the 2/4 Spider (survives). Regular pass:
    // Spider deals 2 to the Knight — it dies. Knight already dealt, deals nothing more.
    expect(zoneOf(game, knight)).toBe("graveyard");
    expect(zoneOf(game, spider)).toBe("battlefield");
    expect(game.state.objects[spider].damageMarked).toBe(2);
  });

  it("no first-strike sub-pass when no combatant has first or double strike", () => {
    const { game, a, b } = mkGame();
    const bear = spawn(game, "Grizzly Bears", A);
    a.declareAttackersFn = () => [{ attacker: bear, defender: B }];
    b.declareBlockersFn = () => [];
    let sawFirstPass = false;
    game.advanceUntil((s) => {
      if (s.combatDamage?.pass === "first") sawFirstPass = true;
      return toPostcombat(s);
    });
    expect(sawFirstPass).toBe(false);
    expect(game.state.players[B].life).toBe(18);
  });
});

describe("EG-4c — must be blocked (Lure)", () => {
  it("every able creature must block the Lured attacker", () => {
    const { game, a, b } = mkGame();
    const attacker = spawn(game, "Grizzly Bears", A);
    const lure = spawn(game, "Lure", A);
    game.state.objects[lure].attachedTo = attacker;
    const ableBlocker = spawn(game, "Grizzly Bears", B);
    const tappedBlocker = spawn(game, "Grizzly Bears", B, { tapped: true });
    a.declareAttackersFn = () => [{ attacker, defender: B }];

    // legalActions advertises the forced attacker.
    game.advanceUntil((s) => s.awaiting?.kind === "blockers");
    const la = game.legalActions(B).find((x) => x.kind === "declare-blockers");
    expect(la?.kind === "declare-blockers" ? la.mustBlock : []).toEqual([attacker]);

    // Declaring no blocks is illegal — the untapped bear must block.
    b.declareBlockersFn = () => [];
    expect(() => game.advanceUntil(toPostcombat)).toThrow(/must block/);

    expect(game.state.objects[tappedBlocker].zone).toBe("battlefield");
    expect(zoneOf(game, ableBlocker)).toBe("battlefield");
  });

  it("declaring the forced block resolves normally", () => {
    const { game, a, b } = mkGame();
    const attacker = spawn(game, "Craw Wurm", A); // 6/4
    const lure = spawn(game, "Lure", A);
    game.state.objects[lure].attachedTo = attacker;
    const blocker = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker, defender: B }];
    b.declareBlockersFn = () => [{ blocker, attacker }];
    // Craw Wurm has trample — assign lethal to the bear, trample the rest.
    a.assignCombatDamageFn = () => [2];

    game.advanceUntil(toPostcombat);
    expect(zoneOf(game, blocker)).toBe("graveyard");
    expect(game.state.players[B].life).toBe(16); // 6 − 2 = 4 trampled
  });

  it("a creature that can't block the Lured attacker (flying) isn't forced", () => {
    const { game, a, b } = mkGame();
    const flyer = spawn(game, "Serra Angel", A); // 4/4 flying
    const lure = spawn(game, "Lure", A);
    game.state.objects[lure].attachedTo = flyer;
    spawn(game, "Grizzly Bears", B); // ground — can't block a flyer
    a.declareAttackersFn = () => [{ attacker: flyer, defender: B }];
    b.declareBlockersFn = () => [];

    game.advanceUntil(toPostcombat);
    expect(game.state.players[B].life).toBe(16);
  });
});
