import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type {
  Action,
  CastVia,
  GraveyardGrant,
  LegalAction,
  ManaType,
  ObjectId,
  PlayerId,
  PlayerView,
  TapCostOffer,
  TargetCountRange,
  TargetFacts,
  TargetRef,
  TargetSpec,
  VisibleObject,
} from 'engine/client'
import {
  anyNumberSlot,
  attackingViolations,
  blockingViolations,
  damageAssignmentViolations,
  describeTargetSpec,
  distinctTargetCount,
  fitsTogether,
  groupBounds,
  groupPowerExceeded,
  isOptionalSpec,
  publicNameAt,
  slotOptions,
  specsAtX,
  standardAssignment,
  targetCountAtX,
} from 'engine/client'
import type { SeatStatus } from 'protocol'
import { useNetworkGame } from './net/useNetworkGame.ts'
import type { BlitzReport, NetworkGame } from './net/useNetworkGame.ts'
import { rematchOffer } from './net/rematch.ts'
import type { RematchOffer } from './net/rematch.ts'
import { stackShowsSomething } from './game/decisionSource.ts'
import { waitingLabel } from './game/waitingLabel.ts'
import { gameStats } from './game/gameStats.ts'
import { useEscape } from './ui/useEscape.ts'
import { computeBoardEntries } from './game/board.ts'
import { applyBoardOrder } from './game/boardOrder.ts'
import { useBoardDrag, type BoardDragControls } from './game/useBoardDrag.ts'
import { aimedEntry, useResolveState } from './game/resolveAims.ts'
import type { ResolveAims } from './game/resolveAims.ts'
import { Symbols } from './ui/Symbols.tsx'
import type { BoardEntry } from './game/board.ts'
import { blockPairs, freeBlocker, leastBlocked, setPairCount } from './game/blockGroups.ts'
import { attackPairs, freeAttacker, setAttackPairCount } from './game/attackGroups.ts'
import {
  collapseAttacks,
  collapseBlocks,
  expandAttackOffer,
  expandBlockOffer,
  expandIds,
} from './game/stackMembers.ts'
import type { Members } from './game/stackMembers.ts'
import { CountStepper } from './ui/CountStepper.tsx'
import {
  addToGroup,
  clickMembers,
  deathCount,
  groupBlockers,
  lethalCount,
  setGroupTotal,
  spareOne,
  survivorsOf,
  totalOf,
  unassigned,
} from './game/damageAssignment.ts'
import { usePlayback } from './game/usePlayback.ts'
import { AnimationBus } from './game/animationBus.ts'
import { playerLabel, seatClassOf, withNames } from './format.ts'
import { PhaseTrack } from './ui/PhaseTrack.tsx'
import { TurnBanner } from './ui/TurnBanner.tsx'
import { AnimationLayer } from './ui/AnimationLayer.tsx'
import { ArrowLayer } from './ui/ArrowLayer.tsx'
import { highlightEvent } from './ui/highlight.ts'
import { SeatMenu } from './ui/SeatMenu.tsx'
import { TriggerOrder } from './ui/TriggerOrder.tsx'
import { usePassSettings } from './game/passSettings.ts'
import { MotionControl } from './ui/MotionControl.tsx'
import { PlayerPanel } from './ui/PlayerPanel.tsx'
import { CardTile } from './ui/CardTile.tsx'
import { MiniTile } from './ui/MiniTile.tsx'
import { KeywordTips } from './ui/KeywordTips.tsx'
import { CommanderTile } from './ui/CommanderTile.tsx'
import { AbilityMenu } from './ui/AbilityMenu.tsx'
import { Stack } from './ui/Stack.tsx'
import { EventLog } from './ui/EventLog.tsx'
import { CapturePanel } from './ui/CapturePanel.tsx'
import { ZoneViewer } from './ui/ZoneViewer.tsx'
import { emblemToVisible } from './ui/defToVisible.ts'
import { CreatureTypePicker } from './ui/CreatureTypePicker.tsx'
import { SeatBoard } from './lobby/SeatBoard.tsx'
import { LandingScreen } from './lobby/LandingScreen.tsx'
import { InviteLink } from './lobby/InviteLink.tsx'
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
// shape as HAND_CARD_GAP's overlap floor below.
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

// Past this many cards the fan stops being a way to pick one. Measured at
// 1366x768: 32 cards leaves each one a 24px sliver of its 122px width, and
// hovering to check a card scales it 1.65x over the neighbour you were
// aiming at. The grid ("All cards") is always available; this is only the
// point at which it stops being worth hiding.
const HAND_GRID_THRESHOLD = 12

// Battlefield tiles are sized to the board they sit on: as wide as that
// board's share of its quadrant allows, wrapping to as many rows as that
// width needs (multiple rows of creatures is normal, same as a physical
// table), so a sparse board's permanents grow into the room they have and a
// crowded one's shrink. See recomputeBoardMiniW below. The ceiling is a card
// in hand's own width, and lives in App.css's `.board` rule rather than here.
// Below this floor a tile stops shrinking and the board's own scroll
// (already there regardless -- .quadrant-body's overflow-y:auto) takes over.
const MINI_SHRINK_FLOOR = 40

// A stable reference (not `[]` inline at each use) so passing it as `Table`'s
// `actions` prop while `useDelayedView` reports `busy` doesn't itself count
// as a changed prop across re-renders.
const EMPTY_ACTIONS: readonly LegalAction[] = []

type CastAction = Extract<LegalAction, { kind: 'cast-spell' }>
type ConvokeOffer = NonNullable<CastAction['convoke']>

/** A button label for one way of playing a card from a graveyard or exile.
 * The tile above already names the card, so the label says only what tells
 * this way apart from the others: the permanent type a Muldrotha-style
 * allowance spends, the face, and — when more than one permanent grants the
 * card — which one this uses. */
function graveyardVariantLabel(
  a: CastAction | LandAction,
  view: PlayerView,
  showSource: boolean,
): string {
  const verb = a.kind === 'play-land' ? 'Play' : 'Cast'
  const parts: string[] = []
  const grant = a.graveyardGrant
  if (grant?.asType !== undefined) parts.push(`as ${grant.asType}`)
  if (showSource && grant !== undefined && grant.source !== a.card) {
    const source = view.objects[grant.source]?.cardName
    if (source !== undefined) parts.push(`via ${source}`)
  }
  if (a.kind === 'cast-spell') {
    if (a.via !== undefined && a.via !== 'graveyard-permission') parts.push(a.via)
    if (a.kicked) parts.push(`${a.kickerKeyword ?? 'kicked'} ${a.kickerCost ?? ''}`.trim())
    if (a.xCost?.minX !== undefined && a.xCost.minX === a.xCost.maxX) parts.push(`X=${a.xCost.maxX}`)
    if (a.prototype) parts.push(`prototype ${a.prototypeCost ?? ''}`.trim())
    if (a.offspring) parts.push(`offspring ${a.offspringCost ?? ''}`.trim())
    if (a.evoke) parts.push(`evoke ${a.evokeCost ?? ''}`.trim())
    if (a.harmonizeTap) parts.push(`tapping ${a.harmonizeTap.cardName} (−${a.harmonizeTap.power})`)
  }
  return parts.length > 0 ? `${verb} ${parts.join(', ')}` : verb
}

/** The "which variant of this cast" fields a `cast-spell` action carries all
 * the way from `legalActions` back into the dispatched action. */
const castExtras = (cast: CastAction) => ({
  ...(cast.via !== undefined ? { via: cast.via } : {}),
  ...(cast.face !== undefined ? { face: cast.face } : {}),
  ...(cast.kicked === true ? { kicked: true } : {}),
  ...(cast.kickCount !== undefined ? { kickCount: cast.kickCount } : {}),
  ...(cast.prototype === true ? { prototype: true } : {}),
  ...(cast.offspring === true ? { offspring: true } : {}),
  ...(cast.evoke === true ? { evoke: true, evokeCost: cast.evokeCost } : {}),
  ...(cast.overload === true ? { overload: true } : {}),
  ...(cast.free === true ? { free: true } : {}),
  // Each is a variant of its own too: without the flag the engine reads the
  // cast as the ordinary one (Sephara at its full cost), and a choice of
  // additional costs that names no branch is refused outright.
  ...(cast.altCost === true ? { altCost: true } : {}),
  ...(cast.costOption !== undefined ? { costOption: cast.costOption } : {}),
  // Which graveyard permission pays for it, when several could.
  ...(cast.graveyardGrant !== undefined ? { graveyardGrant: cast.graveyardGrant } : {}),
  ...(cast.tapCost !== undefined ? { tapCost: cast.tapCost } : {}),
  // A harmonize variant's creature to tap (rule 702.180a): its own offer.
  ...(cast.harmonizeTap !== undefined ? { tap: [cast.harmonizeTap.object] } : {}),
  // "4 damage divided as you choose" (Magma Opus): asked once the targets are in.
  ...(cast.divide !== undefined ? { divide: cast.divide } : {}),
  // Not echoed either: how many distinct targets are affordable, which the
  // targeting steps keep inside (`currentSlotOptions`).
  ...(cast.targetCount !== undefined ? { targetCount: cast.targetCount } : {}),
  // Not `escapeExile`: that's an offer to pick from, not a field to echo.
  // `startCast` asks for the picks and carries them as `CastPicks`.
  ...(cast.convoke !== undefined && cast.convoke.candidates.length > 0
    ? { convokeOffer: cast.convoke }
    : {}),
})

/** The costs of a cast already chosen before its modes / X / targets, carried
 * through each of those steps into the dispatched action: the permanent an
 * additional sacrifice cost takes (rule 601.2f — Harrow), and the cards an
 * escape cast exiles from the graveyard (rule 702.139a). */
interface CastPicks {
  readonly sacrifice?: ObjectId
  readonly escapeExile?: readonly ObjectId[]
  /** The graveyard cards delve exiles (rule 702.66a), each paying {1}. */
  readonly delve?: readonly ObjectId[]
}

/** Every permanent a tap-cost offer stands for, a stack's id once per token
 * — the whole offer, for when there's exactly as much as the cost needs. */
const allTapChoices = (offer: TapCostOffer): ObjectId[] =>
  offer.choices.flatMap((id) => Array<ObjectId>(offer.copies?.[id] ?? 1).fill(id))

/** "Sacrifice a land", "Sacrifice another creature" — the thing an ability's
 * sacrifice cost names, as printed. */
const SACRIFICE_CLAUSE = /\bSacrifice (?:an? |another )([^,:.]+?)(?=[,:.]|$)/i
/** What a sacrifice cost asks for, for its prompt: the ability's own words
 * when it prints them (Hearthhull's "a land"), otherwise the type every
 * choice shares (a spell's additional cost), otherwise "permanent". */
function sacrificeNoun(
  action: AbilityAction | CastAction,
  view: PlayerView,
  choices: readonly ObjectId[],
): string {
  const printed = action.kind === 'activate-ability' ? SACRIFICE_CLAUSE.exec(action.text)?.[1] : undefined
  if (printed !== undefined) return printed
  for (const type of ['land', 'creature', 'artifact', 'enchantment', 'planeswalker'] as const) {
    if (choices.length > 0 && choices.every((id) => view.objects[id]?.types.includes(type))) return type
  }
  return 'permanent'
}
type LandAction = Extract<LegalAction, { kind: 'play-land' }>
type SuspendAction = Extract<LegalAction, { kind: 'suspend' }>
type ForetellAction = Extract<LegalAction, { kind: 'foretell' }>
type CycleAction = Extract<LegalAction, { kind: 'cycle' }>
type AbilityAction = Extract<LegalAction, { kind: 'activate-ability' }>
type AttackAction = Extract<LegalAction, { kind: 'declare-attackers' }>
type EnterAttackingAction = Extract<LegalAction, { kind: 'enter-attacking' }>
type BlockAction = Extract<LegalAction, { kind: 'declare-blockers' }>
type DiscardAction = Extract<LegalAction, { kind: 'discard' }>
type ZoneChoiceAction = Extract<LegalAction, { kind: 'choose-from-zone' }>
type MulliganAction = Extract<LegalAction, { kind: 'mulligan' }>
type BottomAction = Extract<LegalAction, { kind: 'put-on-bottom' }>
type CommanderChoiceAction = Extract<LegalAction, { kind: 'commander-replacement' }>
type ShockChoiceAction = Extract<LegalAction, { kind: 'pay-life-for-untapped' }>
type RevealChoiceAction = Extract<LegalAction, { kind: 'reveal-for-untapped' }>
type CopyChoiceAction = Extract<LegalAction, { kind: 'choose-copy' }>
type EnchantChoiceAction = Extract<LegalAction, { kind: 'choose-enchant' }>
type LegendRuleAction = Extract<LegalAction, { kind: 'legend-rule' }>
type TriggerOrderAction = Extract<LegalAction, { kind: 'order-triggers' }>
type TextChoiceAction = Extract<LegalAction, { kind: 'choose-text' }>
type CreatureTypeChoiceAction = Extract<LegalAction, { kind: 'choose-creature-type' }>
type ModesChoiceAction = Extract<LegalAction, { kind: 'choose-modes' }>
type SacrificeAction = Extract<LegalAction, { kind: 'sacrifice' }>
type ProliferateAction = Extract<LegalAction, { kind: 'proliferate' }>
type ChoosePermanentsAction = Extract<LegalAction, { kind: 'choose-permanents' }>
type ScryAction = Extract<LegalAction, { kind: 'scry' }>
type CastNowAction = Extract<LegalAction, { kind: 'cast-now' }>
type AssignDamageAction = Extract<LegalAction, { kind: 'assign-combat-damage' }>
type ChooseTargetsAction = Extract<LegalAction, { kind: 'choose-targets' }>

/** What a `choose-from-zone` popup asks: where the chosen cards go, and for
 * cards going back on top, that the order picked is the order they go. */
function zoneChoiceTitle(action: ZoneChoiceAction, nameOf: (player: PlayerId) => string): string {
  const n = action.max === action.min ? `${action.max}` : `up to ${action.max}`
  const together = action.together
  // A rule over the set says what to pick: "up to 2 cards that share a land
  // type", "a Forest card and a Plains card".
  const cards =
    together?.rule === 'one-each'
      ? together.text
      : `${action.max === 1 ? 'a card' : `${n} cards`}${together ? ` ${together.text}` : ''}`
  if (action.split === true) return `Choose ${cards}`
  // Choosing for someone else (Tasigur: an opponent picks for its controller).
  const whose = action.forPlayer === undefined ? 'your' : `${nameOf(action.forPlayer)}'s`
  switch (action.destination) {
    case 'hand':
      return `Choose ${cards} to put into ${whose} hand`
    case 'battlefield':
      return `Choose ${cards} to put onto the battlefield`
    case 'graveyard':
      return `Choose ${cards} to put into your graveyard`
    case 'library-top':
      return 'Put them back on top in the order you pick: the first you pick goes on top'
    case 'library-bottom':
      // The order picked is the order they go: the last one picked ends up
      // on the very bottom.
      return action.order === true
        ? 'Put them on the bottom in the order you pick: the last you pick goes on the very bottom'
        : `Choose ${cards} to put on the bottom of your library, in order: the last you pick goes on the very bottom`
    case 'exile':
      return `Choose ${cards} to exile`
    case 'exile-playable':
      return `Choose ${cards} you may play`
    case 'exile-face-down':
      return `Choose ${cards} to exile face down`
  }
}

/** Whether one board permanent is a legal proliferate choice right now. */
const eligibleToProliferate = (action: ProliferateAction, id: ObjectId): boolean =>
  action.eligible.some((t) => t.kind === 'object' && t.object === id)

interface Targeting {
  readonly kind: 'cast' | 'activate' | 'choose-targets'
  readonly source: ObjectId
  readonly abilityIndex: number
  readonly label: string
  readonly specs: readonly TargetSpec[]
  readonly options: readonly (readonly TargetRef[])[]
  /** One entry per slot filled so far; `null` is an optional slot the player
   * chose to skip ("up to one target creature"). */
  readonly picked: readonly (TargetRef | null)[]
  /** The cast or ability divides `total` among the targets from slot `slot`
   * on (rules 601.2d, 603.3d — Magma Opus, Dragonlord Atarka): asked once
   * they're chosen, before it goes out. */
  readonly divide?: { readonly total: number; readonly slot: number }
  /** New targets for a copy of a spell (Twincast, Shiko and Narset): the
   * target each slot has now, which a Keep button takes — it may not be on
   * the board to click any more. */
  readonly current?: readonly TargetRef[]
  /** What a relation among the targets reads — who controls one, its power
   * ("controlled by different players", "total power 10 or less") — off the
   * view the choice began on (`viewTargetFacts`). */
  readonly facts?: TargetFacts
  /** Chosen modes for a targeted modal spell (Phase 11 EG-2). */
  readonly modes?: readonly number[]
  /** Chosen value for `{X}`, when casting an X spell. */
  readonly xValue?: number
  /** Permanent chosen to pay a "sacrifice a creature you control" ability cost. */
  readonly sacrifice?: ObjectId
  /** The other graveyard cards an escape cast exiles (rule 702.139a), picked
   * from the variant's `escapeExile` offer before any of this — see
   * `pendingEscape`. */
  readonly escapeExile?: readonly ObjectId[]
  /** The graveyard cards delve exiles (rule 702.66a), picked from the
   * variant's `delve` offer — see `pendingDelve`. */
  readonly delve?: readonly ObjectId[]
  /** Alternative casting permission (Phase 6) — flashback / escape / foretell. */
  readonly via?: CastVia
  /** Which face of a multi-face card is being cast (Phase 10). */
  readonly face?: number
  /** Casting this for its kicker cost (rule 702.33 — P8). The engine offers
   * kicked and unkicked as separate `cast-spell` actions; this just echoes
   * which one the player picked. */
  readonly kicked?: boolean
  /** How many times a multikicker is paid (rule 702.33c) — echoed like `kicked`. */
  readonly kickCount?: number
  /** A prototyped cast (rule 718) — echoed back like `kicked`. */
  readonly prototype?: boolean
  /** Paying a granted offspring cost too (Zinnia) — echoed back like `kicked`. */
  readonly offspring?: boolean
  /** Casting this for its evoke cost (rule 702.74) — echoed back like `kicked`,
   * with which evoke cost when it has more than one. */
  readonly evoke?: boolean
  readonly evokeCost?: string
  /** Casting this for its overload cost (rule 702.126) instead of its mana
   * cost — no targets are chosen for this variant. */
  readonly overload?: boolean
  /** Casting this for free under a `CardDefinition.freeCastIf` permission
   * instead of paying the mana cost. Targets are unchanged. */
  readonly free?: boolean
  /** The colour(s) picked for an "add one mana of any color" ability. The
   * engine lists one action per colour, so this just echoes which one. */
  readonly manaColors?: readonly ManaType[]
  /** Casting for the card's alternative cost (Sephara) — its own variant,
   * echoed back like `kicked`. */
  readonly altCost?: boolean
  /** The branch of a choice of additional costs this variant pays (Bitter
   * Triumph's "discard a card or pay 3 life"), echoed back. */
  readonly costOption?: number
  /** The graveyard permission this cast spends (Muldrotha's type, which
   * grantor), echoed back. */
  readonly graveyardGrant?: GraveyardGrant
  /** A "tap N untapped … you control" cost still to pick for, once the
   * targets are in — see `pendingTap`. */
  readonly tapCost?: TapCostOffer
  /** A harmonize cast's creature to tap (rule 702.180a), echoed back as the
   * cast's `tap`. */
  readonly tap?: readonly ObjectId[]
  /** A convoke spell's creatures still to pick, once the targets are in —
   * see `pendingConvoke`. */
  readonly convokeOffer?: ConvokeOffer
  /** How many distinct targets the cast is affordable with, under a "for
   * each target" cost (Hinata, Dawn-Crowned) — see `currentSlotOptions`. */
  readonly targetCount?: TargetCountRange
}

/**
 * The options for the slot being filled: what `slotOptions` allows ("another
 * target" leaves out what an earlier slot took), less any that would leave
 * the cast unaffordable. Under a "for each target" cost only some numbers of
 * distinct targets are payable (`targetCount`), so an option that takes the
 * count past the most, or leaves too few slots to reach the fewest, is out.
 */
function currentSlotOptions(t: Targeting): readonly TargetRef[] {
  const i = t.picked.length
  const options = slotOptions(t.specs, t.options, i, t.picked, t.facts)
  const range = t.targetCount
  if (range === undefined) return options
  // Inside an "any number of" group, the fewest is Done's to check
  // (`mayFinishGroup`): another member never takes the count away from it.
  if (inTargetGroup(t)) {
    return options.filter((ref) => distinctTargetCount([...t.picked, ref], range.copies) <= range.max)
  }
  const later = t.specs.length - i - 1
  return options.filter((ref) => {
    const n = distinctTargetCount([...t.picked, ref], range.copies)
    return n <= range.max && n + later >= range.min
  })
}

