/**
 * `others-enter-battlefield` — an enters-battlefield replacement (rule 614.1c)
 * a permanent applies to *other* permanents as they enter, and the
 * simultaneous-entry batch that says which of them are "already" here.
 *
 * - Giada, Font of Hope: other Angels you control enter with a +1/+1 counter
 *   per Angel you *already* control, counted as each enters.
 * - The Wandering Minstrel / Spelunking: lands you control enter untapped,
 *   beating every "enters tapped" and a shock land's life payment.
 * - Thalia, Heretic Cathar / Authority of the Consuls: an opponent's
 *   permanents enter tapped, even a land whose "unless" condition holds.
 * - Rule 614.12 and the rulings: none of them applies to its own source, to
 *   anything entering at the same time as its source, and nothing entering
 *   alongside the permanent counts as already controlled.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { defineCard } from "../cards/define.js";
import { computeCharacteristics } from "../characteristics.js";
import type { CardFilter } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const GIADA = "Giada, Font of Hope";
const MINSTREL = "The Wandering Minstrel";
const THALIA = "Thalia, Heretic Cathar";
const TOWN = "Test Town";
const ANGEL_TOKEN = "Test Angel Token";

const registry = createDefaultRegistry();
// No Town and no Angel token is in the pool yet.
registry.register(
  defineCard({ name: TOWN, types: ["land"], subtypes: ["Town"] }),
);
registry.register(
  defineCard({
    name: ANGEL_TOKEN,
    colors: ["W"],
    types: ["creature"],
    subtypes: ["Angel"],
    power: 4,
    toughness: 4,
    keywords: ["flying"],
    text: "Flying",
  }),
);

const mkGame = (): Game => {
  const game = Game.create({
    seed: 7,
    shuffle: false,
    startingPlayer: A,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Plains") },
      { player: B, cards: Array<string>(40).fill("Plains") },
    ],
  });
  game.advanceUntil(atMain);
  return game;
};

const atMain = (s: GameState): boolean =>
  s.turn.step === "precombat-main" && s.priority.holder === A;
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: true });

/** The white-box entry points the batch tests drive directly. */
interface Internals {
  createTokens(controller: PlayerId, token: string, count: number, tapped?: boolean): void;
  returnFromGraveyardByEffect(
    player: PlayerId,
    filter: CardFilter,
    destination: "battlefield" | "hand",
    count: number | "all",
    enterTapped: boolean,
  ): void;
  putOntoBattlefieldByEffect(
    target: TargetRef,
    controller: PlayerId,
    underYourControl: boolean,
    enterTapped: boolean,
  ): void;
  completeFlickerReturn(ids: readonly ObjectId[]): void;
}
const internals = (game: Game): Internals => game as unknown as Internals;

const plusOnes = (game: Game, id: ObjectId): number =>
  game.state.objects[id].counters["+1/+1"] ?? 0;
const battlefieldNamed = (game: Game, name: string, controller: PlayerId = A): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === name && game.state.objects[id].controller === controller,
  );

