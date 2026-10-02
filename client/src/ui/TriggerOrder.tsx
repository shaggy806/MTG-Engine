import { useState } from 'react'
import type { TriggerOrderEntry } from 'engine/client'

/**
 * The `order-triggers` decision (rule 603.3b): your triggered abilities that
 * go on the stack together, in the order they'll resolve — the top one first.
 * Offered in the engine's own order; move one up or down, then confirm.
 * Asked only when the "order my own triggers" setting is on (Settings →
 * Priority) and two or more of yours that aren't all the same ability trigger
 * at once.
 */
export function TriggerOrder({
  triggers,
  onConfirm,
}: {
  readonly triggers: readonly TriggerOrderEntry[]
  /** Indices into `triggers`, the one to resolve first first. */
  readonly onConfirm: (order: number[]) => void
}) {
  const [order, setOrder] = useState<number[]>(() => triggers.map((_, i) => i))
  const move = (at: number, by: -1 | 1) => {
    const to = at + by
    if (to < 0 || to >= order.length) return
    const next = [...order]
    ;[next[at], next[to]] = [next[to], next[at]]
    setOrder(next)
  }
  return (
    <div className="controls trigger-order">
      <span>Order your triggers — the top one resolves first.</span>
      <ol className="trigger-order-list">
        {order.map((index, at) => {
          const t = triggers[index]
          return (
            <li key={index}>
              <span className="trigger-order-text">
                <strong>{t.cardName}</strong>
                {t.copies > 1 ? ` ×${t.copies}` : ''}
                {t.text ? <span className="trigger-order-ability"> — {t.text}</span> : null}
              </span>
              <span className="trigger-order-moves">
                <button
                  type="button"
                  disabled={at === 0}
                  aria-label={`Resolve ${t.cardName} earlier`}
                  onClick={() => move(at, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={at === order.length - 1}
                  aria-label={`Resolve ${t.cardName} later`}
                  onClick={() => move(at, 1)}
                >
                  ↓
                </button>
              </span>
            </li>
          )
        })}
      </ol>
      <button type="button" onClick={() => onConfirm(order)}>
        Confirm order
      </button>
    </div>
  )
}
