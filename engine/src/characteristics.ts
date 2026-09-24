/**
 * Current (as opposed to printed) characteristics of an object, computed from
 * the continuous-effects layer system (rule 613).
 *
 * Implemented: **layer 1** (copy — every read resolves through
 * `printedCardName`, so a Clone has the copied card's P/T / types / abilities),
 * **layer 3** (text-change — a `PtModifier.textSubstitution` rewrites a
 * creature-type word in a permanent's subtypes and its lord clause), **layer
 * 4** (type-change — `PtModifier.addTypes`/`setSubtypes`/`addSubtypes` from a
 * man-land or Turn to Frog), **layer 5** (colour-change —
 * `PtModifier.setColors`/`addColors`), **layer 6** (keyword grants, plus
 * `PtModifier.loseAbilities` removing a permanent's own abilities), **layer
 * 7b** (a `"self"` CDA sets base P/T, then a `PtModifier.setPt` from a
 * "becomes a N/N"), **layer 7c** (counters), **layer 7d** (P/T bonuses +
 * modifiers), timestamp-ordered within a layer. NOT yet: full text-change
 * beyond a creature-type word, and dependency ordering. Layer 2
 * (control-change) is modeled in `game.ts` by reassigning
 * `GameObject.controller`, not here.
 */

import type {
  AffectSpec,
  CardRegistry,
  CardType,
  CombatRestriction,
  CountSpec,
  Keyword,
  StaticAbility,
  StaticCondition,
  TurnStat,
} from "./cards.js";
import {
  aggregateOver,
  aggregateValueOf,
  compareNum,
  matchesFilter,
  weightedMatches,
} from "./filter.js";
import type { CardFilter } from "./filter.js";
import type { Color } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import { permanentCount, printedCardName } from "./state.js";
import type { GameObject, GameState } from "./state.js";
import type { TargetRef } from "./target.js";

/**
 * Ids whose static `condition` is currently being evaluated. A condition that
 * reads other permanents' *computed* characteristics (`controls` / `metalcraft`)
 * can loop back here — two Kird Apes each ask "does the other satisfy my
 * condition?". Re-entry for an id already on this stack returns `false`
 * (conservative): the inner call resolves that permanent's non-conditional
 * characteristics (type / subtypes), which is all the outer scan needs.
 * Transient computation scaffolding — never part of `GameState`.
 */
const conditionInProgress = new Set<ObjectId>();

/**
 * Ids whose characteristic-defining count (`setBasePtFromCount`) is currently
 * being taken. A count whose filter reads computed characteristics ("creatures
 * you control with flying") asks about the CDA's own object, which would fold
 * its characteristics and take the count again. Re-entry for an id on this
 * stack skips the CDA and answers with the printed P/T — conservative, like
 * `conditionInProgress`, and likewise never cached. Transient scaffolding.
 */
const cdaInProgress = new Set<ObjectId>();

/** Whether a value computed now may be the re-entrancy guards' conservative
 * answer rather than the true one — and so must neither be served from nor
 * stored in the computed cache. */
function guardActive(): boolean {
  return conditionInProgress.size > 0 || cdaInProgress.size > 0;
}

/**
 * A scoped memo for computed values that are pure functions of the current
 * `GameState` — {@link computeCharacteristics} results, the
 * {@link contributingStaticSources} battlefield pre-scan, and (via
 * {@link computedCacheMemo}) `Game`-side derivations like the mana-source
 * list. Purely a performance mechanism: with no region active every read
 * computes fresh, exactly as before.
 *
 * **Soundness contract**: a region ({@link withComputedCache}) may only wrap
 * code that does not change any input these computations read — or that calls
 * {@link invalidateComputedCache} at every point where it does (`Game`'s
 * `moveObject`, `recomputeControl`, `withFace`, …). A region never spans more
 * than one `Game`/state, and nesting reuses the outer region's cache.
 *
 * Values computed *during* a static-condition evaluation are deliberately
 * never cached (and the cache is not consulted): `conditionInProgress`'s
 * re-entrancy guard makes those reads conservative rather than true (see
 * above), and serving or storing them would change observable behaviour.
 *
 * `setComputedCacheCheck(true)` turns every cache hit into a recompute +
 * deep-compare that throws on divergence — the fuzzer runs with it to verify
 * the invalidation contract empirically (`MTG_CACHE_CHECK=1`).
 */
interface ComputedCache {
  chars: Map<ObjectId, Characteristics>;
  staticSources: readonly ContributingStatic[] | null;
  misc: Map<string, unknown>;
}

let activeCache: ComputedCache | null = null;
/** The one reusable cache box — regions open and close far too often (every
 * `legalActions` / SBA sweep / event) to allocate fresh Maps each time. */
const pooledCache: ComputedCache = {
  chars: new Map(),
  staticSources: null,
  misc: new Map(),
};
let cacheCheck = false;

/** Enable/disable the differential self-check on every cache hit (slow —
 * fuzzing/debugging only). */
export function setComputedCacheCheck(on: boolean): void {
  cacheCheck = on;
}

/** Run `fn` with a computed-value cache active (see {@link ComputedCache} for
 * the soundness contract). Nested calls share the outermost region's cache. */
