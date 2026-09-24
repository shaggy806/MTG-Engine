/**
 * "Assigns combat damage equal to its toughness rather than its power" and
 * "can attack as though it didn't have defender" — the
 * `combatDamageByToughness` and `canAttackAsThoughNoDefender` statics, and
 * the cards built on them:
 *
 * - Felothar the Steadfast ({1}{W}{B}{G} 0/5): both statics over creatures
 *   you control, and "{3}, {T}, Sacrifice another creature: Draw cards equal
 *   to the sacrificed creature's toughness, then discard cards equal to its
 *   power."
 * - Arcades, the Strategist ({1}{G}{W}{U} 3/5 flying, vigilance): both,
 *   narrowed to creatures you control **with defender**, and a draw whenever
 *   one enters.
 * - Doran, the Siege Tower: every creature, whoever controls it.
 * - Ancient Lumberknot: only creatures whose toughness is greater than their
 *   power.
 * - High Alert: Felothar's statics, plus "{2}{W}{U}: Untap target creature."
 *
 * Every place combat damage is sized reads the toughness: an unblocked
 * attacker, a blocker, the split across blockers, what tramples over, the
 * `assign-combat-damage` offer, whether that offer is needed at all, and the
 * bots' combat arithmetic. Nothing's *power* changes (every card's ruling):
 * a fight, or the sacrificed creature's power, still reads the real one.
 */
import { describe, expect, it } from "vitest";

