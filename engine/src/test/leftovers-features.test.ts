/**
 * The "leftovers" cluster: the copy-ability cards the ready-now pass left
 * (Strionic Resonator, Peter Parker's Camera, Molten Echoes, Flameshadow
 * Conjuring, Increasing Vengeance), Notion Thief made exact, and Ixhel,
 * Scion of Atraxa — with the pieces they needed:
 *
 * - the `ability` target's `abilityKind` ("target **triggered** ability");
 * - a copy never offered itself as a new target (rule 115.5);
 * - a `would-draw` redirect's `exceptFirstInDrawStep`, and redirects handing
 *   one draw on between them, each applying once (the Notion Thief rulings);
 * - impulse-exile's `whoseIf`, with the `player-counters` condition's
 *   `who: "that-player"` ("each opponent who has three or more poison
 *   counters").
 *
 * Each test is written from the card's Oracle text and rulings.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
/** Stop at a decision, or once everything has resolved. */
const settle = (s: GameState): boolean => s.awaiting !== null || quiet(s);

type Lands = readonly (readonly [string, number])[];
const ALL_COLOURS: Lands = [["Mountain", 8], ["Island", 8], ["Swamp", 4], ["Forest", 4], ["Plains", 2]];

/** A game at A's first precombat main, with no controllers: every decision
 * is answered by the test. */
const setUp = (opts: { players?: readonly PlayerId[]; lands?: Lands } = {}) => {
  const players = opts.players ?? [A, B];
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: players.map((p) => ({ player: p, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const p of players) {
    for (const [land, n] of opts.lands ?? ALL_COLOURS) {
      for (let i = 0; i < n; i += 1) game.debugSpawn(land, p, "battlefield");
    }
  }
  return game;
};

const spawn = (game: Game, name: string, p: PlayerId = A): ObjectId =>
  game.debugSpawn(name, p, "battlefield", { summoningSick: false });
const cast = (game: Game, p: PlayerId, name: string, targets: TargetRef[] = [], extra = {}): ObjectId => {
  const card = game.debugSpawn(name, p, "hand");
  game.dispatch({ type: "cast-spell", player: p, card, targets, ...extra });
  return card;
};
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;
const zoneOf = (game: Game, id: ObjectId): string | undefined => game.state.objects[id]?.zone;
const handSize = (game: Game, p: PlayerId = A): number => game.state.zones.perPlayer[p].hand.length;
const named = (game: Game, name: string, p?: PlayerId): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) =>
      (game.state.objects[id].copyOf ?? game.state.objects[id].cardName) === name &&
      (p === undefined || game.state.objects[id].controller === p),
  );
/** How many permanents named `name` `p` controls — a token stack as each of its tokens. */
const count = (game: Game, name: string, p: PlayerId = A): number =>
  named(game, name, p).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
/** The ability objects on the stack, bottom first. */
const abilitiesOnStack = (game: Game): ObjectId[] =>
  game.state.zones.shared.stack.filter((id) => game.state.objects[id].kind === "ability");
