import { defineCard } from "../define.js";

export default defineCard({
  name: "Cathar Commando",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 1,
  keywords: ["flash"],
  text: "Flash\n{1}, Sacrifice this creature: Destroy target artifact or enchantment.",
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