export function withComputedCache<T>(fn: () => T): T {
  if (activeCache !== null) return fn();
  pooledCache.chars.clear();
  pooledCache.staticSources = null;
  pooledCache.misc.clear();
  activeCache = pooledCache;
  try {
    return fn();
  } finally {
    activeCache = null;
  }
}

/** Drop everything the active cache holds. Called by every state mutation that
 * can run inside a cache region; a no-op when none is active. */
export function invalidateComputedCache(): void {
  if (activeCache === null) return;
  activeCache.chars.clear();
  activeCache.staticSources = null;
  activeCache.misc.clear();
}

/**
 * Run `fn` with no cache region active, then restore the suspended region
 * *cleared*. For mutation-heavy code whose reads and writes interleave too
 * finely for point invalidation (`Game.moveObject`): inside, every read
 * computes fresh exactly as it did before caching existed; a nested
 * {@link withComputedCache} (an `emit` → `detectTriggers` mid-move) opens its
 * own consistent region.
 */
export function suspendComputedCache<T>(fn: () => T): T {
  const saved = activeCache;
  activeCache = null;
  try {
    return fn();
  } finally {
    activeCache = saved;
    invalidateComputedCache();
  }
}

/** Memoize an arbitrary state-derived value in the active cache region under
 * `key` — used by `Game` for its mana-source list. Computes fresh when no
 * region is active or a condition evaluation is in progress. */
export function computedCacheMemo<T>(key: string, compute: () => T): T {
  if (activeCache === null || guardActive()) return compute();
  if (activeCache.misc.has(key)) return activeCache.misc.get(key) as T;
  const value = compute();
  activeCache.misc.set(key, value);
  return value;
}

/** Options for {@link staticConditionMet}. */
export interface ConditionOptions {
  /**
   * Whether `source` itself counts toward a board-scanning condition
   * (`controls` / `opponent-controls` / `metalcraft`). A *static* ability's
   * condition leaves itself out (default) — the scan would otherwise recurse
   * straight back into the characteristics computation that asked. A
   * triggered ability's intervening-if clause (rule 603.4) is evaluated
   * outside the layer fold and *must* count the source ("When ~ enters, if
   * you control a Dragon …" on a Dragon counts itself), so it passes `true`.
   */
  readonly includeSelf?: boolean;
  /**
   * The source's timestamp when the ability triggered
   * (`GameObject.sourceTimestamp`), for a `source-zone` condition's
   * `sameObject`. Passed only by a triggered ability's resolution check.
   */
  readonly sourceTimestamp?: number;
  /**
   * The chosen targets of the ability resolving, for a `controls`
   * condition's `excludeTarget`. Passed only by a resolution context (a
   * `conditional` effect); a static ability has none.
   */
  readonly targets?: readonly (TargetRef | undefined)[];
}

/**
 * Whether a {@link StaticCondition} is currently met, evaluated from the
 * perspective of `source`'s controller. A static / trigger with no condition
 * is always "met" — callers check that first.
 *
 * By default the battlefield scan skips `source` itself (see
 * {@link ConditionOptions.includeSelf}), and a re-entrant call for the same id
 * short-circuits to `false` (see `conditionInProgress`). Full dependency
 * ordering between mutually-conditional permanents is not modeled (the same
 * gap noted for layers generally).
 * ROADMAP Phase 11 EG-3; extended to triggered abilities in needed-cards P7.
 */
export function staticConditionMet(
  state: GameState,
  registry: CardRegistry,
  source: GameObject,
  condition: StaticCondition,
  opts: ConditionOptions = {},
): boolean {
  if (conditionInProgress.has(source.id)) return false;
  conditionInProgress.add(source.id);
  try {
    return evalStaticCondition(state, registry, source, condition, opts);
  } finally {
    conditionInProgress.delete(source.id);
  }
}

