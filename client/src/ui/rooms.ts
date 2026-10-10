import type { VisibleObject } from 'engine/client'

/**
 * What a Room (rule 709.5) is called on a battlefield tile: the door or doors
 * it has unlocked — a locked door's name isn't the permanent's — with a lock
 * for each still locked; the whole card's name, locked, when neither door
 * is. `null` for anything that isn't a Room on the battlefield.
 */
export function roomLabel(obj: VisibleObject): string | null {
  const doors = obj.doors
  if (doors === undefined) return null
  const open = doors.filter((d) => d.unlocked)
  if (open.length === doors.length) return obj.cardName
  if (open.length === 0) return `🔒 ${obj.cardName}`
  return `${open.map((d) => d.name).join(' // ')} 🔒`
}
