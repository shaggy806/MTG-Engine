import { defineCard } from "../define.js";

export default defineCard({
  name: "Arcane Encyclopedia",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Book"],
  text: "{3}, {T}: Draw a card.",
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{3}, {T}: Draw a card.",
    },
  ],
});
