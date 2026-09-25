/**
 * Working out how to pay a mana cost: which permanents to tap, which face of
 * a dual to take, how much life a Phyrexian pip costs. All of it is a **pure**
 * read over a snapshot of the board — every function here returns a *plan*,
 * and nothing applies one. Carrying a plan out stays on `Game`
 * (`useManaSource`/`executePayment`), which remains the only writer of
 * `GameState`.
 *
 * That split is why this is its own module rather than another few hundred
 * lines of `game.ts`: the solver was the largest piece of the engine that
 * never needed to be a method, reaching for only four facts about the board.
 * {@link ManaPlanningView} names those four, so what the planner may know is
 * a declaration instead of whatever `this` happened to expose.
 */

import type { ActivatedAbility } from "./abilities.js";
import type { EffectSpec } from "./effects.js";
import { COLORS, poolCounts, poolTotal } from "./mana.js";
import type { Color, HybridOption, HybridPip, ManaCost, ManaType, ManaUnit } from "./mana.js";
import type { ObjectId } from "./primitives.js";

/** One possible output of a single mana-ability activation: `fixed` is the
 * concrete mana it makes, `anyColor` is how many "one mana of any colour"
 * units it adds on top (Arcane Signet, Command Tower, Treasure). `pain` is the
 * damage the source deals to its controller when this option is used (a
 * painland's coloured option — Karplusan Forest); `lifeCost` is a `Pay N life`
 * on the ability's cost (a trikeland); both 0 for the ordinary case. */
export interface ManaOption {
  readonly fixed: readonly ManaType[];
  readonly anyColor: number;
  readonly pain: number;
  readonly lifeCost: number;
  /**
   * Generic mana this activation *costs* — a Signet's "{1}, {T}: Add {B}{R}",
   * a filter land's "{1}, {T}: Add {G}{G}, {G}{U}, or {U}{U}".
   *
   * These are "converter" sources: net-positive in count but colour-fixing,
   * and unlike everything else here they can't pay for themselves. Only a
   * purely *generic* activation cost is admitted — a coloured one would be
   * genuinely circular (you'd need the colour to make the colour). See
   * `planManaPayment`, which funds a converter from plain sources only and
   * orders it after them.
   */
  readonly genericCost: number;
  /**
   * The provenance stamped on every unit this activation makes — a spend
   * restriction, a spend rider, a "doesn't empty" permission (rule 106.6b /
   * 106.12). Resolved here rather than at spend time because the pieces that
   * aren't printed (the creature type named as the permanent entered, the
   * commander's types) are read off the board, and the board is what this is
   * looking at.
   *
   * The planner reads `tag.restriction` to avoid tapping a source whose mana
   * couldn't pay for the thing being paid for — otherwise it would produce
   * mana and then be refused it.
   */
  readonly tag?: Omit<ManaUnit, "type">;
  /**
   * Narrows the `anyColor` units to these types — "X mana in any combination
   * of {U} and/or {R}" (Vivi Ornitier) is `anyColor: X, anyColorOf: ["U",
   * "R"]`, each unit chosen independently as it's spent. Absent means the
   * five colours, as for Arcane Signet.
   *
   * This is what keeps a *live* amount affordable to plan with: enumerating
   * every split of X mana over two colours is X+1 options, and X is a
   * creature's power, which a token stack or a doubling effect can make
   * enormous. The compressed form is one option whatever X is.
   */
  readonly anyColorOf?: readonly ManaType[];
  /**
   * The ability doesn't have `{T}` in its cost (Vivi Ornitier's "{0}: Add
   * …"), so using it leaves the permanent untapped — and a tapped or
   * summoning-sick permanent can still use it. Only ever admitted together
   * with {@link ManaOption.oncePerTurn}, which is what makes "one activation
   * per payment" true of it.
   */
  readonly untapped?: true;
  /** "Activate only once each turn" (rule 602.5g): the ability's index on its
   * permanent, recorded as used when the payment is carried out. */
  readonly oncePerTurn?: number;
  /** What else the mana ability does — `add-mana`'s `also` — applied when
   * the payment uses it. */
  readonly rider?: EffectSpec;
  /** Who made the extra mana triggered mana abilities add as this source is
   * tapped (rule 605.1b), one id per extra unit — those units are theirs,
   * not this source's (see `ManaOrigin`). */
  readonly extraFrom?: readonly ObjectId[];
}

