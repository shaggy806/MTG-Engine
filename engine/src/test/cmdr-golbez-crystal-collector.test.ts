/**
 * Golbez, Crystal Collector — its printed clauses through the real `Game`:
 *
 * - {U}{B} legendary Human Wizard, 1/4, blue-black identity.
 * - "Whenever an artifact you control enters, surveil 1." — an *artifact*,
 *   that *you* control.
 * - "At the beginning of your end step, if you control four or more
 *   artifacts, return target creature card from your graveyard to your hand.
 *   Then if you control eight or more artifacts, each opponent loses life
 *   equal to that card's power." — *your* end step; an intervening-if checked
 *   both when it triggers and as it resolves (rule 603.4); a *targeted*
 *   *creature* card in *your* graveyard; the eight-artifact rider read at that
 *   point of the resolution; *each opponent*; the *returned card's* power; and
 *   nothing at all if the target is gone (rule 608.2b).
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const [A, B, C] = ["alice", "bob", "carol"].map(asPlayerId);
const GOLBEZ = "Golbez, Crystal Collector";

const mkGame = (players: readonly PlayerId[] = [A, B, C]): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil(
    (s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  return game;
};

/** Board setup, silent — an artifact spawned this way fires no surveil. */
const spawn = (game: Game, name: string, player: PlayerId, announce = false): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: announce });
const artifacts = (game: Game, player: PlayerId, n: number): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, "Sol Ring", player));
const bury = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "graveyard");
const zoneOf = (game: Game, id: ObjectId): string | undefined => game.state.objects[id]?.zone;
const lifeOf = (game: Game, p: PlayerId): number => game.state.players[p].life;

const golbezOnStack = (s: GameState): boolean =>
  s.zones.shared.stack.some(
    (id) => s.objects[id].kind === "ability" && s.objects[id].cardName === GOLBEZ,
  );
const golbezTriggers = (game: Game): number =>
  game.state.eventLog.filter(
    (e) => e.type === "ability-triggered" && game.state.objects[e.source]?.cardName === GOLBEZ,
  ).length;

/** Runs to the end of A's turn 1, answering Golbez's target choice with
 * `pick` when one is asked, and stopping with the trigger on the stack if
 * `stopOnStack` says so. */
const toEndStep = (game: Game, pick?: ObjectId, stopOnStack = false): void => {
  for (let i = 0; i < 50; i += 1) {
    game.advanceUntil(
      (s) =>
        s.awaiting?.kind === "choose-targets" ||
        (stopOnStack && golbezOnStack(s)) ||
        s.turn.number > 1 ||
        (s.turn.step === "cleanup"),
    );
    const awaiting = game.state.awaiting;
    if (awaiting?.kind === "choose-targets" && pick !== undefined) {
      game.dispatch({
        type: "choose-targets",
        player: awaiting.player,
        targets: [{ kind: "object", object: pick }],
      });
      continue;
    }
    return;
  }
};

