import type { PlayerView } from 'engine'
import { STEP_LABEL, playerLabel, seatClassOf } from '../format.ts'

/**
 * A large, unambiguous "whose turn, what phase" readout — the compact
 * `PhaseTrack` pips stay for an at-a-glance map of the whole turn, but this
 * spells both out in full, in the active player's own color.
 */
export function TurnBanner({ view }: { readonly view: PlayerView }) {
  const seatClass = seatClassOf(view.turnOrder, view.activePlayer)
  return (
    <div className={`turn-banner ${seatClass}`}>
      <span className="turn-banner-player">{playerLabel(view.activePlayer)}'s Turn</span>
      <span className="turn-banner-sep">·</span>
      <span className="turn-banner-phase">{STEP_LABEL[view.turn.step]}</span>
    </div>
  )
}
