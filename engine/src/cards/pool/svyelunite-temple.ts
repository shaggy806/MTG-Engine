import { defineCard } from "../define.js";

export default defineCard({
  name: "Svyelunite Temple",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {U}.\n{T}, Sacrifice this land: Add {U}{U}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
    },
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 2 },
      resolve: null,
      text: "{T}, Sacrifice this land: Add {U}{U}.",
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
