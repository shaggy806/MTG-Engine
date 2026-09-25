/**
 * The Oracle parser behind `npm run card:scaffold` (`scripts/oracle-parse.mjs`).
 *
 * - Templates: a sample of Oracle lines and the structure each becomes — and
 *   the lines that must *not* match, since a half-read sentence is the one
 *   mistake the parser can't be allowed to make.
 * - A parsed card plays: a definition built from Oracle text alone, handed to
 *   `defineCard` and used in a real game.
 * - Ground truth: every ability the parser claims complete, for every card in
 *   the pool, agrees with the hand-authored one (`scripts/oracle-parse-check.mjs`
 *   — `npm run card:parse-check -w engine` prints the full report).
 */

import { describe, expect, it } from "vitest";

import { POOL_CARDS, createDefaultRegistry, defineCard } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
// @ts-expect-error — a plain .mjs script, typed only at runtime.
import { parseFace, parseTrigger, parseCost, parseSentence, parseTypePhrase } from "../../scripts/oracle-parse.mjs";
// @ts-expect-error — as above.
import { checkPool } from "../../scripts/oracle-parse-check.mjs";

type Ctx = { targets: unknown[]; target: (spec: unknown) => number; tokenFor: () => string | null; onStack?: boolean };
const ctx = (overrides: Partial<Ctx> = {}): Ctx => {
  const targets: unknown[] = [];
  return { targets, target: (spec) => targets.push(spec) - 1, tokenFor: () => null, ...overrides };
};

