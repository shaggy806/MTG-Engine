import type { GameEvent, ObjectId, Phase, PlayerId } from 'engine/client'

/**
 * How long each kind of animation is on screen, at the viewer's normal speed.
 * Every one is multiplied by the viewer's `animScale` (see `motionPrefs.ts`):
 * here for the slots, in `AnimationLayer` for its overlay timeouts, and in
 * App.css as `calc(<ms> * var(--anim-scale))` for the matching
 * `animation-duration`s, so an overlay never outlives the time budgeted for
 * it.
 *
 * Only the ones marked as paced (see `PACED`) also hold the game up.
 * The turn and phase durations are how long that banner shows for, nothing
 * more — the game does not wait on them.
 *
 * A frame is one server push: the events it carries, played in order, and
 * then its board. The server publishes one per bot action and waits for the
 * client to say it's finished (see `server/src/room.ts`), so a frame is a
 * handful of events, not a whole turn's worth.
 */
export const CARD_STEP_MS = 1800
/**
 * The part of a card's beat it spends coming in and being shown (the entrance
 * and the hold of `CARD_STEP_MS`, without its exit) when it then flies on to
 * where it went (see {@link ScheduledEvent.putDown}): a spell to its place on
 * the stack, a land to its tile. The flight is a slot of its own in the second
 * half, once that place is on screen, so the card's whole beat is this plus a
 * flight rather than `CARD_STEP_MS`. App.css's `.holds` keyframes are this
 * long and end on the hold pose (72% of the full beat's keyframes).
 */
export const CARD_HOLD_MS = 1296
/** Covers LUNGE_DURATION_MS + the hit reaction that starts partway through
 * it (see AnimationLayer), so the next animation doesn't start on top of a
 * creature still shaking. */
export const HIT_STEP_MS = 720
/** A permanent fading off the board. Short on purpose — it's a beat of
 * punctuation after whatever killed it, not an event in its own right. */
export const DEATH_STEP_MS = 420
export const TURN_STEP_MS = 1300
export const PHASE_STEP_MS = 700
/** A cardback travelling from a library to its owner's hand. */
export const DRAW_STEP_MS = 520
/**
 * A card drawn into the viewer's own hand: off their library as a cardback,
 * turning face up on the way, and settling into its own place in the fan —
 * over the new board, where that place is (see {@link ScheduleOptions.handDraws}).
 * Paced, unlike an opponent's draw: the card is held hidden in the hand until
 * it lands, so the frame waits for it.
 */
export const HAND_DRAW_STEP_MS = 640
/** How far apart a run of draws into the viewer's hand is dealt: an opening
 * hand or a "draw three" arrives card by card. Tightened for a long run so
 * the whole run's stagger stays within {@link HAND_DRAW_SPREAD_MS}. */
const HAND_DRAW_STAGGER_MS = 120
const HAND_DRAW_SPREAD_MS = 720

/** How far apart the `count` cards of one run of draws into the viewer's
 * hand start, at normal speed. */
export function handDrawStaggerMs(count: number): number {
  return count <= 1 ? 0 : Math.min(HAND_DRAW_STAGGER_MS, HAND_DRAW_SPREAD_MS / (count - 1))
}

/** How long a run of `count` draws into the viewer's hand takes, at normal
 * speed: one flight, and a stagger for each card after the first. */
export function handDrawBeatMs(count: number): number {
  return count <= 0 ? 0 : HAND_DRAW_STEP_MS + (count - 1) * handDrawStaggerMs(count)
}
/** A permanent tilting to tapped, or back upright. One beat for every tap in
 * the frame (a spell's mana, an untap step), not one each. */
export const TAP_STEP_MS = 260
/** Something leaving the stack: a spell heading for the battlefield or its
 * graveyard, an ability dissolving, a countered spell breaking up. Paced, so
 * a resolve-all (one object per frame) reads as the pile coming down rather
 * than entries blinking out. */
export const STACK_EXIT_MS = 520
/** The permanent a triggered ability came from lighting up as the trigger
 * goes on the stack. One beat for every trigger in the frame. */
export const TRIGGER_STEP_MS = 480
/** A permanent arriving on the board (a token materialising). */
export const ENTER_STEP_MS = 420
/**
 * The longest a card's flight to its place on the new board may take (see
 * {@link ScheduledEvent.putDown}): a resolving permanent spell lifted off the
 * stack onto its tile, a land from its spotlight onto its tile, a spell from
 * its spotlight into its place on the stack. One beat each, in the order they
 * happened.
 *
 * A flight moves at a steady speed on screen, so how long it takes depends on
 * how far it goes ({@link flightMs}): a fixed time whipped a card across a
 * four-player table and dawdled over a short hop. But this module lays the
 * slots out before the new board exists, and where a card lands is only known
 * once it does. So a flight's slot reserves the most a flight may take, which
 * keeps the frame's ceiling honest however far it goes; and once the new board
 * is mounted, before any of it is painted, `usePlayback` measures each flight
 * and pulls everything after it forward by the time it didn't need
 * ({@link retimeFlights}), ending the frame early. Nothing waits on a
 * reservation it didn't use, and the server's 12 s wait for the frame is never
 * at risk, since the measured time is never more than the reserved one.
 */
