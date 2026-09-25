import { defineCard } from "../define.js";

export default defineCard({
  name: "Rakdos Cluestone",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {B} or {R}.\n{B}{R}, {T}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "R"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {B} or {R}.",
    },
    {
      cost: { mana: "{B}{R}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{B}{R}, {T}, Sacrifice this artifact: Draw a card.",
    },
  ],
});
