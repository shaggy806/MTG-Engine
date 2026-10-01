/**
 * Dragging your own permanents into the order you want them (`boardOrder.ts`
 * has the ordering itself). Lives in `GameScreen`, not `Table`: `Table`
 * remounts every frame, and a bot's move landing mid-drag would drop the tile
 * out of your hand. So the drag reads the board from the DOM each time it
 * needs it — `[data-drag-row]` rows of `.board-entry[data-obj-ids]` tiles,
 * whichever `Table` drew them — and its listeners sit on `window`.
 *
 * A press only becomes a drag once the pointer has moved a few pixels, so a
 * click on a tile still does what it always did; the click that ends a real
 * drag is swallowed.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { ObjectId } from 'engine/client'
import { moveInRow, type BoardOrder } from './boardOrder.ts'

/** How far (in CSS pixels) a press must travel before it's a drag. */
const DRAG_THRESHOLD = 6

export interface BoardDrag {
  /** One of the dragged tile's ids — it may be a stack whose ids change. */
  readonly key: ObjectId
  /** How far the tile has been dragged from where it was picked up. */
  readonly dx: number
  readonly dy: number
  /** The tile it would be dropped beside, and on which side. */
  readonly drop: { readonly key: ObjectId; readonly after: boolean } | null
}

export interface BoardDragControls {
  readonly order: BoardOrder
  readonly drag: BoardDrag | null
  /** `onPointerDown` for one of your own tiles. */
  readonly start: (e: ReactPointerEvent, key: ObjectId) => void
}

const storageKey = (roomId: string | null): string => `mtg-engine:board-order:${roomId}`

function loadOrder(roomId: string | null): BoardOrder {
  if (roomId === null) return []
  try {
    const raw = window.sessionStorage.getItem(storageKey(roomId))
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed.filter((x) => typeof x === 'string') as ObjectId[]) : []
  } catch {
    return []
  }
}

function saveOrder(roomId: string | null, order: BoardOrder): void {
  if (roomId === null) return
  try {
    window.sessionStorage.setItem(storageKey(roomId), JSON.stringify(order))
  } catch {
    // A preference only: losing it on reload is fine.
  }
}

const idsOf = (el: Element): ObjectId[] =>
  (el.getAttribute('data-obj-ids') ?? '').split(' ').filter(Boolean) as ObjectId[]

/** The tiles of the row holding `key`, as drawn, and every other own tile. */
function readBoard(key: ObjectId): {
  row: Element[]
  rowIds: ObjectId[][]
  rest: ObjectId[][]
} | null {
  const rows = [...document.querySelectorAll('[data-drag-row]')]
  const home = rows.find((r) =>
    [...r.querySelectorAll(':scope .board-entry')].some((el) => idsOf(el).includes(key)),
  )
  if (!home) return null
  const row = [...home.querySelectorAll(':scope .board-entry[data-obj-ids]')]
  const rest = rows
    .filter((r) => r !== home)
    .flatMap((r) => [...r.querySelectorAll(':scope .board-entry[data-obj-ids]')])
  return { row, rowIds: row.map(idsOf), rest: rest.map(idsOf) }
}

/** The tile nearest the pointer in the dragged tile's row, and which half of
 * it the pointer is over. */
function dropTarget(key: ObjectId, x: number, y: number): BoardDrag['drop'] {
  const board = readBoard(key)
  if (!board) return null
  let best: { el: Element; d: number; ids: ObjectId[] } | null = null
  board.row.forEach((el, i) => {
    const ids = board.rowIds[i]
    if (ids.includes(key)) return
    const r = el.getBoundingClientRect()
    const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2))
    if (!best || d < best.d) best = { el, d, ids }
  })
  if (!best) return null
  const { el, ids } = best as { el: Element; ids: ObjectId[] }
  const r = el.getBoundingClientRect()
  return { key: ids[0], after: x > r.left + r.width / 2 }
}

export function useBoardDrag(roomId: string | null): BoardDragControls {
  const [order, setOrder] = useState<BoardOrder>(() => loadOrder(roomId))
  const [drag, setDrag] = useState<BoardDrag | null>(null)
  // The press in progress, dragging or not yet.
  const press = useRef<{
    key: ObjectId
    x: number
    y: number
    pointerId: number
    dragging: boolean
    drop: BoardDrag['drop']
  } | null>(null)
  const detach = useRef<(() => void) | null>(null)

  useEffect(() => () => detach.current?.(), [])

  const start = useCallback(
    (e: ReactPointerEvent, key: ObjectId) => {
      if (e.button !== 0 || !e.isPrimary) return
      detach.current?.()
      press.current = { key, x: e.clientX, y: e.clientY, pointerId: e.pointerId, dragging: false, drop: null }

      const end = (commit: boolean) => {
        const p = press.current
        detach.current?.()
        if (!p?.dragging) return
        if (commit && p.drop) {
          const board = readBoard(p.key)
          const from = board?.rowIds.findIndex((ids) => ids.includes(p.key)) ?? -1
          const to = board?.rowIds.findIndex((ids) => ids.includes(p.drop!.key)) ?? -1
          if (board && from >= 0 && to >= 0) {
            const next = moveInRow(
              board.rowIds.map((ids) => ({ ids })),
              board.rest.map((ids) => ({ ids })),
              from,
              to,
              p.drop.after,
            )
            setOrder(next)
            saveOrder(roomId, next)
          }
        }
        // The click a drag ends with would land on whatever tile is under
        // the pointer (often the one just dragged) and act on it.
        const swallow = (ev: MouseEvent) => {
          ev.stopPropagation()
          ev.preventDefault()
        }
        window.addEventListener('click', swallow, { capture: true, once: true })
        window.setTimeout(() => window.removeEventListener('click', swallow, true), 0)
      }

      const onMove = (ev: PointerEvent) => {
        const p = press.current
        if (!p || ev.pointerId !== p.pointerId) return
        const dx = ev.clientX - p.x
        const dy = ev.clientY - p.y
        if (!p.dragging) {
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
          p.dragging = true
          document.body.classList.add('board-dragging')
        }
        p.drop = dropTarget(p.key, ev.clientX, ev.clientY)
        setDrag({ key: p.key, dx, dy, drop: p.drop })
      }
      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId === press.current?.pointerId) end(true)
      }
      const onCancel = (ev: PointerEvent) => {
        if (ev.pointerId === press.current?.pointerId) end(false)
      }
      const onKey = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') end(false)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onCancel)
      window.addEventListener('keydown', onKey)
      detach.current = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onCancel)
        window.removeEventListener('keydown', onKey)
        document.body.classList.remove('board-dragging')
        press.current = null
        detach.current = null
        setDrag(null)
      }
    },
    [roomId],
  )

  return { order, drag, start }
}
