import type { ObjectId, PlayerView, TargetRef } from 'engine'
import { describeTarget } from '../format.ts'
import { CardTile } from './CardTile.tsx'

/**
 * The actual stack, as card faces — top of stack first, since that's what a
 * player facing a decision is responding to. Only the top card renders at
 * full size; the rest are compact, matching how much of each you'd need to
 * read to know your options.
 */
export function Stack({ view }: { readonly view: PlayerView }) {
  const ids = [...view.zones.stack].reverse()
  const nameOf = (id: ObjectId): string => view.objects[id]?.cardName ?? id
  const tgt = (ref: TargetRef): string => describeTarget(ref, nameOf)

  return (
    <div className="stack">
      <h3>Stack {ids.length > 0 ? `(${ids.length})` : ''}</h3>
      {ids.length === 0 ? (
        <p className="muted">empty</p>
      ) : (
        <div className="stack-cards">
          {ids.map((id, index) => {
            const obj = view.objects[id]
            if (!obj) return null
            const label =
              obj.kind === 'ability'
                ? `${obj.sourceObjectId ? nameOf(obj.sourceObjectId) : obj.cardName}'s ability`
                : null
            return (
              <div className="stack-entry" key={id}>
                {label ? <div className="stack-entry-label">{label}</div> : null}
                <CardTile obj={obj} compact={index > 0} />
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
      )}
    </div>
  )
}
