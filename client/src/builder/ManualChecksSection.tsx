import { useMemo, useState } from 'react'
import type { ScenarioSpec } from 'protocol'
import { MANUAL_CHECK_PRESETS } from './manualChecks.ts'
import { MANUAL_CHECK_ENTRIES } from './manualChecksDoc.ts'

/**
 * The scenario builder's "Manual checks" list: every entry of
 * docs/manual-checks.md, with its text and a button per board to load
 * (`manualChecks.ts`). Where you are and which you've ticked off are kept in
 * this browser only.
 */

const AT_KEY = 'mtg.builder.checkAt'
const DONE_KEY = 'mtg.builder.checksDone'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage blocked: the place and ticks just don't stick.
  }
}

export function ManualChecksSection({
  building,
  onLoad,
}: {
  readonly building: boolean
  readonly onLoad: (spec: ScenarioSpec) => void
}) {
  const entries = MANUAL_CHECK_ENTRIES
  const [at, setAtState] = useState(() => Math.min(Math.max(0, read(AT_KEY, 0)), entries.length - 1))
  const [done, setDoneState] = useState<readonly string[]>(() => read<string[]>(DONE_KEY, []))
  const sections = useMemo(() => {
    const out: { name: string; items: { index: number; title: string }[] }[] = []
    entries.forEach((e, index) => {
      const last = out.at(-1)
      if (last === undefined || last.name !== e.section) out.push({ name: e.section, items: [{ index, title: e.title }] })
      else last.items.push({ index, title: e.title })
    })
    return out
  }, [entries])

  if (entries.length === 0) return null
  const setAt = (i: number) => {
    const next = (i + entries.length) % entries.length
    setAtState(next)
    write(AT_KEY, next)
  }
  const entry = entries[at]
  const boards = MANUAL_CHECK_PRESETS.filter((p) => p.title === entry.title)
  const isDone = done.includes(entry.title)
  const toggleDone = () => {
    const next = isDone ? done.filter((t) => t !== entry.title) : [...done, entry.title]
    setDoneState(next)
    write(DONE_KEY, next)
  }
  const short = (title: string) => (title.length > 70 ? `${title.slice(0, 67)}…` : title)

  return (
    <details className="bp-checks" open>
      <summary>
        Manual checks <span className="bp-dim">{done.length} of {entries.length} checked</span>
      </summary>
      <div className="bp-row">
        <button type="button" className="bp-small" onClick={() => setAt(at - 1)} title="Previous entry">
          ◀
        </button>
        <select className="bp-grow" value={at} onChange={(e) => setAt(Number(e.target.value))} aria-label="Manual check">
          {sections.map((s) => (
            <optgroup key={s.name} label={s.name}>
              {s.items.map((item) => (
                <option key={item.index} value={item.index}>
                  {done.includes(item.title) ? '✓ ' : ''}
                  {short(item.title)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button type="button" className="bp-small" onClick={() => setAt(at + 1)} title="Next entry">
          ▶
        </button>
      </div>
      <p className="bp-check-title">{entry.title}</p>
      <div className="bp-check-boards">
        {boards.map((p, i) => (
          <button
            key={i}
            type="button"
            className={i === 0 ? 'bp-primary' : undefined}
            disabled={!building}
            title={building ? 'Build this board' : 'Go back to building first'}
            onClick={() => onLoad(p.spec)}
          >
            Load{boards.length > 1 || p.variant ? `: ${p.variant ?? 'board'}` : ' board'}
          </button>
        ))}
      </div>
      <div className="bp-check-text">
        {entry.paragraphs.map((para, i) => {
          const m = /^(Setup|Do|Check|Known limits):\s*/.exec(para)
          return (
            <p key={i}>
              {m ? <b>{m[1]}: </b> : null}
              {m ? para.slice(m[0].length) : <i>{para}</i>}
            </p>
          )
        })}
      </div>
      <label className="bp-row">
        <input type="checkbox" checked={isDone} onChange={toggleDone} /> Checked it
      </label>
    </details>
  )
}
