import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

/**
 * Rule 612.5: "One card (Exchange of Words) instructs a player to exchange
 * the text boxes of two objects. This replaces all of the rules text of each
 * object with the rules text of the other object." Deadpool, Trading Card
 * does it as he enters (614.1c). A layer-3 effect (613.1c): each permanent's
 * abilities — keywords, statics, triggered and activated — become the
 * other's, while name, mana cost, colors, types and P/T stay its own.
 */

const [A, B] = ["alice", "bob"].map(asPlayerId);
const DEADPOOL = "Deadpool, Trading Card";

function table(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 1, maxHandSize: 99 },
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Island") })),
  });
  game.advanceUntil(
    (s) => s.turn.step === "precombat-main" && s.turnOrder[s.turn.activePlayerIndex] === A && s.priority.holder === A,
  );
  return game;
}

function spawn(game: Game, name: string, owner: PlayerId, zone: "battlefield" | "hand" | "graveyard" = "battlefield"): ObjectId {
  return game.debugSpawn(name, owner, zone, { summoningSick: false });
}

/** Pass priority until the stack is empty; stop at (and return) any decision. */
function passUntilDecision(game: Game): string | null {
  for (let i = 0; i < 50; i += 1) {
    if (game.state.awaiting !== null) return game.state.awaiting.kind;
    if (game.state.zones.shared.stack.length === 0 && game.state.pendingTriggers.length === 0) return null;
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
  }
  throw new Error("never settled");
}

/** Cast Deadpool for alice and exchange his text box with `other`'s (or,
 * with `null`, decline). */
function castDeadpool(game: Game, other: ObjectId | null): ObjectId {
  for (const land of ["Swamp", "Mountain", "Swamp", "Mountain"]) spawn(game, land, A);
  const deadpool = spawn(game, DEADPOOL, A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card: deadpool, targets: [] });
  expect(passUntilDecision(game)).toBe("choose-permanents");
  // Asked before he moves (rule 614.12).
  expect(game.state.objects[deadpool].zone).toBe("stack");
  game.dispatch({ type: "choose-permanents", player: A, permanents: other === null ? [] : [other] });
  passUntilDecision(game);
  expect(game.state.objects[deadpool].zone).toBe("battlefield");
  return deadpool;
}

const toUpkeepOf = (game: Game, player: PlayerId): void =>
  game.advanceUntil((s) => s.turn.step === "draw" && s.turnOrder[s.turn.activePlayerIndex] === player);

describe("exchanging text boxes (rule 612.5 — Deadpool, Trading Card)", () => {
  it("swaps abilities and keywords, never name, types or P/T", () => {
    const game = table();
    const angel = spawn(game, "Serra Angel", B);
    const deadpool = castDeadpool(game, angel);

    const pool = game.characteristics(deadpool);
    expect(pool).toMatchObject({ power: 5, toughness: 3 });
    expect([...pool.keywords].sort()).toEqual(["flying", "vigilance"]);
    expect(pool.subtypes).toEqual(["Mutant", "Mercenary", "Hero"]);
    const angelNow = game.characteristics(angel);
    expect(angelNow).toMatchObject({ power: 4, toughness: 4 });
    expect(angelNow.keywords.size).toBe(0);
    expect(angelNow.subtypes).toEqual(["Angel"]);
    // What the Angel shows is its new text.
    expect(game.viewFor(A).objects[angel]?.text).toMatch(/^As Deadpool enters/);
    expect(game.state.eventLog.some((e) => e.type === "text-boxes-exchanged" && e.object === deadpool)).toBe(true);
  });

  it("hands his upkeep life loss to the other creature's controller", () => {
    const game = table();
    const bears = spawn(game, "Grizzly Bears", B);
    castDeadpool(game, bears);
    const [aLife, bLife] = [game.state.players[A].life, game.state.players[B].life];

    toUpkeepOf(game, B);
    expect(game.state.players[B].life).toBe(bLife - 3);
    toUpkeepOf(game, A);
    expect(game.state.players[A].life).toBe(aLife);
  });

  it("lets the other creature's controller use his sacrifice ability, which resolves with its source gone", () => {
    const game = table();
    const bears = spawn(game, "Grizzly Bears", B);
    castDeadpool(game, bears);
    toUpkeepOf(game, B);
    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === B);
    for (let i = 0; i < 3; i += 1) spawn(game, "Island", B);
    const aHand = game.handOf(A).length;
    const bHand = game.handOf(B).length;

    game.dispatch({ type: "activate-ability", player: B, source: bears, abilityIndex: 0, targets: [] });
    expect(game.state.objects[bears].zone).toBe("graveyard");
    passUntilDecision(game);
    // "Each other player draws a card": bob's opponent, not bob.
    expect(game.handOf(A).length).toBe(aHand + 1);
    expect(game.handOf(B).length).toBe(bHand);
  });

  it("gives Deadpool the other creature's triggers, a dies trigger included", () => {
    const game = table();
    const traveler = spawn(game, "Doomed Traveler", A);
    const deadpool = castDeadpool(game, traveler);
    const spirits = (): number => game.battlefield.filter((id) => game.state.objects[id].cardName.includes("Spirit")).length;

    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: deadpool }]);
    passUntilDecision(game);
    // "When this creature dies, create a 1/1 white Spirit": Deadpool's now.
    expect(spirits()).toBe(1);
    // The Traveler keeps Deadpool's text after he's gone, and dies quietly.
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: traveler }]);
    passUntilDecision(game);
    expect(spirits()).toBe(1);
  });

  it("ends for a permanent that changes zones: a new object has its own text (rule 400.7)", () => {
    const game = table();
    const warden = spawn(game, "Soul Warden", A);
    const deadpool = castDeadpool(game, warden);
    expect(game.state.objects[warden].textFrom).toBe(DEADPOOL);
    expect(game.state.objects[deadpool].textFrom).toBe("Soul Warden");
    expect(game.viewFor(A).objects[deadpool]?.text).toMatch(/^Whenever another creature enters/);

    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0 }, [{ kind: "object", object: warden }]);
    passUntilDecision(game);
    expect(game.state.objects[warden].textFrom).toBeUndefined();
    // Deadpool keeps the Warden's text: "whenever another creature enters,
    // you gain 1 life".
    const life = game.state.players[A].life;
    spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [
      { kind: "object", object: spawn(game, "Grizzly Bears", A, "hand") },
    ]);
    passUntilDecision(game);
    expect(game.state.players[A].life).toBe(life + 1);
  });

  it("does nothing when declined", () => {
    const game = table();
    const angel = spawn(game, "Serra Angel", B);
    const deadpool = castDeadpool(game, null);
    expect(game.state.objects[deadpool].textFrom).toBeUndefined();
    expect(game.characteristics(angel).keywords.has("flying")).toBe(true);
  });

  it("isn't asked with no other creature on the battlefield", () => {
    const game = table();
    for (const land of ["Swamp", "Mountain", "Swamp", "Mountain"]) spawn(game, land, A);
    const deadpool = spawn(game, DEADPOOL, A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: deadpool, targets: [] });
    expect(passUntilDecision(game)).toBeNull();
    expect(game.state.objects[deadpool].zone).toBe("battlefield");
  });
});
