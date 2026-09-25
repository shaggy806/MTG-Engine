import { defineCard } from "../define.js";

export default defineCard({
  name: "Knightly Valor",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nWhen this Aura enters, create a 2/2 white Knight creature token with vigilance. (Attacking doesn't cause it to tap.)\nEnchanted creature gets +2/+2 and has vigilance.",
  targets: ["creature"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Knight Token", count: 1 },
      resolve: null,
      text: "When this Aura enters, create a 2/2 white Knight creature token with vigilance.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      grantKeywords: ["vigilance"],
      text: "Enchanted creature gets +2/+2 and has vigilance.",
    },
  ],
});
