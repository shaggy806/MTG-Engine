import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
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
import { computeBoardEntries } from './game/board.ts'
import type { BoardEntry } from './game/board.ts'
import { usePlayback } from './game/usePlayback.ts'
import { AnimationBus } from './game/animationBus.ts'
import { playerLabel, seatClassOf } from './format.ts'
import { PhaseTrack } from './ui/PhaseTrack.tsx'
import { TurnBanner } from './ui/TurnBanner.tsx'
import { AnimationLayer } from './ui/AnimationLayer.tsx'
import { PlayerPanel } from './ui/PlayerPanel.tsx'
import { CardTile } from './ui/CardTile.tsx'
import { MiniTile } from './ui/MiniTile.tsx'
import { CommanderTile } from './ui/CommanderTile.tsx'
import { Stack } from './ui/Stack.tsx'
import { EventLog } from './ui/EventLog.tsx'
import { ZoneViewer } from './ui/ZoneViewer.tsx'
import { SeatBoard } from './lobby/SeatBoard.tsx'
import { LandingScreen } from './lobby/LandingScreen.tsx'
import './App.css'

// Symmetric fan for the hand tray (P8): card i's offset from the hand's
// center is i - (N-1)/2; rotation and lift both scale off that same offset,
// so the fan stays symmetric regardless of hand size. Always applied,
// including the collapsed peek (priority mode, not raised) and the mulligan
// popup -- the hand should read as the same tray whether it's peeking,
// raised, or shown inside a decision popup, not switch between a flat and a
// fanned look depending on which.
const HAND_FAN_STEP_DEG = 4.4
const HAND_FAN_STEP_Y = 5.2
// The per-card step above is tuned against the mockup's own tested range (up
// to 14 cards -- see the mockup source linked from BOARD_REDESIGN_PLAN.md), where the
// outermost card lands well under these caps and nothing here changes
// anything. Applied unscaled, a hand bigger than that (draw effects easily
// push a hand past 14-20 before a discard step) grows the outermost card's
// rotation without bound -- past ~20 cards the edges approach 90 degrees and
// stop reading as a fan at all. These caps bound the *total sweep*, not each
// card's own rotation, so a large hand compresses its per-card step instead
// of blowing past a sane maximum -- same "shrink only once actually needed"
// shape as HAND_CARD_GAP's overlap floor and recomputeBoardMiniW below.
const HAND_FAN_MAX_ROT_DEG = 32
const HAND_FAN_MAX_LIFT_PX = 38

// The hand row never wraps to a second line and never shrinks card width
// below its normal --card-w size -- once N cards no longer fit the row at
// their natural width and this default gap, cards overlap (a shrinking, even
// negative, margin-left) instead. cw is measured from an actual rendered
// card (not a duplicated copy of --card-w's clamp() bounds), so this stays
// correct if that token ever changes. -cw*0.82 caps how far cards can
// overlap so at least a sliver of each stays visible in a huge hand.
const HAND_CARD_GAP = 8
const HAND_OVERLAP_FLOOR = 0.82

// Battlefield tiles get a real max size (index.css's --mini-w) and wrap to
// as many rows as they need at that size -- multiple rows of creatures is
// normal and fine, same as a physical table. Only once even that wrapping
// overflows a board's own scrollable area (.quadrant-body) do tiles shrink
// below the ceiling, and only as far as it takes to fit again (see
// recomputeBoardMiniW below) -- shrinking is the fallback for a genuinely
// crowded board, not the default response to "more than fits one row."
// --mini-w's own clamp() bounds are duplicated here (rather than measured,
// unlike the hand's own shrink-to-fit) because the natural size only
// depends on viewport width, not on any container this component would
// need to render first to read from; keep these in sync if that token's
// clamp() in index.css ever changes.
const MINI_W_FLOOR = 56
const MINI_W_VW_PERCENT = 7.2
const MINI_W_CEILING = 130
// Below this, a tile stops shrinking further and the board's own scroll
// (already there regardless -- .quadrant-body's overflow-y:auto) takes over.
const MINI_SHRINK_FLOOR = 40
const MINI_SHRINK_STEP = 6

const naturalMiniW = (): number =>
  Math.min(MINI_W_CEILING, Math.max(MINI_W_FLOOR, window.innerWidth * (MINI_W_VW_PERCENT / 100)))

// A stable reference (not `[]` inline at each use) so passing it as `Table`'s
// `actions` prop while `useDelayedView` reports `busy` doesn't itself count
// as a changed prop across re-renders.
const EMPTY_ACTIONS: readonly LegalAction[] = []

type CastAction = Extract<LegalAction, { kind: 'cast-spell' }>

/** The "which variant of this cast" fields a `cast-spell` action carries all
 * the way from `legalActions` back into the dispatched action. */
const castExtras = (cast: CastAction) => ({
  ...(cast.via !== undefined ? { via: cast.via } : {}),
  ...(cast.face !== undefined ? { face: cast.face } : {}),
  ...(cast.kicked === true ? { kicked: true } : {}),
  ...(cast.overload === true ? { overload: true } : {}),
  ...(cast.free === true ? { free: true } : {}),
})
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
type CreatureTypeChoiceAction = Extract<LegalAction, { kind: 'choose-creature-type' }>
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
  /** Casting this for its kicker cost (rule 702.33 — P8). The engine offers
   * kicked and unkicked as separate `cast-spell` actions; this just echoes
   * which one the player picked. */
  readonly kicked?: boolean
  /** Casting this for its overload cost (rule 702.126) instead of its mana
   * cost — no targets are chosen for this variant. */
  readonly overload?: boolean
  /** Casting this for free under a `CardDefinition.freeCastIf` permission
   * instead of paying the mana cost. Targets are unchanged. */
  readonly free?: boolean
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
  'choose-creature-type': 'choose a creature type',
  'choose-modes': 'choose a mode',
  'choose-targets': 'choose targets',
  'assign-combat-damage': 'assign combat damage',
  sacrifice: 'choose what to sacrifice',
  scry: 'scry',
}

