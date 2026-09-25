/**
 * "Return target card from your graveyard" — Regrowth, Eternal Witness and
 * Kolaghan's Command's first mode. The card is a *target*, chosen as the
 * spell is cast or the trigger goes on the stack, not picked as it resolves:
 * - only a card in its controller's own graveyard (of the right type) can be
 *   chosen;
 * - with nothing to choose, the spell can't be cast (rule 601.2c) and the
 *   trigger never goes on the stack (rule 603.3d);
 * - a target that leaves the graveyard in response is gone (rule 608.2b).
 */

import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil(
    (s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  return game;
};

const lands = (game: Game, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) {
    game.debugSpawn(name, A, "battlefield", { summoningSick: false, announceEntry: false });
  }
};

const bury = (game: Game, name: string, owner: PlayerId): ObjectId =>
  game.debugSpawn(name, owner, "graveyard");

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

/** The targets a castable card offers in its (only, or first) slot. */
const castTargets = (game: Game, card: ObjectId): readonly ObjectId[] | null => {
  const offer = game.legalActions(A).find((a) => a.kind === "cast-spell" && a.card === card);
  if (offer === undefined || offer.kind !== "cast-spell") return null;
  return (offer.targetOptions?.[0] ?? []).flatMap((t) => (t.kind === "object" ? [t.object] : []));
};

describe("Regrowth", () => {
  it("targets a card in your own graveyard, and returns that one", () => {
    const game = mkGame();
    lands(game, "Forest", 2);
    const bears = bury(game, "Grizzly Bears", A);
    const bolt = bury(game, "Lightning Bolt", A);
    const theirs = bury(game, "Llanowar Elves", B);
    const regrowth = game.debugSpawn("Regrowth", A, "hand");

    const offered = castTargets(game, regrowth);
    expect(new Set(offered)).toEqual(new Set([bears, bolt]));
    expect(offered).not.toContain(theirs);

    game.dispatch({ type: "cast-spell", player: A, card: regrowth, targets: [{ kind: "object", object: bolt }] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bolt].zone).toBe("hand");
    expect(game.state.objects[bears].zone).toBe("graveyard");
  });

  it("can't be cast with nothing in your graveyard to target", () => {
    const game = mkGame();
    lands(game, "Forest", 2);
    bury(game, "Grizzly Bears", B); // an opponent's card isn't a legal target
    const regrowth = game.debugSpawn("Regrowth", A, "hand");
    expect(castTargets(game, regrowth)).toBeNull();
  });

  it("does nothing if its target leaves the graveyard first", () => {
    const game = mkGame();
    lands(game, "Forest", 2);
    const bears = bury(game, "Grizzly Bears", A);
    const regrowth = game.debugSpawn("Regrowth", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: regrowth, targets: [{ kind: "object", object: bears }] });
    // In response the card goes elsewhere; the card back in the graveyard
    // later would be a new object anyway (rule 400.7).
    game.debugApplyEffect(A, { kind: "exile", target: 0 }, [{ kind: "object", object: bears }]);
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("exile");
    expect(game.state.objects[regrowth].zone).toBe("graveyard");
  });
});

describe("Eternal Witness", () => {
  it("targets as it triggers, and the 'may' is asked at resolution", () => {
    const game = mkGame();
    const bears = bury(game, "Grizzly Bears", A);
    const bolt = bury(game, "Lightning Bolt", A);
    game.debugSpawn("Eternal Witness", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [{ kind: "object", object: bolt }] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bolt].zone).toBe("hand");
    expect(game.state.objects[bears].zone).toBe("graveyard");
  });

  it("with an empty graveyard, never goes on the stack", () => {
    const game = mkGame();
    const witness = game.debugSpawn("Eternal Witness", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.awaiting).toBeNull();
    const triggered = game.state.eventLog.filter(
      (e) => e.type === "ability-triggered" && e.source === witness,
    );
    expect(triggered).toHaveLength(0);
  });
});

describe("Kolaghan's Command", () => {
  it("mode one targets a creature card in your graveyard", () => {
    const game = mkGame();
    lands(game, "Swamp", 1);
    lands(game, "Mountain", 2);
    const bears = bury(game, "Grizzly Bears", A);
    const bolt = bury(game, "Lightning Bolt", A);
    const command = game.debugSpawn("Kolaghan's Command", A, "hand");

    const offer = game.legalActions(A).find((a) => a.kind === "cast-spell" && a.card === command);
    if (offer === undefined || offer.kind !== "cast-spell" || offer.castModal === undefined) {
      throw new Error("expected Kolaghan's Command to be castable as a modal spell");
    }
    const modeOne = offer.castModal.modes[0].targetOptions[0].flatMap((t) =>
      t.kind === "object" ? [t.object] : [],
    );
    // A creature card only: the Bolt isn't a legal target.
    expect(modeOne).toEqual([bears]);

    const handBefore = game.state.zones.perPlayer[B].hand.length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: command,
      modes: [0, 1],
      targets: [
        { kind: "object", object: bears },
        { kind: "player", player: B },
      ],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("hand");
    expect(game.state.objects[bolt].zone).toBe("graveyard");
    expect(game.state.zones.perPlayer[B].hand.length).toBe(handBefore - 1);
  });
});
