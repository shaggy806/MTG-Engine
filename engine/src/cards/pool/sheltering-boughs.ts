import { defineCard } from "../define.js";

export default defineCard({
  name: "Sheltering Boughs",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nWhen this Aura enters, draw a card.\nEnchanted creature gets +1/+3.",
  targets: ["creature"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When this Aura enters, draw a card.",
    },
  ],
  static: [{ affects: { scope: "attached" }, grantPt: [1, 3], text: "Enchanted creature gets +1/+3." }],
});
