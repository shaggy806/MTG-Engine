import { defineCard } from "../define.js";

export default defineCard({
  name: "Manalith",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
  ],
});
