import { describe, expect, it } from 'vitest'
import type { GameEvent } from 'engine/client'
import {
  CARD_STEP_MS,
  DEATH_STEP_MS,
  HIT_STEP_MS,
  TAP_STEP_MS,
  scheduleEvents,
} from './animationSchedule.ts'

// Event fixtures: only the fields the scheduler reads, cast once here rather
// than spelling out every event's full shape in each test.
let seq = 0
const ev = (e: Record<string, unknown>): GameEvent => ({ seq: seq++, ...e }) as unknown as GameEvent
const cast = () => ev({ type: 'spell-cast', player: 'p1', object: `s${seq}`, from: 'hand' })
const tap = (object = `t${seq}`) => ev({ type: 'permanent-tapped', object })
const untap = (object = `u${seq}`) => ev({ type: 'permanent-untapped', object })
const dies = () => ev({ type: 'permanent-left-battlefield', object: `d${seq}`, toZone: 'graveyard' })
const hit = () =>
  ev({
    type: 'damage-dealt',
    source: 'a',
    target: { kind: 'player', player: 'p2' },
    amount: 2,
    combat: true,
  })
const draw = () => ev({ type: 'card-drawn', player: 'p1', object: `c${seq}` })

const types = (items: readonly { event: GameEvent }[]) => items.map((i) => i.event.type)

describe('scheduleEvents', () => {
  it('puts taps in the second half, after the board they happened on is shown', () => {
    const s = scheduleEvents([tap(), cast()], 'precombat-main')
    expect(types(s.items)).toEqual(['spell-cast'])
    expect(s.totalMs).toBe(CARD_STEP_MS)
    expect(types(s.after)).toEqual(['permanent-tapped'])
    expect(s.afterMs).toBe(TAP_STEP_MS)
  })

  it('plays a run of taps and untaps as one beat each', () => {
    const s = scheduleEvents([tap(), tap(), tap(), untap(), untap()], 'beginning')
    expect(s.after.map((i) => i.offset)).toEqual([0, 0, 0, TAP_STEP_MS, TAP_STEP_MS])
    // Two beats, not five: the untaps are a different kind, so a new beat.
    expect(s.afterMs).toBe(2 * TAP_STEP_MS)
  })

  it('still shares one beat among a run of deaths', () => {
    const s = scheduleEvents([dies(), dies(), hit()], 'combat')
    expect(s.items.map((i) => i.offset)).toEqual([0, 0, DEATH_STEP_MS])
    expect(s.totalMs).toBe(DEATH_STEP_MS + HIT_STEP_MS)
  })

  it('scales every slot by the viewer speed', () => {
    const s = scheduleEvents([cast(), cast(), tap()], 'precombat-main', {
      scale: 2,
      reduced: false,
    })
    expect(s.items.map((i) => i.offset)).toEqual([0, 2 * CARD_STEP_MS])
    expect(s.totalMs).toBe(4 * CARD_STEP_MS)
    expect(s.afterMs).toBe(2 * TAP_STEP_MS)
  })

  it('drops pure movement when motion is reduced, and keeps the rest', () => {
    const s = scheduleEvents([draw(), tap(), cast()], 'precombat-main', {
      scale: 1,
      reduced: true,
    })
    expect(types(s.items)).toEqual(['spell-cast'])
    expect(s.after).toEqual([])
    expect(s.afterMs).toBe(0)
  })

  it('keeps both halves together under one ceiling, however slow the viewer', () => {
    // Twenty casts at the slowest speed would be 72 s; the ceiling is 11 s,
    // which the server's 12 s ack timeout sits above.
    const events = [...Array.from({ length: 20 }, cast), tap()]
    const s = scheduleEvents(events, 'precombat-main', { scale: 2, reduced: false })
    expect(s.totalMs + s.afterMs).toBeLessThanOrEqual(11000)
    // Three casts fit (10.8 s); the fourth and everything after aren't
    // animated, including the second half.
    expect(s.items).toHaveLength(3)
    expect(s.after).toEqual([])
  })

  it('caps a normal-speed frame at 6 s', () => {
    const s = scheduleEvents(Array.from({ length: 5 }, cast), 'precombat-main')
    expect(s.items).toHaveLength(3)
    expect(s.totalMs).toBe(3 * CARD_STEP_MS)
  })

  it('leaves a frame of banners and draws with nothing to wait on', () => {
    const s = scheduleEvents(
      [ev({ type: 'turn-began', activePlayer: 'p1', extra: false }), draw()],
      'ending',
    )
    expect(s.totalMs).toBe(0)
    expect(s.afterMs).toBe(0)
  })
})