function evalStaticCondition(
  state: GameState,
  registry: CardRegistry,
  source: GameObject,
  condition: StaticCondition,
  opts: ConditionOptions,
): boolean {
  const you = source.controller;
  const skipsSelf = (id: ObjectId): boolean =>
    opts.includeSelf !== true && id === source.id;
  // Counts are of permanents, not objects (`permanentCount`). The source is
  // skipped *before* its filter is asked, never matched and subtracted:
  // asking whether the source matches can mean folding its characteristics,
  // which evaluates this very condition again.
  const matchesWhere = (keep: (id: ObjectId) => boolean, except: readonly ObjectId[] = []) =>
    weightedMatches(state, state.zones.shared.battlefield, (id) => !skipsSelf(id) && keep(id), except);
  const countWhere = (keep: (id: ObjectId) => boolean, except: readonly ObjectId[] = []): number =>
    matchesWhere(keep, except).reduce((n, m) => n + m.weight, 0);
  switch (condition.kind) {
    case "your-turn":
      return state.turnOrder[state.turn.activePlayerIndex] === you;
    case "monarch":
      return condition.who === "you"
        ? state.monarch === you
        : state.monarch !== null && state.monarch !== you;
    case "hand-size": {
      const n = state.zones.perPlayer[you].hand.length;
      return (
        (condition.atMost === undefined || n <= condition.atMost) &&
        (condition.atLeast === undefined || n >= condition.atLeast)
      );
    }
    case "threshold":
      return state.zones.perPlayer[you].graveyard.length >= 7;
    case "delirium": {
      // Distinct card *types*, not cards — one artifact creature is two of
      // the four. Printed types: layer effects don't reach a graveyard.
      const types = new Set<string>();
      for (const id of state.zones.perPlayer[you].graveyard) {
        const object = state.objects[id];
        if (object === undefined) continue;
        for (const t of registry.get(printedCardName(object)).types) types.add(t);
      }
      return types.size >= 4;
    }
    case "metalcraft":
      return (
        countWhere((id) => {
          const o = state.objects[id];
          return o.controller === you && effectiveTypes(registry, o).includes("artifact");
        }) >= 3
      );
    case "controls": {
      // A static ability's scan has already skipped the source whole.
      const except: ObjectId[] = [];
      if (condition.excludeSelf === true && opts.includeSelf === true) except.push(source.id);
      if (condition.excludeTarget !== undefined) {
        const ref = opts.targets?.[condition.excludeTarget];
        if (ref?.kind === "object") except.push(ref.object);
      }
      return (
        countWhere(
          (id) =>
            state.objects[id].controller === you &&
            matchesFilter(state, registry, id, condition.filter, { you }),
          except,
        ) >= condition.atLeast
      );
    }
    case "aggregate": {
      const { value } = condition;
      const except =
        value.excludeSelf === true && opts.includeSelf === true ? [source.id] : [];
      const matches = matchesWhere(
        (id) => matchesFilter(state, registry, id, value.filter, { you }),
        except,
      );
      return compareNum(
        aggregateOver(state, registry, matches, value.aggregate, value.of),
        condition.compare,
      );
    }
    case "source-greatest": {
      if (source.zone !== "battlefield") return false;
      const mine = aggregateValueOf(state, registry, source.id, condition.of);
      // The source's own stack-mates are other permanents with its value.
      const others = weightedMatches(
        state,
        state.zones.shared.battlefield,
        (id) =>
          (id !== source.id || (source.stackCount ?? 1) > 1) &&
          matchesFilter(state, registry, id, condition.filter, { you }),
        [source.id],
      );
      return others.every((m) => {
        const theirs = aggregateValueOf(state, registry, m.id, condition.of);
        return condition.strict === true ? mine > theirs : mine >= theirs;
      });
    }
    case "opponent-controls":
      // "an opponent controls three or more creatures" — one opponent must
      // meet the count on their own, so count per player and take the best.
      return state.turnOrder.some(
        (p) =>
          p !== you &&
          !state.players[p].hasLost &&
          countWhere(
            (id) =>
              state.objects[id].controller === p &&
              matchesFilter(state, registry, id, condition.filter, { you: p }),
          ) >= condition.atLeast,
      );
    case "opponents-control-total":
      return (
        countWhere((id) => {
          const controller = state.objects[id].controller;
          return (
            controller !== you &&
            !state.players[controller].hasLost &&
            matchesFilter(state, registry, id, condition.filter, { you: controller })
          );
        }) >= condition.atLeast
      );
    case "opponent-count":
      // Counted live: a table that has shrunk to a duel no longer has "two or
      // more opponents", and an eliminated player is not one.
      return (
        state.turnOrder.filter((p) => p !== you && !state.players[p].hasLost).length >=
        condition.atLeast
      );
    case "source":
      return matchesFilter(state, registry, source.id, condition.filter, { you });
    case "source-zone":
      return (
        condition.zones.includes(source.zone) &&
        (condition.sameObject !== true ||
          opts.sourceTimestamp === undefined ||
          source.timestamp === opts.sourceTimestamp)
      );
    case "chosen-on-enter":
      return source.chosenOnEnter === condition.value;
    case "self-kicked":
      // On the battlefield it's `enteredKicked` (the stack flag is cleared by
      // the move that put the permanent here); `kicked` still answers for a
      // source that is itself on the stack.
      return source.enteredKicked === true || source.kicked === true;
    case "creature-died-this-turn":
      return state.creaturesDiedThisTurn > 0;
    case "created-token-this-turn":
      return state.players[you]?.createdTokenThisTurn === true;
    case "used-graveyard-this-turn":
      return state.players[you]?.usedGraveyardThisTurn === true;
    case "not":
      // `evalStaticCondition`, not `staticConditionMet`: the re-entrancy guard
      // keys on `source.id`, and this is still the *same* source — routing
      // back through it would short-circuit to false and make every `not`
      // read true. The guard exists for mutually-conditional permanents, not
      // for a composite condition on one of them.
      return !evalStaticCondition(state, registry, source, condition.of, opts);
    case "opponent-lost-life-this-turn":
      return state.turnOrder.some(
        (p) => p !== you && state.players[p].lifeLostThisTurn > 0,
      );
    case "turn-stat": {
      // Per player, never summed: "an opponent lost 4 or more life this
      // turn" is satisfied by one opponent reaching 4, not by two reaching
      // 2 apiece. `any-player` includes `you` (Y'shtola).
      const seats =
        condition.who === "you"
          ? [you]
          : condition.who === "opponent"
            ? state.turnOrder.filter((p) => p !== you)
            : state.turnOrder;
      return seats.some((p) => turnStatOf(state, p, condition.stat) >= condition.atLeast);
    }
    case "self-counters": {
      // Last-known information once the source has left the battlefield
      // (603.10) — `moveObject` clears `counters`, so a dies-trigger asking
      // "did it have counters" has only the snapshot to go on.
      const held =
        source.zone === "battlefield" ? source.counters : (source.lastKnownCounters ?? {});
      const n =
        condition.counter === undefined
          ? Object.values(held).reduce((sum, v) => sum + (v ?? 0), 0)
          : (held[condition.counter] ?? 0);
      return compareNum(n, condition.compare);
    }
    case "target":
    case "trigger-object":
    case "resolved-this-turn":
      // A static ability has no triggering object, no chosen targets and no
      // resolution in progress — these kinds are only meaningful inside a
      // `conditional` effect, where the resolution context answers them
      // instead (see `Game`'s `conditionMet`).
      return false;
  }
}

