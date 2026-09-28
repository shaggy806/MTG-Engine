import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

// Dihada, Binder of Wills — the gaps list had her blocked on hidden-zone
// visibility, but her −3 reveals to everyone, which `look-and-choose`'s
// `reveal` already does.

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = () => {
  const controllers = { [A]: new ScriptedController(A), [B]: new ScriptedController(B) };
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40 },
    controllers,
    decks: [A, B].map((player) => ({ player, cards: Array(40).fill("Plains") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, c: controllers as Record<PlayerId, ScriptedController> };
};

const quiet = (game: Game) =>
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);
const activate = (game: Game, id: ObjectId, abilityIndex: number, targets: readonly ObjectId[] = []) =>
  game.dispatch({
    type: "activate-ability",
    player: A,
    source: id,
    abilityIndex,
    targets: targets.map((object) => ({ kind: "object", object })),
  });

describe("Dihada, Binder of Wills", () => {
  it("+2: a target legendary creature gains vigilance, lifelink and indestructible", () => {
    const { game } = mkGame();
    const dihada = game.debugSpawn("Dihada, Binder of Wills", A, "battlefield");
    const kaalia = game.debugSpawn("Kaalia of the Vast", A, "battlefield");
    activate(game, dihada, 0, [kaalia]);
    quiet(game);
    expect([...game.characteristics(kaalia).keywords]).toEqual(
      expect.arrayContaining(["vigilance", "lifelink", "indestructible"]),
    );
    expect(game.state.objects[dihada].counters.loyalty).toBe(7);
  });

  it("−3: legendaries of the top four to hand, the rest to the graveyard, a Treasure for each of those", () => {
    const { game, c } = mkGame();
    const dihada = game.debugSpawn("Dihada, Binder of Wills", A, "battlefield");
    const legends = [game.debugSpawn("Kaalia of the Vast", A, "library"), game.debugSpawn("Winota, Joiner of Forces", A, "library")];
    game.debugSpawn("Grizzly Bears", A, "library");
    game.debugSpawn("Hill Giant", A, "library");
    c[A].chooseFromZoneFn = (_view, eligible) => eligible;
    activate(game, dihada, 1);
    quiet(game);
    for (const id of legends) expect(game.state.objects[id].zone).toBe("hand");
    expect(game.state.zones.perPlayer[A].graveyard).toHaveLength(2);
    expect(game.battlefield.filter((id) => game.state.objects[id].cardName === "Treasure Token")).toHaveLength(2);
  });

  it("−11: control of every nonland permanent until end of turn, untapped and hasty", () => {
    const { game } = mkGame();
    const dihada = game.debugSpawn("Dihada, Binder of Wills", A, "battlefield");
    game.state.objects[dihada].counters.loyalty = 11;
    const giant = game.debugSpawn("Hill Giant", B, "battlefield", { tapped: true });
    activate(game, dihada, 2);
    quiet(game);
    expect(game.state.objects[giant].controller).toBe(A);
    expect(game.state.objects[giant].tapped).toBe(false);
    expect([...game.characteristics(giant).keywords]).toContain("haste");
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[giant].controller).toBe(B);
  });
});
