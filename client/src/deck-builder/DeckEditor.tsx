import { useMemo, useState } from 'react'
import type { DragEvent, MouseEvent } from 'react'
import type { CardDefinition } from 'engine'
import { BUILTIN_CARDS, createDefaultRegistry, validateCommanderDeck } from 'engine'
import { Symbols } from '../ui/Symbols.tsx'
import { CardHoverPreview } from '../ui/CardHoverPreview.tsx'
import type { HoverTarget } from '../ui/CardHoverPreview.tsx'
import type { SavedDeck } from './decks.ts'

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
const byName = new Map(cards.map((c) => [c.name, c]))

const isCommanderEligible = (def: CardDefinition): boolean =>
  def.supertypes.includes('legendary') &&
  (def.types.includes('creature') || def.types.includes('planeswalker'))

/** The drag payload — a bare card name is all the deck pane needs. */
const DRAG_MIME = 'application/x-mtg-card'

/** Deck rows group by type, in the order a decklist usually reads. */
const GROUP_ORDER = [
  'creature',
  'planeswalker',
  'instant',
  'sorcery',
  'artifact',
  'enchantment',
  'land',
] as const
type Group = (typeof GROUP_ORDER)[number] | 'other'

function groupOf(def: CardDefinition | undefined): Group {
  if (def === undefined) return 'other'
  for (const g of GROUP_ORDER) if (def.types.includes(g)) return g
  return 'other'
}

