import { describe, expect, it } from 'vitest'
import type { GameEvent, ObjectId, PlayerId } from 'engine/client'
import type { SeatStatus } from 'protocol'
import { describeEvent } from './format.ts'

const p1 = 'p1' as PlayerId
const p2 = 'p2' as PlayerId
const seats = [
  { player: p1, displayName: 'Toby' },
  { player: p2, displayName: null },
] as unknown as readonly SeatStatus[]

const event = (fields: Record<string, unknown>) => ({ seq: 1, ...fields }) as unknown as GameEvent
const nameOf = (id: ObjectId) => `card:${id}`

describe('describeEvent', () => {
  it('names players by their display names, not their seat ids', () => {
    expect(describeEvent(event({ type: 'turn-began', turn: 3, activePlayer: p1 }), nameOf, seats)).toBe(
      'Turn 3 — Toby',
    )
    expect(describeEvent(event({ type: 'life-changed', player: p1, delta: -3, life: 37 }), nameOf, seats)).toBe(
      'Toby -3 life (now 37)',
    )
    // No display name: the seat's own label.
    expect(
      describeEvent(event({ type: 'land-played', player: p2, object: 'o1', from: 'hand' }), nameOf, seats),
    ).toBe('P2 plays card:o1')
  })

  it('names a player defender and a player target as players, not cards', () => {
    expect(
      describeEvent(event({ type: 'attacker-declared', attacker: 'o1', defender: p1 }), nameOf, seats),
    ).toBe('card:o1 attacks Toby')
    expect(
      describeEvent(event({ type: 'attacker-declared', attacker: 'o1', defender: 'o2' }), nameOf, seats),
    ).toBe('card:o1 attacks card:o2')
    expect(
      describeEvent(
        event({ type: 'damage-dealt', source: 'o1', amount: 2, target: { kind: 'player', player: p1 } }),
        nameOf,
        seats,
      ),
    ).toBe('card:o1 deals 2 to Toby')
  })
})
