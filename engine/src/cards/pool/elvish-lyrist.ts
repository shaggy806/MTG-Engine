import { defineCard } from "../define.js";

export default defineCard({
  name: "Elvish Lyrist",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf"],
  power: 1,
  toughness: 1,
  text: "{G}, {T}, Sacrifice this creature: Destroy target enchantment.",
  activated: [
    {
      cost: { mana: "{G}", tap: true, sacrifice: "self" },
      targets: ["enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{G}, {T}, Sacrifice this creature: Destroy target enchantment.",
    },
  ],
});
