import { defineCard } from "../define.js";

// REVIEW — auto-finished by `npm run card:scaffold` from the Oracle snapshot: its text
// is only keywords the engine models, so nothing was left to author. Not in the
// registry: check it against the card's Oracle text, then move it into cards/pool/
// (or tokens/) and run `npm run gen:cards -w engine`.
// EDHREC rank 779.

export default defineCard({
  name: "Ornithopter",
  manaCost: "{0}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Thopter"],
  power: 0,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying",
});