export const FLIGHT_MAX_MS = 1100
/** The shortest a flight takes, however near: a hop any quicker reads as a
 * jump rather than a move. */
export const FLIGHT_MIN_MS = 420
/** What every flight takes on top of its distance: the speed-up and the
 * settle at either end. */
const FLIGHT_BASE_MS = 220
/** How long crossing the viewport corner to corner takes on top of
 * `FLIGHT_BASE_MS`. In diagonals rather than pixels, so a flight feels the
 * same at 1366x768 and 2560x1440. A full diagonal comes out longer than
 * `FLIGHT_MAX_MS`, and is capped at it. */
const FLIGHT_MS_PER_DIAGONAL = 1100

/**
 * How long a flight of `distance` px takes on a viewport whose diagonal is
 * `diagonal` px, at normal speed (the caller scales it by `animScale`): a
 * steady speed of about one diagonal a second, held between `FLIGHT_MIN_MS`
 * and `FLIGHT_MAX_MS`.
 */
export function flightMs(distance: number, diagonal: number): number {
  const ms = FLIGHT_BASE_MS + (diagonal > 0 ? distance / diagonal : 1) * FLIGHT_MS_PER_DIAGONAL
  return Math.round(Math.min(FLIGHT_MAX_MS, Math.max(FLIGHT_MIN_MS, ms)))
}
/** A glow for counters landing on a permanent, or a buff that isn't counters
 * (a pump, a granted keyword), with the change floating off it. */
export const MARK_STEP_MS = 520
/** A double-faced card turning over. */
export const FLIP_STEP_MS = 460
/** Life gained or lost, damage marked on a creature: a flash and a number
 * floating up off the life total or the tile. Long enough to read the number. */
export const HURT_STEP_MS = 700
/** One card leaving a library from the top (milled, or exiled), shown on the
 * library pile itself: there's no graveyard or exile drawn on the table for
 * it to travel to. The cards peel off one after another, `MILL_STAGGER_MS`
 * apart, so a mill of three looks like three — see {@link millDurationMs}.
 * Long enough to read: a card that goes face up (anything but a face-down
 * exile) turns over and is held, fanned out beside the pile, before it goes. */
export const MILL_STEP_MS = 1100
/** How long after one card starts peeling off the next one does. */
export const MILL_STAGGER_MS = 200
/** At most this many cards peel off one by one; past it the pile's count
 * still runs all the way down, a few cards to a step. */
export const MAX_PEELED = 8

/** How many cards an event takes off the top of libraries: every milled
 * card, or every card exiled from a library. */
export function cardsOffLibraries(ev: GameEvent): number {
  if (ev.type === 'cards-milled') return ev.objects.length
  if (ev.type === 'cards-put-into-exile') return ev.arrivals.filter((a) => a.from === 'library').length
  return 0
}

/** The time a library losing `count` cards takes: one peel, then one stagger
 * for each further card shown peeling. */
export function millDurationMs(count: number): number {
  return MILL_STEP_MS + Math.max(0, Math.min(count, MAX_PEELED) - 1) * MILL_STAGGER_MS
}

/** One stretch of a library's cards leaving in a run (see
 * {@link libraryPeels}): all milled or all exiled. */
export interface PeelPart {
  /** Exiled from the top, rather than milled. */
  readonly exile: boolean
  /** Each card, in the order it left, with the event it left in — what the
   * card was publicly known as at that moment, if anything, is its face
   * (`publicNameAt`). */
  readonly cards: readonly { readonly object: ObjectId; readonly seq: number }[]
  /** How many cards. At most `MAX_PEELED` of them are shown peeling. */
  readonly count: number
  /** How many `MILL_STAGGER_MS` steps after the run starts this part's
   * first card starts peeling: after the cards shown leaving this library
   * earlier in the run. */
  readonly startStep: number
}

/** One library's cards leaving in a run of mills and exiles. */
export interface LibraryPeel {
  readonly player: PlayerId
  readonly parts: readonly PeelPart[]
}

/**
 * What a run of mills and exiles from the top takes off each library,
 * merged — a run being the mill slots that share a beat (see `layOut`).
 *
 * The engine exiles one card at a time where the rules say "until": cascade
 * (rule 702.85a), discover (701.57a) and every "exile cards from the top of
 * your library until …" announce each card as its own move. A cascade
 * through five cards is five events, and it has to look like one library
 * losing five cards one after another, as a mill of five does — not five
 * cards peeling off together on top of each other. So one library's cards
 * of one kind add up across the run, and a library milled and then exiled
 * from peels the second stretch after the first. Different libraries peel
 * side by side, as "each player mills three" always has.
 */
export function libraryPeels(events: readonly GameEvent[]): LibraryPeel[] {
  const byPlayer = new Map<PlayerId, { exile: boolean; count: number; cards: { object: ObjectId; seq: number }[] }[]>()
  const add = (player: PlayerId, exile: boolean, objects: readonly ObjectId[], seq: number): void => {
    const parts = byPlayer.get(player) ?? []
    const last = parts.at(-1)
    const cards = objects.map((object) => ({ object, seq }))
    if (last !== undefined && last.exile === exile) {
      last.count += objects.length
      last.cards.push(...cards)
    } else parts.push({ exile, count: objects.length, cards })
    byPlayer.set(player, parts)
  }
  for (const ev of events) {
    if (ev.type === 'cards-milled') {
      if (ev.objects.length > 0) add(ev.player, false, ev.objects, ev.seq)
    } else if (ev.type === 'cards-put-into-exile') {
      // Exile is one shared zone: each arrival names whose library it left.
      for (const a of ev.arrivals) if (a.from === 'library') add(a.owner, true, [a.object], ev.seq)
    }
  }
  return [...byPlayer].map(([player, parts]) => {
    let step = 0
    return {
      player,
      parts: parts.map((part) => {
        const startStep = step
        step += Math.min(part.count, MAX_PEELED)
        return { ...part, startStep }
      }),
    }
  })
}

