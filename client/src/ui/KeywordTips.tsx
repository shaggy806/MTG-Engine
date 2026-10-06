import type { Keyword } from 'engine/client'
import { KEYWORD_GLYPH } from './abilityIcons.ts'
import { KEYWORD_REMINDER } from './keywordReminders.ts'
import { Symbols } from './Symbols.tsx'

/**
 * What each of a permanent's keywords does, as a column of small boxes beside
 * its hover card — after Hearthstone's keyword tooltips: the keyword's icon
 * and name, then its reminder text. On the board a keyword is only an icon in
 * the art's corner, and on the hover card only a word in its keyword line;
 * this is where a player who doesn't know "skulk" finds out. Nothing for a
 * permanent without keywords.
 */
export function KeywordTips({ keywords }: { readonly keywords: readonly Keyword[] }) {
  if (keywords.length === 0) return null
  return (
    <div className="keyword-tips">
      {keywords.map((k) => (
        <div key={k} className="keyword-tip">
          <span className="kt-head">
            <span className="kt-glyph" aria-hidden="true">
              {KEYWORD_GLYPH[k]}
            </span>
            {KEYWORD_REMINDER[k].name}
          </span>
          <span className="kt-text">
            <Symbols text={KEYWORD_REMINDER[k].text} />
          </span>
        </div>
      ))}
    </div>
  )
}