/** Whether one of `o`'s flexible units can be `m`. */
export function anyUnitMakes(o: ManaOption, m: ManaType): boolean {
  if (o.anyColor === 0) return false;
  return o.anyColorOf === undefined ? m !== "C" : o.anyColorOf.includes(m);
}

/** The type a flexible unit of `o` takes when nothing asks for a particular
 * one — generic, or surplus left floating. An unrestricted "any colour" unit
 * has always been planned as `{C}` here; a narrowed one has to be one of its
 * own types, since the card can't make anything else. */
function defaultUnitOf(o: { readonly anyColorOf?: readonly ManaType[] }): ManaType {
  return o.anyColorOf?.[0] ?? "C";
}

/** One of `player`'s permanents that can produce mana right now. `options` is
 * the set of alternative single-activation outputs — one tap picks one of them
 * (rule 605.1a): a basic land has one option, a dual land offers "{R}" or
 * "{G}", a Chromatic-Lantern'd basic offers its own colour or "any colour".
 * `sacrificeSelf` = using it sacrifices the source (Treasure) rather than
 * tapping it. */
export interface ManaSource {
  readonly id: ObjectId;
  readonly isLand: boolean;
  readonly options: readonly ManaOption[];
  readonly sacrificeSelf: boolean;
}

/** One entry of a mana-payment plan: activate `source`, adding the concrete
 * `mana` list to the pool; `sacrifice` if it's a Treasure-style ability;
 * `pain` damage / `lifeCost` life paid by the controller (a painland's or
 * trikeland's coloured tap). */
export interface ManaPlanStep {
  readonly source: ObjectId;
  readonly mana: readonly ManaType[];
  readonly sacrifice: boolean;
  readonly pain: number;
  readonly lifeCost: number;
  /**
   * The exact mana this step spends from the pool before adding its own — a
   * Signet's `{1}`, resolved at planning time to the specific unit the plan
   * took from another source. Empty for every ordinary source.
   *
   * Spelled out rather than left as "one generic" because a colour-blind
   * deduction can consume a colour the spell still needs: two Islands, two
   * Swamps and an Azorius Signet paying `{3}{W}{U}` underflow if the Signet's
   * `{1}` eats an Island's `{U}`.
   */
  readonly spends: readonly ManaType[];
  /** The provenance to stamp on the mana this step makes — see
   * {@link ManaOption.tag}. */
  readonly tag?: Omit<ManaUnit, "type">;
  /** See {@link ManaOption.untapped}. */
  readonly untapped?: true;
  /** See {@link ManaOption.oncePerTurn}. */
  readonly oncePerTurn?: number;
  /** See {@link ManaOption.rider}. */
  readonly rider?: EffectSpec;
  /** See {@link ManaOption.extraFrom}: the last `extraFrom.length` units of
   * `mana` are theirs. */
  readonly extraFrom?: readonly ObjectId[];
}

/** A fully-worked-out way to pay a cost: which sources to tap ({@link
 * ManaPlanStep}), how much life to pay for Phyrexian pips, and the cost with
 * every hybrid pip resolved to a concrete colour / generic amount — which is
 * what {@link Game.spendFromPool} actually deducts. */
export interface ManaPayment {
  readonly steps: readonly ManaPlanStep[];
  readonly life: number;
  readonly resolved: ManaCost;
  /** What this payment is for, so restricted mana knows whether it may pay
   * (rule 106.6b) and a spend rider knows what it was spent on. Carried on
   * the payment rather than passed to {@link Game.executePayment} separately,
   * so no caller has to remember to thread it twice. */
  readonly purpose: ManaPurpose;
}

