import type { ObjectId, PlayerView, TargetRef } from 'engine'
import { describeTarget } from '../format.ts'

export function Stack({ view }: { readonly view: PlayerView }) {
  const ids = [...view.zones.stack].reverse()
  const nameOf = (id: ObjectId): string =>
    view.objects[id]?.cardName ?? id
  const tgt = (ref: TargetRef): string => describeTarget(ref, nameOf)

  return (
    <div className="stack">
      <h3>Stack {ids.length > 0 ? `(${ids.length})` : ''}</h3>
      {ids.length === 0 ? (
        <p className="muted">empty</p>
      ) : (
        <ol>
          {ids.map((id) => {
            const obj = view.objects[id]
            if (!obj) return null
            const label =
              obj.kind === 'ability'
                ? `${obj.sourceObjectId ? nameOf(obj.sourceObjectId) : obj.cardName} — ability`
                : obj.cardName
            return (
              <li key={id}>
                <span className="stack-name">{label}</span>
                {obj.targets && obj.targets.length > 0 ? (
                  <span className="stack-targets">
                    {' → '}
                    {obj.targets.map(tgt).join(', ')}
                  </span>
                ) : null}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
