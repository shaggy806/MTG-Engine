import { defineCard } from "../define.js";

export default defineCard({
  name: "Mana Cylix",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{1}, {T}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add one mana of any color.",
    },
  ],
});
