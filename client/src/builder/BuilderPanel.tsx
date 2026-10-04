import { useEffect, useMemo, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { isCardFront, isTokenCard } from 'engine/client'
import type { CardDefinition, PlayerId } from 'engine/client'
import type { ScenarioCard, ScenarioSpec, ScenarioZone } from 'protocol'
import type { NetworkGame } from '../net/useNetworkGame.ts'
import { loadCardPool } from '../cards/cardData.ts'
import type { CardPool } from '../cards/cardData.ts'
import { CardHoverPreview } from '../ui/CardHoverPreview.tsx'
import type { HoverTarget } from '../ui/CardHoverPreview.tsx'
import {
  STEPS,
  ZONES,
  addCards,
  cardsIn,
  duplicateCard,
  parseScenario,
  removeCard,
  setCounter,
  setSeatCount,
  updateCard,
  updateSeat,
} from './spec.ts'
import './builder.css'

/**
 * The scenario builder's drawer (a dev build only — `App` never loads it
 * otherwise): build a board from scratch over the real table, then play it.
 *
 * While building, the table is the scenario as the server built it, frozen,
 * and a click on any of its cards selects that card here instead of doing
 * anything in the game. Every edit sends the whole scenario back and the
 * server rebuilds the board (`server/src/builder.ts`), so what's drawn is
 * always exactly what play will start from.
 */

const SAVED_KEY = 'mtg.builder.saved'
const COUNTER_KINDS = ['+1/+1', '-1/-1', 'loyalty', 'charge', 'time', 'lore', 'shield', 'stun']

const label = (player: string): string => player.charAt(0).toUpperCase() + player.slice(1)
const ZONE_LABEL: Record<ScenarioZone, string> = {
  battlefield: 'Battlefield',
  hand: 'Hand',
  graveyard: 'Graveyard',
  exile: 'Exile',
  library: 'Library (top first)',
  command: 'Command zone',
}

function loadSaved(): Record<string, ScenarioSpec> {
  try {
    const raw = window.localStorage.getItem(SAVED_KEY)
    return raw === null ? {} : (JSON.parse(raw) as Record<string, ScenarioSpec>)
  } catch {
    return {}
  }
}

function storeSaved(saved: Record<string, ScenarioSpec>): void {
  try {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(saved))
  } catch {
    // Storage blocked: saving just doesn't stick.
  }
}

/** A number that's sent when it's committed (Enter or leaving the field),
 * not on every keystroke — each send rebuilds the board. */
function NumberField({
  value,
  onCommit,
  min,
  max,
  title,
}: {
  readonly value: number
  readonly onCommit: (n: number) => void
  readonly min?: number
  readonly max?: number
  readonly title: string
}) {
  const [text, setText] = useState(String(value))
  const [shown, setShown] = useState(value)
  if (shown !== value) {
    setShown(value)
    setText(String(value))
  }
  const commit = () => {
    const n = Math.floor(Number(text))
    if (!Number.isFinite(n)) {
      setText(String(value))
      return
    }
    const clamped = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, n))
    setText(String(clamped))
    if (clamped !== value) onCommit(clamped)
  }
  return (
    <input
      className="bp-number"
      type="number"
      title={title}
      aria-label={title}
      value={text}
      min={min}
      max={max}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
      }}
    />
  )
}

function Section({ title, children, right }: { readonly title: string; readonly children: ReactNode; readonly right?: ReactNode }) {
  return (
    <section className="bp-section">
      <header className="bp-section-head">
        <h3>{title}</h3>
        {right}
      </header>
      {children}
    </section>
  )
}

