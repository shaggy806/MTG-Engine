import { defineCard } from "../define.js";

export default defineCard({
  name: "Quagmire Druid",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Druid"],
  power: 2,
  toughness: 2,
  text: "{G}, {T}, Sacrifice a creature: Destroy target enchantment.",
  activated: [
    {
      cost: { mana: "{G}", tap: true, sacrifice: "creature-you-control" },
      targets: ["enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{G}, {T}, Sacrifice a creature: Destroy target enchantment.",
    },
  ],
});
