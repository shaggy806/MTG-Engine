/**
 * The evaluation's *features*, split out from its weights.
 *
 * `evaluate.ts` used to compute a feature and multiply it by its weight in the
 * same expression, which is fine for scoring and useless for fitting: to learn
 * the weights from real games you need the raw feature vector of a position,
 * unweighted, so a regression can be run over it. This module produces exactly
 * that, and `evaluateState` is now a dot product over what it returns.
 *
 * ## Why only some of `EvalWeights` lives here
 *
 * These are the terms the score is *linear* in, and they're the only ones a
 * linear fit can speak about. Three weights are deliberately absent:
 *
 * - `landCap` is a threshold *inside* a feature (it decides where `lands`
 *   stops and `extraLands` begins), not a coefficient. It's a hyperparameter
 *   here, passed in.
 * - `opponent` and `otherOpponents` are how per-player scores are *aggregated*
 *   across a table, above this layer. Fitting happens on two-player positions,
 *   where there is exactly one opponent and the aggregation is a free scale.
 * - `crackbackParanoia`, `crackbackMargin` and `crackbackGrowth` aren't
 *   evaluation terms at all — they're knobs on the attack builder's combat
 *   arithmetic (`combat-math.ts`).
 *
 * Those six stay hand-set or tuned by the (1+1)-ES in `tune-bot.mjs`. See
 * `docs/plans/smarter-bots.md`, "Fitting the weights from self-play".
 *
 * ## Sign convention
 *
 * Every weight in `EvalWeights` is positive, and terms that are a *cost*
 * (commander damage taken, commander tax) are subtracted rather than carrying
 * a negative weight — so the tuner's multiplicative mutation can never flip a
 * term's meaning. Features here are raw magnitudes and {@link featureSign}
 * carries that convention, which keeps one useful property for the fit: with
 * the sign folded in, a fitted coefficient is positive exactly when the
 * feature is good for you.
 */

import { isManaAbility } from "../abilities.js";
import type { TriggeredAbility } from "../abilities.js";
import { combatDamageOf, computeCharacteristics, withComputedCache } from "../characteristics.js";
import type { Characteristics } from "../characteristics.js";
import type { CardRegistry } from "../cards.js";
import type { CardDefinition, Keyword } from "../cards/define.js";
import { entersToCounter } from "../effect-worth.js";
import type { EffectSpec } from "../effects.js";
import { manaValue, parseManaCost } from "../mana.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { POISON_LETHAL, printedCardName, settledTally } from "../state.js";
import { playersAttackableNextTurn } from "../combat/eligibility.js";
import { canBlock, combatCreatures } from "./combat-math.js";
import type { CombatCreature } from "./combat-math.js";
import { COMMANDER_DAMAGE_LETHAL } from "../view.js";
import type { GameObject, GameState } from "../state.js";

/** The terms the score is linear in — the vector a fit operates on. Order is
 * load-bearing: `scripts/fit-weights.mjs` and the fitted-weight files index
 * by it. */
export const FEATURE_KEYS = [
  "life",
  "lifeDanger",
  "commanderDamage",
  "hand",
  "handManaValue",
  "creatures",
  "power",
  "toughness",
  "evasivePower",
  "combatKeywords",
  "untappedCreatures",
  "lands",
  "extraLands",
  "untappedMana",
  "otherPermanents",
  "permanentManaValue",
  "loyalty",
  "counters",
  "library",
  "libraryDanger",
  "graveyard",
  "graveyardCastable",
  "energy",
  "monarch",
  "emblems",
  "commanderTax",
  "nonlandMana",
  "drawEngines",
  "commanderOnBoard",
  "idlePower",
  "extraTokens",
  "threat",
  "answers",
  "resourceTokens",
  "tokenEngines",
  "earlyRemoval",
  "earlyMana",
  "smallTokens",
  "lifeSurplus",
  "trackRecord",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];
export type PlayerFeatures = Readonly<Record<FeatureKey, number>>;

/** Features the score subtracts: a cost, held as a positive magnitude under a
 * positive weight. */
const SUBTRACTED: ReadonlySet<string> = new Set([
  "commanderDamage",
  "commanderTax",
  "lifeDanger",
  "libraryDanger",
  "idlePower",
  "threat",
  "smallTokens",
  "lifeSurplus",
]);

/**
 * Where life stops being a resource and starts being the game.
 *
 * `life` is linear, and `bot:audit`'s curve check has always said so: losing
 * five at 8 life and at 40 score identically, ratio 1.00. No weight fixes
 * that — a weight scales a curve, it cannot bend one — so the bend has to be
 * a feature.
 *
 * It's expressed as *distance below a threshold* rather than as a transform of
 * `life` (a `sqrt`, say) for one property worth more than elegance: the term is
 * strictly additive, so `lifeDanger: 0` reproduces the old evaluation exactly.
 * A new feature that can't regress the old one is a much easier thing to
 * measure, and the sweep can say "zero was right" without anything else having
 * moved.
 *
 * 15 of Commander's 40, i.e. the point at which one more good attack is
 * plausibly lethal.
 */
const LIFE_DANGER_AT = 15;

/**
 * The other end of `life`'s curve: past this, a point of life buys less. At a
 * flat 0.5 a point, six life at 35 cost 3 — a card and a half — so a 1/1
 * token that chumped a Craw Wurm there was worth keeping only if worth more
 * than that, while Deadly Dispute trades one for about a card and a Treasure
 * (2.5). `lifeSurplus` takes some of each point above this back — of our own
 * life only. The user's call (2026-10-04): life above 30 counts for less.
 */
const LIFE_SURPLUS_ABOVE = 30;

/** The most toughness one creature counts for (`toughness`). Its combat
 * damage is a separate term, so a Felothar wall that hits with its toughness
 * keeps that in full. */
const TOUGHNESS_CAP = 10;