describe("Giada, Font of Hope", () => {
  it("gives each other Angel you control a +1/+1 counter per Angel you already control, Giada included", () => {
    const game = mkGame();
    const giada = spawn(game, GIADA);
    const first = spawn(game, "Serra Angel");
    const second = spawn(game, "Serra Angel");
    expect(plusOnes(game, first)).toBe(1); // Giada
    expect(plusOnes(game, second)).toBe(2); // Giada and the first Serra
    expect(plusOnes(game, giada)).toBe(0);
    expect(computeCharacteristics(game.state, registry, second).power).toBe(6);
  });

  it("doesn't apply to Giada herself, however many Angels are already there", () => {
    const game = mkGame();
    spawn(game, "Serra Angel");
    spawn(game, "Serra Angel");
    const giada = spawn(game, GIADA);
    expect(plusOnes(game, giada)).toBe(0);
  });

  it("reaches only Angels, and only yours", () => {
    const game = mkGame();
    spawn(game, GIADA);
    spawn(game, "Serra Angel");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Serra Angel", B);
    expect(plusOnes(game, bears)).toBe(0);
    expect(plusOnes(game, theirs)).toBe(0);
  });

  it("doesn't count Angels entering alongside the one entering", () => {
    const game = mkGame();
    spawn(game, GIADA);
    const a = game.debugSpawn("Serra Angel", A, "graveyard");
    const b = game.debugSpawn("Serra Angel", A, "graveyard");
    internals(game).returnFromGraveyardByEffect(A, { type: "creature" }, "battlefield", "all", false);
    // Each is counted against Giada alone, not against the other.
    expect(game.state.objects[a].zone).toBe("battlefield");
    expect(plusOnes(game, a)).toBe(1);
    expect(plusOnes(game, b)).toBe(1);
  });

  it("doesn't reach an Angel entering at the same time as Giada", () => {
    const game = mkGame();
    spawn(game, "Serra Angel");
    const giada = game.debugSpawn(GIADA, A, "graveyard");
    const serra = game.debugSpawn("Serra Angel", A, "graveyard");
    internals(game).returnFromGraveyardByEffect(A, { type: "creature" }, "battlefield", "all", false);
    expect(game.state.objects[giada].zone).toBe("battlefield");
    expect(plusOnes(game, serra)).toBe(0);
    expect(plusOnes(game, giada)).toBe(0);
  });

  it("gives a batch of Angel tokens one count, minted singly or folded into a stack", () => {
    const game = mkGame();
    spawn(game, GIADA);
    spawn(game, "Serra Angel");
    internals(game).createTokens(A, ANGEL_TOKEN, 2);
    const pair = battlefieldNamed(game, ANGEL_TOKEN);
    expect(pair).toHaveLength(2);
    expect(pair.map((id) => plusOnes(game, id))).toEqual([2, 2]);

    // Ten more: a stack of ten, each counting the four Angels already here.
    internals(game).createTokens(A, ANGEL_TOKEN, 10);
    const stack = battlefieldNamed(game, ANGEL_TOKEN).find(
      (id) => (game.state.objects[id].stackCount ?? 1) > 1,
    );
    expect(stack).toBeDefined();
    expect(game.state.objects[stack!].stackCount).toBe(10);
    expect(plusOnes(game, stack!)).toBe(4);
  });

  it("reaches an Angel put onto the battlefield under your control, and not one returned under its owner's", () => {
    const game = mkGame();
    spawn(game, GIADA);
    spawn(game, "Serra Angel");
    const stolen = game.debugSpawn("Serra Angel", B, "graveyard");
    internals(game).putOntoBattlefieldByEffect({ kind: "object", object: stolen }, A, true, false);
    expect(game.state.objects[stolen].controller).toBe(A);
    expect(plusOnes(game, stolen)).toBe(2);

    const theirs = game.debugSpawn("Serra Angel", B, "graveyard");
    internals(game).putOntoBattlefieldByEffect({ kind: "object", object: theirs }, B, false, false);
    expect(plusOnes(game, theirs)).toBe(0);
  });

  it("puts those counters on an Angel reanimated under your control as yours, for your triggers", () => {
    const game = mkGame();
    // Shalai first, so Giada's counters don't go on Shalai itself (it's an
    // Angel too) and set off a trigger of their own.
    spawn(game, "Shalai and Hallar");
    spawn(game, GIADA);
    const life = game.state.players[B].life;
    const stolen = game.debugSpawn("Serra Angel", B, "graveyard");
    internals(game).putOntoBattlefieldByEffect({ kind: "object", object: stolen }, A, true, false);
    expect(plusOnes(game, stolen)).toBe(2);
    // "Whenever one or more +1/+1 counters are put on a creature you
    // control": the Angel was entering under Alice's control when they were.
    game.advanceUntil(settled);
    expect(game.state.players[B].life).toBe(life - 2);
    expect(game.state.objects[stolen].controller).toBe(A);
  });

  it("is doubled by Doubling Season, like any enters-with-counters", () => {
    const game = mkGame();
    spawn(game, GIADA);
    spawn(game, "Doubling Season");
    const serra = spawn(game, "Serra Angel");
    expect(plusOnes(game, serra)).toBe(2);
  });

  it("announces the counters it entered with once, alongside the entry", () => {
    const game = mkGame();
    spawn(game, GIADA);
    spawn(game, "Serra Angel");
    const before = game.state.eventLog.length;
    const serra = enter(game, "Serra Angel");
    const added = game.state.eventLog
      .slice(before)
      .filter((e) => e.type === "counter-added" && e.object === serra);
    expect(added).toEqual([expect.objectContaining({ counter: "+1/+1", amount: 2 })]);
  });

  it("makes mana only Angel spells can spend", () => {
    const game = mkGame();
    spawn(game, GIADA);
    for (let i = 0; i < 4; i += 1) spawn(game, "Plains");
    const serra = game.debugSpawn("Serra Angel", A, "hand");
    const kenrith = game.debugSpawn("Kenrith, the Returned King", A, "hand");
    const castable = new Set(
      game
        .legalActions(A)
        .flatMap((a) => (a.kind === "cast-spell" ? [a.card] : [])),
    );
    // Both cost five; only the Angel may use Giada's {W} to get there.
    expect(castable.has(serra)).toBe(true);
    expect(castable.has(kenrith)).toBe(false);
  });
});

