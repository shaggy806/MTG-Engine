/**
 * What a bot seat is called: a well-known Magic character whose colours
 * match the deck the bot plays — Jace or Urza piloting mono-blue, Vraska
 * Golgari, Nicol Bolas Grixis. A match needn't be exact: the characters
 * closest to the deck's colour identity are the candidates, one is picked at
 * random, and a name another seat at the table already uses is passed over.
 */

import type { Color } from "engine";

interface Character {
  readonly name: string;
  /** WUBRG letters; "" is colourless. */
  readonly colors: string;
}

const CHARACTERS: readonly Character[] = [
  // Colourless
  { name: "Karn", colors: "" },
  { name: "Ugin", colors: "" },
  { name: "Kozilek", colors: "" },
  { name: "Emrakul", colors: "" },
  // Mono-colour
  { name: "Elspeth", colors: "W" },
  { name: "Gideon", colors: "W" },
  { name: "Ajani", colors: "W" },
  { name: "Serra", colors: "W" },
  { name: "Jace", colors: "U" },
  { name: "Urza", colors: "U" },
  { name: "Tamiyo", colors: "U" },
  { name: "Talrand", colors: "U" },
  { name: "Liliana", colors: "B" },
  { name: "Yawgmoth", colors: "B" },
  { name: "Sheoldred", colors: "B" },
  { name: "Ob Nixilis", colors: "B" },
  { name: "Chandra", colors: "R" },
  { name: "Jaya", colors: "R" },
  { name: "Koth", colors: "R" },
  { name: "Krenko", colors: "R" },
  { name: "Nissa", colors: "G" },
  { name: "Garruk", colors: "G" },
  { name: "Freyalise", colors: "G" },
  { name: "Titania", colors: "G" },
  // Two colours
  { name: "Teferi", colors: "WU" },
  { name: "Dovin", colors: "WU" },
  { name: "Ojutai", colors: "WU" },
  { name: "Tezzeret", colors: "UB" },
  { name: "Ashiok", colors: "UB" },
  { name: "Lazav", colors: "UB" },
  { name: "Silumgar", colors: "UB" },
  { name: "Rakdos", colors: "BR" },
  { name: "Kolaghan", colors: "BR" },
  { name: "Kaervek", colors: "BR" },
  { name: "Sarkhan", colors: "RG" },
  { name: "Domri", colors: "RG" },
  { name: "Xenagos", colors: "RG" },
  { name: "Atarka", colors: "RG" },
  { name: "Trostani", colors: "WG" },
  { name: "Tolsimir", colors: "WG" },
  { name: "Dromoka", colors: "WG" },
  { name: "Sorin", colors: "WB" },
  { name: "Kaya", colors: "WB" },
  { name: "Teysa", colors: "WB" },
  { name: "Ral Zarek", colors: "UR" },
  { name: "Niv-Mizzet", colors: "UR" },
  { name: "Saheeli", colors: "UR" },
  { name: "Jhoira", colors: "UR" },
  { name: "Vraska", colors: "BG" },
  { name: "Jarad", colors: "BG" },
  { name: "Meren", colors: "BG" },
  { name: "Aurelia", colors: "WR" },
  { name: "Feather", colors: "WR" },
  { name: "Tajic", colors: "WR" },
  { name: "Kiora", colors: "UG" },
  { name: "Zegana", colors: "UG" },
  { name: "Momir Vig", colors: "UG" },
  { name: "Tatyova", colors: "UG" },
  // Three colours
  { name: "Sharuum", colors: "WUB" },
  { name: "Raffine", colors: "WUB" },
  { name: "Oloro", colors: "WUB" },
  { name: "Nicol Bolas", colors: "UBR" },
  { name: "Kess", colors: "UBR" },
  { name: "Marchesa", colors: "UBR" },
  { name: "Korvold", colors: "BRG" },
  { name: "Prossh", colors: "BRG" },
  { name: "Kresh", colors: "BRG" },
  { name: "Gishath", colors: "WRG" },
  { name: "Marath", colors: "WRG" },
  { name: "Mayael", colors: "WRG" },
  { name: "Rafiq", colors: "WUG" },
  { name: "Derevi", colors: "WUG" },
  { name: "Roon", colors: "WUG" },
  { name: "Anafenza", colors: "WBG" },
  { name: "Karador", colors: "WBG" },
  { name: "Ghave", colors: "WBG" },
  { name: "Narset", colors: "WUR" },
  { name: "Elsha", colors: "WUR" },
  { name: "Kykar", colors: "WUR" },
  { name: "Sidisi", colors: "UBG" },
  { name: "Tasigur", colors: "UBG" },
  { name: "Muldrotha", colors: "UBG" },
  { name: "Zurgo", colors: "WBR" },
  { name: "Alesha", colors: "WBR" },
  { name: "Edgar Markov", colors: "WBR" },
  { name: "Surrak", colors: "URG" },
  { name: "Yasova", colors: "URG" },
  { name: "Animar", colors: "URG" },
  // Four and five colours
  { name: "Breya", colors: "WUBR" },
  { name: "Yidris", colors: "UBRG" },
  { name: "Saskia", colors: "WBRG" },
  { name: "Kynaios and Tiro", colors: "WURG" },
  { name: "Atraxa", colors: "WUBG" },
  { name: "The Ur-Dragon", colors: "WUBRG" },
  { name: "Kenrith", colors: "WUBRG" },
  { name: "Jodah", colors: "WUBRG" },
  { name: "Ramos", colors: "WUBRG" },
];

/** How alike two colour sets are: shared colours over all colours between
 * them (1 for identical, including two colourless sets; 0 for disjoint). */
function likeness(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let shared = 0;
  for (const c of a) if (b.has(c)) shared += 1;
  return shared / (a.size + b.size - shared);
}

/**
 * A bot name for a deck of colour identity `identity`: a random one of the
 * characters most alike it, skipping any name in `taken` (the other seats'
 * names) — falling back to the next-closest characters when every best match
 * is in use. `random` is injectable for tests.
 */
export function botNameFor(
  identity: ReadonlySet<Color>,
  taken: ReadonlySet<string> = new Set(),
  random: () => number = Math.random,
): string {
  const scored = CHARACTERS.filter((c) => !taken.has(c.name)).map((c) => ({
    name: c.name,
    score: likeness(identity, new Set(c.colors)),
  }));
  const best = Math.max(...scored.map((c) => c.score));
  const pool = scored.filter((c) => c.score === best);
  return pool[Math.floor(random() * pool.length)].name;
}

/** Whether `name` is still among the best matches for `identity` — so a bot
 * whose deck changes keeps its name when the new deck suits it as well. */
export function botNameFits(name: string, identity: ReadonlySet<Color>): boolean {
  const character = CHARACTERS.find((c) => c.name === name);
  if (character === undefined) return false;
  const best = Math.max(...CHARACTERS.map((c) => likeness(identity, new Set(c.colors))));
  return likeness(identity, new Set(character.colors)) === best;
}
