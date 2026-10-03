import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ObjectId, PlayerView, TargetRef } from 'engine/client'
import { ResolveAims, aimedEntry, arrowSources, shownTargets } from './resolveAims.ts'

const obj = (id: string): TargetRef => ({ kind: 'object', object: id as ObjectId })
const player = (id: string): TargetRef => ({ kind: 'player', player: id }) as TargetRef

/** A board with only what `shownTargets` reads: who is at the table, what's on
 * the battlefield and the stack, and each object's zone and targets. */
function board(opts: {
  battlefield?: readonly string[]
  stack?: readonly { id: string; targets: readonly TargetRef[] | null }[]
  elsewhere?: readonly string[]
}): PlayerView {
  const objects: Record<string, unknown> = {}
  for (const id of opts.battlefield ?? []) objects[id] = { id, zone: 'battlefield', targets: null }
  for (const id of opts.elsewhere ?? []) objects[id] = { id, zone: 'graveyard', targets: null }
  for (const s of opts.stack ?? []) objects[s.id] = { id: s.id, zone: 'stack', targets: s.targets }
  return {
    turnOrder: ['alice', 'bob'],
    objects,
    zones: {
      battlefield: [...(opts.battlefield ?? [])],
      stack: (opts.stack ?? []).map((s) => s.id),
    },
  } as unknown as PlayerView
}

describe('shownTargets', () => {
  it('points at permanents, players and spells on the stack', () => {
    const view = board({
      battlefield: ['bear'],
      stack: [
        { id: 'bolt', targets: null },
        { id: 'twin', targets: [obj('bear'), player('bob'), obj('bolt')] },
      ],
    })
    expect(shownTargets(view, 'twin' as ObjectId)).toEqual([obj('bear'), player('bob'), obj('bolt')])
  })

  it('leaves out what the table has nowhere to point at', () => {
    const view = board({
      battlefield: ['bear'],
      elsewhere: ['buried'],
      stack: [
        {
          id: 'spell',
          // A card in a graveyard, an object this viewer's board doesn't
          // have, and a player who isn't at this table.
          targets: [obj('buried'), obj('unseen'), player('mallory'), obj('bear')],
        },
      ],
    })
    expect(shownTargets(view, 'spell' as ObjectId)).toEqual([obj('bear')])
  })

  it('points at each target once, however often it is targeted', () => {
    const view = board({
      battlefield: ['bear'],
      stack: [{ id: 'seeds', targets: [obj('bear'), obj('bear'), obj('bear')] }],
    })
    expect(shownTargets(view, 'seeds' as ObjectId)).toEqual([obj('bear')])
  })

  it('points from nothing that is not on the stack', () => {
    const view = board({ battlefield: ['bear'], stack: [{ id: 'bolt', targets: [obj('bear')] }] })
    expect(shownTargets(view, 'bear' as ObjectId)).toEqual([])
    expect(shownTargets(view, 'gone' as ObjectId)).toEqual([])
    expect(shownTargets(board({ stack: [{ id: 'x', targets: null }] }), 'x' as ObjectId)).toEqual([])
  })
})

describe('arrowSources', () => {
  const ids = (...xs: string[]) => xs as ObjectId[]

  it('points from the aimed entry while nothing resolves', () => {
    expect(arrowSources(ids('top'), { resolving: [], gone: [] })).toEqual({
      waiting: ['top'],
      resolving: [],
    })
  })

  it('swaps a resolving entry’s waiting arrows for resolving ones', () => {
    expect(arrowSources(ids('top'), { resolving: ids('top'), gone: [] })).toEqual({
      waiting: [],
      resolving: ['top'],
    })
  })

  it('points from nothing that has resolved, and from what resolves next though not aimed', () => {
    // The old board still has the top on the stack, aimed; it has gone.
    expect(arrowSources(ids('top'), { resolving: ids('under'), gone: ids('top') })).toEqual({
      waiting: [],
      resolving: ['under'],
    })
  })

  it('keeps a hovered entry deeper down pointing while another resolves', () => {
    expect(arrowSources(ids('deep'), { resolving: ids('top'), gone: [] })).toEqual({
      waiting: ['deep'],
      resolving: ['top'],
    })
  })
})

