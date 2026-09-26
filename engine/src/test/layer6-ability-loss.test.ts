/**
 * Losing all abilities, in timestamp order (rule 613.7). Layer 6 applies its
 * effects by timestamp, so "loses all abilities" (Turn to Frog) takes away
 * what the permanent was granted *before* it — by an anthem, an Aura or
 * Equipment (timestamped as it attaches, 613.7e), a keyword counter
 * (timestamped as the latest counter of its kind is put on, 613.7c) or a
 * one-shot effect — but not what's granted after. Lignify's ruling: "Any
 * abilities granted to the creature after Lignify entered the battlefield
 * will work normally."
 */

import { describe, expect, it } from "vitest";

import type { TriggeredAbility } from "../abilities.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { matchesFilter } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const makeGame = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const apply = (game: Game, spec: EffectSpec, targets: readonly TargetRef[] = [], source?: ObjectId): void =>
  game.debugApplyEffect(A, spec, targets, source === undefined ? {} : { source });
/** Turn to Frog on `id`: until end of turn it loses all abilities. */
const frog = (game: Game, id: ObjectId): void =>
  game.debugApplyEffect(B, registry.get("Turn to Frog").effect!, [obj(id)]);
const has = (game: Game, id: ObjectId, keyword: string): boolean =>
  game.characteristics(id).keywords.has(keyword as never);
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
/** The priority check a resolution ends in: an edict's sacrifices are made
 * there, which `advanceUntil(quiet)` skips when nothing else is pending. */
