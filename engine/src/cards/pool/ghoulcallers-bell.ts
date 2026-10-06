import { defineCard } from "../define.js";

// EDHREC rank 6542.

const TEXT = "{T}: Each player mills a card.";

export default defineCard({
  name: "Ghoulcaller's Bell",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "mill", target: "each-player", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
