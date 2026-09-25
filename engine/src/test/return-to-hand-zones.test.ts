/**
 * `return-to-hand` from somewhere other than the battlefield — the effect's
 * `from` field:
 *
 * - `"stack"`: a spell back to its owner's hand (Unsubstantiate; Venser,
 *   Shaper Savant — neither pooled, so a test card stands in). Not a counter,
 *   so a spell that can't be countered goes back all the same and nothing
 *   sees a `spell-countered`; a copy of a spell ceases to exist (rule
 *   707.10c).
 * - Remand, by contrast, *is* a counter (`counter` with `into: "hand"`): a
 *   spell that can't be countered stays on the stack and resolves.
 * - `"graveyard"` / `"exile"`: a targeted card, or with `"source"` /
 *   `"trigger-object"` the card behind the ability — now, or on a delayed
 *   trigger. The object has to still be in that zone.
 * - A commander put into its owner's hand from any of these may go to the
 *   command zone instead (rule 903.9b), exactly like a bounced one.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry, defineCard } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Test-only cards for the `"source"` / `"trigger-object"` / delayed forms,
 * none of which a pooled card uses yet. Never pooled. */
const HOMING = "Test Homing Bear";
const DELAYED = "Test Delayed Homing Bear";
const SHEPHERD = "Test Shepherd";
const EXILE_HOME = "Test Exile Homing Bear";
const SELF_RETURN = "Test Self Return";
const CAST_RETURN = "Test Cast Return";
/** "Return target spell to its owner's hand" — the non-counter stack bounce
 * (Unsubstantiate's spell half, Venser's ETB), with Remand's draw bolted on. */
const STACK_BOUNCE = "Test Spell Bounce";
/** "Return a card from your graveyard to your hand", chosen as it resolves
 * (a `choose-from-zone`) — the shape Regrowth had before it targeted. */
const GRAVE_PICK = "Test Graveyard Pick";
const registry = createDefaultRegistry().register(
  defineCard({
    name: STACK_BOUNCE,
    manaCost: "{1}{U}",
    colors: ["U"],
    types: ["instant"],
    text: "Return target spell to its owner's hand.\nDraw a card.",
    targets: ["spell"],
    effect: {
      kind: "sequence",
      effects: [
        { kind: "return-to-hand", target: 0, from: "stack" },
        { kind: "draw", amount: 1 },
      ],
    },
  }),
).register(
  defineCard({
    name: HOMING,
    manaCost: "{1}{G}",
    colors: ["G"],
    types: ["creature"],
    power: 2,
    toughness: 2,
    text: "When this creature dies, return it to its owner's hand.",
    triggered: [
      {
        trigger: { on: "dies", who: "self" },
        targets: [],
        effect: { kind: "return-to-hand", target: "source", from: "graveyard" },
        resolve: null,
        text: "When this creature dies, return it to its owner's hand.",
      },
    ],
  }),
).register(
  defineCard({
    name: DELAYED,
    manaCost: "{1}{G}",
    colors: ["G"],
    types: ["creature"],
    power: 2,
    toughness: 2,
    text:
      "When this creature dies, return it to its owner's hand at the beginning of the next end step.",
    triggered: [
      {
        trigger: { on: "dies", who: "self" },
        targets: [],
        effect: {
          kind: "delayed-trigger",
          at: "next-end-step",
          effect: { kind: "return-to-hand", target: "source", from: "graveyard" },
          text: "Return it to its owner's hand.",
        },
        resolve: null,
        text:
          "When this creature dies, return it to its owner's hand at the beginning of the next end step.",
      },
    ],
  }),
).register(
  defineCard({
    name: SHEPHERD,
    manaCost: "{2}{G}",
    colors: ["G"],
    types: ["creature"],
    power: 1,
    toughness: 1,
    text: "Whenever another creature you control dies, return that card to its owner's hand.",
    triggered: [
      {
        trigger: { on: "dies", who: "you-control", otherOnly: true },
        targets: [],
        effect: { kind: "return-to-hand", target: "trigger-object", from: "graveyard" },
        resolve: null,
        text: "Whenever another creature you control dies, return that card to its owner's hand.",
      },
    ],
  }),
).register(
  defineCard({
    name: EXILE_HOME,
    manaCost: "{1}{W}",
    colors: ["W"],
    types: ["creature"],
    power: 2,
    toughness: 2,
    text: "When this creature leaves the battlefield, return it from exile to its owner's hand.",
    triggered: [
      {
        trigger: { on: "leaves-battlefield", who: "self" },
        targets: [],
        effect: { kind: "return-to-hand", target: "source", from: "exile" },
        resolve: null,
        text: "When this creature leaves the battlefield, return it from exile to its owner's hand.",
      },
    ],
  }),
).register(
  defineCard({
    name: CAST_RETURN,
    manaCost: "{U}",
    colors: ["U"],
    types: ["sorcery"],
    text: "When you cast this spell, return it to its owner's hand.\nYou gain 5 life.",
    triggered: [
      {
        trigger: { on: "this-cast" },
        targets: [],
        effect: { kind: "return-to-hand", target: "source", from: "stack" },
        resolve: null,
        text: "When you cast this spell, return it to its owner's hand.",
      },
    ],
    effect: { kind: "gain-life", amount: 5 },
  }),
).register(
  defineCard({
    name: SELF_RETURN,
    manaCost: "{U}",
    colors: ["U"],
    types: ["sorcery"],
    text: "Return this spell to its owner's hand.",
    effect: { kind: "return-to-hand", target: "source", from: "stack" },
  }),
).register(
  defineCard({
    name: GRAVE_PICK,
    manaCost: "{1}{G}",
    colors: ["G"],
    types: ["sorcery"],
    text: "Return a card from your graveyard to your hand.",
    effect: { kind: "look-and-choose", zone: "graveyard", min: 1, max: 1, destination: "hand", leftover: "stay" },
  }),
);

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array<string>(Math.max(0, 40 - cards.length)).fill("Plains"),
];

