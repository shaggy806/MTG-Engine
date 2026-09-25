import { defineCard } from "../define.js";

export default defineCard({
  name: "Waterfront District",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {U} or {B}.\n{2}{U}{B}, {T}, Sacrifice this land: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "B"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {U} or {B}.",
    },
    {
      cost: { mana: "{2}{U}{B}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}{U}{B}, {T}, Sacrifice this land: Draw a card.",
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