import { combatCreatures, damageThrough } from "../bot/combat-math.js";
import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import type { CardRegistry } from "../cards/registry.js";
import { computeCharacteristics } from "../characteristics.js";
import { whyCannotAttack } from "../combat/eligibility.js";
import { HeuristicBotController, ScriptedController } from "../controller.js";
import type { PlayerController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** A vanilla 1/4 with no defender: toughness greater than power, which no
 * vanilla pool creature has. */
const bulwark = defineCard({
  name: "Test Bulwark",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk"],
  power: 1,
  toughness: 4,
  text: "",
});

const registry: CardRegistry = createDefaultRegistry().register(bulwark);

const setUp = (
  aDeck: readonly string[] = [],
  aController?: PlayerController,
) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: aController ?? a, [B]: b },
    decks: [
      { player: A, cards: [...aDeck, ...Array<string>(40).fill("Forest")] },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const zoneOf = (game: Game, id: ObjectId): string => game.state.objects[id]?.zone ?? "gone";
const apply = (game: Game, effect: EffectSpec, ...targets: ObjectId[]): void =>
  game.debugApplyEffect(
    A,
    effect,
    targets.map((object) => ({ kind: "object", object })),
  );
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";
const attackWith = (a: ScriptedController, ...attackers: ObjectId[]): void => {
  a.declareAttackersFn = () => attackers.map((attacker) => ({ attacker, defender: B }));
};
const eligibleAttackers = (game: Game): readonly ObjectId[] => {
  game.advanceUntil((s) => s.awaiting?.kind === "attackers");
  const offer = game.legalActions(A).find((x) => x.kind === "declare-attackers");
  return offer?.kind === "declare-attackers" ? offer.eligible : [];
};

describe("combatDamageByToughness", () => {
  it("an unblocked creature deals its toughness, and its power doesn't change", () => {
    const { game, a } = setUp();
    const felothar = spawn(game, "Felothar the Steadfast");
    const bulwarkId = spawn(game, "Test Bulwark");
    const bears = spawn(game, "Grizzly Bears");

    expect(chars(game, bulwarkId).power).toBe(1);
    expect(chars(game, bulwarkId).damageByToughness).toBe(true);
    attackWith(a, felothar, bulwarkId, bears);
    game.advanceUntil(toPostcombat);

    // 5 (Felothar, a 0/5) + 4 (the 1/4) + 2 (the 2/2).
    expect(life(game, B)).toBe(20 - 11);
  });

  it("covers blockers too, but only the creatures it affects", () => {
    // Felothar is "creatures you control": the attacker deals its toughness,
    // the opponent's blocker its power.
    const { game, a, b } = setUp();
    spawn(game, "Felothar the Steadfast");
    const mine = spawn(game, "Test Bulwark");
    const theirs = spawn(game, "Test Bulwark", B);
    attackWith(a, mine);
    b.declareBlockersFn = () => [{ blocker: theirs, attacker: mine }];
    game.advanceUntil(toPostcombat);

    expect(zoneOf(game, theirs)).toBe("graveyard");
    expect(zoneOf(game, mine)).toBe("battlefield");
    expect(game.state.objects[mine].damageMarked).toBe(1);
  });

  it("Doran, the Siege Tower affects every creature, the opponent's blockers included", () => {
    const { game, a, b } = setUp();
    // Doran is the *opponent's*, and still resizes the attacker's damage.
    spawn(game, "Doran, the Siege Tower", B);
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Test Bulwark", B);
    attackWith(a, bears);
    b.declareBlockersFn = () => [{ blocker: theirs, attacker: bears }];
    game.advanceUntil(toPostcombat);

    // The 1/4 blocker deals 4 and kills the Bears; the Bears' 2 doesn't
    // kill it.
    expect(zoneOf(game, bears)).toBe("graveyard");
    expect(zoneOf(game, theirs)).toBe("battlefield");
    expect(game.state.objects[theirs].damageMarked).toBe(2);
  });

  it("without the static, the same block leaves both alive", () => {
    const { game, a, b } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Test Bulwark", B);
    attackWith(a, bears);
    b.declareBlockersFn = () => [{ blocker: theirs, attacker: bears }];
    game.advanceUntil(toPostcombat);

    expect(zoneOf(game, bears)).toBe("battlefield");
    expect(zoneOf(game, theirs)).toBe("battlefield");
  });

  it("sizes the assign-combat-damage offer and the trample excess by toughness", () => {
    const { game, a, b } = setUp();
    spawn(game, "Doran, the Siege Tower");
    const wurm = spawn(game, "Craw Wurm"); // 6/4 trample
    const bears = spawn(game, "Grizzly Bears", B);
    attackWith(a, wurm);
    b.declareBlockersFn = () => [{ blocker: bears, attacker: wurm }];
    let offered: { power: number; lethal: readonly number[] } | null = null;
    a.assignCombatDamageFn = (_view, info) => {
      offered = { power: info.power, lethal: info.lethal };
      return [2];
    };
    game.advanceUntil(toPostcombat);

    expect(offered).toEqual({ power: 4, lethal: [2] });
    expect(zoneOf(game, bears)).toBe("graveyard");
    // 4 assigned, 2 of it on the Bears: 2 tramples over, not 4.
    expect(life(game, B)).toBe(18);
  });

  it("asks for no assignment when the toughness is exactly the lone blocker's lethal", () => {
    // Craw Wurm's 6 power would leave 2 to trample over a 1/4 — a choice. Its
    // 4 toughness leaves nothing, so there is none to ask.
    const { game, a, b } = setUp();
    spawn(game, "Doran, the Siege Tower");
    const wurm = spawn(game, "Craw Wurm");
    const theirs = spawn(game, "Test Bulwark", B);
    attackWith(a, wurm);
    b.declareBlockersFn = () => [{ blocker: theirs, attacker: wurm }];
    let asked = false;
    a.assignCombatDamageFn = (_view, info) => {
      asked = true;
      return [info.power];
    };
    game.advanceUntil(toPostcombat);

    expect(asked).toBe(false);
    expect(zoneOf(game, theirs)).toBe("graveyard");
    expect(life(game, B)).toBe(20);
  });

  it("splits toughness-sized damage across several blockers", () => {
    const { game, a, b } = setUp();
    spawn(game, "Felothar the Steadfast");
    const mine = spawn(game, "Test Bulwark"); // assigns 4
    const bears1 = spawn(game, "Grizzly Bears", B);
    const bears2 = spawn(game, "Grizzly Bears", B);
    attackWith(a, mine);
    b.declareBlockersFn = () => [
      { blocker: bears1, attacker: mine },
      { blocker: bears2, attacker: mine },
    ];
    let offered = 0;
    a.assignCombatDamageFn = (_view, info) => {
      offered = info.power;
      return [2, 2];
    };
    game.advanceUntil(toPostcombat);

    expect(offered).toBe(4);
    expect(zoneOf(game, bears1)).toBe("graveyard");
    expect(zoneOf(game, bears2)).toBe("graveyard");
    // Four damage from two Bears is exactly lethal to the 1/4.
    expect(zoneOf(game, mine)).toBe("graveyard");
  });

  it("a double striker deals its toughness in both damage steps", () => {
    const { game, a } = setUp();
    spawn(game, "Doran, the Siege Tower");
    const thresher = spawn(game, "Combat Thresher"); // 3/3 double strike
    apply(game, { kind: "modify-pt", target: 0, power: 0, toughness: 2, duration: "end-of-turn" }, thresher);
    attackWith(a, thresher);
    game.advanceUntil(toPostcombat);

    expect(life(game, B)).toBe(20 - 5 - 5);
  });

  it("changes no creature's power: a fight still uses power", () => {
    const { game } = setUp();
    spawn(game, "Doran, the Siege Tower");
    const mine = spawn(game, "Test Bulwark");
    const theirs = spawn(game, "Grizzly Bears", B);
    apply(game, { kind: "fight", a: 0, b: 1 }, mine, theirs);

    expect(zoneOf(game, theirs)).toBe("battlefield");
    expect(game.state.objects[theirs].damageMarked).toBe(1);
    expect(game.state.objects[mine].damageMarked).toBe(2);
  });

  it("stops when its source loses its abilities", () => {
    const { game, a } = setUp();
    const doran = spawn(game, "Doran, the Siege Tower");
    const mine = spawn(game, "Test Bulwark");
    apply(
      game,
      {
        kind: "animate",
        target: 0,
        power: 1,
        toughness: 1,
        addTypes: [],
        addSubtypes: [],
        loseAbilities: true,
        duration: "end-of-turn",
      },
      doran,
    );
    attackWith(a, mine);
    game.advanceUntil(toPostcombat);

    expect(chars(game, mine).damageByToughness).toBe(false);
    expect(life(game, B)).toBe(19);
  });
});

describe('"if-toughness-greater" (Ancient Lumberknot)', () => {
  it("resizes only creatures whose toughness is greater than their power", () => {
    const { game, a } = setUp();
    spawn(game, "Ancient Lumberknot");
    const mine = spawn(game, "Test Bulwark"); // 1/4 → 4
    const bears = spawn(game, "Grizzly Bears"); // 2/2 → 2
    const wurm = spawn(game, "Craw Wurm"); // 6/4 → 6
    expect(chars(game, mine).damageByToughness).toBe(true);
    expect(chars(game, bears).damageByToughness).toBe(false);
    expect(chars(game, wurm).damageByToughness).toBe(false);
    attackWith(a, mine, bears, wurm);
    game.advanceUntil(toPostcombat);

    expect(life(game, B)).toBe(20 - 4 - 2 - 6);
  });

  it("is judged on the computed P/T, so a pump can switch it either way", () => {
    const { game, a } = setUp();
    spawn(game, "Ancient Lumberknot");
    const mine = spawn(game, "Test Bulwark");
    const wurm = spawn(game, "Craw Wurm");
    // The 1/4 becomes a 5/4 and deals its power; the 6/4 becomes a 6/7 and
    // deals its toughness.
    apply(game, { kind: "modify-pt", target: 0, power: 4, toughness: 0, duration: "end-of-turn" }, mine);
    apply(game, { kind: "modify-pt", target: 0, power: 0, toughness: 3, duration: "end-of-turn" }, wurm);
    attackWith(a, mine, wurm);
    game.advanceUntil(toPostcombat);

    expect(life(game, B)).toBe(20 - 5 - 7);
  });

  it('gives way to an "always" static', () => {
    const { game, a } = setUp();
    // Doran first, so the later timestamp is the narrower static's.
    spawn(game, "Doran, the Siege Tower", B);
    spawn(game, "Ancient Lumberknot");
    const wurm = spawn(game, "Craw Wurm");
    attackWith(a, wurm);
    game.advanceUntil(toPostcombat);

    expect(life(game, B)).toBe(16);
  });
});

describe("canAttackAsThoughNoDefender", () => {
  it("lets a defender attack, dealing its toughness under Felothar", () => {
    const { game, a } = setUp();
    const wall = spawn(game, "Wall of Wood"); // 0/3 defender
    expect(whyCannotAttack(game.state, registry, A, wall, B)).toMatch(/defender/);

    spawn(game, "Felothar the Steadfast");
    expect(whyCannotAttack(game.state, registry, A, wall, B)).toBeNull();
    expect(eligibleAttackers(game)).toContain(wall);
    // It still has defender; it just may attack anyway.
    expect(chars(game, wall).keywords.has("defender")).toBe(true);

    attackWith(a, wall);
    game.advanceUntil(toPostcombat);
    expect(life(game, B)).toBe(17);
  });

  it("lifts only defender: a summoning-sick defender still can't attack", () => {
    const { game } = setUp();
    spawn(game, "Felothar the Steadfast");
    const wall = game.debugSpawn("Wall of Wood", A, "battlefield");
    expect(whyCannotAttack(game.state, registry, A, wall, B)).toMatch(/summoning sickness/);
  });

  it("is its controller's: an opponent's defender still can't attack", () => {
    const { game } = setUp();
    spawn(game, "Felothar the Steadfast");
    const theirs = spawn(game, "Wall of Wood", B);
    expect(whyCannotAttack(game.state, registry, B, theirs, A)).toMatch(/defender/);
  });
});

describe("Arcades, the Strategist", () => {
  it("only its controller's creatures with defender attack and deal their toughness", () => {
    const { game, a } = setUp();
    const arcades = spawn(game, "Arcades, the Strategist");
    const wall = spawn(game, "Wall of Wood");
    const mine = spawn(game, "Test Bulwark"); // no defender: still deals 1
    expect(chars(game, arcades).keywords.has("vigilance")).toBe(true);
    expect(chars(game, mine).damageByToughness).toBe(false);
    expect(chars(game, wall).damageByToughness).toBe(true);
    expect(chars(game, arcades).damageByToughness).toBe(false);

    attackWith(a, arcades, wall, mine);
    game.advanceUntil(toPostcombat);
    // 3 (Arcades' power) + 3 (the wall's toughness) + 1 (the 1/4's power).
    expect(life(game, B)).toBe(13);
    expect(game.state.objects[arcades].tapped).toBe(false); // vigilance
  });

  it("reads defender granted after the fact, and ignores a creature that lost it", () => {
    const { game } = setUp();
    spawn(game, "Arcades, the Strategist");
    const mine = spawn(game, "Test Bulwark");
    apply(game, { kind: "grant-keyword", target: 0, keyword: "defender", duration: "end-of-turn" }, mine);
    expect(chars(game, mine).damageByToughness).toBe(true);
    expect(whyCannotAttack(game.state, registry, A, mine, B)).toBeNull();

    const wall = spawn(game, "Wall of Wood");
    apply(
      game,
      {
        kind: "animate",
        target: 0,
        power: 0,
        toughness: 3,
        addTypes: [],
        addSubtypes: [],
        loseAbilities: true,
        duration: "end-of-turn",
      },
      wall,
    );
    expect(chars(game, wall).keywords.has("defender")).toBe(false);
    expect(chars(game, wall).damageByToughness).toBe(false);
  });

  it("a defender that attacked keeps attacking if Arcades leaves, and deals its power", () => {
    const { game, a } = setUp();
    const arcades = spawn(game, "Arcades, the Strategist");
    const wall = spawn(game, "Wall of Wood");
    attackWith(a, wall);
    game.advanceUntil((s) => s.turn.step === "declare-blockers" && s.awaiting === null);
    expect(game.state.objects[wall].attacking).toBe(B);

    apply(game, { kind: "destroy", target: 0 }, arcades);
    expect(zoneOf(game, arcades)).toBe("graveyard");
    expect(game.state.objects[wall].attacking).toBe(B);

    game.advanceUntil(toPostcombat);
    expect(life(game, B)).toBe(20); // a 0/3 assigning its power
  });

  it("draws a card whenever a creature you control with defender enters", () => {
    const { game } = setUp(["Wall of Wood", "Grizzly Bears"]);
    spawn(game, "Arcades, the Strategist");
    for (let i = 0; i < 4; i += 1) spawn(game, "Forest");
    const hand = (): number => game.handOf(A).length;
    const cast = (name: string): void => {
      const card = game.handOf(A).find((id) => game.state.objects[id].cardName === name);
      if (card === undefined) throw new Error(`no ${name} in hand`);
      game.dispatch({ type: "cast-spell", player: A, card });
      game.advanceUntil(quiet);
    };

    const before = hand();
    cast("Wall of Wood");
    expect(hand()).toBe(before); // cast one, drew one
    cast("Grizzly Bears");
    expect(hand()).toBe(before - 1); // no defender, no draw

    // An opponent's defender entering draws you nothing.
    const library = game.state.zones.perPlayer[A].library.length;
    game.debugSpawn("Wall of Wood", B, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[A].library.length).toBe(library);
  });
});

describe("Felothar the Steadfast's sacrifice ability", () => {
  const withFelothar = () => {
    const env = setUp(["Forest", "Forest", "Forest", "Forest", "Forest", "Forest", "Forest"]);
    const felothar = spawn(env.game, "Felothar the Steadfast");
    for (let i = 0; i < 3; i += 1) spawn(env.game, "Forest");
    const activate = (victim: ObjectId): void => {
      env.game.dispatch({
        type: "activate-ability",
        player: A,
        source: felothar,
        abilityIndex: 0,
        targets: [],
        sacrifice: victim,
      });
      env.game.advanceUntil(quiet);
    };
    return { ...env, felothar, activate };
  };

  it("draws the sacrificed creature's toughness and discards its real power", () => {
    const { game, activate } = withFelothar();
    const victim = spawn(game, "Test Bulwark");
    const hand = game.handOf(A).length;
    const library = game.state.zones.perPlayer[A].library.length;
    const graveyard = game.state.zones.perPlayer[A].graveyard.length;

    activate(victim);

    expect(zoneOf(game, victim)).toBe("graveyard");
    expect(game.state.zones.perPlayer[A].library.length).toBe(library - 4);
    // Draw 4, discard 1 — its power, not the toughness it assigned damage by.
    expect(game.handOf(A).length).toBe(hand + 3);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(graveyard + 2);
  });

  it("reads the sacrificed creature as it last existed, counters included", () => {
    const { game, activate } = withFelothar();
    const bears = spawn(game, "Grizzly Bears");
    apply(game, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 }, bears);
    const hand = game.handOf(A).length;
    const library = game.state.zones.perPlayer[A].library.length;

    activate(bears);

    expect(game.state.zones.perPlayer[A].library.length).toBe(library - 4);
    expect(game.handOf(A).length).toBe(hand);
  });

  it("can't sacrifice Felothar itself", () => {
    const { game, felothar } = withFelothar();
    spawn(game, "Grizzly Bears");
    const offer = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === felothar);
    expect(offer?.kind === "activate-ability" ? offer.sacrifice?.choices : undefined).not.toContain(
      felothar,
    );
  });
});

