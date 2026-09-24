/**
 * Current (as opposed to printed) characteristics of an object, computed from
 * the continuous-effects layer system (rule 613).
 *
 * Implemented: **layer 1** (copy — every read resolves through
 * `printedCardName`, so a Clone has the copied card's P/T / types / abilities),
 * **layer 3** (text-change — a `PtModifier.textSubstitution` rewrites a
 * creature-type word in a permanent's subtypes and its lord clause), **layer
 * 4** (type-change — `PtModifier.addTypes`/`setSubtypes`/`addSubtypes` from a
 * man-land or Turn to Frog, and statics' `addTypes`/`addSubtypes` granted to
 * other permanents; see `layerFour`), **layer 5** (colour-change —
 * `PtModifier.setColors`/`addColors`), **layer 6** (keyword grants, plus
 * `PtModifier.loseAbilities` removing a permanent's own abilities), **layer
 * 7b** (a `"self"` CDA sets base P/T, then a `PtModifier.setPt` from a
 * "becomes a N/N" and a static's `setBasePt`), **layer 7c** (counters),
 * **layer 7d** (P/T bonuses + modifiers), timestamp-ordered within a layer.
 * NOT yet: full text-change beyond a creature-type word, and dependency
 * ordering (rule 613.8) outside layer 4's additive type grants. Layer 2
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
import type { GameObject, GameState, LastKnownInfo, PtModifier, TurnHistoryKind } from "./state.js";
import type { TargetRef } from "./target.js";
import { isMainPhase } from "./turn.js";
import type { Step } from "./turn.js";

/** The steps of a combat phase (rule 506.1). */
const COMBAT_STEPS: ReadonlySet<Step> = new Set<Step>([
  "begin-combat",
  "declare-attackers",
  "declare-blockers",
  "combat-damage",
  "end-combat",
]);

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

/**
 * Ids whose own token stack is being matched against their "each **other**
 * …" count bonus (`grantPtPerCount.excludeSelf` — see `othersInOwnStack`).
 * Matching the source can fold its characteristics, which reads the same
 * bonus; re-entry answers 0 (conservative) and is never cached.
 */
const ownStackInProgress = new Set<ObjectId>();

/**
 * Ids whose layer-4 fold ({@link layerFour}) is in progress. A type-granting
 * static's scope is matched against the types folded so far, never by asking
 * for the target's types again — but its condition, or a filter clause about
 * something attached, can read other permanents, whose own statics may ask
 * about this one. Re-entry for an id on this stack answers with the
 * permanent's own types (printed plus its modifiers, no external grants):
 * conservative, like the guards above, and likewise never cached. This is
 * what keeps two type-granting statics whose scopes read each other's grants
 * (a Kudo beside a Bello) from looping. Transient scaffolding.
 */
const layer4InProgress = new Set<ObjectId>();

/** Whether a value computed now may be the re-entrancy guards' conservative
 * answer rather than the true one — and so must neither be served from nor
 * stored in the computed cache. */
function guardActive(): boolean {
  return (
    conditionInProgress.size > 0 ||
    cdaInProgress.size > 0 ||
    layer4InProgress.size > 0 ||
    ownStackInProgress.size > 0
  );
}

/**
 * The other tokens in `source`'s own stack that an "each **other** …" count
 * bonus sees. The count skips the source permanent, but a token stack is
 * `stackCount` interchangeable tokens, and the rest of them are "other" to
 * each one — Minn, Wily Illusionist's Illusions, made one at a time, fold
 * into one stack, and each still gets +1/+0 for the others. They match the
 * filter exactly when the source does.
 */
function othersInOwnStack(
  state: GameState,
  registry: CardRegistry,
  source: GameObject,
  filter: CardFilter,
): number {
  const others = (source.stackCount ?? 1) - 1;
  if (others <= 0 || ownStackInProgress.has(source.id)) return 0;
  ownStackInProgress.add(source.id);
  try {
    return matchesFilter(state, registry, source.id, filter, { you: source.controller }) ? others : 0;
  } finally {
    ownStackInProgress.delete(source.id);
  }
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
  layer4: Map<ObjectId, LayerFour>;
  staticSources: readonly ContributingStatic[] | null;
  typeSources: readonly ContributingStatic[] | null;
  misc: Map<string, unknown>;
}

let activeCache: ComputedCache | null = null;
/** The one reusable cache box — regions open and close far too often (every
 * `legalActions` / SBA sweep / event) to allocate fresh Maps each time. */
