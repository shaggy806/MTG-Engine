import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { ObjectId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aHand: readonly string[]) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array(40).fill("Island")] },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const tokensOf = (game: Game, p: typeof A, name: string): ObjectId[] =>
  game.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === name &&
      game.state.objects[id].controller === p &&
      game.state.objects[id].isToken,
  );

describe("Beast Within — its controller gets the Beast", () => {
  it("destroys the target and mints a 3/3 Beast under the target's controller", () => {
    const { game } = mkGame(["Beast Within"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", B, "battlefield");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Beast Within"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(tokensOf(game, B, "3/3 Beast Token")).toHaveLength(1);
    expect(tokensOf(game, A, "3/3 Beast Token")).toHaveLength(0);
  });
});

describe("Rapid Hybridization — the Frog Lizard goes to the target's controller", () => {
  it("destroys the creature and mints a 3/3 Frog Lizard for its controller", () => {
    const { game } = mkGame(["Rapid Hybridization"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Island", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", B, "battlefield");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Rapid Hybridization"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(tokensOf(game, B, "Frog Lizard Token")).toHaveLength(1);
  });
});

describe("An Offer You Can't Refuse — the spell's controller gets two Treasures", () => {
  it("counters the noncreature spell and gives its controller two Treasure tokens", () => {
    const { game } = mkGame(["An Offer You Can't Refuse"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Island", A, "battlefield");
    game.debugSpawn("Mountain", B, "battlefield");
    game.debugSpawn("Lightning Bolt", B, "hand");

    // Hand priority to B, who casts Lightning Bolt at A; A responds with An Offer.
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: named(game, game.handOf(B), "Lightning Bolt"),
      targets: [{ kind: "player", player: A }],
    });
    game.dispatch({ type: "pass-priority", player: B });
    const bolt = named(game, game.state.zones.shared.stack, "Lightning Bolt");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "An Offer You Can't Refuse"),
      targets: [{ kind: "object", object: bolt }],
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[bolt].zone).toBe("graveyard");
    expect(game.state.players[A].life).toBe(game.state.rules.startingLife); // Bolt countered
    expect(tokensOf(game, B, "Treasure Token")).toHaveLength(2);
    expect(tokensOf(game, A, "Treasure Token")).toHaveLength(0);
  });
});
