/**
 * Control changes beyond "you gain control of target …" (rule 613.1b, layer
 * 2): control given to another player — a target player (Zedruu the
 * Greathearted's "target opponent gains control of target permanent you
 * control"), or the player an event names (Alexios, Deimos of Kosmos's "that
 * player gains control"); every match of a filter at once (Dihada's "gain
 * control of all nonland permanents until end of turn"), to one player or
 * each to its owner; control rotated around the table (Aminatou, the
 * Fateshifter); and a card put onto the battlefield under a target player's
 * control (The Beamtown Bullies).
 *
 * Also what happens to all of that when someone leaves the game (rule
 * 800.4a): an effect giving the departing player control ends, and the player
 * still in the game who most recently had control has it again — which is
 * why a newer steal no longer throws away another player's older one.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { defineCard } from "../cards/define.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { TargetRef } from "../target.js";

const [A, B, C, D] = ["alice", "bob", "carol", "dave"].map(asPlayerId);

const DONOR = "Test Donor";
const registry = createDefaultRegistry().register(
  defineCard({
    name: DONOR,
    manaCost: "{0}",
    types: ["artifact"],
    text: "{0}: Target opponent gains control of target permanent you control.",
    activated: [
      {
        cost: { mana: null, tap: false },
        targets: ["opponent", { kind: "permanent", whose: "you", filter: {} }],
        effect: { kind: "gain-control", target: 1, who: { target: 0 }, untilEndOfTurn: false },
        resolve: null,
        text: "{0}: Target opponent gains control of target permanent you control.",
      },
    ],
  }),
);

function table(players: readonly PlayerId[] = [A, B, C]): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    registry,
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil(
    (s) => s.turn.step === "precombat-main" && s.turn.number === 1 && s.priority.holder === A,
  );
  return game;
}

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });
const spawn = (game: Game, name: string, owner: PlayerId): ObjectId =>
  game.debugSpawn(name, owner, "battlefield", { summoningSick: false });
const controllerOf = (game: Game, id: ObjectId): PlayerId => game.state.objects[id].controller;

/** State-based actions, as a player would get priority — layer 2 is
 * recomputed there, so a control change that doesn't hold is undone. */
