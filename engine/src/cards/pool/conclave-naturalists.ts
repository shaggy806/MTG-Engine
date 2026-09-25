import { defineCard } from "../define.js";

export default defineCard({
  name: "Conclave Naturalists",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dryad"],
  power: 4,
  toughness: 4,
  text: "When this creature enters, you may destroy target artifact or enchantment.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["artifact-or-enchantment"],
      effect: {
        kind: "may",
        prompt: "Destroy target artifact or enchantment?",
        effect: { kind: "destroy", target: 0 },
      },
      resolve: null,
      text: "When this creature enters, you may destroy target artifact or enchantment.",
    },
  ],
});
