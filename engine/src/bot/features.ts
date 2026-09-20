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
 * - `crackbackParanoia` and `crackbackMargin` aren't evaluation terms at all —
 *   they're knobs on the attack builder's combat arithmetic
 *   (`combat-math.ts`).
 *
 * Those five stay hand-set or tuned by the (1+1)-ES in `tune-bot.mjs`. See
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
import { computeCharacteristics, withComputedCache } from "../characteristics.js";
import type { Characteristics } from "../characteristics.js";
import type { CardRegistry } from "../cards.js";
import type { Keyword } from "../cards/define.js";
import { manaValue, parseManaCost } from "../mana.js";
import type { PlayerId } from "../primitives.js";
import { printedCardName } from "../state.js";
import type { GameObject, GameState } from "../state.js";

/** The terms the score is linear in — the vector a fit operates on. Order is
 * load-bearing: `featureVector` and the fitted-weight files index by it. */
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
 * Where a library stops being a resource and starts being a clock.
 *
 * Same shape and same reasoning as {@link LIFE_DANGER_AT}: milling ten off a
 * 12-card library and off a 52-card one score identically today (ratio 1.00),
 * and drawing from an empty library loses the game outright (rule 104.3c).
 */
const LIBRARY_DANGER_AT = 15;

export const featureSign = (key: FeatureKey): number => (SUBTRACTED.has(key) ? -1 : 1);

const EVASION: readonly Keyword[] = [
  "flying",
  "menace",
  "trample",
  "fear",
  "intimidate",
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
    (def.activated ?? []).some((a) => a.zone === "graveyard")
  );
}

const count = (c: Characteristics, keywords: readonly Keyword[]): number =>
  keywords.filter((k) => c.keywords.has(k)).length;

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

  for (const id of state.zones.shared.battlefield) {
    const object = state.objects[id];
    if (object === undefined || object.controller !== player) continue;
    // One object can stand in for many token copies — see "Token stacking" in
    // CLAUDE.md. A stack of twenty Saprolings is twenty creatures, not one.
    const n = object.stackCount ?? 1;
    const c = computeCharacteristics(state, registry, id);
    const isCreature = c.types.includes("creature");
    const isLand = c.types.includes("land");

    if (isCreature) {
      creatures += n;
      power += c.power * n;
      toughness += c.toughness * n;
      if (count(c, EVASION) > 0) evasivePower += c.power * n;
      combatKeywords += count(c, COMBAT_KEYWORDS) * n;
      if (!object.tapped && !c.restrictions.has("cant-block")) untappedCreatures += n;
    }
    if (isLand) landCount += n;
    else permanentManaValue += manaValueOf(registry, printedCardName(object)) * n;
    if (!isLand && !isCreature) otherPermanents += n;
    if (!object.tapped && hasTapManaAbility(registry, object)) untappedMana += n;
    if (c.types.includes("planeswalker")) loyalty += (object.counters.loyalty ?? 0) * n;
    for (const [kind, amount] of Object.entries(object.counters)) {
      if (!UNSCORED_COUNTERS.has(kind)) counters += amount * n;
    }
  }

  let handManaValue = 0;
  if (isMe) {
    for (const id of zones.hand) {
      const object = state.objects[id];
      if (object === undefined || !registry.has(object.cardName)) continue;
      const def = registry.get(object.cardName);
      if (!def.types.includes("land")) handManaValue += manaValueOf(registry, def.name);
    }
  }

  let graveyardCastable = 0;
  for (const id of zones.graveyard) {
    const object = state.objects[id];
    if (object !== undefined && castableFromGraveyard(registry, object)) graveyardCastable += 1;
  }

  const cap = Math.max(0, landCap);

  return {
    life: p.life,
    lifeDanger: Math.max(0, LIFE_DANGER_AT - p.life),
    commanderDamage: Math.max(0, ...Object.values(p.commanderDamageTaken)),
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
  };
}

/** `FEATURE_KEYS` order, signs folded in — the design vector for a fit, and
 * what a fitted coefficient multiplies. */
export const featureVector = (f: PlayerFeatures): number[] =>
  FEATURE_KEYS.map((k) => featureSign(k) * f[k]);
