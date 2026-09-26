/**
 * The commanders effect:copy-exceptions unblocked:
 *
 * - Anikthea, Hand of Erebos — exile a non-Aura enchantment card from your
 *   graveyard as it enters or attacks; a token copy of it, except a 3/3
 *   black Zombie creature besides its other types. Other enchantment
 *   creatures you control have menace.
 * - The Jolly Balloon Man — {1}, {T}: a token copy of another creature you
 *   control, except a 1/1 red Balloon besides its other colours and types,
 *   with flying and haste; sacrificed at the next end step. Sorcery speed.
 * - Saheeli, Radiant Creator — an energy per Artificer or artifact spell;
 *   at combat, pay three to copy a permanent you control, except a 5/5
 *   artifact creature with haste; sacrificed at the next end step.
 * - Mishra, Eminent One — at combat, a token copy of a noncreature artifact
 *   you control, except named Mishra's Warform and a 4/4 Construct artifact
 *   creature; haste this turn; sacrificed at the next end step.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { nameOf } from "../state.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const newTokens = (game: Game, before: ReadonlySet<ObjectId>): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => !before.has(id) && game.state.objects[id].isToken === true);
const toCombat = (game: Game) =>
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "begin-combat" && quiet(s));
const toEndStepDone = (game: Game) =>
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "end" && quiet(s));
const idsOf = (refs: readonly TargetRef[]): ObjectId[] =>
  refs.flatMap((r) => (r.kind === "object" ? [r.object] : []));

describe("Anikthea, Hand of Erebos", () => {
  it("as it enters, makes an exiled non-Aura enchantment card a 3/3 black Zombie creature copy", () => {
    const { game, a } = setUp();
    // A blue card: the copy is black instead.
    const arena = game.debugSpawn("Rhystic Study", A, "graveyard");
    game.debugSpawn("Pacifism", A, "graveyard");
    let offered: ObjectId[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, options) => {
      offered = idsOf(options[0] ?? []);
      return [{ kind: "object", object: arena }];
    };
    const before = new Set(game.state.zones.shared.battlefield);
    game.debugSpawn("Anikthea, Hand of Erebos", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(offered).toEqual([arena]); // not the Aura
    expect(game.state.objects[arena].zone).toBe("exile");
    const [token] = newTokens(game, before);
    const c = game.characteristics(token);
    expect(nameOf(game.state.objects[token])).toBe("Rhystic Study");
    expect([c.power, c.toughness]).toEqual([3, 3]);
    expect([...c.colors]).toEqual(["B"]);
    expect([...c.types].sort()).toEqual(["creature", "enchantment"]);
    expect(c.subtypes).toContain("Zombie");
    // An enchantment creature Anikthea's controller controls: menace.
    expect(c.keywords.has("menace")).toBe(true);
  });

  it("does it again as it attacks", () => {
    const { game, a } = setUp();
    const anikthea = spawn(game, "Anikthea, Hand of Erebos");
    const arena = game.debugSpawn("Phyrexian Arena", A, "graveyard");
    a.chooseTargetsFn = () => [{ kind: "object", object: arena }];
    a.declareAttackersFn = () => [{ attacker: anikthea, defender: B }];
    const before = new Set(game.state.zones.shared.battlefield);
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "declare-blockers" && quiet(s));
    expect(newTokens(game, before)).toHaveLength(1);
  });
});

describe("The Jolly Balloon Man", () => {
  it("makes a 1/1 red Balloon copy of another creature, with flying and haste, gone at the end step", () => {
    const { game } = setUp();
    const balloonMan = spawn(game, "The Jolly Balloon Man");
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Mountain");
    const offer = game
      .legalActions(A)
      .find((o) => o.kind === "activate-ability" && o.source === balloonMan);
    expect(offer?.kind === "activate-ability" ? idsOf(offer.targetOptions[0]) : null).toEqual([bears]);
    const before = new Set(game.state.zones.shared.battlefield);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: balloonMan,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(quiet);
    const [token] = newTokens(game, before);
    const c = game.characteristics(token);
    expect([c.power, c.toughness]).toEqual([1, 1]);
    expect([...c.colors].sort()).toEqual(["G", "R"]);
    expect(c.subtypes).toEqual(expect.arrayContaining(["Bear", "Balloon"]));
    expect(c.keywords.has("flying") && c.keywords.has("haste")).toBe(true);
    toEndStepDone(game);
    expect(game.state.objects[token]).toBeUndefined();
  });

  it("is sorcery speed", () => {
    const { game } = setUp();
    const balloonMan = spawn(game, "The Jolly Balloon Man");
    spawn(game, "Grizzly Bears");
    spawn(game, "Mountain");
    toCombat(game);
    expect(game.legalActions(A).some((o) => o.kind === "activate-ability" && o.source === balloonMan)).toBe(false);
  });
});

describe("Saheeli, Radiant Creator", () => {
  it("gets an energy for an artifact spell", () => {
    const { game } = setUp();
    spawn(game, "Saheeli, Radiant Creator");
    spawn(game, "Island");
    game.dispatch({ type: "cast-spell", player: A, card: game.debugSpawn("Sol Ring", A, "hand") });
    game.advanceUntil(quiet);
    expect(game.state.players[A].energy).toBe(1);
  });

  it("at combat, three energy copies a permanent as a 5/5 hasty artifact creature, gone at the end step", () => {
    const { game, a } = setUp();
    spawn(game, "Saheeli, Radiant Creator");
    const ring = spawn(game, "Sol Ring");
    game.state.players[A].energy = 3;
    a.chooseModesFn = () => [0];
    a.chooseTargetsFn = () => [{ kind: "object", object: ring }];
    const before = new Set(game.state.zones.shared.battlefield);
    toCombat(game);
    expect(game.state.players[A].energy).toBe(0);
    const [token] = newTokens(game, before);
    const c = game.characteristics(token);
    expect(nameOf(game.state.objects[token])).toBe("Sol Ring");
    expect([c.power, c.toughness]).toEqual([5, 5]);
    expect([...c.types].sort()).toEqual(["artifact", "creature"]);
    expect(c.keywords.has("haste")).toBe(true);
    toEndStepDone(game);
    expect(game.state.objects[token]).toBeUndefined();
  });

  it("with fewer than three energy, nothing is offered", () => {
    const { game, a } = setUp();
    spawn(game, "Saheeli, Radiant Creator");
    spawn(game, "Sol Ring");
    game.state.players[A].energy = 2;
    let asked = false;
    a.chooseModesFn = () => {
      asked = true;
      return [0];
    };
    toCombat(game);
    expect(asked).toBe(false);
    expect(game.state.players[A].energy).toBe(2);
  });
});

describe("Mishra, Eminent One", () => {
  it("copies a noncreature artifact as Mishra's Warform, a 4/4 Construct artifact creature with haste this turn", () => {
    const { game, a } = setUp();
    spawn(game, "Mishra, Eminent One");
    const ring = spawn(game, "Sol Ring");
    const stone = spawn(game, "Mind Stone");
    spawn(game, "Ornithopter"); // an artifact creature: not a target
    let offered: ObjectId[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, options) => {
      offered = idsOf(options[0] ?? []);
      return [{ kind: "object", object: ring }];
    };
    const before = new Set(game.state.zones.shared.battlefield);
    toCombat(game);
    expect(offered.sort()).toEqual([ring, stone].sort());
    const [token] = newTokens(game, before);
    const c = game.characteristics(token);
    expect(nameOf(game.state.objects[token])).toBe("Mishra's Warform");
    expect([c.power, c.toughness]).toEqual([4, 4]);
    expect(c.subtypes).toContain("Construct");
    expect([...c.types].sort()).toEqual(["artifact", "creature"]);
    expect(c.keywords.has("haste")).toBe(true);
    toEndStepDone(game);
    expect(game.state.objects[token]).toBeUndefined();
  });

  it("a copy of a legendary artifact doesn't share its name, so both stay", () => {
    const { game, a } = setUp();
    spawn(game, "Mishra, Eminent One");
    const monument = spawn(game, "Bontu's Monument");
    a.chooseTargetsFn = () => [{ kind: "object", object: monument }];
    const before = new Set(game.state.zones.shared.battlefield);
    toCombat(game);
    const [token] = newTokens(game, before);
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "declare-attackers");
    expect(game.state.objects[monument].zone).toBe("battlefield");
    expect(game.state.objects[token].zone).toBe("battlefield");
  });
});
