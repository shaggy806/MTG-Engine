import { defineCard } from "../define.js";

export default defineCard({
  name: "The Surgical Bay",
  colors: [],
  types: ["land"],
  subtypes: ["Sphere"],
  text: "This land enters tapped.\n{T}: Add {U}.\n{1}{U}, {T}, Sacrifice this land: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
    },
    {
      cost: { mana: "{1}{U}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{1}{U}, {T}, Sacrifice this land: Draw a card.",
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
