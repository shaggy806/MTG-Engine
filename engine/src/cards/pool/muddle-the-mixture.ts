import { defineCard } from "../define.js";
import { transmute } from "../helpers.js";

// EDHREC rank 696.
const TRANSMUTE_TEXT =
  "Transmute {1}{U}{U} ({1}{U}{U}, Discard this card: Search your library for a card with the same mana value as this card, reveal it, put it into your hand, then shuffle. Transmute only as a sorcery.)";

export default defineCard({
  name: "Muddle the Mixture",
  manaCost: "{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: `Counter target instant or sorcery spell.\n${TRANSMUTE_TEXT}`,
  targets: ["instant-or-sorcery-spell"],
  effect: { kind: "counter", target: 0 },
  activated: [transmute("{1}{U}{U}", 2, TRANSMUTE_TEXT)],
});
