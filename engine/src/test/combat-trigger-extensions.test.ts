/**
 * The combat-trigger vocabulary around attacks and blocks:
 *
 * - "whenever **another** Cat you control attacks" — `otherOnly` on `attacks`
 *   (Arahbo, Roar of the World), and on `blocks` and
 *   `deals-combat-damage-to-player`;
 * - "whenever ~ attacks **a player** / **an opponent**" — `defender` (Kaalia
 *   of the Vast): attacking a planeswalker isn't attacking its controller;
 * - "…, if no other creatures are attacking that player" —
 *   `aloneAgainstDefender`, an intervening-if over the whole declaration;
 * - "whenever ~ **becomes blocked**" — once, however many block it (Anzrag,
 *   the Quake-Mole);
 * - "whenever a creature you control attacks **or blocks**, **it** gets …" —
 *   the blocker is a `blocks` trigger's object (Doran, Besieged by Time);
 * - "you gain life equal to **that creature's** toughness" — the damaging
 *   creature is a combat-damage trigger's object (Ikra Shidiqi), read as it
 *   last existed if the same damage killed it;
 * - "whenever a player attacks one of your opponents" — `attacks-player`,
 *   once per player attacked (Breena, the Demagogue).
 */

import { describe, expect, it } from "vitest";

import type { TriggerSpec } from "../abilities.js";
import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const D = asPlayerId("dave");

const creature = (
  name: string,
  power: number,
  toughness: number,
  subtypes: readonly string[],
  trigger?: TriggerSpec,
  effect?: EffectSpec,
  keywords: readonly ("trample" | "vigilance")[] = [],
) =>
  defineCard({
    name,
    manaCost: "{0}",
    types: ["creature"],
    subtypes: [...subtypes],
    power,
    toughness,
    keywords: [...keywords],
    text: name,
    triggered:
      trigger !== undefined && effect !== undefined
        ? [{ trigger, targets: [], effect, resolve: null, text: name }]
        : [],
  });

const pump = (power: number, toughness: number): EffectSpec => ({
  kind: "modify-pt",
  target: "trigger-object",
  power,
  toughness,
  duration: "end-of-turn",
});

/** "Whenever another Cat you control attacks, it gets +1/+1 until end of turn." */
const RALLIER = "Test Cat Rallier";
const CAT = "Test Cat";
/** "Whenever this attacks an opponent, that player loses 1 life." */
const RAIDER = "Test Opponent Raider";
/** "Whenever a creature you control attacks a player, if no other creatures
 * are attacking that player, it gets +2/+0 until end of turn." */
const DUELIST = "Test Duelist";
/** "Whenever this becomes blocked, draw a card." */
const MOLE = "Test Blocked Mole";
/** "Whenever a creature you control becomes blocked, it gets +1/+1 until end
 * of turn and defending player loses 2 life." */
const BLOCK_WATCHER = "Test Block Watcher";
/** "Whenever a creature you control blocks, it gets +0/+3 until end of turn." */
const STALWART = "Test Stalwart";
/** "Whenever another creature you control blocks, draw a card." */
const OTHER_BLOCKS = "Test Other Blocks";
/** "Whenever a creature you control deals combat damage to a player, you gain
 * life equal to that creature's toughness." */
const USURPER = "Test Usurper";
/** "Whenever another creature you control deals combat damage to a player,
 * draw a card." */
const OTHER_DAMAGE = "Test Other Damage";
/** "Whenever a player attacks one of your opponents, that attacking player
 * draws a card and that opponent gains 1 life for each creature attacking
 * them." */
const DEMAGOGUE = "Test Demagogue";
const TRAMPLER = "Test Trampler";
/** Arahbo, Roar of the World's second ability: "Whenever another Cat you
 * control attacks, you may pay {1}{G}{W}. If you do, it gains trample and gets
 * +X/+X until end of turn, where X is its power." */
const ROAR = "Test Roar";
const BIG_CAT = "Test Big Cat";

