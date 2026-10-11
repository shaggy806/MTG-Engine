import type { PlayerView } from 'engine/client'
import { STEP_LABEL, playerLabel, seatClassOf } from '../format.ts'
import type { SeatStatus } from 'protocol'
import { StableLabel } from './StableLabel.tsx'

/**
 * A large, unambiguous "whose turn, what phase" readout — the compact
 * `PhaseTrack` pips stay for an at-a-glance map of the whole turn, but this
 * spells both out in full, in the active player's own color. It leads with
 * the round (`TurnState.round`): at a four-player table "turn 37" reads as a
 * much longer game than round 10 does.
 */
export function TurnBanner({
  view,
  seats,
}: {
  readonly view: PlayerView
  readonly seats?: readonly SeatStatus[]
}) {
  const seatClass = seatClassOf(view.turnOrder, view.activePlayer)
  return (
    <div className={`turn-banner ${seatClass}`}>
      {view.turn.round !== undefined ? (
        <>
          <span
            className="turn-banner-round"
            title={`Round ${view.turn.round}: each player's turn once is a round (turn ${view.turn.number} of the game)`}
          >
            <span className="turn-banner-round-long">Round </span>
            <span className="turn-banner-round-short">R</span>
            {view.turn.round}
          </span>
          <span className="turn-banner-sep">·</span>
        </>
      ) : null}
      {/* Each as wide as the widest it can say -- any seat's name, any step:
          the phase pips start where this ends, and slid along with every
          step (the user's ask, 2026-10-10). */}
      <span className="turn-banner-player">
        <StableLabel widest={view.turnOrder.map((p) => `${playerLabel(p, seats)}'s Turn`)}>
          {playerLabel(view.activePlayer, seats)}'s Turn{view.turn.isExtra ? ' (extra)' : ''}
        </StableLabel>
      </span>
      <span className="turn-banner-sep">·</span>
      <span className="turn-banner-phase">
        <StableLabel widest={Object.values(STEP_LABEL)}>{STEP_LABEL[view.turn.step]}</StableLabel>
      </span>
      {view.dayNight !== null ? (
        <>
          <span className="turn-banner-sep">·</span>
          <span className="turn-banner-daynight" title={`It is ${view.dayNight} (rule 726)`}>
            {view.dayNight === 'day' ? '☀ Day' : '☾ Night'}
          </span>
        </>
      ) : null}
    </div>
  )
}
