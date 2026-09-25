import { defineCard } from "../define.js";

export default defineCard({
  name: "Kami of Ancient Law",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 2,
  text: "Sacrifice this creature: Destroy target enchantment.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "Sacrifice this creature: Destroy target enchantment.",
    },
  ],
});
