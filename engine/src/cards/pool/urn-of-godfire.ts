import { defineCard } from "../define.js";

export default defineCard({
  name: "Urn of Godfire",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{2}: Add one mana of any color.\n{6}, {T}, Sacrifice this artifact: Destroy target creature or enchantment.",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{2}: Add one mana of any color.",
    },
    {
      cost: { mana: "{6}", tap: true, sacrifice: "self" },
      targets: ["creature-or-enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{6}, {T}, Sacrifice this artifact: Destroy target creature or enchantment.",
    },
  ],
});