export default function App() {
  const game = useNetworkGame()

  if (game.status === 'connecting') {
    return <CenteredScreen title="Connecting…" />
  }
  if (game.status === 'disconnected') {
    // A first visit that never got through fails exactly like a mid-game drop
    // — `onerror` then `onclose`, so this same branch catches both — but
    // telling someone who has only just arrived that they "lost the
    // connection" is untrue and reads as though they broke something. The
    // retry loop behind these two is identical; only the words differ.
    return game.everConnected ? (
      <CenteredScreen title="Reconnecting…">
        <p className="muted">
          Lost the connection to the room server — retrying automatically.
        </p>
        <button type="button" onClick={game.reconnect}>
          Retry now
        </button>
      </CenteredScreen>
    ) : (
      <CenteredScreen title="Waiting for the server…">
        <p className="muted">
          The room server isn't answering yet. Still trying — this page will
          carry on by itself once it comes up.
        </p>
        <button type="button" onClick={game.reconnect}>
          Retry now
        </button>
      </CenteredScreen>
    )
  }
  if (game.status === 'room-not-found') {
    return <LandingScreen game={game} notFound />
  }
  if (game.status === 'no-room') {
    return <LandingScreen game={game} />
  }
  if (game.status === 'choosing-seat') {
    return <SeatPickerScreen game={game} />
  }
  if (game.status === 'waiting-for-players') {
    return <WaitingForPlayersScreen game={game} />
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

function SeatPickerScreen({ game }: { readonly game: NetworkGame }) {
  const roomFull = game.seats.every((s) => s.claimed || s.isBot)
  return (
    <div className="overlay">
      <div className="overlay-box seat-board-box">
        <h2>Room {game.roomId ?? ''}</h2>
        <p className="muted">Share this room code, then everyone joins.</p>
        <ErrorLine game={game} />
        {roomFull ? <p className="muted">Room is full.</p> : null}
        <SeatBoard game={game} />
      </div>
    </div>
  )
}

/** Shown once my own seat is claimed but the room's `Game` hasn't started
 * yet — see `ConnectionStatus`'s `waiting-for-players`. `SeatBoard`'s own
 * footer already reports the precise status (seats still open vs. everyone
 * in but not all readied up), so there's no separate line to duplicate it
 * here. */
function WaitingForPlayersScreen({ game }: { readonly game: NetworkGame }) {
  return (
    <div className="overlay">
      <div className="overlay-box seat-board-box">
        <h2>Room {game.roomId ?? ''}</h2>
        <ErrorLine game={game} />
        <SeatBoard game={game} />
      </div>
    </div>
  )
}

/**
 * Renders once `useNetworkGame` has a claimed seat and a pushed frame.
 *
 * Everything on screen is drawn from `shown` — the frame playback has
 * actually finished animating — not from the newest push. The two differ
 * for as long as an animation is running, and mixing them is what used to
 * put a card's arrival animation over a board that already had the card on
 * it. `game.view` is only for bookkeeping that has to be current, like
 * resolving a card name in the history popup.
 */
function GameScreen({ game }: { readonly game: NetworkGame }) {
  const { seat, opponents } = game
  const [showHistory, setShowHistory] = useState(false)
  const [dismissedHighroll, setDismissedHighroll] = useState(false)
  // One bus per screen, carrying each frame's cues from playback across to
  // the overlay layer (they're siblings — see AnimationLayer's own comment).
  const [bus] = useState(() => new AnimationBus())
  // Lives here rather than in `Table`, which remounts every frame: playing a
  // card would otherwise drop the hand tray shut under a cursor still resting
  // on it. Held in one object so `Table`'s prop identity is stable.
  const [handRaised, setHandRaised] = useState(false)
  const hand = useMemo(() => ({ handRaised, setHandRaised }), [handRaised])
  // Called unconditionally (before the loading-guard below) per the rules of
  // hooks. `ackFrame` is what lets the server pace its bots against these
  // animations rather than racing ahead of them.
  const shown = usePlayback(game.frame, bus, game.ackFrame)
  const view = shown.view
  if (view === null || seat === null || opponents.length === 0) {
    return <CenteredScreen title="Loading…" />
  }
  const over = view.result.over
  const activeSeatClass = seatClassOf(view.turnOrder, view.activePlayer)
  const showHighroll = view.turn.number === 0 && !dismissedHighroll

  return (
    <div className={`app active-${activeSeatClass}`}>
      {/* One slim row replaces the old topbar + seat-banner + per-layout
          pinned PhaseTrack/TurnBanner — room code, whose-turn (spelled out),
          the step pips, who's actually waiting to act, and the menu, all in
          one place instead of stacked as separate banners. */}
      <header className="top-strip">
        <span className="ts-room">room {game.roomId}</span>
        <TurnBanner view={view} seats={game.seats} />
        <PhaseTrack view={view} />
        <span className="ts-acting">
          {over
            ? 'Game over'
            : shown.busy
              ? 'Resolving…'
              : `${playerLabel(actingPlayer(view) ?? seat, game.seats)} to act`}
        </span>
        <div className="ts-menu">
          <button type="button" onClick={() => setShowHistory(true)}>
            History
          </button>
          <button type="button" onClick={() => window.location.assign('/')}>
            Leave
          </button>
        </div>
      </header>

      <ErrorLine game={game} />

      {showHighroll ? (
        <div className="highroll-banner" onClick={() => setDismissedHighroll(true)} role="alert">
          🎲 {playerLabel(view.startingPlayer, game.seats)} won the highroll and goes first
        </div>
      ) : null}

      {/* A sibling of <Table>, not a child: Table remounts on every frame
          it's keyed on, which would tear down anything animating inside it.
          Its cues come off the bus, each carrying the board it belongs to. */}
      <AnimationLayer bus={bus} seat={seat} seats={game.seats} />

      <Table
        key={shown.revision}
        view={view}
        seat={seat}
        opponents={opponents}
        game={game}
        // Emptied while a frame is still playing out: those actions belong
        // to a board the player can't see yet, and taking one now would race
        // the animation showing how the game got there. The server holds its
        // bots to the same rule — see `ackFrame`.
        actions={shown.busy ? EMPTY_ACTIONS : shown.actions}
        hand={hand}
      />

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
  /** `usePlayback`'s held-back list, matching the held-back `view` above
   * — never `game.actions` directly, which is already ahead of what's drawn
   * on screen (see GameScreen's own comment). */
  readonly actions: readonly LegalAction[]
  /** The peekable hand tray's raised state, owned by `GameScreen` so it
   * survives this component's per-frame remount. */
  readonly hand: {
    readonly handRaised: boolean
    readonly setHandRaised: (raised: boolean) => void
  }
}

/**
 * Everything interactive. Keyed on the parent's played-back revision, so
 * every in-progress selection resets in step with the board the player can
 * see, not with every raw network push (see usePlayback). State that should
 * *not* reset per frame — the hand tray being raised — lives in `GameScreen`
 * and arrives through props.
 */
function Table({ view, seat, opponents, game, actions, hand }: TableProps) {

  const [targeting, setTargeting] = useState<Targeting | null>(null)
  // Whether the collapsed hand tray (priority mode only -- see .hand-strip's
  // peekable variant) is raised. Hover/focus raises it; a two-zone hitbox
  // (a small .hand-trigger vs. the whole peekable strip) means raising it
  // needs less precision than keeping it raised does, so idle mouse movement
  // doesn't summon it but browsing it tolerates real cursor drift.
  //
  // Owned by `GameScreen`, not by this component: `Table` remounts on every
  // frame it's keyed on, and a local `useState` here dropped the hand back
  // into its tray the instant you played a card -- out from under a cursor
  // that was still sitting on it, mid-reach for the next one.
  const { handRaised, setHandRaised } = hand
  // Measured (not guessed) hand-row layout, recomputed whenever the row's
  // real rendered width changes (viewport resize, peekable<->in-flow mode
  // switch) or the hand's card count changes -- see HAND_CARD_GAP's comment.
  const handRowRef = useRef<HTMLDivElement>(null)
  const [handCardGap, setHandCardGap] = useState(HAND_CARD_GAP)
  // Per-player board elements (keyed by seat, since up to 4 boards each need
  // independent handling) that need their tile size shrunk below --mini-w's
  // ceiling once wrapping alone overflows their board's own scrollable area.
  // A Map + shared observers rather than one ref/effect per player, since
  // `renderBoard` runs in a loop/JSX map and hooks can't be called
  // conditionally or a variable number of times per render. See
  // `registerBoardEl`/`recomputeBoardMiniW` below.
  const boardElsRef = useRef<Map<PlayerId, HTMLDivElement>>(new Map())
  const boardResizeObserverRef = useRef<ResizeObserver | null>(null)
  const boardMutationObserverRef = useRef<MutationObserver | null>(null)
  // Set while an `{X}` cost is being chosen, before target selection — for an
  // X spell (`CastAction`) or an X activated ability (`AbilityAction`, EG-3).
  const [pendingX, setPendingX] = useState<{
    readonly action: CastAction | AbilityAction
    readonly value: number
    /** A permanent already chosen to pay an additional sacrifice cost (P8). */
    readonly sacrifice?: ObjectId
  } | null>(null)
  // Set while a targeted modal spell's modes are being chosen (Phase 11 EG-2),
  // before target selection.
  const [pendingModes, setPendingModes] = useState<{
    readonly cast: CastAction
    readonly picked: readonly number[]
    /** A permanent already chosen to pay an additional sacrifice cost (P8). */
    readonly sacrifice?: ObjectId
  } | null>(null)
  // Set while choosing which creature to sacrifice for an ability's cost.
  const [pendingSac, setPendingSac] = useState<AbilityAction | CastAction | null>(null)
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
    // First entry wins: a kickable spell is enumerated unkicked then kicked
    // (P8), and this map backs the "just cast it" shortcuts, which mean the
    // plain cast. The per-variant buttons come from `playFacesByCard`.
    for (const a of actions) if (a.kind === 'cast-spell' && !m.has(a.card)) m.set(a.card, a)
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
  const creatureTypeChoiceAction = actions.find(
    (a): a is CreatureTypeChoiceAction => a.kind === 'choose-creature-type',
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
    | 'choose-creature-type'
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
        : creatureTypeChoiceAction
          ? 'choose-creature-type'
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

  // Only discard/put-on-bottom force the hand itself open (the player is
  // choosing among their own hand cards) -- mulligan gets its own centered
  // popup instead (see renderMulliganModal) and every other mode's decision
  // is about the battlefield/stack/a popup (ZoneViewer for choose-from-zone
  // and scry), not the hand, so the hand can stay collapsed to a peek for
  // all of them too, same as ordinary priority. This is what keeps
  // .quadrant-grid from losing height (and recomputeBoardMiniW crushing the
  // board's mini tiles to compensate) every time one of those decisions
  // comes up -- see renderHandStrip/the .decision-banner CSS.
  const peekable = mode !== 'discard' && mode !== 'put-on-bottom' && mode !== 'mulligan'

  // --- dispatch helpers --------------------------------------------
  const pass = useCallback(() => {
    if (canPass) game.dispatch({ type: 'pass-priority', player: seat })
  }, [canPass, game, seat])

  const finishTargets = useCallback(
    (
      t: Pick<
        Targeting,
        | 'kind'
        | 'source'
        | 'abilityIndex'
        | 'xValue'
        | 'sacrifice'
        | 'via'
        | 'face'
        | 'modes'
        | 'kicked'
        | 'overload'
        | 'free'
      >,
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
                ...(t.kicked === true ? { kicked: true } : {}),
                ...(t.overload === true ? { overload: true } : {}),
                ...(t.free === true ? { free: true } : {}),
                ...(t.sacrifice !== undefined ? { sacrifice: t.sacrifice } : {}),
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

  /** Cast, past the additional-cost step — `sacrifice` is the permanent chosen
   * to pay a `CardDefinition.additionalCost` (Harrow: "sacrifice a land"). */
  const startCast = useCallback(
    (cast: CastAction, sacrifice?: ObjectId) => {
      const sacProp = sacrifice !== undefined ? { sacrifice } : {}
      if (cast.castModal) {
        setPendingModes({ cast, picked: [], ...sacProp })
        return
      }
      if (cast.xCost) {
        setPendingX({ action: cast, value: cast.xCost.maxX, ...sacProp })
        return
      }
      beginTargeting({
        kind: 'cast',
        source: cast.card,
        abilityIndex: 0,
        label: `Cast ${cast.cardName}`,
        specs: cast.targetSpecs,
        options: cast.targetOptions,
        ...castExtras(cast),
        ...sacProp,
      })
    },
    [beginTargeting],
  )

  const beginCast = useCallback(
    (cast: CastAction) => {
      // An additional sacrifice cost (rule 601.2f) is chosen first, before
      // modes / X / targets — same order the rules announce costs in.
      if (cast.sacrifice) {
        if (cast.sacrifice.choices.length === 0) return
        if (cast.sacrifice.choices.length === 1) {
          startCast(cast, cast.sacrifice.choices[0])
        } else {
          setPendingSac(cast)
        }
        return
      }
      startCast(cast)
    },
    [startCast],
  )

  // Confirm the chosen modes for a targeted modal spell (Phase 11 EG-2) →
  // proceed to targeting over the union of those modes' target specs.
  const confirmModes = useCallback(() => {
    if (!pendingModes?.cast.castModal) return
    const { cast, picked, sacrifice } = pendingModes
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
      ...castExtras(cast),
      ...(sacrifice !== undefined ? { sacrifice } : {}),
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
    const { action, value, sacrifice } = pendingX
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
      ...castExtras(action),
      ...(sacrifice !== undefined ? { sacrifice } : {}),
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
    opts: { stackCount?: number; mini?: boolean } = {},
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

    if (opts.mini) {
      return (
        <MiniTile
          key={id}
          obj={obj}
          highlight={highlight}
          selected={selected}
          activatable={activatable}
          badge={badge}
          order={order}
          stackCount={opts.stackCount ?? null}
          onClick={() => clickPermanent(ids)}
        />
      )
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
        onClick={() => clickPermanent(ids)}
      />
    )
  }

  const renderBoard = (pid: PlayerId, isOpp: boolean, landsBelow: boolean) => {
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
              mini: true,
            })}
            {entry.attachments.length > 0 ? (
              <div className="attachments">
                {entry.attachments.map((a, i) => (
                  <div
                    key={a.id}
                    // Back to front: the first attachment sits directly
                    // behind the host and each later one further back, so
                    // every strip stays visible instead of being covered by
                    // the attachment peeking out below it. Read via var()
                    // in App.css (same reason as the hand fan's own --z) so
                    // the plain :hover rule there can still win over it.
                    style={
                      { '--att-z': entry.attachments.length - i } as CSSProperties
                    }
                  >
                    {tileFor(a, pid, [a.id], { mini: true })}
                  </div>
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
    // nearest this seat's own edge of the table, so creatures from every
    // side meet toward the middle of the screen. Which edge that is depends
    // on the seat's row in the quadrant grid, not on whether it's an
    // opponent: in the 2x2 grid the bottom-right seat is an opponent sitting
    // along the *bottom* edge, so its lands belong under its creatures just
    // like your own. (Keying this off `isOpp` is a leftover from the layout
    // where every opponent stacked above you, and left that one seat
    // mirrored the wrong way.)
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
    const rows = landsBelow ? [permanentRow, landRow] : [landRow, permanentRow]

    return (
      <div
        className={`board ${isOpp ? 'opp' : 'you'} ${seatClassOf(view.turnOrder, pid)}`}
        ref={registerBoardEl(pid)}
      >
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
   * not which zone the card is actually sitting in). Rendered compactly
   * (name/cost/stats, full card on hover) rather than as a full `CardTile`
   * — see `CommanderTile`. */
  const commandZoneTile = (obj: VisibleObject) => {
    const castable = mode === 'priority' && castByCard.has(obj.id)
    const commanderTax =
      2 * (view.players[obj.owner]?.commanderCastCounts?.[obj.cardName] ?? 0)
    return (
      <CommanderTile
        key={obj.id}
        obj={obj}
        highlight={castable}
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
          {/* `data-library-of` is what the draw animation flies a cardback
              out of — an anchor that survives the top card being revealed
              (which swaps the pile below for a real tile). */}
          <div className="side-zone-cards" data-library-of={pid}>
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
  useEffect(() => {
    const row = handRowRef.current
    if (!row) return
    const recompute = () => {
      const cardEl = row.querySelector<HTMLElement>('.hand-card .card-tile')
      // offsetWidth, not getBoundingClientRect().width -- the latter is the
      // *visual* (post-transform) bounding box, which for any card past the
      // fan's uncapped range is rotated by up to HAND_FAN_MAX_ROT_DEG and
      // therefore reports a width inflated well past the card's real,
      // unrotated size (a rotated rectangle's axis-aligned bounding box is
      // always wider than the rectangle itself). Since every card shares the
      // same CSS width regardless of its own rotation, offsetWidth (the
      // layout box, untouched by the `rotate`/`translate` CSS properties)
      // gives the true, stable card width no matter which card in the row
      // happens to get queried. Using the rotated bounding width here was
      // the actual cause of a hand's fan looking wrong past ~16 cards (the
      // point the rotation cap engages): an inflated cw overstates how much
      // overlap is needed, so cards get crushed far tighter than the real
      // available width requires.
      const cw = cardEl?.offsetWidth ?? 0
      const n = row.querySelectorAll('.hand-card').length
      if (cw === 0 || n <= 1) {
        setHandCardGap(HAND_CARD_GAP)
        return
      }
      const naturalTotal = n * cw + (n - 1) * HAND_CARD_GAP
      const available = row.clientWidth
      if (naturalTotal <= available) {
        setHandCardGap(HAND_CARD_GAP)
        return
      }
      const overlap = (available - n * cw) / (n - 1)
      setHandCardGap(Math.max(overlap, -cw * HAND_OVERLAP_FLOOR))
    }
    recompute()
    const observer = new ResizeObserver(recompute)
    observer.observe(row)
    return () => observer.disconnect()
  }, [handIds.length])

  /** Wraps at --mini-w's own ceiling first (multiple rows of creatures is
   * normal, not something to avoid) -- only shrinks `boardEl`'s tiles below
   * that ceiling once wrapping alone still overflows its board's own
   * scrollable area (`.quadrant-body`'s `overflow-y:auto`), and only as far
   * as it takes to stop overflowing (or the floor). Resets to the ceiling
   * and re-measures from there every time, rather than nudging up/down from
   * wherever it last landed, so it also grows back once the board isn't
   * crowded any more (a creature dying, say). Mirrors CardTile.tsx's own
   * shrink-to-fit loop (measure, step, re-measure) for the same reason: a
   * single ratio-based guess over/undershoots because reflowed wrap counts
   * don't scale linearly with tile size. */
  const recomputeBoardMiniW = (boardEl: HTMLDivElement) => {
    const scrollArea = boardEl.closest<HTMLElement>('.quadrant-body')
    if (!scrollArea) return
    // The board's *own* height against the space the quadrant gives it --
    // not .quadrant-body's total overflow, which also counts the command/
    // library rail sitting beside it in the same scroll box. Measuring the
    // whole box meant a rail too tall for the quadrant (which is what it is
    // on any monitor shorter than 1440p -- see .quadrant-body .side-zone in
    // App.css) read as "this board is overflowing", so the loop below
    // ratcheted every tile to MINI_SHRINK_FLOOR and still couldn't clear an
    // overflow the board was never causing. offsetHeight, not
    // getBoundingClientRect: a tapped tile's rotation is visual overflow,
    // which mustn't count as the board needing less room.
    const padding = getComputedStyle(scrollArea)
    const available =
      scrollArea.clientHeight -
      parseFloat(padding.paddingTop) -
      parseFloat(padding.paddingBottom)
    boardEl.style.removeProperty('--mini-w')
    if (boardEl.offsetHeight <= available) return
    let miniW = naturalMiniW()
    boardEl.style.setProperty('--mini-w', `${miniW}px`)
    while (boardEl.offsetHeight > available && miniW > MINI_SHRINK_FLOOR) {
      miniW = Math.max(MINI_SHRINK_FLOOR, miniW - MINI_SHRINK_STEP)
      boardEl.style.setProperty('--mini-w', `${miniW}px`)
    }
  }
  // Two triggers to recompute a board: its scrollable area resizing (window
  // resize, a layout change) and its own tile count changing (a permanent
  // entering/leaving) -- the latter doesn't necessarily change
  // .quadrant-body's own box size (it's the *content* that grew, and
  // overflow:auto means that alone doesn't resize the scrolling box), so
  // ResizeObserver alone wouldn't catch it; a MutationObserver on each
  // board's subtree does. One shared instance of each rather than one
  // ref/effect per player -- see boardElsRef's comment above.
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        for (const boardEl of boardElsRef.current.values()) {
          if (boardEl.closest('.quadrant-body') === entry.target) recomputeBoardMiniW(boardEl)
        }
      }
    })
    const mutationObserver = new MutationObserver((mutations) => {
      const changed = new Set<HTMLDivElement>()
      for (const m of mutations) {
        const boardEl = (m.target as HTMLElement).closest<HTMLDivElement>('.board')
        if (boardEl) changed.add(boardEl)
      }
      for (const boardEl of changed) recomputeBoardMiniW(boardEl)
    })
    boardResizeObserverRef.current = resizeObserver
    boardMutationObserverRef.current = mutationObserver
    for (const el of boardElsRef.current.values()) {
      const scrollArea = el.closest('.quadrant-body')
      if (scrollArea) resizeObserver.observe(scrollArea)
      mutationObserver.observe(el, { childList: true, subtree: true })
      recomputeBoardMiniW(el)
    }
    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [])
  const registerBoardEl = useCallback(
    (pid: PlayerId) => (el: HTMLDivElement | null) => {
      const prev = boardElsRef.current.get(pid)
      if (prev) {
        const prevScrollArea = prev.closest('.quadrant-body')
        if (prevScrollArea) boardResizeObserverRef.current?.unobserve(prevScrollArea)
      }
      if (el) {
        boardElsRef.current.set(pid, el)
        const scrollArea = el.closest('.quadrant-body')
        if (scrollArea) boardResizeObserverRef.current?.observe(scrollArea)
        boardMutationObserverRef.current?.observe(el, { childList: true, subtree: true })
        recomputeBoardMiniW(el)
      } else {
        boardElsRef.current.delete(pid)
      }
    },
    [],
  )
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
  } else if (mode === 'choose-creature-type' && creatureTypeChoiceAction) {
    controls = (
      <div className="controls">
        <span>{game.nameOf(creatureTypeChoiceAction.source)} — choose a creature type</span>
        {creatureTypeChoiceAction.options.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() =>
              game.dispatch({ type: 'choose-creature-type', player: seat, creatureType: t })
            }
          >
            {t}
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
    // A slot whose only legal options are spells on the stack (Counterspell
    // and the like) needs no banner at all -- the stack itself is directly
    // clickable/highlighted now (see Stack.tsx's targetSlot/onTargetClick
    // wiring), so the player picks a target by clicking the actual card
    // instead of a text-button duplicate of it. Escape still cancels (see
    // the global keydown handler above) even with no visible Cancel button.
    const allStackTargets =
      targetSlot.length > 0 &&
      targetSlot.every((o) => o.kind === 'object' && view.zones.stack.includes(o.object))
    controls = allStackTargets ? null : (
      <div className="controls">
        <span>
          {activeTargeting.label}: choose{' '}
          {activeTargeting.specs[activeTargeting.picked.length]} (
          {activeTargeting.picked.length + 1}/{activeTargeting.specs.length})
        </span>
        {activeTargeting.kind === 'choose-targets' ? null : (
          <button type="button" onClick={() => setTargeting(null)}>
            Cancel
          </button>
        )}
      </div>
    )
  } else if (
    mode === 'choose-sacrifice' &&
    pendingSac !== null &&
    pendingSac.sacrifice !== undefined
  ) {
    // Either an activated ability's sacrifice cost, or a spell's additional
    // cost to cast (rule 601.2f — Harrow "sacrifice a land"). P8.
    const sacChoices = pendingSac.sacrifice.choices
    const sacChoice = pendingSac
    controls = (
      <div className="controls">
        <span>
          {sacChoice.cardName} — sacrifice which{' '}
          {sacChoice.kind === 'cast-spell' ? 'permanent' : 'creature'}?
        </span>
        {sacChoices.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setPendingSac(null)
              if (sacChoice.kind === 'cast-spell') startCast(sacChoice, id)
              else startAbility(sacChoice, id)
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
        {/* Only the "waiting on someone else" line — what they're deciding
            isn't shown anywhere else. The other case this used to render
            ("X has priority · <step>") is already in the top strip, spelled
            out, as "X to act" plus the full phase name; repeating it here
            was what pushed these four buttons onto a second row and made
            this corner tall enough to cover a whole quadrant's rail. */}
        {awaiting !== null ? (
          <span className="muted">
            {`Waiting for ${playerLabel(who, game.seats)} to ${AWAITING_LABEL[awaiting.kind]}…`}
          </span>
        ) : null}
        <button type="button" onClick={pass} disabled={!canPass}>
          Pass (space)
        </button>
        <button type="button" onClick={game.passTurn} disabled={!canPassTurn}>
          Pass Turn
        </button>
        {/* Short labels so all four fit one row; `title` carries the full
            sentence, since that's the part that actually explains them. */}
        <button
          type="button"
          onClick={game.autoPass}
          title={
            game.autoPassing
              ? 'Stop passing automatically'
              : 'Pass automatically until my own turn comes round again'
          }
        >
          {game.autoPassing ? 'Stop auto-pass' : 'Auto-pass'}
        </button>
        <button
          type="button"
          onClick={game.toggleManaSkip}
          title={
            game.skipManaOnly
              ? 'Stop at priority windows where the only thing to do is tap for mana'
              : 'Skip priority windows where the only thing to do is tap for mana'
          }
        >
          {game.skipManaOnly ? 'Show mana stops' : 'Skip mana stops'}
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

  /** The mulligan keep/decide prompt as its own centered popup instead of an
   * inline banner at the bottom of the screen -- it's the one forced
   * decision that blocks the whole game for every player still deciding, so
   * it gets an attention-grabbing placement of its own rather than sharing
   * the hand-strip's `.controls` slot with every other forced decision. The
   * hand itself renders inside the popup (via `renderHand`, the same one
   * every other mode uses) rather than separately below it, so the whole
   * decision -- what's in your hand and whether to keep it -- lives in one
   * place instead of split across a banner and a strip. */
  const renderMulliganModal = () => {
    if (mode !== 'mulligan' || !mulliganAction) return null
    return (
      <div className="mulligan-modal">
        <span>
          {mulliganAction.count === 0
            ? 'Keep your opening hand?'
            : `Mulligan #${mulliganAction.count} taken — keep this hand?`}
        </span>
        {renderHand()}
        <div className="mulligan-modal-actions">
          <button type="button" onClick={() => confirmMulligan(true)}>
            Keep
          </button>
          <button type="button" onClick={() => confirmMulligan(false)}>
            Mulligan
          </button>
        </div>
      </div>
    )
  }

  /** Wraps `renderHandAndControls` with the collapsed-peek tray behavior —
   * every mode except a forced decision on the hand itself (discard,
   * put-on-bottom) or the mulligan popup, which stay fully visible exactly
   * as before so nothing about those flows changes (see `peekable`'s own
   * comment above, by the `mode` computation). A two-zone hitbox: a small
   * `.hand-trigger` hugging the bottom edge is what raises it, but the whole
   * (much larger) `.hand-strip` has to be left before it lowers again --
   * easier to leave up than to summon by accident. */
  const renderHandStrip = () => {
    return (
      <div
        className={`hand-strip ${peekable ? 'peekable' : ''} ${handRaised ? 'raised' : ''}`}
        onMouseLeave={() => setHandRaised(false)}
      >
        {peekable ? (
          <div className="hand-trigger" onMouseEnter={() => setHandRaised(true)} />
        ) : null}
        <div
          className="hand-strip-inner"
          onMouseEnter={peekable ? () => setHandRaised(true) : undefined}
        >
          {renderHandAndControls()}
        </div>
      </div>
    )
  }

  /** The ability menu (for a selected permanent with 2+ activated
   * abilities), the priority/attack/block/etc. controls, and your own hand
   * — the interactive strip below the quadrant grid, shared by every player
   * count (2-4). */
  /** Your hand, fanned (see HAND_FAN_STEP_DEG/HAND_FAN_STEP_Y) -- always,
   * including the collapsed peek and the mulligan popup, not just while
   * actively raised/browsing. Shared between `renderHandAndControls` (every
   * mode except mulligan, which shows it inside its own popup instead --
   * see `renderMulliganModal`) so the hand only has one render path. */
  const renderHand = () => {
    // Only ever compresses the per-card step below the tuned default above
    // (never exceeds it), so an ordinary-sized hand renders identically to
    // before -- see HAND_FAN_MAX_ROT_DEG/HAND_FAN_MAX_LIFT_PX's comment.
    const maxFanOffset = (handIds.length - 1) / 2
    const fanStepDeg =
      maxFanOffset > 0
        ? Math.min(HAND_FAN_STEP_DEG, HAND_FAN_MAX_ROT_DEG / maxFanOffset)
        : HAND_FAN_STEP_DEG
    const fanStepY =
      maxFanOffset > 0
        ? Math.min(HAND_FAN_STEP_Y, HAND_FAN_MAX_LIFT_PX / maxFanOffset)
        : HAND_FAN_STEP_Y
    return (
    <div className="hand">
      <h3>
        {playerLabel(seat, game.seats)}'s hand ({handIds.length})
      </h3>
      <div className="hand-cards" ref={handRowRef}>
        {handIds.map((id, i) => {
          const obj = view.objects[id]
          if (!obj) return null
          const fanOffset = i - (handIds.length - 1) / 2
          const fanStyle: CSSProperties = {
            '--r': `${fanOffset * fanStepDeg}deg`,
            '--y': `${Math.abs(fanOffset) * fanStepY}px`,
            // Baseline stacking order, read via var(--z) in App.css so a
            // plain stylesheet :hover rule can still win over it (same
            // reason --r/--y are custom properties feeding a real `rotate`/
            // `translate` property instead of baking straight into an
            // inline transform -- see that comment below). Highest at the
            // center and falling off toward both edges, so the hand reads as
            // a fan opening outward from the middle: each card is overlapped
            // by its more-central neighbour and reveals its own outer edge,
            // symmetrically on both sides. Deliberately not plain DOM order
            // (where the last card would always win and the whole hand would
            // shingle one way), and deliberately not the reverse of this
            // either -- edges-in-front puts the outermost, most-rotated
            // cards on top of everything, which reads as the fan being in
            // front of itself rather than fanning out.
            '--z': Math.round((maxFanOffset - Math.abs(fanOffset)) * 10),
            // Never wraps to a second row and never shrinks the card
            // itself -- past a natural fit, cards overlap (a shrinking,
            // even negative, gap) instead. See HAND_CARD_GAP's comment.
            marginLeft: i === 0 ? 0 : `${handCardGap}px`,
          } as CSSProperties
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
          // More than one way to play this card: a multi-face card's sides,
          // or a kickable spell's kicked / unkicked casts (P8).
          const multiFace = faceOpts.length > 1
          return (
            <div key={id} className="hand-card" style={fanStyle}>
              <CardTile
                obj={obj}
                highlight={highlight || Boolean(suspend) || Boolean(foretell) || Boolean(cycle)}
                selected={selected}
                layout="art-first"
                onClick={() => clickHandCard(id)}
              />
              {multiFace
                ? faceOpts.map((a, i) => (
                    <button key={i} type="button" onClick={() => playFace(a)}>
                      {a.kind === 'play-land' ? 'Play' : 'Cast'} {a.cardName}
                      {a.kind === 'cast-spell' && a.kicked
                        ? ` (kicked ${a.kickerCost ?? ''})`
                        : ''}
                      {a.kind === 'cast-spell' && a.overload
                        ? ` (overload ${a.overloadCost ?? ''})`
                        : ''}
                      {a.kind === 'cast-spell' && a.free ? ' (free)' : ''}
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
    )
  }

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

      {/* priority mode's controls (Pass/Pass Turn/Auto-pass/Skip-mana) render
          in a fixed bottom-right bar instead (see .priority-actions below),
          mulligan's Keep/Mulligan choice (with the hand itself) renders as
          its own centered popup (see .mulligan-modal below), and every mode
          except discard/put-on-bottom floats its controls in a fixed
          .decision-banner instead (see the return below) -- docking them
          here would force this whole strip out of its peekable/fixed tray
          and into normal layout flow, which used to steal height from
          .quadrant-grid (and the board's own mini tiles) every time one of
          those decisions came up. Discard/put-on-bottom keep their controls
          here, inline with the hand, since those decisions are specifically
          about picking cards out of it. */}
      {mode === 'discard' || mode === 'put-on-bottom' ? controls : null}

      {/* mulligan shows the hand inside its own popup instead (see
          renderMulliganModal) -- rendering it here too would show it twice */}
      {mode === 'mulligan' ? null : renderHand()}
    </>
  )

  // Every player count uses the same quadrant-cell frame (one bordered,
  // rounded-rect box per seat: a head with that seat's PlayerPanel, a body
  // with their board + command/library rail, internally scrolling on its
  // own) -- there's no separate "classic" layout for 2 players anymore. 1
  // opponent (2-player) is a single-column, 2-row grid (opponent on top, you
  // on the bottom); 2-3 opponents (3-4 players) is the 2x2 grid, per-cell
  // order [opponents[0], opponents[1], you, opponents[2]] — top-left,
  // top-right, bottom-left (always you), bottom-right, with a 3-player game
  // simply leaving the 4th cell blank.
  const quadrantCells: readonly PlayerId[] =
    opponents.length === 1
      ? [opponents[0], seat]
      : [opponents[0], opponents[1], seat, opponents[2]].filter(
          (pid): pid is PlayerId => pid !== undefined,
        )
  // Mirrors .quadrant-grid / .quadrant-grid.two-player's grid-template-columns
  // in App.css — the only thing the cell order needs it for is telling a
  // top-row cell from a bottom-row one.
  const quadrantColumns = opponents.length === 1 ? 1 : 2

  return (
    <div className="player-col">
      {/* `peekable` is exactly the modes where the hand collapses to its
          fixed tray and the priority controls float in the corner — i.e.
          where something is permanently drawn over the bottom of the
          screen. In the other modes the hand strip is in normal flow and
          takes its own height, so there's nothing to reserve. */}
      <main className={`table ${peekable ? 'bottom-band' : ''}`}>
        <div className={`quadrant-grid ${opponents.length === 1 ? 'two-player' : ''}`}>
          {quadrantCells.map((pid, i) => (
            <div
              className={`quadrant-cell ${pid === seat ? 'self' : ''} ${
                view.activePlayer === pid ? 'active-turn' : ''
              }`}
              key={pid}
            >
              <div className="quadrant-head">{renderPlayerPanel(pid)}</div>
              <div className="quadrant-body">
                <div className="board-with-sidezone">
                  {/* a cell past the first row sits along the bottom edge of
                      the table, so its lands go under its creatures — see
                      renderBoard. The grid is one column for 2 players and
                      two for 3-4, so that's just the cell's index against
                      the column count. */}
                  {renderBoard(pid, pid !== seat, i >= quadrantColumns)}
                  {renderSideZone(pid)}
                </div>
              </div>
            </div>
          ))}
          {/* a 3-player game leaves the 4th cell blank rather than switching
              grid shapes */}
          {opponents.length === 2 ? <div className="quadrant-blank" /> : null}
        </div>
      </main>

      {renderHandStrip()}

      {mode === 'priority' ? (
        <div className="priority-actions">{controls}</div>
      ) : peekable ? (
        <div className="decision-banner">{controls}</div>
      ) : null}
      {renderMulliganModal()}
      {/* moved here (from GameScreen, a sibling of Table) so it can reuse
          Table's own targeting state/handlers -- a spell on the stack is
          just another legal-target object (e.g. a counterspell targeting
          "spell"), the same architecture tileFor already uses for
          battlefield permanents. */}
      {view.zones.stack.length > 0 ? (
        <Stack
          view={view}
          targetSlot={targetSlot}
          pickedIds={pickedObjKeys}
          onTargetClick={(id) => clickPermanent([id])}
        />
      ) : null}

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