describe("The Wandering Minstrel — lands you control enter untapped", () => {
  it("untaps a land that enters tapped by its own ability, and only yours", () => {
    const game = mkGame();
    spawn(game, MINSTREL);
    const mine = spawn(game, "Cinder Barrens");
    const theirs = spawn(game, "Cinder Barrens", B);
    expect(game.state.objects[mine].tapped).toBe(false);
    expect(game.state.objects[theirs].tapped).toBe(true);
  });

  it("puts a shock land down untapped without asking for life", () => {
    const game = mkGame();
    spawn(game, MINSTREL);
    const crypt = game.debugSpawn("Blood Crypt", A, "hand");
    const life = game.state.players[A].life;
    game.dispatch({ type: "play-land", player: A, card: crypt });
    expect(game.state.awaiting).toBeNull();
    expect(game.state.objects[crypt].tapped).toBe(false);
    expect(game.state.players[A].life).toBe(life);
  });

  it("overrides an effect's 'put it onto the battlefield tapped'", () => {
    const game = mkGame();
    spawn(game, MINSTREL);
    for (let i = 0; i < 3; i += 1) spawn(game, "Forest");
    const cultivate = game.debugSpawn("Cultivate", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: cultivate });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-from-zone") throw new Error("no search");
    const [toBattlefield, toHand] = awaiting.eligible;
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [toBattlefield, toHand] });
    expect(game.state.objects[toBattlefield].zone).toBe("battlefield");
    expect(game.state.objects[toBattlefield].tapped).toBe(false);
    expect(game.state.objects[toHand].zone).toBe("hand");
  });

  it("doesn't reach a land entering at the same time as the Minstrel", () => {
    const game = mkGame();
    const minstrel = game.debugSpawn(MINSTREL, A, "graveyard");
    const barrens = game.debugSpawn("Cinder Barrens", A, "graveyard");
    internals(game).returnFromGraveyardByEffect(
      A,
      { anyOf: [{ type: "creature" }, { type: "land" }] },
      "battlefield",
      "all",
      false,
    );
    expect(game.state.objects[minstrel].zone).toBe("battlefield");
    expect(game.state.objects[barrens].tapped).toBe(true);

    // Once it's there, the next one does enter untapped.
    const next = spawn(game, "Cinder Barrens");
    expect(game.state.objects[next].tapped).toBe(false);
  });

  it("beats an opponent's Thalia for your nonbasic land, but not for your creature", () => {
    const game = mkGame();
    spawn(game, THALIA, B);
    spawn(game, MINSTREL);
    const land = spawn(game, "Cinder Barrens");
    const bears = spawn(game, "Grizzly Bears");
    expect(game.state.objects[land].tapped).toBe(false);
    expect(game.state.objects[bears].tapped).toBe(true);
  });
});

describe("The Wandering Minstrel — Towns", () => {
  it("makes a 2/2 all-colors Elemental at the beginning of combat with five Towns, not four", () => {
    const game = mkGame();
    spawn(game, MINSTREL);
    for (let i = 0; i < 4; i += 1) spawn(game, TOWN);
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(battlefieldNamed(game, "Elemental Token (All Colors)")).toHaveLength(0);

    // A's next turn, with a fifth Town.
    game.advanceUntil((s) => s.turn.number === 2);
    spawn(game, TOWN);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "postcombat-main");
    const tokens = battlefieldNamed(game, "Elemental Token (All Colors)");
    expect(tokens).toHaveLength(1);
    const token = computeCharacteristics(game.state, registry, tokens[0]);
    expect([token.power, token.toughness]).toEqual([2, 2]);
    expect([...token.colors].sort()).toEqual(["B", "G", "R", "U", "W"]);
  });

  it("gives the other creatures +X/+X for X Towns, counted once as it resolves", () => {
    const game = mkGame();
    const minstrel = spawn(game, MINSTREL);
    const bears = spawn(game, "Grizzly Bears");
    for (let i = 0; i < 3; i += 1) spawn(game, TOWN);
    for (const land of ["Plains", "Plains", "Plains", "Plains", "Island", "Swamp", "Mountain", "Forest"]) {
      spawn(game, land);
    }
    game.dispatch({ type: "activate-ability", player: A, source: minstrel, abilityIndex: 0 });
    game.advanceUntil(settled);
    const pt = (id: ObjectId): [number, number] => {
      const c = computeCharacteristics(game.state, registry, id);
      return [c.power, c.toughness];
    };
    expect(pt(bears)).toEqual([5, 5]);
    expect(pt(minstrel)).toEqual([1, 3]); // "other"
    spawn(game, TOWN);
    expect(pt(bears)).toEqual([5, 5]);
  });
});

