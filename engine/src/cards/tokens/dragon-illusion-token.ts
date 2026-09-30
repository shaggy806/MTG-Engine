import { defineCard } from "../define.js";

/** X/X red Dragon Illusion with flying and haste — Manaform Hellkite's token.
 * Its printed power and toughness are stars: the effect that makes it sets
 * its base P/T (`basePt`). */
export default defineCard({
  name: "Dragon Illusion Token",
  art: "44b7c73d-80a0-4a27-b0a2-317164362449",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon", "Illusion"],
  power: 0,
  toughness: 0,
  keywords: ["flying", "haste"],
  text: "Flying, haste",
});
