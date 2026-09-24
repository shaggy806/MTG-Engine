/**
 * A resolution that stops to ask someone something waits for the answer
 * before carrying on (rule 608.2c — a spell's instructions are followed in
 * order). "Discard a card, then draw a card" draws only once the discard has
 * been chosen, so the card drawn can't be the one discarded; "each player
 * sacrifices six creatures. You create six Zombies" makes the Zombies only
 * after every sacrifice has been chosen, so none of them can be sacrificed.
 *
 * The steps after the one that asked are parked in
 * `GameState.suspendedResolutions` and resumed once every decision they are
 * waiting on — including queued prompts to other players — has been
 * answered. Until then the spell is still resolving: no state-based actions
 * are performed (rule 704.3) and no triggered ability goes on the stack.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const sorcery = (name: string, text: string, effect: EffectSpec) =>
  defineCard({ name, manaCost: "{0}", types: ["sorcery"], text, effect });

/** "Discard a card, then draw a card." */
const RUMMAGE = "Test Rummage";
/** "Each opponent sacrifices a creature. Then you draw a card." */
const EDICT_DRAW = "Test Edict Then Draw";
/** "Deal 2 damage to each creature. Each player sacrifices a creature." */
const SCORCH_EDICT = "Test Scorch Then Edict";
/** "You may discard a card. If you do, draw a card. You gain 3 life." */
const MAYBE_RUMMAGE = "Test Maybe Rummage";
/** "Choose one — you gain 1 life; or you gain 2 life. Each opponent loses 1 life." */
const MODAL_THEN = "Test Modal Then Drain";
/** "{X}, {T}: Target player discards a card, then this deals X damage to that
 * player." */
const PUNISHER = "Test Discard Punisher";
/** "Whenever another creature you control enters, discard a card, then gain
 * life equal to its power." */
const WELCOME = "Test Discard Welcome";

const registry = createDefaultRegistry()
  .register(
    sorcery(RUMMAGE, "Discard a card, then draw a card.", {
      kind: "sequence",
      effects: [
        { kind: "discard", target: "you", amount: 1 },
        { kind: "draw", amount: 1 },
      ],
    }),
  )
  .register(
    sorcery(EDICT_DRAW, "Each opponent sacrifices a creature. Then you draw a card.", {
      kind: "sequence",
      effects: [
        { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 1 },
        { kind: "draw", amount: 1 },
      ],
    }),
  )
  .register(
    sorcery(SCORCH_EDICT, "Deal 2 damage to each creature. Each player sacrifices a creature.", {
      kind: "sequence",
      effects: [
        { kind: "damage-all", filter: { type: "creature" }, amount: 2 },
        { kind: "sacrifice", who: "each-player", filter: { type: "creature" }, count: 1 },
      ],
    }),
  )
  .register(
    sorcery(MAYBE_RUMMAGE, "You may discard a card. If you do, draw a card. You gain 3 life.", {
      kind: "sequence",
      effects: [
        {
          kind: "may",
          prompt: "Discard a card?",
          effect: { kind: "discard", target: "you", amount: 1 },
          then: { kind: "draw", amount: 1 },
        },
        { kind: "gain-life", amount: 3 },
      ],
    }),
  )
  .register(
    sorcery(MODAL_THEN, "Choose one — You gain 1 life; or you gain 2 life. Each opponent loses 1 life.", {
      kind: "sequence",
      effects: [
        {
          kind: "modal",
          minModes: 1,
          maxModes: 1,
          modes: [
            { text: "You gain 1 life.", effect: { kind: "gain-life", amount: 1 } },
            { text: "You gain 2 life.", effect: { kind: "gain-life", amount: 2 } },
          ],
        },
        { kind: "lose-life", amount: 1, who: "each-opponent" },
      ],
    }),
  )
  .register(
    defineCard({
      name: PUNISHER,
      manaCost: "{0}",
      types: ["artifact"],
      text: "{X}, {T}: Target player discards a card, then this deals X damage to that player.",
      activated: [
        {
          cost: { mana: "{X}", tap: true },
          targets: ["player"],
          effect: {
            kind: "sequence",
            effects: [
              { kind: "discard", target: 0, amount: 1 },
              { kind: "damage", target: 0, amount: "x" },
            ],
          },
          resolve: null,
          text: "{X}, {T}: Target player discards a card, then this deals X damage to that player.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: WELCOME,
      manaCost: "{0}",
      types: ["enchantment"],
      text: "Whenever another creature you control enters, discard a card, then gain life equal to its power.",
      triggered: [
        {
          trigger: {
            on: "enters-battlefield",
            who: "you-control",
            filter: { type: "creature" },
          },
          targets: [],
          effect: {
            kind: "sequence",
            effects: [
              { kind: "discard", target: "you", amount: 1 },
              { kind: "gain-life", amount: { triggerValue: true } },
            ],
          },
          resolve: null,
          text: "Whenever another creature you control enters, discard a card, then gain life equal to its power.",
        },
      ],
    }),
  );

const setUp = (
  hands: Partial<Record<PlayerId, readonly string[]>> = {},
  players: readonly PlayerId[] = [A, B],
) => {
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)]));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((player) => ({
      player,
      cards: [...(hands[player] ?? []), ...Array<string>(40).fill("Island")],
    })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, controllers: controllers as Record<PlayerId, ScriptedController> };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in ${player}'s hand`);
  return id;
};
const namesInHand = (game: Game, player: PlayerId): string[] =>
  game.handOf(player).map((id) => game.state.objects[id].cardName);
