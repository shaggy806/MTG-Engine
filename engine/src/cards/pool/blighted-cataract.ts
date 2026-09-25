import { defineCard } from "../define.js";

export default defineCard({
  name: "Blighted Cataract",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{5}{U}, {T}, Sacrifice this land: Draw two cards.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{5}{U}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{5}{U}, {T}, Sacrifice this land: Draw two cards.",
    },
  ],
});
