import { defineCard } from "../define.js";

// EDHREC rank 2587.

const TEXT = "Whenever an opponent discards a card, this enchantment deals 2 damage to that player.";

export default defineCard({
  name: "Megrim",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: TEXT,
  // Liliana's Caress's trigger: once per card, "that player" the discarding
  // player (the controller of the discarded card).
  triggered: [
    {
      trigger: { on: "discards", who: "opponent", perCard: true },
      targets: [],
      effect: { kind: "damage", amount: 2, who: "trigger-controller" },
      resolve: null,
      text: TEXT,
    },
  ],
});
