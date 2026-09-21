#!/usr/bin/env node
// Cross-checks every card under cards/pool/ against its real Scryfall data:
// mana cost, colors, supertypes/types/subtypes, power/toughness, loyalty.
// Behaviour (abilities/effects) isn't checked here — only the objectively
// comparable printed characteristics. Tokens (cards/tokens/) are skipped:
// their names aren't unique/canonical on Scryfall.
//
// `--text` additionally audits each card's rules text *clause by clause*
// against Scryfall's `oracle_text`: every sentence of the real card is matched
// to its closest sentence in ours, and anything with no close counterpart is
// reported as MISSING (a clause the pool dropped — Essence Flux's "If it's a
// Spirit, put a +1/+1 counter on it" was found this way) or EXTRA (a clause
// ours has that the real card doesn't).
//
// This is a **review list, not a pass/fail gate**, and it can't be otherwise:
// the pool paraphrases freely, drops reminder text, and deliberately omits
// abilities the engine doesn't model yet. A reported clause means "a human
// should look at this card", so read the output rather than counting it.
// Keyword-only lines are skipped when the keywords are on `def.keywords`
// (the client renders those from the keyword list, not from `text`).
//
// `--lines` is the older, narrower check: it compares only the *number* of
// text lines, because the client renders `text` verbatim (white-space:
// pre-line) and a card missing a newline escape runs two abilities together.
//
// Usage: node scripts/verify-cards.mjs [--json out.json] [--limit N] [--start N]
//                                      [--text [--similar]] [--lines]

import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { writeFileSync } from "node:fs";

const POOL_DIR = fileURLToPath(new URL("../dist/cards/pool/", import.meta.url));
const USER_AGENT = "MTG-Engine-CardVerification/1.0";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const jsonOut = flag("json", null);
const limit = Number(flag("limit", Infinity));
const start = Number(flag("start", 0));
const checkText = args.includes("--text");
const checkLines = args.includes("--lines");
// Clauses that matched something, but only loosely — usually a legitimate
// paraphrase, occasionally a real difference. Off by default; they'd bury the
// clauses that matched nothing at all.
const showSimilar = args.includes("--similar");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const MIN_INTERVAL_MS = 400;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 5;
let earliestNextRequestAt = 0;
async function throttle() {
  const wait = earliestNextRequestAt - Date.now();
  if (wait > 0) await delay(wait);
  earliestNextRequestAt = Date.now() + MIN_INTERVAL_MS;
}

/** One HTTP attempt with a hard timeout — a stalled connection aborts rather
 * than hanging the whole run forever. Returns `{ res } | { error }`. */
async function attemptFetch(url, init) {
  await throttle();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...init?.headers },
      signal: controller.signal,
    });
    return { res };
  } catch (error) {
    return { error };
  } finally {
    clearTimeout(timer);
  }
}

/** Bounded retries — a 429, a timeout, or a network error all get up to
 * `MAX_RETRIES` more tries with backoff, then give up (never loops forever). */
async function scryfallFetch(url, init) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const outcome = await attemptFetch(url, init);
    if (outcome.error !== undefined) {
      if (attempt === MAX_RETRIES) return { ok: false, status: "network-error", detail: String(outcome.error) };
      await delay(1000 * (attempt + 1));
      continue;
    }
    const res = outcome.res;
    // 429 (rate limited) and 5xx (Scryfall/Cloudflare transient trouble —
    // observed in practice after a day of heavy lookups) are both worth
    // retrying; a real 404 ("no such card") is not.
    if (res.status === 429 || res.status >= 500) {
      if (attempt === MAX_RETRIES) return { ok: false, status: res.status };
      const retryAfter = Number(res.headers.get("retry-after"));
      const backoff = Number.isFinite(retryAfter) ? Math.min(retryAfter * 1000, 10_000) : 1500 * (attempt + 1);
      await delay(backoff);
      continue;
    }
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, status: res.status, body: await res.json() };
  }
  return { ok: false, status: "unreachable" };
}

async function fetchCardByName(name) {
  return scryfallFetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
}

/** Scryfall's batch endpoint — up to 75 identifiers per POST, one request
 * instead of one-per-card. https://scryfall.com/docs/api/cards/collection.
 * `name` identifiers do an exact match — a name that's only one face of a
 * DFC/split/adventure card (our registry key) legitimately won't resolve
 * here and comes back in `not_found` for the caller to fuzzy-fallback on. */