export interface Characteristics {
  readonly power: number;
  readonly toughness: number;
  readonly keywords: ReadonlySet<Keyword>;
  readonly types: readonly CardType[];
  readonly subtypes: readonly string[];
  readonly colors: ReadonlySet<Color>;
  readonly controller: PlayerId;
  /** Combat restrictions from static abilities (Pacifism, Juggernaut). */
  readonly restrictions: ReadonlySet<CombatRestriction>;
  /** Protection (rule 702.16): the union of every "protection from …" clause
   * — a source matching any of these colours, types or filters can't target /
   * block / enchant / damage this object. */
  readonly protectionFrom: {
    readonly colors: ReadonlySet<Color>;
    readonly types: ReadonlySet<CardType>;
    /** Qualities no colour or card type can name — a subtype, multicoloured,
     * or (an empty filter) everything. Evaluated only against a source the
     * engine can identify as an object; see `protectionBlocks`. */
    readonly filters: readonly CardFilter[];
  };
}

/** True if this permanent has lost its own abilities (layer 6 — Turn to Frog). */
/**
 * One player's running total for `stat` this turn.
 *
 * The single place these fields are read by name, so a card never depends
 * on which `PlayerState` field backs which stat.
 */
export function turnStatOf(state: GameState, player: PlayerId, stat: TurnStat): number {
  const seat = state.players[player];
  if (seat === undefined) return 0;
  switch (stat) {
    case "life-lost":
      return seat.lifeLostThisTurn;
    case "life-gained":
      return seat.lifeGainedThisTurn;
    case "cards-drawn":
      return seat.cardsDrawnThisTurn;
  }
}

export function hasLostAbilities(object: GameObject): boolean {
  return object.modifiers.some((m) => m.loseAbilities === true);
}

/** Apply this object's own text-substitution modifiers (layer 3) to one word. */
function substituteWord(object: GameObject, word: string): string {
  let w = word;
  for (const m of object.modifiers) {
    if (m.textSubstitution && w === m.textSubstitution.from) w = m.textSubstitution.to;
  }
  return w;
}

/**
 * A permanent's current subtypes: printed → layer 3 (text substitution) →
 * layer 4 (`setSubtypes` replaces, then `addSubtypes` unions). Self-contained
 * (nothing external grants subtypes here), so it's safe to call from
 * `staticAffects` without recursing back into {@link computeCharacteristics}.
 */
export function effectiveSubtypes(
  registry: CardRegistry,
  object: GameObject,
): readonly string[] {
  let subtypes: readonly string[] = registry.get(printedCardName(object)).subtypes;
  for (const m of object.modifiers) {
    if (m.textSubstitution) {
      const { from, to } = m.textSubstitution;
      subtypes = subtypes.map((s) => (s === from ? to : s));
    }
  }
  for (const m of object.modifiers) {
    if (m.setSubtypes) subtypes = [...m.setSubtypes];
  }
  const added: string[] = [];
  for (const m of object.modifiers) if (m.addSubtypes) added.push(...m.addSubtypes);
  return added.length > 0 ? [...new Set([...subtypes, ...added])] : subtypes;
}

/**
 * A permanent's current card types: printed → layer 4 (`addTypes` from an
 * `animate` — a man-land becoming a creature). Nothing *external* grants a
 * type, so like {@link effectiveSubtypes} this is self-contained and doesn't
 * need the layer fold — which lets `matchesFilter` answer a type question
 * without recursing into {@link computeCharacteristics}.
 */
export function effectiveTypes(
  registry: CardRegistry,
  object: GameObject,
): readonly CardType[] {
  const printed = registry.get(printedCardName(object)).types;
  const added: CardType[] = [];
  for (const m of object.modifiers) if (m.addTypes) added.push(...m.addTypes);
  return added.length > 0 ? [...new Set([...printed, ...added])] : printed;
}

/** A permanent's current colours: printed → layer 5 (`setColors` replaces,
 * `addColors` unions), in modifier order. */
