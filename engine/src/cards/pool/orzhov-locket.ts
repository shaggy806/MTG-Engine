import { defineCard } from "../define.js";

export default defineCard({
  name: "Orzhov Locket",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {W} or {B}.\n{W/B}{W/B}{W/B}{W/B}, {T}, Sacrifice this artifact: Draw two cards.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "B"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {W} or {B}.",
    },
    {
      cost: { mana: "{W/B}{W/B}{W/B}{W/B}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{W/B}{W/B}{W/B}{W/B}, {T}, Sacrifice this artifact: Draw two cards.",
    },
  ],
});
