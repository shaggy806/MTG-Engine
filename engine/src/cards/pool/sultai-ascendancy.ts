import { defineCard } from "../define.js";

export default defineCard({
  name: "Sultai Ascendancy",
  manaCost: "{B}{G}{U}",
  colors: ["U", "B", "G"],
  types: ["enchantment"],
  text: "At the beginning of your upkeep, surveil 2. (Look at the top two cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "surveil", amount: 2 },
      resolve: null,
      text: "At the beginning of your upkeep, surveil 2.",
    },
  ],
});
