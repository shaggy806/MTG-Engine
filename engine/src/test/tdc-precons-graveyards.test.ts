/**
 * TDC stand-ins that reach into graveyards: Moorland Haunt (a graveyard
 * exile cost), Soul of Windgrace (a land from any graveyard), Grimoire of
 * the Dead (every graveyard's creature cards, as black Zombies), Sepulchral
 * Primordial (which of its targets to put, chosen as it resolves, entering
 * together), Diluvian Primordial (casting its targets one at a time) and
 * Combustible Gearhulk (an opponent's choice, and the milled cards' total
 * mana value).
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const setUp = (players: readonly PlayerId[] = [A, B]) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: players.map((p) => ({ player: p, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  return game;
};
const ready = (game: Game, name: string, who: PlayerId = A): ObjectId => {
  const id = game.debugSpawn(name, who, "battlefield");
  game.state.objects[id].summoningSick = false;
  return id;
};
const lands = (game: Game, name: string, n: number) => {
  for (let i = 0; i < n; i += 1) game.state.objects[game.debugSpawn(name, A, "battlefield")].tapped = false;
};
const offersOf = (game: Game, source: ObjectId) =>
  game.legalActions(A).filter(
    (o): o is Extract<LegalAction, { kind: "activate-ability" }> => o.kind === "activate-ability" && o.source === source,
  );
/** Spawn `name` as though it just entered, and answer its enters trigger's
 * targets with `targets` if it asks. */
const enter = (game: Game, name: string, targets: readonly (TargetRef | null)[]): ObjectId => {
  const id = game.debugSpawn(name, A, "battlefield", { announceEntry: true });
  game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || s.zones.shared.stack.length > 0);
  if (game.state.awaiting?.kind === "choose-targets") {
    game.dispatch({ type: "choose-targets", player: A, targets: [...targets] });
  }
  return id;
};

describe("Moorland Haunt", () => {
  it("exiles a creature card from your graveyard as a cost to make a 1/1 flying Spirit", () => {
    const game = setUp();
    const haunt = ready(game, "Moorland Haunt");
    lands(game, "Plains", 1);
    lands(game, "Island", 1);
    game.debugSpawn("Island", A, "graveyard");
    // No creature card to exile: no Spirit.
    expect(offersOf(game, haunt).some((o) => o.text.includes("Spirit"))).toBe(false);
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const offer = offersOf(game, haunt).find((o) => o.text.includes("Spirit"))!;
    expect(offer).toBeDefined();
    game.dispatch({ type: "activate-ability", player: A, source: haunt, abilityIndex: offer.abilityIndex, targets: [] });
    expect(game.state.objects[bears].zone).toBe("exile");
    game.advanceUntil(quiet);
    const spirits = game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === "Spirit Token");
    expect(spirits).toHaveLength(1);
    expect(game.characteristics(spirits[0]).keywords.has("flying")).toBe(true);
  });
});

describe("Soul of Windgrace", () => {
  it("puts a land card from any graveyard onto the battlefield tapped under your control as it enters", () => {
    const game = setUp();
    const mine = game.debugSpawn("Swamp", A, "graveyard");
    const theirs = game.debugSpawn("Forest", B, "graveyard");
    game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.debugSpawn("Soul of Windgrace", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind === "choose-from-zone" ? [...awaiting.eligible].sort() : []).toEqual([mine, theirs].sort());
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [theirs] });
    game.advanceUntil(quiet);
    expect(game.state.objects[theirs].zone).toBe("battlefield");
    expect(game.state.objects[theirs].controller).toBe(A);
    expect(game.state.objects[theirs].tapped).toBe(true);
    expect(game.state.objects[mine].zone).toBe("graveyard");
  });

  it("may put none, and discards a land card to gain 3 life", () => {
    const game = setUp();
    const land = game.debugSpawn("Forest", B, "graveyard");
    const soul = game.debugSpawn("Soul of Windgrace", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[land].zone).toBe("graveyard");
    lands(game, "Forest", 1);
    const graveyard = game.state.zones.perPlayer[A].graveyard.length;
    const life = game.state.players[A].life;
    const offer = offersOf(game, soul).find((o) => o.text.includes("3 life"))!;
    game.dispatch({ type: "activate-ability", player: A, source: soul, abilityIndex: offer.abilityIndex, targets: [] });
    if (game.state.awaiting?.kind === "discard") {
      game.dispatch({ type: "discard", player: A, cards: [game.state.zones.perPlayer[A].hand[0]] });
    }
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(life + 3);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(graveyard + 1);
  });
});

