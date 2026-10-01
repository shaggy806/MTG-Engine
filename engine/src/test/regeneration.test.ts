/**
 * Regeneration (rule 701.15): a shield replaces the next destruction this
 * turn — by an effect, or by lethal or deathtouch damage — with removing the
 * damage, tapping the permanent and removing it from combat. "Can't be
 * regenerated" (701.15c) gets past it; 0 toughness and sacrifice aren't
 * destruction. Shipped against Mortivore.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (aHand: readonly string[]) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array(40).fill("Swamp")] },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  for (let i = 0; i < 8; i += 1) game.debugSpawn("Swamp", A, "battlefield");
  game.debugSpawn("Mountain", A, "battlefield");
  game.debugSpawn("Mountain", A, "battlefield");
  // Three creature cards in graveyards: a 3/3 Mortivore.
  for (let i = 0; i < 3; i += 1) game.debugSpawn("Grizzly Bears", B, "graveyard");
  const mortivore = game.debugSpawn("Mortivore", A, "battlefield", { summoningSick: false });
  return { game, mortivore, a, b };
};

const settle = (game: Game): void =>
  game.advanceUntil((s: GameState) => s.zones.shared.stack.length === 0 && s.awaiting === null);

const regenerate = (game: Game, mortivore: ObjectId): void => {
  game.dispatch({ type: "activate-ability", player: A, source: mortivore, abilityIndex: 0, targets: [] });
  settle(game);
};

const cast = (game: Game, name: string, target?: ObjectId): void => {
  const card = game.handOf(A).find((id) => game.state.objects[id].cardName === name)!;
  game.dispatch({
    type: "cast-spell",
    player: A,
    card,
    targets: target === undefined ? [] : [{ kind: "object", object: target }],
  });
  settle(game);
};

describe("Regeneration — Mortivore", () => {
  it("every seat's view shows the shields, which are public", () => {
    const { game, mortivore } = setUp([]);
    expect(game.viewFor(B).objects[mortivore]?.regenerationShields).toBe(0);
    regenerate(game, mortivore);
    regenerate(game, mortivore);
    expect(game.viewFor(A).objects[mortivore]?.regenerationShields).toBe(2);
    expect(game.viewFor(B).objects[mortivore]?.regenerationShields).toBe(2);
  });

  it("a shield replaces a destroy effect: tapped, still on the battlefield", () => {
    const { game, mortivore } = setUp(["Murder"]);
    regenerate(game, mortivore);
    expect(game.state.objects[mortivore].regenerationShields).toBe(1);
    cast(game, "Murder", mortivore);
    expect(game.state.objects[mortivore].zone).toBe("battlefield");
    expect(game.state.objects[mortivore].tapped).toBe(true);
    expect(game.state.objects[mortivore].regenerationShields).toBeUndefined();
    expect(
      game.eventsOfType("permanent-destroy-prevented").some(
        (e) => e.object === mortivore && e.reason === "regenerated",
      ),
    ).toBe(true);
  });

  it("one shield per regeneration: the second destroy gets through", () => {
    const { game, mortivore } = setUp(["Murder", "Murder"]);
    regenerate(game, mortivore);
    cast(game, "Murder", mortivore);
    cast(game, "Murder", mortivore);
    expect(game.state.objects[mortivore].zone).toBe("graveyard");
  });

  it("replaces death by lethal damage, and removes the damage", () => {
    const { game, mortivore } = setUp(["Lightning Bolt"]);
    regenerate(game, mortivore);
    cast(game, "Lightning Bolt", mortivore);
    expect(game.state.objects[mortivore].zone).toBe("battlefield");
    expect(game.state.objects[mortivore].damageMarked).toBe(0);
    expect(game.state.objects[mortivore].tapped).toBe(true);
  });

  it("\"It can't be regenerated\" gets past the shield (Terminate)", () => {
    const { game, mortivore } = setUp(["Terminate"]);
    regenerate(game, mortivore);
    cast(game, "Terminate", mortivore);
    expect(game.state.objects[mortivore].zone).toBe("graveyard");
  });

  it("\"They can't be regenerated\" gets past it too (Wrath of God)", () => {
    const { game, mortivore } = setUp(["Wrath of God"]);
    game.debugSpawn("Plains", A, "battlefield");
    game.debugSpawn("Plains", A, "battlefield");
    regenerate(game, mortivore);
    cast(game, "Wrath of God");
    expect(game.state.objects[mortivore].zone).toBe("graveyard");
  });

  it("doesn't save it from 0 toughness, which isn't destruction", () => {
    const { game, mortivore } = setUp(["Grasp of Darkness"]);
    regenerate(game, mortivore);
    // -4/-4 on a 3/3.
    cast(game, "Grasp of Darkness", mortivore);
    expect(game.state.objects[mortivore].zone).toBe("graveyard");
  });

  it("the shield is gone at the end of the turn", () => {
    const { game, mortivore } = setUp([]);
    regenerate(game, mortivore);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[mortivore].regenerationShields).toBeUndefined();
  });

  it("removes it from combat: a regenerated blocker takes no damage, and the attacker stays blocked", () => {
    const { game, mortivore, a, b } = setUp(["Murder"]);
    game.state.objects[mortivore].controller = B;
    game.state.objects[mortivore].owner = B;
    const wurm = game.debugSpawn("Craw Wurm", A, "battlefield", { summoningSick: false });
    game.debugApplyEffect(B, { kind: "regenerate", target: 0 }, [{ kind: "object", object: mortivore }]);
    a.declareAttackersFn = () => [{ attacker: wurm, defender: B }];
    b.declareBlockersFn = () => [{ blocker: mortivore, attacker: wurm }];
    game.advanceUntil(
      (s) => s.turn.step === "declare-blockers" && s.priority.holder === A && s.zones.shared.stack.length === 0,
    );
    cast(game, "Murder", mortivore);
    expect(game.state.objects[mortivore].zone).toBe("battlefield");
    expect(game.state.objects[mortivore].blocking).toBeNull();
    expect(game.state.objects[wurm].blocked).toBe(true);
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(game.state.objects[mortivore].zone).toBe("battlefield");
    expect(game.state.players[B].life).toBe(20);
  });
});
