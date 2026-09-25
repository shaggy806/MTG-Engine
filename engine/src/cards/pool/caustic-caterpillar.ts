import { defineCard } from "../define.js";

export default defineCard({
  name: "Caustic Caterpillar",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 1,
  text: "{1}{G}, Sacrifice this creature: Destroy target artifact or enchantment.",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false, sacrifice: "self" },
      targets: ["artifact-or-enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{1}{G}, Sacrifice this creature: Destroy target artifact or enchantment.",
    },
  ],
});
