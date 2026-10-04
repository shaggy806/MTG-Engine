import { defineCard } from "../define.js";

// EDHREC rank 2807.
//
// Rulings:
//   [2024-07-26] If Uncharted Haven is somehow on the battlefield without a chosen color, its mana
//     ability won't make any mana.
// Coldsteel Heart's shape on a land.
export default defineCard({
  name: "Uncharted Haven",
  colors: [],
  types: ["land"],
  text: "This land enters tapped. As it enters, choose a color.\n{T}: Add one mana of the chosen color.",
  chooseOnEnter: ["W", "U", "B", "R", "G"],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "chosen", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of the chosen color.",
    },
  ],
});
