import { defineCard } from "../define.js";
import { transmute } from "../helpers.js";

// EDHREC rank 2862.
const TRANSMUTE_TEXT =
  "Transmute {1}{U}{U} ({1}{U}{U}, Discard this card: Search your library for a card with the same mana value as this card, reveal it, put it into your hand, then shuffle. Transmute only as a sorcery.)";

export default defineCard({
  name: "Drift of Phantasms",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 0,
  toughness: 5,
  keywords: ["defender", "flying"],
  text: `Defender (This creature can't attack.)\nFlying\n${TRANSMUTE_TEXT}`,
  activated: [transmute("{1}{U}{U}", 3, TRANSMUTE_TEXT)],
});
