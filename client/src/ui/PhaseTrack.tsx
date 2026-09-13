import type { PlayerView } from 'engine'

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

/**
 * A compact, at-a-glance pip row for the whole turn sequence — meant to sit
 * inline inside the top strip alongside the spelled-out "whose turn, what
 * phase" text (that text lives in the top strip itself now, not here, so
 * this can drop straight into a single-row layout without also carrying a
 * redundant "Turn N — Player" block).
 */
export function PhaseTrack({ view }: { readonly view: PlayerView }) {
  return (
    <ol className="phase-steps">
      {STEPS.map(([step, abbr]) => (
        <li key={step} className={step === view.turn.step ? 'current' : ''} title={step}>
          {abbr}
        </li>
      ))}
    </ol>
  )
}
