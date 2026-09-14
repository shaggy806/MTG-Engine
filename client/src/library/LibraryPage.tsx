import { useMemo, useState } from 'react'
import type { CardDefinition } from 'engine'
import { BUILTIN_CARDS } from 'engine'
import { CardTile } from '../ui/CardTile.tsx'
import { resolveArtUrl } from '../ui/art.ts'
import { defToVisible } from '../lab/defToVisible.ts'
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

const cards = [...BUILTIN_CARDS].sort((a, b) => a.name.localeCompare(b.name))

// Same `?card=Name` deep-link convention the card lab uses (see
// `client/src/lab/CardLab.tsx`'s cardParam/setCardParam) so a specific card
// can be linked to directly.
function cardParam(): string | null {
  return new URL(window.location.href).searchParams.get('card')
}
function setCardParam(name: string): void {
  const url = new URL(window.location.href)
  url.searchParams.set('card', name)
  window.history.replaceState(null, '', url)
}

/**
 * The public, read-only card library — every card the engine implements,
 * searchable and browsable, with no room/seat/WebSocket involved at all (see
 * `main.tsx`'s path-based branch, which renders this instead of `<App/>`
 * without ever calling `useNetworkGame`). Deliberately a trimmed-down sibling
 * of the dev-only card lab (`client/src/lab/`): same data (`BUILTIN_CARDS`)
 * and the same `CardTile` rendering, but no "Structure" (raw internal JSON)
 * or "Sandbox" (solo test game) tabs — those are card-authoring tools, not
 * something a player browsing the pool needs.
 */
export function LibraryPage() {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string>(
    () => cardParam() ?? cards[0]?.name ?? '',
  )
  const [fullImage, setFullImage] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cards.filter((c) => {
      if (typeFilter && !c.types.includes(typeFilter as CardDefinition['types'][number])) {
        return false
      }
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.text.toLowerCase().includes(q) ||
        c.subtypes.some((s) => s.toLowerCase().includes(q))
      )
    })
  }, [query, typeFilter])

  const def = cards.find((c) => c.name === selectedName) ?? cards[0]

  const select = (name: string) => {
    setSelectedName(name)
    setCardParam(name)
  }

  return (
    <div className="lib-page">
      <aside className="lib-list">
        <a className="link-button lib-back" href="/">
          ← Back
        </a>
        <h1>Card Library</h1>
        <input
          className="lib-search"
          placeholder={`Search ${cards.length} cards…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="lib-type-filters">
          <button
            type="button"
            className={typeFilter === null ? 'selected' : undefined}
            onClick={() => setTypeFilter(null)}
          >
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
        <ul>
          {filtered.map((c) => (
            <li key={c.name}>
              <button
                type="button"
                className={c.name === def?.name ? 'selected' : undefined}
                onClick={() => select(c.name)}
              >
                {c.name}
              </button>
            </li>
          ))}
          {filtered.length === 0 ? <li className="muted lib-empty">No cards match</li> : null}
        </ul>
      </aside>

      <main className="lib-detail">
        {def ? (
          <>
            <label className="lib-toggle">
              <input
                type="checkbox"
                checked={fullImage}
                onChange={(e) => setFullImage(e.target.checked)}
              />
              full card image
            </label>
            {fullImage ? (
              <img
                className="lib-full-card"
                src={resolveArtUrl(def.art, def.name, 'normal')}
                alt={def.name}
              />
            ) : (
              <div className="lib-tile-frame">
                <CardTile obj={defToVisible(def)} />
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  )
}