export function effectiveColors(
  registry: CardRegistry,
  object: GameObject,
): Set<Color> {
  let colors = new Set<Color>(registry.get(printedCardName(object)).colors);
  for (const m of object.modifiers) {
    if (m.setColors) colors = new Set(m.setColors);
    if (m.addColors) for (const c of m.addColors) colors.add(c);
  }
  return colors;
}

/** The current value of a CDA's dynamic count (rule 604.3). */
function countValue(
  spec: CountSpec,
  state: GameState,
  registry: CardRegistry,
  controller: PlayerId,
): number {
  const allGraveyards = (): ObjectId[] =>
    state.turnOrder.flatMap((p) => state.zones.perPlayer[p]?.graveyard ?? []);
  if (typeof spec === "object") {
    if ("countOf" in spec) {
      return permanentCount(
        state,
        state.zones.shared.battlefield.filter((id) =>
          matchesFilter(state, registry, id, spec.countOf, { you: controller }),
        ),
      );
    }
    return allGraveyards().filter((id) =>
      matchesFilter(state, registry, id, spec.countInGraveyard, { you: controller }),
    ).length;
  }
  switch (spec) {
    case "cards-in-all-graveyards":
      return allGraveyards().length;
    case "cards-in-your-hand":
      return state.zones.perPlayer[controller]?.hand.length ?? 0;
    default:
      return 0;
  }
}

function counterPtBonus(counter: string): { power: number; toughness: number } {
  if (counter === "+1/+1") return { power: 1, toughness: 1 };
  if (counter === "-1/-1") return { power: -1, toughness: -1 };
  return { power: 0, toughness: 0 };
}

/**
 * Whether `object` is a creature *right now* — its layer-4 types, not its
 * printed ones. A creature-scoped static reaches an animated land or an
 * artifact that became a creature just as it reaches a printed creature
 * (rule 613.1d puts type-changing effects before every layer these statics
 * work in), and stops reaching a creature that is no longer one.
 */
function isCreatureNow(
  registry: CardRegistry,
  object: GameObject,
): boolean {
  return effectiveTypes(registry, object).includes("creature");
}

/** Whether an `AffectSpec` narrows its reach by keyword — the statics whose
 * scope has to wait for the target's layer-6 keywords (rule 613.8). */
function scopedByKeyword(affects: AffectSpec): boolean {
  return (
    (affects.scope === "creatures-you-control" || affects.scope === "all-creatures") &&
    (affects.withKeyword !== undefined ||
      (affects.scope === "all-creatures" && affects.withoutKeyword !== undefined))
  );
}

/**
 * Whether a static's `affects` reaches `target`.
 *
 * A `withKeyword`/`withoutKeyword` clause asks about the target's *current*
 * keywords — flying from an Aura or an anthem counts, and a creature that
 * lost its abilities has none. Those come from `targetKeywords`, which the
 * caller supplies because answering it means folding layer 6, and this
 * function is called from inside that fold; without one, it falls back to
 * printed keywords (less ability loss).
 */
export function staticAffects(
  registry: CardRegistry,
  affects: AffectSpec,
  source: GameObject,
  target: GameObject,
  targetKeywords?: () => ReadonlySet<Keyword>,
): boolean {
  const hasKeyword = (keyword: Keyword): boolean =>
    targetKeywords !== undefined
      ? targetKeywords().has(keyword)
      : !(target.zone === "battlefield" && hasLostAbilities(target)) &&
        registry.get(printedCardName(target)).keywords.includes(keyword);
  if (affects.scope === "self") return source.id === target.id;
  if (affects.scope === "attached") return source.attachedTo === target.id;
  if (affects.scope === "lands-you-control") {
    return (
      target.controller === source.controller &&
      effectiveTypes(registry, target).includes("land")
    );
  }
  if (affects.scope === "all-creatures") {
    // Every creature on the battlefield, whoever controls it.
    if (affects.excludeSelf === true && source.id === target.id) return false;
    if (!isCreatureNow(registry, target)) return false;
    if (affects.subtype !== undefined && !effectiveSubtypes(registry, target).includes(affects.subtype)) {
      return false;
    }
    if (affects.withKeyword !== undefined && !hasKeyword(affects.withKeyword)) return false;
    if (affects.withoutKeyword !== undefined && hasKeyword(affects.withoutKeyword)) return false;
    return true;
  }
  // "creatures-you-control"
  if (affects.excludeSelf && source.id === target.id) return false;
  if (target.controller !== source.controller) return false;
  if (!isCreatureNow(registry, target)) return false;
  if (affects.tokenOnly === true && target.isToken !== true) return false;
  if (affects.withKeyword !== undefined && !hasKeyword(affects.withKeyword)) return false;
  if (affects.chosenColorOnly === true) {
    const chosen = source.chosenOnEnter;
    if (chosen == null) return false;
    if (!effectiveColors(registry, target).has(chosen as Color)) return false;
  }
  if (affects.withCounter !== undefined) {
    const kind = affects.withCounter.kind;
    const held =
      kind === undefined
        ? Object.values(target.counters).reduce((n, v) => n + (v ?? 0), 0)
        : (target.counters[kind] ?? 0);
    if (held <= 0) return false;
  }
  if (affects.subtype !== undefined) {
    // The source's own text-change (Artificial Evolution on Goblin Chieftain)
    // rewrites the word in its lord clause too; the target is matched on its
    // *current* subtypes (layer 3 + 4).
    const wanted = substituteWord(source, affects.subtype);
    if (!effectiveSubtypes(registry, target).includes(wanted)) return false;
  }
  return true;
}

