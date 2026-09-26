import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FocusEvent, MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import type { CardDefinition, CardType, Color } from 'engine/client'
import {
  canCommandAlone,
  edhrecRankOf,
  isCardFront,
  isTokenCard,
  manaValue,
  parseManaCost,
  tokensCreatedBy,
} from 'engine/client'
import { cardPool } from '../cards/cardData.ts'
import { CardImage } from '../ui/CardImage.tsx'
import { Symbols } from '../ui/Symbols.tsx'
import './library.css'

const TYPE_FILTERS = [
  'creature',
  'instant',
  'sorcery',
  'artifact',
  'enchantment',
  'planeswalker',
  'land',
] as const

/** WUBRG plus a colourless bucket, in the order every Magic UI prints them. */
const COLOR_FILTERS = ['W', 'U', 'B', 'R', 'G', 'C'] as const
type ColorFilter = (typeof COLOR_FILTERS)[number]

const COLOR_NAME: Record<ColorFilter, string> = {
  W: 'White',
  U: 'Blue',
  B: 'Black',
  R: 'Red',
  G: 'Green',
  C: 'Colourless',
}

const SORTS = ['name', 'edhrec', 'mana', 'color', 'type'] as const
type Sort = (typeof SORTS)[number]

const SORT_LABEL: Record<Sort, string> = {
  name: 'Name',
  edhrec: 'Popularity',
  mana: 'Mana value',
  color: 'Colour',
  type: 'Type',
}

/**
 * How many cards one page of the gallery shows.
 *
 * The grid used to render every match at once, which was fine at a few hundred
 * cards and will not be: each result is a DOM subtree with its own image, and
 * the pool is meant to grow into the thousands. `loading="lazy"` already keeps
 * the *images* off the wire until they scroll into view, but it does nothing
 * about the node count, which is what actually costs layout time.
 */
const PAGE_SIZE = 60

/** Sort buckets — the order a decklist or a Scryfall "type" sort reads in. */
const TYPE_ORDER: readonly CardType[] = [
  'creature',
  'planeswalker',
  'instant',
  'sorcery',
  'artifact',
  'enchantment',
  'battle',
  'land',
]

/**
 * One row of the gallery: a card, precomputed for search and sorting. Built
 * once, the first time the page renders (`galleryRows`) — the pool is fixed
 * for the life of the page, so re-deriving a lowercased haystack and a mana
 * value per keystroke across thousands of cards would be pure waste.
 */
interface Entry {
  readonly def: CardDefinition
  /** The card's other face, if it has one — a transform back, an MDFC's
   * second face, or an adventure's spell half. Its text is searchable and it
   * shows up in the detail panel; `flippable` says whether it's also a
   * separate *image* (an adventure prints both halves on one face). */
  readonly other: CardDefinition | null
  readonly flippable: boolean
  readonly isToken: boolean
  readonly haystack: string
  readonly mv: number
  /** EDHREC rank, or `Infinity` when the card is unranked — basics, and
   * anything too new for EDHREC to have an entry. Precomputed as a number so
   * the sort comparator stays a subtraction and unranked cards fall last
   * without a special case. */
  readonly edhrec: number
  readonly colorRank: number
  readonly typeRank: number
  readonly colorKeys: readonly ColorFilter[]
}

function colorRankOf(colors: readonly Color[]): number {
  if (colors.length === 0) return 6
  if (colors.length > 1) return 5
  return ['W', 'U', 'B', 'R', 'G'].indexOf(colors[0])
}

function typeLineOf(def: CardDefinition): string {
  const left = [...def.supertypes, ...def.types].join(' ')
  return def.subtypes.length > 0 ? `${left} — ${def.subtypes.join(' ')}` : left
}