describe("effect templates", () => {
  it.each([
    ["Draw two cards.", { kind: "draw", amount: 2 }],
    ["You gain 3 life.", { kind: "gain-life", amount: 3 }],
    ["Each opponent loses 1 life.", { kind: "lose-life", amount: 1, who: "each-opponent" }],
    ["~ deals 3 damage to any target.", { kind: "damage", amount: 3, target: 0 }],
    ["Destroy target nonland permanent.", { kind: "destroy", target: 0 }],
    ["Scry 2.", { kind: "scry", amount: 2 }],
    ["~ gets +1/+0 until end of turn.", { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" }],
    ["Target creature gains flying until end of turn.", { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" }],
    ["Add {G}.", { kind: "add-mana", mana: "G", amount: 1 }],
    ["Add {R} or {G}.", { kind: "add-mana", mana: { oneOf: ["R", "G"] }, amount: 1 }],
  ])("%s", (sentence, expected) => {
    expect(parseSentence(sentence, ctx())).toEqual(expected);
  });

  it("names the target a sentence takes", () => {
    const c = ctx();
    parseSentence("~ deals 2 damage to target creature an opponent controls.", c);
    expect(c.targets).toEqual(["creature-an-opponent-controls"]);
  });

  it("a colour choice in an ability that uses the stack is written as modes", () => {
    const effect = parseSentence("Add one mana of any color.", ctx({ onStack: true }));
    expect(effect.kind).toBe("modal");
    expect(effect.modes).toHaveLength(5);
  });

  it.each([
    // An amount defined by a rule of its own.
    "Create X 1/1 white Vampire creature tokens with lifelink, where X is ~'s power.",
    "You gain 1 life for each creature you control.",
    // Two different tokens, and a token with a quoted ability.
    "Create a Food token or a Treasure token.",
    'Create a 0/1 black Wizard creature token with "Whenever you cast a noncreature spell, this token deals 1 damage to each opponent." Then if you control four or more Wizards, transform ~.',
    // A sentence no template covers.
    "Return a permanent you control to its owner's hand.",
  ])("leaves alone: %s", (sentence) => {
    expect(parseSentence(sentence, ctx({ tokenFor: () => "Some Token" }))).toBeNull();
  });
});

describe("costs and triggers", () => {
  it("costs", () => {
    expect(parseCost("{2}{G}, {T}, Sacrifice ~")).toEqual({
      cost: { mana: "{2}{G}", tap: true, sacrifice: "self" },
      extra: {},
    });
    expect(parseCost("Sacrifice another creature").extra).toEqual({ otherOnly: true });
    expect(parseCost("Tap two untapped Elves you control").cost.tapOthers).toEqual({
      count: 2,
      filter: { subtype: "Elf", controlledBy: "you" },
      includeSelf: true,
    });
    // Discard as a cost isn't modeled.
    expect(parseCost("{1}, Discard a card")).toBeNull();
  });

  it("triggers", () => {
    expect(parseTrigger("When ~ enters")).toEqual([{ on: "enters-battlefield", who: "self" }]);
    expect(parseTrigger("Whenever ~ enters or attacks")).toHaveLength(2);
    expect(parseTrigger("Whenever another Zombie you control enters")).toEqual([
      { on: "enters-battlefield", who: "you-control", filter: { subtype: "Zombie" }, otherOnly: true },
    ]);
    expect(parseTrigger("At the beginning of combat on your turn")).toEqual([
      { on: "step-begins", step: "begin-combat", who: "you" },
    ]);
    expect(parseTrigger("Whenever you cast an instant or sorcery spell")).toEqual([
      { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
    ]);
    expect(parseTrigger("Whenever you cycle or discard another card")).toBeNull();
  });

  it("an 'or' between whole phrases isn't one filter", () => {
    expect(parseTypePhrase("creature or planeswalker")).toEqual({ typesAnyOf: ["creature", "planeswalker"] });
    // (artifact creature) or (Vehicle) — Canoptek Spyder. Read as one filter it
    // came out as "an artifact creature that's a Vehicle".
    expect(parseTypePhrase("nontoken artifact creature or Vehicle")).toBeNull();
    expect(parseTypePhrase("artifact creature or enchantment")).toBeNull();
  });

  it("a 'permanent card' is one that isn't an instant or sorcery", () => {
    // Revive the Shire's "target permanent card from your graveyard" was read
    // as any card at all. On the battlefield the word says nothing.
    expect(parseTypePhrase("permanent", { cards: true })).toEqual({ notTypes: ["instant", "sorcery"] });
    expect(parseTypePhrase("permanent")).toEqual({});
  });
});

describe("a card parsed from its Oracle text plays", () => {
  const face = {
    name: "Test Parsed Pinger",
    mana_cost: "{2}{R}",
    type_line: "Creature — Human Wizard",
    power: "1",
    toughness: "1",
    oracle_text:
      "Flying\nWhen this creature enters, you gain 2 life.\n{T}: This creature deals 1 damage to any target.",
  };

  it("parses completely", () => {
    const parsed = parseFace(face, { tokenFor: () => null });
    expect(parsed.complete).toBe(true);
    expect(parsed.keywords).toEqual(["flying"]);
  });

  it("and the definition works in a game", () => {
    const parsed = parseFace(face, { tokenFor: () => null });
    const registry = createDefaultRegistry().register(
      defineCard({
        name: face.name,
        manaCost: face.mana_cost,
        colors: ["R"],
        types: ["creature"],
        subtypes: ["Human", "Wizard"],
        power: 1,
        toughness: 1,
        keywords: parsed.keywords,
        text: face.oracle_text,
        triggered: parsed.triggered,
        activated: parsed.activated,
      } as Parameters<typeof defineCard>[0]),
    );
    const A = asPlayerId("alice");
    const B = asPlayerId("bob");
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
    const quiet = (s: GameState) =>
      s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
    const pinger = game.debugSpawn(face.name, A, "battlefield", { summoningSick: false, announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(22);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: pinger,
      abilityIndex: 0,
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(19);
  });
});

describe("agreement with the hand-authored pool", () => {
  it("every ability the parser claims complete matches the authored one", () => {
    const { stats, mismatches } = checkPool(POOL_CARDS);
    expect(stats.claimed).toBeGreaterThan(400);
    expect(mismatches.map((m: { card: string; text: string }) => `${m.card}: ${m.text}`)).toEqual([]);
  });
});
