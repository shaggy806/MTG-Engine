import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { matchesFilter } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { TargetRef } from "../target.js";

/**
 * Rule 800.4a: "When a player leaves the game, all objects owned by that
 * player leave the game and any effects which give that player control of
 * any objects or players end. Then, if that player controlled any objects on
 * the stack not represented by cards, those objects cease to exist. Then, if
 * there are any objects still controlled by that player, those objects are
 * exiled."
 *
 * The engine leaves a departed player's board where it is, for everyone to
 * read, but none of it is in the game any more (`multiplayer.test.ts`). What
 * these pin is the rest: what they'd taken goes back, what they owned goes
 * with them wherever it was, and their spells don't resolve.
 */

const [A, B, C] = ["alice", "bob", "carol"].map(asPlayerId);
const registry = createDefaultRegistry();

function table(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B, C].map((player) => ({ player, cards: Array(60).fill("Mountain") })),
  });
  game.advanceUntil(
    (s) =>
      s.turn.step === "precombat-main" &&
      s.turnOrder[s.turn.activePlayerIndex] === A &&
      s.priority.holder === A,
  );
  return game;
}

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

function spawn(game: Game, name: string, owner: PlayerId, zone: "battlefield" | "hand" | "graveyard" = "battlefield"): ObjectId {
  return game.debugSpawn(name, owner, zone, { summoningSick: false });
}

/** State-based actions, as the active player would get priority. */
function check(game: Game): void {
  (game as unknown as { prepareForPriority(player: PlayerId): void }).prepareForPriority(A);
}

function knockOut(game: Game, player: PlayerId): void {
  game.state.players[player].life = 0;
  check(game);
  expect(game.state.players[player].hasLost).toBe(true);
}

const creatureOfA = (game: Game, id: ObjectId): boolean =>
  matchesFilter(game.state, registry, id, { type: "creature", controlledBy: "you" }, { you: A });

describe("a player leaving the game (rule 800.4a)", () => {
  it("gives back what they'd taken", () => {
    const game = table();
    const bears = spawn(game, "Grizzly Bears", A);
    game.debugApplyEffect(C, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(bears)]);
    check(game);
    expect(game.state.objects[bears].controller).toBe(C);

    knockOut(game, C);

    expect(game.state.objects[bears].controller).toBe(A);
    expect(creatureOfA(game, bears)).toBe(true);
  });

  it("takes what they own with them, even from under someone else's control", () => {
    const game = table();
    const giant = spawn(game, "Hill Giant", C);
    game.debugApplyEffect(A, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(giant)]);
    check(game);
    expect(creatureOfA(game, giant)).toBe(true);

    knockOut(game, C);

    // Still there to be seen, back on its owner's side, and out of the game.
    expect(game.state.objects[giant].zone).toBe("battlefield");
    expect(game.state.objects[giant].controller).toBe(C);
    expect(creatureOfA(game, giant)).toBe(false);
  });

  it("exiles what they put onto the battlefield under their control but don't own", () => {
    const game = table();
    const wurm = spawn(game, "Craw Wurm", A, "graveyard");
    game.debugApplyEffect(C, { kind: "put-onto-battlefield", target: 0, underYourControl: true }, [
      obj(wurm),
    ]);
    check(game);
    expect(game.state.objects[wurm]).toMatchObject({ zone: "battlefield", controller: C });

    knockOut(game, C);

    // Their default control of it (rule 110.2) isn't an effect that ends.
    expect(game.state.objects[wurm].zone).toBe("exile");
  });

  it("releases a creature from an Aura of theirs that was controlling it", () => {
    const game = table();
    const bears = spawn(game, "Grizzly Bears", A);
    const mindControl = spawn(game, "Mind Control", C);
    game.state.objects[mindControl].attachedTo = bears;
    check(game);
    expect(game.state.objects[bears].controller).toBe(C);

    knockOut(game, C);

    expect(game.state.objects[bears].controller).toBe(A);
    expect(game.state.objects[mindControl].attachedTo).toBeNull();
    expect(creatureOfA(game, bears)).toBe(true);
  });

  it("takes their spell off the stack unresolved when they lose in response", () => {
    const game = table();
    for (const who of [A, C]) spawn(game, "Mountain", who);
    const theirBolt = spawn(game, "Lightning Bolt", C, "hand");
    const myBolt = spawn(game, "Lightning Bolt", A, "hand");
    game.state.players[C].life = 3;
    const lifeBefore = game.state.players[A].life;

    // Priority goes round to carol, who bolts alice.
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({ type: "pass-priority", player: B });
    game.dispatch({ type: "cast-spell", player: C, card: theirBolt, targets: [{ kind: "player", player: A }] });
    game.dispatch({ type: "pass-priority", player: C });
    // Alice bolts carol in response, and it resolves first.
    game.dispatch({ type: "cast-spell", player: A, card: myBolt, targets: [{ kind: "player", player: C }] });
    for (const who of [A, B, C]) game.dispatch({ type: "pass-priority", player: who });

    expect(game.state.players[C].hasLost).toBe(true);
    expect(game.state.zones.shared.stack).toEqual([]);
    expect(game.state.objects[theirBolt].zone).toBe("graveyard");
    expect(game.state.players[A].life).toBe(lifeBefore);
  });

  it("passes the monarch on to the active player", () => {
    const game = table();
    game.state.monarch = C;

    knockOut(game, C);

    expect(game.state.monarch).toBe(A);
    expect(game.state.eventLog.some((e) => e.type === "monarch-changed" && e.via === "monarch-left")).toBe(
      true,
    );
  });

  it("passes the monarch to the next player when it's the active player leaving", () => {
    const game = table();
    game.state.monarch = A;

    knockOut(game, A);

    expect(game.state.monarch).toBe(B);
  });

  it("takes their graveyard out of reach", () => {
    const game = table();
    const theirs = spawn(game, "Craw Wurm", C, "graveyard");
    const mine = spawn(game, "Craw Wurm", B, "graveyard");
    const reanimate = spawn(game, "Reanimate", A, "hand");
    spawn(game, "Swamp", A);

    knockOut(game, C);

    const offer = game.legalActions(A).find((x) => x.kind === "cast-spell" && x.card === reanimate);
    const options =
      (offer as { targetOptions?: readonly (readonly TargetRef[])[] } | undefined)?.targetOptions?.[0] ?? [];
    expect(options).toContainEqual(obj(mine));
    expect(options).not.toContainEqual(obj(theirs));
  });
});
