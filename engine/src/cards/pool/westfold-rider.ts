import { defineCard } from "../define.js";

export default defineCard({
  name: "Westfold Rider",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 3,
  toughness: 1,
  text: "Sacrifice this creature: Destroy target artifact or enchantment. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["artifact-or-enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "Sacrifice this creature: Destroy target artifact or enchantment. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
