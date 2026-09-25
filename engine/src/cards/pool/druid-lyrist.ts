import { defineCard } from "../define.js";

export default defineCard({
  name: "Druid Lyrist",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
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