/**
 * What a mana payment is being made for — the thing a restriction like
 * "spend this mana only to cast a creature spell" is tested against.
 *
 * `null` means "no particular spell or ability" (a ward tax probe, a cost
 * check with nothing concrete behind it). Restricted mana never pays for
 * that: there is no printed restriction that a nameless payment satisfies,
 * and treating unknown as permitted is the failure mode where the
 * restriction quietly does nothing.
 */
export type ManaPurpose =
  /** A spell being cast. `card` is still in its pre-cast zone at payment
   * time, so a filter over it reads printed characteristics — which is
   * exactly what "a creature spell" means. */
  | { readonly kind: "cast"; readonly card: ObjectId }
  /** An activated ability of `source` being paid for. */
  | { readonly kind: "ability"; readonly source: ObjectId }
  | null;

/**
 * Everything the planner may look at: floating mana, life, what can make mana
 * right now, and whether a given unit is allowed to pay for the thing being
 * paid for (rule 106.6b). Built by `Game.manaPlanningView`.
 *
 * A snapshot rather than a live handle — planning never mutates, so nothing
 * here can go stale mid-plan, and `sources` is resolved once per payment
 * instead of once per hybrid-pip trial the way it was as a method call.
 */
export interface ManaPlanningView {
  /** Unfiltered floating mana; {@link ManaPlanningView.canPay} decides which
   * of it this payment may actually touch. */
  readonly pool: readonly ManaUnit[];
  /** The payer's current life, which caps what a painland option or a
   * Phyrexian pip is allowed to cost them — less any life the same cost
   * already spends outside the mana (Liesa's commander tax), so it can be 0. */
  readonly life: number;
  /** Every permanent that could produce mana right now. */
  readonly sources: readonly ManaSource[];
  /** Rule 106.6b: may this unit pay for what this payment is for? Closes over
   * the purpose, so the planner never has to carry it. */
  canPay(unit: ManaUnit): boolean;
}

/**
 * The distinct outputs of activating `ability` on its own, when it's a mana
 * ability whose colour isn't fixed — `null` for every other ability, which is
 * the overwhelmingly common case.
 *
 * "Any combination of" (a short `oneOf` list) is enumerated exhaustively. "One
 * mana of any color" is enumerated as one option *per colour*, all `amount`
 * units the same: that's exactly right for the "N mana of any one color"
 * cards, and it keeps a five-colour source from producing 126 menu entries for
 * a rider nothing prints.
 */
export function standaloneManaChoices(
  ability: ActivatedAbility,
  /** The concrete colours a `oneOf`/`producedBy` names right now — resolved
   * by the caller, which has the board; see `Game.manaOneOf`. */
  oneOf: (mana: { oneOf?: readonly ManaType[]; producedBy?: string }) => readonly ManaType[],
  /** How much a *live* amount (Vivi Ornitier's power) comes to right now —
   * `null` when the caller can't size it, which offers the ability once
   * with the engine's default colour, as before live amounts existed. */
  liveAmount?: () => number | null,
): ManaType[][] | null {
  const effect = ability.effect;
  if (effect === null || effect.kind !== "add-mana") return null;
  const mana = effect.mana;
  if (mana !== "any-color" && typeof mana !== "object") return null;
  // "Add {W}{U}" has one outcome, so it's offered once.
  if (typeof mana === "object" && "all" in mana) return null;
  if (typeof effect.amount !== "number") {
    const amount = liveAmount?.() ?? null;
    if (amount === null || amount < 1) return null;
    const colors = mana === "any-color" ? COLORS : oneOf(mana);
    if (colors.length === 0) return null;
    // A live amount can be large, and every split of it is a separate menu
    // entry of `amount` units. Which split to float is the player's choice
    // (a 20-power Vivi floating ten of each), so every one is offered while
    // the whole list stays within a budget of units — for two colours, X up
    // to 22. Past that, offer just "all of one type" per type; the splits a
    // *payment* needs, the planner makes itself without this list.
    if (splitCount(colors.length, amount) * amount <= MAX_STANDALONE_UNITS) {
      return manaCombinations(colors, amount);
    }
    return colors.map((c) => Array<ManaType>(amount).fill(c));
  }
  if (effect.amount < 1) return null;
  if (mana === "any-color") {
    return COLORS.map((c) => Array<ManaType>(effect.amount as number).fill(c));
  }
  return manaCombinations(oneOf(mana), effect.amount);
}

