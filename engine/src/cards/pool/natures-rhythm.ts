import { defineCard } from "../define.js";

const TEXT =
  "Search your library for a creature card with mana value X or less, put it onto the battlefield, then shuffle.";
const HARMONIZE_TEXT =
  "Harmonize {X}{G}{G}{G}{G} (You may cast this card from your graveyard for its harmonize cost. You may tap a " +
  "creature you control to reduce that cost by an amount of generic mana equal to its power. Then exile this spell.)";

// A search for a card with a stated quality may find nothing (rule
// 701.23d). With harmonize, the tapped creature's power comes off X's part
// of the cost only.
export default defineCard({
  name: "Nature's Rhythm",
  manaCost: "{X}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: `${TEXT}\n${HARMONIZE_TEXT}`,
  effect: {
    kind: "search-library",
    filter: { type: "creature", manaValue: { op: "lte", n: { amount: "x" } } },
    destination: "battlefield",
    min: 0,
    max: 1,
  },
  harmonize: { cost: "{X}{G}{G}{G}{G}" },
});
