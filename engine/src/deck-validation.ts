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
import { isCardFront, isTokenCard } from "./cards/classify.js";
import type { Color } from "./mana.js";
import type { CardDefinition, CardRegistry } from "./cards.js";

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

/**
 * A deck's commanders, whichever field names them: `commanders` if set, else
 * the lone `commander`. The precedence `DeckList` documents, and the one a
 * wire deck from a client that predates two-commander decks relies on.
 */
export function commandersOf(deck: {
  readonly commanders?: readonly string[];
  readonly commander?: string;
}): readonly string[] {
  if (deck.commanders !== undefined) return deck.commanders;
  return deck.commander === undefined ? [] : [deck.commander];
}

/**
 * Whether `def` may be a deck's commander on its own (rule 903.3): a
 * legendary creature — or a planeswalker, which the engine lets command
 * without asking for the "can be your commander" line. A Background isn't
 * one: it commands only as the second half of a pair ({@link isBackground}).
 */
export function canCommandAlone(def: CardDefinition): boolean {
  return (
    def.supertypes.includes("legendary") &&
    (def.types.includes("creature") || def.types.includes("planeswalker"))
  );
}

/** A legendary Background enchantment — the second commander a "Choose a
 * Background" commander may have (rule 702.124). */
export function isBackground(def: CardDefinition): boolean {
  return (
    def.supertypes.includes("legendary") &&
    def.types.includes("enchantment") &&
    def.subtypes.includes("Background")
  );
}

/** A legendary Time Lord Doctor creature with no other creature types — what
 * "Doctor's companion" pairs with (rule 702.124). */
function isLoneDoctor(def: CardDefinition): boolean {
  return (
    def.supertypes.includes("legendary") &&
    def.types.includes("creature") &&
    def.subtypes.length === 2 &&
    def.subtypes.includes("Time Lord") &&
    def.subtypes.includes("Doctor")
  );
}

/** How a pairing reads in a violation — the ability as printed. */
function pairingName(def: CardDefinition): string {
  const p = def.pairing;
  if (p === null) return "no partner ability";
  switch (p.kind) {
    case "partner":
      return "Partner";
    case "partner-with":
      return `Partner with ${p.name}`;
    case "partner-group":
      return `Partner—${p.group}`;
    case "choose-a-background":
      return "Choose a Background";
    case "doctors-companion":
      return "Doctor's companion";
  }
}

/** Does `a`'s pairing ability, on its own, let `b` be its partner? The
 * one-directional half of {@link pairingProblem}. */
function pairsWith(a: CardDefinition, b: CardDefinition): boolean {
  const p = a.pairing;
  const q = b.pairing;
  if (p === null) return false;
  switch (p.kind) {
    case "partner":
      return q?.kind === "partner";
    case "partner-with":
      return q?.kind === "partner-with" && p.name === b.name && q.name === a.name;
    case "partner-group":
      return q?.kind === "partner-group" && q.group === p.group;
    case "choose-a-background":
      return isBackground(b);
    case "doctors-companion":
      return isLoneDoctor(b);
  }
}

/**
 * Why `a` and `b` can't be one deck's two commanders, or `null` if they can
 * (rule 702.124). Every partner-family ability pairs only with its own kind:
 * two plain Partners, two "Partner with"s that name each other, two
 * "Partner—[text]"s with the same text, a "Choose a Background" commander and
 * a Background, a "Doctor's companion" and a Time Lord Doctor. The check
 * {@link validateCommanderDeck} applies, shared (as {@link canPairCommanders})
 * so the deck builder's commander toggle makes the same call.
 */
