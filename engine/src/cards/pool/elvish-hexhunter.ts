import { defineCard } from "../define.js";

export default defineCard({
  name: "Elvish Hexhunter",
  manaCost: "{G/W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 1,
  toughness: 1,
  text: "{G/W}, {T}, Sacrifice this creature: Destroy target enchantment.",
  activated: [
    {
      cost: { mana: "{G/W}", tap: true, sacrifice: "self" },
      targets: ["enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{G/W}, {T}, Sacrifice this creature: Destroy target enchantment.",
    },
  ],
});
