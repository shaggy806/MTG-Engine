import { useCallback, useMemo, useState } from 'react'
import type { DragEvent, MouseEvent } from 'react'
import type { CardDefinition } from 'engine/client'
import {
  canCommandAlone,
  canPairCommanders,
  hasPartner,
  isDeckableCard,
  validateCommanderDeck,
} from 'engine/client'
import { cardPool } from '../cards/cardData.ts'
import { Symbols } from '../ui/Symbols.tsx'
import { CardHoverPreview } from '../ui/CardHoverPreview.tsx'
import type { HoverTarget } from '../ui/CardHoverPreview.tsx'
import { CardContextMenu } from './CardContextMenu.tsx'
import type { MenuAnchor, MenuItem } from './CardContextMenu.tsx'
import { PrintingPicker } from './PrintingPicker.tsx'
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

let buildable: readonly CardDefinition[] | null = null

/** The buildable pool, by name. Tokens and back faces are registered
 * definitions but neither is a decklist entry — a token isn't a card at all
 * (rule 111.1), and a double-faced card is listed under its front face (rule
 * 712.3) — so they're filtered out here rather than offered and then rejected
 * by `validateCommanderDeck`. Built from the card pool on first use:
 * `main.tsx` loads the whole pool before rendering the deck builder. */
function buildableCards(): readonly CardDefinition[] {
  buildable ??= cardPool().cards.filter(isDeckableCard)
  return buildable
}

/** Every definition, including the ones the buildable pool hides: a deck
 * saved before that filter existed can still name one, and such a row has to
 * render (and be removable) rather than showing up as an unknown card. */
const cardNamed = (name: string): CardDefinition | undefined => cardPool().byName.get(name)

/**
 * A deck's commanders once `cardName` is starred. Starring a commander again
 * demotes it. Otherwise the card joins a commander it can partner with (rule
 * 702.124c) — keeping, out of a full pair, the first one that can — and
 * partnering with none of them it replaces them, which is what starring a
 * second legend always did.
 */
