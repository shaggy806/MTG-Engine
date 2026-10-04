/**
 * Blitz (rule 702.152a): an alternative cost from the hand (or a commander
 * from the command zone); a permanent cast that way has haste and "when this
 * is put into a graveyard from the battlefield, draw a card", and is
 * sacrificed at the beginning of the next end step. A copy of it gets none of
 * that (the rulings). Star Athlete, Jaxis, the Troublemaker, and Henzie
 * "Toolbox" Torre's granted blitz and its discount.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { computeCharacteristics } from "../characteristics.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
/** Bob's upkeep: alice's end step has passed, and nobody has drawn since. */
const bobsUpkeep = (s: GameState): boolean => s.turn.number === 2 && s.turn.step === "upkeep";

const setUp = (commanders?: readonly string[]) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [A, B].map((player) => ({
      player,
      cards: Array<string>(40).fill("Wastes"),
      ...(player === A && commanders !== undefined ? { commanders } : {}),
    })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return { game, a, b };
};

const lands = (game: Game, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, A, "battlefield");
};

const blitzOffers = (game: Game, card: ObjectId) =>
  game.legalActions(A).filter((a) => a.kind === "cast-spell" && a.card === card && a.via === "blitz");

const hasHaste = (game: Game, id: ObjectId): boolean =>
  computeCharacteristics(game.state, game.registry, id).keywords.has("haste");

const handSize = (game: Game): number => game.state.zones.perPlayer[A].hand.length;

describe("blitz", () => {
  it("casts Star Athlete for {3}{R}: haste now, sacrificed at the next end step, and a card drawn", () => {
    const { game } = setUp();
    const athlete = game.debugSpawn("Star Athlete", A, "hand");
    lands(game, "Mountain", 4);
    expect(blitzOffers(game, athlete)).toHaveLength(1);
    game.dispatch({ type: "cast-spell", player: A, card: athlete, targets: [], via: "blitz" });
    game.advanceUntil(quiet);
    expect(game.state.objects[athlete].zone).toBe("battlefield");
    expect(hasHaste(game, athlete)).toBe(true);
    const before = handSize(game);
    game.advanceUntil(bobsUpkeep);
    expect(game.state.objects[athlete].zone).toBe("graveyard");
    expect(handSize(game)).toBe(before + 1);
  });

  it("isn't offered without the mana, and a normal cast has no haste and stays", () => {
    const { game } = setUp();
    const athlete = game.debugSpawn("Star Athlete", A, "hand");
    lands(game, "Mountain", 3);
    expect(blitzOffers(game, athlete)).toHaveLength(0);
    game.dispatch({ type: "cast-spell", player: A, card: athlete, targets: [] });
    game.advanceUntil(quiet);
    expect(hasHaste(game, athlete)).toBe(false);
    game.advanceUntil(bobsUpkeep);
    expect(game.state.objects[athlete].zone).toBe("battlefield");
  });

  it("a token copy of a blitzed creature has neither the haste nor the draw", () => {
    const { game } = setUp();
    const athlete = game.debugSpawn("Star Athlete", A, "hand");
    const kiki = game.debugSpawn("Kiki-Jiki, Mirror Breaker", A, "battlefield", { summoningSick: false });
    lands(game, "Mountain", 4);
    game.dispatch({ type: "cast-spell", player: A, card: athlete, targets: [], via: "blitz" });
    game.advanceUntil(quiet);
    const before = handSize(game);
    game.dispatch({ type: "activate-ability", player: A, source: kiki, abilityIndex: 0, targets: [{ kind: "object", object: athlete }] });
    game.advanceUntil(quiet);
    const copy = game.battlefield.find((id) => id !== athlete && game.state.objects[id].cardName === "Star Athlete")!;
    expect(copy).toBeDefined();
    // Kiki-Jiki's own "except it has haste" is the only haste on it…
    const mods = game.state.objects[copy].modifiers;
    expect(mods.some((m) => (m.grantsTriggered?.length ?? 0) > 0)).toBe(false);
    // …and when both go at the end step, only the blitzed one draws.
    game.advanceUntil(bobsUpkeep);
    expect(game.state.objects[athlete].zone).toBe("graveyard");
    expect(game.state.objects[copy]?.zone ?? "gone").not.toBe("battlefield");
    expect(handSize(game)).toBe(before + 1);
  });
});

