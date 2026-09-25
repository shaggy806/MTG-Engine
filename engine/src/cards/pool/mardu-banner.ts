import { defineCard } from "../define.js";

export default defineCard({
  name: "Mardu Banner",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {R}, {W}, or {B}.\n{R}{W}{B}, {T}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "W", "B"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {R}, {W}, or {B}.",
    },
    {
      cost: { mana: "{R}{W}{B}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{R}{W}{B}, {T}, Sacrifice this artifact: Draw a card.",
    },
  ],
});