const COLLECTION_BATCH_SIZE = 75;
async function fetchCollection(names) {
  const outcome = await scryfallFetch("https://api.scryfall.com/cards/collection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifiers: names.map((name) => ({ name })) }),
  });
  if (!outcome.ok) return { found: new Map(), missing: names, error: outcome.status };
  const found = new Map();
  for (const card of outcome.body.data) {
    found.set(card.name.toLowerCase(), card);
    for (const face of card.card_faces ?? []) found.set(face.name.toLowerCase(), card);
  }
  // Anything Scryfall couldn't exact-match, plus anything we asked for that
  // didn't come back under its own name (a DFC face is a real risk here).
  const missing = names.filter((n) => !found.has(n.toLowerCase()));
  return { found, missing };
}

const KNOWN_SUPERTYPES = new Set(["Legendary", "Basic", "Snow", "World", "Ongoing"]);
const KNOWN_TYPES = new Set([
  "Creature", "Land", "Artifact", "Enchantment", "Instant", "Sorcery", "Planeswalker", "Battle",
  "Tribal", "Kindred", "Dungeon", "Plane", "Phenomenon", "Scheme", "Vanguard", "Conspiracy",
]);
function parseTypeLine(typeLine) {
  const [frontPart, subPart] = typeLine.split(/\s+—\s+/);
  const words = frontPart.trim().split(/\s+/);
  const supertypes = words.filter((w) => KNOWN_SUPERTYPES.has(w)).map((w) => w.toLowerCase());
  const types = words.filter((w) => KNOWN_TYPES.has(w)).map((w) => w.toLowerCase());
  const subtypes = subPart ? subPart.trim().split(/\s+/) : [];
  return { supertypes, types, subtypes };
}

function sameSet(a, b) {
  const as = new Set(a ?? []);
  const bs = new Set(b ?? []);
  if (as.size !== bs.size) return false;
  for (const x of as) if (!bs.has(x)) return false;
  return true;
}

/** Every name a face/card could legitimately be looked up under — its real
 * name and its Universes Beyond `flavor_name` (Azusa, Lost but Seeking /
 * "Princess Sarah"). Pool cards are registered under the Oracle name, which
 * is what decklists use, but a crossover card authored under its flavor name
 * should still be found rather than reported missing. */
function namesOf(faceOrCard) {
  return [faceOrCard.name, faceOrCard.flavor_name].filter((n) => n !== undefined);
}

/** Pick the Scryfall face (or the top-level card) whose name matches `name`. */
function faceFor(card, name) {
  const lower = name.toLowerCase();
  if (card.card_faces && card.card_faces.length > 0) {
    const face = card.card_faces.find((f) => namesOf(f).some((n) => n.toLowerCase() === lower));
    if (face !== undefined) return face;
  }
  return card;
}

/** True only if `card` (or one of its faces) is actually named `name`. The
 * batch collection endpoint's "name" identifier is an exact match, so it
 * can't misfire — but the fuzzy fallback (`?fuzzy=`, used only for a name
 * the batch endpoint couldn't exact-match) is lenient enough to return a
 * completely unrelated real card for a homebrew name that merely contains a
 * real card's words (a homebrew "Rendwin, Warden of the Grove" once
 * fuzzy-matched the real, unrelated "Warden of the Grove"). Without this
 * check that reads as a false "mismatch" instead of the true "not on
 * Scryfall at all" — which is now the only thing a NOT FOUND can mean, since
 * every card in the pool is a real card. */
function actuallyNamed(card, name) {
  const lower = name.toLowerCase();
  if (namesOf(card).some((n) => n.toLowerCase() === lower)) return true;
  return (card.card_faces ?? []).some((f) => namesOf(f).some((n) => n.toLowerCase() === lower));
}

