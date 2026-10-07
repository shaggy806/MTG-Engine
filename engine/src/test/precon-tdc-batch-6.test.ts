/**
 * TDC precons batch 6 — the five cards the Tarkir: Dragonstorm precons were
 * still missing, each behind a feature of its own. Slaughter the Strong
 * (Abzan Armor): `keep-total-power`, each player keeping creatures of total
 * power 4 or less and sacrificing the rest at once.
 */

import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    decks: [
      { player: A, cards: Array<string>(60).fill("Plains") },
      { player: B, cards: Array<string>(60).fill("Plains") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (let i = 0; i < 4; i += 1) game.debugSpawn("Plains", A, "battlefield", { summoningSick: false });
  return game;
};

const creature = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });

const zoneOf = (game: Game, id: ObjectId): string | undefined => game.state.objects[id]?.zone;

/** Casts Slaughter the Strong and stops at the first player's choice. */
const castSlaughter = (game: Game): void => {
  const card = game.debugSpawn("Slaughter the Strong", A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
  game.advanceUntil((s) => s.awaiting?.kind === "choose-permanents" || s.result.over);
};

const keep = (game: Game, player: PlayerId, permanents: readonly ObjectId[]): void => {
  game.dispatch({ type: "choose-permanents", player, permanents });
  game.advanceUntil(
    (s) => s.awaiting?.kind === "choose-permanents" || (s.zones.shared.stack.length === 0 && s.awaiting === null),
  );
};

describe("Slaughter the Strong", () => {
  it("asks the active player first, then the next, and sacrifices everything not kept at once", () => {
    const game = setUp();
    const bears = creature(game, "Grizzly Bears", A);
    const giant = creature(game, "Hill Giant", A);
    const wurm = creature(game, "Craw Wurm", A);
    const elves = creature(game, "Llanowar Elves", B);
    const angel = creature(game, "Serra Angel", B);
    castSlaughter(game);
    // Alice — the active player — first.
    const asked = game.state.awaiting;
    expect(asked?.kind === "choose-permanents" && asked.player).toBe(A);
    keep(game, A, [bears]);
    // Nothing's sacrificed until everyone has chosen.
    expect(zoneOf(game, wurm)).toBe("battlefield");
    const next = game.state.awaiting;
    expect(next?.kind === "choose-permanents" && next.player).toBe(B);
    // Each player chooses among their own creatures only.
    expect(next?.kind === "choose-permanents" && [...next.eligible].sort()).toEqual([elves, angel].sort());
    keep(game, B, [angel]);
    expect([bears, angel].map((id) => zoneOf(game, id))).toEqual(["battlefield", "battlefield"]);
    expect([giant, wurm, elves].map((id) => zoneOf(game, id))).toEqual(["graveyard", "graveyard", "graveyard"]);
  });

  it("refuses a choice whose total power is over 4", () => {
    const game = setUp();
    const bears = creature(game, "Grizzly Bears", A);
    const giant = creature(game, "Hill Giant", A);
    creature(game, "Grizzly Bears", B);
    castSlaughter(game);
    expect(() => game.dispatch({ type: "choose-permanents", player: A, permanents: [bears, giant] })).toThrow(
      /total power of 5/,
    );
  });

  it("counts a negative power against the total, as the ruling says", () => {
    const game = setUp();
    const wall = creature(game, "Wall of Omens", A);
    // A 0/4 with a -1/-1 counter: -1/3, which makes room for a 5-power creature.
    game.state.objects[wall].counters["-1/-1"] = 1;
    expect(computeCharacteristics(game.state, game.registry, wall).power).toBe(-1);
    const dragon = creature(game, "Shivan Dragon", A);
    castSlaughter(game);
    keep(game, A, [wall, dragon]);
    expect(zoneOf(game, dragon)).toBe("battlefield");
  });

  it("keeps part of a token stack, sacrificing the rest of it", () => {
    const game = setUp();
    const giant = creature(game, "Hill Giant", A);
    // A batch of eight or more compacts into one stack object.
    game.debugApplyEffect(A, { kind: "create-token", token: "Soldier Token", count: 8 });
    const stack = game.state.zones.shared.battlefield.find((id) => game.state.objects[id].cardName === "Soldier Token");
    expect(stack !== undefined && game.state.objects[stack].stackCount).toBe(8);
    castSlaughter(game);
    // The Giant (3) and one Soldier (1): the stack named once.
    keep(game, A, [giant, stack!]);
    const soldiers = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Soldier Token",
    );
    const count = soldiers.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(count).toBe(1);
    expect(zoneOf(game, giant)).toBe("battlefield");
  });

  it("keeps the most power that fits when a bot answers, and never asks a player with no creatures", () => {
    const game = setUp();
    creature(game, "Grizzly Bears", A);
    // Bob has no creatures: only Alice is asked, and her bot keeps a 3 and a 1
    // over a 2 and a 1 — four power.
    const giant = creature(game, "Hill Giant", A);
    const elves = creature(game, "Llanowar Elves", A);
    castSlaughter(game);
    const offer = game.legalActions(A).find((a) => a.kind === "choose-permanents");
    expect(offer?.kind === "choose-permanents" && offer.maxTotalPower).toBe(4);
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
    const kept = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].controller === A && game.state.objects[id].cardName !== "Plains",
    );
    expect(new Set(kept)).toEqual(new Set([giant, elves]));
  });
});

