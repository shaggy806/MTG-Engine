import { useEffect, useState, useSyncExternalStore } from 'react'
import { CardImage } from '../ui/CardImage.tsx'
import { findCardDef } from '../ui/defToVisible.ts'
import {
  getArtCacheVersion,
  isArtBlocked,
  isArtPending,
  queueArtLookup,
  recordArtFailure,
  resolveArtUrl,
  subscribeArtCache,
} from '../ui/art.ts'
import type { ReplacementOption } from '../net/protocol.ts'
import { CONFIDENCE_LABEL, tagLabel } from './replacement-labels.ts'
import '../ui/card-image.css'

/** One card the import stood in for, and what it could be instead. */
export interface ReviewSubstitution {
  readonly from: string
  /** The stand-in currently in the deck. */
  readonly to: string
  readonly options: readonly ReplacementOption[]
}

/**
 * Walks through an import's substitutions one card at a time, all as real card
 * faces: the card that couldn't come along on the left, the suggested
 * stand-ins on the right. Reading the actual cards is the judgement a name,
 * a badge and a few tags can only hint at — so picking one is a click on
 * its face, and ← / → (or the buttons) move between cards.
 *
 * Every choice is applied to the saved deck as it's made (`onChoose`), so
 * closing the popup part-way loses nothing, and the report banner can open
 * it again later.
 */
export function ReplacementReview({
  substitutions,
  deckCards,
  initialIndex = 0,
  onChoose,
  onClose,
}: {
  readonly substitutions: readonly ReviewSubstitution[]
  /** Everything the deck holds now — a stand-in already in it can't be
   * picked for another card, which would break singleton. */
  readonly deckCards: readonly string[]
  readonly initialIndex?: number
  readonly onChoose: (from: string, to: string) => void
  readonly onClose: () => void
}) {
  const [index, setIndex] = useState(initialIndex)
  const count = substitutions.length
  const current = substitutions[Math.min(index, count - 1)]
  const inDeck = new Set(deckCards)
  const last = index >= count - 1

  const available = (name: string) => name === current.to || !inDeck.has(name)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, count - 1))
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
      else if (/^[1-9]$/.test(e.key)) {
        const option = current.options[Number(e.key) - 1]
        if (option && (option.name === current.to || !inDeck.has(option.name))) {
          onChoose(current.from, option.name)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="rr-overlay" role="dialog" aria-label="Review stand-ins">
      <div className="rr-box">
        <div className="rr-head">
          <div>
            <h2>Choose stand-ins</h2>
            <span className="muted">
              {index + 1} of {count} — cards the engine doesn't support yet
            </span>
          </div>
          <button type="button" onClick={onClose} title="Close (Esc)">
            Close
          </button>
        </div>

        <div className="rr-body">
          <section className="rr-original">
            <span className="rr-label">Replacing</span>
            <ScryfallCardImage name={current.from} />
            <span className="rr-name">{current.from}</span>
          </section>

          <span className="rr-arrow" aria-hidden="true">
            →
          </span>

          <section className="rr-options">
            <span className="rr-label">
              {current.options.length === 0
                ? 'Nothing in the pool is close enough'
                : current.options.every((o) => o.confidence === 'low')
                  ? 'Nothing does quite the same job — the nearest cards'
                  : 'Pick one'}
            </span>
            <div className="rr-option-row">
              {current.options.map((option, i) => {
                const def = findCardDef(option.name)
                const chosen = option.name === current.to
                const blocked = !available(option.name)
                return (
                  <button
                    key={option.name}
                    type="button"
                    className={`rr-option${chosen ? ' chosen' : ''}${blocked ? ' blocked' : ''}`}
                    disabled={blocked}
                    aria-pressed={chosen}
                    title={blocked ? `${option.name} is already in this deck` : option.name}
                    onClick={() => onChoose(current.from, option.name)}
                  >
                    <span className="rr-option-card">
                      {def ? <CardImage def={def} /> : <ScryfallCardImage name={option.name} />}
                    </span>
                    <span className="rr-option-meta">
                      <span className="rr-key">{i + 1}</span>
                      <span className={`db-match db-match-${option.confidence}`}>
                        {CONFIDENCE_LABEL[option.confidence]}
                      </span>
                      {chosen ? <span className="rr-flag">✓ In deck</span> : null}
                      {blocked ? <span className="rr-flag blocked">Already in deck</span> : null}
                    </span>
                    {option.sharedTags.length > 0 ? (
                      <span className="rr-tags">
                        both: {option.sharedTags.slice(0, 3).map(tagLabel).join(', ')}
                      </span>
                    ) : (
                      <span className="rr-tags">similar type and cost</span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        <div className="rr-foot">
          <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)}>
            ← Previous
          </button>
          <div className="rr-dots" aria-hidden="true">
            {substitutions.map((s, i) => (
              <button
                key={s.from}
                type="button"
                tabIndex={-1}
                className={`rr-dot${i === index ? ' current' : ''}`}
                title={s.from}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          {last ? (
            <button type="button" className="rr-primary" onClick={onClose}>
              Done
            </button>
          ) : (
            <button type="button" className="rr-primary" onClick={() => setIndex(index + 1)}>
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * A whole card face looked up by name alone — for the card being replaced,
 * which the engine has no `CardDefinition` for, so `CardImage` can't draw
 * it. Same batched lookup path, and a named placeholder until it lands.
 */
function ScryfallCardImage({ name }: { readonly name: string }) {
  useSyncExternalStore(subscribeArtCache, getArtCacheVersion, getArtCacheVersion)
  queueArtLookup(name)
  const pending = isArtPending(name)
  const src = resolveArtUrl(undefined, name, 'normal')
  const failed = !pending && isArtBlocked(src)
  return (
    <span className={`card-image${pending || failed ? ' placeholder' : ''}`}>
      {pending || failed ? (
        <span className="rr-placeholder">{pending ? '' : name}</span>
      ) : (
        <img src={src} alt={name} decoding="async" onError={() => recordArtFailure(src)} />
      )}
    </span>
  )
}