const mkGame = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: pad([]) },
      { player: B, cards: pad([]) },
    ],
  });
  game.advanceUntil(
    (s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  return game;
};

const lands = (game: Game, name: string, player: PlayerId, n: number): void => {
  for (let i = 0; i < n; i += 1) {
    game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: false });
  }
};
const toHand = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "hand");
const zoneOf = (game: Game, id: ObjectId): string | undefined => game.state.objects[id]?.zone;
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

/** A casts `spell` (with `targets`), then passes; B answers with `answer`
 * (the test bounce by default, or Remand) aimed at the spell. */
const castThenAnswer = (
  game: Game,
  spell: ObjectId,
  targets: { kind: "player"; player: PlayerId }[] = [],
  answer: string = STACK_BOUNCE,
): ObjectId => {
  game.dispatch({ type: "cast-spell", player: A, card: spell, targets });
  game.dispatch({ type: "pass-priority", player: A });
  const response = toHand(game, answer, B);
  game.dispatch({
    type: "cast-spell",
    player: B,
    card: response,
    targets: [{ kind: "object", object: spell }],
  });
  return response;
};

/** A casts Lightning Bolt at B and copies it with Twincast, then passes;
 * B answers the copy with `answer`. Returns the copy's id. */
const answerTwincastCopy = (game: Game, answer: string): ObjectId => {
  lands(game, "Mountain", A, 1);
  lands(game, "Island", A, 2);
  lands(game, "Island", B, 2);
  const bolt = toHand(game, "Lightning Bolt", A);
  const twincast = toHand(game, "Twincast", A);
  game.dispatch({
    type: "cast-spell",
    player: A,
    card: bolt,
    targets: [{ kind: "player", player: B }],
  });
  game.dispatch({
    type: "cast-spell",
    player: A,
    card: twincast,
    targets: [{ kind: "object", object: bolt }],
  });
  // Resolve Twincast only: both pass once.
  const stackBefore = new Set(game.state.zones.shared.stack);
  game.dispatch({ type: "pass-priority", player: A });
  game.dispatch({ type: "pass-priority", player: B });
  // Keep the copy's target if asked.
  for (let i = 0; i < 5 && game.state.awaiting !== null; i += 1) {
    const aw = game.state.awaiting;
    if (aw.kind !== "choose-modes") break;
    game.dispatch({ type: "choose-modes", player: aw.player, modes: [] });
  }
  const copy = game.state.zones.shared.stack.find((id) => !stackBefore.has(id));
  if (copy === undefined) throw new Error("Twincast made no copy");
  expect(game.state.objects[copy].isCopy).toBe(true);

  game.dispatch({ type: "pass-priority", player: A });
  const response = toHand(game, answer, B);
  game.dispatch({
    type: "cast-spell",
    player: B,
    card: response,
    targets: [{ kind: "object", object: copy }],
  });
  return copy;
};

