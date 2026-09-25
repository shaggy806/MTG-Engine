import { defineCard } from "../define.js";

export default defineCard({
  name: "Inspired Insurgent",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Peasant", "Ally"],
  power: 2,
  toughness: 2,
  text: "{1}, Sacrifice this creature: Destroy target artifact or enchantment.",
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
