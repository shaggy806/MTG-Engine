import type { CSSProperties } from 'react'
import type { ObjectId, PlayerView, TargetRef, VisibleObject } from 'engine/client'
import type { SeatStatus } from 'protocol'
import { decisionGhostOf } from '../game/decisionSource.ts'
import { describeTarget, playerLabel, seatClassOf } from '../format.ts'
import { CardTile } from './CardTile.tsx'
import { stackDepthVars } from './stackDepth.ts'

/** A permanent drawn on the stack as its card: none of its state on the
 * battlefield — tapped, damage, counters, combat, attachments — which is
 * about the board, not about what's resolving. */
function asCardFace(obj: VisibleObject): VisibleObject {
  return {
    ...obj,
    tapped: false,
    damageMarked: 0,
    counters: {},
    summoningSick: false,
    attacking: null,
    blocking: null,
    attachedTo: null,
    attachedToPlayer: null,
    goadedBy: [],
    suspected: false,
  }
}

export interface StackProps {
  readonly view: PlayerView
  /** The current target slot's legal options (e.g. from a Counterspell's
   * "spell" target) -- an entry highlights and becomes clickable when its id
   * appears here, the same "is this object a legal target right now" check
   * `tileFor` runs for battlefield permanents. Omit/empty outside targeting. */
  readonly targetSlot?: readonly TargetRef[]
  /** Ids already picked for the in-progress targeting decision. */
  readonly pickedIds?: ReadonlySet<string>
  /** Only called for an id that's actually in `targetSlot` (CardTile itself
   * won't dispatch a click otherwise -- see its own `clickable` gate). */
  readonly onTargetClick?: (id: ObjectId) => void
  /** Spells the focused stack entry targets (`Table`'s `aim`) and what that
   * entry is called — a counterspell's spell gets the reticle too. */
  readonly aimed?: { readonly by: string; readonly objects: ReadonlySet<ObjectId> } | null
  /** The pointer (or keyboard focus) is on an entry, or has left: the board
   * then marks that entry's targets rather than the top's. */
  readonly onFocusEntry?: (id: ObjectId | null) => void
  /** For naming each entry's controller. */
  readonly seats?: readonly SeatStatus[]
  /** What was on the stack in the board shown before this one, so only an
   * entry that has just arrived plays the arrival animation. `Table` (and
   * this with it) remounts every frame, so without it every entry replayed
   * its arrival each time anything happened. `null` when there was no
   * earlier board: everything counts as new. */
  readonly previousStack?: readonly ObjectId[] | null
  /** The decision this board was waiting on has been answered — a later
   * frame is playing over it — so no "prompted by" card is drawn. */
  readonly answered?: boolean
}

/**
 * A floating overlay of the actual stack, as card faces — top of stack
 * first (depth 0), since that's what a player facing a decision is
 * responding to. Every object renders as the same full `CardTile`, just
 * progressively smaller/dimmer/more rotated with depth, so going deeper
 * reads as distance rather than a jarring format change. Hovering (or
 * focusing) any entry cancels its depth styling via CSS alone — see
 * `.stack-entry:hover`/`:focus-within` in App.css — so a buried card can
 * still be read at full size/rotation/opacity without needing to resolve
 * everything in front of it first. The top-of-stack card's screen position
 * never moves as the stack grows or shrinks — depth 0 always sits at this
 * overlay's fixed anchor (top:0; right:0), with deeper cards positioned
 * outward from there — and casting/resolving animates via each entry's own
 * `top`/`right`/`transform`/`opacity` transition (see .stack-entry), not a
 * re-mount, since React keys these by object id and reuses the same DOM
 * node across a stack-size change. The caller only mounts this when there's
 * something to draw (`stackShowsSomething`) — Arena-style, it isn't a
 * permanent panel, it just appears when something's happening.
 */
