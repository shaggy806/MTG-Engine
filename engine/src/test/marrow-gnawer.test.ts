import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

/**
 * Marrow-Gnawer — "All Rats have fear. / {T}, Sacrifice a Rat: Create X 1/1
 * black Rat creature tokens, where X is the number of Rats you control."
 *
 * Every clause through the real `Game`: the fear grant reaching *everyone's*
 * Rats (and only Rats) and actually stopping a block, the sacrifice cost
 * taking any Rat you control including Marrow-Gnawer itself, and X counted on
 * resolution — after the sacrificed Rat is gone, per the 2004-12-01 ruling.
 */

const [A, B] = ["alice", "bob"].map(asPlayerId);

function table(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [A, B].map((player) => ({ player, cards: Array<string>(60).fill("Swamp") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

function spawn(game: Game, name: string, player: PlayerId): ObjectId {
  return game.debugSpawn(name, player, "battlefield", { summoningSick: false });
}

/** Rat tokens `player` controls, counting a compacted stack as every token in it. */
function rats(game: Game, player: PlayerId): number {
  return game.state.zones.shared.battlefield
    .map((id) => game.state.objects[id])
    .filter((o) => o.cardName === "Rat Token" && o.controller === player)
    .reduce((n, o) => n + (o.stackCount ?? 1), 0);
}

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

function gnawOffer(game: Game, gnawer: ObjectId) {
  return game
    .legalActions(A)
    .find((a) => a.kind === "activate-ability" && a.source === gnawer);
}

function gnaw(game: Game, gnawer: ObjectId, sacrifice: ObjectId): void {
  game.dispatch({
    type: "activate-ability",
    player: A,
    source: gnawer,
    abilityIndex: 0,
    targets: [],
    sacrifice,
  });
  game.advanceUntil(quiet);
}

/** Attack B with `attacker`, then report which of B's creatures may block it. */
function blockersFor(game: Game, attacker: ObjectId): ObjectId[] {
  game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
  game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker, defender: B }] });
  game.advanceUntil((s) => s.awaiting?.kind === "blockers" || s.result.over);
  const legal = game.legalActions(B).find((a) => a.kind === "declare-blockers");
  if (legal === undefined || legal.kind !== "declare-blockers") return [];
  return legal.eligible.filter((e) => e.canBlock.includes(attacker)).map((e) => e.blocker);
}

describe("Marrow-Gnawer — All Rats have fear", () => {
  it("grants fear to every Rat on the battlefield, whoever controls it, and to nothing else", () => {
    const game = table();
    const gnawer = spawn(game, "Marrow-Gnawer", A);
    const myRat = spawn(game, "Typhoid Rats", A);
    const theirRat = spawn(game, "Typhoid Rats", B);
    const bear = spawn(game, "Grizzly Bears", A);
    const theirBear = spawn(game, "Grizzly Bears", B);

    expect(game.characteristics(gnawer).keywords.has("fear")).toBe(true);
    expect(game.characteristics(myRat).keywords.has("fear")).toBe(true);
    expect(game.characteristics(theirRat).keywords.has("fear")).toBe(true);
    expect(game.characteristics(bear).keywords.has("fear")).toBe(false);
    expect(game.characteristics(theirBear).keywords.has("fear")).toBe(false);
  });

  it("reaches Rat tokens, and ends when Marrow-Gnawer leaves", () => {
    const game = table();
    const gnawer = spawn(game, "Marrow-Gnawer", A);
    const rat = spawn(game, "Typhoid Rats", A);
    gnaw(game, gnawer, rat);
    const token = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Rat Token",
    );
    if (token === undefined) throw new Error("no Rat token");
    expect(game.characteristics(token).keywords.has("fear")).toBe(true);

    const other = spawn(game, "Typhoid Rats", B);
    expect(game.characteristics(other).keywords.has("fear")).toBe(true);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: gnawer }]);
    game.advanceUntil(quiet);
    expect(game.state.objects[gnawer].zone).toBe("graveyard");
    expect(game.characteristics(token).keywords.has("fear")).toBe(false);
    expect(game.characteristics(other).keywords.has("fear")).toBe(false);
  });

  it("a Rat can be blocked only by black or artifact creatures", () => {
    const game = table();
    spawn(game, "Marrow-Gnawer", A);
    const rat = spawn(game, "Typhoid Rats", A);
    const green = spawn(game, "Grizzly Bears", B);
    const black = spawn(game, "Vampire Nighthawk", B);
    const artifact = spawn(game, "Darksteel Myr", B);

    const blockers = blockersFor(game, rat);
    expect(blockers).not.toContain(green);
    expect(blockers).toContain(black);
    expect(blockers).toContain(artifact);
  });

  it("without Marrow-Gnawer, the same Rat is blockable by anything", () => {
    const game = table();
    const rat = spawn(game, "Typhoid Rats", A);
    const green = spawn(game, "Grizzly Bears", B);
    expect(blockersFor(game, rat)).toContain(green);
  });
});

