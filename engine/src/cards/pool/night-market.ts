import { defineCard } from "../define.js";

// EDHREC rank 6644.
// Uncharted Haven's shape, with cycling {3}.
export default defineCard({
  name: "Night Market",
  colors: [],
  types: ["land"],
  cycling: { cost: "{3}" },
  text: "This land enters tapped. As it enters, choose a color.\n{T}: Add one mana of the chosen color.\nCycling {3} ({3}, Discard this card: Draw a card.)",
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
