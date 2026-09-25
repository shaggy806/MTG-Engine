/**
 * Suggests already-implemented cards to stand in for one the engine doesn't
 * have yet, for the client's decklist-import flow (paste a decklist, get a
 * deck you can actually play today). Pure and synchronous: every
 * `BUILTIN_CARDS` entry is scored against what's known about the
 * *unimplemented* card — its Scryfall type line, mana cost, body and keywords
 * — and, when an {@link OracleTagIndex} is supplied, the Scryfall Tagger
 * oracle tags both cards carry, which is what lets a stand-in fill the
 * original's *role* rather than just its shape. The design record, including
 * how the tags were chosen and how well this does on the five precon decks,
 * is `docs/plans/card-replacer.md`.
 *
 * Deliberately a similarity judgement, not a rules computation. When the
 * caller says which deck the stand-in is for (`identity`, `exclude`), the
 * suggestions stay inside that commander's colour identity and never repeat
 * a card the deck already has; without that context colour is only a nudge,
 * and a suggestion can still surface later as an ordinary violation in
 * `validateCommanderDeck`.
 *
 * The engine does no I/O, so the tag data isn't loaded here: the server
 * builds an index from its generated file and passes it in
 * (`server/src/oracle-tags.ts`).
 */

import { BUILTIN_CARDS, isDeckableCard } from "./cards.js";
import type { CardDefinition, CardType } from "./cards/define.js";
import { colorIdentityOf, withinIdentity } from "./identity.js";
import type { FaceLookup } from "./identity.js";
import { COLORS, manaValue, parseManaCost } from "./mana.js";
import type { Color, ManaCost } from "./mana.js";

const TYPE_WORDS: ReadonlySet<string> = new Set<CardType>([
  "land",
  "creature",
  "artifact",
  "enchantment",
  "instant",
  "sorcery",
  "planeswalker",
  "battle",
]);
const SUPERTYPE_WORDS: ReadonlySet<string> = new Set(["basic", "legendary", "snow", "world"]);

export interface ParsedTypeLine {
  readonly supertypes: readonly string[];
  readonly types: readonly string[];
  readonly subtypes: readonly string[];
}

/** Parses a plain type line ("Legendary Creature — Elf Warrior") into the
 * same three buckets a `CardDefinition` carries — the mirror image of
 * `server/src/import-deck.ts`'s `localTypeLine`, which goes the other way
 * (`CardDefinition` → string) for a card the engine already has. */
export function parseTypeLine(line: string): ParsedTypeLine {
  const [left, right] = line.split("—").map((s) => s.trim());
  const supertypes: string[] = [];
  const types: string[] = [];
  for (const word of (left ?? "").split(/\s+/).filter(Boolean)) {
    const lower = word.toLowerCase();
    if (SUPERTYPE_WORDS.has(lower)) supertypes.push(lower);
    else if (TYPE_WORDS.has(lower)) types.push(lower);
  }
  const subtypes = right ? right.split(/\s+/).filter(Boolean) : [];
  return { supertypes, types, subtypes };
}

/** Every colour with at least one pip in `cost`, including colour options
 * inside a hybrid/twobrid/Phyrexian pip — a permissive reading, used only as
 * a similarity nudge when no deck identity is known. */
function colorsOf(cost: ManaCost): ReadonlySet<Color> {
  const colors = new Set<Color>();
  for (const c of COLORS) if (cost.colored[c] > 0) colors.add(c);
  for (const pip of cost.hybrid) {
    for (const option of pip) {
      if (option.kind === "color") colors.add(option.color);
    }
  }
  return colors;
}

// --- oracle tags -------------------------------------------------------------

/**
 * Which Scryfall Tagger oracle tags cards carry — a curated subset describing
 * what cards *do* (see `server/data/oracle-tags/allowlist.txt`) — and how
 * common each is across all Commander-legal cards. A rare shared tag says far
 * more about two cards than a common one.
 */