function buildEntry(def: CardDefinition): Entry {
  const otherName = def.faces && def.faces.length > 1 ? def.faces[1] : null
  const other = otherName === null ? null : (cardPool().byName.get(otherName) ?? null)
  return {
    def,
    other,
    // An adventure's two halves share one printed face, so there's nothing to
    // flip *to* — unlike a transforming DFC or an MDFC, which have a real
    // back-face image.
    flippable: other !== null && !def.adventure,
    isToken: isTokenCard(def),
    haystack: [def.name, typeLineOf(def), def.text, other?.name, other?.text]
      .filter(Boolean)
      .join(' \n ')
      .toLowerCase(),
    mv: manaValue(parseManaCost(def.manaCost)),
    edhrec: edhrecRankOf(def.name) ?? Infinity,
    colorRank: colorRankOf(def.colors),
    typeRank: Math.min(
      ...def.types.map((t) => {
        const i = TYPE_ORDER.indexOf(t)
        return i === -1 ? TYPE_ORDER.length : i
      }),
    ),
    colorKeys: def.colors.length === 0 ? ['C'] : (def.colors as readonly ColorFilter[]),
  }
}

interface Gallery {
  readonly entries: readonly Entry[]
  /** How many entries are cards rather than tokens. */
  readonly cardCount: number
}

let gallery: Gallery | null = null

/**
 * Every row the gallery can show, built from the card pool the first time
 * the page renders. `main.tsx` loads the whole pool before rendering this
 * page, so it's always there to build from.
 *
 * One entry per *card*, not per registered definition: a back face is the
 * same physical card as its front (rule 712.3), so it appears in the gallery
 * only as that front's flip side — exactly how Scryfall lists one result per
 * card. Tokens are built too, but hidden unless asked for.
 */
function galleryRows(): Gallery {
  if (gallery === null) {
    const { cards, tokens } = cardPool()
    const entries = [...cards, ...tokens]
      .filter(isCardFront)
      .map(buildEntry)
      .sort((a, b) => a.def.name.localeCompare(b.def.name))
    gallery = { entries, cardCount: entries.filter((e) => !e.isToken).length }
  }
  return gallery
}

/** The tokens a card makes, either face — resolved to their definitions, in
 * the order its text names them. */
function tokensOf(entry: Entry): readonly CardDefinition[] {
  const names = [...tokensCreatedBy(entry.def), ...(entry.other ? tokensCreatedBy(entry.other) : [])]
  return [...new Set(names)].flatMap((name) => {
    const def = cardPool().byName.get(name)
    return def === undefined ? [] : [def]
  })
}

/** A token's registry name as a player would say it: "Imp Token (Judith)"
 * is an Imp, "3/3 Beast Token" a 3/3 Beast. */
function tokenLabel(def: CardDefinition): string {
  return def.name.replace(/ Token\b.*$/, '')
}

// A `?card=Name` deep link, so a specific card can be linked to directly.
function cardParam(): string | null {
  return new URL(window.location.href).searchParams.get('card')
}
function setCardParam(name: string | null): void {
  const url = new URL(window.location.href)
  if (name === null) url.searchParams.delete('card')
  else url.searchParams.set('card', name)
  window.history.replaceState(null, '', url)
}

/**
 * The public, read-only card library — every card the engine implements,
 * browsable as a grid of real card faces, with no room/seat/WebSocket
 * involved at all (see `main.tsx`'s path-based branch, which renders this
 * instead of `<App/>` without ever calling `useNetworkGame`).
 *
 * Modelled on a Scryfall search result: a sticky search/filter bar over a
 * responsive grid of whole printed card images (`CardImage`, not the
 * engine's own `CardTile` — nothing here is a game object, so there's no
 * live state to overlay and the real face is both nicer and cheaper), with
 * a card's own page as an overlay rather than a permanent side pane.
 *
 * Tokens are in the pool but are not cards (rule 111.1) — they're excluded
 * by default and only appear behind the "Tokens" toggle, so browsing the
 * library shows you things you could actually put in a deck.
 */
