import { defineCard } from "../define.js";

export default defineCard({
  name: "Havenwood Battleground",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {G}.\n{T}, Sacrifice this land: Add {G}{G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 2 },
      resolve: null,
      text: "{T}, Sacrifice this land: Add {G}{G}.",
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