/**
 * What losing `damage` life from `life` costs the evaluation: `life` a
 * point, plus `lifeDanger` for each point that lands below
 * {@link LIFE_DANGER_AT} — the evaluation's own bend, for the cheap
 * arithmetic that ranks combat moves before any is simulated. Priced
 * linearly, a block at 8 life looked as cheap as one at 40.
 */
export function lifeCost(
  life: number,
  damage: number,
  w: { readonly life: number; readonly lifeDanger: number; readonly lifeSurplus: number },
): number {
  const below = (at: number): number => Math.max(0, LIFE_DANGER_AT - at);
  const above = (at: number): number => Math.max(0, at - LIFE_SURPLUS_ABOVE);
  return (
    damage * w.life +
    (below(life - damage) - below(life)) * w.lifeDanger -
    (above(life) - above(life - damage)) * w.lifeSurplus
  );
}

/**
 * Where a library stops being a resource and starts being a clock.
 *
 * Same shape and same reasoning as {@link LIFE_DANGER_AT}: milling ten off a
 * 12-card library and off a 52-card one score identically today (ratio 1.00),
 * and drawing from an empty library loses the game outright (rule 104.3c).
 */
const LIBRARY_DANGER_AT = 15;

/** `commanderDamage` from the worst damage taken: `d²/21`, so 21 is still
 * 21 and a hit weighs more the nearer the loss. */
const commanderDamageCurve = (taken: number): number => (taken * taken) / COMMANDER_DAMAGE_LETHAL;

/** The opponents' average hand size at which a counterspell in hand is
 * worth exactly `answers`' weight. */
const ANSWER_HAND = 3;
/** The most the opponents' hands can scale `answers` by. */
const ANSWER_HAND_SCALE_MAX = 2;

/** How much of `answers` a counterspell held now is worth: the living
 * opponents' average hand size over `ANSWER_HAND`, capped at
 * `ANSWER_HAND_SCALE_MAX`. Hand sizes are public. */
function answerHandScale(state: GameState, player: PlayerId): number {
  const opponents = state.turnOrder.filter((p) => p !== player && !state.players[p].hasLost);
  if (opponents.length === 0) return 0;
  const cards = opponents.reduce((n, p) => n + state.zones.perPlayer[p].hand.length, 0);
  return Math.min(ANSWER_HAND_SCALE_MAX, cards / opponents.length / ANSWER_HAND);
}

/** The rounds of the game in which removal in hand counts `earlyRemoval`:
 * every player's first two turns. */
const EARLY_REMOVAL_ROUNDS = 2;

/** `earlyMana` counts a permanent's mana in full through this round… */
const EARLY_MANA_FULL = 2;
/** …and fades to nothing by this one: a Sol Ring on turn one is a third of
 * a player's mana and two turns ahead, by turn six one source among many. */
const EARLY_MANA_END = 6;

/** The round of the game: every player's first turn is round 1. */
function roundOf(state: GameState): number {
  return Math.ceil(state.turn.number / Math.max(1, state.turnOrder.length));
}

/** How much of `nonlandMana` counts as `earlyMana` this round: 1 through
 * `EARLY_MANA_FULL`, falling in a line to 0 at `EARLY_MANA_END`. */
function earlyManaShare(state: GameState): number {
  const round = roundOf(state);
  if (round <= EARLY_MANA_FULL) return 1;
  return Math.max(0, (EARLY_MANA_END - round) / (EARLY_MANA_END - EARLY_MANA_FULL));
}

/** `threat` weighs damage against what's left to lose: at this much life a
 * point counts as one, at twice it as a half. */
const THREAT_LIFE = 20;
/** The most one point of damage can count for in `threat`, however close
 * to lethal. */
const MAX_THREAT_SCALE = 10;

/**
 * How many identical noncreature tokens (Treasures, Clues, Food) count in
 * full towards `otherPermanents`; the rest are `extraTokens`. The same shape
 * as `landCap`/`extraLands`, and for a sharper reason: counted in full, a
 * pile was worth 2 points a Treasure without end, so on seed 50 a bot with
 * Old Gnawbone and Atarka pumped its Dragons again and again after the only
 * player it was hitting had died — eighteen Treasures a pump, +640 a batch —
 * and never finished the turn. A turn rarely spends more than a few.
 */
export const TOKEN_CAP = 4;

export const featureSign = (key: FeatureKey): number => (SUBTRACTED.has(key) ? -1 : 1);

const resourceMemo = new Map<string, boolean>();

/**
 * A token that's spent by sacrificing itself: Treasure, Clue, Food, Blood,
 * Gold. One use and it's gone, so it's `resourceTokens`, not a permanent
 * counted like a Sol Ring — counted as one, "spend a Treasure to cast Sol
 * Ring" scored as giving up a card for nothing, and v2 held its Sol Ring for
 * three turns with the spells it would have cast stuck in hand (seed 20).
 */
function isResourceToken(registry: CardRegistry, name: string): boolean {
  let found = resourceMemo.get(name);
  if (found === undefined) {
    found = registry.has(name) && (registry.get(name).activated ?? []).some((a) => a.cost.sacrifice === "self");
    resourceMemo.set(name, found);
  }
  return found;
}

const EVASION: readonly Keyword[] = [
  "flying",
  "menace",
  "trample",
  "fear",
  "intimidate",
  "skulk",
  "shadow",
  "unblockable",
];

const COMBAT_KEYWORDS: readonly Keyword[] = [
  "first-strike",
  "double-strike",
  "deathtouch",
  "lifelink",
  "vigilance",
  "indestructible",
  "hexproof",
  "shroud",
];

/** Counter kinds another feature already accounts for, or that measure
 * progress rather than value. */
const UNSCORED_COUNTERS: ReadonlySet<string> = new Set([
  "+1/+1",
  "-1/-1",
  "loyalty",
  "lore",
  "time",
]);

