/**
 * The cards library ordering and a graveyard-exile cost unblocked (see
 * `library-ordering.test.ts` and `graveyard-exile-cost.test.ts` for the two
 * features, and Stock Up, Experimental Augury, Valakut Awakening, Teferi's
 * Puzzle Box and Moorland Haunt there): one focused test per card whose
 * behaviour is more than a stat line.
 */
import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: true, maxLandsPerTurn: 99, maxHandSize: 99, openingHandSize: 0 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const onTop = (game: Game, names: readonly string[], player: PlayerId = A): ObjectId[] =>
  [...names]
    .reverse()
    .map((name) => game.debugSpawn(name, player, "library"))
    .reverse();
const library = (game: Game, player: PlayerId = A): readonly ObjectId[] => game.state.zones.perPlayer[player].library;
const hand = (game: Game, player: PlayerId = A): readonly ObjectId[] => game.state.zones.perPlayer[player].hand;
const zone = (game: Game, id: ObjectId): string | undefined => game.state.objects[id]?.zone;
type ZoneOffer = Extract<LegalAction, { kind: "choose-from-zone" }>;
const zoneOffer = (game: Game, player: PlayerId = A): ZoneOffer | undefined =>
  game.legalActions(player).find((a): a is ZoneOffer => a.kind === "choose-from-zone");
const choose = (game: Game, chosen: readonly ObjectId[], player: PlayerId = A): void => {
  game.dispatch({ type: "choose-from-zone", player, chosen: [...chosen] });
};
const activate = (game: Game, source: ObjectId, abilityIndex: number, extra: Record<string, unknown> = {}): void =>
  game.dispatch({ type: "activate-ability", player: A, source, abilityIndex, ...extra });
const named = (game: Game, name: string, player: PlayerId = A): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === name && game.state.objects[id].controller === player,
  );
const tokenCount = (game: Game, name: string, player: PlayerId = A): number =>
  named(game, name, player).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;

describe("Aragorn, the Uniter", () => {
  it("answers each colour of a spell, a multicoloured one with each of its abilities", () => {
    const game = setUp();
    spawn(game, "Aragorn, the Uniter");
    spawn(game, "Mountain");
    spawn(game, "Forest");
    spawn(game, "Forest");
    const bears = spawn(game, "Grizzly Bears");
    const start = life(game, B);
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: bolt, targets: [{ kind: "player", player: B }] });
    game.advanceUntil(quiet);
    // Red: Aragorn's 3 to the opponent (the only one to target), and the Bolt's.
    expect(life(game, B)).toBe(start - 3 - 3);
    // Green: +4/+4 on a creature.
    const growth = game.debugSpawn("Giant Growth", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: growth, targets: [{ kind: "object", object: bears }] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [{ kind: "object", object: bears }] });
    game.advanceUntil(quiet);
    expect(game.viewFor(A).objects[bears]?.power).toBe(2 + 3 + 4);
    // Red and white: a Human Soldier and 3 more damage, with the Charm's 4.
    spawn(game, "Plains");
    spawn(game, "Mountain");
    const before = life(game, B);
    const charm = game.debugSpawn("Boros Charm", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: charm, modes: [0], targets: [{ kind: "player", player: B }] });
    game.advanceUntil(quiet);
    expect(tokenCount(game, "Human Soldier Token")).toBe(1);
    expect(life(game, B)).toBe(before - 3 - 4);
  });

  it("scries 2 for a blue spell, its kept cards in the order picked", () => {
    const game = setUp();
    spawn(game, "Aragorn, the Uniter");
    spawn(game, "Island");
    const [a, b] = onTop(game, ["Grizzly Bears", "Hill Giant"]);
    const opt = game.debugSpawn("Opt", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: opt });
    game.advanceUntil((s) => s.awaiting?.kind === "scry");
    // Aragorn's scry resolves first, above Opt.
    expect(game.state.zones.shared.stack).toEqual([opt]);
    game.dispatch({ type: "scry", player: A, away: [] });
    expect(zoneOffer(game)?.order).toBe(true);
    choose(game, [b, a]);
    expect(library(game).slice(0, 2)).toEqual([b, a]);
  });

  it("makes a Human Soldier for a white spell", () => {
    const game = setUp();
    spawn(game, "Aragorn, the Uniter");
    spawn(game, "Plains");
    const bears = spawn(game, "Grizzly Bears");
    const swords = game.debugSpawn("Swords to Plowshares", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: swords, targets: [{ kind: "object", object: bears }] });
    game.advanceUntil(quiet);
    expect(tokenCount(game, "Human Soldier Token")).toBe(1);
  });
});