export function Stack({
  view,
  targetSlot = [],
  pickedIds,
  onTargetClick,
  aimed = null,
  onFocusEntry,
  seats,
  previousStack = null,
  answered = false,
}: StackProps) {
  const before = previousStack === null ? null : new Set(previousStack)
  // The card that caused the decision you're being asked, when it isn't
  // already on the stack. A sacrifice or discard effect raises its prompt
  // *after* the spell that ordered it has finished resolving and gone to a
  // graveyard, so without this a forced choice arrives with nothing on screen
  // explaining it. It rides at depth 0 -- where whatever you're responding to
  // always sits -- and isn't a real stack object, so it's never targetable.
  const ghost = decisionGhostOf(view, answered)
  const ids = [...(ghost ? [ghost] : []), ...[...view.zones.stack].reverse()]
  const N = ids.length
  const nameOf = (id: ObjectId): string => view.objects[id]?.cardName ?? id
  /** What an entry's card shows. An ability carries only its source's card
   * name, so drawn by itself it's the card as printed — a prototyped Combat
   * Thresher's draw trigger read {7} 3/3 beside the {2}{W} 1/1 that made it.
   * While the source is still on the battlefield it's drawn as that
   * permanent is now (cost, colors, size, types, text, art), keeping the
   * entry's own identity and targets and none of the permanent's board state. */
  const faceOf = (obj: VisibleObject): VisibleObject => {
    const source = obj.kind === 'ability' && obj.sourceObjectId ? view.objects[obj.sourceObjectId] : undefined
    if (source === undefined || source.zone !== 'battlefield') return obj
    return asCardFace({
      ...source,
      id: obj.id,
      kind: obj.kind,
      zone: obj.zone,
      controller: obj.controller,
      sourceObjectId: obj.sourceObjectId,
      abilityIndex: obj.abilityIndex,
      targets: obj.targets,
      xValue: obj.xValue,
      stackCount: obj.stackCount,
      isCopy: obj.isCopy,
    })
  }
  // A player target by their display name, not their seat id ("→ alice").
  const tgt = (ref: TargetRef): string =>
    ref.kind === 'player' ? playerLabel(ref.player, seats) : describeTarget(ref, nameOf)
  const isTargetable = (id: ObjectId): boolean =>
    targetSlot.some((o) => o.kind === 'object' && o.object === id)

  return (
    <div className="stack-overlay">
      <div className="stack-pile">
        {ids.map((id, depth) => {
          const obj = view.objects[id]
          if (!obj) return null
          const isTop = depth === 0
          // Custom properties (`stackDepthVars`), not the `top`/`right`/
          // `transform`/`opacity`/`z-index` properties directly -- same trick
          // the hand fan uses (see App.tsx's HAND_FAN_STEP_DEG comment) so
          // .stack-entry:hover can cancel the depth styling (including
          // bringing a buried card to the front) with a plain CSS rule
          // instead of fighting an inline style, which always wins over a
          // stylesheet rule short of `!important` -- z-index included, or a
          // hovered deep card would pop to full size but stay painted under
          // shallower ones.
          const style = stackDepthVars(depth, N) as CSSProperties
          const isGhost = id === ghost
          const label = isGhost
            ? 'prompted by'
            : obj.kind === 'ability'
              ? `${obj.sourceObjectId ? nameOf(obj.sourceObjectId) : obj.cardName}'s ability${
                  // Several identical triggers as one entry (a watcher seeing a
                  // token stack enter): each resolves on its own.
                  (obj.stackCount ?? 1) > 1 ? ` ×${obj.stackCount}` : ''
                }`
              : obj.isCopy
                ? `copy of ${obj.cardName}`
                : null
          const targetable = !isGhost && isTargetable(id)
          const isNew = before === null || !before.has(id)
          return (
            <div
              className={`stack-entry${isTop ? ' is-top' : ''}${isGhost ? ' is-prompt' : ''}${
                isNew ? ' is-new' : ''
              }`}
              key={id}
              style={style}
              // Read by AnimationLayer to find the entry as it leaves the
              // stack, by the id its resolving event names.
              data-stack-id={isGhost ? undefined : id}
              onMouseEnter={isGhost ? undefined : () => onFocusEntry?.(id)}
              onMouseLeave={isGhost ? undefined : () => onFocusEntry?.(null)}
              onFocus={isGhost ? undefined : () => onFocusEntry?.(id)}
              onBlur={isGhost ? undefined : () => onFocusEntry?.(null)}
            >
              <div className="stack-entry-label">
                {/* Whose it is, in their seat colour: the card alone doesn't
                    say, and in a four-player game it's the first question. */}
                {!isGhost ? (
                  <span className={`stack-entry-who ${seatClassOf(view.turnOrder, obj.controller)}`}>
                    {playerLabel(obj.controller, seats)}
                  </span>
                ) : null}
                {!isGhost && label ? ' · ' : null}
                {label}
              </div>
              <CardTile
                // The decision's cause is a card, not an object on the board
                // here: a creature that tapped to activate the ability asking
                // you something is drawn untapped, as an ability's entry is.
                obj={isGhost ? asCardFace(obj) : faceOf(obj)}
                badge={obj.isCopy ? 'copy' : undefined}
                highlight={targetable}
                selected={!isGhost && (pickedIds?.has(id) ?? false)}
                aimedBy={!isGhost && aimed !== null && aimed.objects.has(id) ? aimed.by : null}
                onClick={!isGhost && onTargetClick ? () => onTargetClick(id) : undefined}
              />
              {!isGhost && obj.targets && obj.targets.length > 0 ? (
                <div className="stack-targets">
                  {'→ '}
                  {obj.targets.map(tgt).join(', ')}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
