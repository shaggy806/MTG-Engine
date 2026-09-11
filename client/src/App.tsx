import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type {
  CastVia,
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
import type { DeckFormatReport, ImportedCardReport } from './net/protocol.ts'
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
import { Symbols } from './ui/Symbols.tsx'
import './App.css'

// Same host/port convention as useNetworkGame's SERVER_URL, but http(s) for
// this one-off request/response endpoint rather than the room's WebSocket.
const IMPORT_DECK_URL = `${
  ((import.meta.env.VITE_SERVER_URL as string | undefined) ?? `ws://${window.location.hostname}:4000`)
    .replace(/^ws/, 'http')
}/import-deck`

type CastAction = Extract<LegalAction, { kind: 'cast-spell' }>
type LandAction = Extract<LegalAction, { kind: 'play-land' }>
type SuspendAction = Extract<LegalAction, { kind: 'suspend' }>
type ForetellAction = Extract<LegalAction, { kind: 'foretell' }>
type CycleAction = Extract<LegalAction, { kind: 'cycle' }>
type AbilityAction = Extract<LegalAction, { kind: 'activate-ability' }>
type AttackAction = Extract<LegalAction, { kind: 'declare-attackers' }>
type BlockAction = Extract<LegalAction, { kind: 'declare-blockers' }>
type OrderAction = Extract<LegalAction, { kind: 'order-blockers' }>
type DiscardAction = Extract<LegalAction, { kind: 'discard' }>
type ZoneChoiceAction = Extract<LegalAction, { kind: 'choose-from-zone' }>
type MulliganAction = Extract<LegalAction, { kind: 'mulligan' }>
type BottomAction = Extract<LegalAction, { kind: 'put-on-bottom' }>
type CommanderChoiceAction = Extract<LegalAction, { kind: 'commander-replacement' }>
type ShockChoiceAction = Extract<LegalAction, { kind: 'pay-life-for-untapped' }>
type CopyChoiceAction = Extract<LegalAction, { kind: 'choose-copy' }>
type TextChoiceAction = Extract<LegalAction, { kind: 'choose-text' }>
type ModesChoiceAction = Extract<LegalAction, { kind: 'choose-modes' }>
type SacrificeAction = Extract<LegalAction, { kind: 'sacrifice' }>
type ScryAction = Extract<LegalAction, { kind: 'scry' }>
type AssignDamageAction = Extract<LegalAction, { kind: 'assign-combat-damage' }>
type ChooseTargetsAction = Extract<LegalAction, { kind: 'choose-targets' }>

interface Targeting {
  readonly kind: 'cast' | 'activate' | 'choose-targets'
  readonly source: ObjectId
  readonly abilityIndex: number
  readonly label: string
  readonly specs: readonly TargetSpec[]
  readonly options: readonly (readonly TargetRef[])[]
  readonly picked: readonly TargetRef[]
  /** Chosen modes for a targeted modal spell (Phase 11 EG-2). */
  readonly modes?: readonly number[]
  /** Chosen value for `{X}`, when casting an X spell. */
  readonly xValue?: number
  /** Permanent chosen to pay a "sacrifice a creature you control" ability cost. */
  readonly sacrifice?: ObjectId
  /** Alternative casting permission (Phase 6) — flashback / escape / foretell. */
  readonly via?: CastVia
  /** Which face of a multi-face card is being cast (Phase 10). */
  readonly face?: number
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
  'commander-replacement': 'decide where their commander goes',
  'pay-life-for-untapped': 'decide on a shock land',
  'choose-copy': 'choose what to copy',
  'choose-text': 'choose a text change',
  'choose-modes': 'choose a mode',
  'choose-targets': 'choose targets',
  'assign-combat-damage': 'assign combat damage',
  sacrifice: 'choose what to sacrifice',
  scry: 'scry',
}

export default function App() {
  const game = useNetworkGame()
  const [showImport, setShowImport] = useState(false)

  if (showImport) {
    return <ImportDeckScreen onBack={() => setShowImport(false)} />
  }
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
    return <LobbyScreen game={game} notFound onImport={() => setShowImport(true)} />
  }
  if (game.status === 'no-room') {
    return <LobbyScreen game={game} onImport={() => setShowImport(true)} />
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
  onImport,
}: {
  readonly game: NetworkGame
  readonly notFound?: boolean
  readonly onImport: () => void
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
      <button type="button" className="link-button" onClick={onImport}>
        Import a decklist
      </button>
    </CenteredScreen>
  )
}

function ImportDeckScreen({ onBack }: { readonly onBack: () => void }) {
  const [text, setText] = useState('')
  const [cards, setCards] = useState<readonly ImportedCardReport[] | null>(null)
  const [format, setFormat] = useState<DeckFormatReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setCards(null)
    setFormat(null)
    fetch(IMPORT_DECK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          cards?: ImportedCardReport[]
          format?: DeckFormatReport
          error?: string
        }
        if (!res.ok) throw new Error(data.error ?? 'import failed')
        setCards(data.cards ?? [])
        setFormat(data.format ?? null)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  }

  const implementedCount = cards?.filter((c) => c.implemented).length ?? 0

  return (
    <div className="zone-viewer-overlay">
      <div className="zone-viewer-box import-deck-box">
        <div className="zone-viewer-head">
          <h2>Import a decklist</h2>
          <button type="button" onClick={onBack}>
            Back
          </button>
        </div>
        <p className="muted">
          Paste a plain-text decklist export (Moxfield's "Export" feature, either with or
          without the "(SET) collector-number" printing suffix) to see which cards the engine
          already implements. This doesn't start a game — it's a feasibility report only.
        </p>
        <form onSubmit={submit}>
          <textarea
            className="import-deck-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder={'1 Sol Ring\n1 Ureni of the Unwritten\n...'}
          />
          <button type="submit" disabled={!text.trim() || loading}>
            {loading ? 'Importing…' : 'Import'}
          </button>
        </form>
        {error ? <div className="error-banner">⚠ {error}</div> : null}
        {format ? (
          <div className={`import-deck-format ${format.legal ? 'legal' : 'illegal'}`}>
            <strong>
              Commander format: {format.legal ? '✓ legal' : `✗ ${format.violations.length} issue(s)`}
            </strong>
            <div className="muted">
              commander: {format.commander ?? '(none found)'} · identity:{' '}
              {format.identity || 'colourless'}
            </div>
            {format.violations.length > 0 ? (
              <ul>
                {format.violations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        {cards ? (
          <div className="import-deck-report">
            <p className="muted">
              {implementedCount} / {cards.length} cards already implemented
            </p>
            <ul className="import-deck-list">
              {cards.map((c) => (
                <li key={c.name} className={c.implemented ? 'implemented' : 'not-implemented'}>
                  <div className="import-deck-row">
                    <span className="import-deck-name">
                      {c.count > 1 ? `${c.count}x ` : ''}
                      {c.name}
                    </span>
                    {c.manaCost ? <Symbols text={c.manaCost} /> : null}
                    <span className="import-deck-badge">
                      {c.implemented ? 'implemented' : c.found ? 'not yet' : 'not found'}
                    </span>
                  </div>
                  {!c.implemented && c.typeLine ? (
                    <div className="import-deck-detail">
                      <div className="muted">{c.typeLine}</div>
                      <div>
                        <Symbols text={c.oracleText} />
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SeatPickerScreen({ game }: { readonly game: NetworkGame }) {
  const [name, setName] = useState('')
  const nextSeatIndex = game.seats.findIndex((s) => !s.claimed)
  const nextSeat = nextSeatIndex === -1 ? null : game.seats[nextSeatIndex]

  const join = (e: FormEvent) => {
    e.preventDefault()
    if (!nextSeat) return
    game.claimSeat(nextSeat.player, name.trim() || `Player ${nextSeatIndex + 1}`)
  }

  return (
    <CenteredScreen title={`Room ${game.roomId ?? ''}`}>
      <p className="muted">Share this room code, then everyone joins.</p>
      <ErrorLine game={game} />
      {nextSeat ? (
        <form onSubmit={join}>
          <input
            className="name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            maxLength={20}
          />
          <button type="submit">Join</button>
        </form>
      ) : (
        <p className="muted">Room is full.</p>
      )}
      <div className="seat-picker-status">
        {game.seats.map((s) => (
          <span key={s.player} className={s.claimed ? 'seat-status claimed' : 'seat-status'}>
            {playerLabel(s.player, game.seats)}
            {s.claimed ? (s.online ? ' (taken)' : ' (taken · offline)') : ' (open)'}
          </span>
        ))}
      </div>
    </CenteredScreen>
  )
}

/** Renders once `useNetworkGame` has a claimed seat and a pushed view. */
function GameScreen({ game }: { readonly game: NetworkGame }) {
  const { view, seat, opponents } = game
  const [showHistory, setShowHistory] = useState(false)
  const [dismissedHighroll, setDismissedHighroll] = useState(false)
  if (view === null || seat === null || opponents.length === 0) {
    return <CenteredScreen title="Loading…" />
  }
  const over = view.result.over
  const activeSeatClass = seatClassOf(view.turnOrder, view.activePlayer)
  const showHighroll = view.turn.number === 0 && !dismissedHighroll

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

      {showHighroll ? (
        <div className="highroll-banner" onClick={() => setDismissedHighroll(true)} role="alert">
          🎲 {playerLabel(view.startingPlayer, game.seats)} won the highroll and goes first
        </div>
      ) : null}

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
  // Set while an `{X}` cost is being chosen, before target selection — for an
  // X spell (`CastAction`) or an X activated ability (`AbilityAction`, EG-3).
  const [pendingX, setPendingX] = useState<{
    readonly action: CastAction | AbilityAction
    readonly value: number
  } | null>(null)
  // Set while a targeted modal spell's modes are being chosen (Phase 11 EG-2),
  // before target selection.
  const [pendingModes, setPendingModes] = useState<{
    readonly cast: CastAction
    readonly picked: readonly number[]
  } | null>(null)
  // Set while choosing which creature to sacrifice for an ability's cost.
  const [pendingSac, setPendingSac] = useState<AbilityAction | null>(null)
  const [selectedSource, setSelectedSource] = useState<ObjectId | null>(null)
  // Attacker -> chosen defender. With more than one legal opponent, clicking
  // an attacker assigns it to the first opponent by default and focuses it;
  // clicking a different opponent's panel while focused redirects it.
  const [attackAssignments, setAttackAssignments] = useState<
    Record<string, PlayerId | ObjectId>
  >({})
  const [attackFocus, setAttackFocus] = useState<ObjectId | null>(null)
  const [blockAssign, setBlockAssign] = useState<Record<string, ObjectId>>({})
  const [blockFocus, setBlockFocus] = useState<ObjectId | null>(null)
  const [orderPicks, setOrderPicks] = useState<readonly ObjectId[]>([])
  const [discardPicks, setDiscardPicks] = useState<readonly ObjectId[]>([])
  const [bottomPicks, setBottomPicks] = useState<readonly ObjectId[]>([])
  // Per-blocker combat-damage amounts (EG-4a), null until the player edits one
  // (falls back to the lethal-down-the-line default when confirmed unedited).
  const [damagePicks, setDamagePicks] = useState<readonly number[] | null>(null)
  const [textFrom, setTextFrom] = useState<string | null>(null)
  const [modePicks, setModePicks] = useState<readonly number[]>([])
  const [sacrificePicks, setSacrificePicks] = useState<readonly ObjectId[]>([])
  const [zoneView, setZoneView] = useState<{
    readonly title: string
    readonly ids: readonly ObjectId[]
  } | null>(null)

  // --- classify the legal actions ------------------------------------
  const landByCard = useMemo(() => {
    const m = new Map<ObjectId, LandAction>()
    for (const a of actions) if (a.kind === 'play-land') m.set(a.card, a)
    return m
  }, [actions])
  const castByCard = useMemo(() => {
    const m = new Map<ObjectId, CastAction>()
    for (const a of actions) if (a.kind === 'cast-spell') m.set(a.card, a)
    return m
  }, [actions])
  /** Every playable face of a card (a multi-face card has 2+). */
  const playFacesByCard = useMemo(() => {
    const m = new Map<ObjectId, (CastAction | LandAction)[]>()
    for (const a of actions) {
      if (a.kind !== 'cast-spell' && a.kind !== 'play-land') continue
      const list = m.get(a.card) ?? []
      list.push(a)
      m.set(a.card, list)
    }
    return m
  }, [actions])
  const suspendByCard = useMemo(() => {
    const m = new Map<ObjectId, SuspendAction>()
    for (const a of actions) if (a.kind === 'suspend') m.set(a.card, a)
    return m
  }, [actions])
  const cycleByCard = useMemo(() => {
    const m = new Map<ObjectId, CycleAction>()
    for (const a of actions) if (a.kind === 'cycle') m.set(a.card, a)
    return m
  }, [actions])
  const foretellByCard = useMemo(() => {
    const m = new Map<ObjectId, ForetellAction>()
    for (const a of actions) if (a.kind === 'foretell') m.set(a.card, a)
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
  const commanderChoiceAction = actions.find(
    (a): a is CommanderChoiceAction => a.kind === 'commander-replacement',
  )
  const shockChoiceAction = actions.find(
    (a): a is ShockChoiceAction => a.kind === 'pay-life-for-untapped',
  )
  const copyChoiceAction = actions.find(
    (a): a is CopyChoiceAction => a.kind === 'choose-copy',
  )
  const textChoiceAction = actions.find(
    (a): a is TextChoiceAction => a.kind === 'choose-text',
  )
  const modesChoiceAction = actions.find(
    (a): a is ModesChoiceAction => a.kind === 'choose-modes',
  )
  const sacrificeAction = actions.find(
    (a): a is SacrificeAction => a.kind === 'sacrifice',
  )
  const scryAction = actions.find((a): a is ScryAction => a.kind === 'scry')
  const assignDamageAction = actions.find(
    (a): a is AssignDamageAction => a.kind === 'assign-combat-damage',
  )
  const chooseTargetsAction = actions.find(
    (a): a is ChooseTargetsAction => a.kind === 'choose-targets',
  )
  // A `choose-targets` decision (a triggered ability / a suspended spell —
  // ROADMAP Phase 11 EG-1) drives the same targeting flow as a cast, but it's
  // *derived* from the decision rather than stored — only the running picks
  // live in state — so a state refresh mid-choice just re-derives it.
  const [ctPicks, setCtPicks] = useState<readonly TargetRef[]>([])
  const activeTargeting: Targeting | null = useMemo(
    () =>
      targeting ??
      (chooseTargetsAction
        ? {
            kind: 'choose-targets',
            source: chooseTargetsAction.source,
            abilityIndex: 0,
            label: `Choose targets for ${chooseTargetsAction.cardName}`,
            specs: chooseTargetsAction.specs,
            options: chooseTargetsAction.options,
            picked: ctPicks,
          }
        : null),
    [targeting, chooseTargetsAction, ctPicks],
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
    | 'commander-replacement'
    | 'pay-life-for-untapped'
    | 'choose-copy'
    | 'choose-text'
    | 'choose-modes'
    | 'sacrifice'
    | 'scry'
    | 'choose-x'
    | 'choose-cast-modes'
    | 'choose-sacrifice'
    | 'assign-combat-damage'
    | 'targeting'
    | 'priority' = mulliganAction
    ? 'mulligan'
    : commanderChoiceAction
      ? 'commander-replacement'
    : shockChoiceAction
      ? 'pay-life-for-untapped'
      : copyChoiceAction
        ? 'choose-copy'
        : textChoiceAction
          ? 'choose-text'
        : modesChoiceAction
          ? 'choose-modes'
        : sacrificeAction
          ? 'sacrifice'
        : scryAction
          ? 'scry'
        : assignDamageAction
          ? 'assign-combat-damage'
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
                : pendingModes
                  ? 'choose-cast-modes'
                : pendingX
                  ? 'choose-x'
                  : pendingSac
                    ? 'choose-sacrifice'
                    : activeTargeting
                      ? 'targeting'
                      : 'priority'

  // --- dispatch helpers --------------------------------------------
  const pass = useCallback(() => {
    if (canPass) game.dispatch({ type: 'pass-priority', player: seat })
  }, [canPass, game, seat])

  const finishTargets = useCallback(
    (
      t: Pick<Targeting, 'kind' | 'source' | 'abilityIndex' | 'xValue' | 'sacrifice' | 'via' | 'face' | 'modes'>,
      targets: readonly TargetRef[],
    ) => {
      game.dispatch(
        t.kind === 'choose-targets'
          ? { type: 'choose-targets', player: seat, targets: [...targets] }
          : t.kind === 'cast'
            ? {
                type: 'cast-spell',
                player: seat,
                card: t.source,
                targets: [...targets],
                ...(t.modes !== undefined ? { modes: [...t.modes] } : {}),
                ...(t.xValue !== undefined ? { xValue: t.xValue } : {}),
                ...(t.via !== undefined ? { via: t.via } : {}),
                ...(t.face !== undefined ? { face: t.face } : {}),
              }
            : {
                type: 'activate-ability',
                player: seat,
                source: t.source,
                abilityIndex: t.abilityIndex,
                targets: [...targets],
                ...(t.sacrifice !== undefined ? { sacrifice: t.sacrifice } : {}),
                ...(t.xValue !== undefined ? { xValue: t.xValue } : {}),
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

  const beginCast = useCallback(
    (cast: CastAction) => {
      if (cast.castModal) {
        setPendingModes({ cast, picked: [] })
        return
      }
      if (cast.xCost) {
        setPendingX({ action: cast, value: cast.xCost.maxX })
        return
      }
      beginTargeting({
        kind: 'cast',
        source: cast.card,
        abilityIndex: 0,
        label: `Cast ${cast.cardName}`,
        specs: cast.targetSpecs,
        options: cast.targetOptions,
        ...(cast.via !== undefined ? { via: cast.via } : {}),
        ...(cast.face !== undefined ? { face: cast.face } : {}),
      })
    },
    [beginTargeting],
  )

  // Confirm the chosen modes for a targeted modal spell (Phase 11 EG-2) →
  // proceed to targeting over the union of those modes' target specs.
  const confirmModes = useCallback(() => {
    if (!pendingModes?.cast.castModal) return
    const { cast, picked } = pendingModes
    const modes = [...picked].sort((a, b) => a - b)
    setPendingModes(null)
    const chosen = modes.map((i) => cast.castModal!.modes[i])
    beginTargeting({
      kind: 'cast',
      source: cast.card,
      abilityIndex: 0,
      label: `Cast ${cast.cardName}`,
      specs: chosen.flatMap((m) => m.targetSpecs),
      options: chosen.flatMap((m) => m.targetOptions),
      modes,
      ...(cast.via !== undefined ? { via: cast.via } : {}),
      ...(cast.face !== undefined ? { face: cast.face } : {}),
    })
  }, [beginTargeting, pendingModes])

  /** Dispatch / begin one playable face of a hand card. */
  const playFace = useCallback(
    (a: CastAction | LandAction) => {
      if (a.kind === 'play-land') {
        game.dispatch({
          type: 'play-land',
          player: seat,
          card: a.card,
          ...(a.face !== undefined ? { face: a.face } : {}),
        })
      } else {
        beginCast(a)
      }
    },
    [beginCast, game, seat],
  )

  const confirmX = useCallback(() => {
    if (!pendingX) return
    const { action, value } = pendingX
    setPendingX(null)
    if (action.kind === 'activate-ability') {
      beginTargeting({
        kind: 'activate',
        source: action.source,
        abilityIndex: action.abilityIndex,
        label: action.text || `${action.cardName} ability`,
        specs: action.targetSpecs,
        options: action.targetOptions,
        xValue: value,
      })
      return
    }
    beginTargeting({
      kind: 'cast',
      source: action.card,
      abilityIndex: 0,
      label: `Cast ${action.cardName}`,
      specs: action.targetSpecs,
      options: action.targetOptions,
      xValue: value,
      ...(action.via !== undefined ? { via: action.via } : {}),
      ...(action.face !== undefined ? { face: action.face } : {}),
    })
  }, [beginTargeting, pendingX])

  const startAbility = useCallback(
    (ab: AbilityAction, sacrifice?: ObjectId) => {
      beginTargeting({
        kind: 'activate',
        source: ab.source,
        abilityIndex: ab.abilityIndex,
        label: ab.text || `${ab.cardName} ability`,
        specs: ab.targetSpecs,
        options: ab.targetOptions,
        ...(sacrifice !== undefined ? { sacrifice } : {}),
      })
    },
    [beginTargeting],
  )

  const clickAbility = useCallback(
    (ab: AbilityAction) => {
      if (ab.xCost) {
        setPendingX({ action: ab, value: ab.xCost.maxX })
        return
      }
      if (ab.sacrifice) {
        if (ab.sacrifice.choices.length === 0) return
        if (ab.sacrifice.choices.length === 1) {
          startAbility(ab, ab.sacrifice.choices[0])
        } else {
          setPendingSac(ab)
        }
        return
      }
      startAbility(ab)
    },
    [startAbility],
  )

  const pickTarget = useCallback(
    (ref: TargetRef) => {
      const t = activeTargeting
      if (!t) return
      const picked = [...t.picked, ref]
      const derived = t.kind === 'choose-targets'
      if (picked.length < t.specs.length) {
        if (derived) setCtPicks(picked)
        else setTargeting({ ...t, picked })
        return
      }
      // All slots filled — dispatch outside any state updater (updaters must
      // be pure; React double-invokes them in dev).
      if (derived) setCtPicks([])
      else setTargeting(null)
      finishTargets(t, picked)
    },
    [activeTargeting, finishTargets],
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
      const opts = playFacesByCard.get(id) ?? []
      // A multi-face card shows a button per face (below the tile) — a bare
      // click does nothing so the choice stays explicit.
      if (opts.length === 1) playFace(opts[0])
    },
    [bottomAction, discardAction, mode, playFace, playFacesByCard],
  )

  /** Which id a click on a (possibly stacked) tile should act on. */
  const pickIdForClick = useCallback(
    (ids: readonly ObjectId[]): ObjectId => {
      if (mode === 'targeting' && activeTargeting) {
        const slot = activeTargeting.options[activeTargeting.picked.length] ?? []
        const found = ids.find((i) =>
          slot.some((o) => o.kind === 'object' && o.object === i),
        )
        if (found) return found
      }
      return ids[0]
    },
    [mode, activeTargeting],
  )

  const clickPermanent = useCallback(
    (ids: readonly ObjectId[]) => {
      const id = pickIdForClick(ids)
      if (mode === 'targeting' && activeTargeting) {
        const slot = activeTargeting.options[activeTargeting.picked.length] ?? []
        if (slot.some((o) => o.kind === 'object' && o.object === id)) {
          pickTarget({ kind: 'object', object: id })
        }
        return
      }
      if (mode === 'attackers' && attackAction) {
        // Clicking an opponent's planeswalker while an attacker is focused
        // redirects that attacker at it (mirrors the click-a-panel flow).
        if (
          attackFocus &&
          id !== attackFocus &&
          attackAction.defenders.includes(id)
        ) {
          setAttackAssignments((cur) => ({ ...cur, [attackFocus]: id }))
          return
        }
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
      if (mode === 'sacrifice' && sacrificeAction) {
        if (!sacrificeAction.eligible.includes(id)) return
        setSacrificePicks((cur) =>
          cur.includes(id)
            ? cur.filter((x) => x !== id)
            : cur.length >= sacrificeAction.count
              ? [...cur.slice(1), id]
              : [...cur, id],
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
      sacrificeAction,
      activeTargeting,
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
      if (mode !== 'targeting' || !activeTargeting) return
      const slot = activeTargeting.options[activeTargeting.picked.length] ?? []
      if (slot.some((o) => o.kind === 'player' && o.player === pid)) {
        pickTarget({ kind: 'player', player: pid })
      }
    },
    [attackAction, attackFocus, mode, pickTarget, activeTargeting],
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

  const confirmScry = useCallback(
    (away: readonly ObjectId[]) => {
      game.dispatch({ type: 'scry', player: seat, away: [...away] })
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
  const targetSlot = activeTargeting
    ? (activeTargeting.options[activeTargeting.picked.length] ?? [])
    : []
  const pickedObjKeys = new Set(
    (activeTargeting?.picked ?? [])
      .filter((r) => r.kind === 'object')
      .map((r) => (r.kind === 'object' ? r.object : '')),
  )
  /** Label for an attack target — a player, or an opponent's planeswalker. */
  const attackTargetLabel = (t: PlayerId | ObjectId): string =>
    view.objects[t as ObjectId]
      ? game.nameOf(t as ObjectId)
      : playerLabel(t as PlayerId, game.seats)

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

    if (obj.attacking) badge = `⚔ ${attackTargetLabel(obj.attacking)}`
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
      // An opponent's planeswalker is a legal defender: highlight it while an
      // attacker is focused so it can be clicked as the attack target.
      const isDefenderPw =
        attackAction.defenders.includes(id) && Boolean(view.objects[id])
      highlight =
        attackAction.eligible.includes(id) ||
        (attackFocus !== null && isDefenderPw)
      const assignedTo = attackAssignments[id]
      selected = assignedTo !== undefined
      if (assignedTo) {
        badge = `⚔ ${attackTargetLabel(assignedTo)}${attackFocus === id ? ' ?' : ''}`
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
    } else if (mode === 'sacrifice' && sacrificeAction) {
      highlight = sacrificeAction.eligible.includes(id) && !sacrificePicks.includes(id)
      selected = sacrificePicks.includes(id)
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
              // Two independent kinds of "one tile, many permanents": several
              // identical lands collapsed here in the client, and the engine's
              // own token compaction (`VisibleObject.stackCount`). Only one is
              // ever > 1 for a given tile, so the larger is the true count.
              stackCount: Math.max(entry.ids.length, entry.sample.stackCount ?? 1),
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
    const commanderTax =
      2 * (view.players[obj.owner]?.commanderCastCounts?.[obj.cardName] ?? 0)
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
  } else if (mode === 'choose-copy' && copyChoiceAction) {
    controls = (
      <div className="controls">
        <span>{game.nameOf(copyChoiceAction.source)} — copy which creature?</span>
        {copyChoiceAction.options.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() =>
              game.dispatch({ type: 'choose-copy', player: seat, copy: id })
            }
          >
            {game.nameOf(id)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => game.dispatch({ type: 'choose-copy', player: seat, copy: null })}
        >
          Copy nothing
        </button>
      </div>
    )
  } else if (mode === 'choose-text' && textChoiceAction) {
    const from = textFrom ?? textChoiceAction.fromOptions[0]
    controls = (
      <div className="controls">
        <span>
          {game.nameOf(textChoiceAction.target)} — replace{' '}
          {textChoiceAction.fromOptions.length > 1 ? 'which type' : `“${from}”`}
        </span>
        {textChoiceAction.fromOptions.length > 1 &&
          textChoiceAction.fromOptions.map((w) => (
            <button
              key={w}
              type="button"
              className={w === from ? 'selected' : undefined}
              onClick={() => setTextFrom(w)}
            >
              {w}
            </button>
          ))}
        <span>with</span>
        {textChoiceAction.toOptions.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() =>
              game.dispatch({ type: 'choose-text', player: seat, from, to: w })
            }
          >
            {w}
          </button>
        ))}
      </div>
    )
  } else if (mode === 'choose-modes' && modesChoiceAction) {
    const { minModes, maxModes, modeTexts, source } = modesChoiceAction
    const optional = minModes === 0 && maxModes === 1
    const single = minModes === 1 && maxModes === 1
    const toggle = (i: number) =>
      setModePicks((prev) =>
        prev.includes(i)
          ? prev.filter((x) => x !== i)
          : prev.length >= maxModes
            ? [...prev.slice(1), i]
            : [...prev, i],
      )
    controls = (
      <div className="controls">
        <span>
          {game.nameOf(source)} —{' '}
          {optional
            ? modeTexts[0]
            : single
              ? 'choose one'
              : `choose ${minModes === maxModes ? minModes : `${minModes}–${maxModes}`}`}
        </span>
        {optional ? (
          <>
            <button
              type="button"
              onClick={() => game.dispatch({ type: 'choose-modes', player: seat, modes: [0] })}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => game.dispatch({ type: 'choose-modes', player: seat, modes: [] })}
            >
              No
            </button>
          </>
        ) : single ? (
          modeTexts.map((t, i) => (
            <button
              key={i}
              type="button"
              onClick={() => game.dispatch({ type: 'choose-modes', player: seat, modes: [i] })}
            >
              {t}
            </button>
          ))
        ) : (
          <>
            {modeTexts.map((t, i) => (
              <button
                key={i}
                type="button"
                className={modePicks.includes(i) ? 'selected' : undefined}
                onClick={() => toggle(i)}
              >
                {t}
              </button>
            ))}
            <button
              type="button"
              disabled={modePicks.length < minModes || modePicks.length > maxModes}
              onClick={() =>
                game.dispatch({ type: 'choose-modes', player: seat, modes: [...modePicks] })
              }
            >
              Confirm
            </button>
          </>
        )}
      </div>
    )
  } else if (mode === 'choose-cast-modes' && pendingModes?.cast.castModal) {
    const cm = pendingModes.cast.castModal
    const picked = pendingModes.picked
    const uncastable = (i: number) =>
      cm.modes[i].targetOptions.some((o) => o.length === 0)
    const toggle = (i: number) =>
      setPendingModes((prev) =>
        prev === null
          ? prev
          : {
              ...prev,
              picked: prev.picked.includes(i)
                ? prev.picked.filter((x) => x !== i)
                : prev.picked.length >= cm.maxModes
                  ? [...prev.picked.slice(1), i]
                  : [...prev.picked, i],
            },
      )
    controls = (
      <div className="controls">
        <span>
          {pendingModes.cast.cardName} — choose{' '}
          {cm.minModes === cm.maxModes ? cm.minModes : `${cm.minModes}–${cm.maxModes}`}
        </span>
        {cm.modes.map((m, i) => (
          <button
            key={i}
            type="button"
            className={picked.includes(i) ? 'selected' : undefined}
            disabled={uncastable(i) && !picked.includes(i)}
            onClick={() => toggle(i)}
          >
            {m.text}
          </button>
        ))}
        <button
          type="button"
          disabled={picked.length < cm.minModes || picked.length > cm.maxModes}
          onClick={confirmModes}
        >
          Confirm
        </button>
        <button type="button" onClick={() => setPendingModes(null)}>
          Cancel
        </button>
      </div>
    )
  } else if (mode === 'sacrifice' && sacrificeAction) {
    controls = (
      <div className="controls">
        <span>
          Sacrifice {sacrificeAction.count} — {sacrificePicks.length}/
          {sacrificeAction.count} chosen
        </span>
        <button
          type="button"
          disabled={sacrificePicks.length !== sacrificeAction.count}
          onClick={() =>
            game.dispatch({ type: 'sacrifice', player: seat, permanents: [...sacrificePicks] })
          }
        >
          Confirm
        </button>
      </div>
    )
  } else if (mode === 'commander-replacement' && commanderChoiceAction) {
    controls = (
      <div className="controls">
        <span>
          {game.nameOf(commanderChoiceAction.commander)} would go to your{' '}
          {commanderChoiceAction.intendedZone} — move it to the command zone instead?
        </span>
        <button
          type="button"
          onClick={() =>
            game.dispatch({ type: 'commander-replacement', player: seat, toCommandZone: true })
          }
        >
          Command zone
        </button>
        <button
          type="button"
          onClick={() =>
            game.dispatch({ type: 'commander-replacement', player: seat, toCommandZone: false })
          }
        >
          Leave in {commanderChoiceAction.intendedZone}
        </button>
      </div>
    )
  } else if (mode === 'pay-life-for-untapped' && shockChoiceAction) {
    controls = (
      <div className="controls">
        <span>
          {game.nameOf(shockChoiceAction.source)} — pay {shockChoiceAction.life} life to have
          it enter untapped?
        </span>
        <button
          type="button"
          onClick={() =>
            game.dispatch({ type: 'pay-life-for-untapped', player: seat, pay: true })
          }
        >
          Pay {shockChoiceAction.life} life
        </button>
        <button
          type="button"
          onClick={() =>
            game.dispatch({ type: 'pay-life-for-untapped', player: seat, pay: false })
          }
        >
          Enter tapped
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
  } else if (mode === 'targeting' && activeTargeting) {
    // Stack objects (a spell being countered) aren't clickable on the board —
    // offer them as buttons in the controls bar instead.
    const stackTargets = targetSlot.filter(
      (o) => o.kind === 'object' && view.zones.stack.includes(o.object),
    )
    controls = (
      <div className="controls">
        <span>
          {activeTargeting.label}: choose{' '}
          {activeTargeting.specs[activeTargeting.picked.length]} (
          {activeTargeting.picked.length + 1}/{activeTargeting.specs.length})
        </span>
        {stackTargets.map((o) =>
          o.kind === 'object' ? (
            <button
              key={o.object}
              type="button"
              onClick={() => pickTarget(o)}
            >
              {game.nameOf(o.object)} (on the stack)
            </button>
          ) : null,
        )}
        {activeTargeting.kind === 'choose-targets' ? null : (
          <button type="button" onClick={() => setTargeting(null)}>
            Cancel
          </button>
        )}
      </div>
    )
  } else if (mode === 'choose-sacrifice' && pendingSac?.sacrifice) {
    controls = (
      <div className="controls">
        <span>{pendingSac.cardName} — sacrifice which creature?</span>
        {pendingSac.sacrifice.choices.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              const ab = pendingSac
              setPendingSac(null)
              startAbility(ab, id)
            }}
          >
            {game.nameOf(id)}
          </button>
        ))}
        <button type="button" onClick={() => setPendingSac(null)}>
          Cancel
        </button>
      </div>
    )
  } else if (mode === 'choose-x' && pendingX) {
    const pxMax = pendingX.action.xCost?.maxX ?? 0
    const pxVerb = pendingX.action.kind === 'activate-ability' ? 'Activate' : 'Cast'
    controls = (
      <div className="controls">
        <span>
          {pxVerb} {pendingX.action.cardName} — choose X
        </span>
        <input
          type="number"
          min={0}
          max={pxMax}
          value={pendingX.value}
          onChange={(e) => {
            const n = Math.max(0, Math.min(pxMax, Math.floor(Number(e.target.value) || 0)))
            setPendingX({ action: pendingX.action, value: n })
          }}
          style={{ width: '4rem' }}
        />
        <span>(max {pxMax})</span>
        <button type="button" onClick={confirmX}>
          Confirm
        </button>
        <button type="button" onClick={() => setPendingX(null)}>
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
            ? ` · pick a player or planeswalker for ${game.nameOf(attackFocus)}`
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
    // Lure (rule 509.1c): a creature able to block a must-be-blocked attacker
    // must be assigned to one of them.
    const unforcedBlockers = blockAction.eligible
      .filter(
        (e) =>
          e.canBlock.some((a) => blockAction.mustBlock.includes(a)) &&
          !blockAction.mustBlock.includes(blockAssign[e.blocker]),
      )
      .map((e) => e.blocker)
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
          {unforcedBlockers.length > 0
            ? ` · ${unforcedBlockers
                .map((id) => game.nameOf(id))
                .join(', ')} must block (Lure)`
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
          disabled={loneMenace.length > 0 || unforcedBlockers.length > 0}
          onClick={confirmBlockers}
        >
          {n === 0 ? 'No blocks' : `Block (${n})`}
        </button>
      </div>
    )
  } else if (mode === 'discard' && discardAction) {
    const fromEffect =
      view.awaiting?.kind === 'discard' && view.awaiting.fromEffect === true
    controls = (
      <div className="controls">
        <span>
          {fromEffect
            ? `Discard ${discardAction.count} card${discardAction.count === 1 ? '' : 's'}`
            : 'Discard to hand size'}{' '}
          — {discardPicks.length}/{discardAction.count}
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
  } else if (mode === 'scry' && scryAction) {
    controls = (
      <div className="controls">
        <span className="muted">
          {scryAction.mode === 'surveil' ? 'Surveil' : 'Scry'} — pick cards in the popup to
          move {scryAction.mode === 'surveil' ? 'to your graveyard' : 'to the bottom'}
        </span>
      </div>
    )
  } else if (mode === 'assign-combat-damage' && assignDamageAction) {
    // Default: lethal down the blocker order, remainder to the last blocker
    // (or, with trample, left to trample over).
    const dflt: number[] = []
    let rem = assignDamageAction.power
    assignDamageAction.blockers.forEach((_b, i) => {
      const last = !assignDamageAction.trample && i === assignDamageAction.blockers.length - 1
      const amt = last ? rem : Math.min(rem, assignDamageAction.lethal[i])
      rem -= amt
      dflt.push(amt)
    })
    const picks = damagePicks ?? dflt
    const total = picks.reduce((s, n) => s + n, 0)
    const over = assignDamageAction.power - total
    const valid =
      over >= 0 &&
      (over === 0 || assignDamageAction.trample) &&
      picks.every((n, i) => {
        if (n === 0 && over === 0) return true
        return assignDamageAction.blockers.every(
          (_b, j) => j >= i || picks[j] >= assignDamageAction.lethal[j],
        )
      }) &&
      (over === 0 ||
        picks.every((n, j) => n >= assignDamageAction.lethal[j]))
    controls = (
      <div className="controls">
        <span>
          Assign {game.nameOf(assignDamageAction.attacker)}&rsquo;s {assignDamageAction.power} damage
        </span>
        {assignDamageAction.blockers.map((b, i) => (
          <label key={b} style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
            {game.nameOf(b)} (lethal {assignDamageAction.lethal[i]})
            <input
              type="number"
              min={0}
              max={assignDamageAction.power}
              value={picks[i]}
              onChange={(e) => {
                const n = Math.max(0, Math.floor(Number(e.target.value) || 0))
                setDamagePicks(picks.map((v, j) => (j === i ? n : v)))
              }}
              style={{ width: '3.5rem' }}
            />
          </label>
        ))}
        <span className={over > 0 && !assignDamageAction.trample ? 'muted' : ''}>
          → defender: {Math.max(0, over)}
          {assignDamageAction.trample ? '' : over > 0 ? ' (needs trample)' : ''}
        </span>
        <button
          type="button"
          disabled={!valid}
          onClick={() =>
            game.dispatch({
              type: 'assign-combat-damage',
              player: seat,
              assignment: [...picks],
            })
          }
        >
          Confirm
        </button>
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
      wentFirst={pid === view.startingPlayer}
      isMonarch={view.monarch === pid}
      emblemTexts={view.emblems.filter((e) => e.owner === pid).map((e) => e.text)}
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
              onClick={() => clickAbility(ab)}
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
            const suspend = mode === 'priority' ? suspendByCard.get(id) : undefined
            const foretell = mode === 'priority' ? foretellByCard.get(id) : undefined
            const cycle = mode === 'priority' ? cycleByCard.get(id) : undefined
            const faceOpts =
              mode === 'priority' ? (playFacesByCard.get(id) ?? []) : []
            const multiFace = faceOpts.length > 1
            return (
              <div key={id} className="hand-card">
                <CardTile
                  obj={obj}
                  highlight={highlight || Boolean(suspend) || Boolean(foretell) || Boolean(cycle)}
                  selected={selected}
                  onClick={() => clickHandCard(id)}
                />
                {multiFace
                  ? faceOpts.map((a, i) => (
                      <button key={i} type="button" onClick={() => playFace(a)}>
                        {a.kind === 'play-land' ? 'Play' : 'Cast'} {a.cardName}
                      </button>
                    ))
                  : null}
                {suspend ? (
                  <button
                    type="button"
                    onClick={() => game.dispatch({ type: 'suspend', player: seat, card: id })}
                  >
                    Suspend {suspend.cost}
                  </button>
                ) : null}
                {foretell ? (
                  <button
                    type="button"
                    onClick={() => game.dispatch({ type: 'foretell', player: seat, card: id })}
                  >
                    Foretell
                  </button>
                ) : null}
                {cycle ? (
                  <button
                    type="button"
                    onClick={() => game.dispatch({ type: 'cycle', player: seat, card: id })}
                  >
                    Cycle {cycle.cost}
                  </button>
                ) : null}
              </div>
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
          castable={{
            // Flashback/escape/… casts from the graveyard (Phase 6), plus a
            // land playable from the graveyard (Ramunap Excavator — P2B).
            ids: zoneView.ids.filter(
              (id) => castByCard.get(id)?.via !== undefined || landByCard.has(id),
            ),
            label: (id) => {
              const c = castByCard.get(id)
              if (c?.via) return `Cast (${c.via})`
              if (landByCard.has(id)) return 'Play land'
              return 'Cast'
            },
            onCast: (id) => {
              const land = landByCard.get(id)
              const c = castByCard.get(id)
              setZoneView(null)
              if (land) playFace(land)
              else if (c) beginCast(c)
            },
          }}
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

      {mode === 'scry' && scryAction ? (
        <ZoneViewer
          title={
            scryAction.mode === 'surveil'
              ? 'Surveil — pick cards to put in your graveyard'
              : 'Scry — pick cards to put on the bottom'
          }
          ids={scryAction.cards}
          resolve={(id) => view.objects[id]}
          selection={{
            min: 0,
            max: scryAction.cards.length,
            eligible: scryAction.cards,
            onConfirm: confirmScry,
          }}
        />
      ) : null}
    </div>
  )
}