/** The most mana units, summed over every "any combination of" split of a
 * live amount, offered as separate standalone activations — see
 * {@link standaloneManaChoices}. */
export const MAX_STANDALONE_UNITS = 512;

/** How many multisets of size `amount` there are over `kinds` types —
 * C(amount + kinds - 1, kinds - 1), stopping early once it's past any cap
 * anyone asks about, so a huge amount costs nothing to size. */
function splitCount(kinds: number, amount: number): number {
  let n = 1;
  for (let i = 1; i < kinds; i += 1) {
    n = (n * (amount + i)) / i;
    if (n > 1_000_000) return Infinity;
  }
  return Math.round(n);
}

/** Every multiset of size `amount` drawn from `colors` (order-independent,
 * "combinations with repetition") — Orcish Lumberjack's "three mana in any
 * combination of {R} and/or {G}" over `["R", "G"]`/`3` yields `[R,R,R]`,
 * `[R,R,G]`, `[R,G,G]`, `[G,G,G]`. Small by construction (a handful of
 * colours, a handful of mana), so no need to worry about blowup. needed-cards
 * P20 — `add-mana`'s `{ oneOf }` mana form. */
export function manaCombinations(colors: readonly ManaType[], amount: number): ManaType[][] {
  if (amount === 0) return [[]];
  const [first, ...rest] = colors;
  if (first === undefined) return [];
  if (rest.length === 0) return [Array<ManaType>(amount).fill(first)];
  const out: ManaType[][] = [];
  for (let useFirst = amount; useFirst >= 0; useFirst -= 1) {
    for (const tail of manaCombinations(rest, amount - useFirst)) {
      out.push([...Array<ManaType>(useFirst).fill(first), ...tail]);
    }
  }
  return out;
}
/**
 * {@link resolveHybridCost} for a cost carrying a `twobridReduction` — a
 * generic reduction that outran the generic part and is left for the `{2}`
 * halves of twobrid pips paid generically (the Spectral Procession ruling).
 *
 * Every pip is first offered its colour, as usual, and the pips that can't
 * be paid that way go generic with the reduction taken off. Colour first is
 * what keeps the answer "can this be paid at all" right: the reduction only
 * ever helps a generic half, so it's best kept for the pips that have to be
 * paid generically. Then any reduction still spare pays a colour-paid pip's
 * generic half outright, handing its land back. A separate path, rather than
 * a branch in the ordinary loop, so costs with no such reduction are
 * resolved exactly as they always were.
 */
function resolveReducedTwobrid(
  view: ManaPlanningView,
  cost: ManaCost,
  start: ManaCost,
  reduction: number,
  avoid?: ObjectId,
  exclude?: ObjectId,
): { concrete: ManaCost; life: number } | null {
  let concrete = start;
  let spare = reduction;
  let life = 0;
  const genericHalf = (pip: HybridPip): number | undefined =>
    pip.find((o): o is Extract<HybridOption, { kind: "generic" }> => o.kind === "generic")?.amount;
  const inColour: { pip: HybridPip; color: Color }[] = [];
  const rest: HybridPip[] = [];
  for (const pip of cost.hybrid) {
    let paid = false;
    for (const option of pip) {
      if (option.kind !== "color") continue;
      const colored = { ...concrete.colored };
      colored[option.color] += 1;
      const trial: ManaCost = { ...concrete, colored };
      if (planManaPayment(view, trial, avoid, exclude) !== null) {
        concrete = trial;
        inColour.push({ pip, color: option.color });
        paid = true;
        break;
      }
    }
    if (!paid) rest.push(pip);
  }
  for (const pip of rest) {
    const half = genericHalf(pip);
    if (half !== undefined) {
      const off = Math.min(half, spare);
      const trial: ManaCost = { ...concrete, generic: concrete.generic + half - off };
      if (planManaPayment(view, trial, avoid, exclude) !== null) {
        concrete = trial;
        spare -= off;
        continue;
      }
    }
    if (pip.some((o) => o.kind === "phyrexian") && view.life - life - 2 >= 1) {
      life += 2;
      continue;
    }
    return null;
  }
  for (const { pip, color } of inColour) {
    const half = genericHalf(pip);
    if (half === undefined || half > spare) continue;
    const colored = { ...concrete.colored };
    colored[color] -= 1;
    concrete = { ...concrete, colored };
    spare -= half;
  }
  return { concrete, life };
}

