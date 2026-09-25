import { defineCard } from "../define.js";

export default defineCard({
  name: "Dwarven Ruins",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {R}.\n{T}, Sacrifice this land: Add {R}{R}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 2 },
      resolve: null,
      text: "{T}, Sacrifice this land: Add {R}{R}.",
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
