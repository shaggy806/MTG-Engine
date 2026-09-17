import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { SAMPLE_DECKS, createDefaultRegistry, validateCommanderDeck } from 'engine'
import type { PreconSubstitution } from 'engine'
import type {
  DeckFormatReport,
  ImportDeckLine,
  ImportedCardReport,
  ReplacementOption,
} from '../net/protocol.ts'
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
import './deck-builder.css'

const registry = createDefaultRegistry()

// Same host/port convention as useNetworkGame's SERVER_URL, but http(s) for
// this one-off request/response endpoint rather than the room's WebSocket.
const IMPORT_DECK_URL = `${
  ((import.meta.env.VITE_SERVER_URL as string | undefined) ?? `ws://${window.location.hostname}:4000`)
    .replace(/^ws/, 'http')
}/import-deck`





type Selection = { readonly kind: 'saved'; readonly id: string } | { readonly kind: 'starter'; readonly index: number } | null

/** What the import panel hands back once it's resolved a pasted decklist
 * into a real, saved deck — shown once, above the editor, then dismissed. */
export interface ImportSubstitution {
  readonly from: string
  /** The stand-in currently in the deck. */
  readonly to: string
  /** Every stand-in the server suggested, best first — `to` is one of them. */
  readonly options: readonly ReplacementOption[]
}

export interface ImportReport {
  readonly total: number
  readonly asIs: number
  readonly substituted: readonly ImportSubstitution[]
  readonly dropped: readonly string[]
  /** How many cards kept the specific printing the pasted list named. */
  readonly printings: number
}

export function DeckBuilderPage() {
  const [decks, setDecks] = useState<readonly SavedDeck[]>(() => listDecks())
  const [activeRef, setActiveRefState] = useState(() => getActiveRef())
  const [selection, setSelection] = useState<Selection>(() => {
    const ref = getActiveRef()
    return ref
  })
  const [importing, setImporting] = useState(false)
  const [importReport, setImportReport] = useState<ImportReport | null>(null)

  const refreshDecks = () => setDecks(listDecks())
  const markActive = (ref: NonNullable<Selection>) => {
    setActive(ref)
    setActiveRefState(ref)
  }
  // Clears any lingering import report when navigating away from the deck
  // it belongs to, so it never shows up next to an unrelated deck.
  const selectDeck = (sel: Selection) => {
    setImportReport(null)
    setSelection(sel)
  }

  const selectedDeck =
    selection?.kind === 'saved' ? (decks.find((d) => d.id === selection.id) ?? null) : null
  const starterIndex = selection?.kind === 'starter' ? selection.index : null
  const selectedStarter = starterIndex !== null ? (SAMPLE_DECKS[starterIndex] ?? null) : null

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
            {SAMPLE_DECKS.map((d, i) => (
              <li key={d.name}>
                <button
                  type="button"
                  className={selection?.kind === 'starter' && selection.index === i ? 'selected' : undefined}
                  onClick={() => selectDeck({ kind: 'starter', index: i })}
                >
                  {d.name}
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
              setImporting(false)
            }}
          />
        ) : selectedDeck ? (
          <>
            {importReport ? (
              <ImportReportBanner
                report={importReport}
                deckCards={[...selectedDeck.cards, ...(selectedDeck.commander ? [selectedDeck.commander] : [])]}
                onDismiss={() => setImportReport(null)}
                onSwap={(from, to) => {
                  const current = importReport.substituted.find((s) => s.from === from)
                  if (!current || current.to === to) return
                  // Never a card the deck already holds — the picker disables
                  // those, but the rule belongs here too.
                  if (selectedDeck.commander === to || selectedDeck.cards.includes(to)) return
                  // Exactly this card's one slot: the commander if that's what
                  // it stood in for, otherwise the first copy in the 99.
                  // Replacing every copy by name broke singleton the moment
                  // two originals shared a first choice somewhere down the
                  // list and one was swapped back.
                  const isCommander = selectedDeck.commander === current.to
                  const slot = isCommander ? -1 : selectedDeck.cards.indexOf(current.to)
                  if (!isCommander && slot === -1) return
                  saveDeck({
                    ...selectedDeck,
                    cards: isCommander
                      ? selectedDeck.cards
                      : selectedDeck.cards.map((n, i) => (i === slot ? to : n)),
                    commander: isCommander ? to : selectedDeck.commander,
                  })
                  refreshDecks()
                  setImportReport({
                    ...importReport,
                    substituted: importReport.substituted.map((s) =>
                      s.from === from ? { ...s, to } : s,
                    ),
                  })
                }}
              />
            ) : null}
            <DeckEditor
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
          <StarterViewer
            name={selectedStarter.name}
            commander={selectedStarter.commander}
            cardList={selectedStarter.cards}
            description={selectedStarter.description}
            substitutions={selectedStarter.substitutions}
            isActive={isActive({ kind: 'starter', index: starterIndex })}
            onUseAsIs={() => markActive({ kind: 'starter', index: starterIndex })}
            onDuplicate={() => {
              const copy = duplicateStarter(starterIndex)
              refreshDecks()
              if (copy) selectDeck({ kind: 'saved', id: copy.id })
            }}
          />
        ) : (
          <p className="muted db-prompt">Pick a deck on the left, or start a new one.</p>
        )}
      </main>
    </div>
  )
}

/** How far along the server is, as reported by the import endpoint's
 * `progress` lines. `name` is the card just resolved (null before the first
 * one lands). */
interface ImportProgress {
  readonly done: number
  readonly total: number
  readonly name: string | null
}

/**
 * POSTs a pasted decklist and consumes the endpoint's newline-delimited JSON
 * response, calling `onProgress` as each card is resolved and returning the
 * terminal `result` line. Streamed rather than awaited whole because every
 * card the engine doesn't implement costs a throttled Scryfall round-trip —
 * a 100-card list is tens of seconds of otherwise-silent waiting.
 */
async function importDecklist(
  text: string,
  onProgress: (progress: ImportProgress) => void,
): Promise<{ readonly cards: readonly ImportedCardReport[]; readonly format: DeckFormatReport | null }> {
  const res = await fetch(IMPORT_DECK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? `import failed (${res.status})`)
  }
  const reader = res.body?.getReader()
  if (!reader) throw new Error('import failed: no response body')

  const decoder = new TextDecoder()
  let buffer = ''
  let outcome: { cards: readonly ImportedCardReport[]; format: DeckFormatReport | null } | null = null
  let finished = false
  while (!finished) {
    const chunk = await reader.read()
    finished = chunk.done
    if (chunk.value) buffer += decoder.decode(chunk.value, { stream: true })
    const parts = buffer.split('\n')
    // The last piece is a partial line until the stream ends, at which point
    // everything left is complete.
    buffer = finished ? '' : (parts.pop() ?? '')
    for (const part of parts) {
      if (part.trim() === '') continue
      const line = JSON.parse(part) as ImportDeckLine
      if (line.type === 'progress') onProgress(line)
      else if (line.type === 'result') outcome = { cards: line.cards, format: line.format }
      else throw new Error(line.error)
    }
  }
  if (outcome === null) throw new Error('import ended before the deck was resolved')
  return outcome
}

/**
 * Paste a decklist export, resolve it into a deck the engine can actually
 * play right now: an implemented card is kept as-is, an unimplemented one
 * with a `suggestedReplacement` (see `engine`'s `suggestReplacement`, run
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

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setProgress(null)
    setError(null)
    importDecklist(text, setProgress)
      .then(({ cards: cardReports, format }) => {
        const commanderName = format?.commander ?? null

        const finalCards: string[] = []
        const substituted: ImportSubstitution[] = []
        const dropped: string[] = []
        // Which printing each kept card arrived with, from the pasted list's
        // own `(SET) number` suffixes — only ever present for a card kept
        // as-is, since a substitution is a different card entirely.
        const printings: Record<string, string> = {}
        let commander: string | undefined

        for (const c of cardReports) {
          let resolvedName: string | null = null
          if (c.implemented) {
            resolvedName = c.name
            if (c.printingId !== null) printings[c.name] = c.printingId
          } else if (c.suggestedReplacement) {
            resolvedName = c.suggestedReplacement
            substituted.push({ from: c.name, to: c.suggestedReplacement, options: c.replacements })
          } else {
            dropped.push(c.name)
            continue
          }
          if (c.name === commanderName) {
            commander = resolvedName
          } else {
            for (let i = 0; i < c.count; i += 1) finalCards.push(resolvedName)
          }
        }

        const deck = createDeckFromImport(
          commander ? `Imported: ${commander}` : 'Imported deck',
          finalCards,
          commander,
          printings,
        )
        onImported(deck, {
          total: cardReports.length,
          asIs: cardReports.length - substituted.length - dropped.length,
          substituted,
          dropped,
          printings: Object.keys(printings).length,
        })
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
        <button type="submit" disabled={!text.trim() || loading}>
          {loading ? 'Importing…' : 'Import'}
        </button>
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

const CONFIDENCE_LABEL: Record<ReplacementOption['confidence'], string> = {
  high: 'Close match',
  medium: 'Partial match',
  low: 'Loose match',
}

/** A tag slug as a phrase: "removal-creature" → "removal creature". */
const tagLabel = (slug: string): string => slug.replace(/-/g, ' ')

function ImportReportBanner({
  report,
  deckCards,
  onDismiss,
  onSwap,
}: {
  readonly report: ImportReport
  /** Everything the deck holds now, so a stand-in already in it (which would
   * break singleton) can't be picked for another card. */
  readonly deckCards: readonly string[]
  readonly onDismiss: () => void
  readonly onSwap: (from: string, to: string) => void
}) {
  const inDeck = new Set(deckCards)
  return (
    <div className="db-import-report">
      <div className="db-import-report-head">
        <strong>
          Imported {report.total} card{report.total === 1 ? '' : 's'} — {report.asIs} as-is,{' '}
          {report.substituted.length} substituted, {report.dropped.length} dropped
          {report.printings > 0 ? `, ${report.printings} keeping their printing` : ''}
        </strong>
        <button type="button" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
      {report.substituted.length > 0 ? (
        <ul className="db-import-report-list">
          {report.substituted.map((s) => {
            const chosen = s.options.find((o) => o.name === s.to)
            return (
              <li key={s.from} className="db-import-sub">
                <span className="db-import-sub-from">{s.from}</span>
                <span aria-hidden="true">→</span>
                {s.options.length > 1 ? (
                  <select
                    value={s.to}
                    aria-label={`Stand-in for ${s.from}`}
                    onChange={(e) => onSwap(s.from, e.target.value)}
                  >
                    {s.options.map((o) => (
                      <option
                        key={o.name}
                        value={o.name}
                        // Already in the deck as something else — picking it
                        // would put two copies in a singleton deck.
                        disabled={o.name !== s.to && inDeck.has(o.name)}
                      >
                        {o.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <strong>{s.to}</strong>
                )}
                {chosen ? (
                  <span className={`db-match db-match-${chosen.confidence}`}>
                    {CONFIDENCE_LABEL[chosen.confidence]}
                  </span>
                ) : null}
                {chosen && chosen.sharedTags.length > 0 ? (
                  <span className="muted db-import-sub-tags">
                    both: {chosen.sharedTags.slice(0, 3).map(tagLabel).join(', ')}
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

function StarterViewer({
  name,
  commander,
  cardList,
  description,
  substitutions = [],
  isActive,
  onUseAsIs,
  onDuplicate,
}: {
  readonly name: string
  readonly commander?: string
  readonly cardList: readonly string[]
  readonly description?: string
  readonly substitutions?: readonly PreconSubstitution[]
  readonly isActive: boolean
  readonly onUseAsIs: () => void
  readonly onDuplicate: () => void
}) {
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of cardList) m.set(c, (m.get(c) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [cardList])

  const legal = useMemo(
    () =>
      commander !== undefined &&
      validateCommanderDeck({ commanders: [commander], cards: cardList, size: 100 }, registry).legal,
    [commander, cardList],
  )
  const substitutedIn = useMemo(() => new Set(substitutions.map((s) => s.substitute)), [substitutions])

  return (
    <div className="db-editor">
      <div className="db-editor-head">
        <h2>{name}</h2>
        <div className="db-editor-actions">
          <button type="button" onClick={onUseAsIs} disabled={isActive}>
            {isActive ? 'Active' : 'Use as active'}
          </button>
          <button type="button" onClick={onDuplicate}>
            Duplicate to edit
          </button>
        </div>
      </div>
      {commander ? (
        <p className="muted">
          Commander: <strong>{commander}</strong>
        </p>
      ) : null}
      {description ? <p>{description}</p> : null}
      <p className="muted">
        {cardList.length + (commander ? 1 : 0)} cards
        {legal ? ' · Commander-legal' : ' · not Commander-legal'}
      </p>
      {substitutions.length > 0 ? (
        <details className="db-substitutions">
          <summary>
            {substitutions.length} stand-in{substitutions.length === 1 ? '' : 's'} for cards the
            engine doesn't support yet
          </summary>
          <ul>
            {substitutions.map((s) => (
              <li key={s.original}>
                <strong>{s.substitute}</strong> plays as <em>{s.original}</em>
                <span className="muted"> — {s.reason}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <ul className="db-readonly-list">
        {counts.map(([name, n]) => (
          <li key={name} className={substitutedIn.has(name) ? 'db-stand-in' : undefined}>
            {n > 1 ? `${n}× ` : ''}
            {name}
          </li>
        ))}
      </ul>
    </div>
  )
}