describe("Grimoire of the Dead", () => {
  it("studies by discarding a card", () => {
    const game = setUp();
    const grimoire = ready(game, "Grimoire of the Dead");
    lands(game, "Island", 1);
    game.dispatch({ type: "activate-ability", player: A, source: grimoire, abilityIndex: 0, targets: [] });
    if (game.state.awaiting?.kind === "discard") {
      game.dispatch({ type: "discard", player: A, cards: [game.state.zones.perPlayer[A].hand[0]] });
    }
    game.advanceUntil(quiet);
    expect(game.state.objects[grimoire].counters.study).toBe(1);
  });

  it("puts every graveyard's creature cards onto the battlefield under your control, as black Zombies", () => {
    const game = setUp([A, B, C]);
    const grimoire = ready(game, "Grimoire of the Dead");
    game.state.objects[grimoire].counters.study = 3;
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const giant = game.debugSpawn("Hill Giant", B, "graveyard");
    const thopter = game.debugSpawn("Ornithopter", C, "graveyard");
    const ring = game.debugSpawn("Sol Ring", B, "graveyard");
    // Not without three study counters.
    game.state.objects[grimoire].counters.study = 2;
    expect(offersOf(game, grimoire).some((o) => o.abilityIndex === 1)).toBe(false);
    game.state.objects[grimoire].counters.study = 3;
    game.dispatch({ type: "activate-ability", player: A, source: grimoire, abilityIndex: 1, targets: [] });
    expect(game.state.objects[grimoire].zone).toBe("graveyard");
    game.advanceUntil(quiet);
    for (const id of [bears, giant, thopter]) {
      expect(game.state.objects[id].zone).toBe("battlefield");
      expect(game.state.objects[id].controller).toBe(A);
      const c = game.characteristics(id);
      expect(c.colors).toContain("B");
      expect(c.subtypes).toContain("Zombie");
    }
    // The colourless one is simply black; the green one green and black.
    expect([...game.characteristics(thopter).colors]).toEqual(["B"]);
    expect([...game.characteristics(bears).colors].sort()).toEqual(["B", "G"]);
    expect(game.state.objects[ring].zone).toBe("graveyard");
    // Hill Giant is still a Giant.
    expect(game.characteristics(giant).subtypes).toContain("Giant");
  });
});

describe("Sepulchral Primordial", () => {
  it("chooses as it resolves which of its targets to put, and they enter together under your control", () => {
    const game = setUp([A, B, C]);
    const bobs = game.debugSpawn("Hill Giant", B, "graveyard");
    const carols = game.debugSpawn("Grizzly Bears", C, "graveyard");
    // Not one it didn't target.
    game.debugSpawn("Serra Angel", B, "graveyard");
    // Only creature cards, and only that opponent's: Carol's card isn't
    // Bob's slot's.
    const primordial = game.debugSpawn("Sepulchral Primordial", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets");
    expect(() =>
      game.dispatch({ type: "choose-targets", player: A, targets: [obj(carols), obj(bobs)] }),
    ).toThrow();
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(bobs), obj(carols)] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind === "choose-from-zone" ? [...awaiting.eligible].sort() : []).toEqual([bobs, carols].sort());
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [carols] });
    game.advanceUntil(quiet);
    expect(game.state.objects[carols].zone).toBe("battlefield");
    expect(game.state.objects[carols].controller).toBe(A);
    expect(game.state.objects[bobs].zone).toBe("graveyard");
    expect(game.state.objects[primordial].zone).toBe("battlefield");
  });

  it("puts both at once: one entry", () => {
    const game = setUp([A, B, C]);
    // "Whenever one or more artifacts you control enter": once for both.
    ready(game, "Ingenious Artillerist");
    const bobs = game.debugSpawn("Ornithopter", B, "graveyard");
    const carols = game.debugSpawn("Ornithopter", C, "graveyard");
    enter(game, "Sepulchral Primordial", [obj(bobs), obj(carols)]);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    const since = game.state.eventSeq;
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [bobs, carols] });
    game.advanceUntil(quiet);
    expect([game.state.objects[bobs].controller, game.state.objects[carols].controller]).toEqual([A, A]);
    const hits = game.state.eventLog.filter(
      (e) => e.seq > since && e.type === "damage-dealt" && e.target.kind === "player" && e.target.player === B,
    );
    expect(hits.map((e) => (e.type === "damage-dealt" ? e.amount : 0))).toEqual([2]);
  });
});