const registry = createDefaultRegistry()
  .register(
    creature(
      RALLIER,
      2,
      2,
      ["Cat"],
      { on: "attacks", who: "you-control", filter: { subtype: "Cat" }, otherOnly: true },
      pump(1, 1),
    ),
  )
  .register(creature(CAT, 1, 1, ["Cat"]))
  .register(
    creature(
      RAIDER,
      1,
      1,
      ["Human"],
      { on: "attacks", who: "self", defender: "player" },
      { kind: "lose-life", amount: 1, who: "trigger-player" },
    ),
  )
  .register(
    creature(
      DUELIST,
      1,
      1,
      ["Samurai"],
      { on: "attacks", who: "you-control", defender: "player", aloneAgainstDefender: true },
      pump(2, 0),
    ),
  )
  .register(
    creature(MOLE, 3, 3, ["Mole"], { on: "becomes-blocked", who: "self" }, { kind: "draw", amount: 1 }),
  )
  .register(
    creature(
      BLOCK_WATCHER,
      0,
      4,
      ["Wall"],
      { on: "becomes-blocked", who: "you-control" },
      {
        kind: "sequence",
        effects: [pump(1, 1), { kind: "lose-life", amount: 2, who: "trigger-player" }],
      },
    ),
  )
  .register(creature(STALWART, 1, 1, ["Soldier"], { on: "blocks", who: "you-control" }, pump(0, 3)))
  .register(
    creature(
      OTHER_BLOCKS,
      1,
      1,
      ["Soldier"],
      { on: "blocks", who: "you-control", otherOnly: true },
      { kind: "draw", amount: 1 },
    ),
  )
  .register(
    creature(
      USURPER,
      1,
      1,
      ["Snake"],
      { on: "deals-combat-damage-to-player", who: "you-control" },
      { kind: "gain-life", amount: { toughnessOf: "trigger-object" } },
    ),
  )
  .register(
    creature(
      OTHER_DAMAGE,
      1,
      1,
      ["Rogue"],
      { on: "deals-combat-damage-to-player", who: "you-control", otherOnly: true },
      { kind: "draw", amount: 1 },
    ),
  )
  .register(
    creature(
      DEMAGOGUE,
      1,
      3,
      ["Bird"],
      { on: "attacks-player", who: "any", defender: "opponent" },
      {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1, who: "active-player" },
          { kind: "gain-life", amount: { triggerValue: true }, who: "trigger-player" },
        ],
      },
    ),
  )
  .register(creature(TRAMPLER, 5, 3, ["Beast"], undefined, undefined, ["trample"]))
  .register(creature(BIG_CAT, 3, 2, ["Cat"]))
  .register(
    creature(
      ROAR,
      2,
      2,
      ["Cat", "Avatar"],
      { on: "attacks", who: "you-control", filter: { subtype: "Cat" }, otherOnly: true },
      {
        kind: "may",
        prompt: "Pay {1}{G}{W}?",
        cost: "{1}{G}{W}",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "grant-keyword", target: "trigger-object", keyword: "trample", duration: "end-of-turn" },
            {
              kind: "modify-pt",
              target: "trigger-object",
              power: { powerOf: "trigger-object" },
              toughness: { powerOf: "trigger-object" },
              duration: "end-of-turn",
            },
          ],
        },
      },
    ),
  );

const setUp = (players: readonly PlayerId[] = [A, B]) => {
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)])) as Record<
    string,
    ScriptedController
  >;
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, controllers };
};

const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";
const fired = (game: Game, source: ObjectId): number =>
  game.eventsOfType("ability-triggered").filter((e) => e.source === source).length;
const power = (game: Game, id: ObjectId): number => game.characteristics(id).power;
const toughness = (game: Game, id: ObjectId): number => game.characteristics(id).toughness;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const hand = (game: Game, player: PlayerId): number => game.handOf(player).length;

