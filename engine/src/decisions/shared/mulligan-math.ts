/**
 * How many cards a mulligan costs — the one copy.
 *
 * Under the London mulligan you draw a fresh seven each time and put `taken`
 * cards on the bottom when you finally keep. The traditional Commander rule
 * (`GameRules.freeFirstMulligan`) waives the first one, so what is owed can
 * be one less than the number taken.
 *
 * This was written out three times — `Game.mulliganCardsOwed`, an inline
 * `const free = … ? 1 : 0` in `controller.ts`, and inside
 * `bot/mulligan.ts`'s `keptHandSize` — each with a comment saying it mirrored
 * one of the others. Three independent restatements of a two-line rule, all
 * of which had noticed they were copies.
 */

/** Cards owed to the bottom of the library by `taken` mulligans. */
export function mulliganCardsOwed(taken: number, freeFirstMulligan: boolean): number {
  return Math.max(0, taken - (freeFirstMulligan ? 1 : 0));
}