/** How long a run's peels take: its busiest library's, one peel and then a
 * stagger for each further card shown peeling off it. */
export function peelDurationMs(peels: readonly LibraryPeel[]): number {
  let steps = 0
  for (const { parts } of peels) {
    const last = parts.at(-1)
    if (last !== undefined) steps = Math.max(steps, last.startStep + Math.min(last.count, MAX_PEELED))
  }
  return steps === 0 ? 0 : MILL_STEP_MS + (steps - 1) * MILL_STAGGER_MS
}
/** A discarded card leaving the hand, in place. */
export const DISCARD_STEP_MS = 480
/** A library shuffled: its top cards twist out over the pile and back
 * (`AnimationLayer`'s `runShuffle`). */
export const SHUFFLE_STEP_MS = 1200
/** The viewer's own mulligan, before its shuffle: the hand in the mulligan
 * popup flies back onto the library, card after card, as a draw in reverse
 * (`AnimationLayer`'s `runReturnHand`). */
export const MULLIGAN_RETURN_MS = 800
/** A permanent moving to a new place on the board: a change of control, an
 * Aura or Equipment moving to a new host. */
export const MOVE_STEP_MS = 560
/** The monarch's crown passing to its new holder. */
export const CROWN_STEP_MS = 640
/** How long a revealed card is held up for everyone to read. Longer than a
 * banner because there's a card face to actually take in, and unpaced — the
 * information is already in the History log, so nobody has to catch it. */
export const REVEAL_STEP_MS = 2600
/** A die roll thrown onto the table (`ui/diceRoll.ts`): the dice tumble in
 * and bounce for the first 60%, then rest showing what was rolled, long
 * enough to read, before the roll's effects play. Paced: the game waits. */
export const DICE_STEP_MS = 2400
/** How far apart a run of draws in one frame is dealt out, so an opening
 * hand or a "draw three" arrives as cards rather than a single clump. Does
 * not hold the game up — see `PACED`. */
const DRAW_STAGGER_MS = 110
/** Beyond this many draws in one frame, stop animating them: past a handful
 * it's a blizzard of cardbacks nobody is counting, and a mulligan redraw can
 * produce a whole opening hand at once. */
const MAX_DRAWN_PER_FRAME = 5

/**
 * A ceiling on one frame at normal speed. The server's pacing keeps frames
 * small, so this is a backstop for the cases it doesn't cover — a seat
 * auto-passing its own way through several turns with nobody to stop at,
 * most of all. Events past the ceiling are shown without animating: they get
 * no slot *and* no overlay, so nothing ever plays over a board that has
 * moved on, which is what clustering them at the ceiling used to do.
 */
const MAX_FRAME_MS = 6000
/**
 * The ceiling whatever the viewer's speed: `MAX_FRAME_MS` grows with a slower
 * `animScale`, but never past this. It has to stay under the server's
 * `FRAME_ACK_TIMEOUT_MS` (12 s, `server/src/room.ts`), or the server gives up
 * on this seat mid-animation and the bot moves on underneath it.
 */
const FRAME_CEILING_MS = 11000

/**
 * Which half of a frame an animation plays in.
 *
 * `before` runs over the board the frame started from, which is still on
 * screen: a card flying in, a creature striking, a permanent leaving. Those
 * describe the change, so the board mustn't jump to the outcome first.
 *
 * `after` runs over the new board, once it's shown: a tile tilting to
 * tapped. Those describe something only the new board has, so they can't
 * start until it's there. See `usePlayback`.
 */
export type Half = 'before' | 'after'

export interface ScheduledEvent {
  readonly event: GameEvent
  /** Milliseconds from the start of its half at which this event's own
   * animation should fire. */
  readonly offset: number
  /**
   * A card that flies on to where it went once the new board shows it. Set on
   * both ends of the move or on neither, so a card held up always has its
   * landing to come:
   *
   * - a permanent spell resolving: its `spell-resolved` (first half: the card
   *   lifts off the stack rather than flying off to its controller's side)
   *   and its `permanent-entered-battlefield` (second half: the lifted card
   *   travels onto its tile, instead of the tile growing in);
   * - a land played: its `land-played` (first half: the spotlight holds
   *   rather than shrinking away, for `CARD_HOLD_MS`) and its
   *   `permanent-entered-battlefield` (second half: the spotlight's card
   *   travels onto its tile);
   * - a spell cast and still on the stack as the frame ends: its `spell-cast`,
   *   in both halves (the spotlight holds, then its card travels into the
   *   place its entry takes in the pile).
   */
  readonly putDown?: true
  /** A second-half `putDown`'s flight time in ms, at the viewer's speed: as
   * scheduled, the most it may take (`FLIGHT_MAX_MS`); as published, what it
   * measured on the new board (see {@link retimeFlights}). */
  readonly flightMs?: number
}

