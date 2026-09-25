import { defineCard } from "../define.js";

export default defineCard({
  name: "Izzet Cluestone",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {U} or {R}.\n{U}{R}, {T}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "R"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {U} or {R}.",
    },
    {
      cost: { mana: "{U}{R}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{U}{R}, {T}, Sacrifice this artifact: Draw a card.",
    },
  ],
});
