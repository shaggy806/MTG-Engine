import { useEffect, useState } from 'react'
import type { CardDefinition, ObjectId, VisibleObject } from 'engine/client'
import { CardTile } from './CardTile.tsx'
import { defToVisible } from './defToVisible.ts'
import { requestCards, useCardData } from '../cards/cardData.ts'

/** The face a double-faced card isn't showing, as a tile of its printed
 * values — `null` for a one-faced card, and for an adventure, whose two
 * halves share one printed face, so there's nothing to turn over to. Also
 * `null` until both faces' definitions have loaded (`lookup` answers
 * `undefined` before then), so the turn-over button appears once they have. */
function otherFaceOf(
  obj: VisibleObject,
  lookup: (name: string) => CardDefinition | null | undefined,
): VisibleObject | null {
  if (!obj.faces || obj.faces.length < 2) return null
  const front = lookup(obj.faces[0])
  if (front === undefined || front?.adventure) return null
  const current = obj.faceName ?? obj.cardName
  const otherName = obj.faces.find((name) => name !== current)
  const other = otherName === undefined ? null : lookup(otherName)
  if (!other) return null
  // `defToVisible` titles a multi-face definition by its front face, so name
  // the face this is. A chosen printing names the whole card by id, so its
  // other face is the same id's other image — `faceIsBack` asks for that.
  const tile = { ...defToVisible(other, obj.art), faceName: other.name }
  return obj.art ? { ...tile, faceIsBack: !obj.faceIsBack } : tile
}

export interface ZoneViewerProps {
  readonly title: string
  readonly ids: readonly ObjectId[]
  /** Looks up each id's full face — `undefined` for one that's hidden from
   * this viewer (e.g. an opponent's unrevealed hand card), which renders as
   * a face-down placeholder instead of being silently dropped. */
  readonly resolve: (id: ObjectId) => VisibleObject | undefined
  /** Read-only mode (graveyard/exile browsing): omit `selection` and pass this. */
  readonly onClose?: () => void
  /** Cards in this zone that can be cast from here (Phase 6 flashback) — each
   * gets a "Cast" button. Ignored in `selection` mode. */
  readonly castable?: {
    readonly ids: readonly ObjectId[]
    readonly label: (id: ObjectId) => string
    readonly onCast: (id: ObjectId) => void
    /** When a card can be played from here more than one way (Muldrotha
     * offering an artifact creature as either type, a modal double-faced
     * card's two faces), a button per way, in place of the single one —
     * the choice stays explicit, so a bare click on the card does nothing. */
    readonly variants?: (id: ObjectId) => readonly { label: string; onChoose: () => void }[]
  }
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
    /** For a choice that can be backed out of — a cost being picked for a
     * cast not yet made (escape's "exile N other cards"), unlike an effect's
     * forced decision: a Cancel button in the header, which calls this. */
    readonly onCancel?: () => void
  }
  /** Selection mode only: hidden so the board can be seen ("View board").
   * The component stays mounted, so picks made so far survive; the owner
   * renders the way back (the decision strip's "Show choices"). */
  readonly collapsed?: boolean
  readonly onCollapse?: () => void
}

/**
 * A look at a set of cards — read-only for browsing a whole zone (graveyard/
 * exile today), or selectable for a bounded "choose from these" decision
 * (library-look/graveyard-search effects), so both share one component.
 *
 * A selection is a forced decision, so it has no close button — but it can be
 * collapsed ("View board") to check the board before choosing, the same
 * escape hatch `CreatureTypePicker` has. The exception is a cost being picked
 * for a cast (escape's exile), which `selection.onCancel` lets you back out of.
 */
