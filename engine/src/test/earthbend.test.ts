/**
 * Earthbend N — "Target land you control becomes a 0/0 creature with haste
 * that's still a land. Put N +1/+1 counters on it. When it dies or is exiled,
 * return it to the battlefield tapped." (Toph, the First Metalbender) — and
 * the leave-keyed delayed trigger its last sentence is: a delayed triggered
 * ability waiting on one permanent leaving the battlefield (rule 603.7), used
 * up the first time it leaves for anywhere, and firing only for the zones it
 * names. The same shape is Kelsien, the Plague's "when that creature dies
 * this turn".
 *
 * "Return it" follows the card to the zone it went to and no further (rule
 * 400.7): a card exiled from the graveyard in response stays exiled. That
 * guard also covers undying.
 */

import { describe, expect, it } from "vitest";

import { effectiveTypes } from "../characteristics.js";
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

/** A permanent to own the effects under test — a delayed trigger names its
 * source in the log. */
const BENDER = "Test Bender";

const registry = createDefaultRegistry().register(
  defineCard({
    name: BENDER,
    manaCost: "{0}",
    types: ["artifact"],
    text: "",
  }),
);

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
  const bender = game.debugSpawn(BENDER, A, "battlefield");
  return { game, a, bender };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const apply = (game: Game, source: ObjectId, effect: EffectSpec, target?: ObjectId, player: PlayerId = A) => {
  game.debugApplyEffect(player, effect, target === undefined ? [] : [{ kind: "object", object: target }], {
    source,
  });
  game.advanceUntil(quiet);
};
const earthbend = (game: Game, source: ObjectId, land: ObjectId, amount = 2) =>
  apply(game, source, { kind: "earthbend", target: 0, amount }, land);
const zone = (game: Game, id: ObjectId) => game.state.objects[id]?.zone;
const types = (game: Game, id: ObjectId) =>
  effectiveTypes(game.state, registry, game.state.objects[id]);

describe("earthbend", () => {
  it("makes the land a 0/0 haste creature land with N +1/+1 counters", () => {
    const { game, bender } = setUp();
    const land = game.debugSpawn("Forest", A, "battlefield");
    earthbend(game, bender, land, 3);
    expect(types(game, land)).toEqual(expect.arrayContaining(["land", "creature"]));
    expect(game.characteristics(land).power).toBe(3);
    expect(game.characteristics(land).toughness).toBe(3);
    expect(game.characteristics(land).keywords).toContain("haste");
    expect(game.state.objects[land].counters["+1/+1"]).toBe(3);
  });

  it("stays a creature past the end of the turn", () => {
    const { game, bender } = setUp();
    const land = game.debugSpawn("Forest", A, "battlefield");
    earthbend(game, bender, land);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(types(game, land)).toContain("creature");
    expect(game.characteristics(land).power).toBe(2);
  });

  it("returns the land to the battlefield tapped when it dies — a plain land again", () => {
    const { game, bender } = setUp();
    const land = game.debugSpawn("Forest", A, "battlefield");
    earthbend(game, bender, land);
    apply(game, bender, { kind: "destroy", target: 0 }, land);
    expect(zone(game, land)).toBe("battlefield");
    expect(game.state.objects[land].tapped).toBe(true);
    expect(types(game, land)).not.toContain("creature");
    expect(game.state.objects[land].counters["+1/+1"] ?? 0).toBe(0);
    expect(game.state.objects[land].controller).toBe(A);
  });

  it("returns it when it's exiled", () => {
    const { game, bender } = setUp();
    const land = game.debugSpawn("Forest", A, "battlefield");
    earthbend(game, bender, land);
    apply(game, bender, { kind: "exile", target: 0 }, land);
    expect(zone(game, land)).toBe("battlefield");
    expect(game.state.objects[land].tapped).toBe(true);
  });

  it("comes back only once: the watcher is used up by the first return", () => {
    const { game, bender } = setUp();
    const land = game.debugSpawn("Forest", A, "battlefield");
    earthbend(game, bender, land);
    apply(game, bender, { kind: "destroy", target: 0 }, land);
    expect(zone(game, land)).toBe("battlefield");
    apply(game, bender, { kind: "destroy", target: 0 }, land);
    expect(zone(game, land)).toBe("graveyard");
    expect(game.state.delayedTriggers).toHaveLength(0);
  });

  it("returned to hand, it isn't watched any more", () => {
    const { game, bender } = setUp();
    const land = game.debugSpawn("Forest", A, "battlefield");
    earthbend(game, bender, land);
    apply(game, bender, { kind: "return-to-hand", target: 0 }, land);
    expect(zone(game, land)).toBe("hand");
    expect(game.state.delayedTriggers).toHaveLength(0);
  });

  it("still returns a land that lost its abilities — the return isn't one of them", () => {
    const { game, bender } = setUp();
    const land = game.debugSpawn("Forest", A, "battlefield");
    earthbend(game, bender, land);
    apply(
      game,
      bender,
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
      land,
    );
    apply(game, bender, { kind: "destroy", target: 0 }, land);
    expect(zone(game, land)).toBe("battlefield");
  });

  it("returns it to its owner, whoever controlled it", () => {
    const { game, bender } = setUp();
    const land = game.debugSpawn("Forest", A, "battlefield");
    earthbend(game, bender, land);
    apply(game, bender, { kind: "gain-control", target: 0, untilEndOfTurn: false }, land, B);
    expect(game.state.objects[land].controller).toBe(B);
    apply(game, bender, { kind: "destroy", target: 0 }, land);
    expect(zone(game, land)).toBe("battlefield");
    expect(game.state.objects[land].controller).toBe(A);
  });

  it("finds nothing once the card has moved on from where it went (rule 400.7)", () => {
    const { game, bender } = setUp();
    const land = game.debugSpawn("Forest", A, "battlefield");
    earthbend(game, bender, land);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: land }], {
      source: bender,
    });
    // The return is on the stack; the card is exiled from the graveyard in
    // response.
    game.advanceUntil((s) => s.zones.shared.stack.length > 0);
    expect(zone(game, land)).toBe("graveyard");
    apply(game, bender, { kind: "exile", target: 0 }, land);
    expect(zone(game, land)).toBe("exile");
  });

  it("earthbent twice, it dies once and comes back once", () => {
    const { game, bender } = setUp();
    const land = game.debugSpawn("Forest", A, "battlefield");
    earthbend(game, bender, land);
    earthbend(game, bender, land);
    expect(game.characteristics(land).power).toBe(4);
    apply(game, bender, { kind: "destroy", target: 0 }, land);
    expect(zone(game, land)).toBe("battlefield");
    expect(game.eventsOfType("permanent-entered-battlefield").filter((e) => e.object === land)).toHaveLength(1);
  });
});

