import type { BotSpeed } from 'protocol'

/** Slowest first, as the Settings panel's animation speeds are. */
export const BOT_SPEEDS: readonly { readonly speed: BotSpeed; readonly label: string }[] = [
  { speed: 'slow', label: 'Slow' },
  { speed: 'normal', label: 'Normal' },
  { speed: 'fast', label: 'Fast' },
]
