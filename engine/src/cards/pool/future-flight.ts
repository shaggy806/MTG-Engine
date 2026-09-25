import { defineCard } from "../define.js";

export default defineCard({
  name: "Future Flight",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nWhen this Aura enters, draw two cards.\nEnchanted creature gets +2/+0 and has flying. (It can't be blocked except by creatures with flying or reach.)",
  targets: ["creature"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "When this Aura enters, draw two cards.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 0],
      grantKeywords: ["flying"],
      text: "Enchanted creature gets +2/+0 and has flying.",
    },
  ],
});
