import { describe, expect, it } from 'vitest'
import type { LegalAction } from 'engine/client'
import { tableActions } from './tableActions.ts'

const mulligan = (count: number) => ({ kind: 'mulligan', player: 'p1', count }) as unknown as LegalAction
const pass = { kind: 'pass-priority' } as unknown as LegalAction

describe('tableActions', () => {
  it('offers what the shown board offers once nothing is playing', () => {
    expect(tableActions([pass], [pass], false, false)).toEqual([pass])
  })

  it('offers nothing while a frame plays out, or while a bot plays the seat', () => {
    expect(tableActions([pass], [pass], true, false)).toEqual([])
    expect(tableActions([mulligan(0)], [mulligan(0)], false, true)).toEqual([])
  })

  it('holds the shown mulligan up through a frame, while the newest still asks it', () => {
    // An opponent's shuffle, or your own hand going back: the popup stays, as
    // the shown board has it (not yet the newest frame's count).
    expect(tableActions([mulligan(0), pass], [mulligan(1)], true, false)).toEqual([mulligan(0)])
  })

  it("lets an answered mulligan go, though the frame showing it hasn't finished", () => {
    expect(tableActions([mulligan(0)], [pass], true, false)).toEqual([])
    expect(tableActions([mulligan(0)], [], true, false)).toEqual([])
  })
})