/** A +X/+Y or -X/-Y counter (rule 122.1a), which the P/T already counts. */
const PT_COUNTER = /^[+-]\d+\/[+-]\d+$/;

function manaValueOf(registry: CardRegistry, name: string): number {
  return registry.has(name) ? manaValue(parseManaCost(registry.get(name).manaCost)) : 0;
}

function hasTapManaAbility(registry: CardRegistry, object: GameObject): boolean {
  const name = printedCardName(object);
  if (!registry.has(name)) return false;
  return (registry.get(name).activated ?? []).some((a) => a.cost.tap && isManaAbility(a));
}

function castableFromGraveyard(registry: CardRegistry, object: GameObject): boolean {
  if (object.grantedFlashback) return true;
  if (!registry.has(object.cardName)) return false;
  const def = registry.get(object.cardName);
  return (
    def.flashback !== null ||
    def.escape !== null ||
    def.disturb !== null ||
    def.castFromGraveyardIf !== undefined ||
    (def.activated ?? []).some((a) => a.zone === "graveyard")
  );
}

const count = (c: Characteristics, keywords: readonly Keyword[]): number =>
  keywords.filter((k) => c.keywords.has(k)).length;

/** Mana one activation of an `add-mana` effect makes: Sol Ring's `{C}` twice
 * is 2, a Signet's `{W}{U}` is 2. A live amount (Gaea's Cradle) counts 1 —
 * enough to say it makes mana without guessing how much. */
function manaMade(effect: EffectSpec | null | undefined): number {
  if (effect === null || effect === undefined) return 0;
  if (effect.kind === "sequence") return effect.effects.reduce((sum, e) => sum + manaMade(e), 0);
  if (effect.kind !== "add-mana") return 0;
  const units = typeof effect.amount === "number" ? effect.amount : 1;
  const mana = effect.mana;
  return units * (typeof mana === "object" && "all" in mana ? mana.all.length : 1);
}

const manaMemo = new WeakMap<CardDefinition, number>();

/**
 * The mana a permanent adds each turn, net of what the ability costs: Sol
 * Ring 2, a Signet 1 (two for `{1}`), a dork 1. Its best `{T}` mana ability,
 * since it taps once a turn; a sacrifice (a Treasure) is one mana once, not a
 * mana source.
 */
function manaPerTurn(def: CardDefinition): number {
  let found = manaMemo.get(def);
  if (found === undefined) {
    found = 0;
    for (const ability of def.activated) {
      if (!ability.cost.tap || ability.cost.sacrifice !== undefined || !isManaAbility(ability)) continue;
      const cost = ability.cost.mana === null ? 0 : manaValue(parseManaCost(ability.cost.mana));
      found = Math.max(found, manaMade(ability.effect) - cost);
    }
    manaMemo.set(def, found);
  }
  return found;
}

/** A trigger that fires once in a permanent's life — its own entering, dying,
 * leaving, being cast — draws once, not every turn. */
function isOneShot(trigger: TriggeredAbility["trigger"]): boolean {
  if (trigger.on === "this-cast" || trigger.on === "this-cycled") return true;
  const who = (trigger as { readonly who?: unknown }).who;
  return (
    who === "self" &&
    (trigger.on === "enters-battlefield" ||
      trigger.on === "dies" ||
      trigger.on === "leaves-battlefield" ||
      trigger.on === "put-into-graveyard" ||
      trigger.on === "transforms")
  );
}

/** Does this effect counter a spell? Anywhere in the tree. */
function counters(effect: unknown): boolean {
  if (effect === null || typeof effect !== "object") return false;
  if (Array.isArray(effect)) return effect.some(counters);
  if ((effect as { readonly kind?: unknown }).kind === "counter") return true;
  return Object.values(effect).some((value) => value !== null && typeof value === "object" && counters(value));
}

/** Whether `effect` destroys, exiles or deals damage to a target. */
function removes(effect: unknown): boolean {
  if (effect === null || typeof effect !== "object") return false;
  if (Array.isArray(effect)) return effect.some(removes);
  const node = effect as { readonly kind?: unknown; readonly target?: unknown };
  if ((node.kind === "destroy" || node.kind === "exile" || node.kind === "damage") && typeof node.target === "number") {
    return true;
  }
  return Object.values(effect).some((value) => value !== null && typeof value === "object" && removes(value));
}

/** Target specs that can name an opponent's creature. */
function aimsAtCreatures(specs: readonly unknown[]): boolean {
  return specs.some((spec) => {
    const text = JSON.stringify(spec);
    return (
      text.includes("any-target") ||
      (text.includes("creature") && !text.includes("you-control") && !text.includes("spell"))
    );
  });
}

const removalMemo = new WeakMap<CardDefinition, boolean>();

/** An instant or sorcery that kills a target creature: Swords to Plowshares,
 * Murder, Lightning Bolt — the cards `earlyRemoval` holds back. */
function isRemoval(def: CardDefinition): boolean {
  let found = removalMemo.get(def);
  if (found === undefined) {
    // A mode of a modal spell counts on its own: Abrade's "3 damage to
    // target creature".
    const ways = [
      { targets: def.targets ?? [], effect: def.effect },
      ...(def.castModal?.modes ?? []).map((mode) => ({ targets: mode.targets ?? [], effect: mode.effect })),
    ];
    found =
      (def.types.includes("instant") || def.types.includes("sorcery")) &&
      ways.some((way) => aimsAtCreatures(way.targets) && removes(way.effect));
    removalMemo.set(def, found);
  }
  return found;
}

const answerMemo = new WeakMap<CardDefinition, boolean>();

/** A card held to counter something: its spell (or one of its modes) counters
 * a spell, or it's a creature that counters one as it enters. Counterspell,
 * Negate, Cryptic Command, Transcendent Dragon. */
