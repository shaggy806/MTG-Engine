import type { Keyword } from 'engine/client'
import { KEYWORD_REMINDER } from './keywordReminders.ts'

/**
 * The terms a card's rules text uses that a hover card explains in a tooltip
 * (`KeywordTips`), beyond the engine's own `Keyword` list: keyword abilities
 * the engine keeps as rules text (ward, protection, prowess…), keyword
 * actions (scry, surveil, mill…) and the common predefined tokens (Treasure,
 * Food, Clue). Each is found by a word-bounded pattern, so Dragonstorm isn't
 * storm and equipped isn't equip.
 *
 * Because each of these now has a tooltip, the parenthesised reminder text
 * a card prints after one is dropped from the card face (`stripReminders`),
 * which is most of what makes a wordy card's text box overflow.
 */
interface TextTerm {
  readonly key: string
  readonly name: string
  readonly pattern: RegExp
  readonly text: string
}

const TERMS: readonly TextTerm[] = [
  // Keyword abilities kept as rules text.
  {
    key: 'ward',
    name: 'Ward',
    pattern: /\bward\b/i,
    text: 'Whenever this becomes the target of a spell or ability an opponent controls, counter it unless that player pays the ward cost.',
  },
  {
    key: 'protection',
    name: 'Protection',
    pattern: /\bprotection from\b/i,
    text: "Can't be blocked, targeted, dealt damage, enchanted or equipped by anything with the quality it has protection from.",
  },
  {
    key: 'prowess',
    name: 'Prowess',
    pattern: /\bprowess\b/i,
    text: 'Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.',
  },
  {
    key: 'toxic',
    name: 'Toxic',
    pattern: /\btoxic \d+/i,
    text: 'Players dealt combat damage by this creature also get that many poison counters.',
  },
  {
    key: 'kicker',
    name: 'Kicker',
    pattern: /\b(?:multi)?kicker\b/i,
    text: 'You may pay an additional cost as you cast this spell, for a bigger effect.',
  },
  {
    key: 'flashback',
    name: 'Flashback',
    pattern: /\bflashback\b/i,
    text: 'You may cast this card from your graveyard for its flashback cost. Then exile it.',
  },
  {
    key: 'cycling',
    name: 'Cycling',
    pattern: /\b(?:\w+)?cycling\b/i,
    text: 'Pay the cycling cost and discard this card: draw a card.',
  },
  {
    key: 'convoke',
    name: 'Convoke',
    pattern: /\bconvoke\b/i,
    text: "Your creatures can help cast this spell. Each creature you tap while casting it pays for {1} or one mana of that creature's color.",
  },
  {
    key: 'cascade',
    name: 'Cascade',
    pattern: /\bcascade\b/i,
    text: 'When you cast this spell, exile cards from the top of your library until you exile a nonland card that costs less. You may cast it free. Put the rest on the bottom in a random order.',
  },
  {
    key: 'delve',
    name: 'Delve',
    pattern: /\bdelve\b/i,
    text: 'Each card you exile from your graveyard while casting this spell pays for {1}.',
  },
  {
    key: 'storm',
    name: 'Storm',
    pattern: /\bstorm\b/i,
    text: 'When you cast this spell, copy it for each spell cast before it this turn.',
  },
  {
    key: 'affinity',
    name: 'Affinity',
    pattern: /\baffinity for\b/i,
    text: 'This spell costs {1} less to cast for each of the named permanents you control.',
  },
  {
    key: 'improvise',
    name: 'Improvise',
    pattern: /\bimprovise\b/i,
    text: 'Your artifacts can help cast this spell. Each artifact you tap after you\'re done activating mana abilities pays for {1}.',
  },
  {
    key: 'split-second',
    name: 'Split second',
    pattern: /\bsplit second\b/i,
    text: "As long as this spell is on the stack, players can't cast spells or activate abilities that aren't mana abilities.",
  },
  {
    key: 'persist',
    name: 'Persist',
    pattern: /\bpersist\b/i,
    text: 'When this creature dies, if it had no -1/-1 counters on it, return it to the battlefield with a -1/-1 counter on it.',
  },
  {
    key: 'undying',
    name: 'Undying',
    pattern: /\bundying\b/i,
    text: 'When this creature dies, if it had no +1/+1 counters on it, return it to the battlefield with a +1/+1 counter on it.',
  },
  {
    key: 'annihilator',
    name: 'Annihilator',
    pattern: /\bannihilator \d+/i,
    text: 'Whenever this creature attacks, defending player sacrifices that many permanents.',
  },
  {
    key: 'exalted',
    name: 'Exalted',
    pattern: /\bexalted\b/i,
    text: 'Whenever a creature you control attacks alone, that creature gets +1/+1 until end of turn.',
  },
  {
    key: 'afterlife',
    name: 'Afterlife',
    pattern: /\bafterlife \d+/i,
    text: 'When this creature dies, create that many 1/1 white and black Spirit creature tokens with flying.',
  },
  {
    key: 'equip',
    name: 'Equip',
    pattern: /\bequip\b/i,
    text: 'Attach to target creature you control. Equip only as a sorcery.',
  },
  {
    key: 'crew',
    name: 'Crew',
    pattern: /\bcrew \d+/i,
    text: 'Tap any number of untapped creatures you control with that much total power: this Vehicle becomes an artifact creature until end of turn.',
  },
  {
    key: 'ninjutsu',
    name: 'Ninjutsu',
    pattern: /\bninjutsu\b/i,
    text: 'Pay the ninjutsu cost and return an unblocked attacker you control to its owner\'s hand: put this card onto the battlefield from your hand tapped and attacking.',
  },
  {
    key: 'evoke',
    name: 'Evoke',
    pattern: /\bevoke\b/i,
    text: "You may cast this spell for its evoke cost. If you do, it's sacrificed when it enters.",
  },
  {
    key: 'madness',
    name: 'Madness',
    pattern: /\bmadness\b/i,
    text: 'If you discard this card, discard it into exile. When you do, cast it for its madness cost or put it into your graveyard.',
  },
  {
    key: 'escape',
    name: 'Escape',
    pattern: /\bescape—/i,
    text: 'You may cast this card from your graveyard for its escape cost.',
  },
  {
    key: 'unearth',
    name: 'Unearth',
    pattern: /\bunearth\b/i,
    text: 'Return this card from your graveyard to the battlefield. It gains haste. Exile it at the next end step or if it would leave the battlefield. Unearth only as a sorcery.',
  },
  {
    key: 'dash',
    name: 'Dash',
    pattern: /\bdash\b/i,
    text: "You may cast this spell for its dash cost. If you do, it gains haste, and it's returned to its owner's hand at the beginning of the next end step.",
  },
  {
    key: 'blitz',
    name: 'Blitz',
    pattern: /\bblitz\b/i,
    text: 'You may cast this spell for its blitz cost. If you do, it gains haste and "When this creature dies, draw a card." Sacrifice it at the beginning of the next end step.',
  },
  {
    key: 'mentor',
    name: 'Mentor',
    pattern: /\bmentor\b/i,
    text: 'Whenever this creature attacks, put a +1/+1 counter on target attacking creature with lesser power.',
  },
  {
    key: 'training',
    name: 'Training',
    pattern: /\btraining\b/i,
    text: 'Whenever this creature attacks with another creature with greater power, put a +1/+1 counter on this creature.',
  },
  {
    key: 'devoid',
    name: 'Devoid',
    pattern: /\bdevoid\b/i,
    text: 'This card has no color.',
  },
  // Keyword actions.
  {
    key: 'scry',
    name: 'Scry',
    pattern: /\bscry\b/i,
    text: 'Look at that many cards from the top of your library, then put any number of them on the bottom and the rest on top in any order.',
  },
  {
    key: 'surveil',
    name: 'Surveil',
    pattern: /\bsurveil\b/i,
    text: 'Look at that many cards from the top of your library, then put any number of them into your graveyard and the rest on top in any order.',
  },
  {
    key: 'mill',
    name: 'Mill',
    pattern: /\bmills?\b/i,
    text: 'Put that many cards from the top of the library into the graveyard.',
  },
  {
    key: 'investigate',
    name: 'Investigate',
    pattern: /\binvestigates?\b/i,
    text: 'Create a Clue token: an artifact with "{2}, Sacrifice this artifact: Draw a card."',
  },
  {
    key: 'proliferate',
    name: 'Proliferate',
    pattern: /\bproliferate\b/i,
    text: 'Choose any number of permanents and/or players, then give each another counter of each kind already there.',
  },
  {
    key: 'populate',
    name: 'Populate',
    pattern: /\bpopulate\b/i,
    text: "Create a token that's a copy of a creature token you control.",
  },
  {
    key: 'explore',
    name: 'Explore',
    pattern: /\bexplores?\b/i,
    text: 'Reveal the top card of your library. Put it into your hand if it\'s a land. Otherwise, put a +1/+1 counter on this creature, then put the card back or into your graveyard.',
  },
  {
    key: 'connive',
    name: 'Connive',
    pattern: /\bconnives?\b/i,
    text: 'Draw a card, then discard a card. If you discarded a nonland card, put a +1/+1 counter on this creature.',
  },
  {
    key: 'goad',
    name: 'Goad',
    pattern: /\bgoad(?:s|ed)?\b/i,
    text: 'Until your next turn, that creature attacks each combat if able, and attacks a player other than you if able.',
  },
  {
    key: 'amass',
    name: 'Amass',
    pattern: /\bamass\b/i,
    text: "Put that many +1/+1 counters on an Army you control. If you don't control one, create a 0/0 black Army creature token first.",
  },
  {
    key: 'discover',
    name: 'Discover',
    pattern: /\bdiscover \d+/i,
    text: 'Exile cards from the top of your library until you exile a nonland card with that mana value or less. Cast it free, or put it into your hand.',
  },
  // Predefined tokens.
  {
    key: 'treasure',
    name: 'Treasure',
    pattern: /\btreasure\b/i,
    text: 'An artifact token with "{T}, Sacrifice this artifact: Add one mana of any color."',
  },
  {
    key: 'food',
    name: 'Food',
    pattern: /\bfood\b/i,
    text: 'An artifact token with "{2}, {T}, Sacrifice this artifact: You gain 3 life."',
  },
  {
    key: 'clue',
    name: 'Clue',
    pattern: /\bclue\b/i,
    text: 'An artifact token with "{2}, Sacrifice this artifact: Draw a card."',
  },
]

