/**
 * Commander-format deck validation (rule 903 — ROADMAP Phase 9). Pure and
 * synchronous: it only checks cards the engine already implements (an
 * unimplemented card is reported by the server's `/import-deck` feasibility
 * audit, not here). Returns a flat list of human-readable violations.
 *
 * Lives in the engine (not the server, where it originated) because it's
 * pure logic over `CardRegistry` data with no I/O — the client's deck
 * builder needs the exact same rules, synchronously, with no network round-
 * trip, so duplicating this between client and server would just invite
 * drift.
 */

import { colorIdentityOf, identityString, withinIdentity } from "./identity.js";
import type { Color } from "./mana.js";
import type { CardRegistry } from "./cards.js";

export interface DeckToValidate {
  /** One or two commander card names (two = Partner / Background). */
  readonly commanders: readonly string[];
  /** Every other card in the 99, by name (repeats allowed for basics). */
  readonly cards: readonly string[];
  /** Total deck size the format wants, including commanders (100 for
   * Commander). */
  readonly size?: number;
}

export interface DeckValidationResult {
  readonly legal: boolean;
  readonly violations: readonly string[];
  /** The combined colour identity of the commander(s), as a WUBRG string. */
  readonly identity: string;
}

/** Names exempt from the singleton rule — the deck builder uses this too, to
 * decide whether its "+1 copy" control should go past 1. */
export const BASIC_LANDS: ReadonlySet<string> = new Set([
  "Plains",
  "Island",
  "Swamp",
  "Mountain",
  "Forest",
  "Wastes",
  "Snow-Covered Plains",
  "Snow-Covered Island",
  "Snow-Covered Swamp",
  "Snow-Covered Mountain",
  "Snow-Covered Forest",
]);

export function validateCommanderDeck(
  deck: DeckToValidate,
  registry: CardRegistry,
): DeckValidationResult {
  const violations: string[] = [];
  const size = deck.size ?? 100;

  // --- commanders --------------------------------------------------------
  if (deck.commanders.length < 1 || deck.commanders.length > 2) {
    violations.push(`a Commander deck has 1 or 2 commanders, this has ${deck.commanders.length}`);
  }
  const commanderIdentity = new Set<Color>();
  for (const name of deck.commanders) {
    if (!registry.has(name)) {
      violations.push(`commander "${name}" is not implemented`);
      continue;
    }
    const def = registry.get(name);
    const isLegendaryCreature =
      def.supertypes.includes("legendary") &&
      (def.types.includes("creature") || def.types.includes("planeswalker"));
    if (!isLegendaryCreature) {
      violations.push(`"${name}" can't be a commander (not a legendary creature)`);
    }
    for (const c of colorIdentityOf(def)) commanderIdentity.add(c);
  }
  if (deck.commanders.length === 2) {
    const anyPartner = deck.commanders.some(
      (n) => registry.has(n) && /\bpartner\b/i.test(registry.get(n).text),
    );
    if (!anyPartner) {
      violations.push("two commanders require Partner (or a Background)");
    }
  }

  // --- the 99 ----------------------------------------------------------
  const counts = new Map<string, number>();
  for (const name of deck.cards) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  for (const [name, n] of counts) {
    if (!registry.has(name)) continue; // feasibility audit's job, not ours
    if (n > 1 && !BASIC_LANDS.has(name)) {
      violations.push(`${n}× "${name}" — singleton format allows only 1`);
    }
    if (!withinIdentity(colorIdentityOf(registry.get(name)), commanderIdentity)) {
      violations.push(
        `"${name}" is outside the commander's colour identity (${identityString(commanderIdentity) || "colourless"})`,
      );
    }
  }

  const total = deck.commanders.length + deck.cards.length;
  if (total !== size) {
    violations.push(`deck has ${total} cards, the format wants ${size}`);
  }

  return {
    legal: violations.length === 0,
    violations,
    identity: identityString(commanderIdentity),
  };
}
