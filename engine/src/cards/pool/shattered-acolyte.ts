import { defineCard } from "../define.js";

export default defineCard({
  name: "Shattered Acolyte",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dwarf", "Warlock"],
  power: 2,
  toughness: 2,
  keywords: ["lifelink"],
  text: "Lifelink\n{1}, Sacrifice this creature: Destroy target artifact or enchantment.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "self" },
      targets: ["artifact-or-enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{1}, Sacrifice this creature: Destroy target artifact or enchantment.",
    },
  ],
});
