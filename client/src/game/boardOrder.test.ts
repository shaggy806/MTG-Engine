import { describe, expect, it } from 'vitest'
import type { ObjectId } from 'engine/client'
import { applyBoardOrder, moveInRow } from './boardOrder.ts'

const id = (n: number) => String(n) as ObjectId
const ids = (...ns: number[]) => ns.map(id)
const e = (...ns: number[]) => ({ ids: ids(...ns) })
const names = (list: readonly { ids: readonly ObjectId[] }[]) => list.map((x) => x.ids.join('+'))

describe('applyBoardOrder', () => {
  it('leaves the board order alone with no preference', () => {
    expect(names(applyBoardOrder([e(1), e(2), e(3)], []))).toEqual(['1', '2', '3'])
  })

  it('sorts ranked tiles by rank and puts new arrivals after them, in board order', () => {
    const entries = [e(1), e(2), e(3), e(9), e(8)]
    expect(names(applyBoardOrder(entries, ids(3, 1, 2)))).toEqual(['3', '1', '2', '9', '8'])
  })

  it('ranks a stack by its earliest member, so a token joining it stays put', () => {
    // 7 is a new token that folded into the 2+5 stack.
    const entries = [e(1), e(2, 5, 7), e(3)]
    expect(names(applyBoardOrder(entries, ids(3, 5, 1, 2)))).toEqual(['3', '2+5+7', '1'])
  })

  it('ignores ids that have left the battlefield', () => {
    expect(names(applyBoardOrder([e(2), e(3)], ids(4, 3, 2)))).toEqual(['3', '2'])
  })
})

describe('moveInRow', () => {
  const row = [e(1), e(2), e(3), e(4)]
  const lands = [e(10, 11), e(12)]

  it('moves a tile before a later one', () => {
    expect(moveInRow(row, lands, 0, 2, false)).toEqual(ids(2, 1, 3, 4, 10, 11, 12))
  })

  it('moves a tile after a later one', () => {
    expect(moveInRow(row, lands, 0, 3, true)).toEqual(ids(2, 3, 4, 1, 10, 11, 12))
  })

  it('moves a tile before an earlier one', () => {
    expect(moveInRow(row, [], 3, 0, false)).toEqual(ids(4, 1, 2, 3))
  })

  it('dropping a tile on itself changes nothing', () => {
    expect(moveInRow(row, [], 1, 1, true)).toEqual(ids(1, 2, 3, 4))
  })

  it('round-trips through applyBoardOrder', () => {
    const order = moveInRow(row, lands, 3, 1, false)
    expect(names(applyBoardOrder([...row, ...lands], order))).toEqual([
      '1', '4', '2', '3', '10+11', '12',
    ])
  })
})
