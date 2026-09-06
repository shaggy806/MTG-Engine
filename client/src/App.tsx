import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  LegalAction,
  ObjectId,
  PlayerId,
  PlayerView,
  TargetRef,
  TargetSpec,
  VisibleObject,
} from 'engine'
import { useNetworkGame } from './net/useNetworkGame.ts'
import type { NetworkGame } from './net/useNetworkGame.ts'
import { computeBoardEntries } from './game/board.ts'
import type { BoardEntry } from './game/board.ts'
import { playerLabel, seatClassOf } from './format.ts'
import { PhaseTrack } from './ui/PhaseTrack.tsx'
import { TurnBanner } from './ui/TurnBanner.tsx'
import { PlayerPanel } from './ui/PlayerPanel.tsx'
import { CardTile } from './ui/CardTile.tsx'
import { Stack } from './ui/Stack.tsx'
import { EventLog } from './ui/EventLog.tsx'
import { ZoneViewer } from './ui/ZoneViewer.tsx'
import './App.css'

type CastAction = Extract<LegalAction, { kind: 'cast-spell' }>
type AbilityAction = Extract<LegalAction, { kind: 'activate-ability' }>
type AttackAction = Extract<LegalAction, { kind: 'declare-attackers' }>
type BlockAction = Extract<LegalAction, { kind: 'declare-blockers' }>
type OrderAction = Extract<LegalAction, { kind: 'order-blockers' }>
type DiscardAction = Extract<LegalAction, { kind: 'discard' }>
type ZoneChoiceAction = Extract<LegalAction, { kind: 'choose-from-zone' }>
type MulliganAction = Extract<LegalAction, { kind: 'mulligan' }>
type BottomAction = Extract<LegalAction, { kind: 'put-on-bottom' }>

interface Targeting {
  readonly kind: 'cast' | 'activate'
  readonly source: ObjectId
  readonly abilityIndex: number
  readonly label: string
  readonly specs: readonly TargetSpec[]
  readonly options: readonly (readonly TargetRef[])[]
  readonly picked: readonly TargetRef[]
}

/**
 * Whoever the engine is actually waiting on right now — a pending
 * declaration (attackers/blockers/discard/order-blockers) if there is one,
 * else the current priority holder. NOT the same as "my seat": each device
 * only ever represents one seat, so unlike the old hot-seat client, "my
 * seat" and "whoever must act" are frequently different players.
 */
function actingPlayer(view: PlayerView): PlayerId | null {
  if (view.awaiting !== null) return view.awaiting.player
  return view.priority.active ? view.priority.holder : null
}

const AWAITING_LABEL: Record<NonNullable<PlayerView['awaiting']>['kind'], string> = {
  attackers: 'declare attackers',
  blockers: 'declare blockers',
  discard: 'discard',
  'order-blockers': 'order blockers',
  'choose-from-zone': 'look at cards',
  mulligan: 'decide on a mulligan',
  'mulligan-bottom': 'put cards on the bottom of their library',
}

export default function App() {
  const game = useNetworkGame()

  if (game.status === 'connecting') {
    return <CenteredScreen title="Connecting…" />
  }
  if (game.status === 'disconnected') {
    return (
      <CenteredScreen title="Reconnecting…">
        <p className="muted">
          Lost the connection to the room server — retrying automatically.
        </p>
        <button type="button" onClick={game.reconnect}>
          Retry now
        </button>
      </CenteredScreen>
    )
  }
  if (game.status === 'room-not-found') {
    return <LobbyScreen game={game} notFound />
  }
  if (game.status === 'no-room') {
    return <LobbyScreen game={game} />
  }
  if (game.status === 'choosing-seat') {
    return <SeatPickerScreen game={game} />
  }
  return <GameScreen game={game} />
}

