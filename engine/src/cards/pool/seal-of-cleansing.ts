import { defineCard } from "../define.js";

export default defineCard({
  name: "Seal of Cleansing",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "Sacrifice this enchantment: Destroy target artifact or enchantment.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["artifact-or-enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "Sacrifice this enchantment: Destroy target artifact or enchantment.",
    },
  ],
});
