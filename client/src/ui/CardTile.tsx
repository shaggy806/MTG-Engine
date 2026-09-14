import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { VisibleObject } from 'engine'
import { Symbols } from './Symbols.tsx'
import { costColor } from './symbols.ts'
import { manaSymbolUrl } from './mana.ts'
import {
  artMisses,
  getArtCacheVersion,
  queueArtLookup,
  resolveArtUrl,
  subscribeArtCache,
} from './art.ts'

const TAP_ICON_URL = manaSymbolUrl('T')

export interface CardTileProps {
  readonly obj: VisibleObject
  readonly highlight?: boolean
  readonly selected?: boolean
  readonly dimmed?: boolean
  /** Subtle marker: this permanent has an ability you could activate. */
  readonly activatable?: boolean
  readonly badge?: string | null
  /** Extra generic mana this specific card currently costs beyond its
   * printed cost (the commander tax, rule 903.4) — shown next to the cost
   * pips rather than folded into them, so the printed cost stays legible. */
  readonly extraGenericCost?: number
  /** A small ordinal shown top-left (blocker damage order). */
  readonly order?: number | null
  /** How many identical permanents this tile stands in for (a land stack). */
  readonly stackCount?: number | null
  /** 'title' (default): a name+cost bar above the art, like a real card's
   * frame -- used everywhere except the hand. 'art-first': cost pips
   * overlaid on the art itself, with the name below it instead -- the
   * mockup's own hand-card treatment (real mana-symbol SVGs via `Symbols`
   * in place of its placeholder colored circles). */
  readonly layout?: 'title' | 'art-first'
  readonly onClick?: () => void
}

