import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { createDefaultRegistry, defineCard } from "./cards.js";
import { Game } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Forest"),
];

// Weak enough that a Lightning Bolt (already in the default registry) kills
// it in one shot, so the "sent to the command zone, not the graveyard"
// replacement can be triggered through a normal cast-and-resolve cycle
// rather than by reaching into private engine internals.
const TEST_COMMANDER = defineCard({
  name: "Test Commander",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
});
// Big enough to demonstrate the 21-damage loss condition in one combat step.
const TEST_BIG_COMMANDER = defineCard({
  name: "Test Big Commander",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Avatar"],
  power: 21,
  toughness: 21,
});
// A {1}{G} 2/2 (dies to a Bolt) carrying both a `leaves-battlefield` trigger
// and a `dies` trigger — so the 903.9a rework can be seen firing the former
// but not the latter when the owner picks the command zone.
const TEST_COMMANDER_TRIGGERS = defineCard({
  name: "Test Commander (Triggers)",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 2,
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When this leaves the battlefield, draw a card.",
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "When this dies, you gain 3 life.",
    },
  ],
});
const registry = createDefaultRegistry()
  .register(TEST_COMMANDER)
  .register(TEST_BIG_COMMANDER)
  .register(TEST_COMMANDER_TRIGGERS);

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const stackEmpty = (s: GameState): boolean => s.zones.shared.stack.length === 0;
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};

function mkGame(aliceCards: readonly string[] = []): Game {
  return Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { maxLandsPerTurn: 99 },
    decks: [
      { player: A, cards: pad(aliceCards), commander: "Test Commander" },
      { player: B, cards: pad([]) },
    ],
  });
}

describe("commander setup", () => {
  it("starts in the command zone, not the library, and is flagged isCommander", () => {
    const game = mkGame();
    const commanderId = game.state.zones.shared.command.find(
      (id) => game.state.objects[id].owner === A,
    );
    expect(commanderId).toBeDefined();
    const commander = game.state.objects[commanderId!];
    expect(commander.cardName).toBe("Test Commander");
    expect(commander.zone).toBe("command");
    expect(commander.isCommander).toBe(true);
    // The commander is a card on top of the 40-card deck, not part of it.
    expect(
      game.state.zones.perPlayer[A].library.length + game.handOf(A).length,
    ).toBe(40);
  });

  it("Bob (no commander configured) has nothing in the command zone", () => {
    const game = mkGame();
    expect(
      game.state.zones.shared.command.some((id) => game.state.objects[id].owner === B),
    ).toBe(false);
  });
});

describe("casting from the command zone", () => {
  it("is castable like a hand card, dying sends it back to the command zone, and recasting costs a {2} tax", () => {
    const game = mkGame(["Lightning Bolt", "Mountain"]);
    game.advanceUntil(atFirstMain);
    const commanderId = game.state.zones.shared.command.find(
      (id) => game.state.objects[id].owner === A,
    )!;

    // Forests first — the mana-tap heuristic prefers whichever narrow source
    // was played earliest, so this keeps the lone Mountain untapped and
    // available for Lightning Bolt later.
    for (let i = 0; i < 5; i += 1) {
      game.dispatch({
        type: "play-land",
        player: A,
        card: named(game, game.handOf(A), "Forest"),
      });
    }
    game.dispatch({
      type: "play-land",
      player: A,
      card: named(game, game.handOf(A), "Mountain"),
    });

    // First cast: base cost only, {1}{G} = 2 mana.
    game.dispatch({ type: "cast-spell", player: A, card: commanderId, targets: [] });
    game.advanceUntil(stackEmpty);
    expect(game.state.objects[commanderId].zone).toBe("battlefield");
    expect(game.state.players[A].commanderCastCount).toBe(1);
    // Exposed in the public view too — the client displays the tax from
    // this, since it has no other way to know how many times a commander
    // has been recast.
    expect(game.viewFor(A).players[A].commanderCastCount).toBe(1);

    // Kill it with a Bolt — commander replacement (903.9a) lets Alice move it
    // to the command zone instead of the graveyard. Her AutomaticController
    // answers "yes" during `advanceUntil`, so this settles the same way the
    // old automatic redirect did.
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Lightning Bolt"),
      targets: [{ kind: "object", object: commanderId }],
    });
    game.advanceUntil(settled);
    expect(game.state.objects[commanderId].zone).toBe("command");
    expect(game.state.zones.shared.command).toContain(commanderId);

    // Let the turn cycle back around so Alice's lands untap — recasting
    // needs {1}{G} plus a {2} tax (one previous cast) = 4 mana, more than
    // was left over from the first cast this same turn.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    const untappedForests = () =>
      game.state.zones.shared.battlefield.filter(
        (id) => game.state.objects[id].cardName === "Forest" && !game.state.objects[id].tapped,
      ).length;
    const before = untappedForests();
    expect(before).toBeGreaterThanOrEqual(4);

    game.dispatch({ type: "cast-spell", player: A, card: commanderId, targets: [] });
    expect(game.state.players[A].commanderCastCount).toBe(2);
    expect(before - untappedForests()).toBe(4);
  });
});

