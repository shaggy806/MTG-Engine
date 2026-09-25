import { defineCard } from "../define.js";

export default defineCard({
  name: "Glaring Aegis",
  manaCost: "{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nWhen this Aura enters, tap target creature an opponent controls.\nEnchanted creature gets +1/+3.",
  targets: ["creature"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "When this Aura enters, tap target creature an opponent controls.",
    },
  ],
  static: [{ affects: { scope: "attached" }, grantPt: [1, 3], text: "Enchanted creature gets +1/+3." }],
});