function isAnswer(def: CardDefinition): boolean {
  let found = answerMemo.get(def);
  if (found === undefined) {
    found = counters(def.effect) || counters(def.castModal) || entersToCounter(def);
    answerMemo.set(def, found);
  }
  return found;
}

/**
 * The most a draw engine is credited a round: past it the estimate below is
 * guessing (Consecrated Sphinx at four players would be six), and one engine
 * shouldn't outweigh a board.
 */
const DRAW_RATE_CAP = 3;

/** Cards one firing of `effect` draws its controller: the largest fixed
 * `draw` in it (1 for a counted one), halved under an `unless` an opponent
 * can pay to stop it (Rhystic Study, Esper Sentinel). 0 if it draws none. */
function drawsPerFiring(effect: unknown, unless = false): number {
  if (effect === null || typeof effect !== "object") return 0;
  if (Array.isArray(effect)) return Math.max(0, ...effect.map((e) => drawsPerFiring(e, unless)));
  const node = effect as {
    readonly kind?: unknown;
    readonly target?: unknown;
    readonly who?: unknown;
    readonly amount?: unknown;
  };
  if (node.kind === "draw" && node.target === undefined && (node.who === undefined || node.who === "you")) {
    const cards = typeof node.amount === "number" ? Math.max(1, node.amount) : 1;
    return unless ? cards / 2 : cards;
  }
  const inner = unless || node.kind === "unless";
  return Math.max(
    0,
    ...Object.values(effect).map((value) =>
      value !== null && typeof value === "object" ? drawsPerFiring(value, inner) : 0,
    ),
  );
}

/** An engine's output a round of the table, as `fixed + perOpponent` × the
 * opponents still in: see {@link engineRate}. */
interface EngineRate {
  readonly fixed: number;
  readonly perOpponent: number;
}

/**
 * What a permanent keeps making each round of the table, one firing making
 * what `perFiring` says. A trigger on what an opponent does fires once per
 * opponent a round (half that when only their second draw or spell a turn
 * counts, and once in all when it's their attack on us); one on anyone's
 * spell, draw or step once per player; anything else — our own upkeep, our
 * own spells, combat, a creature entering or dying — about once. Not a
 * one-shot (`isOneShot`). Activated abilities `repeatable` keeps, which
 * usually share a tap or the mana, count the best of them once.
 */
function engineRate(
  def: CardDefinition,
  perFiring: (effect: unknown) => number,
  repeatable: (ability: CardDefinition["activated"][number]) => boolean,
): EngineRate {
  let fixed = 0;
  let perOpponent = 0;
  for (const t of def.triggered) {
    if (isOneShot(t.trigger)) continue;
    const made = perFiring(t.effect);
    if (made === 0) continue;
    const trigger = t.trigger as {
      readonly on: string;
      readonly who?: unknown;
      readonly nthEachTurn?: unknown;
      readonly attackingYou?: unknown;
    };
    // An intervening "if" (rule 603.4) gates every firing — Ophiomancer
    // makes a Snake each upkeep only while it has none — so it's about once,
    // however many players' steps it watches. An opponent attacking *us*
    // (Ever-Watching Threshold, Isperia) is one of their targets, not every
    // opponent's every turn: about once too.
    if (t.condition !== undefined) {
      fixed += made;
    } else if (trigger.who === "opponent" && trigger.attackingYou !== true) {
      perOpponent += made * (typeof trigger.nthEachTurn === "number" && trigger.nthEachTurn > 1 ? 0.5 : 1);
    } else if (
      trigger.who === "any" &&
      (trigger.on === "cast-spell" || trigger.on === "draws" || trigger.on === "step-begins")
    ) {
      fixed += made;
      perOpponent += made;
    } else {
      fixed += made;
    }
  }
  let activated = 0;
  for (const a of def.activated) {
    if (repeatable(a)) activated = Math.max(activated, perFiring(a.effect));
  }
  return { fixed: fixed + activated, perOpponent };
}

const drawMemo = new WeakMap<CardDefinition, EngineRate>();

/**
 * How many cards a permanent keeps drawing its controller each round of the
 * table — 0 for one that doesn't. An upkeep draw (Phyrexian Arena), a draw on
 * others entering, dying or being cast, a repeatable activated or loyalty
 * ability that draws. Not a one-shot: a Solemn Simulacrum draws once, when it
 * dies, and a Mind Stone once, when it's sacrificed. The audit priced
 * Phyrexian Arena at a quarter of a Grizzly Bears, because nothing counted
 * what it keeps doing.
 *
 * By rate ({@link engineRate}), so Rhystic Study, which draws off every
 * opponent's spell, isn't scored the same as Phyrexian Arena's one card a
 * turn. Each firing draws what {@link drawsPerFiring} says. Arena is 1 by
 * construction, so `drawEngines` prices a card a round.
 */
function drawRate(def: CardDefinition, opponents: number): number {
  let rate = drawMemo.get(def);
  if (rate === undefined) {
    rate = engineRate(
      def,
      (effect) => drawsPerFiring(effect),
      (a) => a.cost.sacrifice !== "self" && !isManaAbility(a),
    );
    drawMemo.set(def, rate);
  }
  return Math.min(DRAW_RATE_CAP, rate.fixed + rate.perOpponent * opponents);
}

/** The most creature tokens one engine is credited a round, for the same
 * reasons as {@link DRAW_RATE_CAP}. */
const TOKEN_RATE_CAP = 3;

/** Creature tokens one firing of `effect` makes its controller: the largest
 * fixed `create-token` count in it (1 for a counted one), of a token that's
 * a creature. 0 if it makes none, or makes them for someone else. */
