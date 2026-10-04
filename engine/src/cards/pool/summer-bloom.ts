import { defineCard } from "../define.js";

// EDHREC rank 2913.
//
// Rulings:
//   [2004-10-04] This spell increases the number of lands you can play in a turn. The land cards
//     are played as you would normally play lands.

export default defineCard({
  name: "Summer Bloom",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "You may play up to three additional lands this turn.",
  effect: { kind: "additional-land-drop", amount: 3 },
});
