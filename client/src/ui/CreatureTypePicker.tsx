import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

export interface CreatureTypePickerProps {
  /** What is asking — "Crippling Fear", "Urza's Incubator". */
  readonly sourceName: string
  /** Every creature type the rules allow (rule 205.3m), alphabetical. */
  readonly options: readonly string[]
  /** The chooser's most common types across their own cards and the board,
   * most common first — the engine computes these, since only it can see
   * the chooser's library. */
  readonly suggested: readonly string[]
  readonly onPick: (creatureType: string) => void
  /** Hidden so the board can be seen ("View board"); stays mounted, so the
   * search survives. The owner renders the way back. */
  readonly collapsed: boolean
  readonly onCollapse: () => void
}

/**
 * Types matching `query`, best first: names that *start* with it ahead of
 * names that merely contain it, each group kept alphabetical. An empty query
 * is the whole list.
 */
function rank(options: readonly string[], query: string): readonly string[] {
  const q = query.trim().toLowerCase()
  if (q === '') return options
  const starts: string[] = []
  const contains: string[] = []
  for (const t of options) {
    const lower = t.toLowerCase()
    if (lower.startsWith(q)) starts.push(t)
    else if (lower.includes(q)) contains.push(t)
  }
  return [...starts, ...contains]
}

/**
 * "Choose a creature type" over all ~350 of them: suggested types as one-click
 * chips, then a search box over the whole catalog.
 *
 * A mandatory decision, so there's no close button — but it can be collapsed
 * to look at the board first, since which type to name (Crippling
 * Fear sparing it, Distant Melody drawing off it) usually depends on what's in
 * play.
 */
export function CreatureTypePicker({
  sourceName,
  options,
  suggested,
  onPick,
  collapsed,
  onCollapse,
}: CreatureTypePickerProps) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => rank(options, query), [options, query])

  useEffect(() => {
    if (!collapsed) inputRef.current?.focus()
  }, [collapsed])

  // Keep the keyboard highlight in view as it moves.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (collapsed) return null

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const pick = results[active]
      if (pick !== undefined) onPick(pick)
    }
  }

  return (
    <div className="zone-viewer-overlay ctype-overlay">
      <div className="zone-viewer-box ctype-box" role="dialog" aria-label="Choose a creature type">
        <div className="zone-viewer-head">
          <h2>{sourceName} — choose a creature type</h2>
          <button type="button" onClick={onCollapse}>
            View board
          </button>
        </div>

        {suggested.length > 0 ? (
          <div className="ctype-section">
            <span className="ctype-label">In your deck and on the board</span>
            <div className="ctype-chips">
              {suggested.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="ctype-chip"
                  onClick={() => onPick(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="ctype-section">
          <input
            ref={inputRef}
            className="ctype-search"
            type="search"
            placeholder={`Search all ${options.length} creature types`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              // Typing resets the highlight to the best match.
              setActive(0)
            }}
            onKeyDown={onKeyDown}
            aria-label="Search creature types"
            aria-controls="ctype-results"
          />
          <span className="ctype-label">
            {query.trim() === ''
              ? `${options.length} types`
              : results.length === 0
                ? 'No creature type matches'
                : `${results.length} match${results.length === 1 ? '' : 'es'} — Enter picks the highlighted one`}
          </span>
        </div>

        <div id="ctype-results" className="ctype-results" ref={listRef} role="listbox">
          {results.map((t, i) => (
            <button
              key={t}
              type="button"
              role="option"
              aria-selected={i === active}
              data-index={i}
              className={`ctype-result${i === active ? ' ctype-result--active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => onPick(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
