import { describe, expect, it } from 'vitest'
import type { GameEvent, ObjectId } from 'engine/client'
import {
  CARD_HOLD_MS,
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
  FLIGHT_MAX_MS,
  FLIGHT_MIN_MS,
  HAND_DRAW_STEP_MS,
  STACK_EXIT_MS,
  TAP_STEP_MS,
  TRIGGER_STEP_MS,
  flightMs,
  handDrawBeatMs,
  handDrawStaggerMs,
  libraryPeels,
  millDurationMs,
  retimeFlights,
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
/** The cards `draws` put in the viewer's hand (`ScheduleOptions.handDraws`). */
const inHand = (...draws: readonly GameEvent[]): ReadonlySet<ObjectId> =>
  new Set(draws.flatMap((d) => (d.type === 'card-drawn' ? [d.object] : [])))
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
    // The spell stays on the stack: its spotlight holds, then flies into the
    // pile first thing on the new board, before the tap.
    expect(s.totalMs).toBe(CARD_HOLD_MS)
    expect(types(s.after)).toEqual(['spell-cast', 'permanent-tapped'])
    expect(s.afterMs).toBe(FLIGHT_MAX_MS + TAP_STEP_MS)
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
    expect(s.items.map((i) => i.offset)).toEqual([0, 2 * CARD_HOLD_MS])
    expect(s.totalMs).toBe(4 * CARD_HOLD_MS)
    expect(s.after.map((i) => [i.offset, i.flightMs])).toEqual([
      [0, 2 * FLIGHT_MAX_MS],
      [2 * FLIGHT_MAX_MS, 2 * FLIGHT_MAX_MS],
      [4 * FLIGHT_MAX_MS, undefined],
    ])
    expect(s.afterMs).toBe(2 * (2 * FLIGHT_MAX_MS + TAP_STEP_MS))
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

  it('lights up an activated ability on the stack like a trigger, but not a mana ability', () => {
    const s = scheduleEvents(
      [
        tap('land'),
        ev({ type: 'ability-activated', source: 'land', player: 'p1', onStack: false }),
        tap('pinger'),
        ev({ type: 'ability-activated', source: 'pinger', player: 'p1', onStack: true, ability: 'ab1' }),
      ],
      'precombat-main',
    )
    expect(types(s.after)).toEqual(['permanent-tapped', 'permanent-tapped', 'ability-activated'])
    expect(s.after[2].event).toMatchObject({ source: 'pinger', ability: 'ab1' })
    expect(s.afterMs).toBe(TAP_STEP_MS + TRIGGER_STEP_MS)
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
    expect(libraryPeels(s.items.map((i) => i.event))).toMatchObject([
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
    expect(libraryPeels(run)).toMatchObject([{ player: 'p1', parts: [{ exile: true, count: 4, startStep: 0 }] }])
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
    expect(libraryPeels(run)).toMatchObject([
      {
        player: 'p1',
        parts: [
          { exile: false, count: 2, startStep: 0 },
          { exile: true, count: 2, startStep: 2 },
        ],
      },
    ])
    // Each card, in order, with the event it left in — what names its face.
    expect(libraryPeels(run)[0].parts.map((p) => p.cards.map((c) => [c.object, c.seq]))).toEqual([
      [
        ['a', run[0].seq],
        ['b', run[0].seq],
      ],
      [
        ['c', run[1].seq],
        ['d', run[2].seq],
      ],
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

  it("keeps a run's later members when its beat nearly fills the frame", () => {
    // A cast, a death and a resolve, then seven cards peeling: the run's
    // first event pays for the whole beat, and the other six peel within it
    // rather than being dropped as if each needed a beat of its own.
    const before = [cast(), dies(), ev({ type: 'spell-resolved', object: 's1' })]
    const base = scheduleEvents(before, 'precombat-main').totalMs
    const run = Array.from({ length: 7 }, (_, i) => exiled([[`c${i}`, 'p1']]))
    const s = scheduleEvents([...before, ...run], 'precombat-main')
    expect(s.totalMs).toBe(base + millDurationMs(7))
    expect(s.totalMs).toBeLessThanOrEqual(6000)
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

describe("scheduleEvents: a card drawn into the viewer's own hand", () => {
  it('settles into its place over the new board, after the untaps, and the frame waits', () => {
    const own = draw()
    const s = scheduleEvents([untap('u1'), own], 'beginning', {
      scale: 1,
      reduced: false,
      handDraws: inHand(own),
    })
    expect(types(s.items)).toEqual([])
    expect(s.after.map((i) => [i.event.type, i.offset])).toEqual([
      ['permanent-untapped', 0],
      ['card-drawn', TAP_STEP_MS],
    ])
    expect(s.afterMs).toBe(TAP_STEP_MS + HAND_DRAW_STEP_MS)
  })

  it('deals a run of draws as one beat, a stagger per card after the first', () => {
    const draws = [draw(), draw(), draw()]
    const s = scheduleEvents(draws, 'precombat-main', {
      scale: 2,
      reduced: false,
      handDraws: inHand(...draws),
    })
    // One shared beat: every cue at its start, the layer staggering them.
    expect(s.after.map((i) => i.offset)).toEqual([0, 0, 0])
    expect(s.afterMs).toBe(2 * handDrawBeatMs(3))
    expect(handDrawBeatMs(3)).toBe(HAND_DRAW_STEP_MS + 2 * handDrawStaggerMs(3))
  })

  it("keeps an opponent's draw as the cardback over the old board, costing nothing", () => {
    const mine = draw()
    const theirs = ev({ type: 'card-drawn', player: 'p2', object: 'x9' })
    const s = scheduleEvents([theirs, mine], 'precombat-main', {
      scale: 1,
      reduced: false,
      handDraws: inHand(mine),
    })
    expect(s.items.map((i) => i.event)).toEqual([theirs])
    expect(s.totalMs).toBe(0)
    expect(s.after.map((i) => i.event)).toEqual([mine])
  })

  it('shows nothing under reduced motion: the card is simply in the hand', () => {
    const own = draw()
    const s = scheduleEvents([own], 'precombat-main', {
      scale: 1,
      reduced: true,
      handDraws: inHand(own),
    })
    expect(s.items).toEqual([])
    expect(s.after).toEqual([])
  })

  it('keeps a long run inside one spread of staggers', () => {
    expect(handDrawStaggerMs(1)).toBe(0)
    expect(handDrawBeatMs(7)).toBeLessThanOrEqual(HAND_DRAW_STEP_MS + 720)
    expect(handDrawBeatMs(20)).toBeLessThanOrEqual(HAND_DRAW_STEP_MS + 720)
  })
})

describe('scheduleEvents: what points at its targets as it resolves', () => {
  const passes = () => [
    ev({ type: 'priority-passed', player: 'p1' }),
    ev({ type: 'priority-passed', player: 'p2' }),
  ]
  const resolved = (object: string) => ev({ type: 'spell-resolved', object })
  const killed = (object: string) =>
    ev({ type: 'permanent-left-battlefield', object, toZone: 'graveyard' })

  it('points for the length of a spell leaving the stack', () => {
    const s = scheduleEvents([...passes(), resolved('bolt')], 'precombat-main')
    expect(s.aims).toEqual([{ object: 'bolt', from: 0, until: STACK_EXIT_MS }])
  })

  it('points from its first effect, so what it destroys is pointed at as it goes', () => {
    // The engine logs a spell's effects before the spell leaving the stack.
    const s = scheduleEvents([...passes(), killed('bear'), resolved('murder')], 'precombat-main')
    expect(types(s.items)).toEqual(['permanent-left-battlefield', 'spell-resolved'])
    expect(s.aims).toEqual([{ object: 'murder', from: 0, until: DEATH_STEP_MS + STACK_EXIT_MS }])
  })

  it('starts at the priority pass that resolved it, not at whatever came before', () => {
    const s = scheduleEvents(
      [
        cast(),
        ev({ type: 'cards-discarded', player: 'p1', objects: ['c'] }),
        ...passes(),
        killed('bear'),
        resolved('murder'),
      ],
      'precombat-main',
    )
    // The cast and the discard before it are someone else's business.
    // (The cast is still on the stack after, so its spotlight holds.)
    const start = CARD_HOLD_MS + DISCARD_STEP_MS
    expect(s.aims).toEqual([
      { object: 'murder', from: start, until: start + DEATH_STEP_MS + STACK_EXIT_MS },
    ])
  })

  it('points from each of several resolving in one frame, in turn', () => {
    const s = scheduleEvents(
      [
        ...passes(),
        ev({ type: 'ability-resolved', source: 'pyro', object: 'ping' }),
        // State-based actions after the first resolution: its target dies.
        killed('elf'),
        ...passes(),
        killed('bear'),
        resolved('murder'),
      ],
      'precombat-main',
    )
    // The two deaths share a beat, which is where the second resolution's
    // own effect plays.
    expect(s.aims).toEqual([
      { object: 'ping', from: 0, until: STACK_EXIT_MS },
      {
        object: 'murder',
        from: STACK_EXIT_MS,
        until: STACK_EXIT_MS + DEATH_STEP_MS + STACK_EXIT_MS,
      },
    ])
  })

  it("points from a resolution resumed after a decision from the frame's start", () => {
    // No priority pass in this frame: it began in an earlier one.
    const s = scheduleEvents(
      [ev({ type: 'cards-discarded', player: 'p2', objects: ['c'] }), resolved('mind-rot')],
      'precombat-main',
    )
    expect(s.aims).toEqual([
      { object: 'mind-rot', from: 0, until: DISCARD_STEP_MS + STACK_EXIT_MS },
    ])
  })

  it('does not point from a countered or fizzled spell, but does from the counterspell', () => {
    const s = scheduleEvents(
      [
        ...passes(),
        ev({ type: 'spell-countered', object: 'bolt' }),
        resolved('counterspell'),
        ...passes(),
        ev({ type: 'spell-fizzled', object: 'murder', reason: 'all targets are illegal' }),
      ],
      'precombat-main',
    )
    // The counterspell's arrow is up while the spell it counters breaks.
    expect(s.aims).toEqual([{ object: 'counterspell', from: 0, until: 2 * STACK_EXIT_MS }])
  })

  it("scales with the viewer's speed", () => {
    const s = scheduleEvents([...passes(), killed('bear'), resolved('murder')], 'precombat-main', {
      scale: 2,
      reduced: false,
    })
    expect(s.aims).toEqual([
      { object: 'murder', from: 0, until: 2 * (DEATH_STEP_MS + STACK_EXIT_MS) },
    ])
  })

  it("does not point from a resolution past the frame's ceiling", () => {
    // Three casts and a death fit under the 6 s ceiling; the exit after them
    // isn't animated, so its effect played with nothing pointing at it.
    const s = scheduleEvents(
      [cast(), cast(), cast(), ...passes(), killed('bear'), resolved('late')],
      'precombat-main',
    )
    expect(types(s.items)).toContain('permanent-left-battlefield')
    expect(types(s.items)).not.toContain('spell-resolved')
    expect(s.aims).toEqual([])
  })
})

describe('scheduleEvents: a permanent spell put down on its tile', () => {
  const resolved = (object: string) => ev({ type: 'spell-resolved', object })
  const entered = (object: string) => ev({ type: 'permanent-entered-battlefield', object })
  const flagged = (items: readonly { event: GameEvent; putDown?: true }[]) =>
    items.map((i) => [i.event.type, i.putDown === true])

  it('marks the exit and the arrival of the same object, landing it instead of growing it in', () => {
    const s = scheduleEvents([resolved('bear'), entered('bear'), entered('token')], 'precombat-main')
    expect(flagged(s.items)).toEqual([['spell-resolved', true]])
    expect(flagged(s.after)).toEqual([
      ['permanent-entered-battlefield', true],
      ['permanent-entered-battlefield', false],
    ])
    // The landing has its own beat, then the token grows in on the next.
    expect(s.after.map((i) => i.offset)).toEqual([0, FLIGHT_MAX_MS])
    expect(s.afterMs).toBe(FLIGHT_MAX_MS + ENTER_STEP_MS)
  })

  it('lands before anything else on the new board', () => {
    const s = scheduleEvents(
      [
        tap('land'),
        resolved('bear'),
        entered('bear'),
        ev({ type: 'ability-triggered', source: 'bear', controller: 'p1' }),
      ],
      'precombat-main',
    )
    expect(types(s.after)).toEqual(['permanent-entered-battlefield', 'permanent-tapped', 'ability-triggered'])
    expect(s.after[0].putDown).toBe(true)
  })

  it('lands several permanents one after another, in the order they resolved', () => {
    const s = scheduleEvents([resolved('a'), entered('a'), resolved('b'), entered('b')], 'precombat-main')
    expect(s.after.map((i) => [(i.event as { object: string }).object, i.offset, i.putDown])).toEqual([
      ['a', 0, true],
      ['b', FLIGHT_MAX_MS, true],
    ])
    expect(s.afterMs).toBe(2 * FLIGHT_MAX_MS)
    expect(s.items.every((i) => i.putDown === true)).toBe(true)
  })

  it('leaves an instant, a countered spell and a spell that went elsewhere as they were', () => {
    const s = scheduleEvents(
      [
        resolved('bolt'),
        ev({ type: 'spell-countered', object: 'bear' }),
        entered('bear'),
        resolved('exiled-instead'),
        entered('someone-else'),
      ],
      'precombat-main',
    )
    expect(s.items.some((i) => i.putDown)).toBe(false)
    expect(s.after.some((i) => i.putDown)).toBe(false)
    // Both arrivals grow in, on one shared beat.
    expect(s.afterMs).toBe(ENTER_STEP_MS)
  })

  it('fades in place under reduced motion: an exit and an arrival, as before', () => {
    const s = scheduleEvents([resolved('bear'), entered('bear')], 'precombat-main', {
      scale: 1,
      reduced: true,
    })
    expect(s.items.some((i) => i.putDown)).toBe(false)
    expect(s.after.some((i) => i.putDown)).toBe(false)
    expect(s.afterMs).toBe(ENTER_STEP_MS)
  })

  it("scales the landing with the viewer's speed", () => {
    const s = scheduleEvents([resolved('bear'), entered('bear')], 'precombat-main', {
      scale: 2,
      reduced: false,
    })
    expect(s.totalMs).toBe(2 * STACK_EXIT_MS)
    expect(s.afterMs).toBe(2 * FLIGHT_MAX_MS)
  })

  it("marks neither end when the landing doesn't fit under the frame's ceiling", () => {
    // Three casts take 5.4 s of the 6 s ceiling: the exit fits, the landing
    // after it doesn't — so the exit flies off as it always has, rather than
    // lifting a card that never lands.
    const s = scheduleEvents([cast(), cast(), cast(), resolved('bear'), entered('bear')], 'precombat-main')
    expect(types(s.items)).toContain('spell-resolved')
    expect(s.items.some((i) => i.putDown)).toBe(false)
    expect(s.after).toEqual([])
  })
})

describe('scheduleEvents: a cast spell slotting into its place on the stack', () => {
  const castOf = (object: string, from = 'hand') => ev({ type: 'spell-cast', player: 'p1', object, from })
  const resolved = (object: string) => ev({ type: 'spell-resolved', object })
  const entered = (object: string) => ev({ type: 'permanent-entered-battlefield', object })
  const ends = (items: readonly { event: GameEvent; putDown?: true; offset: number }[]) =>
    items.map((i) => [i.event.type, (i.event as { object?: string }).object, i.offset, i.putDown === true])

  it('holds the spotlight, then flies it into the pile first thing on the new board', () => {
    const s = scheduleEvents([castOf('bolt'), tap('land')], 'precombat-main')
    expect(ends(s.items)).toEqual([['spell-cast', 'bolt', 0, true]])
    expect(s.totalMs).toBe(CARD_HOLD_MS)
    expect(ends(s.after)).toEqual([
      ['spell-cast', 'bolt', 0, true],
      ['permanent-tapped', 'land', FLIGHT_MAX_MS, false],
    ])
    expect(s.after[0].flightMs).toBe(FLIGHT_MAX_MS)
    expect(s.afterMs).toBe(FLIGHT_MAX_MS + TAP_STEP_MS)
  })

  it('does the same for a spell cast from anywhere else', () => {
    const s = scheduleEvents([castOf('flashback', 'graveyard')], 'precombat-main')
    expect(s.items[0].putDown).toBe(true)
    expect(s.after[0].putDown).toBe(true)
  })

  it('keeps the full spotlight for a spell gone from the stack within the frame', () => {
    for (const leaving of ['spell-resolved', 'spell-countered', 'spell-fizzled', 'spell-exiled']) {
      const s = scheduleEvents([castOf('x'), ev({ type: leaving, object: 'x' })], 'precombat-main')
      expect(ends(s.items)[0], leaving).toEqual(['spell-cast', 'x', 0, false])
      expect(s.after.some((i) => i.event.type === 'spell-cast'), leaving).toBe(false)
    }
    // A permanent spell cast and resolved in one frame: its entry was never
    // drawn, so it grows in as it did.
    const s = scheduleEvents([castOf('bear'), resolved('bear'), entered('bear')], 'precombat-main')
    expect(s.items[0].putDown).toBeUndefined()
    expect(s.totalMs).toBe(CARD_STEP_MS + STACK_EXIT_MS)
  })

  it('flies several casts into the pile one after another, in the order they were cast', () => {
    const s = scheduleEvents([castOf('a'), castOf('b')], 'precombat-main')
    expect(s.items.map((i) => i.offset)).toEqual([0, CARD_HOLD_MS])
    expect(ends(s.after)).toEqual([
      ['spell-cast', 'a', 0, true],
      ['spell-cast', 'b', FLIGHT_MAX_MS, true],
    ])
  })

  it('fades under reduced motion: the full spotlight, and no flight', () => {
    const s = scheduleEvents([castOf('bolt')], 'precombat-main', { scale: 1, reduced: true })
    expect(s.items[0].putDown).toBeUndefined()
    expect(s.totalMs).toBe(CARD_STEP_MS)
    expect(s.after).toEqual([])
  })

  it("gives the spotlight its full beat back when its flight doesn't fit under the ceiling", () => {
    // 4180 ms before it: with the hold it would end at 5476 ms and its flight
    // not fit under the 6 s ceiling; with its full beat it ends at 5980.
    const s = scheduleEvents(
      [castOf('shock'), resolved('shock'), hit(), dies(), hit(), castOf('bolt')],
      'precombat-main',
    )
    const before = CARD_STEP_MS + STACK_EXIT_MS + 2 * HIT_STEP_MS + DEATH_STEP_MS
    expect(ends(s.items).at(-1)).toEqual(['spell-cast', 'bolt', before, false])
    expect(s.totalMs).toBe(before + CARD_STEP_MS)
    expect(s.after).toEqual([])
  })
})

describe('scheduleEvents: a played land flying onto its tile', () => {
  const played = (object: string) => ev({ type: 'land-played', player: 'p1', object, from: 'hand' })
  const entered = (object: string) => ev({ type: 'permanent-entered-battlefield', object })

  it('holds the spotlight, then flies it onto the tile instead of growing the tile in', () => {
    const s = scheduleEvents([played('forest'), entered('forest')], 'precombat-main')
    expect(s.items.map((i) => [i.event.type, i.offset, i.putDown])).toEqual([['land-played', 0, true]])
    expect(s.totalMs).toBe(CARD_HOLD_MS)
    expect(s.after.map((i) => [i.event.type, i.offset, i.putDown, i.flightMs])).toEqual([
      ['permanent-entered-battlefield', 0, true, FLIGHT_MAX_MS],
    ])
    expect(s.afterMs).toBe(FLIGHT_MAX_MS)
  })

  it('plays the spotlight as before under reduced motion', () => {
    const s = scheduleEvents([played('forest'), entered('forest')], 'precombat-main', {
      scale: 1,
      reduced: true,
    })
    expect(s.totalMs).toBe(CARD_STEP_MS)
    expect(s.after.map((i) => [i.event.type, i.putDown])).toEqual([['permanent-entered-battlefield', undefined]])
    expect(s.afterMs).toBe(ENTER_STEP_MS)
  })
})

describe('flightMs: a steady speed on screen', () => {
  it('grows with the distance, in step with it between the floor and the ceiling', () => {
    const diagonal = 1000
    const a = flightMs(300, diagonal)
    const b = flightMs(500, diagonal)
    expect(b).toBeGreaterThan(a)
    // Equal distances added take equal time: the speed is steady.
    expect(flightMs(700, diagonal) - b).toBe(b - a)
  })

  it('never crawls over a short hop or runs past the slot a flight reserves', () => {
    expect(flightMs(0, 1000)).toBe(FLIGHT_MIN_MS)
    expect(flightMs(10, 1000)).toBe(FLIGHT_MIN_MS)
    expect(flightMs(1000, 1000)).toBe(FLIGHT_MAX_MS)
    expect(flightMs(5000, 1000)).toBe(FLIGHT_MAX_MS)
  })

  it('feels the same on any screen: measured in viewport diagonals', () => {
    const small = Math.hypot(1366, 768)
    const large = Math.hypot(2560, 1440)
    expect(flightMs(small * 0.4, small)).toBe(flightMs(large * 0.4, large))
  })
})

describe('retimeFlights: the second half as measured on the new board', () => {
  const item = (offset: number, flight?: number) => ({
    event: tap(),
    offset,
    ...(flight !== undefined ? { putDown: true as const, flightMs: flight } : {}),
  })

  it('pulls everything after a short flight forward, and ends the half early', () => {
    const after = [
      item(0, FLIGHT_MAX_MS),
      item(FLIGHT_MAX_MS),
      item(FLIGHT_MAX_MS),
      item(FLIGHT_MAX_MS + TAP_STEP_MS),
    ]
    const timed = retimeFlights(after, FLIGHT_MAX_MS + 2 * TAP_STEP_MS, () => 500)
    expect(timed.after.map((i) => [i.offset, i.flightMs])).toEqual([
      [0, 500],
      [500, undefined],
      [500, undefined],
      [500 + TAP_STEP_MS, undefined],
    ])
    expect(timed.afterMs).toBe(500 + 2 * TAP_STEP_MS)
  })

  it('starts each flight when the one before it has landed', () => {
    const after = [item(0, FLIGHT_MAX_MS), item(FLIGHT_MAX_MS, FLIGHT_MAX_MS), item(2 * FLIGHT_MAX_MS)]
    const took = [600, 800]
    let i = 0
    const timed = retimeFlights(after, 2 * FLIGHT_MAX_MS + TAP_STEP_MS, () => took[i++])
    expect(timed.after.map((x) => [x.offset, x.flightMs])).toEqual([
      [0, 600],
      [600, 800],
      [1400, undefined],
    ])
    expect(timed.afterMs).toBe(1400 + TAP_STEP_MS)
  })

  it('never takes longer than the slot reserved, so the frame stays under its ceiling', () => {
    const timed = retimeFlights(
      [item(0, FLIGHT_MAX_MS), item(FLIGHT_MAX_MS)],
      FLIGHT_MAX_MS + TAP_STEP_MS,
      () => 99_999,
    )
    expect(timed.after.map((x) => [x.offset, x.flightMs])).toEqual([
      [0, FLIGHT_MAX_MS],
      [FLIGHT_MAX_MS, undefined],
    ])
    expect(timed.afterMs).toBe(FLIGHT_MAX_MS + TAP_STEP_MS)
  })

  it('leaves a half with no flights alone', () => {
    const after = [item(0), item(TAP_STEP_MS)]
    expect(retimeFlights(after, 2 * TAP_STEP_MS, () => 0)).toEqual({ after, afterMs: 2 * TAP_STEP_MS })
  })
})