describe("High Alert", () => {
  it("lets defenders attack for their toughness, and untaps a creature", () => {
    const { game, a } = setUp();
    spawn(game, "High Alert");
    const wall = spawn(game, "Wall of Wood");
    const tapped = game.debugSpawn("Grizzly Bears", A, "battlefield", {
      tapped: true,
      summoningSick: false,
    });
    for (const land of ["Plains", "Island", "Forest", "Forest"]) spawn(game, land);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: game.battlefield.find((id) => game.state.objects[id].cardName === "High Alert")!,
      abilityIndex: 0,
      targets: [{ kind: "object", object: tapped }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[tapped].tapped).toBe(false);

    attackWith(a, wall, tapped);
    game.advanceUntil(toPostcombat);
    expect(life(game, B)).toBe(20 - 3 - 2);
  });
});

describe("the bots' combat arithmetic", () => {
  it("counts a creature's toughness as the damage it deals, and a defender as an attacker", () => {
    const { game } = setUp();
    spawn(game, "Felothar the Steadfast");
    const wall = spawn(game, "Wall of Wood");
    const mine = combatCreatures(game.state, registry, A, false);
    const wallView = mine.find((c) => c.id === wall);
    expect(wallView).toMatchObject({ power: 0, toughness: 3, damage: 3, canAttack: true });

    // Unblocked, Felothar (5) and the wall (3) put 8 through.
    const attackers = mine.filter((c) => c.canAttack);
    expect(damageThrough(attackers, []).damage).toBe(8);
    // A 2/2 blocker holds off one of them.
    const bears = spawn(game, "Grizzly Bears", B);
    const blockers = combatCreatures(game.state, registry, B, true);
    expect(blockers.find((c) => c.id === bears)?.damage).toBe(2);
    expect(damageThrough(attackers, blockers).damage).toBe(3);
  });

  it("v1 attacks with a 0/3 defender that deals 3 under High Alert", () => {
    // High Alert rather than Felothar, whose sacrifice ability v1 would
    // happily spend the wall on first. With only Forests, High Alert's
    // {2}{W}{U} is out of reach.
    const bot = new HeuristicBotController(A, registry);
    const { game } = setUp([], bot);
    spawn(game, "High Alert");
    spawn(game, "Wall of Wood");
    game.advanceUntil(toPostcombat);

    expect(life(game, B)).toBe(17);
  });
});
