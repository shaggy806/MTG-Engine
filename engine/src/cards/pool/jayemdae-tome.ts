import { defineCard } from "../define.js";

export default defineCard({
  name: "Jayemdae Tome",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Book"],
  text: "{4}, {T}: Draw a card.",
  activated: [
    {
      cost: { mana: "{4}", tap: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{4}, {T}: Draw a card.",
    },
  ],
});
