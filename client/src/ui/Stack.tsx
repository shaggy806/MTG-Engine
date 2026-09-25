import type { CSSProperties } from 'react'
import type { ObjectId, PlayerView, TargetRef } from 'engine/client'
import { decisionGhostOf } from '../game/decisionSource.ts'
import { describeTarget } from '../format.ts'
import { CardTile } from './CardTile.tsx'

// Cards shift down+left with depth (mirrors a real stack of cards spreading
// out from under the one on top); the offset stops growing past this depth
// so a big stack (10+ objects) doesn't sprawl further and further off to
// the side -- scale/opacity already bottom out on their own (the Math.max
// floors below), this just makes the offset saturate the same way.
const STAGGER_X = 20
const STAGGER_Y = 15
const ROT_STEP = 3
const SCALE_STEP = 0.075
const MIN_SCALE = 0.6
const OPACITY_STEP = 0.12
const MIN_OPACITY = 0.55
const MAX_OFFSET_DEPTH = 7

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
export function Stack({ view, targetSlot = [], pickedIds, onTargetClick }: StackProps) {
  // The card that caused the decision you're being asked, when it isn't
  // already on the stack. A sacrifice or discard effect raises its prompt
  // *after* the spell that ordered it has finished resolving and gone to a
  // graveyard, so without this a forced choice arrives with nothing on screen
  // explaining it. It rides at depth 0 -- where whatever you're responding to
  // always sits -- and isn't a real stack object, so it's never targetable.
  const ghost = decisionGhostOf(view)
  const ids = [...(ghost ? [ghost] : []), ...[...view.zones.stack].reverse()]
  const N = ids.length
  const nameOf = (id: ObjectId): string => view.objects[id]?.cardName ?? id
  const tgt = (ref: TargetRef): string => describeTarget(ref, nameOf)
  const isTargetable = (id: ObjectId): boolean =>
    targetSlot.some((o) => o.kind === 'object' && o.object === id)

  return (
    <div className="stack-overlay">
      <div className="stack-pile">
        {ids.map((id, depth) => {
          const obj = view.objects[id]
          if (!obj) return null
          const isTop = depth === 0
          const offsetDepth = Math.min(depth, MAX_OFFSET_DEPTH)
          const scale = Math.max(MIN_SCALE, 1 - depth * SCALE_STEP)
          const opacity = Math.max(MIN_OPACITY, 1 - depth * OPACITY_STEP)
          // depth 0 (top) and depth 1 (the card directly behind it) both
          // stay upright; rotation only starts from depth 2 on.
          const rotate =
            depth <= 1 ? 0 : (Math.min(depth, MAX_OFFSET_DEPTH + 1) - 1) * -ROT_STEP
          // Custom properties, not the `top`/`right`/`transform`/`opacity`/
          // `z-index` properties directly -- same trick the hand fan uses
          // (see App.tsx's HAND_FAN_STEP_DEG comment) so .stack-entry:hover
          // can cancel the depth styling (including bringing a buried card
          // to the front) with a plain CSS rule instead of fighting an
          // inline style, which always wins over a stylesheet rule short of
          // `!important` -- z-index included, or a hovered deep card would
          // pop to full size but stay painted under shallower ones.
          const style = {
            '--st-y': `${offsetDepth * STAGGER_Y}px`,
            '--st-x': `${offsetDepth * STAGGER_X}px`,
            '--st-rot': `${rotate}deg`,
            '--st-scale': scale,
            '--st-opacity': opacity,
            '--st-z': N - depth,
          } as CSSProperties
          const isGhost = id === ghost
          const label = isGhost
            ? 'prompted by'
            : obj.kind === 'ability'
              ? `${obj.sourceObjectId ? nameOf(obj.sourceObjectId) : obj.cardName}'s ability`
              : obj.isCopy
                ? `copy of ${obj.cardName}`
                : null
          const targetable = !isGhost && isTargetable(id)
          return (
            <div
              className={`stack-entry${isTop ? ' is-top' : ''}${isGhost ? ' is-prompt' : ''}`}
              key={id}
              style={style}
            >
              {label ? <div className="stack-entry-label">{label}</div> : null}
              <CardTile
                obj={obj}
                badge={obj.isCopy ? 'copy' : undefined}
                highlight={targetable}
                selected={!isGhost && (pickedIds?.has(id) ?? false)}
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
