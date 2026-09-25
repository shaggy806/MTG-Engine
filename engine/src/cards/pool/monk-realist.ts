import { defineCard } from "../define.js";

export default defineCard({
  name: "Monk Realist",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Monk", "Cleric"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, destroy target enchantment.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this creature enters, destroy target enchantment.",
    },
  ],
});
