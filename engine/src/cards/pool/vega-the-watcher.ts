import { defineCard } from "../define.js";

// EDHREC rank 2718.
//
// Rulings:
//   [2021-02-05] Vega's ability will resolve before the spell that caused it to trigger. It will
//     resolve even if that spell is countered.
const CAST_TEXT = "Whenever you cast a spell from anywhere other than your hand, draw a card.";

export default defineCard({
  name: "Vega, the Watcher",
  manaCost: "{1}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bird", "Spirit"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${CAST_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", notFrom: "hand" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