function check(game: Game): void {
  (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(game.state.priority.holder ?? A);
}

function apply(game: Game, who: PlayerId, spec: EffectSpec, targets: readonly TargetRef[] = [], source?: ObjectId): void {
  game.debugApplyEffect(who, spec, targets, source === undefined ? {} : { source });
  check(game);
}

function knockOut(game: Game, p: PlayerId): void {
  game.state.players[p].life = 0;
  check(game);
  expect(game.state.players[p].hasLost).toBe(true);
}

/** Everyone passes until the top of the stack has resolved. */
function resolveTop(game: Game): void {
  const depth = game.state.zones.shared.stack.length;
  for (let i = 0; i < 12 && game.state.zones.shared.stack.length >= depth; i += 1) {
    const holder = game.state.priority.holder;
    if (holder === null) break;
    game.dispatch({ type: "pass-priority", player: holder });
  }
}

function donate(game: Game, to: PlayerId, what: ObjectId): void {
  const donor = game.state.zones.shared.battlefield.find((id) => game.state.objects[id].cardName === DONOR);
  if (donor === undefined) throw new Error("no donor");
  game.dispatch({
    type: "activate-ability",
    player: A,
    source: donor,
    abilityIndex: 0,
    targets: [player(to), obj(what)],
  });
}

describe("gain-control: who gains control", () => {
  it("a target opponent gains control of target permanent you control, for good", () => {
    const game = table();
    spawn(game, DONOR, A);
    const bears = spawn(game, "Grizzly Bears", A);
    donate(game, B, bears);
    resolveTop(game);
    expect(controllerOf(game, bears)).toBe(B);
    expect(game.state.objects[bears].owner).toBe(A);
    game.advanceUntil((s) => s.turn.number === 3);
    expect(controllerOf(game, bears)).toBe(B);
  });

  // Rule 608.2b: the ability does nothing to an illegal target and makes no
  // illegal target do anything — Zedruu's ruling: "If either the opponent or
  // the permanent you control becomes an illegal target … the ability does
  // nothing."
  it("does nothing when the opponent has become an illegal target", () => {
    const game = table();
    spawn(game, DONOR, A);
    const bears = spawn(game, "Grizzly Bears", A);
    donate(game, B, bears);
    // In response, Bob gains hexproof.
    game.debugApplyEffect(B, { kind: "grant-player-hexproof" });
    resolveTop(game);
    expect(controllerOf(game, bears)).toBe(A);
    expect(game.eventsOfType("spell-fizzled")).toHaveLength(0);
  });

  it("does nothing when the permanent has become an illegal target", () => {
    const game = table();
    spawn(game, DONOR, A);
    const bears = spawn(game, "Grizzly Bears", A);
    donate(game, B, bears);
    // In response, Carol takes the Bears until end of turn: no longer
    // "a permanent you control".
    game.debugApplyEffect(C, { kind: "gain-control", target: 0, untilEndOfTurn: true }, [obj(bears)]);
    resolveTop(game);
    expect(controllerOf(game, bears)).toBe(C);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(controllerOf(game, bears)).toBe(A);
  });

  it("gives control to the active player — 'that player' on someone's step", () => {
    const game = table();
    const bears = spawn(game, "Grizzly Bears", B);
    apply(game, B, { kind: "gain-control", target: 0, who: "active-player", untilEndOfTurn: false }, [obj(bears)]);
    expect(controllerOf(game, bears)).toBe(A);
    expect(game.state.objects[bears].summoningSick).toBe(true);
  });

  it("gives a player who has left the game nothing (rule 800.4b)", () => {
    const game = table([A, B, C, D]);
    const bears = spawn(game, "Grizzly Bears", A);
    knockOut(game, D);
    apply(game, A, { kind: "gain-control", target: 1, who: { target: 0 }, untilEndOfTurn: false }, [
      player(D),
      obj(bears),
    ]);
    expect(controllerOf(game, bears)).toBe(A);
    expect(game.state.objects[bears].controlEffects).toBeUndefined();
  });
});

describe("gain-control-all", () => {
  it("takes every match at once, as one effect, until end of turn", () => {
    const game = table();
    const theirs = spawn(game, "Grizzly Bears", B);
    const carols = spawn(game, "Mind Stone", C);
    const land = spawn(game, "Forest", B);
    const mine = spawn(game, "Hill Giant", A);
    apply(game, A, { kind: "gain-control-all", filter: { notTypes: ["land"] }, untilEndOfTurn: true });

    expect(controllerOf(game, theirs)).toBe(A);
    expect(controllerOf(game, carols)).toBe(A);
    expect(controllerOf(game, land)).toBe(B);
    // One effect, one timestamp (rule 613.7b) — shared by every permanent.
    const stamps = [theirs, carols, mine].map((id) => game.state.objects[id].controlEffects?.[0]?.timestamp);
    expect(new Set(stamps).size).toBe(1);
    expect(stamps[0]).toBeDefined();

    game.advanceUntil((s) => s.turn.number === 2);
    expect(controllerOf(game, theirs)).toBe(B);
    expect(controllerOf(game, carols)).toBe(C);
    expect(controllerOf(game, mine)).toBe(A);
  });

  it("hands a token stack over whole", () => {
    const game = table();
    game.debugApplyEffect(B, { kind: "create-token", token: "Goblin Token", count: 10 });
    check(game);
    const goblins = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Goblin Token",
    );
    expect(goblins).toHaveLength(1);
    expect(game.state.objects[goblins[0]].stackCount).toBe(10);
    apply(game, A, { kind: "gain-control-all", filter: { type: "creature" }, untilEndOfTurn: false });
    expect(controllerOf(game, goblins[0])).toBe(A);
    expect(game.state.objects[goblins[0]].stackCount).toBe(10);
  });

  it("gives each permanent to its owner with who: 'owner'", () => {
    const game = table();
    const bears = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", C);
    apply(game, A, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(bears)]);
    apply(game, A, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(giant)]);
    expect([controllerOf(game, bears), controllerOf(game, giant)]).toEqual([A, A]);
    apply(game, B, { kind: "gain-control-all", filter: { type: "creature" }, who: "owner", untilEndOfTurn: false });
    expect([controllerOf(game, bears), controllerOf(game, giant)]).toEqual([B, C]);
  });
});