function CenteredScreen({
  title,
  children,
}: {
  readonly title: string
  readonly children?: ReactNode
}) {
  return (
    <div className="overlay">
      <div className="overlay-box">
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}

function ErrorLine({ game }: { readonly game: NetworkGame }) {
  if (!game.error) return null
  return (
    <div className="error-banner" onClick={game.clearError} role="alert">
      ⚠ {game.error}
    </div>
  )
}

function LobbyScreen({
  game,
  notFound = false,
}: {
  readonly game: NetworkGame
  readonly notFound?: boolean
}) {
  const [joinCode, setJoinCode] = useState('')
  const [players, setPlayers] = useState(2)
  return (
    <CenteredScreen title="MTG Engine">
      {notFound ? (
        <p className="muted">
          That room wasn't found — it may have closed. Start a new one or try
          another code.
        </p>
      ) : null}
      <ErrorLine game={game} />
      <div className="player-count-picker">
        {[2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            className={n === players ? 'selected' : ''}
            onClick={() => setPlayers(n)}
          >
            {n} players
          </button>
        ))}
      </div>
      <button type="button" onClick={() => game.createRoom(undefined, players)}>
        Create a game
      </button>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const code = joinCode.trim().toUpperCase()
          if (code) game.joinRoom(code)
        }}
      >
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          placeholder="Room code"
          maxLength={5}
        />
        <button type="submit" disabled={!joinCode.trim()}>
          Join
        </button>
      </form>
    </CenteredScreen>
  )
}

function SeatPickerScreen({ game }: { readonly game: NetworkGame }) {
  const [name, setName] = useState('')
  return (
    <CenteredScreen title={`Room ${game.roomId ?? ''}`}>
      <p className="muted">Share this room code, then everyone picks a seat.</p>
      <ErrorLine game={game} />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name (optional)"
        maxLength={20}
      />
      <div className="seat-picker">
        {game.seats.map((s) => (
          <button
            key={s.player}
            type="button"
            disabled={s.claimed}
            onClick={() => game.claimSeat(s.player, name.trim() || undefined)}
          >
            {playerLabel(s.player, game.seats)}
            {s.claimed ? (s.online ? ' (taken)' : ' (taken · offline)') : ''}
          </button>
        ))}
      </div>
    </CenteredScreen>
  )
}