export interface OracleTagIndex {
  /** The tags `name` carries (front-face name, as decklists write it), or
   * `undefined` when the index has never heard of the card. A known card
   * with no allowlisted tags gives `[]`. */
  tagsOf(name: string): readonly string[] | undefined;
  /** How many cards carry `tag`. */
  frequency(tag: string): number;
  /** How many cards the frequencies are counted over. */
  readonly cardCount: number;
}

/** The shape `server/scripts/gen-oracle-tags.mjs` writes. */
export interface OracleTagIndexData {
  readonly legalCardCount: number;
  readonly tags: readonly string[];
  /** Card name → indices into `tags`. A card carrying none is absent. */
  readonly cards: Readonly<Record<string, readonly number[]>>;
}

/** Builds an {@link OracleTagIndex} over the generator's output. A card
 * missing from `data.cards` carries no allowlisted tag, which is different
 * from a card the index doesn't know — but the generated data can't tell the
 * two apart, so both read as `[]`. */
export function createOracleTagIndex(data: OracleTagIndexData): OracleTagIndex {
  const frequencies = new Map<string, number>();
  for (const indices of Object.values(data.cards)) {
    for (const i of indices) {
      const tag = data.tags[i];
      frequencies.set(tag, (frequencies.get(tag) ?? 0) + 1);
    }
  }
  return {
    tagsOf: (name) => (data.cards[name] ?? []).map((i) => data.tags[i]),
    frequency: (tag) => frequencies.get(tag) ?? 0,
    cardCount: data.legalCardCount,
  };
}

/** Inverse document frequency: rare tags weigh more. Floored so even the
 * most common tag still counts for something. */
function tagWeight(index: OracleTagIndex, tag: string): number {
  return Math.max(0.2, Math.log(index.cardCount / (index.frequency(tag) + 1)));
}

/** Weighted cosine similarity of two tag sets, in [0, 1], plus the tags they
 * share, rarest first. */
function tagSimilarity(
  index: OracleTagIndex,
  a: readonly string[],
  b: readonly string[],
): { readonly similarity: number; readonly shared: readonly string[] } {
  if (a.length === 0 || b.length === 0) return { similarity: 0, shared: [] };
  const inB = new Set(b);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const shared: string[] = [];
  for (const tag of a) {
    const w = tagWeight(index, tag) ** 2;
    normA += w;
    if (inB.has(tag)) {
      dot += w;
      shared.push(tag);
    }
  }
  for (const tag of b) normB += tagWeight(index, tag) ** 2;
  shared.sort((x, y) => index.frequency(x) - index.frequency(y) || (x < y ? -1 : 1));
  return { similarity: dot / Math.sqrt(normA * normB), shared };
}

// --- scoring -------------------------------------------------------------------

export interface ReplacementTarget {
  /** The card's name — used only to look its tags up. */
  readonly name?: string;
  /** Scryfall's `mana_cost` — the same `"{2}{G}{G}"` notation `parseManaCost`
   * reads for implemented cards. */
  readonly manaCost: string | null;
  /** Scryfall's `type_line`. */
  readonly typeLine: string;
  /** Scryfall's `power`/`toughness` strings, for a creature ("*" is ignored). */
  readonly power?: string | null;
  readonly toughness?: string | null;
  /** Scryfall's `keywords` ("Flying", "First strike", …). */
  readonly keywords?: readonly string[];
}

export interface ReplacementContext {
  /** The destination deck's commander colour identity. When given, only
   * cards inside it are suggested. */
  readonly identity?: ReadonlySet<Color> | readonly Color[];
  /** Cards the destination deck already has (or has been given as other
   * stand-ins) — never suggested, so a suggestion can't break singleton. */
  readonly exclude?: Iterable<string>;
  /** The card is the deck's commander: only a card that can be one is
   * suggested. */
  readonly forCommander?: boolean;
  /** Oracle tags, for matching on role. Without them only type, cost, body
   * and colour are compared, and every suggestion is `"low"` confidence. */
  readonly tags?: OracleTagIndex;
  /** How many suggestions to return. Defaults to 3. */
  readonly limit?: number;
}

