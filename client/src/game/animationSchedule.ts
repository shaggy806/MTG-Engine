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
 * apart, so a mill of three looks like three — see {@link millDurationMs}. */
export const MILL_STEP_MS = 560
/** How long after one card starts peeling off the next one does. */
export const MILL_STAGGER_MS = 150
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
  const byPlayer = new Map<PlayerId, { exile: boolean; count: number }[]>()
  const add = (player: PlayerId, exile: boolean, count: number): void => {
    const parts = byPlayer.get(player) ?? []
    const last = parts.at(-1)
    if (last !== undefined && last.exile === exile) last.count += count
    else parts.push({ exile, count })
    byPlayer.set(player, parts)
  }
  for (const ev of events) {
    if (ev.type === 'cards-milled') {
      if (ev.objects.length > 0) add(ev.player, false, ev.objects.length)
    } else if (ev.type === 'cards-put-into-exile') {
      // Exile is one shared zone: each arrival names whose library it left.
      for (const a of ev.arrivals) if (a.from === 'library') add(a.owner, true, 1)
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
/** A permanent moving to a new place on the board: a change of control, an
 * Aura or Equipment moving to a new host. */
export const MOVE_STEP_MS = 560
/** The monarch's crown passing to its new holder. */
export const CROWN_STEP_MS = 640
/** How long a revealed card is held up for everyone to read. Longer than a
 * banner because there's a card face to actually take in, and unpaced — the
 * information is already in the History log, so nobody has to catch it. */
export const REVEAL_STEP_MS = 2600
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
}

/** The viewer's settings the schedule depends on (see `motionPrefs.ts`),
 * passed in so this module stays free of the DOM and testable on its own. */
export interface ScheduleOptions {
  readonly scale: number
  readonly reduced: boolean
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
  | 'turn'
  | 'phase'
  | 'reveal'
  | 'tap'
  | 'untap'
  | 'exit'
  | 'pulse'
  | 'enter'
  | 'counter'
  | 'buff'
  | 'flip'
  | 'hurt'
  | 'mill'
  | 'discard'
  | 'capture'
  | 'move'
  | 'crown'

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
  'untap',
  'tap',
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
  'hit',
  'death',
  'tap',
  'untap',
  'exit',
  'pulse',
  'enter',
  'counter',
  'buff',
  'flip',
  'hurt',
  'mill',
  'discard',
  'move',
  'crown',
])
/** Kinds where a run in one frame plays together on one beat rather than one
 * after another: a wrath's deaths, a spell's worth of lands tapping. */
const SHARED_BEAT: ReadonlySet<SlotKind> = new Set<SlotKind>([
  'death',
  'mill',
  'discard',
  ...AFTER_ORDER,
])

interface Slot {
  readonly event: GameEvent
  readonly kind: SlotKind
  readonly duration: number
}

/** Each event's own reserved slots, or none for anything with no dedicated
 * animation — usually one, but combat damage to a creature is two: the
 * strike over the old board, the number over the new one. */
function slotsFor(ev: GameEvent, phase: { current: Phase }, reduced: boolean): Slot[] {
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
  // A trigger's source lights up over the new board, where its ability has
  // just joined the stack. A colour cue, so reduced motion keeps it.
  if (ev.type === 'ability-triggered') {
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
  const phase = { current: startPhase }
  const slots: Slot[] = []
  for (const event of events) slots.push(...slotsFor(event, phase, reduced))

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
  return {
    items: before.items,
    totalMs: before.totalMs,
    after: after.items,
    afterMs: after.totalMs,
    endPhase: phase.current,
    aims: resolveAims(events, before.items, STACK_EXIT_MS * scale),
  }
}

/** How long the beat that `slots[index]` starts lasts: its own slot — or,
 * for cards leaving libraries, the whole run's, every library's cards
 * merged (see {@link libraryPeels}), since the run's later events share the
 * beat and peel on after the first's. The run is the mill slots up to the
 * next paced slot of another kind, as `layOut` shares the beat. */
function beatDuration(slots: readonly Slot[], index: number): number {
  const first = slots[index]
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
 * keeps what's shown in order. */
function layOut(
  slots: readonly Slot[],
  scale: number,
  ceiling: number,
): { items: ScheduledEvent[]; totalMs: number } {
  const items: ScheduledEvent[] = []
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
    items.push({ event: slot.event, offset: cumulative })
    // Only a paced slot breaks a run: a snapshot or a banner between two
    // deaths doesn't make them two beats.
    if (PACED.has(slot.kind)) {
      shared = SHARED_BEAT.has(slot.kind) ? { kind: slot.kind, offset: cumulative } : null
    }
    cumulative += cost
  }
  return { items, totalMs: cumulative }
}
