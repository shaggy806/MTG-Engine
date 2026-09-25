import { defineCard } from "../define.js";

export default defineCard({
  name: "Gruul Cluestone",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {R} or {G}.\n{R}{G}, {T}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {R} or {G}.",
    },
    {
      cost: { mana: "{R}{G}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{R}{G}, {T}, Sacrifice this artifact: Draw a card.",
    },
  ],
});
