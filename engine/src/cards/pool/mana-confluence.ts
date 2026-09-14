import { defineCard } from "../define.js";

export default defineCard({
  name: "Mana Confluence",
  types: ["land"],
  text: "{T}, Pay 1 life: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: true, payLife: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}, Pay 1 life: Add one mana of any color.",
    },
  ],
});
