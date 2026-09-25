import { defineCard } from "../define.js";

export default defineCard({
  name: "Botanical Plaza",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {G} or {W}.\n{2}{G}{W}, {T}, Sacrifice this land: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {G} or {W}.",
    },
    {
      cost: { mana: "{2}{G}{W}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}{G}{W}, {T}, Sacrifice this land: Draw a card.",
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