describe("Halimar Depths", () => {
  it("enters tapped and puts the top three back in the order picked", () => {
    const game = setUp();
    const [a, b, c] = onTop(game, ["Grizzly Bears", "Hill Giant", "Craw Wurm"]);
    const depths = game.debugSpawn("Halimar Depths", A, "hand");
    game.dispatch({ type: "play-land", player: A, card: depths });
    expect(game.state.objects[depths].tapped).toBe(true);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    expect(zoneOffer(game)?.destination).toBe("library-top");
    expect(zoneOffer(game)?.min).toBe(3);
    choose(game, [c, a, b]);
    game.advanceUntil(quiet);
    expect(library(game).slice(0, 3)).toEqual([c, a, b]);
  });
});

describe("Sensei's Divining Top", () => {
  it("rearranges the top three for {1}, and draws then goes on top for {T}", () => {
    const game = setUp();
    spawn(game, "Wastes");
    const top = spawn(game, "Sensei's Divining Top");
    const [a, b, c] = onTop(game, ["Grizzly Bears", "Hill Giant", "Craw Wurm"]);
    activate(game, top, 0);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    choose(game, [b, c, a]);
    game.advanceUntil(quiet);
    expect(library(game).slice(0, 3)).toEqual([b, c, a]);
    activate(game, top, 1);
    game.advanceUntil(quiet);
    expect(hand(game)).toContain(b);
    expect(zone(game, top)).toBe("library");
    expect(library(game)[0]).toBe(top);
    expect(library(game)[1]).toBe(c);
  });

  it("draws but stays put when it left the battlefield in response (its ruling)", () => {
    const game = setUp();
    const top = spawn(game, "Sensei's Divining Top");
    activate(game, top, 1);
    // Bounced in response: a new object in hand that the ability can't find.
    game.debugApplyEffect(B, { kind: "return-to-hand", target: 0 }, [{ kind: "object", object: top }]);
    const before = hand(game).length;
    game.advanceUntil(quiet);
    expect(zone(game, top)).toBe("hand");
    expect(hand(game).length).toBe(before + 1);
  });
});

describe("Dig Through Time", () => {
  it("delves, takes two of seven, and orders the other five onto the bottom", () => {
    const game = setUp();
    spawn(game, "Island");
    spawn(game, "Island");
    const yard = ["Wastes", "Wastes", "Wastes", "Wastes", "Wastes", "Wastes"].map((name) =>
      game.debugSpawn(name, A, "graveyard"),
    );
    const seven = onTop(game, [
      "Grizzly Bears",
      "Hill Giant",
      "Craw Wurm",
      "Llanowar Elves",
      "Lightning Bolt",
      "Opt",
      "Island",
    ]);
    const dig = game.debugSpawn("Dig Through Time", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: dig, delve: yard });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    expect(yard.every((id) => zone(game, id) === "exile")).toBe(true);
    choose(game, [seven[0], seven[1]]);
    const offer = zoneOffer(game);
    expect(offer?.order).toBe(true);
    expect(offer?.ids).toHaveLength(5);
    const rest = [seven[6], seven[2], seven[5], seven[3], seven[4]];
    choose(game, rest);
    game.advanceUntil(quiet);
    expect(hand(game)).toEqual(expect.arrayContaining([seven[0], seven[1]]));
    expect(library(game).slice(-5)).toEqual(rest);
  });
});

