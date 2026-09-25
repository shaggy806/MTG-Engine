import { defineCard } from "../define.js";

export default defineCard({
  name: "Aspect of Lamprey",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature you control\nWhen this Aura enters, target opponent discards two cards.\nEnchanted creature has lifelink.",
  targets: ["creature-you-control"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["opponent"],
      effect: { kind: "discard", target: 0, amount: 2 },
      resolve: null,
      text: "When this Aura enters, target opponent discards two cards.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["lifelink"],
      text: "Enchanted creature has lifelink.",
    },
  ],
});
