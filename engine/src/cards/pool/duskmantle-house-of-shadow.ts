import { defineCard } from "../define.js";

export default defineCard({
  name: "Duskmantle, House of Shadow",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{U}{B}, {T}: Target player mills a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{U}{B}", tap: true },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 1 },
      resolve: null,
      text: "{U}{B}, {T}: Target player mills a card.",
    },
  ],
});
