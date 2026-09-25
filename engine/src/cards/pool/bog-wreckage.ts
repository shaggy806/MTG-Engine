import { defineCard } from "../define.js";

export default defineCard({
  name: "Bog Wreckage",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {B}.\n{T}, Sacrifice this land: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{T}: Add {B}.",
    },
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}, Sacrifice this land: Add one mana of any color.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