const inAnyHandOrGraveyard = (game: Game, id: ObjectId): boolean =>
  [A, B].some((p) => {
    const zones = game.state.zones.perPlayer[p];
    return zones.hand.includes(id) || zones.graveyard.includes(id);
  });

describe("return-to-hand from the stack — a spell bounce", () => {
  it("returns the spell to its owner's hand and draws a card, without countering it", () => {
    const game = mkGame();
    lands(game, "Forest", A, 2);
    lands(game, "Island", B, 2);
    const bears = toHand(game, "Grizzly Bears", A);
    const bHandBefore = game.state.zones.perPlayer[B].hand.length;

    const bounce = castThenAnswer(game, bears);
    game.advanceUntil(quiet);

    expect(zoneOf(game, bears)).toBe("hand");
    expect(game.state.zones.perPlayer[A].hand).toContain(bears);
    expect(game.state.objects[bears].targets).toBeNull();
    expect(game.battlefield).not.toContain(bears);
    // The bounce was put into B's hand (+1), cast (−1), and drew a card (+1).
    expect(game.state.zones.perPlayer[B].hand.length).toBe(bHandBefore + 1);
    expect(zoneOf(game, bounce)).toBe("graveyard");
    expect(game.eventsOfType("spell-countered")).toHaveLength(0);
    expect(
      game
        .eventsOfType("permanent-returned-to-hand")
        .some((e) => e.object === bears && e.owner === A && e.from === "stack"),
    ).toBe(true);
  });

  it("returns a spell that can't be countered — it isn't a counter", () => {
    const game = mkGame();
    lands(game, "Forest", A, 6);
    lands(game, "Island", B, 2);
    const tyrant = toHand(game, "Carnage Tyrant", A);

    castThenAnswer(game, tyrant);
    game.advanceUntil(quiet);

    expect(zoneOf(game, tyrant)).toBe("hand");
    expect(game.eventsOfType("counter-failed")).toHaveLength(0);
  });

  it("a returned spell forgets its targets", () => {
    const game = mkGame();
    lands(game, "Mountain", A, 1);
    lands(game, "Island", B, 2);
    const bolt = toHand(game, "Lightning Bolt", A);
    castThenAnswer(game, bolt, [{ kind: "player", player: B }]);
    game.advanceUntil(quiet);

    expect(zoneOf(game, bolt)).toBe("hand");
    expect(game.state.objects[bolt].targets).toBeNull();
    expect(game.state.players[B].life).toBe(20);
  });

  it("does nothing to a spell that has already left the stack (the whole spell fizzles)", () => {
    const game = mkGame();
    lands(game, "Mountain", A, 1);
    lands(game, "Island", B, 4);
    const bolt = toHand(game, "Lightning Bolt", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
    });
    game.dispatch({ type: "pass-priority", player: A });
    const bounce = toHand(game, STACK_BOUNCE, B);
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: bounce,
      targets: [{ kind: "object", object: bolt }],
    });
    // B holds priority and counters the Bolt on top of their own bounce.
    const counter = toHand(game, "Counterspell", B);
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: counter,
      targets: [{ kind: "object", object: bolt }],
    });
    game.advanceUntil(quiet);

    expect(zoneOf(game, bolt)).toBe("graveyard");
    expect(
      game.eventsOfType("spell-fizzled").some((e) => e.object === bounce),
    ).toBe(true);
  });

  it("a copy of a spell ceases to exist instead (rule 707.10c)", () => {
    const game = mkGame();
    const copy = answerTwincastCopy(game, STACK_BOUNCE);
    game.advanceUntil(quiet);

    expect(game.state.objects[copy]).toBeUndefined();
    expect(inAnyHandOrGraveyard(game, copy)).toBe(false);
    // Only the original Bolt hit B.
    expect(game.state.players[B].life).toBe(17);
  });
});

