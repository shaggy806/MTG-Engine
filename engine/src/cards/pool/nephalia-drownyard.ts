import { defineCard } from "../define.js";

export default defineCard({
  name: "Nephalia Drownyard",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{1}{U}{B}, {T}: Target player mills three cards.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{1}{U}{B}", tap: true },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 3 },
      resolve: null,
      text: "{1}{U}{B}, {T}: Target player mills three cards.",
    },
  ],
});
