import { defineCard } from "../define.js";

export default defineCard({
  name: "The Autonomous Furnace",
  colors: [],
  types: ["land"],
  subtypes: ["Sphere"],
  text: "This land enters tapped.\n{T}: Add {R}.\n{1}{R}, {T}, Sacrifice this land: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
    {
      cost: { mana: "{1}{R}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{1}{R}, {T}, Sacrifice this land: Draw a card.",
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
