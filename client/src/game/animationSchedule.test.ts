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
  libraryPeels,
  millDurationMs,
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
/** Cards put into exile in one move, each `[object, owner]`, from `from`. */
const exiled = (cards: readonly (readonly [string, string])[], from = 'library') =>
  ev({
    type: 'cards-put-into-exile',
    arrivals: cards.map(([object, owner]) => ({ object, from, owner })),
  })

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
        exiled([['d', 'p1']], 'graveyard'),
        exiled([['e', 'p1']]),
      ],
      'precombat-main',
    )
    expect(types(s.items)).toEqual(['cards-milled', 'cards-discarded', 'cards-put-into-exile'])
    // Two milled peel off one after the other; one exiled is a single peel.
    expect(s.totalMs).toBe(MILL_STEP_MS + MILL_STAGGER_MS + DISCARD_STEP_MS + MILL_STEP_MS)
  })

  it('peels an impulse draw of two like a mill of two', () => {
    const s = scheduleEvents([exiled([['a', 'p1'], ['b', 'p1']])], 'precombat-main')
    expect(s.totalMs).toBe(millDurationMs(2))
    expect(libraryPeels(s.items.map((i) => i.event))).toEqual([
      { player: 'p1', parts: [{ exile: true, count: 2, startStep: 0 }] },
    ])
  })

  it("plays a cascade's one-card exiles one after another, like a mill of that many", () => {
    // Cascade, discover and "exile until" announce each card as its own move.
    const run = ['a', 'b', 'c', 'd'].map((id) => exiled([[id, 'p1']]))
    const s = scheduleEvents(run, 'precombat-main')
    // One beat they all share, as long as four cards peeling one by one…
    expect(s.items.map((i) => i.offset)).toEqual([0, 0, 0, 0])
    expect(s.totalMs).toBe(millDurationMs(4))
    // …because they're one library's four cards in one sequence.
    expect(libraryPeels(run)).toEqual([{ player: 'p1', parts: [{ exile: true, count: 4, startStep: 0 }] }])
  })

  it("scales a run's beat with the viewer speed, and keeps it under reduced motion", () => {
    const run = ['a', 'b', 'c', 'd'].map((id) => exiled([[id, 'p1']]))
    expect(scheduleEvents(run, 'precombat-main', { scale: 2, reduced: false }).totalMs).toBe(
      2 * millDurationMs(4),
    )
    // A fade in place, not movement: still shown, still waited for.
    const reduced = scheduleEvents(run, 'precombat-main', { scale: 1, reduced: true })
    expect(reduced.items).toHaveLength(4)
    expect(reduced.totalMs).toBe(millDurationMs(4))
  })

  it('caps a long run of one-card exiles at the most a mill shows', () => {
    const run = Array.from({ length: 20 }, (_, i) => exiled([[`c${i}`, 'p2']]))
    expect(scheduleEvents(run, 'precombat-main').totalMs).toBe(millDurationMs(MAX_PEELED))
  })

  it('peels different libraries side by side, and waits for the longest', () => {
    // "Exile the top card of each player's library" is one move from four
    // libraries; "each player mills" is a mill each.
    const each = exiled([['a', 'p1'], ['b', 'p2'], ['c', 'p3'], ['d', 'p4']])
    expect(scheduleEvents([each], 'precombat-main').totalMs).toBe(MILL_STEP_MS)
    expect(libraryPeels([each]).map((p) => p.parts[0].startStep)).toEqual([0, 0, 0, 0])
    const mills = [
      ev({ type: 'cards-milled', player: 'p1', objects: ['e'] }),
      ev({ type: 'cards-milled', player: 'p2', objects: ['f', 'g', 'h', 'i', 'j'] }),
    ]
    const s = scheduleEvents(mills, 'precombat-main')
    expect(s.items.map((i) => i.offset)).toEqual([0, 0])
    // The second mill is longer than the first: the beat waits for it.
    expect(s.totalMs).toBe(millDurationMs(5))
  })

  it('peels a library milled and then exiled from as one sequence, mill first', () => {
    const run = [
      ev({ type: 'cards-milled', player: 'p1', objects: ['a', 'b'] }),
      exiled([['c', 'p1']]),
      exiled([['d', 'p1']]),
    ]
    expect(libraryPeels(run)).toEqual([
      {
        player: 'p1',
        parts: [
          { exile: false, count: 2, startStep: 0 },
          { exile: true, count: 2, startStep: 2 },
        ],
      },
    ])
    expect(scheduleEvents(run, 'precombat-main').totalMs).toBe(MILL_STEP_MS + 3 * MILL_STAGGER_MS)
  })

  it('starts a new run after anything else paced', () => {
    const s = scheduleEvents(
      [exiled([['a', 'p1']]), ev({ type: 'spell-resolved', object: 's1' }), exiled([['b', 'p1']])],
      'precombat-main',
    )
    expect(s.items.map((i) => [i.event.type, i.offset])).toEqual([
      ['cards-put-into-exile', 0],
      ['spell-resolved', MILL_STEP_MS],
      ['cards-put-into-exile', MILL_STEP_MS + STACK_EXIT_MS],
    ])
  })

  it("keeps a run's later members when its beat fills the frame to the ceiling", () => {
    // Two casts, a death and a resolve (4.54 s) leave 1.46 s of the 6 s —
    // exactly seven cards peeling. The run's first event pays for the whole
    // beat; the other six peel within it rather than being dropped.
    const run = Array.from({ length: 7 }, (_, i) => exiled([[`c${i}`, 'p1']]))
    const s = scheduleEvents(
      [cast(), cast(), dies(), ev({ type: 'spell-resolved', object: 's1' }), ...run],
      'precombat-main',
    )
    expect(s.totalMs).toBe(6000)
    expect(types(s.items).filter((t) => t === 'cards-put-into-exile')).toHaveLength(7)
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
