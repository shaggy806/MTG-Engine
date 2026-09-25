import { useCallback, useEffect, useState } from 'react'
import type { CardDefinition } from 'engine/client'
import { resolveArtUrl } from '../ui/art.ts'
import { fetchMorePrintings, fetchPrintings } from './printings.ts'
import type { Printing, PrintingPage } from './printings.ts'

/**
 * Pick which printing of a card a deck brings — the "Change printing…" item
 * on the deck builder's right-click menu.
 *
 * Choosing one stores its Scryfall card id on the deck (`SavedDeck.printings`,
 * keyed by card name), which travels with the deck into a room and comes back
 * out as `VisibleObject.art`, so every device at the table draws the card its
 * owner brought. Nothing about the card's rules changes — the engine resolves
 * a name to one `CardDefinition` regardless of which printing it's wearing.
 */
export function PrintingPicker({
  def,
  current,
  onChoose,
  onClose,
}: {
  readonly def: CardDefinition
  /** The deck's currently-chosen Scryfall id, or `null` for the default. */
  readonly current: string | null
  /** `null` clears the choice, back to the pool's own illustration. */
  readonly onChoose: (id: string | null) => void
  readonly onClose: () => void
}) {
  const [page, setPage] = useState<PrintingPage | null>(null)
  const [extra, setExtra] = useState<readonly Printing[]>([])
  const [nextPage, setNextPage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  // No state reset here — the picker is keyed by card name at its use site,
  // so opening a different card mounts a fresh one rather than reusing this
  // one's already-loaded pages.
  useEffect(() => {
    let live = true
    fetchPrintings(def.name)
      .then((p) => {
        if (!live) return
        setPage(p)
        setNextPage(p.nextPage)
      })
      .catch((e: unknown) => {
        if (live) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      live = false
    }
  }, [def.name])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const loadMore = useCallback(() => {
    if (nextPage === null || loadingMore) return
    setLoadingMore(true)
    fetchMorePrintings(nextPage)
      .then((p) => {
        setExtra((prev) => [...prev, ...p.printings])
        setNextPage(p.nextPage)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoadingMore(false))
  }, [nextPage, loadingMore])

  const printings = page === null ? [] : [...page.printings, ...extra]

  return (
    <div className="db-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="db-modal-box db-printing-picker" onClick={(e) => e.stopPropagation()}>
        <div className="db-modal-head">
          <h3>Printings of {def.name}</h3>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="muted db-printing-note">
          Art only — which printing you bring never changes how a card plays.
        </p>

        {error ? <div className="error-banner">⚠ {error}</div> : null}
        {page === null && error === null ? (
          <p className="muted">Looking up printings…</p>
        ) : null}

        {printings.length > 0 ? (
          <>
            <div className="db-printing-grid">
              <button
                type="button"
                className={`db-printing${current === null ? ' selected' : ''}`}
                onClick={() => onChoose(null)}
              >
                <img src={resolveArtUrl(def.art, def.name, 'normal')} alt="" loading="lazy" />
                <span className="db-printing-label">
                  <strong>Default</strong>
                  <span className="muted">the pool's own art</span>
                </span>
              </button>
              {printings.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`db-printing${current === p.id ? ' selected' : ''}`}
                  onClick={() => onChoose(p.id)}
                  title={`${p.setName} #${p.collectorNumber}${p.artist ? ` — ${p.artist}` : ''}`}
                >
                  {p.image ? (
                    <img src={p.image} alt="" loading="lazy" />
                  ) : (
                    <span className="db-printing-noimage muted">no image</span>
                  )}
                  <span className="db-printing-label">
                    <strong>
                      {p.set} #{p.collectorNumber}
                    </strong>
                    <span className="muted">{p.releasedAt.slice(0, 4)}</span>
                  </span>
                </button>
              ))}
            </div>
            {nextPage !== null ? (
              <button type="button" className="db-printing-more" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : `Load more (${printings.length} of ${page?.total ?? 0})`}
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