function numOrNull(s) {
  if (s === undefined || s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * The *lines* of a rules-text block, normalized for comparison. A card's
 * `text` is displayed verbatim (the client renders it `white-space: pre-line`),
 * so its line breaks have to match the printed card's or two abilities run
 * together on one line. Only the line *structure* is compared, never the
 * wording — the pool paraphrases freely, keeps the card's own name where
 * Scryfall now says "this creature", and usually drops reminder text.
 */
function textLines(s) {
  return (s ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    // A line that is *only* reminder text is optional — the pool normally
    // leaves it out, and its presence or absence isn't a structural error.
    .filter((line) => !/^\(.*\)$/.test(line));
}

// --- clause-level rules-text audit (`--text`) --------------------------------

/** Every keyword ability that can legitimately appear as a bare line of rules
 * text. A Scryfall line made only of these, each of them on `def.keywords`, is
 * already being rendered by the client from the keyword list and isn't a text
 * discrepancy. Lower-cased; a parameterised keyword ("ward {2}", "annihilator
 * 2") is matched by its first word. */
const BARE_KEYWORD_LINE = /^[a-z' ]+(\s\{?[0-9wubrgxc/]+\}?)?$/;

/**
 * Split a rules-text block into the clauses a reader would call separate
 * statements: one per line, then one per sentence within a line. An activated
 * or triggered ability stays whole — the cost/trigger and its effect are one
 * statement, and splitting on the colon or comma would match everything
 * against everything.
 */
function clausesOf(text) {
  const out = [];
  for (const rawLine of (text ?? "").split("\n")) {
    const line = stripReminders(rawLine).trim();
    if (line.length === 0) continue;
    // Sentence boundary: a period/exclamation/question mark followed by
    // whitespace and a capital (or a `{`, for "… deal 2 damage. {T}: …").
    for (const piece of line.split(/(?<=[.!?])\s+(?=[A-Z{])/)) {
      const clause = piece.trim();
      if (clause.length > 0) out.push(clause);
    }
  }
  return out;
}

/** Drop parenthesised reminder text (rule 207.2) wherever it appears. */
function stripReminders(s) {
  return s.replace(/\([^)]*\)/g, " ");
}

/**
 * A clause reduced to the words that carry its meaning. The pool paraphrases,
 * keeps a card's own name where Scryfall now says "this creature", and writes
 * numbers either way — so the card's name, the self-reference phrasings and
 * punctuation are all normalised away before two clauses are compared.
 */
function clauseTokens(clause, cardName) {
  const firstWord = cardName.split(/[\s,]+/)[0] ?? cardName;
  // Scryfall's current templating refers to a legendary by its short name
  // ("Bruse Tarl" for "Bruse Tarl, Boorish Herder"), so the part before the
  // comma has to normalise away too, or every such card reads as different.
  const shortName = cardName.split(",")[0] ?? cardName;
  let s = ` ${clause.toLowerCase()} `;
  // Longest first: replacing the first word first would strand the rest of
  // the full name behind as tokens of its own.
  const names = [cardName, shortName, firstWord]
    .map((n) => n.toLowerCase())
    .sort((a, b) => b.length - a.length);
  for (const name of names) {
    if (name.length > 2) s = s.split(name).join(" ~ ");
  }
  s = s.replace(
    /\bthis (creature|permanent|card|spell|land|artifact|enchantment|planeswalker|token|aura|equipment|saga)\b/g,
    " ~ ",
  );
  // A loyalty cost: Scryfall writes a real minus sign, the pool writes
  // "[-N]". The same ability, and without this every planeswalker reports
  // its own loyalty numbers as dropped content.
  s = s.replace(/\u2212/g, "-").replace(/[[\]]/g, " ");
  s = s.replace(/\bit\b/g, " ~ ");
  // Mana and tap symbols survive as single tokens; everything else that isn't
  // a word character, a digit or a P/T sign goes.
  s = s.replace(/\{([^}]*)\}/g, (_m, inner) => ` {${inner}} `);
  s = s.replace(/[^a-z0-9{}+/~-]+/g, " ");
  return s.split(" ").filter((w) => w.length > 0 && w !== "~");
}

/** Dice coefficient over the two token *sets* — 1.0 for the same words in any
 * order, 0 for none in common. Robust to the reordering a paraphrase does,
 * which a straight string compare is not. */
function similarity(a, b) {
  if (a.length === 0 || b.length === 0) return a.length === b.length ? 1 : 0;
  const sa = new Set(a);
  const sb = new Set(b);
  let shared = 0;
  for (const w of sa) if (sb.has(w)) shared += 1;
  return (2 * shared) / (sa.size + sb.size);
}

const MATCHED = 0.72; // close enough to be the same clause
const RELATED = 0.4; // recognisably about the same thing, worth a look

/** A Scryfall line that's purely keyword abilities the def already declares —
 * the client renders those from `keywords`, not from `text`. */
function isCoveredKeywordLine(clause, keywords) {
  const lower = clause.toLowerCase().replace(/\.$/, "");
  if (!BARE_KEYWORD_LINE.test(lower)) return false;
  const declared = new Set((keywords ?? []).map((k) => String(k).toLowerCase()));
  const parts = lower.split(/,\s*/).map((p) => p.trim()).filter((p) => p.length > 0);
  if (parts.length === 0) return false;
  return parts.every((p) => declared.has(p) || declared.has(p.split(" ")[0]));
}

const BASIC_LAND_TYPES = new Set(["Plains", "Island", "Swamp", "Mountain", "Forest"]);

/**
 * A "{T}: Add …" line on a land with a basic land type. Scryfall leaves that
 * ability out of `oracle_text` because the type line already grants it
 * (rule 305.6), but the pool has to spell it out — so it is always an EXTRA
 * clause and never a real difference.
 */
function isImpliedLandManaAbility(clause, def) {
  if (!/^\{t\}:\s*add\b/i.test(clause)) return false;
  return (def.subtypes ?? []).some((s) => BASIC_LAND_TYPES.has(s));
}

/**
 * Words whose absence from our clause says nothing -- articles, prepositions
 * and the connective tissue a paraphrase drops freely. Everything else counts
 * as content: a noun, a number, a mana symbol, a zone, a qualifier.
 */
const FILLER = new Set([
  "a", "an", "the", "of", "to", "for", "with", "and", "or", "then", "that",
  "this", "is", "are", "be", "been", "as", "at", "by", "on", "in", "into",
  "from", "up", "may", "you", "your", "its", "their", "it", "them", "if",
  "when", "whenever", "each", "all", "one", "target", "s", "other",
]);

/**
 * The content words the real clause has that ours doesn't.
 *
 * Deliberately asymmetric: extra words on our side are a paraphrase being
 * wordier, which is harmless, while missing ones are behaviour the card does
 * not have. "your" and "any" are filler on their own, but "commander" and
 * "identity" are not -- which is what catches Command Tower.
 */
function significantDropped(theirTokens, ourTokens) {
  const ours = new Set(ourTokens);
  const out = [];
  for (const w of new Set(theirTokens)) {
    if (!ours.has(w) && !FILLER.has(w)) out.push(w);
  }
  return out;
}

/**
 * Match every clause of the real card against ours and report what didn't
 * land. Returns `{ missing, extra, similar }`, each a list of
 * `{ clause, best, score }`.
 */
function compareText(def, face) {
  const theirs = clausesOf(face.oracle_text);
  const ours = clausesOf(def.text);
  if (theirs.length === 0) return { missing: [], extra: [], similar: [], partial: [] };

  const theirTokens = theirs.map((c) => clauseTokens(c, def.name));
  const ourTokens = ours.map((c) => clauseTokens(c, def.name));

  const best = (tokens, pool) => {
    let score = 0;
    let at = -1;
    pool.forEach((other, i) => {
      const s = similarity(tokens, other);
      if (s > score) {
        score = s;
        at = i;
      }
    });
    return { score, at };
  };

  const missing = [];
  const similar = [];
  const partial = [];
  theirs.forEach((clause, i) => {
    if (isCoveredKeywordLine(clause, def.keywords)) return;
    const { score, at } = best(theirTokens[i], ourTokens);
    if (score >= MATCHED) {
      // Matched -- but a high Dice score still allows our clause to be the
      // real one with words *removed*, which is a wrong card rather than a
      // paraphrase. Command Tower scored 0.78 while dropping "in your
      // commander's color identity", so it never appeared in this report at
      // all. Report the content words the real clause has that ours doesn't
      // and let a human judge; this is the blind spot AUTHORING SS16 warns
      // about, made visible.
      if (at >= 0) {
        const dropped = significantDropped(theirTokens[i], ourTokens[at]);
        if (dropped.length > 0) partial.push({ clause, best: ours[at], score, dropped });
      }
      return;
    }
    const entry = { clause, best: at >= 0 && score >= RELATED ? ours[at] : null, score };
    if (score >= RELATED) similar.push(entry);
    else missing.push(entry);
  });

  const extra = [];
  ours.forEach((clause, i) => {
    if (isCoveredKeywordLine(clause, def.keywords)) return;
    if (isImpliedLandManaAbility(clause, def)) return;
    const { score } = best(ourTokens[i], theirTokens);
    if (score < RELATED) extra.push({ clause, best: null, score });
  });

  return { missing, extra, similar, partial };
}

function compare(def, card) {
  const face = faceFor(card, def.name);
  const issues = [];

  const theirCost = face.mana_cost ?? "";
  const ourCost = def.manaCost ?? "";
  if (theirCost.trim() !== ourCost.trim()) {
    issues.push(`manaCost: ours="${ourCost}" scryfall="${theirCost}"`);
  }

  const theirColors = face.colors ?? card.colors ?? [];
  // A colourless permanent's own `colors` is legitimately absent on a face
  // that inherits colour from the front (rare) — only flag a real mismatch.
  if (!sameSet(def.colors ?? [], theirColors)) {
    issues.push(`colors: ours=[${(def.colors ?? []).join(",")}] scryfall=[${theirColors.join(",")}]`);
  }

  if (face.type_line) {
    const parsed = parseTypeLine(face.type_line);
    if (!sameSet(def.supertypes ?? [], parsed.supertypes)) {
      issues.push(`supertypes: ours=[${(def.supertypes ?? []).join(",")}] scryfall=[${parsed.supertypes.join(",")}]`);
    }
    if (!sameSet(def.types ?? [], parsed.types)) {
      issues.push(`types: ours=[${(def.types ?? []).join(",")}] scryfall=[${parsed.types.join(",")}]`);
    }
    if (!sameSet(def.subtypes ?? [], parsed.subtypes)) {
      issues.push(`subtypes: ours=[${(def.subtypes ?? []).join(",")}] scryfall=[${parsed.subtypes.join(",")}]`);
    }
  }

  const theirPower = numOrNull(face.power);
  const theirToughness = numOrNull(face.toughness);
  if (theirPower !== null && def.power !== undefined && def.power !== theirPower) {
    issues.push(`power: ours=${def.power} scryfall=${face.power}`);
  }
  if (theirToughness !== null && def.toughness !== undefined && def.toughness !== theirToughness) {
    issues.push(`toughness: ours=${def.toughness} scryfall=${face.toughness}`);
  }
  const theirLoyalty = numOrNull(face.loyalty);
  if (theirLoyalty !== null && def.loyalty !== undefined && def.loyalty !== theirLoyalty) {
    issues.push(`loyalty: ours=${def.loyalty} scryfall=${face.loyalty}`);
  }

  // One line per printed ability. Fewer lines than the real card means two
  // abilities are being displayed as one run-on paragraph; more means a line
  // break the printed card doesn't have.
  const ourLines = textLines(def.text);
  const theirLines = textLines(face.oracle_text);
  if (checkLines && theirLines.length > 0 && ourLines.length > 0 && ourLines.length !== theirLines.length) {
    issues.push(
      `text lines: ours=${ourLines.length} scryfall=${theirLines.length}` +
        `\n      ours:     ${ourLines.map((l) => l.slice(0, 60)).join(" | ")}` +
        `\n      scryfall: ${theirLines.map((l) => l.slice(0, 60)).join(" | ")}`,
    );
  }

  return issues;
}

/** The `--text` report: cards worst first (most unmatched clauses), each
 * listing what the real card says that ours doesn't, and vice versa. */
function reportText(reports, checked) {
  const weight = (r) => r.missing.length * 2 + r.partial.length * 2 + r.extra.length;
  const sorted = [...reports].sort((a, b) => weight(b) - weight(a) || a.name.localeCompare(b.name));
  const trim = (s) => (s.length > 150 ? `${s.slice(0, 147)}...` : s);

  console.log(`\n=== rules text (${sorted.length} of ${checked} cards differ) ===\n`);
  for (const r of sorted) {
    console.log(`${r.name} (${r.file})`);
    for (const m of r.missing) console.log(`  MISSING  ${trim(m.clause)}`);
    for (const p of r.partial) {
      console.log(`  PARTIAL  ${trim(p.clause)}`);
      console.log(`           ours: ${trim(p.best ?? "")}`);
      console.log(`           dropped: ${p.dropped.join(", ")}`);
    }
    for (const e of r.extra) console.log(`  EXTRA    ${trim(e.clause)}`);
    if (showSimilar) {
      for (const s of r.similar) {
        console.log(`  REWORDED ${trim(s.clause)}`);
        console.log(`           ours: ${trim(s.best ?? "")}`);
      }
    }
    console.log("");
  }
  const missing = sorted.reduce((n, r) => n + r.missing.length, 0);
  const extra = sorted.reduce((n, r) => n + r.extra.length, 0);
  const partial = sorted.reduce((n, r) => n + r.partial.length, 0);
  console.log(`${missing} clause(s) the real card has and ours doesn't, ${extra} the other way round.`);
  console.log(`${partial} clause(s) matched but dropped content words (PARTIAL) -- read every one.`);
  console.log("Expect false positives: the pool paraphrases, and omits unmodeled abilities on purpose.");
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const files = readdirSync(POOL_DIR)
    .filter((f) => f.endsWith(".js"))
    .sort()
    .slice(start, Number.isFinite(limit) ? start + limit : undefined);

  const entries = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(POOL_DIR, file)).href);
    const def = mod.default;
    if (def === undefined || def.name === undefined) continue;
    entries.push({ file, def });
  }

  // Pass 1: the batch collection endpoint, ceil(N/75) requests total.
  const byName = new Map();
  const batches = chunk(entries.map((e) => e.def.name), COLLECTION_BATCH_SIZE);
  console.log(`resolving ${entries.length} cards in ${batches.length} batch request(s)...`);
  for (const batch of batches) {
    const { found, missing, error } = await fetchCollection(batch);
    for (const [name, card] of found) byName.set(name, card);
    if (error !== undefined) console.log(`  batch request failed (status=${error}) — falling back per-name for it`);
    for (const name of missing) byName.set(name.toLowerCase(), "fallback-needed");
  }

  // Pass 2: fuzzy fallback, one request each — only for names the batch
  // endpoint's exact-match couldn't resolve (typically one face of a
  // DFC/split/adventure card, since our registry key is just that face).
  const needFallback = entries.filter((e) => byName.get(e.def.name.toLowerCase()) === "fallback-needed");
  if (needFallback.length > 0) {
    console.log(`fuzzy-resolving ${needFallback.length} name(s) the batch endpoint couldn't exact-match...`);
  }
  for (const { def } of needFallback) {
    const outcome = await fetchCardByName(def.name);
    const resolved = outcome.ok && actuallyNamed(outcome.body, def.name) ? outcome.body : undefined;
    byName.set(def.name.toLowerCase(), resolved ?? { __error: outcome.ok ? "fuzzy-mismatch" : outcome.status });
  }

  const results = [];
  let checked = 0;
  let mismatched = 0;
  let notFound = 0;
  const textReports = [];

  for (const { file, def } of entries) {
    const card = byName.get(def.name.toLowerCase());
    if (card === undefined || card === "fallback-needed" || card?.__error !== undefined) {
      notFound += 1;
      const httpStatus = card?.__error;
      results.push({ name: def.name, file, status: "not-found", httpStatus });
      console.log(`? NOT FOUND: ${def.name} (${file})${httpStatus !== undefined ? ` [status=${httpStatus}]` : ""}`);
      continue;
    }
    checked += 1;
    const issues = compare(def, card);
    const text = checkText ? compareText(def, faceFor(card, def.name)) : null;
    if (issues.length > 0) {
      mismatched += 1;
      console.log(`✗ ${def.name} (${file})`);
      for (const issue of issues) console.log(`    ${issue}`);
    }
    if (
      text !== null &&
      (text.missing.length > 0 ||
        text.extra.length > 0 ||
        text.partial.length > 0 ||
        (showSimilar && text.similar.length > 0))
    ) {
      textReports.push({ name: def.name, file, ...text });
    }
    results.push({
      name: def.name,
      file,
      status: issues.length > 0 ? "mismatch" : "ok",
      ...(issues.length > 0 ? { issues } : {}),
      ...(text !== null ? { text } : {}),
    });
  }

  console.log(
    `\n${checked} checked, ${mismatched} mismatched, ${notFound} not found on Scryfall (out of ${entries.length} cards)`,
  );

  if (checkText) reportText(textReports, checked);

  if (jsonOut !== null) {
    writeFileSync(jsonOut, JSON.stringify(results, null, 2), "utf8");
    console.log(`wrote ${jsonOut}`);
  }
}

main();
