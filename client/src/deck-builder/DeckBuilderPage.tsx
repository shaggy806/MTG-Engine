import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { CardDefinition } from 'engine'
import { BUILTIN_CARDS, SAMPLE_DECKS, createDefaultRegistry, validateCommanderDeck } from 'engine'
import { Symbols } from '../ui/Symbols.tsx'
import type { DeckFormatReport, ImportedCardReport } from '../net/protocol.ts'
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
import './deck-builder.css'

// Same host/port convention as useNetworkGame's SERVER_URL, but http(s) for
// this one-off request/response endpoint rather than the room's WebSocket.
const IMPORT_DECK_URL = `${
  ((import.meta.env.VITE_SERVER_URL as string | undefined) ?? `ws://${window.location.hostname}:4000`)
    .replace(/^ws/, 'http')
}/import-deck`

const TYPE_FILTERS = [
  'creature',
  'instant',
  'sorcery',
  'artifact',
  'enchantment',
  'planeswalker',
  'land',
] as const

const DECK_SIZE = 100

const cards = [...BUILTIN_CARDS].sort((a, b) => a.name.localeCompare(b.name))
const registry = createDefaultRegistry()

const isCommanderEligible = (def: CardDefinition): boolean =>
  def.supertypes.includes('legendary') &&
  (def.types.includes('creature') || def.types.includes('planeswalker'))

type Selection = { readonly kind: 'saved'; readonly id: string } | { readonly kind: 'starter'; readonly index: number } | null

/** What the import panel hands back once it's resolved a pasted decklist
 * into a real, saved deck — shown once, above the editor, then dismissed. */
export interface ImportReport {
  readonly total: number
  readonly asIs: number
  readonly substituted: readonly { readonly from: string; readonly to: string }[]
  readonly dropped: readonly string[]
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

  return (
    <div className="db-page">
      <aside className="db-list">
        <a className="link-button db-back" href="/">
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
              <ImportReportBanner report={importReport} onDismiss={() => setImportReport(null)} />
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
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    fetch(IMPORT_DECK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          cards?: ImportedCardReport[]
          format?: DeckFormatReport
          error?: string
        }
        if (!res.ok) throw new Error(data.error ?? 'import failed')
        const cardReports = data.cards ?? []
        const commanderName = data.format?.commander ?? null

        const finalCards: string[] = []
        const substituted: { from: string; to: string }[] = []
        const dropped: string[] = []
        let commander: string | undefined

        for (const c of cardReports) {
          let resolvedName: string | null = null
          if (c.implemented) {
            resolvedName = c.name
          } else if (c.suggestedReplacement) {
            resolvedName = c.suggestedReplacement
            substituted.push({ from: c.name, to: c.suggestedReplacement })
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
        )
        onImported(deck, {
          total: cardReports.length,
          asIs: cardReports.length - substituted.length - dropped.length,
          substituted,
          dropped,
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
      {error ? <div className="error-banner">⚠ {error}</div> : null}
    </div>
  )
}

function ImportReportBanner({
  report,
  onDismiss,
}: {
  readonly report: ImportReport
  readonly onDismiss: () => void
}) {
  return (
    <div className="db-import-report">
      <div className="db-import-report-head">
        <strong>
          Imported {report.total} card{report.total === 1 ? '' : 's'} — {report.asIs} as-is,{' '}
          {report.substituted.length} substituted, {report.dropped.length} dropped
        </strong>
        <button type="button" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
      {report.substituted.length > 0 ? (
        <ul className="db-import-report-list">
          {report.substituted.map((s, i) => (
            <li key={i}>
              {s.from} → <strong>{s.to}</strong>
            </li>
          ))}
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
  isActive,
  onUseAsIs,
  onDuplicate,
}: {
  readonly name: string
  readonly commander?: string
  readonly cardList: readonly string[]
  readonly isActive: boolean
  readonly onUseAsIs: () => void
  readonly onDuplicate: () => void
}) {
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of cardList) m.set(c, (m.get(c) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [cardList])

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
      <p className="muted">{cardList.length} cards (not Commander-legal — a themed showcase deck)</p>
      <ul className="db-readonly-list">
        {counts.map(([name, n]) => (
          <li key={name}>
            {n > 1 ? `${n}× ` : ''}
            {name}
          </li>
        ))}
      </ul>
    </div>
  )
}

function DeckEditor({
  deck,
  isActive,
  onChange,
  onMakeActive,
  onDuplicate,
  onDelete,
}: {
  readonly deck: SavedDeck
  readonly isActive: boolean
  readonly onChange: (next: SavedDeck) => void
  readonly onMakeActive: () => void
  readonly onDuplicate: () => void
  readonly onDelete: () => void
}) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [onlyInDeck, setOnlyInDeck] = useState(false)
  const [name, setName] = useState(deck.name)

  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of deck.cards) m.set(c, (m.get(c) ?? 0) + 1)
    return m
  }, [deck.cards])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cards.filter((c) => {
      if (typeFilter && !c.types.includes(typeFilter as CardDefinition['types'][number])) return false
      if (onlyInDeck && (counts.get(c.name) ?? 0) === 0 && deck.commander !== c.name) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.text.toLowerCase().includes(q) ||
        c.subtypes.some((s) => s.toLowerCase().includes(q))
      )
    })
  }, [query, typeFilter, onlyInDeck, counts, deck.commander])

  const totalCount = deck.cards.length + (deck.commander ? 1 : 0)

  const legality = useMemo(
    () =>
      validateCommanderDeck(
        { commanders: deck.commander ? [deck.commander] : [], cards: deck.cards, size: DECK_SIZE },
        registry,
      ),
    [deck.commander, deck.cards],
  )

  const addCard = (cardName: string) => onChange({ ...deck, cards: [...deck.cards, cardName] })
  const removeCard = (cardName: string) => {
    const i = deck.cards.indexOf(cardName)
    if (i === -1) return
    onChange({ ...deck, cards: [...deck.cards.slice(0, i), ...deck.cards.slice(i + 1)] })
  }
  const toggleCommander = (cardName: string) =>
    onChange({ ...deck, commander: deck.commander === cardName ? undefined : cardName })

  return (
    <div className="db-editor">
      <div className="db-editor-head">
        <input
          className="db-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name.trim() && name !== deck.name) onChange({ ...deck, name: name.trim() })
          }}
        />
        <div className="db-editor-actions">
          <button type="button" onClick={onMakeActive} disabled={isActive}>
            {isActive ? 'Active' : 'Make active'}
          </button>
          <button type="button" onClick={onDuplicate}>
            Duplicate
          </button>
          <button type="button" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className="db-summary">
        <span>
          {deck.commander ? (
            <>
              Commander: <strong>{deck.commander}</strong>
            </>
          ) : (
            <span className="muted">No commander set</span>
          )}
        </span>
        <span className="mono">
          {totalCount} / {DECK_SIZE}
        </span>
      </div>

      <div className={`db-legality ${legality.legal ? 'legal' : 'illegal'}`}>
        <strong>{legality.legal ? '✓ Commander-legal' : `✗ ${legality.violations.length} issue(s)`}</strong>
        <span className="muted"> · identity: {legality.identity || 'colourless'}</span>
        {legality.violations.length > 0 ? (
          <ul>
            {legality.violations.slice(0, 6).map((v, i) => (
              <li key={i}>{v}</li>
            ))}
            {legality.violations.length > 6 ? <li className="muted">…and {legality.violations.length - 6} more</li> : null}
          </ul>
        ) : null}
      </div>

      <div className="db-search-row">
        <input
          className="db-search"
          placeholder={`Search ${cards.length} cards…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="db-toggle">
          <input type="checkbox" checked={onlyInDeck} onChange={(e) => setOnlyInDeck(e.target.checked)} />
          in this deck
        </label>
      </div>
      <div className="db-type-filters">
        <button type="button" className={typeFilter === null ? 'selected' : undefined} onClick={() => setTypeFilter(null)}>
          all
        </button>
        {TYPE_FILTERS.map((t) => (
          <button
            key={t}
            type="button"
            className={typeFilter === t ? 'selected' : undefined}
            onClick={() => setTypeFilter(typeFilter === t ? null : t)}
          >
            {t}
          </button>
        ))}
      </div>

      <ul className="db-card-list">
        {filtered.map((c) => {
          const n = counts.get(c.name) ?? 0
          const eligible = isCommanderEligible(c)
          const isThisCommander = deck.commander === c.name
          return (
            <li key={c.name} className={n > 0 || isThisCommander ? 'db-in-deck' : undefined}>
              <span className="db-card-name">{c.name}</span>
              {c.manaCost ? <Symbols text={c.manaCost} /> : null}
              <span className="db-card-row-spacer" />
              {eligible ? (
                <button type="button" className={isThisCommander ? 'selected' : undefined} onClick={() => toggleCommander(c.name)}>
                  {isThisCommander ? '★ commander' : 'commander'}
                </button>
              ) : null}
              {n > 0 ? (
                <>
                  <span className="db-count mono">×{n}</span>
                  <button type="button" onClick={() => removeCard(c.name)}>
                    −
                  </button>
                </>
              ) : null}
              <button type="button" onClick={() => addCard(c.name)} disabled={isThisCommander}>
                +
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