describe("commander replacement choice (903.9a)", () => {
  const bolt = (game: Game, target: ObjectId): void => {
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Lightning Bolt"),
      targets: [{ kind: "object", object: target }],
    });
  };

  const setup = (mkController: () => ScriptedController) => {
    const controller = mkController();
    const game = Game.create({
      seed: 1,
      shuffle: false,
      registry,
      rules: { maxLandsPerTurn: 99 },
      controllers: { [A]: controller },
      decks: [
        { player: A, cards: pad(["Lightning Bolt", "Mountain"]), commander: "Test Commander" },
        { player: B, cards: pad([]) },
      ],
    });
    game.advanceUntil(atFirstMain);
    const commanderId = game.state.zones.shared.command.find(
      (id) => game.state.objects[id].owner === A,
    )!;
    for (let i = 0; i < 5; i += 1) {
      game.dispatch({ type: "play-land", player: A, card: named(game, game.handOf(A), "Forest") });
    }
    game.dispatch({ type: "play-land", player: A, card: named(game, game.handOf(A), "Mountain") });
    game.dispatch({ type: "cast-spell", player: A, card: commanderId, targets: [] });
    game.advanceUntil(settled);
    return { game, commanderId, controller };
  };

  it("pauses on a `commander-replacement` decision *before* the commander moves", () => {
    const { game, commanderId } = setup(() => {
      const c = new ScriptedController(A);
      c.commanderReplacementFn = () => true;
      return c;
    });
    bolt(game, commanderId);
    // The Bolt resolves and the game stops, waiting on Alice's choice — the
    // replacement fires *before* the move, so the commander is still on the
    // battlefield (rule 614 / 903.9a). This is what keeps a "dies" trigger
    // from ever seeing it in the graveyard.
    game.advanceUntil((s) => s.awaiting?.kind === "commander-replacement");
    expect(game.state.awaiting).toMatchObject({
      kind: "commander-replacement",
      player: A,
      commander: commanderId,
      intendedZone: "graveyard",
    });
    expect(game.state.objects[commanderId].zone).toBe("battlefield");
  });

  it("moves it to the command zone when the owner says yes", () => {
    const { game, commanderId } = setup(() => {
      const c = new ScriptedController(A);
      c.commanderReplacementFn = () => true;
      return c;
    });
    bolt(game, commanderId);
    game.advanceUntil(settled);
    expect(game.state.objects[commanderId].zone).toBe("command");
    expect(
      game.eventsOfType("commander-zone-decision").at(-1),
    ).toMatchObject({ object: commanderId, toCommandZone: true, from: "graveyard" });
  });

  it("leaves it in the graveyard when the owner says no", () => {
    const { game, commanderId } = setup(() => {
      const c = new ScriptedController(A);
      c.commanderReplacementFn = () => false;
      return c;
    });
    bolt(game, commanderId);
    game.advanceUntil(settled);
    expect(game.state.objects[commanderId].zone).toBe("graveyard");
    expect(game.graveyardOf(A)).toContain(commanderId);
    expect(game.state.zones.shared.command).not.toContain(commanderId);
    expect(
      game.eventsOfType("commander-zone-decision").at(-1),
    ).toMatchObject({ toCommandZone: false });
  });
});

