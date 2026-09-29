/**
 * Top-5000 batch 6 (ranks 872–1210) and what it needed: "spells you control
 * can't be countered" (`grantsToSpells.cantBeCountered`), triggered abilities
 * that work in the graveyard (`fromGraveyard` — Bloodghast, and Spit Flame,
 * whose return never fired), base P/T set to a live amount by `animate-all`
 * (Mirror Entity), a subtype added as a card enters (Portal to Phyrexia),
 * "when you play another land" (City of Traitors), "you have hexproof"
 * (Shalai), living weapon, and a count of counters on the source (Door of
 * Destinies). One test per clause most likely to be wrong.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import { hasSubtype } from "../subtypes.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (hand: readonly string[] = [], library = "Wastes", handB: readonly string[] = []) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: [...handB, ...Array<string>(40).fill("Wastes")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
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
/** Put a permanent into its owner's graveyard the way a dying one goes. */
const kill = (game: Game, id: ObjectId): void => {
  (game as unknown as { moveObject(id: ObjectId, to: string): boolean }).moveObject(id, "graveyard");
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

describe("top-5000 batch 6 — spells you control can't be countered", () => {
  it("Destiny Spinner keeps a creature or enchantment spell from being countered, not an instant", () => {
    const game = setUp(["Grizzly Bears", "Pacifism", "Divination"], "Forest", ["Counterspell", "Counterspell", "Counterspell"]);
    spawn(game, "Destiny Spinner");
    lands(game, "Forest", 2);
    lands(game, "Plains", 2);
    lands(game, "Island", 3);
    lands(game, "Island", 6, B);
    const counterFrom = (spell: ObjectId): void => {
      game.advanceUntil((s) => s.priority.holder === A);
      game.dispatch({ type: "pass-priority", player: A });
      game.advanceUntil((s) => s.priority.holder === B);
      const counter = inHand(game, "Counterspell", B);
      game.dispatch({ type: "cast-spell", player: B, card: counter, targets: [obj(spell)] });
      game.advanceUntil(quiet);
    };
    const bears = inHand(game, "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] });
    counterFrom(bears);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    const pacifism = inHand(game, "Pacifism");
    game.dispatch({ type: "cast-spell", player: A, card: pacifism, targets: [obj(named(game, "Grizzly Bears")[0])] });
    counterFrom(pacifism);
    expect(game.state.objects[pacifism].zone).toBe("battlefield");
    const divination = inHand(game, "Divination");
    game.dispatch({ type: "cast-spell", player: A, card: divination, targets: [] });
    counterFrom(divination);
    expect(game.state.objects[divination].zone).toBe("graveyard");
  });

  it("Prowling Serpopard protects its controller's creature spells only, and only while it's there", () => {
    const game = setUp(["Grizzly Bears", "Grizzly Bears"], "Forest", ["Counterspell", "Counterspell"]);
    const mine = spawn(game, "Prowling Serpopard");
    spawn(game, "Prowling Serpopard", B);
    lands(game, "Forest", 4);
    lands(game, "Island", 4, B);
    const castAndCounter = (): ObjectId => {
      const bears = inHand(game, "Grizzly Bears");
      game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] });
      game.dispatch({ type: "pass-priority", player: A });
      game.advanceUntil((s) => s.priority.holder === B);
      game.dispatch({ type: "cast-spell", player: B, card: inHand(game, "Counterspell", B), targets: [obj(bears)] });
      game.advanceUntil(quiet);
      return bears;
    };
    expect(game.state.objects[castAndCounter()].zone).toBe("battlefield");
    // Without A's own Serpopard, B's doesn't help A: countered.
    kill(game, mine);
    game.advanceUntil((s) => s.priority.holder === A && quiet(s));
    expect(game.state.objects[castAndCounter()].zone).toBe("graveyard");
  });

  it("Hexing Squelcher: every spell you control, an instant too", () => {
    const game = setUp(["Divination"], "Island", ["Counterspell"]);
    spawn(game, "Hexing Squelcher");
    lands(game, "Island", 3);
    lands(game, "Island", 2, B);
    const divination = inHand(game, "Divination");
    const hand = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: divination, targets: [] });
    game.dispatch({ type: "pass-priority", player: A });
    game.advanceUntil((s) => s.priority.holder === B);
    game.dispatch({ type: "cast-spell", player: B, card: inHand(game, "Counterspell", B), targets: [obj(divination)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[divination].zone).toBe("graveyard");
    // It resolved rather than being countered: two cards drawn.
    expect(game.handOf(A).length).toBe(hand - 1 + 2);
  });
});