/**
 * How much the suggestion can be trusted to do the original's job:
 * `"high"` shares much of what the original does, `"medium"` some of it,
 * `"low"` little or nothing — a card of the same shape and cost at best.
 */
export type ReplacementConfidence = "high" | "medium" | "low";

export interface ReplacementSuggestion {
  readonly name: string;
  readonly confidence: ReplacementConfidence;
  /** Oracle tags the two cards share, rarest (most telling) first. */
  readonly sharedTags: readonly string[];
  /** The combined score in [0, 1], for ordering. */
  readonly score: number;
}

/** Tag similarity at which a suggestion is a confident role match. */
const HIGH_CONFIDENCE = 0.45;
const MEDIUM_CONFIDENCE = 0.2;
/** Tag similarity that lets a card of a *different* primary type through the
 * type gate (a card-drawing artifact for a card-drawing creature) — lower
 * than this, a different card type is a worse suggestion than none. Set from
 * the precon evaluation: at 0.35 a sorcery sweeper was being replaced by a
 * reanimating creature and a flier by a land-fetching trinket. */
const CROSS_TYPE_SIMILARITY = 0.5;
/** And even then a different card type ranks below a same-type card doing
 * much the same job. */
const CROSS_TYPE_FACTOR = 0.8;

/** Keywords worth matching on a creature's body: the ones that decide what it
 * does in combat. */
const COMBAT_KEYWORDS: ReadonlySet<string> = new Set([
  "flying",
  "reach",
  "trample",
  "menace",
  "haste",
  "vigilance",
  "first-strike",
  "double-strike",
  "deathtouch",
  "lifelink",
  "indestructible",
  "hexproof",
  "unblockable",
  "defender",
  "plainswalk",
  "islandwalk",
  "swampwalk",
  "mountainwalk",
  "forestwalk",
  "desertwalk",
]);

const normalizeKeyword = (k: string): string => k.trim().toLowerCase().replace(/\s+/g, "-");

const isSpell = (types: ReadonlySet<string>): boolean => types.has("instant") || types.has("sorcery");

function typeScore(target: ReadonlySet<string>, candidate: ReadonlySet<string>): number {
  let shared = 0;
  for (const t of target) if (candidate.has(t)) shared += 1;
  if (shared === 0) return isSpell(target) && isSpell(candidate) ? 0.6 : 0;
  return shared / Math.max(target.size, candidate.size);
}

/** Mana value closeness: 1 for equal, nothing by three apart. Steeper than a
 * naive distance on purpose — a seven-drop finisher replaced by a two-drop
 * that happens to share a mechanic is the failure this guards against. */
const manaValueScore = (a: number, b: number): number => Math.max(0, 1 - Math.abs(a - b) / 3);

