import { describe, expect, it } from 'vitest'
import type { PlayerView } from 'engine/client'
import { gameStats } from './gameStats.ts'

let seq = 0
const ev = (e: Record<string, unknown>) => ({ seq: seq++, ...e })
const toPlayer = (player: string) => ({ kind: 'player', player })

// alice beats bob and carol: bob is out first (turn 3), carol later (turn 4).
const view = {
  turnOrder: ['alice', 'bob', 'carol'],
  players: { alice: { life: 31 }, bob: { life: 0 }, carol: { life: 12 } },
  result: { over: true, winner: 'alice', reason: 'last player remaining' },
  events: [
    // The opening hands aren't counted as draws.
    ev({ type: 'card-drawn', player: 'alice', object: 'o1' }),
    ev({ type: 'card-drawn', player: 'bob', object: 'o2' }),
    ev({ type: 'turn-began', turn: 1, activePlayer: 'alice' }),
    ev({ type: 'card-drawn', player: 'alice', object: 'o3' }),
    ev({ type: 'spell-cast', player: 'alice', object: 's1', from: 'hand', targets: [] }),
    ev({ type: 'damage-dealt', source: 'c1', target: toPlayer('bob'), amount: 7, combat: true, by: 'alice' }),
    // Damage to a creature isn't damage to a player.
    ev({ type: 'damage-dealt', source: 'c2', target: { kind: 'object', object: 'c1' }, amount: 2, combat: true, by: 'bob' }),
    // Self-inflicted: taken, but not dealt to anyone else.
    ev({ type: 'damage-dealt', source: 'l1', target: toPlayer('carol'), amount: 1, combat: false, by: 'carol' }),
    // An unknown source: taken, credited to nobody.
    ev({ type: 'damage-dealt', source: 'x', target: toPlayer('carol'), amount: 2, combat: false }),
    ev({ type: 'life-changed', player: 'alice', delta: 4, life: 44 }),
    ev({ type: 'life-changed', player: 'bob', delta: -7, life: 33 }),
    ev({ type: 'turn-began', turn: 3, activePlayer: 'carol' }),
    ev({ type: 'player-lost', player: 'bob', reason: 'life total is 0 or less' }),
    ev({ type: 'turn-began', turn: 4, activePlayer: 'alice' }),
    ev({ type: 'player-lost', player: 'carol', reason: 'conceded' }),
  ],
} as unknown as PlayerView

describe('gameStats', () => {
  const stats = gameStats(view)
  const of = (p: string) => stats.players.find((s) => s.player === p)!

  it('counts the turns and orders the winner first, then whoever lasted longest', () => {
    expect(stats.turns).toBe(4)
    expect(stats.players.map((p) => p.player)).toEqual(['alice', 'carol', 'bob'])
  })

  it('tallies damage to players by who dealt it and who took it', () => {
    expect(of('alice').damageDealt).toBe(7)
    expect(of('bob').damageTaken).toBe(7)
    expect(of('bob').damageDealt).toBe(0)
    expect(of('carol').damageTaken).toBe(3)
    expect(of('carol').damageDealt).toBe(0)
  })

  it('counts life gained, spells cast and draws after the opening hands', () => {
    expect(of('alice')).toMatchObject({ lifeGained: 4, spellsCast: 1, cardsDrawn: 1, life: 31, out: null })
    expect(of('bob').cardsDrawn).toBe(0)
  })

  it('says when and why each loser went out', () => {
    expect(of('bob').out).toEqual({ turn: 3, reason: 'life total is 0 or less' })
    expect(of('carol').out).toEqual({ turn: 4, reason: 'conceded' })
  })
})
