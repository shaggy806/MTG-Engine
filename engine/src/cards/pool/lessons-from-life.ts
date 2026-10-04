import { defineCard } from "../define.js";

// EDHREC rank 5618.
//
// Arboreal Grazer's hand pick after the draw: putting a land onto the
// battlefield isn't playing one, so it needs no land drop (the ruling).
//
// Rulings:
//   [2026-01-27] Lessons from Life's effect doesn't count as playing a land. It can put a land
//     card onto the battlefield even if you've already played your land for the turn.

export default defineCard({
  name: "Lessons from Life",
  manaCost: "{2}{G}{U}",
  colors: ["U", "G"],
  types: ["sorcery"],
  text: "Draw three cards. You may put a land card from your hand onto the battlefield tapped.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 3 },
      {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        enterTapped: true,
        leftover: "stay",
        filter: { type: "land" },
      },
    ],
  },
});
