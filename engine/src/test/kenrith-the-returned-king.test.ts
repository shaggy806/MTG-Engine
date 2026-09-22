/**
 * Kenrith, the Returned King — five activated abilities, one per colour, each
 * driven through the real `Game` (legal-action enumeration, auto-paid mana,
 * the stack, resolution):
 *
 * - `{R}`: all creatures — every player's — gain trample and haste until end
 *   of turn, and only those on the battlefield as it resolves (rule 611.2c;
 *   the 2019-10-04 ruling).
 * - `{1}{G}`: a +1/+1 counter on target creature — anything that is a
 *   creature right now, so an animated man-land counts.
 * - `{2}{W}`: target player gains 5 life.
 * - `{3}{U}`: target player draws a card.
 * - `{4}{B}`: a creature card from **any** graveyard onto the battlefield
 *   under its **owner's** control (the 2023-04-14 ruling).
 *
 * None has `{T}` in its cost, so summoning sickness never gates them (rule
 * 302.6).
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { createDefaultRegistry } from "../cards.js";
import { whyCannotAttack } from "../combat/eligibility.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const KENRITH = "Kenrith, the Returned King";
const registry = createDefaultRegistry();

const makeGame = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Plains") },
      { player: B, cards: Array<string>(40).fill("Plains") },
    ],
  });
  game.advanceUntil(
    (s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  return { game, a, b };
};

const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

/** Untapped lands for `player`, so each test funds exactly the ability it
 * activates. */
const lands = (game: Game, player: PlayerId, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) {
    const id = game.debugSpawn(name, player, "battlefield");
    game.state.objects[id].tapped = false;
  }
};

type Activation = Extract<LegalAction, { kind: "activate-ability" }>;

const offered = (game: Game, kenrith: ObjectId, abilityIndex: number): Activation => {
  const legal = game
    .legalActions(A)
    .find(
      (a): a is Activation =>
        a.kind === "activate-ability" && a.source === kenrith && a.abilityIndex === abilityIndex,
    );
  if (legal === undefined) throw new Error(`Kenrith ability ${abilityIndex} not offered`);
  return legal;
};

const activate = (
  game: Game,
  kenrith: ObjectId,
  abilityIndex: number,
  targets: readonly TargetRef[] = [],
): void => {
  offered(game, kenrith, abilityIndex);
  game.dispatch({ type: "activate-ability", player: A, source: kenrith, abilityIndex, targets });
  game.advanceUntil(settled);
};

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });

