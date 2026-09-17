import type { ReplacementOption } from '../net/protocol.ts'

/** How a stand-in's match strength reads — the server's confidence, from
 * how many of the original's oracle tags the two share. */
export const CONFIDENCE_LABEL: Record<ReplacementOption['confidence'], string> = {
  high: 'Close match',
  medium: 'Partial match',
  low: 'Loose match',
}

/** A tag slug as a phrase: "removal-creature" → "removal creature". */
export const tagLabel = (slug: string): string => slug.replace(/-/g, ' ')
