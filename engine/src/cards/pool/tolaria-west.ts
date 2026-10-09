import { defineCard } from "../define.js";
import { addManaAbility, entersTappedStatic, transmute } from "../helpers.js";

// EDHREC rank 3236. A land's mana value is 0, so its transmute finds a card
// with mana value 0 — a land, or a spell such as an Ornithopter.
const TRANSMUTE_TEXT =
  "Transmute {1}{U}{U} ({1}{U}{U}, Discard this card: Search your library for a card with mana value 0, reveal it, put it into your hand, then shuffle. Transmute only as a sorcery.)";

export default defineCard({
  name: "Tolaria West",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {U}.\n${TRANSMUTE_TEXT}`,
  static: [{ ...entersTappedStatic("Tolaria West"), text: "This land enters tapped." }],
  activated: [addManaAbility({ mana: "U", text: "{T}: Add {U}." }), transmute("{1}{U}{U}", 0, TRANSMUTE_TEXT)],
});