describe("Growing Rites of Itlimoc", () => {
  it("takes a revealed creature, orders the rest onto the bottom, and transforms with four creatures", () => {
    const game = setUp();
    spawn(game, "Forest");
    spawn(game, "Forest");
    spawn(game, "Forest");
    const [land, bears, wurm, bolt] = onTop(game, ["Island", "Grizzly Bears", "Craw Wurm", "Lightning Bolt"]);
    const rites = game.debugSpawn("Growing Rites of Itlimoc", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: rites });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    const offer = zoneOffer(game);
    expect([...(offer?.eligible ?? [])].sort()).toEqual([bears, wurm].sort());
    choose(game, [wurm]);
    choose(game, [bolt, land, bears]);
    game.advanceUntil(quiet);
    expect(hand(game)).toContain(wurm);
    expect(library(game).slice(-3)).toEqual([bolt, land, bears]);
    // Three creatures: no transform at the end step.
    ["Grizzly Bears", "Grizzly Bears", "Grizzly Bears"].forEach((name) => spawn(game, name));
    game.advanceUntil((s) => s.turn.step === "cleanup" || s.turn.number > 1);
    expect(game.state.objects[rites].face ?? 0).toBe(0);
  });

  it("transforms into Itlimoc, which taps for {G} for each creature", () => {
    const game = setUp();
    const rites = spawn(game, "Growing Rites of Itlimoc");
    ["Grizzly Bears", "Grizzly Bears", "Grizzly Bears", "Grizzly Bears"].forEach((name) => spawn(game, name));
    game.advanceUntil((s) => s.turn.step === "end" && quiet(s) && s.priority.holder === A);
    expect(game.state.objects[rites].face).toBe(1);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    activate(game, rites, 1);
    expect(game.state.players[A].manaPool.filter((unit) => unit.type === "G")).toHaveLength(4);
  });
});

describe("Varina, Lich Queen", () => {
  it("draws, discards and gains life for the Zombies that attacked, and makes a tapped Zombie for two cards", () => {
    const game = setUp();
    const varina = spawn(game, "Varina, Lich Queen");
    const zombie = spawn(game, "Cemetery Reaper");
    spawn(game, "Grizzly Bears");
    // A card already in hand, so the discard is a choice.
    const kept = game.debugSpawn("Hill Giant", A, "hand");
    const start = life(game, A);
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: varina, defender: B },
        { attacker: zombie, defender: B },
      ],
    });
    const handBefore = hand(game).length;
    game.advanceUntil((s) => s.awaiting?.kind === "discard");
    expect(hand(game).length).toBe(handBefore + 2);
    game.dispatch({ type: "discard", player: A, cards: hand(game).filter((id) => id !== kept) });
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(start + 2);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBeGreaterThanOrEqual(2);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    spawn(game, "Wastes");
    spawn(game, "Wastes");
    activate(game, varina, 0);
    game.advanceUntil(quiet);
    const made = named(game, "Zombie Token");
    expect(made).toHaveLength(1);
    expect(game.state.objects[made[0]].tapped).toBe(true);
  });
});

describe("Mines of Moria", () => {
  it("enters tapped without a legendary creature, untapped with one, and makes two Treasures", () => {
    const game = setUp();
    const first = game.debugSpawn("Mines of Moria", A, "hand");
    game.dispatch({ type: "play-land", player: A, card: first });
    expect(game.state.objects[first].tapped).toBe(true);
    spawn(game, "Varina, Lich Queen");
    const second = game.debugSpawn("Mines of Moria", A, "hand");
    game.dispatch({ type: "play-land", player: A, card: second });
    // The legend rule keeps one Mines; either way the second entered untapped.
    expect(game.state.objects[second].tapped).toBe(false);
    if (game.state.awaiting?.kind === "legend-rule") {
      game.dispatch({ type: "legend-rule", player: A, keep: second });
    }
    ["Mountain", "Mountain", "Mountain", "Mountain"].forEach((name) => spawn(game, name));
    ["Wastes", "Wastes", "Wastes"].forEach((name) => game.debugSpawn(name, A, "graveyard"));
    activate(game, second, 1);
    game.advanceUntil(quiet);
    expect(tokenCount(game, "Treasure Token")).toBe(2);
    expect(game.state.zones.perPlayer[A].graveyard.filter((id) => game.state.objects[id].cardName === "Wastes"))
      .toHaveLength(1);
  });
});

