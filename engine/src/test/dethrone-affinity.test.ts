/**
 * Attack triggers keyed to how the attacked player's life ranks
 * (`defenderLife`), and the affinity helpers:
 *
 * - dethrone (rule 702.105a): "whenever this creature attacks the player
 *   with the most life or tied for most life, put a +1/+1 counter on this
 *   creature" — every player compared, you included; a planeswalker is never
 *   "the player"; not an intervening-if; grantable (Marchesa, the Black
 *   Rose's "other creatures you control have dethrone");
 * - "whenever a player attacks one of your opponents, if that opponent has
 *   more life than another of your opponents, …" (Breena, the Demagogue) — an
 *   intervening-if, asked again as it resolves;
 * - affinity for [something] (rule 702.41a), printed on the spell or granted
 *   to other spells by a permanent.
 */

import { describe, expect, it } from "vitest";

import type { TriggerSpec } from "../abilities.js";
import { defineCard } from "../cards/define.js";
import { affinity, dethrone, grantAffinity } from "../cards/helpers.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const D = asPlayerId("dave");

const DETHRONER = "Test Dethroner";
/** "Dethrone. Other creatures you control have dethrone." */
const ROSE = "Test Black Rose";
/** "Whenever a player attacks one of your opponents, if that opponent has
 * more life than another of your opponents, that attacking player draws a
 * card." */
const DEMAGOGUE = "Test Life Demagogue";
/** {4}{U}, affinity for artifacts. */
const GOLEM = "Test Affinity Golem";
/** "Instant and sorcery spells you cast have affinity for creatures." */
const BALANCER = "Test Balancer";
/** {3}{U} sorcery: draw a card. */
const STUDY = "Test Study";

const DEMAGOGUE_TRIGGER: TriggerSpec = {
  on: "attacks-player",
  who: "any",
  defender: "opponent",
  defenderLife: "more-than-another-opponent",
};

const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: DETHRONER,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Human"],
      power: 2,
      toughness: 2,
      text: "Dethrone",
      triggered: [dethrone()],
    }),
  )
  .register(
    defineCard({
      name: ROSE,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Human"],
      power: 1,
      toughness: 1,
      text: "Dethrone\nOther creatures you control have dethrone.",
      triggered: [dethrone()],
      static: [
        {
          affects: { scope: "creatures-you-control", excludeSelf: true },
          grantsTriggered: [dethrone()],
          text: "Other creatures you control have dethrone.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: DEMAGOGUE,
      manaCost: "{0}",
      types: ["enchantment"],
      text: DEMAGOGUE,
      triggered: [
        {
          trigger: DEMAGOGUE_TRIGGER,
          targets: [],
          effect: { kind: "draw", amount: 1, who: "active-player" },
          resolve: null,
          text: DEMAGOGUE,
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: GOLEM,
      manaCost: "{4}{U}",
      types: ["artifact", "creature"],
      subtypes: ["Golem"],
      power: 4,
      toughness: 4,
      text: "Affinity for artifacts",
      selfCostReduction: affinity({ type: "artifact" }),
    }),
  )
  .register(
    defineCard({
      name: BALANCER,
      manaCost: "{0}",
      types: ["enchantment"],
      text: "Instant and sorcery spells you cast have affinity for creatures.",
      static: [
        grantAffinity(
          { typesAnyOf: ["instant", "sorcery"] },
          { type: "creature" },
          "Instant and sorcery spells you cast have affinity for creatures.",
        ),
      ],
    }),
  )
  .register(
    defineCard({
      name: STUDY,
      manaCost: "{3}{U}",
      types: ["sorcery"],
      text: "Draw a card.",
      effect: { kind: "draw", amount: 1 },
    }),
  );

const setUp = (players: readonly PlayerId[], hand: readonly string[] = []) => {
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)])) as Record<
    string,
    ScriptedController
  >;
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((player) => ({
      player,
      cards: [...(player === A ? hand : []), ...Array<string>(40).fill("Island")],
    })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, controllers };
};

const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const setLife = (game: Game, lives: Partial<Record<PlayerId, number>>): void => {
  for (const [player, life] of Object.entries(lives)) {
    if (life !== undefined) game.state.players[player as PlayerId].life = life;
  }
};
const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";
const fired = (game: Game, source: ObjectId): number =>
  game.eventsOfType("ability-triggered").filter((e) => e.source === source).length;
const plusOnes = (game: Game, id: ObjectId): number => game.state.objects[id].counters["+1/+1"] ?? 0;
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

