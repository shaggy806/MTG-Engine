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
import type { TriggeredAbility } from "../abilities.js";
import { combatDamageOf, computeCharacteristics, withComputedCache } from "../characteristics.js";
import type { Characteristics } from "../characteristics.js";
import type { CardRegistry } from "../cards.js";
import type { CardDefinition, Keyword } from "../cards/define.js";
import type { EffectSpec } from "../effects.js";
import { manaValue, parseManaCost } from "../mana.js";
import type { PlayerId } from "../primitives.js";
import { POISON_LETHAL, printedCardName } from "../state.js";
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

/** Does this effect make its own controller draw? Anywhere in the tree. */
function drawsForController(effect: unknown): boolean {
  if (effect === null || typeof effect !== "object") return false;
  if (Array.isArray(effect)) return effect.some(drawsForController);
  const node = effect as { readonly kind?: unknown; readonly target?: unknown; readonly who?: unknown };
  if (node.kind === "draw" && node.target === undefined && (node.who === undefined || node.who === "you")) {
    return true;
  }
  return Object.values(effect).some(
    (value) => value !== null && typeof value === "object" && drawsForController(value),
  );
}

/** A trigger that fires once in a permanent's life — its own entering, dying,
 * leaving, being cast — draws once, not every turn. */
function isOneShot(trigger: TriggeredAbility["trigger"]): boolean {
  if (trigger.on === "this-cast") return true;
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

const answerMemo = new WeakMap<CardDefinition, boolean>();

/** A card held to counter something: its spell (or one of its modes) counters
 * a spell. Counterspell, Negate, Cryptic Command. */
function isAnswer(def: CardDefinition): boolean {
  let found = answerMemo.get(def);
  if (found === undefined) {
    found = counters(def.effect) || counters(def.castModal);
    answerMemo.set(def, found);
  }
  return found;
}

const engineMemo = new WeakMap<CardDefinition, boolean>();

/**
 * Whether a permanent keeps drawing its controller cards — an upkeep draw
 * (Phyrexian Arena), a draw on others entering, dying or being cast, a
 * repeatable activated or loyalty ability that draws. Not a one-shot: a
 * Solemn Simulacrum draws once, when it dies, and a Mind Stone once, when it's
 * sacrificed. The audit priced Phyrexian Arena at a quarter of a Grizzly
 * Bears, because nothing counted what it keeps doing.
 */
function isDrawEngine(def: CardDefinition): boolean {
  let found = engineMemo.get(def);
  if (found === undefined) {
    found =
      def.triggered.some((t) => !isOneShot(t.trigger) && drawsForController(t.effect)) ||
      def.activated.some(
        (a) => a.cost.sacrifice !== "self" && !isManaAbility(a) && drawsForController(a.effect),
      );
    engineMemo.set(def, found);
  }
  return found;
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
  let commanderOnBoard = 0;
  let idlePower = 0;
  /** Noncreature tokens by name — see `TOKEN_CAP`. */
  const tokenPiles = new Map<string, number>();

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
      // The damage it would deal in combat, which is its power except under
      // Doran, the Siege Tower and the like — what these two terms measure.
      const damage = combatDamageOf(c);
      power += damage * n;
      toughness += c.toughness * n;
      if (count(c, EVASION) > 0) evasivePower += damage * n;
      combatKeywords += count(c, COMBAT_KEYWORDS) * n;
      if (!object.tapped && !c.restrictions.has("cant-block")) untappedCreatures += n;
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
        tokenPiles.set(name, (tokenPiles.get(name) ?? 0) + n);
      } else {
        otherPermanents += n;
      }
    }
    const name = printedCardName(object);
    if (!isLand && registry.has(name)) {
      const def = registry.get(name);
      nonlandMana += manaPerTurn(def) * n;
      if (isDrawEngine(def)) drawEngines += n;
    }
    if (object.isCommander && object.owner === player) commanderOnBoard += 1;
    if (!object.tapped && hasTapManaAbility(registry, object)) untappedMana += n;
    if (c.types.includes("planeswalker")) loyalty += (object.counters.loyalty ?? 0) * n;
    for (const [kind, amount] of Object.entries(object.counters)) {
      if (!UNSCORED_COUNTERS.has(kind)) counters += amount * n;
    }
  }

  // Subtracted: the combat damage opponents' creatures could turn on us —
  // each counted in full when its controller attacked us within the last
  // round (`PlayerState.lastAttackedBy`), else split across that player's
  // opponents. A search scores a move at the end of the turn, when nothing is
  // attacking any more, so the attack a trailing player just made at us was
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
      if (
        c.restrictions.has("cant-attack") ||
        (c.keywords.has("defender") && !c.canAttackAsThoughNoDefender)
      ) {
        continue;
      }
      const last = attackedBy[object.controller];
      const recent = last !== undefined && state.turn.number - last < living.length;
      const share = recent ? 1 : 1 / Math.max(1, living.length - 1);
      // Damage against what's left to lose — our life, or for a commander
      // what's left of its 21, whichever is nearer: a 2/2 isn't a threat to
      // someone at 38 (v2 Fireballed a Cat token over casting Phyrexian
      // Arena), and Anafenza three short of lethal commander damage
      // outweighs a bigger Craw Wurm.
      const commanderLeft = object.isCommander
        ? COMMANDER_DAMAGE_LETHAL - (p.commanderDamageTaken[id] ?? 0)
        : Infinity;
      const scale = Math.min(
        MAX_THREAT_SCALE,
        THREAT_LIFE / Math.max(1, Math.min(p.life, commanderLeft)),
      );
      threat += combatDamageOf(c) * (object.stackCount ?? 1) * share * scale;
    }
  }

  let handManaValue = 0;
  // Counterspells still in hand: what they could answer later, which `hand`
  // prices like any card. v2 countered bob's Arcane Signet with its only
  // Counterspell ("saves Counterspell for a threat"), and every weight that
  // would have held it also stopped the bot casting its rocks and draw spells.
  let answers = 0;
  if (isMe) {
    for (const id of zones.hand) {
      const object = state.objects[id];
      if (object === undefined || !registry.has(object.cardName)) continue;
      const def = registry.get(object.cardName);
      if (!def.types.includes("land")) handManaValue += manaValueOf(registry, def.name);
      if (isAnswer(def)) answers += 1;
    }
  }

  let graveyardCastable = 0;
  for (const id of zones.graveyard) {
    const object = state.objects[id];
    if (object !== undefined && castableFromGraveyard(registry, object)) graveyardCastable += 1;
  }

  const cap = Math.max(0, landCap);
  let extraTokens = 0;
  for (const pile of tokenPiles.values()) {
    otherPermanents += Math.min(pile, TOKEN_CAP);
    extraTokens += Math.max(0, pile - TOKEN_CAP);
  }

  return {
    life: p.life,
    lifeDanger: Math.max(0, LIFE_DANGER_AT - p.life),
    // The nearest loss that isn't life: the worst commander's damage, or
    // poison on the same scale (10 counters lose as 21 damage does). Folded
    // into one term, so the fitted weight reads poison too without a refit.
    commanderDamage: Math.max(
      0,
      ...Object.values(p.commanderDamageTaken),
      ((p.counters.poison ?? 0) * COMMANDER_DAMAGE_LETHAL) / POISON_LETHAL,
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
  };
}
