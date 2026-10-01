import type { Keyword, VisibleObject } from 'engine/client'
import { KEYWORD_GLYPH, keywordLabel } from './abilityIcons.ts'

/**
 * The Mana font's counter glyphs (`ms-counter-*`), by the engine's counter
 * name. Private-use code points copied from mana-font 1.18.0's
 * `css/mana.css`, the same way `abilityIcons.ts` copies its keyword glyphs
 * (the font is registered there). A counter kind the font has no glyph for
 * falls back to its initial letter; a keyword counter (rule 122.1b —
 * flying, lifelink, …) borrows that keyword's ability icon.
 */
const COUNTER_GLYPH: Readonly<Record<string, string>> = {
  '+1/+1': '', // ms-counter-plus
  '-1/-1': '', // ms-counter-minus
  arrow: '',
  brick: '',
  charge: '',
  damage: '',
  devotion: '',
  doom: '',
  echo: '',
  finality: '',
  flame: '',
  flood: '',
  fungus: '',
  goad: '',
  gold: '',
  ki: '',
  lore: '',
  mining: '',
  muster: '',
  paw: '',
  pin: '',
  rad: '',
  scream: '',
  shield: '',
  skeleton: '',
  skull: '',
  slime: '',
  stun: '',
  time: '',
  verse: '',
  void: '',
  vortex: '',
}

/** ms-ability-regenerate, for a permanent's regeneration shields. */
const REGENERATE_GLYPH = ''

function glyphFor(kind: string): string | null {
  return COUNTER_GLYPH[kind] ?? (KEYWORD_GLYPH as Readonly<Record<string, string>>)[kind] ?? null
}

function counterLabel(kind: string): string {
  return kind in KEYWORD_GLYPH ? keywordLabel(kind as Keyword).toLowerCase() : kind
}

/** The counters a tile draws: every kind it has any of, bar loyalty, which
 * the loyalty shield already shows. */
function visibleCounters(obj: VisibleObject): [string, number][] {
  return Object.entries(obj.counters).filter(([k, n]) => n !== 0 && k !== 'loyalty')
}

/**
 * A battlefield tile's counters, one chip per kind — its glyph and how many —
 * stacked up the tile's right edge above the P/T badge. The hover card still
 * names each in words; this is what makes them visible at all without
 * hovering. `+1/+1` counters are drawn too, although the P/T already counts
 * them: "a 3/3 with two counters" is different from "a 3/3" to anyone
 * reading the board for proliferate, −1/−1 counters or a Hardened Scales.
 */
export function CounterChips({ obj }: { readonly obj: VisibleObject }) {
  const counters = visibleCounters(obj)
  const shields = obj.regenerationShields
  if (counters.length === 0 && shields <= 0) return null
  const aboveStat = obj.power !== null || obj.loyalty !== null
  return (
    <span className={`mt-counters${aboveStat ? ' above-stat' : ''}`}>
      {counters.map(([kind, n]) => {
        const glyph = glyphFor(kind)
        const label = counterLabel(kind)
        return (
          <span
            key={kind}
            className={`mt-counter${kind === '-1/-1' ? ' minus' : ''}`}
            title={`${n} ${label} counter${n === 1 ? '' : 's'}`}
          >
            {glyph !== null ? (
              <span className="mt-counter-glyph" aria-hidden="true">
                {glyph}
              </span>
            ) : (
              <span className="mt-counter-letter" aria-hidden="true">
                {kind.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="mt-counter-n">{n}</span>
          </span>
        )
      })}
      {/* Regeneration shields (rule 701.19) aren't counters, but read the
          same way: how many, on the tile. The Mana font's regenerate icon
          and their own colour, so they can't be taken for a shield counter,
          a pump or a flip. */}
      {shields > 0 ? (
        <span
          className="mt-counter regen"
          title={`${shields} regeneration shield${shields === 1 ? '' : 's'}`}
        >
          <span className="mt-counter-glyph" aria-hidden="true">
            {REGENERATE_GLYPH}
          </span>
          <span className="mt-counter-n">{shields}</span>
        </span>
      ) : null}
    </span>
  )
}