describe("903.9a fires before the move — leaves-battlefield vs dies triggers", () => {
  const setup = (toCommandZone: boolean) => {
    const controller = new ScriptedController(A);
    controller.commanderReplacementFn = () => toCommandZone;
    const game = Game.create({
      seed: 1,
      shuffle: false,
      registry,
      rules: { maxLandsPerTurn: 99 },
      controllers: { [A]: controller },
      decks: [
        {
          player: A,
          cards: pad(["Lightning Bolt", "Mountain"]),
          commander: "Test Commander (Triggers)",
        },
        { player: B, cards: pad([]) },
      ],
    });
    game.advanceUntil(atFirstMain);
    const commanderId = game.state.zones.shared.command.find(
      (id) => game.state.objects[id].owner === A,
    )!;
    for (let i = 0; i < 5; i += 1) {
      game.dispatch({ type: "play-land", player: A, card: named(game, game.handOf(A), "Forest") });
    }
    game.dispatch({ type: "play-land", player: A, card: named(game, game.handOf(A), "Mountain") });
    game.dispatch({ type: "cast-spell", player: A, card: commanderId, targets: [] });
    game.advanceUntil(settled);
    return { game, commanderId };
  };

  const drawsByA = (game: Game): number =>
    game.eventsOfType("card-drawn").filter((e) => e.player === A).length;

  it("→ command zone: the leaves-battlefield trigger fires, the dies trigger does not", () => {
    const { game, commanderId } = setup(true);
    const drawsBefore = drawsByA(game);
    const lifeBefore = game.state.players[A].life;

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Lightning Bolt"),
      targets: [{ kind: "object", object: commanderId }],
    });
    game.advanceUntil(settled);

    expect(game.state.objects[commanderId].zone).toBe("command");
    expect(drawsByA(game) - drawsBefore).toBe(1); // leaves-battlefield
    expect(game.state.players[A].life).toBe(lifeBefore); // no "you gain 3 life"
    expect(game.eventsOfType("permanent-destroyed").some((e) => e.object === commanderId)).toBe(
      false,
    );
    expect(
      game.eventsOfType("permanent-left-battlefield").some((e) => e.object === commanderId),
    ).toBe(true);
  });

  it("→ graveyard: both the leaves-battlefield and the dies trigger fire", () => {
    const { game, commanderId } = setup(false);
    const drawsBefore = drawsByA(game);
    const lifeBefore = game.state.players[A].life;

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Lightning Bolt"),
      targets: [{ kind: "object", object: commanderId }],
    });
    game.advanceUntil(settled);

    expect(game.state.objects[commanderId].zone).toBe("graveyard");
    expect(drawsByA(game) - drawsBefore).toBe(1); // leaves-battlefield
    expect(game.state.players[A].life).toBe(lifeBefore + 3); // dies → gain 3
    expect(game.eventsOfType("permanent-destroyed").some((e) => e.object === commanderId)).toBe(
      true,
    );
  });
});

describe("commander damage", () => {
  it("21+ combat damage from the same commander is a loss for the defending player", () => {
    const attacker = new ScriptedController(A);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      registry,
      rules: { startingLife: 30 }, // isolate the commander-damage SBA from a plain life-loss
      controllers: { [A]: attacker },
      decks: [
        { player: A, cards: pad([]) },
        { player: B, cards: pad([]) },
      ],
    });

    // Drop the commander straight onto the battlefield, bypassing casting —
    // only combat damage tracking is under test here.
    const id = asObjectId("test-commander-on-bf");
    game.state.timestampSeq += 1;
    game.state.objects[id] = {
      id,
      cardName: "Test Big Commander",
      owner: A,
      controller: A,
      zone: "battlefield",
      tapped: false,
      damageMarked: 0,
      markedByDeathtouch: false,
      enteredBattlefieldOnTurn: 0,
      summoningSick: false, loyaltyActivatedThisTurn: false,
      targets: null,
      attacking: null,
      blocking: null,
      blockedBy: [],
      blocked: false,
      kind: "card",
      abilityKind: null,
      sourceObjectId: null,
      abilityIndex: null,
      counters: {},
      modifiers: [],
      timestamp: game.state.timestampSeq,
      isToken: false,
      attachedTo: null,
      isCommander: true,
    };
    game.state.zones.shared.battlefield.push(id);
    attacker.declareAttackersFn = () => [{ attacker: id, defender: B }];

    game.advanceUntil((s) => s.result.over || s.turn.number > 1);

    expect(game.state.players[B].commanderDamageTaken[A]).toBeGreaterThanOrEqual(21);
    expect(game.state.players[B].life).toBeGreaterThan(0);
    expect(game.state.players[B].hasLost).toBe(true);
    expect(game.state.players[B].lossReason).toMatch(/commander/);
  });
});
