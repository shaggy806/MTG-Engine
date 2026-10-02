import { useEffect, useRef, useState } from 'react'
import {
  ANIM_SCALES,
  CAST_ENTRANCES,
  setMotionSettings,
  useMotionPrefs,
} from '../game/motionPrefs.ts'
import type { AnimScale, CastEntrance } from '../game/motionPrefs.ts'
import { playSound } from '../game/sound.ts'
import { STEPS, setPassSettings, usePassSettings } from '../game/passSettings.ts'

const SPEED_LABEL: Record<AnimScale, string> = {
  0.5: 'Fast',
  1: 'Normal',
  1.5: 'Slow',
  2: 'Slowest',
}

const ENTRANCE_LABEL: Record<CastEntrance, string> = {
  rise: 'Rise',
  side: 'From player',
  fade: 'Fade',
}

/**
 * This viewer's own settings, in one "Settings" button in the top strip that
 * opens a small panel — the strip has no room for more. Two sections:
 *
 * - **Animations** (`motionPrefs.ts`): how long every animation lasts on this
 *   screen, and whether movement is turned off. Bot speed is the host's.
 * - **Priority** (`passSettings.ts`): "pass to main" and "pass through
 *   combat", and the stops flagged on the phase track (`PhaseTrack`), listed
 *   here for both kinds of turn since the track shows only the current one.
 */
export function MotionControl() {
  const prefs = useMotionPrefs()
  const pass = usePassSettings()
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  // Closes on a click anywhere else, or Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="motion-control" ref={boxRef}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Settings
      </button>
      {open ? (
        <div className="motion-panel" role="dialog" aria-label="Settings">
          <div className="motion-heading">Priority</div>
          <label className="motion-row">
            <input
              type="checkbox"
              checked={pass.passToMain}
              onChange={(e) => setPassSettings({ passToMain: e.target.checked })}
            />
            Pass to main — on my turn, pass upkeep and draw
          </label>
          <label className="motion-row">
            <input
              type="checkbox"
              checked={pass.passThroughCombat}
              onChange={(e) => setPassSettings({ passThroughCombat: e.target.checked })}
            />
            Pass through combat — still asked to attack and block
          </label>
          <div className="motion-note motion-wrap">
            Neither passes with something on the stack. Click a step in the bar above to make it a
            stop, where you keep priority whatever would pass it.
          </div>
          <StopList label="Stops on my turns" steps={pass.stops.mine} />
          <StopList label="Stops on others' turns" steps={pass.stops.theirs} />
          {pass.stops.mine.length + pass.stops.theirs.length > 0 ? (
            <div className="motion-row">
              <button type="button" onClick={() => setPassSettings({ stops: { mine: [], theirs: [] } })}>
                Clear stops
              </button>
            </div>
          ) : null}
          <div className="motion-heading">Animations</div>
          <div className="motion-row" role="group" aria-label="Animation speed">
            <span className="motion-label">Speed</span>
            {ANIM_SCALES.map((s) => (
              <button
                key={s}
                type="button"
                className={`motion-option${s === prefs.animScale ? ' active' : ''}`}
                aria-pressed={s === prefs.animScale}
                onClick={() => setMotionSettings({ animScale: s })}
              >
                {SPEED_LABEL[s]}
              </button>
            ))}
          </div>
          <div className="motion-row" role="group" aria-label="Played card entrance">
            <span className="motion-label">Card entrance</span>
            {CAST_ENTRANCES.map((e) => (
              <button
                key={e}
                type="button"
                className={`motion-option${e === prefs.castEntrance ? ' active' : ''}`}
                aria-pressed={e === prefs.castEntrance}
                onClick={() => setMotionSettings({ castEntrance: e })}
              >
                {ENTRANCE_LABEL[e]}
              </button>
            ))}
          </div>
          <label className="motion-row">
            <input
              type="checkbox"
              checked={prefs.reduced}
              // The browser's own preference can't be switched off from here.
              disabled={prefs.reduced && !prefs.reduceMotion}
              onChange={(e) => setMotionSettings({ reduceMotion: e.target.checked })}
            />
            Reduce motion
            {prefs.reduced && !prefs.reduceMotion ? (
              <span className="motion-note">(set by your system)</span>
            ) : null}
          </label>
          <label className="motion-row">
            <input
              type="checkbox"
              checked={prefs.sound}
              onChange={(e) => {
                setMotionSettings({ sound: e.target.checked })
                // A sample, which is also the click a browser wants before
                // it will play any sound at all.
                if (e.target.checked) playSound('cast')
              }}
            />
            Sound effects
          </label>
        </div>
      ) : null}
    </div>
  )
}

/** One kind of turn's stops, by name, in turn order. */
function StopList({ label, steps }: { readonly label: string; readonly steps: readonly string[] }) {
  const names = STEPS.filter(([step]) => steps.includes(step)).map(([, abbr]) => abbr)
  return (
    <div className="motion-row">
      <span className="motion-label">{label}</span>
      <span>{names.length > 0 ? names.join(', ') : 'none'}</span>
    </div>
  )
}
