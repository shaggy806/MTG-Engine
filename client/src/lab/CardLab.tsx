import { useMemo, useState } from 'react'
import type { CardDefinition } from 'engine'
import { BUILTIN_CARDS } from 'engine'
import { CardTile } from '../ui/CardTile.tsx'
import { Symbols } from '../ui/Symbols.tsx'
import { resolveArtUrl } from '../ui/art.ts'
import { defToVisible } from './defToVisible.ts'
import { describeCardFeatures } from './cardFeatures.ts'
import { Sandbox } from './Sandbox.tsx'

type Tab = 'tile' | 'structure' | 'sandbox'

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

function cardParam(): string | null {
  return new URL(window.location.href).searchParams.get('card')
}
function setCardParam(name: string): void {
  const url = new URL(window.location.href)
  url.searchParams.set('card', name)
  window.history.replaceState(null, '', url)
}

export function CardLab() {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string>(
    () => cardParam() ?? cards[0]?.name ?? '',
  )
  const [tab, setTab] = useState<Tab>('tile')
  const [fullImage, setFullImage] = useState(false)

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

  const def = cards.find((c) => c.name === selectedName) ?? cards[0]

  const select = (name: string) => {
    setSelectedName(name)
    setCardParam(name)
  }

  return (
    <div className="card-lab">
      <aside className="lab-list">
        <h1>Card Lab</h1>
        <input
          className="lab-search"
          placeholder={`Search ${cards.length} cards…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="lab-type-filters">
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
                className={c.name === def.name ? 'selected' : undefined}
                onClick={() => select(c.name)}
              >
                <span className="lab-list-name">{c.name}</span>
                {c.manaCost ? <Symbols text={c.manaCost} /> : null}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="lab-detail">
        <div className="lab-tabs">
          {(['tile', 'structure', 'sandbox'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={tab === t ? 'selected' : undefined}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'tile' ? (
          <div className="lab-tile-tab">
            <label className="lab-toggle">
              <input
                type="checkbox"
                checked={fullImage}
                onChange={(e) => setFullImage(e.target.checked)}
              />
              full card image
            </label>
            {fullImage ? (
              <img
                className="lab-full-card"
                src={resolveArtUrl(def.art, def.name, 'normal')}
                alt={def.name}
              />
            ) : (
              <div className="lab-tile-frame">
                <CardTile obj={defToVisible(def)} />
              </div>
            )}
            <p className="lab-note">
              This is the engine's own render (printed values). The <b>sandbox</b> tab shows the
              computed state — static abilities, counters, animation.
            </p>
          </div>
        ) : null}

        {tab === 'structure' ? <Structure def={def} /> : null}

        {tab === 'sandbox' ? <Sandbox key={def.name} cardName={def.name} /> : null}
      </main>
    </div>
  )
}

function Chips({ label, items }: { readonly label: string; readonly items: readonly string[] }) {
  if (items.length === 0) return null
  return (
    <div className="lab-chip-row">
      <span className="lab-chip-label">{label}</span>
      {items.map((i) => (
        <span key={i} className="lab-chip">
          {i}
        </span>
      ))}
    </div>
  )
}

function Structure({ def }: { readonly def: CardDefinition }) {
  const f = describeCardFeatures(def)
  const pruned = Object.fromEntries(
    Object.entries({
      manaCost: def.manaCost,
      colors: def.colors,
      types: def.types,
      subtypes: def.subtypes,
      supertypes: def.supertypes,
      power: def.power,
      toughness: def.toughness,
      loyalty: def.loyalty,
      keywords: def.keywords,
      targets: def.targets,
      effect: def.effect,
      resolve: def.resolve ? '[function]' : null,
      activated: def.activated,
      triggered: def.triggered,
      static: def.static,
      castModal: def.castModal,
      chapters: def.chapters,
      faces: def.faces,
      art: def.art,
    }).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)),
  )
  return (
    <div className="lab-structure">
      <div className="lab-card-text">
        <b>{def.name}</b>
        {def.manaCost ? (
          <>
            {' '}
            <Symbols text={def.manaCost} />
          </>
        ) : null}
        <div className="muted">
          {[...def.supertypes, ...def.types].join(' ')}
          {def.subtypes.length ? ` — ${def.subtypes.join(' ')}` : ''}
        </div>
        <div>
          <Symbols text={def.text} />
        </div>
      </div>
      <Chips label="effects" items={f.effects} />
      <Chips label="triggers" items={f.triggers} />
      <Chips label="targets" items={f.targets} />
      <Chips label="ability costs" items={f.costs} />
      <Chips label="statics" items={f.statics} />
      <Chips label="flags" items={f.flags} />
      <pre className="lab-json">{JSON.stringify(pruned, null, 2)}</pre>
    </div>
  )
}
