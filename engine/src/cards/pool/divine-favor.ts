import { defineCard } from "../define.js";

export default defineCard({
  name: "Divine Favor",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nWhen this Aura enters, you gain 3 life.\nEnchanted creature gets +1/+3.",
  targets: ["creature"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "When this Aura enters, you gain 3 life.",
    },
  ],
  static: [{ affects: { scope: "attached" }, grantPt: [1, 3], text: "Enchanted creature gets +1/+3." }],
});