export function pairingProblem(registry: CardRegistry, a: string, b: string): string | null {
  const cant = `"${a}" and "${b}" can't be paired`;
  if (!registry.has(a) || !registry.has(b)) return `${cant}: not implemented`;
  if (a === b) return `${cant}: a deck can't have two copies of one commander`;
  const da = registry.get(a);
  const db = registry.get(b);
  if (pairsWith(da, db) || pairsWith(db, da)) return null;
  const pa = da.pairing;
  const pb = db.pairing;
  for (const [self, other, p] of [
    [a, b, pa],
    [b, a, pb],
  ] as const) {
    if (p?.kind !== "partner-with") continue;
    return p.name === other
      ? `${cant}: "${other}" doesn't have "Partner with ${self}"`
      : `${cant}: "${self}" can only be paired with "${p.name}"`;
  }
  if (pa?.kind === "choose-a-background") return `${cant}: "${a}" can only be paired with a Background`;
  if (pb?.kind === "choose-a-background") return `${cant}: "${b}" can only be paired with a Background`;
  if (pa?.kind === "doctors-companion") return `${cant}: "${a}" can only be paired with a Time Lord Doctor`;
  if (pb?.kind === "doctors-companion") return `${cant}: "${b}" can only be paired with a Time Lord Doctor`;
  if (isBackground(da) || isBackground(db)) {
    return `${cant}: a Background needs a commander with "Choose a Background"`;
  }
  if (pa !== null && pb !== null) {
    // Both have one, and not the same one (rule 702.124: different partner
    // abilities can't be combined).
    return `${cant}: ${pairingName(da)} and ${pairingName(db)} don't combine`;
  }
  return `${cant}: both commanders need Partner`;
}

/** Whether `a` and `b` may be one deck's two commanders — see
 * {@link pairingProblem}. */
export function canPairCommanders(registry: CardRegistry, a: string, b: string): boolean {
  return pairingProblem(registry, a, b) === null;
}

/** Whether `name` has a partner-family ability — any of them — and so could
 * take a second commander, given the right one ({@link canPairCommanders}). */
export function hasPartner(registry: CardRegistry, name: string): boolean {
  return registry.has(name) && registry.get(name).pairing !== null;
}

/**
 * Why `name` can't be a decklist entry at all, or `null` if it can. Tokens
 * aren't cards (rule 111.1), and a multi-face card is deck-listed under its
 * front face only (rule 712.3) — both are registered definitions, so without
 * this they'd pass every other check here silently.
 */
function notACardReason(name: string, def: CardDefinition): string | null {
  if (isTokenCard(def)) return `"${name}" is a token, not a card`;
  if (!isCardFront(def)) {
    return `"${name}" is the back face of ${def.faces?.[0] ?? "another card"} — list the front face instead`;
  }
  return null;
}

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
  const paired = deck.commanders.length === 2;
  for (const name of deck.commanders) {
    if (!registry.has(name)) {
      violations.push(`commander "${name}" is not implemented`);
      continue;
    }
    const def = registry.get(name);
    const notACard = notACardReason(name, def);
    if (notACard !== null) violations.push(notACard);
    if (isBackground(def)) {
      // A Background commands only beside a "Choose a Background" commander;
      // a pair that isn't one is reported by the pairing check below.
      if (!paired) {
        violations.push(
          `"${name}" can't be a commander on its own (a Background needs a commander with "Choose a Background")`,
        );
      }
    } else if (!canCommandAlone(def)) {
      violations.push(`"${name}" can't be a commander (not a legendary creature)`);
    }
    // A pair's colour identity is the union of both (rule 903.4).
    for (const c of colorIdentityOf(def)) commanderIdentity.add(c);
  }
  // An unimplemented commander is already a violation above, and whether it
  // can pair is exactly what the registry can't say.
  const [first, second] = deck.commanders;
  if (paired && registry.has(first) && registry.has(second)) {
    const problem = pairingProblem(registry, first, second);
    if (problem !== null) violations.push(problem);
  }

  // --- the 99 ----------------------------------------------------------
  const counts = new Map<string, number>();
  for (const name of deck.cards) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  for (const [name, n] of counts) {
    if (!registry.has(name)) continue; // feasibility audit's job, not ours
    const notACard = notACardReason(name, registry.get(name));
    if (notACard !== null) violations.push(notACard);
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
