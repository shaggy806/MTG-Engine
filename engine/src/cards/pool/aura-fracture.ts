import { defineCard } from "../define.js";

export default defineCard({
  name: "Aura Fracture",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "Sacrifice a land: Destroy target enchantment.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "land" } } },
      targets: ["enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "Sacrifice a land: Destroy target enchantment.",
    },
  ],
});
