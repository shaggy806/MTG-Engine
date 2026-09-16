/**
 * Punisher clauses — "…unless that player sacrifices a creature", "…unless
 * that creature's controller pays {3}" (Demanding Dragon, Indulgent
 * Tormentor, Kazuul).
 *
 * What makes `unless` its own effect rather than a `may` is that the decision
 * belongs to *someone else*: the targeted opponent, or the controller of the
 * creature that fired the trigger. Options the chooser can't take aren't
 * offered, so "couldn't" and "wouldn't" both land on the punishment — which
 * is what the printed cards do too.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const makeGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Mountain") },
      { player: B, cards: Array<string>(40).fill("Mountain") },
    ],
  });

const sacrificeUnless = {
  kind: "unless",
  chooser: 0,
  options: [{ sacrifice: { type: "creature" }, text: "Sacrifice a creature" }],
  otherwise: { kind: "damage", amount: 5, target: 0 },
} as const;

describe("unless — the decision belongs to the other player", () => {
  it("asks the chooser, not the controller", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    game.debugSpawn("Grizzly Bears", B, "battlefield");

    game.debugApplyEffect(A, sacrificeUnless, [{ kind: "player", player: B }]);

    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-modes");
    expect(awaiting?.player).toBe(B);
  });

  it("skips the punishment when the chooser pays", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    const bear = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const lifeBefore = game.state.players[B].life;

    game.debugApplyEffect(A, sacrificeUnless, [{ kind: "player", player: B }]);
    game.dispatch({ type: "choose-modes", player: B, modes: [0] });
    game.advanceUntil((s) => s.awaiting === null || s.result.over);

    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.state.players[B].life).toBe(lifeBefore);
  });

  it("punishes when the chooser declines", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    const bear = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const lifeBefore = game.state.players[B].life;

    game.debugApplyEffect(A, sacrificeUnless, [{ kind: "player", player: B }]);
    game.dispatch({ type: "choose-modes", player: B, modes: [] });

    expect(game.state.objects[bear].zone).toBe("battlefield");
    expect(game.state.players[B].life).toBe(lifeBefore - 5);
  });

  it("punishes without asking when the chooser has nothing to give", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    // B controls no creature, so the sacrifice option isn't available.
    const lifeBefore = game.state.players[B].life;

    game.debugApplyEffect(A, sacrificeUnless, [{ kind: "player", player: B }]);

    expect(game.state.awaiting).toBeNull();
    expect(game.state.players[B].life).toBe(lifeBefore - 5);
  });

  it("offers both ways out when a card gives two", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    game.debugSpawn("Grizzly Bears", B, "battlefield");

    game.debugApplyEffect(
      A,
      {
        kind: "unless",
        chooser: 0,
        options: [
          { sacrifice: { type: "creature" }, text: "Sacrifice a creature" },
          { payLife: 3, text: "Pay 3 life" },
        ],
        otherwise: { kind: "draw", amount: 1 },
      },
      [{ kind: "player", player: B }],
    );

    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-modes");
    if (awaiting?.kind !== "choose-modes") return;
    expect(awaiting.modes.length).toBe(2);
  });

  it("drops an option the chooser can't afford", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.state.players[B].life = 2; // can't pay 3 life

    game.debugApplyEffect(
      A,
      {
        kind: "unless",
        chooser: 0,
        options: [
          { sacrifice: { type: "creature" }, text: "Sacrifice a creature" },
          { payLife: 3, text: "Pay 3 life" },
        ],
        otherwise: { kind: "draw", amount: 1 },
      },
      [{ kind: "player", player: B }],
    );

    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-modes") return;
    expect(awaiting.modes.length).toBe(1);
  });
});

describe("Kazuul — the attacker's controller decides", () => {
  /** A attacks B, who controls Kazuul. `mana` is how many untapped Mountains
   * the attacker has to pay the {3} with. */
  const attackInto = (mana: number) => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    game.debugSpawn("Kazuul, Tyrant of the Cliffs", B, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.state.objects[bear].summoningSick = false;
    for (let i = 0; i < mana; i += 1) {
      const id = game.debugSpawn("Mountain", A, "battlefield");
      game.state.objects[id].tapped = false;
    }

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: bear, defender: B }],
    });
    game.advanceUntil(
      (s) => s.awaiting?.kind === "choose-modes" || s.awaiting?.kind === "blockers" || s.result.over,
    );
    return game;
  };

  const ogresOf = (game: Game) =>
    game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Ogre Token",
    ).length;

  it("gives the choice to the attacker's controller", () => {
    const game = attackInto(3);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-modes");
    // A is attacking, so A decides — even though the trigger is B's.
    expect(awaiting?.player).toBe(A);
  });

  it("makes the Ogre without asking when the attacker can't pay", () => {
    const game = attackInto(0);
    expect(game.state.awaiting?.kind).not.toBe("choose-modes");
    expect(ogresOf(game)).toBe(1);
  });

  it("makes no Ogre when the attacker pays", () => {
    const game = attackInto(3);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil((s) => s.awaiting?.kind === "blockers" || s.result.over);
    expect(ogresOf(game)).toBe(0);
  });
});
