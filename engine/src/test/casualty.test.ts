/**
 * Casualty N (rule 702.153a): "As an additional cost to cast this spell, you
 * may sacrifice a creature with power N or greater" and "When you cast this
 * spell, if a casualty cost was paid for it, copy it. If the spell has any
 * targets, you may choose new targets for the copy." Printed (Cut Your
 * Losses) or granted to spells (Silverquill, the Disputant; Anhelo, the
 * Painter's "the first instant or sorcery spell you cast each turn"); each
 * instance is paid and copies separately (702.153b).
 *
 * The caster is asked once the spell is on the stack, as a
 * `choose-permanents` of up to one creature.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** A token with Young Pyromancer's cast trigger — one that token stacks
 * compact, since its trigger only makes tokens. */
const PYRO_TOKEN = "Test Pyromancer Token";
const PYRO_TEXT = "Whenever you cast an instant or sorcery spell, create a 1/1 red Elemental creature token.";
const registry = createDefaultRegistry().register(
  defineCard({
    name: PYRO_TOKEN,
    types: ["creature"],
    subtypes: ["Human", "Shaman"],
    power: 1,
    toughness: 1,
    text: PYRO_TEXT,
    triggered: [
      {
        trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
        targets: [],
        effect: { kind: "create-token", token: "1/1 Red Elemental Token", count: 1 },
        resolve: null,
        text: PYRO_TEXT,
      },
    ],
  }),
);

const setUp = (aHand: readonly string[]) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Island")] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  // Copies keep aiming at Bob unless a test says otherwise.
  a.chooseTargetsFn = () => [{ kind: "player", player: B }];
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const lands = (game: Game, name: string, count: number): void => {
  for (let i = 0; i < count; i += 1) game.debugSpawn(name, A, "battlefield");
};
const bolt = (game: Game): void => {
  game.dispatch({
    type: "cast-spell",
    player: A,
    card: inHand(game, A, "Lightning Bolt"),
    targets: [{ kind: "player", player: B }],
  });
};
const graveyardNamed = (game: Game, player: PlayerId, name: string): number =>
  game.graveyardOf(player).filter((id) => game.state.objects[id].cardName === name).length;
/** How many of `name` are on the battlefield, a token stack counted as every token in it. */
const tokensNamed = (game: Game, name: string): number =>
  game.battlefield
    .filter((id) => game.state.objects[id].cardName === name)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);