/**
 * Resolve every hybrid / twobrid / Phyrexian pip in `cost` to a concrete
 * payment, returning the pip-free cost plus the life owed for Phyrexian pips
 * (or `null` if a pip can't be paid at all). Greedy and auto-pilot: for each
 * pip, prefer a coloured half the player can still afford, then the twobrid
 * `{2}`, then paying 2 life — and never take yourself below 1 life. Each
 * tentative choice is re-checked against the running total with
 * {@link planManaPayment}; since that planner is itself greedy, a cost that
 * needs genuine cross-pip coordination (`{W/U}{W/U}` off one W source and one
 * U source) can still misresolve, but ordinary hybrid costs are fine.
 */
export function resolveHybridCost(
  view: ManaPlanningView,
  cost: ManaCost,
  avoid?: ObjectId,
  exclude?: ObjectId,
): { concrete: ManaCost; life: number } | null {
  if (cost.hybrid.length === 0) return { concrete: cost, life: 0 };

  let concrete: ManaCost = {
    generic: cost.generic,
    colored: { ...cost.colored },
    colorless: cost.colorless,
    x: 0,
    hybrid: [],
  };
  let life = 0;
  const startingLife = view.life;

  const spare = cost.twobridReduction ?? 0;
  if (spare > 0) return resolveReducedTwobrid(view, cost, concrete, spare, avoid, exclude);

  for (const pip of cost.hybrid) {
    let chosen: ManaCost | null = null;
    for (const option of pip) {
      if (option.kind !== "color") continue;
      const nextColored = { ...concrete.colored };
      nextColored[option.color] += 1;
      const trial: ManaCost = { ...concrete, colored: nextColored };
      if (planManaPayment(view, trial, avoid, exclude) !== null) {
        chosen = trial;
        break;
      }
    }
    if (chosen === null) {
      for (const option of pip) {
        if (option.kind !== "generic") continue;
        const trial: ManaCost = { ...concrete, generic: concrete.generic + option.amount };
        if (planManaPayment(view, trial, avoid, exclude) !== null) {
          chosen = trial;
          break;
        }
      }
    }
    if (chosen !== null) {
      concrete = chosen;
      continue;
    }
    if (pip.some((o) => o.kind === "phyrexian") && startingLife - life - 2 >= 1) {
      life += 2;
      continue;
    }
    return null;
  }
  return { concrete, life };
}
/**
 * How the player behind `view` would pay `cost` from their mana sources, or
 * `null` if they can't.
 * `cost.hybrid` is ignored here — {@link resolveHybridCost} lowers hybrid
 * pips to concrete colour / generic needs before this runs.
 * Existing floating mana is spent first; then colored pips, then `{C}` pips,
 * then generic are covered in turn, tapping a fresh source only when the
 * already-tapped ones can't. A source that makes more than one mana (Sol
 * Ring) or "any colour" (Signet, Treasure) has its surplus applied to later
 * needs before another source is touched.
 */
