/**
 * Groups a player's battlefield into the shapes the board renders:
 *  - permanents split into type buckets (lands / creatures / artifacts /
 *    enchantments), using the single most-expansive type for anything that's
 *    more than one (e.g. an artifact creature renders with the creatures);
 *  - Auras/Equipment pulled out of their own bucket and nested under whatever
 *    they're attached to, wherever that host ends up;
 *  - otherwise-identical lands (same name, same tapped state, same controller,
 *    no counters, nothing attached) collapsed into one stack with a count.
 */

import type { ObjectId, PlayerId, PlayerView, VisibleObject } from 'engine'

export type Bucket = 'land' | 'creature' | 'artifact' | 'enchantment'

export interface BoardEntry {
  /** All object ids this tile represents — length > 1 only for a land stack. */
  readonly ids: readonly ObjectId[]
  /** Representative object to render (a land stack's members are identical). */
  readonly sample: VisibleObject
  readonly bucket: Bucket
  /** Auras/Equipment attached to this entry, rendered nested underneath it. */
  readonly attachments: readonly VisibleObject[]
}

export const BUCKET_LABEL: Record<Bucket, string> = {
  land: 'Lands',
  creature: 'Creatures',
  artifact: 'Artifacts',
  enchantment: 'Enchantments',
}

export const BUCKET_ORDER: readonly Bucket[] = [
  'land',
  'creature',
  'artifact',
  'enchantment',
]

/** The single bucket a permanent belongs in, most-expansive type wins. */
export function bucketOf(obj: VisibleObject): Bucket {
  if (obj.types.includes('land')) return 'land'
  if (obj.types.includes('creature')) return 'creature'
  if (obj.types.includes('artifact')) return 'artifact'
  return 'enchantment'
}

const isEmpty = (counters: Readonly<Record<string, number>>): boolean =>
  Object.keys(counters).length === 0

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
      bucket === 'land' && isEmpty(obj.counters) && attachments.length === 0
    if (stackable) {
      const key = `${obj.cardName}|${obj.tapped}`
      const idx = stackIndex.get(key)
      if (idx !== undefined) {
        entries[idx].ids.push(obj.id)
        continue
      }
      stackIndex.set(key, entries.length)
    }
    entries.push({ ids: [obj.id], sample: obj, bucket, attachments })
  }
  return entries
}
