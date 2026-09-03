import type { PlayerView } from 'engine'
import { playerLabel } from '../format.ts'

const STEPS = [
  ['untap', 'UT'],
  ['upkeep', 'UP'],
  ['draw', 'DR'],
  ['precombat-main', 'M1'],
  ['begin-combat', 'BC'],
  ['declare-attackers', 'DA'],
  ['declare-blockers', 'DB'],
  ['combat-damage', 'CD'],
  ['end-combat', 'EC'],
  ['postcombat-main', 'M2'],
  ['end', 'END'],
  ['cleanup', 'CU'],
] as const

export function PhaseTrack({ view }: { readonly view: PlayerView }) {
  return (
    <div className="phase-track">
      <div className="phase-turn">
        Turn {view.turn.number}
        <span className="phase-active">{playerLabel(view.activePlayer)}</span>
      </div>
      <ol className="phase-steps">
        {STEPS.map(([step, abbr]) => (
          <li
            key={step}
            className={step === view.turn.step ? 'current' : ''}
            title={step}
          >
            {abbr}
          </li>
        ))}
      </ol>
    </div>
  )
}
