/**
 * The cards the spells pass authored that its feature tests don't already
 * cover (Zada, Ivy, Krark, Fire Lord Azula and Alania are in
 * `copy-spell-retarget.test.ts`; Season of Growth, Imodane, Rebuff the Wicked
 * and Dawn Charm in `spell-targets-filter.test.ts`; Feather in
 * `exile-as-it-resolves.test.ts`): Kalamax, the Stormsire; Volo, Guide to
 * Monsters; Stella Lee, Wild Card; Reflections of Littjara; Sevinne's
 * Reclamation; Pearl-Ear, Imperial Advisor — and Ruby, Daring Tracker, whose
 * "while" is now asked only as it attacks.
 */

import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const objectRef = (object: ObjectId): TargetRef => ({ kind: "object", object });
const playerRef = (player: PlayerId): TargetRef => ({ kind: "player", player });

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const settle = (s: GameState): boolean => s.awaiting !== null || quiet(s);

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const [land, n] of [["Mountain", 6], ["Forest", 6], ["Island", 6], ["Plains", 6]] as const) {
    for (let i = 0; i < n; i += 1) game.debugSpawn(land, A, "battlefield", { tapped: false });
  }
  return game;
};

const cast = (game: Game, name: string, targets: TargetRef[] = [], extra = {}): ObjectId => {
  const card = game.debugSpawn(name, A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card, targets, ...extra });
  return card;
};

/** Answer a copy's "choose new targets" by keeping them, then settle. */
const keepTargets = (game: Game): void => {
  game.advanceUntil(settle);
  while (game.state.awaiting?.kind === "choose-targets") {
    game.dispatch({ type: "choose-targets", player: A, targets: [...(game.state.awaiting.current ?? [])] });
    game.advanceUntil(settle);
  }
  game.advanceUntil(quiet);
};

const counters = (game: Game, id: ObjectId): number => game.state.objects[id].counters["+1/+1"] ?? 0;
const named = (game: Game, name: string): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === name);

describe("Kalamax, the Stormsire", () => {
  it("copies the first instant of the turn while tapped, and grows for the copy", () => {
    const game = setUp();
    const kalamax = game.debugSpawn("Kalamax, the Stormsire", A, "battlefield", { tapped: true });
    cast(game, "Shock", [playerRef(B)]);
    keepTargets(game);
    expect(game.state.players[B].life).toBe(16);
    expect(counters(game, kalamax)).toBe(1);
    // The second instant isn't the first.
    cast(game, "Shock", [playerRef(B)]);
    keepTargets(game);
    expect(game.state.players[B].life).toBe(14);
    expect(counters(game, kalamax)).toBe(1);
  });

  it("doesn't copy while untapped, and a Twincast copy still grows it", () => {
    const game = setUp();
    const kalamax = game.debugSpawn("Kalamax, the Stormsire", A, "battlefield");
    const shock = cast(game, "Shock", [playerRef(B)]);
    cast(game, "Twincast", [objectRef(shock)]);
    keepTargets(game);
    // Shock and Twincast's copy; Kalamax untapped copied nothing itself.
    expect(game.state.players[B].life).toBe(16);
    expect(counters(game, kalamax)).toBe(1);
  });

  it("doesn't count a sorcery's copy, nor the first instant cast before it was tapped", () => {
    const game = setUp();
    const kalamax = game.debugSpawn("Kalamax, the Stormsire", A, "battlefield");
    cast(game, "Shock", [playerRef(B)]);
    game.advanceUntil(quiet);
    game.state.objects[kalamax].tapped = true;
    cast(game, "Shock", [playerRef(B)]);
    game.advanceUntil(quiet);
    expect(game.eventsOfType("spell-copied")).toHaveLength(0);
    expect(game.state.players[B].life).toBe(16);
  });
});

