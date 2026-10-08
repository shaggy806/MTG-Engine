import { describe, expect, it } from 'vitest'
import type { ObjectId } from 'engine/client'
import { blockEntries, collapseBlocks } from './stackMembers.ts'
import type { Members } from './stackMembers.ts'

const id = (s: string) => s as ObjectId
const swarm = id('swarm')

describe('blocking an attacking token stack', () => {
  it('names no token when each blocker takes its own (the default)', () => {
    const assign = { [id('b1')]: swarm, [id('b2')]: swarm }
    expect(blockEntries(assign)).toEqual([
      { blocker: 'b1', attacker: 'swarm' },
      { blocker: 'b2', attacker: 'swarm' },
    ])
  })

  it('puts the blockers k to a token, in the order they were assigned', () => {
    const assign = { [id('b1')]: swarm, [id('b2')]: swarm, [id('b3')]: swarm, [id('other')]: id('bear') }
    expect(blockEntries(assign, { swarm: 2 })).toEqual([
      { blocker: 'b1', attacker: 'swarm', attackerMember: 0 },
      { blocker: 'b2', attacker: 'swarm', attackerMember: 0 },
      { blocker: 'b3', attacker: 'swarm', attackerMember: 1 },
      { blocker: 'other', attacker: 'bear' },
    ])
  })

  it("collapses a blocking stack's members into a counted entry per shared token", () => {
    // Five of a stack of Soldiers, two to a token: tokens 0 and 1 get two
    // each, token 2 one.
    const soldiers = id('soldiers')
    const members: Members = new Map([[soldiers, [0, 1, 2, 3, 4, 5].map((k) => id(`soldiers#${k}`))]])
    const assign = Object.fromEntries([0, 1, 2, 3, 4].map((k) => [`soldiers#${k}`, swarm]))
    expect(collapseBlocks(assign, members, { swarm: 2 })).toEqual([
      { blocker: 'soldiers', attacker: 'swarm', attackerMember: 0, count: 2 },
      { blocker: 'soldiers', attacker: 'swarm', attackerMember: 1, count: 2 },
      { blocker: 'soldiers', attacker: 'swarm', attackerMember: 2, count: 1 },
    ])
  })

  it('leaves blocks on an ordinary attacker as they were', () => {
    const assign = { [id('b1')]: id('bear'), [id('b2')]: id('bear') }
    expect(collapseBlocks(assign, new Map(), { swarm: 2 })).toEqual([
      { blocker: 'b1', attacker: 'bear' },
      { blocker: 'b2', attacker: 'bear' },
    ])
  })
})
