import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

// Cards whose tokens enter tapped and attacking (rule 508.4) — see
// enter-attacking.test.ts for the rule itself.

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const D = asPlayerId("dave");

const mkGame = (players: readonly PlayerId[]) => {
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)]));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40 },
    controllers,
    decks: players.map((player) => ({ player, cards: Array(40).fill("Plains") })),
  });
  return { game, c: controllers as Record<PlayerId, ScriptedController> };
};

const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const toPostcombat = (s: GameState): boolean => s.turn.number === 1 && s.turn.step === "postcombat-main";
const afterAttackTriggers = (s: GameState): boolean =>
  s.turn.step === "declare-attackers" && s.zones.shared.stack.length === 0 && s.awaiting === null;

/** Alice's permanent `card`, able to attack, attacking `defender` on turn 1. */
const attackWith = (players: readonly PlayerId[], card: string, defender: PlayerId = B) => {
  const { game, c } = mkGame(players);
  const id = game.debugSpawn(card, A, "battlefield", { summoningSick: false });
  c[A].declareAttackersFn = () => [{ attacker: id, defender }];
  return { game, c, id };
};

describe("tokens that enter tapped and attacking", () => {
  it("Leonin Warleader: two lifelink Cats attack beside it", () => {
    const { game } = attackWith([A, B], "Leonin Warleader");
    game.advanceUntil(afterAttackTriggers);
    const cats = named(game, "Lifelink Cat Token");
    expect(cats).toHaveLength(2);
    expect(cats.every((id) => game.state.objects[id].attacking === B && game.state.objects[id].tapped)).toBe(true);
    const [lifeA, lifeB] = [game.state.players[A].life, game.state.players[B].life];
    game.advanceUntil(toPostcombat);
    expect(game.state.players[B].life).toBe(lifeB - 4 - 2);
    expect(game.state.players[A].life).toBe(lifeA + 2);
  });

  it("Hanweir Garrison: two red Humans, and they don't trigger its own attack ability", () => {
    const { game } = attackWith([A, B], "Hanweir Garrison");
    game.advanceUntil(toPostcombat);
    expect(named(game, "Red Human Token")).toHaveLength(2);
    expect(game.state.players[B].life).toBe(40 - 2 - 2);
  });

  it("Adeline: a Human for each opponent, attacking that one, even the ones she didn't attack", () => {
    const { game } = attackWith([A, B, C, D], "Adeline, Resplendent Cathar");
    game.advanceUntil(afterAttackTriggers);
    const humans = named(game, "Human Token");
    expect(humans.map((id) => game.state.objects[id].attacking).sort()).toEqual([B, C, D].sort());
    // Her power counts every creature you control: herself and three Humans.
    game.advanceUntil(toPostcombat);
    expect(game.state.players[B].life).toBe(40 - 4 - 1);
    expect(game.state.players[C].life).toBe(40 - 1);
  });

  it("Soaring Lightbringer: one Glimmer per player attacked, at that player", () => {
    const { game, c } = mkGame([A, B, C, D]);
    game.debugSpawn("Soaring Lightbringer", A, "battlefield", { summoningSick: false });
    const bearsB = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    const bearsC = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    c[A].declareAttackersFn = () => [
      { attacker: bearsB, defender: B },
      { attacker: bearsC, defender: C },
    ];
    game.advanceUntil(afterAttackTriggers);
    const glimmers = named(game, "Glimmer Token");
    expect(glimmers.map((id) => game.state.objects[id].attacking).sort()).toEqual([B, C].sort());
    // "Other enchantment creatures you control have flying."
    expect(game.characteristics(glimmers[0]).keywords).toContain("flying");
  });

  it("Anim Pakal: a counter, then that many Gnomes; Gnomes alone don't trigger it", () => {
    const { game, id } = attackWith([A, B], "Anim Pakal, Thousandth Moon");
    game.advanceUntil(afterAttackTriggers);
    expect(game.state.objects[id].counters["+1/+1"]).toBe(1);
    expect(named(game, "Gnome Token")).toHaveLength(1);
  });

  it("General Kreat: one or more Goblins attacking make one Goblin, which asks whom in multiplayer", () => {
    const { game, c } = attackWith([A, B, C], "General Kreat, the Boltbringer");
    c[A].chooseAttackTargetsFn = (_view, creatures) => creatures.map((cr) => ({ object: cr.object, target: C }));
    game.advanceUntil(afterAttackTriggers);
    const goblins = named(game, "Goblin Token");
    expect(goblins).toHaveLength(1);
    expect(game.state.objects[goblins[0]].attacking).toBe(C);
    // The Goblin entering is "another creature you control enters": 1 to each opponent.
    expect(game.state.players[B].life).toBe(39);
    expect(game.state.players[C].life).toBe(39);
  });
});
