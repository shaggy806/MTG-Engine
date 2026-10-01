/**
 * The order a player has dragged their own permanents into. Where a permanent
 * sits has no rules meaning, so this is a client-only layout preference: a
 * list of object ids, kept by `GameScreen` (it has to outlive `Table`'s
 * per-frame remount) and applied to `computeBoardEntries`' output for the
 * player's own board.
 *
 * A tile ranks by the earliest of its ids in the list, so a token joining a
 * stack keeps the stack where it was. Tiles with no id in the list — anything
 * that arrived since the last drag — keep the board's own order and go after
 * every ranked one, which is where a new permanent appears without a
 * preference too.
 */

import type { ObjectId } from 'engine/client'

export type BoardOrder = readonly ObjectId[]

/** `entries` sorted by `order`: ranked tiles first, by rank, then the rest in
 * the order they came. Stable, and a no-op for an empty order. */
export function applyBoardOrder<E extends { readonly ids: readonly ObjectId[] }>(
  entries: readonly E[],
  order: BoardOrder,
): E[] {
  if (order.length === 0) return [...entries]
  const rank = new Map<ObjectId, number>()
  order.forEach((id, i) => {
    if (!rank.has(id)) rank.set(id, i)
  })
  const rankOf = (e: E): number => {
    let best = Infinity
    for (const id of e.ids) best = Math.min(best, rank.get(id) ?? Infinity)
    return best
  }
  return entries
    .map((entry, i) => ({ entry, i, r: rankOf(entry) }))
    .sort((a, b) => (a.r === b.r ? a.i - b.i : a.r - b.r))
    .map((x) => x.entry)
}

/**
 * The order after moving `row[from]` to sit just before `row[to]` (or after
 * it, with `after`). `row` is one row of tiles as drawn; `rest` is every other
 * tile on the board, whose relative order is kept. Rows never mix (a tile's
 * row comes from its type), so the rows' positions relative to each other in
 * the list don't matter.
 */
export function moveInRow<E extends { readonly ids: readonly ObjectId[] }>(
  row: readonly E[],
  rest: readonly E[],
  from: number,
  to: number,
  after: boolean,
): ObjectId[] {
  const moved = row[from]
  const without = row.filter((_, i) => i !== from)
  const target = row[to]
  let at = target === moved ? from : without.indexOf(target) + (after ? 1 : 0)
  if (at < 0) at = without.length
  const next = [...without.slice(0, at), moved, ...without.slice(at)]
  return [...next, ...rest].flatMap((e) => e.ids)
}
