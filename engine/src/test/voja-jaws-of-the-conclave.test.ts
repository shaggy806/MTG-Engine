/**
 * Voja, Jaws of the Conclave — every clause driven through the real `Game`:
 *
 * - Vigilance (rule 702.20): attacking doesn't tap it.
 * - Trample (rule 702.19): damage beyond lethal to its blocker goes through.
 * - Ward {3} (rule 702.21): an opponent's spell targeting it is countered
 *   unless they pay {3}; its controller's own spells aren't taxed.
 * - "Whenever Voja attacks, put X +1/+1 counters on each creature you control,
 *   where X is the number of Elves you control." — every creature you control
 *   (Elf or not, Voja included), no opponent's creature, no non-creature; X
 *   counted as the trigger resolves (rule 608.2h); Doubling Season applies
 *   (rule 614.1a); a token stack counts once per token.
 * - "Draw a card for each Wolf you control." — Voja is a Wolf, so a lone Voja
 *   draws one; an opponent's Wolf doesn't count.
 * - Only Voja's own attack triggers it, once per attack.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry, defineCard } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const VOJA = "Voja, Jaws of the Conclave";

/** A vanilla Wolf for the "for each Wolf" clause — the pool has no other
 * Wolf, so the test registers one of its own. Test-only; never in the pool. */
const TEST_WOLF = "Test Wolf";
const registry = createDefaultRegistry().register(
  defineCard({
    name: TEST_WOLF,
    manaCost: "{1}{G}",
    colors: ["G"],
    types: ["creature"],
    subtypes: ["Wolf"],
    power: 2,
    toughness: 2,
  }),
);

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array<string>(Math.max(0, 40 - cards.length)).fill("Plains"),
];

const makeGame = (aHand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aHand) },
      { player: B, cards: pad([]) },
    ],
  });
  game.advanceUntil(
    (s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  return { game, a, b };
};

const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });

const plusOnes = (game: Game, id: ObjectId): number =>
  game.state.objects[id].counters["+1/+1"] ?? 0;

const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const toPostcombat = (s: GameState): boolean => s.turn.step === "postcombat-main";

/** Voja's attack trigger, while it's on the stack. */
const vojaTriggerOnStack = (game: Game, voja: ObjectId): boolean =>
  game.state.zones.shared.stack.some(
    (id) => game.state.objects[id].kind === "ability" && game.state.objects[id].sourceObjectId === voja,
  );