/** Shadrix's trigger at the beginning of Alice's combat, stopped at its
 * modes. */
const toShadrix = (): Game => {
  const game = setUp();
  creature(game, "Shadrix Silverquill", A);
  game.advanceUntil((s) => s.awaiting?.kind === "choose-modes" || s.result.over);
  return game;
};

const player = (p: PlayerId) => ({ kind: "player", player: p }) as const;

/** Chooses `modes`, then aims them at `players`, and lets it resolve. */
const shadrix = (game: Game, modes: readonly number[], players: readonly PlayerId[]): void => {
  game.dispatch({ type: "choose-modes", player: A, modes: [...modes] });
  game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || s.result.over);
  game.dispatch({ type: "choose-targets", player: A, targets: players.map(player) });
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
};

describe("Shadrix Silverquill", () => {
  it("chooses two modes, each at its own player", () => {
    const game = toShadrix();
    const handB = game.state.zones.perPlayer[B].hand.length;
    shadrix(game, [0, 1], [A, B]);
    const inklings = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Inkling Token",
    );
    expect(inklings.map((id) => game.state.objects[id].controller)).toEqual([A]);
    expect(game.state.zones.perPlayer[B].hand.length).toBe(handB + 1);
    expect(game.state.players[B].life).toBe(19);
  });

  it("refuses two modes at the same player", () => {
    const game = toShadrix();
    game.dispatch({ type: "choose-modes", player: A, modes: [0, 2] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || s.result.over);
    expect(() =>
      game.dispatch({ type: "choose-targets", player: A, targets: [player(A), player(A)] }),
    ).toThrow();
  });

  it("takes zero modes or two, never one; zero removes the ability", () => {
    const game = toShadrix();
    const offer = game.legalActions(A).find((a) => a.kind === "choose-modes");
    expect(offer?.kind === "choose-modes" && [offer.minModes, offer.maxModes, offer.orNone]).toEqual([2, 2, true]);
    expect(() => game.dispatch({ type: "choose-modes", player: A, modes: [1] })).toThrow(/choose none/);
    game.dispatch({ type: "choose-modes", player: A, modes: [] });
    expect(game.state.zones.shared.stack).toHaveLength(0);
    expect(game.state.awaiting).toBeNull();
  });

  it("has the target player put the counters, for their own \"whenever you put\"", () => {
    const game = toShadrix();
    const exemplar = creature(game, "Exemplar of Light", B);
    const bears = creature(game, "Grizzly Bears", A);
    const handB = game.state.zones.perPlayer[B].hand.length;
    shadrix(game, [0, 2], [A, B]);
    expect(game.state.objects[exemplar].counters["+1/+1"]).toBe(1);
    expect(game.state.objects[bears].counters["+1/+1"]).toBeUndefined();
    // Bob put a +1/+1 counter on his Exemplar: it draws him a card.
    expect(game.state.zones.perPlayer[B].hand.length).toBe(handB + 1);
  });
});

const poolOf = (game: Game, p: PlayerId): string[] => game.state.players[p].manaPool.map((u) => u.type);
const stepAfter = (game: Game): void => {
  const step = game.state.turn.step;
  const turn = game.state.turn.number;
  game.advanceUntil((s) => s.turn.step !== step || s.turn.number !== turn);
};

