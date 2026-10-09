import type { VisibleObject } from 'engine/client'

/**
 * What a face-down permanent (rule 708 — manifested or cloaked) is called on
 * a tile: a face-down 2/2 to everyone, and to its controller — the only one
 * who may look at it (708.5), whose view carries `faceDown.card` — which card
 * it really is. `null` for anything face up.
 */
export function faceDownLabel(obj: VisibleObject): string | null {
  const down = obj.faceDown
  if (down === undefined) return null
  const how = down.kind === 'cloak' ? 'Cloaked' : 'Manifested'
  return down.card !== undefined ? `${how}: ${down.card}` : `Face-down (${how.toLowerCase()})`
}
