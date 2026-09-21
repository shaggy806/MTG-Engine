/**
 * The opening-hand policy, shared by every bot.
 *
 * It lives here rather than in the search because a mulligan can't be searched
 * the way the other decisions are: there is no board to roll forward, and the
 * thing being judged is a *distribution* (what this hand will draw into) rather
 * than a position. So it's a scoring function, hooked onto
 * `HeuristicBotController` — which means v1, v2 and v3 all get it, and a bot
 * that would otherwise keep every seven-card hand no longer keeps a one-lander.
 *
 * ## What the score measures
 *
 * Two things, in the order they matter:
 *
 * 1. **Mana sources** — lands, plus cheap ramp that those lands can actually
 *    deploy. {@link SOURCE_SCORE} is a curve, not a threshold: it punishes
 *    flood as well as screw, because a seven-card hand of six lands is as dead
 *    as one of six spells.
 * 2. **Early plays** — the cheapest few nonlands this hand's own mana can cast,
 *    worth less each as they get later ({@link PLAY_VALUE}). Ramp scores a
 *    little extra on top ({@link RAMP_BONUS}), and it is worth being clear that
 *    this is deliberate double-counting: a ramp card is both a source and a
 *    play. In Commander that's correct — the commander is always castable from
 *    the command zone, so the opening hand's job is to reach it, not to find a
 *    threat.
 *
 * ## When it's healthy to go down to 6, 5 or 4
 *
 * This is the part that has no clean answer, so the policy states the question
 * differently: *the bar drops as the hand you'd keep gets smaller* (see
 * {@link KEEP_BAR}). Mulliganing is never judged against "is this a good hand"
 * in the abstract — it's judged against what you'd get instead, which is one
 * card fewer. A hand worth keeping at five would have been mulliganed at seven.
 *
 * Two riders on that:
 *
 * - A mulligan that costs nothing raises the bar instead ({@link FREE_LOOK_BONUS}).
 *   Under the Commander rule (`GameRules.freeFirstMulligan`) the first mulligan
 *   still keeps seven, so a mediocre opener should be thrown back for a free
 *   look at another one.
 * - Below {@link MIN_KEPT} cards the policy stops asking and keeps. A four-card
 *   hand that can't function is still a better game than a three-card one, and
 *   past this point the score is measuring noise.
 *
 * The numbers below are hand-picked against the shapes they're meant to sort
 * (see `mulligan-policy.test.ts`), not fitted — unlike `EvalWeights`, there's no
 * harvested-position corpus for a decision that happens once per game.
 */

import { isManaAbility } from "../abilities.js";
import { mulliganCardsOwed } from "../decisions/shared/mulligan-math.js";
import type { CardDefinition, CardRegistry } from "../cards.js";
import type { EffectSpec } from "../effects.js";
import type { CardFilter } from "../filter.js";
import { manaValue, parseManaCost } from "../mana.js";
import type { ObjectId } from "../primitives.js";
import type { GameObject } from "../state.js";

/** Hand score by the number of mana sources in it, clamped at both ends. Peaks
 * at 3-4: that's the band a Commander deck's opener wants, and both screw and
 * flood fall away steeply from it. */
const SOURCE_SCORE: readonly number[] = [-100, -45, -8, 8, 11, 3, -22, -60];

/** What the first, second and third castable nonland are worth. Decreasing,
 * because a hand's fourth play is a card it draws into rather than one it needs
 * to be holding now. */
const PLAY_VALUE: readonly number[] = [8, 5, 3];

/** Added to an early play that is also a mana source. */
const RAMP_BONUS = 3;

/** A ramp card above this mana value isn't *early* ramp, whatever else it is. */
const MAX_RAMP_MANA_VALUE = 3;

/** How much ramp may count toward {@link handSources}. A hand of one land and
 * four mana rocks is still a one-land hand — nothing after the second rock can
 * be deployed on time. */
const MAX_RAMP_SOURCES = 2;

/** The score a hand must reach to be kept, by how many cards keeping it now
 * would leave. Falls as the hand shrinks: see the module comment. */
