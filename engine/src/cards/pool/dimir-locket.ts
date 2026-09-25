import { defineCard } from "../define.js";

export default defineCard({
  name: "Dimir Locket",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {U} or {B}.\n{U/B}{U/B}{U/B}{U/B}, {T}, Sacrifice this artifact: Draw two cards.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "B"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {U} or {B}.",
    },
    {
      cost: { mana: "{U/B}{U/B}{U/B}{U/B}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{U/B}{U/B}{U/B}{U/B}, {T}, Sacrifice this artifact: Draw two cards.",
    },
  ],
});