describe("Remand — counter target spell, into its owner's hand instead", () => {
  it("counters a spell into its owner's hand, and draws a card", () => {
    const game = mkGame();
    lands(game, "Forest", A, 2);
    lands(game, "Island", B, 2);
    const bears = toHand(game, "Grizzly Bears", A);
    const bHandBefore = game.state.zones.perPlayer[B].hand.length;

    const remand = castThenAnswer(game, bears, [], "Remand");
    game.advanceUntil(quiet);

    expect(zoneOf(game, bears)).toBe("hand");
    expect(game.state.zones.perPlayer[A].hand).toContain(bears);
    expect(game.state.zones.perPlayer[A].graveyard).not.toContain(bears);
    expect(game.state.objects[bears].targets).toBeNull();
    expect(game.battlefield).not.toContain(bears);
    // Remand was put into B's hand (+1), cast (−1), and drew a card (+1).
    expect(game.state.zones.perPlayer[B].hand.length).toBe(bHandBefore + 1);
    expect(zoneOf(game, remand)).toBe("graveyard");
    expect(game.eventsOfType("spell-countered").some((e) => e.object === bears)).toBe(true);
  });

  it("a spell that can't be countered stays on the stack and resolves — Remand still draws", () => {
    const game = mkGame();
    lands(game, "Forest", A, 6);
    lands(game, "Island", B, 2);
    const tyrant = toHand(game, "Carnage Tyrant", A);
    const bHandBefore = game.state.zones.perPlayer[B].hand.length;

    const remand = castThenAnswer(game, tyrant, [], "Remand");
    game.advanceUntil((s) => s.objects[remand]?.zone === "graveyard");

    // Remand has resolved: the Tyrant is still there, and the draw happened.
    expect(zoneOf(game, tyrant)).toBe("stack");
    expect(game.eventsOfType("counter-failed").some((e) => e.object === tyrant)).toBe(true);
    expect(game.eventsOfType("spell-countered")).toHaveLength(0);
    expect(game.state.zones.perPlayer[B].hand.length).toBe(bHandBefore + 1);

    game.advanceUntil(quiet);
    expect(zoneOf(game, tyrant)).toBe("battlefield");
    expect(game.state.zones.perPlayer[A].hand).not.toContain(tyrant);
  });

  it("a countered copy of a spell ceases to exist (rule 707.10c)", () => {
    const game = mkGame();
    const copy = answerTwincastCopy(game, "Remand");
    game.advanceUntil(quiet);

    expect(game.state.objects[copy]).toBeUndefined();
    expect(inAnyHandOrGraveyard(game, copy)).toBe(false);
    expect(game.eventsOfType("spell-countered").some((e) => e.object === copy)).toBe(true);
    // Only the original Bolt hit B.
    expect(game.state.players[B].life).toBe(17);
  });
});

describe.each([STACK_BOUNCE, "Remand"])("a flashed-back spell answered by %s", (answer) => {
  it("is exiled instead, since it would leave the stack (rule 702.34a)", () => {
    const game = mkGame();
    lands(game, "Mountain", A, 2);
    lands(game, "Island", B, 2);
    const loot = game.debugSpawn("Faithless Looting", A, "graveyard");
    game.dispatch({ type: "cast-spell", player: A, card: loot, targets: [], via: "flashback" });
    expect(zoneOf(game, loot)).toBe("stack");
    game.dispatch({ type: "pass-priority", player: A });
    const response = toHand(game, answer, B);
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: response,
      targets: [{ kind: "object", object: loot }],
    });
    game.advanceUntil(quiet);

    expect(zoneOf(game, loot)).toBe("exile");
    expect(
      game.eventsOfType("permanent-returned-to-hand").some((e) => e.object === loot),
    ).toBe(false);
  });
});