const check = (game: Game): void =>
  (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(A);
/** The indices of `id`'s abilities Alice may activate (an "any colour" mana
 * ability is offered once per colour). */
const activatable = (game: Game, id: ObjectId): number[] => [
  ...new Set(
    game
      .legalActions(A)
      .flatMap((o) => (o.kind === "activate-ability" && o.source === id ? [o.abilityIndex] : [])),
  ),
];

/** "At the beginning of your end step, draw a card." */
const DRAW_AT_END: TriggeredAbility = {
  trigger: { on: "step-begins", step: "end", who: "you" },
  targets: [],
  effect: { kind: "draw", amount: 1 },
  resolve: null,
  text: "At the beginning of your end step, draw a card.",
};
/** "When this creature dies, draw a card." */
const DRAW_ON_DEATH: TriggeredAbility = {
  trigger: { on: "dies", who: "self" },
  targets: [],
  effect: { kind: "draw", amount: 1 },
  resolve: null,
  text: "When this creature dies, draw a card.",
};
const grant = (game: Game, id: ObjectId, ability: TriggeredAbility): void =>
  apply(game, { kind: "grant-triggered", target: 0, ability, duration: "end-of-turn" }, [obj(id)]);

describe("losing all abilities, by timestamp (rule 613.7)", () => {
  it("takes an anthem's keyword that came first, not one that arrives after", () => {
    const game = makeGame();
    spawn(game, "Levitation");
    const before = spawn(game, "Grizzly Bears");
    frog(game, before);
    expect(has(game, before, "flying")).toBe(false);

    const game2 = makeGame();
    const after = spawn(game2, "Grizzly Bears");
    frog(game2, after);
    spawn(game2, "Levitation");
    expect(has(game2, after, "flying")).toBe(true);
  });

  it("takes an Equipment's keywords if it was attached first, not if it's attached after (613.7e)", () => {
    const game = makeGame();
    const bears = spawn(game, "Grizzly Bears");
    const greaves = spawn(game, "Lightning Greaves");
    apply(game, { kind: "attach", target: 0 }, [obj(bears)], greaves);
    expect(has(game, bears, "haste")).toBe(true);
    frog(game, bears);
    expect(has(game, bears, "haste")).toBe(false);
    expect(has(game, bears, "shroud")).toBe(false);

    // Moved onto it again, the Equipment has a new timestamp.
    const other = spawn(game, "Hill Giant");
    apply(game, { kind: "attach", target: 0 }, [obj(other)], greaves);
    apply(game, { kind: "attach", target: 0 }, [obj(bears)], greaves);
    expect(has(game, bears, "haste")).toBe(true);
    expect(has(game, bears, "shroud")).toBe(true);
  });

  it("takes a keyword counter's keyword until another counter of its kind is put on (613.7c)", () => {
    const game = makeGame();
    const bears = spawn(game, "Grizzly Bears");
    apply(game, { kind: "add-counter", target: 0, counter: "flying", amount: 1 }, [obj(bears)]);
    frog(game, bears);
    expect(has(game, bears, "flying")).toBe(false);
    // A new flying counter gives every flying counter its timestamp.
    apply(game, { kind: "add-counter", target: 0, counter: "flying", amount: 1 }, [obj(bears)]);
    expect(has(game, bears, "flying")).toBe(true);
    expect(game.state.objects[bears].counters.flying).toBe(2);
  });

  it("takes a one-shot keyword grant that came first, not one that comes after", () => {
    const game = makeGame();
    const first = spawn(game, "Grizzly Bears");
    const second = spawn(game, "Hill Giant");
    const jump = registry.get("Jump").effect!;
    apply(game, jump, [obj(first)]);
    frog(game, first);
    frog(game, second);
    apply(game, jump, [obj(second)]);
    expect(has(game, first, "flying")).toBe(false);
    expect(has(game, second, "flying")).toBe(true);
  });

  it("keeps what the same effect gives it ('loses all abilities and has flying')", () => {
    const game = makeGame();
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Levitation");
    apply(
      game,
      {
        kind: "animate",
        target: 0,
        power: 1,
        toughness: 1,
        addTypes: [],
        addSubtypes: [],
        loseAbilities: true,
        keywords: ["trample"],
        duration: "end-of-turn",
      },
      [obj(bears)],
    );
    expect(has(game, bears, "trample")).toBe(true);
    expect(has(game, bears, "flying")).toBe(false);
  });

  it("a triggered ability granted after the loss triggers; one granted before doesn't", () => {
    const game = makeGame();
    const before = spawn(game, "Grizzly Bears");
    const after = spawn(game, "Hill Giant");
    grant(game, before, DRAW_AT_END);
    frog(game, before);
    frog(game, after);
    grant(game, after, DRAW_AT_END);
    const hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "end" && quiet(s));
    // Only one of them draws: the one granted after its Turn to Frog.
    expect(game.handOf(A)).toHaveLength(hand + 1);
  });

  it("an activated ability granted after the loss can be activated; its printed one can't", () => {
    const game = makeGame();
    const elves = spawn(game, "Llanowar Elves");
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Cryptolith Rite");
    frog(game, elves);
    frog(game, bears);
    // The Rite came first: neither has its "{T}: Add one mana of any color."
    expect(activatable(game, elves)).toEqual([]);
    expect(activatable(game, bears)).toEqual([]);

    const game2 = makeGame();
    const elves2 = spawn(game2, "Llanowar Elves");
    frog(game2, elves2);
    spawn(game2, "Cryptolith Rite");
    // Index 0 is the Elves' own "{T}: Add {G}", still lost; 1 is the Rite's.
    expect(activatable(game2, elves2)).toEqual([1]);
    const rite = game2.legalActions(A).find((o) => o.kind === "activate-ability" && o.source === elves2);
    expect(rite).toBeDefined();
    game2.dispatch({ type: "activate-ability", player: A, source: elves2, abilityIndex: 1 });
    expect(game2.state.objects[elves2].tapped).toBe(true);
  });

  it("pays for a spell with a mana ability granted after the loss, never with its own", () => {
    const castable = (game: Game): boolean =>
      game.legalActions(A).some((o) => o.kind === "cast-spell" && game.state.objects[o.card]?.cardName === "Giant Growth");
    // The Elves are the only creature, so nothing else gets the Rite's
    // ability — and Giant Growth's only target.
    const game = makeGame();
    const elves = spawn(game, "Llanowar Elves");
    game.debugSpawn("Giant Growth", A, "hand");
    expect(castable(game)).toBe(true);
    frog(game, elves);
    // Its own "{T}: Add {G}" is gone, and nothing else makes green.
    expect(castable(game)).toBe(false);
    spawn(game, "Cryptolith Rite");
    // The Rite's ability, granted since, pays for it.
    expect(castable(game)).toBe(true);
  });

  it("a mana ability granted after the loss is one it has; one granted before isn't", () => {
    const hasMana = (game: Game, id: ObjectId): boolean =>
      matchesFilter(game.state, registry, id, { hasManaAbility: true }, { you: A });
    const hasAny = (game: Game, id: ObjectId): boolean =>
      matchesFilter(game.state, registry, id, { hasAbilities: true }, { you: A });
    // Its own "{T}: Add {G}" is lost too.
    const game = makeGame();
    spawn(game, "Cryptolith Rite");
    const before = spawn(game, "Llanowar Elves");
    frog(game, before);
    expect(hasMana(game, before)).toBe(false);
    expect(hasAny(game, before)).toBe(false);

    const game2 = makeGame();
    const after = spawn(game2, "Grizzly Bears");
    frog(game2, after);
    spawn(game2, "Cryptolith Rite");
    expect(hasMana(game2, after)).toBe(true);
    expect(hasAny(game2, after)).toBe(true);
  });

  it("a triggered ability a static grants works if the static came after the loss", () => {
    // Bria: "Other creatures you control have prowess." Opt is the
    // noncreature spell.
    const prowessAfterOpt = (briaFirst: boolean): readonly [number, number] => {
      const game = makeGame();
      spawn(game, "Island");
      const bears = spawn(game, "Grizzly Bears");
      if (briaFirst) spawn(game, "Bria, Riptide Rogue");
      frog(game, bears);
      if (!briaFirst) spawn(game, "Bria, Riptide Rogue");
      const opt = game.debugSpawn("Opt", A, "hand");
      game.dispatch({ type: "cast-spell", player: A, card: opt });
      game.advanceUntil(quiet);
      const c = game.characteristics(bears);
      return [c.power, c.toughness];
    };
    expect(prowessAfterOpt(true)).toEqual([1, 1]);
    expect(prowessAfterOpt(false)).toEqual([2, 2]);
  });

  it("\"can't be sacrificed\" granted before the loss goes with it; granted after, it stays", () => {
    const edict: EffectSpec = { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 1 };
    const unsacrificeable: EffectSpec = { kind: "cant-be-sacrificed", target: 0, duration: "end-of-turn" };
    const game = makeGame();
    const before = spawn(game, "Grizzly Bears");
    apply(game, unsacrificeable, [obj(before)]);
    frog(game, before);
    game.debugApplyEffect(B, edict);
    check(game);
    expect(game.state.objects[before].zone).toBe("graveyard");

    const game2 = makeGame();
    const after = spawn(game2, "Grizzly Bears");
    frog(game2, after);
    apply(game2, unsacrificeable, [obj(after)]);
    game2.debugApplyEffect(B, edict);
    check(game2);
    expect(game2.state.pendingSacrifices ?? []).toEqual([]);
    expect(game2.state.objects[after].zone).toBe("battlefield");
  });

  it("a dies trigger granted after the loss fires as it dies; one granted before doesn't", () => {
    const game = makeGame();
    const after = spawn(game, "Grizzly Bears");
    frog(game, after);
    grant(game, after, DRAW_ON_DEATH);
    const hand = game.handOf(A).length;
    apply(game, { kind: "destroy", target: 0 }, [obj(after)]);
    game.advanceUntil(quiet);
    expect(game.handOf(A)).toHaveLength(hand + 1);

    // Doomed Traveler's own "When this creature dies, create a 1/1 white
    // Spirit" is lost too.
    const game2 = makeGame();
    const before = spawn(game2, "Doomed Traveler");
    grant(game2, before, DRAW_ON_DEATH);
    frog(game2, before);
    const hand2 = game2.handOf(A).length;
    apply(game2, { kind: "destroy", target: 0 }, [obj(before)]);
    game2.advanceUntil(quiet);
    expect(game2.handOf(A)).toHaveLength(hand2);
    expect(game2.state.zones.shared.battlefield).toHaveLength(0);
  });

  it("one effect gives everything it reaches one timestamp (613.7b)", () => {
    const game = makeGame();
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant");
    apply(game, { kind: "grant-keyword-all", filter: { type: "creature" }, keyword: "flying", duration: "end-of-turn" });
    const stamp = (id: ObjectId) => game.state.objects[id].modifiers.at(-1)?.timestamp;
    expect(stamp(bears)).toBeDefined();
    expect(stamp(bears)).toBe(stamp(giant));
    apply(game, {
      kind: "animate-all",
      filter: { type: "creature" },
      power: 4,
      toughness: 4,
      duration: "end-of-turn",
    });
    expect(stamp(bears)).toBeGreaterThan(0);
    expect(stamp(bears)).toBe(stamp(giant));
  });

  it("a printed ability that triggered before the loss still resolves as itself (rule 113.7a)", () => {
    const game = makeGame();
    const visionary = game.debugSpawn("Elvish Visionary", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.zones.shared.stack.length > 0);
    // In response it loses its abilities and gains another — which must not
    // take the place of the one already on the stack.
    frog(game, visionary);
    apply(
      game,
      {
        kind: "grant-triggered",
        target: 0,
        ability: { ...DRAW_AT_END, effect: { kind: "gain-life", amount: 5 } },
        duration: "end-of-turn",
      },
      [obj(visionary)],
    );
    const hand = game.handOf(A).length;
    const life = game.state.players[A].life;
    game.advanceUntil(quiet);
    expect(game.handOf(A)).toHaveLength(hand + 1);
    expect(game.state.players[A].life).toBe(life);
  });
});