describe("Leyline Tyrant", () => {
  it("keeps unspent red mana as steps, phases and turns end, and loses the rest", () => {
    const game = setUp();
    creature(game, "Leyline Tyrant", A);
    game.state.players[A].manaPool = [{ type: "R" }, { type: "G" }];
    stepAfter(game);
    expect(poolOf(game, A)).toEqual(["R"]);
    // Through cleanup and into Bob's turn: kept indefinitely (the ruling).
    game.advanceUntil((s) => s.turn.number === 2);
    expect(poolOf(game, A)).toEqual(["R"]);
  });

  it("once it's gone, the red mana goes as the step ends", () => {
    const game = setUp();
    const tyrant = creature(game, "Leyline Tyrant", A);
    game.state.players[A].manaPool = [{ type: "R" }];
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: tyrant }]);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes" || s.zones.shared.stack.length === 0);
    if (game.state.awaiting?.kind === "choose-modes") game.dispatch({ type: "choose-modes", player: A, modes: [] });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
    stepAfter(game);
    expect(poolOf(game, A)).toEqual([]);
  });

  it("dies: pays any amount of {R} — red only — and deals that much damage to any target", () => {
    const game = setUp();
    for (const land of ["Mountain", "Mountain", "Mountain", "Forest", "Forest"]) {
      game.debugSpawn(land, A, "battlefield", { summoningSick: false });
    }
    const tyrant = creature(game, "Leyline Tyrant", A);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: tyrant }]);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes" || s.result.over);
    const offer = game.legalActions(A).find((a) => a.kind === "choose-modes");
    // Three Mountains: X up to 3, not 9 — the Forests and Plains can't pay {R}.
    expect(offer?.kind === "choose-modes" && offer.xCost?.maxX).toBe(3);
    game.dispatch({ type: "choose-modes", player: A, modes: [0], xValue: 3 });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || s.result.over);
    game.dispatch({ type: "choose-targets", player: A, targets: [player(B)] });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
    expect(game.state.players[B].life).toBe(17);
    const forests = game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === "Forest");
    expect(forests.every((id) => !game.state.objects[id].tapped)).toBe(true);
  });
});

/** Life from the Loam in Alice's graveyard. */
const loamInGraveyard = (game: Game): ObjectId => game.debugSpawn("Life from the Loam", A, "graveyard");

const dredgeOffer = (game: Game) => {
  const awaiting = game.state.awaiting;
  return awaiting?.kind === "choose-modes" && awaiting.dredgeFor !== undefined ? awaiting : null;
};

describe("Life from the Loam: dredge 3", () => {
  it("replaces the turn's draw: mill three, return it to hand, draw nothing", () => {
    const game = setUp();
    const loam = loamInGraveyard(game);
    game.advanceUntil((s) => (s.turn.number === 3 && s.turn.step === "draw") || dredgeOffer(game) !== null);
    expect(dredgeOffer(game)?.player).toBe(A);
    const hand = game.state.zones.perPlayer[A].hand.length;
    const library = game.state.zones.perPlayer[A].library.length;
    game.dispatch({ type: "choose-modes", player: A, modes: [1] });
    expect(game.state.objects[loam].zone).toBe("hand");
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand + 1);
    expect(game.state.zones.perPlayer[A].library.length).toBe(library - 3);
    expect(game.state.zones.perPlayer[A].graveyard).toHaveLength(3);
  });

  it("declined, the draw goes on", () => {
    const game = setUp();
    const loam = loamInGraveyard(game);
    game.advanceUntil((s) => dredgeOffer(game) !== null || s.turn.number === 4);
    const library = game.state.zones.perPlayer[A].library.length;
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    expect(game.state.objects[loam].zone).toBe("graveyard");
    expect(game.state.zones.perPlayer[A].library.length).toBe(library - 1);
  });

  it("isn't offered with fewer than three cards in the library", () => {
    const game = setUp();
    loamInGraveyard(game);
    const zones = game.state.zones.perPlayer[A];
    zones.library = zones.library.slice(0, 2);
    game.debugApplyEffect(A, { kind: "draw", amount: 1 });
    expect(dredgeOffer(game)).toBeNull();
    expect(zones.library).toHaveLength(1);
  });

  it("asks before each draw of a draw-two, one at a time, and the discard waits for both", () => {
    const game = setUp();
    const loam = loamInGraveyard(game);
    game.debugSpawn("Mountain", A, "battlefield", { summoningSick: false });
    const looting = game.debugSpawn("Faithless Looting", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: looting, targets: [] });
    game.advanceUntil((s) => dredgeOffer(game) !== null || s.result.over);
    // The first draw: drawn.
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    // The second is asked about again, with the discard still to come.
    expect(dredgeOffer(game)).not.toBeNull();
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [1] });
    expect(game.state.objects[loam].zone).toBe("hand");
    game.advanceUntil((s) => s.awaiting?.kind === "discard" || s.result.over);
    expect(game.state.awaiting?.kind).toBe("discard");
  });
});
