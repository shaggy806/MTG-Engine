import type { LegalAction } from 'engine/client'

const NONE: readonly LegalAction[] = []

/**
 * What the table may show and act on (`GameScreen` hands it to `Table`).
 * Nothing while a bot plays this seat, whose answers the server makes. While a
 * frame plays out (`busy`), nothing either — those actions belong to a board
 * the player can't see yet, and the server holds its bots to the same rule —
 * except the mulligan, which stays up (its buttons locked) so an opponent's
 * shuffle, or your own hand going back and the new one dealt into it, doesn't
 * take the whole popup away and bring it back. Only while the newest frame
 * (`latest`) still asks it: a mulligan already answered isn't held up.
 */
export function tableActions(
  shown: readonly LegalAction[],
  latest: readonly LegalAction[],
  busy: boolean,
  botPlaying: boolean,
): readonly LegalAction[] {
  if (botPlaying) return NONE
  if (!busy) return shown
  if (!latest.some((a) => a.kind === 'mulligan')) return NONE
  const mulligan = shown.filter((a) => a.kind === 'mulligan')
  return mulligan.length > 0 ? mulligan : NONE
}