describe("Marrow-Gnawer — {T}, Sacrifice a Rat: create X Rats", () => {
  it("offers only Rats you control as the sacrifice, Marrow-Gnawer included", () => {
    const game = table();
    const gnawer = spawn(game, "Marrow-Gnawer", A);
    const rat = spawn(game, "Typhoid Rats", A);
    spawn(game, "Grizzly Bears", A);
    spawn(game, "Typhoid Rats", B);

    const offer = gnawOffer(game, gnawer);
    if (offer === undefined || offer.kind !== "activate-ability") throw new Error("not offered");
    expect([...(offer.sacrifice?.choices ?? [])].sort()).toEqual([gnawer, rat].sort());
  });

  it("refuses a non-Rat or an opponent's Rat as the sacrifice", () => {
    const game = table();
    const gnawer = spawn(game, "Marrow-Gnawer", A);
    const bear = spawn(game, "Grizzly Bears", A);
    const theirRat = spawn(game, "Typhoid Rats", B);
    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: gnawer,
        abilityIndex: 0,
        targets: [],
        sacrifice: bear,
      }),
    ).toThrow();
    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: gnawer,
        abilityIndex: 0,
        targets: [],
        sacrifice: theirRat,
      }),
    ).toThrow();
  });

  it("counts Rats you control on resolution — not the sacrificed one, not an opponent's", () => {
    const game = table();
    const gnawer = spawn(game, "Marrow-Gnawer", A);
    const rat = spawn(game, "Typhoid Rats", A);
    spawn(game, "Typhoid Rats", A);
    spawn(game, "Typhoid Rats", B);
    spawn(game, "Typhoid Rats", B);

    gnaw(game, gnawer, rat);

    expect(game.state.objects[rat].zone).toBe("graveyard");
    expect(game.state.objects[gnawer].tapped).toBe(true);
    // Marrow-Gnawer and the surviving Typhoid Rats: two.
    expect(rats(game, A)).toBe(2);
    expect(rats(game, B)).toBe(0);
    const token = game.state.zones.shared.battlefield
      .map((id) => game.state.objects[id])
      .find((o) => o.cardName === "Rat Token");
    if (token === undefined) throw new Error("no Rat token");
    const chars = game.characteristics(token.id);
    expect(token.isToken).toBe(true);
    expect([chars.power, chars.toughness]).toEqual([1, 1]);
    expect([...chars.colors]).toEqual(["B"]);
    expect(chars.subtypes).toContain("Rat");
  });

  it("can sacrifice Marrow-Gnawer itself, and still resolves", () => {
    const game = table();
    const gnawer = spawn(game, "Marrow-Gnawer", A);
    spawn(game, "Typhoid Rats", A);
    spawn(game, "Typhoid Rats", A);

    gnaw(game, gnawer, gnawer);

    expect(game.state.objects[gnawer].zone).toBe("graveyard");
    // The two Typhoid Rats are the Rats left when it resolves.
    expect(rats(game, A)).toBe(2);
  });

  it("the tokens it made count next time — it grows", () => {
    const game = table();
    const gnawer = spawn(game, "Marrow-Gnawer", A);
    const rat = spawn(game, "Typhoid Rats", A);
    spawn(game, "Typhoid Rats", A);
    gnaw(game, gnawer, rat);
    expect(rats(game, A)).toBe(2);

    // Next turn: Marrow-Gnawer + one Typhoid Rats + two tokens, one token
    // sacrificed → three left to count.
    game.state.objects[gnawer].tapped = false;
    const token = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Rat Token",
    );
    if (token === undefined) throw new Error("no Rat token");
    gnaw(game, gnawer, token);
    expect(rats(game, A)).toBe(1 + 3);
  });

  it("counts a compacted Rat stack as every token in it, and sacrifices one out of it", () => {
    const game = table();
    const gnawer = spawn(game, "Marrow-Gnawer", A);
    game.debugApplyEffect(A, { kind: "create-token", token: "Rat Token", count: 10 });
    const stack = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Rat Token",
    );
    if (stack === undefined) throw new Error("no Rat tokens");
    expect(game.state.objects[stack].stackCount).toBe(10);

    gnaw(game, gnawer, stack);

    // Nine left in the stack plus Marrow-Gnawer: ten more made.
    expect(rats(game, A)).toBe(9 + 10);
    expect(game.state.objects[gnawer].zone).toBe("battlefield");
  });

  it("needs {T}: not offered while tapped or summoning sick", () => {
    const game = table();
    const sick = game.debugSpawn("Marrow-Gnawer", A, "battlefield", { summoningSick: true });
    expect(gnawOffer(game, sick)).toBeUndefined();

    const game2 = table();
    const gnawer = spawn(game2, "Marrow-Gnawer", A);
    game2.state.objects[gnawer].tapped = true;
    expect(gnawOffer(game2, gnawer)).toBeUndefined();
  });
});
