import { defineCard } from "../define.js";

export default defineCard({
  name: "Boros Cluestone",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {R} or {W}.\n{R}{W}, {T}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {R} or {W}.",
    },
    {
      cost: { mana: "{R}{W}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{R}{W}, {T}, Sacrifice this artifact: Draw a card.",
    },
  ],
});
