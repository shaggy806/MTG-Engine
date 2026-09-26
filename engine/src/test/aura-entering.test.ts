/**
 * An Aura entering the battlefield other than by resolving as an Aura spell
 * (rule 303.4f): the player it enters under chooses what it enchants, as it
 * enters — a `choose-enchant` decision asked before it moves — from what it
 * could legally enchant: its enchant ability, less protection (702.16c).
 * Hexproof doesn't matter, since enchanting isn't targeting. With nothing to
 * choose, it stays where it was (303.4g).
 *
 * And the state-based actions that go with it: an Aura attached to nothing,
 * or to something it can no longer enchant, is put into its owner's
 * graveyard (704.5m); an Equipment on something it can't equip becomes
 * unattached (704.5n); and an attach to something illegal doesn't happen
 * (701.3b).
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry: createDefaultRegistry(),
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
/** Apply `effect` as `player`'s, leaving any decision it raises up. */
const apply = (game: Game, effect: EffectSpec, targets: readonly TargetRef[] = [], player: PlayerId = A) => {
  const source = game.debugSpawn("Island", player, "battlefield");
  game.debugApplyEffect(player, effect, targets, { source });
};
const entered = (game: Game): ObjectId[] =>
  game.eventsOfType("permanent-entered-battlefield").map((e) => e.object);
/** "Return target card from your graveyard to the battlefield." */
const REANIMATE: EffectSpec = { kind: "put-onto-battlefield", target: 0, underYourControl: true };

describe("an Aura put onto the battlefield chooses what it enchants (rule 303.4f)", () => {
  it("from every permanent it could enchant, before it moves, and enters attached", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    // Hexproof: enchanting isn't targeting.
    const bogle = spawn(game, "Slippery Bogle", B);
    // Protection from white: it can't be enchanted by a white Aura.
    spawn(game, "Animar, Soul of Elements", B);
    const pacifism = game.debugSpawn("Pacifism", A, "graveyard");
    apply(game, REANIMATE, [obj(pacifism)]);
    expect(game.state.awaiting).toEqual({
      kind: "choose-enchant",
      player: A,
      source: pacifism,
      options: [bears, giant, bogle],
    });
    expect(game.state.objects[pacifism].zone).toBe("graveyard");
    game.dispatch({ type: "choose-enchant", player: A, enchant: giant });
    game.advanceUntil(quiet);
    expect(game.state.objects[pacifism].zone).toBe("battlefield");
    expect(game.state.objects[pacifism].attachedTo).toBe(giant);
    expect(game.characteristics(giant).restrictions.has("cant-attack")).toBe(true);
  });

  it("chosen onto a token stack, it enchants one token of it", () => {
    const { game } = setUp();
    game.debugApplyEffect(B, { kind: "create-token", token: "Goblin Token", count: 10 });
    const stack = game.state.zones.shared.battlefield.find((id) => game.state.objects[id].stackCount === 10);
    if (stack === undefined) throw new Error("no stack of ten Goblins");
    const pacifism = game.debugSpawn("Pacifism", A, "graveyard");
    apply(game, REANIMATE, [obj(pacifism)]);
    game.dispatch({ type: "choose-enchant", player: A, enchant: stack });
    game.advanceUntil(quiet);
    const host = game.state.objects[pacifism].attachedTo;
    expect(host).not.toBeNull();
    expect(host).not.toBe(stack);
    expect(game.state.objects[host ?? stack].stackCount).toBeUndefined();
    expect(game.state.objects[stack].stackCount).toBe(9);
  });

  it("with nothing it could enchant, it stays where it was (303.4g)", () => {
    const { game } = setUp();
    spawn(game, "Animar, Soul of Elements", B);
    const pacifism = game.debugSpawn("Pacifism", A, "graveyard");
    apply(game, REANIMATE, [obj(pacifism)]);
    expect(game.state.awaiting).toBeNull();
    game.advanceUntil(quiet);
    expect(game.state.objects[pacifism].zone).toBe("graveyard");
    expect(entered(game)).not.toContain(pacifism);
  });

  it('"Enchant creature you control" offers only its new controller\'s creatures', () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Hill Giant", B);
    const training = game.debugSpawn("Setessan Training", A, "graveyard");
    apply(game, REANIMATE, [obj(training)]);
    expect(game.state.awaiting).toMatchObject({ kind: "choose-enchant", options: [bears] });
  });

  it("from a library, once the tutor has found it", () => {
    const { game, a } = setUp();
    const giant = spawn(game, "Hill Giant", B);
    const pacifism = game.debugSpawn("Pacifism", A, "library");
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    a.chooseEnchantFn = (_view, _source, options) => options[options.length - 1];
    apply(game, { kind: "search-library", filter: { subtype: "Aura" }, destination: "battlefield", min: 0, max: 1 });
    game.advanceUntil(quiet);
    expect(game.state.objects[pacifism].zone).toBe("battlefield");
    expect(game.state.objects[pacifism].attachedTo).toBe(giant);
  });

  it("returned alongside a creature, it can't enchant that creature", () => {
    const { game } = setUp();
    const giant = spawn(game, "Hill Giant", B);
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const pacifism = game.debugSpawn("Pacifism", A, "graveyard");
    apply(game, {
      kind: "return-from-graveyard",
      filter: { notTypes: ["instant", "sorcery"] },
      destination: "battlefield",
      count: "all",
    });
    expect(game.state.awaiting).toMatchObject({ kind: "choose-enchant", source: pacifism, options: [giant] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[pacifism].attachedTo).toBe(giant);
  });
});