describe.each([STACK_BOUNCE, "Remand"])(
  "rule 903.9b — a commander sent to hand from the stack by %s",
  (answer) => {
    const answerCommander = (toCommandZone: boolean): { game: Game; cmdr: ObjectId } => {
      const game = mkGame();
      lands(game, "Forest", A, 2);
      lands(game, "Island", B, 2);
      const cmdr = toHand(game, "Grizzly Bears", A);
      game.state.objects[cmdr].isCommander = true;
      castThenAnswer(game, cmdr, [], answer);
      game.advanceUntil((s) => s.awaiting?.kind === "commander-replacement" || quiet(s));
      const awaiting = game.state.awaiting;
      expect(awaiting?.kind).toBe("commander-replacement");
      if (awaiting?.kind !== "commander-replacement") throw new Error("not asked");
      expect(awaiting.player).toBe(A);
      expect(awaiting.commander).toBe(cmdr);
      expect(awaiting.intendedZone).toBe("hand");
      // It waits on the stack, not somewhere half-moved.
      expect(zoneOf(game, cmdr)).toBe("stack");
      game.dispatch({ type: "commander-replacement", player: A, toCommandZone });
      game.advanceUntil(quiet);
      return { game, cmdr };
    };

    it("its owner may send it to the command zone", () => {
      const { game, cmdr } = answerCommander(true);
      expect(zoneOf(game, cmdr)).toBe("command");
      expect(game.state.zones.shared.stack).not.toContain(cmdr);
    });

    it("or let it go to their hand", () => {
      const { game, cmdr } = answerCommander(false);
      expect(zoneOf(game, cmdr)).toBe("hand");
      expect(game.state.deferredCommanderMove).toBeNull();
    });
  },
);

describe("return-to-hand from a graveyard", () => {
  it("'return it' off its own dies trigger — `source`, now", () => {
    const game = mkGame();
    lands(game, "Mountain", A, 1);
    const bear = game.debugSpawn(HOMING, B, "battlefield", { summoningSick: false });
    const bolt = toHand(game, "Lightning Bolt", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(quiet);

    expect(zoneOf(game, bear)).toBe("hand");
    expect(game.state.zones.perPlayer[B].hand).toContain(bear);
  });

  it("does nothing once the card has left the graveyard", () => {
    const game = mkGame();
    lands(game, "Mountain", A, 1);
    const bear = game.debugSpawn(HOMING, B, "battlefield", { summoningSick: false });
    const bolt = toHand(game, "Lightning Bolt", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "object", object: bear }],
    });
    // Let the Bolt resolve and the dies trigger go on the stack, then exile
    // the card out from under it.
    game.advanceUntil((s) => s.zones.shared.stack.some((id) => s.objects[id].kind === "ability"));
    expect(zoneOf(game, bear)).toBe("graveyard");
    // White-box: exiled out from under the trigger (no pooled instant does
    // this cheaply), straight between the zone lists.
    const gy = game.state.zones.perPlayer[B].graveyard;
    gy.splice(gy.indexOf(bear), 1);
    game.state.zones.shared.exile.push(bear);
    game.state.objects[bear].zone = "exile";
    game.advanceUntil(quiet);

    expect(zoneOf(game, bear)).toBe("exile");
  });

  it("'return that card' off another creature's dies trigger — `trigger-object`", () => {
    const game = mkGame();
    lands(game, "Mountain", A, 1);
    game.debugSpawn(SHEPHERD, B, "battlefield", { summoningSick: false });
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false });
    const bolt = toHand(game, "Lightning Bolt", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(quiet);

    expect(zoneOf(game, bears)).toBe("hand");
  });

  it("'at the beginning of the next end step' — `source` inside a delayed trigger", () => {
    const game = mkGame();
    lands(game, "Mountain", A, 1);
    const bear = game.debugSpawn(DELAYED, A, "battlefield", { summoningSick: false });
    const bolt = toHand(game, "Lightning Bolt", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(quiet);
    // Still in the graveyard until the end step.
    expect(zoneOf(game, bear)).toBe("graveyard");

    game.advanceUntil((s) => s.turn.step === "end" && quiet(s));
    expect(zoneOf(game, bear)).toBe("hand");
  });

  it("a commander returned from a graveyard offers the command zone too", () => {
    const game = mkGame();
    lands(game, "Mountain", A, 1);
    const bear = game.debugSpawn(HOMING, B, "battlefield", { summoningSick: false });
    game.state.objects[bear].isCommander = true;
    const bolt = toHand(game, "Lightning Bolt", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "object", object: bear }],
    });
    // First the dies half (903.9a), declined: it goes to the graveyard.
    game.advanceUntil((s) => s.awaiting?.kind === "commander-replacement");
    expect(game.state.awaiting?.kind === "commander-replacement" && game.state.awaiting.intendedZone).toBe("graveyard");
    game.dispatch({ type: "commander-replacement", player: B, toCommandZone: false });
    // Then the return to hand (903.9b), from the graveyard it waits in.
    game.advanceUntil((s) => s.awaiting?.kind === "commander-replacement" || quiet(s));
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind === "commander-replacement" && awaiting.intendedZone).toBe("hand");
    expect(zoneOf(game, bear)).toBe("graveyard");
    game.dispatch({ type: "commander-replacement", player: B, toCommandZone: true });
    game.advanceUntil(quiet);
    expect(zoneOf(game, bear)).toBe("command");
  });
});