const pooledCache: ComputedCache = {
  chars: new Map(),
  layer4: new Map(),
  staticSources: null,
  typeSources: null,
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
  pooledCache.layer4.clear();
  pooledCache.staticSources = null;
  pooledCache.typeSources = null;
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
  activeCache.layer4.clear();
  activeCache.staticSources = null;
  activeCache.typeSources = null;
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
  /**
   * The source as it last existed on the battlefield, when the ability
   * asking is about a permanent that has since left (rule 603.10a — a dies
   * trigger's "if it had no +1/+1 counters on it", "if it was equipped").
   * Supplied by a caller that knows which departure it means (see
   * `LastKnownRefs`); without it, a source off the battlefield falls back to
   * its latest snapshot.
   */
  readonly sourceLastKnown?: LastKnownInfo;
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
  const matchesWhere = (
    keep: (id: ObjectId) => boolean,
    except: readonly ObjectId[] = [],
    countSelf = false,
  ) =>
    weightedMatches(
      state,
      state.zones.shared.battlefield,
      (id) => (countSelf || !skipsSelf(id)) && keep(id),
      except,
    );
  const countWhere = (
    keep: (id: ObjectId) => boolean,
    except: readonly ObjectId[] = [],
    countSelf = false,
  ): number => matchesWhere(keep, except, countSelf).reduce((n, m) => n + m.weight, 0);
  switch (condition.kind) {
    case "your-turn":
      return state.turnOrder[state.turn.activePlayerIndex] === you;
    case "monarch":
      return condition.who === "you"
        ? state.monarch === you
        : state.monarch !== null && state.monarch !== you;
    case "player-counters": {
      const has = (p: PlayerId): boolean =>
        (state.players[p]?.counters[condition.counter] ?? 0) >= condition.atLeast;
      return condition.who === "you"
        ? has(you)
        : state.turnOrder.some((p) => p !== you && state.players[p]?.hasLost !== true && has(p));
    }
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
          return o.controller === you && effectiveTypes(state, registry, o).includes("artifact");
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
          condition.countsSelf === true,
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
    case "opponent-controls-more": {
      const mine = countWhere(
        (id) =>
          state.objects[id].controller === you &&
          matchesFilter(state, registry, id, condition.filter, { you }),
      );
      return state.turnOrder.some(
        (p) =>
          p !== you &&
          !state.players[p].hasLost &&
          countWhere(
            (id) =>
              state.objects[id].controller === p &&
              matchesFilter(state, registry, id, condition.filter, { you: p }),
          ) > mine,
      );
    }
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
      return matchesFilter(state, registry, source.id, condition.filter, {
        you,
        ...(opts.sourceLastKnown !== undefined ? { snapshot: opts.sourceLastKnown } : {}),
      });
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
    case "turn-structure": {
      const step = state.turn.step;
      const inCombat = COMBAT_STEPS.has(step);
      if (condition.steps !== undefined && !condition.steps.includes(step)) return false;
      if (condition.duringCombat === true && !inCombat) return false;
      if (
        condition.combatPhase !== undefined &&
        (!inCombat || (state.turn.combatPhases ?? 0) !== condition.combatPhase)
      ) {
        return false;
      }
      if (
        condition.mainPhase !== undefined &&
        (!isMainPhase(step) || (state.turn.mainPhases ?? 0) !== condition.mainPhase)
      ) {
        return false;
      }
      return true;
    }
    case "damage-dealt-this-turn": {
      const seats =
        condition.who === undefined || condition.who === "you"
          ? [you]
          : condition.who === "opponent"
            ? state.turnOrder.filter((p) => p !== you)
            : state.turnOrder;
      return damageDealtThisTurn(state, seats, condition.combat, condition.colors) >= condition.atLeast;
    }
    case "turn-history": {
      const seats =
        condition.who === undefined || condition.who === "you"
          ? [you]
          : condition.who === "opponent"
            ? state.turnOrder.filter((p) => p !== you)
            : state.turnOrder;
      const n = turnHistoryCount(
        state,
        registry,
        seats,
        condition.what,
        condition.filter,
        you,
        condition.excludeSelf === true ? source.id : undefined,
      );
      return n >= (condition.atLeast ?? 1);
    }
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
        opts.sourceLastKnown?.counters ??
        (source.zone === "battlefield" ? source.counters : (source.lastKnown?.counters ?? {}));
      const n =
        condition.counter === undefined
          ? Object.values(held).reduce((sum, v) => sum + (v ?? 0), 0)
          : (held[condition.counter] ?? 0);
      return compareNum(n, condition.compare);
    }
    case "target":
    case "trigger-object":
    case "sacrificed":
    case "resolved-this-turn":
    case "this-way":
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
  /** Combat restrictions from static abilities (Pacifism, Juggernaut) and
   * from `restrict` effects' modifiers. */
  readonly restrictions: ReadonlySet<CombatRestriction>;
  /** It assigns combat damage equal to its toughness rather than its power
   * (a `combatDamageByToughness` static — Doran, the Siege Tower), already
   * resolved against its final P/T for the `"if-toughness-greater"` form.
   * Read it through {@link combatDamageOf}, never directly. */
  readonly damageByToughness: boolean;
  /** It "can attack as though it didn't have defender" (a
   * `canAttackAsThoughNoDefender` static — Arcades, the Strategist). */
  readonly canAttackAsThoughNoDefender: boolean;
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
    case "spells-cast":
      return seat.spellsCastThisTurn;
    case "damage-taken":
      return seat.turnHistory?.damageTaken ?? 0;
    case "combat-damage-taken":
      return seat.turnHistory?.combatDamageTaken ?? 0;
    case "attacked":
      return seat.turnHistory?.attacked === true ? 1 : 0;
  }
}