/** Renders once `useNetworkGame` has a claimed seat and a pushed view. */
function GameScreen({ game }: { readonly game: NetworkGame }) {
  const { view, seat, opponents } = game
  const [showHistory, setShowHistory] = useState(false)
  if (view === null || seat === null || opponents.length === 0) {
    return <CenteredScreen title="Loading…" />
  }
  const over = view.result.over
  const activeSeatClass = seatClassOf(view.turnOrder, view.activePlayer)

  return (
    <div className={`app active-${activeSeatClass}`}>
      <header className="topbar">
        <h1>MTG Engine</h1>
        <div className="topbar-right">
          <button type="button" onClick={() => setShowHistory(true)}>
            History
          </button>
          <span className="muted">room {game.roomId}</span>
          <button type="button" onClick={() => window.location.assign('/')}>
            Leave
          </button>
        </div>
      </header>

      <div className="seat-banner">
        {over ? 'Game over' : `${playerLabel(actingPlayer(view) ?? seat, game.seats)} to act`}
      </div>

      <ErrorLine game={game} />

      <Table key={game.revision} view={view} seat={seat} opponents={opponents} game={game} />

      {view.zones.stack.length > 0 ? <Stack view={view} /> : null}

      {showHistory ? (
        <div className="zone-viewer-overlay" onClick={() => setShowHistory(false)}>
          <div
            className="zone-viewer-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="History"
          >
            <div className="zone-viewer-head">
              <h2>History</h2>
              <button type="button" onClick={() => setShowHistory(false)}>
                Close
              </button>
            </div>
            <EventLog events={view.events} nameOf={game.nameOf} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

interface TableProps {
  readonly view: PlayerView
  readonly seat: PlayerId
  readonly opponents: readonly PlayerId[]
  readonly game: NetworkGame
}

/**
 * Everything interactive. Keyed on `game.revision` in the parent, so every
 * in-progress selection resets whenever the game state moves on.
 */
function Table({ view, seat, opponents, game }: TableProps) {
  const actions = game.actions

  const [targeting, setTargeting] = useState<Targeting | null>(null)
  const [selectedSource, setSelectedSource] = useState<ObjectId | null>(null)
  // Attacker -> chosen defender. With more than one legal opponent, clicking
  // an attacker assigns it to the first opponent by default and focuses it;
  // clicking a different opponent's panel while focused redirects it.
  const [attackAssignments, setAttackAssignments] = useState<Record<string, PlayerId>>({})
  const [attackFocus, setAttackFocus] = useState<ObjectId | null>(null)
  const [blockAssign, setBlockAssign] = useState<Record<string, ObjectId>>({})
  const [blockFocus, setBlockFocus] = useState<ObjectId | null>(null)
  const [orderPicks, setOrderPicks] = useState<readonly ObjectId[]>([])
  const [discardPicks, setDiscardPicks] = useState<readonly ObjectId[]>([])
  const [bottomPicks, setBottomPicks] = useState<readonly ObjectId[]>([])
  const [zoneView, setZoneView] = useState<{
    readonly title: string
    readonly ids: readonly ObjectId[]
  } | null>(null)

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
  const zoneChoiceAction = actions.find(
    (a): a is ZoneChoiceAction => a.kind === 'choose-from-zone',
  )
  const mulliganAction = actions.find(
    (a): a is MulliganAction => a.kind === 'mulligan',
  )
  const bottomAction = actions.find(
    (a): a is BottomAction => a.kind === 'put-on-bottom',
  )
  const canPass = actions.some((a) => a.kind === 'pass-priority')
  // Only the active player may skip the rest of their own turn — a defender
  // holding priority to respond during it shouldn't get this button.
  const canPassTurn = canPass && seat === view.activePlayer

  const mode:
    | 'discard'
    | 'order-blockers'
    | 'attackers'
    | 'blockers'
    | 'choose-from-zone'
    | 'mulligan'
    | 'put-on-bottom'
    | 'targeting'
    | 'priority' = mulliganAction
    ? 'mulligan'
    : bottomAction
      ? 'put-on-bottom'
      : discardAction
        ? 'discard'
        : orderAction
          ? 'order-blockers'
          : attackAction
            ? 'attackers'
            : blockAction
              ? 'blockers'
              : zoneChoiceAction
                ? 'choose-from-zone'
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
      if (mode === 'put-on-bottom') {
        if (!bottomAction) return
        setBottomPicks((cur) => {
          if (cur.includes(id)) return cur.filter((x) => x !== id)
          if (cur.length >= bottomAction.count) return cur
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
    [beginTargeting, bottomAction, castByCard, discardAction, game, landByCard, mode, seat],
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
        const hasMultipleDefenders = attackAction.defenders.length > 1
        if (attackAssignments[id] !== undefined) {
          if (!hasMultipleDefenders || attackFocus === id) {
            setAttackAssignments((cur) => {
              const next = { ...cur }
              delete next[id]
              return next
            })
            setAttackFocus(null)
          } else {
            // Assigned but not the focused one — refocus it so the next
            // opponent-panel click can redirect it.
            setAttackFocus(id)
          }
          return
        }
        setAttackAssignments((cur) => ({ ...cur, [id]: attackAction.defenders[0] }))
        setAttackFocus(hasMultipleDefenders ? id : null)
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
      attackAssignments,
      attackFocus,
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
      if (mode === 'attackers' && attackFocus && attackAction) {
        if (attackAction.defenders.includes(pid)) {
          setAttackAssignments((cur) => ({ ...cur, [attackFocus]: pid }))
          setAttackFocus(null)
        }
        return
      }
      if (mode !== 'targeting' || !targeting) return
      const slot = targeting.options[targeting.picked.length] ?? []
      if (slot.some((o) => o.kind === 'player' && o.player === pid)) {
        pickTarget({ kind: 'player', player: pid })
      }
    },
    [attackAction, attackFocus, mode, pickTarget, targeting],
  )

  const confirmAttackers = useCallback(() => {
    game.dispatch({
      type: 'declare-attackers',
      player: seat,
      attackers: Object.entries(attackAssignments).map(([attacker, defender]) => ({
        attacker: attacker as ObjectId,
        defender,
      })),
    })
  }, [attackAssignments, game, seat])

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

  const confirmZoneChoice = useCallback(
    (chosen: readonly ObjectId[]) => {
      game.dispatch({ type: 'choose-from-zone', player: seat, chosen: [...chosen] })
    },
    [game, seat],
  )

  const confirmMulligan = useCallback(
    (keep: boolean) => {
      game.dispatch({ type: 'mulligan', player: seat, keep })
    },
    [game, seat],
  )

  const confirmBottom = useCallback(() => {
    game.dispatch({ type: 'put-on-bottom', player: seat, cards: [...bottomPicks] })
  }, [bottomPicks, game, seat])

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
  const playerIsTargetable = (pid: PlayerId): boolean => {
    if (mode === 'attackers' && attackFocus && attackAction) {
      return attackAction.defenders.includes(pid)
    }
    return (
      mode === 'targeting' &&
      targetSlot.some((o) => o.kind === 'player' && o.player === pid)
    )
  }

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

    if (obj.attacking) badge = `⚔ ${playerLabel(obj.attacking, game.seats)}`
    else if (obj.blocking) badge = `\u{1F6E1} ${game.nameOf(obj.blocking)}`
    else if (obj.isCommander) badge = 'Commander'

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
      const assignedTo = attackAssignments[id]
      selected = assignedTo !== undefined
      if (assignedTo) {
        badge = `⚔ ${playerLabel(assignedTo, game.seats)}${attackFocus === id ? ' ?' : ''}`
      }
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
    const lands = entries.filter((e) => e.bucket === 'land')
    // Creatures, artifacts, and enchantments all share one area — no
    // per-type labels or sub-columns, just "everything that isn't a land".
    const permanents = entries.filter((e) => e.bucket !== 'land')

    const renderEntries = (list: readonly BoardEntry[]) => (
      <div className="board-row-cards">
        {list.map((entry) => (
          <div className="board-entry" key={entry.ids[0]}>
            {tileFor(entry.sample, pid, entry.ids, {
              stackCount: entry.ids.length,
            })}
            {entry.attachments.length > 0 ? (
              <div className="attachments">
                {entry.attachments.map((a) => (
                  <div key={a.id}>{tileFor(a, pid, [a.id], { compact: true })}</div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    )

    // Lands and permanents each always reserve their row, even empty, so the
    // board doesn't resize/jump around as things come and go. Lands get
    // their own row, like a physical Commander table's mana base — kept
    // nearest this player's own edge (below their permanents when it's your
    // own board, above when it's the opponent's, so creatures from both
    // sides meet toward the middle of the screen).
    const landRow = (
      <div className="board-row" key="lands">
        {renderEntries(lands)}
      </div>
    )
    const permanentRow = (
      <div className="board-row" key="permanents">
        {renderEntries(permanents)}
      </div>
    )
    const rows = isOpp ? [landRow, permanentRow] : [permanentRow, landRow]

    return (
      <div className={`board ${isOpp ? 'opp' : 'you'} ${seatClassOf(view.turnOrder, pid)}`}>
        {rows}
      </div>
    )
  }

  /** Command zone (above) + library (below), to the right of a player's
   * board. The library shows a face-down back by default — the count is
   * still public — unless something that player controls (e.g. Oracle of
   * Mul Daya) makes its top card public knowledge, in which case that card
   * renders face-up in its place. */
  /** A commander in the command zone isn't a battlefield permanent, so it
   * doesn't go through `tileFor` (targeting/attacking/blocking don't apply)
   * — it's castable like a hand card instead, via the same `castByCard`
   * map and `clickHandCard` dispatch (which only ever consults that map,
   * not which zone the card is actually sitting in). */
  const commandZoneTile = (obj: VisibleObject) => {
    const castable = mode === 'priority' && castByCard.has(obj.id)
    const commanderTax = 2 * (view.players[obj.owner]?.commanderCastCount ?? 0)
    return (
      <CardTile
        key={obj.id}
        obj={obj}
        highlight={castable}
        badge="Commander"
        extraGenericCost={commanderTax}
        onClick={castable ? () => clickHandCard(obj.id) : undefined}
      />
    )
  }

  const renderSideZone = (pid: PlayerId) => {
    const commandIds = view.zones.command.filter((id) => view.objects[id]?.owner === pid)
    const topId = view.revealedLibraryTop[pid] ?? null
    const topObj = topId !== null ? view.objects[topId] : undefined
    const librarySize = view.players[pid].librarySize

    return (
      <div className={`side-zone ${seatClassOf(view.turnOrder, pid)}`}>
        <div className="side-zone-section">
          <div className="side-zone-label">Command</div>
          <div className="side-zone-cards">
            {commandIds.length > 0 ? (
              commandIds.map((id) => {
                const obj = view.objects[id]
                return obj ? commandZoneTile(obj) : null
              })
            ) : (
              <div className="card-slot-empty" title="empty command zone" />
            )}
          </div>
        </div>
        <div className="side-zone-section">
          <div className="side-zone-label">Library ({librarySize})</div>
          <div className="side-zone-cards">
            {topObj ? (
              tileFor(topObj, pid, [topObj.id])
            ) : librarySize > 0 ? (
              <div
                className="card-back"
                title={`${librarySize} card${librarySize === 1 ? '' : 's'} face down`}
              >
                <span className="card-back-count">{librarySize}</span>
              </div>
            ) : (
              <div className="side-zone-empty">empty</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const handIds = view.zones.hands[seat] ?? []
  const onlineOf = (pid: PlayerId): boolean | null =>
    game.seats.find((s) => s.player === pid)?.online ?? null
  // Exile is one shared zone (not per-player) — split it by each object's
  // owner so it can be shown/browsed per player-panel like the graveyard is.
  const exileOf = (pid: PlayerId): readonly ObjectId[] =>
    view.zones.exile.filter((id) => view.objects[id]?.owner === pid)
  const openZone = (title: string, ids: readonly ObjectId[]) =>
    setZoneView({ title, ids })

  let controls: ReactNode
  if (view.result.over) {
    controls = (
      <div className="controls">
        <strong>
          {view.result.winner ? `${playerLabel(view.result.winner, game.seats)} wins` : 'Draw'}
        </strong>
        <span className="muted">{view.result.reason}</span>
      </div>
    )
  } else if (mode === 'mulligan' && mulliganAction) {
    controls = (
      <div className="controls">
        <span>
          {mulliganAction.count === 0
            ? 'Keep your opening hand?'
            : `Mulligan #${mulliganAction.count} taken — keep this hand?`}
        </span>
        <button type="button" onClick={() => confirmMulligan(true)}>
          Keep
        </button>
        <button type="button" onClick={() => confirmMulligan(false)}>
          Mulligan
        </button>
      </div>
    )
  } else if (mode === 'put-on-bottom' && bottomAction) {
    controls = (
      <div className="controls">
        <span>
          Put {bottomAction.count} card(s) on the bottom of your library —{' '}
          {bottomPicks.length}/{bottomAction.count}
        </span>
        <button
          type="button"
          disabled={bottomPicks.length !== bottomAction.count}
          onClick={confirmBottom}
        >
          Confirm
        </button>
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
  } else if (mode === 'attackers' && attackAction) {
    const assignedCount = Object.keys(attackAssignments).length
    const allSelected = assignedCount === attackAction.eligible.length
    controls = (
      <div className="controls">
        <span>
          Declare attackers — {assignedCount} selected
          {attackFocus
            ? ` · pick an opponent for ${game.nameOf(attackFocus)}`
            : ''}
        </span>
        <button
          type="button"
          disabled={attackAction.eligible.length === 0 || allSelected}
          onClick={() => {
            setAttackAssignments(
              Object.fromEntries(
                attackAction.eligible.map((id) => [id, attackAction.defenders[0]]),
              ),
            )
            setAttackFocus(null)
          }}
        >
          Attack with all
        </button>
        <button type="button" onClick={confirmAttackers}>
          {assignedCount === 0
            ? 'No attacks'
            : `Attack with ${assignedCount}`}
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
  } else if (mode === 'choose-from-zone' && zoneChoiceAction) {
    controls = (
      <div className="controls">
        <span className="muted">Look at the popup to choose</span>
      </div>
    )
  } else {
    // Reaching this fallback with `awaiting` set always means it's someone
    // else's declaration pending (a decision of ours would have matched one
    // of the branches above) — that's a "waiting on them", not a priority
    // window of our own.
    const who = actingPlayer(view) ?? seat
    const awaiting = view.awaiting
    controls = (
      <div className="controls">
        <span className="muted">
          {awaiting !== null
            ? `Waiting for ${playerLabel(who, game.seats)} to ${AWAITING_LABEL[awaiting.kind]}…`
            : `${playerLabel(who, game.seats)} has priority · ${view.turn.step}`}
        </span>
        <button type="button" onClick={pass} disabled={!canPass}>
          Pass (space)
        </button>
        <button type="button" onClick={game.passTurn} disabled={!canPassTurn}>
          Pass Turn
        </button>
        <button type="button" onClick={game.autoPass}>
          {game.autoPassing ? 'Stop auto-pass' : 'Auto-pass until my turn'}
        </button>
        <button type="button" onClick={game.toggleManaSkip}>
          {game.skipManaOnly ? 'Show mana-only priority' : 'Skip mana-only priority'}
        </button>
      </div>
    )
  }

  const selectedAbilities = selectedSource
    ? (abilitiesBySource.get(selectedSource) ?? [])
    : []

  const renderPlayerPanel = (pid: PlayerId) => (
    <PlayerPanel
      key={pid}
      info={view.players[pid]}
      seatClass={seatClassOf(view.turnOrder, pid)}
      isActive={view.activePlayer === pid}
      hasPriority={view.priority.holder === pid}
      online={onlineOf(pid)}
      seats={game.seats}
      exileSize={exileOf(pid).length}
      onOpenGraveyard={() =>
        openZone(`${playerLabel(pid, game.seats)}'s graveyard`, view.zones.graveyards[pid] ?? [])
      }
      onOpenExile={() => openZone(`${playerLabel(pid, game.seats)}'s exile`, exileOf(pid))}
      onOpenHand={
        pid === seat
          ? undefined
          : () => openZone(`${playerLabel(pid, game.seats)}'s hand`, view.zones.hands[pid] ?? [])
      }
      targetable={playerIsTargetable(pid)}
      onTargetClick={() => clickPlayerTarget(pid)}
    />
  )

  /** The ability menu (for a selected permanent with 2+ activated
   * abilities), the priority/attack/block/etc. controls, and your own hand
   * — the interactive strip below your board, shared by both the classic
   * 2-player layout (inline in `.player-area`) and the 3-4 player quadrant
   * layout (its own full-width strip below the grid). */
  const renderHandAndControls = () => (
    <>
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
          {playerLabel(seat, game.seats)}'s hand ({handIds.length})
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
            } else if (mode === 'put-on-bottom') {
              highlight = bottomAction?.from.includes(id) ?? false
              selected = bottomPicks.includes(id)
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
    </>
  )

  // 1 opponent (a 2-player game): the classic vertical layout, unchanged.
  // 2-3 opponents (3-4 players): a 2x2 quadrant grid instead, per-cell order
  // [opponents[0], opponents[1], you, opponents[2]] — top-left, top-right,
  // bottom-left (always you), bottom-right, with a 3-player game simply
  // leaving the 4th cell blank.
  const isQuadrant = opponents.length >= 2

  return (
    <div className="player-col">
      {isQuadrant ? (
        <>
          <div className="pinned-top">
            <PhaseTrack view={view} seats={game.seats} />
            <TurnBanner view={view} seats={game.seats} />
          </div>

          <main className="table">
            <div className="quadrant-grid">
              {[opponents[0], opponents[1], seat, opponents[2]].map((pid, index) => {
                if (pid === undefined) {
                  return <div className="quadrant-blank" key={`blank-${index}`} />
                }
                return (
                  <div
                    className={`quadrant-cell ${pid === seat ? 'self' : ''}`}
                    key={pid}
                  >
                    {renderPlayerPanel(pid)}
                    <div className="board-with-sidezone">
                      {renderBoard(pid, pid !== seat)}
                      {renderSideZone(pid)}
                    </div>
                  </div>
                )
              })}
            </div>
          </main>

          <div className="hand-strip">{renderHandAndControls()}</div>
        </>
      ) : (
        <>
          <div className="pinned-top">
            <PhaseTrack view={view} seats={game.seats} />
            <TurnBanner view={view} seats={game.seats} />
            {opponents.map(renderPlayerPanel)}
          </div>

          <main className="table">
            {opponents.map((pid) => (
              <div className="opponent-block" key={pid}>
                <div className="board-with-sidezone">
                  {renderBoard(pid, true)}
                  {renderSideZone(pid)}
                </div>
              </div>
            ))}

            <div className="player-area-with-sidezone">
              <div className="player-area">{renderBoard(seat, false)}</div>
              {renderSideZone(seat)}
            </div>
          </main>

          <div className="hand-strip">{renderHandAndControls()}</div>

          <div className="pinned-bottom">{renderPlayerPanel(seat)}</div>
        </>
      )}

      {zoneView ? (
        <ZoneViewer
          title={zoneView.title}
          ids={zoneView.ids}
          resolve={(id) => view.objects[id]}
          onClose={() => setZoneView(null)}
        />
      ) : null}

      {mode === 'choose-from-zone' && zoneChoiceAction ? (
        <ZoneViewer
          title="Choose from these cards"
          ids={zoneChoiceAction.ids}
          resolve={(id) => view.objects[id]}
          selection={{
            min: zoneChoiceAction.min,
            max: zoneChoiceAction.max,
            eligible: zoneChoiceAction.eligible,
            onConfirm: confirmZoneChoice,
          }}
        />
      ) : null}
    </div>
  )
}
