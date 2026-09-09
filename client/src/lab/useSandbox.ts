import { useCallback, useMemo, useState } from 'react'
import type { Action, LegalAction, ObjectId, PlayerView, Sandbox } from 'engine'
import { createSandbox, sandboxAdvance } from 'engine'

export interface SandboxGame {
  readonly view: PlayerView
  readonly actions: readonly LegalAction[]
  readonly revision: number
  /** The preview card's battlefield / hand instance ids, if spawned. */
  readonly onBattlefield: ObjectId | null
  readonly inHand: ObjectId | null
  dispatch: (action: Action) => void
  reset: () => void
  nameOf: (id: ObjectId) => string
}

interface State {
  readonly sb: Sandbox
  readonly view: PlayerView
  readonly actions: readonly LegalAction[]
  readonly revision: number
}

function build(cardName: string, revision: number): State {
  const sb = createSandbox(cardName)
  return { sb, view: sb.game.viewFor(sb.you), actions: sb.game.legalActions(sb.you), revision }
}

function reread(cur: State): State {
  return {
    sb: cur.sb,
    view: cur.sb.game.viewFor(cur.sb.you),
    actions: cur.sb.game.legalActions(cur.sb.you),
    revision: cur.revision + 1,
  }
}

/**
 * Drives a one-card {@link createSandbox} game locally (no server). Mirrors the
 * slice of `useNetworkGame` the lab needs. Mount with `key={cardName}` so a new
 * card gets a fresh game.
 */
export function useSandbox(cardName: string): SandboxGame {
  const [state, setState] = useState<State>(() => build(cardName, 0))

  const dispatch = useCallback(
    (action: Action) => {
      // Mutate the engine game *before* setState — React double-invokes
      // updaters in dev, so a dispatch inside one would fire twice.
      try {
        state.sb.game.dispatch(action)
        sandboxAdvance(state.sb.game)
      } catch (err) {
        console.error('[card-lab] dispatch rejected', err)
      }
      setState(reread)
    },
    [state.sb],
  )

  const reset = useCallback(() => {
    setState(build(cardName, state.revision + 1))
  }, [cardName, state.revision])

  const nameOf = useCallback(
    (id: ObjectId): string => {
      const o = state.view.objects[id]
      return o ? (o.faceName ?? o.cardName) : id
    },
    [state.view],
  )

  return useMemo(
    () => ({
      view: state.view,
      actions: state.actions,
      revision: state.revision,
      onBattlefield: (state.sb.onBattlefield ?? null) as ObjectId | null,
      inHand: (state.sb.inHand ?? null) as ObjectId | null,
      dispatch,
      reset,
      nameOf,
    }),
    [state, dispatch, reset, nameOf],
  )
}
