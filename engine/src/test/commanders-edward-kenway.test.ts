import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { publicNameAt } from "../state.js";

// Edward Kenway: "At the beginning of your end step, create a Treasure token
// for each tapped Assassin, Pirate, and/or Vehicle you control. / Whenever a
// Vehicle you control deals combat damage to a player, look at the top card
// of that player's library, then exile it face down. You may play that card
// for as long as it remains exiled." — and `impulse-exile`'s `faceDown`, a
// card exiled face down that only its exiler may look at (rule 406.3).

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = () => {
  const controllers = { [A]: new ScriptedController(A), [B]: new ScriptedController(B) };
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40 },
    controllers,
    decks: [A, B].map((player) => ({ player, cards: Array(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return { game, c: controllers as Record<PlayerId, ScriptedController> };
};

const quiet = (game: Game) =>
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0);

/** A creature for `player` that can attack now, made an artifact Vehicle in
 * addition to its other types (the pool has no crewable Vehicle yet). */
const vehicle = (game: Game, player: PlayerId = A): ObjectId => {
  const id = game.debugSpawn("Grizzly Bears", player, "battlefield", { summoningSick: false });
  game.debugApplyEffect(
    player,
    { kind: "add-types", target: 0, addTypes: ["artifact"], addSubtypes: ["Vehicle"], duration: "permanent" },
    [{ kind: "object", object: id }],
  );
  return id;
};

/** Attack Bob with `attacker` and play on until combat is over. */
const hitBob = (game: Game, c: Record<PlayerId, ScriptedController>, attacker: ObjectId) => {
  c[A].declareAttackersFn = () => [{ attacker, defender: B }];
  game.advanceUntil((s) => s.turn.step === "end-of-combat" || s.turn.step === "postcombat-main");
  quiet(game);
  c[A].declareAttackersFn = () => [];
};

const castable = (game: Game, card: ObjectId) =>
  game.legalActions(A).some((a) => (a.kind === "cast-spell" || a.kind === "play-land") && a.card === card);

describe("Edward Kenway — a Vehicle's combat damage", () => {
  it("exiles the top of that player's library face down: Alice sees it and may cast it, Bob doesn't see it", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Edward Kenway", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", B, "library");
    const ship = vehicle(game);
    hitBob(game, c, ship);

    const object = game.state.objects[bears];
    expect(object.zone).toBe("exile");
    expect(object.exiledFaceDown?.lookers).toEqual([A]);
    // Rule 406.3: its owner can't look at it; the player who did may go on.
    expect(game.viewFor(B).objects[bears]).toBeUndefined();
    expect(game.viewFor(B).zones.exile).toContain(bears);
    expect(game.viewFor(A).objects[bears]?.cardName).toBe("Grizzly Bears");
    // Nobody but Alice ever knew what it was: the history names it nowhere.
    const stints = game.state.publicStints ?? {};
    for (const event of game.state.eventLog) expect(publicNameAt(stints, bears, event.seq)).toBeUndefined();

    // "You may play that card" — cast it with her own mana.
    game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    expect(castable(game, bears)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [], via: "impulse" });
    // On the stack it's face up, for everyone (the stack is public).
    expect(game.state.objects[bears].exiledFaceDown).toBeUndefined();
    expect(game.viewFor(B).objects[bears]?.cardName).toBe("Grizzly Bears");
    quiet(game);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[bears].controller).toBe(A);
  });

  it("for as long as it remains exiled — a land, played on a later turn", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Edward Kenway", A, "battlefield");
    const land = game.debugSpawn("Swamp", B, "library");
    hitBob(game, c, vehicle(game));
    expect(game.state.objects[land].zone).toBe("exile");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && s.priority.holder === A);
    expect(game.viewFor(B).objects[land]).toBeUndefined();
    expect(castable(game, land)).toBe(true);
    game.dispatch({ type: "play-land", player: A, card: land });
    expect(game.state.objects[land].zone).toBe("battlefield");
  });

  it("only a Vehicle's damage — not a creature that isn't one", () => {
    const { game, c } = mkGame();
    game.debugSpawn("Edward Kenway", A, "battlefield");
    const top = game.debugSpawn("Grizzly Bears", B, "library");
    hitBob(game, c, game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false }));
    expect(game.state.objects[top].zone).toBe("library");
  });

  it("a face-up exile is still public — the flag is only the face-down one's", () => {
    const { game } = mkGame();
    const top = game.debugSpawn("Grizzly Bears", B, "library");
    game.debugApplyEffect(A, { kind: "impulse-exile", amount: 1, whose: "each-opponent", duration: "while-exiled" }, []);
    expect(game.state.objects[top].zone).toBe("exile");
    expect(game.viewFor(B).objects[top]?.cardName).toBe("Grizzly Bears");
  });
});

describe("Edward Kenway — the end step's Treasures", () => {
  it("one per tapped Assassin, Pirate and/or Vehicle, each permanent once", () => {
    const { game } = mkGame();
    // Edward is an Assassin Pirate: tapped, one Treasure, not two.
    game.debugSpawn("Edward Kenway", A, "battlefield", { tapped: true });
    // A tapped Vehicle: one. An untapped one and a tapped non-Vehicle: none.
    const tappedShip = vehicle(game);
    game.state.objects[tappedShip].tapped = true;
    vehicle(game);
    game.debugSpawn("Grizzly Bears", A, "battlefield", { tapped: true });
    // An opponent's tapped Vehicle isn't Alice's.
    const theirs = vehicle(game, B);
    game.state.objects[theirs].tapped = true;

    game.advanceUntil((s) => s.turn.step === "end" && s.zones.shared.stack.length === 0 && s.priority.holder !== null);
    quiet(game);
    const treasures = game.state.zones.shared.battlefield
      .map((id) => game.state.objects[id])
      .filter((o) => o.controller === A && o.cardName === "Treasure Token")
      .reduce((n, o) => n + (o.stackCount ?? 1), 0);
    expect(treasures).toBe(2);
  });
});
