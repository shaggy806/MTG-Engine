/**
 * A disturb back face's "If [this] would be put into a graveyard from
 * anywhere, exile it instead" (rule 702.146) is the face's own ability — a
 * replacement the object has while that face is up — not something the
 * disturb cast does. So a copy of the face has it (copiable values, rule
 * 707.2) and the face that has lost all its abilities doesn't.
 */

import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (hand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40 - hand.length).fill("Island")] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  for (let i = 0; i < 8; i += 1) game.debugSpawn("Island", A, "battlefield");
  return { game, a };
};

const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

/** Cast Baithook Angler from A's graveyard with disturb, leaving it on the stack. */
const castDisturbed = (game: Game): ObjectId => {
  const angler = game.debugSpawn("Baithook Angler", A, "graveyard");
  game.dispatch({ type: "cast-spell", player: A, card: angler, targets: [], via: "disturb", face: 1 });
  expect(game.state.objects[angler].zone).toBe("stack");
  return angler;
};

const destroy = (game: Game, id: ObjectId): void => {
  game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: id }]);
  game.advanceUntil(settled);
};

describe("disturb — the back face's own exile replacement", () => {
  it("a disturbed Hook-Haunt Drifter that dies is exiled", () => {
    const { game } = setUp();
    const drifter = castDisturbed(game);
    game.advanceUntil(settled);
    expect(game.state.objects[drifter].zone).toBe("battlefield");
    destroy(game, drifter);
    expect(game.state.objects[drifter].zone).toBe("exile");
  });

  it("countered on the stack, it's exiled too — from anywhere", () => {
    const { game } = setUp();
    const drifter = castDisturbed(game);
    game.debugApplyEffect(B, { kind: "counter", target: 0 }, [{ kind: "object", object: drifter }]);
    expect(game.state.objects[drifter].zone).toBe("exile");
  });

  it("a Clone of it is exiled too: the replacement is a copiable ability (rule 707.2)", () => {
    const { game, a } = setUp(["Clone"]);
    const drifter = castDisturbed(game);
    game.advanceUntil(settled);
    a.chooseCopyFn = () => drifter;
    const clone = game.state.zones.perPlayer[A].hand.find((id) => game.state.objects[id].cardName === "Clone")!;
    game.dispatch({ type: "cast-spell", player: A, card: clone });
    game.advanceUntil(settled);
    expect(game.state.objects[clone].copyOf).toBe("Hook-Haunt Drifter");
    destroy(game, clone);
    expect(game.state.objects[clone].zone).toBe("exile");
  });

  it("one that lost all its abilities goes to the graveyard", () => {
    const { game } = setUp();
    const drifter = castDisturbed(game);
    game.advanceUntil(settled);
    game.debugApplyEffect(
      B,
      {
        kind: "animate",
        target: 0,
        power: 1,
        toughness: 1,
        addTypes: ["creature"],
        addSubtypes: [],
        setSubtypes: ["Frog"],
        setColors: ["U"],
        loseAbilities: true,
        duration: "end-of-turn",
      },
      [{ kind: "object", object: drifter }],
    );
    destroy(game, drifter);
    expect(game.state.objects[drifter].zone).toBe("graveyard");
  });
});

describe("Lunarch Veteran // Luminous Phantom", () => {
  it("the front face gains 1 life as another creature of yours enters", () => {
    const { game } = setUp();
    game.debugSpawn("Lunarch Veteran", A, "battlefield");
    const life = game.state.players[A].life;
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    game.advanceUntil(settled);
    expect(game.state.players[A].life).toBe(life + 1);
  });

  it("disturbed, it flies, gains 1 life as another creature of yours leaves, and is exiled when it dies", () => {
    const { game } = setUp();
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Plains", A, "battlefield");
    const veteran = game.debugSpawn("Lunarch Veteran", A, "graveyard");
    game.dispatch({ type: "cast-spell", player: A, card: veteran, targets: [], via: "disturb", face: 1 });
    game.advanceUntil(settled);
    expect(game.state.objects[veteran].zone).toBe("battlefield");
    expect(game.characteristics(veteran).keywords.has("flying")).toBe(true);

    const life = game.state.players[A].life;
    destroy(game, game.debugSpawn("Grizzly Bears", A, "battlefield"));
    expect(game.state.players[A].life).toBe(life + 1);
    // An opponent's creature leaving isn't one of yours.
    destroy(game, game.debugSpawn("Grizzly Bears", B, "battlefield"));
    expect(game.state.players[A].life).toBe(life + 1);

    // Its own leaving isn't "another" creature's, and it goes to exile.
    destroy(game, veteran);
    expect(game.state.objects[veteran].zone).toBe("exile");
    expect(game.state.players[A].life).toBe(life + 1);
  });
});
