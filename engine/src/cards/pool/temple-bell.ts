import { defineCard } from "../define.js";

export default defineCard({
  name: "Temple Bell",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Each player draws a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "each-player" },
      resolve: null,
      text: "{T}: Each player draws a card.",
    },
  ],
});