/**
 * How much damage sources `players` controlled dealt this turn — combat or
 * noncombat only if `combat` says, and only from sources that were one of
 * `colors` as they dealt it if that's given — the `damage-dealt-this-turn`
 * condition and amount.
 */
export function damageDealtThisTurn(
  state: GameState,
  players: readonly PlayerId[],
  combat: boolean | undefined,
  colors: readonly Color[] | undefined,
): number {
  let n = 0;
  for (const player of players) {
    for (const dealt of state.players[player]?.turnHistory?.damageDealt ?? []) {
      if (combat !== undefined && dealt.combat !== combat) continue;
      if (colors !== undefined && !dealt.colors.some((c) => colors.includes(c))) continue;
      n += dealt.amount;
    }
  }
  return n;
}

/**
 * How many things of one {@link TurnHistory} list `players` have this turn,
 * matching `filter` from `you`'s side — a token stack counting as every
 * token in it. A permanent that has left the battlefield is matched as it
 * last existed there; a card put into a graveyard (`descended`), as it is
 * now. `except` leaves one object out ("another Human").
 */
export function turnHistoryCount(
  state: GameState,
  registry: CardRegistry,
  players: readonly PlayerId[],
  what: TurnHistoryKind,
  filter: CardFilter | undefined,
  you: PlayerId,
  except?: ObjectId,
): number {
  let n = 0;
  for (const player of players) {
    for (const entry of state.players[player]?.turnHistory?.[what] ?? []) {
      if (entry.object === except) continue;
      if (
        filter !== undefined &&
        !matchesFilter(state, registry, entry.object, filter, {
          you,
          ...(what === "descended" ? {} : { lastKnown: true }),
        })
      ) {
        continue;
      }
      n += entry.count;
    }
  }
  return n;
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

/** Printed subtypes after this object's own layer-3 text substitution. */
function textChangedSubtypes(registry: CardRegistry, object: GameObject): readonly string[] {
  let subtypes: readonly string[] = registry.get(printedCardName(object)).subtypes;
  for (const m of object.modifiers) {
    if (m.textSubstitution) {
      const { from, to } = m.textSubstitution;
      subtypes = subtypes.map((s) => (s === from ? to : s));
    }
  }
  return subtypes;
}

/**
 * A permanent's types and subtypes after layer 4 (rule 613.1d), and which
 * type-granting statics reached it there.
 */
export interface LayerFour {
  readonly types: readonly CardType[];
  readonly subtypes: readonly string[];
  /**
   * The statics with a layer-4 part (`addTypes` / `addSubtypes`) that
   * applied to this permanent. Rule 613.6: an effect keeps applying to the
   * same set of objects in its later layers, so the rest of such a static
   * (Bello's keywords and 4/4, Ragost's granted ability) reaches exactly
   * these — see {@link staticReaches}.
   */
  readonly applied: readonly ContributingStatic[];
}

const NO_STATICS: readonly ContributingStatic[] = [];

/** One layer-4 step: an object's own modifier, or an external static. */
type LayerFourStep =
  | { readonly key: number; readonly modifier: PtModifier }
  | { readonly key: number; readonly grant: ContributingStatic };

/** The order key of a modifier's layer-4 / 7b part (see
 * `PtModifier.timestamp`): just after a static whose source has the same
 * timestamp, and after every static when it has none. */
function modifierKey(modifier: PtModifier): number {
  return modifier.timestamp !== undefined ? modifier.timestamp + 0.5 : Infinity;
}

function applyModifierTypes(
  modifier: PtModifier,
  types: CardType[] | readonly CardType[],
  subtypes: readonly string[],
): { types: readonly CardType[]; subtypes: readonly string[] } {
  let t = types;
  let st = subtypes;
  if (modifier.setSubtypes) st = [...modifier.setSubtypes];
  if (modifier.addTypes && modifier.addTypes.length > 0) t = union(t, modifier.addTypes);
  if (modifier.addSubtypes && modifier.addSubtypes.length > 0) st = union(st, modifier.addSubtypes);
  return { types: t, subtypes: st };
}

function union<T>(a: readonly T[], b: readonly T[]): readonly T[] {
  let out: T[] | null = null;
  for (const x of b) {
    if ((out ?? a).includes(x)) continue;
    out ??= [...a];
    out.push(x);
  }
  return out ?? a;
}

/**
 * Layer 4 for one object: printed types and subtypes (subtypes after layer
 * 3), then every type-changing effect in timestamp order (rule 613.7) — the
 * object's own modifiers (an `animate`, amass's "it's also a Zombie", Turn to
 * Frog's "becomes a Frog") and, on the battlefield, every static with an
 * `addTypes` / `addSubtypes` part whose scope reaches it (Kudo's Bears,
 * Ragost's Foods, Bello's creatures).
 *
 * Each static's scope is matched against the types folded so far plus what
 * earlier passes added, which approximates dependency order (rule 613.8) for
 * these additive effects — see `foldLayerFour`. See `layer4InProgress` for
 * why this can't loop.
 */
export function layerFour(
  state: GameState,
  registry: CardRegistry,
  object: GameObject,
): LayerFour {
  const sources =
    object.zone === "battlefield" && !layer4InProgress.has(object.id)
      ? typeGrantSources(state, registry)
      : NO_STATICS;
  if (sources.length === 0) return ownLayerFour(registry, object);
  if (activeCache !== null && !guardActive()) {
    const hit = activeCache.layer4.get(object.id);
    if (hit !== undefined) {
      if (cacheCheck) assertSameLayerFour(hit, foldLayerFour(state, registry, object, sources), object.id);
      return hit;
    }
    const value = foldLayerFour(state, registry, object, sources);
    activeCache.layer4.set(object.id, value);
    return value;
  }
  return foldLayerFour(state, registry, object, sources);
}

/** Layer 4 from the object's own modifiers alone — everything there was
 * before statics could grant types, and still the whole answer whenever no
 * type-granting static is on the battlefield. */
function ownLayerFour(registry: CardRegistry, object: GameObject): LayerFour {
  let types: readonly CardType[] = registry.get(printedCardName(object)).types;
  let subtypes = textChangedSubtypes(registry, object);
  for (const modifier of object.modifiers) {
    ({ types, subtypes } = applyModifierTypes(modifier, types, subtypes));
  }
  return { types, subtypes, applied: NO_STATICS };
}

/**
 * The fold itself. Timestamp order alone gets dependency wrong in the common
 * case: Kudo's "other creatures are Bears" depends on anything that makes a
 * permanent a creature (rule 613.8a), so a Mishra's Factory animated after
 * Kudo arrived is still a Bear. Every layer-4 effect here only *adds* types
 * (bar a modifier's `setSubtypes`), so the fold is repeated with each scope
 * matched against the types it has so far *plus* everything the previous
 * pass added, until which statics apply stops changing — the dependency
 * order for additive effects. A pair that depend on each other (a loop,
 * 613.8k) settles in timestamp order, and the pass count is bounded.
 */
function foldLayerFour(
  state: GameState,
  registry: CardRegistry,
  object: GameObject,
  sources: readonly ContributingStatic[],
): LayerFour {
  const steps: LayerFourStep[] = [];
  for (const grant of sources) steps.push({ key: grant.source.timestamp, grant });
  for (const modifier of object.modifiers) steps.push({ key: modifierKey(modifier), modifier });
  steps.sort((a, b) => a.key - b.key);
  layer4InProgress.add(object.id);
  try {
    let result = foldLayerFourOnce(state, registry, object, steps, null);
    for (let pass = 0; pass < sources.length; pass += 1) {
      const next = foldLayerFourOnce(state, registry, object, steps, result);
      const settled =
        next.applied.length === result.applied.length &&
        next.applied.every((a, i) => a === result.applied[i]);
      result = next;
      if (settled) break;
    }
    return result;
  } finally {
    layer4InProgress.delete(object.id);
  }
}

function foldLayerFourOnce(
  state: GameState,
  registry: CardRegistry,
  object: GameObject,
  steps: readonly LayerFourStep[],
  previous: LayerFour | null,
): LayerFour {
  let types: readonly CardType[] = registry.get(printedCardName(object)).types;
  let subtypes = textChangedSubtypes(registry, object);
  const applied: ContributingStatic[] = [];
  for (const step of steps) {
    if ("modifier" in step) {
      ({ types, subtypes } = applyModifierTypes(step.modifier, types, subtypes));
      continue;
    }
    const { source, ability } = step.grant;
    const view = {
      types: previous === null ? types : union(types, previous.types),
      subtypes: previous === null ? subtypes : union(subtypes, previous.subtypes),
      inFold: true,
    };
    if (!staticAffects(state, registry, ability.affects, source, object, view)) continue;
    if (
      ability.condition !== undefined &&
      !staticConditionMet(state, registry, source, ability.condition)
    ) {
      continue;
    }
    if (ability.addTypes !== undefined) types = union(types, ability.addTypes);
    if (ability.addSubtypes !== undefined) {
      // The source's own text change rewrites the word it grants, as it
      // does a lord clause's.
      subtypes = union(subtypes, ability.addSubtypes.map((w) => substituteWord(source, w)));
    }
    applied.push(step.grant);
  }
  return { types, subtypes, applied };
}

/** Throw if a cached {@link LayerFour} diverges from a fresh fold — the
 * {@link setComputedCacheCheck} self-check for the layer-4 cache. */
function assertSameLayerFour(cached: LayerFour, fresh: LayerFour, id: ObjectId): void {
  const show = (l: LayerFour): string =>
    JSON.stringify({
      types: [...l.types].sort(),
      subtypes: [...l.subtypes].sort(),
      applied: l.applied.map((a) => `${a.source.id}:${a.ability.text}`),
    });
  const a = show(cached);
  const b = show(fresh);
  if (a !== b) {
    throw new Error(
      `computed-cache divergence (layer 4) for ${id}: cached ${a} vs fresh ${b} — a mutation inside a cache region is missing an invalidateComputedCache() call`,
    );
  }
}

/** Whether a static changes types in layer 4 — and so fixes, there, which
 * permanents the rest of it applies to (rule 613.6). */
function hasLayerFourPart(ability: StaticAbility): boolean {
  return ability.addTypes !== undefined || ability.addSubtypes !== undefined;
}

/**
 * Every battlefield static with a layer-4 part, in battlefield order —
 * usually none, and then {@link layerFour} is exactly the old self-contained
 * read. Memoized in the active cache region like
 * {@link contributingStaticSources}.
 */
function typeGrantSources(
  state: GameState,
  registry: CardRegistry,
): readonly ContributingStatic[] {
  if (activeCache !== null && activeCache.typeSources !== null) return activeCache.typeSources;
  let out: ContributingStatic[] | null = null;
  for (const sourceId of state.zones.shared.battlefield) {
    const source = state.objects[sourceId];
    const statics = registry.get(printedCardName(source)).static;
    if (statics.length === 0) continue;
    for (const ability of statics) {
      if (!hasLayerFourPart(ability)) continue;
      // As in `contributingStaticSources`: a permanent that lost its
      // abilities, or whose controller has left the game, grants nothing.
      if (hasLostAbilities(source) || state.players[source.controller]?.hasLost === true) break;
      (out ??= []).push({ source, ability });
    }
  }
  const result = out ?? NO_STATICS;
  if (activeCache !== null) activeCache.typeSources = result;
  return result;
}

/**
 * A permanent's current subtypes: printed → layer 3 (text substitution) →
 * layer 4 (its own `setSubtypes` / `addSubtypes` modifiers and every
 * subtype-granting static, in timestamp order — see {@link layerFour}).
 */
export function effectiveSubtypes(
  state: GameState,
  registry: CardRegistry,
  object: GameObject,
): readonly string[] {
  return layerFour(state, registry, object).subtypes;
}

/**
 * A permanent's current card types: printed → layer 4 (an `animate` — a
 * man-land becoming a creature — and every type-granting static; see
 * {@link layerFour}). Answers without the rest of the layer fold, which is
 * what lets `matchesFilter` ask a type question without recursing into
 * {@link computeCharacteristics}.
 */
export function effectiveTypes(
  state: GameState,
  registry: CardRegistry,
  object: GameObject,
): readonly CardType[] {
  return layerFour(state, registry, object).types;
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

/**
 * How many colours there are among the battlefield permanents matching
 * `filter` from `you`'s perspective, each colour once — the `colorsAmong`
 * amount and P/T count. `except` leaves one permanent apiece out, as
 * `weightedMatches` does ("other legendary permanents you control").
 */
export function colorsAmongPermanents(
  state: GameState,
  registry: CardRegistry,
  you: PlayerId,
  filter: CardFilter,
  except: readonly ObjectId[] = [],
): number {
  const colors = new Set<Color>();
  const matches = weightedMatches(
    state,
    state.zones.shared.battlefield,
    (id) => matchesFilter(state, registry, id, filter, { you }),
    except,
  );
  for (const { id } of matches) {
    for (const color of effectiveColors(registry, state.objects[id])) colors.add(color);
  }
  return colors.size;
}

/**
 * How many card types there are among the cards in graveyards matching
 * `filter` from `you`'s perspective, each type once (rule 205.2a lists them)
 * — Tarmogoyf, delirium. A card of two types gives both. Tokens aren't
 * cards.
 */
export function cardTypesInGraveyards(
  state: GameState,
  registry: CardRegistry,
  you: PlayerId,
  filter: CardFilter,
): number {
  const types = new Set<CardType>();
  for (const player of state.turnOrder) {
    for (const id of state.zones.perPlayer[player]?.graveyard ?? []) {
      const object = state.objects[id];
      if (object === undefined || object.isToken) continue;
      if (!matchesFilter(state, registry, id, filter, { you })) continue;
      for (const type of effectiveTypes(state, registry, object)) types.add(type);
    }
  }
  return types.size;
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
    if ("playerCounters" in spec) {
      return state.players[controller]?.counters[spec.playerCounters] ?? 0;
    }
    if ("cardTypesInGraveyard" in spec) {
      return cardTypesInGraveyards(state, registry, controller, spec.cardTypesInGraveyard);
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

/** Whether a filter reads keywords anywhere in it — a scope that has to
 * wait for layer 6 (rule 613.8a). */
function filterReadsKeywords(filter: CardFilter): boolean {
  return (
    filter.keyword !== undefined ||
    filter.notKeyword !== undefined ||
    (filter.anyOf?.some(filterReadsKeywords) ?? false)
  );
}

/** Whether an `AffectSpec` narrows its reach by keyword — the statics whose
 * scope has to wait for the target's layer-6 keywords (rule 613.8). */
function scopedByKeyword(affects: AffectSpec): boolean {
  if (affects.scope === "filter") return filterReadsKeywords(affects.filter);
  return (
    (affects.scope === "creatures-you-control" || affects.scope === "all-creatures") &&
    (affects.withKeyword !== undefined ||
      (affects.scope === "all-creatures" && affects.withoutKeyword !== undefined))
  );
}

/**
 * What a scope check may know about its target beyond the object itself,
 * when the caller is partway through computing it.
 */
export interface TargetView {
  /** The target's types / subtypes as folded so far — a type-granting
   * static's scope, matched inside layer 4. Omitted: the current ones
   * (`effectiveTypes`). */
  readonly types?: readonly CardType[];
  readonly subtypes?: readonly string[];
  /**
   * The target's *current* keywords, for a keyword clause — flying from an
   * Aura or an anthem counts, and a creature that lost its abilities has
   * none. Answering it means folding layer 6, and the layer fold itself is
   * one caller; without one, printed keywords (less ability loss).
   */
  readonly keywords?: () => ReadonlySet<Keyword>;
  /** The caller is the layer fold computing this target's characteristics:
   * a `filter` scope's clauses must not ask for them again (see
   * `FilterContext.layered`). */
  readonly inFold?: boolean;
}

/**
 * Whether a static's `affects` reaches `target`. See {@link TargetView} for
 * what a caller partway through the layer fold supplies.
 */
export function staticAffects(
  state: GameState,
  registry: CardRegistry,
  affects: AffectSpec,
  source: GameObject,
  target: GameObject,
  view: TargetView = {},
): boolean {
  const targetKeywords = view.keywords;
  const hasKeyword = (keyword: Keyword): boolean =>
    targetKeywords !== undefined
      ? targetKeywords().has(keyword)
      : !(target.zone === "battlefield" && hasLostAbilities(target)) &&
        registry.get(printedCardName(target)).keywords.includes(keyword);
  // Current types, not printed (rule 613.1d puts type changes before every
  // layer a static works in): an animated land or an artifact that became a
  // creature is reached like a printed creature, and a creature that stopped
  // being one isn't.
  const isCreatureNow = (): boolean =>
    (view.types ?? effectiveTypes(state, registry, target)).includes("creature");
  const subtypesNow = (): readonly string[] =>
    view.subtypes ?? effectiveSubtypes(state, registry, target);
  if (affects.scope === "self") return source.id === target.id;
  if (affects.scope === "attached") return source.attachedTo === target.id;
  if (affects.scope === "filter") {
    if (target.zone !== "battlefield") return false;
    if (affects.excludeSelf === true && source.id === target.id) return false;
    return matchesFilter(state, registry, target.id, affects.filter, {
      you: source.controller,
      ...(view.inFold === true
        ? { layered: { types: view.types, subtypes: view.subtypes, keywords: view.keywords } }
        : {}),
    });
  }
  if (affects.scope === "lands-you-control") {
    return (
      target.controller === source.controller &&
      (view.types ?? effectiveTypes(state, registry, target)).includes("land")
    );
  }
  if (affects.scope === "all-creatures") {
    // Every creature on the battlefield, whoever controls it.
    if (affects.excludeSelf === true && source.id === target.id) return false;
    if (!isCreatureNow()) return false;
    if (affects.subtype !== undefined && !subtypesNow().includes(affects.subtype)) {
      return false;
    }
    if (affects.withKeyword !== undefined && !hasKeyword(affects.withKeyword)) return false;
    if (affects.withoutKeyword !== undefined && hasKeyword(affects.withoutKeyword)) return false;
    return true;
  }
  // "creatures-you-control"
  if (affects.excludeSelf && source.id === target.id) return false;
  if (target.controller !== source.controller) return false;
  if (!isCreatureNow()) return false;
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
    if (!subtypesNow().includes(wanted)) return false;
  }
  return true;
}

/**
 * Whether `source`'s static `ability` applies to `target` right now — its
 * scope, and for a static with a layer-4 part, the permanents that part
 * reached (rule 613.6: an effect that starts applying in one layer keeps the
 * same set of objects in the later ones, so Bello's keywords and granted
 * trigger go to exactly the permanents it made creatures). A static with no
 * layer-4 part is just its scope; its condition is the caller's to check.
 */
export function staticReaches(
  state: GameState,
  registry: CardRegistry,
  source: GameObject,
  ability: StaticAbility,
  target: GameObject,
  view: TargetView = {},
): boolean {
  if (hasLayerFourPart(ability)) {
    if (target.zone !== "battlefield") return false;
    return layerFour(state, registry, target).applied.some(
      (a) => a.ability === ability && a.source.id === source.id,
    );
  }
  return staticAffects(state, registry, ability.affects, source, target, view);
}

interface AppliedEffect {
  readonly timestamp: number;
  readonly power: number;
  readonly toughness: number;
  readonly keywords: readonly Keyword[];
  readonly restrictions: readonly CombatRestriction[];
  readonly combatDamageByToughness: StaticAbility["combatDamageByToughness"];
  readonly canAttackAsThoughNoDefender: boolean;
  readonly protection: {
    colors?: readonly Color[];
    types?: readonly CardType[];
    filter?: CardFilter;
  } | null;
  /** Layer 7b — a `setBasePt`. */
  readonly setBase: { readonly power?: number; readonly toughness?: number } | null;
}

/** Whether a static carries anything {@link collectStaticEffects} folds into
 * a permanent's characteristics — the rest (a replacement, a CDA, a cost
 * change, a permission) modify nothing there. */
function contributesToCharacteristics(ability: StaticAbility): boolean {
  return (
    ability.grantPt !== undefined ||
    ability.grantPtPerCount !== undefined ||
    ability.grantKeywords !== undefined ||
    ability.restrictions !== undefined ||
    ability.combatDamageByToughness !== undefined ||
    ability.canAttackAsThoughNoDefender === true ||
    ability.protection !== undefined ||
    ability.setBasePt !== undefined
  );
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
      if (!contributesToCharacteristics(ability)) continue;
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
    // Cards in exile, which is one shared zone: "cards your opponents own
    // in exile" is `ownedBy`, read from the source's controller's side.
    const exiledMatching = (exiledFilter: CardFilter): number =>
      state.zones.shared.exile.filter(
        (id) =>
          state.objects[id]?.isToken !== true &&
          matchesFilter(state, registry, id, exiledFilter, { you: source.controller }),
      ).length;
    if (ability.grantPtPerCount !== undefined) {
      const per = ability.grantPtPerCount;
      const filter = per.filter;
      const n =
        per.commanderCasts === true
          ? Object.values(state.players[source.controller]?.commanderCastCounts ?? {}).reduce(
              (total, casts) => total + casts,
              0,
            )
          : per.playerCounters !== undefined
            ? (state.players[source.controller]?.counters[per.playerCounters] ?? 0)
            : per.countersOnAffected !== undefined
            ? (target.counters[per.countersOnAffected] ?? 0)
            : per.exiled !== undefined
            ? exiledMatching(per.exiled)
            : per.colorsAmong !== undefined
            ? colorsAmongPermanents(
                state,
                registry,
                source.controller,
                per.colorsAmong,
                per.excludeSelf === true ? [source.id] : [],
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
              ) + (per.excludeSelf === true ? othersInOwnStack(state, registry, source, filter) : 0);
      scaledPower = n * per.pt[0];
      scaledToughness = n * per.pt[1];
    }
    return {
      timestamp: source.timestamp,
      power: (ability.grantPt?.[0] ?? 0) + scaledPower,
      toughness: (ability.grantPt?.[1] ?? 0) + scaledToughness,
      keywords: ability.grantKeywords ?? [],
      restrictions: ability.restrictions ?? [],
      combatDamageByToughness: ability.combatDamageByToughness,
      canAttackAsThoughNoDefender: ability.canAttackAsThoughNoDefender === true,
      protection: ability.protection ?? null,
      setBase: ability.setBasePt ?? null,
    };
  };
  let keywordScoped = false;
  for (const { source, ability } of sources) {
    if (scopedByKeyword(ability.affects)) {
      keywordScoped = true;
      continue;
    }
    if (!staticReaches(state, registry, source, ability, target, { inFold: true })) continue;
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
      !contributesToCharacteristics(ability)
    ) {
      continue;
    }
    if (
      target.controller !== emblem.owner ||
      !effectiveTypes(state, registry, target).includes("creature")
    ) {
      continue;
    }
    if (
      ability.affects.subtype !== undefined &&
      !effectiveSubtypes(state, registry, target).includes(ability.affects.subtype)
    ) {
      continue;
    }
    out.push({
      timestamp: emblem.timestamp,
      power: ability.grantPt?.[0] ?? 0,
      toughness: ability.grantPt?.[1] ?? 0,
      keywords: ability.grantKeywords ?? [],
      restrictions: ability.restrictions ?? [],
      combatDamageByToughness: ability.combatDamageByToughness,
      canAttackAsThoughNoDefender: ability.canAttackAsThoughNoDefender === true,
      protection: ability.protection ?? null,
      setBase: null,
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
      if (
        !staticReaches(state, registry, source, ability, target, {
          inFold: true,
          keywords: targetKeywords,
        })
      ) {
        continue;
      }
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
      damageByToughness: c.damageByToughness,
      canAttackAsThoughNoDefender: c.canAttackAsThoughNoDefender,
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
  // Layers 3 + 4 — text substitution, then every type-changing effect in
  // timestamp order: the object's own modifiers (a man-land's animation adds
  // `creature`) and type-granting statics.
  const layer4 = onBattlefield ? layerFour(state, registry, object) : null;
  const types: readonly CardType[] = layer4?.types ?? def.types;
  const subtypes: readonly string[] = layer4?.subtypes ?? def.subtypes;
  // Layer 5 — colour-changing effects.
  const colors: ReadonlySet<Color> = onBattlefield
    ? effectiveColors(registry, object)
    : new Set(def.colors);

  const staticEffects = onBattlefield
    ? collectStaticEffects(state, registry, object)
    : [];

  // Layer 6 — ability adds (external anthems + modifier grants still reach a
  // permanent that lost its *own* abilities).
  // `collectStaticEffects` already includes a permanent's own `"self"`
  // restriction static (Juggernaut) as well as external ones (Pacifism).
  const restrictions = new Set<CombatRestriction>();
  const protColors = new Set<Color>();
  const protTypes = new Set<CardType>();
  const protFilters: CardFilter[] = [];
  let byToughness: StaticAbility["combatDamageByToughness"];
  let canAttackAsThoughNoDefender = false;
  for (const effect of staticEffects) {
    for (const keyword of effect.keywords) keywords.add(keyword);
    for (const r of effect.restrictions) restrictions.add(r);
    if (effect.combatDamageByToughness !== undefined && byToughness !== "always") {
      byToughness = effect.combatDamageByToughness;
    }
    if (effect.canAttackAsThoughNoDefender) canAttackAsThoughNoDefender = true;
    if (effect.protection) {
      for (const c of effect.protection.colors ?? []) protColors.add(c);
      for (const t of effect.protection.types ?? []) protTypes.add(t);
      if (effect.protection.filter !== undefined) protFilters.push(effect.protection.filter);
    }
  }
  for (const modifier of object.modifiers) {
    for (const keyword of modifier.keywords) keywords.add(keyword);
    for (const r of modifier.restrictions ?? []) restrictions.add(r);
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
      // A CDA may define only one of the two, the other staying as printed
      // (Eluge, the Shoreless Sea's "*/5").
      const only = ability.setBasePtFromCount.only;
      if (only !== "toughness") power = n + ability.setBasePtFromCount.plusPower;
      if (only !== "power") toughness = n + ability.setBasePtFromCount.plusToughness;
    }
  }
  // Layer 7b — a "becomes a N/N" (man-land animation, Turn to Frog) and a
  // static's "has base power and toughness N/N" (Kudo) *set* base P/T, in
  // timestamp order (rule 613.7): latest wins. The first is part of the
  // effect, not the permanent's own CDA, so it still applies when the same
  // effect also removed its abilities. Before counters (7c) and bonuses (7d).
  if (onBattlefield) {
    const sets: { key: number; power?: number; toughness?: number }[] = [];
    for (const effect of staticEffects) {
      if (effect.setBase !== null) sets.push({ key: effect.timestamp, ...effect.setBase });
    }
    for (const modifier of object.modifiers) {
      if (modifier.setPt) {
        sets.push({ key: modifierKey(modifier), power: modifier.setPt[0], toughness: modifier.setPt[1] });
      }
    }
    sets.sort((a, b) => a.key - b.key);
    for (const set of sets) {
      if (set.power !== undefined) power = set.power;
      if (set.toughness !== undefined) toughness = set.toughness;
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

  // "Assigns combat damage equal to its toughness" — resolved here, after
  // the whole P/T fold, since the "with toughness greater than its power"
  // form asks about the final values.
  const damageByToughness =
    byToughness === "always" || (byToughness === "if-toughness-greater" && toughness > power);

  return {
    power,
    toughness,
    keywords,
    types,
    subtypes,
    colors,
    controller: object.controller,
    restrictions,
    damageByToughness,
    canAttackAsThoughNoDefender,
    protectionFrom: { colors: protColors, types: protTypes, filters: protFilters },
  };
}

/**
 * How much combat damage a creature with these characteristics assigns (rule
 * 510.1a): its power, or its toughness under a `combatDamageByToughness`
 * static (Doran, the Siege Tower). **Every** place that sizes combat damage
 * reads this rather than `power` — an unblocked attacker's damage, a
 * blocker's, the split across blockers and the trample excess, the
 * `assign-combat-damage` offer, and the bots' combat arithmetic — while
 * everything else that says "power" keeps reading `power` (the rulings: the
 * static changes no creature's power). May be zero or negative, which, as
 * with power, assigns no damage.
 */
export function combatDamageOf(c: Characteristics): number {
  return c.damageByToughness ? c.toughness : c.power;
}

/** {@link combatDamageOf} for one object, read off the board. */
export function assignedCombatDamage(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
): number {
  return combatDamageOf(computeCharacteristics(state, registry, id));
}

/**
 * Combat restrictions on `id`: from static abilities (Pacifism, Juggernaut)
 * and `restrict` modifiers — the characteristics' own — plus any turn-wide
 * `restrict` rule it matches (`GameState.turnRestrictions`). Every legality
 * check reads restrictions through here.
 *
 * A free function so the combat predicates can be lifted out of `Game`
 * without dragging `this` along — see `combat/eligibility.ts`.
 */
export function restrictionsOf(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
): ReadonlySet<CombatRestriction> {
  const own = computeCharacteristics(state, registry, id).restrictions;
  // A turn-wide rule ("creatures your opponents control can't block this
  // turn") binds whatever matches it now, so it's matched here, outside the
  // fold, rather than baked into the characteristics.
  const rules = state.turnRestrictions;
  if (rules === undefined || rules.length === 0) return own;
  let out: Set<CombatRestriction> | null = null;
  for (const rule of rules) {
    if (!matchesFilter(state, registry, id, rule.filter, { you: rule.you })) continue;
    out ??= new Set(own);
    for (const r of rule.restrictions) out.add(r);
  }
  return out ?? own;
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
