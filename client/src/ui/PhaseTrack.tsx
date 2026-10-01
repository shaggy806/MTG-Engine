import { useLayoutEffect, useRef } from 'react'
import type { PlayerView } from 'engine/client'

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
  // On a narrow strip the row scrolls sideways, and the current step mustn't
  // be the one scrolled out of sight — late in the turn (END, CU) it was the
  // first to go. Scrolls the row itself only, never the page.
  const listRef = useRef<HTMLOListElement>(null)
  useLayoutEffect(() => {
    const list = listRef.current
    const current = list?.querySelector<HTMLElement>('li.current')
    if (!list || !current) return
    const left = current.offsetLeft - list.offsetLeft
    if (left < list.scrollLeft) list.scrollLeft = left
    else if (left + current.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollLeft = left + current.offsetWidth - list.clientWidth
    }
  }, [view.turn.step])
  return (
    <ol className="phase-steps" ref={listRef}>
      {STEPS.map(([step, abbr]) => (
        <li key={step} className={step === view.turn.step ? 'current' : ''} title={step}>
          {abbr}
        </li>
      ))}
    </ol>
  )
}
