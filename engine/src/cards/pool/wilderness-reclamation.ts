import { defineCard } from "../define.js";

const TEXT = "At the beginning of your end step, untap all lands you control.";

export default defineCard({
  name: "Wilderness Reclamation",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: { kind: "untap-all", filter: { type: "land", controlledBy: "you" } },
      resolve: null,
      text: TEXT,
    },
  ],
});
