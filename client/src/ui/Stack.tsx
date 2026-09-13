import type { CSSProperties } from 'react'
import type { ObjectId, PlayerView, TargetRef } from 'engine'
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

/**
 * A floating overlay of the actual stack, as card faces — top of stack
 * first (depth 0), since that's what a player facing a decision is
 * responding to. Every object renders as the same full `CardTile`, just
 * progressively smaller/dimmer/more rotated with depth, so going deeper
 * reads as distance rather than a jarring format change. The top-of-stack
 * card's screen position never moves as the stack grows or shrinks — depth
 * 0 always sits at this overlay's fixed anchor (top:0; right:0), with
 * deeper cards positioned outward from there — and casting/resolving
 * animates via each entry's own `top`/`right`/`transform`/`opacity`
 * transition (see .stack-entry), not a re-mount, since React keys these by
 * object id and reuses the same DOM node across a stack-size change. The
 * caller only mounts this when the stack is non-empty (Arena-style: it
 * isn't a permanent panel, it just appears when something's happening).
 */
export function Stack({ view }: { readonly view: PlayerView }) {
  const ids = [...view.zones.stack].reverse() // ids[0] = top of stack = depth 0
  const N = ids.length
  const nameOf = (id: ObjectId): string => view.objects[id]?.cardName ?? id
  const tgt = (ref: TargetRef): string => describeTarget(ref, nameOf)

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
          const style: CSSProperties = {
            top: offsetDepth * STAGGER_Y,
            right: offsetDepth * STAGGER_X,
            zIndex: N - depth,
            // pivot at top LEFT -- the corner meant to stick out from under
            // the card in front (cards shift left+down with depth).
            // Pivoting on the opposite corner would swing that exposed
            // sliver back in under whatever's in front of it.
            transformOrigin: 'top left',
            transform: `rotate(${rotate}deg) scale(${scale})`,
            opacity,
          }
          const label =
            obj.kind === 'ability'
              ? `${obj.sourceObjectId ? nameOf(obj.sourceObjectId) : obj.cardName}'s ability`
              : obj.isCopy
                ? `copy of ${obj.cardName}`
                : null
          return (
            <div
              className={`stack-entry${isTop ? ' is-top' : ''}`}
              key={id}
              style={style}
            >
              {label ? <div className="stack-entry-label">{label}</div> : null}
              <CardTile obj={obj} badge={obj.isCopy ? 'copy' : undefined} />
              {obj.targets && obj.targets.length > 0 ? (
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
