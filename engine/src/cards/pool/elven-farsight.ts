import { defineCard } from "../define.js";

// EDHREC rank 5815.

export default defineCard({
  name: "Elven Farsight",
  manaCost: "{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Scry 3, then you may reveal the top card of your library. If a creature card is revealed this way, draw a card.",
  // Thrasios, Triton Hero's shape: scry, then (here optionally) reveal the
  // top card as target 0, and draw only if a creature card was revealed —
  // an empty library reveals nothing, so nothing is drawn.
  effect: {
    kind: "scry",
    amount: 3,
    then: {
      kind: "may",
      prompt: "Reveal the top card of your library?",
      effect: {
        kind: "reveal-top",
        then: {
          kind: "conditional",
          condition: { kind: "target", index: 0, filter: { type: "creature" } },
          then: { kind: "draw", amount: 1 },
        },
      },
    },
  },
});