describe("Diluvian Primordial", () => {
  it("casts a target instant from an opponent's graveyard free, and exiles it after", () => {
    const game = setUp();
    const bolt = game.debugSpawn("Lightning Bolt", B, "graveyard");
    enter(game, "Diluvian Primordial", [obj(bolt)]);
    game.advanceUntil((s) => s.awaiting?.kind === "cast-now");
    const offer = game.legalActions(A).find((o) => o.kind === "cast-now");
    const cast = offer?.kind === "cast-now" ? offer.casts.find((c) => c.card === bolt) : undefined;
    expect(cast?.free).toBe(true);
    const life = game.state.players[B].life;
    game.dispatch({
      type: "cast-now",
      player: A,
      cast: { type: "cast-spell", player: A, card: bolt, targets: [{ kind: "player", player: B }], via: "effect", free: true },
    });
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(life - 3);
    expect(game.state.objects[bolt].zone).toBe("exile");
  });

  it("casts its targets one at a time in the order chosen, each optional", () => {
    const game = setUp([A, B, C]);
    const bolt = game.debugSpawn("Lightning Bolt", B, "graveyard");
    const shock = game.debugSpawn("Shock", C, "graveyard");
    enter(game, "Diluvian Primordial", [obj(bolt), obj(shock)]);
    game.advanceUntil((s) => s.awaiting?.kind === "cast-now");
    // Carol's first.
    game.dispatch({
      type: "cast-now",
      player: A,
      cast: { type: "cast-spell", player: A, card: shock, targets: [{ kind: "player", player: C }], via: "effect", free: true },
    });
    game.advanceUntil((s) => s.awaiting?.kind === "cast-now" || quiet(s));
    const offer = game.legalActions(A).find((o) => o.kind === "cast-now");
    expect(offer?.kind === "cast-now" ? offer.casts.map((c) => c.card) : []).toEqual([bolt]);
    // …and not Bob's.
    game.dispatch({ type: "cast-now", player: A, cast: null });
    game.advanceUntil(quiet);
    expect(game.state.players[C].life).toBe(18);
    expect(game.state.objects[shock].zone).toBe("exile");
    expect(game.state.objects[bolt].zone).toBe("graveyard");
  });
});

describe("Combustible Gearhulk", () => {
  const answer = (game: Game, mode: number) => {
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    expect(game.state.awaiting?.player).toBe(B);
    game.dispatch({ type: "choose-modes", player: B, modes: [mode] });
    game.advanceUntil(quiet);
  };

  it("draws you three cards if the target opponent lets it", () => {
    const game = setUp();
    const hand = game.state.zones.perPlayer[A].hand.length;
    enter(game, "Combustible Gearhulk", [{ kind: "player", player: B }]);
    answer(game, 0);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand + 3);
    expect(game.state.players[B].life).toBe(20);
  });

  it("otherwise mills three and deals their total mana value to that player, {X} as 0", () => {
    const game = setUp();
    for (const name of ["Fireball", "Grizzly Bears", "Hill Giant"]) game.debugSpawn(name, A, "library");
    const hand = game.state.zones.perPlayer[A].hand.length;
    enter(game, "Combustible Gearhulk", [{ kind: "player", player: B }]);
    answer(game, 1);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand);
    expect(game.state.zones.perPlayer[A].graveyard.map((id) => game.state.objects[id].cardName).sort()).toEqual([
      "Fireball",
      "Grizzly Bears",
      "Hill Giant",
    ]);
    // Hill Giant 4, Grizzly Bears 2, Fireball 1.
    expect(game.state.players[B].life).toBe(13);
  });
});