describe("an Aura an O-Ring took comes back choosing afresh, under its owner", () => {
  /** Bob's Pacifism on Alice's Bears, exiled by Alice's Banishing Light. */
  const exiled = () => {
    const { game, a, b } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    const pacifism = spawn(game, "Pacifism", B);
    game.state.objects[pacifism].attachedTo = bears;
    a.chooseTargetsFn = () => [obj(pacifism)];
    const light = game.debugSpawn("Banishing Light", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.objects[pacifism].zone).toBe("exile");
    return { game, b, bears, giant, pacifism, light };
  };

  it("its owner chooses", () => {
    const { game, b, bears, giant, pacifism, light } = exiled();
    let offered: readonly ObjectId[] = [];
    b.chooseEnchantFn = (_view, _source, options) => {
      offered = options;
      return giant;
    };
    apply(game, { kind: "destroy", target: 0 }, [obj(light)]);
    game.advanceUntil(quiet);
    expect(offered).toEqual([bears, giant]);
    expect(game.state.objects[pacifism].attachedTo).toBe(giant);
  });

  it("with nothing to enchant, it stays in exile", () => {
    const { game, bears, giant, pacifism, light } = exiled();
    apply(game, { kind: "destroy", target: 0 }, [obj(bears)]);
    apply(game, { kind: "destroy", target: 0 }, [obj(giant)]);
    apply(game, { kind: "destroy", target: 0 }, [obj(light)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[pacifism].zone).toBe("exile");
    expect(entered(game)).not.toContain(pacifism);
  });
});

describe("an Aura spell", () => {
  it("enters attached to its target, without being asked, and is attached as it enters", () => {
    const { game, a } = setUp();
    const giant = spawn(game, "Hill Giant", B);
    spawn(game, "Plains");
    spawn(game, "Plains");
    const pacifism = game.debugSpawn("Pacifism", A, "hand");
    a.chooseEnchantFn = () => {
      throw new Error("an Aura spell was asked what it enchants");
    };
    game.dispatch({ type: "cast-spell", player: A, card: pacifism, targets: [obj(giant)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[pacifism].attachedTo).toBe(giant);
    const log = game.state.eventLog;
    const attached = log.findIndex((e) => e.type === "permanent-attached" && e.source === pacifism);
    const enters = log.findIndex((e) => e.type === "permanent-entered-battlefield" && e.object === pacifism);
    expect(attached).toBeGreaterThanOrEqual(0);
    expect(attached).toBeLessThan(enters);
  });
});

describe("state-based actions for attachments", () => {
  const nextStep = (game: Game) =>
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "begin-combat");

  it("an Aura attached to nothing is put into its owner's graveyard (704.5m)", () => {
    const { game } = setUp();
    const pacifism = spawn(game, "Pacifism");
    nextStep(game);
    expect(game.state.objects[pacifism].zone).toBe("graveyard");
  });

  it("an Aura on a creature that stops being one goes; an Equipment just falls off (704.5n)", () => {
    const { game } = setUp();
    const island = spawn(game, "Island");
    apply(game, {
      kind: "animate",
      target: 0,
      power: 2,
      toughness: 2,
      addTypes: ["creature"],
      addSubtypes: [],
      duration: "end-of-turn",
    }, [obj(island)]);
    const pacifism = spawn(game, "Pacifism", B);
    const bonesplitter = spawn(game, "Bonesplitter");
    game.state.objects[pacifism].attachedTo = island;
    game.state.objects[bonesplitter].attachedTo = island;
    nextStep(game);
    expect(game.state.objects[pacifism].attachedTo).toBe(island);
    expect(game.state.objects[bonesplitter].attachedTo).toBe(island);
    // The animation ends at cleanup.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(game.state.objects[pacifism].zone).toBe("graveyard");
    expect(game.state.objects[bonesplitter].zone).toBe("battlefield");
    expect(game.state.objects[bonesplitter].attachedTo).toBeNull();
  });

  it('"Enchant creature you control" goes when its creature changes hands (303.4c)', () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const training = spawn(game, "Setessan Training");
    game.state.objects[training].attachedTo = bears;
    apply(game, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(bears)], B);
    game.advanceUntil(quiet);
    nextStep(game);
    expect(game.state.objects[bears].controller).toBe(B);
    expect(game.state.objects[training].zone).toBe("graveyard");
  });

  it("an attach to something it couldn't equip doesn't move it (701.3b)", () => {
    const { game } = setUp();
    const island = spawn(game, "Island");
    const bonesplitter = spawn(game, "Bonesplitter");
    game.debugApplyEffect(A, { kind: "attach", target: 0 }, [obj(island)], { source: bonesplitter });
    expect(game.state.objects[bonesplitter].attachedTo).toBeNull();
  });
});
