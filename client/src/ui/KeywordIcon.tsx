import type { Keyword } from 'engine/client'
import { KEYWORD_ICON } from './keywordIconPaths.ts'

/**
 * A keyword's Mana-font icon as an inline SVG, centred on its own ink: the
 * viewBox is one em (1024 font units) square around the outline's centre
 * (`scripts/keyword-icons.mjs` measures it), so it's the size the font drew
 * it at, but placed by geometry. As a font glyph a 13px keyword circle put
 * its icon up to a pixel and a half off centre, differently at each size,
 * because small text's baseline is rounded to the pixel. 1em square, in the
 * text colour.
 */
export function KeywordIcon({ keyword }: { readonly keyword: Keyword }) {
  const { cx, cy, d } = KEYWORD_ICON[keyword]
  return (
    <svg className="kw-icon" viewBox={`${cx - 512} ${-cy - 512} 1024 1024`} aria-hidden="true" focusable="false">
      {/* The font's y axis points up. */}
      <path transform="scale(1 -1)" d={d} />
    </svg>
  )
}