describe("top-5000 batch 6 — abilities that work in the graveyard", () => {
  it("Bloodghast returns from the graveyard when a land you control enters, not an opponent's", () => {
    const game = setUp();
    const ghast = game.debugSpawn("Bloodghast", A, "graveyard");
    enter(game, "Swamp", B);
    settle(game);
    expect(game.state.objects[ghast].zone).toBe("graveyard");
    enter(game, "Swamp");
    settle(game);
    expect(game.state.objects[ghast].zone).toBe("battlefield");
  });

  it("Bloodghast's landfall doesn't work on the battlefield, and it can't block", () => {
    const game = setUp();
    const ghast = spawn(game, "Bloodghast");
    enter(game, "Swamp");
    expect(game.state.pendingTriggers.length + game.state.zones.shared.stack.length).toBe(0);
    expect(game.characteristics(ghast).keywords.has("haste")).toBe(false);
    game.state.players[B].life = 10;
    expect(game.characteristics(ghast).keywords.has("haste")).toBe(true);
  });

  it("a Bloodghast that left the graveyard in response isn't returned", () => {
    const game = setUp();
    const ghast = game.debugSpawn("Bloodghast", A, "graveyard");
    enter(game, "Swamp");
    game.advanceUntil((s) => s.zones.shared.stack.length > 0 || s.awaiting !== null);
    // Exiled and back into the graveyard: a new object (rule 400.7).
    const move = (game as unknown as { moveObject(id: ObjectId, to: string): boolean }).moveObject.bind(game);
    move(ghast, "exile");
    move(ghast, "graveyard");
    settle(game);
    expect(game.state.objects[ghast].zone).toBe("graveyard");
  });

  it("Spit Flame returns itself from the graveyard when a Dragon enters, if you pay {R}", () => {
    const game = setUp();
    const flame = game.debugSpawn("Spit Flame", A, "graveyard");
    const other = game.debugSpawn("Spit Flame", A, "graveyard");
    lands(game, "Mountain", 2);
    enter(game, "Shivan Dragon");
    settle(game);
    // Each copy's ability returns that copy: both came back, one {R} each.
    expect(game.state.objects[flame].zone).toBe("hand");
    expect(game.state.objects[other].zone).toBe("hand");
  });

  it("Spit Flame on the stack or in hand doesn't return anything", () => {
    const game = setUp(["Spit Flame"]);
    lands(game, "Mountain", 2);
    enter(game, "Shivan Dragon");
    expect(game.state.pendingTriggers.length + game.state.zones.shared.stack.length).toBe(0);
  });
});

