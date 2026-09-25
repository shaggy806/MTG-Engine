import { defineCard } from "../define.js";

export default defineCard({
  name: "Standing Stones",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{1}, {T}, Pay 1 life: Add one mana of any color.",
  activated: [
    {
      cost: { mana: "{1}", tap: true, payLife: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{1}, {T}, Pay 1 life: Add one mana of any color.",
    },
  ],
});