export function LibraryPage() {
  const { entries, cardCount } = galleryRows()
  const cardsByName = cardPool().byName
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<CardType | null>(null)
  const [colorFilter, setColorFilter] = useState<readonly ColorFilter[]>([])
  const [sort, setSort] = useState<Sort>('name')
  const [showTokens, setShowTokens] = useState(() => {
    // A deep link straight to a token shouldn't land on an empty gallery.
    const param = cardParam()
    const def = param === null ? undefined : cardsByName.get(param)
    return def !== undefined && isTokenCard(def)
  })
  const [selectedName, setSelectedName] = useState<string | null>(() => {
    const param = cardParam()
    return param !== null && cardsByName.has(param) ? param : null
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = entries.filter((e) => {
      if (e.isToken && !showTokens) return false
      if (typeFilter !== null && !e.def.types.includes(typeFilter)) return false
      if (colorFilter.length > 0 && !e.colorKeys.some((c) => colorFilter.includes(c))) return false
      return q === '' || e.haystack.includes(q)
    })
    const byName = (a: Entry, b: Entry) => a.def.name.localeCompare(b.def.name)
    if (sort === 'name') return rows
    return [...rows].sort((a, b) => {
      const key =
        sort === 'mana'
          ? a.mv - b.mv
          : sort === 'color'
            ? a.colorRank - b.colorRank
            : sort === 'edhrec'
              ? a.edhrec - b.edhrec
              : a.typeRank - b.typeRank
      return key !== 0 ? key : byName(a, b)
    })
  }, [entries, query, typeFilter, colorFilter, sort, showTokens])

  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  // Any change to the result set puts you back on page one: staying on page 7
  // of a search that now has two pages shows an empty grid, and the count
  // above it would say otherwise.
  //
  // Adjusted *during render* off a signature of the filters rather than in an
  // effect. An effect would commit the stale page first and then immediately
  // re-render (which `react/set-state-in-effect` flags); this is React's
  // documented "adjust state when a prop changes" pattern and repaints once.
  const filterKey = `${query}|${typeFilter ?? ''}|${[...colorFilter].sort().join(',')}|${sort}|${showTokens}`
  const [pagedFor, setPagedFor] = useState(filterKey)
  if (pagedFor !== filterKey) {
    setPagedFor(filterKey)
    setPage(0)
  }
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = useMemo(
    () => filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [filtered, safePage],
  )

  /**
   * Turn the page *and* go back to the top of it.
   *
   * The pager sits under the grid, so clicking it left you where you were —
   * scrolled to the bottom, looking at the last row of the new page. A page
   * turn should start at the first card, the way following a link to a new
   * page would.
   *
   * `auto` rather than `smooth`: the whole grid has already been replaced, so
   * animating a scroll over cards that aren't the ones you were looking at
   * only delays showing the ones you asked for.
   */
  const goToPage = (next: number) => {
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const selected = selectedName === null ? null : (cardsByName.get(selectedName) ?? null)

  const select = useCallback((name: string | null) => {
    setSelectedName(name)
    setCardParam(name)
  }, [])

  // Where the open card sits in the *current* result list, so the overlay's
  // arrows walk the same order the grid shows. -1 when a filter (or a deep
  // link) means the open card isn't in the list at all — the arrows hide
  // rather than jumping somewhere unrelated.
  const selectedIndex = useMemo(
    () => (selectedName === null ? -1 : filtered.findIndex((e) => e.def.name === selectedName)),
    [filtered, selectedName],
  )

  const step = useCallback(
    (delta: number) => {
      if (selectedIndex === -1) return
      const at = selectedIndex + delta
      const next = filtered[at]
      if (!next) return
      select(next.def.name)
      // The overlay's arrows walk the whole result set, not the page, so
      // stepping across a boundary has to carry the grid with it — otherwise
      // closing the overlay lands you on a page that doesn't contain the card
      // you were just looking at.
      setPage(Math.floor(at / PAGE_SIZE))
    },
    [filtered, selectedIndex, select],
  )

  const toggleColor = (c: ColorFilter) =>
    setColorFilter((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  const anyFilter =
    query !== '' || typeFilter !== null || colorFilter.length > 0 || sort !== 'name' || showTokens

  return (
    <div className="lib-page">
      <header className="lib-header">
        <div className="lib-header-top">
          <a className="link-button lib-back" href="/">
            ← Back
          </a>
          <h1>Card Library</h1>
          <input
            className="lib-search"
            type="search"
            placeholder={`Search ${cardCount} cards by name, type or rules text…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="lib-filters">
          <div className="lib-chipset" role="group" aria-label="Card type">
            <button
              type="button"
              className={typeFilter === null ? 'selected' : undefined}
              onClick={() => setTypeFilter(null)}
            >
              All
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

          <div className="lib-colors" role="group" aria-label="Colour">
            {COLOR_FILTERS.map((c) => (
              <button
                key={c}
                type="button"
                title={COLOR_NAME[c]}
                aria-label={COLOR_NAME[c]}
                aria-pressed={colorFilter.includes(c)}
                className={`lib-color-pip${colorFilter.includes(c) ? ' selected' : ''}`}
                onClick={() => toggleColor(c)}
              >
                <Symbols text={`{${c}}`} />
              </button>
            ))}
          </div>

          <label className="lib-sort">
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {SORT_LABEL[s]}
                </option>
              ))}
            </select>
          </label>

          <label className="lib-toggle" title="Tokens aren't cards — they can't go in a deck">
            <input
              type="checkbox"
              checked={showTokens}
              onChange={(e) => setShowTokens(e.target.checked)}
            />
            Tokens
          </label>

          {anyFilter ? (
            <button
              type="button"
              className="lib-clear"
              onClick={() => {
                setQuery('')
                setTypeFilter(null)
                setColorFilter([])
                setSort('name')
                setShowTokens(false)
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
      </header>

      <main className="lib-results">
        <p className="lib-count muted mono">
          {filtered.length} {filtered.length === 1 ? 'card' : 'cards'}
          {pageCount > 1
            ? ` — showing ${safePage * PAGE_SIZE + 1}-${Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)}`
            : ''}
        </p>
        {filtered.length === 0 ? (
          <p className="lib-empty muted">
            No cards match. The pool is {cardCount} implemented cards — try a shorter search.
          </p>
        ) : (
          <>
            <div className="lib-grid">
              {pageRows.map((e) => (
                <GridCard key={e.def.name} entry={e} onOpen={() => select(e.def.name)} />
              ))}
            </div>
            {pageCount > 1 ? (
              <nav className="lib-pager" aria-label="Pages">
                <button type="button" onClick={() => goToPage(safePage - 1)} disabled={safePage === 0}>
                  ← Previous
                </button>
                <span className="muted mono">
                  Page {safePage + 1} of {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage >= pageCount - 1}
                >
                  Next →
                </button>
              </nav>
            ) : null}
          </>
        )}
      </main>

      {selected ? (
        <CardOverlay
          // Keyed by card, so walking to the next one with the arrows starts
          // it fresh (front face up) rather than carrying a flip across.
          key={selected.name}
          entry={entries.find((e) => e.def.name === selected.name) ?? buildEntry(selected)}
          onClose={() => select(null)}
          onPrev={selectedIndex > 0 ? () => step(-1) : null}
          onNext={
            selectedIndex !== -1 && selectedIndex < filtered.length - 1 ? () => step(1) : null
          }
        />
      ) : null}
    </div>
  )
}

/** One result in the grid: the card face, and — for a two-faced card — a
 * corner button that turns it over in place, the same affordance Scryfall
 * puts on a double-faced search result. */
function GridCard({ entry, onOpen }: { readonly entry: Entry; readonly onOpen: () => void }) {
  const [flipped, setFlipped] = useState(false)
  const shown = flipped && entry.other ? entry.other : entry.def

  return (
    <div className="lib-card">
      <button type="button" className="lib-card-open" onClick={onOpen} title={entry.def.name}>
        <CardImage def={shown} />
        <span className="lib-card-caption">{shown.name}</span>
      </button>
      {entry.flippable ? (
        <button
          type="button"
          className="lib-flip"
          title={`Turn over — ${(flipped ? entry.def : entry.other!).name}`}
          aria-label="Turn this card over"
          onClick={() => setFlipped((f) => !f)}
        >
          ⇄
        </button>
      ) : null}
      {entry.isToken ? <span className="lib-token-badge">token</span> : null}
    </div>
  )
}

/** A card's own page, as an overlay over the grid rather than a route —
 * the gallery keeps its scroll position and filters, which is most of why
 * you'd open a card in the first place. */
function CardOverlay({
  entry,
  onClose,
  onPrev,
  onNext,
}: {
  readonly entry: Entry
  readonly onClose: () => void
  readonly onPrev: (() => void) | null
  readonly onNext: (() => void) | null
}) {
  const [flipped, setFlipped] = useState(false)
  const shown = flipped && entry.other ? entry.other : entry.def
  const tokens = useMemo(() => tokensOf(entry), [entry])
  const [preview, setPreview] = useState<PreviewTarget | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onPrev?.()
      else if (e.key === 'ArrowRight') onNext?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext])

  return (
    <div
      className="lib-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={entry.def.name}
      onClick={onClose}
    >
      <div
        className={`lib-overlay-box${tokens.length > 0 ? ' has-tokens' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="lib-overlay-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="lib-overlay-art">
          <CardImage def={shown} version="large" />
          {entry.flippable ? (
            <button type="button" className="lib-overlay-flip" onClick={() => setFlipped((f) => !f)}>
              ⇄ {(flipped ? entry.def : entry.other!).name}
            </button>
          ) : null}
        </div>

        <div className="lib-overlay-text">
          <div className="lib-overlay-title">
            <h2>{entry.def.name}</h2>
            {entry.def.manaCost ? <Symbols text={entry.def.manaCost} /> : null}
          </div>
          <FaceText def={entry.def} />
          {entry.other ? (
            <>
              <div className="lib-face-divider">
                <span>{entry.def.adventure ? 'Adventure' : 'Back face'}</span>
              </div>
              <div className="lib-overlay-title">
                <h2>{entry.other.name}</h2>
                {entry.other.manaCost ? <Symbols text={entry.other.manaCost} /> : null}
              </div>
              <FaceText def={entry.other} />
            </>
          ) : null}
          <MechanicChips def={entry.def} isToken={entry.isToken} />

          {onPrev || onNext ? (
            <div className="lib-overlay-nav">
              <button type="button" onClick={() => onPrev?.()} disabled={onPrev === null}>
                ‹ Previous
              </button>
              <button type="button" onClick={() => onNext?.()} disabled={onNext === null}>
                Next ›
              </button>
            </div>
          ) : null}
        </div>

        {tokens.length > 0 ? (
          <aside className="lib-overlay-tokens" aria-label="Tokens this card makes">
            <h3>Tokens</h3>
            <ul>
              {tokens.map((token) => (
                <li key={token.name}>
                  <button
                    type="button"
                    className="lib-token-name"
                    onMouseEnter={(e: MouseEvent<HTMLButtonElement>) =>
                      setPreview({ def: token, anchor: e.currentTarget.getBoundingClientRect() })
                    }
                    onMouseLeave={() => setPreview(null)}
                    onFocus={(e: FocusEvent<HTMLButtonElement>) =>
                      setPreview({ def: token, anchor: e.currentTarget.getBoundingClientRect() })
                    }
                    onBlur={() => setPreview(null)}
                  >
                    <span>{tokenLabel(token)}</span>
                    <span className="muted lib-token-type">
                      {token.power !== null && token.toughness !== null ? `${token.power}/${token.toughness} ` : ''}
                      {typeLineOf(token)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
      <TokenPreview target={preview} />
    </div>
  )
}

interface PreviewTarget {
  readonly def: CardDefinition
  /** The hovered or focused name, in viewport coordinates. */
  readonly anchor: DOMRect
}

/** Width and height of the preview — `.lib-token-preview` in library.css. */
const PREVIEW_W = 240
const PREVIEW_H = 336
const PREVIEW_GAP = 16

/**
 * A token's face, floating beside the name being hovered. Portalled to
 * `document.body` and placed from JS, like `CardHoverPreview`: the overlay
 * box is a scroll container, so a child would be clipped.
 *
 * Anchored to the name rather than the pointer, and to its *left* first: the
 * token list is the right-hand column, so a preview beside the pointer sat on
 * top of the very names you'd move to next. With no room there (the one-column
 * phone layout) it goes to the right, and failing that above or below the
 * name. Always clamped inside the viewport.
 */
function TokenPreview({ target }: { readonly target: PreviewTarget | null }) {
  if (target === null) return null
  const a = target.anchor
  const clampX = (x: number) => Math.min(Math.max(PREVIEW_GAP, x), window.innerWidth - PREVIEW_W - PREVIEW_GAP)
  const clampY = (y: number) => Math.min(Math.max(PREVIEW_GAP, y), window.innerHeight - PREVIEW_H - PREVIEW_GAP)
  let left: number
  let top: number
  if (a.left - PREVIEW_GAP - PREVIEW_W >= PREVIEW_GAP) {
    left = a.left - PREVIEW_GAP - PREVIEW_W
    top = clampY(a.top + a.height / 2 - PREVIEW_H / 2)
  } else if (a.right + PREVIEW_GAP + PREVIEW_W <= window.innerWidth - PREVIEW_GAP) {
    left = a.right + PREVIEW_GAP
    top = clampY(a.top + a.height / 2 - PREVIEW_H / 2)
  } else {
    left = clampX(a.left + a.width / 2 - PREVIEW_W / 2)
    const above = a.top - PREVIEW_GAP - PREVIEW_H
    top = above >= PREVIEW_GAP ? above : clampY(a.bottom + PREVIEW_GAP)
  }
  return createPortal(
    <div className="lib-token-preview" style={{ left, top }} aria-hidden="true">
      <CardImage def={target.def} />
    </div>,
    document.body,
  )
}

/** Type line, rules text and P/T for one printed face. */
function FaceText({ def }: { readonly def: CardDefinition }) {
  return (
    <>
      <p className="lib-typeline">{typeLineOf(def)}</p>
      {def.text ? (
        <div className="lib-rules">
          {def.text.split('\n').map((line, i) => (
            <p key={i}>
              <Symbols text={line} />
            </p>
          ))}
        </div>
      ) : (
        <p className="muted lib-rules">No rules text.</p>
      )}
      {def.power !== null && def.toughness !== null ? (
        <p className="lib-pt mono">
          {def.power} / {def.toughness}
        </p>
      ) : null}
      {def.loyalty !== null ? <p className="lib-pt mono">Loyalty {def.loyalty}</p> : null}
    </>
  )
}

/**
 * The engine-shaped mechanics a card carries, as plain player-facing labels.
 * Deliberately never an internal `EffectSpec`/`TriggerSpec` kind name —
 * useful when authoring a card, noise to someone browsing the pool.
 */
function MechanicChips({ def, isToken }: { readonly def: CardDefinition; readonly isToken: boolean }) {
  const chips: string[] = []
  if (isToken) chips.push('token — not a card')
  if (canCommandAlone(def)) {
    chips.push('can be your commander')
  }
  if (def.flashback) chips.push(`flashback ${def.flashback.cost}`)
  if (def.escape) chips.push(`escape ${def.escape.cost}`)
  if (def.foretell) chips.push(`foretell ${def.foretell.cost}`)
  if (def.suspend) chips.push(`suspend ${def.suspend.n} — ${def.suspend.cost}`)
  if (def.cycling) chips.push(`cycling ${def.cycling.cost}`)
  if (def.kicker) chips.push(`kicker ${def.kicker.cost}`)
  if (def.overload) chips.push(`overload ${def.overload.cost}`)
  if (def.disturb) chips.push(`disturb ${def.disturb.cost}`)
  if (def.convoke) chips.push('convoke')
  if (def.adventure) chips.push('adventure')
  else if (def.transform) chips.push('transforms')
  else if (def.faces && def.faces.length > 1) chips.push('modal double-faced')
  if (def.chapters) chips.push(`saga — ${def.chapters.length} chapters`)
  if (def.castModal) chips.push('modal')
  if (def.cantBeCountered) chips.push("can't be countered")
  if (def.activated.length > 0) {
    chips.push(`${def.activated.length} activated abilit${def.activated.length === 1 ? 'y' : 'ies'}`)
  }
  if (def.triggered.length > 0) {
    chips.push(`${def.triggered.length} triggered abilit${def.triggered.length === 1 ? 'y' : 'ies'}`)
  }
  if (chips.length === 0) return null
  return (
    <div className="lib-chips">
      {chips.map((c) => (
        <span key={c} className="lib-chip">
          <Symbols text={c} />
        </span>
      ))}
    </div>
  )
}