function parseStat(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** For two creatures: how alike their bodies are (size, and combat keywords). */
function bodyScore(target: ReplacementTarget, def: CardDefinition): number {
  const power = parseStat(target.power);
  const toughness = parseStat(target.toughness);
  let size = 0.5;
  if (power !== null && toughness !== null && def.power !== null && def.toughness !== null) {
    const gap = Math.abs(power - def.power) + Math.abs(toughness - def.toughness);
    size = Math.max(0, 1 - gap / 8);
  }
  const want = new Set((target.keywords ?? []).map(normalizeKeyword).filter((k) => COMBAT_KEYWORDS.has(k)));
  const have = new Set<string>(def.keywords.filter((k) => COMBAT_KEYWORDS.has(k)));
  let keywords = 1;
  if (want.size > 0 || have.size > 0) {
    let both = 0;
    for (const k of want) if (have.has(k)) both += 1;
    keywords = both / new Set([...want, ...have]).size;
  }
  return 0.6 * size + 0.4 * keywords;
}

function canBeCommander(def: CardDefinition): boolean {
  return (
    def.supertypes.includes("legendary") &&
    (def.types.includes("creature") || def.types.includes("planeswalker"))
  );
}

function confidenceOf(similarity: number, targetHasTags: boolean): ReplacementConfidence {
  if (!targetHasTags) return "low";
  if (similarity >= HIGH_CONFIDENCE) return "high";
  if (similarity >= MEDIUM_CONFIDENCE) return "medium";
  return "low";
}

/** The built-in cards by name, for a multi-face card's other faces. */
const BUILTIN_BY_NAME = new Map(BUILTIN_CARDS.map((def) => [def.name, def]));
const BUILTIN_FACES: FaceLookup = {
  has: (name) => BUILTIN_BY_NAME.has(name),
  get: (name) => BUILTIN_BY_NAME.get(name)!,
};

/**
 * The implemented cards most like `target`, best first — at most
 * `context.limit` (3) of them, and none at all when nothing is a sensible
 * stand-in.
 *
 * A candidate must share a primary card type with the target (instant and
 * sorcery count as one), unless their oracle tags say they do much the same
 * thing; a land only ever stands in for a land. Among those, the score is
 * mostly the tags when the target has any — what the card does — and then
 * card type, mana value, and for creatures, body. Ties go to the name, so the
 * result is deterministic.
 */
export function suggestReplacements(
  target: ReplacementTarget,
  context: ReplacementContext = {},
): ReplacementSuggestion[] {
  const targetLine = parseTypeLine(target.typeLine);
  if (targetLine.types.length === 0) return [];
  const targetTypes = new Set(targetLine.types);
  const targetCost = parseManaCost(target.manaCost);
  const targetMV = manaValue(targetCost);
  const targetColors = colorsOf(targetCost);
  const targetSubtypes = new Set(targetLine.subtypes.map((s) => s.toLowerCase()));
  const identity = context.identity === undefined ? null : new Set(context.identity);
  const exclude = new Set(context.exclude ?? []);
  const index = context.tags;
  const targetTags =
    index !== undefined && target.name !== undefined ? (index.tagsOf(target.name) ?? []) : [];
  const hasTags = targetTags.length > 0;
  const limit = context.limit ?? 3;

  const scored: ReplacementSuggestion[] = [];
  for (const def of BUILTIN_CARDS) {
    // Tokens and back faces are registered definitions but not decklist
    // entries (see `cards/classify.ts`); basics are never missing.
    if (!isDeckableCard(def) || def.supertypes.includes("basic")) continue;
    if (exclude.has(def.name) || def.name === target.name) continue;
    if (context.forCommander === true && !canBeCommander(def)) continue;
    if (identity !== null && !withinIdentity(colorIdentityOf(def, BUILTIN_FACES), identity)) continue;

    const defTypes = new Set<string>(def.types);
    // A land fills a land slot and nothing else does.
    if (targetTypes.has("land") !== defTypes.has("land")) continue;

    const types = typeScore(targetTypes, defTypes);
    const { similarity, shared } =
      hasTags && index !== undefined
        ? tagSimilarity(index, targetTags, index.tagsOf(def.name) ?? [])
        : { similarity: 0, shared: [] as readonly string[] };
    if (types === 0 && similarity < CROSS_TYPE_SIMILARITY) continue;

    const mv = manaValueScore(targetMV, manaValue(parseManaCost(def.manaCost)));
    const creatures = targetTypes.has("creature") && defTypes.has("creature");
    const body = creatures ? bodyScore(target, def) : 0;
    const subtype = def.subtypes.some((s) => targetSubtypes.has(s.toLowerCase())) ? 1 : 0;

    let score: number;
    if (hasTags) {
      // When the original has tags, tags lead: a card sharing none of them
      // shouldn't outrank one doing the job just by matching type and cost.
      score = creatures
        ? 0.5 * similarity + 0.1 * types + 0.2 * mv + 0.2 * body
        : 0.6 * similarity + 0.15 * types + 0.25 * mv;
    } else {
      score = creatures
        ? 0.3 * types + 0.4 * mv + 0.3 * body
        : 0.45 * types + 0.55 * mv;
    }
    // Mana value scales the whole score as well as being a term in it: a
    // strong tag match at four mana apart (a seven-drop finisher and a
    // two-drop that happen to share a mechanic) must not outrank a closer
    // card doing a similar job.
    score *= 0.7 + 0.3 * mv;
    if (types === 0) score *= CROSS_TYPE_FACTOR;
    // Small nudges: a shared creature type, and — only when no deck identity
    // filtered colours already — sharing the original's colours.
    score += 0.03 * subtype;
    if (identity === null && targetColors.size > 0) {
      let overlap = 0;
      for (const c of def.colors) if (targetColors.has(c)) overlap += 1;
      score += 0.05 * (overlap / Math.max(targetColors.size, def.colors.length));
    }

    scored.push({ name: def.name, confidence: confidenceOf(similarity, hasTags), sharedTags: shared, score });
  }

  scored.sort((a, b) => b.score - a.score || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return scored.slice(0, limit);
}

/**
 * How many candidates each target contributes to the assignment below. The
 * assignment wants more room than the UI shows to trade with, and the cost of
 * a deeper list is nil — `suggestReplacements` already scores every
 * implemented card and then throws all but the top few away.
 *
 * This is the *search* width, not the *display* width: it must not reach the
 * UI. It did once, and the review popup laid twelve card images in a row
 * inside a box that fit three, shoving the card being replaced off the left
 * edge of the screen. {@link UI_OPTIONS} is what comes back.
 */
const ASSIGNMENT_POOL = 12;

/**
 * How many alternatives {@link assignReplacements} hands back per target.
 *
 * The assigned `choice` is always among them even when it ranks below the cap
 * — it is the card the deck will actually contain, so a list that left it out
 * would be offering alternatives to something it never showed.
 *
 * **More than the review popup shows.** It displays the best three that are
 * still *available*, and availability changes while you review: every pick
 * puts a card in the deck, and singleton then rules it out for every later
 * target. Handing over exactly three meant the popup could only grey them
 * out, offering a row of options you couldn't take. The surplus is what it
 * reaches for instead.
 */
const UI_OPTIONS = 8;

export interface ReplacementAssignment {
  /** The unimplemented card being stood in for — `ReplacementTarget.name`. */
  readonly target: string;
  /** The stand-in it was given, or `null` when nothing suitable was left. */
  readonly choice: ReplacementSuggestion | null;
  /** Its own ranked alternatives, best first, for the UI to offer. The first
   * of these is *not* necessarily `choice` — that's the whole point. */
  readonly options: readonly ReplacementSuggestion[];
}

/**
 * Choose stand-ins for several missing cards at once, maximising how good the
 * set is **overall** rather than letting each card grab its own favourite.
 *
 * ## Why a joint choice and not a loop
 *
 * Singleton means one card can only stand in once, so the choices compete. Take
 * them one at a time and the result depends on decklist order: whichever card
 * is considered first claims the shared candidate, and the other is left with
 * whatever remains.
 *
 * The classic case, with a stand-in that suits two missing cards:
 *
 * | | best | second best |
 * |---|---|---|
 * | missing A | shared card, 0.55 | 0.25 |
 * | missing B | shared card, 0.60 | 0.40 |
 *
 * First-come-first-served gives the shared card to whoever is earlier. Giving
 * it to B — the card that likes it *more* — totals 0.60 + 0.25 = 0.85. Giving
 * it to A totals 0.55 + 0.40 = **0.95**, because B had somewhere decent to go
 * and A did not. The card that should win a contested stand-in is the one with
 * the most to lose, not the one with the highest score.
 *
 * ## What it actually does
 *
 * That is the *assignment problem*, and it is solved exactly rather than by the
 * regret rule the example suggests — regret-greedy gets this case right and
 * still loses on longer chains, where taking a card from A pushes B onto C's
 * choice and so on. {@link solveAssignment} is the Hungarian algorithm, which
 * is optimal and, at deck sizes, free: a hundred missing cards against a few
 * hundred candidates is microseconds.
 *
 * Each target keeps its own ranked `options` for the UI, so a person can still
 * override — what changes is only which one is taken by default.
 */
export function assignReplacements(
  targets: readonly ReplacementTarget[],
  context: ReplacementContext = {},
): ReplacementAssignment[] {
  const options = targets.map((target) =>
    suggestReplacements(target, { ...context, limit: ASSIGNMENT_POOL }),
  );

  // One column per distinct candidate anyone suggested.
  const columns: string[] = [];
  const columnOf = new Map<string, number>();
  for (const list of options) {
    for (const s of list) {
      if (columnOf.has(s.name)) continue;
      columnOf.set(s.name, columns.length);
      columns.push(s.name);
    }
  }

  const n = targets.length;
  const m = columns.length;
  const name = (i: number): string => targets[i].name ?? "";
  if (n === 0 || m === 0) {
    return targets.map((_, i) => ({ target: name(i), choice: null, options: options[i] }));
  }

  // Minimise cost, so a better match is a *lower* number. A candidate this
  // target never suggested gets a cost worse than any real match rather than
  // Infinity: the solver needs every row to have somewhere to go, and pairings
  // it was forced into are discarded afterwards.
  const UNSUGGESTED = 1;
  const cost: number[][] = [];
  const scoreOf: Map<number, number>[] = [];
  for (let i = 0; i < n; i += 1) {
    const row = new Array<number>(m).fill(UNSUGGESTED);
    const scores = new Map<number, number>();
    for (const s of options[i]) {
      const j = columnOf.get(s.name) as number;
      row[j] = -s.score;
      scores.set(j, s.score);
    }
    cost.push(row);
    scoreOf.push(scores);
  }

  const assignment = solveAssignment(cost, n, m);
  return targets.map((_, i) => {
    const j = assignment[i];
    // `-1` is an unmatched row (more targets than candidates); a column this
    // target never suggested is a forced pairing and no better than nothing.
    const chosen = j >= 0 && scoreOf[i].has(j) ? columns[j] : null;
    const ranked = options[i];
    const choice = chosen === null ? null : (ranked.find((s) => s.name === chosen) ?? null);
    // Narrow the search pool to what the UI offers, keeping the assignment's
    // own pick: it can rank below the cap precisely because the assignment
    // trades favourites away, and dropping it here would show a list of
    // alternatives that excluded the one actually taken.
    const shown = ranked.slice(0, UI_OPTIONS);
    if (choice !== null && !shown.some((s) => s.name === choice.name)) {
      if (shown.length < UI_OPTIONS) shown.push(choice);
      else shown[UI_OPTIONS - 1] = choice;
    }
    return { target: name(i), choice, options: shown };
  });
}

/**
 * Hungarian algorithm (Kuhn-Munkres, shortest-augmenting-path form): the
 * minimum-cost way to give each of `n` rows a distinct column, `n <= m`.
 * Returns the column per row, or -1 where a row got none.
 *
 * The 1-indexed arrays and the `0` sentinel column are the standard shape of
 * this algorithm rather than an accident; `p[0]` carries the row currently
 * being augmented. Runs in O(n^2 m), which for a decklist is nothing.
 */
function solveAssignment(cost: readonly (readonly number[])[], n: number, m: number): number[] {
  const result = new Array<number>(n).fill(-1);
  if (n > m) return result;

  const u = new Array<number>(n + 1).fill(0);
  const v = new Array<number>(m + 1).fill(0);
  const p = new Array<number>(m + 1).fill(0);
  const way = new Array<number>(m + 1).fill(0);

  for (let i = 1; i <= n; i += 1) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array<number>(m + 1).fill(Infinity);
    const used = new Array<boolean>(m + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= m; j += 1) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }
      for (let j = 0; j <= m; j += 1) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  for (let j = 1; j <= m; j += 1) if (p[j] > 0) result[p[j] - 1] = j - 1;
  return result;
}