describe("Star Athlete's attack trigger", () => {
  const attackAt = (sacrifices: boolean) => {
    const { game, a, b } = setUp();
    const athlete = game.debugSpawn("Star Athlete", A, "battlefield", { summoningSick: false });
    const giant = game.debugSpawn("Hill Giant", B, "battlefield");
    // Bob's Giant stays home; the trigger asks him about it.
    a.declareAttackersFn = () => [{ attacker: athlete, defender: B }];
    a.chooseTargetsFn = () => [{ kind: "object", object: giant }];
    b.declareBlockersFn = () => [];
    b.chooseModesFn = () => (sacrifices ? [0] : []);
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    game.advanceUntil(quiet);
    return { game, giant };
  };

  it("its controller sacrifices the target, and takes no 5 damage", () => {
    const { game, giant } = attackAt(true);
    expect(game.state.objects[giant].zone).toBe("graveyard");
    expect(game.state.players[B].life).toBe(17);
  });

  it("dealing its own controller lethal damage takes their attacker out of combat (rule 800.4a)", () => {
    const C = asPlayerId("carol");
    const players = [A, B, C];
    const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)]));
    const game = Game.create({
      seed: 1,
      shuffle: false,
      startingPlayer: A,
      rules: { maxLandsPerTurn: 99, skipFirstDraw: false, maxHandSize: 99 },
      controllers,
      decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Wastes") })),
    });
    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
    const athlete = game.debugSpawn("Star Athlete", A, "battlefield", { summoningSick: false });
    const mine = game.debugSpawn("Hill Giant", A, "battlefield");
    const blockers = [game.debugSpawn("Hill Giant", B, "battlefield"), game.debugSpawn("Hill Giant", B, "battlefield")];
    game.state.players[A].life = 5;
    const a = controllers[A];
    a.declareAttackersFn = () => [{ attacker: athlete, defender: B }];
    // Alice aims it at her own Giant and keeps it: 5 damage to herself.
    a.chooseTargetsFn = () => [{ kind: "object", object: mine }];
    a.chooseModesFn = () => [];
    // Menace: Bob blocks with both, so the attacker would owe a damage split.
    controllers[B].declareBlockersFn = () => blockers.map((blocker) => ({ blocker, attacker: athlete }));
    game.advanceUntil((s) => s.turn.number >= 2 && s.turn.step === "precombat-main");
    expect(game.state.players[A].hasLost).toBe(true);
    expect(game.state.objects[athlete].attacking).toBeNull();
    for (const blocker of blockers) expect(game.state.objects[blocker].zone).toBe("battlefield");
  });

  it("its controller keeps it, and Star Athlete deals them 5 damage", () => {
    const { game, giant } = attackAt(false);
    expect(game.state.objects[giant].zone).toBe("battlefield");
    expect(game.state.players[B].life).toBe(12);
  });
});

