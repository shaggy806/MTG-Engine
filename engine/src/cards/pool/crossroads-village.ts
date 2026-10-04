import { defineCard } from "../define.js";

// EDHREC rank 2958.
// Town is a land type with no special meaning (the ruling).

export default defineCard({
  name: "Crossroads Village",
  colors: [],
  types: ["land"],
  subtypes: ["Town"],
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
