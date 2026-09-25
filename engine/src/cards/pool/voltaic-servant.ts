import { defineCard } from "../define.js";

export default defineCard({
  name: "Voltaic Servant",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 1,
  toughness: 3,
  text: "At the beginning of your end step, untap target artifact.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: ["artifact"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "At the beginning of your end step, untap target artifact.",
    },
  ],
});