function tokensPerFiring(registry: CardRegistry, effect: unknown): number {
  if (effect === null || typeof effect !== "object") return 0;
  if (Array.isArray(effect)) return Math.max(0, ...effect.map((e) => tokensPerFiring(registry, e)));
  const node = effect as {
    readonly kind?: unknown;
    readonly token?: unknown;
    readonly count?: unknown;
    readonly who?: unknown;
  };
  if (node.kind === "create-token" && (node.who === undefined || node.who === "you")) {
    if (typeof node.token !== "string" || !registry.has(node.token)) return 0;
    if (!registry.get(node.token).types.includes("creature")) return 0;
    return typeof node.count === "number" ? node.count : 1;
  }
  return Math.max(
    0,
    ...Object.values(effect).map((value) =>
      value !== null && typeof value === "object" ? tokensPerFiring(registry, value) : 0,
    ),
  );
}

const tokenMemo = new WeakMap<CardDefinition, EngineRate>();

/**
 * How many creature tokens a permanent keeps making its controller each
 * round of the table — 0 for one that doesn't. Hero of Bladehold's two
 * Soldiers each attack, Young Pyromancer's Elemental off our instants and
 * sorceries, Elspeth, Sun's Champion's +1, Twilight Drover's activation. Not
 * a one-shot: Beetleback Chief makes its Goblins once, as it enters; nor an
 * ability that costs loyalty (Lord Windgrace's ultimate). The deck autopsies found the token decks' engines cast far less by
 * v2 than by v1 — Hero of Bladehold priced as a 3/4 — because nothing counted
 * what they keep making. Rated like {@link drawRate}.
 */
function tokenRate(registry: CardRegistry, def: CardDefinition, opponents: number): number {
  let rate = tokenMemo.get(def);
  if (rate === undefined) {
    rate = engineRate(
      def,
      (effect) => tokensPerFiring(registry, effect),
      (a) => a.cost.sacrifice !== "self" && !isManaAbility(a) && (a.loyaltyCost ?? 0) >= 0,
    );
    tokenMemo.set(def, rate);
  }
  return Math.min(TOKEN_RATE_CAP, rate.fixed + rate.perOpponent * opponents);
}

/** Life taken from opponents counted as a card: 4 life is a card in the
 * evaluation (`life` 0.5 against `hand` 2). */
const LIFE_PER_CARD = 4;
/** The most a permanent's track record is credited a round, as for
 * {@link DRAW_RATE_CAP}: one that has drawn a hand in a turn shouldn't
 * outweigh the board. */
const TRACK_RECORD_CAP = 3;

/** The real position a decision is being made in, while a bot is making
 * one — see {@link withTrackRecordEvidence}. */
let evidence: GameState | null = null;

/**
 * Run `decide` with every track record read off `root`, the position the bot
 * is actually deciding in, rather than off whichever position its search is
 * scoring. A rollout that plays into the next turn makes the damage it only
 * simulated a "settled" turn of the tally, and Ob Nixilis, the Fallen's
 * controller turned down its drain because the line where it didn't grow
 * happened to simulate a hit. The outermost call wins: a search nested in a
 * rollout is still judged by the real board, not by the rollout's.
 */
export function withTrackRecordEvidence<T>(root: GameState, decide: () => T): T {
  if (evidence !== null) return decide();
  evidence = root;
  try {
    return decide();
  } finally {
    evidence = null;
  }
}

/**
 * What a permanent has shown it does, a round, past what its printed
 * abilities already say: the cards its controller drew off it beyond
 * {@link drawRate}, and the life it took from opponents (damage, or a drain
 * like Ob Nixilis, the Fallen's) at a card per {@link LIFE_PER_CARD}, over the rounds it has been on the battlefield
 * before this turn (`GameObject.tally`, public, as `settledTally` reads it). The printed rates price an engine from the
 * turn it lands; this is the evidence for one they can't read — a creature
 * wearing the equipment, one that connects every turn, a draw a static
 * grants it. 0 for one that has done neither.
 */
export function trackRecordOf(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
  opponents: number,
): number {
  // The record as of the real board while a bot decides (a position its
  // search reached may have played on into later turns), and only turns
  // already over on it: a creature connecting in a combat being weighed
  // mustn't add to the evidence it's weighed by, or its damage would count
  // twice (in the life it costs, and again here). Nothing for one that
  // arrived this turn, or one not there in the real game.
  const real = evidence ?? state;
  const object = real.objects[id];
  if (object === undefined || object.tally === undefined || object.zone !== "battlefield") return 0;
  const now = real.turn.number;
  const turns = now - (object.enteredBattlefieldOnTurn ?? now);
  if (turns <= 0) return 0;
  const tally = settledTally(object, now);
  // Rounds of the table it has been here for, at least one.
  const rounds = Math.max(1, turns / Math.max(1, opponents + 1));
  const name = printedCardName(object);
  const printed = registry.has(name) ? drawRate(registry.get(name), opponents) : 0;
  const extraDraws = Math.max(0, tally.cardsDrawn - printed * rounds);
  const life = tally.lifeTaken / LIFE_PER_CARD;
  // Less than a card's worth isn't a record: one hit for 2 is a creature
  // doing what its power says, and a search that plays on past the turn
  // would otherwise credit the hits it only simulated.
  if (extraDraws + life < 1) return 0;
  return Math.min(TRACK_RECORD_CAP, (extraDraws + life) / rounds);
}

/**
 * How much of an engine a permanent is, in cards a round — its printed draw
 * rate, half its token rate (a token is about half a card, as `tokenEngines`
 * is weighted against `drawEngines`) and its track record — for ranking
 * targets (`bot/eval-bot.ts`'s `aimOffer`). The evaluation weighs the same
 * three with its own weights; this only has to put an engine among the
 * options the search gets to.
 */
export function engineScore(state: GameState, registry: CardRegistry, id: ObjectId): number {
  const object = state.objects[id];
  if (object === undefined || object.zone !== "battlefield") return 0;
  const opponents = state.turnOrder.filter((p) => p !== object.controller && !state.players[p].hasLost).length;
  const name = printedCardName(object);
  if (!registry.has(name)) return 0;
  const def = registry.get(name);
  return (
    drawRate(def, opponents) +
    tokenRate(registry, def, opponents) / 2 +
    trackRecordOf(state, registry, id, opponents)
  );
}

