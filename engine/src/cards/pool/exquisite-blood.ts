import { defineCard } from "../define.js";

export default defineCard({
  name: "Exquisite Blood",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "Whenever an opponent loses life, you gain that much life.",
  triggered: [
    {
      trigger: { on: "loses-life", who: "opponent" },
      targets: [],
      effect: { kind: "gain-life", amount: { triggerValue: true } },
      resolve: null,
      text: "Whenever an opponent loses life, you gain that much life.",
    },
  ],
});
