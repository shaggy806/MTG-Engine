/**
 * Top-5000 batch 22 (part h). Pins the clause of each new card most likely to
 * be wired wrong: Skyhunter Strike Force's lieutenant-granted melee, Wakening
 * Sun's Avatar's "if you cast it from your hand", Extract from Darkness taking
 * an opponent's creature, Archenemy's Charm's "one or two" cards, Gathering
 * Stone's any-type discount and its look-then-graveyard, and Solar
 * Transformer's energy mana.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
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
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((unit) => unit.type).sort();
const obj = (object: ObjectId) => ({ kind: "object" as const, object });
const settle = (game: Game): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [0] });
    } else {
      game.advanceUntil(quiet);
    }
  }
  throw new Error("settle: still unresolved");
};

describe("top-5000 batch 22h — Skyhunter Strike Force", () => {
  it("without your commander, only it has melee", () => {
    const { game, a } = setUp();
    const force = spawn(game, "Skyhunter Strike Force");
    const giant = spawn(game, "Hill Giant");
    a.declareAttackersFn = () => [
      { attacker: force, defender: B },
      { attacker: giant, defender: B },
    ];
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(game.characteristics(force).power).toBe(3);
    expect(game.characteristics(giant).power).toBe(3);
  });

  it("with your commander out, the other attacker gets +1/+1 too", () => {
    const { game, a } = setUp();
    const force = spawn(game, "Skyhunter Strike Force");
    const giant = spawn(game, "Hill Giant");
    const commander = spawn(game, "Grizzly Bears");
    game.state.objects[commander].isCommander = true;
    a.declareAttackersFn = () => [
      { attacker: force, defender: B },
      { attacker: giant, defender: B },
    ];
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(game.characteristics(force).power).toBe(3);
    expect(game.characteristics(giant).power).toBe(4);
    expect(game.characteristics(giant).toughness).toBe(4);
  });
});

describe("top-5000 batch 22h — Wakening Sun's Avatar", () => {
  it("cast from hand, destroys every non-Dinosaur creature", () => {
    const { game } = setUp(["Wakening Sun's Avatar"], "Plains");
    lands(game, "Plains", 8);
    const bears = spawn(game, "Grizzly Bears", B);
    const mine = spawn(game, "Hill Giant");
    const dino = spawn(game, "Ancient Brontodon", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Wakening Sun's Avatar"), targets: [] });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, mine)).toBe("graveyard");
    expect(zone(game, dino)).toBe("battlefield");
    expect(game.battlefield.some((id) => game.state.objects[id].cardName === "Wakening Sun's Avatar")).toBe(true);
  });

  it("put onto the battlefield without casting it, does nothing", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugSpawn("Wakening Sun's Avatar", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, bears)).toBe("battlefield");
  });
});

describe("top-5000 batch 22h — Extract from Darkness", () => {
  it("mills each player two, then takes a creature card from an opponent's graveyard", () => {
    const { game } = setUp(["Extract from Darkness"], "Island");
    lands(game, "Island", 3);
    lands(game, "Swamp", 2);
    const giant = game.debugSpawn("Hill Giant", B, "graveyard");
    const libA = game.state.zones.perPlayer[A].library.length;
    const libB = game.state.zones.perPlayer[B].library.length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Extract from Darkness"), targets: [] });
    settle(game);
    expect(game.state.zones.perPlayer[A].library.length).toBe(libA - 2);
    expect(game.state.zones.perPlayer[B].library.length).toBe(libB - 2);
    expect(zone(game, giant)).toBe("battlefield");
    expect(game.state.objects[giant].controller).toBe(A);
  });
});

describe("top-5000 batch 22h — Archenemy's Charm", () => {
  it("returns two creature cards from your graveyard to hand", () => {
    const { game } = setUp(["Archenemy's Charm"], "Swamp");
    lands(game, "Swamp", 3);
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Archenemy's Charm"),
      modes: [1],
      targets: [obj(bears), obj(giant)],
    });
    settle(game);
    expect(zone(game, bears)).toBe("hand");
    expect(zone(game, giant)).toBe("hand");
  });

  it("puts two counters on your creature and gives it lifelink", () => {
    const { game } = setUp(["Archenemy's Charm"], "Swamp");
    lands(game, "Swamp", 3);
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Archenemy's Charm"),
      modes: [2],
      targets: [obj(bears)],
    });
    settle(game);
    expect(game.state.objects[bears].counters?.["+1/+1"]).toBe(2);
    expect(game.characteristics(bears).keywords.has("lifelink")).toBe(true);
  });
});

describe("top-5000 batch 22h — Gathering Stone", () => {
  it("takes {1} off a spell of the chosen type", () => {
    const { game } = setUp(["Imperious Perfect"], "Forest");
    lands(game, "Forest", 2);
    const perfect = inHand(game, "Imperious Perfect");
    const castable = (): boolean => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === perfect);
    expect(castable()).toBe(false);
    const stone = spawn(game, "Gathering Stone");
    game.state.objects[stone].chosenCreatureType = "Elf";
    expect(castable()).toBe(true);
  });

  it("puts a card of the chosen type into the hand", () => {
    const { game } = setUp();
    const stone = spawn(game, "Gathering Stone");
    game.state.objects[stone].chosenCreatureType = "Elf";
    const elves = game.debugSpawn("Llanowar Elves", A, "library");
    const upkeep = registry.get("Gathering Stone")!.triggered[1].effect!;
    game.debugApplyEffect(A, upkeep, [], { source: stone });
    settle(game);
    expect(zone(game, elves)).toBe("hand");
  });

  it("may put a card not of the chosen type into the graveyard", () => {
    const { game } = setUp();
    const stone = spawn(game, "Gathering Stone");
    game.state.objects[stone].chosenCreatureType = "Elf";
    const giant = game.debugSpawn("Hill Giant", A, "library");
    const upkeep = registry.get("Gathering Stone")!.triggered[1].effect!;
    game.debugApplyEffect(A, upkeep, [], { source: stone });
    settle(game);
    expect(zone(game, giant)).toBe("graveyard");
  });
});

describe("top-5000 batch 22h — Solar Transformer", () => {
  it("enters tapped with three energy, and pays one for a coloured mana", () => {
    const { game } = setUp();
    const transformer = game.debugSpawn("Solar Transformer", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.objects[transformer].tapped).toBe(true);
    expect(game.state.players[A].energy).toBe(3);
    game.state.objects[transformer].tapped = false;
    game.dispatch({ type: "activate-ability", player: A, source: transformer, abilityIndex: 1, manaColors: ["R"] });
    expect(pool(game)).toEqual(["R"]);
    expect(game.state.players[A].energy).toBe(2);
  });
});