interface AppliedEffect {
  readonly timestamp: number;
  readonly power: number;
  readonly toughness: number;
  readonly keywords: readonly Keyword[];
  readonly restrictions: readonly CombatRestriction[];
  readonly protection: {
    colors?: readonly Color[];
    types?: readonly CardType[];
    filter?: CardFilter;
  } | null;
}

/** One battlefield static that *can* contribute P/T / keywords / restrictions
 * / protection to some permanent — the target-independent half of
 * {@link collectStaticEffects}'s scan, cacheable per region. */
interface ContributingStatic {
  readonly source: GameObject;
  readonly ability: StaticAbility;
}

/**
 * Every battlefield static that could modify *any* permanent, in battlefield
 * order. The scan (battlefield × each permanent's static list, with the
 * layer-6 ability-loss check) used to run once per **target** inside
 * {@link collectStaticEffects}, making every characteristics read O(board);
 * on most boards almost nothing contributes, so the shared pre-scan collapses
 * that to a short (usually empty) list matched per target. Memoized in the
 * active cache region; per-target matching and condition evaluation stay
 * live, exactly as before.
 */
function contributingStaticSources(
  state: GameState,
  registry: CardRegistry,
): readonly ContributingStatic[] {
  if (activeCache !== null && activeCache.staticSources !== null) {
    return activeCache.staticSources;
  }
  const out: ContributingStatic[] = [];
  for (const sourceId of state.zones.shared.battlefield) {
    const source = state.objects[sourceId];
    if (hasLostAbilities(source)) continue; // layer 6 — its statics don't function
    // An eliminated player's permanents stay on the board to be looked at but
    // stop affecting the game — so their anthems and lords stop applying too.
    // See the note in `matchesFilter`: they leave play, not view — rule
    // 800.4a would have removed them from the game entirely.
    if (state.players[source.controller]?.hasLost === true) continue;
    for (const ability of registry.get(printedCardName(source)).static) {
      // Only P/T-bonus / keyword-grant / restriction statics contribute here.
      // A static that is purely a replacement (rule 614 — "enters tapped") or
      // a CDA (`setBasePtFromCount`, handled in its own pass) modifies nothing.
      if (
        ability.grantPt === undefined &&
        ability.grantPtPerCount === undefined &&
        ability.grantKeywords === undefined &&
        ability.restrictions === undefined &&
        ability.protection === undefined
      ) {
        continue;
      }
      out.push({ source, ability });
    }
  }
  if (activeCache !== null) activeCache.staticSources = out;
  return out;
}

/** Continuous effects from battlefield permanents that apply to `target`.
 *
 * Two passes, because a static scoped by keyword ("other creatures you
 * control **with flying** get +1/+0") depends on every effect that grants or
 * removes that keyword (rule 613.8a): first everything else — including every
 * layer-6 grant, from anthems, emblems and the target's own modifiers — then
 * the keyword-scoped statics, matched against the keywords that produced.
 * The keyword set is built from the pass-one effects themselves rather than
 * a recursive characteristics read, so nothing here re-enters the fold, and
 * it's only built at all when a keyword-scoped static is on the battlefield.
 * One level deep: a keyword-scoped static's *own* keyword grant (Sephara's
 * indestructible) isn't seen by another keyword-scoped static. */
