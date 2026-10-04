import { defineCard } from "../define.js";

// EDHREC rank 2411. Once per card discarded (the ruling); "that player" is the
// discarded card's owner, who is who discarded it.
const TEXT = "Whenever an opponent discards a card, that player loses 2 life.";

export default defineCard({
  name: "Liliana's Caress",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "discards", who: "opponent", perCard: true },
      targets: [],
      effect: { kind: "lose-life", amount: 2, who: "trigger-controller" },
      resolve: null,
      text: TEXT,
    },
  ],
});