/** The viewer's settings the schedule depends on (see `motionPrefs.ts`),
 * passed in so this module stays free of the DOM and testable on its own. */
export interface ScheduleOptions {
  readonly scale: number
  readonly reduced: boolean
  /** The cards this frame's draws put in the viewer's own hand, which is on
   * screen: each of those draws flies into its place in the fan over the new
   * board (`handDraw`) rather than as a cardback toward a seat's edge over
   * the old one. Any other draw — an opponent's, or a card that left the
   * hand again within the frame — is the cardback. */
  readonly handDraws?: ReadonlySet<ObjectId>
  /** The viewer's own seat, whose mulligan first sends the hand on screen
   * back to the library (`MULLIGAN_RETURN_MS`); null for a spectator. */
  readonly seat?: PlayerId | null
}

const NORMAL_SPEED: ScheduleOptions = { scale: 1, reduced: false }

export interface EventSchedule {
  /** The events animated over the old board — `AnimationLayer` iterates it to
   * know what to trigger and when. */
  readonly items: readonly ScheduledEvent[]
  /**
   * How long to stay on the *previous* board before showing this frame's
   * outcome. Only the animations that describe a change to the board count
   * toward it — see `PACED` below.
   */
  readonly totalMs: number
  /** The events animated over the new board, offsets from when it's shown. */
  readonly after: readonly ScheduledEvent[]
  /** How long to hold the new board before the next frame may start and the
   * server may be told this one is done. */
  readonly afterMs: number
  /** The step-based phase tracking (for skipping a redundant "Beginning
   * Phase" banner/slot right after a turn starts) carries across frames —
   * pass this back in as the next call's `startPhase`. */
  readonly endPhase: Phase
  /** Each spell or ability that resolves over the old board, with when its
   * target arrows are up (see {@link ResolveAim}), in the order they
   * resolve. */
  readonly aims: readonly ResolveAim[]
}

/**
 * A resolving spell or ability pointing at what it targets, over the board
 * the first half plays on, where it is still on the stack (`ArrowLayer`).
 *
 * The arrows go up with the first animated event of its resolution, not with
 * its own exit beat: the engine logs what a spell does before it logs the
 * spell leaving the stack (`spell-resolved` comes last), so a creature it
 * destroys fades out before that beat — pointed at only from the start. They
 * come down as the exit beat ends, the object gone from the stack.
 */
export interface ResolveAim {
  /** The resolving spell or ability: its id on the stack. */
  readonly object: ObjectId
  /** Milliseconds from the start of the first half. */
  readonly from: number
  readonly until: number
}

/** Something leaving the stack having resolved — the only exits that point
 * at their targets. A countered or fizzled spell doesn't resolve (rules
 * 701.6a, 608.2b), so it hit nothing. */
function resolvedObject(ev: GameEvent): ObjectId | null {
  return ev.type === 'spell-resolved' || ev.type === 'ability-resolved' ? ev.object : null
}

/**
 * When each resolution in the first half has its arrows up. A resolution
 * begins with the priority pass that let it happen — every player passing
 * in succession is what resolves the top of the stack (rule 117.4) — or with
 * the object before it finishing resolving; one whose start is in an earlier
 * frame (it stopped for a decision partway) begins with this one. Its arrows
 * go up with the first animated event after that start and come down when
 * its exit beat ends. A resolution with no exit slot (past the frame's
 * ceiling) gets none.
 */
function resolveAims(
  events: readonly GameEvent[],
  items: readonly ScheduledEvent[],
  exitMs: number,
): ResolveAim[] {
  const aims: ResolveAim[] = []
  for (const exit of items) {
    const object = resolvedObject(exit.event)
    if (object === null) continue
    const seq = exit.event.seq
    let start = -Infinity
    for (const e of events) {
      if (e.seq >= seq) break
      if (e.type === 'priority-passed' || resolvedObject(e) !== null) start = e.seq
    }
    let from = exit.offset
    for (const item of items) {
      if (item.event.seq > start && item.event.seq <= seq) from = Math.min(from, item.offset)
    }
    aims.push({ object, from, until: exit.offset + exitMs })
  }
  return aims
}

type SlotKind =
  | 'card'
  | 'hit'
  | 'death'
  | 'draw'
  | 'handDraw'
  | 'turn'
  | 'phase'
  | 'reveal'
  | 'dice'
  | 'tap'
  | 'untap'
  | 'exit'
  | 'pulse'
  | 'enter'
  | 'putDown'
  | 'counter'
  | 'buff'
  | 'flip'
  | 'hurt'
  | 'mill'
  | 'discard'
  | 'capture'
  | 'move'
  | 'crown'
  | 'shuffle'
  // Nothing drawn, only heard (a shuffle, under reduced motion): costs no
  // time.
  | 'sound'

/**
 * The kinds that play over the new board rather than the old one, in the
 * order they play. Unlike the first half, whose order is the story of the
 * frame (a card played, then a creature striking, then it dying), everything
 * here is a change the board already shows, so it's grouped by kind: a
 * creature that enters with counters and an enters trigger reads as three
 * beats — it arrives, its counters glow, its trigger lights up — rather than
 * whatever order the engine happened to log them in, and each run of one kind
 * shares a beat.
 */