describe("Voja, Jaws of the Conclave", () => {
  it("is a 5/5 red-green-white legendary Wolf with vigilance, trample, ward {3} and one attack trigger", () => {
    const def = registry.get(VOJA);
    expect(def.manaCost).toBe("{2}{R}{G}{W}");
    expect(def.colors).toEqual(["R", "G", "W"]);
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.types).toEqual(["creature"]);
    expect(def.subtypes).toEqual(["Wolf"]);
    expect([def.power, def.toughness]).toEqual([5, 5]);
    expect(def.keywords).toEqual(["vigilance", "trample"]);
    expect(def.static).toHaveLength(1);
    expect(def.static[0].ward).toEqual({ mana: "{3}" });
    expect(def.triggered).toHaveLength(1);
    expect(def.triggered[0].trigger).toEqual({ on: "attacks", who: "self" });
    expect(identityString(colorIdentityOf(def))).toBe("WRG");
  });

  it("puts X +1/+1 counters on each creature you control — X = your Elves — and nothing else", () => {
    const { game, a } = makeGame();
    const voja = spawn(game, VOJA, A);
    const llanowar = spawn(game, "Llanowar Elves", A);
    const mystic = spawn(game, "Elvish Mystic", A);
    const bears = spawn(game, "Grizzly Bears", A); // not an Elf, still a creature you control
    const plains = spawn(game, "Plains", A); // not a creature
    const theirElf = spawn(game, "Llanowar Elves", B); // neither counted nor countered

    a.declareAttackersFn = () => [{ attacker: voja, defender: B }];
    game.advanceUntil(toPostcombat);

    // Two Elves you control: X = 2. The opponent's Elf doesn't make it 3.
    for (const id of [voja, llanowar, mystic, bears]) expect(plusOnes(game, id)).toBe(2);
    expect(plusOnes(game, theirElf)).toBe(0);
    expect(plusOnes(game, plains)).toBe(0);
    expect(game.characteristics(voja).power).toBe(7);
    expect(game.characteristics(voja).toughness).toBe(7);
    expect(game.characteristics(bears).power).toBe(4);
    // 7 trample damage, unblocked.
    expect(game.state.players[B].life).toBe(13);
  });

  it("has vigilance: attacking doesn't tap it", () => {
    const { game, a } = makeGame();
    const voja = spawn(game, VOJA, A);
    a.declareAttackersFn = () => [{ attacker: voja, defender: B }];
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(game.state.objects[voja].attacking).toBe(B);
    expect(game.state.objects[voja].tapped).toBe(false);
  });

  it("has trample: damage beyond lethal to a blocker goes through", () => {
    const { game, a, b } = makeGame();
    const voja = spawn(game, VOJA, A);
    const bears = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: voja, defender: B }];
    b.declareBlockersFn = () => [{ blocker: bears, attacker: voja }];
    game.advanceUntil(toPostcombat);

    // No Elves, so Voja is still 5/5: 2 lethal to the Bears, 3 through.
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.players[B].life).toBe(17);
  });

  it("draws a card for Voja itself, and puts no counters anywhere with no Elves", () => {
    const { game, a } = makeGame();
    const voja = spawn(game, VOJA, A);
    const bears = spawn(game, "Grizzly Bears", A);
    const handBefore = game.handOf(A).length;

    a.declareAttackersFn = () => [{ attacker: voja, defender: B }];
    game.advanceUntil(toPostcombat);

    expect(game.handOf(A).length).toBe(handBefore + 1);
    expect(plusOnes(game, voja)).toBe(0);
    expect(plusOnes(game, bears)).toBe(0);
    expect(game.characteristics(voja).power).toBe(5);
  });

  it("draws a card for each Wolf you control, and not for an opponent's", () => {
    const { game, a } = makeGame();
    const voja = spawn(game, VOJA, A);
    const wolf1 = spawn(game, TEST_WOLF, A);
    const wolf2 = spawn(game, TEST_WOLF, A);
    spawn(game, TEST_WOLF, B);
    spawn(game, "Llanowar Elves", A);
    const handBefore = game.handOf(A).length;

    a.declareAttackersFn = () => [{ attacker: voja, defender: B }];
    game.advanceUntil(toPostcombat);

    // Voja + two Wolves you control = three cards; Bob's Wolf is his.
    expect(game.handOf(A).length).toBe(handBefore + 3);
    // The Wolves are creatures you control, so they got the Elf's counter too.
    expect(plusOnes(game, wolf1)).toBe(1);
    expect(plusOnes(game, wolf2)).toBe(1);
    expect(plusOnes(game, voja)).toBe(1);
  });

  it("counts Elves and Wolves as the trigger resolves, not as Voja attacks", () => {
    const { game, a } = makeGame();
    const voja = spawn(game, VOJA, A);
    spawn(game, "Llanowar Elves", A);
    const handBefore = game.handOf(A).length;

    a.declareAttackersFn = () => [{ attacker: voja, defender: B }];
    game.advanceUntil(() => vojaTriggerOnStack(game, voja));

    // With the trigger waiting on the stack, a second Elf and a Wolf arrive.
    const lateElf = spawn(game, "Elvish Mystic", A);
    const lateWolf = spawn(game, TEST_WOLF, A);

    game.advanceUntil((s) => settled(s) && !vojaTriggerOnStack(game, voja));

    // X = 2, not the 1 there was when Voja attacked, and the latecomers get
    // counters too — they're creatures you control as it resolves.
    expect(plusOnes(game, voja)).toBe(2);
    expect(plusOnes(game, lateElf)).toBe(2);
    expect(plusOnes(game, lateWolf)).toBe(2);
    // Two Wolves (Voja and the latecomer) = two cards.
    expect(game.handOf(A).length).toBe(handBefore + 2);
  });

  it("composes with Doubling Season: twice X counters on each creature", () => {
    const { game, a } = makeGame();
    const voja = spawn(game, VOJA, A);
    const elf = spawn(game, "Llanowar Elves", A);
    spawn(game, "Doubling Season", A);

    a.declareAttackersFn = () => [{ attacker: voja, defender: B }];
    game.advanceUntil(toPostcombat);

    // X = 1 Elf, doubled to 2 on each (rule 614.1a).
    expect(plusOnes(game, voja)).toBe(2);
    expect(plusOnes(game, elf)).toBe(2);
  });

  it("counts every Elf token in a compacted stack, and grows every one of them", () => {
    const { game, a } = makeGame();
    const voja = spawn(game, VOJA, A);
    game.debugApplyEffect(A, { kind: "create-token", token: "Elf Warrior Token", count: 9 });
    const stack = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Elf Warrior Token",
    );
    if (stack === undefined) throw new Error("no Elf Warrior stack");
    expect(game.state.objects[stack].stackCount).toBe(9);
    for (const id of game.state.zones.shared.battlefield) game.state.objects[id].summoningSick = false;

    a.declareAttackersFn = () => [{ attacker: voja, defender: B }];
    game.advanceUntil(toPostcombat);

    // Nine Elves: X = 9, on Voja and on each of the nine tokens.
    expect(plusOnes(game, voja)).toBe(9);
    expect(plusOnes(game, stack)).toBe(9);
    expect(game.state.objects[stack].stackCount).toBe(9);
    expect(game.characteristics(stack).power).toBe(10);
  });

  it("triggers only on its own attack, once per attack", () => {
    const { game, a } = makeGame();
    const voja = spawn(game, VOJA, A);
    const elf = spawn(game, "Llanowar Elves", A);
    const bears = spawn(game, "Grizzly Bears", A);
    const handBefore = game.handOf(A).length;

    // Another creature attacking without Voja: nothing.
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil(toPostcombat);
    expect(plusOnes(game, voja)).toBe(0);
    expect(plusOnes(game, elf)).toBe(0);
    expect(game.handOf(A).length).toBe(handBefore);

    // Next turn of Alice's: Voja attacks alongside two others — one trigger.
    game.advanceUntil(
      (s) => s.turn.number === 3 && s.turn.step === "precombat-main" && s.priority.holder === A,
    );
    const handTurn3 = game.handOf(A).length;
    a.declareAttackersFn = () => [
      { attacker: voja, defender: B },
      { attacker: elf, defender: B },
      { attacker: bears, defender: B },
    ];
    game.advanceUntil(toPostcombat);
    for (const id of [voja, elf, bears]) expect(plusOnes(game, id)).toBe(1);
    expect(game.handOf(A).length).toBe(handTurn3 + 1);
  });

  describe("ward {3}", () => {
    const bolt = (game: Game, caster: PlayerId, target: ObjectId): void => {
      const card = game.handOf(caster).find((id) => game.state.objects[id].cardName === "Lightning Bolt");
      if (card === undefined) throw new Error("no Lightning Bolt in hand");
      game.dispatch({
        type: "cast-spell",
        player: caster,
        card,
        targets: [{ kind: "object", object: target }],
      });
      game.advanceUntil(settled);
    };

    it("taxes an opponent's targeted spell {3} when they can pay", () => {
      const { game } = makeGame(["Lightning Bolt"]);
      const voja = spawn(game, VOJA, B);
      const mountains = [0, 1, 2, 3].map(() => spawn(game, "Mountain", A));

      bolt(game, A, voja);

      expect(game.eventsOfType("ward-paid").some((e) => e.object === voja)).toBe(true);
      expect(game.state.objects[voja].damageMarked).toBe(3);
      // {R} for the Bolt + {3} for ward: all four Mountains.
      expect(mountains.every((id) => game.state.objects[id].tapped)).toBe(true);
    });

    it("counters an opponent's targeted spell when they can't pay {3}", () => {
      const { game } = makeGame(["Lightning Bolt"]);
      const voja = spawn(game, VOJA, B);
      // The Bolt plus two more — one short of ward {3}.
      for (let i = 0; i < 3; i += 1) spawn(game, "Mountain", A);

      bolt(game, A, voja);

      expect(game.eventsOfType("ward-paid")).toHaveLength(0);
      expect(game.eventsOfType("spell-countered").length).toBeGreaterThan(0);
      expect(game.state.objects[voja].damageMarked).toBe(0);
      expect(
        game.graveyardOf(A).some((id) => game.state.objects[id].cardName === "Lightning Bolt"),
      ).toBe(true);
    });

    it("doesn't tax its controller's own spell", () => {
      const { game } = makeGame(["Lightning Bolt"]);
      const voja = spawn(game, VOJA, A);
      spawn(game, "Mountain", A);

      bolt(game, A, voja);

      expect(game.eventsOfType("ward-paid")).toHaveLength(0);
      expect(game.state.objects[voja].damageMarked).toBe(3);
    });
  });
});
