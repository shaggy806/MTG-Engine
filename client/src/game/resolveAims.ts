import { useSyncExternalStore } from 'react'
import type { ObjectId, PlayerView, TargetRef } from 'engine/client'
import type { ResolveAim } from './animationSchedule.ts'

/**
 * What is resolving over the board on screen right now, for `ArrowLayer` to
 * point from: the resolving spell or ability's stack entry to each of its
 * targets, for as long as its resolution plays out (`EventSchedule.aims`).
 *
 * `usePlayback` plays a frame's aims as the frame's first half starts and
 * clears them as its board is shown, so the timers live here, beside the
 * bus, rather than in `ArrowLayer`: that sits inside `Table`, which remounts
 * every frame, and a frame queued behind another can start its first half a
 * moment before the board it plays over has mounted. Whichever `ArrowLayer`
 * is mounted reads the state as it stands.
 */
export interface ResolveState {
  /** Resolving now: each one's target arrows are drawn from its stack entry. */
  readonly resolving: readonly ObjectId[]
  /** Already resolved over this board. Their entries have left the stack, so
   * nothing is drawn from them any more, even though the board on screen
   * still lists them there. */
  readonly gone: readonly ObjectId[]
}

const IDLE: ResolveState = { resolving: [], gone: [] }

export class ResolveAims {
  private state: ResolveState = IDLE
  private timers: number[] = []
  private readonly listeners = new Set<() => void>()

  /** Plays one frame's aims, each from its `from` to its `until` (ms from
   * now), replacing whatever was playing. */
  play(aims: readonly ResolveAim[]): void {
    this.clear()
    for (const aim of aims) {
      const start = (): void =>
        this.set({ ...this.state, resolving: [...this.state.resolving, aim.object] })
      const end = (): void =>
        this.set({
          resolving: this.state.resolving.filter((id) => id !== aim.object),
          gone: [...this.state.gone, aim.object],
        })
      this.timers.push(window.setTimeout(start, aim.from), window.setTimeout(end, aim.until))
    }
  }

  /** Stops everything: the frame's board is shown, so nothing resolves over
   * the old one any more. */
  clear(): void {
    for (const t of this.timers) window.clearTimeout(t)
    this.timers = []
    if (this.state !== IDLE) this.set(IDLE)
  }

  readonly subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  readonly snapshot = (): ResolveState => this.state

  private set(next: ResolveState): void {
    this.state = next
    for (const fn of this.listeners) fn()
  }
}

/**
 * The stack entry the board marks the targets of (`Table`'s `aim`): the one
 * resolving, while something does; otherwise the one the pointer is on
 * (`focus`), or else the top — unless that has already resolved over this
 * board, which leaves nothing marked until the next board, rather than
 * marking what comes next for a moment before it resolves in turn.
 */
export function aimedEntry(
  stack: readonly ObjectId[],
  focus: ObjectId | null,
  state: ResolveState,
): ObjectId | null {
  for (let i = state.resolving.length - 1; i >= 0; i -= 1) {
    if (stack.includes(state.resolving[i])) return state.resolving[i]
  }
  const id = focus !== null && stack.includes(focus) ? focus : (stack[stack.length - 1] ?? null)
  return id !== null && state.gone.includes(id) ? null : id
}

/**
 * Which stack entries point at their targets, and how: each of `aimed` (the
 * one the board marks — the top, or the one the pointer is on) with a waiting
 * arrow unless it's resolving or has already resolved over this board, and
 * whatever is resolving with a resolving one, aimed or not.
 */
export function arrowSources(
  aimed: readonly ObjectId[],
  state: ResolveState,
): { readonly waiting: readonly ObjectId[]; readonly resolving: readonly ObjectId[] } {
  return {
    waiting: aimed.filter((id) => !state.resolving.includes(id) && !state.gone.includes(id)),
    resolving: state.resolving,
  }
}

/** The state as it stands, re-rendering the caller when it changes. */
export function useResolveState(aims: ResolveAims): ResolveState {
  return useSyncExternalStore(aims.subscribe, aims.snapshot)
}

/**
 * What a spell or ability on the stack points at, as far as `view` — the
 * viewer's own board — shows it: a permanent on the battlefield, a spell or
 * ability on the stack, or a player at the table. Anything else it targets (a
 * card in a graveyard, one this viewer can't see) has nowhere on the table
 * to point at. Each target once, however many times the object targets it.
 * Empty when `id` isn't on the stack.
 */
export function shownTargets(view: PlayerView, id: ObjectId): readonly TargetRef[] {
  const obj = view.objects[id]
  if (obj === undefined || !view.zones.stack.includes(id)) return []
  const out: TargetRef[] = []
  const seen = new Set<string>()
  for (const t of obj.targets ?? []) {
    const key = t.kind === 'player' ? `p:${t.player}` : `o:${t.object}`
    if (seen.has(key)) continue
    const shown =
      t.kind === 'player'
        ? view.turnOrder.includes(t.player)
        : view.objects[t.object] !== undefined &&
          (view.zones.battlefield.includes(t.object) || view.zones.stack.includes(t.object))
    if (!shown) continue
    seen.add(key)
    out.push(t)
  }
  return out
}