describe("Jaxis, the Troublemaker", () => {
  it("discards to copy another creature, which has haste, is sacrificed at the end step, and draws", () => {
    const { game } = setUp();
    const jaxis = game.debugSpawn("Jaxis, the Troublemaker", A, "battlefield", { summoningSick: false });
    const giant = game.debugSpawn("Hill Giant", A, "battlefield");
    game.debugSpawn("Wastes", A, "hand");
    lands(game, "Mountain", 1);
    const offer = game.legalActions(A).find((a) => a.kind === "activate-ability" && a.source === jaxis);
    expect(offer).toBeDefined();
    // "Another" target creature: never Jaxis.
    if (offer?.kind === "activate-ability") {
      expect(offer.targetOptions[0]).toEqual([{ kind: "object", object: giant }]);
    }
    const before = handSize(game);
    game.dispatch({ type: "activate-ability", player: A, source: jaxis, abilityIndex: 0, targets: [{ kind: "object", object: giant }] });
    game.advanceUntil(quiet);
    expect(handSize(game)).toBe(before - 1);
    const copy = game.battlefield.find((id) => id !== giant && game.state.objects[id].cardName === "Hill Giant")!;
    expect(copy).toBeDefined();
    expect(hasHaste(game, copy)).toBe(true);
    game.advanceUntil(bobsUpkeep);
    expect(game.state.objects[copy]?.zone ?? "gone").not.toBe("battlefield");
    expect(game.state.objects[giant].zone).toBe("battlefield");
    expect(handSize(game)).toBe(before);
  });

  it("can be blitzed from the command zone, commander tax added", () => {
    const { game } = setUp(["Jaxis, the Troublemaker"]);
    const jaxis = game.state.zones.shared.command.find((id) => game.state.objects[id].cardName === "Jaxis, the Troublemaker")!;
    lands(game, "Mountain", 2);
    expect(blitzOffers(game, jaxis)).toHaveLength(1);
    // Cast once before: {2} tax on top of {1}{R}, so two lands aren't enough.
    game.state.players[A].commanderCastCounts["Jaxis, the Troublemaker"] = 1;
    expect(blitzOffers(game, jaxis)).toHaveLength(0);
    lands(game, "Mountain", 2);
    expect(blitzOffers(game, jaxis)).toHaveLength(1);
    game.dispatch({ type: "cast-spell", player: A, card: jaxis, targets: [], via: "blitz" });
    expect(game.battlefield.filter((id) => game.state.objects[id].tapped).length).toBe(4);
    game.advanceUntil(quiet);
    expect(game.state.objects[jaxis].zone).toBe("battlefield");
    expect(hasHaste(game, jaxis)).toBe(true);
  });
});

describe('Henzie "Toolbox" Torre', () => {
  it("gives creature spells of mana value 4 or more blitz for their mana cost", () => {
    const { game } = setUp();
    game.debugSpawn('Henzie "Toolbox" Torre', A, "battlefield");
    const wurm = game.debugSpawn("Craw Wurm", A, "hand");
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    lands(game, "Forest", 6);
    expect(blitzOffers(game, wurm)).toHaveLength(1);
    expect(blitzOffers(game, bears)).toHaveLength(0);
    game.dispatch({ type: "cast-spell", player: A, card: wurm, targets: [], via: "blitz" });
    game.advanceUntil(quiet);
    expect(hasHaste(game, wurm)).toBe(true);
    game.advanceUntil(bobsUpkeep);
    expect(game.state.objects[wurm].zone).toBe("graveyard");
  });

  it("takes {1} off every blitz cost for each commander cast from the command zone", () => {
    const { game } = setUp();
    game.debugSpawn('Henzie "Toolbox" Torre', A, "battlefield");
    const wurm = game.debugSpawn("Craw Wurm", A, "hand");
    const athlete = game.debugSpawn("Star Athlete", A, "hand");
    lands(game, "Forest", 2);
    lands(game, "Mountain", 2);
    // {4}{G}{G} and {3}{R}: neither castable from four lands…
    expect(blitzOffers(game, wurm)).toHaveLength(0);
    // …until two commander casts take {2} off each.
    game.state.players[A].commanderCastCounts["Tymna the Weaver"] = 2; // any commander
    expect(blitzOffers(game, wurm)).toHaveLength(1);
    expect(blitzOffers(game, athlete)).toHaveLength(1);
    game.dispatch({ type: "cast-spell", player: A, card: wurm, targets: [], via: "blitz" });
    expect(game.battlefield.filter((id) => game.state.objects[id].tapped).length).toBe(4);
  });
});
