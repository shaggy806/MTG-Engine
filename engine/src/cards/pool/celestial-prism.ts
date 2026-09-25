import { defineCard } from "../define.js";

export default defineCard({
  name: "Celestial Prism",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{2}, {T}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{2}, {T}: Add one mana of any color.",
    },
  ],
});