describe("top-5000 batch 6 — the other engine pieces", () => {
  it("Mirror Entity: X/X base for creatures you control only, all creature types, counters on top", () => {
    const game = setUp();
    const entity = spawn(game, "Mirror Entity");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters["+1/+1"] = 1;
    const theirs = spawn(game, "Grizzly Bears", B);
    lands(game, "Plains", 3);
    game.dispatch({ type: "activate-ability", player: A, source: entity, abilityIndex: 0, targets: [], xValue: 3 });
    settle(game);
    expect([game.characteristics(entity).power, game.characteristics(entity).toughness]).toEqual([3, 3]);
    expect([game.characteristics(bears).power, game.characteristics(bears).toughness]).toEqual([4, 4]);
    expect(hasSubtype(game.characteristics(bears).subtypes, "Elf")).toBe(true);
    expect(game.characteristics(theirs).power).toBe(2);
    expect(hasSubtype(game.characteristics(theirs).subtypes, "Elf")).toBe(false);
  });

  it("Portal to Phyrexia takes a creature card from any graveyard, a Phyrexian as it enters", () => {
    const game = setUp();
    const portal = spawn(game, "Portal to Phyrexia");
    const card = game.debugSpawn("Craw Wurm", B, "graveyard");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "upkeep");
    settle(game, [card]);
    expect(game.state.objects[card].zone).toBe("battlefield");
    expect(game.state.objects[card].controller).toBe(A);
    expect(hasSubtype(game.characteristics(card).subtypes, "Phyrexian")).toBe(true);
    expect(game.state.objects[portal].zone).toBe("battlefield");
  });

  it("Portal to Phyrexia's entry makes each opponent sacrifice three creatures", () => {
    const game = setUp();
    const theirs = [spawn(game, "Grizzly Bears", B), spawn(game, "Grizzly Bears", B), spawn(game, "Grizzly Bears", B), spawn(game, "Craw Wurm", B)];
    enter(game, "Portal to Phyrexia");
    settle(game);
    expect(theirs.filter((id) => game.state.objects[id].zone === "battlefield").length).toBe(1);
  });

  it("City of Traitors: sacrificed on playing another land, not on its own play", () => {
    const game = setUp(["City of Traitors", "Forest"]);
    game.dispatch({ type: "play-land", player: A, card: inHand(game, "City of Traitors") });
    settle(game);
    const city = named(game, "City of Traitors")[0];
    expect(city).toBeDefined();
    // A land put onto the battlefield isn't played.
    enter(game, "Forest");
    settle(game);
    expect(game.state.objects[city].zone).toBe("battlefield");
    game.dispatch({ type: "play-land", player: A, card: inHand(game, "Forest") });
    settle(game);
    expect(game.state.objects[city].zone).toBe("graveyard");
  });

  it("Shalai: an opponent can't target you or your other creatures, but can target Shalai", () => {
    const game = setUp([], "Wastes", ["Lightning Bolt"]);
    const shalai = spawn(game, "Shalai, Voice of Plenty");
    const bears = spawn(game, "Grizzly Bears");
    lands(game, "Mountain", 1, B);
    toB(game);
    const bolt = inHand(game, "Lightning Bolt", B);
    const option = game
      .legalActions(B)
      .find((o) => o.kind === "cast-spell" && o.card === bolt);
    expect(option).toBeDefined();
    const legal = (option as { targetOptions: readonly (readonly TargetRef[])[] }).targetOptions[0];
    expect(legal).toContainEqual(obj(shalai));
    expect(legal).toContainEqual(player(B));
    expect(legal).not.toContainEqual(player(A));
    expect(legal).not.toContainEqual(obj(bears));
  });

  it("Nettlecyst's Germ enters equipped and survives as a 1/1 or better", () => {
    const game = setUp();
    spawn(game, "Sol Ring");
    const cyst = enter(game, "Nettlecyst");
    settle(game);
    const germ = named(game, "Phyrexian Germ Token")[0];
    expect(germ).toBeDefined();
    expect(game.state.objects[cyst].attachedTo).toBe(germ);
    // Sol Ring and Nettlecyst: two artifacts.
    expect([game.characteristics(germ).power, game.characteristics(germ).toughness]).toEqual([2, 2]);
  });

  it("living weapon under Doubling Season: one Germ is equipped, the other dies", () => {
    const game = setUp();
    spawn(game, "Doubling Season");
    const skull = enter(game, "Batterskull");
    settle(game);
    const germs = named(game, "Phyrexian Germ Token");
    expect(germs.length).toBe(1);
    expect(game.state.objects[skull].attachedTo).toBe(germs[0]);
    expect(game.characteristics(germs[0]).keywords.has("lifelink")).toBe(true);
  });

  it("Door of Destinies counts its own charge counters for creatures of the chosen type", () => {
    const game = setUp(["Llanowar Elves"], "Forest");
    const door = spawn(game, "Door of Destinies");
    game.state.objects[door].chosenCreatureType = "Elf";
    const elf = spawn(game, "Elvish Mystic");
    const bears = spawn(game, "Grizzly Bears");
    lands(game, "Forest", 1);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Llanowar Elves"), targets: [] });
    settle(game);
    expect(game.state.objects[door].counters.charge).toBe(1);
    expect(game.characteristics(elf).power).toBe(2);
    expect(game.characteristics(bears).power).toBe(2);
  });

  it("An Offer You Can't Refuse pays a countered copy's controller, not its own caster", () => {
    const game = setUp(["Lightning Bolt", "Twincast"], "Island", ["An Offer You Can't Refuse"]);
    lands(game, "Mountain", 1);
    lands(game, "Island", 2);
    lands(game, "Island", 1, B);
    const bolt = inHand(game, "Lightning Bolt");
    game.dispatch({ type: "cast-spell", player: A, card: bolt, targets: [player(B)] });
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Twincast"), targets: [obj(bolt)] });
    game.dispatch({ type: "pass-priority", player: A });
    game.advanceUntil(
      (s) => s.zones.shared.stack.some((id) => s.objects[id].isCopy === true) && s.priority.holder === A,
    );
    const copy = game.state.zones.shared.stack.find((id) => game.state.objects[id].isCopy === true)!;
    expect(game.state.objects[copy].controller).toBe(A);
    game.dispatch({ type: "pass-priority", player: A });
    game.advanceUntil((s) => s.priority.holder === B);
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: inHand(game, "An Offer You Can't Refuse", B),
      targets: [obj(copy)],
    });
    game.advanceUntil(quiet);
    const treasures = named(game, "Treasure Token");
    expect(new Set(treasures.map((id) => game.state.objects[id].controller))).toEqual(new Set([A]));
    expect(tokens(game, "Treasure Token")).toBe(2);
    // The original Bolt still resolved.
    expect(life(game, B)).toBe(17);
  });

  it("Cut a Deal: you draw one per opponent who actually drew", () => {
    const game = setUp(["Cut a Deal"], "Plains");
    lands(game, "Plains", 3);
    const hand = game.handOf(A).length;
    const theirHand = game.handOf(B).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Cut a Deal"), targets: [] });
    settle(game);
    expect(game.handOf(B).length).toBe(theirHand + 1);
    expect(game.handOf(A).length).toBe(hand - 1 + 1);
  });

  it("Cut a Deal: an opponent with nothing to draw doesn't count", () => {
    const game = setUp(["Cut a Deal"], "Plains");
    lands(game, "Plains", 3);
    game.state.zones.perPlayer[B].library = [];
    const hand = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Cut a Deal"), targets: [] });
    settle(game);
    expect(game.handOf(A).length).toBe(hand - 1);
  });
});