const cast = (game: Game, player: PlayerId, name: string): void => {
  game.dispatch({ type: "cast-spell", player, card: inHand(game, player, name), targets: [] });
};
const awaiting = (kind: string) => (s: GameState): boolean => s.awaiting?.kind === kind;
const eventTypes = (game: Game, from: number, types: readonly string[]): string[] =>
  game.state.eventLog
    .slice(from)
    .map((e) => e.type)
    .filter((t) => types.includes(t));
const creaturesOf = (game: Game, player: PlayerId, name: string): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].controller === player && game.state.objects[id].cardName === name,
  );

describe("a step after a discard waits for the discard", () => {
  it("draws only once the card to discard has been chosen", () => {
    const { game } = setUp({ [A]: [RUMMAGE, "Grizzly Bears", "Lightning Bolt"] });
    const topOfLibrary = game.state.zones.perPlayer[A].library[0];
    cast(game, A, RUMMAGE);
    game.advanceUntil(awaiting("discard"));

    // Asked with the draw still to come: the next card isn't in hand yet.
    expect(game.handOf(A)).not.toContain(topOfLibrary);
    expect(game.state.suspendedResolutions).toHaveLength(1);

    game.dispatch({ type: "discard", player: A, cards: [inHand(game, A, "Grizzly Bears")] });
    game.advanceUntil(quiet);
    expect(game.handOf(A)).toContain(topOfLibrary);
    expect(namesInHand(game, A)).not.toContain("Grizzly Bears");
    expect(namesInHand(game, A)).toContain("Lightning Bolt");
  });

  it("Rydia, Summoner of Mist loots rather than draws first", () => {
    const { game, controllers } = setUp({ [A]: ["Forest", "Lightning Bolt", "Grizzly Bears"] });
    controllers[A].chooseModesFn = () => [0];
    game.debugSpawn("Rydia, Summoner of Mist", A, "battlefield");
    const topOfLibrary = game.state.zones.perPlayer[A].library[0];
    game.dispatch({ type: "play-land", player: A, card: inHand(game, A, "Forest") });
    game.advanceUntil(awaiting("discard"));
    expect(game.handOf(A)).not.toContain(topOfLibrary);

    game.dispatch({ type: "discard", player: A, cards: [inHand(game, A, "Lightning Bolt")] });
    game.advanceUntil(quiet);
    expect(game.handOf(A)).toContain(topOfLibrary);
  });
});

describe("a step after an edict waits for every player's choice", () => {
  it("Necrotic Hex's Zombies can't be among the creatures sacrificed to it", () => {
    const { game } = setUp({ [A]: ["Necrotic Hex"] });
    for (let i = 0; i < 7; i += 1) game.debugSpawn("Grizzly Bears", A, "battlefield");
    for (let i = 0; i < 7; i += 1) game.debugSpawn("Swamp", A, "battlefield");
    for (let i = 0; i < 6; i += 1) game.debugSpawn("Grizzly Bears", B, "battlefield");
    cast(game, A, "Necrotic Hex");
    game.advanceUntil(awaiting("sacrifice"));

    const decision = game.state.awaiting;
    if (decision?.kind !== "sacrifice") throw new Error("expected a sacrifice decision");
    expect(decision.player).toBe(A);
    expect(decision.eligible.every((id) => game.state.objects[id].cardName === "Grizzly Bears")).toBe(
      true,
    );
    expect(creaturesOf(game, A, "Zombie Token")).toHaveLength(0);

    game.dispatch({ type: "sacrifice", player: A, permanents: decision.eligible.slice(0, 6) });
    game.advanceUntil(quiet);
    expect(creaturesOf(game, A, "Grizzly Bears")).toHaveLength(1);
    expect(creaturesOf(game, B, "Grizzly Bears")).toHaveLength(0);
    const zombies = creaturesOf(game, A, "Zombie Token");
    const tokens = zombies.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(tokens).toBe(6);
  });

  it("draws after both opponents have sacrificed, not before", () => {
    const { game } = setUp({ [A]: [EDICT_DRAW] }, [A, B, C]);
    for (const p of [B, C]) {
      game.debugSpawn("Grizzly Bears", p, "battlefield");
      game.debugSpawn("Hill Giant", p, "battlefield");
    }
    const from = game.state.eventLog.length;
    cast(game, A, EDICT_DRAW);
    game.advanceUntil(quiet);

    expect(eventTypes(game, from, ["permanent-sacrificed", "card-drawn"])).toEqual([
      "permanent-sacrificed",
      "permanent-sacrificed",
      "card-drawn",
    ]);
  });
});

