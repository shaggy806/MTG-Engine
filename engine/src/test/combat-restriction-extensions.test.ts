/**
 * Combat restrictions beyond Pacifism's and Lure's: "can't be blocked by
 * [filter]" (Delney, Streetwise Lookout) and "can block only [filter]" as
 * statics; "can't attack you" from any static scope (Eriette of the Charmed
 * Apple's creatures enchanted by an Aura you control), not just an Aura's;
 * "can't attack its owner"; one-shot restrictions until end of turn — on a
 * creature, or as a turn-wide rule that binds creatures entering later — via
 * the `restrict` effect; and the "must be blocked if able" requirement
 * (Anzrag, the Quake-Mole's "must be blocked each combat this turn if
 * able"), which a block declaration has to obey as far as it can.
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { ifAblePlan, obeyingLure } from "../combat/blocking.js";
import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { activePlayerOf } from "../state.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const D = asPlayerId("dave");

const DELNEY = "Test Streetwise Lookout";
const ERIETTE = "Test Charmed Apple";
const SKY_WARDEN = "Test Sky Warden";
const HOUND = "Test Loyal Hound";
/** Pramikon, Sky Rampart's rule: "As this enters, choose left or right. Each
 * player may attack only the nearest opponent in the last chosen direction
 * and planeswalkers controlled by that player." */
const RAMPART = "Test Sky Rampart";

const enchantment = (name: string, statics: Parameters<typeof defineCard>[0]["static"]) =>
  defineCard({ name, manaCost: "{0}", types: ["enchantment"], text: name, static: statics });