/** The engine's keywords as they're written in rules text ("first strike",
 * not "first-strike"), for finding a granted one ("gains flying"). The
 * "can't be blocked" of `unblockable` is plain English, not a term. */
const ENGINE_TERMS: readonly { readonly keyword: Keyword; readonly pattern: RegExp }[] = (
  Object.keys(KEYWORD_REMINDER) as Keyword[]
)
  .filter((k) => k !== 'unblockable')
  .map((keyword) => ({ keyword, pattern: new RegExp(`\\b${KEYWORD_REMINDER[keyword].name}\\b`, 'i') }))

/** One tooltip: what to call the term and what it does. */
export interface Tip {
  readonly key: string
  readonly name: string
  readonly text: string
  /** The engine keyword this is, for its icon. */
  readonly keyword?: Keyword
}

/** Every term a card should explain: its own keywords first, in the order
 * the engine lists them, then each other term its rules text uses, in the
 * order the table above has them — each once. Pass the text with its
 * reminders already stripped, or a word inside one ("…flying or reach")
 * would count as a term the card uses. */
export function tipsFor(keywords: readonly Keyword[], text: string): Tip[] {
  const tips: Tip[] = []
  const seen = new Set<string>()
  const add = (tip: Tip) => {
    if (seen.has(tip.key)) return
    seen.add(tip.key)
    tips.push(tip)
  }
  for (const keyword of keywords) add({ key: keyword, keyword, ...KEYWORD_REMINDER[keyword] })
  for (const { keyword, pattern } of ENGINE_TERMS) {
    if (pattern.test(text)) add({ key: keyword, keyword, ...KEYWORD_REMINDER[keyword] })
  }
  for (const term of TERMS) {
    if (term.pattern.test(text)) add({ key: term.key, name: term.name, text: term.text })
  }
  return tips
}

/** Whether `sentence` uses a term a tooltip explains. */
function explainsATerm(sentence: string): boolean {
  return ENGINE_TERMS.some((t) => t.pattern.test(sentence)) || TERMS.some((t) => t.pattern.test(sentence))
}

/**
 * `text` without the reminder text a tooltip now carries: a parenthesised
 * aside is dropped when the sentence just before it uses a term a tooltip
 * explains ("Ward {2} (Whenever this…)", "scry 2. (Look at…)"). An aside
 * after anything else stays — a basic land's "({T}: Add {G}.)", or a modal
 * spell's "(You may choose the same mode more than once.)" — since nothing
 * else would say it.
 */
export function stripReminders(text: string): string {
  return text
    .replace(/[ \t]*\(([^()]*)\)/g, (aside, _inner, offset: number) => {
      // The sentence the aside follows: back to the line's start or the
      // previous sentence's full stop, whichever is nearer.
      const before = text.slice(0, offset).replace(/[.\s]+$/, '')
      const stop = before.lastIndexOf('. ')
      const start = Math.max(before.lastIndexOf('\n') + 1, stop === -1 ? 0 : stop + 2)
      return explainsATerm(before.slice(start)) ? '' : aside
    })
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}
