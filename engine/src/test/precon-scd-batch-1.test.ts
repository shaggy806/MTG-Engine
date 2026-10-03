/**
 * 2022 Starter Commander Deck leftovers, batch 1 — the four of the 38 the
 * engine runs as printed: Trostani Discordant (an end-step "each player
 * gains control of all creatures they own"), Angler Turtle (opponents'
 * creatures must attack), Syphon Flesh (Zombies for the creatures actually
 * sacrificed) and Deadly Tempest (each player loses life for the creatures
 * they controlled that were destroyed). The other 34 are recorded as blocked
 * in `engine/data/sweep-3/PC-scd.json`.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const setUp = (hand: readonly string[] = [], players: readonly PlayerId[] = [A, B]): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    decks: players.map((player) => ({
      player,
      cards: player === A ? [...hand, ...Array<string>(40).fill("Wastes")] : Array<string>(40).fill("Wastes"),
    })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

/** Pass priority until the stack and triggers are empty, answering any
 * sacrifice with `pick` (default: the first eligible). */
const settle = (game: Game, pick?: (eligible: readonly ObjectId[]) => ObjectId[]): void => {
  for (let i = 0; i < 300; i += 1) {
    const awaiting = game.state.awaiting;
    if (awaiting?.kind === "sacrifice") {
      const permanents = pick?.(awaiting.eligible) ?? awaiting.eligible.slice(0, awaiting.count);
      game.dispatch({ type: "sacrifice", player: awaiting.player, permanents });
      continue;
    }
    if (awaiting !== null) throw new Error(`unexpected ${awaiting.kind} decision`);
    if (quiet(game.state)) return;
    const holder = game.state.priority.holder;
    if (holder === null) throw new Error("nobody holds priority");
    game.dispatch({ type: "pass-priority", player: holder });
  }
  throw new Error("never settled");
};

const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name);
};
const inHand = (game: Game, name: string): ObjectId =>
  game.handOf(A).find((id) => game.state.objects[id].cardName === name)!;
const cast = (game: Game, name: string): void => {
  game.dispatch({ type: "cast-spell", player: A, card: inHand(game, name), targets: [] });
};
const tokens = (game: Game, name: string, player: PlayerId): number =>
  game.battlefield
    .filter((id) => game.state.objects[id].cardName === name && game.state.objects[id].controller === player)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const steal = (game: Game, id: ObjectId, by: PlayerId): void => {
  game.debugApplyEffect(by, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [{ kind: "object", object: id }]);
};

describe("SCD batch 1 — Trostani Discordant", () => {
  it("makes two lifelink Soldiers on entering, pumped by its anthem but not itself", () => {
    const game = setUp();
    const trostani = game.debugSpawn("Trostani Discordant", A, "battlefield", { announceEntry: true });
    settle(game);
    const soldiers = game.battlefield.filter((id) => game.state.objects[id].cardName === "Lifelink Soldier Token");
    expect(tokens(game, "Lifelink Soldier Token", A)).toBe(2);
    const soldier = computeCharacteristics(game.state, game.registry, soldiers[0]);
    expect([soldier.power, soldier.toughness]).toEqual([2, 2]);
    expect(soldier.keywords.has("lifelink")).toBe(true);
    const own = computeCharacteristics(game.state, game.registry, trostani);
    expect([own.power, own.toughness]).toEqual([1, 4]);
  });

  it("at your end step, gives every creature back to its owner, both ways", () => {
    const game = setUp();
    spawn(game, "Trostani Discordant");
    const theirs = spawn(game, "Grizzly Bears", B);
    const mine = spawn(game, "Grizzly Bears", A);
    steal(game, theirs, A);
    steal(game, mine, B);
    expect(game.state.objects[theirs].controller).toBe(A);
    expect(game.state.objects[mine].controller).toBe(B);
    game.advanceUntil((s) => s.turn.step === "end" && s.priority.holder !== null);
    settle(game);
    expect(game.state.objects[theirs].controller).toBe(B);
    expect(game.state.objects[mine].controller).toBe(A);
  });

  it("doesn't trigger on an opponent's end step", () => {
    const game = setUp();
    spawn(game, "Trostani Discordant", B);
    const stolen = spawn(game, "Grizzly Bears", A);
    steal(game, stolen, B);
    game.advanceUntil((s) => s.turn.step === "end" && s.priority.holder !== null);
    settle(game);
    // Alice's turn: Bob's Trostani says "your end step".
    expect(game.state.objects[stolen].controller).toBe(B);
  });
});

