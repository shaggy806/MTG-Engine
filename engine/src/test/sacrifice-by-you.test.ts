/**
 * "Sacrifice it" is an instruction to the effect's controller, and a player
 * can't sacrifice a permanent they don't control (rule 701.21a): a delayed
 * "sacrifice it at the beginning of the next end step" does nothing once
 * someone else has taken the permanent. "Its controller may sacrifice it"
 * (Star Athlete) is asked of that controller, and still works.
 */

import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Swamp") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const obj = (object: ObjectId) => ({ kind: "object", object }) as const;
const steal = (game: Game, by: typeof A, id: ObjectId): void =>
  game.debugApplyEffect(by, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(id)]);
const toTurn2 = (game: Game): void => game.advanceUntil((s) => s.turn.number === 2);

const castComeBackWrong = (game: Game, victim: ObjectId): void => {
  for (let i = 0; i < 3; i += 1) game.debugSpawn("Swamp", A, "battlefield");
  const spell = game.debugSpawn("Come Back Wrong", A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card: spell, targets: [obj(victim)] });
  game.advanceUntil(settled);
};

describe("sacrifice-target — the effect's controller sacrifices", () => {
  it("Sneak Attack's end-step sacrifice does nothing to a creature someone else took", () => {
    const { game, a } = setUp();
    const sneak = game.debugSpawn("Sneak Attack", A, "battlefield");
    game.debugSpawn("Mountain", A, "battlefield");
    const wurm = game.debugSpawn("Craw Wurm", A, "hand");
    a.chooseFromZoneFn = (_v, eligible) => eligible.filter((id) => id === wurm);
    game.dispatch({ type: "activate-ability", player: A, source: sneak, abilityIndex: 0, targets: [] });
    game.advanceUntil(settled);
    expect(game.state.objects[wurm].zone).toBe("battlefield");
    steal(game, B, wurm);
    toTurn2(game);
    expect(game.state.objects[wurm].zone).toBe("battlefield");
    expect(game.state.objects[wurm].controller).toBe(B);
  });

  it("'its controller may sacrifice it' still lets that controller sacrifice it (Star Athlete)", () => {
    const { game, b } = setUp();
    b.chooseModesFn = () => [0];
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.debugApplyEffect(
      A,
      {
        kind: "each-player-may",
        who: { controllerOfTarget: 0 },
        prompt: "Sacrifice it?",
        effect: { kind: "sacrifice-target", target: 0 },
        ifDidnt: { kind: "damage", amount: 5, who: "that-player" },
      },
      [obj(bears)],
    );
    game.advanceUntil(settled);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.players[B].life).toBe(20);
  });
});

describe("Come Back Wrong", () => {
  it("destroys the creature, returns it under your control, and you sacrifice it at your next end step", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    castComeBackWrong(game, bears);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[bears].controller).toBe(A);
    toTurn2(game);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.zones.perPlayer[B].graveyard).toContain(bears);
  });

  it("if its owner has taken it back by then, it isn't sacrificed", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    castComeBackWrong(game, bears);
    steal(game, B, bears);
    toTurn2(game);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[bears].controller).toBe(B);
  });

  it("a token isn't a creature card: nothing comes back", () => {
    const { game } = setUp();
    game.debugApplyEffect(B, { kind: "create-token", token: "Zombie Token", count: 1 });
    const zombie = game.state.zones.shared.battlefield.find((id) => game.state.objects[id].isToken === true)!;
    castComeBackWrong(game, zombie);
    expect(game.state.zones.shared.battlefield.some((id) => game.state.objects[id].controller === A && game.state.objects[id].isToken)).toBe(false);
    expect(game.state.delayedTriggers).toHaveLength(0);
  });
});

describe("Apprentice Necromancer", () => {
  it("returns a creature card with haste, and you sacrifice it at the next end step", () => {
    const { game } = setUp();
    game.debugSpawn("Swamp", A, "battlefield");
    const necro = game.debugSpawn("Apprentice Necromancer", A, "battlefield", { summoningSick: false });
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.dispatch({ type: "activate-ability", player: A, source: necro, abilityIndex: 0, targets: [obj(bears)] });
    game.advanceUntil(settled);
    expect(game.state.objects[necro].zone).toBe("graveyard");
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.characteristics(bears).keywords.has("haste")).toBe(true);
    toTurn2(game);
    expect(game.state.objects[bears].zone).toBe("graveyard");
  });

  it("one an opponent has taken by then stays", () => {
    const { game } = setUp();
    game.debugSpawn("Swamp", A, "battlefield");
    const necro = game.debugSpawn("Apprentice Necromancer", A, "battlefield", { summoningSick: false });
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.dispatch({ type: "activate-ability", player: A, source: necro, abilityIndex: 0, targets: [obj(bears)] });
    game.advanceUntil(settled);
    steal(game, B, bears);
    toTurn2(game);
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });
});
