import { defineCard } from "../define.js";

export default defineCard({
  name: "Simic Cluestone",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {G} or {U}.\n{G}{U}, {T}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "U"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {G} or {U}.",
    },
    {
      cost: { mana: "{G}{U}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{G}{U}, {T}, Sacrifice this artifact: Draw a card.",
    },
  ],
});