/**
 * One player's raw feature vector.
 *
 * `isMe` gates the terms that are hidden information: `handManaValue` reads
 * the *contents* of a hand, which only its owner may score. (The bot does in
 * fact have access to every hand — see "Known: the bot cheats" in the plan —
 * but scoring an opponent's hand contents would make the evaluation depend on
 * the cheat rather than merely tolerate it.)
 *
 * `landCap` is where lands stop paying full value and spill into
 * `extraLands`; it's a hyperparameter of the encoding, not a coefficient.
 */
export function playerFeatures(
  state: GameState,
  registry: CardRegistry,
  player: PlayerId,
  isMe: boolean,
  landCap: number,
): PlayerFeatures {
  // Pure read over one simulated state — cache the characteristics folds for
  // the scan (a no-op when a caller already holds a region open).
  return withComputedCache(() =>
    playerFeaturesUncached(state, registry, player, isMe, landCap),
  );
}

/**
 * How many of each of our untapped creatures (a token stack's, one by one)
 * would hold off an attack next turn: each can block a creature an opponent
 * could attack us with and kill it or survive it. A 2/2 kept home against
 * 3/3s can only chump, which the crackback check already prices where it
 * matters (lethal), and one kept home against no attacker at all blocks
 * nothing. Counted in full, they made tapping any creature to attack cost
 * `untappedCreatures`, and at three or four players chip damage to one of
 * several opponents scores less than that: v2 never swung a lone 2/2 even at
 * an empty table ("attacks the open player, not one with a blocker").
 *
 * Blockers too small to hold one off alone hold one off together — two 1/1s
 * kill a 2/2 between them — so each attacker takes one gang of them, the
 * fewest that kill it, biggest first. Opponents attack on their own turns,
 * and blocking taps nothing, so the gangs only have to cover the one
 * opponent who takes the most of them. Without the gangs a stack of
 * 1/1s deterred nothing against a table of 2/2s, and a bot sent eight of
 * thirteen past a planeswalker they had already killed instead of keeping
 * them home (reported from a live game, 2026-10-05).
 */
function deterringBlockers(state: GameState, registry: CardRegistry, player: PlayerId): Map<ObjectId, number> {
  const out = new Map<ObjectId, number>();
  const mine = combatCreatures(state, registry, player, true);
  if (mine.length === 0) return out;
  const attackersOf = new Map(
    state.turnOrder
      .filter((q) => q !== player && !state.players[q].hasLost)
      .map((q) => [
        q,
        combatCreatures(state, registry, q, false).filter(
          (a) => a.canAttack && playersAttackableNextTurn(state, registry, a.id).includes(player),
        ),
      ]),
  );
  const attackers = [...attackersOf.values()].flat();
  const deter = (blocker: CombatCreature): void => {
    out.set(blocker.id, (out.get(blocker.id) ?? 0) + 1);
  };
  const small: CombatCreature[] = [];
  for (const blocker of mine) {
    const holds = attackers.some(
      (attacker) =>
        canBlock(blocker, attacker) &&
        (blocker.damage >= attacker.toughness ||
          blocker.keywords.has("deathtouch") ||
          (attacker.damage < blocker.toughness && !attacker.keywords.has("deathtouch"))),
    );
    if (holds) deter(blocker);
    else if (blocker.damage > 0) small.push(blocker);
  }
  small.sort((a, b) => b.damage - a.damage);
  // The gangs `opponent`'s attackers would take, smallest attacker first.
  const gangsAgainst = (opponent: readonly CombatCreature[]): CombatCreature[] => {
    const left = [...small];
    const taken: CombatCreature[] = [];
    for (const attacker of [...opponent].sort((a, b) => a.toughness - b.toughness)) {
      const gang: CombatCreature[] = [];
      let damage = 0;
      for (const blocker of left) {
        if (damage >= attacker.toughness) break;
        if (!canBlock(blocker, attacker)) continue;
        gang.push(blocker);
        damage += blocker.damage;
      }
      if (gang.length < 2 || damage < attacker.toughness) continue;
      for (const blocker of gang) left.splice(left.indexOf(blocker), 1);
      taken.push(...gang);
    }
    return taken;
  };
  let most: CombatCreature[] = [];
  for (const opponent of attackersOf.values()) {
    const taken = gangsAgainst(opponent);
    if (taken.length > most.length) most = taken;
  }
  for (const blocker of most) deter(blocker);
  return out;
}