function collectStaticEffects(
  state: GameState,
  registry: CardRegistry,
  target: GameObject,
): AppliedEffect[] {
  const out: AppliedEffect[] = [];
  const sources = contributingStaticSources(state, registry);
  const applied = (source: GameObject, ability: StaticAbility): AppliedEffect | null => {
    // "As long as …" gate (rule 604.3 — ROADMAP Phase 11 EG-3). Checked
    // *after* `staticAffects` so a static that can't reach `target` never
    // evaluates its condition (which may itself read other permanents'
    // characteristics — checking it eagerly would recurse).
    if (
      ability.condition !== undefined &&
      !staticConditionMet(state, registry, source, ability.condition)
    ) {
      return null;
    }
    // A count-scaled bonus is read live, from the source's controller's
    // perspective — the same way `setBasePtFromCount` reads its own.
    let scaledPower = 0;
    let scaledToughness = 0;
    if (ability.grantPtPerCount !== undefined) {
      const per = ability.grantPtPerCount;
      const filter = per.filter;
      const n =
        per.commanderCasts === true
          ? Object.values(state.players[source.controller]?.commanderCastCounts ?? {}).reduce(
              (total, casts) => total + casts,
              0,
            )
          : filter === undefined
            ? 0
            : // Skipping the source before `matchesFilter` is what keeps
              // Skycat Sovereign ("each *other* creature with flying") from
              // folding its own characteristics to answer its own bonus.
              permanentCount(
                state,
                state.zones.shared.battlefield.filter(
                  (id) =>
                    !(per.excludeSelf === true && id === source.id) &&
                    matchesFilter(state, registry, id, filter, { you: source.controller }),
                ),
              );
      scaledPower = n * per.pt[0];
      scaledToughness = n * per.pt[1];
    }
    return {
      timestamp: source.timestamp,
      power: (ability.grantPt?.[0] ?? 0) + scaledPower,
      toughness: (ability.grantPt?.[1] ?? 0) + scaledToughness,
      keywords: ability.grantKeywords ?? [],
      restrictions: ability.restrictions ?? [],
      protection: ability.protection ?? null,
    };
  };
  let keywordScoped = false;
  for (const { source, ability } of sources) {
    if (scopedByKeyword(ability.affects)) {
      keywordScoped = true;
      continue;
    }
    if (!staticAffects(registry, ability.affects, source, target)) continue;
    const effect = applied(source, ability);
    if (effect !== null) out.push(effect);
  }
  // Emblems (rule 114 — ROADMAP Phase 10): a player-owned anthem with no
  // battlefield object. Only the `"creatures-you-control"` scope is supported.
  for (const emblem of state.emblems) {
    const ability = emblem.static;
    if (
      ability === null ||
      ability.affects.scope !== "creatures-you-control" ||
      (ability.grantPt === undefined &&
        ability.grantKeywords === undefined &&
        ability.restrictions === undefined &&
        ability.protection === undefined)
    ) {
      continue;
    }
    if (target.controller !== emblem.owner || !isCreatureNow(registry, target)) continue;
    if (
      ability.affects.subtype !== undefined &&
      !effectiveSubtypes(registry, target).includes(ability.affects.subtype)
    ) {
      continue;
    }
    out.push({
      timestamp: emblem.timestamp,
      power: ability.grantPt?.[0] ?? 0,
      toughness: ability.grantPt?.[1] ?? 0,
      keywords: ability.grantKeywords ?? [],
      restrictions: ability.restrictions ?? [],
      protection: ability.protection ?? null,
    });
  }
  if (keywordScoped) {
    let keywords: Set<Keyword> | null = null;
    const targetKeywords = (): ReadonlySet<Keyword> => {
      if (keywords === null) {
        keywords = new Set(
          hasLostAbilities(target) ? [] : registry.get(printedCardName(target)).keywords,
        );
        for (const effect of out) for (const k of effect.keywords) keywords.add(k);
        for (const modifier of target.modifiers) for (const k of modifier.keywords) keywords.add(k);
      }
      return keywords;
    };
    const second: AppliedEffect[] = [];
    for (const { source, ability } of sources) {
      if (!scopedByKeyword(ability.affects)) continue;
      if (!staticAffects(registry, ability.affects, source, target, targetKeywords)) continue;
      const effect = applied(source, ability);
      if (effect !== null) second.push(effect);
    }
    out.push(...second);
  }
  out.sort((a, b) => a.timestamp - b.timestamp);
  return out;
}

export function computeCharacteristics(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
): Characteristics {
  // Cache only outside condition evaluation — a value computed while any
  // static condition is in progress may be the re-entrancy guard's
  // conservative answer, not the true one (see `conditionInProgress`).
  if (activeCache !== null && !guardActive()) {
    const hit = activeCache.chars.get(id);
    if (hit !== undefined) {
      if (cacheCheck) assertSameCharacteristics(hit, computeCharacteristicsUncached(state, registry, id), id);
      return hit;
    }
    const value = computeCharacteristicsUncached(state, registry, id);
    activeCache.chars.set(id, value);
    return value;
  }
  return computeCharacteristicsUncached(state, registry, id);
}

/** Throw if a cached {@link Characteristics} diverges from a fresh compute —
 * the {@link setComputedCacheCheck} self-check. */
function assertSameCharacteristics(
  cached: Characteristics,
  fresh: Characteristics,
  id: ObjectId,
): void {
  const show = (c: Characteristics): string =>
    JSON.stringify({
      power: c.power,
      toughness: c.toughness,
      keywords: [...c.keywords].sort(),
      types: [...c.types].sort(),
      subtypes: [...c.subtypes].sort(),
      colors: [...c.colors].sort(),
      controller: c.controller,
      restrictions: [...c.restrictions].sort(),
      protColors: [...c.protectionFrom.colors].sort(),
      protTypes: [...c.protectionFrom.types].sort(),
      // Serialised whole: a filter is a plain object, and two of them
      // differing is exactly the divergence this check exists to catch.
      protFilters: c.protectionFrom.filters.map((f) => JSON.stringify(f)).sort(),
    });
  const a = show(cached);
  const b = show(fresh);
  if (a !== b) {
    throw new Error(
      `computed-cache divergence for ${id}: cached ${a} vs fresh ${b} — a mutation inside a cache region is missing an invalidateComputedCache() call`,
    );
  }
}

