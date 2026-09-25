import { defineCard } from "../define.js";

export default defineCard({
  name: "Letter of Acceptance",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add one mana of any color.\n{2}, {T}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}, {T}, Sacrifice this artifact: Draw a card.",
    },
  ],
});
