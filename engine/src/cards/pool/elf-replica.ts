import { defineCard } from "../define.js";

export default defineCard({
  name: "Elf Replica",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Elf"],
  power: 2,
  toughness: 2,
  text: "{1}{G}, Sacrifice this creature: Destroy target enchantment.",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false, sacrifice: "self" },
      targets: ["enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{1}{G}, Sacrifice this creature: Destroy target enchantment.",
    },
  ],
});
