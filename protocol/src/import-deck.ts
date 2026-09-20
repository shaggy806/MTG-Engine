/**
 * The `POST /import-deck` contract — a plain HTTP route, deliberately not
 * part of the room protocol in `room.ts`: importing a decklist is stateless
 * and has nothing to do with a room, a seat or a `Game`.
 *
 * The endpoint answers with **newline-delimited JSON, not one object**:
 * `progress` lines as the server resolves the list (cards the engine already
 * implements land at once, then one line per batched Scryfall lookup),
 * followed by exactly one terminal `result` or `error` line. That shape is
 * what lets the deck builder's import panel draw a live progress bar instead
 * of sitting silent for a second or two.
 */

import type { DeckValidationResult, ReplacementConfidence } from "engine";

/** The `(SET) collector-number` suffix a decklist line can carry, naming one
 * specific printing of a card. */
export interface PrintingRef {
  readonly set: string;
  readonly collectorNumber: string;
}

/** One suggested stand-in for a card the engine doesn't implement — see
 * `engine`'s `suggestReplacements`. */
export interface ReplacementOption {
  readonly name: string;
  /** How well it covers what the original does, judged on shared Scryfall
   * Tagger oracle tags (`"low"` when the original has none to go on). */
  readonly confidence: ReplacementConfidence;
  /** Oracle tags both cards carry, most telling first. */
  readonly sharedTags: readonly string[];
}

/** One card's row in the import report. The server builds these as
 * `CardReportEntry` (see `server/src/import-deck.ts`, where the name stays
 * because they're also the audit's own working type) and the deck builder
 * reads them back verbatim. */
export interface ImportedCardReport {
  readonly name: string;
  readonly count: number;
  /** The printing the pasted line named, when it named one. Resolved to
   * {@link ImportedCardReport.printingId} server-side. */
  readonly printing?: PrintingRef;
  /** Already has a matching `CardDefinition` in the engine's registry. */
  readonly implemented: boolean;
  /** Whether any characteristics data (local or Scryfall) was found to show. */
  readonly found: boolean;
  readonly manaCost: string | null;
  readonly typeLine: string;
  readonly oracleText: string;
  /** The stand-in the import uses for this card: `replacements[0]`, or
   * `null` when `implemented` (nothing to replace) or nothing is a sensible
   * match. */
  readonly suggestedReplacement: string | null;
  /** Up to three stand-ins, best first, chosen for *this* deck: inside its
   * commander's colour identity, never a card the list already has, and
   * never another card's first choice — so taking every first choice can't
   * break singleton. */
  readonly replacements: readonly ReplacementOption[];
  /** The Scryfall card id of the printing this line named, so an imported
   * deck keeps the art it was exported with. Only ever filled for an
   * `implemented` card — an unimplemented one is either dropped or stood in
   * for by a *different* card, whose art this printing says nothing about. */
  readonly printingId: string | null;
}

/** `engine`'s `DeckValidationResult` plus the commander the import settled
 * on (named in a `Commander` section, or guessed) — the `format` field of
 * the terminal `result` line. */
export type DeckFormatReport = DeckValidationResult & {
  readonly commander: string | null;
};

/** One newline-delimited JSON line of a `POST /import-deck` response. */
export type ImportDeckLine =
  | {
      readonly type: "progress";
      readonly done: number;
      readonly total: number;
      /** The last card accounted for; `null` when nothing specific. */
      readonly name: string | null;
    }
  | {
      readonly type: "result";
      readonly cards: readonly ImportedCardReport[];
      readonly format: DeckFormatReport;
    }
  | { readonly type: "error"; readonly error: string };
