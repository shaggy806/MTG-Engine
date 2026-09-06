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
    if (!selection) return
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
          {cards.map((obj) => (
            <CardTile
              key={obj.id}
              obj={obj}
              selected={picked.includes(obj.id)}
              highlight={Boolean(selection) && !picked.includes(obj.id)}
              onClick={selection ? () => toggle(obj.id) : undefined}
            />
          ))}
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
