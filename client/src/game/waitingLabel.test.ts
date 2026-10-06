import { describe, expect, it } from 'vitest'
import type { ObjectId, PlayerId, PlayerView } from 'engine/client'
import { waitingLabel } from './waitingLabel.ts'

const bob = 'bob' as PlayerId
const alice = 'alice' as PlayerId
const spell = 'obj-1' as ObjectId

const viewOf = (awaiting: unknown, stack: readonly ObjectId[] = [], controller: PlayerId = alice): PlayerView =>
  ({
    awaiting,
    zones: { stack },
    objects: Object.fromEntries(stack.map((id) => [id, { controller }])),
  }) as unknown as PlayerView

describe('waitingLabel', () => {
  it('says what a pending decision is', () => {
    expect(waitingLabel(viewOf({ kind: 'scry', player: bob }), bob, true)).toBe('scrying')
    expect(waitingLabel(viewOf({ kind: 'blockers', player: bob }), bob, true)).toBe('declaring blockers')
    expect(waitingLabel(viewOf({ kind: 'choose-targets', player: bob }), bob, false)).toBe('targeting')
  })

  it('reads a priority window over an opponent’s spell as responding', () => {
    expect(waitingLabel(viewOf(null, [spell], alice), bob, true)).toBe('responding')
  })

  it('falls back to thinking or deciding', () => {
    expect(waitingLabel(viewOf(null), bob, true)).toBe('thinking')
    expect(waitingLabel(viewOf(null), bob, false)).toBe('deciding')
    // Its own spell on top: it isn't responding to anything.
    expect(waitingLabel(viewOf(null, [spell], bob), bob, true)).toBe('thinking')
  })
})