describe("rotate-control (Aminatou, the Fateshifter's −6)", () => {
  const board = (game: Game, players: readonly PlayerId[]) =>
    Object.fromEntries(
      players.map((p) => [p, { creature: spawn(game, "Grizzly Bears", p), land: spawn(game, "Forest", p) }]),
    ) as Record<PlayerId, { creature: ObjectId; land: ObjectId }>;
  const rotate = (direction: "left" | "right"): EffectSpec => ({
    kind: "rotate-control",
    direction,
    filter: { notTypes: ["land"] },
    exceptSource: true,
  });

  it("left: each player takes what the next player in turn order controls", () => {
    const game = table([A, B, C, D]);
    const had = board(game, [A, B, C, D]);
    apply(game, A, rotate("left"));
    expect(controllerOf(game, had[B].creature)).toBe(A);
    expect(controllerOf(game, had[C].creature)).toBe(B);
    expect(controllerOf(game, had[D].creature)).toBe(C);
    expect(controllerOf(game, had[A].creature)).toBe(D);
    for (const p of [A, B, C, D]) expect(controllerOf(game, had[p].land)).toBe(p);
  });

  it("right: each player takes what the player before them controls", () => {
    const game = table([A, B, C, D]);
    const had = board(game, [A, B, C, D]);
    apply(game, A, rotate("right"));
    expect(controllerOf(game, had[D].creature)).toBe(A);
    expect(controllerOf(game, had[A].creature)).toBe(B);
    expect(controllerOf(game, had[B].creature)).toBe(C);
    expect(controllerOf(game, had[C].creature)).toBe(D);
  });

  it("works out every share before any changes hands, then moves them together", () => {
    const game = table([A, B, C]);
    const had = board(game, [A, B, C]);
    apply(game, A, rotate("left"));
    // Had it been done player by player, Bob's Bears (taken by Alice) would
    // have moved on again.
    expect(controllerOf(game, had[B].creature)).toBe(A);
    const stamps = [A, B, C].map((p) => game.state.objects[had[p].creature].controlEffects?.[0]?.timestamp);
    expect(new Set(stamps).size).toBe(1);
  });

  it("in a two-player game swaps the boards, whichever way", () => {
    for (const direction of ["left", "right"] as const) {
      const game = table([A, B]);
      const had = board(game, [A, B]);
      apply(game, A, rotate(direction));
      expect(controllerOf(game, had[A].creature)).toBe(B);
      expect(controllerOf(game, had[B].creature)).toBe(A);
    }
  });

  it("skips a player who has left the game", () => {
    const game = table([A, B, C, D]);
    const had = board(game, [A, B, D]);
    knockOut(game, C);
    apply(game, A, rotate("left"));
    expect(controllerOf(game, had[D].creature)).toBe(B);
    expect(controllerOf(game, had[A].creature)).toBe(D);
    expect(controllerOf(game, had[B].creature)).toBe(A);
  });

  it("leaves the source where it is ('other than Aminatou')", () => {
    const game = table([A, B]);
    const source = spawn(game, "Mind Stone", A);
    const had = board(game, [A, B]);
    apply(game, A, rotate("left"), [], source);
    expect(controllerOf(game, source)).toBe(A);
    expect(controllerOf(game, had[A].creature)).toBe(B);
  });

  it("lasts after its source is gone, and a departing player's share goes back", () => {
    const game = table([A, B, C]);
    const source = spawn(game, "Mind Stone", A);
    const had = board(game, [A, B, C]);
    apply(game, A, rotate("left"), [], source);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(source)]);
    check(game);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(controllerOf(game, had[C].creature)).toBe(B);
    // Bob leaves: what he'd been given goes back to Carol, who had it before
    // (rule 800.4a); what he owns leaves with him.
    knockOut(game, B);
    expect(controllerOf(game, had[C].creature)).toBe(C);
  });
});