/** Put the triggers waiting to be placed onto the stack, with `p` holding priority. */
const placeTriggers = (game: Game, p: PlayerId = A): void =>
  (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(p);
/** Play everything out, every copy keeping the targets it has (rule
 * 707.10c's "may" declined). */
const settleKeeping = (game: Game): void => {
  for (;;) {
    game.advanceUntil(settle);
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-targets" || awaiting.current === undefined) return;
    game.dispatch({ type: "choose-targets", player: awaiting.player, targets: [...awaiting.current] });
  }
};
const activate = (game: Game, source: ObjectId, targets: TargetRef[], p: PlayerId = A): void => {
  game.dispatch({ type: "activate-ability", player: p, source, abilityIndex: 0, targets });
};
const offersActivation = (game: Game, source: ObjectId, p: PlayerId = A): boolean =>
  game.legalActions(p).some((l) => l.kind === "activate-ability" && l.source === source);

describe("Strionic Resonator", () => {
  it("copies a triggered ability you control: the copy draws a card too", () => {
    const game = setUp();
    const resonator = spawn(game, "Strionic Resonator");
    const hand = handSize(game);
    game.debugSpawn("Elvish Visionary", A, "battlefield", { announceEntry: true });
    placeTriggers(game);
    const trigger = abilitiesOnStack(game)[0];
    activate(game, resonator, [obj(trigger)]);
    settleKeeping(game);
    expect(handSize(game)).toBe(hand + 2);
    expect(game.eventsOfType("ability-copied")).toHaveLength(1);
  });

  it("never targets an activated ability", () => {
    const game = setUp();
    const resonator = spawn(game, "Strionic Resonator");
    const sorcerer = spawn(game, "Prodigal Sorcerer");
    activate(game, sorcerer, [player(B)]);
    const ping = abilitiesOnStack(game)[0];
    expect(game.state.objects[ping].abilityKind).toBe("activated");
    expect(offersActivation(game, resonator)).toBe(false);
    expect(() => activate(game, resonator, [obj(ping)])).toThrow();
  });

  it("a Saga's chapter ability is a triggered ability (rule 714.2b): two Knights", () => {
    const game = setUp();
    const resonator = spawn(game, "Strionic Resonator");
    cast(game, A, "History of Benalia");
    game.advanceUntil((s) =>
      s.zones.shared.stack.some((id) => s.objects[id].abilityKind === "chapter") && s.priority.holder === A,
    );
    const chapter = abilitiesOnStack(game).find((id) => game.state.objects[id].abilityKind === "chapter")!;
    activate(game, resonator, [obj(chapter)]);
    settleKeeping(game);
    expect(count(game, "Knight Token")).toBe(2);
  });

  it("a copied linked ability is linked too: Banishing Light returns both cards", () => {
    const game = setUp();
    const resonator = spawn(game, "Strionic Resonator");
    const bears = spawn(game, "Grizzly Bears", B);
    const elves = spawn(game, "Llanowar Elves", B);
    const light = game.debugSpawn("Banishing Light", A, "battlefield", { announceEntry: true });
    placeTriggers(game);
    expect(game.state.awaiting?.kind).toBe("choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(bears)] });
    activate(game, resonator, [obj(abilitiesOnStack(game)[0])]);
    game.advanceUntil(settle);
    expect(game.state.awaiting?.kind).toBe("choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(elves)] });
    game.advanceUntil(quiet);
    expect([zoneOf(game, bears), zoneOf(game, elves)]).toEqual(["exile", "exile"]);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(light)]);
    game.advanceUntil(quiet);
    expect(count(game, "Grizzly Bears", B) + count(game, "Llanowar Elves", B)).toBe(2);
  });

  it("can't copy an opponent's triggered ability", () => {
    const game = setUp();
    const resonator = spawn(game, "Strionic Resonator");
    game.debugSpawn("Elvish Visionary", B, "battlefield", { announceEntry: true });
    placeTriggers(game);
    const theirs = abilitiesOnStack(game)[0];
    expect(game.state.objects[theirs].controller).toBe(B);
    expect(() => activate(game, resonator, [obj(theirs)])).toThrow();
  });
});

describe("Peter Parker's Camera", () => {
  it("enters with three film counters; one pays to copy an activated ability, which may get a new target", () => {
    const game = setUp();
    const camera = cast(game, A, "Peter Parker's Camera");
    game.advanceUntil(quiet);
    expect(game.state.objects[camera].counters.film).toBe(3);
    const sorcerer = spawn(game, "Prodigal Sorcerer");
    const elves = spawn(game, "Llanowar Elves", B);
    activate(game, sorcerer, [player(B)]);
    // An artifact that's no creature can tap the turn it arrives.
    activate(game, camera, [obj(abilitiesOnStack(game)[0])]);
    expect(game.state.objects[camera].counters.film).toBe(2);
    game.advanceUntil(settle);
    expect(game.state.awaiting?.kind).toBe("choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(elves)] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, elves)).toBe("graveyard");
    expect(life(game, B)).toBe(19);
  });

  it("copies a triggered ability too, and with no film counter left can't be activated", () => {
    const game = setUp();
    const camera = cast(game, A, "Peter Parker's Camera");
    game.advanceUntil(quiet);
    const hand = handSize(game);
    game.debugSpawn("Elvish Visionary", A, "battlefield", { announceEntry: true });
    placeTriggers(game);
    activate(game, camera, [obj(abilitiesOnStack(game)[0])]);
    settleKeeping(game);
    expect(handSize(game)).toBe(hand + 2);
    game.state.objects[camera].tapped = false;
    game.state.objects[camera].counters.film = 0;
    game.debugSpawn("Elvish Visionary", A, "battlefield", { announceEntry: true });
    placeTriggers(game);
    expect(offersActivation(game, camera)).toBe(false);
  });

  it("a copy's new targets never include the copy itself (rule 115.5)", () => {
    const game = setUp();
    const camera = cast(game, A, "Peter Parker's Camera");
    game.advanceUntil(quiet);
    const engine = spawn(game, "Lithoform Engine");
    game.debugSpawn("Elvish Visionary", A, "battlefield", { announceEntry: true });
    placeTriggers(game);
    const trigger = abilitiesOnStack(game)[0];
    // Lithoform Engine's copy ability, aimed at the Visionary's trigger …
    activate(game, engine, [obj(trigger)]);
    const engineAbility = abilitiesOnStack(game)[1];
    // … copied by the Camera: the copy targets an ability too.
    activate(game, camera, [obj(engineAbility)]);
    game.advanceUntil(settle);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-targets");
    if (awaiting?.kind !== "choose-targets") return;
    const copy = awaiting.source;
    const offered = awaiting.options.flat().flatMap((t) => (t?.kind === "object" ? [t.object] : []));
    expect(offered).toContain(trigger);
    expect(offered).toContain(engineAbility);
    expect(offered).not.toContain(copy);
  });
});

describe("Battlemage's Bracers", () => {
  const equipBracers = (game: Game, creature: ObjectId): ObjectId => {
    const bracers = spawn(game, "Battlemage's Bracers");
    activate(game, bracers, [obj(creature)]);
    settleKeeping(game);
    expect(game.state.objects[bracers].attachedTo).toBe(creature);
    return bracers;
  };

  it("equipped creature has haste; pay {1} to copy its ability, the copy may get a new target", () => {
    const game = setUp();
    const sorcerer = game.debugSpawn("Prodigal Sorcerer", A, "battlefield", { summoningSick: true });
    expect(offersActivation(game, sorcerer)).toBe(false);
    equipBracers(game, sorcerer);
    expect(offersActivation(game, sorcerer)).toBe(true);
    const elves = spawn(game, "Llanowar Elves", B);
    activate(game, sorcerer, [player(B)]);
    game.advanceUntil(settle);
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(settle);
    expect(game.state.awaiting?.kind).toBe("choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(elves)] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, elves)).toBe("graveyard");
    expect(life(game, B)).toBe(19);
  });

  it("declined, there's no copy", () => {
    const game = setUp();
    const sorcerer = spawn(game, "Prodigal Sorcerer");
    equipBracers(game, sorcerer);
    activate(game, sorcerer, [player(B)]);
    game.advanceUntil(settle);
    game.dispatch({ type: "choose-modes", player: A, modes: [] });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(19);
    expect(game.eventsOfType("ability-copied")).toHaveLength(0);
  });
});

describe("Molten Echoes", () => {
  it("copies a nontoken creature of the chosen type — hasty, and exiled at the next end step", () => {
    const game = setUp();
    cast(game, A, "Molten Echoes");
    game.advanceUntil(settle);
    expect(game.state.awaiting?.kind).toBe("choose-creature-type");
    game.dispatch({ type: "choose-creature-type", player: A, creatureType: "Bear" });
    game.advanceUntil(quiet);
    // An Elf isn't the chosen type.
    cast(game, A, "Llanowar Elves");
    game.advanceUntil(quiet);
    expect(count(game, "Llanowar Elves")).toBe(1);
    const bears = cast(game, A, "Grizzly Bears");
    game.advanceUntil(quiet);
    expect(count(game, "Grizzly Bears")).toBe(2);
    const token = named(game, "Grizzly Bears", A).find((id) => id !== bears)!;
    expect(game.state.objects[token].isToken).toBe(true);
    expect(game.characteristics(token).keywords).toContain("haste");
    // A token of the chosen type entering doesn't trigger it: still two.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(count(game, "Grizzly Bears")).toBe(1);
    expect(zoneOf(game, bears)).toBe("battlefield");
  });
});

describe("Flameshadow Conjuring", () => {
  it("pay {R}: a hasty token copy of the nontoken creature, exiled at the next end step", () => {
    const game = setUp();
    spawn(game, "Flameshadow Conjuring");
    const sorcerer = cast(game, A, "Prodigal Sorcerer");
    game.advanceUntil(settle);
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    expect(count(game, "Prodigal Sorcerer")).toBe(2);
    const token = named(game, "Prodigal Sorcerer", A).find((id) => id !== sorcerer)!;
    expect(game.state.objects[token].isToken).toBe(true);
    // Haste: its {T} ability works the turn it arrived.
    activate(game, token, [player(B)]);
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(19);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(count(game, "Prodigal Sorcerer")).toBe(1);
    expect(zoneOf(game, sorcerer)).toBe("battlefield");
  });

  it("declined, makes nothing; the haste it gains isn't copiable", () => {
    const game = setUp();
    spawn(game, "Flameshadow Conjuring");
    cast(game, A, "Grizzly Bears");
    game.advanceUntil(settle);
    game.dispatch({ type: "choose-modes", player: A, modes: [] });
    game.advanceUntil(quiet);
    expect(count(game, "Grizzly Bears")).toBe(1);
    cast(game, A, "Grizzly Bears");
    game.advanceUntil(settle);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    const token = named(game, "Grizzly Bears", A).find((id) => game.state.objects[id].isToken)!;
    expect(game.characteristics(token).keywords).toContain("haste");
    game.debugApplyEffect(A, { kind: "create-token-copy", of: 0, count: 1 }, [obj(token)]);
    const copy = named(game, "Grizzly Bears", A).find((id) => id !== token && game.state.objects[id].isToken)!;
    expect(game.characteristics(copy).keywords).not.toContain("haste");
  });
});

describe("Increasing Vengeance", () => {
  it("cast from the hand copies your instant once; by flashback, twice", () => {
    const game = setUp();
    const bolt = cast(game, A, "Lightning Bolt", [player(B)]);
    const vengeance = cast(game, A, "Increasing Vengeance", [obj(bolt)]);
    settleKeeping(game);
    expect(life(game, B)).toBe(20 - 6);
    expect(zoneOf(game, vengeance)).toBe("graveyard");

    const second = cast(game, A, "Lightning Bolt", [player(B)]);
    game.dispatch({ type: "cast-spell", player: A, card: vengeance, targets: [obj(second)], via: "flashback" });
    settleKeeping(game);
    expect(life(game, B)).toBe(20 - 6 - 9);
    expect(zoneOf(game, vengeance)).toBe("exile");
  });

  it("each copy may get a new target of its own", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const elves = spawn(game, "Llanowar Elves", B);
    const bolt = cast(game, A, "Lightning Bolt", [player(B)]);
    const vengeance = game.debugSpawn("Increasing Vengeance", A, "graveyard");
    game.dispatch({ type: "cast-spell", player: A, card: vengeance, targets: [obj(bolt)], via: "flashback" });
    game.advanceUntil(settle);
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(bears)] });
    game.advanceUntil(settle);
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(elves)] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, bears)).toBe("graveyard");
    expect(zoneOf(game, elves)).toBe("graveyard");
    expect(life(game, B)).toBe(17);
  });

  it("a copy of one cast by flashback was never cast: it copies once", () => {
    const game = setUp();
    const bolt = cast(game, A, "Lightning Bolt", [player(B)]);
    const vengeance = game.debugSpawn("Increasing Vengeance", A, "graveyard");
    game.dispatch({ type: "cast-spell", player: A, card: vengeance, targets: [obj(bolt)], via: "flashback" });
    cast(game, A, "Reverberate", [obj(vengeance)]);
    settleKeeping(game);
    // The Bolt, two copies from the flashback cast, one from its copy.
    expect(life(game, B)).toBe(20 - 4 * 3);
  });

  it("copies an instant cast as an Adventure — an instant spell on the stack (rule 715.3b)", () => {
    const game = setUp();
    const familiar = game.debugSpawn("Frolicking Familiar", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: familiar, targets: [player(B)], face: 1 });
    cast(game, A, "Increasing Vengeance", [obj(familiar)]);
    settleKeeping(game);
    expect(life(game, B)).toBe(18);
  });

  it("can't copy a creature spell or an opponent's instant", () => {
    const game = setUp();
    const bears = cast(game, A, "Grizzly Bears");
    expect(() => cast(game, A, "Increasing Vengeance", [obj(bears)])).toThrow();
    game.advanceUntil(quiet);
    game.dispatch({ type: "pass-priority", player: A });
    const theirs = cast(game, B, "Lightning Bolt", [player(A)]);
    game.dispatch({ type: "pass-priority", player: B });
    expect(() => cast(game, A, "Increasing Vengeance", [obj(theirs)])).toThrow();
  });
});

