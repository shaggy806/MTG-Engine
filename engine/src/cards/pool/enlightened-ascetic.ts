import { defineCard } from "../define.js";

export default defineCard({
  name: "Enlightened Ascetic",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Monk"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, you may destroy target enchantment.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["enchantment"],
      effect: {
        kind: "may",
        prompt: "Destroy target enchantment?",
        effect: { kind: "destroy", target: 0 },
      },
      resolve: null,
      text: "When this creature enters, you may destroy target enchantment.",
    },
  ],
});
