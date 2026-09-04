/**
 * Owns the single `Game` instance and drives it from the UI.
 *
 * The engine is synchronous: `dispatch` settles the game as far as it can on
 * its own (resolving the stack, running turn-based actions for the no-priority
 * steps), stopping only when it needs a human decision — a priority holder, a
 * pending declaration, or the game being over. `seat` is whoever must act now,
 * and `view` / `actions` are always from that seat.
 */

import { useCallback, useState } from 'react'
import { Game, activePlayerOf, asPlayerId } from 'engine'
import type {
  Action,
  GameState,
  LegalAction,
  ObjectId,
  PlayerId,
  PlayerView,
} from 'engine'
import { DECKS } from './decks.ts'

export const ALICE = asPlayerId('alice')
export const BOB = asPlayerId('bob')

/** The engine has settled and now needs a human decision (or the game is over). */
const settled = (s: GameState): boolean =>
  s.result.over ||
  s.awaiting !== null ||
  (s.priority.active && s.priority.holder !== null)

/**
 * A priority window the holder can do nothing with but pass — including
 * their own main phase, if they truly have no other legal action. We skip
 * these so the player isn't asked to click "Pass" when there's nothing to do.
 */
function isDeadWindow(game: Game, holder: PlayerId): boolean {
  const acts = game.legalActions(holder)
  return acts.length === 1 && acts[0].kind === 'pass-priority'
}

function settleAndAutoPass(game: Game): void {
  game.advanceUntil(settled)
  for (let i = 0; i < 1000; i += 1) {
    const s = game.state
    if (s.result.over || s.awaiting !== null || !s.priority.active) return
    const holder = s.priority.holder
    if (holder === null || !isDeadWindow(game, holder)) return
    game.dispatch({ type: 'pass-priority', player: holder })
    game.advanceUntil(settled)
  }
}

/**
 * Passes priority — on behalf of whoever currently holds it, since it's the
 * same person operating both seats — through the rest of the current turn,
 * stopping at that turn's end step so there's still a chance to act there.
 * Also stops early on a real decision (an `awaiting`) or game over.
 */
function passRestOfTurn(game: Game): void {
  const startTurn = game.state.turn.number
  for (let i = 0; i < 1000; i += 1) {
    const s = game.state
    if (s.result.over || s.awaiting !== null) return
    if (!s.priority.active || s.priority.holder === null) return
    if (s.turn.number !== startTurn || s.turn.step === 'end') return
    game.dispatch({ type: 'pass-priority', player: s.priority.holder })
    game.advanceUntil(settled)
  }
}

function build(seed: number): Game {
  const game = Game.create({
    seed,
    decks: [
      { player: ALICE, cards: [...DECKS.alice] },
      { player: BOB, cards: [...DECKS.bob] },
    ],
  })
  settleAndAutoPass(game)
  return game
}

export interface UseGame {
  readonly seat: PlayerId
  readonly opponent: PlayerId
  readonly view: PlayerView
  readonly actions: readonly LegalAction[]
  readonly seed: number
  readonly revealAll: boolean
  /** Changes whenever the game mutates — a stable signature for `key`ing UI. */
  readonly revision: number
  /** The message from the most recent rejected dispatch, or `null`. */
  readonly lastError: string | null
  dispatch: (action: Action) => void
  /** Passes priority through the rest of the current turn, up to its end step. */
  passTurn: () => void
  reset: (seed?: number) => void
  setRevealAll: (value: boolean) => void
  clearError: () => void
  /** Card name for any object that has ever existed (for the event log). */
  nameOf: (id: ObjectId) => string
}

interface Instance {
  readonly game: Game
  readonly seed: number
}

/** `?seed=N` in the URL overrides the default starting seed (handy for repros). */
function firstSeed(fallback: number): number {
  if (typeof window === 'undefined') return fallback
  const raw = new URLSearchParams(window.location.search).get('seed')
  const n = raw === null ? NaN : Number(raw)
  return Number.isFinite(n) ? n : fallback
}

export function useGame(initialSeed = 1): UseGame {
  const [instance, setInstance] = useState<Instance>(() => {
    const seed = firstSeed(initialSeed)
    return { game: build(seed), seed }
  })
  const [revealAll, setRevealAll] = useState(false)
  const [revision, setRevision] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)

  const { game, seed } = instance
  const s = game.state

  const seat: PlayerId = s.awaiting
    ? s.awaiting.player
    : (s.priority.holder ?? activePlayerOf(s))
  const opponent = s.turnOrder.find((p) => p !== seat) ?? seat

  const view = game.viewFor(seat, { revealAll })
  const actions = game.legalActions(seat)

  const dispatch = useCallback(
    (action: Action) => {
      try {
        game.dispatch(action)
        setLastError(null)
      } catch (err) {
        console.error('dispatch rejected', action, err)
        setLastError(err instanceof Error ? err.message : String(err))
        return
      }
      settleAndAutoPass(game)
      setRevision((n) => n + 1)
    },
    [game],
  )

  const passTurn = useCallback(() => {
    try {
      passRestOfTurn(game)
      setLastError(null)
    } catch (err) {
      console.error('pass-turn rejected', err)
      setLastError(err instanceof Error ? err.message : String(err))
      return
    }
    setRevision((n) => n + 1)
  }, [game])

  const clearError = useCallback(() => setLastError(null), [])

  const nameOf = useCallback(
    (id: ObjectId): string => game.state.objects[id]?.cardName ?? id,
    [game],
  )

  const reset = useCallback((next?: number) => {
    const use = next ?? Math.floor(Math.random() * 1_000_000_000)
    setInstance({ game: build(use), seed: use })
    setRevision((n) => n + 1)
    setLastError(null)
  }, [])

  return {
    seat,
    opponent,
    view,
    actions,
    seed,
    revealAll,
    revision,
    lastError,
    dispatch,
    passTurn,
    reset,
    setRevealAll,
    clearError,
    nameOf,
  }
}
