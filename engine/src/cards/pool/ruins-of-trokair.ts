import { defineCard } from "../define.js";

export default defineCard({
  name: "Ruins of Trokair",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {W}.\n{T}, Sacrifice this land: Add {W}{W}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: "{T}: Add {W}.",
    },
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 2 },
      resolve: null,
      text: "{T}, Sacrifice this land: Add {W}{W}.",
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
