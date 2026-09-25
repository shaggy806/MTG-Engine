import { defineCard } from "../define.js";

export default defineCard({
  name: "Seal of Removal",
  manaCost: "{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "Sacrifice this enchantment: Return target creature to its owner's hand.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: "Sacrifice this enchantment: Return target creature to its owner's hand.",
    },
  ],
});
