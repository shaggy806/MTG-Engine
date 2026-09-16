/**
 * What *kind* of thing a `CardDefinition` is — token vs. card, front face vs.
 * back face — and whether it's a legal decklist entry.
 *
 * Both distinctions exist only outside the definition itself. A token's
 * definition is shaped exactly like a card's (that's the point: `create-token`
 * resolves a name through the same `CardRegistry`), and the only record that
 * it *is* a token is which directory its file lives in — which the codegen
 * preserves as `TOKEN_CARDS`. A back face is likewise a fully-registered
 * definition; what marks it is that its own name isn't the first entry of its
 * `faces` list.
 *
 * Neither is a card you can put in a deck (rule 111.1 — a token isn't a card
 * at all; rule 712.3 — a double-faced card is one card, deck-listed under its
 * front face), so browsing and deck-building UIs need this distinction even
 * though the rules engine itself never does.
 */

import type { CardDefinition } from "./define.js";
import { TOKEN_CARDS } from "./generated.js";

const TOKEN_NAMES: ReadonlySet<string> = new Set(TOKEN_CARDS.map((c) => c.name));

/** True for a definition authored under `cards/tokens/` — a token, not a card. */
export function isTokenCard(def: CardDefinition): boolean {
  return TOKEN_NAMES.has(def.name);
}

/**
 * True when `def` is the face a physical card is identified by: a
 * single-faced card, or the front face / creature half of a multi-face one
 * (rule 712.3, 715.2). False for a back face, an adventure's spell half, or
 * an MDFC's second face — each a real registered definition, but not
 * something that exists as its own card.
 */
export function isCardFront(def: CardDefinition): boolean {
  if (def.faces === null || def.faces.length < 2) return true;
  return def.faces[0] === def.name;
}

/**
 * True for a definition that can legally appear in a decklist: a real card
 * (not a token), named by its front face. What the deck builder's pool and
 * the card-replacer's suggestions are drawn from.
 */
export function isDeckableCard(def: CardDefinition): boolean {
  return !isTokenCard(def) && isCardFront(def);
}