describe("a delayed trigger keyed to a permanent leaving", () => {
  /** Kelsien, the Plague's shape: "When that creature dies this turn, you
   * get an experience counter." */
  const kelsien: EffectSpec = {
    kind: "delayed-trigger",
    at: { leaves: 0, to: ["graveyard"], thisTurn: true },
    effect: { kind: "add-player-counters", counter: "experience", amount: 1 },
    text: "When that creature dies this turn, you get an experience counter.",
  };
  const experience = (game: Game) => game.state.players[A].counters.experience ?? 0;

  it("fires when that creature dies this turn", () => {
    const { game, bender } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    apply(game, bender, kelsien, bears);
    apply(game, bender, { kind: "destroy", target: 0 }, bears);
    expect(experience(game)).toBe(1);
  });

  it("doesn't fire for a destination it doesn't name", () => {
    const { game, bender } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    apply(game, bender, kelsien, bears);
    apply(game, bender, { kind: "exile", target: 0 }, bears);
    expect(experience(game)).toBe(0);
    expect(game.state.delayedTriggers).toHaveLength(0);
  });

  it("'this turn' lapses as the next turn begins", () => {
    const { game, bender } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    apply(game, bender, kelsien, bears);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(game.state.delayedTriggers).toHaveLength(0);
    apply(game, bender, { kind: "destroy", target: 0 }, bears);
    expect(experience(game)).toBe(0);
  });

  it("watches only the permanent it was made for, not the card after a round trip", () => {
    const { game, bender } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    apply(game, bender, { ...kelsien, at: { leaves: 0, to: ["graveyard"] } } as EffectSpec, bears);
    apply(game, bender, { kind: "flicker", target: 0 }, bears);
    expect(zone(game, bears)).toBe("battlefield");
    apply(game, bender, { kind: "destroy", target: 0 }, bears);
    expect(experience(game)).toBe(0);
  });

  it("isn't made for something that isn't on the battlefield", () => {
    const { game, bender } = setUp();
    const card = game.debugSpawn("Grizzly Bears", B, "graveyard");
    apply(game, bender, kelsien, card);
    expect(game.state.delayedTriggers).toHaveLength(0);
  });
});

describe("undying follows the card only to the graveyard it died into", () => {
  it("exiled from the graveyard in response, it stays in exile", () => {
    const { game, bender } = setUp();
    const crusher = game.debugSpawn("Geralf's Mindcrusher", A, "battlefield");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: crusher }], {
      source: bender,
    });
    game.advanceUntil((s) => s.zones.shared.stack.length > 0);
    apply(game, bender, { kind: "exile", target: 0 }, crusher);
    expect(zone(game, crusher)).toBe("exile");
  });
});
