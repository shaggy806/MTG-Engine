import { defineCard } from "../define.js";

export default defineCard({
  name: "Izzet Locket",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {U} or {R}.\n{U/R}{U/R}{U/R}{U/R}, {T}, Sacrifice this artifact: Draw two cards.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "R"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {U} or {R}.",
    },
    {
      cost: { mana: "{U/R}{U/R}{U/R}{U/R}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{U/R}{U/R}{U/R}{U/R}, {T}, Sacrifice this artifact: Draw two cards.",
    },
  ],
});
