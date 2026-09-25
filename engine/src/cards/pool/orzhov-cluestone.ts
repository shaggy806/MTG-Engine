import { defineCard } from "../define.js";

export default defineCard({
  name: "Orzhov Cluestone",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {W} or {B}.\n{W}{B}, {T}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "B"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {W} or {B}.",
    },
    {
      cost: { mana: "{W}{B}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{W}{B}, {T}, Sacrifice this artifact: Draw a card.",
    },
  ],
});
