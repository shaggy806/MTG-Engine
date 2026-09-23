import { defineCard } from "../define.js";

export default defineCard({
  name: "Sanguine Bond",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "Whenever you gain life, target opponent loses that much life.",
  triggered: [
    {
      // Once per life-gain event: a lifelinker's damage to several things at
      // once is one event (2023-09-01 ruling).
      trigger: { on: "gains-life", who: "you" },
      targets: ["opponent"],
      effect: { kind: "lose-life", target: 0, amount: { triggerValue: true } },
      resolve: null,
      text: "Whenever you gain life, target opponent loses that much life.",
    },
  ],
});