const AFTER_ORDER: readonly SlotKind[] = [
  // First: a card flying on to its place (a tile, or its entry in the stack
  // pile) is hovering where it was held until it lands, so nothing else on
  // the new board goes before it.
  'putDown',
  'untap',
  'tap',
  // A drawn card settling into the hand, once the tiles have tapped or
  // untapped (an untap step and its draw read in that order).
  'handDraw',
  'enter',
  'move',
  'flip',
  'counter',
  'buff',
  'hurt',
  'crown',
  'pulse',
]
const AFTER: ReadonlySet<SlotKind> = new Set<SlotKind>(AFTER_ORDER)

/**
 * Which animations the game actually waits for. A card being played, a
 * creature connecting, a permanent leaving the board, a tile tapping are
 * *what happened*, so the board mustn't move on until they've run. A turn or
 * phase banner is only a caption on top: it holds nothing up, costs no time,
 * and plays over whatever the board has moved on to — otherwise a land the
 * bot played sits in the air for the length of an "End Phase" banner before
 * reaching the table.
 */
const PACED: ReadonlySet<SlotKind> = new Set<SlotKind>([
  'card',
  'dice',
  'handDraw',
  'hit',
  'death',
  'tap',
  'untap',
  'exit',
  'pulse',
  'enter',
  'putDown',
  'counter',
  'buff',
  'flip',
  'hurt',
  'mill',
  'discard',
  'move',
  'crown',
  'shuffle',
])
/** Kinds where a run in one frame plays together on one beat rather than one
 * after another: a wrath's deaths, a spell's worth of lands tapping. */
const SHARED_BEAT: ReadonlySet<SlotKind> = new Set<SlotKind>([
  'death',
  'mill',
  'discard',
  // Every player's library at once (Timetwister, a table of mulligans).
  'shuffle',
  // Not `putDown`: two permanents resolving in one frame land one after the
  // other, each card onto its own tile.
  ...AFTER_ORDER.filter((k) => k !== 'putDown'),
])

interface Slot {
  readonly event: GameEvent
  readonly kind: SlotKind
  readonly duration: number
  /** One end of a card flying on to where it went (see
   * {@link ScheduledEvent.putDown}): the `seq` of the event that starts the
   * move, the same on both ends. */
  readonly landing?: number
}

/**
 * The cards in a frame that fly on to where they went (see
 * {@link ScheduledEvent.putDown}), each keyed by the `seq` of the event that
 * starts its move: `byBefore` maps that event to its key, `byAfter` the event
 * whose second-half slot is the flight.
 */
interface Landings {
  readonly byBefore: Map<number, number>
  readonly byAfter: Map<number, number>
}

/** Whether `ev` takes `object` off the stack. */
function leavesStack(ev: GameEvent, object: ObjectId): boolean {
  return (
    (ev.type === 'spell-resolved' ||
      ev.type === 'spell-countered' ||
      ev.type === 'spell-fizzled' ||
      ev.type === 'spell-exiled') &&
    ev.object === object
  )
}

/**
 * Every card in the frame that can fly on to where it went:
 *
 * - a permanent spell resolving, logged as `spell-resolved` and then its
 *   arrival on the battlefield under the same id (the engine keeps an
 *   object's id across zones): the arrival is the spell put down, not a
 *   permanent appearing from nowhere;
 * - a land played, logged as `land-played` and then its arrival the same way;
 * - a spell cast that nothing later in the frame takes off the stack again:
 *   it's on the stack on the new board, so its spotlight has a place in the
 *   pile to go to. One that resolves, is countered or fizzles within the
 *   frame never had an entry drawn, and keeps the spotlight it always had.
 *
 * None under reduced motion, which keeps the fades.
 */
function findLandings(events: readonly GameEvent[], reduced: boolean): Landings {
  const landings: Landings = { byBefore: new Map(), byAfter: new Map() }
  if (reduced) return landings
  const toTile = new Map<ObjectId, number>()
  for (const [index, ev] of events.entries()) {
    if (ev.type === 'spell-resolved' || ev.type === 'land-played') toTile.set(ev.object, ev.seq)
    else if (ev.type === 'permanent-entered-battlefield') {
      const key = toTile.get(ev.object)
      if (key === undefined) continue
      toTile.delete(ev.object)
      landings.byBefore.set(key, key)
      landings.byAfter.set(ev.seq, key)
    } else if (ev.type === 'spell-cast') {
      if (events.slice(index + 1).some((later) => leavesStack(later, ev.object))) continue
      landings.byBefore.set(ev.seq, ev.seq)
      landings.byAfter.set(ev.seq, ev.seq)
    }
  }
  return landings
}

/** Each event's own reserved slots, or none for anything with no dedicated
 * animation — usually one, but combat damage to a creature is two: the
 * strike over the old board, the number over the new one, and so is a spell
 * cast onto the stack: its spotlight, and its flight into the pile. */