describe('aimedEntry', () => {
  const stack = ['murder', 'bolt'] as ObjectId[]
  const idle = { resolving: [], gone: [] }

  it('marks the top, or the entry the pointer is on', () => {
    expect(aimedEntry(stack, null, idle)).toBe('bolt')
    expect(aimedEntry(stack, 'murder' as ObjectId, idle)).toBe('murder')
    expect(aimedEntry(stack, 'elsewhere' as ObjectId, idle)).toBe('bolt')
    expect(aimedEntry([], null, idle)).toBeNull()
  })

  it('marks what is resolving, wherever the pointer is', () => {
    const state = { resolving: ['bolt'] as ObjectId[], gone: [] }
    expect(aimedEntry(stack, 'murder' as ObjectId, state)).toBe('bolt')
  })

  it('marks nothing once the aimed entry has resolved, until the next resolves', () => {
    const gone = { resolving: [], gone: ['bolt'] as ObjectId[] }
    expect(aimedEntry(stack, null, gone)).toBeNull()
    // A deeper entry the pointer is on still is.
    expect(aimedEntry(stack, 'murder' as ObjectId, gone)).toBe('murder')
    const next = { resolving: ['murder'] as ObjectId[], gone: ['bolt'] as ObjectId[] }
    expect(aimedEntry(stack, null, next)).toBe('murder')
  })

  it('ignores a resolving id the board on screen has no entry for', () => {
    expect(aimedEntry(stack, null, { resolving: ['other'] as ObjectId[], gone: [] })).toBe('bolt')
  })
})

describe('ResolveAims', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // The store keeps time with `window`'s timers, as the rest of the client
    // does; under node that's the global object's.
    vi.stubGlobal('window', globalThis)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('is resolving each aim from its start to its end, then has it gone', () => {
    const aims = new ResolveAims()
    const seen: string[] = []
    aims.subscribe(() => {
      const s = aims.snapshot()
      seen.push(`${s.resolving.join(',')}|${s.gone.join(',')}`)
    })
    aims.play([
      { object: 'ping' as ObjectId, from: 0, until: 500 },
      { object: 'murder' as ObjectId, from: 500, until: 1400 },
    ])
    expect(aims.snapshot()).toEqual({ resolving: [], gone: [] })
    vi.advanceTimersByTime(0)
    expect(aims.snapshot()).toEqual({ resolving: ['ping'], gone: [] })
    vi.advanceTimersByTime(500)
    expect(aims.snapshot()).toEqual({ resolving: ['murder'], gone: ['ping'] })
    vi.advanceTimersByTime(900)
    expect(aims.snapshot()).toEqual({ resolving: [], gone: ['ping', 'murder'] })
    expect(seen).toEqual(['ping|', '|ping', 'murder|ping', '|ping,murder'])
  })

  it('stops and forgets everything when cleared, and a new frame replaces the last', () => {
    const aims = new ResolveAims()
    aims.play([{ object: 'a' as ObjectId, from: 0, until: 500 }])
    vi.advanceTimersByTime(100)
    expect(aims.snapshot().resolving).toEqual(['a'])
    aims.play([{ object: 'b' as ObjectId, from: 200, until: 700 }])
    expect(aims.snapshot()).toEqual({ resolving: [], gone: [] })
    vi.advanceTimersByTime(250)
    expect(aims.snapshot()).toEqual({ resolving: ['b'], gone: [] })
    aims.clear()
    expect(aims.snapshot()).toEqual({ resolving: [], gone: [] })
    vi.advanceTimersByTime(1000)
    // `a`'s and `b`'s ends never fired.
    expect(aims.snapshot()).toEqual({ resolving: [], gone: [] })
  })

  it('hands out the same state until it changes', () => {
    const aims = new ResolveAims()
    const first = aims.snapshot()
    aims.clear()
    expect(aims.snapshot()).toBe(first)
  })
})
