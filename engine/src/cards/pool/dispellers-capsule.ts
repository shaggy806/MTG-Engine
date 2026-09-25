import { defineCard } from "../define.js";

export default defineCard({
  name: "Dispeller's Capsule",
  manaCost: "{W}",
  colors: ["W"],
  types: ["artifact"],
  text: "{2}{W}, {T}, Sacrifice this artifact: Destroy target artifact or enchantment.",
  activated: [
    {
      cost: { mana: "{2}{W}", tap: true, sacrifice: "self" },
      targets: ["artifact-or-enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{2}{W}, {T}, Sacrifice this artifact: Destroy target artifact or enchantment.",
    },
  ],
});