describe("Golbez — characteristics", () => {
  it("is a {U}{B} legendary Human Wizard 1/4 with UB identity", () => {
    const def = createDefaultRegistry().get(GOLBEZ);
    expect(def.manaCost).toBe("{U}{B}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.types).toEqual(["creature"]);
    expect(def.subtypes).toEqual(["Human", "Wizard"]);
    expect([def.power, def.toughness]).toEqual([1, 4]);
    expect(identityString(colorIdentityOf(def))).toBe("UB");
  });
});

describe("Golbez — whenever an artifact you control enters, surveil 1", () => {
  it("surveils when an artifact enters under your control", () => {
    const game = mkGame();
    spawn(game, GOLBEZ, A);
    spawn(game, "Sol Ring", A, true);
    game.advanceUntil((s) => s.awaiting !== null || s.turn.number > 1);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("scry");
    if (awaiting?.kind !== "scry") return;
    expect(awaiting.mode).toBe("surveil");
    expect(awaiting.player).toBe(A);
    expect(awaiting.cards).toHaveLength(1);
  });

  it("not for an artifact an opponent controls, nor for a nonartifact", () => {
    const game = mkGame();
    spawn(game, GOLBEZ, A);
    spawn(game, "Sol Ring", B, true);
    spawn(game, "Grizzly Bears", A, true);
    game.advanceUntil((s) => s.awaiting !== null || s.turn.step === "end");
    expect(golbezTriggers(game)).toBe(0);
  });
});

describe("Golbez — the end-step return", () => {
  it("with four artifacts: returns the target creature card, and nobody loses life", () => {
    const game = mkGame();
    spawn(game, GOLBEZ, A);
    artifacts(game, A, 4);
    const bears = bury(game, "Grizzly Bears", A);
    const island = bury(game, "Island", A);
    toEndStep(game, bears);

    expect(zoneOf(game, bears)).toBe("hand");
    expect(zoneOf(game, island)).toBe("graveyard");
    expect([lifeOf(game, A), lifeOf(game, B), lifeOf(game, C)]).toEqual([20, 20, 20]);
  });

  it("the target is a *creature* card in *your* graveyard", () => {
    const game = mkGame();
    spawn(game, GOLBEZ, A);
    artifacts(game, A, 4);
    const mine = bury(game, "Grizzly Bears", A);
    const theirs = bury(game, "Grizzly Bears", B);
    const land = bury(game, "Island", A);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || s.turn.number > 1);
    // Only one legal target, so it may have been chosen without asking; if
    // asked, the offer must be exactly that one card.
    if (game.state.awaiting?.kind === "choose-targets") {
      const offer = game.legalActions(A).find((a) => a.kind === "choose-targets");
      const options = JSON.stringify(offer);
      expect(options).toContain(mine);
      expect(options).not.toContain(theirs);
      expect(options).not.toContain(land);
    }
    toEndStep(game, mine);
    expect(zoneOf(game, mine)).toBe("hand");
    expect(zoneOf(game, theirs)).toBe("graveyard");
  });

  it("with three artifacts it doesn't trigger", () => {
    const game = mkGame();
    spawn(game, GOLBEZ, A);
    artifacts(game, A, 3);
    const bears = bury(game, "Grizzly Bears", A);
    toEndStep(game, bears);

    expect(zoneOf(game, bears)).toBe("graveyard");
    expect(golbezTriggers(game)).toBe(0);
  });

  it("an opponent's artifacts don't count", () => {
    const game = mkGame();
    spawn(game, GOLBEZ, A);
    artifacts(game, A, 3);
    artifacts(game, B, 5);
    const bears = bury(game, "Grizzly Bears", A);
    toEndStep(game, bears);

    expect(zoneOf(game, bears)).toBe("graveyard");
  });

  it("with eight artifacts each opponent loses life equal to the card's power", () => {
    const game = mkGame();
    spawn(game, GOLBEZ, A);
    artifacts(game, A, 8);
    const giant = bury(game, "Hill Giant", A); // 3/3
    toEndStep(game, giant);

    expect(zoneOf(game, giant)).toBe("hand");
    expect([lifeOf(game, A), lifeOf(game, B), lifeOf(game, C)]).toEqual([20, 17, 17]);
  });

  it("a token stack counts as every token in it", () => {
    const game = mkGame();
    // Eight Thopters in one batch compact into a single stack object.
    game.debugApplyEffect(A, { kind: "create-token", token: "Thopter Token", count: 8 });
    const stacks = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Thopter Token",
    );
    expect(stacks).toHaveLength(1);
    expect(game.state.objects[stacks[0]].stackCount).toBe(8);
    spawn(game, GOLBEZ, A);
    const bears = bury(game, "Grizzly Bears", A);
    toEndStep(game, bears);

    expect(zoneOf(game, bears)).toBe("hand");
    expect([lifeOf(game, B), lifeOf(game, C)]).toEqual([18, 18]);
  });

  it("rechecks four artifacts as it resolves (intervening if)", () => {
    const game = mkGame();
    spawn(game, GOLBEZ, A);
    const rings = artifacts(game, A, 4);
    const bears = bury(game, "Grizzly Bears", A);
    toEndStep(game, bears, true);
    expect(golbezOnStack(game.state)).toBe(true);

    // One artifact leaves in response (white-box: straight to the graveyard).
    const bf = game.state.zones.shared.battlefield;
    bf.splice(bf.indexOf(rings[0]), 1);
    game.state.zones.perPlayer[A].graveyard.push(rings[0]);
    game.state.objects[rings[0]].zone = "graveyard";
    toEndStep(game, bears);

    expect(zoneOf(game, bears)).toBe("graveyard");
  });

  it("rechecks eight artifacts at the 'then', independently of the four", () => {
    const game = mkGame();
    spawn(game, GOLBEZ, A);
    const rings = artifacts(game, A, 8);
    const bears = bury(game, "Grizzly Bears", A);
    toEndStep(game, bears, true);

    const bf = game.state.zones.shared.battlefield;
    bf.splice(bf.indexOf(rings[0]), 1);
    game.state.zones.perPlayer[A].graveyard.push(rings[0]);
    game.state.objects[rings[0]].zone = "graveyard";
    toEndStep(game, bears);

    // Seven left: still returns, no life loss.
    expect(zoneOf(game, bears)).toBe("hand");
    expect([lifeOf(game, B), lifeOf(game, C)]).toEqual([20, 20]);
  });

  it("does nothing — no life loss either — if the target left the graveyard", () => {
    const game = mkGame();
    spawn(game, GOLBEZ, A);
    artifacts(game, A, 8);
    const bears = bury(game, "Grizzly Bears", A);
    toEndStep(game, bears, true);

    const gy = game.state.zones.perPlayer[A].graveyard;
    gy.splice(gy.indexOf(bears), 1);
    game.state.zones.shared.exile.push(bears);
    game.state.objects[bears].zone = "exile";
    toEndStep(game, bears);

    expect(zoneOf(game, bears)).toBe("exile");
    expect([lifeOf(game, B), lifeOf(game, C)]).toEqual([20, 20]);
  });

  it("only at *your* end step", () => {
    const game = mkGame();
    spawn(game, GOLBEZ, B);
    artifacts(game, B, 8);
    const bears = bury(game, "Grizzly Bears", B);
    toEndStep(game, bears);

    expect(zoneOf(game, bears)).toBe("graveyard");
    expect(golbezTriggers(game)).toBe(0);
  });

  it("with no creature card in your graveyard nothing happens", () => {
    const game = mkGame();
    spawn(game, GOLBEZ, A);
    artifacts(game, A, 8);
    bury(game, "Island", A);
    toEndStep(game);

    expect([lifeOf(game, B), lifeOf(game, C)]).toEqual([20, 20]);
  });
});
