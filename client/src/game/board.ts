/**
 * Groups a player's battlefield into the shapes the board renders:
 *  - permanents split into type buckets (lands / creatures / artifacts /
 *    enchantments), using the single most-expansive type for anything that's
 *    more than one (e.g. an artifact creature renders with the creatures);
 *  - Auras/Equipment pulled out of their own bucket and nested under whatever
 *    they're attached to, wherever that host ends up;
 *  - otherwise-identical lands, or identical *token* copies of a nonland
 *    permanent (the same in everything the view shows — see `tileKey` — with
 *    no counters and nothing attached) collapsed into one stack with a count.
 *    Nonland stacking is token-only — a same-named nontoken permanent (rare,
 *    but real, e.g. two cast copies of a card that allows it) stays its own
 *    tile rather than folding into a stack that implies "these are
 *    interchangeable".
 */

import type { ObjectId, PlayerId, PlayerView, VisibleObject } from 'engine'

export type Bucket = 'land' | 'creature' | 'planeswalker' | 'artifact' | 'enchantment'

export interface BoardEntry {
  /** All object ids this tile represents — more than one when identical
   * lands or tokens fold together. */
  readonly ids: readonly ObjectId[]
  /** How many permanents the tile stands for: one per id, except that an id
   * may itself be one of the engine's compacted token stacks, which counts as
   * every token in it (`VisibleObject.stackCount`). Both happen on one tile:
   * a token split off a stack (a pump, a sacrifice choice) goes back to being
   * identical to the rest once whatever singled it out wears off. */
  readonly count: number
  /** Representative object to render (a land stack's members are identical). */
  readonly sample: VisibleObject
  readonly bucket: Bucket
  /** Auras/Equipment attached to this entry, rendered nested underneath it. */
  readonly attachments: readonly VisibleObject[]
}

/** The single bucket a permanent belongs in, most-expansive type wins. Only
 * `land` vs. everything else actually splits the board into rows — the
 * finer-grained bucket exists for `bucketOf`'s stacking rule (only lands
 * stack) and stays around for whatever wants it later. */
export function bucketOf(obj: VisibleObject): Bucket {
  if (obj.types.includes('land')) return 'land'
  if (obj.types.includes('creature')) return 'creature'
  if (obj.types.includes('planeswalker')) return 'planeswalker'
  if (obj.types.includes('artifact')) return 'artifact'
  return 'enchantment'
}

const isEmpty = (counters: Readonly<Record<string, number>>): boolean =>
  Object.keys(counters).length === 0

/**
 * Everything a tile could show about `obj`, as one string — every field of
 * the view except its `id` and its `stackCount`, the two that differ between
 * interchangeable copies. Permanents fold into one tile only when this
 * matches, because the tile draws just one of them: folding on a few fields
 * (it used to be name, tapped, P/T and summoning sickness) put a Cat that
 * Jump had given flying under the tile of the Cats that hadn't, drawn without
 * its flying.
 */
function tileKey(obj: VisibleObject): string {
  const { id: _id, stackCount: _stackCount, ...shown } = obj
  return JSON.stringify(shown)
}

/** All battlefield entries for `pid`'s board, bucketed and stacked. */
export function computeBoardEntries(
  view: PlayerView,
  pid: PlayerId,
): BoardEntry[] {
  const all = view.zones.battlefield
    .map((id) => view.objects[id])
    .filter((o): o is VisibleObject => Boolean(o))
  const byId = new Map(all.map((o) => [o.id, o]))

  const attachmentsByHost = new Map<ObjectId, VisibleObject[]>()
  const topLevel: VisibleObject[] = []
  for (const obj of all) {
    if (obj.attachedTo !== null && byId.has(obj.attachedTo)) {
      const list = attachmentsByHost.get(obj.attachedTo) ?? []
      list.push(obj)
      attachmentsByHost.set(obj.attachedTo, list)
    } else {
      topLevel.push(obj)
    }
  }

  interface Building {
    ids: ObjectId[]
    count: number
    sample: VisibleObject
    bucket: Bucket
    attachments: readonly VisibleObject[]
  }
  const entries: Building[] = []
  const stackIndex = new Map<string, number>()
  for (const obj of topLevel) {
    if (obj.controller !== pid) continue
    const attachments = attachmentsByHost.get(obj.id) ?? []
    const bucket = bucketOf(obj)
    const stackable =
      isEmpty(obj.counters) &&
      attachments.length === 0 &&
      (bucket === 'land'
        ? obj.power === null // a man-land animated to a creature stands alone
        : obj.isToken) // real (nontoken) permanents never fold into a stack
    const count = obj.stackCount ?? 1
    if (stackable) {
      const key = tileKey(obj)
      const idx = stackIndex.get(key)
      if (idx !== undefined) {
        entries[idx].ids.push(obj.id)
        entries[idx].count += count
        continue
      }
      stackIndex.set(key, entries.length)
    }
    entries.push({ ids: [obj.id], count, sample: obj, bucket, attachments })
  }
  return entries
}