describe("Kenrith, the Returned King", () => {
  it("is a 5/5 white legendary Human Noble whose colour identity is all five colours", () => {
    const def = registry.get(KENRITH);
    expect(def.manaCost).toBe("{4}{W}");
    expect(def.colors).toEqual(["W"]);
    expect(def.supertypes).toContain("legendary");
    expect(def.subtypes).toEqual(["Human", "Noble"]);
    expect([def.power, def.toughness]).toEqual([5, 5]);
    // Rule 903.4: the pips in the ability costs count.
    expect(identityString(colorIdentityOf(def))).toBe("WUBRG");
    expect(def.activated).toHaveLength(5);
    expect(def.activated.every((ability) => ability.cost.tap !== true)).toBe(true);
  });

  describe("{R}: all creatures gain trample and haste until end of turn", () => {
    it("reaches every player's creatures, can be used the turn Kenrith arrives, and ends at end of turn", () => {
      const { game } = makeGame();
      const kenrith = game.debugSpawn(KENRITH, A, "battlefield");
      const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
      lands(game, A, "Mountain", 1);
      // No {T} in the cost: summoning sickness doesn't stop it.
      expect(game.state.objects[kenrith].summoningSick).toBe(true);

      activate(game, kenrith, 0);

      for (const creature of [kenrith, bears]) {
        const keywords = game.characteristics(creature).keywords;
        expect(keywords.has("trample")).toBe(true);
        expect(keywords.has("haste")).toBe(true);
      }

      // Rule 611.2c: a creature that enters afterwards gets neither.
      // (Grizzly Bears is vanilla, so neither keyword can be printed.)
      const late = game.debugSpawn("Grizzly Bears", A, "battlefield");
      expect(game.characteristics(late).keywords.has("trample")).toBe(false);
      expect(game.characteristics(late).keywords.has("haste")).toBe(false);

      game.advanceUntil((s) => s.turn.number === 2);
      for (const creature of [kenrith, bears]) {
        const keywords = game.characteristics(creature).keywords;
        expect(keywords.has("trample")).toBe(false);
        expect(keywords.has("haste")).toBe(false);
      }
    });

    it("lets a summoning-sick Kenrith attack at once and trample over a chump blocker", () => {
      const { game, a, b } = makeGame();
      const kenrith = game.debugSpawn(KENRITH, A, "battlefield");
      const bears = game.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false });
      lands(game, A, "Mountain", 1);

      expect(whyCannotAttack(game.state, registry, A, kenrith, B)).not.toBeNull();
      activate(game, kenrith, 0);
      expect(whyCannotAttack(game.state, registry, A, kenrith, B)).toBeNull();

      a.declareAttackersFn = () => [{ attacker: kenrith, defender: B }];
      b.declareBlockersFn = () => [{ blocker: bears, attacker: kenrith }];
      game.advanceUntil((s) => s.turn.step === "postcombat-main");

      // 2 lethal to the Bears, the other 3 trample through.
      expect(game.state.objects[bears].zone).toBe("graveyard");
      expect(game.state.players[B].life).toBe(17);
    });
  });

  it("{1}{G}: puts a +1/+1 counter on target creature, whoever controls it", () => {
    const { game } = makeGame();
    const kenrith = game.debugSpawn(KENRITH, A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    lands(game, A, "Forest", 2);

    const options = offered(game, kenrith, 1).targetOptions[0];
    // Creatures only — any controller's, never a land or a player.
    expect(options).toContainEqual(obj(bears));
    expect(options).toContainEqual(obj(kenrith));
    expect(options.every((t) => t.kind === "object")).toBe(true);
    expect(
      options.every(
        (t) => t.kind === "object" && game.characteristics(t.object).types.includes("creature"),
      ),
    ).toBe(true);

    activate(game, kenrith, 1, [obj(bears)]);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(1);
    expect(game.characteristics(bears).power).toBe(3);
    expect(game.characteristics(bears).toughness).toBe(3);
  });

  it("{1}{G}: 'target creature' is whatever is a creature right now — an animated land, not a dormant one", () => {
    const { game } = makeGame();
    const kenrith = game.debugSpawn(KENRITH, A, "battlefield");
    const factory = game.debugSpawn("Mishra's Factory", A, "battlefield", { summoningSick: false });
    lands(game, A, "Forest", 3);

    // A plain land isn't a creature, so it isn't offered.
    expect(offered(game, kenrith, 1).targetOptions[0]).not.toContainEqual(obj(factory));

    // Animated, it is one (layer 4), and it's a legal target.
    game.dispatch({ type: "activate-ability", player: A, source: factory, abilityIndex: 1, targets: [] });
    game.advanceUntil(settled);
    expect(game.characteristics(factory).types).toContain("creature");
    expect(offered(game, kenrith, 1).targetOptions[0]).toContainEqual(obj(factory));

    activate(game, kenrith, 1, [obj(factory)]);
    expect(game.state.objects[factory].counters["+1/+1"]).toBe(1);
    expect(game.characteristics(factory).power).toBe(3);
  });

  it("{2}{W}: target player — an opponent or yourself — gains 5 life", () => {
    const { game } = makeGame();
    const kenrith = game.debugSpawn(KENRITH, A, "battlefield");
    lands(game, A, "Plains", 6);

    const options = offered(game, kenrith, 2).targetOptions[0];
    expect(options).toContainEqual(player(A));
    expect(options).toContainEqual(player(B));

    activate(game, kenrith, 2, [player(B)]);
    expect(game.state.players[B].life).toBe(25);
    expect(game.state.players[A].life).toBe(20);

    activate(game, kenrith, 2, [player(A)]);
    expect(game.state.players[A].life).toBe(25);
    expect(game.state.players[B].life).toBe(25);
  });

  it("{3}{U}: target player draws a card", () => {
    const { game } = makeGame();
    const kenrith = game.debugSpawn(KENRITH, A, "battlefield");
    lands(game, A, "Island", 4);

    const options = offered(game, kenrith, 3).targetOptions[0];
    expect(options).toContainEqual(player(A));
    expect(options).toContainEqual(player(B));

    const handA = game.handOf(A).length;
    const handB = game.handOf(B).length;
    const libraryB = game.libraryOf(B).length;
    activate(game, kenrith, 3, [player(B)]);
    expect(game.handOf(B).length).toBe(handB + 1);
    expect(game.libraryOf(B).length).toBe(libraryB - 1);
    expect(game.handOf(A).length).toBe(handA);
  });

  describe("{4}{B}: creature card from a graveyard onto the battlefield under its owner's control", () => {
    it("targets creature cards in any graveyard, and nothing else", () => {
      const { game } = makeGame();
      const kenrith = game.debugSpawn(KENRITH, A, "battlefield");
      const theirs = game.debugSpawn("Grizzly Bears", B, "graveyard");
      const mine = game.debugSpawn("Craw Wurm", A, "graveyard");
      const bolt = game.debugSpawn("Lightning Bolt", B, "graveyard");
      const onBoard = game.debugSpawn("Grizzly Bears", B, "battlefield");
      lands(game, A, "Swamp", 5);

      const options = offered(game, kenrith, 4).targetOptions[0];
      expect(options).toContainEqual(obj(theirs));
      expect(options).toContainEqual(obj(mine));
      expect(options).not.toContainEqual(obj(bolt));
      expect(options).not.toContainEqual(obj(onBoard));
    });

    it("returns an opponent's creature to the battlefield under that opponent's control", () => {
      const { game } = makeGame();
      const kenrith = game.debugSpawn(KENRITH, A, "battlefield");
      const theirs = game.debugSpawn("Grizzly Bears", B, "graveyard");
      lands(game, A, "Swamp", 5);

      activate(game, kenrith, 4, [obj(theirs)]);
      const returned = game.state.objects[theirs];
      expect(returned.zone).toBe("battlefield");
      expect(returned.owner).toBe(B);
      expect(returned.controller).toBe(B);

      // And it stays theirs past the next state-based-action sweep and turn.
      game.advanceUntil((s) => s.turn.number === 2);
      expect(game.state.objects[theirs].controller).toBe(B);
    });

    it("returns your own creature under your control", () => {
      const { game } = makeGame();
      const kenrith = game.debugSpawn(KENRITH, A, "battlefield");
      const mine = game.debugSpawn("Craw Wurm", A, "graveyard");
      lands(game, A, "Swamp", 5);

      activate(game, kenrith, 4, [obj(mine)]);
      expect(game.state.objects[mine].zone).toBe("battlefield");
      expect(game.state.objects[mine].controller).toBe(A);
    });
  });
});
