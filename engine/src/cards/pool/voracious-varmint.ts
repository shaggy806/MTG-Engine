import { defineCard } from "../define.js";

export default defineCard({
  name: "Voracious Varmint",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Varmint"],
  power: 2,
  toughness: 2,
  keywords: ["vigilance"],
  text: "Vigilance\n{1}, Sacrifice this creature: Destroy target artifact or enchantment.",
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