describe("dethrone", () => {
  it("attacking the player with the most life: a +1/+1 counter", () => {
    const { game, controllers } = setUp([A, B, C]);
    setLife(game, { [B]: 25 });
    const attacker = spawn(game, DETHRONER, A);
    controllers[A].declareAttackersFn = () => [{ attacker, defender: B }];
    game.advanceUntil(toPostcombat);
    expect(plusOnes(game, attacker)).toBe(1);
  });

  it("…not a player with less than the most", () => {
    const { game, controllers } = setUp([A, B, C]);
    setLife(game, { [B]: 25 });
    const attacker = spawn(game, DETHRONER, A);
    controllers[A].declareAttackersFn = () => [{ attacker, defender: C }];
    game.advanceUntil(toPostcombat);
    expect(fired(game, attacker)).toBe(0);
    expect(plusOnes(game, attacker)).toBe(0);
  });

  it("tied for the most counts — every player at 20", () => {
    const { game, controllers } = setUp([A, B, C]);
    const attacker = spawn(game, DETHRONER, A);
    controllers[A].declareAttackersFn = () => [{ attacker, defender: C }];
    game.advanceUntil(toPostcombat);
    expect(plusOnes(game, attacker)).toBe(1);
  });

  it("you're compared too: with the most life yourself, an opponent isn't it", () => {
    const { game, controllers } = setUp([A, B]);
    setLife(game, { [A]: 30 });
    const attacker = spawn(game, DETHRONER, A);
    controllers[A].declareAttackersFn = () => [{ attacker, defender: B }];
    game.advanceUntil(toPostcombat);
    expect(fired(game, attacker)).toBe(0);
  });

  it("attacking that player's planeswalker isn't attacking the player", () => {
    const { game, controllers } = setUp([A, B]);
    const attacker = spawn(game, DETHRONER, A);
    const walker = spawn(game, "Garruk Wildspeaker", B);
    controllers[A].declareAttackersFn = () => [{ attacker, defender: walker }];
    game.advanceUntil(toPostcombat);
    expect(fired(game, attacker)).toBe(0);
  });

  it("not an intervening-if: the counter goes on though the defender has since lost life", () => {
    const { game, controllers } = setUp([A, B, C]);
    setLife(game, { [B]: 25 });
    const attacker = spawn(game, DETHRONER, A);
    controllers[A].declareAttackersFn = () => [{ attacker, defender: B }];
    game.advanceUntil((s) => s.zones.shared.stack.length > 0);
    setLife(game, { [B]: 5 });
    game.advanceUntil(toPostcombat);
    expect(plusOnes(game, attacker)).toBe(1);
  });

  it("granted: other creatures you control have it, and each triggers for itself", () => {
    const { game, controllers } = setUp([A, B]);
    const rose = spawn(game, ROSE, A);
    const bears = spawn(game, "Grizzly Bears", A);
    const giant = spawn(game, "Hill Giant", A);
    controllers[A].declareAttackersFn = () => [
      { attacker: rose, defender: B },
      { attacker: bears, defender: B },
      { attacker: giant, defender: B },
    ];
    game.advanceUntil(toPostcombat);
    // The Rose has one printed instance and doesn't grant itself another.
    expect([plusOnes(game, rose), plusOnes(game, bears), plusOnes(game, giant)]).toEqual([1, 1, 1]);
  });
});

describe("'if that opponent has more life than another of your opponents'", () => {
  it("fires when the attacked opponent isn't the lowest", () => {
    const { game, controllers } = setUp([A, B, C, D]);
    setLife(game, { [B]: 25 });
    const demagogue = spawn(game, DEMAGOGUE, A);
    const attacker = spawn(game, "Grizzly Bears", A);
    const before = game.handOf(A).length;
    controllers[A].declareAttackersFn = () => [{ attacker, defender: B }];
    game.advanceUntil(toPostcombat);
    expect(fired(game, demagogue)).toBe(1);
    expect(game.handOf(A).length).toBe(before + 1);
  });

  it("not when every other opponent has at least as much", () => {
    const { game, controllers } = setUp([A, B, C, D]);
    const demagogue = spawn(game, DEMAGOGUE, A);
    const attacker = spawn(game, "Grizzly Bears", A);
    controllers[A].declareAttackersFn = () => [{ attacker, defender: B }];
    game.advanceUntil(toPostcombat);
    expect(fired(game, demagogue)).toBe(0);
  });

  it("you aren't one of the opponents compared", () => {
    const { game, controllers } = setUp([A, B, C]);
    // Bob has more than Alice, but Carol is Alice's only other opponent.
    setLife(game, { [A]: 5, [B]: 20, [C]: 20 });
    const demagogue = spawn(game, DEMAGOGUE, A);
    const attacker = spawn(game, "Grizzly Bears", A);
    controllers[A].declareAttackersFn = () => [{ attacker, defender: B }];
    game.advanceUntil(toPostcombat);
    expect(fired(game, demagogue)).toBe(0);
  });

  it("asked again as it resolves: removed once the opponent has become the lowest", () => {
    const { game, controllers } = setUp([A, B, C, D]);
    setLife(game, { [B]: 25 });
    spawn(game, DEMAGOGUE, A);
    const attacker = spawn(game, "Grizzly Bears", A);
    const before = game.handOf(A).length;
    controllers[A].declareAttackersFn = () => [{ attacker, defender: B }];
    game.advanceUntil((s) => s.zones.shared.stack.length > 0);
    setLife(game, { [B]: 10 });
    game.advanceUntil(toPostcombat);
    expect(game.handOf(A).length).toBe(before);
    expect(
      game.eventsOfType("spell-fizzled").some((e) => e.reason === "its intervening-if condition is no longer met"),
    ).toBe(true);
  });
});