/** Who controls an object and its power, as the view shows them — a
 * creature card's in a graveyard too — for a relation among targets. */
const viewTargetFacts = (view: PlayerView): TargetFacts => ({
  controllerOf: (ref) => (ref.kind === 'object' ? view.objects[ref.object]?.controller : undefined),
  powerOf: (ref) => (ref.kind === 'object' ? (view.objects[ref.object]?.power ?? 0) : 0),
})

/** Whether the next pick is another member of an "any number of target …"
 * group — always the last slot, and every pick past its start. */
function inTargetGroup(t: Pick<Targeting, 'specs' | 'picked'>): boolean {
  const group = anyNumberSlot(t.specs)
  return group >= 0 && t.picked.length >= group
}

/** Whether an "any number of" group may end with what's picked: at least
 * its fewest ("exile X target creatures" — Curse of the Swine, its specs
 * fixed at the X chosen), and the fewest distinct targets the cast allows. */
function mayFinishGroup(t: Pick<Targeting, 'specs' | 'picked' | 'targetCount'>): boolean {
  const group = anyNumberSlot(t.specs)
  if (group < 0) return true
  if (t.picked.length - group < groupBounds(t.specs[group]).min) return false
  const range = t.targetCount
  return range === undefined || distinctTargetCount(t.picked, range.copies) >= range.min
}

/** The spec the next pick fills: the group's, once inside it. */
function currentSpec(t: Pick<Targeting, 'specs' | 'picked'>): TargetSpec | undefined {
  const group = anyNumberSlot(t.specs)
  return group >= 0 && t.picked.length >= group ? t.specs[group] : t.specs[t.picked.length]
}

/** Whether an optional slot may be skipped: not when the slots after it
 * could no longer reach the fewest distinct targets the cast is affordable
 * with. */
function maySkipSlot(t: Targeting): boolean {
  const range = t.targetCount
  if (range === undefined) return true
  const later = t.specs.length - t.picked.length - 1
  return distinctTargetCount(t.picked, range.copies) + later >= range.min
}

/**
 * Whoever the engine is actually waiting on right now — a pending
 * declaration (attackers/blockers/discard/...) if there is one,
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
  'choose-from-zone': 'look at cards',
  mulligan: 'decide on a mulligan',
  'commander-replacement': 'decide where their commander goes',
  'pay-life-for-untapped': 'decide on a shock land',
  'reveal-for-untapped': 'decide on a reveal land',
  'choose-copy': 'choose what to copy',
  'choose-enchant': 'choose what an Aura enchants',
  'legend-rule': 'choose which legend to keep',
  'order-triggers': 'order their triggers',
  'choose-text': 'choose a text change',
  'choose-creature-type': 'choose a creature type',
  'choose-modes': 'choose a mode',
  'choose-targets': 'choose targets',
  'cast-now': 'decide whether to cast a spell',
  'assign-combat-damage': 'assign combat damage',
  sacrifice: 'choose what to sacrifice',
  proliferate: 'choose what to proliferate',
  'choose-permanents': 'choose permanents',
  'enter-attacking': 'choose what their creatures attack',
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
  // Keyed on the game, so a rematch starts the screen afresh: its playback
  // seeded from the new game's first frame rather than animating it as what
  // the old one did next, and none of the old game's panels left open.
  return <GameScreen key={game.gameNumber} game={game} />
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

/** How long an error sits on screen before clearing itself. Long enough to
 * read a sentence twice; short enough that a rejected click doesn't leave a
 * red bar over the board for the rest of the turn. */
/** How long a toast (a refusal, the highroll's news) stays up. App.css's
 * `.toast` fades it out over the last half second. */
const TOAST_LINGER_MS = 6000

/**
 * A rejected action, as a toast floating over the board rather than a bar in
 * the layout. Rendered inside a `.toast-stack`.
 *
 * It used to take its own row in normal flow, which meant every refused click
 * shoved the whole table down a line and left the message there until someone
 * clicked it. Now it hovers above everything, fades out on its own after
 * {@link TOAST_LINGER_MS}, and is still dismissible by clicking it.
 *
 * The timer and the node are both keyed on `errorSeq` as well as the
 * message, so the same error twice in a row restarts the clock and replays
 * the fade, rather than inheriting whatever the first one had left.
 */
function ErrorLine({ game }: { readonly game: NetworkGame }) {
  const { error, errorSeq, clearError } = game
  useEffect(() => {
    if (!error) return
    const t = window.setTimeout(clearError, TOAST_LINGER_MS)
    return () => window.clearTimeout(t)
  }, [error, errorSeq, clearError])
  if (!error) return null
  return (
    <div
      key={errorSeq}
      className="toast bad"
      onClick={clearError}
      role="alert"
      title="Click to dismiss"
    >
      ⚠ {withNames(error, game.seats, game.nameOf)}
    </div>
  )
}

/** How many stand-ins a blitz's notice names before "and N more". */
const BLITZ_REPORT_SHOWN = 6

/**
 * What a blitz changed in the pasted list — the stand-ins for cards the
 * engine doesn't have yet, and any card with none — over the board until
 * clicked, since a player should know they're not playing exactly their list.
 */
function BlitzReportToast({ report, onDismiss }: { readonly report: BlitzReport; readonly onDismiss: () => void }) {
  const { substituted, dropped } = report
  const shown = substituted.slice(0, BLITZ_REPORT_SHOWN)
  const more = substituted.length - shown.length
  const counts = [
    substituted.length > 0 ? `${substituted.length} stand-in${substituted.length === 1 ? '' : 's'}` : null,
    dropped.length > 0 ? `${dropped.length} card${dropped.length === 1 ? '' : 's'} left out` : null,
  ].filter((c) => c !== null)
  return (
    <div className="toast info toast-sticky blitz-report" role="status" onClick={onDismiss} title="Click to dismiss">
      <div>
        {report.deckName}: {counts.join(', ')}. Change them in the deck builder.
      </div>
      {shown.length > 0 ? (
        <div className="blitz-report-list">
          {shown.map((s) => `${s.from} → ${s.to}`).join(' · ')}
          {more > 0 ? ` · and ${more} more` : ''}
        </div>
      ) : null}
      {dropped.length > 0 ? <div className="blitz-report-list">No match: {dropped.join(', ')}</div> : null}
    </div>
  )
}

/** Who won the highroll (or who the host picked to go first), as the same toast a refusal is (in the accent
 * colours rather than the error's): over the board while the opening hands
 * are decided, gone on its own after {@link TOAST_LINGER_MS} or on a click. */
function HighrollToast({ onDismiss, children }: { readonly onDismiss: () => void; readonly children: ReactNode }) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, TOAST_LINGER_MS)
    return () => window.clearTimeout(t)
  }, [onDismiss])
  return (
    <div className="toast info" onClick={onDismiss} role="status" title="Click to dismiss">
      {children}
    </div>
  )
}

/**
 * The end of the game, as its own panel over the final board: who won and
 * how, and what next. It used to be one line in the bottom-right corner
 * ("Bob wins · last player remaining"), easy to miss after a concede, with
 * nowhere to go from it. The way on is the main menu, or a rematch in the
 * same room (`rematchOffer`): the host deals it, and everyone else is carried
 * into it, told meanwhile who they're waiting on.
 */
