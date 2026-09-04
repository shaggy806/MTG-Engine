import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  LegalAction,
  ObjectId,
  PlayerId,
  TargetRef,
  TargetSpec,
  VisibleObject,
} from 'engine'
import { useGame } from './game/useGame.ts'
import type { UseGame } from './game/useGame.ts'
import { BUCKET_LABEL, BUCKET_ORDER, computeBoardEntries } from './game/board.ts'
import type { Bucket, BoardEntry } from './game/board.ts'
import { playerLabel } from './format.ts'
import { PhaseTrack } from './ui/PhaseTrack.tsx'
import { PlayerPanel } from './ui/PlayerPanel.tsx'
import { CardTile } from './ui/CardTile.tsx'
import { Stack } from './ui/Stack.tsx'
import { EventLog } from './ui/EventLog.tsx'
import './App.css'

type CastAction = Extract<LegalAction, { kind: 'cast-spell' }>
type AbilityAction = Extract<LegalAction, { kind: 'activate-ability' }>
type AttackAction = Extract<LegalAction, { kind: 'declare-attackers' }>
type BlockAction = Extract<LegalAction, { kind: 'declare-blockers' }>
type OrderAction = Extract<LegalAction, { kind: 'order-blockers' }>
type DiscardAction = Extract<LegalAction, { kind: 'discard' }>

interface Targeting {
  readonly kind: 'cast' | 'activate'
  readonly source: ObjectId
  readonly abilityIndex: number
  readonly label: string
  readonly specs: readonly TargetSpec[]
  readonly options: readonly (readonly TargetRef[])[]
  readonly picked: readonly TargetRef[]
}

