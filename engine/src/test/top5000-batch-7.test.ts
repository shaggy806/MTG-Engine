/**
 * Top-5000 batch 7 (ranks 1211–1356) and what it needed: unearth (Molten
 * Gatekeeper), "+1/+1 for each creature card in your graveyard" (Wight of
 * the Reliquary), Past in Flames' mass flashback — and a card's choice
 * between its own flashback and a granted one — "counter that spell" of a
 * cast trigger (Vexing Bauble), each opponent's graveyard exiled at once
 * (Soul-Guide Lantern), "if you control five other Mountains" (Valakut),
 * "that player controls more …" of the player whose turn it is (Keeper of
 * the Accord), a Human that deals damage to you destroyed (Mikaeus), "as
 * long as this Equipment is attached to a creature" (Conqueror's Flail),
 * damage to each creature one player controls (Balefire Dragon), a target
 * defending player controls (Kogla), a bite at a planeswalker (Stump
 * Stomp), "target player … loses half their life" read for that player
 * (Peer into the Abyss), and cycling as the discard it is (Archfiend of
 * Ifnir). One test per clause most likely to be wrong.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { whyCannotAttack } from "../combat/eligibility.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { activePlayerOf } from "../state.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const setUpScripted = (hand: readonly string[] = [], library = "Wastes", handB: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: [...handB, ...Array<string>(40).fill("Wastes")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const setUp = (hand: readonly string[] = [], library = "Wastes", handB: readonly string[] = []): Game =>
  setUpScripted(hand, library, handB).game;
/** Three players, alice first — for "that player" and "defending player". */
const setUp3 = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const c = new ScriptedController(C);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b, [C]: c },
    decks: [A, B, C].map((p) => ({ player: p, cards: Array<string>(40).fill("Plains") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b, c };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: true });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
/** How many tokens named `name` — a token stack counts as every token in it. */
const tokens = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
/** Move a card the way the engine does — to a graveyard, a hand, exile. */
const move = (game: Game, id: ObjectId, to: string): void => {
  (game as unknown as { moveObject(id: ObjectId, to: string): boolean }).moveObject(id, to);
};
/** Answer every `choose-targets` with the given slots, and every "you may"
 * with its first option, until nothing is left to resolve. */
const settle = (game: Game, targets?: readonly (ObjectId | null)[]): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting?.kind === "choose-targets" || s.awaiting?.kind === "choose-modes");
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-targets" && targets !== undefined) {
      game.dispatch({
        type: "choose-targets",
        player: awaiting.player,
        targets: targets.map((t) => (t === null ? null : { kind: "object", object: t })),
      });
    } else if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [0] });
    } else {
      return;
    }
  }
  throw new Error("settle: still unresolved");
};
/** B gets priority on A's turn (A passes with nothing on the stack). */
const toB = (game: Game): void => {
  game.dispatch({ type: "pass-priority", player: A });
  game.advanceUntil((s) => s.priority.holder === B);
};
const castable = (game: Game, p: PlayerId, card: ObjectId): boolean =>
  game.legalActions(p).some((x) => x.kind === "cast-spell" && x.card === card);

describe("top-5000 batch 7 — unearth (Molten Gatekeeper)", () => {
  it("returns it with haste, and exiles it at the beginning of the next end step", () => {
    const game = setUp();
    const keeper = game.debugSpawn("Molten Gatekeeper", A, "graveyard");
    lands(game, "Mountain", 1);
    game.dispatch({ type: "activate-ability", player: A, source: keeper, abilityIndex: 0, targets: [] });
    settle(game);
    expect(zone(game, keeper)).toBe("battlefield");
    expect(game.characteristics(keeper).keywords.has("haste")).toBe(true);
    game.advanceUntil((s) => s.turn.step === "end" && quiet(s));
    expect(zone(game, keeper)).toBe("exile");
  });

  it("is exiled instead if it would leave the battlefield", () => {
    const game = setUp(["Murder"], "Swamp");
    const keeper = game.debugSpawn("Molten Gatekeeper", A, "graveyard");
    lands(game, "Mountain", 1);
    lands(game, "Swamp", 3);
    game.dispatch({ type: "activate-ability", player: A, source: keeper, abilityIndex: 0, targets: [] });
    settle(game);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Murder"), targets: [obj(keeper)] });
    settle(game);
    expect(zone(game, keeper)).toBe("exile");
  });

  it("does nothing if the card left the graveyard in response — and its end-step exile doesn't follow it", () => {
    const game = setUp();
    const keeper = game.debugSpawn("Molten Gatekeeper", A, "graveyard");
    lands(game, "Mountain", 1);
    game.dispatch({ type: "activate-ability", player: A, source: keeper, abilityIndex: 0, targets: [] });
    move(game, keeper, "hand");
    settle(game);
    expect(zone(game, keeper)).toBe("hand");
    game.advanceUntil((s) => s.turn.step === "cleanup" || (s.turn.step === "end" && quiet(s)));
    expect(zone(game, keeper)).toBe("hand");
  });

  it("only as a sorcery", () => {
    const game = setUp();
    const keeper = game.debugSpawn("Molten Gatekeeper", A, "graveyard");
    lands(game, "Mountain", 1);
    const unearthable = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === keeper);
    expect(unearthable()).toBe(true);
    game.advanceUntil((s) => s.turn.step === "begin-combat" && s.priority.holder === A);
    expect(unearthable()).toBe(false);
  });

  it("its other creatures entering deal 1 damage to each opponent", () => {
    const game = setUp();
    spawn(game, "Molten Gatekeeper");
    enter(game, "Grizzly Bears");
    settle(game);
    expect(life(game, B)).toBe(19);
  });
});

