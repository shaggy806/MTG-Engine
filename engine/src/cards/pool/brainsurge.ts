import { defineCard } from "../define.js";

// The two put back may be any cards in hand, drawn now or held before (the
// ruling) — as Brainstorm.
export default defineCard({
  name: "Brainsurge",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Draw four cards, then put two cards from your hand on top of your library in any order.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 4 },
      {
        kind: "look-and-choose",
        zone: "hand",
        min: 2,
        max: 2,
        destination: "library-top",
        leftover: "stay",
      },
    ],
  },
});
