import { defineCard } from "../define.js";

export default defineCard({
  name: "Seaside Haven",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{W}{U}, {T}, Sacrifice a Bird: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{W}{U}", tap: true, sacrifice: { filter: { subtype: "Bird" } } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{W}{U}, {T}, Sacrifice a Bird: Draw a card.",
    },
  ],
});
