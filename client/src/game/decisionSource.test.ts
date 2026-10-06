import { describe, expect, it } from 'vitest'
import type { ObjectId, PlayerView } from 'engine/client'
import { decisionGhostOf, stackShowsSomething } from './decisionSource.ts'

const ob = 'obj-80' as ObjectId
const gladehart = 'obj-91' as ObjectId
// Ob Nixilis's landfall "you may" is being asked: its trigger has left the
// stack, and a Grazing Gladehart trigger waits under it.
const view = {
  decisionSource: { object: ob, cardName: 'Ob Nixilis, the Fallen' },
  zones: { stack: [gladehart] },
  objects: { [ob]: { cardName: 'Ob Nixilis, the Fallen' }, [gladehart]: { kind: 'ability' } },
} as unknown as PlayerView

describe('decisionGhostOf', () => {
  it('draws the card behind the decision being asked', () => {
    expect(decisionGhostOf(view)).toBe(ob)
  })

  it('draws nothing once a later frame is playing over the board', () => {
    // A bug report (2026-10-05): the "prompted by" card stayed on top while
    // the next frame's abilities resolved and left the stack under it.
    expect(decisionGhostOf(view, true)).toBeNull()
    expect(stackShowsSomething(view, true)).toBe(true)
    expect(stackShowsSomething({ ...view, zones: { stack: [] } } as unknown as PlayerView, true)).toBe(false)
  })
})