const KEEP_BAR: Readonly<Record<number, number>> = { 7: 12, 6: 0, 5: -20 };

/** Added to the bar when mulliganing again wouldn't cost a card — a free look
 * is worth taking on anything short of a genuinely good hand. */
const FREE_LOOK_BONUS = 5;

/** At or below this many cards, keep whatever it is. */
const MIN_KEPT = 4;

/** Roughly what fraction of a kept hand should be lands, for
 * {@link chooseBottomOfHand}. */
const LAND_SHARE = 0.45;

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

const definitionFor = (
  registry: CardRegistry,
  object: GameObject,
): CardDefinition | null =>
  registry.has(object.cardName) ? registry.get(object.cardName) : null;

/** Every face's definition, for a card that has more than one. An MDFC whose
 * back is a land (Agadeem's Awakening) is a land for counting purposes — it's a
 * land drop whenever the hand needs one to be. */
function facesOf(registry: CardRegistry, def: CardDefinition): readonly CardDefinition[] {
  const faces = def.faces;
  if (faces === null || faces.length < 2) return [def];
  return faces.filter((name) => registry.has(name)).map((name) => registry.get(name));
}

const isLandFilter = (filter: CardFilter): boolean =>
  filter.type === "land" || (filter.types ?? []).includes("land");

/** Does any part of this effect tree put mana or a land into play? Walks the
 * composite specs (`sequence`, `modal`, `conditional`, `may`) rather than just
 * the top level, since a ramp clause is usually one arm of one of those. */
function effectRamps(effect: EffectSpec | null): boolean {
  if (effect === null) return false;
  switch (effect.kind) {
    case "add-mana":
      return true;
    case "search-library":
      // A tutor that only puts a land in hand (or on top) isn't ramp — it
      // still costs the land drop it was going to make anyway.
      return isLandFilter(effect.filter) && effect.destination === "battlefield";
    case "sequence":
      return effect.effects.some(effectRamps);
    case "modal":
      return effect.modes.some((mode) => effectRamps(mode.effect));
    case "conditional":
      return effectRamps(effect.then) || effectRamps(effect.else ?? null);
    case "may":
      return effectRamps(effect.effect);
    default:
      return false;
  }
}

/** A mana rock, a mana creature, a ritual or a land-fetching ramp spell — the
 * cards whose job is to make the next turn's mana rather than to affect the
 * board. Lands aren't ramp; they're counted as themselves. */
function isRamp(def: CardDefinition): boolean {
  if (def.types.includes("land")) return false;
  if (def.activated.some(isManaAbility)) return true;
  if (effectRamps(def.effect)) return true;
  return def.triggered.some((triggered) => effectRamps(triggered.effect));
}

const manaValueOf = (def: CardDefinition): number => manaValue(parseManaCost(def.manaCost));

/** One card in an opening hand, reduced to what the policy needs from it. */
interface HandCard {
  readonly id: ObjectId;
  readonly isLand: boolean;
  readonly isRamp: boolean;
  readonly manaValue: number;
}

function readHand(
  hand: readonly GameObject[],
  registry: CardRegistry,
): readonly HandCard[] {
  return hand.map((object) => {
    const def = definitionFor(registry, object);
    // An unregistered name shouldn't happen in a real game, but the policy is
    // reachable from scripts and tests: treat it as an uncastable nonland
    // rather than throwing in the middle of a mulligan.
    if (def === null) {
      return { id: object.id, isLand: false, isRamp: false, manaValue: 99 };
    }
    const faces = facesOf(registry, def);
    return {
      id: object.id,
      isLand: faces.some((face) => face.types.includes("land")),
      isRamp: faces.some(isRamp),
      // The front face is what a nonland is cast as; a land face has no cost.
      manaValue: manaValueOf(def),
    };
  });
}

/** Lands, plus the ramp those lands could actually deploy — see
 * {@link MAX_RAMP_SOURCES}. */