describe("a spell's types are its face on the stack (rule 715.3b)", () => {
  it("Reverberate copies an Adventure's instant; Essence Scatter can't counter it as a creature spell", () => {
    const game = setUp();
    const familiar = game.debugSpawn("Frolicking Familiar", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: familiar, targets: [player(B)], face: 1 });
    expect(() => cast(game, A, "Essence Scatter", [obj(familiar)])).toThrow();
    cast(game, A, "Reverberate", [obj(familiar)]);
    settleKeeping(game);
    expect(life(game, B)).toBe(18);
  });
});

describe("Notion Thief", () => {
  it("spares the first card an opponent draws in their draw step, not the next", () => {
    const game = setUp();
    spawn(game, "Notion Thief");
    const [a0, b0] = [handSize(game, A), handSize(game, B)];
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "draw" && s.priority.holder === B);
    expect([handSize(game, A), handSize(game, B)]).toEqual([a0, b0 + 1]);
    game.debugApplyEffect(B, { kind: "draw", amount: 2 });
    expect([handSize(game, A), handSize(game, B)]).toEqual([a0 + 2, b0 + 1]);
  });

  it("only the draw is replaced: 'draw a card, then discard a card' still discards", () => {
    const game = setUp();
    spawn(game, "Notion Thief");
    const [a0, b0] = [handSize(game, A), handSize(game, B)];
    game.debugApplyEffect(B, {
      kind: "sequence",
      effects: [
        { kind: "draw", amount: 1 },
        { kind: "discard", target: "you", amount: 1 },
      ],
    });
    game.advanceUntil(settle);
    expect(game.state.awaiting).toMatchObject({ kind: "discard", player: B });
    game.dispatch({ type: "discard", player: B, cards: [game.state.zones.perPlayer[B].hand[0]] });
    expect([handSize(game, A), handSize(game, B)]).toEqual([a0 + 1, b0 - 1]);
  });

  it("with a Thief on each side of a duel, each applies once: the draw stays where it began", () => {
    const game = setUp();
    spawn(game, "Notion Thief", A);
    spawn(game, "Notion Thief", B);
    const [a0, b0] = [handSize(game, A), handSize(game, B)];
    game.debugApplyEffect(B, { kind: "draw", amount: 1 });
    expect([handSize(game, A), handSize(game, B)]).toEqual([a0, b0 + 1]);
    expect(game.eventsOfType("draw-redirected").map((e) => [e.from, e.to])).toEqual([
      [B, A],
      [A, B],
    ]);
  });

  it("two Thieves against one: the draw goes back and forth until it ends with the two", () => {
    const game = setUp();
    const bobs = spawn(game, "Notion Thief", B);
    // Two token copies of Bob's Thief for Alice: two effects.
    game.debugApplyEffect(A, { kind: "create-token-copy", of: 0, count: 2, who: "you" }, [obj(bobs)]);
    expect(count(game, "Notion Thief", A)).toBe(2);
    const [a0, b0] = [handSize(game, A), handSize(game, B)];
    game.debugApplyEffect(B, { kind: "draw", amount: 1 });
    // Bob → Alice → Bob → Alice: Alice's second Thief has the last word.
    expect([handSize(game, A), handSize(game, B)]).toEqual([a0 + 1, b0]);
    expect(game.eventsOfType("draw-redirected")).toHaveLength(3);
  });
});

