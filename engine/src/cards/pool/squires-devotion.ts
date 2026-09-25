import { defineCard } from "../define.js";

export default defineCard({
  name: "Squire's Devotion",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +1/+1 and has lifelink.\nWhen this Aura enters, create a 1/1 white Vampire creature token with lifelink.",
  targets: ["creature"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Lifelink Vampire Token", count: 1 },
      resolve: null,
      text: "When this Aura enters, create a 1/1 white Vampire creature token with lifelink.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 1],
      grantKeywords: ["lifelink"],
      text: "Enchanted creature gets +1/+1 and has lifelink.",
    },
  ],
});
