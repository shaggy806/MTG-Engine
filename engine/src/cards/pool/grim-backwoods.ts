import { defineCard } from "../define.js";

export default defineCard({
  name: "Grim Backwoods",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{2}{B}{G}, {T}, Sacrifice a creature: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}{B}{G}", tap: true, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}{B}{G}, {T}, Sacrifice a creature: Draw a card.",
    },
  ],
});
