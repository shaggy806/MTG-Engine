import { defineCard } from "../define.js";

export default defineCard({
  name: "Racers' Ring",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {R} or {G}.\n{2}{R}{G}, {T}, Sacrifice this land: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {R} or {G}.",
    },
    {
      cost: { mana: "{2}{R}{G}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}{R}{G}, {T}, Sacrifice this land: Draw a card.",
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