describe("control effects when a player leaves the game (rule 800.4a)", () => {
  it("the player still in the game who most recently had control gets it back", () => {
    const game = table([A, B, C, D]);
    const bears = spawn(game, "Grizzly Bears", A);
    apply(game, B, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(bears)]);
    apply(game, C, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(bears)]);
    expect(controllerOf(game, bears)).toBe(C);
    knockOut(game, C);
    expect(controllerOf(game, bears)).toBe(B);
    knockOut(game, B);
    expect(controllerOf(game, bears)).toBe(A);
  });

  it("a player's own repeated steals don't pile up", () => {
    const game = table();
    const bears = spawn(game, "Grizzly Bears", A);
    for (let i = 0; i < 5; i += 1) {
      apply(game, B, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(bears)]);
    }
    apply(game, C, { kind: "gain-control", target: 0, untilEndOfTurn: true }, [obj(bears)]);
    apply(game, C, { kind: "gain-control", target: 0, untilEndOfTurn: true }, [obj(bears)]);
    expect(game.state.objects[bears].controlEffects?.map((e) => e.controller)).toEqual([B, C]);
    expect(controllerOf(game, bears)).toBe(C);
    // Cleanup ends Carol's; Bob's lasting one is the latest again.
    game.advanceUntil((s) => s.turn.number === 2);
    expect(controllerOf(game, bears)).toBe(B);
    expect(game.state.objects[bears].controlEndsAtCleanup).toBe(false);
  });

  it("an until-end-of-turn steal under a newer lasting one still ends at cleanup", () => {
    const game = table([A, B, C, D]);
    const bears = spawn(game, "Grizzly Bears", A);
    apply(game, B, { kind: "gain-control", target: 0, untilEndOfTurn: true }, [obj(bears)]);
    apply(game, C, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(bears)]);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(controllerOf(game, bears)).toBe(C);
    // Carol leaves after Bob's steal has ended: back to its owner, not Bob.
    knockOut(game, C);
    expect(controllerOf(game, bears)).toBe(A);
  });

  it("exiles what they control by default once their own steal of it ends", () => {
    const game = table([A, B, C]);
    const wurm = game.debugSpawn("Craw Wurm", A, "graveyard");
    apply(game, C, { kind: "put-onto-battlefield", target: 0, underYourControl: true }, [obj(wurm)]);
    // Carol takes it again — her own lasting steal, newer than her default.
    apply(game, C, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(wurm)]);
    expect(controllerOf(game, wurm)).toBe(C);
    knockOut(game, C);
    // The steal ends; she still controls it by default, so it's exiled.
    expect(game.state.objects[wurm].zone).toBe("exile");
  });

  it("doesn't exile it when a newer control Aura of someone else's holds it", () => {
    const game = table([A, B, C]);
    const wurm = game.debugSpawn("Craw Wurm", A, "graveyard");
    apply(game, C, { kind: "put-onto-battlefield", target: 0, underYourControl: true }, [obj(wurm)]);
    const mindControl = spawn(game, "Mind Control", B);
    game.state.objects[mindControl].attachedTo = wurm;
    check(game);
    expect(controllerOf(game, wurm)).toBe(B);
    knockOut(game, C);
    expect(game.state.objects[wurm].zone).toBe("battlefield");
    expect(controllerOf(game, wurm)).toBe(B);
  });

  it("doesn't exile it when a newer effect gave it to someone else", () => {
    const game = table([A, B, C]);
    const wurm = game.debugSpawn("Craw Wurm", A, "graveyard");
    apply(game, C, { kind: "put-onto-battlefield", target: 0, underYourControl: true }, [obj(wurm)]);
    apply(game, B, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(wurm)]);
    apply(game, C, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(wurm)]);
    knockOut(game, C);
    expect(game.state.objects[wurm].zone).toBe("battlefield");
    expect(controllerOf(game, wurm)).toBe(B);
  });
});

describe("put-onto-battlefield under another player's control", () => {
  it("enters under the named player, still its owner's card", () => {
    const game = table([A, B, C]);
    const wurm = game.debugSpawn("Craw Wurm", A, "graveyard");
    apply(game, A, { kind: "put-onto-battlefield", target: 1, under: { target: 0 } }, [player(B), obj(wurm)]);
    expect(game.state.objects[wurm]).toMatchObject({ zone: "battlefield", controller: B, owner: A });
    game.advanceUntil((s) => s.turn.number === 2);
    expect(controllerOf(game, wurm)).toBe(B);
    // Their default control of it (rule 110.2): exiled when they leave.
    knockOut(game, B);
    expect(game.state.objects[wurm].zone).toBe("exile");
  });

  it("moves nothing for a player who has left the game (rule 800.4b)", () => {
    const game = table([A, B, C]);
    const wurm = game.debugSpawn("Craw Wurm", A, "graveyard");
    knockOut(game, B);
    apply(game, A, { kind: "put-onto-battlefield", target: 1, under: { target: 0 } }, [player(B), obj(wurm)]);
    expect(game.state.objects[wurm].zone).toBe("graveyard");
  });
});

describe("add-counter: who puts the counters", () => {
  it("records the named player as the one putting them", () => {
    const game = table();
    const bears = spawn(game, "Grizzly Bears", B);
    apply(game, B, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1, by: "active-player" }, [
      obj(bears),
    ]);
    const added = game.eventsOfType("counter-added").filter((e) => e.object === bears);
    expect(added.map((e) => e.by)).toEqual([A]);
    apply(game, B, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [obj(bears)]);
    expect(game.eventsOfType("counter-added").filter((e) => e.object === bears).map((e) => e.by)).toEqual([A, B]);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(2);
  });
});