export function planManaPayment(
  view: ManaPlanningView,
  cost: ManaCost,
  avoid?: ObjectId,
  exclude?: ObjectId,
): ManaPlanStep[] | null {
  // Floating mana this payment is actually allowed to use. Restricted
  // units `view.canPay` turns down are invisible here, so the planner
  // taps as though they weren't there rather than planning around mana it
  // will then be refused — and `spendFromPool` applies the same filter, so
  // the plan and the spend can't disagree.
  const pool = poolCounts(view.pool.filter((unit) => view.canPay(unit)));

  const need: Record<ManaType, number> = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
  for (const color of COLORS) {
    need[color] = Math.max(0, cost.colored[color] - pool[color]);
  }
  need.C = Math.max(0, cost.colorless - pool.C);
  const poolUsedForSpecific =
    COLORS.reduce((sum, c) => sum + Math.min(cost.colored[c], pool[c]), 0) +
    Math.min(cost.colorless, pool.C);
  let genericNeed = Math.max(0, cost.generic - (poolTotal(pool) - poolUsedForSpecific));

  // `avoid` (the permanent whose ability is being activated) goes last, so a
  // man-land paying its own `{1}: becomes a creature` cost taps something
  // else and stays free to attack — but still taps itself if nothing else
  // can cover the cost.
  // The auto-payer won't spend life it can't safely afford (a painland /
  // trikeland option whose toll would drop it to 0 or below) — a human's
  // casts are auto-paid too, and "kill yourself to cast a spell" is never
  // the intent. Consistent with `resolveHybridCost`'s Phyrexian "never
  // below 1 life" rule. A toll-free option always stays: `view.life` can be
  // 0 when the rest of the cost spends every point of life (Liesa's
  // commander tax paid down to exactly 0), and a Plains costs none of it.
  const currentLife = view.life;
  const affordableOptions = (s: ManaSource): ManaSource => ({
    ...s,
    options: s.options.filter((o) => {
      const toll = o.pain + o.lifeCost;
      return toll === 0 || toll < currentLife;
    }),
  });
  // Drop options whose mana couldn't pay for what's being paid for (rule
  // 106.6b). Done at the *option* level rather than the source level
  // because a card can offer both — Plaza of Heroes taps for {C} freely and
  // for a colour only toward a legendary spell — and dropping the whole
  // permanent would lose the unrestricted half.
  const usableOptions = (s: ManaSource): ManaSource => ({
    ...s,
    options: s.options.filter(
      (o) =>
        o.tag?.restriction === undefined ||
        view.canPay({ type: "C", ...o.tag }),
    ),
  });
  const all = view.sources
    .map(affordableOptions)
    .map(usableOptions)
    .filter((s) => s.options.length > 0 && s.id !== exclude);
  // A converter (a Signet) is only reached once the plain sources are
  // exhausted: it costs mana someone else has to make, and on a board with
  // none of them nothing below behaves any differently than it did before
  // converters existed.
  const isConverter = (s: ManaSource): boolean =>
    s.options.every((o) => o.genericCost > 0);
  const ordered =
    avoid === undefined
      ? all
      : [...all.filter((s) => s.id !== avoid), ...all.filter((s) => s.id === avoid)];
  const sources = [...ordered.filter((s) => !isConverter(s)), ...ordered.filter(isConverter)];

  interface Tapped {
    readonly src: ManaSource;
    readonly produced: ManaType[];
    readonly freeFixed: ManaType[];
    freeAny: number;
    readonly pain: number;
    readonly lifeCost: number;
    readonly genericCost: number;
    /** For a converter, the exact mana taken from other sources to pay its
     * own cost — spent back verbatim by `useManaSource`. */
    readonly spends: ManaType[];
    readonly tag?: Omit<ManaUnit, "type">;
    readonly anyColorOf?: readonly ManaType[];
    readonly untapped?: true;
    readonly oncePerTurn?: number;
    readonly rider?: EffectSpec;
    readonly extraFrom?: readonly ObjectId[];
  }
  // Colours this cost still wants, for `coverGenericFrom`'s preference.
  const wantedColors = new Set<ManaType>(
    (["W", "U", "B", "R", "G", "C"] as const).filter((m) => need[m] > 0),
  );
  const tapped: Tapped[] = [];
  const isTapped = (id: ObjectId): boolean => tapped.some((t) => t.src.id === id);
  // Which of a source's alternative outputs to commit to as it's tapped:
  // for a specific need, an option that makes that colour directly, else an
  // "any colour" one; for a generic need (or no match), the richest option,
  // spending the fewest "any colour" units so they stay available for a
  // later coloured need. A free option always beats an equally-useful one
  // that costs life (a painland taps for `{C}` for free before it hurts).
  const lifeToll = (o: ManaOption): number => o.pain + o.lifeCost;
  const chooseOption = (src: ManaSource, want: ManaType | null): ManaOption => {
    const free = (pred: (o: ManaOption) => boolean): ManaOption | undefined =>
      src.options.find((o) => lifeToll(o) === 0 && pred(o)) ??
      src.options.find((o) => pred(o));
    if (want !== null) {
      const exact = free((o) => o.fixed.includes(want));
      if (exact !== undefined) return exact;
      const any = free((o) => anyUnitMakes(o, want));
      if (any !== undefined) return any;
    }
    return [...src.options].sort(
      (a, b) =>
        lifeToll(a) - lifeToll(b) ||
        b.fixed.length + b.anyColor - (a.fixed.length + a.anyColor) ||
        a.anyColor - b.anyColor,
    )[0];
  };
  const open = (src: ManaSource, want: ManaType | null): Tapped => {
    const opt = chooseOption(src, want);
    const t: Tapped = {
      src,
      produced: [],
      freeFixed: [...opt.fixed],
      freeAny: opt.anyColor,
      pain: opt.pain,
      lifeCost: opt.lifeCost,
      genericCost: opt.genericCost,
      spends: [],
      ...(opt.tag !== undefined ? { tag: opt.tag } : {}),
      ...(opt.anyColorOf !== undefined ? { anyColorOf: opt.anyColorOf } : {}),
      ...(opt.untapped !== undefined ? { untapped: opt.untapped } : {}),
      ...(opt.oncePerTurn !== undefined ? { oncePerTurn: opt.oncePerTurn } : {}),
      ...(opt.rider !== undefined ? { rider: opt.rider } : {}),
      ...(opt.extraFrom !== undefined ? { extraFrom: opt.extraFrom } : {}),
    };
    tapped.push(t);
    return t;
  };

  /**
   * Open `src` only if its activation cost can be met — for an ordinary
   * source that's free, for a converter it means covering `genericCost`
   * generic from *other* sources first (never from itself, and never from
   * another converter, which is what keeps this from recursing).
   *
   * On failure the tentative entry is rolled back, so a converter the board
   * can't fund leaves no trace and the caller simply moves on.
   */
  const openFunded = (src: ManaSource, want: ManaType | null): Tapped | null => {
    const mark = tapped.length;
    const t = open(src, want);
    for (let i = 0; i < t.genericCost; i += 1) {
      const m = coverGenericFrom(src.id);
      if (m === null) {
        tapped.length = mark;
        return null;
      }
      t.spends.push(m);
    }
    return t;
  };
  const takeSpecific = (t: Tapped, m: ManaType): boolean => {
    const i = t.freeFixed.indexOf(m);
    if (i >= 0) {
      t.freeFixed.splice(i, 1);
      t.produced.push(m);
      return true;
    }
    const makes = t.anyColorOf === undefined ? m !== "C" : t.anyColorOf.includes(m);
    if (makes && t.freeAny > 0) {
      t.freeAny -= 1;
      t.produced.push(m);
      return true;
    }
    return false;
  };
  /** Take one generic from `t`, returning *which* mana type it turned out
   * to be — a converter has to spend exactly that back, not "one generic",
   * or it can eat a colour the cost still needs. */
  const takeGeneric = (t: Tapped): ManaType | null => {
    if (t.freeFixed.length > 0) {
      const m = t.freeFixed.shift() as ManaType;
      t.produced.push(m);
      return m;
    }
    if (t.freeAny > 0) {
      t.freeAny -= 1;
      const m = defaultUnitOf(t);
      t.produced.push(m);
      return m;
    }
    return null;
  };
  const coverSpecific = (m: ManaType): boolean => {
    for (const t of tapped) if (takeSpecific(t, m)) return true;
    const canMake = (s: ManaSource): boolean =>
      s.options.some((o) => o.fixed.includes(m) || anyUnitMakes(o, m));
    for (const next of sources) {
      if (isTapped(next.id) || !canMake(next)) continue;
      const t = openFunded(next, m);
      if (t !== null && takeSpecific(t, m)) return true;
    }
    return false;
  };
  /**
   * Cover one generic, never drawing on `exclude` or on another converter —
   * this is what funds a converter's own cost.
   *
   * Spends a source that can't make any colour this cost still wants before
   * one that can: the whole point of tapping a Signet is that the board is
   * short on a colour, and funding it with the one land that made that
   * colour defeats the exercise (two Islands and a Signet paying
   * `{W}{U}{U}` — fund from a Swamp, not from an Island).
   */
  const coverGenericFrom = (exclude: ObjectId): ManaType | null => {
    const eligible = (t: Tapped): boolean => t.src.id !== exclude && t.spends.length === 0;
    const dull = (src: ManaSource): boolean =>
      src.options.every(
        (o) => o.anyColor === 0 && !o.fixed.some((m) => wantedColors.has(m)),
      );
    for (const t of tapped) {
      if (!eligible(t) || !dull(t.src)) continue;
      const m = takeGeneric(t);
      if (m !== null) return m;
    }
    for (const t of tapped) {
      if (!eligible(t)) continue;
      const m = takeGeneric(t);
      if (m !== null) return m;
    }
    const free = sources.filter(
      (s) => !isTapped(s.id) && s.id !== exclude && !isConverter(s),
    );
    const next = free.find(dull) ?? free[0];
    return next === undefined ? null : takeGeneric(open(next, null));
  };
  const coverGeneric = (): boolean => {
    for (const t of tapped) if (takeGeneric(t) !== null) return true;
    for (const next of sources) {
      if (isTapped(next.id)) continue;
      const t = openFunded(next, null);
      if (t !== null && takeGeneric(t) !== null) return true;
    }
    return false;
  };

  for (const color of COLORS) {
    for (let i = 0; i < need[color]; i += 1) if (!coverSpecific(color)) return null;
  }
  for (let i = 0; i < need.C; i += 1) if (!coverSpecific("C")) return null;
  for (let i = 0; i < genericNeed; i += 1) if (!coverGeneric()) return null;

  // Converters last: each spends from the pool, and everything funding it
  // is an ordinary source, so putting them after the rest is enough to
  // guarantee the mana is there when `useManaSource` runs.
  const steps = [...tapped].sort((a, b) => a.spends.length - b.spends.length);
  return steps.map((t) => ({
    source: t.src.id,
    sacrifice: t.src.sacrificeSelf,
    pain: t.pain,
    lifeCost: t.lifeCost,
    spends: [...t.spends],
    mana: [
      ...t.produced,
      ...t.freeFixed,
      ...Array.from<ManaType>({ length: t.freeAny }).fill(defaultUnitOf(t)),
    ],
    ...(t.tag !== undefined ? { tag: t.tag } : {}),
    ...(t.untapped !== undefined ? { untapped: t.untapped } : {}),
    ...(t.oncePerTurn !== undefined ? { oncePerTurn: t.oncePerTurn } : {}),
    ...(t.rider !== undefined ? { rider: t.rider } : {}),
    ...(t.extraFrom !== undefined ? { extraFrom: t.extraFrom } : {}),
  }));
}

/**
 * The full worked-out payment for `cost` — hybrid pips resolved, sources
 * chosen, life counted — or `null` if it can't be paid. Every caster,
 * activator and ward check reaches this through `Game.payMana`; feed the
 * result to `Game.executePayment`.
 *
 * `avoid` is a preference: that source is tried last, so a permanent isn't
 * casually tapped for its own ability's mana cost when something else could
 * pay. `exclude` is a fact: that source cannot be used at all, because it is
 * already being tapped to pay a `{T}` cost and rule 602.2a doesn't let one
 * permanent pay two tap costs at once.
 */
export function planPayment(
  view: ManaPlanningView,
  cost: ManaCost,
  purpose: ManaPurpose,
  avoid?: ObjectId,
  exclude?: ObjectId,
): ManaPayment | null {
  const resolved = resolveHybridCost(view, cost, avoid, exclude);
  if (resolved === null) return null;
  const steps = planManaPayment(view, resolved.concrete, avoid, exclude);
  if (steps === null) return null;
  return { steps, life: resolved.life, resolved: resolved.concrete, purpose };
}

