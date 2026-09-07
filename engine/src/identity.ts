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

/** The colour identity of `def` — a set of `Color`s (rule 903.4). */
export function colorIdentityOf(def: CardDefinition): Set<Color> {
  const identity = new Set<Color>(def.colors);
  colorsInText(def.manaCost ?? "", identity);
  colorsInText(def.text, identity);
  for (const ability of def.activated) {
    colorsInText(ability.cost.mana ?? "", identity);
    colorsInText(ability.text, identity);
  }
  for (const ability of def.triggered) colorsInText(ability.text, identity);
  for (const ability of def.static) colorsInText(ability.text, identity);
  return identity;
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
