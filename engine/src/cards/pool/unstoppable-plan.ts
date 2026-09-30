import { defineCard } from "../define.js";

const TEXT = "At the beginning of your end step, untap all nonland permanents you control.";

export default defineCard({
  name: "Unstoppable Plan",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: { kind: "untap-all", filter: { notTypes: ["land"], controlledBy: "you" } },
      resolve: null,
      text: TEXT,
    },
  ],
});