describe("otherOnly on attacks: 'whenever another Cat you control attacks'", () => {
  it("another Cat attacking fires it, pumping that Cat; the source attacking doesn't", () => {
    const { game, controllers } = setUp();
    const rallier = spawn(game, RALLIER, A);
    const cat = spawn(game, CAT, A);
    controllers[A].declareAttackersFn = () => [
      { attacker: rallier, defender: B },
      { attacker: cat, defender: B },
    ];
    game.advanceUntil((s) => s.turn.step === "declare-blockers" && s.zones.shared.stack.length === 0);
    expect(fired(game, rallier)).toBe(1);
    expect(power(game, cat)).toBe(2);
    expect(power(game, rallier)).toBe(2);
  });

  it("Arahbo's shape: pay {1}{G}{W} and that Cat gains trample and +X/+X, X its power", () => {
    const { game, controllers } = setUp();
    const roar = spawn(game, ROAR, A);
    const cat = spawn(game, BIG_CAT, A);
    const lands = ["Forest", "Plains", "Island"].map((name) => spawn(game, name, A));
    controllers[A].chooseModesFn = () => [0];
    controllers[A].declareAttackersFn = () => [
      { attacker: roar, defender: B },
      { attacker: cat, defender: B },
    ];
    game.advanceUntil((s) => s.turn.step === "declare-blockers" && s.zones.shared.stack.length === 0);
    expect(fired(game, roar)).toBe(1);
    expect(lands.every((id) => game.state.objects[id].tapped)).toBe(true);
    expect(power(game, cat)).toBe(6);
    expect(toughness(game, cat)).toBe(5);
    expect(game.characteristics(cat).keywords).toContain("trample");
    expect(power(game, roar)).toBe(2);
  });

  it("a non-Cat attacking doesn't fire it", () => {
    const { game, controllers } = setUp();
    const rallier = spawn(game, RALLIER, A);
    const bears = spawn(game, "Grizzly Bears", A);
    controllers[A].declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil(toPostcombat);
    expect(fired(game, rallier)).toBe(0);
  });
});

describe("'attacks a player': a planeswalker isn't its controller", () => {
  it("attacking the opponent fires it, and that opponent is the trigger player", () => {
    const { game, controllers } = setUp();
    const raider = spawn(game, RAIDER, A);
    controllers[A].declareAttackersFn = () => [{ attacker: raider, defender: B }];
    game.advanceUntil(toPostcombat);
    expect(fired(game, raider)).toBe(1);
    // 1 from the trigger, 1 combat damage.
    expect(life(game, B)).toBe(18);
  });

  it("attacking the opponent's planeswalker doesn't", () => {
    const { game, controllers } = setUp();
    const raider = spawn(game, RAIDER, A);
    const walker = spawn(game, "Garruk Wildspeaker", B);
    controllers[A].declareAttackersFn = () => [{ attacker: raider, defender: walker }];
    game.advanceUntil(toPostcombat);
    expect(fired(game, raider)).toBe(0);
    expect(life(game, B)).toBe(20);
  });
});

describe("'if no other creatures are attacking that player'", () => {
  it("reads the whole declaration: a lone attacker fires, a pair at one player doesn't", () => {
    const { game, controllers } = setUp([A, B, C]);
    const duelist = spawn(game, DUELIST, A);
    const first = spawn(game, "Grizzly Bears", A);
    const second = spawn(game, "Grizzly Bears", A);
    const alone = spawn(game, "Hill Giant", A);
    // `first` is declared before its partner — it still isn't alone.
    controllers[A].declareAttackersFn = () => [
      { attacker: first, defender: B },
      { attacker: alone, defender: C },
      { attacker: second, defender: B },
    ];
    game.advanceUntil((s) => s.turn.step === "declare-blockers" && s.zones.shared.stack.length === 0);
    expect(fired(game, duelist)).toBe(1);
    expect(power(game, alone)).toBe(5);
    expect(power(game, first)).toBe(2);
    expect(power(game, second)).toBe(2);
  });

  it("a creature attacking a planeswalker doesn't keep another from being alone at its controller", () => {
    const { game, controllers } = setUp();
    spawn(game, DUELIST, A);
    const walker = spawn(game, "Garruk Wildspeaker", B);
    const atPlayer = spawn(game, "Grizzly Bears", A);
    const atWalker = spawn(game, "Grizzly Bears", A);
    controllers[A].declareAttackersFn = () => [
      { attacker: atPlayer, defender: B },
      { attacker: atWalker, defender: walker },
    ];
    game.advanceUntil((s) => s.turn.step === "declare-blockers" && s.zones.shared.stack.length === 0);
    expect(power(game, atPlayer)).toBe(4);
    expect(power(game, atWalker)).toBe(2);
  });

  it("is asked again on resolution: another creature attacking that player by then stops it", () => {
    const { game, controllers } = setUp();
    const duelist = spawn(game, DUELIST, A);
    const bears = spawn(game, "Grizzly Bears", A);
    controllers[A].declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.zones.shared.stack.length > 0);
    // A creature put onto the battlefield attacking that player meanwhile.
    const late = spawn(game, "Hill Giant", A);
    game.state.objects[late].attacking = B;
    game.advanceUntil((s) => s.turn.step === "declare-blockers" && s.zones.shared.stack.length === 0);
    expect(fired(game, duelist)).toBe(1);
    expect(power(game, bears)).toBe(2);
    expect(
      game.eventsOfType("spell-fizzled").some((e) => e.reason.includes("intervening-if")),
    ).toBe(true);
  });
});