describe("SCD batch 1 — Angler Turtle", () => {
  it("makes the opponents' creatures attack each combat, not its controller's", () => {
    const game = setUp();
    spawn(game, "Angler Turtle", A);
    const mine = spawn(game, "Grizzly Bears", A);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === A);
    const aliceOffer = game.legalActions(A).find((o) => o.kind === "declare-attackers");
    if (aliceOffer?.kind !== "declare-attackers") throw new Error("no attack offer for Alice");
    expect(aliceOffer.eligible).toContain(mine);
    expect(aliceOffer.mustAttack).not.toContain(mine);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [] });

    const theirs = spawn(game, "Grizzly Bears", B);
    game.advanceUntil((s) => (s.awaiting?.kind === "attackers" && s.awaiting.player === B) || s.result.over);
    const bobOffer = game.legalActions(B).find((o) => o.kind === "declare-attackers");
    if (bobOffer?.kind !== "declare-attackers") throw new Error("no attack offer for Bob");
    expect(bobOffer.mustAttack).toContain(theirs);
  });
});

describe("SCD batch 1 — Syphon Flesh", () => {
  it("makes a Zombie for each creature actually sacrificed — none for an opponent with none", () => {
    const game = setUp(["Syphon Flesh"], [A, B, C]);
    lands(game, "Swamp", 5);
    const keep = spawn(game, "Grizzly Bears", B);
    const lose = spawn(game, "Llanowar Elves", B);
    const own = spawn(game, "Grizzly Bears", A);
    cast(game, "Syphon Flesh");
    settle(game, (eligible) => [eligible.includes(lose) ? lose : eligible[0]]);
    expect(game.state.objects[lose].zone).toBe("graveyard");
    expect(game.state.objects[keep].zone).toBe("battlefield");
    // "Each other player": Alice keeps her own.
    expect(game.state.objects[own].zone).toBe("battlefield");
    expect(tokens(game, "Zombie Token", A)).toBe(1);
  });

  it("makes one Zombie per opponent who sacrificed", () => {
    const game = setUp(["Syphon Flesh"], [A, B, C]);
    lands(game, "Swamp", 5);
    spawn(game, "Grizzly Bears", B);
    spawn(game, "Grizzly Bears", C);
    cast(game, "Syphon Flesh");
    settle(game);
    expect(tokens(game, "Zombie Token", A)).toBe(2);
  });
});

describe("SCD batch 1 — Deadly Tempest", () => {
  it("charges each player for the creatures they controlled that were destroyed", () => {
    const game = setUp(["Deadly Tempest"]);
    lands(game, "Swamp", 6);
    spawn(game, "Grizzly Bears", A);
    spawn(game, "Grizzly Bears", A);
    // Indestructible: not destroyed this way, so it costs Bob nothing.
    const myr = spawn(game, "Darksteel Myr", B);
    spawn(game, "Grizzly Bears", B);
    // Owned by Bob, controlled by Alice: it counts against Alice.
    const stolen = spawn(game, "Grizzly Bears", B);
    steal(game, stolen, A);
    cast(game, "Deadly Tempest");
    settle(game);
    expect(game.state.objects[myr].zone).toBe("battlefield");
    expect(life(game, A)).toBe(17);
    expect(life(game, B)).toBe(19);
  });
});