export function ZoneViewer({
  title,
  ids,
  resolve,
  onClose,
  selection,
  castable,
  collapsed = false,
  onCollapse,
}: ZoneViewerProps) {
  const [picked, setPicked] = useState<readonly ObjectId[]>([])
  // Double-faced cards turned over to their other face, for reading it —
  // purely a view: casting or picking still acts on the card itself.
  const [flipped, setFlipped] = useState<ReadonlySet<ObjectId>>(() => new Set())
  const toggleFlip = (id: ObjectId) =>
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // Both faces of every double-faced card shown, for its turn-over button:
  // fetched as the viewer opens, from the shards those names are in
  // (`cards/cardData.ts`). Keyed by the names, not the array, so a re-render
  // showing the same cards doesn't ask again.
  const lookup = useCardData()
  const faceNames = ids
    .flatMap((id) => {
      const faces = resolve(id)?.faces
      return faces && faces.length > 1 ? faces : []
    })
    .join('\n')
  useEffect(() => {
    if (faceNames.length > 0) requestCards(faceNames.split('\n'))
  }, [faceNames])

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

  if (selection && collapsed) return null

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
            {title} ({ids.length})
          </h2>
          {selection ? (
            <span className="zone-viewer-head-actions">
              <span className="muted">
                choose {selection.min === selection.max
                  ? selection.min
                  : `${selection.min}-${selection.max}`}
                {' '}
                ({picked.length} picked)
              </span>
              {onCollapse ? (
                <button type="button" onClick={onCollapse}>
                  View board
                </button>
              ) : null}
              {selection.onCancel ? (
                <button type="button" onClick={selection.onCancel}>
                  Cancel
                </button>
              ) : null}
            </span>
          ) : (
            <button type="button" onClick={onClose}>
              Close
            </button>
          )}
        </div>
        <div className="zone-viewer-cards">
          {ids.map((id) => {
            const obj = resolve(id)
            if (!obj) {
              return <div key={id} className="card-back" title="face-down card" />
            }
            const isEligible = !selection || selection.eligible.includes(obj.id)
            const isPicked = picked.includes(obj.id)
            const castHere =
              !selection && castable && castable.ids.includes(obj.id) ? castable : null
            const variants = castHere?.variants?.(obj.id) ?? []
            const other = otherFaceOf(obj, lookup)
            const showOther = other !== null && flipped.has(obj.id)
            return (
              <div key={obj.id} className="zone-viewer-card">
                <CardTile
                  obj={showOther ? other : obj}
                  selected={isPicked}
                  highlight={(Boolean(selection) && isEligible && !isPicked) || Boolean(castHere)}
                  dimmed={Boolean(selection) && !isEligible}
                  badge={
                    obj.suspended
                      ? `⏳${obj.counters.time ?? 0}`
                      : obj.foretold
                        ? 'Foretold'
                        : undefined
                  }
                  onClick={
                    selection && isEligible
                      ? () => toggle(obj.id)
                      : castHere && variants.length <= 1
                        ? () => castHere.onCast(obj.id)
                        : undefined
                  }
                />
                {other ? (
                  <button
                    type="button"
                    className="zv-flip"
                    title={`Turn over — ${showOther ? (obj.faceName ?? obj.cardName) : other.cardName}`}
                    aria-label="Turn this card over"
                    onClick={() => toggleFlip(obj.id)}
                  >
                    ⇄
                  </button>
                ) : null}
                {castHere && variants.length > 1
                  ? variants.map((v, i) => (
                      <button key={i} type="button" onClick={v.onChoose}>
                        {v.label}
                      </button>
                    ))
                  : null}
                {castHere && variants.length <= 1 ? (
                  <button type="button" onClick={() => castHere.onCast(obj.id)}>
                    {castHere.label(obj.id)}
                  </button>
                ) : null}
              </div>
            )
          })}
          {ids.length === 0 ? <span className="muted">empty</span> : null}
        </div>
        {selection ? (
          <div className="zone-viewer-footer">
            <button
              type="button"
              disabled={!canConfirm}
              onClick={() => selection.onConfirm(picked)}
            >
              {picked.length === 0 && selection.min === 0
                ? 'Put none'
                : `Confirm (${picked.length})`}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
