import { defineCard } from "../define.js";

export default defineCard({
  name: "Ebon Stronghold",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {B}.\n{T}, Sacrifice this land: Add {B}{B}.",
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
      effect: { kind: "add-mana", mana: "B", amount: 2 },
      resolve: null,
      text: "{T}, Sacrifice this land: Add {B}{B}.",
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
