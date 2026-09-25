import { defineCard } from "../define.js";

export default defineCard({
  name: "Crystal Quarry",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{5}, {T}: Add {W}{U}{B}{R}{G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{5}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["W", "U", "B", "R", "G"] }, amount: 1 },
      resolve: null,
      text: "{5}, {T}: Add {W}{U}{B}{R}{G}.",
    },
  ],
});
