import { defineCard } from "../define.js";

/**
 * Verix Bladewing's kicked half — a *named legendary* token, not the generic
 * 5/5 Dragon: it's a 4/4 called Karox Bladewing, so the legend rule applies
 * to it.
 */
export default defineCard({
  name: "Karox Bladewing",
  art: "37316fc0-83cc-4f53-afc3-6f3235776239",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying",
});
