import { defineCard } from "../define.js";

export default defineCard({
  name: "Memorial to Genius",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {U}.\n{4}{U}, {T}, Sacrifice this land: Draw two cards.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
    },
    {
      cost: { mana: "{4}{U}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{4}{U}, {T}, Sacrifice this land: Draw two cards.",
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
