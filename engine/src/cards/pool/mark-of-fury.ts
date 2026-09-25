import { defineCard } from "../define.js";

export default defineCard({
  name: "Mark of Fury",
  manaCost: "{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature has haste.\nAt the beginning of the end step, return this Aura to its owner's hand.",
  targets: ["creature"],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "At the beginning of the end step, return this Aura to its owner's hand.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["haste"],
      text: "Enchanted creature has haste.",
    },
  ],
});
