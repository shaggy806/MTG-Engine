import { defineCard } from "../define.js";

const TEXT = "At the beginning of each player's draw step, that player draws two additional cards.";

export default defineCard({
  name: "Font of Mythos",
  manaCost: "{4}",
  types: ["artifact"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "draw", who: "any" },
      targets: [],
      effect: { kind: "draw", amount: 2, who: "active-player" },
      resolve: null,
      text: TEXT,
    },
  ],
});