describe("Ixhel, Scion of Atraxa", () => {
  it("flying, vigilance, toxic 2", () => {
    const game = setUp();
    const ixhel = spawn(game, "Ixhel, Scion of Atraxa");
    const ch = game.characteristics(ixhel);
    expect([...ch.keywords]).toEqual(expect.arrayContaining(["flying", "vigilance"]));
    expect(ch.toxic).toBe(2);
  });

  it("each opponent with three or more poison counters exiles their top card face down, all at once", () => {
    const game = setUp({ players: [A, B, C] });
    spawn(game, "Ixhel, Scion of Atraxa");
    game.debugApplyEffect(A, { kind: "add-player-counters", counter: "poison", amount: 3, target: 0 }, [player(B)]);
    game.debugApplyEffect(A, { kind: "add-player-counters", counter: "poison", amount: 2, target: 0 }, [player(C)]);
    const bTop = game.debugSpawn("Lightning Bolt", B, "library");
    const cTop = game.debugSpawn("Lightning Bolt", C, "library");
    game.advanceUntil((s) => s.turn.number === 2);
    expect(zoneOf(game, bTop)).toBe("exile");
    expect(game.state.objects[bTop].exiledFaceDown?.lookers).toEqual([A]);
    expect(game.state.objects[bTop].impulse).toMatchObject({ player: A, spendAs: "any-color" });
    // Carol has only two: her card stays.
    expect(zoneOf(game, cTop)).toBe("library");

    // Alice's next turn, both have three: one exile, both cards.
    game.advanceUntil((s) => s.turn.number === 4 && s.turn.step === "precombat-main" && s.priority.holder === A);
    game.debugApplyEffect(A, { kind: "add-player-counters", counter: "poison", amount: 1, target: 0 }, [player(C)]);
    const bNext = game.debugSpawn("Grizzly Bears", B, "library");
    const cNext = game.debugSpawn("Grizzly Bears", C, "library");
    const before = game.eventsOfType("cards-put-into-exile").length;
    game.advanceUntil((s) => s.turn.number === 5);
    expect(zoneOf(game, bNext)).toBe("exile");
    expect(zoneOf(game, cNext)).toBe("exile");
    const exiles = game
      .eventsOfType("cards-put-into-exile")
      .slice(before)
      .filter((e) => e.arrivals.some((x) => x.object === bNext || x.object === cNext));
    expect(exiles).toHaveLength(1);
    expect(exiles[0].arrivals.map((x) => x.object)).toEqual(expect.arrayContaining([bNext, cNext]));
  });

  it("you may cast them spending mana as though any colour — after Ixhel has left, too", () => {
    const game = setUp({ lands: [["Plains", 6]] });
    const ixhel = spawn(game, "Ixhel, Scion of Atraxa");
    game.debugApplyEffect(A, { kind: "add-player-counters", counter: "poison", amount: 3, target: 0 }, [player(B)]);
    const bolt = game.debugSpawn("Lightning Bolt", B, "library");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(zoneOf(game, bolt)).toBe("exile");
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(ixhel)]);
    expect(zoneOf(game, ixhel)).toBe("graveyard");
    game.advanceUntil((s) => s.turn.number === 2 && s.priority.holder === A);
    const offer = game
      .legalActions(A)
      .find((l) => l.kind === "cast-spell" && "card" in l && l.card === bolt);
    expect(offer).toBeDefined();
    if (offer?.kind !== "cast-spell") return;
    // Bob can't: the permission is Alice's.
    expect(game.legalActions(B).some((l) => l.kind === "cast-spell" && "card" in l && l.card === bolt)).toBe(false);
    game.dispatch({ type: "cast-spell", player: A, card: bolt, targets: [player(B)], via: offer.via });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(17);
  });

  it("an opponent with fewer than three exiles nothing — nor do you, however poisoned", () => {
    const game = setUp();
    spawn(game, "Ixhel, Scion of Atraxa");
    game.debugApplyEffect(A, { kind: "add-player-counters", counter: "poison", amount: 2, target: 0 }, [player(B)]);
    game.debugApplyEffect(A, { kind: "add-player-counters", counter: "poison", amount: 5, target: 0 }, [player(A)]);
    const top = game.debugSpawn("Lightning Bolt", B, "library");
    const yours = game.debugSpawn("Lightning Bolt", A, "library");
    game.advanceUntil((s) => s.turn.number === 2);
    expect(zoneOf(game, top)).toBe("library");
    expect(zoneOf(game, yours)).toBe("library");
  });
});
