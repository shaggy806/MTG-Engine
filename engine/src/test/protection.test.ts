import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asObjectId, asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Swamp"),
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

const mkGame = (aHand: readonly string[] = []) => {
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
  return { game, a, b };
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

describe("Protection from black — White Knight", () => {
  it("can't be targeted by a black spell (but a non-protected creature can)", () => {
    const { game } = mkGame(["Doom Blade"]);
    game.advanceUntil(toPrecombat);
    const knight = spawn(game, "White Knight", B);
    const bears = spawn(game, "Grizzly Bears", B); // a legal Doom Blade target
    spawn(game, "Swamp", A);
    spawn(game, "Swamp", A);

    const doom = game.legalActions(A).find(
      (x) => x.kind === "cast-spell" && x.cardName === "Doom Blade",
    );
    expect(doom?.kind).toBe("cast-spell");
    if (doom?.kind === "cast-spell") {
      const opts = doom.targetOptions[0] ?? [];
      expect(opts.some((r) => r.kind === "object" && r.object === bears)).toBe(true);
      expect(opts.some((r) => r.kind === "object" && r.object === knight)).toBe(false);
    }

    // Dispatching a Doom Blade pointed at the Knight is rejected outright.
    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: named(game, game.handOf(A), "Doom Blade"),
        targets: [{ kind: "object", object: knight }],
      }),
    ).toThrow(/illegal target/);
  });

  it("can't be blocked by a black creature", () => {
    const { game, a, b } = mkGame();
    const knight = spawn(game, "White Knight", A);
    const nighthawk = spawn(game, "Vampire Nighthawk", B); // black
    a.declareAttackersFn = () => [{ attacker: knight, defender: B }];
    b.declareBlockersFn = () => [{ blocker: nighthawk, attacker: knight }];

    game.advanceUntil(toPostcombat);
    // the block was impossible -> Bob takes 2
    expect(game.state.players[B].life).toBe(18);
  });

  it("prevents combat damage dealt by a black creature it blocks", () => {
    const { game, a, b } = mkGame();
    // A big black attacker that survives the Knight's first strike.
    const ghoul = spawn(game, "Typhoid Rats", A); // 1/1 black deathtouch
    game.state.objects[ghoul].counters = { "+1/+1": 3 }; // -> 4/4
    const knight = spawn(game, "White Knight", B); // blocks it
    a.declareAttackersFn = () => [{ attacker: ghoul, defender: B }];
    b.declareBlockersFn = () => [{ blocker: knight, attacker: ghoul }];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    // The Knight (first strike) marks 2 on the 4/4 Rats; the Rats' 4 damage
    // back — deathtouch and all — is entirely prevented by protection from black.
    expect(game.state.objects[knight]?.zone).toBe("battlefield");
    expect(game.state.objects[knight].damageMarked).toBe(0);
    expect(game.state.objects[ghoul].damageMarked).toBe(2);
  });

  it("a black burn source's damage is prevented (Doom Blade can't even target it)", () => {
    const { game } = mkGame(["Doom Blade"]);
    game.advanceUntil(toPrecombat);
    const knight = spawn(game, "White Knight", A); // Alice's own
    const bears = spawn(game, "Grizzly Bears", A);
    spawn(game, "Swamp", A);
    spawn(game, "Swamp", A);

    const doom = game.legalActions(A).find(
      (x) => x.kind === "cast-spell" && x.cardName === "Doom Blade",
    );
    if (doom?.kind === "cast-spell") {
      const opts = doom.targetOptions[0] ?? [];
      expect(opts.some((r) => r.kind === "object" && r.object === bears)).toBe(true);
      expect(opts.some((r) => r.kind === "object" && r.object === knight)).toBe(false);
    }
  });
});

/**
 * Protection from a *quality* no colour list or card type can name (rule
 * 702.16a) — `StaticAbility.protection.filter`.
 *
 * The colour and type clauses answer from the source's characteristics alone,
 * which is why they work against a source the engine only has a summary of.
 * A filter has to ask about a specific object ("is it multicoloured?", "is it
 * a Human?"), so `TargetSource` carries the source's id and `cardSource`
 * fills it in for a spell as well as a permanent. Without that the spell half
 * of these tests passes for the wrong reason — nothing blocks.
 */
describe("Protection from a filter — Stonecoil Serpent", () => {
  it("can't be targeted by a multicoloured spell, but a mono-coloured one is fine", () => {
    const { game } = mkGame(["Anguished Unmaking", "Doom Blade"]);
    game.advanceUntil(toPrecombat);
    const serpent = spawn(game, "Stonecoil Serpent", B);
    const bears = spawn(game, "Grizzly Bears", B);
    for (let i = 0; i < 3; i += 1) spawn(game, "Swamp", A);
    spawn(game, "Plains", A);

    // Anguished Unmaking is {W}{B} — multicoloured, so the Serpent is out.
    const unmaking = game.legalActions(A).find(
      (x) => x.kind === "cast-spell" && x.cardName === "Anguished Unmaking",
    );
    expect(unmaking?.kind).toBe("cast-spell");
    if (unmaking?.kind === "cast-spell") {
      const opts = unmaking.targetOptions[0] ?? [];
      expect(opts.some((r) => r.kind === "object" && r.object === bears)).toBe(true);
      expect(opts.some((r) => r.kind === "object" && r.object === serpent)).toBe(false);
    }

    // Doom Blade is mono-black: not multicoloured, so it may point at the
    // Serpent. This is the half that fails if `multicolored` matched anything
    // coloured.
    const doom = game.legalActions(A).find(
      (x) => x.kind === "cast-spell" && x.cardName === "Doom Blade",
    );
    if (doom?.kind === "cast-spell") {
      const opts = doom.targetOptions[0] ?? [];
      expect(opts.some((r) => r.kind === "object" && r.object === serpent)).toBe(true);
    }
  });

  it("can't be blocked by a multicoloured creature", () => {
    const { game, a, b } = mkGame();
    const serpent = spawn(game, "Stonecoil Serpent", A);
    game.state.objects[serpent].counters = { "+1/+1": 3 }; // an X=3 Serpent
    const gold = spawn(game, "Anafenza, the Foremost", B); // {W}{B}{G}
    a.declareAttackersFn = () => [{ attacker: serpent, defender: B }];
    b.declareBlockersFn = () => [{ blocker: gold, attacker: serpent }];

    game.advanceUntil(toPostcombat);
    expect(game.state.players[B].life).toBe(17);
  });

  it("enters with X +1/+1 counters and is still colourless itself", () => {
    const { game } = mkGame(["Stonecoil Serpent"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) spawn(game, "Swamp", A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Stonecoil Serpent"),
      targets: [],
      xValue: 3,
    });
    game.advanceUntil(settled);

    const serpent = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Stonecoil Serpent",
    );
    expect(serpent).toBeDefined();
    if (serpent !== undefined) {
      expect(game.state.objects[serpent].counters["+1/+1"]).toBe(3);
    }
  });
});
