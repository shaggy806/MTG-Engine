import { defineCard } from "../define.js";

export default defineCard({
  name: "Silverchase Fox",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Fox"],
  power: 2,
  toughness: 2,
  text: "{1}{W}, Sacrifice this creature: Exile target enchantment.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false, sacrifice: "self" },
      targets: ["enchantment"],
      effect: { kind: "exile", target: 0 },
      resolve: null,
      text: "{1}{W}, Sacrifice this creature: Exile target enchantment.",
    },
  ],
});
