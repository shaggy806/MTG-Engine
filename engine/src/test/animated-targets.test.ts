import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

/**
 * "Target creature" (and the other permanent-type target words) reads a
 * permanent's *current* types (rule 109.2), not its printed ones. It used to
 * read printed types, so no spell or ability in the pool could target an
 * animated man-land, and a dormant one never looked like a creature anyway.
 * Found by the adversarial review of Kenrith, the Returned King.
 */

const [A, B] = ["alice", "bob"].map(asPlayerId);

function table(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Swamp") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

function spawn(game: Game, name: string, player: PlayerId): ObjectId {
  return game.debugSpawn(name, player, "battlefield", { summoningSick: false });
}

function murderTargets(game: Game, murder: ObjectId): readonly unknown[] {
  const offer = game.legalActions(A).find((a) => a.kind === "cast-spell" && a.card === murder);
  return offer?.kind === "cast-spell" ? offer.targetOptions[0] : [];
}

describe("permanent-type targets read current types", () => {
  it("an animated Mishra's Factory is a creature to target; a dormant one isn't", () => {
    const game = table();
    const factory = spawn(game, "Mishra's Factory", B);
    spawn(game, "Grizzly Bears", B);
    for (let i = 0; i < 4; i += 1) spawn(game, "Swamp", A);
    const murder = game.debugSpawn("Murder", A, "hand");
    const factoryRef = { kind: "object", object: factory };

    expect(murderTargets(game, murder)).not.toContainEqual(factoryRef);

    // Bob animates it at instant speed ({1}), in Alice's main phase.
    spawn(game, "Swamp", B);
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({ type: "activate-ability", player: B, source: factory, abilityIndex: 1, targets: [] });
    game.dispatch({ type: "pass-priority", player: B });
    game.dispatch({ type: "pass-priority", player: A });
    expect(game.state.zones.shared.stack).toHaveLength(0);
    expect(game.state.priority.holder).toBe(A);

    expect(murderTargets(game, murder)).toContainEqual(factoryRef);
    game.dispatch({ type: "cast-spell", player: A, card: murder, targets: [factoryRef] });
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({ type: "pass-priority", player: B });
    expect(game.state.objects[factory].zone).toBe("graveyard");
  });
});

describe("\"any target\" (rule 115.4)", () => {
  it("offers a planeswalker as well as creatures and players, and damages its loyalty", () => {
    const game = table();
    const garruk = game.debugSpawn("Garruk Wildspeaker", B, "battlefield");
    spawn(game, "Grizzly Bears", B);
    spawn(game, "Mountain", A);
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand");
    const offer = game.legalActions(A).find((a) => a.kind === "cast-spell" && a.card === bolt);
    const options = offer?.kind === "cast-spell" ? offer.targetOptions[0] : [];
    expect(options).toContainEqual({ kind: "object", object: garruk });
    expect(options).toContainEqual({ kind: "player", player: B });

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "object", object: garruk }],
    });
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({ type: "pass-priority", player: B });
    // 3 loyalty, 3 damage: it dies, and the move clears its counters.
    expect(game.state.objects[garruk].zone).toBe("graveyard");
    expect(game.events.some((e) => e.type === "loyalty-changed" && e.object === garruk && e.delta === -3)).toBe(true);
  });
});
