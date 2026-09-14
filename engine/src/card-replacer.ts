/**
 * Suggests an already-implemented card to stand in for one the engine
 * doesn't have yet, for the client's decklist-import flow (paste a
 * decklist, get a deck you can actually play today). Pure and synchronous —
 * scores every `BUILTIN_CARDS` entry against the *unimplemented* card's own
 * Scryfall-reported type line and mana cost (the only data available for a
 * card with no `CardDefinition`), and returns the closest match's name.
 *
 * Deliberately simple, and deliberately *not* a rules computation: "colour"
 * here is read straight off the target's own mana-cost pips, not a full
 * rule-903.4 colour-identity fold (that needs a `CardDefinition` to walk its
 * rules text, which an unimplemented card doesn't have). A suggestion that
 * ends up outside some deck's commander identity still surfaces as an
 * ordinary violation in `validateCommanderDeck`'s legality panel, the same
 * as any manually-added off-colour card — nothing is silently wrong, this
 * just isn't pre-filtered against a particular deck's identity.
 */

import { BUILTIN_CARDS } from "./cards.js";
import type { CardType } from "./cards/define.js";
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
 * inside a hybrid/twobrid/Phyrexian pip — a permissive reading, since this
 * is only ever used as a similarity proxy, not a legality computation. */
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

export interface ReplacementTarget {
  /** Scryfall's `mana_cost` field — the same `"{2}{G}{G}"`-style notation
   * `parseManaCost` already parses for implemented cards. */
  readonly manaCost: string | null;
  /** Scryfall's `type_line` field. */
  readonly typeLine: string;
}

/** Tokens ("3/3 Beast Token") are real `BUILTIN_CARDS` entries but aren't a
 * legal thing to put in a deck's 99 — never worth suggesting. */
function isToken(name: string): boolean {
  return name.toLowerCase().includes("token");
}

/**
 * The closest `BUILTIN_CARDS` entry to `target`, or `null` if nothing
 * shares even its primary type (a creature only ever matches a creature, a
 * land only a land, etc. — swapping in the wrong permanent/spell shape
 * would be a worse suggestion than none). Ties broken by name for a
 * deterministic result.
 */
export function suggestReplacement(target: ReplacementTarget): string | null {
  const targetLine = parseTypeLine(target.typeLine);
  if (targetLine.types.length === 0) return null;
  const targetCost = parseManaCost(target.manaCost);
  const targetMV = manaValue(targetCost);
  const targetColors = colorsOf(targetCost);
  const targetSubtypes = new Set(targetLine.subtypes.map((s) => s.toLowerCase()));

  const targetTypes = new Set(targetLine.types);

  let bestName: string | null = null;
  let bestScore = Infinity;
  for (const def of BUILTIN_CARDS) {
    if (isToken(def.name)) continue;
    const defTypes = new Set<string>(def.types);
    let sharedTypes = 0;
    for (const t of targetTypes) if (defTypes.has(t)) sharedTypes += 1;
    if (sharedTypes === 0) continue; // hard filter: no overlap in primary type at all

    const defMV = manaValue(parseManaCost(def.manaCost));
    const mvPenalty = Math.abs(defMV - targetMV);

    const defColors = new Set<Color>(def.colors);
    let colorOverlap = 0;
    for (const c of targetColors) if (defColors.has(c)) colorOverlap += 1;
    const colorPenalty = Math.max(targetColors.size, defColors.size) - colorOverlap;

    // Extra types on either side that aren't shared — e.g. a plain Artifact
    // target should prefer a plain artifact over an artifact *creature* at
    // the same mana value, and vice versa.
    const typeMismatchPenalty = targetTypes.size - sharedTypes + (defTypes.size - sharedTypes);

    const sharesSubtype = def.subtypes.some((s) => targetSubtypes.has(s.toLowerCase()));

    // Lower is better; mana-value distance dominates, type-shape and colour
    // mismatches are smaller nudges, a shared subtype is a tiebreaker bonus.
    const score =
      mvPenalty * 2 + typeMismatchPenalty * 1.5 + colorPenalty - (sharesSubtype ? 0.5 : 0);

    if (score < bestScore || (score === bestScore && bestName !== null && def.name < bestName)) {
      bestScore = score;
      bestName = def.name;
    }
  }
  return bestName;
}
