/**
 * Zedruu the Greathearted — {1}{U}{R}{W} 2/4 legendary Minotaur Monk:
 *   At the beginning of your upkeep, you gain X life and draw X cards, where
 *   X is the number of permanents you own that your opponents control.
 *   {U}{R}{W}: Target opponent gains control of target permanent you control.
 *
 * - the gift is lasting, to an opponent only, of a permanent you control
 *   (whoever owns it);
 * - the ability does nothing if either target has become illegal (ruling);
 * - X counts permanents you own that opponents control — not your own on
 *   your side, not theirs on yours — a token stack as every token in it;
 * - an opponent who leaves the game gives back what you gave them (ruling).
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { TargetRef } from "../target.js";

const [A, B, C] = ["alice", "bob", "carol"].map(asPlayerId);
const ZEDRUU = "Zedruu the Greathearted";
const registry = createDefaultRegistry();

function table(players: readonly PlayerId[] = [A, B, C]): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    registry,
    rules: { maxHandSize: 99 },
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Plains") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });
const spawn = (game: Game, name: string, owner: PlayerId): ObjectId =>
  game.debugSpawn(name, owner, "battlefield", { summoningSick: false });

/** Zedruu, with the mana for one activation. */
function withZedruu(game: Game): ObjectId {
  const zedruu = spawn(game, ZEDRUU, A);
  for (const land of ["Island", "Mountain", "Plains"]) spawn(game, land, A);
  return zedruu;
}

function check(game: Game): void {
  (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(
    game.state.priority.holder ?? A,
  );
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

type AbilityOffer = Extract<LegalAction, { kind: "activate-ability" }>;
const donateOffer = (game: Game, zedruu: ObjectId): AbilityOffer | undefined =>
  game.legalActions(A).find((o): o is AbilityOffer => o.kind === "activate-ability" && o.source === zedruu);

function donate(game: Game, zedruu: ObjectId, to: PlayerId, what: ObjectId): void {
  game.dispatch({
    type: "activate-ability",
    player: A,
    source: zedruu,
    abilityIndex: 0,
    targets: [player(to), obj(what)],
  });
}

describe("Zedruu the Greathearted", () => {
  it("is a {1}{U}{R}{W} 2/4 legendary Minotaur Monk", () => {
    const def = registry.get(ZEDRUU);
    expect(def.manaCost).toBe("{1}{U}{R}{W}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.subtypes).toEqual(["Minotaur", "Monk"]);
    expect([def.power, def.toughness]).toEqual([2, 4]);
    expect(identityString(colorIdentityOf(def))).toBe("WUR");
  });

  it("gives target opponent a permanent you control, for good", () => {
    const game = table();
    const zedruu = withZedruu(game);
    const bears = spawn(game, "Grizzly Bears", A);
    donate(game, zedruu, B, bears);
    resolveTop(game);
    expect(game.state.objects[bears].controller).toBe(B);
    game.advanceUntil((s) => s.turn.number === 4);
    expect(game.state.objects[bears].controller).toBe(B);
  });

  it("targets an opponent and a permanent you control, whoever owns it", () => {
    const game = table();
    const zedruu = withZedruu(game);
    const mine = spawn(game, "Grizzly Bears", A);
    const theirs = spawn(game, "Grizzly Bears", B);
    const stolen = spawn(game, "Hill Giant", C);
    game.debugApplyEffect(A, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(stolen)]);
    check(game);
    const offer = donateOffer(game, zedruu);
    expect(offer?.targetOptions?.[0]).toEqual([player(B), player(C)]);
    expect(offer?.targetOptions?.[1]).toContainEqual(obj(mine));
    expect(offer?.targetOptions?.[1]).toContainEqual(obj(stolen));
    expect(offer?.targetOptions?.[1]).not.toContainEqual(obj(theirs));
  });

  it("does nothing if the opponent has become an illegal target", () => {
    const game = table();
    const zedruu = withZedruu(game);
    const bears = spawn(game, "Grizzly Bears", A);
    donate(game, zedruu, B, bears);
    game.debugApplyEffect(B, { kind: "grant-player-hexproof" });
    resolveTop(game);
    expect(game.state.objects[bears].controller).toBe(A);
  });

  it("does nothing if the permanent has become an illegal target", () => {
    const game = table();
    const zedruu = withZedruu(game);
    const bears = spawn(game, "Grizzly Bears", A);
    donate(game, zedruu, B, bears);
    // Carol takes it in response: no longer a permanent Alice controls.
    game.debugApplyEffect(C, { kind: "gain-control", target: 0, untilEndOfTurn: true }, [obj(bears)]);
    resolveTop(game);
    expect(game.state.objects[bears].controller).toBe(C);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[bears].controller).toBe(A);
  });

  it("at your upkeep, gains X life and draws X cards for what you own that opponents control", () => {
    const game = table();
    spawn(game, ZEDRUU, A);
    const given = [spawn(game, "Grizzly Bears", A), spawn(game, "Mind Stone", A)];
    spawn(game, "Hill Giant", A); // Alice's own, on her side: not counted.
    const theirs = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(B, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(given[0])]);
    game.debugApplyEffect(C, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(given[1])]);
    // Bob's, on Alice's side: not counted either.
    game.debugApplyEffect(A, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(theirs)]);
    // A stack of ten Goblins Alice made and gave away counts as ten.
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 10 });
    const goblins = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Goblin Token",
    )!;
    game.debugApplyEffect(B, {
      kind: "gain-control-all",
      filter: { name: "Goblin Token" },
      untilEndOfTurn: false,
    });
    check(game);
    expect(game.state.objects[goblins].stackCount).toBe(10);
    expect(game.state.objects[goblins].controller).toBe(B);

    // Alice's next upkeep: X = the Bears and the Mind Stone, plus ten Goblins.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "end");
    const life = game.state.players[A].life;
    const drawn = (): number => game.eventsOfType("card-drawn").filter((e) => e.player === A).length;
    const before = drawn();
    game.advanceUntil((s) => s.turn.number === 4 && s.turn.step === "precombat-main");
    expect(game.state.players[A].life).toBe(life + 12);
    // Twelve in the upkeep, and the draw step's one.
    expect(drawn() - before).toBe(13);
  });

  it("with nothing given away, gains and draws nothing", () => {
    const game = table();
    spawn(game, ZEDRUU, A);
    spawn(game, "Grizzly Bears", A);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "end");
    const life = game.state.players[A].life;
    const drawn = (): number => game.eventsOfType("card-drawn").filter((e) => e.player === A).length;
    const before = drawn();
    game.advanceUntil((s) => s.turn.number === 4 && s.turn.step === "precombat-main");
    expect(game.state.players[A].life).toBe(life);
    expect(drawn() - before).toBe(1);
  });

  it("an opponent who leaves the game gives back what you gave them", () => {
    const game = table();
    const zedruu = withZedruu(game);
    const bears = spawn(game, "Grizzly Bears", A);
    donate(game, zedruu, B, bears);
    resolveTop(game);
    expect(game.state.objects[bears].controller).toBe(B);
    knockOut(game, B);
    expect(game.state.objects[bears].controller).toBe(A);
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });

  it("a permanent you'd stolen and gave away comes back to you, not its owner", () => {
    const game = table();
    const zedruu = withZedruu(game);
    const giant = spawn(game, "Hill Giant", C);
    game.debugApplyEffect(A, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(giant)]);
    check(game);
    donate(game, zedruu, B, giant);
    resolveTop(game);
    expect(game.state.objects[giant].controller).toBe(B);
    knockOut(game, B);
    expect(game.state.objects[giant].controller).toBe(A);
  });
});
