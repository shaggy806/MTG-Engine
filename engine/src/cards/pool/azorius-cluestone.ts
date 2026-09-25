import { defineCard } from "../define.js";

export default defineCard({
  name: "Azorius Cluestone",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {W} or {U}.\n{W}{U}, {T}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "U"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {W} or {U}.",
    },
    {
      cost: { mana: "{W}{U}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{W}{U}, {T}, Sacrifice this artifact: Draw a card.",
    },
  ],
});
