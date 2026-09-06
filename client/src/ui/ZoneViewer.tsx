import { useState } from 'react'
import type { ObjectId, VisibleObject } from 'engine'
import { CardTile } from './CardTile.tsx'

export interface ZoneViewerProps {
  readonly title: string
  readonly cards: readonly VisibleObject[]
  /** Read-only mode (graveyard/exile browsing): omit `selection` and pass this. */
  readonly onClose?: () => void
  /** Turns this into a forced "choose between min and max of these" decision
   * (a `choose-from-zone` effect, e.g. looking at the top of your library) —
   * no close button, just a pick-then-confirm footer. */
  readonly selection?: {
    readonly min: number
    readonly max: number
    /** The subset of `cards` that can actually be picked — narrower than
     * `cards` when the effect restricts the choice (e.g. only a Dragon
     * card). Everything in `cards` still renders at full size either way;
     * this only decides which tiles respond to a click. */
    readonly eligible: readonly ObjectId[]
    readonly onConfirm: (chosen: readonly ObjectId[]) => void
  }
}

/**
 * A look at a set of cards — read-only for browsing a whole zone (graveyard/
 * exile today), or selectable for a bounded "choose from these" decision
 * (library-look/graveyard-search effects), so both share one component.
 */
export function ZoneViewer({ title, cards, onClose, selection }: ZoneViewerProps) {
  const [picked, setPicked] = useState<readonly ObjectId[]>([])

  const toggle = (id: ObjectId) => {
    if (!selection || !selection.eligible.includes(id)) return
    setPicked((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id)
      if (cur.length >= selection.max) return cur
      return [...cur, id]
    })
  }

  const canConfirm =
    selection !== undefined && picked.length >= selection.min && picked.length <= selection.max

  return (
    <div className="zone-viewer-overlay" onClick={selection ? undefined : onClose}>
      <div
        className="zone-viewer-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <div className="zone-viewer-head">
          <h2>
            {title} ({cards.length})
          </h2>
          {selection ? (
            <span className="muted">
              choose {selection.min === selection.max
                ? selection.min
                : `${selection.min}-${selection.max}`}
              {' '}
              ({picked.length} picked)
            </span>
          ) : (
            <button type="button" onClick={onClose}>
              Close
            </button>
          )}
        </div>
        <div className="zone-viewer-cards">
          {cards.map((obj) => {
            const isEligible = !selection || selection.eligible.includes(obj.id)
            const isPicked = picked.includes(obj.id)
            return (
              <CardTile
                key={obj.id}
                obj={obj}
                selected={isPicked}
                highlight={Boolean(selection) && isEligible && !isPicked}
                dimmed={Boolean(selection) && !isEligible}
                onClick={isEligible ? () => toggle(obj.id) : undefined}
              />
            )
          })}
          {cards.length === 0 ? <span className="muted">empty</span> : null}
        </div>
        {selection ? (
          <div className="zone-viewer-footer">
            <button
              type="button"
              disabled={!canConfirm}
              onClick={() => selection.onConfirm(picked)}
            >
              {picked.length === 0 ? 'Put none' : `Confirm (${picked.length})`}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