const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: RAMPART,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Wall"],
      power: 1,
      toughness: 5,
      text: RAMPART,
      chooseOnEnter: ["left", "right"],
      static: [{ affects: { scope: "self" }, attackOnlyNearestOpponent: true, text: RAMPART }],
    }),
  )
  .register(
    enchantment(DELNEY, [
      {
        affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", power: { op: "lte", n: 2 } } },
        cantBeBlockedBy: { power: { op: "gte", n: 3 } },
        text: "Creatures you control with power 2 or less can't be blocked by creatures with power 3 or greater.",
      },
    ]),
  )
  .register(
    enchantment(ERIETTE, [
      {
        affects: { scope: "filter", filter: { type: "creature", enchantedBy: "you" } },
        cantAttackController: true,
        text: "Each creature that's enchanted by an Aura you control can't attack you or planeswalkers you control.",
      },
    ]),
  )
  .register(
    defineCard({
      name: SKY_WARDEN,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Bird"],
      power: 3,
      toughness: 3,
      keywords: ["reach"],
      text: "Reach\nThis creature can block only creatures with flying.",
      static: [
        {
          affects: { scope: "self" },
          canBlockOnly: { keyword: "flying" },
          text: "This creature can block only creatures with flying.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: HOUND,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Dog"],
      power: 2,
      toughness: 2,
      text: "This creature can't attack its owner.",
      static: [
        { affects: { scope: "self" }, restrictions: ["cant-attack-owner"], text: "This creature can't attack its owner." },
      ],
    }),
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

type BlockOffer = Extract<LegalAction, { kind: "declare-blockers" }>;
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const ready = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const toBlocks = (game: Game): void => {
  game.advanceUntil((s) => s.awaiting?.kind === "blockers");
};
/** To this turn's combat damage step — for a combat where no creature is
 * able to block, so the blockers decision is never asked. */
const pastBlocks = (game: Game): void => {
  const turn = game.state.turn.number;
  game.advanceUntil((s) => s.turn.number === turn && s.turn.step === "combat-damage");
};
const blockOffer = (game: Game, player: PlayerId): BlockOffer => {
  const offer = game.legalActions(player).find((o): o is BlockOffer => o.kind === "declare-blockers");
  if (offer === undefined) throw new Error("no block offer");
  return offer;
};
const canBlock = (offer: BlockOffer, blocker: ObjectId): readonly ObjectId[] =>
  offer.eligible.find((e) => e.blocker === blocker)?.canBlock ?? [];
const defendersFor = (game: Game, player: PlayerId, attacker: ObjectId): readonly (PlayerId | ObjectId)[] => {
  const offer = game
    .legalActions(player)
    .find((o): o is Extract<LegalAction, { kind: "declare-attackers" }> => o.kind === "declare-attackers");
  return offer?.defendersFor[attacker] ?? [];
};
const run = (game: Game, effect: EffectSpec, source: ObjectId, target?: ObjectId, player: PlayerId = A): void => {
  game.debugApplyEffect(player, effect, target === undefined ? [] : [{ kind: "object", object: target }], {
    source,
  });
  game.advanceUntil(quiet);
};

describe("can't be blocked by / can block only", () => {
  it("Delney: a small creature you control can't be blocked by power 3 or greater", () => {
    const { game, controllers } = setUp();
    game.debugSpawn(DELNEY, A, "battlefield");
    const bears = ready(game, "Grizzly Bears", A);
    const giant = ready(game, "Hill Giant", A);
    const theirGiant = ready(game, "Hill Giant", B);
    const theirGoblin = ready(game, "Raging Goblin", B);
    controllers[A].declareAttackersFn = () => [
      { attacker: bears, defender: B },
      { attacker: giant, defender: B },
    ];
    toBlocks(game);
    const offer = blockOffer(game, B);
    expect(canBlock(offer, theirGiant)).toEqual([giant]);
    expect([...canBlock(offer, theirGoblin)].sort()).toEqual([bears, giant].sort());
    expect(() =>
      game.dispatch({ type: "declare-blockers", player: B, blocks: [{ blocker: theirGiant, attacker: bears }] }),
    ).toThrow(/can't block/);
  });

  it("can block only creatures with flying", () => {
    const { game, controllers } = setUp();
    const bears = ready(game, "Grizzly Bears", A);
    const angel = ready(game, "Serra Angel", A);
    const warden = ready(game, SKY_WARDEN, B);
    controllers[A].declareAttackersFn = () => [
      { attacker: bears, defender: B },
      { attacker: angel, defender: B },
    ];
    toBlocks(game);
    expect(canBlock(blockOffer(game, B), warden)).toEqual([angel]);
  });
});

describe("who can be attacked", () => {
  it("Eriette: creatures enchanted by an Aura you control can't attack you, but can attack others", () => {
    const { game } = setUp([A, B, C]);
    game.debugSpawn(ERIETTE, A, "battlefield");
    // Carol's turn, so her creatures are the attackers.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(activePlayerOf(game.state)).toBe(C);
    const charmed = ready(game, "Grizzly Bears", C);
    const aura = game.debugSpawn("Holy Strength", A, "battlefield");
    game.state.objects[aura].attachedTo = charmed;
    const ownAura = ready(game, "Grizzly Bears", C);
    const carolsAura = game.debugSpawn("Holy Strength", C, "battlefield");
    game.state.objects[carolsAura].attachedTo = ownAura;
    const plain = ready(game, "Grizzly Bears", C);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    expect(defendersFor(game, C, charmed)).toEqual([B]);
    expect([...defendersFor(game, C, ownAura)].sort()).toEqual([A, B].sort());
    expect([...defendersFor(game, C, plain)].sort()).toEqual([A, B].sort());
  });

  it("Vow of Duty still keeps its creature off its controller", () => {
    const { game } = setUp();
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    const bears = ready(game, "Grizzly Bears", B);
    const vow = game.debugSpawn("Vow of Duty", A, "battlefield");
    game.state.objects[vow].attachedTo = bears;
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    expect(defendersFor(game, B, bears)).toEqual([]);
  });

  it("can't attack its owner", () => {
    const { game } = setUp([A, B, C]);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    const hound = ready(game, HOUND, A);
    const source = game.debugSpawn("Island", B, "battlefield");
    run(game, { kind: "gain-control", target: 0, untilEndOfTurn: false }, source, hound, B);
    game.state.objects[hound].summoningSick = false;
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    expect(defendersFor(game, B, hound)).toEqual([C]);
  });
});

describe("the nearest opponent in the chosen direction", () => {
  const rampart = (game: Game, direction: "left" | "right", owner: PlayerId = A): void => {
    const id = game.debugSpawn(RAMPART, owner, "battlefield");
    game.state.objects[id].chosenOnEnter = direction;
  };

  it("left: onward in turn order; right: back", () => {
    const { game } = setUp([A, B, C, D]);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    rampart(game, "left");
    const bears = ready(game, "Grizzly Bears", B);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    expect(defendersFor(game, B, bears)).toEqual([C]);
  });

  it("the latest choice is the one in force, and a player who has lost is skipped", () => {
    const { game } = setUp([A, B, C, D]);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    rampart(game, "left", C);
    rampart(game, "right", C);
    game.state.players[A].hasLost = true;
    const bears = ready(game, "Grizzly Bears", B);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    // Right of Bob is Alice, who has lost, so Dave.
    expect(defendersFor(game, B, bears)).toEqual([D]);
  });
});

describe("one-shot restrictions", () => {
  it("target creature can't block this turn — and can again next turn", () => {
    const { game, controllers } = setUp();
    const bears = ready(game, "Grizzly Bears", A);
    const goblin = ready(game, "Raging Goblin", B);
    const source = game.debugSpawn("Island", A, "battlefield");
    run(game, { kind: "restrict", target: 0, restrictions: ["cant-block"] }, source, goblin);
    controllers[A].declareAttackersFn = () => [{ attacker: bears, defender: B }];
    // Nothing can block, so Bob is never asked.
    pastBlocks(game);
    expect(game.state.objects[goblin].blocking).toBeNull();
    expect(game.eventsOfType("blocker-declared")).toHaveLength(0);
    // Bob's turn, then Alice attacks again on turn 3.
    game.advanceUntil((s) => s.turn.number === 3 && s.awaiting?.kind === "blockers");
    expect(canBlock(blockOffer(game, B), goblin)).toEqual([bears]);
  });

  it("as a turn-wide rule, it binds a creature that enters afterwards too", () => {
    const { game, controllers } = setUp();
    const bears = ready(game, "Grizzly Bears", A);
    const source = game.debugSpawn("Island", A, "battlefield");
    run(
      game,
      { kind: "restrict", filter: { type: "creature", controlledBy: "opponent" }, restrictions: ["cant-block"] },
      source,
    );
    const late = ready(game, "Raging Goblin", B);
    expect(game.viewFor(A).objects[late]?.restrictions).toContain("cant-block");
    controllers[A].declareAttackersFn = () => [{ attacker: bears, defender: B }];
    pastBlocks(game);
    expect(game.state.objects[late].blocking).toBeNull();
    expect(game.eventsOfType("blocker-declared")).toHaveLength(0);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.turnRestrictions).toBeUndefined();
  });
});

describe("must be blocked if able", () => {
  const mustBeBlocked = (game: Game, attacker: ObjectId): void =>
    run(game, { kind: "restrict", target: "source", restrictions: ["must-be-blocked-if-able"] }, attacker);

  it("Anzrag: one blocker is required when there's one to spare", () => {
    const { game, controllers } = setUp();
    const anzrag = ready(game, "Hill Giant", A);
    const goblin = ready(game, "Raging Goblin", B);
    mustBeBlocked(game, anzrag);
    controllers[A].declareAttackersFn = () => [{ attacker: anzrag, defender: B }];
    toBlocks(game);
    const offer = blockOffer(game, B);
    expect(offer.mustBeBlockedIfAble).toEqual([anzrag]);
    expect(() => game.dispatch({ type: "declare-blockers", player: B, blocks: [] })).toThrow(
      /must be blocked if able/,
    );
    // The fix-up the bots finish with blocks it.
    expect(obeyingLure([], offer)).toEqual([{ blocker: goblin, attacker: anzrag }]);
    game.dispatch({ type: "declare-blockers", player: B, blocks: [{ blocker: goblin, attacker: anzrag }] });
    expect(game.state.objects[goblin].blocking).toBe(anzrag);
  });

  it("a creature busy blocking something else has to be moved onto it", () => {
    const { game, controllers } = setUp();
    const anzrag = ready(game, "Hill Giant", A);
    const bears = ready(game, "Grizzly Bears", A);
    const goblin = ready(game, "Raging Goblin", B);
    mustBeBlocked(game, anzrag);
    controllers[A].declareAttackersFn = () => [
      { attacker: anzrag, defender: B },
      { attacker: bears, defender: B },
    ];
    toBlocks(game);
    expect(() =>
      game.dispatch({ type: "declare-blockers", player: B, blocks: [{ blocker: goblin, attacker: bears }] }),
    ).toThrow(/must be blocked if able/);
  });

  it("with nothing able to block it, no block is owed; and it lasts only this turn", () => {
    const { game, controllers } = setUp();
    const anzrag = ready(game, "Hill Giant", A);
    const goblin = game.debugSpawn("Raging Goblin", B, "battlefield");
    mustBeBlocked(game, anzrag);
    game.state.objects[goblin].tapped = true;
    controllers[A].declareAttackersFn = () => [{ attacker: anzrag, defender: B }];
    pastBlocks(game);
    expect(game.state.players[B].life).toBe(17);
    // Turn 3: the goblin is untapped, and Anzrag owes no block any more.
    game.advanceUntil((s) => s.turn.number === 3 && s.awaiting?.kind === "blockers");
    const offer = blockOffer(game, B);
    expect(offer.mustBeBlockedIfAble).toBeUndefined();
    expect(ifAblePlan(offer).required).toBe(0);
  });

  it("with menace, only a pair will do — one creature owes nothing", () => {
    const { game, controllers } = setUp();
    const anzrag = ready(game, "Hill Giant", A);
    ready(game, "Raging Goblin", B);
    mustBeBlocked(game, anzrag);
    const source = game.debugSpawn("Island", A, "battlefield");
    run(game, { kind: "grant-keyword", target: 0, keyword: "menace", duration: "end-of-turn" }, source, anzrag);
    controllers[A].declareAttackersFn = () => [{ attacker: anzrag, defender: B }];
    toBlocks(game);
    game.dispatch({ type: "declare-blockers", player: B, blocks: [] });
    expect(game.state.awaiting).toBeNull();
  });
});
