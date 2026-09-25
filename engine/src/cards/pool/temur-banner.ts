import { defineCard } from "../define.js";

export default defineCard({
  name: "Temur Banner",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {G}, {U}, or {R}.\n{G}{U}{R}, {T}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "U", "R"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {G}, {U}, or {R}.",
    },
    {
      cost: { mana: "{G}{U}{R}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{G}{U}{R}, {T}, Sacrifice this artifact: Draw a card.",
    },
  ],
});
