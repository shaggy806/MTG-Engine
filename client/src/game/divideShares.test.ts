import { describe, expect, it } from 'vitest'
import { setShare } from './divideShares.ts'

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0)

describe('setShare', () => {
  it('grows a share from the others when all of it is assigned', () => {
    // The report: 5 divided 3/2, then + on the second — 3/3 before, 6 of 5.
    expect(setShare([3, 2], 1, 3, 5)).toEqual([2, 3])
  })

  it('never adds up past the total, however the shares are pushed', () => {
    let shares = [2, 2, 1]
    for (const [i, n] of [[0, 9], [1, 4], [2, 3], [0, 1], [1, 7]] as const) {
      shares = setShare(shares, i, n, 5)
      expect(sum(shares)).toBeLessThanOrEqual(5)
      expect(Math.min(...shares)).toBeGreaterThanOrEqual(1)
    }
  })

  it('takes from what is unassigned before touching another share', () => {
    expect(setShare([1, 2, 1], 0, 2, 5)).toEqual([2, 2, 1])
  })

  it('takes from the largest other share first', () => {
    expect(setShare([1, 3, 2], 0, 2, 6)).toEqual([2, 2, 2])
  })

  it('caps a share at what leaves 1 for each other target', () => {
    expect(setShare([2, 2, 2], 0, 10, 6)).toEqual([4, 1, 1])
  })

  it('shrinks a share to no less than 1, leaving the rest unassigned', () => {
    expect(setShare([3, 2], 0, 0, 5)).toEqual([1, 2])
  })
})
