import { describe, expect, it } from 'vitest'
import type { GameEvent } from 'engine/client'
import {
  CARD_STEP_MS,
  DEATH_STEP_MS,
  ENTER_STEP_MS,
  HIT_STEP_MS,
  HURT_STEP_MS,
  MARK_STEP_MS,
  DISCARD_STEP_MS,
  MAX_PEELED,
  MILL_STAGGER_MS,
  MILL_STEP_MS,
  MOVE_STEP_MS,
  STACK_EXIT_MS,
  TAP_STEP_MS,
  TRIGGER_STEP_MS,
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

  it('plays a run of taps and untaps as one beat each, untaps first', () => {
    const s = scheduleEvents([tap(), tap(), tap(), untap(), untap()], 'beginning')
    // Untapping comes first however the engine logged them — an untap step,
    // then tapping for mana — and each kind is one beat.
    expect(s.after.map((i) => [i.event.type, i.offset])).toEqual([
      ['permanent-untapped', 0],
      ['permanent-untapped', 0],
      ['permanent-tapped', TAP_STEP_MS],
      ['permanent-tapped', TAP_STEP_MS],
      ['permanent-tapped', TAP_STEP_MS],
    ])
    // Two beats, not five.
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

  it('takes a resolving spell off the old board, then lights up the new trigger', () => {
    const s = scheduleEvents(
      [
        ev({ type: 'spell-resolved', object: 's1' }),
        ev({ type: 'ability-triggered', source: 'p1', controller: 'p1' }),
        ev({ type: 'ability-triggered', source: 'p2', controller: 'p1' }),
      ],
      'precombat-main',
    )
    expect(types(s.items)).toEqual(['spell-resolved'])
    expect(s.totalMs).toBe(STACK_EXIT_MS)
    // Two triggers, one beat.
    expect(s.after.map((i) => i.offset)).toEqual([0, 0])
    expect(s.afterMs).toBe(TRIGGER_STEP_MS)
  })

  it('groups the second half by kind: arrivals, then counters, then triggers', () => {
    const s = scheduleEvents(
      [
        ev({ type: 'permanent-entered-battlefield', object: 'a' }),
        ev({ type: 'counter-added', object: 'a', counter: '+1/+1', amount: 2 }),
        ev({ type: 'ability-triggered', source: 'a', controller: 'p1' }),
        ev({ type: 'permanent-entered-battlefield', object: 'b' }),
        ev({ type: 'counter-added', object: 'b', counter: '+1/+1', amount: 1 }),
      ],
      'precombat-main',
    )
    expect(types(s.after)).toEqual([
      'permanent-entered-battlefield',
      'permanent-entered-battlefield',
      'counter-added',
      'counter-added',
      'ability-triggered',
    ])
    expect(s.after.map((i) => i.offset)).toEqual([
      0,
      0,
      ENTER_STEP_MS,
      ENTER_STEP_MS,
      ENTER_STEP_MS + MARK_STEP_MS,
    ])
    expect(s.afterMs).toBe(ENTER_STEP_MS + MARK_STEP_MS + TRIGGER_STEP_MS)
  })

  it('strikes with combat damage over the old board, and numbers it over the new', () => {
    const toCreature = ev({
      type: 'damage-dealt',
      source: 'a',
      target: { kind: 'object', object: 'b' },
      amount: 3,
      combat: true,
    })
    const s = scheduleEvents(
      [toCreature, hit(), ev({ type: 'life-changed', player: 'p2', delta: -2, life: 18 })],
      'combat',
    )
    expect(types(s.items)).toEqual(['damage-dealt', 'damage-dealt'])
    expect(s.totalMs).toBe(2 * HIT_STEP_MS)
    // The creature's number and the player's life loss share one beat; the
    // hit on the player has no number of its own, its life-changed is it.
    expect(s.after.map((i) => [i.event.type, i.offset])).toEqual([
      ['damage-dealt', 0],
      ['life-changed', 0],
    ])
    expect(s.afterMs).toBe(HURT_STEP_MS)
  })

  it('snapshots a change of control over the old board, and flies it over the new', () => {
    const s = scheduleEvents(
      [
        dies(),
        ev({ type: 'control-changed', object: 'x', controller: 'p2', untilEndOfTurn: false }),
        dies(),
      ],
      'precombat-main',
    )
    // The snapshot costs nothing and doesn't split the deaths' shared beat.
    expect(s.items.map((i) => [i.event.type, i.offset])).toEqual([
      ['permanent-left-battlefield', 0],
      ['control-changed', DEATH_STEP_MS],
      ['permanent-left-battlefield', 0],
    ])
    expect(s.totalMs).toBe(DEATH_STEP_MS)
    expect(types(s.after)).toEqual(['control-changed'])
    expect(s.afterMs).toBe(MOVE_STEP_MS)
  })

  it('shows a mill and a discard on the old board, and an exile only from a library', () => {
    const s = scheduleEvents(
      [
        ev({ type: 'cards-milled', player: 'p1', objects: ['a', 'b'] }),
        ev({ type: 'cards-discarded', player: 'p1', objects: ['c'] }),
        ev({ type: 'cards-put-into-exile', arrivals: [{ object: 'd', from: 'graveyard' }] }),
        ev({ type: 'cards-put-into-exile', arrivals: [{ object: 'e', from: 'library' }] }),
      ],
      'precombat-main',
    )
    expect(types(s.items)).toEqual(['cards-milled', 'cards-discarded', 'cards-put-into-exile'])
    // Two milled peel off one after the other; one exiled is a single peel.
    expect(s.totalMs).toBe(MILL_STEP_MS + MILL_STAGGER_MS + DISCARD_STEP_MS + MILL_STEP_MS)
  })

  it('gives a mill a beat per card, up to the most it shows', () => {
    const mill = (n: number) =>
      scheduleEvents(
        [ev({ type: 'cards-milled', player: 'p1', objects: Array.from({ length: n }, (_, i) => `c${i}`) })],
        'precombat-main',
      ).totalMs
    expect(mill(1)).toBe(MILL_STEP_MS)
    expect(mill(3)).toBe(MILL_STEP_MS + 2 * MILL_STAGGER_MS)
    expect(mill(MAX_PEELED)).toBe(MILL_STEP_MS + (MAX_PEELED - 1) * MILL_STAGGER_MS)
    expect(mill(30)).toBe(mill(MAX_PEELED))
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
