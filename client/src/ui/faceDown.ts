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

/**
 * The art box's classes for a face-down permanent: the card back, in its
 * owner's seat colour when `ownerSeat` is known — the same back their
 * library pile shows, so a face-down card says whose it is (an owner, not a
 * controller: a stolen one still wears its owner's back). The plain leather
 * without one.
 */
export function faceDownArtClass(ownerSeat: string | null): string {
  return ownerSeat !== null ? `face-down-art owned fd-${ownerSeat}` : 'face-down-art'
}