function toggledCommanders(commanders: readonly string[], cardName: string): readonly string[] {
  if (commanders.includes(cardName)) return commanders.filter((n) => n !== cardName)
  const partner = commanders.find((n) => canPairCommanders(cardPool().registry, n, cardName))
  return partner === undefined ? [cardName] : [partner, cardName]
}

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
  const [menu, setMenu] = useState<MenuAnchor | null>(null)
  /** Which card's printing picker is open, by name. */
  const [picking, setPicking] = useState<string | null>(null)

  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of deck.cards) m.set(c, (m.get(c) ?? 0) + 1)
    return m
  }, [deck.cards])

  /** Rows of the pool list shown at once. Larger than the library's page
   * because a row here is text rather than a card image, so it costs far less
   * per entry — but the list still can't render a pool heading for thousands
   * of cards all at once. */
  const POOL_PAGE_SIZE = 100

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return buildableCards().filter((c) => {
      if (typeFilter && !c.types.includes(typeFilter as CardDefinition['types'][number])) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.text.toLowerCase().includes(q) ||
        c.subtypes.some((s) => s.toLowerCase().includes(q))
      )
    })
  }, [query, typeFilter])

  const [poolPage, setPoolPage] = useState(0)
  const poolPageCount = Math.max(1, Math.ceil(filtered.length / POOL_PAGE_SIZE))
  // Reset to the first page during render whenever the search changes — see
  // the same pattern (and why it isn't an effect) in `LibraryPage`.
  const poolKey = `${query}|${typeFilter ?? ''}`
  const [pagedFor, setPagedFor] = useState(poolKey)
  if (pagedFor !== poolKey) {
    setPagedFor(poolKey)
    setPoolPage(0)
  }
  const poolPageSafe = Math.min(poolPage, poolPageCount - 1)
  const poolRows = useMemo(
    () => filtered.slice(poolPageSafe * POOL_PAGE_SIZE, (poolPageSafe + 1) * POOL_PAGE_SIZE),
    [filtered, poolPageSafe],
  )

  /** The deck's own contents, grouped and alphabetised — plus any name the
   * registry doesn't have, which is what a deck saved before a card was
   * renamed or dropped looks like. The server refuses such a deck outright,
   * so it has to be visible and removable here. */
  const deckRows = useMemo(() => {
    const groups = new Map<Group, { name: string; n: number; def: CardDefinition | undefined }[]>()
    for (const [cardName, n] of [...counts].sort((a, b) => a[0].localeCompare(b[0]))) {
      const def = cardNamed(cardName)
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
    for (const c of deck.cards) if (cardNamed(c) === undefined) names.add(c)
    for (const c of deck.commanders) if (cardNamed(c) === undefined) names.add(c)
    return [...names]
  }, [deck.cards, deck.commanders])

  const totalCount = deck.cards.length + deck.commanders.length

  const legality = useMemo(
    () =>
      validateCommanderDeck({ commanders: deck.commanders, cards: deck.cards, size: DECK_SIZE }, cardPool().registry),
    [deck.commanders, deck.cards],
  )

  const addCard = (cardName: string) => onChange({ ...deck, cards: [...deck.cards, cardName] })
  const removeCard = (cardName: string) => {
    const i = deck.cards.indexOf(cardName)
    if (i === -1) return
    onChange({ ...deck, cards: [...deck.cards.slice(0, i), ...deck.cards.slice(i + 1)] })
  }
  const removeAll = (cardName: string) =>
    onChange({ ...deck, cards: deck.cards.filter((c) => c !== cardName) })
  /**
   * Move a card into the command zone, or out of it.
   *
   * Promoting a card **takes one copy out of the 99**, which is not a nicety:
   * the commander is stored beside `cards` rather than in it, so a card that is
   * both would be two copies of itself and break singleton the moment it was
   * promoted. That was reachable before this — starring a pool card already in
   * the deck did exactly that — and it becomes the common case now the button
   * sits on the deck rows themselves.
   *
   * Demoting leaves the card out of the 99, matching what "Clear commander"
   * has always done: the slot empties and you pick again. So does a
   * commander that a newly starred card replaces. See `toggledCommanders`
   * for which one that is.
   */
  const toggleCommander = (cardName: string) => {
    const commanders = toggledCommanders(deck.commanders, cardName)
    if (deck.commanders.includes(cardName)) {
      onChange({ ...deck, commanders })
      return
    }
    const at = deck.cards.indexOf(cardName)
    const cards = at === -1 ? deck.cards : [...deck.cards.slice(0, at), ...deck.cards.slice(at + 1)]
    onChange({ ...deck, commanders, cards })
  }

  /** What starring `cardName` would do, for its button's tooltip and its
   * menu item — pairing and replacing look the same until they happen. */
  const commanderAction = (cardName: string): string => {
    if (deck.commanders.includes(cardName)) return 'Clear commander'
    const next = toggledCommanders(deck.commanders, cardName)
    const replaced = deck.commanders.filter((n) => !next.includes(n))
    const replacing = replaced.length === 0 ? '' : ` (replacing ${replaced.join(' and ')})`
    return next.length === 2 ? `Pair with ${next[0]} as a second commander${replacing}` : `Make commander${replacing}`
  }

  /** Records (or clears) which printing this deck brings for one card.
   * `null` drops the entry entirely rather than storing a sentinel, so a
   * deck that never leaves a default carries no `printings` at all. */
  const setPrinting = (cardName: string, id: string | null) => {
    const next = { ...deck.printings }
    if (id === null) delete next[cardName]
    else next[cardName] = id
    onChange({
      ...deck,
      printings: Object.keys(next).length === 0 ? undefined : next,
    })
  }

  /** Spread onto a whole card *row*, not just its name: the row is the drag
   * handle and the click target, so that's the area a preview should follow
   * — catching the pointer only over the text made it feel broken anywhere
   * else along the row. */
  const hoverProps = (def: CardDefinition | undefined) => {
    if (def === undefined) return {}
    // The preview shows the printing this deck brings, not the pool's own
    // art — otherwise picking one gave no feedback anywhere in the builder.
    const at = (e: MouseEvent): HoverTarget => ({
      def,
      x: e.clientX,
      y: e.clientY,
      art: deck.printings?.[def.name] ?? null,
    })
    return {
      onMouseEnter: (e: MouseEvent) => setHover(at(e)),
      onMouseMove: (e: MouseEvent) => setHover(at(e)),
      onMouseLeave: () => setHover(null),
    }
  }

  /**
   * Right-click on a card row. `extra` is whatever that row's own buttons
   * do, so the menu is a superset of what's already visible rather than a
   * second, different vocabulary — "Change printing…" is the one thing it
   * offers that has nowhere else to live.
   */
  const menuProps = (def: CardDefinition | undefined, extra: readonly MenuItem[]) =>
    def === undefined
      ? {}
      : {
          onContextMenu: (e: MouseEvent) => {
            e.preventDefault()
            setHover(null)
            setMenu({
              x: e.clientX,
              y: e.clientY,
              title: def.name,
              items: [
                { label: 'Change printing…', onSelect: () => setPicking(def.name) },
                ...extra.map((item, i) => (i === 0 ? { ...item, separated: true } : item)),
              ],
            })
          },
        }

  // Stable, because `CardContextMenu` registers it as a window listener.
  const closeMenu = useCallback(() => setMenu(null), [])
  const pickingDef = picking === null ? null : (cardNamed(picking) ?? null)

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDropActive(false)
    const dropped = e.dataTransfer.getData(DRAG_MIME)
    if (dropped && cardNamed(dropped) !== undefined) addCard(dropped)
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
                      commanders: deck.commanders.filter((c) => c !== n),
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
              placeholder={`Search ${buildableCards().length} cards…`}
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
            {poolRows.map((c) => {
              const n = counts.get(c.name) ?? 0
              const isThisCommander = deck.commanders.includes(c.name)
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
                  {...hoverProps(c)}
                  {...menuProps(c, [
                    {
                      label: 'Add to deck',
                      onSelect: () => addCard(c.name),
                      disabled: isThisCommander,
                    },
                    ...(canCommandAlone(c)
                      ? [
                          {
                            label: commanderAction(c.name),
                            onSelect: () => toggleCommander(c.name),
                          },
                        ]
                      : []),
                    ...(n > 0
                      ? [{ label: 'Remove one', onSelect: () => removeCard(c.name) }]
                      : []),
                  ])}
                >
                  <span className="db-card-name">{c.name}</span>
                  {deck.printings?.[c.name] ? (
                    <span className="db-printing-mark" title="Custom printing">
                      ◆
                    </span>
                  ) : null}
                  {c.manaCost ? <Symbols text={c.manaCost} /> : null}
                  <span className="db-card-row-spacer" />
                  {canCommandAlone(c) ? (
                    <button
                      type="button"
                      title={commanderAction(c.name)}
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
          {poolPageCount > 1 ? (
            <nav className="db-pager" aria-label="Card pool pages">
              <button
                type="button"
                onClick={() => setPoolPage(poolPageSafe - 1)}
                disabled={poolPageSafe === 0}
              >
                ←
              </button>
              <span className="muted mono">
                {poolPageSafe + 1}/{poolPageCount}
              </span>
              <button
                type="button"
                onClick={() => setPoolPage(poolPageSafe + 1)}
                disabled={poolPageSafe >= poolPageCount - 1}
              >
                →
              </button>
            </nav>
          ) : null}
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

          <div className="db-commander-slots">
            {deck.commanders.map((commander) => (
              <div
                key={commander}
                className="db-commander-slot"
                {...hoverProps(cardNamed(commander))}
                {...menuProps(cardNamed(commander), [
                  { label: 'Clear commander', onSelect: () => toggleCommander(commander) },
                ])}
              >
                <span className="muted">Commander</span>
                <span className="db-card-name">{commander}</span>
                {deck.printings?.[commander] ? (
                  <span className="db-printing-mark" title="Custom printing">
                    ◆
                  </span>
                ) : null}
                <span className="db-card-row-spacer" />
                <button type="button" title="Clear commander" onClick={() => toggleCommander(commander)}>
                  −
                </button>
              </div>
            ))}
            {deck.commanders.length === 0 ? (
              <div className="db-commander-slot">
                <span className="muted">
                  No commander — pick a legendary creature, or another card that can command, with ☆
                </span>
              </div>
            ) : deck.commanders.length === 1 && hasPartner(cardPool().registry, deck.commanders[0]) ? (
              <p className="db-commander-hint muted">
                {deck.commanders[0]} has Partner — ☆ another commander with Partner to add a second.
              </p>
            ) : null}
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
                      <li
                        key={row.name}
                        className={row.def === undefined ? 'db-unknown-row' : undefined}
                        {...hoverProps(row.def)}
                        {...menuProps(row.def, [
                          { label: 'Add another', onSelect: () => addCard(row.name) },
                          { label: 'Remove one', onSelect: () => removeCard(row.name) },
                          { label: 'Remove all copies', onSelect: () => removeAll(row.name) },
                          // Promoting from here matters most right after an
                          // import: a decklist that didn't label its commander
                          // gets one guessed, and fixing that meant hunting the
                          // right card down in the pool.
                          ...(row.def !== undefined && canCommandAlone(row.def)
                            ? [
                                {
                                  label: commanderAction(row.name),
                                  onSelect: () => toggleCommander(row.name),
                                },
                              ]
                            : []),
                        ])}
                      >
                        <span className="db-count mono">{row.n}</span>
                        <span className="db-card-name">{row.name}</span>
                        {deck.printings?.[row.name] ? (
                          <span className="db-printing-mark" title="Custom printing">
                            ◆
                          </span>
                        ) : null}
                        {row.def?.manaCost ? <Symbols text={row.def.manaCost} /> : null}
                        <span className="db-card-row-spacer" />
                        {row.def !== undefined && canCommandAlone(row.def) ? (
                          <button
                            type="button"
                            title={commanderAction(row.name)}
                            onClick={() => toggleCommander(row.name)}
                          >
                            ☆
                          </button>
                        ) : null}
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

      {/* The preview is suppressed while the menu is open: the pointer is
          still over the row that opened it, so the two otherwise overlap. */}
      <CardHoverPreview target={menu === null ? hover : null} />
      <CardContextMenu anchor={menu} onClose={closeMenu} />
      {pickingDef ? (
        <PrintingPicker
          key={pickingDef.name}
          def={pickingDef}
          current={deck.printings?.[pickingDef.name] ?? null}
          onChoose={(id) => {
            setPrinting(pickingDef.name, id)
            setPicking(null)
          }}
          onClose={() => setPicking(null)}
        />
      ) : null}
    </div>
  )
}