function slotsFor(
  ev: GameEvent,
  phase: { current: Phase },
  reduced: boolean,
  landings: Landings,
): Slot[] {
  const start = landings.byBefore.get(ev.seq)
  const flight = landings.byAfter.get(ev.seq)
  if (start !== undefined || flight !== undefined) {
    const slots: Slot[] = []
    if (start !== undefined) {
      slots.push(
        ev.type === 'spell-resolved'
          ? { event: ev, kind: 'exit', duration: STACK_EXIT_MS, landing: start }
          : // The spotlight without its exit: the flight is the exit.
            { event: ev, kind: 'card', duration: CARD_HOLD_MS, landing: start },
      )
    }
    if (flight !== undefined) {
      slots.push({ event: ev, kind: 'putDown', duration: FLIGHT_MAX_MS, landing: flight })
    }
    return slots
  }
  if (ev.type === 'damage-dealt') {
    const slots: Slot[] = []
    if (ev.combat) slots.push({ event: ev, kind: 'hit', duration: HIT_STEP_MS })
    // Damage to a player is shown by the life it cost (`life-changed`), so
    // only a creature or planeswalker gets its own number here.
    if (ev.target.kind === 'object' && ev.amount > 0) {
      slots.push({ event: ev, kind: 'hurt', duration: HURT_STEP_MS })
    }
    return slots
  }
  // Something that moves on the board is two slots: a snapshot of where it
  // was, taken over the old board (it costs no time — `AnimationLayer` takes
  // it the moment the frame starts), and the flight to where it now is, over
  // the new one. Only both boards together say where it went from and to.
  if (ev.type === 'control-changed' || ev.type === 'permanent-attached') {
    return [
      { event: ev, kind: 'capture', duration: 0 },
      { event: ev, kind: 'move', duration: MOVE_STEP_MS },
    ]
  }
  if (ev.type === 'monarch-changed') {
    return [
      { event: ev, kind: 'capture', duration: 0 },
      { event: ev, kind: 'crown', duration: CROWN_STEP_MS },
    ]
  }
  const slot = slotFor(ev, phase, reduced)
  return slot === null ? [] : [slot]
}

/** The single slot an event reserves, or `null`. Mutates `phase` so a
 * `step-began` into the *same* phase, or the "beginning" phase a
 * `turn-began` already announced, doesn't also claim one. */
function slotFor(ev: GameEvent, phase: { current: Phase }, reduced: boolean): Slot | null {
  if (ev.type === 'spell-cast' || ev.type === 'land-played') {
    return { event: ev, kind: 'card', duration: CARD_STEP_MS }
  }
  // Changes to the new board, each played over it (see AFTER_ORDER). All
  // but the flip keep something under reduced motion: an arrival fades in,
  // a glow and a number are colour and text, not movement.
  if (ev.type === 'permanent-entered-battlefield') {
    return { event: ev, kind: 'enter', duration: ENTER_STEP_MS }
  }
  if (ev.type === 'counter-added' && ev.amount > 0) {
    return { event: ev, kind: 'counter', duration: MARK_STEP_MS }
  }
  if (ev.type === 'pt-modified' || ev.type === 'keyword-granted') {
    return { event: ev, kind: 'buff', duration: MARK_STEP_MS }
  }
  if (ev.type === 'permanent-transformed') {
    return reduced ? null : { event: ev, kind: 'flip', duration: FLIP_STEP_MS }
  }
  if (ev.type === 'life-changed' && ev.delta !== 0) {
    return { event: ev, kind: 'hurt', duration: HURT_STEP_MS }
  }
  // Leaving a library or a hand is shown where the card was, over the old
  // board. A fade under reduced motion, so it's kept.
  if (
    ev.type === 'cards-milled' ||
    (ev.type === 'cards-put-into-exile' && ev.arrivals.some((a) => a.from === 'library'))
  ) {
    return { event: ev, kind: 'mill', duration: millDurationMs(cardsOffLibraries(ev)) }
  }
  if (ev.type === 'cards-discarded' && ev.objects.length > 0) {
    return { event: ev, kind: 'discard', duration: DISCARD_STEP_MS }
  }
  if (ev.type === 'permanent-left-battlefield') {
    return { event: ev, kind: 'death', duration: DEATH_STEP_MS }
  }
  // Leaving the stack plays over the old board, where the entry still is.
  // Kept under reduced motion as a fade: it's the only sign the object has
  // gone, and which way (resolved, countered).
  if (
    ev.type === 'spell-resolved' ||
    ev.type === 'ability-resolved' ||
    ev.type === 'spell-countered' ||
    ev.type === 'spell-fizzled'
  ) {
    return { event: ev, kind: 'exit', duration: STACK_EXIT_MS }
  }
  // A triggered or activated ability's source lights up over the new board,
  // where the ability has just joined the stack (a mana ability, which
  // doesn't use the stack, has no beat). A colour cue, so reduced motion
  // keeps it.
  if (ev.type === 'ability-triggered' || (ev.type === 'ability-activated' && ev.ability !== undefined)) {
    return { event: ev, kind: 'pulse', duration: TRIGGER_STEP_MS }
  }
  // Pure movement, so reduced motion leaves nothing to show: the tile is
  // simply drawn tapped, and the hand simply has one more card.
  if (ev.type === 'permanent-tapped' || ev.type === 'permanent-untapped') {
    if (reduced) return null
    // Separate kinds, so an untap step followed by tapping for mana reads as
    // two moves rather than one blur of tiles going both ways.
    const kind = ev.type === 'permanent-tapped' ? 'tap' : 'untap'
    return { event: ev, kind, duration: TAP_STEP_MS }
  }
  if (ev.type === 'card-drawn') {
    return reduced ? null : { event: ev, kind: 'draw', duration: DRAW_STEP_MS }
  }
  if (ev.type === 'dice-rolled') {
    return { event: ev, kind: 'dice', duration: DICE_STEP_MS }
  }
  // A mulligan shuffles the hand back in without a `library-shuffled`. Pure
  // movement, so reduced motion keeps only its sound.
  if (ev.type === 'library-shuffled' || ev.type === 'mulligan-taken') {
    return reduced ? { event: ev, kind: 'sound', duration: 0 } : { event: ev, kind: 'shuffle', duration: SHUFFLE_STEP_MS }
  }
  if (ev.type === 'cards-revealed') {
    return { event: ev, kind: 'reveal', duration: REVEAL_STEP_MS }
  }
  if (ev.type === 'turn-began') {
    phase.current = 'beginning'
    return { event: ev, kind: 'turn', duration: TURN_STEP_MS }
  }
  if (ev.type === 'step-began') {
    if (ev.phase === phase.current) return null
    phase.current = ev.phase
    return { event: ev, kind: 'phase', duration: PHASE_STEP_MS }
  }
  return null
}

