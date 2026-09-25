import { defineCard } from "../define.js";

export default defineCard({
  name: "Book of Rass",
  manaCost: "{6}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Book"],
  text: "{2}, Pay 2 life: Draw a card.",
  activated: [
    {
      cost: { mana: "{2}", tap: false, payLife: 2 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}, Pay 2 life: Draw a card.",
    },
  ],
});