function playerFeaturesUncached(
  state: GameState,
  registry: CardRegistry,
  player: PlayerId,
  isMe: boolean,
  landCap: number,
): PlayerFeatures {
  const p = state.players[player];
  const zones = state.zones.perPlayer[player];

  let creatures = 0;
  let power = 0;
  let toughness = 0;
  let evasivePower = 0;
  let combatKeywords = 0;
  let untappedCreatures = 0;
  let landCount = 0;
  let untappedMana = 0;
  let otherPermanents = 0;
  let permanentManaValue = 0;
  let loyalty = 0;
  let counters = 0;
  let nonlandMana = 0;
  let drawEngines = 0;
  let tokenEngines = 0;
  let trackRecord = 0;
  const opponents = state.turnOrder.filter((p) => p !== player && !state.players[p].hasLost).length;
  let commanderOnBoard = 0;
  let idlePower = 0;
  let smallTokens = 0;
  /** Noncreature tokens by name — see `TOKEN_CAP` — and whether they're
   * one-shot resources (`isResourceToken`). */
  const tokenPiles = new Map<string, { count: number; resource: boolean }>();
  // Our own blockers count only where one would hold an attack off.
  const deterring = isMe ? deterringBlockers(state, registry, player) : null;

  for (const id of state.zones.shared.battlefield) {
    const object = state.objects[id];
    if (object === undefined || object.controller !== player) continue;
    // Gone at the next end step (mobilize's Warriors, blitz, unearth): what
    // it does in a simulated combat shows in life totals, and as a body it's
    // worth nothing past this turn — counted, Zurgo's attack scored +5.5
    // where it's worth about +2 (the Mardu autopsy).
    if (object.sacrificeAtEndStep === true || object.exileAtEndStep === true) continue;
    // One object can stand in for many token copies — see "Token stacking" in
    // docs/architecture/engine.md. A stack of twenty Saprolings is twenty creatures, not one.
    const n = object.stackCount ?? 1;
    const c = computeCharacteristics(state, registry, id);
    const isCreature = c.types.includes("creature");
    const isLand = c.types.includes("land");

    if (isCreature) {
      creatures += n;
      // The damage it would deal in combat, which is its power except under
      // Doran, the Siege Tower and the like — what these two terms measure.
      const damage = combatDamageOf(c);
      power += damage * n;
      // Capped: a wall's toughness past anything on the table that could
      // hit it blocks no better. Uncapped, Tree of Redemption's swap of 40
      // life for a 0/40 scored as a gain (a live capture, 2026-10-04).
      toughness += Math.min(c.toughness, TOUGHNESS_CAP) * n;
      if (count(c, EVASION) > 0) evasivePower += damage * n;
      // A 1/1 token: `creatures` prices every body alike, so before this one
      // outweighed two cards and v2 wouldn't Skullclamp it or feed it to
      // Deadly Dispute. Tokens only — a 1/1 card (Sakura-Tribe Elder) usually
      // does something besides.
      if (object.isToken && damage <= 1 && c.toughness <= 1) smallTokens += n;
      combatKeywords += count(c, COMBAT_KEYWORDS) * n;
      if (!object.tapped && !c.restrictions.has("cant-block")) {
        untappedCreatures += deterring === null ? n : Math.min(n, deterring.get(id) ?? 0);
      }
      // A creature that can't attack deals none of its power: Pacifism, a
      // defender. `power` counts it all the same — and so, before this, did
      // the bot, which is how it came to pacify its own creatures for free.
      if (
        c.restrictions.has("cant-attack") ||
        (c.keywords.has("defender") && !c.canAttackAsThoughNoDefender)
      ) {
        idlePower += damage * n;
      }
    }
    if (isLand) landCount += n;
    else permanentManaValue += manaValueOf(registry, printedCardName(object)) * n;
    if (!isLand && !isCreature) {
      if (object.isToken) {
        const name = printedCardName(object);
        const pile = tokenPiles.get(name) ?? { count: 0, resource: isResourceToken(registry, name) };
        tokenPiles.set(name, { ...pile, count: pile.count + n });
      } else {
        otherPermanents += n;
      }
    }
    const name = printedCardName(object);
    if (!isLand && registry.has(name)) {
      const def = registry.get(name);
      nonlandMana += manaPerTurn(def) * n;
      drawEngines += drawRate(def, opponents) * n;
      tokenEngines += tokenRate(registry, def, opponents) * n;
    }
    trackRecord += trackRecordOf(state, registry, id, opponents);
    if (object.isCommander && object.owner === player) commanderOnBoard += 1;
    if (!object.tapped && hasTapManaAbility(registry, object)) untappedMana += n;
    if (c.types.includes("planeswalker")) loyalty += (object.counters.loyalty ?? 0) * n;
    for (const [kind, amount] of Object.entries(object.counters)) {
      // A P/T counter of any size (Wall of Roots' -0/-1) is in the P/T already.
      if (!UNSCORED_COUNTERS.has(kind) && !PT_COUNTER.test(kind)) counters += amount * n;
    }
  }

  // Subtracted: the combat damage opponents' creatures could turn on us —
  // each counted in full when its controller attacked us within the last
  // round (`PlayerState.lastAttackedBy`), else split across the players it
  // could attack. A search scores a move at the end of the turn, when nothing
  // is attacking any more, so the attack a trailing player just made at us was
  // invisible: v2 killed the leader's Craw Wurm and took six from the one
  // swinging at it ("kills the creature attacking it, not the leader's").
  let threat = 0;
  if (isMe) {
    const living = state.turnOrder.filter((q) => !state.players[q].hasLost);
    const attackedBy = p.lastAttackedBy ?? {};
    for (const id of state.zones.shared.battlefield) {
      const object = state.objects[id];
      if (object === undefined || object.controller === player) continue;
      if (state.players[object.controller]?.hasLost !== false) continue;
      const c = computeCharacteristics(state, registry, id);
      if (!c.types.includes("creature")) continue;
      // Who it could attack next turn, by the attack rules themselves: none
      // of it is a threat to us under our Vow of Duty, goaded by us with
      // someone else to hit, or pacified (v2 stopped casting Vow of Duty on
      // an opponent's creature, whose +2/+2 read as more threat).
      const targets = playersAttackableNextTurn(state, registry, id);
      if (!targets.includes(player)) continue;
      const last = attackedBy[object.controller];
      const recent = last !== undefined && state.turn.number - last < living.length;
      const share = recent ? 1 : 1 / targets.length;
      // Damage against what's left to lose — our life, or for a commander
      // what's left of its 21, whichever is nearer: a 2/2 isn't a threat to
      // someone at 38 (v2 Fireballed a Cat token over casting Phyrexian
      // Arena), and Anafenza three short of lethal commander damage
      // outweighs a bigger Craw Wurm.
      const commanderLeft = object.isCommander
        ? COMMANDER_DAMAGE_LETHAL - (p.commanderDamageTaken[id] ?? 0)
        : Infinity;
      // What this turn has taken is credited back, as far as the life above
      // `THREAT_LIFE`: at high life the damage a simulated combat deals
      // doesn't also grow the threat of what dealt it — measured after the
      // combat, each point taken at 35 cost about 20×power/life² on top of
      // `life`, and v2 chump-blocked a Craw Wurm with a Soldier token at 35
      // (the Mardu autopsy) — while at 6 going to 1 every creature on the
      // table is still lethal.
      const life = p.life + Math.min(p.lifeLostThisTurn, Math.max(0, p.life - THREAT_LIFE));
      const scale = Math.min(
        MAX_THREAT_SCALE,
        THREAT_LIFE / Math.max(1, Math.min(life, commanderLeft)),
      );
      threat += combatDamageOf(c) * (object.stackCount ?? 1) * share * scale;
    }
  }

  let handManaValue = 0;
  // Counterspells still in hand: what they could answer later, which `hand`
  // prices like any card. v2 countered bob's Arcane Signet with its only
  // Counterspell ("saves Counterspell for a threat"), and every weight that
  // would have held it also stopped the bot casting its rocks and draw spells.
  // Only those the mana left untapped could cast, cheapest first: the deck
  // autopsies (2026-10-02) found counterspells credited in full while the bot
  // tapped out, so tapping out looked free and they rotted in hand (Grave
  // Danger cast two in 53 games and ended 18 holding one).
  let answers = 0;
  // Removal still in hand in the first `EARLY_REMOVAL_ROUNDS` rounds
  // (`isRemoval`): on boards that early, whatever is out is rarely what the
  // removal will be wanted for. The deck autopsies' seed 116: Jeskai Striker
  // spent Swords to Plowshares on a Wall of Reverence on its second turn and
  // had nothing for Lathliss later. Later in the game `hand` prices it like
  // any card, as before.
  const early = roundOf(state) <= EARLY_REMOVAL_ROUNDS;
  let earlyRemoval = 0;
  if (isMe) {
    const answerCosts: number[] = [];
    for (const id of zones.hand) {
      const object = state.objects[id];
      if (object === undefined || !registry.has(object.cardName)) continue;
      const def = registry.get(object.cardName);
      if (!def.types.includes("land")) handManaValue += manaValueOf(registry, def.name);
      if (isAnswer(def)) answerCosts.push(manaValueOf(registry, def.name));
      if (early && isRemoval(def)) earlyRemoval += 1;
    }
    let open = untappedMana;
    for (const cost of answerCosts.sort((x, y) => x - y)) {
      if (cost > open) break;
      open -= cost;
      answers += 1;
    }
    // Scaled by what the opponents still hold: a counterspell is worth
    // keeping for the spells to come, and those are in their hands. At
    // `ANSWER_HAND` cards each it's the reserve it always was; with every
    // hand empty it's nothing, so the bot counters what's in front of it;
    // at full grip, up to twice as much, so a Grizzly Bears goes by.
    answers *= answerHandScale(state, player);
  }

  let graveyardCastable = 0;
  for (const id of zones.graveyard) {
    const object = state.objects[id];
    if (object !== undefined && castableFromGraveyard(registry, object)) graveyardCastable += 1;
  }

  const cap = Math.max(0, landCap);
  let extraTokens = 0;
  let resourceTokens = 0;
  for (const { count, resource } of tokenPiles.values()) {
    if (resource) resourceTokens += Math.min(count, TOKEN_CAP);
    else otherPermanents += Math.min(count, TOKEN_CAP);
    extraTokens += Math.max(0, count - TOKEN_CAP);
  }

  return {
    life: p.life,
    lifeDanger: Math.max(0, LIFE_DANGER_AT - p.life),
    // Our own only: our spare life is a resource to spend, but an opponent's
    // is still the clock — discounting theirs too made chip damage at 40
    // worth less, and `bot:diff` showed v2 holding back a dozen attacks.
    lifeSurplus: isMe ? Math.max(0, p.life - LIFE_SURPLUS_ABOVE) : 0,
    trackRecord,
    // The nearest loss that isn't life: the worst commander's damage, or
    // poison on the same scale (10 counters lose as 21 damage does). Folded
    // into one term, so the fitted weight reads poison too without a refit.
    // Squared over 21 — 21 still counts 21, but a hit counts more the nearer
    // it brings the loss: a commander's first 3 points cost 0.4 rather than
    // 3, its last 3 cost 5.6. Linear, the first hit of a 3-power commander
    // was worth chump-blocking with a token at 35 life.
    commanderDamage: commanderDamageCurve(
      Math.max(
        0,
        ...Object.values(p.commanderDamageTaken),
        ((p.counters.poison ?? 0) * COMMANDER_DAMAGE_LETHAL) / POISON_LETHAL,
      ),
    ),
    hand: zones.hand.length,
    handManaValue,
    creatures,
    power,
    toughness,
    evasivePower,
    combatKeywords,
    untappedCreatures,
    lands: Math.min(landCount, cap),
    extraLands: Math.max(0, landCount - cap),
    untappedMana,
    otherPermanents,
    permanentManaValue,
    loyalty,
    counters,
    library: zones.library.length,
    libraryDanger: Math.max(0, LIBRARY_DANGER_AT - zones.library.length),
    graveyard: zones.graveyard.length,
    graveyardCastable,
    energy: p.energy,
    monarch: state.monarch === player ? 1 : 0,
    emblems: state.emblems.filter((e) => e.owner === player).length,
    commanderTax: Object.values(p.commanderCastCounts).reduce((a, b) => a + b, 0),
    nonlandMana,
    drawEngines,
    commanderOnBoard,
    idlePower,
    extraTokens,
    threat,
    answers,
    resourceTokens,
    tokenEngines,
    earlyRemoval,
    // Mana from rocks and creatures in the opening rounds, on top of
    // `nonlandMana`: a turn-one Sol Ring is worth killing then and much less
    // by turn six (the user's ask, 2026-10-04).
    earlyMana: nonlandMana * earlyManaShare(state),
    smallTokens,
  };
}