describe("the spell is still resolving while it waits", () => {
  it("a creature dealt lethal damage by an earlier step can still be sacrificed to a later one", () => {
    const { game, controllers } = setUp({ [A]: [SCORCH_EDICT] });
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const dreadmaw = game.debugSpawn("Colossal Dreadmaw", B, "battlefield");
    let offered: readonly ObjectId[] = [];
    controllers[B].chooseSacrificesFn = (_view, eligible) => {
      offered = eligible;
      return [bears];
    };
    cast(game, A, SCORCH_EDICT);
    game.advanceUntil(quiet);

    // No state-based actions between the damage and the sacrifice: the
    // lethally damaged Bears were still there to be chosen.
    expect(offered).toEqual(expect.arrayContaining([bears, dreadmaw]));
    expect(game.state.objects[dreadmaw].zone).toBe("battlefield");
    expect(game.state.objects[bears].zone).toBe("graveyard");
  });

  it("state-based actions are only put off, not skipped", () => {
    const { game, controllers } = setUp({ [A]: [SCORCH_EDICT] });
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const dreadmaw = game.debugSpawn("Colossal Dreadmaw", B, "battlefield");
    controllers[B].chooseSacrificesFn = () => [dreadmaw];
    cast(game, A, SCORCH_EDICT);
    game.advanceUntil(quiet);

    expect(game.state.objects[dreadmaw].zone).toBe("graveyard");
    // Dies to its damage once the spell has finished resolving.
    expect(game.state.objects[bears].zone).toBe("graveyard");
  });
});

describe("parked steps inside and after a choice", () => {
  it("a discard inside a chosen 'may' finishes before the steps after the 'may'", () => {
    const { game, controllers } = setUp({ [A]: [MAYBE_RUMMAGE, "Grizzly Bears", "Hill Giant"] });
    controllers[A].chooseModesFn = () => [0];
    const from = game.state.eventLog.length;
    cast(game, A, MAYBE_RUMMAGE);
    game.advanceUntil(awaiting("discard"));
    expect(game.state.players[A].life).toBe(20);

    game.dispatch({ type: "discard", player: A, cards: [inHand(game, A, "Hill Giant")] });
    game.advanceUntil(quiet);
    expect(eventTypes(game, from, ["cards-discarded", "card-drawn", "life-changed"])).toEqual([
      "cards-discarded",
      "card-drawn",
      "life-changed",
    ]);
    expect(game.state.players[A].life).toBe(23);
  });

  it("declining the 'may' still carries on with the rest", () => {
    const { game, controllers } = setUp({ [A]: [MAYBE_RUMMAGE, "Grizzly Bears"] });
    controllers[A].chooseModesFn = () => [];
    cast(game, A, MAYBE_RUMMAGE);
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(23);
    expect(namesInHand(game, A)).toContain("Grizzly Bears");
  });

  it("a modal step no longer has to be the last one", () => {
    const { game, controllers } = setUp({ [A]: [MODAL_THEN] });
    controllers[A].chooseModesFn = () => [1];
    cast(game, A, MODAL_THEN);
    game.advanceUntil(awaiting("choose-modes"));
    expect(game.state.players[B].life).toBe(20);
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(22);
    expect(game.state.players[B].life).toBe(19);
  });
});

describe("the rest resumes as the same spell or ability", () => {
  it("keeps an activated ability's target and X", () => {
    const { game } = setUp({ [B]: ["Grizzly Bears", "Hill Giant"] });
    const punisher = game.debugSpawn(PUNISHER, A, "battlefield");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Island", A, "battlefield");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: punisher,
      abilityIndex: 0,
      targets: [{ kind: "player", player: B }],
      xValue: 3,
    });
    game.advanceUntil(awaiting("discard"));
    expect(game.state.players[B].life).toBe(20);
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(17);
  });

  it("keeps a triggered ability's trigger value", () => {
    const { game } = setUp({ [A]: ["Hill Giant", "Grizzly Bears"] });
    game.debugSpawn(WELCOME, A, "battlefield");
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    cast(game, A, "Hill Giant");
    game.advanceUntil(awaiting("discard"));
    expect(game.state.players[A].life).toBe(20);
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(23);
  });
});