/** The set-up above, with the scripted controllers handed back so a test can
 * script attacks. */
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

describe("top-5000 batch 6 — the cards", () => {
  it("Torbran adds 2 to a red source's damage to an opponent, not to you", () => {
    const game = setUp(["Lightning Bolt", "Lightning Bolt"], "Mountain");
    spawn(game, "Torbran, Thane of Red Fell");
    lands(game, "Mountain", 2);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Lightning Bolt"), targets: [player(B)] });
    settle(game);
    expect(life(game, B)).toBe(20 - 5);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Lightning Bolt"), targets: [player(A)] });
    settle(game);
    expect(life(game, A)).toBe(20 - 3);
  });

  it("Annie Joins Up: a legendary creature's trigger triggers twice, a nonlegendary one's once", () => {
    const game = setUp();
    spawn(game, "Annie Joins Up");
    const hand = game.handOf(A).length;
    enter(game, "Omnath, Locus of Creation");
    settle(game);
    expect(game.handOf(A).length).toBe(hand + 2);
    enter(game, "Elvish Visionary");
    settle(game);
    expect(game.handOf(A).length).toBe(hand + 3);
  });

  it("Apex Devastator's four cascades each trigger", () => {
    const game = setUp(["Apex Devastator"], "Forest");
    lands(game, "Forest", 10);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Apex Devastator"), targets: [] });
    game.advanceUntil((s) => s.pendingTriggers.length === 0 && s.zones.shared.stack.length > 1);
    expect(game.state.zones.shared.stack.length).toBe(1 + 4);
  });

  it("Syphon Mind draws a card for each card discarded, none for an empty hand", () => {
    const game = setUp(["Syphon Mind", "Syphon Mind"], "Swamp");
    lands(game, "Swamp", 8);
    const hand = game.handOf(A).length;
    const theirs = game.handOf(B).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Syphon Mind"), targets: [] });
    settle(game);
    game.advanceUntil(quiet);
    expect(game.handOf(B).length).toBe(theirs - 1);
    expect(game.handOf(A).length).toBe(hand - 1 + 1);
    game.state.zones.perPlayer[B].hand = [];
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Syphon Mind"), targets: [] });
    settle(game);
    expect(game.handOf(A).length).toBe(hand - 2 + 1);
  });

  it("Strix Serenade gives the spell's controller a Bird, even when the spell can't be countered", () => {
    const game = setUp(["Grizzly Bears", "Grizzly Bears"], "Forest", ["Strix Serenade", "Strix Serenade"]);
    lands(game, "Forest", 4);
    lands(game, "Island", 2, B);
    const serenade = (): ObjectId => {
      const bears = inHand(game, "Grizzly Bears");
      game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] });
      game.dispatch({ type: "pass-priority", player: A });
      game.advanceUntil((s) => s.priority.holder === B);
      game.dispatch({ type: "cast-spell", player: B, card: inHand(game, "Strix Serenade", B), targets: [obj(bears)] });
      game.advanceUntil(quiet);
      return bears;
    };
    expect(game.state.objects[serenade()].zone).toBe("graveyard");
    expect(named(game, "2/2 Blue Bird Token").map((id) => game.state.objects[id].controller)).toEqual([A]);
    spawn(game, "Prowling Serpopard");
    game.advanceUntil((s) => s.priority.holder === A && quiet(s));
    expect(game.state.objects[serenade()].zone).toBe("battlefield");
    expect(tokens(game, "2/2 Blue Bird Token")).toBe(2);
  });

  it("Genji Glove: the first combat's attack untaps the creature and adds one combat, the second doesn't", () => {
    const { game, a } = setUpScripted();
    const glove = spawn(game, "Genji Glove");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[glove].attachedTo = bears;
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.turn.step === "declare-blockers" && quiet(s));
    expect(game.state.objects[bears].tapped).toBe(false);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(game.state.turn.combatPhases).toBe(2);
    // Double strike, twice: 2 + 2, twice.
    expect(life(game, B)).toBe(20 - 8);
  });

  it("Stoneforge Mystic puts an Equipment from hand onto the battlefield", () => {
    const game = setUp(["Batterskull"], "Plains");
    const mystic = spawn(game, "Stoneforge Mystic");
    lands(game, "Plains", 2);
    game.dispatch({ type: "activate-ability", player: A, source: mystic, abilityIndex: 0, targets: [] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || quiet(s));
    const skull = inHand(game, "Batterskull");
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [skull] });
    settle(game);
    expect(game.state.objects[skull].zone).toBe("battlefield");
    expect(named(game, "Phyrexian Germ Token").length).toBe(1);
  });

  it("Archon of Cruelty: the opponent sacrifices, discards and loses 3; you draw and gain 3", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const hand = game.handOf(A).length;
    const theirs = game.handOf(B).length;
    enter(game, "Archon of Cruelty");
    settle(game);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.handOf(B).length).toBe(theirs - 1);
    expect(life(game, B)).toBe(17);
    expect(game.handOf(A).length).toBe(hand + 1);
    expect(life(game, A)).toBe(23);
  });

  it("Luminous Broodmoth returns a creature without flying with a flying counter, not one with flying", () => {
    const game = setUp();
    spawn(game, "Luminous Broodmoth");
    const bears = spawn(game, "Grizzly Bears");
    const angel = spawn(game, "Serra Angel");
    kill(game, bears);
    settle(game);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[bears].counters.flying).toBe(1);
    expect(game.characteristics(bears).keywords.has("flying")).toBe(true);
    kill(game, angel);
    settle(game);
    expect(game.state.objects[angel].zone).toBe("graveyard");
  });

  it("Titania makes a 5/3 when a land of yours goes to the graveyard — Roiling Regrowth's sacrifice", () => {
    const game = setUp(["Roiling Regrowth"], "Forest");
    spawn(game, "Titania, Protector of Argoth");
    lands(game, "Forest", 3);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Roiling Regrowth"), targets: [] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || quiet(s));
    const search = game.state.awaiting;
    expect(search?.kind).toBe("choose-from-zone");
    const found = search?.kind === "choose-from-zone" ? search.eligible.slice(0, 2) : [];
    game.dispatch({ type: "choose-from-zone", player: A, chosen: found });
    settle(game);
    expect(tokens(game, "5/3 Green Elemental Token")).toBe(1);
    // Three Forests, one sacrificed, two found — entering tapped.
    expect(named(game, "Forest").length).toBe(4);
    expect(found.map((id) => [game.state.objects[id].zone, game.state.objects[id].tapped])).toEqual([
      ["battlefield", true],
      ["battlefield", true],
    ]);
  });

  it("Pollywog Prodigy draws off a noncreature spell with mana value less than its power", () => {
    const game = setUp([], "Wastes", ["Shock", "Lightning Bolt"]);
    const frog = spawn(game, "Pollywog Prodigy");
    lands(game, "Mountain", 2, B);
    const hand = game.handOf(A).length;
    toB(game);
    // Power 1: a mana value 1 spell isn't less.
    game.dispatch({ type: "cast-spell", player: B, card: inHand(game, "Shock", B), targets: [player(A)] });
    settle(game);
    expect(game.handOf(A).length).toBe(hand);
    game.state.objects[frog].counters["+1/+1"] = 1;
    game.advanceUntil((s) => s.priority.holder === A && quiet(s));
    toB(game);
    game.dispatch({ type: "cast-spell", player: B, card: inHand(game, "Lightning Bolt", B), targets: [player(A)] });
    settle(game);
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  it("Painful Quandary: the caster discards a card rather than lose 5 life", () => {
    const game = setUp([], "Wastes", ["Shock"]);
    spawn(game, "Painful Quandary");
    lands(game, "Mountain", 1, B);
    toB(game);
    const hand = game.handOf(B).length;
    game.dispatch({ type: "cast-spell", player: B, card: inHand(game, "Shock", B), targets: [player(A)] });
    settle(game);
    expect(game.handOf(B).length).toBe(hand - 2);
    expect(life(game, B)).toBe(20);
  });

  it("Painful Quandary: with nothing to discard, the caster loses 5 life", () => {
    const game = setUp([], "Wastes", ["Shock"]);
    spawn(game, "Painful Quandary");
    lands(game, "Mountain", 1, B);
    const shock = inHand(game, "Shock", B);
    game.state.zones.perPlayer[B].hand = [shock];
    toB(game);
    game.dispatch({ type: "cast-spell", player: B, card: shock, targets: [player(A)] });
    settle(game);
    expect(life(game, B)).toBe(15);
  });

  it("Vilis draws for the life paid for its own ability", () => {
    const game = setUp();
    const vilis = spawn(game, "Vilis, Broker of Blood");
    const bears = spawn(game, "Grizzly Bears", B);
    lands(game, "Swamp", 1);
    const hand = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: vilis, abilityIndex: 0, targets: [obj(bears)] });
    settle(game);
    expect(life(game, A)).toBe(18);
    expect(game.handOf(A).length).toBe(hand + 2);
    expect(game.characteristics(bears).power).toBe(1);
  });

  it("Tyrite Sanctum makes a God with a counter, then gives a God an indestructible counter", () => {
    const game = setUp();
    const sanctum = spawn(game, "Tyrite Sanctum");
    const omnath = spawn(game, "Omnath, Locus of Creation");
    lands(game, "Wastes", 6);
    game.dispatch({ type: "activate-ability", player: A, source: sanctum, abilityIndex: 1, targets: [obj(omnath)] });
    settle(game);
    expect(hasSubtype(game.characteristics(omnath).subtypes, "God")).toBe(true);
    expect(game.state.objects[omnath].counters["+1/+1"]).toBe(1);
    game.state.objects[sanctum].tapped = false;
    game.dispatch({ type: "activate-ability", player: A, source: sanctum, abilityIndex: 2, targets: [obj(omnath)] });
    settle(game);
    expect(game.characteristics(omnath).keywords.has("indestructible")).toBe(true);
    expect(game.state.objects[sanctum].zone).toBe("graveyard");
  });

  it("Monologue Tax: a Treasure for an opponent's second spell of the turn only", () => {
    const game = setUp([], "Wastes", ["Shock", "Shock", "Shock"]);
    spawn(game, "Monologue Tax");
    lands(game, "Mountain", 3, B);
    const castShock = (): void => {
      game.advanceUntil((s) => s.priority.holder === A && quiet(s));
      toB(game);
      game.dispatch({ type: "cast-spell", player: B, card: inHand(game, "Shock", B), targets: [player(A)] });
      settle(game);
    };
    castShock();
    expect(named(game, "Treasure Token").length).toBe(0);
    castShock();
    expect(named(game, "Treasure Token").length).toBe(1);
    castShock();
    expect(named(game, "Treasure Token").length).toBe(1);
  });

  it("Prismari Command's modes each reach their own target player", () => {
    const game = setUp(["Prismari Command"], "Island");
    lands(game, "Island", 2);
    lands(game, "Mountain", 1);
    const hand = game.handOf(A).length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Prismari Command"),
      modes: [1, 2],
      targets: [player(A), player(B)],
    });
    settle(game);
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand - 1 + 2 - 2);
    const treasures = named(game, "Treasure Token");
    expect(treasures.map((id) => game.state.objects[id].controller)).toEqual([B]);
  });

  it("Circle of Dreams Druid adds {G} for each creature you control", () => {
    const game = setUp();
    const druid = spawn(game, "Circle of Dreams Druid");
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "activate-ability", player: A, source: druid, abilityIndex: 0, targets: [] });
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["G", "G"]);
  });

  it("Suture Priest: an opponent's creature entering can cost them 1 life; yours gains you 1", () => {
    const game = setUp();
    spawn(game, "Suture Priest");
    enter(game, "Grizzly Bears", B);
    settle(game);
    expect(life(game, B)).toBe(19);
    enter(game, "Grizzly Bears");
    settle(game);
    expect(life(game, A)).toBe(21);
  });

  it("Damning Verdict spares only creatures with counters", () => {
    const game = setUp(["Damning Verdict"], "Plains");
    lands(game, "Plains", 5);
    const plain = spawn(game, "Grizzly Bears");
    const marked = spawn(game, "Grizzly Bears", B);
    game.state.objects[marked].counters["-1/-1"] = 1;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Damning Verdict"), targets: [] });
    settle(game);
    expect(game.state.objects[plain].zone).toBe("graveyard");
    expect(game.state.objects[marked].zone).toBe("battlefield");
  });

  it("Magus of the Wheel: each player discards their hand, then draws seven", () => {
    const game = setUp();
    const magus = spawn(game, "Magus of the Wheel");
    lands(game, "Mountain", 2);
    game.dispatch({ type: "activate-ability", player: A, source: magus, abilityIndex: 0, targets: [] });
    settle(game);
    expect(game.handOf(A).length).toBe(7);
    expect(game.handOf(B).length).toBe(7);
    expect(game.state.objects[magus].zone).toBe("graveyard");
  });

  it("Oketra's Monument: a white creature spell costs {1} less, and any creature spell makes a Warrior", () => {
    const game = setUp(["Savannah Lions", "Grizzly Bears"], "Plains");
    spawn(game, "Oketra's Monument");
    lands(game, "Plains", 1);
    const castable = (name: string): boolean =>
      game.legalActions(A).some((x) => x.kind === "cast-spell" && x.cardName === name);
    expect(castable("Savannah Lions")).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Savannah Lions"), targets: [] });
    settle(game);
    expect(named(game, "Warrior Token (Vigilance)").length).toBe(1);
  });

  it("Setessan Champion grows and draws when an enchantment enters under your control", () => {
    const game = setUp();
    const champion = spawn(game, "Setessan Champion");
    const hand = game.handOf(A).length;
    enter(game, "Up the Beanstalk");
    settle(game);
    expect(game.state.objects[champion].counters["+1/+1"]).toBe(1);
    // The Champion's draw and Up the Beanstalk's own.
    expect(game.handOf(A).length).toBe(hand + 2);
  });

  it("Up the Beanstalk draws off a spell with mana value 5 or greater only", () => {
    const game = setUp(["Craw Wurm", "Grizzly Bears"], "Forest");
    spawn(game, "Up the Beanstalk");
    lands(game, "Forest", 8);
    const hand = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears"), targets: [] });
    settle(game);
    expect(game.handOf(A).length).toBe(hand - 1);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Craw Wurm"), targets: [] });
    settle(game);
    expect(game.handOf(A).length).toBe(hand - 2 + 1);
  });

  it("Goblin Engineer sacrifices an artifact to return one with mana value 3 or less", () => {
    const game = setUp();
    const engineer = spawn(game, "Goblin Engineer");
    const ring = game.debugSpawn("Sol Ring", A, "graveyard");
    const fodder = spawn(game, "Ornithopter");
    lands(game, "Mountain", 1);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: engineer,
      abilityIndex: 0,
      targets: [obj(ring)],
      sacrifice: fodder,
    });
    settle(game);
    expect(game.state.objects[ring].zone).toBe("battlefield");
    expect(game.state.objects[fodder].zone).toBe("graveyard");
  });

  it("Ethereal Armor: +1/+1 for each enchantment you control, and first strike", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const armor = spawn(game, "Ethereal Armor");
    game.state.objects[armor].attachedTo = bears;
    spawn(game, "Up the Beanstalk");
    spawn(game, "Up the Beanstalk", B);
    const c = game.characteristics(bears);
    expect([c.power, c.toughness]).toEqual([4, 4]);
    expect(c.keywords.has("first-strike")).toBe(true);
  });

  it("The Shire taps another untapped creature to make a Food", () => {
    const game = setUp();
    // No legendary creature: it entered tapped.
    const shire = spawn(game, "The Shire");
    expect(game.state.objects[shire].tapped).toBe(true);
    game.state.objects[shire].tapped = false;
    const bears = spawn(game, "Grizzly Bears");
    lands(game, "Forest", 2);
    game.dispatch({ type: "activate-ability", player: A, source: shire, abilityIndex: 1, targets: [], tap: [bears] });
    settle(game);
    expect(named(game, "Food Token").length).toBe(1);
    expect(game.state.objects[bears].tapped).toBe(true);
  });

  it("Abandoned Air Temple enters tapped without a basic land, untapped with one", () => {
    const game = setUp();
    const first = enter(game, "Abandoned Air Temple");
    expect(game.state.objects[first].tapped).toBe(true);
    spawn(game, "Plains");
    const second = enter(game, "Abandoned Air Temple");
    expect(game.state.objects[second].tapped).toBe(false);
  });

  it("Destiny Spinner animates a land as an X/X counting enchantments as it resolves", () => {
    const game = setUp();
    const spinner = spawn(game, "Destiny Spinner");
    spawn(game, "Up the Beanstalk");
    const land = spawn(game, "Forest");
    lands(game, "Forest", 4);
    game.dispatch({ type: "activate-ability", player: A, source: spinner, abilityIndex: 0, targets: [obj(land)] });
    settle(game);
    const c = game.characteristics(land);
    // The Spinner is an enchantment too: two.
    expect([c.power, c.toughness]).toEqual([2, 2]);
    expect(c.types).toContain("land");
    expect(c.keywords.has("haste")).toBe(true);
    spawn(game, "Up the Beanstalk");
    expect(game.characteristics(land).power).toBe(2);
  });

  it("Witch's Clinic targets a commander, and nothing else", () => {
    const game = setUp();
    const clinic = spawn(game, "Witch's Clinic");
    const commander = spawn(game, "Grizzly Bears");
    game.state.objects[commander].isCommander = true;
    const other = spawn(game, "Grizzly Bears");
    lands(game, "Wastes", 2);
    const option = game
      .legalActions(A)
      .find((o) => o.kind === "activate-ability" && o.source === clinic && o.abilityIndex === 1);
    const legal = (option as { targetOptions: readonly (readonly TargetRef[])[] }).targetOptions[0];
    expect(legal).toEqual([obj(commander)]);
    game.dispatch({ type: "activate-ability", player: A, source: clinic, abilityIndex: 1, targets: [obj(commander)] });
    settle(game);
    expect(game.characteristics(commander).keywords.has("lifelink")).toBe(true);
    expect(game.characteristics(other).keywords.has("lifelink")).toBe(false);
  });

  it("Herd Heirloom's creature draws a card when it deals combat damage to a player, until end of turn", () => {
    const { game, a } = setUpScripted();
    const heirloom = spawn(game, "Herd Heirloom");
    const wurm = spawn(game, "Craw Wurm");
    game.dispatch({ type: "activate-ability", player: A, source: heirloom, abilityIndex: 1, targets: [obj(wurm)] });
    settle(game);
    expect(game.characteristics(wurm).keywords.has("trample")).toBe(true);
    const hand = game.handOf(A).length;
    a.declareAttackersFn = () => [{ attacker: wurm, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(14);
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  it("Jhoira's Familiar: a historic spell costs {1} less", () => {
    const game = setUp(["Omnath, Locus of Creation", "Sol Ring"], "Wastes");
    spawn(game, "Jhoira's Familiar");
    // Sol Ring for nothing: {1} less than {1}.
    const castable = (name: string): boolean =>
      game.legalActions(A).some((x) => x.kind === "cast-spell" && x.cardName === name);
    expect(castable("Sol Ring")).toBe(true);
  });

  it("Allosaurus Shepherd makes each of your Elves a 5/5 Dinosaur", () => {
    const game = setUp();
    const shepherd = spawn(game, "Allosaurus Shepherd");
    const elf = spawn(game, "Llanowar Elves");
    lands(game, "Forest", 6);
    game.dispatch({ type: "activate-ability", player: A, source: shepherd, abilityIndex: 0, targets: [] });
    settle(game);
    expect([game.characteristics(elf).power, game.characteristics(elf).toughness]).toEqual([5, 5]);
    expect(hasSubtype(game.characteristics(elf).subtypes, "Dinosaur")).toBe(true);
    expect(game.characteristics(shepherd).power).toBe(5);
  });
});