describe("return-to-hand from exile", () => {
  it("moves an exiled card to its owner's hand", () => {
    const game = mkGame();
    lands(game, "Plains", A, 1);
    const bear = game.debugSpawn(EXILE_HOME, B, "battlefield", { summoningSick: false });
    const swords = toHand(game, "Swords to Plowshares", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: swords,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(quiet);

    expect(zoneOf(game, bear)).toBe("hand");
    expect(game.state.zones.perPlayer[B].hand).toContain(bear);
  });

  it("does nothing to a card that went to the graveyard instead", () => {
    const game = mkGame();
    lands(game, "Mountain", A, 1);
    const bear = game.debugSpawn(EXILE_HOME, B, "battlefield", { summoningSick: false });
    const bolt = toHand(game, "Lightning Bolt", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(quiet);

    expect(zoneOf(game, bear)).toBe("graveyard");
  });
});

describe("return-to-hand from the stack never takes the resolving spell itself", () => {
  it("the spell finishes resolving into its graveyard", () => {
    const game = mkGame();
    lands(game, "Island", A, 1);
    const spell = toHand(game, SELF_RETURN, A);
    game.dispatch({ type: "cast-spell", player: A, card: spell });
    game.advanceUntil(quiet);

    expect(zoneOf(game, spell)).toBe("graveyard");
    expect(game.state.zones.perPlayer[A].hand).not.toContain(spell);
    // …and never went to the hand on the way.
    expect(game.eventsOfType("permanent-returned-to-hand")).toHaveLength(0);
  });
});

describe("return-to-hand from the stack takes a spell its own trigger acts on", () => {
  it("'when you cast this spell, return it' — the spell never resolves", () => {
    const game = mkGame();
    lands(game, "Island", A, 1);
    const spell = toHand(game, CAST_RETURN, A);
    game.dispatch({ type: "cast-spell", player: A, card: spell });
    game.advanceUntil(quiet);

    expect(zoneOf(game, spell)).toBe("hand");
    expect(game.state.players[A].life).toBe(20);
  });
});

describe("rule 903.9b — a commander chosen out of a graveyard mid-decision", () => {
  it("is asked about once the choice is made, and waits in the graveyard meanwhile", () => {
    // The card is picked through a `choose-from-zone` decision, so the move to
    // hand happens while that decision is still on `awaiting` and the 903.9b
    // question has to queue behind it — the commander waiting in the
    // graveyard, not on the battlefield.
    const game = mkGame();
    lands(game, "Forest", A, 2);
    const cmdr = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.state.objects[cmdr].isCommander = true;
    const pick = toHand(game, GRAVE_PICK, A);
    game.dispatch({ type: "cast-spell", player: A, card: pick });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [cmdr] });

    const awaiting = game.state.awaiting;
    expect(awaiting?.kind === "commander-replacement" && awaiting.commander).toBe(cmdr);
    expect(zoneOf(game, cmdr)).toBe("graveyard");
    game.dispatch({ type: "commander-replacement", player: A, toCommandZone: true });
    game.advanceUntil(quiet);
    expect(zoneOf(game, cmdr)).toBe("command");
  });
});
