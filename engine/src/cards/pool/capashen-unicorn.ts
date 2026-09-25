import { defineCard } from "../define.js";

export default defineCard({
  name: "Capashen Unicorn",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Unicorn"],
  power: 1,
  toughness: 2,
  text: "{1}{W}, {T}, Sacrifice this creature: Destroy target artifact or enchantment.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: true, sacrifice: "self" },
      targets: ["artifact-or-enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{1}{W}, {T}, Sacrifice this creature: Destroy target artifact or enchantment.",
    },
  ],
});
