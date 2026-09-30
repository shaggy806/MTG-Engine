import { defineCard } from "../define.js";

const TEXT = "Whenever an opponent discards a card, you may draw a card.";

export default defineCard({
  name: "Geth's Grimoire",
  manaCost: "{4}",
  types: ["artifact"],
  subtypes: ["Book"],
  text: TEXT,
  triggered: [
    {
      // Once per card discarded, not once per discard.
      trigger: { on: "discards", who: "opponent", perCard: true },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: TEXT,
    },
  ],
});
