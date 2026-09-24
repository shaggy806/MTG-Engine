/**
 * Derevi, Empyrial Tactician — and the `ActivatedAbility.zone` machinery it
 * needs: an ability activated from the **command zone**, and a graveyard
 * ability that leaves its own source where it is (Reassembling Skeleton).
 *
 * Derevi, Empyrial Tactician — {G}{W}{U} Legendary Creature — Bird Wizard 2/3
 *   Flying
 *   Whenever Derevi enters and whenever a creature you control deals combat
 *   damage to a player, you may tap or untap target permanent.
 *   {1}{G}{W}{U}: Put Derevi onto the battlefield from the command zone.
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const DEREVI = "Derevi, Empyrial Tactician";

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const makeGame = (commander?: string) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 3,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad([]), ...(commander !== undefined ? { commander } : {}) },
      { player: B, cards: pad([]) },
    ],
  });
  return { game, a, b };
};

const atMain = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A;
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const lands = (game: Game, names: readonly string[]): ObjectId[] =>
  names.map((name) => game.debugSpawn(name, A, "battlefield"));

const commandZoneDerevi = (game: Game): ObjectId => {
  const id = game.state.zones.shared.command.find((c) => game.state.objects[c].owner === A);
  if (id === undefined) throw new Error("no commander");
  return id;
};

type AbilityLegal = Extract<LegalAction, { kind: "activate-ability" }>;
const abilityOf = (game: Game, source: ObjectId): AbilityLegal | undefined =>
  game
    .legalActions(A)
    .find((l): l is AbilityLegal => l.kind === "activate-ability" && l.source === source);

const activate = (game: Game, legal: AbilityLegal): void =>
  game.dispatch({
    type: "activate-ability",
    player: A,
    source: legal.source,
    abilityIndex: legal.abilityIndex,
    targets: [],
  });

describe("Derevi's command-zone ability", () => {
  it("is offered from the command zone, and only there", () => {
    const { game } = makeGame(DEREVI);
    game.advanceUntil(atMain);
    lands(game, ["Forest", "Plains", "Island", "Island"]);
    const derevi = commandZoneDerevi(game);
    expect(abilityOf(game, derevi)).toBeDefined();
    // Not as a permanent's ability once she's on the battlefield.
    const onBoard = game.debugSpawn(DEREVI, A, "battlefield");
    expect(abilityOf(game, onBoard)).toBeUndefined();
  });

  it("is not offered to an opponent, nor without the mana", () => {
    const { game } = makeGame(DEREVI);
    game.advanceUntil(atMain);
    lands(game, ["Forest", "Plains", "Island"]);
    const derevi = commandZoneDerevi(game);
    expect(abilityOf(game, derevi)).toBeUndefined();
    game.debugSpawn("Island", A, "battlefield");
    expect(abilityOf(game, derevi)).toBeDefined();
    expect(
      game.legalActions(B).some((l) => l.kind === "activate-ability" && l.source === derevi),
    ).toBe(false);
  });

  it("puts her onto the battlefield without casting her: no tax, no cast trigger, ETB fires", () => {
    const { game, a } = makeGame(DEREVI);
    game.advanceUntil(atMain);
    lands(game, ["Forest", "Plains", "Island", "Island"]);
    // Beast Whisperer: "Whenever you cast a creature spell, draw a card."
    game.debugSpawn("Beast Whisperer", A, "battlefield");
    // A tapped land for the enters trigger to untap.
    const tappedLand = game.debugSpawn("Forest", A, "battlefield", { tapped: true });
    a.chooseTargetsFn = () => [{ kind: "object", object: tappedLand }];
    a.chooseModesFn = () => [1]; // "Untap that permanent."

    const derevi = commandZoneDerevi(game);
    const hand = game.state.zones.perPlayer[A].hand.length;
    const legal = abilityOf(game, derevi);
    expect(legal).toBeDefined();
    activate(game, legal!);
    // Still in the command zone while the ability waits on the stack.
    expect(game.state.objects[derevi].zone).toBe("command");
    game.advanceUntil(settled);

    const obj = game.state.objects[derevi];
    expect(obj.zone).toBe("battlefield");
    expect(obj.isCommander).toBe(true);
    expect(game.state.players[A].commanderCastCounts[DEREVI] ?? 0).toBe(0);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand);
    expect(game.state.eventLog.some((e) => e.type === "spell-cast")).toBe(false);
    // Her enters trigger resolved, untapping the Forest.
    expect(game.state.objects[tappedLand].tapped).toBe(false);
  });

  it("does nothing if Derevi left the command zone and came back in response (rule 400.7)", () => {
    const { game } = makeGame(DEREVI);
    game.advanceUntil(atMain);
    lands(game, ["Forest", "Plains", "Island", "Island"]);
    const derevi = commandZoneDerevi(game);
    activate(game, abilityOf(game, derevi)!);
    // A round trip out of the command zone and back: the same id, but a new
    // object as far as the rules are concerned.
    game.state.objects[derevi].zoneChangeCount =
      (game.state.objects[derevi].zoneChangeCount ?? 0) + 2;
    game.advanceUntil(settled);
    expect(game.state.objects[derevi].zone).toBe("command");
  });

  it("casting her normally still pays tax and fires cast triggers (control)", () => {
    const { game } = makeGame(DEREVI);
    game.advanceUntil(atMain);
    lands(game, ["Forest", "Plains", "Island"]);
    game.debugSpawn("Beast Whisperer", A, "battlefield");
    const derevi = commandZoneDerevi(game);
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({ type: "cast-spell", player: A, card: derevi, targets: [] });
    game.advanceUntil(settled);
    expect(game.state.objects[derevi].zone).toBe("battlefield");
    expect(game.state.players[A].commanderCastCounts[DEREVI]).toBe(1);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand + 1);
  });
});

describe("Derevi's tap-or-untap trigger", () => {
  it("taps an opponent's permanent when a creature you control deals combat damage", () => {
    const { game, a } = makeGame();
    game.advanceUntil(atMain);
    game.debugSpawn(DEREVI, A, "battlefield", { summoningSick: false });
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    a.chooseTargetsFn = () => [{ kind: "object", object: theirs }];
    a.chooseModesFn = () => [0]; // "Tap that permanent."

    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(game.state.players[B].life).toBe(game.state.rules.startingLife - 2);
    expect(game.state.objects[theirs].tapped).toBe(true);
  });

  it("may do neither", () => {
    const { game, a } = makeGame();
    game.advanceUntil(atMain);
    const land = game.debugSpawn("Forest", A, "battlefield", { tapped: true });
    a.chooseTargetsFn = () => [{ kind: "object", object: land }];
    a.chooseModesFn = () => [];
    game.debugSpawn(DEREVI, A, "hand");
    const derevi = game.state.zones.perPlayer[A].hand.at(-1)!;
    lands(game, ["Forest", "Plains", "Island"]);
    game.dispatch({ type: "cast-spell", player: A, card: derevi, targets: [] });
    game.advanceUntil(settled);
    expect(game.state.objects[derevi].zone).toBe("battlefield");
    expect(game.state.objects[land].tapped).toBe(true);
    expect(
      game.state.eventLog.some((e) => e.type === "ability-resolved" && e.source === derevi),
    ).toBe(true);
  });
});

describe("a graveyard ability that doesn't exile its source (Reassembling Skeleton)", () => {
  it("returns the card tapped, leaving it in the graveyard until then", () => {
    const { game } = makeGame();
    game.advanceUntil(atMain);
    lands(game, ["Swamp", "Swamp"]);
    const skeleton = game.debugSpawn("Reassembling Skeleton", A, "graveyard");
    const legal = abilityOf(game, skeleton);
    expect(legal).toBeDefined();
    activate(game, legal!);
    // Not exiled as a cost: still in the graveyard with the ability on the stack.
    expect(game.state.objects[skeleton].zone).toBe("graveyard");
    game.advanceUntil(settled);
    expect(game.state.objects[skeleton].zone).toBe("battlefield");
    expect(game.state.objects[skeleton].tapped).toBe(true);
    expect(game.state.players[A].usedGraveyardThisTurn).toBe(true);
  });

  it("is not offered from the battlefield or hand", () => {
    for (const zone of ["battlefield", "hand"] as const) {
      const { game } = makeGame();
      game.advanceUntil(atMain);
      lands(game, ["Swamp", "Swamp"]);
      const skeleton = game.debugSpawn("Reassembling Skeleton", A, zone);
      expect(abilityOf(game, skeleton)).toBeUndefined();
    }
  });

  it("an older activation finds a Skeleton that died again in between to be a new object", () => {
    const { game } = makeGame();
    game.advanceUntil(atMain);
    lands(game, ["Swamp", "Swamp", "Swamp", "Swamp", "Mountain"]);
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand");
    const skeleton = game.debugSpawn("Reassembling Skeleton", A, "graveyard");

    // Activate twice: the card stays in the graveyard, so it can be.
    activate(game, abilityOf(game, skeleton)!);
    activate(game, abilityOf(game, skeleton)!);
    expect(game.state.zones.shared.stack).toHaveLength(2);

    // The second activation resolves and returns it…
    game.advanceUntil((s) => s.zones.shared.stack.length === 1 && s.priority.holder === A);
    expect(game.state.objects[skeleton].zone).toBe("battlefield");
    // …then it dies again before the first resolves.
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "object", object: skeleton }],
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 1 && s.priority.holder === A);
    expect(game.state.objects[skeleton].zone).toBe("graveyard");

    // The first activation's Skeleton is gone (rule 400.7): this one stays.
    game.advanceUntil(settled);
    expect(game.state.objects[skeleton].zone).toBe("graveyard");
  });
});