describe("top-5000 batch 7 — the engine pieces", () => {
  it("Wight of the Reliquary counts creature cards in its controller's graveyard only", () => {
    const game = setUp();
    const wight = spawn(game, "Wight of the Reliquary");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Craw Wurm", A, "graveyard");
    game.debugSpawn("Lightning Bolt", A, "graveyard");
    game.debugSpawn("Grizzly Bears", B, "graveyard");
    expect([game.characteristics(wight).power, game.characteristics(wight).toughness]).toEqual([4, 4]);
  });

  it("Valakut needs five Mountains besides the one entering", () => {
    const game = setUp();
    const valakut = spawn(game, "Valakut, the Molten Pinnacle");
    lands(game, "Mountain", 4);
    enter(game, "Mountain");
    settle(game, [null]);
    // Four others: no trigger at all.
    expect(game.eventsOfType("ability-triggered").some((e) => e.source === valakut)).toBe(false);
    enter(game, "Mountain");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || quiet(s));
    expect(game.state.awaiting?.kind).toBe("choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [player(B)] });
    settle(game);
    expect(life(game, B)).toBe(17);
  });

  it("Past in Flames gives the instants and sorceries in your graveyard flashback for their mana cost", () => {
    const game = setUp(["Past in Flames"], "Mountain");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    const theirs = game.debugSpawn("Lightning Bolt", B, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    lands(game, "Mountain", 5);
    expect(castable(game, A, bolt)).toBe(false);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Past in Flames"), targets: [] });
    settle(game);
    expect(castable(game, A, bolt)).toBe(true);
    expect(castable(game, A, bears)).toBe(false);
    expect(castable(game, B, theirs)).toBe(false);
    game.dispatch({ type: "cast-spell", player: A, card: bolt, targets: [player(B)], via: "flashback" });
    settle(game);
    expect(life(game, B)).toBe(17);
    expect(zone(game, bolt)).toBe("exile");
  });

  it("Past in Flames: only the cards there as it resolves, until end of turn", () => {
    const game = setUp(["Past in Flames", "Lightning Bolt"], "Mountain");
    lands(game, "Mountain", 5);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Past in Flames"), targets: [] });
    settle(game);
    const bolt = inHand(game, "Lightning Bolt");
    game.dispatch({ type: "cast-spell", player: A, card: bolt, targets: [player(B)] });
    settle(game);
    expect(zone(game, bolt)).toBe("graveyard");
    expect(castable(game, A, bolt)).toBe(false);
  });

  it("a card with its own flashback may use either: the printed one or the mana cost Past in Flames gave it", () => {
    const game = setUp(["Past in Flames"], "Island");
    const analysis = game.debugSpawn("Deep Analysis", A, "graveyard");
    lands(game, "Mountain", 4);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Past in Flames"), targets: [] });
    settle(game);
    const ways = game
      .legalActions(A)
      .filter((x) => x.kind === "cast-spell" && x.card === analysis && x.via === "flashback");
    // No blue yet, so neither is affordable; give it four Islands.
    expect(ways).toHaveLength(0);
    lands(game, "Island", 4);
    const offered = game
      .legalActions(A)
      .filter((x) => x.kind === "cast-spell" && x.card === analysis && x.via === "flashback");
    const pif = game.state.zones.shared.exile.concat(game.graveyardOf(A)).find(
      (id) => game.state.objects[id].cardName === "Past in Flames",
    )!;
    // One per flashback, each naming its own: the card's, and Past in Flames'.
    expect(
      offered.map((x) => (x.kind === "cast-spell" ? x.graveyardGrant?.source : undefined)).sort(),
    ).toEqual([analysis, pif].sort());
    // Past in Flames' {3}{U}: no life paid.
    const hand = game.handOf(A).length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: analysis,
      targets: [player(A)],
      via: "flashback",
      graveyardGrant: { source: pif },
    });
    settle(game);
    expect(life(game, A)).toBe(20);
    expect(game.handOf(A).length).toBe(hand + 2);
    expect(zone(game, analysis)).toBe("exile");
  });

  it("…and its own printed flashback still costs its life", () => {
    const game = setUp(["Past in Flames"], "Island");
    const analysis = game.debugSpawn("Deep Analysis", A, "graveyard");
    lands(game, "Mountain", 4);
    lands(game, "Island", 2);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Past in Flames"), targets: [] });
    settle(game);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: analysis,
      targets: [player(A)],
      via: "flashback",
      graveyardGrant: { source: analysis },
    });
    settle(game);
    expect(life(game, A)).toBe(17);
  });

  it("Vexing Bauble counters a spell no mana was spent on, not one with mana spent", () => {
    const game = setUp(["Ornithopter", "Grizzly Bears"], "Forest");
    spawn(game, "Vexing Bauble", B);
    lands(game, "Forest", 2);
    const thopter = inHand(game, "Ornithopter");
    game.dispatch({ type: "cast-spell", player: A, card: thopter, targets: [] });
    settle(game);
    expect(zone(game, thopter)).toBe("graveyard");
    const bears = inHand(game, "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] });
    settle(game);
    expect(zone(game, bears)).toBe("battlefield");
  });

  it("Soul-Guide Lantern exiles each opponent's graveyard, not yours", () => {
    const { game } = setUp3();
    const lantern = spawn(game, "Soul-Guide Lantern");
    const mine = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const bobs = game.debugSpawn("Grizzly Bears", B, "graveyard");
    const carols = game.debugSpawn("Lightning Bolt", C, "graveyard");
    game.dispatch({ type: "activate-ability", player: A, source: lantern, abilityIndex: 0, targets: [] });
    settle(game);
    expect(zone(game, mine)).toBe("graveyard");
    expect(zone(game, bobs)).toBe("exile");
    expect(zone(game, carols)).toBe("exile");
  });

  it("Keeper of the Accord asks about the player whose end step it is, not any opponent", () => {
    const { game } = setUp3();
    spawn(game, "Keeper of the Accord");
    // Carol has more creatures than alice; bob doesn't.
    spawn(game, "Grizzly Bears", C);
    spawn(game, "Grizzly Bears", C);
    // Past bob's end step…
    game.advanceUntil((s) => activePlayerOf(s) === C && s.priority.holder === C);
    expect(tokens(game, "Soldier Token")).toBe(0);
    // …and past carol's.
    game.advanceUntil((s) => activePlayerOf(s) === A && s.priority.holder === A);
    expect(tokens(game, "Soldier Token")).toBe(1);
  });

  it("Conqueror's Flail stops opponents' spells on your turn only while it's attached to a creature", () => {
    const game = setUp([], "Wastes", ["Lightning Bolt", "Lightning Bolt"]);
    const flail = spawn(game, "Conqueror's Flail");
    const bears = spawn(game, "Grizzly Bears");
    lands(game, "Mountain", 2, B);
    toB(game);
    expect(castable(game, B, inHand(game, "Lightning Bolt", B))).toBe(true);
    game.state.objects[flail].attachedTo = bears;
    expect(castable(game, B, inHand(game, "Lightning Bolt", B))).toBe(false);
    // Green alone (lands and the Flail have no colour): +1/+1. Then white
    // and red: +3/+3.
    expect(game.characteristics(bears).power).toBe(3);
    spawn(game, "Savannah Lions");
    spawn(game, "Raging Goblin");
    spawn(game, "Llanowar Elves");
    expect(game.characteristics(bears).power).toBe(5);
    game.advanceUntil((s) => activePlayerOf(s) === B && s.priority.holder === B);
    expect(castable(game, B, inHand(game, "Lightning Bolt", B))).toBe(true);
  });

  it("Balefire Dragon deals the combat damage again to each creature that player controls", () => {
    const { game, a } = setUpScripted();
    const dragon = spawn(game, "Balefire Dragon");
    const mine = spawn(game, "Craw Wurm");
    const theirs = spawn(game, "Craw Wurm", B);
    a.declareAttackersFn = () => [{ attacker: dragon, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(14);
    expect(zone(game, theirs)).toBe("graveyard");
    expect(zone(game, mine)).toBe("battlefield");
    expect(game.state.objects[mine].damageMarked).toBe(0);
  });

  it("Kogla's attack destroys an artifact or enchantment of the defending player only", () => {
    const { game, a } = setUp3();
    const kogla = spawn(game, "Kogla, the Titan Ape");
    // Two of bob's, so the target is a real choice.
    const bobs = spawn(game, "Sol Ring", B);
    const bobsToo = spawn(game, "Waste Not", B);
    const carols = spawn(game, "Sol Ring", C);
    a.declareAttackersFn = () => [{ attacker: kogla, defender: B }];
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || s.turn.step === "declare-blockers");
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-targets");
    if (awaiting?.kind !== "choose-targets") return;
    const options = awaiting.options[0] ?? [];
    const ids = options.flatMap((t) => (t.kind === "object" ? [t.object] : []));
    expect(ids).toContain(bobs);
    expect(ids).toContain(bobsToo);
    expect(ids).not.toContain(carols);
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(bobs)] });
    settle(game);
    expect(zone(game, bobs)).toBe("graveyard");
    expect(zone(game, carols)).toBe("battlefield");
  });

  it("Stump Stomp's creature deals damage equal to its power to a planeswalker", () => {
    const game = setUp(["Stump Stomp"], "Forest");
    const wurm = spawn(game, "Craw Wurm");
    const garruk = spawn(game, "Garruk Wildspeaker", B);
    lands(game, "Forest", 2);
    expect(game.state.objects[garruk].counters.loyalty).toBe(3);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Stump Stomp"), targets: [obj(wurm), obj(garruk)] });
    settle(game);
    expect(zone(game, garruk)).toBe("graveyard");
    expect(game.state.objects[wurm].damageMarked).toBe(0);
  });

  it("Peer into the Abyss: target player draws half their library and loses half their life, each rounded up", () => {
    const game = setUp(["Peer into the Abyss"], "Swamp");
    lands(game, "Swamp", 7);
    game.state.players[B].life = 15;
    const library = game.libraryOf(B).length;
    const hand = game.handOf(B).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Peer into the Abyss"), targets: [player(B)] });
    settle(game);
    expect(game.handOf(B).length).toBe(hand + Math.ceil(library / 2));
    // Half of bob's 15, rounded up — not half of alice's 20.
    expect(life(game, B)).toBe(7);
    expect(life(game, A)).toBe(20);
  });

  it("cycling is a discard: Archfiend of Ifnir puts -1/-1 counters on the opponents' creatures", () => {
    const game = setUp(["Sandbar Serpent"], "Island");
    spawn(game, "Archfiend of Ifnir");
    const theirs = spawn(game, "Grizzly Bears", B);
    const mine = spawn(game, "Llanowar Elves");
    lands(game, "Island", 2);
    game.dispatch({ type: "cycle", player: A, card: inHand(game, "Sandbar Serpent") });
    settle(game);
    expect(game.state.objects[theirs].counters["-1/-1"]).toBe(1);
    expect(game.state.objects[mine].counters["-1/-1"] ?? 0).toBe(0);
  });

  it("…and an opponent's cycled creature card feeds Waste Not", () => {
    const game = setUp([], "Wastes", ["Sandbar Serpent"]);
    spawn(game, "Waste Not");
    lands(game, "Island", 2, B);
    toB(game);
    game.dispatch({ type: "cycle", player: B, card: inHand(game, "Sandbar Serpent", B) });
    settle(game);
    expect(tokens(game, "Zombie Token")).toBe(1);
  });
});