describe("becomes blocked", () => {
  it("fires once however many creatures block it, and not when unblocked", () => {
    const { game, controllers } = setUp();
    const mole = spawn(game, MOLE, A);
    const blockers = [spawn(game, "Grizzly Bears", B), spawn(game, "Grizzly Bears", B)];
    controllers[A].declareAttackersFn = () => [{ attacker: mole, defender: B }];
    controllers[B].declareBlockersFn = () => blockers.map((blocker) => ({ blocker, attacker: mole }));
    const before = hand(game, A);
    game.advanceUntil(toPostcombat);
    expect(fired(game, mole)).toBe(1);
    expect(hand(game, A)).toBe(before + 1);
  });

  it("an unblocked attacker doesn't fire it", () => {
    const { game, controllers } = setUp();
    const mole = spawn(game, MOLE, A);
    controllers[A].declareAttackersFn = () => [{ attacker: mole, defender: B }];
    game.advanceUntil(toPostcombat);
    expect(fired(game, mole)).toBe(0);
  });

  it("the blocked attacker is the trigger object, its defending player the trigger player", () => {
    const { game, controllers } = setUp([A, B, C]);
    const watcher = spawn(game, BLOCK_WATCHER, A);
    const blocked = spawn(game, "Hill Giant", A);
    const unblocked = spawn(game, "Grizzly Bears", A);
    const blocker = spawn(game, "Grizzly Bears", C);
    controllers[A].declareAttackersFn = () => [
      { attacker: blocked, defender: C },
      { attacker: unblocked, defender: B },
    ];
    controllers[C].declareBlockersFn = () => [{ blocker, attacker: blocked }];
    game.advanceUntil((s) => s.turn.step === "combat-damage");
    expect(fired(game, watcher)).toBe(1);
    expect(power(game, blocked)).toBe(4);
    expect(power(game, unblocked)).toBe(2);
    // C lost 2 to the trigger; B only the unblocked Bears' 2 combat damage.
    expect(life(game, C)).toBe(18);
    expect(life(game, B)).toBe(18);
  });
});

describe("blocks: the blocker is the trigger object", () => {
  it("'whenever a creature you control blocks, it gets +0/+3'", () => {
    const { game, controllers } = setUp();
    const stalwart = spawn(game, STALWART, B);
    const blocker = spawn(game, "Grizzly Bears", B);
    const attacker = spawn(game, "Hill Giant", A);
    controllers[A].declareAttackersFn = () => [{ attacker, defender: B }];
    controllers[B].declareBlockersFn = () => [{ blocker, attacker }];
    game.advanceUntil((s) => s.turn.step === "combat-damage");
    expect(fired(game, stalwart)).toBe(1);
    expect(toughness(game, blocker)).toBe(5);
    expect(toughness(game, stalwart)).toBe(1);
    game.advanceUntil(toPostcombat);
    // A 2/5 survives the Giant's 3.
    expect(game.state.objects[blocker].zone).toBe("battlefield");
  });

  it("otherOnly: the source blocking doesn't fire it, another blocker does", () => {
    const { game, controllers } = setUp();
    const watcher = spawn(game, OTHER_BLOCKS, B);
    const bears = spawn(game, "Grizzly Bears", B);
    const first = spawn(game, "Hill Giant", A);
    const second = spawn(game, "Hill Giant", A);
    controllers[A].declareAttackersFn = () => [
      { attacker: first, defender: B },
      { attacker: second, defender: B },
    ];
    controllers[B].declareBlockersFn = () => [
      { blocker: watcher, attacker: first },
      { blocker: bears, attacker: second },
    ];
    const before = hand(game, B);
    game.advanceUntil((s) => s.turn.step === "combat-damage");
    expect(fired(game, watcher)).toBe(1);
    expect(hand(game, B)).toBe(before + 1);
  });
});