describe("casualty", () => {
  it("paid: the creature is sacrificed as the spell is cast, and the spell is copied (Cut Your Losses)", () => {
    const { game, a } = setUp(["Cut Your Losses"]);
    lands(game, "Island", 6);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    let offered: readonly ObjectId[] = [];
    a.choosePermanentsFn = (_view, eligible, min, max) => {
      offered = eligible;
      expect([min, max]).toEqual([0, 1]);
      return [bears];
    };
    const library = game.state.zones.perPlayer[B].library.length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, A, "Cut Your Losses"),
      targets: [{ kind: "player", player: B }],
    });
    // Asked before anything else happens, the spell already on the stack.
    expect(game.state.awaiting).toMatchObject({ kind: "choose-permanents", player: A });
    game.advanceUntil(quiet);
    expect(offered).toEqual([bears]);
    expect(graveyardNamed(game, A, "Grizzly Bears")).toBe(1);
    // The copy mills half, then the original half of what's left (the ruling).
    const afterCopy = library - Math.floor(library / 2);
    expect(game.state.zones.perPlayer[B].library.length).toBe(afterCopy - Math.floor(afterCopy / 2));
    expect(game.eventsOfType("spell-copied")).toHaveLength(1);
  });

  it("declined: nothing is sacrificed and nothing copied", () => {
    const { game, a } = setUp(["Cut Your Losses"]);
    lands(game, "Island", 6);
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    a.choosePermanentsFn = () => [];
    const library = game.state.zones.perPlayer[B].library.length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, A, "Cut Your Losses"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(quiet);
    expect(graveyardNamed(game, A, "Grizzly Bears")).toBe(0);
    expect(game.state.zones.perPlayer[B].library.length).toBe(library - Math.floor(library / 2));
    expect(game.eventsOfType("spell-copied")).toHaveLength(0);
  });

  it("only a creature with power N or greater can pay it; with none, nothing is asked", () => {
    const { game, a } = setUp(["Cut Your Losses"]);
    lands(game, "Island", 6);
    game.debugSpawn("Memnite", A, "battlefield");
    let asked = false;
    a.choosePermanentsFn = () => {
      asked = true;
      return [];
    };
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, A, "Cut Your Losses"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(quiet);
    expect(asked).toBe(false);
    expect(graveyardNamed(game, A, "Memnite")).toBe(0);
  });

  it("granted: Silverquill gives each instant and sorcery you cast casualty 1", () => {
    const { game, a } = setUp(["Lightning Bolt"]);
    lands(game, "Mountain", 1);
    game.debugSpawn("Silverquill, the Disputant", A, "battlefield");
    const memnite = game.debugSpawn("Memnite", A, "battlefield");
    let offered: readonly ObjectId[] = [];
    a.choosePermanentsFn = (_view, eligible) => {
      offered = eligible;
      return [memnite];
    };
    const life = game.state.players[B].life;
    bolt(game);
    game.advanceUntil(quiet);
    // Any creature with power 1 or greater, Silverquill itself included.
    expect(offered.map((id) => game.state.objects[id].cardName).sort()).toEqual([
      "Memnite",
      "Silverquill, the Disputant",
    ]);
    expect(graveyardNamed(game, A, "Memnite")).toBe(1);
    expect(game.state.players[B].life).toBe(life - 6);
  });

  it("not for a creature spell under Silverquill", () => {
    const { game, a } = setUp(["Grizzly Bears"]);
    lands(game, "Forest", 2);
    game.debugSpawn("Silverquill, the Disputant", A, "battlefield");
    let asked = false;
    a.choosePermanentsFn = () => {
      asked = true;
      return [];
    };
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, A, "Grizzly Bears"), targets: [] });
    game.advanceUntil(quiet);
    expect(asked).toBe(false);
  });

  it("Anhelo: only the first instant or sorcery each turn, counting ones cast before it arrived", () => {
    const { game, a } = setUp(["Lightning Bolt", "Lightning Bolt", "Lightning Bolt", "Lightning Bolt"]);
    lands(game, "Mountain", 3);
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    let asked = 0;
    a.choosePermanentsFn = (_view, eligible) => {
      asked += 1;
      return eligible.slice(0, 1);
    };
    const anhelo = game.debugSpawn("Anhelo, the Painter", A, "battlefield");
    bolt(game);
    game.advanceUntil(quiet);
    expect(asked).toBe(1);
    bolt(game);
    game.advanceUntil(quiet);
    expect(asked).toBe(1);
    expect(graveyardNamed(game, A, "Grizzly Bears")).toBe(1);

    // Alice's next turn: a Bolt cast before Anhelo is back was the first, so
    // the one cast after it isn't.
    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0 }, [{ kind: "object", object: anhelo }]);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    asked = 0;
    bolt(game);
    game.advanceUntil(quiet);
    game.debugSpawn("Anhelo, the Painter", A, "battlefield");
    bolt(game);
    game.advanceUntil(quiet);
    expect(asked).toBe(0);
    expect(graveyardNamed(game, A, "Grizzly Bears")).toBe(1);
  });

  it("two instances are two costs and two copies (rule 702.153b)", () => {
    const { game, a } = setUp(["Lightning Bolt"]);
    lands(game, "Mountain", 1);
    game.debugSpawn("Silverquill, the Disputant", A, "battlefield");
    game.debugSpawn("Anhelo, the Painter", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    let asked = 0;
    a.choosePermanentsFn = (_view, eligible) => {
      asked += 1;
      return eligible.filter((id) => game.state.objects[id].cardName === "Grizzly Bears").slice(0, 1);
    };
    const life = game.state.players[B].life;
    bolt(game);
    game.advanceUntil(quiet);
    expect(asked).toBe(2);
    expect(graveyardNamed(game, A, "Grizzly Bears")).toBe(2);
    expect(game.state.players[B].life).toBe(life - 9);
  });

  it("the creature sacrificed for it is gone before the spell becomes cast: its own cast triggers don't fire (rule 601.2h-i)", () => {
    const { game, a } = setUp(["Lightning Bolt"]);
    lands(game, "Mountain", 1);
    game.debugSpawn("Silverquill, the Disputant", A, "battlefield");
    const sacrificed = game.debugSpawn("Young Pyromancer", A, "battlefield");
    game.debugSpawn("Young Pyromancer", A, "battlefield");
    a.choosePermanentsFn = () => [sacrificed];
    bolt(game);
    game.advanceUntil(quiet);
    expect(game.state.objects[sacrificed].zone).toBe("graveyard");
    // Only the Young Pyromancer still there as the Bolt became cast makes an
    // Elemental (the copy isn't cast at all).
    expect(tokensNamed(game, "1/1 Red Elemental Token")).toBe(1);
  });

  it("a token taken off a stack to pay it takes only its own share of the stack's cast triggers", () => {
    const { game, a } = setUp(["Lightning Bolt"]);
    lands(game, "Mountain", 1);
    game.debugSpawn("Silverquill, the Disputant", A, "battlefield");
    game.debugApplyEffect(A, { kind: "create-token", token: PYRO_TOKEN, count: 10 });
    const stack = game.state.zones.shared.battlefield.find((id) => game.state.objects[id].stackCount === 10);
    if (stack === undefined) throw new Error("no stack of ten tokens");
    a.choosePermanentsFn = () => [stack];
    bolt(game);
    game.advanceUntil(quiet);
    // Nine of them were there as the Bolt became cast: nine Elementals.
    expect(tokensNamed(game, PYRO_TOKEN)).toBe(9);
    expect(tokensNamed(game, "1/1 Red Elemental Token")).toBe(9);
  });

  it("an instant cast on another player's turn: once its casualty is answered, its caster gets priority (rule 117.3c)", () => {
    const { game, a } = setUp(["Lightning Bolt"]);
    lands(game, "Mountain", 1);
    game.debugSpawn("Silverquill, the Disputant", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === A);
    bolt(game);
    expect(game.state.awaiting).toMatchObject({ kind: "choose-permanents", player: A });
    a.choosePermanentsFn = () => [bears];
    game.dispatch({ type: "choose-permanents", player: A, permanents: [bears] });
    // Bob is the active player, but Alice cast the spell.
    expect(game.state.awaiting).toBeNull();
    expect(game.state.priority.holder).toBe(A);
  });

  it("paid from a token stack, one token of it is sacrificed", () => {
    const { game, a } = setUp(["Lightning Bolt"]);
    lands(game, "Mountain", 1);
    game.debugSpawn("Silverquill, the Disputant", A, "battlefield");
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 10 });
    const stack = game.state.zones.shared.battlefield.find((id) => game.state.objects[id].stackCount === 10);
    if (stack === undefined) throw new Error("no stack of ten Goblins");
    a.choosePermanentsFn = () => [stack];
    const life = game.state.players[B].life;
    bolt(game);
    game.advanceUntil(quiet);
    expect(tokensNamed(game, "Goblin Token")).toBe(9);
    expect(game.state.players[B].life).toBe(life - 6);
  });

  it("the copy is still made if the spell is countered before its casualty trigger resolves", () => {
    const { game, a } = setUp(["Lightning Bolt"]);
    lands(game, "Mountain", 1);
    game.debugSpawn("Island", B, "battlefield");
    game.debugSpawn("Island", B, "battlefield");
    const counterspell = game.debugSpawn("Counterspell", B, "hand");
    game.debugSpawn("Silverquill, the Disputant", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    a.choosePermanentsFn = () => [bears];
    const life = game.state.players[B].life;
    const spell = inHand(game, A, "Lightning Bolt");
    bolt(game);
    game.advanceUntil((s) => s.awaiting === null && s.priority.holder === B);
    game.dispatch({ type: "cast-spell", player: B, card: counterspell, targets: [{ kind: "object", object: spell }] });
    game.advanceUntil(quiet);
    expect(game.state.objects[spell].zone).toBe("graveyard");
    // The copy, made from the spell as it last was on the stack.
    expect(game.state.players[B].life).toBe(life - 3);
  });

  it("Anhelo: the same card cast again after a Remand isn't the first instant any more (rule 400.7)", () => {
    const { game, a, b } = setUp(["Lightning Bolt"]);
    lands(game, "Mountain", 2);
    game.debugSpawn("Island", B, "battlefield");
    game.debugSpawn("Island", B, "battlefield");
    const remand = game.debugSpawn("Remand", B, "hand");
    game.debugSpawn("Anhelo, the Painter", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    let asked = 0;
    a.choosePermanentsFn = () => {
      asked += 1;
      return [];
    };
    b.choosePermanentsFn = () => [];
    const spell = inHand(game, A, "Lightning Bolt");
    bolt(game);
    game.advanceUntil((s) => s.awaiting === null && s.priority.holder === B);
    expect(asked).toBe(1);
    game.dispatch({ type: "cast-spell", player: B, card: remand, targets: [{ kind: "object", object: spell }] });
    game.advanceUntil(quiet);
    expect(game.handOf(A)).toContain(spell);
    bolt(game);
    game.advanceUntil(quiet);
    expect(asked).toBe(1);
  });
});
