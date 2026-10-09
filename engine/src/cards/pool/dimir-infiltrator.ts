import { defineCard } from "../define.js";
import { transmute } from "../helpers.js";

// EDHREC rank 5244.
const TRANSMUTE_TEXT =
  "Transmute {1}{U}{B} ({1}{U}{B}, Discard this card: Search your library for a card with the same mana value as this card, reveal it, put it into your hand, then shuffle. Transmute only as a sorcery.)";

export default defineCard({
  name: "Dimir Infiltrator",
  manaCost: "{U}{B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 3,
  text: `This creature can't be blocked.\n${TRANSMUTE_TEXT}`,
  static: [{ affects: { scope: "self" }, grantKeywords: ["unblockable"], text: "This creature can't be blocked." }],
  activated: [transmute("{1}{U}{B}", 2, TRANSMUTE_TEXT)],
});