export function DeckEditor({
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
  const [name, setName] = useState(deck.name)
  const [hover, setHover] = useState<HoverTarget | null>(null)
  const [dropActive, setDropActive] = useState(false)

  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of deck.cards) m.set(c, (m.get(c) ?? 0) + 1)
    return m
  }, [deck.cards])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cards.filter((c) => {
      if (typeFilter && !c.types.includes(typeFilter as CardDefinition['types'][number])) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.text.toLowerCase().includes(q) ||
        c.subtypes.some((s) => s.toLowerCase().includes(q))
      )
    })
  }, [query, typeFilter])

  /** The deck's own contents, grouped and alphabetised — plus any name the
   * registry doesn't have, which is what a deck saved before a card was
   * renamed or dropped looks like. The server refuses such a deck outright,
   * so it has to be visible and removable here. */
  const deckRows = useMemo(() => {
    const groups = new Map<Group, { name: string; n: number; def: CardDefinition | undefined }[]>()
    for (const [cardName, n] of [...counts].sort((a, b) => a[0].localeCompare(b[0]))) {
      const def = byName.get(cardName)
      const g = def === undefined ? 'other' : groupOf(def)
      const row = { name: cardName, n, def }
      const existing = groups.get(g)
      if (existing) existing.push(row)
      else groups.set(g, [row])
    }
    return GROUP_ORDER.concat('other' as never)
      .map((g) => ({ group: g as Group, rows: groups.get(g as Group) ?? [] }))
      .filter((s) => s.rows.length > 0)
  }, [counts])

  const unknownNames = useMemo(() => {
    const names = new Set<string>()
    for (const c of deck.cards) if (!byName.has(c)) names.add(c)
    if (deck.commander !== undefined && !byName.has(deck.commander)) names.add(deck.commander)
    return [...names]
  }, [deck.cards, deck.commander])

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
  const removeAll = (cardName: string) =>
    onChange({ ...deck, cards: deck.cards.filter((c) => c !== cardName) })
  const toggleCommander = (cardName: string) =>
    onChange({ ...deck, commander: deck.commander === cardName ? undefined : cardName })

  const hoverProps = (def: CardDefinition | undefined) =>
    def === undefined
      ? {}
      : {
          onMouseEnter: (e: MouseEvent) => setHover({ def, x: e.clientX, y: e.clientY }),
          onMouseMove: (e: MouseEvent) => setHover({ def, x: e.clientX, y: e.clientY }),
          onMouseLeave: () => setHover(null),
        }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDropActive(false)
    const dropped = e.dataTransfer.getData(DRAG_MIME)
    if (dropped && byName.has(dropped)) addCard(dropped)
  }

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

      {unknownNames.length > 0 ? (
        <div className="db-unknown">
          <strong>⚠ {unknownNames.length} card(s) this engine no longer has</strong>
          <span className="muted">
            {' '}
            — a room will refuse this deck until they're gone.
          </span>
          <ul>
            {unknownNames.map((n) => (
              <li key={n}>
                <span className="mono">{n}</span>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...deck,
                      cards: deck.cards.filter((c) => c !== n),
                      commander: deck.commander === n ? undefined : deck.commander,
                    })
                  }
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="db-panes">
        <section className="db-pane db-pane-library">
          <header className="db-pane-head">
            <h3>Card pool</h3>
            <span className="muted mono">{filtered.length}</span>
          </header>
          <div className="db-search-row">
            <input
              className="db-search"
              placeholder={`Search ${cards.length} cards…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
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
              const isThisCommander = deck.commander === c.name
              return (
                <li
                  key={c.name}
                  className={n > 0 || isThisCommander ? 'db-in-deck' : undefined}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_MIME, c.name)
                    e.dataTransfer.effectAllowed = 'copy'
                    setHover(null)
                  }}
                  onDoubleClick={() => addCard(c.name)}
                >
                  <span className="db-card-name" {...hoverProps(c)}>
                    {c.name}
                  </span>
                  {c.manaCost ? <Symbols text={c.manaCost} /> : null}
                  <span className="db-card-row-spacer" />
                  {isCommanderEligible(c) ? (
                    <button
                      type="button"
                      title="Make this the deck's commander"
                      className={isThisCommander ? 'selected' : undefined}
                      onClick={() => toggleCommander(c.name)}
                    >
                      {isThisCommander ? '★' : '☆'}
                    </button>
                  ) : null}
                  {n > 0 ? <span className="db-count mono">×{n}</span> : null}
                  <button type="button" title="Add to deck" onClick={() => addCard(c.name)} disabled={isThisCommander}>
                    +
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section
          className={`db-pane db-pane-deck${dropActive ? ' db-drop-active' : ''}`}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes(DRAG_MIME)) return
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
            setDropActive(true)
          }}
          onDragLeave={() => setDropActive(false)}
          onDrop={onDrop}
        >
          <header className="db-pane-head">
            <h3>This deck</h3>
            <span className="mono">
              {totalCount} / {DECK_SIZE}
            </span>
          </header>

          <div className="db-commander-slot">
            {deck.commander ? (
              <>
                <span className="muted">Commander</span>
                <span
                  className="db-card-name"
                  {...hoverProps(byName.get(deck.commander))}
                >
                  {deck.commander}
                </span>
                <span className="db-card-row-spacer" />
                <button type="button" title="Clear commander" onClick={() => toggleCommander(deck.commander!)}>
                  −
                </button>
              </>
            ) : (
              <span className="muted">
                No commander — pick a legendary creature or planeswalker with ☆
              </span>
            )}
          </div>

          {deck.cards.length === 0 ? (
            <p className="db-empty muted">
              Drag a card here from the pool, or use its <strong>+</strong> button. Double-clicking
              a card adds it too.
            </p>
          ) : (
            <ul className="db-deck-list">
              {deckRows.map(({ group, rows }) => (
                <li key={group} className="db-deck-group">
                  <div className="db-deck-group-head muted">
                    {group} · {rows.reduce((sum, r) => sum + r.n, 0)}
                  </div>
                  <ul>
                    {rows.map((row) => (
                      <li key={row.name} className={row.def === undefined ? 'db-unknown-row' : undefined}>
                        <span className="db-count mono">{row.n}</span>
                        <span className="db-card-name" {...hoverProps(row.def)}>
                          {row.name}
                        </span>
                        {row.def?.manaCost ? <Symbols text={row.def.manaCost} /> : null}
                        <span className="db-card-row-spacer" />
                        <button type="button" title="Remove one" onClick={() => removeCard(row.name)}>
                          −
                        </button>
                        <button type="button" title="Add another" onClick={() => addCard(row.name)}>
                          +
                        </button>
                        <button type="button" title="Remove all copies" onClick={() => removeAll(row.name)}>
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <CardHoverPreview target={hover} />
    </div>
  )
}