export function scheduleEvents(
  events: readonly GameEvent[],
  startPhase: Phase,
  options: ScheduleOptions = NORMAL_SPEED,
): EventSchedule {
  const { scale, reduced } = options
  const landings = findLandings(events, reduced)
  // A card flies on only where both ends of its move kept their slot under
  // the frame's ceiling: one whose start was dropped has no card held up to
  // land, and one whose flight was dropped would leave its card hovering. The
  // start's slot is shorter for a card that flies on (`CARD_HOLD_MS`), so a
  // card that can't goes back to its full beat — which moves everything after
  // it — and the frame is laid out again without it. Each pass drops at least
  // one, so this ends.
  for (;;) {
    const { schedule, paired } = layOutFrame(events, startPhase, scale, reduced, landings, options)
    const lost = [...landings.byBefore.values()].filter((key) => !paired.has(key))
    if (lost.length === 0) return schedule
    for (const key of lost) {
      landings.byBefore.delete(key)
      for (const [seq, k] of landings.byAfter) if (k === key) landings.byAfter.delete(seq)
    }
  }
}

/** One frame's slots in both halves, and which landings (by key) kept both
 * of their ends. */
function layOutFrame(
  events: readonly GameEvent[],
  startPhase: Phase,
  scale: number,
  reduced: boolean,
  landings: Landings,
  { handDraws = new Set(), seat = null }: ScheduleOptions,
): { schedule: EventSchedule; paired: Set<number> } {
  const phase = { current: startPhase }
  const slots: Slot[] = []
  for (const event of events) {
    for (const slot of slotsFor(event, phase, reduced, landings)) {
      // A draw into the viewer's own hand settles into its place there, over
      // the new board.
      const own = slot.kind === 'draw' && slot.event.type === 'card-drawn' && handDraws.has(slot.event.object)
      // The viewer's own mulligan sends the hand back before it shuffles.
      const ownMulligan = slot.kind === 'shuffle' && slot.event.type === 'mulligan-taken' && slot.event.player === seat
      slots.push(
        own
          ? { ...slot, kind: 'handDraw', duration: HAND_DRAW_STEP_MS }
          : ownMulligan
            ? { ...slot, duration: MULLIGAN_RETURN_MS + SHUFFLE_STEP_MS }
            : slot,
      )
    }
  }

  // Announce only the phase a frame *lands* in, not every one it passed
  // through. A frame shows exactly one board — its own end state — so a
  // banner for an intermediate phase describes a board nobody will ever see,
  // and a seat auto-passing whole turns produces a dozen of them in a single
  // frame. A turn change is a real beat and always keeps its banner.
  let laterBoundary = false
  const kept: Slot[] = []
  for (let i = slots.length - 1; i >= 0; i -= 1) {
    const slot = slots[i]
    if (slot.kind === 'phase' && laterBoundary) continue
    if (slot.kind === 'phase' || slot.kind === 'turn') laterBoundary = true
    kept.push(slot)
  }
  kept.reverse()

  // One ceiling for both halves together: it's the whole frame the server
  // waits on.
  const ceiling = Math.min(MAX_FRAME_MS * scale, FRAME_CEILING_MS)
  const before = layOut(
    kept.filter((s) => !AFTER.has(s.kind)),
    scale,
    ceiling,
  )
  const after = layOut(
    // A stable sort, so events of one kind keep the order they happened in.
    kept
      .filter((s) => AFTER.has(s.kind))
      .sort((a, b) => AFTER_ORDER.indexOf(a.kind) - AFTER_ORDER.indexOf(b.kind)),
    scale,
    ceiling - before.totalMs,
  )
  const paired = new Set([...before.landings].filter((key) => after.landings.has(key)))
  return {
    schedule: {
      items: before.items,
      totalMs: before.totalMs,
      after: after.items,
      afterMs: after.totalMs,
      endPhase: phase.current,
      aims: resolveAims(events, before.items, STACK_EXIT_MS * scale),
    },
    paired,
  }
}