describe("combat damage to a player: the damaging creature is the trigger object", () => {
  it("gains life equal to each creature's toughness", () => {
    const { game, controllers } = setUp();
    spawn(game, USURPER, A);
    const bears = spawn(game, "Grizzly Bears", A);
    const giant = spawn(game, "Hill Giant", A);
    controllers[A].declareAttackersFn = () => [
      { attacker: bears, defender: B },
      { attacker: giant, defender: B },
    ];
    game.advanceUntil(toPostcombat);
    expect(life(game, A)).toBe(20 + 2 + 3);
  });

  it("reads a creature the same damage killed as it last existed", () => {
    const { game, controllers } = setUp();
    spawn(game, USURPER, A);
    const trampler = spawn(game, TRAMPLER, A);
    game.debugApplyEffect(
      A,
      { kind: "modify-pt", target: 0, power: 0, toughness: 1, duration: "end-of-turn" },
      [{ kind: "object", object: trampler }],
    );
    // A 4/4 takes 4 of the 5/4's damage, 1 tramples over, and it deals 4 back.
    const blocker = spawn(game, "Test Blocked Mole", B);
    game.debugApplyEffect(
      B,
      { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      [{ kind: "object", object: blocker }],
    );
    controllers[A].declareAttackersFn = () => [{ attacker: trampler, defender: B }];
    controllers[B].declareBlockersFn = () => [{ blocker, attacker: trampler }];
    game.advanceUntil(toPostcombat);
    expect(game.state.objects[trampler].zone).toBe("graveyard");
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(24);
  });

  it("otherOnly: the source's own damage doesn't fire it", () => {
    const { game, controllers } = setUp();
    const watcher = spawn(game, OTHER_DAMAGE, A);
    const bears = spawn(game, "Grizzly Bears", A);
    controllers[A].declareAttackersFn = () => [
      { attacker: watcher, defender: B },
      { attacker: bears, defender: B },
    ];
    game.advanceUntil(toPostcombat);
    expect(fired(game, watcher)).toBe(1);
  });
});

describe("'whenever a player attacks one of your opponents'", () => {
  it("fires once per opponent attacked, naming that opponent; the attacking player draws", () => {
    const { game, controllers } = setUp([A, B, C, D]);
    const demagogue = spawn(game, DEMAGOGUE, D);
    const walker = spawn(game, "Garruk Wildspeaker", C);
    const attackers = [
      spawn(game, "Grizzly Bears", A),
      spawn(game, "Grizzly Bears", A),
      spawn(game, "Grizzly Bears", A),
    ];
    controllers[A].declareAttackersFn = () => [
      { attacker: attackers[0], defender: B },
      { attacker: attackers[1], defender: B },
      // Attacking C's planeswalker isn't attacking C.
      { attacker: attackers[2], defender: walker },
    ];
    const before = hand(game, A);
    game.advanceUntil((s) => s.turn.step === "declare-blockers" && s.zones.shared.stack.length === 0);
    expect(fired(game, demagogue)).toBe(1);
    expect(hand(game, A)).toBe(before + 1);
    expect(life(game, B)).toBe(22);
    expect(life(game, C)).toBe(20);
  });

  it("an attack on you isn't an attack on one of your opponents", () => {
    const { game, controllers } = setUp([A, B, C]);
    const demagogue = spawn(game, DEMAGOGUE, B);
    const bears = spawn(game, "Grizzly Bears", A);
    const giant = spawn(game, "Hill Giant", A);
    controllers[A].declareAttackersFn = () => [
      { attacker: bears, defender: B },
      { attacker: giant, defender: C },
    ];
    game.advanceUntil((s) => s.turn.step === "declare-blockers" && s.zones.shared.stack.length === 0);
    expect(fired(game, demagogue)).toBe(1);
    expect(life(game, C)).toBe(21);
    expect(life(game, B)).toBe(20);
  });
});