describe("Thalia, Heretic Cathar — an opponent's creatures and nonbasic lands enter tapped", () => {
  it("taps an opponent's creature and nonbasic land, but not a basic, nor your own", () => {
    const game = mkGame();
    spawn(game, THALIA);
    const bears = spawn(game, "Grizzly Bears", B);
    const basic = spawn(game, "Plains", B);
    const mine = spawn(game, "Grizzly Bears");
    // Clifftop Retreat's condition holds (they control a Plains), and it
    // enters tapped anyway.
    const retreat = spawn(game, "Clifftop Retreat", B);
    expect(game.state.objects[bears].tapped).toBe(true);
    expect(game.state.objects[basic].tapped).toBe(false);
    expect(game.state.objects[retreat].tapped).toBe(true);
    expect(game.state.objects[mine].tapped).toBe(false);
  });

  it("doesn't offer an opponent's shock land its life payment", () => {
    const game = mkGame();
    spawn(game, THALIA);
    const crypt = spawn(game, "Blood Crypt", B);
    expect(game.state.awaiting).toBeNull();
    expect(game.state.objects[crypt].tapped).toBe(true);
  });

  it("taps an opponent's creature tokens, singly or stacked", () => {
    const game = mkGame();
    spawn(game, THALIA);
    internals(game).createTokens(B, ANGEL_TOKEN, 2);
    internals(game).createTokens(B, ANGEL_TOKEN, 10);
    const tokens = battlefieldNamed(game, ANGEL_TOKEN, B);
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.every((id) => game.state.objects[id].tapped)).toBe(true);
  });

  it("doesn't reach a creature entering at the same time as Thalia", () => {
    const game = mkGame();
    const thalia = game.debugSpawn(THALIA, A, "exile");
    const bears = game.debugSpawn("Grizzly Bears", B, "exile");
    internals(game).completeFlickerReturn([thalia, bears]);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[bears].tapped).toBe(false);
    const later = spawn(game, "Grizzly Bears", B);
    expect(game.state.objects[later].tapped).toBe(true);
  });
});

describe("Authority of the Consuls", () => {
  it("taps an opponent's entering creature and gains you 1 life for it", () => {
    const game = mkGame();
    spawn(game, "Authority of the Consuls");
    const life = game.state.players[A].life;
    const bears = enter(game, "Grizzly Bears", B);
    game.advanceUntil(settled);
    expect(game.state.objects[bears].tapped).toBe(true);
    expect(game.state.players[A].life).toBe(life + 1);

    const mine = enter(game, "Grizzly Bears");
    game.advanceUntil(settled);
    expect(game.state.objects[mine].tapped).toBe(false);
    expect(game.state.players[A].life).toBe(life + 1);
  });

  it("gains 1 life per token in a stack an opponent creates, and taps the stack", () => {
    const game = mkGame();
    spawn(game, "Authority of the Consuls");
    const life = game.state.players[A].life;
    internals(game).createTokens(B, ANGEL_TOKEN, 10);
    game.advanceUntil(settled);
    const tokens = battlefieldNamed(game, ANGEL_TOKEN, B);
    expect(tokens.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(10);
    expect(tokens.every((id) => game.state.objects[id].tapped)).toBe(true);
    expect(game.state.players[A].life).toBe(life + 10);
  });
});

describe("Spelunking", () => {
  const cast = (landName: string): { game: Game; land: ObjectId; life: number } => {
    const game = mkGame();
    const land = game.debugSpawn(landName, A, "hand");
    const life = game.state.players[A].life;
    enter(game, "Spelunking");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [land] });
    game.advanceUntil(settled);
    return { game, land, life };
  };

  it("draws, then puts a land from hand onto the battlefield untapped", () => {
    const { game, land, life } = cast("Cinder Barrens");
    expect(game.state.objects[land].zone).toBe("battlefield");
    expect(game.state.objects[land].tapped).toBe(false);
    expect(game.state.players[A].life).toBe(life);
  });

  it("gains you 4 life if that land is a Cave", () => {
    const { game, land, life } = cast("Urza's Cave");
    expect(game.state.objects[land].zone).toBe("battlefield");
    expect(game.state.players[A].life).toBe(life + 4);
  });
});
