import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { computeCharacteristics } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

/**
 * Jetmir's three "as long as you control N or more creatures" anthems count
 * Jetmir itself and every token in a stack, and the nine-creature double
 * strike can switch on between the two combat-damage steps (rule 510.4).
 */

const A = asPlayerId("alice");
const B = asPlayerId("bob");

function mkGame(): { game: Game; a: ScriptedController } {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [A, B].map((player) => ({ player, cards: Array(40).fill("Forest") })),
  });
  b.declareBlockersFn = () => [];
  return { game, a };
}

const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });

const betweenSteps = (s: GameState): boolean =>
  s.turn.step === "combat-damage" &&
  s.combatDamage?.pass === "first" &&
  s.combatDamage.regularOwed &&
  s.awaiting === null;

const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";

const life = (game: Game, p: PlayerId): number => game.state.players[p].life;

describe("Jetmir, Nexus of Revels", () => {
  const registry = createDefaultRegistry();
  const kw = (game: Game, id: ObjectId) => [...computeCharacteristics(game.state, registry, id).keywords];
  const power = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id).power;

  it("counts itself toward each threshold, and turns each one on at three, six and nine", () => {
    const { game } = mkGame();
    const jetmir = spawn(game, "Jetmir, Nexus of Revels", A); // 5/4
    expect(power(game, jetmir)).toBe(5);
    expect(kw(game, jetmir)).not.toContain("vigilance");

    const bears = spawn(game, "Grizzly Bears", A);
    expect(power(game, bears)).toBe(2); // two creatures
    spawn(game, "Grizzly Bears", A); // three, Jetmir included
    expect(power(game, bears)).toBe(3);
    expect(kw(game, bears)).toContain("vigilance");
    expect(kw(game, jetmir)).toContain("vigilance");
    expect(kw(game, bears)).not.toContain("trample");

    // An opponent's creatures don't count, and don't get the bonus.
    const theirs = spawn(game, "Grizzly Bears", B);
    for (let i = 0; i < 6; i += 1) spawn(game, "Grizzly Bears", B);
    expect(power(game, theirs)).toBe(2);
    expect(kw(game, bears)).not.toContain("trample");

    for (let i = 0; i < 3; i += 1) spawn(game, "Grizzly Bears", A); // six
    expect(power(game, bears)).toBe(4);
    expect(kw(game, bears)).toEqual(expect.arrayContaining(["vigilance", "trample"]));
    expect(kw(game, bears)).not.toContain("double-strike");

    for (let i = 0; i < 2; i += 1) spawn(game, "Grizzly Bears", A); // eight
    expect(kw(game, bears)).not.toContain("double-strike");
    spawn(game, "Grizzly Bears", A); // nine
    expect(power(game, bears)).toBe(5);
    expect(power(game, jetmir)).toBe(8);
    expect(kw(game, jetmir)).toEqual(
      expect.arrayContaining(["vigilance", "trample", "double-strike"]),
    );
  });

  it("counts a token stack as every token in it", () => {
    const { game } = mkGame();
    const jetmir = spawn(game, "Jetmir, Nexus of Revels", A);
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 8 });
    const stack = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Goblin Token",
    );
    expect(stack).toBeDefined();
    const tokens = game.state.zones.shared.battlefield
      .filter((id) => game.state.objects[id].cardName === "Goblin Token")
      .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(tokens).toBe(8);
    expect(game.state.objects[stack!].stackCount ?? 1).toBeGreaterThan(1);
    expect(kw(game, jetmir)).toContain("double-strike"); // Jetmir + 8 Goblins
    expect(power(game, jetmir)).toBe(8);
    expect(power(game, stack!)).toBe(4); // 1/1 Goblin +3/+0
  });

  it("a ninth creature arriving between the damage steps: a first striker hits again, the rest hit once", () => {
    const { game, a } = mkGame();
    spawn(game, "Jetmir, Nexus of Revels", A);
    const knight = spawn(game, "White Knight", A); // 2/2 first strike
    const bears = spawn(game, "Grizzly Bears", A);
    for (let i = 0; i < 5; i += 1) spawn(game, "Grizzly Bears", A); // eight in all
    a.declareAttackersFn = () => [
      { attacker: knight, defender: B },
      { attacker: bears, defender: B },
    ];

    game.advanceUntil(betweenSteps);
    // Eight creatures: +2/+0 and trample. The Knight alone struck, for 4.
    expect(life(game, B)).toBe(16);
    spawn(game, "Grizzly Bears", A); // nine — double strike, +3/+0
    game.advanceUntil(toPostcombat);

    // Second step: the Knight again (double strike now, 702.4d) for 5, and
    // the Bears once (it had neither as the first step began) for 5.
    expect(life(game, B)).toBe(6);
  });
});
