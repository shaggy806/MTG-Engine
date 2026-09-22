/**
 * Keyword abilities as the icons MTG Arena draws on its battlefield, from the
 * Mana font (andrewgioia/mana — the font is SIL OFL 1.1, its stylesheets MIT).
 *
 * These replaced a row of Unicode symbols that had nothing to do with Magic
 * (an airplane for flying, a no-entry sign for defender, the digits 1 and 2
 * for first and double strike), one of which — ⚔ for menace — was also the
 * symbol the board uses for "attacking". Several could come out as colour
 * emoji depending on the system font, and six keywords had no symbol at all.
 *
 * Only the font file is used, not the package's stylesheet. That stylesheet
 * pulls in every format the font ships in (the SVG one alone is 1.9MB) and
 * hundreds of classes for symbols this client draws another way, when a board
 * tile needs one glyph per keyword. The glyphs are private-use code points,
 * so each is listed with the `ms-*` class it comes from, checked against
 * mana-font 1.18.0's `css/mana.css` — the version is pinned exactly in
 * package.json for that reason.
 */
import type { Keyword } from 'engine'
import manaWoff2 from 'mana-font/fonts/mana.woff2?url'

// Registered once, when this module is first imported. `display: block`
// keeps a glyph invisible for the moment the font takes to load, rather than
// drawing a private-use code point in a fallback font, which comes out as an
// empty box.
if (typeof document !== 'undefined') {
  document.fonts.add(
    new FontFace('Mana', `url(${manaWoff2}) format('woff2')`, { display: 'block' }),
  )
}

/** One glyph per keyword. A `Record` over the engine's own `Keyword` union,
 * so a keyword added there without an icon here fails the build rather than
 * quietly showing nothing. */
export const KEYWORD_GLYPH: Record<Keyword, string> = {
  flying: '', // ms-ability-flying
  reach: '', // ms-ability-reach
  haste: '', // ms-ability-haste
  vigilance: '', // ms-ability-vigilance
  defender: '', // ms-ability-defender
  'first-strike': '', // ms-ability-first-strike
  'double-strike': '', // ms-ability-double-strike
  trample: '', // ms-ability-trample
  deathtouch: '', // ms-ability-deathtouch
  lifelink: '', // ms-ability-lifelink
  menace: '', // ms-ability-menace
  indestructible: '', // ms-ability-indestructible
  hexproof: '', // ms-ability-hexproof
  flash: '', // ms-ability-flash
  // Arena has no icons for these four; the font's Magic: Duels set does.
  shroud: '', // ms-ability-duels-shroud
  unblockable: '', // ms-ability-duels-unblockable
  fear: '', // ms-ability-duels-fear
  intimidate: '', // ms-ability-duels-intimidate
  // The sun and moon printed in a day/night card's own frame, which tell the
  // two faces apart; Arena's single daybound/nightbound icon doesn't.
  daybound: '', // ms-dfc-day
  nightbound: '', // ms-dfc-night
}

/** How a keyword reads in words, for the icon's accessible name. */
export const keywordLabel = (keyword: Keyword): string => keyword.replace('-', ' ')
