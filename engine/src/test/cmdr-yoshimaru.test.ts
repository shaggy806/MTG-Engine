import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { computeCharacteristics } from "../characteristics.js";
import { validateCommanderDeck } from "../deck-validation.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

/**
 * Yoshimaru, Ever Faithful — {W} 1/1 legendary Dog.
 *   Whenever another legendary permanent you control enters, put a +1/+1
 *   counter on Yoshimaru.
 *   Partner
 */

const YOSHIMARU = "Yoshimaru, Ever Faithful";
const reg = createDefaultRegistry();
const [A, B, C] = ["alice", "bob", "carol"].map(asPlayerId);

function table(players: readonly PlayerId[] = [A, B]): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: players.map((player) => ({ player, cards: Array(60).fill("Mountain") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

/** Passes until the stack and the trigger queue are empty. */
function settle(game: Game): void {
  for (let i = 0; i < 200; i += 1) {
    const awaiting = game.state.awaiting;
    if (awaiting !== null) throw new Error(`unexpected ${awaiting.kind}`);
    if (game.state.zones.shared.stack.length === 0 && game.state.pendingTriggers.length === 0) {
      return;
    }
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
  }
  throw new Error("never settled");
}

/**
 * Put a permanent onto the battlefield *and announce the entry*, so ETBs fire,
 * then let whatever it raised go on the stack and resolve.
 *
 * `advanceUntil` rather than a hand-rolled pass loop: a trigger costs a couple
 * of priority passes to place and resolve, and passing by hand walks the game
 * out of the main phase and into an unanswered `declare-attackers` after two
 * or three entries. The default controllers answer those; the predicate is
 * already true when nothing triggered, so a non-legendary entry costs nothing.
 */
function enters(game: Game, name: string, player: PlayerId): ObjectId {
  const id = game.debugSpawn(name, player, "battlefield", { announceEntry: true });
  game.advanceUntil(
    (s) =>
      s.awaiting === null && s.pendingTriggers.length === 0 && s.zones.shared.stack.length === 0,
  );
  return id;
}

function lands(game: Game, name: string, player: PlayerId, n: number): void {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, player, "battlefield");
}

const counters = (game: Game, id: ObjectId): number =>
  game.state.objects[id].counters["+1/+1"] ?? 0;

describe("Yoshimaru, Ever Faithful", () => {
  it("is a mono-white 1/1 legendary Dog for {W}", () => {
    const game = table();
    const yoshi = game.debugSpawn(YOSHIMARU, A, "battlefield", { summoningSick: false });
    const c = computeCharacteristics(game.state, reg, yoshi);
    expect(c.power).toBe(1);
    expect(c.toughness).toBe(1);
    expect(c.types).toContain("creature");
    expect(c.subtypes).toContain("Dog");
    const def = reg.get(YOSHIMARU);
    expect(def.manaCost).toBe("{W}");
    expect(def.colors).toEqual(["W"]);
    expect(def.supertypes).toContain("legendary");
  });

  it("another legendary creature entering under your control grows it", () => {
    const game = table();
    const yoshi = game.debugSpawn(YOSHIMARU, A, "battlefield", { summoningSick: false });
    expect(counters(game, yoshi)).toBe(0);

    enters(game, "Krenko, Mob Boss", A);
    expect(counters(game, yoshi)).toBe(1);
    expect(computeCharacteristics(game.state, reg, yoshi).power).toBe(2);
    expect(computeCharacteristics(game.state, reg, yoshi).toughness).toBe(2);
  });

  it("counts *permanents*, not just creatures — a land, an artifact-enchantment and a planeswalker each count", () => {
    const game = table();
    const yoshi = game.debugSpawn(YOSHIMARU, A, "battlefield", { summoningSick: false });

    enters(game, "Phyrexian Tower", A); // legendary land
    expect(counters(game, yoshi)).toBe(1);

    enters(game, "Whip of Erebos", A); // legendary artifact enchantment
    expect(counters(game, yoshi)).toBe(2);

    enters(game, "Garruk Wildspeaker", A); // legendary planeswalker
    expect(counters(game, yoshi)).toBe(3);

    expect(computeCharacteristics(game.state, reg, yoshi).power).toBe(4);
  });

  it("NEGATIVE: a non-legendary permanent you control gives nothing, however many enter", () => {
    const game = table();
    const yoshi = game.debugSpawn(YOSHIMARU, A, "battlefield", { summoningSick: false });

    enters(game, "Grizzly Bears", A); // creature
    enters(game, "Mountain", A); // land
    enters(game, "Sol Ring", A); // artifact
    enters(game, "Exploration", A); // enchantment
    expect(counters(game, yoshi)).toBe(0);
    expect(computeCharacteristics(game.state, reg, yoshi).power).toBe(1);
  });

  it("NEGATIVE: a legendary permanent an opponent controls gives nothing", () => {
    const game = table();
    const yoshi = game.debugSpawn(YOSHIMARU, A, "battlefield", { summoningSick: false });

    enters(game, "Krenko, Mob Boss", B);
    enters(game, "Phyrexian Tower", B);
    expect(counters(game, yoshi)).toBe(0);

    // …and the same names under A's control do count, so the only difference
    // tested above is the controller.
    enters(game, "Thalia, Guardian of Thraben", A);
    expect(counters(game, yoshi)).toBe(1);
  });

  it("NEGATIVE: Yoshimaru's own entry doesn't count ('another')", () => {
    const game = table();
    const yoshi = game.debugSpawn(YOSHIMARU, A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.zones.shared.stack).toHaveLength(0);
    expect(counters(game, yoshi)).toBe(0);
  });

  it("NEGATIVE: doesn't trigger while it is in the command zone or in hand", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      decks: [
        { player: A, cards: Array(60).fill("Mountain"), commanders: [YOSHIMARU] },
        { player: B, cards: Array(60).fill("Mountain") },
      ],
    });
    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
    const inCommand = game.state.zones.shared.command.find(
      (id) => game.state.objects[id].cardName === YOSHIMARU,
    );
    expect(inCommand).toBeDefined();
    const inHand = game.debugSpawn(YOSHIMARU, A, "hand");

    enters(game, "Krenko, Mob Boss", A);
    expect(game.state.zones.shared.stack).toHaveLength(0);
    expect(counters(game, inCommand as ObjectId)).toBe(0);
    expect(counters(game, inHand)).toBe(0);
  });

  it("fires off a real cast and off a real land drop, not just a spawned entry", () => {
    const game = table();
    const yoshi = game.debugSpawn(YOSHIMARU, A, "battlefield", { summoningSick: false });
    lands(game, "Forest", A, 1);
    lands(game, "Plains", A, 1);

    // Cast a legendary creature the ordinary way.
    const emmara = game.debugSpawn("Emmara, Soul of the Accord", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: emmara, targets: [] });
    settle(game);
    expect(game.state.objects[emmara].zone).toBe("battlefield");
    expect(counters(game, yoshi)).toBe(1);

    // Play a legendary land as this turn's land drop.
    const tower = game.debugSpawn("Phyrexian Tower", A, "hand");
    game.dispatch({ type: "play-land", player: A, card: tower });
    settle(game);
    expect(game.state.objects[tower].zone).toBe("battlefield");
    expect(counters(game, yoshi)).toBe(2);
  });

  it("the trigger uses the stack: it can be responded to, and each entry gives exactly one counter", () => {
    const game = table();
    const yoshi = game.debugSpawn(YOSHIMARU, A, "battlefield", { summoningSick: false });

    const krenko = game.debugSpawn("Krenko, Mob Boss", A, "battlefield", { announceEntry: true });
    // The trigger waits to be placed, then goes on the stack as an ability
    // Yoshimaru is the source of — it isn't applied as the permanent enters.
    expect(game.state.pendingTriggers).toHaveLength(1);
    expect(counters(game, yoshi)).toBe(0);

    game.advanceUntil((s) => s.zones.shared.stack.length > 0);
    const trigger = game.state.objects[game.state.zones.shared.stack[0]];
    expect(trigger.kind).toBe("ability");
    expect(trigger.sourceObjectId).toBe(yoshi);
    expect(counters(game, yoshi)).toBe(0);

    settle(game);
    expect(counters(game, yoshi)).toBe(1);
    expect(game.state.objects[krenko].zone).toBe("battlefield");

    // Three more entries, three more counters — never two for one.
    enters(game, "Sheoldred, the Apocalypse", A);
    enters(game, "Boseiju, Who Endures", A);
    enters(game, "Azusa, Lost but Seeking", A);
    expect(counters(game, yoshi)).toBe(4);
    expect(computeCharacteristics(game.state, reg, yoshi).power).toBe(5);
  });

  it("counters are permanent, and survive the turn", () => {
    const game = table();
    const yoshi = game.debugSpawn(YOSHIMARU, A, "battlefield", { summoningSick: false });
    enters(game, "Krenko, Mob Boss", A);
    enters(game, "Phyrexian Tower", A);
    expect(counters(game, yoshi)).toBe(2);

    const turn = game.state.turn.number;
    game.advanceUntil((s) => s.turn.number > turn + 1 || s.result.over);
    expect(counters(game, yoshi)).toBe(2);
    expect(computeCharacteristics(game.state, reg, yoshi).power).toBe(3);
  });

  it("a three-player table: only the controller's own entries count", () => {
    const game = table([A, B, C]);
    const yoshi = game.debugSpawn(YOSHIMARU, A, "battlefield", { summoningSick: false });
    enters(game, "Krenko, Mob Boss", B);
    enters(game, "Thalia, Guardian of Thraben", C);
    expect(counters(game, yoshi)).toBe(0);
    enters(game, "Azusa, Lost but Seeking", A);
    expect(counters(game, yoshi)).toBe(1);
  });
});

