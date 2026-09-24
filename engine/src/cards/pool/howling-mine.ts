import { defineCard } from "../define.js";

// "If this artifact is untapped" is an intervening-if (rule 603.4): checked as
// the draw step begins and again as the ability resolves.
export default defineCard({
  name: "Howling Mine",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text:
    "At the beginning of each player's draw step, if this artifact is untapped, that player draws an additional card.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "draw", who: "any" },
      condition: { kind: "source", filter: { tapped: false } },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "active-player" },
      resolve: null,
      text:
        "At the beginning of each player's draw step, if this artifact is untapped, that player draws an additional card.",
    },
  ],
});
