import { useState } from 'react'
import type { FormEvent } from 'react'
import { STARTER_DECKS, commandersOf } from 'engine/client'
import type { PreconSubstitution } from 'engine/client'
import {
  createDeck,
  createDeckFromImport,
  deleteDeck,
  duplicateDeck,
  duplicateStarter,
  getActiveRef,
  listDecks,
  saveDeck,
  setActive,
} from './decks.ts'
import type { SavedDeck } from './decks.ts'
import { DeckEditor } from './DeckEditor.tsx'
import { importDecklist, resolveImport } from './importDeck.ts'
import type { ImportProgress, ImportReport } from './importDeck.ts'
import { ReplacementReview } from './ReplacementReview.tsx'
import { CONFIDENCE_LABEL } from './replacement-labels.ts'
import './deck-builder.css'

type Selection = { readonly kind: 'saved'; readonly id: string } | { readonly kind: 'starter'; readonly index: number } | null

export function DeckBuilderPage() {
  const [decks, setDecks] = useState<readonly SavedDeck[]>(() => listDecks())
  const [activeRef, setActiveRefState] = useState(() => getActiveRef())
  const [selection, setSelection] = useState<Selection>(() => {
    const ref = getActiveRef()
    return ref
  })
  const [importing, setImporting] = useState(false)
  const [importReport, setImportReport] = useState<ImportReport | null>(null)
  /** The stand-in review popup, open over the freshly imported deck. */
  const [reviewing, setReviewing] = useState(false)

  const refreshDecks = () => setDecks(listDecks())
  const markActive = (ref: NonNullable<Selection>) => {
    setActive(ref)
    setActiveRefState(ref)
  }
  // Clears any lingering import report when navigating away from the deck
  // it belongs to, so it never shows up next to an unrelated deck.
  const selectDeck = (sel: Selection) => {
    setImportReport(null)
    setReviewing(false)
    setSelection(sel)
  }

  const selectedDeck =
    selection?.kind === 'saved' ? (decks.find((d) => d.id === selection.id) ?? null) : null
  const starterIndex = selection?.kind === 'starter' ? selection.index : null
  const selectedStarter = starterIndex !== null ? (STARTER_DECKS[starterIndex] ?? null) : null

  const isActive = (ref: NonNullable<Selection>): boolean =>
    activeRef !== null &&
    activeRef.kind === ref.kind &&
    ((ref.kind === 'saved' && activeRef.kind === 'saved' && activeRef.id === ref.id) ||
      (ref.kind === 'starter' && activeRef.kind === 'starter' && activeRef.index === ref.index))

  // A visit from the room seat-picker's deck-picker popup carries the room
  // code along (`?room=<code>`) specifically so this link can return to that
  // same room instead of dropping you back at the bare lobby — see
  // `client/src/lobby/DeckPickerModal.tsx`.
  const roomId = new URLSearchParams(window.location.search).get('room')
  const backHref = roomId ? `/?room=${roomId}` : '/'

  /** Puts `to` in the deck in place of `from`'s current stand-in — from the
   * review popup. */
  const swapStandIn = (from: string, to: string) => {
    if (!importReport || !selectedDeck) return
    const current = importReport.substituted.find((s) => s.from === from)
    if (!current || current.to === to) return
    // Never a card the deck already holds — the picker disables
    // those, but the rule belongs here too.
    if (selectedDeck.commanders.includes(to) || selectedDeck.cards.includes(to)) return
    // Exactly this card's one slot: a commander if that's what
    // it stood in for, otherwise the first copy in the 99.
    // Replacing every copy by name broke singleton the moment
    // two originals shared a first choice somewhere down the
    // list and one was swapped back.
    const commanderSlot = selectedDeck.commanders.indexOf(current.to)
    const isCommander = commanderSlot !== -1
    const slot = isCommander ? -1 : selectedDeck.cards.indexOf(current.to)
    if (!isCommander && slot === -1) return
    saveDeck({
      ...selectedDeck,
      cards: isCommander
        ? selectedDeck.cards
        : selectedDeck.cards.map((n, i) => (i === slot ? to : n)),
      commanders: isCommander
        ? selectedDeck.commanders.map((n, i) => (i === commanderSlot ? to : n))
        : selectedDeck.commanders,
    })
    refreshDecks()
    setImportReport({
      ...importReport,
      substituted: importReport.substituted.map((s) =>
        s.from === from ? { ...s, to } : s,
      ),
    })
  }

  return (
    <div className="db-page">
      <aside className="db-list">
        <a className="link-button db-back" href={backHref}>
          ← Back
        </a>
        <h1>Deck Builder</h1>

        <div className="db-list-section">
          <div className="db-list-head">
            <span>My decks</span>
            <div className="db-list-head-actions">
              <button type="button" onClick={() => setImporting(true)}>
                Import
              </button>
              <button
                type="button"
                onClick={() => {
                  const deck = createDeck(`Deck ${decks.length + 1}`)
                  refreshDecks()
                  selectDeck({ kind: 'saved', id: deck.id })
                  markActive({ kind: 'saved', id: deck.id })
                }}
              >
                + New
              </button>
            </div>
          </div>
          {decks.length === 0 ? <p className="muted db-empty">No decks yet</p> : null}
          <ul>
            {decks.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  className={selection?.kind === 'saved' && selection.id === d.id ? 'selected' : undefined}
                  onClick={() => selectDeck({ kind: 'saved', id: d.id })}
                >
                  {d.name}
                  {isActive({ kind: 'saved', id: d.id }) ? <span className="db-active-badge">active</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="db-list-section">
          <div className="db-list-head">
            <span>Starter decks</span>
          </div>
          <p className="muted db-note">Ready to play as-is, or duplicate to edit.</p>
          <ul>
            {STARTER_DECKS.map((d, i) => (
              <li key={d.name}>
                <button
                  type="button"
                  className={selection?.kind === 'starter' && selection.index === i ? 'selected' : undefined}
                  onClick={() => selectDeck({ kind: 'starter', index: i })}
                >
                  {/* With its commander, as the lobby's deck picker lists it:
                      the name alone doesn't say what the deck plays. */}
                  <span className="db-starter-text">
                    <span>{d.name}</span>
                    <span className="db-starter-commander">{commandersOf(d).join(' & ')}</span>
                  </span>
                  {isActive({ kind: 'starter', index: i }) ? <span className="db-active-badge">active</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="db-detail">
        {importing ? (
          <ImportPanel
            onCancel={() => setImporting(false)}
            onImported={(deck, report) => {
              refreshDecks()
              setActiveRefState(getActiveRef())
              setSelection({ kind: 'saved', id: deck.id })
              setImportReport(report)
              // Straight into choosing stand-ins, card by card — they were
              // filled with each card's first suggestion so the deck is
              // playable either way.
              setReviewing(report.substituted.some((s) => s.options.length > 1))
              setImporting(false)
            }}
          />
        ) : selectedDeck ? (
          <>
            {importReport ? (
              <ImportReportBanner
                report={importReport}
                onDismiss={() => setImportReport(null)}
                onReview={() => setReviewing(true)}
              />
            ) : null}
            {importReport && reviewing ? (
              <ReplacementReview
                substitutions={importReport.substituted.filter((s) => s.options.length > 0)}
                deckCards={[...selectedDeck.cards, ...selectedDeck.commanders]}
                onChoose={swapStandIn}
                onClose={() => setReviewing(false)}
              />
            ) : null}
            {/* Keyed by deck, so switching decks starts the editor over —
                its name field is local state seeded from the deck, and kept
                the last deck's name, which leaving the field then saved
                onto this one. */}
            <DeckEditor
              key={selectedDeck.id}
              deck={selectedDeck}
              isActive={isActive({ kind: 'saved', id: selectedDeck.id })}
              onChange={(next) => {
                saveDeck(next)
                refreshDecks()
              }}
              onMakeActive={() => markActive({ kind: 'saved', id: selectedDeck.id })}
              onDuplicate={() => {
                const copy = duplicateDeck(selectedDeck.id)
                refreshDecks()
                if (copy) selectDeck({ kind: 'saved', id: copy.id })
              }}
              onDelete={() => {
                deleteDeck(selectedDeck.id)
                refreshDecks()
                selectDeck(null)
                setActiveRefState(getActiveRef())
              }}
            />
          </>
        ) : selectedStarter && starterIndex !== null ? (
          <DeckEditor
            key={`starter-${starterIndex}`}
            deck={{
              id: `starter-${starterIndex}`,
              name: selectedStarter.name,
              commanders: commandersOf(selectedStarter),
              cards: selectedStarter.cards,
            }}
            isActive={isActive({ kind: 'starter', index: starterIndex })}
            onMakeActive={() => markActive({ kind: 'starter', index: starterIndex })}
            onDuplicate={() => {
              const copy = duplicateStarter(starterIndex)
              refreshDecks()
              if (copy) selectDeck({ kind: 'saved', id: copy.id })
            }}
            intro={<StarterIntro description={selectedStarter.description} substitutions={selectedStarter.substitutions} />}
            standIns={new Set((selectedStarter.substitutions ?? []).map((sub) => sub.substitute))}
          />
        ) : (
          <p className="muted db-prompt">Pick a deck on the left, or start a new one.</p>
        )}
      </main>
    </div>
  )
}

/**
 * Paste a decklist export, resolve it into a deck the engine can actually
 * play right now: an implemented card is kept as-is, an unimplemented one
 * with a `suggestedReplacement` (see `engine`'s `assignReplacements`, run
 * server-side against the pool) is swapped in instead, and anything with no
 * match at all (or not found on Scryfall) is dropped. Saves the result via
 * `createDeckFromImport` and hands the new deck + a summary back to the
 * caller — this component's own job ends there, it doesn't render the
 * summary itself (see `ImportReportBanner`, shown above the editor once
 * this closes).
 */
function ImportPanel({
  onImported,
  onCancel,
}: {
  readonly onImported: (deck: SavedDeck, report: ImportReport) => void
  readonly onCancel: () => void
}) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  /** Why the Paste button couldn't fill the box, when it couldn't. */
  const [pasteNote, setPasteNote] = useState<string | null>(null)

  // The clipboard, read on the click (which is what lets a browser allow
  // it). Where it's refused, or the browser has no `readText`, the box still
  // takes Ctrl+V, so the button says so rather than doing nothing.
  const paste = () => {
    setPasteNote(null)
    const read = navigator.clipboard?.readText?.bind(navigator.clipboard)
    if (read === undefined) {
      setPasteNote("This browser won't let the page read the clipboard: press Ctrl+V in the box.")
      return
    }
    read()
      .then((clip) => {
        if (clip.trim() === '') setPasteNote('The clipboard is empty.')
        else setText(clip)
      })
      .catch(() => setPasteNote("The browser didn't allow reading the clipboard: press Ctrl+V in the box."))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setProgress(null)
    setError(null)
    importDecklist(text, setProgress)
      .then(({ cards: cardReports, format }) => {
        const resolved = resolveImport(cardReports, format)
        const deck = createDeckFromImport(resolved.name, resolved.cards, resolved.commanders, resolved.printings)
        onImported(deck, resolved.report)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  }

  return (
    <div className="db-editor db-import-panel">
      <div className="db-editor-head">
        <h2>Import a decklist</h2>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <p className="muted">
        Paste a plain-text decklist export (Moxfield's "Export" feature, either with or without
        the "(SET) collector-number" printing suffix). Any card the engine doesn't implement yet
        is automatically swapped for a similar one already in the pool — you'll see exactly what
        changed before you keep it.
      </p>
      <form onSubmit={submit}>
        <textarea
          className="db-import-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder={'Commander\n1 Ureni of the Unwritten\n\nDeck\n1 Sol Ring\n...'}
        />
        <div className="db-import-actions">
          <button type="button" onClick={paste} disabled={loading}>
            Paste from clipboard
          </button>
          <button type="submit" disabled={!text.trim() || loading}>
            {loading ? 'Importing…' : 'Import'}
          </button>
        </div>
        {pasteNote !== null ? <p className="muted db-import-note">{pasteNote}</p> : null}
      </form>
      {loading ? <ImportProgressBar progress={progress} /> : null}
      {error ? <div className="error-banner">⚠ {error}</div> : null}
    </div>
  )
}

/** Live progress while the server resolves a pasted list. Before the first
 * line lands (the request is still in flight) there's no total yet, so it
 * shows an indeterminate "Contacting the server…" state rather than a
 * misleading 0%. */
function ImportProgressBar({ progress }: { readonly progress: ImportProgress | null }) {
  const pct =
    progress === null || progress.total === 0
      ? 0
      : Math.round((progress.done / progress.total) * 100)
  return (
    <div className="db-import-progress">
      <div className="db-import-progress-track">
        <div
          className={`db-import-progress-fill${progress === null ? ' indeterminate' : ''}`}
          style={progress === null ? undefined : { width: `${pct}%` }}
        />
      </div>
      <div className="db-import-progress-label">
        {progress === null ? (
          <span className="muted">Contacting the server…</span>
        ) : (
          <>
            <span>
              {progress.done} / {progress.total} cards
            </span>
            <span className="muted db-import-progress-card">
              {progress.name ?? 'Looking up cards…'}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

function ImportReportBanner({
  report,
  onDismiss,
  onReview,
}: {
  readonly report: ImportReport
  readonly onDismiss: () => void
  /** Opens the card-by-card stand-in review. */
  readonly onReview: () => void
}) {
  return (
    <div className="db-import-report">
      <div className="db-import-report-head">
        <strong>
          Imported {report.total} card{report.total === 1 ? '' : 's'} — {report.asIs} as-is,{' '}
          {report.substituted.length} substituted, {report.dropped.length} dropped
          {report.printings > 0 ? `, ${report.printings} keeping their printing` : ''}
        </strong>
        <span className="db-import-report-actions">
          {report.substituted.some((s) => s.options.length > 1) ? (
            <button type="button" onClick={onReview}>
              Review stand-ins
            </button>
          ) : null}
          <button type="button" onClick={onDismiss}>
            Dismiss
          </button>
        </span>
      </div>
      {report.substituted.length > 0 ? (
        <ul className="db-import-report-list">
          {report.substituted.map((s) => {
            const chosen = s.options.find((o) => o.name === s.to)
            return (
              <li key={s.from} className="db-import-sub">
                <span className="db-import-sub-from">{s.from}</span>
                <span aria-hidden="true">→</span>
                <strong>{s.to}</strong>
                {chosen ? (
                  <span className={`db-match db-match-${chosen.confidence}`}>
                    {CONFIDENCE_LABEL[chosen.confidence]}
                  </span>
                ) : null}

              </li>
            )
          })}
        </ul>
      ) : null}
      {report.dropped.length > 0 ? (
        <p className="muted">Couldn't find a match for: {report.dropped.join(', ')}</p>
      ) : null}
    </div>
  )
}

/** What a starter deck shows above its list: its one-line description, and
 * the stand-ins playing for cards the engine doesn't implement yet (each
 * marked in the list with an asterisk). */
function StarterIntro({
  description,
  substitutions = [],
}: {
  readonly description?: string
  readonly substitutions?: readonly PreconSubstitution[]
}) {
  return (
    <>
      {description ? <p className="db-starter-description">{description}</p> : null}
      {substitutions.length > 0 ? (
        <details className="db-substitutions">
          <summary>
            {substitutions.length} stand-in{substitutions.length === 1 ? '' : 's'} for cards the
            engine doesn't support yet
          </summary>
          <ul>
            {substitutions.map((sub) => (
              <li key={sub.original}>
                <strong>{sub.substitute}</strong> plays as <em>{sub.original}</em>
                <span className="muted"> — {sub.reason}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  )
}