function handSources(cards: readonly HandCard[]): number {
  const lands = cards.filter((card) => card.isLand).length;
  const ramp = cards.filter(
    (card) =>
      !card.isLand &&
      card.isRamp &&
      card.manaValue <= MAX_RAMP_MANA_VALUE &&
      // Uncastable ramp is not a source. With no lands at all, nothing is.
      card.manaValue <= lands,
  ).length;
  return lands + Math.min(ramp, MAX_RAMP_SOURCES);
}

/** What an opening hand is worth. Public for the tests and for `bot:*`
 * diagnostics; the policy itself is {@link shouldMulligan}. */
export function scoreOpeningHand(
  hand: readonly GameObject[],
  registry: CardRegistry,
): number {
  const cards = readHand(hand, registry);
  const sources = handSources(cards);
  let score = SOURCE_SCORE[clamp(sources, 0, SOURCE_SCORE.length - 1)];

  // The cheapest nonlands this hand's own mana reaches, cheapest first — a
  // card costing more than the hand has sources is a card for a later turn,
  // and the opener isn't keeping itself on the strength of it.
  const plays = cards
    .filter((card) => !card.isLand && card.manaValue <= sources)
    .sort((a, b) => a.manaValue - b.manaValue)
    .slice(0, PLAY_VALUE.length);
  plays.forEach((card, i) => {
    score += PLAY_VALUE[i] + (card.isRamp ? RAMP_BONUS : 0);
  });
  return score;
}

/** How many cards a player who keeps now would hold, after paying what the
 * mulligans so far owe to the bottom of the library. */
export function keptHandSize(
  taken: number,
  openingHandSize: number,
  freeFirstMulligan: boolean,
): number {
  return Math.max(0, openingHandSize - mulliganCardsOwed(taken, freeFirstMulligan));
}

/**
 * Whether to throw this hand back, having already taken `taken` mulligans.
 *
 * The hand is always a full opening hand here — London draws a fresh seven
 * every time and the bottoming happens only once a hand is kept — so what
 * changes between calls isn't the size of what's being looked at but the price
 * of looking again.
 */
export function shouldMulligan(
  hand: readonly GameObject[],
  registry: CardRegistry,
  taken: number,
  rules: { readonly openingHandSize: number; readonly freeFirstMulligan: boolean },
): boolean {
  const kept = keptHandSize(taken, rules.openingHandSize, rules.freeFirstMulligan);
  if (kept <= MIN_KEPT) return false;
  const next = keptHandSize(taken + 1, rules.openingHandSize, rules.freeFirstMulligan);

  const bar =
    (KEEP_BAR[kept] ?? KEEP_BAR[Math.min(kept, 7)] ?? 0) +
    (next === kept ? FREE_LOOK_BONUS : 0);
  return scoreOpeningHand(hand, registry) < bar;
}

/**
 * Which `count` cards of a kept hand go to the bottom of the library.
 *
 * Surplus lands first — past the third or fourth, a land is the most
 * replaceable card in a small hand — then the most expensive spells, since a
 * hand that just shrank is a hand that will be casting cheap things. Ramp is
 * discounted so it survives that second cut.
 */
export function chooseBottomOfHand(
  hand: readonly GameObject[],
  registry: CardRegistry,
  count: number,
): readonly ObjectId[] {
  if (count <= 0) return [];
  const cards = readHand(hand, registry);
  const kept = Math.max(0, hand.length - count);
  const keepLands = clamp(Math.round(kept * LAND_SHARE), 2, 4);

  let landsSeen = 0;
  const ranked = cards.map((card, index) => {
    let score: number;
    if (card.isLand) {
      landsSeen += 1;
      score = landsSeen <= keepLands ? 90 : -60;
    } else {
      score = 60 - card.manaValue * 6 + (card.isRamp ? 10 : 0);
    }
    return { id: card.id, score, index };
  });
  // `index` as the tiebreak keeps this deterministic whatever the sort does
  // with equal keys — a bot decision has to replay identically from a seed.
  ranked.sort((a, b) => a.score - b.score || a.index - b.index);
  return ranked.slice(0, count).map((entry) => entry.id);
}
