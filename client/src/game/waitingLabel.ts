import type { PlayerId, PlayerView } from 'engine/client'

/** What a seat is doing while the game waits on its decision, as the line on
 * its panel says it ("scrying…"). Every decision kind has one. */
const DOING: Record<NonNullable<PlayerView['awaiting']>['kind'], string> = {
  attackers: 'declaring attackers',
  blockers: 'declaring blockers',
  discard: 'discarding',
  'choose-from-zone': 'looking at cards',
  mulligan: 'deciding on a mulligan',
  'commander-replacement': 'moving their commander',
  'pay-life-for-untapped': 'deciding on a shock land',
  'reveal-for-untapped': 'deciding on a reveal land',
  'choose-copy': 'choosing what to copy',
  'choose-enchant': 'choosing what to enchant',
  'legend-rule': 'choosing a legend to keep',
  'order-triggers': 'ordering triggers',
  'choose-text': 'changing a text',
  'choose-creature-type': 'naming a creature type',
  'choose-modes': 'choosing a mode',
  'choose-targets': 'targeting',
  'cast-now': 'deciding whether to cast',
  'assign-combat-damage': 'assigning combat damage',
  sacrifice: 'choosing a sacrifice',
  proliferate: 'proliferating',
  'choose-permanents': 'choosing permanents',
  'enter-attacking': 'choosing what to attack',
  scry: 'scrying',
}

/**
 * The line on `player`'s panel while the game waits on them (never your own
 * seat: your own turn to act is the decision banner's). A pending decision
 * says what it is; holding priority over someone else's spell or ability is
 * "responding"; anything else is a bot "thinking" or a player "deciding".
 */
export function waitingLabel(view: PlayerView, player: PlayerId, bot: boolean): string {
  const awaiting = view.awaiting
  if (awaiting !== null && awaiting.player === player) return DOING[awaiting.kind]
  const top = view.zones.stack.at(-1)
  if (top !== undefined && view.objects[top]?.controller !== player) return 'responding'
  return bot ? 'thinking' : 'deciding'
}