const registry = createDefaultRegistry();

describe("top-5000 batch 7 — the cards", () => {
  it("Exemplar of Light: each life gain a counter, the draw only once a turn", () => {
    const game = setUp();
    const exemplar = spawn(game, "Exemplar of Light");
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "gain-life", amount: 2 });
    settle(game);
    game.debugApplyEffect(A, { kind: "gain-life", amount: 2 });
    settle(game);
    expect(game.state.objects[exemplar].counters["+1/+1"]).toBe(2);
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  it("Exemplar of Light: counters an opponent puts on it draw nothing", () => {
    const game = setUp();
    const exemplar = spawn(game, "Exemplar of Light");
    const hand = game.handOf(A).length;
    game.debugApplyEffect(B, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [obj(exemplar)]);
    settle(game);
    expect(game.handOf(A).length).toBe(hand);
  });

  it("Archon of Sun's Grace makes a 2/2 flying Pegasus that has lifelink", () => {
    const game = setUp();
    spawn(game, "Archon of Sun's Grace");
    enter(game, "Waste Not");
    settle(game);
    const [pegasus] = named(game, "2/2 Pegasus Token");
    expect(pegasus).toBeDefined();
    const c = game.characteristics(pegasus);
    expect([c.power, c.toughness]).toEqual([2, 2]);
    expect(c.keywords.has("flying") && c.keywords.has("lifelink")).toBe(true);
  });

  it("Glaring Fleshraker: a Spawn for a colorless spell, 1 damage for another colorless creature", () => {
    const game = setUp(["Ornithopter", "Grizzly Bears"], "Forest");
    spawn(game, "Glaring Fleshraker");
    lands(game, "Forest", 2);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Ornithopter"), targets: [] });
    settle(game);
    // The Spawn is colorless too, so it deals 1 as well as the Ornithopter.
    expect(tokens(game, "Eldrazi Spawn Token")).toBe(1);
    expect(life(game, B)).toBe(18);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears"), targets: [] });
    settle(game);
    expect(tokens(game, "Eldrazi Spawn Token")).toBe(1);
    expect(life(game, B)).toBe(18);
  });

  it("Sterling Grove: your other enchantments have shroud; it tutors an enchantment to the top", () => {
    const game = setUp();
    const grove = spawn(game, "Sterling Grove");
    const waste = spawn(game, "Waste Not");
    expect(game.characteristics(waste).keywords.has("shroud")).toBe(true);
    expect(game.characteristics(grove).keywords.has("shroud")).toBe(false);
    const pacifism = game.debugSpawn("Pacifism", A, "library");
    // Bury it under the Wastes: the search has to find it.
    const library = game.state.zones.perPlayer[A].library;
    library.splice(library.indexOf(pacifism), 1);
    library.push(pacifism);
    lands(game, "Wastes", 1);
    game.dispatch({ type: "activate-ability", player: A, source: grove, abilityIndex: 0, targets: [] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || quiet(s));
    const search = game.state.awaiting;
    expect(search?.kind).toBe("choose-from-zone");
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [pacifism] });
    settle(game);
    expect(game.libraryOf(A)[0]).toBe(pacifism);
  });

  it("Kogla fights up to one creature on entering, and bounces a Human to gain indestructible", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const kogla = enter(game, "Kogla, the Titan Ape");
    settle(game, [bears]);
    expect(zone(game, bears)).toBe("graveyard");
    expect(game.state.objects[kogla].damageMarked).toBe(2);
    const human = spawn(game, "Elite Vanguard");
    lands(game, "Forest", 2);
    game.dispatch({ type: "activate-ability", player: A, source: kogla, abilityIndex: 0, targets: [obj(human)] });
    settle(game);
    expect(zone(game, human)).toBe("hand");
    expect(game.characteristics(kogla).keywords.has("indestructible")).toBe(true);
  });

  it("Shrine of the Forsaken Gods: {C}{C} only with seven lands, and only for colorless spells", () => {
    const game = setUp();
    const shrine = spawn(game, "Shrine of the Forsaken Gods");
    const twoOffered = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === shrine && x.abilityIndex === 1);
    lands(game, "Wastes", 5);
    expect(twoOffered()).toBe(false);
    lands(game, "Wastes", 1);
    expect(twoOffered()).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: shrine, abilityIndex: 1, targets: [] });
    const units = game.state.players[A].manaPool;
    expect(units).toHaveLength(2);
    expect(units.every((u) => u.restriction?.spell?.colorless === true)).toBe(true);
  });

  it("Dark Confidant puts the top card into your hand and costs its mana value in life", () => {
    const game = setUp();
    spawn(game, "Dark Confidant");
    game.advanceUntil((s) => activePlayerOf(s) === B && s.priority.holder === B);
    const wurm = game.debugSpawn("Craw Wurm", A, "library");
    game.advanceUntil((s) => activePlayerOf(s) === A && s.turn.step === "draw");
    settle(game);
    expect(zone(game, wurm)).toBe("hand");
    expect(life(game, A)).toBe(14);
  });

  it("Bane of Progress counts only what was destroyed — not an indestructible artifact", () => {
    const game = setUp();
    spawn(game, "Sol Ring");
    spawn(game, "Waste Not", B);
    const relic = spawn(game, "Darksteel Relic", B);
    const bane = enter(game, "Bane of Progress");
    settle(game);
    expect(zone(game, relic)).toBe("battlefield");
    expect(game.state.objects[bane].counters["+1/+1"]).toBe(2);
  });

  it("Waste Not: a Zombie, {B}{B} and a card for an opponent's discarded creature, land and other card", () => {
    const game = setUp([], "Wastes", ["Grizzly Bears", "Forest", "Lightning Bolt"]);
    spawn(game, "Waste Not");
    const hand = game.handOf(A).length;
    // Keep bob's hand to exactly those three.
    for (const id of game.handOf(B).filter((id) => game.state.objects[id].cardName === "Wastes")) move(game, id, "library");
    game.debugApplyEffect(A, { kind: "discard-hand", who: "each-opponent" });
    // The mana is added as its trigger resolves; watch for it.
    let pooled = 0;
    game.advanceUntil((s) => {
      pooled = Math.max(pooled, s.players[A].manaPool.filter((u) => u.type === "B").length);
      return quiet(s);
    });
    expect(tokens(game, "Zombie Token")).toBe(1);
    expect(pooled).toBe(2);
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  it("Topiary Stomper fetches a basic tapped, and can't attack until you control seven lands", () => {
    const game = setUp([], "Forest");
    const stomper = enter(game, "Topiary Stomper");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || quiet(s));
    if (game.state.awaiting?.kind === "choose-from-zone") {
      game.dispatch({ type: "choose-from-zone", player: A, chosen: game.state.awaiting.eligible.slice(0, 1) });
    }
    settle(game);
    const forests = named(game, "Forest");
    expect(forests).toHaveLength(1);
    expect(game.state.objects[forests[0]].tapped).toBe(true);
    expect(whyCannotAttack(game.state, registry, A, stomper, B)).not.toBeNull();
    lands(game, "Forest", 6);
    expect(whyCannotAttack(game.state, registry, A, stomper, B)).toBeNull();
  });

  it("Summon: Bahamut's Mega Flare deals the total mana value of your other permanents to each opponent", () => {
    const game = setUp();
    const bahamut = spawn(game, "Summon: Bahamut");
    // Chapter I, from the lore counter it entered with: destroy nothing.
    settle(game, [null]);
    spawn(game, "Craw Wurm"); // 6
    spawn(game, "Sol Ring"); // 1
    spawn(game, "Grizzly Bears", B); // not yours
    game.state.objects[bahamut].counters.lore = 3;
    game.advanceUntil((s) => activePlayerOf(s) === A && s.turn.number === 3 && s.priority.holder === A && s.turn.step === "precombat-main");
    settle(game);
    expect(life(game, B)).toBe(13);
    expect(zone(game, bahamut)).toBe("graveyard");
  });

  it("Saryth: other tapped creatures you control have deathtouch, untapped ones hexproof", () => {
    const game = setUp();
    const saryth = spawn(game, "Saryth, the Viper's Fang");
    const tapped = spawn(game, "Grizzly Bears");
    const untapped = spawn(game, "Grizzly Bears");
    game.state.objects[tapped].tapped = true;
    expect(game.characteristics(tapped).keywords.has("deathtouch")).toBe(true);
    expect(game.characteristics(tapped).keywords.has("hexproof")).toBe(false);
    expect(game.characteristics(untapped).keywords.has("hexproof")).toBe(true);
    expect(game.characteristics(saryth).keywords.has("hexproof")).toBe(false);
  });

  it("Sheltered by Ghosts exiles until it leaves, and gives +1/+0, lifelink and ward {2}", () => {
    const game = setUp(["Sheltered by Ghosts", "Murder"], "Plains");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Sol Ring", B);
    lands(game, "Plains", 2);
    lands(game, "Swamp", 3);
    const aura = inHand(game, "Sheltered by Ghosts");
    game.dispatch({ type: "cast-spell", player: A, card: aura, targets: [obj(bears)] });
    settle(game, [theirs]);
    expect(zone(game, theirs)).toBe("exile");
    const c = game.characteristics(bears);
    expect(c.power).toBe(3);
    expect(c.keywords.has("lifelink")).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Murder"), targets: [obj(bears)] });
    settle(game);
    expect(zone(game, aura)).toBe("graveyard");
    expect(zone(game, theirs)).toBe("battlefield");
  });

  it("Sphere Grid grows a creature that connects, which then has reach and trample", () => {
    const { game, a } = setUpScripted();
    spawn(game, "Sphere Grid");
    const bears = spawn(game, "Grizzly Bears");
    expect(game.characteristics(bears).keywords.has("trample")).toBe(false);
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(1);
    const c = game.characteristics(bears);
    expect(c.keywords.has("trample") && c.keywords.has("reach")).toBe(true);
  });

  it("Mahadi makes a Treasure for each creature that died this turn, anyone's", () => {
    const game = setUp();
    spawn(game, "Mahadi, Emporium Master");
    move(game, spawn(game, "Grizzly Bears"), "graveyard");
    move(game, spawn(game, "Grizzly Bears", B), "graveyard");
    game.advanceUntil((s) => s.turn.step === "end" && quiet(s));
    expect(tokens(game, "Treasure Token")).toBe(2);
  });

  it("Enter the Enigma: unblockable this turn, and a card", () => {
    const game = setUp(["Enter the Enigma"], "Island");
    const bears = spawn(game, "Grizzly Bears");
    lands(game, "Island", 1);
    const hand = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Enter the Enigma"), targets: [obj(bears)] });
    settle(game);
    expect(game.characteristics(bears).keywords.has("unblockable")).toBe(true);
    expect(game.handOf(A).length).toBe(hand);
  });

  it("Duelist's Heritage can give an opponent's attacker double strike too", () => {
    const { game, b } = setUpScripted();
    spawn(game, "Duelist's Heritage");
    const theirs = spawn(game, "Grizzly Bears", B);
    b.declareAttackersFn = () => [{ attacker: theirs, defender: A }];
    // Intercept the "you may" before alice's controller answers it.
    game.advanceUntil(
      (s) =>
        activePlayerOf(s) === B &&
        (s.awaiting?.kind === "choose-targets" || s.awaiting?.kind === "choose-modes" || s.turn.step === "declare-blockers"),
    );
    settle(game, [theirs]);
    game.advanceUntil((s) => activePlayerOf(s) === B && s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, A)).toBe(16);
  });

  it("Windcrag Siege — Mardu makes an attack trigger trigger twice", () => {
    const { game, a } = setUpScripted([], "Mountain");
    const siege = spawn(game, "Windcrag Siege");
    game.state.objects[siege].chosenOnEnter = "Mardu";
    const laelia = spawn(game, "Laelia, the Blade Reforged");
    a.declareAttackersFn = () => [{ attacker: laelia, defender: B }];
    game.advanceUntil((s) => s.turn.step === "declare-blockers" && quiet(s));
    // Two exiles from the library, each a separate move: +2.
    expect(game.state.zones.shared.exile.filter((id) => game.state.objects[id].owner === A)).toHaveLength(2);
    expect(game.state.objects[laelia].counters["+1/+1"]).toBe(2);
  });

  it("Windcrag Siege — Jeskai makes a Goblin with lifelink and haste until end of turn", () => {
    const game = setUp();
    const siege = spawn(game, "Windcrag Siege");
    game.state.objects[siege].chosenOnEnter = "Jeskai";
    game.advanceUntil((s) => activePlayerOf(s) === A && s.turn.number === 3 && s.turn.step === "draw");
    const [goblin] = named(game, "Goblin Token");
    expect(goblin).toBeDefined();
    const c = game.characteristics(goblin);
    expect(c.keywords.has("lifelink") && c.keywords.has("haste")).toBe(true);
    game.advanceUntil((s) => activePlayerOf(s) === B);
    expect(game.characteristics(goblin).keywords.has("haste")).toBe(false);
  });

  it("Kambal drains the caster of a noncreature spell, not a creature spell", () => {
    const game = setUp([], "Wastes", ["Lightning Bolt", "Llanowar Elves"]);
    spawn(game, "Kambal, Consul of Allocation");
    lands(game, "Mountain", 1, B);
    lands(game, "Forest", 1, B);
    toB(game);
    game.dispatch({ type: "cast-spell", player: B, card: inHand(game, "Lightning Bolt", B), targets: [player(A)] });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(20 + 2 - 3);
    game.advanceUntil((s) => activePlayerOf(s) === B && s.priority.holder === B && s.turn.step === "precombat-main");
    game.dispatch({ type: "cast-spell", player: B, card: inHand(game, "Llanowar Elves", B), targets: [] });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(18);
  });

  it("Guildless Commons returns a land you choose, and taps for {C}{C}", () => {
    const game = setUp();
    const forest = spawn(game, "Forest");
    const commons = enter(game, "Guildless Commons");
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-permanents");
    if (awaiting?.kind !== "choose-permanents") return;
    game.dispatch({ type: "choose-permanents", player: A, permanents: [forest] });
    settle(game);
    expect(zone(game, forest)).toBe("hand");
    expect(zone(game, commons)).toBe("battlefield");
  });

  it("Courser of Kruphix: play a land from the top of your library, gaining 1 for it", () => {
    const game = setUp([], "Wastes");
    spawn(game, "Courser of Kruphix");
    const forest = game.debugSpawn("Forest", A, "library");
    expect(game.legalActions(A).some((x) => x.kind === "play-land" && x.card === forest)).toBe(true);
    game.dispatch({ type: "play-land", player: A, card: forest });
    settle(game);
    expect(zone(game, forest)).toBe("battlefield");
    expect(life(game, A)).toBe(21);
  });

  it("Undying Malice returns the creature tapped with a +1/+1 counter", () => {
    const game = setUp(["Undying Malice", "Murder"], "Swamp");
    const bears = spawn(game, "Grizzly Bears");
    lands(game, "Swamp", 4);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Undying Malice"), targets: [obj(bears)] });
    settle(game);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Murder"), targets: [obj(bears)] });
    settle(game);
    const [back] = named(game, "Grizzly Bears");
    expect(back).toBeDefined();
    expect(game.state.objects[back].tapped).toBe(true);
    expect(game.state.objects[back].counters["+1/+1"]).toBe(1);
  });

  it("Mikaeus destroys a Human that damages you, not one that damages an opponent", () => {
    const game = setUp();
    spawn(game, "Mikaeus, the Unhallowed");
    const theirs = spawn(game, "Elite Vanguard", B);
    const mine = spawn(game, "Elite Vanguard");
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(B, { kind: "damage", amount: 1, target: 0 }, [player(A)], { source: bears });
    settle(game);
    expect(zone(game, bears)).toBe("battlefield");
    game.debugApplyEffect(A, { kind: "damage", amount: 1, target: 0 }, [player(B)], { source: mine });
    settle(game);
    expect(zone(game, mine)).toBe("battlefield");
    game.debugApplyEffect(B, { kind: "damage", amount: 1, target: 0 }, [player(A)], { source: theirs });
    settle(game);
    expect(zone(game, theirs)).toBe("graveyard");
  });

  it("Mikaeus: other non-Humans get +1/+1 and undying — even dying alongside him", () => {
    const game = setUp(["Wrath of God"], "Plains");
    spawn(game, "Mikaeus, the Unhallowed");
    const bears = spawn(game, "Grizzly Bears");
    const human = spawn(game, "Elite Vanguard");
    expect(game.characteristics(bears).power).toBe(3);
    expect(game.characteristics(human).power).toBe(2);
    lands(game, "Plains", 4);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Wrath of God"), targets: [] });
    settle(game);
    const [back] = named(game, "Grizzly Bears");
    expect(back).toBeDefined();
    expect(game.state.objects[back].counters["+1/+1"]).toBe(1);
    expect(named(game, "Elite Vanguard")).toHaveLength(0);
  });

  it("Astral Cornucopia enters with X charge counters and taps for that much of one colour", () => {
    const game = setUp(["Astral Cornucopia"], "Wastes");
    lands(game, "Wastes", 6);
    const horn = inHand(game, "Astral Cornucopia");
    game.dispatch({ type: "cast-spell", player: A, card: horn, targets: [], xValue: 2 });
    settle(game);
    expect(game.state.objects[horn].counters.charge).toBe(2);
    const outputs = game
      .legalActions(A)
      .flatMap((x) => (x.kind === "activate-ability" && x.source === horn ? [x.manaColors ?? []] : []));
    expect(outputs).toHaveLength(5);
    expect(outputs.every((m) => m.length === 2 && m[0] === m[1])).toBe(true);
  });

  it("Uthros: with twelve charge counters, {U} for each artifact you control", () => {
    const game = setUp();
    const uthros = spawn(game, "Uthros, Titanic Godcore");
    game.state.objects[uthros].tapped = false;
    lands(game, "Island", 1);
    spawn(game, "Sol Ring");
    spawn(game, "Mind Stone");
    spawn(game, "Ornithopter");
    const offered = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === uthros && x.abilityIndex > 1);
    expect(offered()).toBe(false);
    game.state.objects[uthros].counters.charge = 12;
    expect(offered()).toBe(true);
    const index = game.legalActions(A).find((x) => x.kind === "activate-ability" && x.source === uthros && x.abilityIndex > 1)!;
    if (index.kind !== "activate-ability") return;
    game.dispatch({ type: "activate-ability", player: A, source: uthros, abilityIndex: index.abilityIndex, targets: [] });
    expect(game.state.players[A].manaPool.filter((u) => u.type === "U")).toHaveLength(3);
  });

  it("Laelia exiles her controller's top card as she attacks — and grows for it", () => {
    const { game, a } = setUpScripted([], "Mountain");
    const laelia = spawn(game, "Laelia, the Blade Reforged");
    a.declareAttackersFn = () => [{ attacker: laelia, defender: B }];
    game.advanceUntil((s) => s.turn.step === "declare-blockers" && quiet(s));
    const exiled = game.state.zones.shared.exile.filter((id) => game.state.objects[id].owner === A);
    expect(exiled).toHaveLength(1);
    expect(game.state.objects[laelia].counters["+1/+1"]).toBe(1);
    // A graveyard exile of hers counts too — one move, one counter.
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(B, { kind: "exile-graveyard", target: "each-opponent" });
    settle(game);
    expect(game.state.objects[laelia].counters["+1/+1"]).toBe(2);
  });

  it("Jukai Naturalist: an enchantment spell costs {1} less", () => {
    const game = setUp(["Pacifism"], "Plains");
    spawn(game, "Jukai Naturalist");
    const target = spawn(game, "Grizzly Bears", B);
    lands(game, "Plains", 1);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Pacifism"), targets: [obj(target)] });
    settle(game);
    expect(named(game, "Pacifism")).toHaveLength(1);
  });

  it("Shimmer Myr lets you cast an artifact at instant speed, and nothing else", () => {
    const game = setUp(["Sol Ring", "Grizzly Bears"], "Forest");
    spawn(game, "Shimmer Myr");
    lands(game, "Forest", 3);
    game.advanceUntil((s) => s.turn.step === "begin-combat" && s.priority.holder === A);
    expect(castable(game, A, inHand(game, "Sol Ring"))).toBe(true);
    expect(castable(game, A, inHand(game, "Grizzly Bears"))).toBe(false);
  });

  it("Ulamog: casting it exiles two target permanents; its attack exiles twenty of the defender's library", () => {
    const { game, a } = setUpScripted(["Ulamog, the Ceaseless Hunger"], "Wastes");
    const one = spawn(game, "Sol Ring", B);
    const two = spawn(game, "Craw Wurm", B);
    lands(game, "Wastes", 10);
    const ulamog = inHand(game, "Ulamog, the Ceaseless Hunger");
    game.dispatch({ type: "cast-spell", player: A, card: ulamog, targets: [] });
    settle(game, [one, two]);
    expect(zone(game, one)).toBe("exile");
    expect(zone(game, two)).toBe("exile");
    expect(zone(game, ulamog)).toBe("battlefield");
    game.state.objects[ulamog].summoningSick = false;
    const library = game.libraryOf(B).length;
    a.declareAttackersFn = () => [{ attacker: ulamog, defender: B }];
    game.advanceUntil((s) => s.turn.step === "declare-blockers" && quiet(s));
    expect(game.libraryOf(B).length).toBe(library - 20);
  });

  it("Brass's Bounty makes a Treasure for each land you control", () => {
    const game = setUp(["Brass's Bounty"], "Mountain");
    lands(game, "Mountain", 7);
    lands(game, "Forest", 2, B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Brass's Bounty"), targets: [] });
    settle(game);
    expect(tokens(game, "Treasure Token")).toBe(7);
  });

  it("Sodden Verdure enters tapped unless you control two basic lands", () => {
    const game = setUp();
    spawn(game, "Forest");
    const first = game.debugSpawn("Sodden Verdure", A, "battlefield");
    expect(game.state.objects[first].tapped).toBe(true);
    spawn(game, "Island");
    const second = game.debugSpawn("Sodden Verdure", A, "battlefield");
    expect(game.state.objects[second].tapped).toBe(false);
  });

  it("Persist returns a nonlegendary creature card with a -1/-1 counter — not a legendary one", () => {
    const game = setUp(["Persist"], "Swamp");
    const wurm = game.debugSpawn("Craw Wurm", A, "graveyard");
    game.debugSpawn("Mikaeus, the Unhallowed", A, "graveyard");
    lands(game, "Swamp", 2);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Persist"), targets: [obj(wurm)] });
    settle(game);
    expect(zone(game, wurm)).toBe("battlefield");
    expect(game.characteristics(wurm).power).toBe(5);
    const mikaeus = game.graveyardOf(A).find((id) => game.state.objects[id].cardName === "Mikaeus, the Unhallowed")!;
    expect(game.canDispatch({ type: "cast-spell", player: A, card: inHand(game, "Persist") ?? wurm, targets: [obj(mikaeus)] })).not.toBeNull();
  });

  it("Staff of Compleation destroys a permanent you own, not an opponent's", () => {
    const game = setUp();
    const staff = spawn(game, "Staff of Compleation");
    const mine = spawn(game, "Sol Ring");
    const theirs = spawn(game, "Sol Ring", B);
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: staff, abilityIndex: 0, targets: [obj(theirs)] }),
    ).toThrow();
    game.dispatch({ type: "activate-ability", player: A, source: staff, abilityIndex: 0, targets: [obj(mine)] });
    settle(game);
    expect(zone(game, mine)).toBe("graveyard");
    expect(life(game, A)).toBe(19);
  });

  it("Grand Crescendo's Citizens get indestructible with the rest", () => {
    const game = setUp(["Grand Crescendo"], "Plains");
    const bears = spawn(game, "Grizzly Bears");
    lands(game, "Plains", 5);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grand Crescendo"), targets: [], xValue: 3 });
    settle(game);
    expect(tokens(game, "Citizen Token")).toBe(3);
    const [citizen] = named(game, "Citizen Token");
    expect(game.characteristics(citizen).keywords.has("indestructible")).toBe(true);
    expect(game.characteristics(bears).keywords.has("indestructible")).toBe(true);
  });

  it("Legion Leadership doubles power and grants first strike", () => {
    const game = setUp(["Legion Leadership"], "Mountain");
    const wurm = spawn(game, "Craw Wurm");
    lands(game, "Mountain", 2);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Legion Leadership"), targets: [obj(wurm)] });
    settle(game);
    const c = game.characteristics(wurm);
    expect([c.power, c.toughness]).toEqual([12, 4]);
    expect(c.keywords.has("first-strike")).toBe(true);
  });

  it("Brainsurge draws four and puts two back on top", () => {
    const game = setUp(["Brainsurge"], "Island");
    lands(game, "Island", 3);
    const hand = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Brainsurge"), targets: [] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || quiet(s));
    const put = game.handOf(A).slice(0, 2);
    if (game.state.awaiting?.kind === "choose-from-zone") {
      game.dispatch({ type: "choose-from-zone", player: A, chosen: put });
    }
    settle(game);
    // Brainsurge itself left the hand: -1 + 4 - 2.
    expect(game.handOf(A).length).toBe(hand + 1);
    expect(game.libraryOf(A).slice(0, 2).sort()).toEqual([...put].sort());
  });

  it("Akroma's Memorial: your creatures fly, strike first, and can't be targeted by black", () => {
    const game = setUp([], "Wastes", ["Doom Blade"]);
    spawn(game, "Akroma's Memorial");
    const bears = spawn(game, "Grizzly Bears");
    const c = game.characteristics(bears);
    expect(["flying", "first-strike", "vigilance", "trample", "haste"].every((k) => c.keywords.has(k as never))).toBe(true);
    lands(game, "Swamp", 2, B);
    toB(game);
    expect(
      game.canDispatch({ type: "cast-spell", player: B, card: inHand(game, "Doom Blade", B), targets: [obj(bears)] }),
    ).not.toBeNull();
  });

  it("Maestros Theater sacrifices itself for a basic Island, Swamp or Mountain, tapped, and 1 life", () => {
    const game = setUp([], "Swamp");
    const theater = enter(game, "Maestros Theater");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || quiet(s));
    if (game.state.awaiting?.kind === "choose-from-zone") {
      game.dispatch({ type: "choose-from-zone", player: A, chosen: game.state.awaiting.eligible.slice(0, 1) });
    }
    settle(game);
    expect(zone(game, theater)).toBe("graveyard");
    const [swamp] = named(game, "Swamp");
    expect(game.state.objects[swamp].tapped).toBe(true);
    expect(life(game, A)).toBe(21);
  });

  it("Wight of the Reliquary can't sacrifice itself to fetch", () => {
    const game = setUp();
    const wight = spawn(game, "Wight of the Reliquary");
    const fetch = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === wight && x.abilityIndex === 0);
    expect(fetch()).toBe(false);
    spawn(game, "Grizzly Bears");
    expect(fetch()).toBe(true);
  });

  it("Will of the Jeskai with a commander: both — each player may wheel, and your spells gain flashback", () => {
    const game = setUp(["Will of the Jeskai"], "Mountain");
    const commander = spawn(game, "Grizzly Bears");
    game.state.objects[commander].isCommander = true;
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    lands(game, "Mountain", 5);
    const theirs = [...game.handOf(B)];
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Will of the Jeskai"), targets: [], modes: [0, 1] });
    for (let guard = 0; guard < 20; guard += 1) {
      game.advanceUntil((s) => s.awaiting?.kind === "choose-modes" || quiet(s));
      const awaiting = game.state.awaiting;
      if (awaiting?.kind !== "choose-modes") break;
      // Alice wheels; bob declines (no mode), keeping his hand.
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: awaiting.player === A ? [0] : [] });
    }
    expect(game.handOf(A)).toHaveLength(5);
    expect([...game.handOf(B)].sort()).toEqual([...theirs].sort());
    expect(castable(game, A, bolt)).toBe(true);
  });

  it("Will of the Jeskai without a commander: only one mode", () => {
    const game = setUp(["Will of the Jeskai"], "Mountain");
    lands(game, "Mountain", 4);
    expect(
      game.canDispatch({ type: "cast-spell", player: A, card: inHand(game, "Will of the Jeskai"), targets: [], modes: [0, 1] }),
    ).not.toBeNull();
  });

  it("Bushwhack's fight mode", () => {
    const game = setUp(["Bushwhack"], "Forest");
    const wurm = spawn(game, "Craw Wurm");
    const bears = spawn(game, "Grizzly Bears", B);
    lands(game, "Forest", 1);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Bushwhack"), targets: [obj(wurm), obj(bears)], modes: [1] });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(game.state.objects[wurm].damageMarked).toBe(2);
  });
});