const KEYWORD_LABEL: Record<string, string> = {
  flying: 'Flying',
  vigilance: 'Vigilance',
  haste: 'Haste',
  reach: 'Reach',
  defender: 'Defender',
  trample: 'Trample',
  'first-strike': 'First strike',
  'double-strike': 'Double strike',
  deathtouch: 'Deathtouch',
  lifelink: 'Lifelink',
  menace: 'Menace',
  indestructible: 'Indestructible',
  hexproof: 'Hexproof',
  flash: 'Flash',
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

function typeLine(obj: VisibleObject): string {
  const types = obj.types.map(cap).join(' ')
  return obj.subtypes.length > 0
    ? `${types} — ${obj.subtypes.join(' ')}`
    : types
}

/** True when `text` only restates the card's keywords (e.g. "First strike"). */
function textIsJustKeywords(obj: VisibleObject): boolean {
  if (obj.text.length === 0) return false
  const kw = new Set(
    obj.keywords.flatMap((k) => k.replace(/-/g, ' ').toLowerCase().split(' ')),
  )
  const words = obj.text.toLowerCase().split(/[\s,.]+/).filter(Boolean)
  return words.length > 0 && words.every((w) => kw.has(w))
}

export function CardTile({
  obj,
  highlight = false,
  selected = false,
  dimmed = false,
  activatable = false,
  badge = null,
  extraGenericCost = 0,
  order = null,
  stackCount = null,
  layout = 'title',
  onClick,
}: CardTileProps) {
  // A Clone renders the *copied* card's face; a multi-face card renders its up
  // face (`faceName`); `cardName` stays the true identity for the log.
  const face = obj.copyOf ?? obj.faceName ?? obj.cardName
  // Re-render once a batched art lookup resolves so `artSrc` below can pick
  // up the direct (no-redirect) CDN URL instead of the by-name fallback.
  useSyncExternalStore(subscribeArtCache, getArtCacheVersion, getArtCacheVersion)
  useEffect(() => {
    if (!obj.art) queueArtLookup(face)
  }, [obj.art, face])
  const artSrc = resolveArtUrl(obj.art, face)
  // Derived fresh from artSrc (which can change once the batched lookup
  // resolves) rather than captured once at mount.
  const artFailed = artMisses.has(artSrc)
  const [, forceRerender] = useState(0)
  const isCreature = obj.power !== null && obj.toughness !== null
  const isPlaneswalker = obj.loyalty !== null
  const counters = Object.entries(obj.counters).filter(
    ([k, n]) => n !== 0 && k !== 'loyalty',
  )
  const clickable = Boolean(onClick) && (highlight || selected || activatable)
  const showText = obj.text.length > 0 && !textIsJustKeywords(obj)
  const keywordLine = obj.keywords
    .map((k) => KEYWORD_LABEL[k] ?? cap(k))
    .join(', ')
  const tint = costColor(obj.manaCost) ?? 'C'

  const artFirst = layout === 'art-first'
  // Hand cards (art-first) have a fixed box -- rather than silently clipping
  // a wordy card's rules text (Wurmcoil Engine and the like), shrink it in
  // small steps until it actually fits, or the floor is hit. A single
  // ratio-based guess (targetHeight/scrollHeight) over/undershoots because
  // font-size doesn't reduce wrapped line count linearly, so this measures
  // and re-checks after each step instead -- cheap enough for a few lines of
  // text on the modest number of cards a hand ever holds.
  const textRef = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const el = textRef.current
    if (!artFirst || !el) return
    el.style.removeProperty('--text-scale')
    let scale = 1
    while (el.scrollHeight > el.clientHeight && scale > 0.55) {
      scale = Math.round((scale - 0.05) * 100) / 100
      el.style.setProperty('--text-scale', String(scale))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artFirst, obj.text, keywordLine, showText, counters.length])
  const nameNode = (
    <span className="ct-name">
      {face}
      {obj.copyOf ? <span className="ct-copy"> (copy)</span> : null}
      {obj.faces && obj.faces.length > 1 ? (
        <span className="ct-copy" title={obj.faces.join(' // ')}> ⇄</span>
      ) : null}
    </span>
  )
  const costNode = obj.manaCost ? (
    <span className="ct-cost">
      <Symbols text={obj.manaCost} />
      {extraGenericCost > 0 ? (
        <span className="ct-tax" title="Commander tax">
          +{extraGenericCost}
        </span>
      ) : null}
    </span>
  ) : null

  const classes = [
    'card-tile',
    artFirst ? 'art-first' : '',
    obj.tapped ? 'tapped' : '',
    highlight ? 'highlight' : '',
    selected ? 'selected' : '',
    activatable ? 'activatable' : '',
    dimmed ? 'dimmed' : '',
    clickable ? 'clickable' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classes}
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      title={obj.text || face}
    >
      {artFirst ? null : (
        <span className="ct-title">
          {nameNode}
          {costNode}
        </span>
      )}

      <span className={`ct-art tint-${tint}`}>
        {!artFailed ? (
          <img
            src={artSrc}
            alt=""
            loading="lazy"
            onError={() => {
              artMisses.add(artSrc)
              forceRerender((n) => n + 1)
            }}
          />
        ) : null}
        {artFirst && costNode ? <span className="ct-cost-overlay">{costNode}</span> : null}
      </span>

      {artFirst ? <span className="ct-name-row">{nameNode}</span> : null}

      <span className="ct-type">{typeLine(obj)}</span>

      <span className="ct-text" ref={textRef}>
        {keywordLine ? <b className="ct-kw">{keywordLine}</b> : null}
        {showText ? (
          <span className="ct-rules">
            <Symbols text={obj.text} />
          </span>
        ) : null}
        {counters.length > 0 ? (
          <span className="ct-counters">
            {counters.map(([k, n]) => (
              <span key={k}>
                {n}× {k}
              </span>
            ))}
          </span>
        ) : null}
      </span>

      {isCreature ? (
        <span className="ct-pt">
          {obj.power}/{obj.toughness}
          {obj.damageMarked > 0 ? (
            <span className="ct-dmg"> −{obj.damageMarked}</span>
          ) : null}
        </span>
      ) : null}

      {isPlaneswalker ? (
        <span className="ct-loyalty" title="Loyalty">
          {obj.loyalty}
        </span>
      ) : null}

      {order !== null ? <span className="card-order">{order}</span> : null}
      {stackCount !== null && stackCount > 1 ? (
        <span className="card-stack">×{stackCount}</span>
      ) : null}
      {obj.summoningSick && isCreature ? (
        <span className="card-flag sick">sick</span>
      ) : null}
      {badge ? <span className="card-badge">{badge}</span> : null}
      {obj.tapped && TAP_ICON_URL ? (
        <img className="tap-icon" src={TAP_ICON_URL} alt="" />
      ) : null}
    </button>
  )
}
