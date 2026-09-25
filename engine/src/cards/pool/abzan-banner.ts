import { defineCard } from "../define.js";

export default defineCard({
  name: "Abzan Banner",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {W}, {B}, or {G}.\n{W}{B}{G}, {T}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "B", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {W}, {B}, or {G}.",
    },
    {
      cost: { mana: "{W}{B}{G}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{W}{B}{G}, {T}, Sacrifice this artifact: Draw a card.",
    },
  ],
});
