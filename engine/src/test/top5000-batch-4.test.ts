/**
 * Top-5000 batch 4: the cards the day's features unblocked — regeneration,
 * Strive (`costPerExtraTarget`), the Will cycle's `maxModesIf` — one test
 * each for the clause most likely to be wrong.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (hand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill("Wastes")] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name);
};
const inHand = (game: Game, name: string): ObjectId =>
  game.handOf(A).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);

describe("top-5000 batch 4", () => {
  it("Twinflame: a hasty copy of each target, {2}{R} more for the second, exiled at end step", () => {
    const { game } = setUp(["Twinflame"]);
    lands(game, "Mountain", 5);
    const bears = spawn(game, "Grizzly Bears");
    const wurm = spawn(game, "Craw Wurm");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Twinflame"),
      targets: [
        { kind: "object", object: bears },
        { kind: "object", object: wurm },
      ],
    });
    // {1}{R} and {2}{R}: all five Mountains.
    expect(game.battlefield.filter((id) => game.state.objects[id].cardName === "Mountain" && !game.state.objects[id].tapped)).toHaveLength(0);
    game.advanceUntil(quiet);
    const copies = [...named(game, "Grizzly Bears"), ...named(game, "Craw Wurm")].filter((id) => game.state.objects[id].isToken);
    expect(copies).toHaveLength(2);
    for (const id of copies) expect(game.characteristics(id).keywords.has("haste")).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(copies.every((id) => game.state.objects[id]?.zone !== "battlefield")).toBe(true);
  });

  it("Will of the Temur: the copy is a 4/4 flying Dragon in addition to its other types", () => {
    const { game } = setUp(["Will of the Temur"]);
    lands(game, "Island", 6);
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Will of the Temur"),
      modes: [0],
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(quiet);
    const copy = named(game, "Grizzly Bears").find((id) => game.state.objects[id].isToken)!;
    const c = game.characteristics(copy);
    expect(game.state.objects[copy].controller).toBe(A);
    expect(c).toMatchObject({ power: 4, toughness: 4 });
    expect(c.keywords.has("flying")).toBe(true);
    expect([...c.subtypes].sort()).toEqual(["Bear", "Dragon"]);
  });

  it("Zombie Master: other Zombies have swampwalk and regenerate, it doesn't", () => {
    const { game } = setUp();
    const master = spawn(game, "Zombie Master");
    const familiar = spawn(game, "Nightscape Familiar", B); // a Zombie, even an opponent's
    expect(game.characteristics(familiar).keywords.has("swampwalk")).toBe(true);
    expect(game.characteristics(master).keywords.has("swampwalk")).toBe(false);
    lands(game, "Swamp", 1);
    const master2 = spawn(game, "Zombie Master");
    // Each Master grants the other its "{B}: Regenerate this permanent."
    game.state.objects[master2].controller = A;
    const offers = game
      .legalActions(A)
      .filter((x) => x.kind === "activate-ability" && x.source === master);
    expect(offers.length).toBeGreaterThan(0);
  });

  it("Nightscape Familiar: a red spell costs {1} less", () => {
    const { game } = setUp(["Lightning Strike"]);
    lands(game, "Mountain", 1);
    const castable = () => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.cardName === "Lightning Strike");
    // {1}{R} on one Mountain: only with the Familiar's {1} off.
    expect(castable()).toBe(false);
    spawn(game, "Nightscape Familiar");
    expect(castable()).toBe(true);
  });

  it("Winds of Rath: an enchanted creature survives; the rest can't regenerate", () => {
    const { game } = setUp(["Winds of Rath"]);
    lands(game, "Plains", 5);
    const bears = spawn(game, "Grizzly Bears");
    const enchanted = spawn(game, "Craw Wurm");
    const aura = game.debugSpawn("Pacifism", B, "battlefield");
    game.state.objects[aura].attachedTo = enchanted;
    game.debugApplyEffect(A, { kind: "regenerate", target: 0 }, [{ kind: "object", object: bears }]);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Winds of Rath"), targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.objects[enchanted].zone).toBe("battlefield");
  });

  it("Artifact Mutation: Saprolings equal to the destroyed artifact's mana value", () => {
    const { game } = setUp(["Artifact Mutation"]);
    lands(game, "Mountain", 1);
    lands(game, "Forest", 1);
    const signet = spawn(game, "Commander's Sphere", B); // mana value 3
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Artifact Mutation"),
      targets: [{ kind: "object", object: signet }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[signet].zone).toBe("graveyard");
    const saprolings = named(game, "Saproling Token").reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(saprolings).toBe(3);
  });

  it("Swarmyard regenerates an Insect, Rat, Spider or Squirrel — nothing else", () => {
    const { game } = setUp();
    const yard = spawn(game, "Swarmyard");
    const bears = spawn(game, "Grizzly Bears");
    const offer = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === yard && x.abilityIndex === 1);
    const options = offer?.kind === "activate-ability" ? offer.targetOptions[0] : [];
    expect(options.some((r) => r.kind === "object" && r.object === bears)).toBe(false);
  });

  it("Golgari Charm's regenerate mode shields each creature you control", () => {
    const { game } = setUp(["Golgari Charm"]);
    lands(game, "Swamp", 1);
    lands(game, "Forest", 1);
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Golgari Charm"), modes: [2], targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].regenerationShields).toBe(1);
    expect(game.state.objects[theirs].regenerationShields).toBeUndefined();
  });
});