export default function BuilderPanel({ game }: { readonly game: NetworkGame }) {
  const builder = game.builder
  const [open, setOpen] = useState(true)
  const [pool, setPool] = useState<CardPool | null>(null)
  const [poolError, setPoolError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [owner, setOwner] = useState<PlayerId | null>(null)
  const [zone, setZone] = useState<ScenarioZone>('battlefield')
  const [count, setCount] = useState(1)
  const [tapped, setTapped] = useState(false)
  const [sick, setSick] = useState(false)
  const [counterKind, setCounterKind] = useState('+1/+1')
  const [importing, setImporting] = useState(false)
  const [importText, setImportText] = useState('')
  const [saveName, setSaveName] = useState('')
  const [saved, setSaved] = useState<Record<string, ScenarioSpec>>(loadSaved)
  const [hover, setHover] = useState<HoverTarget | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    loadCardPool().then(
      (p) => {
        if (live) setPool(p)
      },
      (e: unknown) => {
        if (live) setPoolError(String(e))
      },
    )
    return () => {
      live = false
    }
  }, [])

  const spec = builder?.spec ?? null
  const building = builder?.mode === 'build'
  const objects = builder?.objects

  /** Every card a scenario can name: each card by its front face, and every token. */
  const names = useMemo(() => {
    if (pool === null) return []
    return [...pool.cards.filter((d) => isCardFront(d)), ...pool.tokens].map((def) => ({
      def,
      lower: def.name.toLowerCase(),
    }))
  }, [pool])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const starts = names.filter((n) => n.lower.startsWith(q))
    const contains = names.filter((n) => !n.lower.startsWith(q) && n.lower.includes(q))
    return [...starts, ...contains].slice(0, 30).map((n) => n.def)
  }, [names, query])

  // Pressing on a card of the board being built selects it here, and does
  // nothing else: caught as the press starts, before the table's own
  // handlers see it — by the time a click would arrive, a tile's hover
  // popover can be what's under the pointer.
  useEffect(() => {
    if (!building || objects === undefined) return
    const keyAt = (e: Event): string | undefined => {
      const target = e.target as Element | null
      if (target === null || target.closest('.builder-panel') !== null) return undefined
      const id = target.closest('[data-obj-id]')?.getAttribute('data-obj-id')
      return id === null || id === undefined ? undefined : objects[id]
    }
    const onPress = (e: PointerEvent) => {
      const key = keyAt(e)
      if (key === undefined) return
      e.preventDefault()
      e.stopPropagation()
      setSelected(key)
      setOpen(true)
    }
    const onClick = (e: MouseEvent) => {
      if (keyAt(e) === undefined) return
      e.preventDefault()
      e.stopPropagation()
    }
    document.addEventListener('pointerdown', onPress, true)
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('pointerdown', onPress, true)
      document.removeEventListener('click', onClick, true)
    }
  }, [building, objects])

  if (builder === null || spec === null) return null

  const seat = game.seat
  const defaultOwner = owner !== null && spec.seats.some((s) => s.player === owner) ? owner : (seat ?? spec.seats[0].player)
  const send = (next: ScenarioSpec) => game.builderUpdate(next)
  const selectedCard = spec.cards.find((c) => c.key === selected) ?? null
  const selectedObject =
    selectedCard === null || objects === undefined
      ? undefined
      : Object.keys(objects).find((id) => objects[id] === selectedCard.key)
  const defOf = (name: string): CardDefinition | undefined => pool?.byName.get(name)

  const add = (def: CardDefinition) => {
    const token = isTokenCard(def)
    send(
      addCards(
        spec,
        {
          name: def.name,
          owner: defaultOwner,
          zone: token ? 'battlefield' : zone === 'command' ? 'battlefield' : zone,
          ...((token || zone === 'battlefield' || zone === 'command') && tapped ? { tapped: true } : {}),
          ...((token || zone === 'battlefield' || zone === 'command') && sick ? { sick: true } : {}),
        },
        count,
      ),
    )
  }

  const preview = (def: CardDefinition | undefined) =>
    def === undefined
      ? {}
      : {
          onMouseEnter: (e: ReactMouseEvent) => setHover({ def, x: e.clientX, y: e.clientY }),
          onMouseMove: (e: ReactMouseEvent) => setHover({ def, x: e.clientX, y: e.clientY }),
          onMouseLeave: () => setHover(null),
        }

  const flash = (text: string) => {
    setNotice(text)
    window.setTimeout(() => setNotice((n) => (n === text ? null : n)), 2500)
  }

  const exportText = JSON.stringify(spec, null, 2)

  const moveWithin = (card: ScenarioCard, delta: number) => {
    const same = spec.cards.filter((c) => c.owner === card.owner && c.zone === card.zone)
    const at = same.findIndex((c) => c.key === card.key)
    const swap = same[at + delta]
    if (swap === undefined) return
    const cards = spec.cards.map((c) => (c.key === card.key ? swap : c.key === swap.key ? card : c))
    send({ ...spec, cards })
  }

  if (!open) {
    return (
      <button type="button" className="builder-tab" onClick={() => setOpen(true)}>
        Builder ◂
      </button>
    )
  }

  return (
    <aside className="builder-panel" aria-label="Scenario builder">
      <header className="bp-head">
        <h2>Scenario builder</h2>
        <span className={`bp-mode ${building ? 'is-build' : 'is-play'}`}>{building ? 'Building' : 'Playing'}</span>
        <button type="button" className="bp-icon" title="Hide the builder" onClick={() => setOpen(false)}>
          ▸
        </button>
      </header>

      {notice ? <p className="bp-notice">{notice}</p> : null}
      {!game.isHost ? <p className="bp-notice bad">Only this room's host can change the board.</p> : null}

      <div className="bp-scroll">
        <Section title="Seats">
          <div className="bp-row">
            {building ? (
              <span className="bp-seg" role="group" aria-label="Players">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={spec.seats.length === n ? 'on' : undefined}
                    onClick={() => send(setSeatCount(spec, n))}
                  >
                    {n}p
                  </button>
                ))}
              </span>
            ) : null}
          </div>
          <table className="bp-seats">
            <thead>
              <tr>
                <th>Seat</th>
                <th>Life</th>
                <th>Poison</th>
                <th>Bot</th>
                <th>Turn</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {spec.seats.map((s) => (
                <tr key={s.player}>
                  <td className="bp-seat-name">{label(s.player)}</td>
                  <td>
                    {building ? (
                      <NumberField title={`${label(s.player)}'s life`} value={s.life} min={-999} max={9999} onCommit={(life) => send(updateSeat(spec, s.player, { life }))} />
                    ) : (
                      s.life
                    )}
                  </td>
                  <td>
                    {building ? (
                      <NumberField title={`${label(s.player)}'s poison counters`} value={s.poison ?? 0} min={0} max={99} onCommit={(poison) => send(updateSeat(spec, s.player, { poison }))} />
                    ) : (
                      (s.poison ?? 0)
                    )}
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${label(s.player)} is a bot`}
                      checked={s.bot}
                      disabled={!building || s.player === seat}
                      title={s.player === seat ? 'Your own seat is never a bot' : 'Played by a bot once play starts'}
                      onChange={(e) => send(updateSeat(spec, s.player, { bot: e.target.checked }))}
                    />
                  </td>
                  <td>
                    <input
                      type="radio"
                      name="bp-active"
                      aria-label={`${label(s.player)}'s turn`}
                      checked={spec.active === s.player}
                      disabled={!building}
                      onChange={() => send({ ...spec, active: s.player })}
                    />
                  </td>
                  <td>
                    {s.player === seat ? (
                      <span className="bp-you">you</span>
                    ) : (
                      <button
                        type="button"
                        className="bp-small"
                        disabled={!building && s.bot}
                        title="Act for this seat"
                        onClick={() => game.builderSeat(s.player)}
                      >
                        Sit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {building ? (
            <div className="bp-row">
              <label>
                Step{' '}
                <select value={spec.step} onChange={(e) => send({ ...spec, step: e.target.value as ScenarioSpec['step'] })}>
                  {STEPS.map((s) => (
                    <option key={s.step} value={s.step}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label title="Basic lands under each library's listed cards">
                Library fill <NumberField title="Library fill" value={spec.libraryFill} min={0} max={200} onCommit={(libraryFill) => send({ ...spec, libraryFill })} />
              </label>
            </div>
          ) : null}
        </Section>

        {building ? (
          <Section title="Add cards">
            <input
              className="bp-search"
              type="search"
              placeholder={pool === null ? (poolError ?? 'Loading the card pool…') : 'Search cards and tokens'}
              disabled={pool === null}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search cards"
            />
            <div className="bp-row">
              <select value={defaultOwner} onChange={(e) => setOwner(e.target.value as PlayerId)} aria-label="Owner">
                {spec.seats.map((s) => (
                  <option key={s.player} value={s.player}>
                    {label(s.player)}
                  </option>
                ))}
              </select>
              <select value={zone} onChange={(e) => setZone(e.target.value as ScenarioZone)} aria-label="Zone">
                {ZONES.filter((z) => z !== 'command').map((z) => (
                  <option key={z} value={z}>
                    {ZONE_LABEL[z]}
                  </option>
                ))}
              </select>
              <label title="How many copies">
                × <NumberField title="Copies" value={count} min={1} max={20} onCommit={setCount} />
              </label>
            </div>
            {zone === 'battlefield' ? (
              <div className="bp-row">
                <label>
                  <input type="checkbox" checked={tapped} onChange={(e) => setTapped(e.target.checked)} /> Tapped
                </label>
                <label title="Came under its controller's control this turn">
                  <input type="checkbox" checked={sick} onChange={(e) => setSick(e.target.checked)} /> Summoning sick
                </label>
              </div>
            ) : null}
            {results.length > 0 ? (
              <ul className="bp-results">
                {results.map((def) => (
                  <li key={def.name}>
                    <button type="button" onClick={() => add(def)} {...preview(def)}>
                      <span>{def.name}</span>
                      <span className="bp-dim">{isTokenCard(def) ? 'token' : def.types.join(' ')}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : query.trim().length >= 2 && pool !== null ? (
              <p className="bp-dim">No card matches.</p>
            ) : null}
          </Section>
        ) : null}

        {building && selectedCard !== null ? (
          <Section
            title="Selected"
            right={
              <button type="button" className="bp-icon" title="Deselect" onClick={() => setSelected(null)}>
                ×
              </button>
            }
          >
            <p className="bp-selected-name" {...preview(defOf(selectedCard.name))}>
              {selectedCard.name}
              {selectedObject === undefined && selectedCard.zone === 'battlefield' ? <span className="bp-dim"> (not on the board)</span> : null}
            </p>
            <div className="bp-row">
              <select
                aria-label="Owner"
                value={selectedCard.owner}
                onChange={(e) => send(updateCard(spec, selectedCard.key, { owner: e.target.value as PlayerId }))}
              >
                {spec.seats.map((s) => (
                  <option key={s.player} value={s.player}>
                    {label(s.player)}
                  </option>
                ))}
              </select>
              <select
                aria-label="Zone"
                value={selectedCard.zone}
                onChange={(e) => send(updateCard(spec, selectedCard.key, { zone: e.target.value as ScenarioZone }))}
              >
                {ZONES.filter((z) => z !== 'command' || selectedCard.commander === true).map((z) => (
                  <option key={z} value={z}>
                    {ZONE_LABEL[z]}
                  </option>
                ))}
              </select>
              {(() => {
                const def = defOf(selectedCard.name)
                if (def !== undefined && isTokenCard(def)) return null
                return (
                  <label title="One of its owner's commanders">
                    <input
                      type="checkbox"
                      checked={selectedCard.commander === true}
                      onChange={(e) => send(updateCard(spec, selectedCard.key, { commander: e.target.checked }))}
                    />{' '}
                    Commander
                  </label>
                )
              })()}
            </div>
            {selectedCard.zone === 'battlefield' ? (
              <>
                <div className="bp-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedCard.tapped === true}
                      onChange={(e) => send(updateCard(spec, selectedCard.key, { tapped: e.target.checked }))}
                    />{' '}
                    Tapped
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedCard.sick === true}
                      onChange={(e) => send(updateCard(spec, selectedCard.key, { sick: e.target.checked }))}
                    />{' '}
                    Summoning sick
                  </label>
                </div>
                <div className="bp-counters">
                  {Object.entries(selectedCard.counters ?? {}).map(([kind, n]) => (
                    <span key={kind} className="bp-counter">
                      <span>{kind}</span>
                      <button type="button" className="bp-small" onClick={() => send(setCounter(spec, selectedCard.key, kind, n - 1))}>
                        −
                      </button>
                      <b>{n}</b>
                      <button type="button" className="bp-small" onClick={() => send(setCounter(spec, selectedCard.key, kind, n + 1))}>
                        +
                      </button>
                    </span>
                  ))}
                </div>
                <div className="bp-row">
                  <input
                    className="bp-kind"
                    list="bp-counter-kinds"
                    value={counterKind}
                    onChange={(e) => setCounterKind(e.target.value)}
                    aria-label="Counter kind"
                  />
                  <datalist id="bp-counter-kinds">
                    {COUNTER_KINDS.map((k) => (
                      <option key={k} value={k} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    className="bp-small"
                    onClick={() =>
                      send(setCounter(spec, selectedCard.key, counterKind, (selectedCard.counters?.[counterKind.trim()] ?? 0) + 1))
                    }
                  >
                    Add counter
                  </button>
                </div>
                <div className="bp-row">
                  <label>
                    Attached to{' '}
                    <select
                      value={selectedCard.attachedTo ?? ''}
                      onChange={(e) =>
                        send(
                          e.target.value === ''
                            ? { ...spec, cards: spec.cards.map((c) => (c.key === selectedCard.key ? (({ attachedTo: _a, ...rest }) => rest)(c) : c)) }
                            : updateCard(spec, selectedCard.key, { attachedTo: e.target.value }),
                        )
                      }
                    >
                      <option value="">nothing</option>
                      {spec.cards
                        .filter((c) => c.zone === 'battlefield' && c.key !== selectedCard.key)
                        .map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.name} ({label(c.owner)})
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
              </>
            ) : null}
            <div className="bp-row">
              <button type="button" onClick={() => moveWithin(selectedCard, -1)} title="Earlier in its zone (towards the top of a library)">
                ↑
              </button>
              <button type="button" onClick={() => moveWithin(selectedCard, 1)} title="Later in its zone">
                ↓
              </button>
              <button type="button" onClick={() => send(duplicateCard(spec, selectedCard.key))}>
                Duplicate
              </button>
              <button
                type="button"
                className="bp-danger"
                onClick={() => {
                  send(removeCard(spec, selectedCard.key))
                  setSelected(null)
                }}
              >
                Remove
              </button>
            </div>
          </Section>
        ) : null}

        {building ? (
          <Section title={`Cards (${spec.cards.length})`}>
            {spec.seats.map((s) => (
              <details key={s.player} className="bp-seat-cards" open={spec.cards.some((c) => c.owner === s.player)}>
                <summary>
                  {label(s.player)} <span className="bp-dim">{spec.cards.filter((c) => c.owner === s.player).length}</span>
                </summary>
                {ZONES.map((z) => {
                  const list = cardsIn(spec, s.player, z)
                  if (list.length === 0) return null
                  return (
                    <div key={z} className="bp-zone">
                      <h4>
                        {ZONE_LABEL[z]} <span className="bp-dim">{list.length}</span>
                      </h4>
                      <ul>
                        {list.map((c) => (
                          <li key={c.key} className={c.key === selected ? 'on' : undefined}>
                            <button type="button" className="bp-card" onClick={() => setSelected(c.key)} {...preview(defOf(c.name))}>
                              {c.name}
                              {c.commander ? <span className="bp-flag">cmdr</span> : null}
                              {c.tapped ? <span className="bp-flag">tapped</span> : null}
                              {c.sick ? <span className="bp-flag">sick</span> : null}
                              {c.attachedTo ? <span className="bp-flag">attached</span> : null}
                              {Object.entries(c.counters ?? {}).map(([k, n]) => (
                                <span key={k} className="bp-flag">
                                  {n} {k}
                                </span>
                              ))}
                            </button>
                            <button
                              type="button"
                              className="bp-icon"
                              title="Remove"
                              onClick={() => {
                                send(removeCard(spec, c.key))
                                if (selected === c.key) setSelected(null)
                              }}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </details>
            ))}
          </Section>
        ) : (
          <Section title="Playing">
            <p className="bp-dim">
              Playing from the scenario. Sit at another seat to act for it; bots play the seats marked Bot.
            </p>
          </Section>
        )}

        <Section title="Save and share">
          <div className="bp-row">
            <input
              className="bp-grow"
              placeholder="Name this scenario"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              aria-label="Scenario name"
            />
            <button
              type="button"
              disabled={saveName.trim() === ''}
              onClick={() => {
                const next = { ...saved, [saveName.trim()]: spec }
                setSaved(next)
                storeSaved(next)
                flash(`Saved “${saveName.trim()}” in this browser`)
              }}
            >
              Save
            </button>
          </div>
          {Object.keys(saved).length > 0 ? (
            <ul className="bp-saved">
              {Object.keys(saved)
                .sort()
                .map((name) => (
                  <li key={name}>
                    <span className="bp-grow">{name}</span>
                    <button type="button" className="bp-small" disabled={!building} onClick={() => send(saved[name])}>
                      Load
                    </button>
                    <button
                      type="button"
                      className="bp-small bp-danger"
                      onClick={() => {
                        const { [name]: _gone, ...rest } = saved
                        setSaved(rest)
                        storeSaved(rest)
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
            </ul>
          ) : null}
          <div className="bp-row">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(exportText).then(
                  () => flash('Scenario copied as JSON'),
                  () => flash('Copying was blocked — use Download'),
                )
              }}
            >
              Copy JSON
            </button>
            <button
              type="button"
              onClick={() => {
                const url = URL.createObjectURL(new Blob([exportText], { type: 'application/json' }))
                const a = document.createElement('a')
                a.href = url
                a.download = `${saveName.trim() || 'scenario'}.json`
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              Download
            </button>
            {building ? (
              <button type="button" onClick={() => setImporting((v) => !v)}>
                {importing ? 'Cancel import' : 'Import…'}
              </button>
            ) : null}
          </div>
          {importing && building ? (
            <div className="bp-import">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste a scenario's JSON"
                rows={6}
              />
              <button
                type="button"
                onClick={() => {
                  try {
                    send(parseScenario(importText))
                    setImporting(false)
                    setImportText('')
                  } catch (e) {
                    flash(`Not a scenario: ${e instanceof Error ? e.message : String(e)}`)
                  }
                }}
              >
                Load it
              </button>
            </div>
          ) : null}
        </Section>
      </div>

      <footer className="bp-foot">
        {building ? (
          <>
            <button
              type="button"
              className="bp-danger"
              disabled={spec.cards.length === 0}
              onClick={() => {
                send({ ...spec, cards: [] })
                setSelected(null)
              }}
            >
              Clear board
            </button>
            <button type="button" className="bp-primary" onClick={() => game.builderStart()}>
              Start play ▶
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => game.builderStop(false)} title="Back to the scenario play started from">
              Back to start
            </button>
            <button type="button" className="bp-primary" onClick={() => game.builderStop(true)} title="Build on the game as it stands">
              Edit from here
            </button>
          </>
        )}
      </footer>

      {selectedObject !== undefined && building ? (
        <style>{`[data-obj-id="${selectedObject}"] { outline: 2px solid var(--warn); outline-offset: 2px; }`}</style>
      ) : null}
      <CardHoverPreview target={hover} />
    </aside>
  )
}
