import type { Keyword } from 'engine/client'

/**
 * Each keyword's name and what it does, in the reminder-text wording printed
 * on cards — the hover card's keyword tooltips (`KeywordTips`). A `Record`
 * over the engine's `Keyword` union, as `KEYWORD_GLYPH` is, so a keyword
 * added there without an explanation here fails the build.
 */
export const KEYWORD_REMINDER: Record<Keyword, { readonly name: string; readonly text: string }> = {
  flying: { name: 'Flying', text: "Can't be blocked except by creatures with flying or reach." },
  reach: { name: 'Reach', text: 'Can block creatures with flying.' },
  haste: { name: 'Haste', text: 'Can attack and {T} as soon as it comes under your control.' },
  vigilance: { name: 'Vigilance', text: "Attacking doesn't cause it to tap." },
  defender: { name: 'Defender', text: "Can't attack." },
  'first-strike': {
    name: 'First strike',
    text: 'Deals combat damage before creatures without first strike.',
  },
  'double-strike': {
    name: 'Double strike',
    text: 'Deals both first-strike and regular combat damage.',
  },
  trample: {
    name: 'Trample',
    text: "Can deal excess combat damage to the player or planeswalker it's attacking.",
  },
  deathtouch: {
    name: 'Deathtouch',
    text: 'Any amount of damage it deals to a creature is enough to destroy it.',
  },
  lifelink: { name: 'Lifelink', text: 'Damage dealt by it also causes its controller to gain that much life.' },
  menace: { name: 'Menace', text: "Can't be blocked except by two or more creatures." },
  indestructible: {
    name: 'Indestructible',
    text: 'Damage and effects that say "destroy" don\'t destroy it.',
  },
  hexproof: {
    name: 'Hexproof',
    text: "Can't be the target of spells or abilities its controller's opponents control.",
  },
  shroud: { name: 'Shroud', text: "Can't be the target of spells or abilities." },
  flash: { name: 'Flash', text: 'Can be cast any time you could cast an instant.' },
  unblockable: { name: "Can't be blocked", text: "Can't be blocked." },
  fear: { name: 'Fear', text: "Can't be blocked except by artifact creatures and/or black creatures." },
  intimidate: {
    name: 'Intimidate',
    text: "Can't be blocked except by artifact creatures and/or creatures that share a color with it.",
  },
  skulk: { name: 'Skulk', text: "Can't be blocked by creatures with greater power." },
  shadow: { name: 'Shadow', text: 'Can block or be blocked by only creatures with shadow.' },
  flanking: {
    name: 'Flanking',
    text: 'Whenever a creature without flanking blocks it, the blocking creature gets -1/-1 until end of turn.',
  },
  riot: { name: 'Riot', text: 'Enters with your choice of a +1/+1 counter or haste.' },
  infect: {
    name: 'Infect',
    text: 'Deals damage to creatures in the form of -1/-1 counters and to players in the form of poison counters.',
  },
  wither: { name: 'Wither', text: 'Deals damage to creatures in the form of -1/-1 counters.' },
  plainswalk: { name: 'Plainswalk', text: "Can't be blocked as long as defending player controls a Plains." },
  islandwalk: { name: 'Islandwalk', text: "Can't be blocked as long as defending player controls an Island." },
  swampwalk: { name: 'Swampwalk', text: "Can't be blocked as long as defending player controls a Swamp." },
  mountainwalk: {
    name: 'Mountainwalk',
    text: "Can't be blocked as long as defending player controls a Mountain.",
  },
  forestwalk: { name: 'Forestwalk', text: "Can't be blocked as long as defending player controls a Forest." },
  desertwalk: { name: 'Desertwalk', text: "Can't be blocked as long as defending player controls a Desert." },
  daybound: {
    name: 'Daybound',
    text: 'If a player casts no spells during their own turn, it becomes night next turn.',
  },
  nightbound: {
    name: 'Nightbound',
    text: 'If a player casts at least two spells during their own turn, it becomes day next turn.',
  },
  changeling: { name: 'Changeling', text: 'This card is every creature type.' },
}
