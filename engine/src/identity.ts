/**
 * Colour identity (rule 903.4 — ROADMAP Phase 9). A card's colour identity is
 * every colour in its mana cost *and* in any mana symbol in its rules text
 * (ability costs, reminder text, CDAs), plus its colour indicator. Used for
 * Commander deck validation: every card must be within the commander's
 * identity.
 *
 * This is a lexical scan — every `{…}` symbol anywhere in the card's declared
 * text and ability costs — which covers the cases that matter without a full
 * Oracle-text parser.
 */

import type { CardDefinition } from "./cards.js";
import type { Color } from "./mana.js";
import { COLORS } from "./mana.js";

const SYMBOL = /\{([^}]*)\}/g;

/** Pull the W/U/B/R/G letters out of every `{…}` symbol in `text`. */
function colorsInText(text: string, into: Set<Color>): void {
  for (const match of text.matchAll(SYMBOL)) {
    for (const ch of match[1].toUpperCase()) {
      if ((COLORS as readonly string[]).includes(ch)) into.add(ch as Color);
    }
  }
}

/** Where the other faces of a multi-face card are found by name — a
 * `CardRegistry` fits. */
export interface FaceLookup {
  has(name: string): boolean;
  get(name: string): CardDefinition;
}

/**
 * The colour identity of `def` — a set of `Color`s (rule 903.4). A card
 * with several faces has every face's (rule 903.4d — a double-faced card's
 * back face counts, and so does an adventurer's spell half, being part of
 * the same card), read through `faces`; without a lookup only `def` itself
 * is read, which is right for a single-faced card and nothing else.
 */
export function colorIdentityOf(def: CardDefinition, faces?: FaceLookup): Set<Color> {
  const identity = new Set<Color>();
  addIdentityOf(def, identity);
  if (faces !== undefined && def.faces !== null) {
    for (const name of def.faces) {
      if (name !== def.name && faces.has(name)) addIdentityOf(faces.get(name), identity);
    }
  }
  return identity;
}

/** One face's colours and mana symbols, into `identity`. */
function addIdentityOf(def: CardDefinition, identity: Set<Color>): void {
  for (const c of def.colors) identity.add(c);
  colorsInText(def.manaCost ?? "", identity);
  colorsInText(def.text, identity);
  for (const ability of def.activated) {
    colorsInText(ability.cost.mana ?? "", identity);
    colorsInText(ability.text, identity);
  }
  for (const ability of def.triggered) colorsInText(ability.text, identity);
  for (const ability of def.static) colorsInText(ability.text, identity);
}

/** Sorted WUBRG string form ("", "WU", "WUBRG") — handy for display / compare. */
export function identityString(identity: ReadonlySet<Color>): string {
  return COLORS.filter((c) => identity.has(c)).join("");
}

/** Is every colour of `card`'s identity within `commanderIdentity` (rule
 * 903.4)? Colourless cards are always legal. */
export function withinIdentity(
  card: ReadonlySet<Color>,
  commanderIdentity: ReadonlySet<Color>,
): boolean {
  for (const c of card) if (!commanderIdentity.has(c)) return false;
  return true;
}