function computeCharacteristicsUncached(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
): Characteristics {
  const object = state.objects[id];
  const def = registry.get(printedCardName(object));

  const onBattlefield = object.zone === "battlefield";
  const lostAbilities = onBattlefield && hasLostAbilities(object);

  let power = def.power ?? 0;
  let toughness = def.toughness ?? 0;
  // Layer 6 — a permanent that lost its abilities keeps no printed keywords.
  const keywords = new Set<Keyword>(lostAbilities ? [] : def.keywords);
  let types: readonly CardType[] = def.types;
  // Layers 3 + 4 — text substitution, then set/add subtypes.
  const subtypes: readonly string[] = onBattlefield
    ? effectiveSubtypes(registry, object)
    : def.subtypes;
  // Layer 5 — colour-changing effects.
  const colors: ReadonlySet<Color> = onBattlefield
    ? effectiveColors(registry, object)
    : new Set(def.colors);

  const staticEffects = onBattlefield
    ? collectStaticEffects(state, registry, object)
    : [];

  // Layer 4 — type adds. A man-land's animation adds `creature` (and often
  // `artifact`) on top of the printed types; nothing removes types yet.
  if (onBattlefield) {
    const addedTypes: CardType[] = [];
    for (const modifier of object.modifiers) {
      if (modifier.addTypes) addedTypes.push(...modifier.addTypes);
    }
    if (addedTypes.length > 0) types = [...new Set([...types, ...addedTypes])];
  }

  // Layer 6 — ability adds (external anthems + modifier grants still reach a
  // permanent that lost its *own* abilities).
  // `collectStaticEffects` already includes a permanent's own `"self"`
  // restriction static (Juggernaut) as well as external ones (Pacifism).
  const restrictions = new Set<CombatRestriction>();
  const protColors = new Set<Color>();
  const protTypes = new Set<CardType>();
  const protFilters: CardFilter[] = [];
  for (const effect of staticEffects) {
    for (const keyword of effect.keywords) keywords.add(keyword);
    for (const r of effect.restrictions) restrictions.add(r);
    if (effect.protection) {
      for (const c of effect.protection.colors ?? []) protColors.add(c);
      for (const t of effect.protection.types ?? []) protTypes.add(t);
      if (effect.protection.filter !== undefined) protFilters.push(effect.protection.filter);
    }
  }
  for (const modifier of object.modifiers) {
    for (const keyword of modifier.keywords) keywords.add(keyword);
  }

  // Layer 7b — base P/T set by this object's own characteristic-defining
  // ability (rule 604.3 / 613.4b). Only a `"self"` static applies — and not
  // if the permanent has lost its abilities. A CDA works in every zone
  // (604.3), so a Psychosis Crawler in a library or graveyard is as big as
  // its owner's hand, which a "creature card with power 2 or less" search
  // has to see.
  if (!lostAbilities) {
    for (const ability of def.static) {
      if (ability.setBasePtFromCount === undefined) continue;
      if (cdaInProgress.has(object.id)) continue;
      if (
        ability.condition !== undefined &&
        !staticConditionMet(state, registry, object, ability.condition)
      ) {
        continue;
      }
      let n: number;
      cdaInProgress.add(object.id);
      try {
        n = countValue(ability.setBasePtFromCount.countOf, state, registry, object.controller);
      } finally {
        cdaInProgress.delete(object.id);
      }
      power = n + ability.setBasePtFromCount.plusPower;
      toughness = n + ability.setBasePtFromCount.plusToughness;
    }
  }
  // Layer 7b — a "becomes a N/N" (man-land animation, Turn to Frog) *sets*
  // base P/T. This is part of the effect, not the permanent's own CDA, so it
  // still applies when the same effect also removed its abilities. Latest
  // wins; before counters (7c) and bonuses (7d).
  if (onBattlefield) {
    for (const modifier of object.modifiers) {
      if (modifier.setPt) {
        power = modifier.setPt[0];
        toughness = modifier.setPt[1];
      }
    }
  }

  // Layer 7c — P/T counters.
  for (const [counter, count] of Object.entries(object.counters)) {
    const bonus = counterPtBonus(counter);
    power += bonus.power * count;
    toughness += bonus.toughness * count;
  }

  // Layer 7d — P/T modifications (additive; order does not affect the result).
  for (const effect of staticEffects) {
    power += effect.power;
    toughness += effect.toughness;
  }
  for (const modifier of object.modifiers) {
    power += modifier.power;
    toughness += modifier.toughness;
  }

  return {
    power,
    toughness,
    keywords,
    types,
    subtypes,
    colors,
    controller: object.controller,
    restrictions,
    protectionFrom: { colors: protColors, types: protTypes, filters: protFilters },
  };
}

/**
 * Combat restrictions on `id` from static abilities (Pacifism, Juggernaut).
 *
 * A one-field read of {@link computeCharacteristics}, as a free function so
 * the combat predicates can be lifted out of `Game` without dragging `this`
 * along — see `combat/eligibility.ts`.
 */
export function restrictionsOf(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
): ReadonlySet<CombatRestriction> {
  return computeCharacteristics(state, registry, id).restrictions;
}

/** Whether `id` currently has `keyword`, counting every layer-6 grant and
 * ability-loss. The free-function counterpart of {@link restrictionsOf}. */
export function objHasKeyword(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
  keyword: Keyword,
): boolean {
  return computeCharacteristics(state, registry, id).keywords.has(keyword);
}

/** @deprecated Use {@link computeCharacteristics}. */
export const characteristicsOf = computeCharacteristics;
