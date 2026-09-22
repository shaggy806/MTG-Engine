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
import type { ReplacementOption } from 'protocol'
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

  /**
   * The best three options you can actually take.
   *
   * The engine hands over more than three (see `UI_OPTIONS`) precisely so
   * this can filter. Showing a fixed three meant the 2nd and 3rd slots were
   * often greyed-out cards already in the deck — a row of choices that
   * weren't choices. The currently-chosen card is always kept, even if it is
   * "in the deck", because it is in the deck *as this card's stand-in*.
   */
  const shown = current.options.filter((o) => available(o.name)).slice(0, 3)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, count - 1))
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
      else if (/^[1-9]$/.test(e.key)) {
        // `shown` is already filtered to what can be taken, so a number key
        // can't land on a blocked card.
        const option = shown[Number(e.key) - 1]
        if (option) onChoose(current.from, option.name)
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
              {shown.length === 0
                ? 'Nothing in the pool is close enough'
                : shown.every((o) => o.confidence === 'low')
                  ? 'Nothing does quite the same job — the nearest cards'
                  : 'Pick one'}
            </span>
            <div className="rr-option-row">
              {shown.map((option, i) => {
                const def = findCardDef(option.name)
                const chosen = option.name === current.to
                return (
                  <button
                    key={option.name}
                    type="button"
                    className={`rr-option${chosen ? ' chosen' : ''}`}
                    aria-pressed={chosen}
                    title={option.name}
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
