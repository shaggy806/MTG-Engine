import type { GameEvent, ObjectId, PlayerId } from 'engine/client'

/**
 * What a history entry was about, as the ids drawn on the board: the objects
 * (permanents, spells) and the players its event names. Read structurally —
 * any `object`, `source`, `objects`, `arrivals`, `target` or `player` field —
 * so a new event kind is covered without a case of its own.
 */
export function idsInvolved(ev: GameEvent): { objects: ObjectId[]; players: PlayerId[] } {
  const objects = new Set<ObjectId>()
  const players = new Set<PlayerId>()
  const e = ev as unknown as Record<string, unknown>
  const addObj = (v: unknown) => {
    if (typeof v === 'string') objects.add(v as ObjectId)
  }
  const addRef = (v: unknown) => {
    if (typeof v !== 'object' || v === null) return
    const ref = v as { kind?: string; object?: unknown; player?: unknown }
    if (ref.kind === 'object') addObj(ref.object)
    else if (ref.kind === 'player' && typeof ref.player === 'string') players.add(ref.player as PlayerId)
  }
  addObj(e.object)
  addObj(e.source)
  if (Array.isArray(e.objects)) e.objects.forEach(addObj)
  if (Array.isArray(e.arrivals)) e.arrivals.forEach((a) => addObj((a as { object?: unknown }).object))
  addRef(e.target)
  if (Array.isArray(e.targets)) e.targets.forEach(addRef)
  if (typeof e.player === 'string') players.add(e.player as PlayerId)
  return { objects: [...objects], players: [...players] }
}

/**
 * Points out on the board what a history entry was about: each permanent or
 * spell it names that's still on screen, and each player's panel, pulse twice
 * in the accent colour. Returns how many things it found, so the caller can
 * say when there's nothing left to show (a card since gone to a graveyard).
 */
export function highlightEvent(ev: GameEvent): number {
  const { objects, players } = idsInvolved(ev)
  const els: HTMLElement[] = []
  for (const id of objects) {
    const esc = CSS.escape(id)
    const el =
      document.querySelector<HTMLElement>(`.board [data-obj-id="${esc}"] .mini-tile`) ??
      document.querySelector<HTMLElement>(`.stack-entry[data-stack-id="${esc}"] .card-tile`) ??
      document.querySelector<HTMLElement>(`.hand-cards [data-obj-id="${esc}"]`)
    if (el) els.push(el)
  }
  for (const p of players) {
    const el = document.querySelector<HTMLElement>(`[data-player-id="${CSS.escape(p)}"]`)
    if (el) els.push(el)
  }
  for (const el of els) {
    el.animate(
      [
        { boxShadow: '0 0 0 0 rgba(120, 200, 255, 0)' },
        { boxShadow: '0 0 0 4px rgba(120, 200, 255, 0.95), 0 0 24px 8px rgba(90, 170, 255, 0.6)', offset: 0.25 },
        { boxShadow: '0 0 0 0 rgba(120, 200, 255, 0)', offset: 0.5 },
        { boxShadow: '0 0 0 4px rgba(120, 200, 255, 0.95), 0 0 24px 8px rgba(90, 170, 255, 0.6)', offset: 0.75 },
        { boxShadow: '0 0 0 0 rgba(120, 200, 255, 0)' },
      ],
      { duration: 1600, easing: 'ease-in-out' },
    )
  }
  if (els[0]) els[0].scrollIntoView({ block: 'nearest', inline: 'nearest' })
  return els.length
}