describe("Psychic Frog", () => {
  it("grows for a discard, flies for three exiled cards, and draws on combat damage", () => {
    const game = setUp();
    const frog = spawn(game, "Psychic Frog");
    game.debugSpawn("Wastes", A, "hand");
    activate(game, frog, 0);
    game.advanceUntil(quiet);
    expect(game.state.objects[frog].counters["+1/+1"]).toBe(1);
    expect(game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === frog && x.abilityIndex === 1))
      .toBe(false);
    ["Wastes", "Wastes"].forEach((name) => game.debugSpawn(name, A, "graveyard"));
    activate(game, frog, 1);
    game.advanceUntil(quiet);
    expect(game.viewFor(A).objects[frog]?.keywords).toContain("flying");
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    const start = life(game, B);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: frog, defender: B }] });
    const before = hand(game).length;
    game.advanceUntil((s) => s.turn.step === "end-combat");
    expect(hand(game).length).toBe(before + 1);
    expect(life(game, B)).toBe(start - 2);
  });
});

describe("Drivnod, Carnage Dominus", () => {
  it("makes a creature's dying trigger twice, and takes an indestructible counter for three creature cards", () => {
    const game = setUp();
    const drivnod = spawn(game, "Drivnod, Carnage Dominus");
    spawn(game, "Zulaport Cutthroat");
    const bears = spawn(game, "Grizzly Bears");
    const [mine, theirs] = [life(game, A), life(game, B)];
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    game.advanceUntil((s) => quiet(s) && s.priority.holder === A);
    // Zulaport Cutthroat's drain, twice.
    expect(life(game, B)).toBe(theirs - 2);
    expect(life(game, A)).toBe(mine + 2);
    ["Hill Giant", "Craw Wurm", "Wastes"].forEach((name) => game.debugSpawn(name, A, "graveyard"));
    // Two creature cards beside the Bears: three, with a land that can't pay.
    spawn(game, "Swamp");
    spawn(game, "Swamp");
    activate(game, drivnod, 0);
    game.advanceUntil(quiet);
    expect(game.state.objects[drivnod].counters.indestructible).toBe(1);
    expect(game.state.zones.perPlayer[A].graveyard.map((id) => game.state.objects[id].cardName)).toEqual(["Wastes"]);
  });
});

describe("Nezahal, Primal Tide", () => {
  it("blinks for three discards and comes back tapped, a new object, at the next end step", () => {
    const game = setUp();
    const nezahal = spawn(game, "Nezahal, Primal Tide");
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [
      { kind: "object", object: nezahal },
    ]);
    ["Hill Giant", "Craw Wurm", "Grizzly Bears"].forEach((name) => game.debugSpawn(name, A, "hand"));
    activate(game, nezahal, 0);
    game.advanceUntil(quiet);
    expect(hand(game)).toHaveLength(0);
    expect(zone(game, nezahal)).toBe("exile");
    game.advanceUntil((s) => s.turn.step === "end" && quiet(s) && s.priority.holder === A);
    expect(zone(game, nezahal)).toBe("battlefield");
    expect(game.state.objects[nezahal].tapped).toBe(true);
    expect(game.state.objects[nezahal].counters["+1/+1"]).toBeUndefined();
  });

  it("draws when an opponent casts a noncreature spell", () => {
    const game = setUp();
    spawn(game, "Nezahal, Primal Tide");
    game.advanceUntil(
      (s) => s.turnOrder[s.turn.activePlayerIndex] === B && s.turn.step === "precombat-main" && s.priority.holder === B,
    );
    spawn(game, "Mountain", B);
    const before = hand(game).length;
    const bolt = game.debugSpawn("Lightning Bolt", B, "hand");
    game.dispatch({ type: "cast-spell", player: B, card: bolt, targets: [{ kind: "player", player: A }] });
    game.advanceUntil(quiet);
    expect(hand(game).length).toBe(before + 1);
  });
});
