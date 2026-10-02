import { useLayoutEffect, useRef } from 'react'
import type { PlayerId, PlayerView } from 'engine/client'
import { STEPS, STOPPABLE_STEPS, toggleStop, usePassSettings } from '../game/passSettings.ts'

/**
 * A compact, at-a-glance pip row for the whole turn sequence — meant to sit
 * inline inside the top strip alongside the spelled-out "whose turn, what
 * phase" text (that text lives in the top strip itself now, not here, so
 * this can drop straight into a single-row layout without also carrying a
 * redundant "Turn N — Player" block).
 *
 * Each pip is also a switch: clicking one flags that step as a **stop**
 * (`game/passSettings.ts`), where the server holds your first priority window
 * whatever would pass it otherwise — "pass to main", "pass through combat",
 * Auto-pass, Pass Turn. Your own turns and everyone else's have separate
 * stops, and the row shows and edits whichever kind of turn this is. Untap
 * and cleanup can't be flagged: nobody gets priority in them.
 */
export function PhaseTrack({ view, seat }: { readonly view: PlayerView; readonly seat: PlayerId | null }) {
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
  const settings = usePassSettings()
  const mine = seat !== null && view.activePlayer === seat
  const stops = mine ? settings.stops.mine : settings.stops.theirs
  const whose = mine ? 'your turns' : "other players' turns"
  return (
    <ol className="phase-steps" ref={listRef}>
      {STEPS.map(([step, abbr, name]) => {
        const stoppable = seat !== null && STOPPABLE_STEPS.has(step)
        const stopped = stops.includes(step)
        return (
          <li key={step} className={`${step === view.turn.step ? 'current' : ''}${stopped ? ' stop' : ''}`}>
            <button
              type="button"
              className="phase-pip"
              disabled={!stoppable}
              aria-pressed={stoppable ? stopped : undefined}
              title={
                stoppable
                  ? `${name} — ${stopped ? 'a stop' : 'click to stop here'} on ${whose}`
                  : name
              }
              onClick={() => toggleStop(step, mine)}
            >
              {abbr}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