describe("Yoshimaru as a Partner commander", () => {
  it("pairs with another Partner commander in deck validation", () => {
    const r = validateCommanderDeck(
      {
        commanders: [YOSHIMARU, "Kraum, Ludevic's Opus"],
        cards: [
          "Counterspell",
          "Lightning Bolt",
          "Swords to Plowshares",
          ...Array<string>(95).fill("Island"),
        ],
        size: 100,
      },
      reg,
    );
    expect(r.violations).toEqual([]);
    expect(r.legal).toBe(true);
    expect(r.identity).toBe("WUR");
  });

  it("is a legal mono-white commander on its own", () => {
    const r = validateCommanderDeck(
      {
        commanders: [YOSHIMARU],
        cards: ["Swords to Plowshares", "Glorious Anthem", ...Array<string>(97).fill("Plains")],
        size: 100,
      },
      reg,
    );
    expect(r.violations).toEqual([]);
    expect(r.legal).toBe(true);
    expect(r.identity).toBe("W");
  });

  it("is castable from the command zone and grows from there on", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      decks: [
        { player: A, cards: Array(60).fill("Mountain"), commanders: [YOSHIMARU] },
        { player: B, cards: Array(60).fill("Mountain") },
      ],
    });
    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
    const yoshi = game.state.zones.shared.command.find(
      (id) => game.state.objects[id].cardName === YOSHIMARU,
    );
    if (yoshi === undefined) throw new Error("no Yoshimaru in the command zone");
    expect(game.state.objects[yoshi].isCommander).toBe(true);

    lands(game, "Plains", A, 1);
    game.dispatch({ type: "cast-spell", player: A, card: yoshi, targets: [] });
    settle(game);
    expect(game.state.objects[yoshi].zone).toBe("battlefield");
    expect(game.state.players[A].commanderCastCounts[YOSHIMARU]).toBe(1);

    enters(game, "Krenko, Mob Boss", A);
    expect(counters(game, yoshi)).toBe(1);
  });
});