describe("affinity", () => {
  it("printed: {1} less for each artifact you control — yours only, generic only", () => {
    const { game } = setUp([A, B], [GOLEM]);
    for (let i = 0; i < 3; i += 1) spawn(game, "Sol Ring", A);
    spawn(game, "Sol Ring", B);
    // The Sol Rings would pay for it all: keep them out of it.
    for (const id of game.state.zones.shared.battlefield) game.state.objects[id].tapped = true;
    const islands = Array.from({ length: 5 }, () => spawn(game, "Island", A));
    const golem = game.handOf(A).find((id) => game.state.objects[id].cardName === GOLEM)!;
    game.dispatch({ type: "cast-spell", player: A, card: golem, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[golem].zone).toBe("battlefield");
    // {4}{U} less three: {1}{U}.
    expect(islands.filter((id) => game.state.objects[id].tapped)).toHaveLength(2);
  });

  it("…and never below its coloured mana", () => {
    const { game } = setUp([A, B], [GOLEM]);
    for (let i = 0; i < 6; i += 1) spawn(game, "Sol Ring", A);
    for (const id of game.state.zones.shared.battlefield) game.state.objects[id].tapped = true;
    const islands = Array.from({ length: 2 }, () => spawn(game, "Island", A));
    const golem = game.handOf(A).find((id) => game.state.objects[id].cardName === GOLEM)!;
    game.dispatch({ type: "cast-spell", player: A, card: golem, targets: [] });
    game.advanceUntil(quiet);
    expect(islands.filter((id) => game.state.objects[id].tapped)).toHaveLength(1);
  });

  it("granted to your instants and sorceries: {1} less for each creature you control", () => {
    const { game } = setUp([A, B], [STUDY]);
    spawn(game, BALANCER, A);
    spawn(game, "Grizzly Bears", A);
    spawn(game, "Hill Giant", A);
    spawn(game, "Grizzly Bears", B);
    const islands = Array.from({ length: 4 }, () => spawn(game, "Island", A));
    const study = game.handOf(A).find((id) => game.state.objects[id].cardName === STUDY)!;
    game.dispatch({ type: "cast-spell", player: A, card: study, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[study].zone).toBe("graveyard");
    // {3}{U} less two: {1}{U}.
    expect(islands.filter((id) => game.state.objects[id].tapped)).toHaveLength(2);
  });

  it("two grants are two instances: each applies", () => {
    const { game } = setUp([A, B], [STUDY]);
    spawn(game, BALANCER, A);
    spawn(game, BALANCER, A);
    spawn(game, "Grizzly Bears", A);
    const islands = Array.from({ length: 4 }, () => spawn(game, "Island", A));
    const study = game.handOf(A).find((id) => game.state.objects[id].cardName === STUDY)!;
    game.dispatch({ type: "cast-spell", player: A, card: study, targets: [] });
    game.advanceUntil(quiet);
    expect(islands.filter((id) => game.state.objects[id].tapped)).toHaveLength(2);
  });

  it("…not to a creature spell", () => {
    const { game } = setUp([A, B], [GOLEM]);
    spawn(game, BALANCER, A);
    spawn(game, "Grizzly Bears", A);
    spawn(game, "Hill Giant", A);
    const islands = Array.from({ length: 5 }, () => spawn(game, "Island", A));
    const golem = game.handOf(A).find((id) => game.state.objects[id].cardName === GOLEM)!;
    game.dispatch({ type: "cast-spell", player: A, card: golem, targets: [] });
    game.advanceUntil(quiet);
    expect(islands.filter((id) => game.state.objects[id].tapped)).toHaveLength(5);
  });
});