/**
 * The second half of a frame as it plays on the board it's shown on: each
 * flight (an item with `flightMs`, reserved at `FLIGHT_MAX_MS`) takes the time
 * `measured` gives it (how far that card really goes, never more than the
 * reservation), and everything after it moves forward by the time it saved,
 * as does the end of the half. Called by `usePlayback` once the new board is
 * mounted, before it's painted (see {@link FLIGHT_MAX_MS}).
 */
export function retimeFlights(
  after: readonly ScheduledEvent[],
  afterMs: number,
  measured: (item: ScheduledEvent) => number,
): { after: ScheduledEvent[]; afterMs: number } {
  const savings: { end: number; saved: number }[] = []
  const timed = after.map((item) => {
    if (item.flightMs === undefined) return item
    const took = Math.max(0, Math.min(item.flightMs, measured(item)))
    savings.push({ end: item.offset + item.flightMs, saved: item.flightMs - took })
    return { ...item, flightMs: took }
  })
  // What the flights that had finished by `offset` saved between them: a
  // flight's own start moves only by the ones before it.
  const shift = (offset: number): number =>
    savings.reduce((sum, s) => (s.end <= offset + 1e-6 ? sum + s.saved : sum), 0)
  return {
    after: timed.map((item) => ({ ...item, offset: item.offset - shift(item.offset) })),
    afterMs: afterMs - savings.reduce((sum, s) => sum + s.saved, 0),
  }
}

/** How long the beat that `slots[index]` starts lasts: its own slot — or,
 * for cards leaving libraries, the whole run's, every library's cards
 * merged (see {@link libraryPeels}), since the run's later events share the
 * beat and peel on after the first's. The run is the mill slots up to the
 * next paced slot of another kind, as `layOut` shares the beat. */
function beatDuration(slots: readonly Slot[], index: number): number {
  const first = slots[index]
  if (first.kind === 'handDraw') {
    // The second half is grouped by kind, so the run is the slots from here.
    let count = 0
    for (const slot of slots.slice(index)) {
      if (slot.kind !== 'handDraw') break
      count += 1
    }
    return handDrawBeatMs(count)
  }
  if (first.kind === 'shuffle') {
    // Every shuffle in the run starts together; the viewer's own mulligan's
    // is the longer one (its hand goes back first).
    let longest = 0
    for (const slot of slots.slice(index)) {
      if (slot.kind === 'shuffle') longest = Math.max(longest, slot.duration)
      else if (PACED.has(slot.kind)) break
    }
    return longest
  }
  if (first.kind !== 'mill') return first.duration
  const run: GameEvent[] = []
  for (const slot of slots.slice(index)) {
    if (slot.kind === 'mill') run.push(slot.event)
    else if (PACED.has(slot.kind)) break
  }
  return peelDurationMs(libraryPeels(run))
}

/** One half's slots, laid end to end. The first paced slot that won't fit
 * under `ceiling` ends the half: it and everything after it are simply not
 * animated (the phase tracking has still been advanced, so the next frame's
 * banners stay right). Stopping there rather than skipping to whatever fits
 * keeps what's shown in order. Also says which landings (`Slot.landing`)
 * kept their slot here. */
function layOut(
  slots: readonly Slot[],
  scale: number,
  ceiling: number,
): { items: ScheduledEvent[]; totalMs: number; landings: Set<number> } {
  const items: ScheduledEvent[] = []
  const landings = new Set<number>()
  let cumulative = 0
  // A run of one shared-beat kind (see `SHARED_BEAT`) goes together at the
  // offset the first of them got — the board is showing them all happen at
  // once, because they did.
  let shared: { kind: SlotKind; offset: number } | null = null
  let drawsSoFar = 0
  for (const [index, slot] of slots.entries()) {
    // Before the ceiling: a run's later members cost nothing, the beat they
    // share is already paid for — and a run of mills is timed as a whole.
    if (shared !== null && shared.kind === slot.kind) {
      items.push({ event: slot.event, offset: shared.offset })
      continue
    }
    if (cumulative >= ceiling) break
    if (slot.kind === 'draw') {
      // Dealt out one after another without the game waiting on any of them.
      if (drawsSoFar >= MAX_DRAWN_PER_FRAME) continue
      items.push({
        event: slot.event,
        offset: cumulative + drawsSoFar * DRAW_STAGGER_MS * scale,
      })
      drawsSoFar += 1
      continue
    }
    const cost = PACED.has(slot.kind) ? beatDuration(slots, index) * scale : 0
    if (cumulative + cost > ceiling) break
    if (slot.landing === undefined) items.push({ event: slot.event, offset: cumulative })
    else {
      landings.add(slot.landing)
      items.push({
        event: slot.event,
        offset: cumulative,
        putDown: true,
        ...(slot.kind === 'putDown' ? { flightMs: cost } : {}),
      })
    }
    // Only a paced slot breaks a run: a snapshot or a banner between two
    // deaths doesn't make them two beats.
    if (PACED.has(slot.kind)) {
      shared = SHARED_BEAT.has(slot.kind) ? { kind: slot.kind, offset: cumulative } : null
    }
    cumulative += cost
  }
  return { items, totalMs: cumulative, landings }
}
