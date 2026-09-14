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

/** The card's keywords, normalized to individual lowercase words so a
 * multi-word keyword (e.g. "first strike") matches a comma-separated line
 * listing it alongside others. */
function keywordWordSet(obj: VisibleObject): Set<string> {
  return new Set(obj.keywords.flatMap((k) => k.replace(/-/g, ' ').toLowerCase().split(' ')))
}

/** True when `text` (a full text block or a single line) only restates
 * words from `kw` (e.g. "First strike", "Deathtouch, lifelink"). */
function isJustKeywords(text: string, kw: Set<string>): boolean {
  if (text.length === 0) return false
  const words = text.toLowerCase().split(/[\s,.]+/).filter(Boolean)
  return words.length > 0 && words.every((w) => kw.has(w))
}

/** The rules text to actually display: drops a leading segment that only
 * restates the card's keyword abilities, since those already render as
 * their own bold `.ct-kw` line above — most cards print keywords as their
 * own leading sentence of Oracle text, so showing both is otherwise pure
 * duplication (Wurmcoil Engine: "Deathtouch, lifelink" bold, then the exact
 * same words again to start the body text). The leading segment can be
 * terminated either by a real line break or, for some hand-authored cards
 * in this pool, a ". " within one paragraph (e.g. "Deathtouch, lifelink.
 * When ~ dies, …") — both count. Only ever strips the one leading segment,
 * and only when there's more text after it — a keyword-only card (e.g. a
 * vanilla "Flying" creature) has nothing left to strip; it already
 * collapses to just the bold line via `showText` below. A *later* mention
 * of the same word (e.g. Wurmcoil's own text describing what abilities the
 * tokens it creates have) is left alone; only the leading restatement is
 * ever removed. */
function bodyText(obj: VisibleObject): string {
  if (obj.keywords.length === 0 || obj.text.length === 0) return obj.text
  const lead = obj.text.match(/^([^.\n]+)[.\n]\s*/)
  if (lead && isJustKeywords(lead[1], keywordWordSet(obj))) {
    return obj.text.slice(lead[0].length)
  }
  return obj.text
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
  // Drops a leading line that just restates the keywords (see bodyText's
  // comment) before deciding whether there's any body text left to show at
  // all -- a keyword-only card (nothing left after stripping) shows just
  // the bold keyword line below, not an empty rules-text box.
  const displayText = bodyText(obj)
  const showText = displayText.length > 0 && !isJustKeywords(displayText, keywordWordSet(obj))
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
  }, [artFirst, displayText, keywordLine, showText, counters.length])
  // Same idea, one dimension: the type line is a single `white-space:nowrap`
  // line (see .ct-type), so "doesn't fit" means it overflows horizontally
  // (scrollWidth > clientWidth) rather than vertically -- otherwise the same
  // measure/step/re-measure loop as the rules text above.
  const typeLineText = typeLine(obj)
  const typeRef = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const el = typeRef.current
    if (!artFirst || !el) return
    el.style.removeProperty('--type-scale')
    let scale = 1
    while (el.scrollWidth > el.clientWidth && scale > 0.55) {
      scale = Math.round((scale - 0.05) * 100) / 100
      el.style.setProperty('--type-scale', String(scale))
    }
  }, [artFirst, typeLineText])
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

      <span className="ct-type" ref={typeRef}>
        {typeLineText}
      </span>

      <span className="ct-text" ref={textRef}>
        {keywordLine ? <b className="ct-kw">{keywordLine}</b> : null}
        {showText ? (
          <span className="ct-rules">
            <Symbols text={displayText} />
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
