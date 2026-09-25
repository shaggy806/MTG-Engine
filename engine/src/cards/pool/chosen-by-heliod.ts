import { defineCard } from "../define.js";

export default defineCard({
  name: "Chosen by Heliod",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nWhen this Aura enters, draw a card.\nEnchanted creature gets +0/+2.",
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
  static: [{ affects: { scope: "attached" }, grantPt: [0, 2], text: "Enchanted creature gets +0/+2." }],
});