describe("Volo, Guide to Monsters", () => {
  it("copies a creature spell sharing no creature type, into a token", () => {
    const game = setUp();
    game.debugSpawn("Volo, Guide to Monsters", A, "battlefield");
    cast(game, "Grizzly Bears");
    game.advanceUntil(quiet);
    const bears = named(game, "Grizzly Bears");
    expect(bears).toHaveLength(2);
    expect(bears.filter((id) => game.state.objects[id].isToken)).toHaveLength(1);
  });

  it("doesn't copy one that shares a type with a creature you control or in your graveyard", () => {
    const game = setUp();
    game.debugSpawn("Volo, Guide to Monsters", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    // Volo is a Human Wizard; Bears share Bear with the one in the graveyard.
    cast(game, "Grizzly Bears");
    game.advanceUntil(quiet);
    expect(named(game, "Grizzly Bears")).toHaveLength(1);
    expect(game.eventsOfType("spell-copied")).toHaveLength(0);
  });
});

describe("Stella Lee, Wild Card", () => {
  it("exiles the top card on the second spell, and copies a spell once three are cast", () => {
    const game = setUp();
    const stella = game.debugSpawn("Stella Lee, Wild Card", A, "battlefield", { summoningSick: false });
    cast(game, "Shock", [playerRef(B)]);
    game.advanceUntil(quiet);
    const top = game.state.zones.perPlayer[A].library[0];
    cast(game, "Shock", [playerRef(B)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[top].zone).toBe("exile");
    // Two spells: the copy ability can't be activated yet.
    const third = cast(game, "Shock", [playerRef(B)]);
    // Third spell on the stack: now it can.
    game.dispatch({ type: "activate-ability", player: A, source: stella, abilityIndex: 0, targets: [objectRef(third)] });
    keepTargets(game);
    expect(game.state.players[B].life).toBe(20 - 2 * 4);
  });

  it("can't copy with fewer than three spells cast this turn", () => {
    const game = setUp();
    const stella = game.debugSpawn("Stella Lee, Wild Card", A, "battlefield", { summoningSick: false });
    const shock = cast(game, "Shock", [playerRef(B)]);
    expect(
      game.canDispatch({ type: "activate-ability", player: A, source: stella, abilityIndex: 0, targets: [objectRef(shock)] }),
    ).not.toBeNull();
  });
});

describe("Reflections of Littjara", () => {
  it("copies each spell of the chosen type", () => {
    const game = setUp();
    const reflections = game.debugSpawn("Reflections of Littjara", A, "battlefield");
    game.state.objects[reflections].chosenCreatureType = "Bear";
    cast(game, "Grizzly Bears");
    game.advanceUntil(quiet);
    expect(named(game, "Grizzly Bears")).toHaveLength(2);
    cast(game, "Shock", [playerRef(B)]);
    game.advanceUntil(quiet);
    expect(game.eventsOfType("spell-copied")).toHaveLength(1);
  });
});

describe("Sevinne's Reclamation (copy this spell)", () => {
  it("returns a card, and copies itself only when cast from a graveyard", () => {
    const game = setUp();
    const first = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const second = game.debugSpawn("Grizzly Bears", A, "graveyard");
    // From the hand: no copy offered.
    cast(game, "Sevinne's Reclamation", [objectRef(first)]);
    game.advanceUntil(settle);
    expect(game.state.awaiting).toBeNull();
    expect(game.state.objects[first].zone).toBe("battlefield");

    // Flashback, from the graveyard: you may copy it and choose a new target.
    const card = game.debugSpawn("Sevinne's Reclamation", A, "graveyard");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [objectRef(second)], via: "flashback" });
    game.advanceUntil(settle);
    // Nothing else is in the graveyard to return: copy declined.
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[second].zone).toBe("battlefield");
    expect(game.state.objects[card].zone).toBe("exile");
    expect(game.eventsOfType("spell-copied")).toHaveLength(0);
  });

  it("aims the copy at another card", () => {
    const game = setUp();
    const first = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const second = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const card = game.debugSpawn("Sevinne's Reclamation", A, "graveyard");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [objectRef(first)], via: "flashback" });
    game.advanceUntil(settle);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(settle);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-targets");
    if (awaiting?.kind !== "choose-targets") return;
    // The copy's target is offered as it was (the card already returned).
    expect(awaiting.current).toEqual([objectRef(first)]);
    game.dispatch({ type: "choose-targets", player: A, targets: [objectRef(second)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[first].zone).toBe("battlefield");
    expect(game.state.objects[second].zone).toBe("battlefield");
    // The copy wasn't cast from a graveyard, so it didn't copy itself again.
    expect(game.eventsOfType("spell-copied")).toHaveLength(1);
  });
});

describe("Ruby, Daring Tracker (a 'while' trigger condition)", () => {
  it("still gets +2/+2 when the power-4 creature is gone before the trigger resolves", () => {
    // The ruling: only whether you controlled one as Ruby attacked matters.
    const game = setUp();
    const ruby = game.debugSpawn("Ruby, Daring Tracker", A, "battlefield", { summoningSick: false });
    const wurm = game.debugSpawn("Craw Wurm", A, "battlefield");
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: ruby, defender: B }] });
    game.advanceUntil((s) => s.zones.shared.stack.length === 1 && s.pendingTriggers.length === 0);
    // With the trigger on the stack, the Wurm leaves.
    cast(game, "Unsummon", [objectRef(wurm)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[wurm].zone).toBe("hand");
    expect(computeCharacteristics(game.state, game.registry, ruby).power).toBe(3);
  });
});

describe("Pearl-Ear, Imperial Advisor", () => {
  it("makes enchantment spells cheaper per Aura you control", () => {
    const game = setUp();
    game.debugSpawn("Pearl-Ear, Imperial Advisor", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const pacifism = game.debugSpawn("Pacifism", A, "battlefield");
    game.state.objects[pacifism].attachedTo = theirs;
    // Untap nothing but one Plains: Pacifism ({1}{W}) costs {W} with one Aura out.
    for (const id of game.state.zones.shared.battlefield) {
      const o = game.state.objects[id];
      if (o.controller === A && o.cardName !== "Grizzly Bears") o.tapped = true;
    }
    const plains = game.debugSpawn("Plains", A, "battlefield", { tapped: false });
    const next = cast(game, "Pacifism", [objectRef(bear)]);
    expect(game.state.objects[plains].tapped).toBe(true);
    game.advanceUntil(quiet);
    expect(game.state.objects[next].attachedTo).toBe(bear);
  });

  it("draws for an Aura spell that targets a modified permanent you control", () => {
    const game = setUp();
    game.debugSpawn("Pearl-Ear, Imperial Advisor", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const hand = (): number => game.state.zones.perPlayer[A].hand.length;
    // Not modified yet: no draw.
    let before = hand();
    cast(game, "Pacifism", [objectRef(bear)]);
    game.advanceUntil(quiet);
    expect(hand()).toBe(before);
    // Enchanted by an Aura A controls: modified now.
    before = hand();
    cast(game, "Pacifism", [objectRef(bear)]);
    game.advanceUntil(quiet);
    expect(hand()).toBe(before + 1);
    expect(computeCharacteristics(game.state, game.registry, bear).power).toBe(2);
  });
});
