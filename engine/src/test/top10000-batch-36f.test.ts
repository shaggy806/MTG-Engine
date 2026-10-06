/**
 * Top-10000 batch 36f. Pins the clauses most likely to be wired wrong:
 * Fangren Marauder seeing an opponent's artifact die, Always Watching
 * skipping tokens, Inevitable Defeat's life to the exiled permanent's
 * controller, Glimmerpost counting every Locus, Eusocial Engineering's
 * landfall Robot, Bladewing counting creature cards, Suki's once-a-turn
 * "during your turn" leave trigger, Marcus's draw-or-counter split,
 * Tombstone's Villain return and discount, Industrial Advancement's X from the sacrificed creature, Mass of
 * Mysteries' granted myriad, Dreamscape Artist's costs, and Candelabra's X
 * targets.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const setUp = (
  hand: readonly string[] = [],
  players: readonly PlayerId[] = [A, B],
): { game: Game; controllers: Record<string, ScriptedController> } => {
  const controllers: Record<string, ScriptedController> = {};
  for (const p of players) controllers[p] = new ScriptedController(p);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((p) => ({
      player: p,
      cards: p === A ? [...hand, ...Array<string>(40).fill("Wastes")] : Array<string>(40).fill("Wastes"),
    })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, controllers };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const obj = (object: ObjectId) => ({ kind: "object" as const, object });
const attack = (game: Game, attackers: readonly { attacker: ObjectId; defender: PlayerId }[]): void => {
  game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
  game.dispatch({ type: "declare-attackers", player: A, attackers });
  game.advanceUntil(quiet);
};

describe("top-10000 batch 36f — Fangren Marauder", () => {
  it("gains 5 when an opponent's artifact is put into a graveyard from the battlefield", () => {
    const { game, controllers } = setUp();
    controllers[A].chooseModesFn = () => [0];
    spawn(game, "Fangren Marauder");
    const ring = spawn(game, "Sol Ring", B);
    const before = life(game, A);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(ring)]);
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(before + 5);
  });
});

describe("top-10000 batch 36f — Always Watching", () => {
  it("pumps and grants vigilance to nontoken creatures you control only", () => {
    const { game } = setUp();
    spawn(game, "Always Watching");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "create-token", token: "Robot Token", count: 1 }, []);
    game.advanceUntil(quiet);
    const [robot] = named(game, "Robot Token");
    const theirs = spawn(game, "Grizzly Bears", B);
    expect(game.characteristics(bears).power).toBe(3);
    expect(game.characteristics(bears).keywords.has("vigilance")).toBe(true);
    expect(game.characteristics(robot).power).toBe(2);
    expect(game.characteristics(robot).keywords.has("vigilance")).toBe(false);
    expect(game.characteristics(theirs).power).toBe(2);
  });
});

describe("top-10000 batch 36f — Inevitable Defeat", () => {
  it("exiles the permanent; its controller loses 3 and you gain 3", () => {
    const { game } = setUp(["Inevitable Defeat"]);
    for (const land of ["Plains", "Swamp", "Mountain", "Mountain"]) spawn(game, land);
    const ring = spawn(game, "Sol Ring", B);
    const [lifeA, lifeB] = [life(game, A), life(game, B)];
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Inevitable Defeat"), targets: [obj(ring)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[ring].zone).toBe("exile");
    expect(life(game, B)).toBe(lifeB - 3);
    expect(life(game, A)).toBe(lifeA + 3);
  });
});

describe("top-10000 batch 36f — Glimmerpost", () => {
  it("gains 1 life for each Locus on the battlefield, an opponent's included", () => {
    const { game } = setUp();
    spawn(game, "Cloudpost", B);
    const before = life(game, A);
    game.debugSpawn("Glimmerpost", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(before + 2);
  });
});

describe("top-10000 batch 36f — Eusocial Engineering", () => {
  it("makes a 2/2 Robot whenever a land you control enters, not an opponent's", () => {
    const { game } = setUp();
    spawn(game, "Eusocial Engineering");
    game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    game.debugSpawn("Forest", B, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(named(game, "Robot Token")).toHaveLength(1);
  });
});

describe("top-10000 batch 36f — Bladewing, Deathless Tyrant", () => {
  it("combat damage to a player makes a Zombie Knight per creature card in your graveyard", () => {
    const { game } = setUp();
    const bladewing = spawn(game, "Bladewing, Deathless Tyrant");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Hill Giant", A, "graveyard");
    game.debugSpawn("Sol Ring", A, "graveyard");
    game.debugSpawn("Grizzly Bears", B, "graveyard");
    attack(game, [{ attacker: bladewing, defender: B }]);
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    game.advanceUntil(quiet);
    expect(named(game, "Zombie Knight Token")).toHaveLength(2);
  });
});

describe("top-10000 batch 36f — Suki, Courageous Rescuer", () => {
  it("pumps others, and makes one Ally a turn when another permanent you control leaves on your turn", () => {
    const { game } = setUp();
    const suki = spawn(game, "Suki, Courageous Rescuer");
    const bears = spawn(game, "Grizzly Bears");
    expect(game.characteristics(bears).power).toBe(3);
    expect(game.characteristics(suki).power).toBe(2);
    const ring = spawn(game, "Sol Ring");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(ring)]);
    game.advanceUntil(quiet);
    expect(named(game, "Ally Token")).toHaveLength(1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bears)]);
    game.advanceUntil(quiet);
    expect(named(game, "Ally Token")).toHaveLength(1);
  });

  it("doesn't trigger on an opponent's turn", () => {
    const { game } = setUp();
    spawn(game, "Suki, Courageous Rescuer");
    const ring = spawn(game, "Sol Ring");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(game.activePlayer).toBe(B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(ring)]);
    game.advanceUntil(quiet);
    expect(named(game, "Ally Token")).toHaveLength(0);
  });
});

describe("top-10000 batch 36f — Marcus, Mutant Mayor", () => {
  it("draws for a creature with a +1/+1 counter and puts a counter on one without", () => {
    const { game } = setUp();
    spawn(game, "Marcus, Mutant Mayor");
    const withCounter = spawn(game, "Grizzly Bears");
    const without = spawn(game, "Hill Giant");
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [obj(withCounter)]);
    const hand = game.handOf(A).length;
    attack(game, [
      { attacker: withCounter, defender: B },
      { attacker: without, defender: B },
    ]);
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand + 1);
    expect(counters(game, withCounter)).toBe(1);
    expect(counters(game, without)).toBe(1);
  });
});

describe("top-10000 batch 36f — Tombstone, Career Criminal", () => {
  it("returns target Villain card from your graveyard as it enters", () => {
    const { game } = setUp(["Tombstone, Career Criminal"]);
    for (let i = 0; i < 3; i += 1) spawn(game, "Swamp");
    const crook = game.debugSpawn("Common Crook", A, "graveyard");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Tombstone, Career Criminal") });
    game.advanceUntil(quiet);
    expect(named(game, "Tombstone, Career Criminal")).toHaveLength(1);
    expect(game.state.objects[crook].zone).toBe("hand");
  });

  it("Villain spells you cast cost {1} less", () => {
    const { game } = setUp(["Common Crook"]);
    spawn(game, "Tombstone, Career Criminal");
    spawn(game, "Swamp");
    // {1}{B} off one Swamp: castable only with the discount.
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Common Crook") });
    game.advanceUntil(quiet);
    expect(named(game, "Common Crook")).toHaveLength(1);
  });
});

describe("top-10000 batch 36f — Industrial Advancement", () => {
  it("looks at as many cards as the sacrificed creature's mana value", () => {
    const { game, controllers } = setUp();
    spawn(game, "Industrial Advancement");
    const giant = spawn(game, "Hill Giant"); // mana value 4
    // Top of library, top first: Wastes, Wastes, Wastes, Colossal Dreadmaw, Grizzly Bears.
    game.debugSpawn("Grizzly Bears", A, "library");
    game.debugSpawn("Colossal Dreadmaw", A, "library");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Wastes", A, "library");
    controllers[A].chooseModesFn = (_view, _min, _max, texts) => [texts.indexOf("Sacrifice a creature")];
    let offered: readonly string[] = [];
    controllers[A].chooseFromZoneFn = (_view, eligible) => {
      offered = eligible.map((id) => game.state.objects[id].cardName);
      return eligible.slice(0, 1);
    };
    game.advanceUntil((s) => s.turn.step === "cleanup");
    expect(game.state.objects[giant].zone).toBe("graveyard");
    expect(offered).toEqual(["Colossal Dreadmaw"]);
    expect(named(game, "Colossal Dreadmaw")).toHaveLength(1);
    expect(named(game, "Grizzly Bears")).toHaveLength(0);
  });
});

describe("top-10000 batch 36f — Mass of Mysteries", () => {
  it("gives another Elemental myriad: it attacks one opponent and a copy attacks the other", () => {
    const { game, controllers } = setUp([], [A, B, C]);
    controllers[A].chooseModesFn = () => [0];
    spawn(game, "Mass of Mysteries");
    const elemental = spawn(game, "Air Elemental");
    game.advanceUntil((s) => s.turn.step === "begin-combat");
    game.advanceUntil(quiet);
    attack(game, [{ attacker: elemental, defender: B }]);
    const copies = named(game, "Air Elemental").filter((id) => id !== elemental);
    expect(copies).toHaveLength(1);
    expect(game.state.objects[copies[0]].attacking).toBe(C);
  });
});

describe("top-10000 batch 36f — Dreamscape Artist", () => {
  it("discards, sacrifices a land and puts two basic lands onto the battlefield untapped", () => {
    const { game, controllers } = setUp(["Island", "Island"]);
    controllers[A].chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 2);
    const artist = spawn(game, "Dreamscape Artist");
    for (let i = 0; i < 3; i += 1) spawn(game, "Island");
    const fodder = spawn(game, "Plains");
    const handBefore = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: artist, abilityIndex: 0, sacrifice: fodder });
    game.advanceUntil(quiet);
    expect(game.state.objects[fodder].zone).toBe("graveyard");
    expect(game.handOf(A).length).toBe(handBefore - 1);
    expect(game.state.objects[artist].tapped).toBe(true);
    // Three Islands paid for it; the two fetched Wastes come in untapped.
    const untappedWastes = game.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Wastes" && !game.state.objects[id].tapped,
    );
    expect(untappedWastes).toHaveLength(2);
  });
});

describe("top-10000 batch 36f — Candelabra of Tawnos", () => {
  it("{X}, {T}: untaps exactly X target lands", () => {
    const { game } = setUp();
    const candelabra = spawn(game, "Candelabra of Tawnos");
    const [x, y] = [spawn(game, "Island"), spawn(game, "Island")];
    const [p, q] = [game.debugSpawn("Forest", A, "battlefield", { tapped: true }), game.debugSpawn("Forest", A, "battlefield", { tapped: true })];
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: candelabra,
      abilityIndex: 0,
      xValue: 2,
      targets: [obj(p), obj(q)],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[p].tapped).toBe(false);
    expect(game.state.objects[q].tapped).toBe(false);
    expect(game.state.objects[x].tapped).toBe(true);
    expect(game.state.objects[y].tapped).toBe(true);
  });
});
