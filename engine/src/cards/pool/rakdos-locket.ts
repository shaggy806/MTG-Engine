import { defineCard } from "../define.js";

export default defineCard({
  name: "Rakdos Locket",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {B} or {R}.\n{B/R}{B/R}{B/R}{B/R}, {T}, Sacrifice this artifact: Draw two cards.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "R"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {B} or {R}.",
    },
    {
      cost: { mana: "{B/R}{B/R}{B/R}{B/R}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{B/R}{B/R}{B/R}{B/R}, {T}, Sacrifice this artifact: Draw two cards.",
    },
  ],
});