function GameResultPanel({
  view,
  seat,
  seats,
  onDismiss,
  offer,
  onRematch,
  rematchAsked,
}: {
  readonly view: PlayerView
  readonly seat: PlayerId
  readonly seats: readonly SeatStatus[]
  readonly onDismiss: () => void
  readonly offer: RematchOffer | null
  readonly onRematch: () => void
  /** Asked, and neither dealt nor refused yet: one click deals one game. */
  readonly rematchAsked: boolean
}) {
  useEscape(onDismiss)
  const { winner, reason } = view.result
  const headline = winner === null ? 'Draw' : winner === seat ? 'You win!' : `${playerLabel(winner, seats)} wins`
  const seatClass = winner !== null && view.turnOrder.includes(winner) ? seatClassOf(view.turnOrder, winner) : ''
  const stats = useMemo(() => gameStats(view), [view])
  return (
    <div className="result-overlay" onClick={onDismiss}>
      <div className="result-box" role="dialog" aria-label="Game over" onClick={(e) => e.stopPropagation()}>
        <p className="result-kicker">Game over</p>
        <h2 className={`result-headline ${seatClass}`}>{headline}</h2>
        <p className="muted">
          {reason ? `${reason[0].toUpperCase()}${reason.slice(1)} · ` : ''}
          {stats.turns} turn{stats.turns === 1 ? '' : 's'}
        </p>
        {/* Each player's game, winner first (game/gameStats.ts). */}
        <table className="result-stats">
          <thead>
            <tr>
              <th scope="col">Player</th>
              <th scope="col">Result</th>
              <th scope="col">Life</th>
              <th scope="col" title="Damage dealt to other players">Damage dealt</th>
              <th scope="col" title="Damage dealt to this player">Damage taken</th>
              <th scope="col">Life gained</th>
              <th scope="col">Spells cast</th>
              <th scope="col" title="Not counting the opening hand">Cards drawn</th>
            </tr>
          </thead>
          <tbody>
            {stats.players.map((p) => (
              <tr key={p.player} className={p.player === winner ? 'is-winner' : undefined}>
                <th scope="row" className={`result-player ${seatClassOf(view.turnOrder, p.player)}`}>
                  {playerLabel(p.player, seats)}
                  {p.player === seat ? <span className="muted"> (you)</span> : null}
                </th>
                <td title={p.out?.reason}>
                  {p.player === winner ? 'Winner' : p.out ? `Out, turn ${p.out.turn}` : '—'}
                </td>
                <td>{p.life}</td>
                <td>{p.damageDealt}</td>
                <td>{p.damageTaken}</td>
                <td>{p.lifeGained}</td>
                <td>{p.spellsCast}</td>
                <td>{p.cardsDrawn}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {offer?.kind === 'waiting' ? (
          <p className="muted result-waiting" role="status">
            Waiting for {offer.host === null ? 'the host' : playerLabel(offer.host, seats)} to rematch…
          </p>
        ) : null}
        <div className="result-actions">
          <button type="button" onClick={onDismiss}>
            View the board
          </button>
          <button
            type="button"
            className={offer?.kind === 'button' ? undefined : 'result-primary'}
            onClick={() => window.location.assign('/')}
          >
            Main menu
          </button>
          {offer?.kind === 'button' ? (
            <button type="button" className="result-primary" disabled={rematchAsked} onClick={onRematch}>
              {offer.label}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/** Leaves the waiting room for the landing page, giving up my seat so the
 * table isn't left waiting on someone who has gone. */
function BackToMenu({ game }: { readonly game: NetworkGame }) {
  return (
    <button type="button" className="link-button seat-board-back" onClick={game.leaveRoom}>
      ← Main menu
    </button>
  )
}

function SeatPickerScreen({ game }: { readonly game: NetworkGame }) {
  const roomFull = game.seats.every((s) => s.claimed || s.isBot)
  return (
    <div className="overlay">
      <SeatBoard game={game}>
        <BackToMenu game={game} />
        <h2>Room {game.roomId ?? ''}</h2>
        <p className="muted">Share this room code, then everyone joins.</p>
        {game.roomId !== null ? <InviteLink roomId={game.roomId} /> : null}
        <div className="toast-stack">
          <ErrorLine game={game} />
        </div>
        {roomFull ? <p className="muted">Room is full.</p> : null}
      </SeatBoard>
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
      <SeatBoard game={game}>
        <BackToMenu game={game} />
        <h2>Room {game.roomId ?? ''}</h2>
        {game.roomId !== null ? <InviteLink roomId={game.roomId} /> : null}
        <div className="toast-stack">
          <ErrorLine game={game} />
        </div>
      </SeatBoard>
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
  const { seat } = game
  const [showHistory, setShowHistory] = useState(false)
  const [showCapture, setShowCapture] = useState(false)
  const [dismissedHighroll, setDismissedHighroll] = useState(false)
  const dismissHighroll = useCallback(() => setDismissedHighroll(true), [])
  const closeHistory = useCallback(() => setShowHistory(false), [])
  // The end-of-game panel, put aside to look at the final board.
  const [resultDismissed, setResultDismissed] = useState(false)
  const dismissResult = useCallback(() => setResultDismissed(true), [])
  const showResult = useCallback(() => setResultDismissed(false), [])
  // The error count when the rematch was asked for: the button stays down
  // until the new game replaces this screen, or a refusal comes back.
  const [rematchAskedAt, setRematchAskedAt] = useState<number | null>(null)
  const { rematch, errorSeq } = game
  const askRematch = useCallback(() => {
    setRematchAskedAt(errorSeq)
    rematch()
  }, [rematch, errorSeq])
  useEscape(showHistory ? closeHistory : undefined)
  // One bus per screen, carrying each frame's cues from playback across to
  // the overlay layer (they're siblings — see AnimationLayer's own comment).
  const [bus] = useState(() => new AnimationBus())
  // Lives here rather than in `Table`, which remounts every frame: playing a
  // card would otherwise drop the hand tray shut under a cursor still resting
  // on it. Held in one object so `Table`'s prop identity is stable.
  const [handRaised, setHandRaised] = useState(false)
  // The full-hand grid. Lives up here for exactly the reason `handRaised`
  // does: `Table` remounts every frame, so grid state held down there would
  // close itself the moment anything happened — including the card you just
  // played from inside it.
  const [handGrid, setHandGrid] = useState(false)
  const hand = useMemo(
    () => ({ handRaised, setHandRaised, handGrid, setHandGrid }),
    [handRaised, handGrid],
  )
  // The order you've dragged your own permanents into, and the drag under
  // way. Up here so a frame arriving mid-drag doesn't drop the tile.
  const boardDrag = useBoardDrag(game.roomId)
  // Called unconditionally (before the loading-guard below) per the rules of
  // hooks. `ackFrame` is what lets the server pace its bots against these
  // animations rather than racing ahead of them.
  const shown = usePlayback(game.frame, bus, game.ackFrame)
  const view = shown.view
  // The seats around me as the frame being *shown* has them, not the newest
  // one: a scenario builder can change how many players there are between
  // frames, and the table must only ask the board it's drawing about the
  // players on it.
  const opponents = useMemo(() => {
    if (view === null || seat === null) return game.opponents
    const order = view.turnOrder
    const i = order.indexOf(seat)
    return i < 0 ? game.opponents.filter((p) => order.includes(p)) : [...order.slice(i + 1), ...order.slice(0, i)]
  }, [view, seat, game.opponents])
  const botPlaying = game.seats.find((s) => s.player === seat)?.isBot === true
  // My passing preferences live on this device and the server does the
  // passing: sent when the game screen opens and whenever they change.
  const passSettings = usePassSettings()
  const { sendPassSettings, status } = game
  useEffect(() => {
    if (status === 'playing') sendPassSettings(passSettings)
  }, [passSettings, sendPassSettings, status])
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
        <PhaseTrack view={view} seat={seat} />
        <span className="ts-acting">
          {over
            ? 'Game over'
            : shown.busy
              ? 'Resolving…'
              : `${playerLabel(actingPlayer(view) ?? seat, game.seats)} to act`}
        </span>
        <div className="ts-menu">
          {/* The host can stop the bots to look at something, and let them
              go a move at a time; everyone else sees that they're stopped.
              Icons rather than words: the strip has no room to spare, and
              words here squeezed the phase track down to four steps at
              1366px. */}
          {game.isHost && game.seats.some((s) => s.isBot) && !over ? (
            <>
              <button
                type="button"
                className={`ts-icon${game.botsPaused ? ' ts-paused' : ''}`}
                aria-pressed={game.botsPaused}
                aria-label={game.botsPaused ? 'Resume the bots' : 'Pause the bots'}
                title={game.botsPaused ? 'Resume the bots' : 'Pause the bots'}
                onClick={() => game.setBotsPaused(!game.botsPaused)}
              >
                {game.botsPaused ? '▶' : '⏸'}
              </button>
              {game.botsPaused ? (
                <button
                  type="button"
                  className="ts-icon"
                  aria-label="Let the bots make one move"
                  title="Let the bots make one move"
                  onClick={game.stepBots}
                >
                  ⏭
                </button>
              ) : null}
            </>
          ) : game.botsPaused ? (
            <span className="ts-paused-badge">Bots paused</span>
          ) : null}
          <button
            type="button"
            className="ts-icon"
            disabled={shown.busy || !shown.replayable}
            onClick={shown.replay}
            aria-label="Replay the last update"
            title="Replay the last update's animations"
          >
            ↺
          </button>
          {/* The bots' speed is in Settings: only the host sets it, and only a
              table with bots needs it. */}
          <MotionControl
            botSpeed={
              game.isHost && game.seats.some((s) => s.isBot)
                ? { speed: game.botSpeed, onChange: game.setBotSpeed }
                : undefined
            }
          />
          <button type="button" onClick={() => setShowHistory(true)}>
            History
          </button>
          {/* A developer's server only (`--capture`), and only its host. */}
          {game.captureEnabled && game.isHost ? (
            <button type="button" onClick={() => setShowCapture(true)}>
              Capture
            </button>
          ) : null}
          <SeatMenu game={game} view={view} onShowResult={over && resultDismissed ? showResult : undefined} />
        </div>
      </header>

      <div className="toast-stack">
        {game.stopped !== null ? (
          // Not dismissible and never gone: nothing can be played here now.
          <div className="toast bad" role="alert">
            ⚠ This game has stopped: the engine hit an error, and nothing more can be played in this room.{' '}
            <span className="muted">({game.stopped})</span>
          </div>
        ) : null}
        <ErrorLine game={game} />
        {game.blitzReport !== null ? <BlitzReportToast report={game.blitzReport} onDismiss={game.dismissBlitzReport} /> : null}
        {showHighroll ? (
          <HighrollToast onDismiss={dismissHighroll}>
            {game.firstPlayerChosen
              ? `${playerLabel(view.startingPlayer, game.seats)} goes first, the host's pick`
              : `🎲 ${playerLabel(view.startingPlayer, game.seats)} won the highroll and goes first`}
          </HighrollToast>
        ) : null}
      </div>

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
        // And while a bot plays this seat (the seat menu's "Let a bot play
        // for me"), whose moves the server makes and whose answers it would
        // refuse from here.
        actions={shown.busy || botPlaying ? EMPTY_ACTIONS : shown.actions}
        hand={hand}
        previousView={shown.previousView}
        answered={shown.answered}
        boardDrag={boardDrag}
        aims={bus.aims}
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
            <EventLog
              events={view.events}
              nameAt={(id, seq) => publicNameAt(view.publicStints, id, seq) ?? game.nameOf(id)}
              seats={game.seats}
              onSelect={(event) => {
                // Close the log so the board is in view, then point the
                // entry's cards and players out on it once it's drawn.
                setShowHistory(false)
                window.setTimeout(() => highlightEvent(event), 50)
              }}
            />
          </div>
        </div>
      ) : null}

      {over && !resultDismissed ? (
        <GameResultPanel
          view={view}
          seat={seat}
          seats={game.seats}
          onDismiss={dismissResult}
          offer={rematchOffer({
            canRematch: game.canRematch,
            isHost: game.isHost,
            blitz: game.blitzRoom,
            seats: game.seats,
          })}
          onRematch={askRematch}
          rematchAsked={rematchAskedAt === game.errorSeq}
        />
      ) : null}

      {showCapture ? <CapturePanel game={game} onClose={() => setShowCapture(false)} /> : null}
      {BuilderPanel !== null && game.builder !== null ? (
        <Suspense fallback={null}>
          <BuilderPanel game={game} />
        </Suspense>
      ) : null}
    </div>
  )
}

/** The scenario builder's drawer: a dev build only. In a production build
 * `import.meta.env.DEV` is `false`, so the import is dead code and the
 * builder isn't in the bundle at all. */
const BuilderPanel = import.meta.env.DEV ? lazy(() => import('./builder/BuilderPanel.tsx')) : null

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
    /** Whether the whole hand is open as a wrapped grid — the way to pick a
     * card out of a hand too big to fan (see `HAND_GRID_THRESHOLD`). */
    readonly handGrid: boolean
    readonly setHandGrid: (open: boolean) => void
  }
  /** The board shown before this one: what `Stack` needs to animate only its
   * new arrivals, and `ArrowLayer` only its new arrows. */
  readonly previousView: PlayerView | null
  /** A later frame is playing over this board, so its pending decision has
   * been answered (`Playback.answered`): the stack draws no "prompted by". */
  readonly answered: boolean
  /** Your own permanents' dragged order and the drag in progress, owned by
   * `GameScreen` so a drag survives this component's per-frame remount. */
  readonly boardDrag: BoardDragControls
  /** What is resolving over this board while a frame's first half plays on
   * it, for the targeted marks (`aim`) and `ArrowLayer` (owned by the
   * animation bus, which outlives this component's per-frame remount). */
  readonly aims: ResolveAims
}

/**
 * Everything interactive. Keyed on the parent's played-back revision, so
 * every in-progress selection resets in step with the board the player can
 * see, not with every raw network push (see usePlayback). State that should
 * *not* reset per frame — the hand tray being raised — lives in `GameScreen`
 * and arrives through props.
 */
function Table({
  view,
  seat,
  opponents,
  game,
  actions,
  hand,
  previousView,
  answered,
  boardDrag,
  aims,
}: TableProps) {

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
  const { handRaised, setHandRaised, handGrid, setHandGrid } = hand
  // Measured (not guessed) hand-row layout, recomputed whenever the row's
  // real rendered width changes (viewport resize, peekable<->in-flow mode
  // switch) or the hand's card count changes -- see HAND_CARD_GAP's comment.
  const handRowRef = useRef<HTMLDivElement>(null)
  const [handCardGap, setHandCardGap] = useState(HAND_CARD_GAP)
  // Per-player board elements (keyed by seat, since up to 4 boards each need
  // independent handling), each with its tiles sized to fill the height its
  // quadrant gives it.
  // A Map + shared observers rather than one ref/effect per player, since
  // `renderBoard` runs in a loop/JSX map and hooks can't be called
  // conditionally or a variable number of times per render. See
  // `registerBoardEl`/`recomputeBoardMiniW` below.
  const boardElsRef = useRef<Map<PlayerId, HTMLDivElement>>(new Map())
  const boardResizeObserverRef = useRef<ResizeObserver | null>(null)
  const boardMutationObserverRef = useRef<MutationObserver | null>(null)
  // Set while an `{X}` cost is being chosen, before target selection — for an
  // X spell (`CastAction`) or an X activated ability (`AbilityAction`, EG-3).
  const [pendingX, setPendingX] = useState<
    | ({
        readonly action: CastAction | AbilityAction
        readonly value: number
      } & CastPicks)
    | null
  >(null)
  // Set while a targeted modal spell's modes are being chosen (Phase 11 EG-2),
  // before target selection.
  const [pendingModes, setPendingModes] = useState<
    | ({
        readonly cast: CastAction
        readonly picked: readonly number[]
      } & CastPicks)
    | null
  >(null)
  // Set while choosing which creature to sacrifice for an ability's cost.
  const [pendingSac, setPendingSac] = useState<AbilityAction | CastAction | null>(null)
  /** An escape cast waiting on which other graveyard cards it exiles (rule
   * 702.139a), asked in a `ZoneViewer` before its modes / X / targets.
   * `sacrifice` is an additional cost already picked, if it had one. */
  const [pendingEscape, setPendingEscape] = useState<
    | ({
        readonly cast: CastAction
        readonly offer: NonNullable<CastAction['escapeExile']>
      } & Pick<CastPicks, 'sacrifice'>)
    | null
  >(null)
  /** A delve cast waiting on which graveyard cards it exiles (rule 702.66a),
   * asked in a `ZoneViewer` after any escape choice and before modes / X /
   * targets, carrying the costs already picked. */
  const [pendingDelve, setPendingDelve] = useState<
    | ({
        readonly cast: CastAction
        readonly offer: NonNullable<CastAction['delve']>
        /** An {X} spell's X, chosen first: its range is the offer's
         * `byX` at that X, and targeting carries on from here. */
        readonly xValue?: number
      } & Omit<CastPicks, 'delve'>)
    | null
  >(null)
  const [selectedSource, setSelectedSource] = useState<ObjectId | null>(null)
  // What a spell or ability on the stack is aimed at, marked on the board:
  // the top of the stack's targets, or those of the entry the pointer is on
  // (Stack's `onFocusEntry`). A bot's Swords to Plowshares shows what it's
  // about to exile before anyone lets it resolve, instead of in the History.
  // While a frame plays out over this board, whatever resolves in it is
  // marked instead, and an entry that has resolved is marked no more
  // (`aimedEntry`; the bus's `aims`, played by usePlayback).
  const [stackFocus, setStackFocus] = useState<ObjectId | null>(null)
  const resolve = useResolveState(aims)
  const aimId: ObjectId | null = useMemo(
    () => aimedEntry(view.zones.stack, stackFocus, resolve),
    [view, stackFocus, resolve],
  )
  const aim = useMemo(() => {
    const id = aimId
    const source = id === null ? undefined : view.objects[id]
    const targets = source?.targets ?? []
    if (source === undefined || targets.length === 0) return null
    const by =
      source.kind === 'ability'
        ? `${(source.sourceObjectId ? view.objects[source.sourceObjectId]?.cardName : undefined) ?? source.cardName}'s ability`
        : source.cardName
    return {
      by,
      objects: new Set(targets.flatMap((t) => (t.kind === 'object' ? [t.object] : []))),
      players: new Set(targets.flatMap((t) => (t.kind === 'player' ? [t.player] : []))),
    }
  }, [view, aimId])
  // Attacker -> chosen defender. A creature that must attack (rule 508.1d)
  // and has only one defender it may attack starts out assigned to it, as a
  // click on it would; one with a choice waits for the player to make it.
  const [attackAssignments, setAttackAssignments] = useState<
    Record<string, PlayerId | ObjectId>
  >(() => {
    const raw = actions.find((a): a is AttackAction => a.kind === 'declare-attackers')
    // In members, as the bar works (game/stackMembers.ts).
    const offer = raw
      ? expandAttackOffer(raw, (id) => view.objects[id]?.stackCount ?? 1).offer
      : undefined
    const start: Record<string, PlayerId | ObjectId> = {}
    for (const id of offer?.mustAttack ?? []) {
      const defenders = offer?.defendersFor[id] ?? []
      if (defenders.length === 1) start[id] = defenders[0]
    }
    return start
  })
  /**
   * Attackers picked but not yet pointed at anyone — the pending group.
   *
   * Declaring an attack is two facts, not one: *which* creatures attack, and
   * *who each one attacks*. At two players the second is free (there is one
   * opponent), which is why this used to be a single focused attacker and a
   * one-button "attack with all". At three or four it is the whole decision,
   * and a button that sends every creature at `defendersFor(id)[0]` is
   * picking an opponent for you at random.
   *
   * So: click creatures to build this group, click a player or planeswalker
   * to send the group there. A creature with only one legal defender skips
   * the group entirely and is assigned on click, which keeps a two-player
   * board at one click per attacker exactly as before.
   */
  const [attackPicks, setAttackPicks] = useState<readonly ObjectId[]>([])
  const [blockAssign, setBlockAssign] = useState<Record<string, ObjectId>>({})
  const [blockFocus, setBlockFocus] = useState<ObjectId | null>(null)
  const [discardPicks, setDiscardPicks] = useState<readonly ObjectId[]>([])
  const [revealPick, setRevealPick] = useState<ObjectId | null>(null)
  const [bottomPicks, setBottomPicks] = useState<readonly ObjectId[]>([])
  // Per-blocker combat-damage amounts (EG-4a), in the offer's order: null
  // until the player edits one, meaning the engine's standard split.
  const [damagePicks, setDamagePicks] = useState<readonly number[] | null>(null)
  const [textFrom, setTextFrom] = useState<string | null>(null)
  const [modePicks, setModePicks] = useState<readonly number[]>([])
  const [sacrificePicks, setSacrificePicks] = useState<readonly ObjectId[]>([])
  const [permanentPicks, setPermanentPicks] = useState<readonly ObjectId[]>([])
  /** A cast or activation whose targets are in, waiting on which permanents
   * its "tap N untapped … you control" cost taps (rule 601.2h — costs are
   * paid last). `picks` names a stack once per token. */
  const [pendingTap, setPendingTap] = useState<{
    readonly action: Action
    readonly offer: TapCostOffer
    readonly picks: readonly ObjectId[]
  } | null>(null)
  /** A convoke spell whose targets are in, waiting on which creatures help
   * pay for it (rule 702.51) — none at all is paying with mana. The engine
   * works out what each one pays. */
  // A cast whose targets are in, waiting on how its divided damage is split
  // among them (Magma Opus). `shares` follows `targets`; `resume` carries the
  // cast on from there — convoke, a tap cost, or straight out.
  const [pendingDivision, setPendingDivision] = useState<{
    readonly total: number
    readonly targets: readonly TargetRef[]
    readonly shares: readonly number[]
    readonly resume: (division: readonly number[]) => void
  } | null>(null)
  const [pendingConvoke, setPendingConvoke] = useState<{
    readonly action: Action
    readonly offer: ConvokeOffer
    readonly picks: readonly ObjectId[]
  } | null>(null)
  /** The token stack whose "how many of these?" menu is open, if any. */
  const [stackMenu, setStackMenu] = useState<ObjectId | null>(null)
  // Proliferate picks are `TargetRef`s, not ids: rule 701.27 lets you choose
  // players as well as permanents (a player with energy, poison or experience
  // counters).
  const [proliferatePicks, setProliferatePicks] = useState<readonly TargetRef[]>([])
  const [zoneView, setZoneView] = useState<{
    readonly title: string
    readonly ids: readonly ObjectId[]
    /** Draws what isn't in `view.objects` (emblems); the view's objects otherwise. */
    readonly resolve?: (id: ObjectId) => VisibleObject | undefined
  } | null>(null)
  // A forced-decision popup (choose-from-zone, scry/surveil, the creature-type
  // picker) hidden via its "View board" button so the board can be read before
  // answering. The way back is a "Show choices" button in the decision strip.
  // Table remounts per frame, but no frame arrives while the game waits on
  // this seat's answer, so this outlives exactly the decision it belongs to.
  const [decisionCollapsed, setDecisionCollapsed] = useState(false)
  // The card picked from a `cast-now` offer of several (or of cards looked
  // at first — the top of a library), whose ways to cast it the decision
  // strip then offers. Per frame, like `decisionCollapsed`.
  const [castNowPick, setCastNowPick] = useState<ObjectId | null>(null)
  // The same for the popup a graveyard or exile target is picked from, by the
  // slot it was hidden for (`zoneTargetKey`): the next slot, or a targeting
  // backed out of and begun again, starts shown.
  const [zoneTargetHidden, setZoneTargetHidden] = useState<string | null>(null)

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

  // The offer with each compacted token stack as one member per token
  // (game/stackMembers.ts): the bar picks and counts creatures, and
  // `confirmAttackers` folds the members back into counted entries.
  //
  // Creatures put onto the battlefield attacking, with a choice of what each
  // attacks (rule 508.4 — the `enter-attacking` decision), are answered with
  // the same bar: its offer, reshaped as an attack in which every one of them
  // must be sent somewhere (`mustAttack`), and `confirmAttackers` sends the
  // answer as that decision's instead.
  const enterAttackingAction = actions.find(
    (a): a is EnterAttackingAction => a.kind === 'enter-attacking',
  )
  const rawAttackAction = useMemo((): AttackAction | undefined => {
    const declared = actions.find((a): a is AttackAction => a.kind === 'declare-attackers')
    if (declared !== undefined || enterAttackingAction === undefined) return declared
    const ids = enterAttackingAction.creatures.map((c) => c.object)
    const defenders = [...new Set(enterAttackingAction.creatures.flatMap((c) => c.options))]
    return {
      kind: 'declare-attackers',
      eligible: ids,
      defenders,
      defendersFor: Object.fromEntries(enterAttackingAction.creatures.map((c) => [c.object, c.options])),
      mustAttack: ids,
    }
  }, [actions, enterAttackingAction])
  const attackExpansion = useMemo(
    () =>
      rawAttackAction
        ? expandAttackOffer(rawAttackAction, (id) => view.objects[id]?.stackCount ?? 1)
        : null,
    [rawAttackAction, view],
  )
  const attackAction = attackExpansion?.offer
  // Which defenders *this* attacker may legally be sent at. Not the same as
  // `attackAction.defenders`, which is the union across every attacker: a
  // goaded creature has to attack someone other than its goader when it can
  // (rule 701.38b), and picking from the union builds a declaration the
  // server rejects.
  const defendersFor = useCallback(
    (attacker: ObjectId): readonly (PlayerId | ObjectId)[] =>
      attackAction?.defendersFor[attacker] ?? [],
    [attackAction],
  )
  /**
   * May the pending group be pointed at this defender?
   *
   * **All of them or none** — a defender every selected creature may legally
   * attack. Assigning just the ones that can and leaving the rest behind
   * would quietly split an attack the player thought they were sending one
   * way, which is the same silent split the old "Attack with all" button
   * caused by sending each creature at its own `defendersFor(id)[0]`.
   *
   * The check is **per attacker, never off the offer's `defenders` union** —
   * that union says who may be attacked *at all*, and a declaration built
   * from it is one the engine refuses (both `actions.ts` and
   * `decisions/attackers.ts` warn about exactly this, and a refusal surfaces
   * as a red error banner rather than a partial attack). Goad (rule 701.38b)
   * and Vow of Duty are what make the legal set differ per creature.
   */
  const canSendPicksAt = useCallback(
    (defender: PlayerId | ObjectId): boolean =>
      attackPicks.length > 0 &&
      attackPicks.every((p) => defendersFor(p).includes(defender)),
    [attackPicks, defendersFor],
  )
  const sendPicksAt = useCallback(
    (defender: PlayerId | ObjectId) => {
      if (!canSendPicksAt(defender)) return
      // Two plain updaters rather than one nested inside the other: a
      // `setState` updater has to stay pure (see the note on `setTargeting`).
      setAttackAssignments((cur) => ({
        ...cur,
        ...Object.fromEntries(attackPicks.map((p) => [p, defender])),
      }))
      setAttackPicks([])
    },
    [attackPicks, canSendPicksAt],
  )
  // As with attacks: a compacted stack blocks as its members, one per token.
  const rawBlockAction = actions.find(
    (a): a is BlockAction => a.kind === 'declare-blockers',
  )
  const blockExpansion = useMemo(
    () => (rawBlockAction ? expandBlockOffer(rawBlockAction) : null),
    [rawBlockAction],
  )
  const blockAction = blockExpansion?.offer
  /** The members of whichever combat declaration is being built. */
  const stackMembers: Members = useMemo(
    () => attackExpansion?.members ?? blockExpansion?.members ?? new Map(),
    [attackExpansion, blockExpansion],
  )
  /** Every member of the board tile an id is drawn in — several when
   * identical tokens fold into one (`computeBoardEntries`), itself alone
   * otherwise. The block bar counts and spreads blocks over a whole tile. */
  const tileMembers = useMemo(() => {
    const out = new Map<ObjectId, readonly ObjectId[]>()
    for (const pid of view.turnOrder) {
      for (const entry of computeBoardEntries(view, pid)) {
        // A compacted stack's members are members of its tile too.
        const members = expandIds(entry.ids, stackMembers)
        for (const id of members) out.set(id, members)
        for (const id of entry.ids) out.set(id, members)
      }
    }
    return out
  }, [view, stackMembers])
  const tileOf = useCallback(
    (id: ObjectId): readonly ObjectId[] => tileMembers.get(id) ?? [id],
    [tileMembers],
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
  const revealChoiceAction = actions.find(
    (a): a is RevealChoiceAction => a.kind === 'reveal-for-untapped',
  )
  const copyChoiceAction = actions.find(
    (a): a is CopyChoiceAction => a.kind === 'choose-copy',
  )
  const enchantAction = actions.find(
    (a): a is EnchantChoiceAction => a.kind === 'choose-enchant',
  )
  const legendAction = actions.find((a): a is LegendRuleAction => a.kind === 'legend-rule')
  const triggerOrderAction = actions.find((a): a is TriggerOrderAction => a.kind === 'order-triggers')
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
  const choosePermanentsAction = actions.find(
    (a): a is ChoosePermanentsAction => a.kind === 'choose-permanents',
  )
  const proliferateAction = actions.find(
    (a): a is ProliferateAction => a.kind === 'proliferate',
  )
  const scryAction = actions.find((a): a is ScryAction => a.kind === 'scry')
  const castNowAction = actions.find((a): a is CastNowAction => a.kind === 'cast-now')
  // "You may cast a spell from your hand" and the like: more than one card on
  // offer, or cards to look at first, so the card is picked from a popup.
  const castNowPicking =
    castNowAction !== undefined && (castNowAction.cards.length > 1 || castNowAction.looked !== undefined)
  const assignDamageAction = actions.find(
    (a): a is AssignDamageAction => a.kind === 'assign-combat-damage',
  )
  // The split as it stands, which the board draws as well as the bar (a
  // badge on each blocker), so it's worked out up here: the engine's
  // standard split until the player changes it.
  const damageAnswer = useMemo(
    () =>
      assignDamageAction ? (damagePicks ?? standardAssignment(assignDamageAction)) : null,
    [assignDamageAction, damagePicks],
  )
  const damageGroups = useMemo(
    () => (assignDamageAction ? groupBlockers(assignDamageAction, view) : []),
    [assignDamageAction, view],
  )
  /** Each blocker's position in the offer, which is where its amount goes. */
  const damageIndex = useMemo(
    () => new Map(assignDamageAction?.blockers.map((id, i) => [id, i]) ?? []),
    [assignDamageAction],
  )
  /** The blockers a board tile stands for, as offer positions: every one of
   * them, since a folded token stack is one tile and several blockers. */
  const damageMembersOf = useCallback(
    (ids: readonly ObjectId[]): number[] =>
      ids.flatMap((i) => {
        const at = damageIndex.get(i)
        return at === undefined ? [] : [at]
      }),
    [damageIndex],
  )
  const damageSurvivors = useMemo(
    () => (assignDamageAction ? survivorsOf(assignDamageAction) : new Set<number>()),
    [assignDamageAction],
  )
  const chooseTargetsAction = actions.find(
    (a): a is ChooseTargetsAction => a.kind === 'choose-targets',
  )
  // A `choose-targets` decision (a triggered ability / a suspended spell —
  // ROADMAP Phase 11 EG-1) drives the same targeting flow as a cast, but it's
  // *derived* from the decision rather than stored — only the running picks
  // live in state — so a state refresh mid-choice just re-derives it.
  const [ctPicks, setCtPicks] = useState<readonly (TargetRef | null)[]>([])
  const activeTargeting: Targeting | null = useMemo(
    () =>
      targeting ??
      (chooseTargetsAction
        ? {
            kind: 'choose-targets',
            source: chooseTargetsAction.source,
            abilityIndex: 0,
            label:
              chooseTargetsAction.current !== undefined
                ? `Choose new targets for the copy of ${chooseTargetsAction.cardName}`
                : `Choose targets for ${chooseTargetsAction.cardName}`,
            specs: chooseTargetsAction.specs,
            options: chooseTargetsAction.options,
            picked: ctPicks,
            ...(chooseTargetsAction.current !== undefined ? { current: chooseTargetsAction.current } : {}),
            ...(chooseTargetsAction.divide !== undefined ? { divide: chooseTargetsAction.divide } : {}),
            facts: viewTargetFacts(view),
          }
        : null),
    [targeting, chooseTargetsAction, ctPicks, view],
  )
  const canPass = actions.some((a) => a.kind === 'pass-priority')
  // Only the active player may skip the rest of their own turn — a defender
  // holding priority to respond during it shouldn't get this button.
  const canPassTurn = canPass && seat === view.activePlayer

  const mode:
    | 'discard'
    | 'attackers'
    | 'blockers'
    | 'choose-from-zone'
    | 'mulligan'
    | 'put-on-bottom'
    | 'commander-replacement'
    | 'pay-life-for-untapped'
    | 'reveal-for-untapped'
    | 'choose-copy'
    | 'choose-enchant'
    | 'legend-rule'
    | 'order-triggers'
    | 'choose-text'
    | 'choose-creature-type'
    | 'choose-modes'
    | 'sacrifice'
    | 'proliferate'
    | 'choose-permanents'
    | 'scry'
    | 'choose-x'
    | 'choose-cast-modes'
    | 'choose-escape-exile'
    | 'choose-delve'
    | 'choose-sacrifice'
    | 'choose-tap'
    | 'choose-convoke'
    | 'choose-division'
    | 'assign-combat-damage'
    | 'targeting'
    | 'cast-now'
    | 'priority' = mulliganAction
    ? 'mulligan'
    : commanderChoiceAction
      ? 'commander-replacement'
    : shockChoiceAction
      ? 'pay-life-for-untapped'
    : revealChoiceAction
      ? 'reveal-for-untapped'
      : copyChoiceAction
        ? 'choose-copy'
        : enchantAction
          ? 'choose-enchant'
        : legendAction
          ? 'legend-rule'
        : triggerOrderAction
          ? 'order-triggers'
        : textChoiceAction
          ? 'choose-text'
        : creatureTypeChoiceAction
          ? 'choose-creature-type'
        : modesChoiceAction
          ? 'choose-modes'
        : sacrificeAction
          ? 'sacrifice'
        : proliferateAction
          ? 'proliferate'
        : choosePermanentsAction
          ? 'choose-permanents'
        : scryAction
          ? 'scry'
        : assignDamageAction
          ? 'assign-combat-damage'
        : bottomAction
          ? 'put-on-bottom'
      : discardAction
        ? 'discard'
          : attackAction
            ? 'attackers'
            : blockAction
              ? 'blockers'
              : zoneChoiceAction
                ? 'choose-from-zone'
                : pendingEscape
                  ? 'choose-escape-exile'
                : pendingDelve
                  ? 'choose-delve'
                : pendingModes
                  ? 'choose-cast-modes'
                : pendingX
                  ? 'choose-x'
                  : pendingSac
                    ? 'choose-sacrifice'
                    : pendingTap
                      ? 'choose-tap'
                    : pendingConvoke
                      ? 'choose-convoke'
                    : pendingDivision
                      ? 'choose-division'
                    : activeTargeting
                      ? 'targeting'
                    // Last: once a variant is picked, its X / modes / targets
                    // steps above take over until the cast goes out.
                    : castNowAction
                      ? 'cast-now'
                      : 'priority'

  // Every mode but the mulligan keeps the hand in its fixed tray (mulligan
  // shows the hand in its own centered popup instead -- see
  // renderMulliganModal). This is what keeps .quadrant-grid from losing
  // height (and recomputeBoardMiniW crushing the board's mini tiles to
  // compensate) every time a decision comes up -- see renderHandStrip/the
  // .decision-banner CSS. A decision that picks cards out of the hand
  // (discard, put-on-bottom, a reveal land's reveal) holds the tray open instead (`handForcedOpen`)
  // and asks in the same bottom-right banner as every other decision: docking
  // its controls beside the hand used to pull the whole strip out of the tray
  // and squash the board for as long as it was up.
  const peekable = mode !== 'mulligan'
  const handForcedOpen =
    mode === 'discard' || mode === 'put-on-bottom' || mode === 'reveal-for-untapped'

  // --- dispatch helpers --------------------------------------------
  const pass = useCallback(() => {
    if (canPass) game.dispatch({ type: 'pass-priority', player: seat })
  }, [canPass, game, seat])

  const finishTargets = useCallback(
    // Named, so the division step's `resume` can call back into it.
    function finish(
      t: Pick<
        Targeting,
        | 'kind'
        | 'source'
        | 'abilityIndex'
        | 'xValue'
        | 'sacrifice'
        | 'escapeExile'
        | 'delve'
        | 'via'
        | 'face'
        | 'modes'
        | 'kicked'
        | 'kickCount'
        | 'prototype'
        | 'offspring'
        | 'evoke'
        | 'evokeCost'
        | 'overload'
        | 'free'
        | 'manaColors'
        | 'altCost'
        | 'costOption'
        | 'graveyardGrant'
        | 'tapCost'
        | 'tap'
        | 'convokeOffer'
        | 'divide'
      >,
      targets: readonly (TargetRef | null)[],
      division?: readonly number[],
    ): void {
      const action: Action =
        t.kind === 'choose-targets'
          ? {
              type: 'choose-targets',
              player: seat,
              targets: [...targets],
              ...(division !== undefined ? { division: [...division] } : {}),
            }
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
                ...(t.kickCount !== undefined ? { kickCount: t.kickCount } : {}),
                ...(t.prototype === true ? { prototype: true } : {}),
                ...(t.offspring === true ? { offspring: true } : {}),
                ...(t.evoke === true ? { evoke: true, evokeCost: t.evokeCost } : {}),
                ...(t.overload === true ? { overload: true } : {}),
                ...(t.free === true ? { free: true } : {}),
                ...(t.altCost === true ? { altCost: true } : {}),
                ...(t.costOption !== undefined ? { costOption: t.costOption } : {}),
                ...(t.graveyardGrant !== undefined ? { graveyardGrant: t.graveyardGrant } : {}),
                ...(t.sacrifice !== undefined ? { sacrifice: t.sacrifice } : {}),
                ...(t.escapeExile !== undefined ? { escapeExile: [...t.escapeExile] } : {}),
                ...(t.delve !== undefined && t.delve.length > 0 ? { delve: [...t.delve] } : {}),
                ...(t.tap !== undefined ? { tap: [...t.tap] } : {}),
                ...(division !== undefined ? { division: [...division] } : {}),
              }
            : {
                type: 'activate-ability',
                player: seat,
                source: t.source,
                abilityIndex: t.abilityIndex,
                targets: [...targets],
                ...(t.sacrifice !== undefined ? { sacrifice: t.sacrifice } : {}),
                ...(t.xValue !== undefined ? { xValue: t.xValue } : {}),
                ...(t.manaColors !== undefined ? { manaColors: t.manaColors } : {}),
                ...(division !== undefined ? { division: [...division] } : {}),
              }
      // Two or more targets to divide among: ask how, then carry on from here
      // with the answer. One takes it all, which the engine works out itself.
      const members =
        t.divide === undefined
          ? []
          : targets.slice(t.divide.slot).filter((r): r is TargetRef => r !== null)
      if (t.divide !== undefined && division === undefined && members.length >= 2) {
        const total = t.divide.total
        const base = Math.floor(total / members.length)
        setPendingDivision({
          total,
          targets: members,
          shares: members.map((_m, i) => base + (i < total % members.length ? 1 : 0)),
          // Back into this with the split: everything it needs is in the
          // arguments, so an earlier render's copy does as well.
          resume: (chosen) => finish(t, targets, chosen),
        })
        return
      }
      const convoke = t.convokeOffer
      if (convoke !== undefined && action.type === 'cast-spell') {
        setPendingConvoke({
          action,
          offer: convoke,
          // A spell mana alone can't pay starts from a set known to work.
          picks: convoke.manaAffordable ? [] : convoke.proof.map((p) => p.creature),
        })
        return
      }
      const offer = t.tapCost
      if (offer === undefined || action.type === 'choose-targets') {
        game.dispatch(action)
        return
      }
      // Exactly as much as the cost needs leaves nothing to choose.
      const every = allTapChoices(offer)
      if (every.length === offer.count) {
        game.dispatch({ ...action, tap: every })
        return
      }
      setPendingTap({ action, offer, picks: [] })
    },
    [game, seat],
  )

  const beginTargeting = useCallback(
    (t: Omit<Targeting, 'picked'>) => {
      // Nothing to choose — no slots, or only an "any number of" group with
      // no candidates, whose empty choice is the only one.
      if (t.specs.length === 0 || (anyNumberSlot(t.specs) === 0 && slotOptions(t.specs, t.options, 0, []).length === 0)) {
        finishTargets(t, [])
        return
      }
      setTargeting({ ...t, picked: [], facts: viewTargetFacts(view) })
    },
    [finishTargets, view],
  )

  /** Cast, past the additional-cost step — `chosen` holds the costs picked so
   * far: the permanent a `CardDefinition.additionalCost` sacrifices (Harrow:
   * "sacrifice a land") and, once asked, the cards an escape cast exiles. */
  const startCast = useCallback(
    (cast: CastAction, chosen: CastPicks = {}) => {
      // Escape (rule 702.139a): which other graveyard cards pay the exile
      // half of the cost is the caster's choice. Asked next, before modes / X
      // / targets — unless the graveyard holds exactly as many as the cost
      // needs, which leaves nothing to choose.
      const escape = cast.escapeExile
      if (
        escape !== undefined &&
        chosen.escapeExile === undefined &&
        escape.choices.length !== escape.count
      ) {
        setPendingEscape({
          cast,
          offer: escape,
          ...(chosen.sacrifice !== undefined ? { sacrifice: chosen.sacrifice } : {}),
        })
        return
      }
      const paid: Omit<CastPicks, 'delve'> = {
        ...(chosen.sacrifice !== undefined ? { sacrifice: chosen.sacrifice } : {}),
        ...(chosen.escapeExile !== undefined
          ? { escapeExile: chosen.escapeExile }
          : escape !== undefined
            ? { escapeExile: escape.choices }
            : {}),
      }
      // Delve (rule 702.66a): which graveyard cards pay generic mana, and how
      // many. Asked next, unless there's no choice: every card it may exile,
      // all of them needed.
      const delve = cast.delve
      const noDelveChoice =
        delve !== undefined &&
        delve.minCards === delve.maxCards &&
        delve.choices.length === delve.maxCards
      // An {X} spell asks after X, whose range it depends on (`confirmX`).
      const delveAfterX = delve?.byX !== undefined
      if (delve !== undefined && chosen.delve === undefined && !noDelveChoice && !delveAfterX) {
        setPendingDelve({ cast, offer: delve, ...paid })
        return
      }
      const delved = chosen.delve ?? (noDelveChoice && !delveAfterX ? delve?.choices : undefined)
      const picks: CastPicks = { ...paid, ...(delved !== undefined ? { delve: delved } : {}) }
      if (cast.castModal) {
        setPendingModes({ cast, picked: [], ...picks })
        return
      }
      // An offer whose targets fix X (Stolen by the Fae's "mana value X")
      // has nothing to ask.
      const fixedX =
        cast.xCost?.minX !== undefined && cast.xCost.minX === cast.xCost.maxX ? cast.xCost.maxX : undefined
      if (cast.xCost && fixedX === undefined) {
        setPendingX({ action: cast, value: cast.xCost.maxX, ...picks })
        return
      }
      beginTargeting({
        kind: 'cast',
        source: cast.card,
        abilityIndex: 0,
        label: `Cast ${cast.cardName}`,
        specs: cast.targetSpecs,
        options: cast.targetOptions,
        ...(fixedX !== undefined ? { xValue: fixedX } : {}),
        ...castExtras(cast),
        ...picks,
      })
    },
    [beginTargeting],
  )

  /** A cast's targeting, at the X chosen, with the costs picked so far. */
  const castAtX = useCallback(
    (action: CastAction, value: number, picks: CastPicks) => {
      // Where X and the number of targets trade off (Fireball's "{1} more
      // for each target beyond the first"), the X chosen leaves only some
      // counts payable.
      const atX = action.targetCount === undefined ? null : targetCountAtX(action.targetCount, action.xCost, value)
      beginTargeting({
        kind: 'cast',
        source: action.card,
        abilityIndex: 0,
        label: `Cast ${action.cardName}`,
        // A target count tied to X (Curse of the Swine) is fixed by it.
        specs: specsAtX(action.targetSpecs, value),
        options: action.targetOptions,
        xValue: value,
        ...castExtras(action),
        ...(atX !== null ? { targetCount: atX } : {}),
        ...picks,
      })
    },
    [beginTargeting],
  )

  /** The delve choice's Confirm: carry on casting with those cards. */
  const confirmDelve = useCallback(
    (delve: readonly ObjectId[]) => {
      if (!pendingDelve) return
      const { cast, offer: _offer, xValue, ...picks } = pendingDelve
      setPendingDelve(null)
      if (xValue !== undefined) castAtX(cast, xValue, { ...picks, delve })
      else startCast(cast, { ...picks, delve })
    },
    [pendingDelve, startCast, castAtX],
  )

  /** The escape choice's Confirm: carry on casting with those cards. */
  const confirmEscapeExile = useCallback(
    (escapeExile: readonly ObjectId[]) => {
      if (!pendingEscape) return
      const { cast, sacrifice } = pendingEscape
      setPendingEscape(null)
      startCast(cast, { ...(sacrifice !== undefined ? { sacrifice } : {}), escapeExile })
    },
    [pendingEscape, startCast],
  )

  const beginCast = useCallback(
    (cast: CastAction) => {
      // An additional sacrifice cost (rule 601.2f) is chosen first, before
      // modes / X / targets — same order the rules announce costs in.
      if (cast.sacrifice) {
        if (cast.sacrifice.choices.length === 0) return
        if (cast.sacrifice.choices.length === 1) {
          startCast(cast, { sacrifice: cast.sacrifice.choices[0] })
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
    const { cast, picked, ...picks } = pendingModes
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
      ...picks,
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
          ...(a.graveyardGrant !== undefined ? { graveyardGrant: a.graveyardGrant } : {}),
        })
      } else {
        beginCast(a)
      }
    },
    [beginCast, game, seat],
  )

  const startAbilityAtX = useCallback(
    (action: AbilityAction, value: number) => {
      beginTargeting({
        kind: 'activate',
        source: action.source,
        abilityIndex: action.abilityIndex,
        label: action.text || `${action.cardName} ability`,
        specs: action.targetSpecs,
        options: action.targetOptions,
        xValue: value,
        ...(action.tapCost !== undefined ? { tapCost: action.tapCost } : {}),
        ...(action.divide !== undefined ? { divide: action.divide } : {}),
      })
    },
    [beginTargeting],
  )

  const confirmX = useCallback(() => {
    if (!pendingX) return
    const { action, value, ...picks } = pendingX
    setPendingX(null)
    if (action.kind === 'activate-ability') {
      startAbilityAtX(action, value)
      return
    }
    // Delve on an {X} spell (rule 702.66a): its range at this X, asked now.
    const range = action.delve?.byX?.[value]
    if (action.delve !== undefined && range !== undefined && picks.delve === undefined && range.maxCards > 0) {
      const { choices } = action.delve
      if (range.minCards === range.maxCards && choices.length === range.maxCards) {
        castAtX(action, value, { ...picks, delve: choices })
        return
      }
      setPendingDelve({
        cast: action,
        offer: { choices, minCards: range.minCards, maxCards: range.maxCards },
        xValue: value,
        ...picks,
      })
      return
    }
    castAtX(action, value, picks)
  }, [castAtX, pendingX, startAbilityAtX])

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
        ...(ab.manaColors !== undefined ? { manaColors: ab.manaColors } : {}),
        ...(ab.tapCost !== undefined ? { tapCost: ab.tapCost } : {}),
        ...(ab.divide !== undefined ? { divide: ab.divide } : {}),
      })
    },
    [beginTargeting],
  )

  const clickAbility = useCallback(
    (ab: AbilityAction) => {
      if (ab.xCost) {
        // An offer whose targets fix X (Rydia's "Saga card with mana value
        // X") has nothing to ask.
        if (ab.xCost.minX === ab.xCost.maxX) {
          startAbilityAtX(ab, ab.xCost.maxX)
          return
        }
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
    [startAbility, startAbilityAtX],
  )

  const pickTarget = useCallback(
    // `null` skips the current slot, which is legal only for an optional one
    // — the Skip button is only rendered for those.
    (ref: TargetRef | null) => {
      const t = activeTargeting
      if (!t) return
      const derived = t.kind === 'choose-targets'
      const commit = (picked: readonly (TargetRef | null)[]): void => {
        if (derived) setCtPicks(picked)
        else setTargeting({ ...t, picked })
      }
      // Dispatch outside any state updater (updaters must be pure; React
      // double-invokes them in dev).
      const finish = (picked: readonly (TargetRef | null)[]): void => {
        if (derived) setCtPicks([])
        else setTargeting(null)
        finishTargets(t, picked)
      }
      const group = anyNumberSlot(t.specs)
      if (inTargetGroup(t)) {
        // Another member of an "any number of" group — or `null`, Done.
        if (ref === null) {
          if (!mayFinishGroup(t)) return
          finish(t.picked)
          return
        }
        const picked = [...t.picked, ref]
        // Every candidate taken leaves nothing to add.
        if (slotOptions(t.specs, t.options, picked.length, picked, t.facts).length === 0) finish(picked)
        else commit(picked)
        return
      }
      const picked = [...t.picked, ref]
      // The fixed slots are done and the group has no candidates: none it is.
      if (group >= 0 && picked.length === group && (t.options[group] ?? []).length === 0) {
        finish(picked)
        return
      }
      if (picked.length < t.specs.length) {
        commit(picked)
        return
      }
      finish(picked)
    },
    [activeTargeting, finishTargets],
  )

  /** An "any number of" group's members picked from a popup at once, which
   * ends the group. */
  const pickTargetGroup = useCallback(
    (refs: readonly TargetRef[]) => {
      const t = activeTargeting
      if (!t) return
      if (t.kind === 'choose-targets') setCtPicks([])
      else setTargeting(null)
      finishTargets(t, [...t.picked, ...refs])
    },
    [activeTargeting, finishTargets],
  )

  /** Take a member already picked back out of an "any number of" group. */
  const unpickTarget = useCallback(
    (ref: TargetRef): boolean => {
      const t = activeTargeting
      if (!t || !inTargetGroup(t)) return false
      const group = anyNumberSlot(t.specs)
      const same = (r: TargetRef | null): boolean =>
        r !== null &&
        (r.kind === 'player'
          ? ref.kind === 'player' && r.player === ref.player
          : ref.kind === 'object' && r.object === ref.object)
      if (!t.picked.slice(group).some(same)) return false
      const picked = [...t.picked.slice(0, group), ...t.picked.slice(group).filter((r) => !same(r))]
      if (t.kind === 'choose-targets') setCtPicks(picked)
      else setTargeting({ ...t, picked })
      return true
    },
    [activeTargeting],
  )

  const clickHandCard = useCallback(
    (id: ObjectId) => {
      if (mode === 'discard') {
        if (!discardAction) return
        // A cost can name a kind of card ("Discard a creature card"): only
        // the offered ones can be picked.
        if (!discardAction.from.includes(id)) return
        setDiscardPicks((cur) => {
          if (cur.includes(id)) return cur.filter((x) => x !== id)
          if (cur.length >= discardAction.count) return cur
          return [...cur, id]
        })
        return
      }
      if (mode === 'reveal-for-untapped') {
        // One card, of the kinds the land names: clicking it again unpicks it.
        if (!revealChoiceAction?.options.includes(id)) return
        setRevealPick((cur) => (cur === id ? null : id))
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
    [bottomAction, discardAction, revealChoiceAction, mode, playFace, playFacesByCard],
  )

  /** Which id a click on a (possibly stacked) tile should act on. */
  const pickIdForClick = useCallback(
    (ids: readonly ObjectId[]): ObjectId => {
      if (mode === 'targeting' && activeTargeting) {
        const slot = currentSlotOptions(activeTargeting)
        const found = ids.find((i) =>
          slot.some((o) => o.kind === 'object' && o.object === i),
        )
        if (found) return found
      }
      if (mode === 'choose-sacrifice' && pendingSac?.sacrifice !== undefined) {
        const choices = pendingSac.sacrifice.choices
        const found = ids.find((i) => choices.includes(i))
        if (found) return found
      }
      if (mode === 'choose-copy' && copyChoiceAction) {
        const found = ids.find((i) => copyChoiceAction.options.includes(i))
        if (found) return found
      }
      // A tile standing for several identical permanents: take a member not
      // already picked, so a second click picks the next one rather than
      // un-picking the first.
      const picking =
        mode === 'choose-tap'
          ? pendingTap
          : mode === 'choose-convoke'
            ? pendingConvoke
            : mode === 'choose-permanents'
              ? { picks: permanentPicks }
              : null
      if (picking) {
        const fresh = ids.find((i) => !picking.picks.includes(i))
        if (fresh !== undefined) return fresh
      }
      return ids[0]
    },
    [mode, activeTargeting, pendingSac, copyChoiceAction, pendingTap, pendingConvoke, permanentPicks],
  )

  const clickPermanent = useCallback(
    (ids: readonly ObjectId[]) => {
      const id = pickIdForClick(ids)
      if (mode === 'choose-sacrifice' && pendingSac?.sacrifice !== undefined) {
        // One click is the whole answer: the cost names one permanent.
        if (!pendingSac.sacrifice.choices.includes(id)) return
        const sacChoice = pendingSac
        setPendingSac(null)
        if (sacChoice.kind === 'cast-spell') startCast(sacChoice, { sacrifice: id })
        else startAbility(sacChoice, id)
        return
      }
      if (mode === 'targeting' && activeTargeting) {
        const slot = currentSlotOptions(activeTargeting)
        if (slot.some((o) => o.kind === 'object' && o.object === id)) {
          pickTarget({ kind: 'object', object: id })
        } else {
          unpickTarget({ kind: 'object', object: id })
        }
        return
      }
      if (mode === 'attackers' && attackAction) {
        // An opponent's planeswalker is a defender, not an attacker, so a
        // click on one sends the pending group at it (the same thing
        // clicking a seat panel does).
        // Over the whole tile — several folded tokens, or a compacted
        // stack's members (game/stackMembers.ts) — and a click takes one
        // that isn't attacking yet (game/attackGroups.ts).
        const members = expandIds(ids, stackMembers)
        if (!members.some((i) => attackAction.eligible.includes(i))) {
          sendPicksAt(id)
          return
        }
        const fresh = freeAttacker(members, attackAction.eligible, attackAssignments, attackPicks)
        if (fresh === null) {
          // Every member is attacking or waiting already: take the tile back
          // out of the attack. One creature's tile toggles, as it always
          // did; a stack's count row in the bar takes out fewer.
          setAttackAssignments((cur) => {
            const next = { ...cur }
            for (const i of members) delete next[i]
            return next
          })
          setAttackPicks((cur) => cur.filter((x) => !members.includes(x)))
          return
        }
        const myDefenders = defendersFor(fresh)
        // No choice to make, so don't make the player make one: a creature
        // with exactly one legal defender is assigned outright. That is what
        // keeps a two-player board at one click per attacker, and it also
        // covers a goaded creature whose goader is its only legal target.
        if (myDefenders.length === 1) {
          setAttackAssignments((cur) => ({ ...cur, [fresh]: myDefenders[0] }))
          return
        }
        setAttackPicks((cur) => [...cur, fresh])
        return
      }
      if (mode === 'assign-combat-damage' && assignDamageAction && damageAnswer) {
        // All of them, not just the one `pickIdForClick` picked.
        const members = damageMembersOf(ids)
        if (members.length > 0) {
          setDamagePicks(clickMembers(assignDamageAction, members, damageAnswer))
        }
        return
      }
      if (mode === 'choose-tap' && pendingTap) {
        const { offer } = pendingTap
        if (!offer.choices.includes(id)) return
        if ((offer.copies?.[id] ?? 1) > 1) {
          setStackMenu((cur) => (cur === id ? null : id))
          return
        }
        setPendingTap((cur) =>
          cur === null
            ? cur
            : {
                ...cur,
                picks: cur.picks.includes(id)
                  ? cur.picks.filter((x) => x !== id)
                  : cur.picks.length >= offer.count
                    ? [...cur.picks.slice(1), id]
                    : [...cur.picks, id],
              },
        )
        return
      }
      if (mode === 'choose-convoke' && pendingConvoke) {
        const { offer } = pendingConvoke
        if (!offer.candidates.includes(id)) return
        if ((offer.copies?.[id] ?? 1) > 1) {
          setStackMenu((cur) => (cur === id ? null : id))
          return
        }
        setPendingConvoke((cur) =>
          cur === null
            ? cur
            : {
                ...cur,
                picks: cur.picks.includes(id)
                  ? cur.picks.filter((x) => x !== id)
                  : cur.picks.length >= offer.maxCreatures
                    ? cur.picks
                    : [...cur.picks, id],
              },
        )
        return
      }
      if (mode === 'choose-enchant' && enchantAction) {
        if (enchantAction.options.includes(id)) {
          game.dispatch({ type: 'choose-enchant', player: seat, enchant: id })
        }
        return
      }
      if (mode === 'choose-copy' && copyChoiceAction) {
        if (copyChoiceAction.options.includes(id)) {
          game.dispatch({ type: 'choose-copy', player: seat, copy: id })
        }
        return
      }
      if (mode === 'legend-rule' && legendAction) {
        if (legendAction.options.includes(id)) {
          game.dispatch({ type: 'legend-rule', player: seat, keep: id })
        }
        return
      }
      if (mode === 'sacrifice' && sacrificeAction) {
        if (!sacrificeAction.eligible.includes(id)) return
        // A compacted token stack is one tile standing for several tokens, so
        // how many of it to give up is a choice, not a toggle — it gets the
        // count menu instead.
        if ((sacrificeAction.copies?.[id] ?? 1) > 1) {
          setStackMenu((cur) => (cur === id ? null : id))
          return
        }
        setSacrificePicks((cur) =>
          cur.includes(id)
            ? cur.filter((x) => x !== id)
            : cur.length >= sacrificeAction.count
              ? [...cur.slice(1), id]
              : [...cur, id],
        )
        return
      }
      if (mode === 'choose-permanents' && choosePermanentsAction) {
        if (!choosePermanentsAction.eligible.includes(id)) return
        // A token stack is one tile for several tokens: how many of it is a
        // count, as for a sacrifice.
        if ((choosePermanentsAction.copies?.[id] ?? 1) > 1) {
          setStackMenu((cur) => (cur === id ? null : id))
          return
        }
        setPermanentPicks((cur) =>
          cur.includes(id)
            ? cur.filter((x) => x !== id)
            : cur.length >= choosePermanentsAction.max
              ? [...cur.slice(1), id]
              : [...cur, id],
        )
        return
      }
      if (mode === 'proliferate' && proliferateAction) {
        if (!eligibleToProliferate(proliferateAction, id)) return
        // A plain toggle, with no cap: "any number" has no count to enforce,
        // which is the one thing that makes this different from every other
        // multi-select decision on the board.
        setProliferatePicks((cur) =>
          cur.some((t) => t.kind === 'object' && t.object === id)
            ? cur.filter((t) => !(t.kind === 'object' && t.object === id))
            : [...cur, { kind: 'object', object: id }],
        )
        return
      }
      if (mode === 'blockers' && blockAction) {
        // Over the whole tile, not `id`: a folded tile is several creatures,
        // and a click takes one that fits (game/blockGroups.ts). A compacted
        // stack is its members here (game/stackMembers.ts).
        const members = expandIds(ids, stackMembers)
        if (members.some((i) => blockAction.eligible.some((e) => e.blocker === i))) {
          const fresh = freeBlocker(members, blockAction, blockAssign, blockFocus)
          if (fresh === null) {
            // Every member is blocking or waiting for an attacker already:
            // the click takes the tile back out of the block. One creature's
            // tile toggles, as it always did; a stack's count row in the bar
            // is how to take out fewer than all of it.
            setBlockAssign((cur) => {
              const next = { ...cur }
              for (const i of members) delete next[i]
              return next
            })
            setBlockFocus(null)
            return
          }
          const canBlock = blockAction.eligible.find((e) => e.blocker === fresh)?.canBlock ?? []
          if (canBlock.length === 1) {
            setBlockAssign((cur) => ({ ...cur, [fresh]: canBlock[0] }))
          } else {
            setBlockFocus(fresh)
          }
          return
        }
        if (blockFocus) {
          const at = leastBlocked(ids, blockFocus, blockAction, blockAssign)
          if (at !== null) {
            setBlockAssign((cur) => ({ ...cur, [blockFocus]: at }))
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
      assignDamageAction,
      attackAction,
      attackAssignments,
      attackPicks,
      damageAnswer,
      damageMembersOf,
      sendPicksAt,
      blockAction,
      blockAssign,
      blockFocus,
      stackMembers,
      mode,
      pickIdForClick,
      pickTarget,
      unpickTarget,
      sacrificeAction,
      choosePermanentsAction,
      pendingSac,
      startCast,
      startAbility,
      pendingTap,
      pendingConvoke,
      proliferateAction,
      activeTargeting,
      defendersFor,
      enchantAction,
      copyChoiceAction,
      legendAction,
      game,
      seat,
    ],
  )

  const clickPlayerTarget = useCallback(
    (pid: PlayerId) => {
      if (mode === 'choose-enchant' && enchantAction) {
        if ((enchantAction.players ?? []).includes(pid)) {
          game.dispatch({ type: 'choose-enchant', player: seat, enchant: pid })
        }
        return
      }
      if (mode === 'attackers' && attackAction) {
        sendPicksAt(pid)
        return
      }
      if (mode === 'proliferate' && proliferateAction) {
        if (!proliferateAction.eligible.some((t) => t.kind === 'player' && t.player === pid)) return
        setProliferatePicks((cur) =>
          cur.some((t) => t.kind === 'player' && t.player === pid)
            ? cur.filter((t) => !(t.kind === 'player' && t.player === pid))
            : [...cur, { kind: 'player', player: pid }],
        )
        return
      }
      if (mode !== 'targeting' || !activeTargeting) return
      const slot = currentSlotOptions(activeTargeting)
      if (slot.some((o) => o.kind === 'player' && o.player === pid)) {
        pickTarget({ kind: 'player', player: pid })
      } else {
        unpickTarget({ kind: 'player', player: pid })
      }
    },
    [attackAction, mode, pickTarget, unpickTarget, activeTargeting, sendPicksAt, proliferateAction, enchantAction, game, seat],
  )

  const confirmAttackers = useCallback(() => {
    if (enterAttackingAction !== undefined) {
      game.dispatch({
        type: 'enter-attacking',
        player: seat,
        assignments: Object.entries(attackAssignments).map(([object, target]) => ({
          object: object as ObjectId,
          target,
        })),
      })
      return
    }
    game.dispatch({
      type: 'declare-attackers',
      player: seat,
      attackers: collapseAttacks(attackAssignments, stackMembers),
    })
  }, [attackAssignments, enterAttackingAction, game, seat, stackMembers])

  const confirmBlockers = useCallback(() => {
    game.dispatch({
      type: 'declare-blockers',
      player: seat,
      blocks: collapseBlocks(blockAssign, stackMembers),
    })
  }, [blockAssign, game, seat, stackMembers])

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
      // Typing in a text field (the capture panel's note, a bug report) is
      // text, not a pass.
      const t = e.target
      const typing =
        t instanceof HTMLElement &&
        (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t.isContentEditable)
      // Nor is Space behind a popup (History, a graveyard): it's the page,
      // not a pass the player can see the board for.
      const behindPopup = document.querySelector('.zone-viewer-overlay') !== null
      if (e.key === ' ' && mode === 'priority' && !typing && !behindPopup) {
        e.preventDefault()
        pass()
      } else if (e.key === 'Escape') {
        setTargeting(null)
        setSelectedSource(null)
        setBlockFocus(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, pass])

  // --- render ----------------------------------------------------
  // "Another target" leaves out what an earlier slot already took, and a
  // "for each target" cost what it couldn't pay for.
  const targetSlot = activeTargeting ? currentSlotOptions(activeTargeting) : []
  // A slot's options that nothing on the board stands for — a card in a
  // graveyard (Regrowth, Rydia's Summon) or in exile. They're picked from a
  // popup of just those cards.
  const zoneTargetIds = targetSlot.flatMap((o) =>
    o.kind === 'object' &&
    !view.zones.battlefield.includes(o.object) &&
    !view.zones.stack.includes(o.object)
      ? [o.object]
      : [],
  )
  const zoneTargetKey = activeTargeting
    ? `${activeTargeting.kind}:${activeTargeting.source}:${activeTargeting.abilityIndex}:${activeTargeting.picked.length}`
    : null
  const zoneTargetCollapsed = zoneTargetKey !== null && zoneTargetHidden === zoneTargetKey
  const pickedObjKeys = new Set(
    (activeTargeting?.picked ?? [])
      .filter((r) => r?.kind === 'object')
      .map((r) => (r?.kind === 'object' ? r.object : '')),
  )
  /**
   * The seat-colour class of whoever an attack is aimed at — the defending
   * player, or the controller of the defending planeswalker. Drives the
   * attacking tile's outline, which is the readable half of "who is this
   * creature hitting": the ⚔ badge is four characters over art, at a tile
   * size where that is regularly illegible.
   */
  const attackSeatClass = (t: PlayerId | ObjectId): string | null => {
    const pw = view.objects[t as ObjectId]
    const pid = pw ? pw.controller : (t as PlayerId)
    // Turn-order position, not table position — the same rule every other
    // seat colour in the client follows, so the outline matches the panel.
    return view.turnOrder.includes(pid) ? seatClassOf(view.turnOrder, pid) : null
  }

  /** Label for an attack target — a player, or an opponent's planeswalker. */
  const attackTargetLabel = (t: PlayerId | ObjectId): string =>
    view.objects[t as ObjectId]
      ? game.nameOf(t as ObjectId)
      : playerLabel(t as PlayerId, game.seats)

  const playerIsTargetable = (pid: PlayerId): boolean => {
    if (mode === 'choose-enchant' && enchantAction) {
      return (enchantAction.players ?? []).includes(pid)
    }
    if (mode === 'attackers' && attackAction) {
      return canSendPicksAt(pid)
    }
    if (mode === 'proliferate' && proliferateAction) {
      return proliferateAction.eligible.some((t) => t.kind === 'player' && t.player === pid)
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
    // Both halves of "is this attacking someone": a declaration this seat is
    // still building (`attackAssignments`, mine only) and an attack already
    // on the board (`obj.attacking`, which every seat sees).
    // Every creature the tile stands for, a compacted stack as its members
    // (game/stackMembers.ts) while a combat declaration is being built.
    const members = expandIds(ids, stackMembers)
    const assignedAt = members.map((m) => attackAssignments[m]).find((d) => d !== undefined)
    // A creature entering attacking whose target is still being chosen
    // (rule 508.4) attacks its first option meanwhile, as far as the view
    // says — that's a placeholder, not a choice, so the tile shows none.
    const choosingTarget =
      enterAttackingAction?.creatures.some((c) => members.includes(c.object)) ?? false
    const aimedAt = assignedAt ?? (choosingTarget ? null : obj.attacking) ?? null
    const attackSeat = aimedAt === null ? null : attackSeatClass(aimedAt)

    if (obj.attacking && !choosingTarget) badge = `⚔ ${attackTargetLabel(obj.attacking)}`
    else if (obj.blocking) badge = `\u{1F6E1} ${game.nameOf(obj.blocking)}`
    else if (obj.isCommander) badge = 'Commander'

    if (mode === 'targeting') {
      highlight = ids.some((i) =>
        targetSlot.some((o) => o.kind === 'object' && o.object === i),
      )
      selected = ids.some((i) => pickedObjKeys.has(i))
    } else if (mode === 'attackers' && attackAction) {
      // An opponent's planeswalker is a legal defender: highlight it once a
      // group is waiting, so it can be clicked as the attack target.
      const isDefenderPw = Boolean(view.objects[id]) && canSendPicksAt(id)
      const free = freeAttacker(members, attackAction.eligible, attackAssignments, attackPicks)
      const attacking = members.filter((m) => attackAssignments[m] !== undefined)
      const picked = members.filter((m) => attackPicks.includes(m))
      highlight = free !== null || isDefenderPw
      selected = attacking.length > 0 || picked.length > 0
      // A tile of several: how many of them attack, its count row in the
      // bar says whom. One creature: whom it attacks.
      if (attacking.length > 0) {
        badge =
          members.length > 1
            ? `⚔ ${attacking.length}/${members.length}`
            : `⚔ ${attackTargetLabel(attackAssignments[attacking[0]])}`
      }
      // A selected-but-unpointed attacker is a distinct state from an
      // assigned one, and the board has to say which is which.
      else if (picked.length > 0) badge = members.length > 1 ? `⚔ ? ×${picked.length}` : '⚔ ?'
    } else if (mode === 'blockers' && blockAction) {
      // Over every creature the tile stands for (folded tokens, or a
      // compacted stack's members).
      const isBlocker = members.some((i) => blockAction.eligible.some((e) => e.blocker === i))
      const blocking = members.filter((i) => blockAssign[i] !== undefined)
      const focusedCanHit =
        blockFocus !== null && leastBlocked(members, blockFocus, blockAction, blockAssign) !== null
      highlight = isBlocker || focusedCanHit
      selected = blocking.length > 0 || (blockFocus !== null && members.includes(blockFocus))
      if (blocking.length > 0) {
        badge =
          members.length > 1
            ? `\u{1F6E1} ${blocking.length}/${members.length}`
            : `\u{1F6E1} ${game.nameOf(blockAssign[blocking[0]])}`
      }
    } else if (mode === 'assign-combat-damage' && assignDamageAction && damageAnswer) {
      const members = damageMembersOf(ids)
      if (members.length > 0) {
        const dmg = totalOf(members, damageAnswer)
        const dead = deathCount(assignDamageAction, members, damageAnswer, damageSurvivors)
        highlight = true
        selected = lethalCount(assignDamageAction, members, damageAnswer) > 0
        // The amount, on the creature it's going to: with a crowd blocking,
        // the board is where you can see which one is which. A folded token
        // stack says how many of it die, the way a sacrifice does.
        if (members.length > 1 && dead > 0) badge = `☠ ${dead}/${members.length}`
        else if (dmg > 0) badge = `${dmg} dmg${dead > 0 ? ' ☠' : ''}`
      }
    } else if (mode === 'choose-sacrifice' && pendingSac?.sacrifice !== undefined) {
      const choices = pendingSac.sacrifice.choices
      highlight = ids.some((i) => choices.includes(i))
    } else if (mode === 'choose-tap' && pendingTap) {
      // Over every permanent the tile stands for: several identical ones
      // folded together, or one of the engine's token stacks.
      const { offer, picks } = pendingTap
      const members = ids.filter((i) => offer.choices.includes(i))
      const taken = picks.filter((x) => members.includes(x)).length
      const of = members.reduce((n, i) => n + (offer.copies?.[i] ?? 1), 0)
      highlight = of > taken
      selected = taken > 0
      if (of > 1 && taken > 0) badge = `↷ ${taken}/${of}`
    } else if (mode === 'choose-convoke' && pendingConvoke) {
      const { offer, picks } = pendingConvoke
      const members = ids.filter((i) => offer.candidates.includes(i))
      const taken = picks.filter((x) => members.includes(x)).length
      const of = members.reduce((n, i) => n + (offer.copies?.[i] ?? 1), 0)
      highlight = of > taken && picks.length < offer.maxCreatures
      selected = taken > 0
      if (of > 1 && taken > 0) badge = `↷ ${taken}/${of}`
    } else if (mode === 'choose-enchant' && enchantAction) {
      highlight = enchantAction.options.includes(id)
    } else if (mode === 'choose-copy' && copyChoiceAction) {
      highlight = ids.some((i) => copyChoiceAction.options.includes(i))
    } else if (mode === 'legend-rule' && legendAction) {
      highlight = legendAction.options.includes(id)
    } else if (mode === 'sacrifice' && sacrificeAction) {
      const taken = sacrificePicks.filter((x) => x === id).length
      const of = sacrificeAction.copies?.[id] ?? 1
      highlight = sacrificeAction.eligible.includes(id) && taken === 0
      selected = taken > 0
      // A stack gives up some of itself, so the tile has to say how many —
      // "selected" alone can't tell three of nine from nine of nine.
      if (of > 1 && taken > 0) badge = `☠ ${taken}/${of}`
    } else if (mode === 'choose-permanents' && choosePermanentsAction) {
      const taken = permanentPicks.filter((x) => x === id).length
      const of = choosePermanentsAction.copies?.[id] ?? 1
      highlight = choosePermanentsAction.eligible.includes(id) && taken === 0
      selected = taken > 0
      if (of > 1 && taken > 0) badge = `✓ ${taken}/${of}`
    } else if (mode === 'proliferate' && proliferateAction) {
      const picked = proliferatePicks.some((t) => t.kind === 'object' && t.object === id)
      highlight = eligibleToProliferate(proliferateAction, id) && !picked
      selected = picked
    } else if (mode === 'priority' && ownerSeat === seat) {
      activatable = ids.some((i) => abilitiesBySource.has(i))
      selected = selectedSource !== null && ids.includes(selectedSource)
    }

    // Any of the permanents the tile stands for (a folded land stack).
    const aimedBy = aim !== null && ids.some((i) => aim.objects.has(i)) ? aim.by : null
    // A tile of several attacking tokens: how many of them are blocked —
    // declared (`blocked`, which every seat sees, and which stays true once
    // the blockers are gone) or, while this seat is still choosing, picked
    // in its own block bar.
    const pendingBlocked = mode === 'blockers' ? new Set(Object.values(blockAssign)) : null
    const blockedCount =
      obj.attacking !== null && ids.length > 1
        ? ids.filter((i) => view.objects[i]?.blocked || pendingBlocked?.has(i)).length
        : 0
    const goaders = obj.goadedBy
      .filter((p) => view.turnOrder.includes(p))
      .map((p) => ({ seat: seatClassOf(view.turnOrder, p), name: playerLabel(p, game.seats) }))
    const enchanting =
      obj.attachedToPlayer !== null && view.turnOrder.includes(obj.attachedToPlayer)
        ? { seat: seatClassOf(view.turnOrder, obj.attachedToPlayer), name: playerLabel(obj.attachedToPlayer, game.seats) }
        : null
    if (opts.mini) {
      return (
        <MiniTile
          key={id}
          obj={obj}
          highlight={highlight}
          selected={selected}
          activatable={activatable}
          badge={badge}
          stackCount={opts.stackCount ?? null}
          blockedCount={blockedCount}
          attackSeat={attackSeat}
          aimedBy={aimedBy}
          goaders={goaders}
          enchanting={enchanting}
          held={(obj.holding ?? []).map((h) => ({ id: h, obj: view.objects[h] ?? null }))}
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
        stackCount={opts.stackCount ?? null}
        attackSeat={attackSeat}
        aimedBy={aimedBy}
        goaders={goaders}
        enchanting={enchanting}
        onClick={() => clickPermanent(ids)}
      />
    )
  }

  const renderBoard = (pid: PlayerId, isOpp: boolean, landsBelow: boolean) => {
    // Your own board is in the order you've dragged it into; everyone
    // else's is as the board lays it out (`computeBoardEntries`).
    const own = pid === seat
    const entries = own
      ? applyBoardOrder(computeBoardEntries(view, pid), boardDrag.order)
      : computeBoardEntries(view, pid)
    const lands = entries.filter((e) => e.bucket === 'land')
    // Creatures, artifacts, and enchantments all share one area — no
    // per-type labels or sub-columns, just "everything that isn't a land".
    const permanents = entries.filter((e) => e.bucket !== 'land')

    const { drag } = boardDrag
    const renderEntries = (list: readonly BoardEntry[], row: 'lands' | 'permanents') => (
      <div className="board-row-cards" data-drag-row={own ? row : undefined}>
        {list.map((entry) => {
          const dragged = own && drag !== null && entry.ids.includes(drag.key)
          const dropSide =
            own && drag?.drop && entry.ids.includes(drag.drop.key)
              ? drag.drop.after
                ? ' drop-after'
                : ' drop-before'
              : ''
          return (
          <div
            className={`board-entry${own ? ' draggable' : ''}${dragged ? ' dragging' : ''}${dropSide}`}
            key={entry.ids[0]}
            data-obj-ids={entry.ids.join(' ')}
            style={dragged ? { translate: `${drag.dx}px ${drag.dy}px` } : undefined}
            onPointerDown={own ? (e) => boardDrag.start(e, entry.ids[0]) : undefined}
            // The art is an image the browser would drag natively, which
            // cancels the pointer stream this drag runs on.
            onDragStart={own ? (e) => e.preventDefault() : undefined}
          >
            {tileFor(entry.sample, pid, entry.ids, {
              // Identical permanents folded here in the client, each of which
              // may itself be one of the engine's compacted token stacks —
              // see `BoardEntry.count`.
              stackCount: entry.count,
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
          )
        })}
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
        {renderEntries(lands, 'lands')}
      </div>
    )
    const permanentRow = (
      <div className="board-row" key="permanents">
        {renderEntries(permanents, 'permanents')}
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
   * (art and cost, the full card on hover) rather than as a full `CardTile`
   * — see `CommanderTile`. */
  const commandZoneTile = (obj: VisibleObject, paired = false) => {
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
        paired={paired}
      />
    )
  }

  /** A library's revealed top card (Oracle of Mul Daya's "play with the top
   * card of your library revealed"). Not a permanent, so not `tileFor`: that
   * drew a full-height card in a rail sized for a squat pile, and routed its
   * clicks to the battlefield handler, which knows nothing of playing a card.
   * It's playable the way a hand card is — the engine offers a `play-land`
   * (or `cast-spell`) naming it — so it goes through `clickHandCard`, and is
   * drawn as it would be in the hand, scaled down to the face-down pile's
   * box (`.library-top`). A card playable more than one way (a modal
   * double-faced card's two land faces) gets a button per way, as in the
   * hand. */
  const libraryTopTile = (obj: VisibleObject) => {
    const faceOpts = mode === 'priority' ? (playFacesByCard.get(obj.id) ?? []) : []
    return (
      <>
        <div className="library-top" key={obj.id}>
          <CardTile
            obj={obj}
            layout="art-first"
            highlight={faceOpts.length > 0}
            onClick={() => clickHandCard(obj.id)}
          />
        </div>
        {faceOpts.length > 1
          ? faceOpts.map((a, i) => (
              <button key={i} type="button" onClick={() => playFace(a)}>
                {a.kind === 'play-land' ? 'Play' : 'Cast'} {a.cardName}
              </button>
            ))
          : null}
      </>
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
          <div className="side-zone-label">
            Command{commandIds.length > 1 ? ` (${commandIds.length})` : ''}
          </div>
          {/* Partners (rule 702.124) share the one slot as tiles of their
              own, each with a shorter art box so both fit: the rail is a
              single card wide and height-capped, and two full-height tiles
              would push the library off the bottom of the quadrant. */}
          <div className={`side-zone-cards${commandIds.length > 1 ? ' command-stack' : ''}`}>
            {commandIds.length > 0 ? (
              commandIds.map((id) => {
                const obj = view.objects[id]
                return obj ? commandZoneTile(obj, commandIds.length > 1) : null
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
              libraryTopTile(topObj)
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
  // A layout effect, not a plain one: `Table` remounts on every frame it's
  // shown, so the spacing starts back at HAND_CARD_GAP each time, and
  // measured after the browser had painted, the hand showed one frame at
  // that default before snapping to its real spacing. During the mulligan,
  // where the hand fills the popup and the bots' decisions arrive as a run
  // of frames, that was the hand jittering each time an opponent chose.
  useLayoutEffect(() => {
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

  /** Sizes `boardEl`'s tiles to the largest width at which its rows still fit
   * the height its quadrant gives it (`.quadrant-body`'s content box),
   * wrapping to however many rows that width needs. A sparse board's tiles
   * grow into the room they have; a crowded one's shrink, down to
   * MINI_SHRINK_FLOOR, past which the board scrolls instead. App.css's
   * `.board` rule caps the result at a card in hand's width, so a lone land
   * on an empty board doesn't balloon to fill it.
   *
   * A binary search over the width, rather than a step loop or a ratio-based
   * guess: reflowed wrap counts don't scale linearly with tile size, but a
   * wider tile never makes the rows any shorter, so "does it fit at w" is
   * monotonic. That's about a dozen layouts per board, and cheap ones --
   * `.quadrant-body` is a size container, so nothing outside it relayouts.
   * Re-searched from scratch every time rather than nudged from wherever it
   * last landed, so a board grows back as soon as it has room again (a
   * creature dying, say). */
  const recomputeBoardMiniW = (boardEl: HTMLDivElement) => {
    const scrollArea = boardEl.closest<HTMLElement>('.quadrant-body')
    const first = boardEl.firstElementChild
    const last = boardEl.lastElementChild
    if (
      !scrollArea ||
      !(first instanceof HTMLElement) ||
      !(last instanceof HTMLElement)
    ) {
      return
    }
    const area = getComputedStyle(scrollArea)
    const available =
      scrollArea.clientHeight - parseFloat(area.paddingTop) - parseFloat(area.paddingBottom)
    const own = getComputedStyle(boardEl)
    const chrome =
      parseFloat(own.paddingTop) +
      parseFloat(own.paddingBottom) +
      parseFloat(own.borderTopWidth) +
      parseFloat(own.borderBottomWidth)
    // The rows' own extent, not the board's box. The board is stretched to
    // its quadrant's full height (`.quadrant-body .board-with-sidezone`), so
    // its box is as tall as the command/library rail beside it however small
    // the tiles get -- measuring that is what pinned every board at the
    // floor, since a rail a few pixels taller than its quadrant read as a
    // board that no tile size could ever fit. offsetTop/offsetHeight, not
    // getBoundingClientRect: a tapped tile's rotation is visual overflow,
    // which mustn't count as the board needing less room.
    const fits = (width: number): boolean => {
      boardEl.style.setProperty('--mini-w-fit', `${width}px`)
      return last.offsetTop + last.offsetHeight - first.offsetTop + chrome <= available
    }
    // A tile is never wider than its board, and past App.css's cap every
    // width lays out the same, so this bound only has to be big enough.
    let lo = MINI_SHRINK_FLOOR
    let hi = Math.max(lo, boardEl.clientWidth)
    // Crowded even at the floor: leave it there and let the board scroll.
    if (!fits(lo)) return
    if (fits(hi)) return
    while (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2)
      if (fits(mid)) lo = mid
      else hi = mid
    }
    // The last probe may have been a miss; settle on the widest fit.
    fits(lo)
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
  // By the view's owner list, which a face-down card is on too: it has no
  // object here for any seat that can't look at it.
  const exileOf = (pid: PlayerId): readonly ObjectId[] =>
    view.zones.exile.filter((id) => view.zones.exileOwners[id] === pid)
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
        <button type="button" onClick={() => window.location.assign('/')}>
          Main menu
        </button>
      </div>
    )
  } else if (mode === 'choose-enchant' && enchantAction) {
    // The Aura may still be somewhere this seat can't see (a library it's
    // being tutored out of), so its name comes with the decision.
    controls = (
      <div className="controls">
        <span>
          {view.decisionSource?.cardName ?? game.nameOf(enchantAction.source)} is entering the
          battlefield — click {(enchantAction.players ?? []).length > 0 ? 'the player' : 'what'} it enchants.
        </span>
      </div>
    )
  } else if (mode === 'order-triggers' && triggerOrderAction) {
    controls = (
      <TriggerOrder
        triggers={triggerOrderAction.triggers}
        onConfirm={(order) => game.dispatch({ type: 'order-triggers', player: seat, order })}
      />
    )
  } else if (mode === 'legend-rule' && legendAction) {
    // Copies of one legend share a name, so buttons couldn't tell them apart:
    // the choice is made on the board, where each shows its own state.
    controls = (
      <div className="controls">
        <span>
          You control more than one {legendAction.name} — click the one to keep. The rest go to
          the graveyard.
        </span>
        <button
          type="button"
          onClick={() =>
            game.dispatch({ type: 'legend-rule', player: seat, keep: legendAction.options[0] })
          }
        >
          Keep the oldest
        </button>
      </div>
    )
  } else if (mode === 'choose-copy' && copyChoiceAction) {
    // Picked on the board, where each permanent shows what it is (Clone's
    // options are creatures, Vesuva's lands, Sculpting Steel's artifacts): two copies
    // of one card are two buttons with the same name.
    controls = (
      <div className="controls">
        <span>{game.nameOf(copyChoiceAction.source)} — click the permanent to copy</span>
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
  } else if (mode === 'choose-creature-type' && creatureTypeChoiceAction?.catalog) {
    // The full creature-type catalog is far too many buttons for this strip —
    // it's answered in the `CreatureTypePicker` popup rendered below.
    controls = (
      <div className="controls">
        <span>{game.nameOf(creatureTypeChoiceAction.source)} — choosing a creature type</span>
        {decisionCollapsed ? (
          <button type="button" onClick={() => setDecisionCollapsed(false)}>
            Show choices
          </button>
        ) : null}
      </div>
    )
  } else if (mode === 'choose-creature-type' && creatureTypeChoiceAction) {
    // A short fixed menu reusing the same decision (Heraldic Banner's colours,
    // Frontier Siege's Khans/Dragons) — plain buttons still fit.
    controls = (
      <div className="controls">
        <span>{game.nameOf(creatureTypeChoiceAction.source)} — choose one</span>
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
    const { minModes, maxModes, modeTexts, modePlayers, source, ward, about, sameForAll } = modesChoiceAction
    // A choice among players (Tasigur's "you choose an opponent") reads with
    // their names; the engine's own text names the seat.
    const modeLabel = (i: number): ReactNode => {
      const player = modePlayers?.[i] ?? null
      return player !== null ? `Choose ${playerLabel(player, game.seats)}` : <Symbols text={modeTexts[i]} />
    }
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
            ? <Symbols text={modeTexts[0]} />
            : single
              ? 'choose one'
              : `choose ${minModes === maxModes ? minModes : `${minModes}–${maxModes}`}`}
          {/* The same question once per player (myriad): which one this is. */}
          {about !== undefined ? ` — ${playerLabel(about, game.seats)}` : ''}
        </span>
        {optional ? (
          <>
            <button
              type="button"
              onClick={() => game.dispatch({ type: 'choose-modes', player: seat, modes: [0] })}
            >
              {ward ? 'Pay' : 'Yes'}
            </button>
            <button
              type="button"
              onClick={() => game.dispatch({ type: 'choose-modes', player: seat, modes: [] })}
            >
              {ward ? `Don't pay` : 'No'}
            </button>
            {/* Identical triggers still on the stack under this one: answer
                them all now. Each still resolves on its own. */}
            {sameForAll !== undefined && (
              <>
                <button
                  type="button"
                  title={`The same answer for this trigger and the ${sameForAll} identical ${sameForAll === 1 ? 'one' : 'ones'} under it on the stack`}
                  onClick={() =>
                    game.dispatch({ type: 'choose-modes', player: seat, modes: [0], forAll: true })
                  }
                >
                  Yes to all {sameForAll + 1}
                </button>
                <button
                  type="button"
                  title={`The same answer for this trigger and the ${sameForAll} identical ${sameForAll === 1 ? 'one' : 'ones'} under it on the stack`}
                  onClick={() =>
                    game.dispatch({ type: 'choose-modes', player: seat, modes: [], forAll: true })
                  }
                >
                  No to all {sameForAll + 1}
                </button>
              </>
            )}
          </>
        ) : single ? (
          modeTexts.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => game.dispatch({ type: 'choose-modes', player: seat, modes: [i] })}
            >
              {modeLabel(i)}
            </button>
          ))
        ) : (
          <>
            {modeTexts.map((_, i) => (
              <button
                key={i}
                type="button"
                className={modePicks.includes(i) ? 'selected' : undefined}
                onClick={() => toggle(i)}
              >
                {modeLabel(i)}
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
    // Spree (rule 702.172a): each mode adds its own cost, so only some sets
    // of modes can be paid for together — the offer's `modeSets`. A mode is
    // open while some payable set holds it beside what's picked, and Confirm
    // waits for picks that are one of those sets.
    const sets = cm.modeSets
    const fits = (picks: readonly number[]) =>
      sets === undefined || sets.some((s) => picks.every((p) => s.includes(p)))
    const complete =
      sets === undefined
        ? picked.length >= cm.minModes && picked.length <= cm.maxModes
        : sets.some((s) => s.length === picked.length && picked.every((p) => s.includes(p)))
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
            disabled={(uncastable(i) || !fits([...picked, i])) && !picked.includes(i)}
            onClick={() => toggle(i)}
          >
            <Symbols text={m.text} />
          </button>
        ))}
        <button
          type="button"
          disabled={!complete}
          onClick={confirmModes}
        >
          Confirm
        </button>
        <button type="button" onClick={() => setPendingModes(null)}>
          Cancel
        </button>
      </div>
    )
  } else if (mode === 'choose-tap' && pendingTap) {
    const { action, offer, picks } = pendingTap
    const what =
      action.type === 'cast-spell' || action.type === 'activate-ability'
        ? game.nameOf(action.type === 'cast-spell' ? action.card : action.source)
        : ''
    controls = (
      <div className="controls">
        <span>
          {what}: tap {offer.count} — {picks.length}/{offer.count} chosen
        </span>
        <button
          type="button"
          disabled={picks.length !== offer.count}
          onClick={() => {
            setPendingTap(null)
            game.dispatch({ ...action, tap: [...picks] } as Action)
          }}
        >
          Confirm
        </button>
        <button type="button" onClick={() => setPendingTap(null)}>
          Cancel
        </button>
      </div>
    )
  } else if (mode === 'choose-division' && pendingDivision) {
    // At least 1 each, all of it (rule 601.2d): a share can grow only by what
    // the others can spare.
    const { total, targets: divTargets, shares, resume } = pendingDivision
    const sum = shares.reduce((a, b) => a + b, 0)
    controls = (
      <div className="controls">
        <span>
          Divide {total} damage — {sum}/{total}
        </span>
        <span className="stack-counts">
          {divTargets.map((ref, i) => (
            <CountStepper
              key={ref.kind === 'player' ? ref.player : ref.object}
              label={ref.kind === 'player' ? playerLabel(ref.player, game.seats) : game.nameOf(ref.object)}
              count={shares[i]}
              max={total - (divTargets.length - 1)}
              onChange={(n) =>
                setPendingDivision((cur) =>
                  cur === null ? cur : { ...cur, shares: cur.shares.map((v, j) => (j === i ? Math.max(1, n) : v)) },
                )
              }
            />
          ))}
        </span>
        <button
          type="button"
          disabled={sum !== total}
          onClick={() => {
            setPendingDivision(null)
            resume(shares)
          }}
        >
          Cast
        </button>
        <button type="button" onClick={() => setPendingDivision(null)}>
          Cancel
        </button>
      </div>
    )
  } else if (mode === 'choose-convoke' && pendingConvoke) {
    const { action, offer, picks } = pendingConvoke
    const name = action.type === 'cast-spell' ? game.nameOf(action.card) : ''
    controls = (
      <div className="controls">
        <span>
          {name}: convoke — tap up to {offer.maxCreatures} creature
          {offer.maxCreatures === 1 ? '' : 's'} to help pay ({picks.length} chosen)
        </span>
        <button
          type="button"
          disabled={!offer.manaAffordable && picks.length === 0}
          onClick={() => {
            setPendingConvoke(null)
            game.dispatch(
              picks.length === 0
                ? action
                : ({ ...action, convoke: picks.map((creature) => ({ creature })) } as Action),
            )
          }}
        >
          {picks.length === 0 ? 'Pay with mana' : `Convoke ${picks.length}`}
        </button>
        <button type="button" onClick={() => setPendingConvoke(null)}>
          Cancel
        </button>
      </div>
    )
  } else if (mode === 'sacrifice' && sacrificeAction) {
    controls = (
      <div className="controls">
        <span>
          {view.decisionSource ? `${view.decisionSource.cardName}: ` : ''}
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
  } else if (mode === 'choose-permanents' && choosePermanentsAction) {
    const { min, max } = choosePermanentsAction
    controls = (
      <div className="controls">
        <span>
          {view.decisionSource ? `${view.decisionSource.cardName}: ` : ''}
          {choosePermanentsAction.prompt} — {permanentPicks.length}/{max} chosen
        </span>
        <button
          type="button"
          disabled={permanentPicks.length === 0}
          onClick={() => setPermanentPicks([])}
        >
          Clear
        </button>
        <button
          type="button"
          disabled={permanentPicks.length < min || permanentPicks.length > max}
          onClick={() =>
            game.dispatch({ type: 'choose-permanents', player: seat, permanents: [...permanentPicks] })
          }
        >
          Confirm
        </button>
      </div>
    )
  } else if (mode === 'proliferate' && proliferateAction) {
    // A player's own counters are theirs to want, poison aside.
    const mine = proliferateAction.eligible.filter((t) =>
      t.kind === 'player'
        ? t.player === seat && (view.players[seat]?.counters.poison ?? 0) === 0
        : view.objects[t.object]?.controller === seat,
    )
    // Permanents and players alike are picked on the board: a player's
    // panel shows the counters they have.
    controls = (
      <div className="controls">
        <span>
          {view.decisionSource ? `${view.decisionSource.cardName}: ` : ''}
          Proliferate — click the permanents and players to add counters to ·{' '}
          {proliferatePicks.length} chosen
        </span>
        {/* Atraxa asks this every end step, and the answer is nearly always
            "everything of mine" — so that has to be one click, not five. */}
        <button type="button" onClick={() => setProliferatePicks(mine)}>
          All mine
        </button>
        <button
          type="button"
          disabled={proliferatePicks.length === 0}
          onClick={() => setProliferatePicks([])}
        >
          Clear
        </button>
        {/* Never disabled: choosing nothing is a legal answer (rule 701.27a). */}
        <button
          type="button"
          onClick={() =>
            game.dispatch({
              type: 'proliferate',
              player: seat,
              chosen: [...proliferatePicks],
            })
          }
        >
          Confirm
        </button>
      </div>
    )
  } else if (mode === 'commander-replacement' && commanderChoiceAction) {
    // A commander in a graveyard or exile is already there (rule 903.9a); one
    // headed for a hand or library hasn't moved yet (903.9b).
    const cmdZone = commanderChoiceAction.intendedZone
    const cmdThere = cmdZone === 'graveyard' || cmdZone === 'exile'
    const cmdZoneName = cmdZone === 'exile' ? 'exile' : `your ${cmdZone}`
    controls = (
      <div className="controls">
        <span>
          {game.nameOf(commanderChoiceAction.commander)}{' '}
          {cmdThere
            ? `is in ${cmdZoneName} — move it to the command zone?`
            : `would go to ${cmdZoneName} — move it to the command zone instead?`}
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
          {cmdThere ? `Leave in ${cmdZone}` : `Put into ${cmdZone}`}
        </button>
      </div>
    )
  } else if (mode === 'cast-now' && castNowAction) {
    // "You may cast [a card]" while something resolves: each way to cast it
    // runs the ordinary cast steps, and the finished cast goes out as the
    // decision's answer (`useNetworkGame`'s `dispatch` wraps it). With
    // several cards on offer the card is picked in the popup first.
    const card = castNowPicking ? castNowPick : (castNowAction.cards[0] ?? null)
    const ways = card === null ? [] : castNowAction.casts.filter((c) => c.card === card)
    // "You may play the exiled card" (hideaway): a land is played, not cast.
    const landWays = card === null ? [] : (castNowAction.lands ?? []).filter((l) => l.card === card)
    const verb = landWays.length > 0 ? 'Play' : 'Cast'
    controls = card === null ? (
      <div className="controls">
        <span className="muted">
          {decisionCollapsed ? 'Choosing a spell to cast' : 'Look at the popup to choose'}
        </span>
        {decisionCollapsed ? (
          <button type="button" onClick={() => setDecisionCollapsed(false)}>
            Show choices
          </button>
        ) : null}
      </div>
    ) : (
      <div className="controls">
        <span>
          {verb} {ways[0]?.cardName ?? landWays[0]?.cardName ?? game.nameOf(card)}
          {castNowAction.free && ways.length > 0 ? ' without paying its mana cost' : ' now'}?
        </span>
        {landWays.map((l, i) => (
          <button
            key={`land-${i}`}
            type="button"
            onClick={() =>
              game.dispatch({
                type: 'cast-now',
                player: seat,
                cast: { type: 'play-land', player: seat, card: l.card, ...(l.face !== undefined ? { face: l.face } : {}) },
              })
            }
          >
            Play {l.cardName}
          </button>
        ))}
        {ways.map((c, i) => (
          <button key={i} type="button" onClick={() => beginCast(c)}>
            Cast {c.cardName}
            {/* A gift costs no mana: "(gift)", nothing after it. */}
            {c.kicked ? (
              <>
                {' '}({c.kickerKeyword ?? 'kicked'}
                {c.kickerCost ? <> <Symbols text={c.kickerCost} /></> : null})
              </>
            ) : null}
            {c.costOptionText ? <> (<Symbols text={c.costOptionText} />)</> : null}
            {c.free ? ' (free)' : ''}
            {c.prototype ? <> (prototype <Symbols text={c.prototypeCost ?? ''} />)</> : null}
            {c.offspring ? <> (offspring <Symbols text={c.offspringCost ?? ''} />)</> : null}
            {c.evoke ? <> (evoke <Symbols text={c.evokeCost ?? ''} />)</> : null}
          </button>
        ))}
        {castNowPicking ? (
          <button type="button" onClick={() => setCastNowPick(null)}>
            Back
          </button>
        ) : null}
        <button type="button" onClick={() => game.dispatch({ type: 'cast-now', player: seat, cast: null })}>
          {verb === 'Play' ? "Don't play" : "Don't cast"}
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
  } else if (mode === 'reveal-for-untapped' && revealChoiceAction) {
    // Picked in the hand, as a discard is: the cards it could show are lit.
    controls = (
      <div className="controls">
        <span>
          {game.nameOf(revealChoiceAction.source)} — click a card in your hand to reveal it, and
          it enters untapped
        </span>
        <button
          type="button"
          disabled={revealPick === null}
          onClick={() => game.dispatch({ type: 'reveal-for-untapped', player: seat, reveal: revealPick })}
        >
          Reveal
        </button>
        <button
          type="button"
          onClick={() => game.dispatch({ type: 'reveal-for-untapped', player: seat, reveal: null })}
        >
          Enter tapped
        </button>
      </div>
    )
  } else if (mode === 'put-on-bottom' && bottomAction) {
    controls = (
      <div className="controls">
        <span>
          Put {bottomAction.count} card(s) on the bottom of your library — click cards in your
          hand · {bottomPicks.length}/{bottomAction.count}
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
    // An "any number of" group keeps its prompt even over stack targets:
    // Done is how it ends.
    const grouped = inTargetGroup(activeTargeting)
    const groupPicked = grouped ? activeTargeting.picked.length - anyNumberSlot(activeTargeting.specs) : 0
    const slotSpec = currentSpec(activeTargeting)
    // A copy's target can always be kept, whether or not it's still there to
    // click.
    const keep = activeTargeting.current?.[activeTargeting.picked.length]
    const keepLabel =
      keep === undefined
        ? ''
        : keep.kind === 'player'
          ? playerLabel(keep.player, game.seats)
          : view.objects[keep.object]
            ? game.nameOf(keep.object)
            : 'its target'
    controls = allStackTargets && !grouped && keep === undefined ? null : (
      <div className="controls">
        <span>
          {activeTargeting.label}: choose {slotSpec === undefined ? 'a target' : describeTargetSpec(slotSpec)}{' '}
          {grouped
            ? `— ${groupPicked} chosen`
            : `(${activeTargeting.picked.length + 1}/${activeTargeting.specs.length})`}
        </span>
        {zoneTargetIds.length > 0 && zoneTargetCollapsed ? (
          <button type="button" onClick={() => setZoneTargetHidden(null)}>
            Show choices
          </button>
        ) : null}
        {keep !== undefined ? (
          <button type="button" onClick={() => pickTarget(keep)}>
            Keep {keepLabel}
          </button>
        ) : null}
        {grouped ? (
          <button type="button" disabled={!mayFinishGroup(activeTargeting)} onClick={() => pickTarget(null)}>
            Done
          </button>
        ) : slotSpec !== undefined && isOptionalSpec(slotSpec) ? (
          <button
            type="button"
            disabled={!maySkipSlot(activeTargeting)}
            onClick={() => pickTarget(null)}
          >
            Skip
          </button>
        ) : null}
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
    // The choices are picked on the board, where each one is highlighted —
    // a list of names can't tell two Forests apart.
    const noun = sacrificeNoun(pendingSac, view, pendingSac.sacrifice.choices)
    controls = (
      <div className="controls">
        <span>
          {pendingSac.cardName} — choose {/^[aeiou]/i.test(noun) ? 'an' : 'a'} {noun} to sacrifice
        </span>
        <button type="button" onClick={() => setPendingSac(null)}>
          Cancel
        </button>
      </div>
    )
  } else if (mode === 'choose-escape-exile' && pendingEscape) {
    // The choice itself is the ZoneViewer popup below; this strip is what
    // shows under it.
    const n = pendingEscape.offer.count
    controls = (
      <div className="controls">
        <span className="muted">
          {pendingEscape.cast.via === 'escape' ? 'Escape' : 'Cast'} {pendingEscape.cast.cardName} — choose{' '}
          {n} other card{n === 1 ? '' : 's'} to exile
        </span>
        <button type="button" onClick={() => setPendingEscape(null)}>
          Cancel
        </button>
      </div>
    )
  } else if (mode === 'choose-delve' && pendingDelve) {
    // The choice itself is the ZoneViewer popup below.
    const { minCards, maxCards } = pendingDelve.offer
    controls = (
      <div className="controls">
        <span className="muted">
          Delve {pendingDelve.cast.cardName} — exile{' '}
          {minCards === maxCards ? maxCards : `${minCards}–${maxCards}`} card
          {maxCards === 1 ? '' : 's'} from your graveyard, each paying <Symbols text="{1}" />
        </span>
        <button type="button" onClick={() => setPendingDelve(null)}>
          Cancel
        </button>
      </div>
    )
  } else if (mode === 'choose-x' && pendingX) {
    const pxMax = pendingX.action.xCost?.maxX ?? 0
    const pxMin = pendingX.action.xCost?.minX ?? 0
    const pxVerb = pendingX.action.kind === 'activate-ability' ? 'Activate' : 'Cast'
    controls = (
      <div className="controls">
        <span>
          {pxVerb} {pendingX.action.cardName} — choose X
        </span>
        <input
          type="number"
          min={pxMin}
          max={pxMax}
          value={pendingX.value}
          onChange={(e) => {
            const n = Math.max(pxMin, Math.min(pxMax, Math.floor(Number(e.target.value) || 0)))
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
    // Everything not already pointed at someone, and not already waiting.
    const unpicked = attackAction.eligible.filter(
      (id) => attackAssignments[id] === undefined && !attackPicks.includes(id),
    )
    // Where the current group could be sent: a defender every one of them may
    // legally attack. Empty means the selection has no common target — a
    // goaded creature mixed in with ordinary ones does this — and the player
    // has to narrow it rather than have the attack split for them.
    const groupTargets =
      attackPicks.length === 0
        ? []
        : (attackAction.defenders ?? []).filter((d) => canSendPicksAt(d))
    // Creatures that must attack and aren't yet pointed at anyone — the
    // engine's own check against this offer, so Confirm can't disagree with
    // the validator.
    const unmetMusts = attackingViolations(
      Object.entries(attackAssignments).map(([attacker, defender]) => ({
        attacker: attacker as ObjectId,
        defender,
      })),
      attackAction,
    ).map((v) => v.attacker)
    // A tile of several with some attacking: a count per defender, rather
    // than a click per creature (game/attackGroups.ts).
    const pairs = attackPairs(attackAssignments, attackPicks, defendersFor, tileOf)
    // What attacking costs (Ghostly Prison, Propaganda): each creature sent
    // at a taxing player, at that player's rate. Past the budget the engine
    // checks the payment exactly, so this warns rather than blocks.
    const taxRates = attackAction.attackTax?.perCreature as Readonly<Record<string, number>> | undefined
    const attackTax = Object.values(attackAssignments).reduce((n, d) => n + (taxRates?.[d] ?? 0), 0)
    const overBudget = attackTax > (attackAction.attackTax?.budget ?? 0)
    controls = (
      <div className="controls">
        <span>
          {enterAttackingAction !== undefined
            ? // Rule 508.4: each creature put onto the battlefield attacking
              // needs a target, so the count is out of all of them.
              `${view.decisionSource ? `${view.decisionSource.cardName}: ` : ''}choose what each attacks — ${assignedCount} of ${attackAction.eligible.length}`
            : `Declare attackers — ${assignedCount} attacking`}
          {attackPicks.length > 0 ? `, ${attackPicks.length} selected` : ''}
          {attackPicks.length > 0
            ? groupTargets.length > 0
              ? ' · click who they attack'
              : ' · no one legal for all of them — narrow the selection'
            : ''}
          {unmetMusts.length > 0 && enterAttackingAction === undefined
            ? ` · ${unmetMusts.map((id) => game.nameOf(id)).join(', ')} must attack`
            : ''}
          {attackTax > 0 ? (
            <>
              {' '}
              · costs <Symbols text={`{${attackTax}}`} /> to attack
              {overBudget ? ' — more than you can surely pay' : ''}
            </>
          ) : null}
        </span>
        {pairs.length > 0 ? (
          <span className="stack-counts">
            {pairs.map((p) => (
              <CountStepper
                key={`${p.attackers[0]}>${p.defender}`}
                label={`${game.nameOf(p.attackers[0])} → ${attackTargetLabel(p.defender)}`}
                count={p.count}
                max={p.max}
                onChange={(n) =>
                  setAttackAssignments((cur) => setAttackPairCount(p, n, attackPicks, defendersFor, cur))
                }
              />
            ))}
          </span>
        ) : null}
        {unpicked.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              // As a click on each would: a creature with only one legal
              // defender (every one, at a two-player table without a
              // planeswalker) is sent there outright, and only those with a
              // real choice wait in the group for the player to point.
              const single = unpicked.filter((id) => defendersFor(id).length === 1)
              const choosing = unpicked.filter((id) => defendersFor(id).length !== 1)
              if (single.length > 0) {
                setAttackAssignments((cur) => ({
                  ...cur,
                  ...Object.fromEntries(single.map((id) => [id, defendersFor(id)[0]])),
                }))
              }
              if (choosing.length > 0) setAttackPicks((cur) => [...cur, ...choosing])
            }}
          >
            {unpicked.every((id) => defendersFor(id).length === 1) ? 'All attack' : 'Select all'}
          </button>
        ) : null}
        {attackPicks.length > 0 ? (
          <button type="button" onClick={() => setAttackPicks([])}>
            Clear
          </button>
        ) : null}
        <button type="button" disabled={unmetMusts.length > 0} onClick={confirmAttackers}>
          {enterAttackingAction !== undefined
            ? 'Confirm'
            : assignedCount === 0
              ? 'No attacks'
              : `Attack with ${assignedCount}`}
        </button>
      </div>
    )
  } else if (mode === 'blockers' && blockAction) {
    const n = Object.keys(blockAssign).length
    // The set-level rules (menace, Lure) are the engine's own check against
    // this same offer, so Confirm can't disagree with the validator.
    const violations = blockingViolations(
      Object.entries(blockAssign).map(([blocker, attacker]) => ({
        blocker: blocker as ObjectId,
        attacker,
      })),
      blockAction,
    )
    const loneMenace = violations.flatMap((v) => (v.kind === 'menace' ? [v.attacker] : []))
    const unforcedBlockers = violations.flatMap((v) =>
      v.kind === 'must-be-blocked' ? [v.blocker] : [],
    )
    const unblockedMusts = violations.flatMap((v) =>
      v.kind === 'must-be-blocked-if-able' ? [v.attacker] : [],
    )
    // A folded tile of yours with blocks out: a count to set, rather than a
    // click per creature (game/blockGroups.ts).
    const pairs = blockPairs(blockAction, blockAssign, tileOf)
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
          {unblockedMusts.length > 0
            ? ` · ${unblockedMusts
                .map((id) => game.nameOf(id))
                .join(', ')} must be blocked if able`
            : ''}
        </span>
        {pairs.length > 0 ? (
          <span className="stack-counts">
            {pairs.map((p) => (
              <CountStepper
                key={`${p.blockers[0]}>${p.attackers[0]}`}
                label={`${game.nameOf(p.blockers[0])} → ${game.nameOf(p.attackers[0])}${
                  p.attackers.length > 1 ? ` ×${p.attackers.length}` : ''
                }`}
                count={p.count}
                max={p.max}
                onChange={(n) => setBlockAssign((cur) => setPairCount(p, n, blockAction, cur))}
              />
            ))}
          </span>
        ) : null}
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
          disabled={
            loneMenace.length > 0 || unforcedBlockers.length > 0 || unblockedMusts.length > 0
          }
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
            ? `${view.decisionSource ? `${view.decisionSource.cardName}: ` : ''}Discard ${
                discardAction.count
              } card${discardAction.count === 1 ? '' : 's'}`
            : 'Discard to hand size'}
          {discardAction.orOneOf !== undefined ? ', or one land card' : ''}{' '}
          — click cards in your hand · {discardPicks.length}/{discardAction.count}
        </span>
        <button
          type="button"
          disabled={
            discardPicks.length !== discardAction.count &&
            !(discardPicks.length === 1 && (discardAction.orOneOf ?? []).includes(discardPicks[0]))
          }
          onClick={confirmDiscard}
        >
          Discard
        </button>
      </div>
    )
  } else if (mode === 'choose-from-zone' && zoneChoiceAction) {
    controls = (
      <div className="controls">
        <span className="muted">
          {decisionCollapsed ? 'Choosing from a set of cards' : 'Look at the popup to choose'}
        </span>
        {decisionCollapsed ? (
          <button type="button" onClick={() => setDecisionCollapsed(false)}>
            Show choices
          </button>
        ) : null}
      </div>
    )
  } else if (mode === 'scry' && scryAction) {
    controls = (
      <div className="controls">
        <span className="muted">
          {scryAction.mode === 'surveil' ? 'Surveil' : 'Scry'} — pick cards to
          move {scryAction.mode === 'surveil' ? 'to your graveyard' : 'to the bottom'}
        </span>
        {decisionCollapsed ? (
          <button type="button" onClick={() => setDecisionCollapsed(false)}>
            Show choices
          </button>
        ) : null}
      </div>
    )
  } else if (mode === 'assign-combat-damage' && assignDamageAction && damageAnswer) {
    // Starts at the engine's standard split: kill as many blockers as
    // possible, the cheapest first, then trample the rest over or leave it on
    // a blocker. Any split is legal (there's no damage assignment order since
    // Foundations); only trampling over needs lethal on every blocker.
    //
    // A row per group of interchangeable blockers rather than per blocker
    // (see game/damageAssignment.ts), scrolling past a few, with the board
    // taking clicks for the same choice. One input per blocker made a token
    // stack of twenty blocking into a panel taller than the quadrant under it.
    const offer = assignDamageAction
    const picks = damageAnswer
    const free = unassigned(offer, picks)
    const everyone = offer.blockers.map((_, i) => i)
    const allLethal = lethalCount(offer, everyone, picks) === offer.blockers.length
    const dead = deathCount(offer, everyone, picks, damageSurvivors)
    // Rule 510.1c, from the engine. Its `whyCannot` runs the same function on
    // the same offer, so a split this button enables is one the server takes.
    const valid = damageAssignmentViolations(offer, picks) === null
    const attacked = view.objects[offer.attacker]?.attacking ?? null
    const overTo = attacked === null ? 'the defender' : attackTargetLabel(attacked)
    const status =
      free > 0
        ? offer.trample
          ? allLethal
            ? `→ ${overTo}: ${free}`
            : `${free} left · trample needs lethal on all`
          : `${free} left to assign`
        : offer.trample
          ? `→ ${overTo}: 0`
          : null
    controls = (
      <div className="controls damage-assign">
        <span>
          Assign {game.nameOf(offer.attacker)}&rsquo;s {offer.power} damage
          {offer.trample ? ' (trample)' : ''}
          <span className="muted"> · click a blocker to kill or spare it</span>
        </span>
        <div className="damage-rows">
          {damageGroups.map((g) => {
            const total = totalOf(g.members, picks)
            const killed = deathCount(offer, g.members, picks, damageSurvivors)
            // Lethal on an indestructible blocker, which it survives.
            const shrugged = killed === 0 && lethalCount(offer, g.members, picks) > 0
            const size = g.members.length
            const fewer = spareOne(g.members, picks)
            const more = addToGroup(offer, g.members, picks)
            return (
              <div key={g.members[0]} className="damage-row">
                <span className="damage-name" title={`${g.label} · ${g.detail}`}>
                  {g.label} <span className="muted">{g.detail}</span>
                </span>
                <button
                  type="button"
                  className="damage-step"
                  aria-label={`Spare one of ${g.label}`}
                  disabled={!fewer}
                  onClick={() => fewer && setDamagePicks(fewer)}
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  max={total + Math.max(0, free)}
                  value={total}
                  aria-label={`Damage to ${g.label}`}
                  onChange={(e) =>
                    setDamagePicks(setGroupTotal(offer, g, picks, Number(e.target.value) || 0))
                  }
                />
                <button
                  type="button"
                  className="damage-step"
                  aria-label={`More damage to ${g.label}`}
                  disabled={!more}
                  onClick={() => more && setDamagePicks(more)}
                >
                  +
                </button>
                <span className="damage-dead">
                  {killed > 0 ? (size > 1 ? `☠ ${killed}/${size}` : '☠') : shrugged ? 'lethal' : ''}
                </span>
              </div>
            )
          })}
        </div>
        {status !== null ? (
          <span className={valid ? '' : 'damage-short'}>{status}</span>
        ) : null}
        <span className="muted">
          ☠ {dead}/{offer.blockers.length}
        </span>
        <button type="button" disabled={damagePicks === null} onClick={() => setDamagePicks(null)}>
          Reset
        </button>
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
        {/* Only while something is actually on the stack: with an empty one
            there is nothing to resolve, and the button would read as a
            second, vaguer "Pass". */}
        {view.zones.stack.length > 0 ? (
          <button
            type="button"
            onClick={game.resolveAll}
            disabled={!canPass}
            title="Keep passing until the stack has resolved — stops if anything needs you"
          >
            Resolve stack (
            {/* An entry standing for several identical triggers is that many. */}
            {view.zones.stack.reduce((n, id) => n + (view.objects[id]?.stackCount ?? 1), 0)})
          </button>
        ) : null}
        <button type="button" onClick={game.passTurn} disabled={!canPassTurn}>
          Pass Turn
        </button>
        {/* Short labels so all four fit one row; `title` carries the full
            sentence, since that's the part that actually explains them. */}
        <button
          type="button"
          onClick={game.autoPass}
          title={
            game.autoPassPaused
              ? 'Paused so you can respond — resumes by itself once the stack is clear. Click to turn it off.'
              : game.autoPassing
                ? 'Stop passing automatically'
                : 'Pass automatically until my own turn comes round again'
          }
        >
          {/* Paused is still on: say so, or a button that reads "Stop
              auto-pass" while the game waits on you looks like it broke. */}
          {game.autoPassPaused ? 'Auto-pass paused' : game.autoPassing ? 'Stop auto-pass' : 'Auto-pass'}
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
      seatClassOf={(player) => seatClassOf(view.turnOrder, player)}
      isActive={view.activePlayer === pid}
      hasPriority={view.priority.holder === pid}
      waiting={
        // Someone else the game is waiting on. Your own turn to act is said
        // by the decision banner; this is for watching everyone else's.
        pid !== seat && !view.result.over && actingPlayer(view) === pid
          ? waitingLabel(view, pid, game.seats.find((s) => s.player === pid)?.isBot === true)
          : null
      }
      online={onlineOf(pid)}
      bot={game.seats.find((s) => s.player === pid)?.isBot === true}
      seats={game.seats}
      exileSize={exileOf(pid).length}
      wentFirst={pid === view.startingPlayer}
      isMonarch={view.monarch === pid}
      emblemCount={view.emblems.filter((e) => e.owner === pid).length}
      curses={view.zones.battlefield.flatMap((id) => {
        const o = view.objects[id]
        return o !== undefined && o.attachedToPlayer === pid
          ? [
              {
                id,
                name: o.cardName,
                art: o.art,
                controllerClass: seatClassOf(view.turnOrder, o.controller),
                controllerLabel: playerLabel(o.controller, game.seats),
              },
            ]
          : []
      })}
      onOpenEmblems={() => {
        const cards = view.emblems.flatMap((e, i) => (e.owner === pid ? [emblemToVisible(e, i)] : []))
        const byId = new Map(cards.map((c) => [c.id, c]))
        setZoneView({
          title: `${playerLabel(pid, game.seats)}'s emblems`,
          ids: cards.map((c) => c.id),
          resolve: (id) => byId.get(id),
        })
      }}
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
      selected={
        mode === 'proliferate' && proliferatePicks.some((t) => t.kind === 'player' && t.player === pid)
      }
      aimedBy={aim !== null && aim.players.has(pid) ? aim.by : null}
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
  /**
   * "How many of these?" for a compacted token stack — the same menu shape a
   * permanent's activated abilities get, hung off the same tile, because the
   * question is the same kind of question: this one tile can do more than one
   * thing and you have to say which.
   *
   * A stack is a single entry in the offer standing for `copies` permanents
   * (see the engine's `sacrifice` LegalAction), and the answer names it once
   * per token given up. Without this the tile could only be picked or not,
   * and a demand for three against a stack of nine had no answer the Confirm
   * button would ever accept.
   */
  const renderStackCountMenu = () => {
    if (stackMenu === null) return null
    // The same menu answers two questions: how many of a stack to sacrifice,
    // and how many of it to tap for a cost.
    const pick =
      mode === 'sacrifice' && sacrificeAction
        ? {
            verb: 'Sacrifice',
            count: sacrificeAction.count,
            of: sacrificeAction.copies?.[stackMenu] ?? 1,
            picks: sacrificePicks,
            set: (next: readonly ObjectId[]) => setSacrificePicks(next),
          }
        : mode === 'choose-permanents' && choosePermanentsAction
          ? {
              verb: 'Choose',
              count: choosePermanentsAction.max,
              of: choosePermanentsAction.copies?.[stackMenu] ?? 1,
              picks: permanentPicks,
              set: (next: readonly ObjectId[]) => setPermanentPicks(next),
            }
        : mode === 'choose-tap' && pendingTap
          ? {
              verb: 'Tap',
              count: pendingTap.offer.count,
              of: pendingTap.offer.copies?.[stackMenu] ?? 1,
              picks: pendingTap.picks,
              set: (next: readonly ObjectId[]) =>
                setPendingTap((cur) => (cur === null ? cur : { ...cur, picks: next })),
            }
          : mode === 'choose-convoke' && pendingConvoke
            ? {
                verb: 'Convoke',
                count: pendingConvoke.offer.maxCreatures,
                of: pendingConvoke.offer.copies?.[stackMenu] ?? 1,
                picks: pendingConvoke.picks,
                set: (next: readonly ObjectId[]) =>
                  setPendingConvoke((cur) => (cur === null ? cur : { ...cur, picks: next })),
              }
            : null
    if (pick === null) return null
    const taken = pick.picks.filter((x) => x === stackMenu).length
    // What this stack could be raised to: everything not already promised to
    // some *other* entry, capped at the stack's own size.
    const most = Math.min(pick.of, pick.count - (pick.picks.length - taken))
    const setTo = (n: number) => {
      pick.set([...pick.picks.filter((x) => x !== stackMenu), ...Array<ObjectId>(n).fill(stackMenu)])
      setStackMenu(null)
    }
    return (
      <AbilityMenu
        source={stackMenu}
        title={`${game.nameOf(stackMenu)} ×${pick.of}`}
        ariaLabel={`How many to ${pick.verb.toLowerCase()}`}
        items={Array.from({ length: most + 1 }, (_unused, n) => ({
          key: String(n),
          label: n === 0 ? 'None' : `${pick.verb} ${n}`,
          onSelect: () => setTo(n),
        }))}
        onClose={() => setStackMenu(null)}
      />
    )
  }

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
   * every mode except the mulligan popup (see `peekable`'s own comment
   * above, by the `mode` computation); a decision on the hand itself
   * (discard, put-on-bottom) holds it raised. A two-zone hitbox: a small
   * `.hand-trigger` hugging the bottom edge is what raises it, but the whole
   * (much larger) `.hand-strip` has to be left before it lowers again --
   * easier to leave up than to summon by accident. */
  const renderHandStrip = () => {
    return (
      <div
        className={`hand-strip ${peekable ? 'peekable' : ''} ${handRaised || handForcedOpen ? 'raised' : ''} ${
          handForcedOpen ? 'hand-decision' : ''
        }`}
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
  const renderHand = (layout: 'fan' | 'grid' = 'fan') => {
    const grid = layout === 'grid'
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
        {!grid && handIds.length > HAND_GRID_THRESHOLD ? (
          <button
            type="button"
            className="hand-grid-open"
            onClick={() => setHandGrid(true)}
            title="Show every card at full size — the fan gets too tight to pick from"
          >
            All cards
          </button>
        ) : null}
      </h3>
      <div className={grid ? 'hand-grid' : 'hand-cards'} ref={grid ? undefined : handRowRef}>
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
          // The grid exists to undo exactly what the fan does, so it takes
          // none of it: no rotation, no lift, no stacking order and — the
          // one that matters — no negative margin. Every card gets its own
          // full width and is a full-size click target.
          const slotStyle: CSSProperties = grid ? {} : fanStyle
          let highlight = false
          let selected = false
          if (mode === 'discard') {
            highlight = discardAction?.from.includes(id) ?? false
            selected = discardPicks.includes(id)
          } else if (mode === 'put-on-bottom') {
            highlight = bottomAction?.from.includes(id) ?? false
            selected = bottomPicks.includes(id)
          } else if (mode === 'reveal-for-untapped') {
            highlight = revealChoiceAction?.options.includes(id) ?? false
            selected = revealPick === id
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
            <div key={id} className="hand-card" data-obj-id={id} style={slotStyle}>
              <CardTile
                obj={obj}
                highlight={highlight || Boolean(suspend) || Boolean(foretell) || Boolean(cycle)}
                selected={selected}
                layout="art-first"
                onClick={() => clickHandCard(id)}
              />
              {/* Beside the card once it has grown under the pointer, on the
                  side facing the middle of the hand (App.css). */}
              <KeywordTips obj={obj} className={`hand-kw-tips${fanOffset > 0 ? ' to-left' : ''}`} />
              {multiFace
                ? faceOpts.map((a, i) => (
                    <button key={i} type="button" onClick={() => playFace(a)}>
                      {a.kind === 'play-land' ? 'Play' : 'Cast'} {a.cardName}
                      {a.kind === 'cast-spell' && a.kicked ? (
                        <>
                          {' '}({a.kickerKeyword ?? 'kicked'}
                          {a.kickerCost ? <> <Symbols text={a.kickerCost} /></> : null})
                        </>
                      ) : null}
                      {a.kind === 'cast-spell' && a.overload ? (
                        <> (overload <Symbols text={a.overloadCost ?? ''} />)</>
                      ) : null}
                      {a.kind === 'cast-spell' && a.free ? ' (free)' : ''}
                      {a.kind === 'cast-spell' && a.xCost?.minX !== undefined && a.xCost.minX === a.xCost.maxX
                        ? ` (X=${a.xCost.maxX})`
                        : ''}
                      {a.kind === 'cast-spell' && a.via === 'warp' ? ' (warp)' : ''}
                      {a.kind === 'cast-spell' && a.via === 'blitz' ? ' (blitz)' : ''}
                      {a.kind === 'cast-spell' && a.offspring ? (
                        <> (offspring <Symbols text={a.offspringCost ?? ''} />)</>
                      ) : null}
                      {a.kind === 'cast-spell' && a.evoke ? (
                        <> (evoke <Symbols text={a.evokeCost ?? ''} />)</>
                      ) : null}
                      {a.kind === 'cast-spell' && a.prototype ? (
                        <> (prototype <Symbols text={a.prototypeCost ?? ''} />)</>
                      ) : null}
                      {a.kind === 'cast-spell' && a.altCost ? ' (alternative cost)' : ''}
                      {a.kind === 'cast-spell' && a.via === 'harmonize'
                        ? a.harmonizeTap
                          ? ` (harmonize, tapping ${a.harmonizeTap.cardName}: −${a.harmonizeTap.power})`
                          : ' (harmonize)'
                        : ''}
                      {a.kind === 'cast-spell' && a.costOptionText ? (
                        <> (<Symbols text={a.costOptionText} />)</>
                      ) : null}
                    </button>
                  ))
                : null}
              {suspend ? (
                <button
                  type="button"
                  onClick={() => game.dispatch({ type: 'suspend', player: seat, card: id })}
                >
                  Suspend <Symbols text={suspend.cost} />
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
                  Cycle <Symbols text={cycle.cost} />
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
      {/* An activated ability's menu used to dock here, a whole screen away
          from the permanent it belonged to; it's a popover beside the tile
          now (see `AbilityMenu`, rendered near the other floating overlays
          below).

          priority mode's controls (Pass/Pass Turn/Auto-pass/Skip-mana) render
          in a fixed bottom-right bar instead (see .priority-actions below),
          mulligan's Keep/Mulligan choice (with the hand itself) renders as
          its own centered popup (see .mulligan-modal below), and every other
          mode floats its controls in a fixed .decision-banner (see the return
          below) -- docking them here would force this whole strip out of its
          peekable/fixed tray and into normal layout flow, which used to steal
          height from .quadrant-grid (and the board's own mini tiles) every
          time one of those decisions came up. Discard and put-on-bottom were
          the last to dock here, and squashed the board while they were up. */}

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
              className={`quadrant-cell ${seatClassOf(view.turnOrder, pid)} ${
                pid === seat ? 'self' : ''
              } ${
                view.activePlayer === pid ? 'active-turn' : ''
              } ${view.players[pid]?.hasLost ? 'eliminated' : ''}`}
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

      {/* The selected permanent's activated abilities, beside the permanent
          itself rather than in a bar at the bottom of the screen. Picking
          one hands off to `clickAbility` (targeting, an {X} prompt, a
          sacrifice choice), so the menu closes either way. */}
      {selectedSource !== null && selectedAbilities.length > 0 ? (
        <AbilityMenu
          source={selectedSource}
          title={game.nameOf(selectedSource)}
          items={selectedAbilities.map((ab) => ({
            // An "add one mana of any color" ability is listed once per
            // colour, all sharing an index -- the colours are what tell them
            // apart, so they belong in the key too.
            key: `${ab.abilityIndex}:${ab.manaColors?.join('') ?? ''}`,
            label: ab.text || `Ability ${ab.abilityIndex + 1}`,
            onSelect: () => {
              setSelectedSource(null)
              clickAbility(ab)
            },
          }))}
          onClose={() => setSelectedSource(null)}
        />
      ) : null}

      {renderStackCountMenu()}

      {renderMulliganModal()}
      {/* moved here (from GameScreen, a sibling of Table) so it can reuse
          Table's own targeting state/handlers -- a spell on the stack is
          just another legal-target object (e.g. a counterspell targeting
          "spell"), the same architecture tileFor already uses for
          battlefield permanents. */}
      {stackShowsSomething(view, answered) ? (
        <Stack
          view={view}
          answered={answered}
          targetSlot={targetSlot}
          pickedIds={pickedObjKeys}
          onTargetClick={(id) => clickPermanent([id])}
          aimed={aim}
          onFocusEntry={setStackFocus}
          seats={game.seats}
          previousStack={previousView?.zones.stack ?? null}
        />
      ) : null}
      {/* What points at what: the aimed stack entry's targets (or what's
          resolving's, as it does), attackers, blockers. Inside Table so it
          re-measures against each board. */}
      <ArrowLayer view={view} previousView={previousView} aimId={aimId} resolve={resolve} />

      {/* The whole hand at full size, for a hand too big to pick out of the
          fan. Deliberately the *same* card renderer the fan uses, so every
          action a card has there — cast, play, a second face, Foretell,
          Suspend, Cycle — comes along unchanged; only the layout differs. */}
      {handGrid ? (
        <div
          className="hand-grid-overlay"
          role="dialog"
          aria-label="Your hand"
          onClick={(e) => {
            // Click the backdrop to close, but not a click that landed on a
            // card: playing one from in here shouldn't also dismiss it.
            if (e.target === e.currentTarget) setHandGrid(false)
          }}
        >
          <div className="hand-grid-box">
            <div className="hand-grid-head">
              <button type="button" onClick={() => setHandGrid(false)}>
                Close
              </button>
            </div>
            {renderHand('grid')}
          </div>
        </div>
      ) : null}

      {zoneView ? (
        <ZoneViewer
          title={zoneView.title}
          ids={zoneView.ids}
          resolve={zoneView.resolve ?? ((id) => view.objects[id])}
          onClose={() => setZoneView(null)}
          castable={{
            // Flashback/escape/… casts from the graveyard (Phase 6), plus a
            // land playable from the graveyard (Ramunap Excavator — P2B).
            ids: zoneView.ids.filter(
              (id) => castByCard.get(id)?.via !== undefined || landByCard.has(id),
            ),
            label: (id) => {
              const c = castByCard.get(id)
              // Most routes read fine as their own name ("flashback", "escape");
              // a permission granted by another permanent doesn't.
              if (c?.via === 'graveyard-permission') return 'Cast from graveyard'
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
            // Several ways to play one card from here: which Muldrotha type
            // it spends, which permission pays, which face.
            variants: (id) => {
              const ways = playFacesByCard.get(id) ?? []
              // Name the granting permanent only when two of them grant this
              // card — not when the other way is its own flashback or escape.
              const sources = new Set(ways.flatMap((a) => (a.graveyardGrant ? [a.graveyardGrant.source] : [])))
              return ways.map((a) => ({
                label: graveyardVariantLabel(a, view, sources.size > 1),
                onChoose: () => {
                  setZoneView(null)
                  playFace(a)
                },
              }))
            },
          }}
        />
      ) : null}

      {mode === 'cast-now' && castNowAction && castNowPicking && castNowPick === null ? (
        <ZoneViewer
          title={`${game.nameOf(castNowAction.source)} — you may cast ${
            castNowAction.cards.length === 1 ? 'this spell' : 'one of these'
          }${castNowAction.free ? ' without paying its mana cost' : ''}`}
          ids={castNowAction.looked ?? castNowAction.cards}
          resolve={(id) => view.objects[id]}
          selection={{
            min: 0,
            max: 1,
            eligible: castNowAction.cards,
            noneLabel: "Don't cast",
            onConfirm: (chosen) => {
              const card = chosen[0]
              if (card === undefined) {
                game.dispatch({ type: 'cast-now', player: seat, cast: null })
                return
              }
              // One way to cast it goes straight into the cast steps; more
              // (kicked or not, a face) are offered as buttons.
              const ways = castNowAction.casts.filter((c) => c.card === card)
              const lands = (castNowAction.lands ?? []).filter((l) => l.card === card)
              if (ways.length === 1 && lands.length === 0) beginCast(ways[0])
              else setCastNowPick(card)
            },
          }}
          collapsed={decisionCollapsed}
          onCollapse={() => setDecisionCollapsed(true)}
        />
      ) : null}

      {mode === 'choose-from-zone' && zoneChoiceAction ? (
        <ZoneViewer
          title={zoneChoiceTitle(zoneChoiceAction, (p) => playerLabel(p, game.seats))}
          ids={zoneChoiceAction.ids}
          resolve={(id) => view.objects[id]}
          selection={{
            min: zoneChoiceAction.min,
            max: zoneChoiceAction.max,
            eligible: zoneChoiceAction.eligible,
            onConfirm: confirmZoneChoice,
            ...(zoneChoiceAction.together
              ? { fits: (picked: readonly ObjectId[]) => fitsTogether(zoneChoiceAction.together!, picked) }
              : {}),
            ...(zoneChoiceAction.destination === 'library-top' || zoneChoiceAction.destination === 'library-bottom'
              ? { ordered: true }
              : {}),
          }}
          collapsed={decisionCollapsed}
          onCollapse={() => setDecisionCollapsed(true)}
        />
      ) : null}

      {mode === 'targeting' && activeTargeting && zoneTargetIds.length > 0 ? (
        <ZoneViewer
          // One popup per slot, so a pick made for the last one doesn't
          // carry over.
          key={zoneTargetKey ?? ''}
          title={`${game.nameOf(activeTargeting.source)} — target ${describeTargetSpec(currentSpec(activeTargeting) ?? 'card')}`}
          ids={zoneTargetIds}
          resolve={(id) => view.objects[id]}
          selection={
            inTargetGroup(activeTargeting)
              ? {
                  // An "any number of" group: every member at once.
                  min: 0,
                  max: zoneTargetIds.length,
                  eligible: zoneTargetIds,
                  noneLabel: 'Choose none',
                  onConfirm: (chosen) =>
                    pickTargetGroup(chosen.map((object) => ({ kind: 'object', object }))),
                  // "With total power 10 or less" (Reunion of the House):
                  // Confirm waits until the picks obey it.
                  fits: (chosen: readonly ObjectId[]) =>
                    !groupPowerExceeded(
                      activeTargeting.specs,
                      [...activeTargeting.picked, ...chosen.map((object) => ({ kind: 'object' as const, object }))],
                      activeTargeting.facts,
                    ),
                  ...(activeTargeting.kind === 'choose-targets'
                    ? {}
                    : { onCancel: () => setTargeting(null) }),
                }
              : {
            min:
              isOptionalSpec(currentSpec(activeTargeting) ?? 'creature') &&
              maySkipSlot(activeTargeting)
                ? 0
                : 1,
            max: 1,
            eligible: zoneTargetIds,
            noneLabel: 'Skip',
            onConfirm: (chosen) =>
              pickTarget(chosen[0] === undefined ? null : { kind: 'object', object: chosen[0] }),
            ...(activeTargeting.kind === 'choose-targets'
              ? {}
              : { onCancel: () => setTargeting(null) }),
          }}
          collapsed={zoneTargetCollapsed}
          onCollapse={() => setZoneTargetHidden(zoneTargetKey)}
        />
      ) : null}

      {mode === 'choose-escape-exile' && pendingEscape ? (
        <ZoneViewer
          title={`Exile ${pendingEscape.offer.count} other card${
            pendingEscape.offer.count === 1 ? '' : 's'
          } to ${pendingEscape.cast.via === 'escape' ? 'escape' : 'cast'} ${pendingEscape.cast.cardName}`}
          ids={pendingEscape.offer.choices}
          resolve={(id) => view.objects[id]}
          selection={{
            min: pendingEscape.offer.count,
            max: pendingEscape.offer.count,
            eligible: pendingEscape.offer.choices,
            onConfirm: confirmEscapeExile,
            // Nothing is committed yet: backing out just drops the cast.
            onCancel: () => setPendingEscape(null),
          }}
        />
      ) : null}

      {mode === 'choose-delve' && pendingDelve ? (
        <ZoneViewer
          title={`Delve ${pendingDelve.cast.cardName}: exile up to ${pendingDelve.offer.maxCards}${
            pendingDelve.offer.minCards > 0 ? ` (at least ${pendingDelve.offer.minCards})` : ''
          }, each paying one generic mana`}
          ids={pendingDelve.offer.choices}
          resolve={(id) => view.objects[id]}
          selection={{
            min: pendingDelve.offer.minCards,
            max: pendingDelve.offer.maxCards,
            eligible: pendingDelve.offer.choices,
            onConfirm: confirmDelve,
            // Nothing exiled: mana pays it all.
            noneLabel: 'Exile none',
            onCancel: () => setPendingDelve(null),
          }}
        />
      ) : null}

      {mode === 'choose-creature-type' && creatureTypeChoiceAction?.catalog ? (
        <CreatureTypePicker
          // Remount per decision, so a previous search doesn't carry over.
          key={creatureTypeChoiceAction.source}
          sourceName={game.nameOf(creatureTypeChoiceAction.source)}
          options={creatureTypeChoiceAction.options}
          suggested={creatureTypeChoiceAction.suggested}
          onPick={(creatureType) =>
            game.dispatch({ type: 'choose-creature-type', player: seat, creatureType })
          }
          collapsed={decisionCollapsed}
          onCollapse={() => setDecisionCollapsed(true)}
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
          collapsed={decisionCollapsed}
          onCollapse={() => setDecisionCollapsed(true)}
        />
      ) : null}
    </div>
  )
}