export default function App() {
  const game = useGame(1)
  const { view, seat } = game

  // "Pass the device" curtain: re-arm it whenever the acting seat changes.
  // (react.dev's recommended "adjust state when a prop changes" pattern.)
  const [ready, setReady] = useState(true)
  const [ackSeat, setAckSeat] = useState(seat)
  if (seat !== ackSeat) {
    setAckSeat(seat)
    setReady(false)
  }

  const over = view.result.over

  return (
    <div className="app">
      <header className="topbar">
        <h1>MTG Engine — hot seat</h1>
        <div className="topbar-right">
          <label>
            <input
              type="checkbox"
              checked={game.revealAll}
              onChange={(e) => game.setRevealAll(e.target.checked)}
            />
            reveal both hands
          </label>
          <span className="muted">seed {game.seed}</span>
          <button type="button" onClick={() => game.reset()}>
            New game
          </button>
        </div>
      </header>

      <PhaseTrack view={view} />

      <div className="seat-banner">
        {over ? 'Game over' : `${playerLabel(seat)} to act`}
      </div>

      {game.lastError ? (
        <div className="error-banner" onClick={game.clearError} role="alert">
          ⚠ {game.lastError}
        </div>
      ) : null}

      <div className="layout">
        <Table key={game.revision} game={game} />
        <aside className="sidebar">
          <Stack view={view} />
          <EventLog events={view.events} nameOf={game.nameOf} />
        </aside>
      </div>

      {!ready && !over && !game.revealAll ? (
        <div className="curtain">
          <div className="curtain-box">
            <p>Pass the device to</p>
            <h2>{playerLabel(seat)}</h2>
            <button type="button" onClick={() => setReady(true)}>
              I'm {playerLabel(seat)} — show my hand
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Everything interactive. Keyed on `game.revision` in the parent, so every
 * in-progress selection resets whenever the game state moves on.
 */
function Table({ game }: { readonly game: UseGame }) {
  const { view, actions, seat, opponent } = game

  const [targeting, setTargeting] = useState<Targeting | null>(null)
  const [selectedSource, setSelectedSource] = useState<ObjectId | null>(null)
  const [attackPicks, setAttackPicks] = useState<readonly ObjectId[]>([])
  const [blockAssign, setBlockAssign] = useState<Record<string, ObjectId>>({})
  const [blockFocus, setBlockFocus] = useState<ObjectId | null>(null)
  const [orderPicks, setOrderPicks] = useState<readonly ObjectId[]>([])
  const [discardPicks, setDiscardPicks] = useState<readonly ObjectId[]>([])

  // --- classify the legal actions ------------------------------------
  const landByCard = useMemo(() => {
    const m = new Map<ObjectId, LegalAction>()
    for (const a of actions) if (a.kind === 'play-land') m.set(a.card, a)
    return m
  }, [actions])
  const castByCard = useMemo(() => {
    const m = new Map<ObjectId, CastAction>()
    for (const a of actions) if (a.kind === 'cast-spell') m.set(a.card, a)
    return m
  }, [actions])
  const abilitiesBySource = useMemo(() => {
    const m = new Map<ObjectId, AbilityAction[]>()
    for (const a of actions) {
      if (a.kind !== 'activate-ability') continue
      const list = m.get(a.source) ?? []
      list.push(a)
      m.set(a.source, list)
    }
    return m
  }, [actions])

  const attackAction = actions.find(
    (a): a is AttackAction => a.kind === 'declare-attackers',
  )
  const blockAction = actions.find(
    (a): a is BlockAction => a.kind === 'declare-blockers',
  )
  const orderAction = actions.find(
    (a): a is OrderAction => a.kind === 'order-blockers',
  )
  const discardAction = actions.find(
    (a): a is DiscardAction => a.kind === 'discard',
  )
  const canPass = actions.some((a) => a.kind === 'pass-priority')

  const mode:
    | 'discard'
    | 'order-blockers'
    | 'attackers'
    | 'blockers'
    | 'targeting'
    | 'priority' = discardAction
    ? 'discard'
    : orderAction
      ? 'order-blockers'
      : attackAction
        ? 'attackers'
        : blockAction
          ? 'blockers'
          : targeting
            ? 'targeting'
            : 'priority'

  // --- dispatch helpers --------------------------------------------
  const pass = useCallback(() => {
    if (canPass) game.dispatch({ type: 'pass-priority', player: seat })
  }, [canPass, game, seat])

  const finishTargets = useCallback(
    (t: Pick<Targeting, 'kind' | 'source' | 'abilityIndex'>, targets: readonly TargetRef[]) => {
      game.dispatch(
        t.kind === 'cast'
          ? { type: 'cast-spell', player: seat, card: t.source, targets: [...targets] }
          : {
              type: 'activate-ability',
              player: seat,
              source: t.source,
              abilityIndex: t.abilityIndex,
              targets: [...targets],
            },
      )
    },
    [game, seat],
  )

  const beginTargeting = useCallback(
    (t: Omit<Targeting, 'picked'>) => {
      if (t.specs.length === 0) {
        finishTargets(t, [])
        return
      }
      setTargeting({ ...t, picked: [] })
    },
    [finishTargets],
  )

  const pickTarget = useCallback(
    (ref: TargetRef) => {
      if (!targeting) return
      const picked = [...targeting.picked, ref]
      if (picked.length < targeting.specs.length) {
        setTargeting({ ...targeting, picked })
        return
      }
      // All slots filled — dispatch outside any state updater (updaters must
      // be pure; React double-invokes them in dev).
      setTargeting(null)
      finishTargets(targeting, picked)
    },
    [finishTargets, targeting],
  )

  const clickHandCard = useCallback(
    (id: ObjectId) => {
      if (mode === 'discard') {
        if (!discardAction) return
        setDiscardPicks((cur) => {
          if (cur.includes(id)) return cur.filter((x) => x !== id)
          if (cur.length >= discardAction.count) return cur
          return [...cur, id]
        })
        return
      }
      if (mode !== 'priority') return
      const land = landByCard.get(id)
      if (land?.kind === 'play-land') {
        game.dispatch({ type: 'play-land', player: seat, card: id })
        return
      }
      const cast = castByCard.get(id)
      if (cast) {
        beginTargeting({
          kind: 'cast',
          source: id,
          abilityIndex: 0,
          label: `Cast ${cast.cardName}`,
          specs: cast.targetSpecs,
          options: cast.targetOptions,
        })
      }
    },
    [beginTargeting, castByCard, discardAction, game, landByCard, mode, seat],
  )

  /** Which id a click on a (possibly stacked) tile should act on. */
  const pickIdForClick = useCallback(
    (ids: readonly ObjectId[]): ObjectId => {
      if (mode === 'targeting' && targeting) {
        const slot = targeting.options[targeting.picked.length] ?? []
        const found = ids.find((i) =>
          slot.some((o) => o.kind === 'object' && o.object === i),
        )
        if (found) return found
      }
      return ids[0]
    },
    [mode, targeting],
  )

  const clickPermanent = useCallback(
    (ids: readonly ObjectId[]) => {
      const id = pickIdForClick(ids)
      if (mode === 'targeting' && targeting) {
        const slot = targeting.options[targeting.picked.length] ?? []
        if (slot.some((o) => o.kind === 'object' && o.object === id)) {
          pickTarget({ kind: 'object', object: id })
        }
        return
      }
      if (mode === 'attackers' && attackAction) {
        if (!attackAction.eligible.includes(id)) return
        setAttackPicks((cur) =>
          cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
        )
        return
      }
      if (mode === 'order-blockers' && orderAction) {
        if (!orderAction.blockers.includes(id)) return
        setOrderPicks((cur) =>
          cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
        )
        return
      }
      if (mode === 'blockers' && blockAction) {
        const entry = blockAction.eligible.find((e) => e.blocker === id)
        if (entry) {
          if (blockAssign[id]) {
            setBlockAssign((cur) => {
              const next = { ...cur }
              delete next[id]
              return next
            })
            setBlockFocus(null)
          } else if (entry.canBlock.length === 1) {
            setBlockAssign((cur) => ({ ...cur, [id]: entry.canBlock[0] }))
          } else {
            setBlockFocus((cur) => (cur === id ? null : id))
          }
          return
        }
        if (blockFocus) {
          const f = blockAction.eligible.find((e) => e.blocker === blockFocus)
          if (f?.canBlock.includes(id)) {
            setBlockAssign((cur) => ({ ...cur, [blockFocus]: id }))
            setBlockFocus(null)
          }
        }
        return
      }
      if (mode === 'priority' && abilitiesBySource.has(id)) {
        setSelectedSource((cur) => (cur === id ? null : id))
      }
    },
    [
      abilitiesBySource,
      attackAction,
      blockAction,
      blockAssign,
      blockFocus,
      mode,
      orderAction,
      pickIdForClick,
      pickTarget,
      targeting,
    ],
  )

  const clickPlayerTarget = useCallback(
    (pid: PlayerId) => {
      if (mode !== 'targeting' || !targeting) return
      const slot = targeting.options[targeting.picked.length] ?? []
      if (slot.some((o) => o.kind === 'player' && o.player === pid)) {
        pickTarget({ kind: 'player', player: pid })
      }
    },
    [mode, pickTarget, targeting],
  )

  const confirmAttackers = useCallback(() => {
    if (!attackAction) return
    game.dispatch({
      type: 'declare-attackers',
      player: seat,
      attackers: attackPicks.map((attacker) => ({
        attacker,
        defender: attackAction.defender,
      })),
    })
  }, [attackAction, attackPicks, game, seat])

  const confirmBlockers = useCallback(() => {
    game.dispatch({
      type: 'declare-blockers',
      player: seat,
      blocks: Object.entries(blockAssign).map(([blocker, attacker]) => ({
        blocker: blocker as ObjectId,
        attacker,
      })),
    })
  }, [blockAssign, game, seat])

  const confirmOrder = useCallback(
    (order: readonly ObjectId[]) => {
      if (!orderAction) return
      game.dispatch({
        type: 'order-blockers',
        player: seat,
        attacker: orderAction.attacker,
        order: [...order],
      })
    },
    [game, orderAction, seat],
  )

  const confirmDiscard = useCallback(() => {
    game.dispatch({ type: 'discard', player: seat, cards: [...discardPicks] })
  }, [discardPicks, game, seat])

  // --- keyboard ----------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' && mode === 'priority') {
        e.preventDefault()
        pass()
      } else if (e.key === 'Escape') {
        setTargeting(null)
        setSelectedSource(null)
        setBlockFocus(null)
        setOrderPicks([])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, pass])

  // --- render ----------------------------------------------------
  const targetSlot = targeting
    ? (targeting.options[targeting.picked.length] ?? [])
    : []
  const pickedObjKeys = new Set(
    (targeting?.picked ?? [])
      .filter((r) => r.kind === 'object')
      .map((r) => (r.kind === 'object' ? r.object : '')),
  )
  const playerIsTargetable = (pid: PlayerId): boolean =>
    mode === 'targeting' &&
    targetSlot.some((o) => o.kind === 'player' && o.player === pid)

  const tileFor = (
    obj: VisibleObject,
    ownerSeat: PlayerId,
    ids: readonly ObjectId[] = [obj.id],
    opts: { stackCount?: number; compact?: boolean } = {},
  ) => {
    const id = obj.id
    let highlight = false
    let selected = false
    let activatable = false
    let badge: string | null = null
    let order: number | null = null

    if (obj.attacking) badge = `⚔ ${playerLabel(obj.attacking)}`
    else if (obj.blocking) badge = `\u{1F6E1} ${game.nameOf(obj.blocking)}`

    if (mode === 'order-blockers' && orderAction) {
      if (id === orderAction.attacker) {
        badge = `${orderPicks.length}/${orderAction.blockers.length} ordered`
      } else if (orderAction.blockers.includes(id)) {
        const at = orderPicks.indexOf(id)
        highlight = at === -1
        selected = at !== -1
        order = at === -1 ? null : at + 1
      }
    } else if (mode === 'targeting') {
      highlight = ids.some((i) =>
        targetSlot.some((o) => o.kind === 'object' && o.object === i),
      )
      selected = ids.some((i) => pickedObjKeys.has(i))
    } else if (mode === 'attackers' && attackAction) {
      highlight = attackAction.eligible.includes(id)
      selected = attackPicks.includes(id)
      if (selected) badge = `⚔ ${playerLabel(attackAction.defender)}`
    } else if (mode === 'blockers' && blockAction) {
      const isBlocker = blockAction.eligible.some((e) => e.blocker === id)
      const assignedTo = blockAssign[id]
      const focusedCanHit =
        blockFocus !== null &&
        (blockAction.eligible
          .find((e) => e.blocker === blockFocus)
          ?.canBlock.includes(id) ??
          false)
      highlight = isBlocker || focusedCanHit
      selected = Boolean(assignedTo) || blockFocus === id
      if (assignedTo) badge = `\u{1F6E1} ${game.nameOf(assignedTo)}`
    } else if (mode === 'priority' && ownerSeat === seat) {
      activatable = ids.some((i) => abilitiesBySource.has(i))
      selected = selectedSource !== null && ids.includes(selectedSource)
    }

    return (
      <CardTile
        key={id}
        obj={obj}
        highlight={highlight}
        selected={selected}
        activatable={activatable}
        badge={badge}
        order={order}
        stackCount={opts.stackCount ?? null}
        compact={opts.compact ?? false}
        onClick={() => clickPermanent(ids)}
      />
    )
  }

  const renderBoard = (pid: PlayerId, isOpp: boolean) => {
    const entries = computeBoardEntries(view, pid)
    const byBucket = new Map<Bucket, BoardEntry[]>()
    for (const e of entries) {
      const list = byBucket.get(e.bucket) ?? []
      list.push(e)
      byBucket.set(e.bucket, list)
    }
    const nonEmpty = BUCKET_ORDER.filter((b) => (byBucket.get(b)?.length ?? 0) > 0)
    return (
      <div className={`board ${isOpp ? 'opp' : 'you'}`}>
        {nonEmpty.length === 0 ? (
          <div className="board-empty">no permanents</div>
        ) : (
          nonEmpty.map((bucket) => (
            <div className="board-section" key={bucket}>
              <div className="board-section-label">{BUCKET_LABEL[bucket]}</div>
              <div className="board-section-cards">
                {(byBucket.get(bucket) ?? []).map((entry) => (
                  <div className="board-entry" key={entry.ids[0]}>
                    {tileFor(entry.sample, pid, entry.ids, {
                      stackCount: entry.ids.length,
                    })}
                    {entry.attachments.length > 0 ? (
                      <div className="attachments">
                        {entry.attachments.map((a) => (
                          <div key={a.id}>
                            {tileFor(a, pid, [a.id], { compact: true })}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  const handIds = view.zones.hands[seat] ?? []
  const seatInfo = view.players[seat]
  const oppInfo = view.players[opponent]

  let controls: ReactNode
  if (view.result.over) {
    controls = (
      <div className="controls">
        <strong>
          {view.result.winner ? `${playerLabel(view.result.winner)} wins` : 'Draw'}
        </strong>
        <span className="muted">{view.result.reason}</span>
      </div>
    )
  } else if (mode === 'targeting' && targeting) {
    controls = (
      <div className="controls">
        <span>
          {targeting.label}: choose {targeting.specs[targeting.picked.length]} (
          {targeting.picked.length + 1}/{targeting.specs.length})
        </span>
        <button type="button" onClick={() => setTargeting(null)}>
          Cancel
        </button>
      </div>
    )
  } else if (mode === 'attackers') {
    controls = (
      <div className="controls">
        <span>Declare attackers — {attackPicks.length} selected</span>
        <button type="button" onClick={confirmAttackers}>
          {attackPicks.length === 0
            ? 'No attacks'
            : `Attack with ${attackPicks.length}`}
        </button>
      </div>
    )
  } else if (mode === 'order-blockers' && orderAction) {
    const total = orderAction.blockers.length
    controls = (
      <div className="controls">
        <span>
          Order {game.nameOf(orderAction.attacker)}'s blockers — click them in
          the order they take damage ({orderPicks.length}/{total})
        </span>
        <button
          type="button"
          onClick={() => confirmOrder(orderAction.blockers)}
        >
          Keep default order
        </button>
        <button
          type="button"
          disabled={orderPicks.length !== total}
          onClick={() => confirmOrder(orderPicks)}
        >
          Confirm order
        </button>
        {orderPicks.length > 0 ? (
          <button type="button" onClick={() => setOrderPicks([])}>
            Reset
          </button>
        ) : null}
      </div>
    )
  } else if (mode === 'blockers' && blockAction) {
    const n = Object.keys(blockAssign).length
    const counts = new Map<ObjectId, number>()
    for (const attacker of Object.values(blockAssign)) {
      counts.set(attacker, (counts.get(attacker) ?? 0) + 1)
    }
    const loneMenace = blockAction.menaceAttackers.filter(
      (id) => counts.get(id) === 1,
    )
    controls = (
      <div className="controls">
        <span>
          Declare blockers — {n} assigned
          {blockFocus
            ? ` · pick an attacker for ${game.nameOf(blockFocus)}`
            : ''}
          {loneMenace.length > 0
            ? ` · ${loneMenace
                .map((id) => game.nameOf(id))
                .join(', ')} has menace (needs 2+ blockers)`
            : ''}
        </span>
        <button
          type="button"
          onClick={() => {
            setBlockAssign({})
            setBlockFocus(null)
          }}
        >
          Clear
        </button>
        <button
          type="button"
          disabled={loneMenace.length > 0}
          onClick={confirmBlockers}
        >
          {n === 0 ? 'No blocks' : `Block (${n})`}
        </button>
      </div>
    )
  } else if (mode === 'discard' && discardAction) {
    controls = (
      <div className="controls">
        <span>
          Discard to hand size — {discardPicks.length}/{discardAction.count}
        </span>
        <button
          type="button"
          disabled={discardPicks.length !== discardAction.count}
          onClick={confirmDiscard}
        >
          Discard
        </button>
      </div>
    )
  } else {
    controls = (
      <div className="controls">
        <span className="muted">
          {playerLabel(seat)} has priority · {view.turn.step}
        </span>
        <button type="button" onClick={pass} disabled={!canPass}>
          Pass (space)
        </button>
      </div>
    )
  }

  const selectedAbilities = selectedSource
    ? (abilitiesBySource.get(selectedSource) ?? [])
    : []

  return (
    <div className="player-col">
      <main className="table">
        <PlayerPanel
          info={oppInfo}
          isActive={view.activePlayer === opponent}
          hasPriority={view.priority.holder === opponent}
          targetable={playerIsTargetable(opponent)}
          onTargetClick={() => clickPlayerTarget(opponent)}
        />
        {renderBoard(opponent, true)}

        {game.revealAll ? (
          <div className="hand opp-hand">
            <h3>
              {playerLabel(opponent)}'s hand (
              {(view.zones.hands[opponent] ?? []).length})
            </h3>
            <div className="hand-cards">
              {(view.zones.hands[opponent] ?? []).map((id) => {
                const obj = view.objects[id]
                return obj ? <CardTile key={id} obj={obj} /> : null
              })}
            </div>
          </div>
        ) : null}

        {renderBoard(seat, false)}
        <PlayerPanel
          info={seatInfo}
          isActive={view.activePlayer === seat}
          hasPriority={view.priority.holder === seat}
          targetable={playerIsTargetable(seat)}
          onTargetClick={() => clickPlayerTarget(seat)}
        />
      </main>

      {selectedAbilities.length > 0 ? (
        <div className="ability-menu">
          <span>{game.nameOf(selectedSource as ObjectId)}:</span>
          {selectedAbilities.map((ab) => (
            <button
              key={ab.abilityIndex}
              type="button"
              onClick={() =>
                beginTargeting({
                  kind: 'activate',
                  source: ab.source,
                  abilityIndex: ab.abilityIndex,
                  label: ab.text || `${ab.cardName} ability`,
                  specs: ab.targetSpecs,
                  options: ab.targetOptions,
                })
              }
            >
              {ab.text || `ability ${ab.abilityIndex}`}
            </button>
          ))}
        </div>
      ) : null}

      {controls}

      <div className="hand">
        <h3>
          {playerLabel(seat)}'s hand ({handIds.length})
        </h3>
        <div className="hand-cards">
          {handIds.map((id) => {
            const obj = view.objects[id]
            if (!obj) return null
            let highlight = false
            let selected = false
            if (mode === 'discard') {
              highlight = discardAction?.from.includes(id) ?? false
              selected = discardPicks.includes(id)
            } else if (mode === 'priority') {
              highlight = landByCard.has(id) || castByCard.has(id)
            }
            return (
              <CardTile
                key={id}
                obj={obj}
                highlight={highlight}
                selected={selected}
                onClick={() => clickHandCard(id)}
              />
            )
          })}
          {handIds.length === 0 ? <span className="muted">empty</span> : null}
        </div>
      </div>
    </div>
  )
}
